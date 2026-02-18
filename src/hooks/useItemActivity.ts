/**
 * useItemActivity - Reads item_activity rows for a given item.
 * Newest-first ordering. Filtering is done client-side in the UI so we can:
 * - support multi-select filters
 * - avoid accidentally hiding new/unmapped event types
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ItemActivity {
  id: string;
  tenant_id: string;
  item_id: string;
  actor_user_id: string | null;
  actor_name: string | null;
  event_type: string;
  event_label: string;
  details: Record<string, unknown>;
  created_at: string;
}

export function useItemActivity(
  itemId: string | undefined,
  options?: { limit?: number }
) {
  const { profile } = useAuth();
  const [activities, setActivities] = useState<ItemActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const limit = options?.limit ?? 300;

  const fetchActivities = useCallback(async () => {
    if (!itemId) return;

    setLoading(true);
    try {
      const query = (supabase.from('item_activity') as any)
        .select('*')
        .eq('item_id', itemId)
        .order('created_at', { ascending: false })
        .limit(limit);

      const { data, error } = await query;

      if (error) {
        if (error.code !== '42P01') {
          console.error('[useItemActivity] Error:', error);
        }
        setActivities([]);
        return;
      }

      const base: ItemActivity[] = (data || []) as ItemActivity[];

      // -------------------------------------------------------------------
      // Derived events (best-effort) for legacy data that predates item_activity
      // logging. This prevents regressions when removing the old History tab.
      // -------------------------------------------------------------------
      const tenantId = profile?.tenant_id || base[0]?.tenant_id || '';

      const derived: ItemActivity[] = [];

      // A) Shipment associations (shipment_items)
      try {
        const loggedShipmentIds = new Set<string>(
          base
            .filter((a) => a.event_type.startsWith('item_shipment_'))
            .map((a) => (a.details as any)?.shipment_id)
            .filter((v): v is string => typeof v === 'string' && v.length > 0)
        );

        const { data: shipmentItems, error: siError } = await (supabase.from('shipment_items') as any)
          .select(`
            id,
            created_at,
            shipments:shipment_id(id, shipment_number, shipment_type, status, inbound_kind, received_at)
          `)
          .eq('item_id', itemId);

        if (!siError && shipmentItems) {
          for (const si of shipmentItems as any[]) {
            const s = si.shipments;
            if (!s?.id || loggedShipmentIds.has(s.id)) continue;
            derived.push({
              id: `derived-shipment-${si.id}`,
              tenant_id: tenantId,
              item_id: itemId,
              actor_user_id: null,
              actor_name: null,
              event_type: 'item_shipment_linked',
              event_label: `Linked to shipment ${s.shipment_number || 'SHP'}`,
              details: {
                shipment_id: s.id,
                shipment_number: s.shipment_number,
                shipment_type: s.shipment_type,
                shipment_status: s.status,
                inbound_kind: s.inbound_kind || null,
              },
              created_at: s.received_at || si.created_at,
            });
          }
        }
      } catch {
        // ignore
      }

      // B) Repair quotes (repair_quotes)
      try {
        const loggedQuoteIds = new Set<string>(
          base
            .filter((a) => a.event_type.startsWith('item_repair_quote_'))
            .map((a) => (a.details as any)?.repair_quote_id)
            .filter((v): v is string => typeof v === 'string' && v.length > 0)
        );

        const { data: quotes, error: rqError } = await (supabase.from('repair_quotes') as any)
          .select('id, approval_status, flat_rate, created_at, approved_at')
          .eq('item_id', itemId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (!rqError && quotes) {
          for (const q of quotes as any[]) {
            if (!q?.id || loggedQuoteIds.has(q.id)) continue;
            const amount = q.flat_rate != null ? Number(q.flat_rate) : null;

            derived.push({
              id: `derived-repair-created-${q.id}`,
              tenant_id: tenantId,
              item_id: itemId,
              actor_user_id: null,
              actor_name: null,
              event_type: 'item_repair_quote_created',
              event_label: `Repair quote created${amount != null ? ` ($${amount.toFixed(2)})` : ''}`,
              details: { repair_quote_id: q.id, flat_rate: amount, approval_status: q.approval_status || null },
              created_at: q.created_at,
            });

            if (q.approval_status === 'approved' && q.approved_at) {
              derived.push({
                id: `derived-repair-approved-${q.id}`,
                tenant_id: tenantId,
                item_id: itemId,
                actor_user_id: null,
                actor_name: null,
                event_type: 'item_repair_quote_approved',
                event_label: `Repair quote approved${amount != null ? ` ($${amount.toFixed(2)})` : ''}`,
                details: { repair_quote_id: q.id, flat_rate: amount, approval_status: 'approved' },
                created_at: q.approved_at,
              });
            }

            if (q.approval_status === 'declined' && q.approved_at) {
              derived.push({
                id: `derived-repair-declined-${q.id}`,
                tenant_id: tenantId,
                item_id: itemId,
                actor_user_id: null,
                actor_name: null,
                event_type: 'item_repair_quote_declined',
                event_label: `Repair quote declined${amount != null ? ` ($${amount.toFixed(2)})` : ''}`,
                details: { repair_quote_id: q.id, flat_rate: amount, approval_status: 'declined' },
                created_at: q.approved_at,
              });
            }
          }
        }
      } catch {
        // ignore
      }

      const merged = [...base, ...derived];
      merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setActivities(merged);
    } catch (err) {
      console.error('[useItemActivity] Unexpected error:', err);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [itemId, limit, profile?.tenant_id]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return {
    activities,
    loading,
    refetch: fetchActivities,
  };
}
