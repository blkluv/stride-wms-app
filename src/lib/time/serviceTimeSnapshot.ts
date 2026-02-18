/**
 * serviceTimeSnapshot.ts
 *
 * Helpers for storing an "Estimated Service Time" snapshot on a job record.
 * We snapshot on completion so historical reports aren't affected by later
 * Price List changes.
 */

import type { Json } from '@/integrations/supabase/types';

export type ServiceTimeSnapshotV1 = {
  estimated_minutes: number;
  estimated_snapshot_at: string; // ISO timestamp
  estimated_source: 'service_lines' | 'billing_preview' | 'unknown';
  estimated_version: 1;
  // Optional: only used when service lines exist (kept small)
  estimated_breakdown?: Array<{
    charge_code: string;
    unit: string;
    service_time_minutes: number;
    quantity: number;
    estimated_minutes: number;
  }>;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function mergeServiceTimeSnapshot(
  metadata: Json | null | undefined,
  snapshot: ServiceTimeSnapshotV1,
): Json {
  const metaObj: Record<string, unknown> = isPlainObject(metadata) ? { ...(metadata as any) } : {};
  const existingServiceTime: Record<string, unknown> = isPlainObject(metaObj.service_time)
    ? { ...(metaObj.service_time as any) }
    : {};

  return {
    ...metaObj,
    service_time: {
      ...existingServiceTime,
      ...snapshot,
    },
  } as unknown as Json;
}

