export type ScanPayloadType = 'item' | 'location' | 'unknown';

export interface ScanPayload {
  type: ScanPayloadType;
  /**
   * Optional entity identifier. For some label formats this may be a UUID, for others it may be the human code.
   */
  id?: string;
  /**
   * Best-effort “code” value suitable for lookups by item_code / location.code.
   * Always present (may be empty string if input is empty).
   */
  code: string;
  /** Raw scanned string (trimmed). */
  raw: string;
  /** Optional payload version field (if present). */
  v?: number;
}

// Broad UUID matcher (not limited to v4) — used for DB lookups.
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(str: string): boolean {
  return UUID_REGEX.test(str.trim());
}

function pickString(obj: unknown, keys: string[]): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const anyObj = obj as Record<string, unknown>;
  for (const key of keys) {
    const v = anyObj[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return undefined;
}

/**
 * Parse a scanned barcode/QR string into a normalized payload.
 *
 * Supports:
 * - JSON payloads (current + legacy variants)
 * - Deep links (e.g. /inventory/:id, /locations/:id, /scan/item/:codeOrId)
 * - Raw codes (fallback)
 *
 * Important: This parser is intentionally permissive. It must not return null/undefined,
 * because scanners often produce JSON-ish payloads that may omit fields (e.g. code-only).
 */
export function parseScanPayload(input: string): ScanPayload {
  const raw = (input ?? '').trim();
  if (!raw) return { type: 'unknown', raw: '', code: '' };

  // 1) Deep-link / route detection (supports full URLs and plain paths)
  // Examples:
  // - https://app.example.com/inventory/<uuid>
  // - /locations/<uuid>
  // - /scan/item/<codeOrId>
  const pathCandidate = (() => {
    // Full URL?
    if (/^https?:\/\//i.test(raw)) {
      try {
        return new URL(raw).pathname;
      } catch {
        return raw;
      }
    }
    // Path-like (starts with /)
    if (raw.startsWith('/')) return raw;
    return null;
  })();

  if (pathCandidate) {
    const scanItemMatch = pathCandidate.match(/\/scan\/item\/([^/]+)$/i);
    if (scanItemMatch) {
      const codeOrId = decodeURIComponent(scanItemMatch[1]);
      return { type: 'item', raw, id: isUuid(codeOrId) ? codeOrId : undefined, code: codeOrId };
    }

    const invMatch = pathCandidate.match(/\/inventory\/([^/]+)$/i);
    if (invMatch) {
      const id = decodeURIComponent(invMatch[1]);
      return { type: 'item', raw, id, code: id };
    }

    const locMatch = pathCandidate.match(/\/locations\/([^/]+)$/i);
    if (locMatch) {
      const id = decodeURIComponent(locMatch[1]);
      return { type: 'location', raw, id, code: id };
    }
  }

  // 2) JSON payloads (current + legacy)
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object') {
      const typeRaw = pickString(parsed, ['type']);
      const type: ScanPayloadType =
        typeRaw === 'item' ? 'item' : typeRaw === 'location' ? 'location' : 'unknown';

      const id = pickString(parsed, ['id', 'itemId', 'locationId', 'item_id', 'location_id']);
      const code =
        pickString(parsed, ['code', 'itemCode', 'locationCode', 'item_code', 'location_code']) ||
        // Some legacy location label formats put the location code in `id` only.
        (type === 'location' ? id : undefined);

      const vNum = (parsed as any).v;
      const v = typeof vNum === 'number' ? vNum : undefined;

      // If we got ANY useful fields, return them; otherwise fall through to raw handling.
      if (type !== 'unknown' || id || code) {
        return {
          type,
          raw,
          id: id || undefined,
          code: (code || id || raw).trim(),
          v,
        };
      }
    }
  } catch {
    // ignore
  }

  // 3) Prefix normalization (common for 1D barcode labelers)
  // Examples: "LOC:A1-01", "LOCATION A1-01", "ITEM:IC123"
  const prefixed = raw.match(/^(item|location|loc|bay|bin)\s*[:\-\s]\s*(.+)$/i);
  if (prefixed) {
    const prefix = prefixed[1].toLowerCase();
    const remainder = prefixed[2].trim();
    const type: ScanPayloadType =
      prefix === 'item' ? 'item' : (prefix === 'location' || prefix === 'loc' || prefix === 'bay' || prefix === 'bin') ? 'location' : 'unknown';
    return { type, raw, id: undefined, code: remainder };
  }

  // 4) Raw code fallback
  return { type: 'unknown', raw, code: raw };
}

/**
 * Returns a UUID candidate for DB ID lookups when the scan payload contains an explicit ID of
 * the expected type, or when the scan was a raw UUID (payload.type === 'unknown').
 */
export function extractIdCandidate(payload: ScanPayload, expectedType: 'item' | 'location'): string | null {
  return payload.type === expectedType && payload.id && isUuid(payload.id)
    ? payload.id
    : payload.type === 'unknown' && isUuid(payload.code)
      ? payload.code
      : null;
}

