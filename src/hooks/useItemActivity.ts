/**
 * useItemActivity - Unified activity timeline for an item.
 *
 * Primary source of truth is `item_activity`, but we also derive "missing"
 * event types from related tables so the Activity tab remains complete as we
 * migrate away from the legacy History tab.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

export type ItemActivityCategory =
  | 'movements'
  | 'tasks'
  | 'shipments'
  | 'notes'
  | 'billing'
  | 'photos_docs'
  | 'status_account'
  | 'repair'
  | 'other';

export function categorizeItemEvent(eventType: string): ItemActivityCategory {
  const t = String(eventType || '');

  if (t.startsWith('item_moved') || t.startsWith('item_location_changed') || t.includes('location')) return 'movements';
  if (t.startsWith('task_')) return 'tasks';
  if (t.startsWith('item_shipment_') || t.includes('received_in_shipment') || t.includes('released_in_shipment')) return 'shipments';
  if (t.startsWith('item_note_')) return 'notes';
  if (t.startsWith('item_photo_') || t.includes('photo') || t.includes('document_') || t.includes('document')) return 'photos_docs';
  if (t.startsWith('repair_quote_') || t.startsWith('item_repair_')) return 'repair';

  // Billing + flags/indicators live together in this codebase
  if (
    t.startsWith('billing_') ||
    t.includes('scan_charge') ||
    t.includes('billing_charge') ||
    t.startsWith('item_flag_') ||
    t.startsWith('indicator_') ||
    t.startsWith('flag_')
  ) return 'billing';

  if (
    t.startsWith('item_status_') ||
    t.startsWith('item_account_') ||
    t.startsWith('item_class_') ||
    t.startsWith('item_custom_field_') ||
    t.startsWith('item_field_') ||
    t.startsWith('inventory_count_')
  ) return 'status_account';

  return 'other';
}

type ActivityRow = {
  id: string;
  actor_user_id?: string | null;
  actor_name?: string | null;
  event_type: string;
  event_label: string;
  details?: Record<string, unknown>;
  created_at: string;
  tenant_id?: string;
  item_id?: string;
};

function asIso(d: string | null | undefined): string | null {
  if (!d) return null;
  const s = String(d);
  if (!s) return null;
  return s;
}

function toItemActivityRows(itemId: string, rows: ActivityRow[], tenantId?: string): ItemActivity[] {
  return rows.map((r) => ({
    id: r.id,
    tenant_id: tenantId || r.tenant_id || '',
    item_id: itemId,
    actor_user_id: r.actor_user_id ?? null,
    actor_name: r.actor_name ?? null,
    event_type: r.event_type,
    event_label: r.event_label,
    details: r.details || {},
    created_at: r.created_at,
  }));
}

async function fetchDerivedShipmentActivity(itemId: string): Promise<ActivityRow[]> {
  const rows: ActivityRow[] = [];

  try {
    const { data: shipmentItems, error } = await (supabase.from('shipment_items') as any)
      .select(`
        id,
        created_at,
        shipments:shipment_id(
          id,
          shipment_number,
          shipment_type,
          inbound_kind,
          status,
          created_at,
          received_at,
          completed_at
        )
      `)
      .eq('item_id', itemId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    if (!shipmentItems || shipmentItems.length === 0) return rows;

    const shipmentIds: string[] = shipmentItems
      .map((si: any) => si.shipments?.id)
      .filter(Boolean);

    const exceptionCounts: Record<string, number> = {};
    if (shipmentIds.length > 0) {
      try {
        const { data: openExceptions } = await (supabase as any)
          .from('shipment_exceptions')
          .select('shipment_id')
          .in('shipment_id', shipmentIds)
          .eq('status', 'open');

        for (const e of (openExceptions || []) as Array<{ shipment_id: string }>) {
          exceptionCounts[e.shipment_id] = (exceptionCounts[e.shipment_id] || 0) + 1;
        }
      } catch {
        // Non-critical
      }
    }

    for (const si of shipmentItems as any[]) {
      const s = si.shipments;
      if (!s) continue;

      const shipmentNumber = s.shipment_number || 'Unknown shipment';
      const createdAt = asIso(si.created_at) || asIso(s.created_at) || new Date().toISOString();

      rows.push({
        id: `derived-shipment-link-${si.id}`,
        event_type: 'item_shipment_linked',
        event_label: `Linked to shipment ${shipmentNumber}`,
        details: {
          shipment_id: s.id,
          shipment_number: shipmentNumber,
          shipment_type: s.shipment_type,
          inbound_kind: s.inbound_kind || null,
          shipment_status: s.status,
          exception_open_count: exceptionCounts[s.id] || 0,
        },
        created_at: createdAt,
      });

      const receivedAt = asIso(s.received_at);
      if (s.shipment_type === 'inbound' && receivedAt) {
        rows.push({
          id: `derived-shipment-received-${si.id}`,
          event_type: 'item_received_in_shipment',
          event_label: `Received in shipment ${shipmentNumber}`,
          details: {
            shipment_id: s.id,
            shipment_number: shipmentNumber,
            inbound_kind: s.inbound_kind || null,
            exception_open_count: exceptionCounts[s.id] || 0,
          },
          created_at: receivedAt,
        });
      }

      const completedAt = asIso(s.completed_at);
      if (s.shipment_type === 'outbound' && completedAt) {
        rows.push({
          id: `derived-shipment-released-${si.id}`,
          event_type: 'item_released_in_shipment',
          event_label: `Released in shipment ${shipmentNumber}`,
          details: {
            shipment_id: s.id,
            shipment_number: shipmentNumber,
            shipment_status: s.status,
          },
          created_at: completedAt,
        });
      }
    }
  } catch (err) {
    console.warn('[useItemActivity] derived shipment activity fetch failed:', err);
  }

  return rows;
}

async function fetchDerivedRepairQuoteActivity(itemId: string): Promise<ActivityRow[]> {
  const rows: ActivityRow[] = [];

  try {
    const { data: quotes, error } = await (supabase.from('repair_quotes') as any)
      .select(`
        id,
        status,
        approval_status,
        flat_rate,
        customer_total,
        created_at,
        approved_at,
        tech_submitted_at,
        client_responded_at,
        client_response,
        audit_log
      `)
      .eq('item_id', itemId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    if (!quotes || quotes.length === 0) return rows;

    for (const q of quotes as any[]) {
      const amount = q.customer_total ?? q.flat_rate ?? null;
      const createdAt = asIso(q.created_at) || new Date().toISOString();

      rows.push({
        id: `derived-repair-created-${q.id}`,
        event_type: 'repair_quote_created',
        event_label: 'Repair quote created',
        details: {
          repair_quote_id: q.id,
          status: q.status || q.approval_status || null,
          amount,
        },
        created_at: createdAt,
      });

      if (q.tech_submitted_at) {
        rows.push({
          id: `derived-repair-tech-submitted-${q.id}`,
          event_type: 'repair_quote_tech_submitted',
          event_label: 'Repair quote submitted by technician',
          details: { repair_quote_id: q.id, amount },
          created_at: q.tech_submitted_at,
        });
      }

      if (q.approved_at && (q.approval_status === 'approved' || q.status === 'accepted')) {
        rows.push({
          id: `derived-repair-approved-${q.id}`,
          event_type: 'repair_quote_approved',
          event_label: 'Repair quote approved',
          details: { repair_quote_id: q.id, amount },
          created_at: q.approved_at,
        });
      }

      if (q.client_responded_at && q.client_response) {
        rows.push({
          id: `derived-repair-client-response-${q.id}`,
          event_type: q.client_response === 'accepted' ? 'repair_quote_client_accepted' : 'repair_quote_client_declined',
          event_label: q.client_response === 'accepted' ? 'Client accepted repair quote' : 'Client declined repair quote',
          details: { repair_quote_id: q.id, amount },
          created_at: q.client_responded_at,
        });
      }

      const auditLog = Array.isArray(q.audit_log) ? q.audit_log : [];
      for (const entry of auditLog as any[]) {
        const at = asIso(entry?.at);
        if (!at) continue;
        const action = String(entry?.action || 'updated');
        const byName = entry?.by_name ? String(entry.by_name) : null;
        rows.push({
          id: `derived-repair-audit-${q.id}-${action}-${at}`,
          actor_name: byName,
          event_type: `repair_quote_${action}`,
          event_label: `Repair quote: ${action.replace(/_/g, ' ')}`,
          details: { repair_quote_id: q.id, ...(entry?.details || {}) },
          created_at: at,
        });
      }
    }
  } catch (err) {
    console.warn('[useItemActivity] derived repair quote activity fetch failed:', err);
  }

  return rows;
}

async function fetchDerivedDocumentActivity(itemId: string): Promise<ActivityRow[]> {
  const rows: ActivityRow[] = [];

  try {
    const { data, error } = await (supabase.from('documents') as any)
      .select(`
        id,
        file_name,
        label,
        storage_key,
        created_at,
        deleted_at,
        created_by(id, first_name, last_name)
      `)
      .eq('context_type', 'item')
      .eq('context_id', itemId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    if (!data || data.length === 0) return rows;

    for (const doc of data as any[]) {
      const createdAt = asIso(doc.created_at);
      const deletedAt = asIso(doc.deleted_at);
      const actorName =
        doc.created_by
          ? [doc.created_by.first_name, doc.created_by.last_name].filter(Boolean).join(' ') || null
          : null;

      if (createdAt) {
        rows.push({
          id: `derived-doc-upload-${doc.id}`,
          actor_name: actorName,
          event_type: 'document_uploaded',
          event_label: 'Document uploaded',
          details: {
            document_id: doc.id,
            file_name: doc.file_name,
            label: doc.label,
            document: { storage_key: doc.storage_key, file_name: doc.file_name, label: doc.label },
          },
          created_at: createdAt,
        });
      }

      if (deletedAt) {
        rows.push({
          id: `derived-doc-removed-${doc.id}`,
          actor_name: null,
          event_type: 'document_removed',
          event_label: 'Document removed',
          details: {
            document_id: doc.id,
            file_name: doc.file_name,
            label: doc.label,
          },
          created_at: deletedAt,
        });
      }
    }
  } catch (err) {
    console.warn('[useItemActivity] derived document activity fetch failed:', err);
  }

  return rows;
}

export function useItemActivity(itemId: string | undefined) {
  const [activities, setActivities] = useState<ItemActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    if (!itemId) return;

    setLoading(true);
    try {
      const { data, error } = await (supabase.from('item_activity') as any)
        .select('*')
        .eq('item_id', itemId)
        .order('created_at', { ascending: false })
        .limit(250);

      if (error) {
        if (error.code !== '42P01') {
          console.error('[useItemActivity] Error:', error);
        }
        setActivities([]);
        return;
      }

      const tenantId = (data && data.length > 0) ? String((data[0] as any).tenant_id || '') : '';

      const [shipments, repairs, docs] = await Promise.all([
        fetchDerivedShipmentActivity(itemId),
        fetchDerivedRepairQuoteActivity(itemId),
        fetchDerivedDocumentActivity(itemId),
      ]);

      const unified = [
        ...(data || []),
        ...toItemActivityRows(itemId, shipments, tenantId),
        ...toItemActivityRows(itemId, repairs, tenantId),
        ...toItemActivityRows(itemId, docs, tenantId),
      ] as ItemActivity[];

      // Deduplicate by id and sort newest first
      const seen = new Set<string>();
      const deduped = unified.filter((row) => {
        if (!row?.id) return false;
        if (seen.has(row.id)) return false;
        seen.add(row.id);
        return true;
      });
      deduped.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setActivities(deduped);
    } catch (err) {
      console.error('[useItemActivity] Unexpected error:', err);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return {
    activities,
    loading,
    refetch: fetchActivities,
  };
}
