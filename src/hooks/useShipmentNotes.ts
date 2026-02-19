import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/lib/activity/logActivity';

export type ShipmentNoteType = 'internal' | 'public' | 'exception';

export interface ShipmentNote {
  id: string;
  shipment_id: string;
  tenant_id: string | null;
  note: string;
  note_type: ShipmentNoteType;
  visibility: string | null;
  parent_note_id: string | null;
  exception_code: string | null;
  is_chip_generated: boolean | null;
  version: number | null;
  is_current: boolean | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Joined data
  author?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  };
  replies?: ShipmentNote[];
}

export function useShipmentNotes(shipmentId: string | undefined) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<ShipmentNote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    if (!shipmentId) return;

    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('shipment_notes')
        .select(
          `
          *,
          author:created_by(id, first_name, last_name)
        `
        )
        .eq('shipment_id', shipmentId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rows = (data || []) as ShipmentNote[];

      // Organize notes into threads (parent notes with replies)
      const parentNotes = rows.filter((n) => !n.parent_note_id);
      const replies = rows.filter((n) => n.parent_note_id);

      const threaded = parentNotes.map((parent) => ({
        ...parent,
        replies: replies.filter((r) => r.parent_note_id === parent.id),
      }));

      setNotes(threaded);
    } catch (error) {
      console.error('[useShipmentNotes] Error fetching shipment notes:', error);
    } finally {
      setLoading(false);
    }
  }, [shipmentId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const addNote = async (
    note: string,
    noteType: ShipmentNoteType,
    options?: { parentNoteId?: string; exceptionCode?: string | null }
  ) => {
    if (!profile?.tenant_id || !profile?.id || !shipmentId) return null;

    const trimmed = note.trim();
    if (!trimmed) return null;

    const exceptionCode = options?.exceptionCode ?? null;
    const parentNoteId = options?.parentNoteId ?? null;

    const visibility = noteType === 'internal' ? 'internal' : 'public';

    try {
      const { data, error } = await (supabase as any)
        .from('shipment_notes')
        .insert({
          tenant_id: profile.tenant_id,
          shipment_id: shipmentId,
          note: trimmed,
          note_type: noteType,
          visibility,
          exception_code: noteType === 'exception' ? exceptionCode : null,
          parent_note_id: parentNoteId,
          created_by: profile.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Note Added',
        description:
          noteType === 'internal'
            ? 'Internal note has been added.'
            : noteType === 'public'
              ? 'Public note has been added.'
              : 'Exception note has been added.',
      });

      void logActivity({
        entityType: 'shipment',
        tenantId: profile.tenant_id,
        entityId: shipmentId,
        actorUserId: profile.id,
        eventType: 'shipment_note_added',
        eventLabel: 'Shipment note added',
        details: {
          note_id: (data as any)?.id,
          note_type: noteType,
          exception_code: exceptionCode,
          preview: trimmed.substring(0, 120),
        },
      });

      fetchNotes();
      return data as ShipmentNote;
    } catch (error) {
      console.error('[useShipmentNotes] Error adding shipment note:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add note',
      });
      return null;
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!profile?.tenant_id) return false;
    try {
      const { error } = await (supabase as any)
        .from('shipment_notes')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', noteId);

      if (error) throw error;

      toast({ title: 'Note Deleted', description: 'Note has been removed.' });

      if (shipmentId && profile?.id) {
        void logActivity({
          entityType: 'shipment',
          tenantId: profile.tenant_id,
          entityId: shipmentId,
          actorUserId: profile.id,
          eventType: 'shipment_note_deleted',
          eventLabel: 'Shipment note deleted',
          details: { note_id: noteId },
        });
      }

      fetchNotes();
      return true;
    } catch (error) {
      console.error('[useShipmentNotes] Error deleting shipment note:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete note',
      });
      return false;
    }
  };

  return {
    notes,
    loading,
    refetch: fetchNotes,
    addNote,
    deleteNote,
  };
}

