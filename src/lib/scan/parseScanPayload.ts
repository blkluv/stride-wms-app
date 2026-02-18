export type ScanEntityType = 'item' | 'location' | 'container' | 'unknown';

export interface ParsedScanPayload {
  /**
   * High-level identity hint (best-effort).
   * - For Stride-generated labels this comes from the JSON payload `type`.
   * - For deep links it is inferred from the URL path.
   * - Otherwise `unknown`.
   */
  type: ScanEntityType | string;
  /** Usually a UUID for DB entities, but may be a code for legacy labels. */
  id?: string;
  /** Human-readable code (item_code, location.code, container_code), best-effort. */
  code?: string;
  /** Original trimmed scan value. */
  raw: string;
  source: 'json' | 'url' | 'raw';
  /** Optional schema version when present in JSON payload. */
  v?: number;
}

function safeTrim(input: string): string {
  // Some scanners append CR/LF or other whitespace; trim is sufficient and safe.
  return (input ?? '').trim();
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function tryParseUrl(raw: string): URL | null {
  try {
    return new URL(raw);
  } catch {
    // Handle relative paths like "/scan/item/..." in-browser.
    try {
      if (typeof window !== 'undefined' && window.location?.origin) {
        return new URL(raw, window.location.origin);
      }
    } catch {
      // ignore
    }
    return null;
  }
}

function parseFromUrl(raw: string): ParsedScanPayload | null {
  const url = tryParseUrl(raw);
  if (!url) return null;

  const segments = url.pathname.split('/').filter(Boolean).map((s) => decodeURIComponent(s));

  // Supported patterns:
  // - /scan/item/:codeOrId
  // - /scan/location/:codeOrId
  // - /inventory/:id
  // - /locations/:id
  // - /containers/:id
  if (segments.length >= 3 && segments[0] === 'scan') {
    const entity = segments[1];
    const codeOrId = segments[2];
    if (entity === 'item' || entity === 'location' || entity === 'container') {
      return {
        type: entity,
        id: codeOrId,
        code: codeOrId,
        raw,
        source: 'url',
      };
    }
  }

  if (segments.length >= 2) {
    const [first, second] = segments;
    if (first === 'inventory') {
      return { type: 'item', id: second, code: second, raw, source: 'url' };
    }
    if (first === 'locations') {
      return { type: 'location', id: second, code: second, raw, source: 'url' };
    }
    if (first === 'containers') {
      return { type: 'container', id: second, code: second, raw, source: 'url' };
    }
  }

  return null;
}

/**
 * Parse a scanner/QR payload into a normalized structure.
 *
 * Key behavior:
 * - We ONLY JSON.parse values that *look* like JSON objects/arrays/strings.
 *   This avoids a common footgun where numeric codes like "12345" are valid
 *   JSON primitives and would otherwise parse to a number, causing the caller
 *   to treat the scan as "unparseable" and skip DB lookup entirely.
 * - Legacy/partial payloads are tolerated (ex: location payload with `{type, id}`
 *   but missing `code`); we will fall back to `id` as `code` for location/container.
 */
export function parseScanPayload(input: string): ParsedScanPayload | null {
  const raw = safeTrim(input);
  if (!raw) return null;

  // URL/deeplink first (fast path, and avoids JSON parse attempts on URLs)
  if (/^(https?:\/\/|stride:|app:|\/)/i.test(raw)) {
    const fromUrl = parseFromUrl(raw);
    if (fromUrl) return fromUrl;
  }

  const firstChar = raw[0];
  const looksLikeJson = firstChar === '{' || firstChar === '[' || firstChar === '"';

  if (looksLikeJson) {
    try {
      const parsed = JSON.parse(raw) as unknown;

      // JSON string payload: treat as a raw code (unwrapped)
      if (typeof parsed === 'string') {
        const unwrapped = safeTrim(parsed);
        return {
          type: 'unknown',
          id: '',
          code: unwrapped || raw,
          raw,
          source: 'json',
        };
      }

      // JSON object payload (Stride labels)
      if (isPlainObject(parsed)) {
        const type = typeof parsed.type === 'string' ? parsed.type : 'unknown';
        const id = typeof parsed.id === 'string' ? parsed.id : undefined;

        const code =
          (typeof parsed.code === 'string' ? parsed.code : undefined) ??
          (typeof parsed.item_code === 'string' ? parsed.item_code : undefined) ??
          (typeof parsed.location_code === 'string' ? parsed.location_code : undefined) ??
          (typeof parsed.container_code === 'string' ? parsed.container_code : undefined);

        const v = typeof parsed.v === 'number' ? parsed.v : undefined;

        // Legacy labels sometimes used {type:'location', id:'A1-01'} with no `code`.
        const codeFallback =
          code ??
          ((type === 'location' || type === 'container') && typeof id === 'string' ? id : undefined);

        return {
          type,
          id,
          code: codeFallback,
          raw,
          source: 'json',
          v,
        };
      }
    } catch {
      // Not actually JSON; fall through to raw handling.
    }
  }

  // Default: raw code
  return {
    type: 'unknown',
    id: '',
    code: raw,
    raw,
    source: 'raw',
  };
}

