import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useShipmentNotes, type ShipmentNote, type ShipmentNoteType } from '@/hooks/useShipmentNotes';
import { SHIPMENT_EXCEPTION_CODE_META, type ShipmentExceptionCode } from '@/hooks/useShipmentExceptions';

interface ShipmentNotesSectionProps {
  shipmentId: string;
  /** For client portal views: hide internal notes + composer */
  isClientUser?: boolean;
  /** Optional: show account default shipment notes callout */
  accountId?: string | null;
  className?: string;
}

const EXCEPTION_CODE_OPTIONS: ShipmentExceptionCode[] = [
  'DAMAGE',
  'WET',
  'OPEN',
  'MISSING_DOCS',
  'CRUSHED_TORN_CARTONS',
  'MIS_SHIP',
  'SHORTAGE',
  'OVERAGE',
  'OTHER',
];

export function ShipmentNotesSection({
  shipmentId,
  isClientUser = false,
  accountId,
  className,
}: ShipmentNotesSectionProps) {
  const { profile } = useAuth();
  const { notes, loading, addNote } = useShipmentNotes(shipmentId);

  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<ShipmentNoteType>('internal');
  const [exceptionCode, setExceptionCode] = useState<string>('__general__');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Account default shipment notes callout (Settings → Default Notes)
  const [accountDefaultShipmentNotes, setAccountDefaultShipmentNotes] = useState<string | null>(null);
  const [accountHighlightShipmentNotes, setAccountHighlightShipmentNotes] = useState(false);

  useEffect(() => {
    if (!accountId || !profile?.tenant_id || isClientUser) {
      setAccountDefaultShipmentNotes(null);
      setAccountHighlightShipmentNotes(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      const { data, error } = await (supabase.from('accounts') as any)
        .select('default_shipment_notes, highlight_shipment_notes')
        .eq('tenant_id', profile.tenant_id)
        .eq('id', accountId)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        console.warn('[ShipmentNotesSection] Failed to load account default shipment notes:', error.message);
        setAccountDefaultShipmentNotes(null);
        setAccountHighlightShipmentNotes(false);
        return;
      }

      setAccountDefaultShipmentNotes((data?.default_shipment_notes as string | null) ?? null);
      setAccountHighlightShipmentNotes(!!data?.highlight_shipment_notes);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [accountId, profile?.tenant_id, isClientUser]);

  const flattened = useMemo(() => {
    // Notes are already threaded; flatten for quick counts/filtering while keeping original render order.
    const out: ShipmentNote[] = [];
    for (const n of notes) {
      out.push(n);
      for (const r of n.replies || []) out.push(r);
    }
    return out;
  }, [notes]);

  const visibleThreadedNotes = useMemo(() => {
    if (!isClientUser) return notes;
    // Client can only view public/exception (RLS should already enforce, but keep UI-safe)
    return notes
      .filter((n) => n.visibility === 'public' || n.note_type === 'public' || n.note_type === 'exception')
      .map((n) => ({
        ...n,
        replies: (n.replies || []).filter((r) => r.visibility === 'public' || r.note_type === 'public' || r.note_type === 'exception'),
      }));
  }, [isClientUser, notes]);

  const internalNotesCount = flattened.filter((n) => n.note_type === 'internal').length;
  const publicNotesCount = flattened.filter((n) => n.note_type === 'public').length;
  const exceptionNotesCount = flattened.filter((n) => n.note_type === 'exception').length;

  const handleSubmit = async () => {
    if (!newNote.trim()) return;

    setSubmitting(true);
    try {
      if (noteType === 'exception') {
        const code = exceptionCode === '__general__' ? null : exceptionCode;
        await addNote(newNote, 'exception', { exceptionCode: code });
      } else {
        await addNote(newNote, noteType);
      }
      setNewNote('');
      setExceptionCode('__general__');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyText.trim()) return;

    setSubmitting(true);
    try {
      const parent = flattened.find((n) => n.id === parentId);
      const parentType = (parent?.note_type || 'internal') as ShipmentNoteType;
      const parentExceptionCode = parent?.exception_code || null;
      await addNote(replyText, parentType, { parentNoteId: parentId, exceptionCode: parentExceptionCode });
      setReplyText('');
      setReplyingTo(null);
    } finally {
      setSubmitting(false);
    }
  };

  const renderNote = (note: ShipmentNote, isReply = false) => {
    const authorName = note.author
      ? `${note.author.first_name || ''} ${note.author.last_name || ''}`.trim() || 'Unknown'
      : 'System';
    const initials = authorName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const exceptionLabel =
      note.note_type === 'exception' && note.exception_code
        ? (SHIPMENT_EXCEPTION_CODE_META[note.exception_code as ShipmentExceptionCode]?.label ||
          String(note.exception_code).replace(/_/g, ' '))
        : null;

    return (
      <div
        key={note.id}
        className={cn('flex gap-3', isReply ? 'ml-8 mt-2' : 'border-b pb-4 last:border-b-0')}
      >
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{authorName}</span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
            </span>

            {note.note_type === 'exception' ? (
              <Badge variant="destructive" className="text-xs">
                <MaterialIcon name="report_problem" className="text-[12px] mr-1" />
                Exception
              </Badge>
            ) : note.note_type === 'public' ? (
              <Badge variant="outline" className="text-xs">
                <MaterialIcon name="public" className="text-[12px] mr-1" />
                Public
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                <MaterialIcon name="lock" className="text-[12px] mr-1" />
                Internal
              </Badge>
            )}

            {exceptionLabel && (
              <Badge variant="outline" className="text-xs">
                {exceptionLabel}
              </Badge>
            )}

            {note.is_chip_generated && (
              <Badge variant="secondary" className="text-xs">
                <MaterialIcon name="sell" className="text-[12px] mr-1" />
                Chip
              </Badge>
            )}
          </div>

          <p className="text-sm mt-1 whitespace-pre-wrap">{note.note}</p>

          {!isReply && !isClientUser && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 h-6 px-2 text-xs"
              onClick={() => setReplyingTo(replyingTo === note.id ? null : note.id)}
            >
              <MaterialIcon name="reply" className="text-[12px] mr-1" />
              Reply
            </Button>
          )}

          {replyingTo === note.id && (
            <div className="flex gap-2 mt-2">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="min-h-[60px] text-sm"
              />
              <Button
                size="sm"
                onClick={() => handleReply(note.id)}
                disabled={submitting || !replyText.trim()}
              >
                {submitting ? (
                  <MaterialIcon name="progress_activity" size="sm" className="animate-spin" />
                ) : (
                  <MaterialIcon name="send" size="sm" />
                )}
              </Button>
            </div>
          )}

          {(note.replies || []).map((reply) => renderNote(reply, true))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="py-8 flex items-center justify-center">
          <MaterialIcon name="progress_activity" size="lg" className="animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MaterialIcon name="chat" size="md" />
          Notes ({visibleThreadedNotes.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {accountHighlightShipmentNotes && accountDefaultShipmentNotes?.trim() && !isClientUser && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <div className="font-medium mb-1">Default Shipment Notes</div>
            <p className="whitespace-pre-wrap">{accountDefaultShipmentNotes}</p>
          </div>
        )}

        {/* New note composer */}
        {!isClientUser && (
          <div className="space-y-3">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-muted-foreground">Note Type:</span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={noteType === 'internal' ? 'default' : 'outline'}
                  size="sm"
                  className={cn('flex-1', noteType === 'internal' ? 'bg-amber-600 hover:bg-amber-700 text-white' : '')}
                  onClick={() => setNoteType('internal')}
                >
                  <MaterialIcon name="lock" className="text-[14px] mr-2" />
                  Internal
                </Button>
                <Button
                  type="button"
                  variant={noteType === 'public' ? 'default' : 'outline'}
                  size="sm"
                  className={cn('flex-1', noteType === 'public' ? 'bg-blue-600 hover:bg-blue-700 text-white' : '')}
                  onClick={() => setNoteType('public')}
                >
                  <MaterialIcon name="public" className="text-[14px] mr-2" />
                  Public
                </Button>
                <Button
                  type="button"
                  variant={noteType === 'exception' ? 'default' : 'outline'}
                  size="sm"
                  className={cn('flex-1', noteType === 'exception' ? 'bg-red-600 hover:bg-red-700 text-white' : '')}
                  onClick={() => setNoteType('exception')}
                >
                  <MaterialIcon name="report_problem" className="text-[14px] mr-2" />
                  Exception
                </Button>
              </div>
              <p
                className={cn(
                  'text-xs',
                  noteType === 'internal'
                    ? 'text-amber-600 dark:text-amber-400'
                    : noteType === 'public'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-red-600 dark:text-red-400'
                )}
              >
                {noteType === 'internal'
                  ? 'Internal notes are only viewable by your company.'
                  : noteType === 'public'
                    ? 'Public notes are visible to the client.'
                    : 'Exception notes are always client-visible and should describe the exception.'}
              </p>
            </div>

            {noteType === 'exception' && (
              <div className="space-y-2">
                <Label className="text-sm">Exception Type (optional)</Label>
                <Select value={exceptionCode} onValueChange={setExceptionCode}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="General exception note" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__general__">General exception note</SelectItem>
                    {EXCEPTION_CODE_OPTIONS.map((code) => (
                      <SelectItem key={code} value={code}>
                        {SHIPMENT_EXCEPTION_CODE_META[code]?.label || code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder={
                noteType === 'internal'
                  ? 'Add an internal note...'
                  : noteType === 'public'
                    ? 'Add a public note for the client...'
                    : 'Add a client-visible exception note...'
              }
              className={cn('min-h-[80px]', noteType === 'exception' ? 'border-red-300 focus:border-red-500' : '')}
            />

            <div className="flex justify-end">
              <Button size="sm" onClick={handleSubmit} disabled={submitting || !newNote.trim()}>
                {submitting ? (
                  <MaterialIcon name="progress_activity" size="sm" className="mr-2 animate-spin" />
                ) : (
                  <MaterialIcon name="send" size="sm" className="mr-2" />
                )}
                Add Note
              </Button>
            </div>
          </div>
        )}

        {/* Notes list */}
        {isClientUser ? (
          <div className="space-y-4">
            {visibleThreadedNotes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No notes available.</p>
            ) : (
              visibleThreadedNotes.map((note) => renderNote(note))
            )}
          </div>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="all">All ({flattened.length})</TabsTrigger>
              <TabsTrigger value="internal">Internal ({internalNotesCount})</TabsTrigger>
              <TabsTrigger value="public">Public ({publicNotesCount})</TabsTrigger>
              <TabsTrigger value="exception">Exception ({exceptionNotesCount})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4 space-y-4">
              {visibleThreadedNotes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No notes yet. Add the first one above.</p>
              ) : (
                visibleThreadedNotes.map((note) => renderNote(note))
              )}
            </TabsContent>

            <TabsContent value="internal" className="mt-4 space-y-4">
              {internalNotesCount === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No internal notes.</p>
              ) : (
                visibleThreadedNotes
                  .filter((n) => n.note_type === 'internal')
                  .map((note) => renderNote(note))
              )}
            </TabsContent>

            <TabsContent value="public" className="mt-4 space-y-4">
              {publicNotesCount === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No public notes.</p>
              ) : (
                visibleThreadedNotes
                  .filter((n) => n.note_type === 'public')
                  .map((note) => renderNote(note))
              )}
            </TabsContent>

            <TabsContent value="exception" className="mt-4 space-y-4">
              {exceptionNotesCount === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No exception notes.</p>
              ) : (
                visibleThreadedNotes
                  .filter((n) => n.note_type === 'exception')
                  .map((note) => renderNote(note))
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

