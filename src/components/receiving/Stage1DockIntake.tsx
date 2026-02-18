import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { HelpTip } from '@/components/ui/help-tip';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { AutosaveIndicator } from './AutosaveIndicator';
import { useReceivingAutosave } from '@/hooks/useReceivingAutosave';
import { BigCounter } from './BigCounter';
import { PhotoScannerButton } from '@/components/common/PhotoScannerButton';
import { PhotoUploadButton } from '@/components/common/PhotoUploadButton';
import { TaggablePhotoGrid, type TaggablePhoto, getPhotoUrls } from '@/components/common/TaggablePhotoGrid';
import {
  SHIPMENT_EXCEPTION_CODE_META,
  useShipmentExceptions,
  type ShipmentExceptionCode,
} from '@/hooks/useShipmentExceptions';
import { SignaturePad } from '@/components/shipments/SignaturePad';
import { ShipmentExceptionBadge } from '@/components/shipments/ShipmentExceptionBadge';
import { AccountSelect } from '@/components/ui/account-select';
import { DocumentCapture } from '@/components/scanner/DocumentCapture';
import { useDocuments } from '@/hooks/useDocuments';
import { BillingCalculator } from '@/components/billing/BillingCalculator';
import { AddAddonDialog } from '@/components/billing/AddAddonDialog';
import { AddCreditDialog } from '@/components/billing/AddCreditDialog';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type ExceptionChip = ShipmentExceptionCode;

const EXCEPTION_OPTIONS: { value: ExceptionChip; label: string; icon: string }[] = [
  // Shipment-level exceptions observed during intake/receiving.
  { value: 'DAMAGE', ...SHIPMENT_EXCEPTION_CODE_META.DAMAGE },
  { value: 'WET', ...SHIPMENT_EXCEPTION_CODE_META.WET },
  { value: 'OPEN', ...SHIPMENT_EXCEPTION_CODE_META.OPEN },
  { value: 'MISSING_DOCS', ...SHIPMENT_EXCEPTION_CODE_META.MISSING_DOCS },
  { value: 'CRUSHED_TORN_CARTONS', ...SHIPMENT_EXCEPTION_CODE_META.CRUSHED_TORN_CARTONS },
  { value: 'MIS_SHIP', ...SHIPMENT_EXCEPTION_CODE_META.MIS_SHIP },
  { value: 'SHORTAGE', ...SHIPMENT_EXCEPTION_CODE_META.SHORTAGE },
  { value: 'OVERAGE', ...SHIPMENT_EXCEPTION_CODE_META.OVERAGE },
  { value: 'OTHER', ...SHIPMENT_EXCEPTION_CODE_META.OTHER },
];

export interface MatchingParamsUpdate {
  pieces: number;
  dockCount: number;
  accountId: string | null;
}

interface Stage1DockIntakeProps {
  shipmentId: string;
  shipmentNumber: string;
  shipment: {
    account_id: string | null;
    vendor_name: string | null;
    carrier?: string | null;
    tracking_number?: string | null;
    po_number?: string | null;
    signed_pieces: number | null;
    received_pieces: number | null;
    signature_data: string | null;
    signature_name: string | null;
    signature_timestamp?: string | null;
    driver_name?: string | null;
    receiving_photos?: Json | null;
    dock_intake_breakdown: Record<string, unknown> | null;
    notes: string | null;
  };
  onComplete: () => void;
  onRefresh: () => void;
  /** Called whenever fields that affect matching change, so the matching panel can update reactively */
  onMatchingParamsChange?: (params: MatchingParamsUpdate) => void;
  onOpenExceptions?: () => void;
  /** Stage 2 row-count (each row = 1 carton/package/piece) */
  entryCount?: number;
  /**
   * External refresh key for the BillingCalculator (e.g., Stage 2 autosaves).
   * Stage 1 also maintains its own internal refresh key for Add Charge/Credit.
   */
  externalBillingRefreshKey?: number;
  /** Draft-only: show the "Complete Dock Intake" action */
  showCompleteButton?: boolean;
  /** Render in read-only mode (view-only). */
  readOnly?: boolean;
}

export function Stage1DockIntake({
  shipmentId,
  shipmentNumber,
  shipment,
  onComplete,
  onRefresh,
  onMatchingParamsChange,
  onOpenExceptions,
  entryCount = 0,
  externalBillingRefreshKey = 0,
  showCompleteButton = true,
  readOnly = false,
}: Stage1DockIntakeProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { hasRole } = usePermissions();
  const canEdit = !readOnly;

  // Form state
  const [accountId, setAccountId] = useState<string>(shipment.account_id || '');
  const [carrierName, setCarrierName] = useState((shipment as any).carrier || '');
  const [trackingNumber, setTrackingNumber] = useState((shipment as any).tracking_number || '');
  const [poNumber, setPoNumber] = useState((shipment as any).po_number || '');
  const [signedPieces, setSignedPieces] = useState<number>(shipment.signed_pieces || 0);
  const [dockCount, setDockCount] = useState<number>(shipment.received_pieces || 0);
  const [notes, setNotes] = useState(shipment.notes || '');
  const [notesTouched, setNotesTouched] = useState(false);
  const [accountDefaultShipmentNotes, setAccountDefaultShipmentNotes] = useState<string | null>(null);
  const [accountHighlightShipmentNotes, setAccountHighlightShipmentNotes] = useState(false);
  const [exceptions, setExceptions] = useState<ExceptionChip[]>([]);
  const [exceptionNotes, setExceptionNotes] = useState<Record<ShipmentExceptionCode, string>>({} as Record<ShipmentExceptionCode, string>);
  const [pendingRequiredNoteCode, setPendingRequiredNoteCode] = useState<ShipmentExceptionCode | null>(null);
  const [pendingRequiredNote, setPendingRequiredNote] = useState('');
  const [autoPieceCountException, setAutoPieceCountException] = useState<ShipmentExceptionCode | null>(null);
  const [breakdown, setBreakdown] = useState<{ cartons: number; pallets: number; crates: number }>({
    cartons: 0,
    pallets: 0,
    crates: 0,
    ...(shipment.dock_intake_breakdown as any || {}),
  });

  // Signature
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(shipment.signature_data || null);
  const [signatureName, setSignatureName] = useState(shipment.signature_name || '');
  const [signatureTimestamp, setSignatureTimestamp] = useState<string | null>(
    (shipment as any).signature_timestamp || null
  );
  // Draft signature fields (edited in dialog; persisted on save)
  const [signatureDraftData, setSignatureDraftData] = useState<string | null>(null);
  const [signatureDraftName, setSignatureDraftName] = useState('');

  // Submitting
  const [completing, setCompleting] = useState(false);

  // Billing UI (manager/admin only)
  const [billingRefreshKey, setBillingRefreshKey] = useState(0);
  const effectiveBillingRefreshKey = billingRefreshKey + externalBillingRefreshKey;
  const [addChargeOpen, setAddChargeOpen] = useState(false);
  const [addCreditOpen, setAddCreditOpen] = useState(false);
  const canSeeBilling = hasRole('admin') || hasRole('tenant_admin') || hasRole('manager');
  const canAddCredit = hasRole('admin') || hasRole('tenant_admin');

  // If the shipment account changes, refresh billing preview/rates.
  useEffect(() => {
    if (!canSeeBilling) return;
    if (!accountId) return;
    setBillingRefreshKey((prev) => prev + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, canSeeBilling]);

  // Autosave - disable while completing to prevent race conditions
  const autosave = useReceivingAutosave(shipmentId, !completing);

  // Photos (legacy incoming shipments style) stored on shipments.receiving_photos
  const [receivingPhotos, setReceivingPhotos] = useState<(string | TaggablePhoto)[]>(() => {
    const existing = (shipment as any)?.receiving_photos;
    return Array.isArray(existing) ? (existing as (string | TaggablePhoto)[]) : [];
  });
  const [legacyPhotosBootstrapped, setLegacyPhotosBootstrapped] = useState(false);

  // Shipment exceptions
  const {
    openExceptions,
    upsertOpenException,
    removeOpenException,
    refetch: refetchExceptions,
  } = useShipmentExceptions(shipmentId);

  const { documents, refetch: refetchDocuments } = useDocuments({ contextType: 'shipment', contextId: shipmentId });

  // Emit matching params whenever relevant fields change
  useEffect(() => {
    onMatchingParamsChange?.({
      pieces: signedPieces,
      dockCount,
      accountId: accountId || null,
    });
  }, [signedPieces, dockCount, accountId, onMatchingParamsChange]);

  useEffect(() => {
    setAccountId(shipment.account_id || '');
  }, [shipment.account_id]);

  useEffect(() => {
    setCarrierName((shipment as any).carrier || '');
  }, [(shipment as any).carrier]);

  useEffect(() => {
    setTrackingNumber((shipment as any).tracking_number || '');
  }, [(shipment as any).tracking_number]);

  useEffect(() => {
    setPoNumber((shipment as any).po_number || '');
  }, [(shipment as any).po_number]);

  useEffect(() => {
    setDockCount(shipment.received_pieces || 0);
  }, [shipment.received_pieces]);

  useEffect(() => {
    setSignatureTimestamp((shipment as any).signature_timestamp || null);
  }, [(shipment as any).signature_timestamp]);

  // Keep local photo state aligned with the persisted shipment JSON field.
  useEffect(() => {
    const existing = shipment.receiving_photos;
    setReceivingPhotos(Array.isArray(existing) ? (existing as unknown as (string | TaggablePhoto)[]) : []);
  }, [shipment.receiving_photos]);

  // Autosave handlers
  const handleAccountChange = (value: string) => {
    setAccountId(value);
    autosave.saveField('account_id', value || null);
  };

  const handleCarrierNameChange = (value: string) => {
    setCarrierName(value);
    autosave.saveField('carrier', value || null);
  };

  const handleTrackingNumberChange = (value: string) => {
    setTrackingNumber(value);
    autosave.saveField('tracking_number', value || null);
  };

  const handlePoNumberChange = (value: string) => {
    setPoNumber(value);
    autosave.saveField('po_number', value || null);
  };

  const handleSignedPiecesChange = (value: number) => {
    setSignedPieces(value);
    autosave.saveField('signed_pieces', value);
  };

  const handleDockCountChange = (value: number) => {
    setDockCount(value);
    autosave.saveField('received_pieces', value);
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    autosave.saveField('notes', value.trim() ? value : null);
  };

  const handleNotesUserChange = (value: string) => {
    setNotesTouched(true);
    handleNotesChange(value);
  };

  // Pull default shipment notes from Account Settings → Default Notes
  useEffect(() => {
    if (!accountId || !profile?.tenant_id) {
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
        .single();

      if (cancelled) return;
      if (error) {
        console.warn('[Stage1DockIntake] Failed to load account default shipment notes:', error.message);
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
  }, [accountId, profile?.tenant_id]);

  // Prefill shipment notes if blank and user hasn't edited.
  useEffect(() => {
    if (!accountId) return;
    if (notesTouched) return;
    if (notes.trim()) return;
    if (!accountDefaultShipmentNotes?.trim()) return;
    handleNotesChange(accountDefaultShipmentNotes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, accountDefaultShipmentNotes, notesTouched, notes]);

  const handleBreakdownChange = (field: string, value: number) => {
    const newBreakdown = { ...breakdown, [field]: value };
    setBreakdown(newBreakdown);
    autosave.saveField('dock_intake_breakdown', newBreakdown);

    // Dock Count should reflect the unit breakdown when the breakdown is used.
    // Important: set (do not add) to avoid double-counting when users adjust values.
    const computedPieces =
      (Number(newBreakdown.cartons) || 0) +
      (Number(newBreakdown.pallets) || 0) +
      (Number(newBreakdown.crates) || 0);
    setDockCount(computedPieces);
    autosave.saveField('received_pieces', computedPieces);
  };

  // Sync local chips with persisted open exceptions
  useEffect(() => {
    if (openExceptions.length === 0) {
      setExceptions([]);
      setExceptionNotes({} as Record<ShipmentExceptionCode, string>);
      return;
    }

    const selected = openExceptions.map((e) => e.code as ExceptionChip);
    const notesMap = {} as Record<ShipmentExceptionCode, string>;
    openExceptions.forEach((e) => {
      notesMap[e.code] = e.note || '';
    });
    setExceptions(selected);
    setExceptionNotes(notesMap);
  }, [openExceptions]);

  // DB-enforced required-note codes (must collect a note before inserting)
  const isDbRequiredNoteCode = (code: ShipmentExceptionCode) => code === 'OTHER';

  const toggleException = async (chip: ExceptionChip) => {
    const selected = exceptions.includes(chip);
    if (selected) {
      // Shortage/Overage can be auto-synced + locked when carrier vs dock counts mismatch.
      if (autoPieceCountException === chip) {
        toast({
          variant: 'destructive',
          title: 'Locked Exception',
          description: 'Shortage/Overage is locked until Carrier and Dock counts match.',
        });
        return;
      }

      const removed = await removeOpenException(chip);
      if (!removed) return;
      setExceptions((prev) => {
        const next = prev.filter((e) => e !== chip);
        return next;
      });
      setExceptionNotes((prev) => {
        const next = { ...prev };
        delete next[chip];
        return next;
      });
      return;
    }

    if (isDbRequiredNoteCode(chip)) {
      setPendingRequiredNoteCode(chip);
      setPendingRequiredNote(exceptionNotes[chip] || '');
      return;
    }

    const saved = await upsertOpenException(chip, exceptionNotes[chip] || null);
    if (saved) {
      setExceptions((prev) => [...prev, chip]);
    }
  };

  // Carrier vs Dock mismatch should auto-sync Shortage/Overage (and lock until corrected).
  useEffect(() => {
    const carrier = Number(signedPieces) || 0;
    const dock = Number(dockCount) || 0;
    const mismatch = carrier > 0 && dock > 0 && carrier !== dock;

    const required: ShipmentExceptionCode | null = mismatch
      ? (dock > carrier ? 'OVERAGE' : 'SHORTAGE')
      : null;

    const run = async () => {
      // If mismatch resolved, remove any auto-applied piece-count exception.
      if (!required) {
        if (autoPieceCountException) {
          await removeOpenException(autoPieceCountException);
          setAutoPieceCountException(null);
        }
        return;
      }

      const opposite: ShipmentExceptionCode = required === 'OVERAGE' ? 'SHORTAGE' : 'OVERAGE';

      // Remove previously auto-applied code if direction changed.
      if (autoPieceCountException && autoPieceCountException !== required) {
        await removeOpenException(autoPieceCountException);
      }

      // Ensure required mismatch exception exists.
      if (!exceptions.includes(required)) {
        await upsertOpenException(required, exceptionNotes[required]?.trim() || null);
      }

      // Ensure the opposite code is not selected simultaneously.
      if (exceptions.includes(opposite)) {
        await removeOpenException(opposite);
      }

      setAutoPieceCountException(required);
    };

    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedPieces, dockCount, exceptions, autoPieceCountException]);

  const handleSaveRequiredNote = async () => {
    if (!pendingRequiredNoteCode) return;
    if (!pendingRequiredNote.trim()) {
      toast({
        variant: 'destructive',
        title: 'Note Required',
        description: `${SHIPMENT_EXCEPTION_CODE_META[pendingRequiredNoteCode].label} requires a note.`,
      });
      return;
    }

    const note = pendingRequiredNote.trim();
    const code = pendingRequiredNoteCode;
    const saved = await upsertOpenException(code, note);
    if (!saved) return;

    setExceptionNotes((prev) => ({ ...prev, [code]: note }));
    setExceptions((prev) => (prev.includes(code) ? prev : [...prev, code]));
    setPendingRequiredNoteCode(null);
    setPendingRequiredNote('');
  };

  const handleExceptionNoteBlur = async (code: ShipmentExceptionCode) => {
    if (!exceptions.includes(code)) return;
    const note = exceptionNotes[code]?.trim() || null;
    if (isDbRequiredNoteCode(code) && !note) return;
    await upsertOpenException(code, note);
  };

  const saveReceivingPhotosToShipment = async (nextPhotos: TaggablePhoto[]) => {
    setReceivingPhotos(nextPhotos);
    const { error } = await (supabase as any)
      .from('shipments')
      .update({ receiving_photos: nextPhotos as unknown as Json })
      .eq('id', shipmentId);
    if (error) throw error;
  };

  const mergeAndSaveReceivingPhotoUrls = async (urls: string[]) => {
    const existingUrls = getPhotoUrls(receivingPhotos);
    const newUrls = urls.filter((u) => !existingUrls.includes(u));
    const newTaggablePhotos: TaggablePhoto[] = newUrls.map((url) => ({
      url,
      isPrimary: false,
      needsAttention: false,
      isRepair: false,
    }));
    const normalizedExisting: TaggablePhoto[] = receivingPhotos.map((p) =>
      typeof p === 'string'
        ? { url: p, isPrimary: false, needsAttention: false, isRepair: false }
        : p
    );
    const allPhotos = [...normalizedExisting, ...newTaggablePhotos];
    await saveReceivingPhotosToShipment(allPhotos);
  };

  // Backwards compatibility:
  // Earlier Dock Intake builds stored photos in shipment_photos (split into paperwork/condition).
  // This UI now uses shipments.receiving_photos; bootstrap once so users don't "lose" existing photos.
  useEffect(() => {
    if (legacyPhotosBootstrapped) return;
    if (!profile?.tenant_id) return;

    // If we already have photos on the shipment JSON field, nothing to do.
    if (getPhotoUrls(receivingPhotos).length > 0) {
      setLegacyPhotosBootstrapped(true);
      return;
    }

    // Mark attempted immediately to prevent duplicate fetches.
    setLegacyPhotosBootstrapped(true);

    const bootstrap = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('shipment_photos')
          .select('storage_key')
          .eq('tenant_id', profile.tenant_id)
          .eq('shipment_id', shipmentId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        const urls = (data || [])
          .map((p: { storage_key: string }) => {
            const { data: urlData } = supabase.storage.from('photos').getPublicUrl(p.storage_key);
            return urlData?.publicUrl || '';
          })
          .filter((u: string) => !!u);

        if (urls.length > 0) {
          await mergeAndSaveReceivingPhotoUrls(urls);
        }
      } catch (err) {
        console.warn('[Stage1DockIntake] legacy shipment_photos bootstrap failed:', err);
      }
    };

    void bootstrap();
  }, [legacyPhotosBootstrapped, profile?.tenant_id, shipmentId, receivingPhotos]);

  // Signature handlers
  const handleSignatureComplete = async (data: string | null, name: string) => {
    if (!canEdit) return;
    const normalizedName = name.trim();
    const normalizedData = data?.trim() ? data : null;

    setSignatureData(normalizedData);
    setSignatureName(normalizedName);
    const nowIso = new Date().toISOString();
    setSignatureTimestamp(nowIso);
    setSignatureDraftData(null);
    setSignatureDraftName('');
    setShowSignatureDialog(false);

    // Save signature to shipment (awaited with error handling)
    try {
      const { error } = await (supabase as any)
        .from('shipments')
        .update({
          signature_data: normalizedData,
          signature_name: normalizedName || null,
          driver_name: normalizedName || null,
          signature_timestamp: nowIso,
        })
        .eq('id', shipmentId);

      if (error) throw error;
      toast({ title: 'Signature saved' });
      onRefresh();
    } catch (err: any) {
      console.error('[Stage1] signature save error:', err);
      toast({
        variant: 'destructive',
        title: 'Signature Error',
        description: err?.message || 'Failed to save signature',
      });
    }
  };

  const handleClearSignature = async () => {
    if (!canEdit) return;
    const prevSignatureData = signatureData;
    const prevSignatureName = signatureName;
    const prevSignatureTimestamp = signatureTimestamp;

    setSignatureData(null);
    setSignatureName('');
    setSignatureTimestamp(null);
    setSignatureDraftData(null);
    setSignatureDraftName('');
    setShowSignatureDialog(false);

    try {
      const { error } = await (supabase as any)
        .from('shipments')
        .update({
          signature_data: null,
          signature_name: null,
          driver_name: null,
          signature_timestamp: null,
        })
        .eq('id', shipmentId);

      if (error) throw error;
      toast({ title: 'Signature cleared' });
      onRefresh();
    } catch (err: any) {
      console.error('[Stage1] signature clear error:', err);
      setSignatureData(prevSignatureData);
      setSignatureName(prevSignatureName);
      setSignatureTimestamp(prevSignatureTimestamp);
      toast({
        variant: 'destructive',
        title: 'Signature Error',
        description: err?.message || 'Failed to clear signature',
      });
    }
  };

  const handleSignatureDialogOpenChange = (open: boolean) => {
    if (open && !canEdit) return;
    if (!open) {
      setShowSignatureDialog(false);
      setSignatureDraftData(null);
      setSignatureDraftName('');
      return;
    }

    // Initialize drafts from the currently-saved signature
    setSignatureDraftData(signatureData);
    setSignatureDraftName(signatureName);
    setShowSignatureDialog(true);
  };

  const formatSignedAt = (iso: string | null) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  };

  // Validation
  const validate = (): string[] => {
    const errors: string[] = [];
    if (!accountId) errors.push('Account is required');
    if (signedPieces <= 0) errors.push('Carrier count must be greater than 0');
    if (dockCount <= 0) errors.push('Dock Count must be greater than 0');
    for (const ex of exceptions) {
      if (!exceptionNotes[ex]?.trim()) {
        errors.push(`Exception note required: ${SHIPMENT_EXCEPTION_CODE_META[ex].label}`);
      }
    }
    // Carrier vs Dock mismatch: block completion until corrected OR exception+note is present.
    if (signedPieces > 0 && dockCount > 0 && signedPieces !== dockCount) {
      const required: ShipmentExceptionCode = dockCount > signedPieces ? 'OVERAGE' : 'SHORTAGE';
      if (!exceptionNotes[required]?.trim()) {
        errors.push(
          `Counts mismatch requires a ${SHIPMENT_EXCEPTION_CODE_META[required].label} exception note (or fix the counts).`
        );
      }
    }
    if (getPhotoUrls(receivingPhotos).length < 1) errors.push('At least 1 photo is required');
    return errors;
  };

  // Complete Stage 1
  const handleComplete = async () => {
    if (!canEdit) return;
    const errors = validate();
    if (errors.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Cannot Complete Stage 1',
        description: errors.join('. '),
      });
      return;
    }

    setCompleting(true);

    try {
      // Flush any pending autosave
      await autosave.saveNow();

      // Persist exception notes even if the user hasn't blurred the textarea yet.
      if (exceptions.length > 0) {
        const results = await Promise.all(
          exceptions.map(async (code) => {
            const note = exceptionNotes[code]?.trim() || null;
            return upsertOpenException(code, note);
          })
        );

        if (results.some((r) => !r)) {
          throw new Error('Failed to save exceptions');
        }
      }

      // Update shipment: set inbound_status to stage1_complete
      // Include all current field values to prevent stale autosave overwrites
      const updateData: Record<string, unknown> = {
        inbound_status: 'stage1_complete',
        account_id: accountId || null,
        signed_pieces: signedPieces,
        received_pieces: dockCount,
        notes: notes || null,
        dock_intake_breakdown: breakdown,
      };

      // Include signature data if captured
      if (signatureData) {
        updateData.signature_data = signatureData;
        updateData.signature_name = signatureName;
      }

      const { error } = await (supabase as any)
        .from('shipments')
        .update(updateData)
        .eq('id', shipmentId);

      if (error) throw error;

      toast({ title: 'Stage 1 Complete', description: 'Dock intake has been recorded.' });
      onComplete();
    } catch (err: any) {
      console.error('[Stage1] complete error:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err?.message || 'Failed to complete Stage 1',
      });
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MaterialIcon name="local_shipping" size="md" className="text-primary" />
                Stage 1 — Dock Intake
                <Badge variant="outline" className="font-mono whitespace-nowrap">{shipmentNumber}</Badge>
                <ShipmentExceptionBadge
                  shipmentId={shipmentId}
                  onClick={onOpenExceptions}
                />
              </CardTitle>
              <CardDescription className="mt-1">
                Record the delivery at the dock. All fields autosave.
              </CardDescription>
            </div>
            <AutosaveIndicator status={autosave.status} onRetry={autosave.retryNow} />
          </div>
        </CardHeader>
      </Card>

      {/* Shipment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MaterialIcon name="business" size="sm" />
            Shipment Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>
              Account <span className="text-red-500">*</span>
            </Label>
            <AccountSelect
              value={accountId}
              onChange={handleAccountChange}
              placeholder="Select account..."
              clearable={false}
              className="w-full"
              disabled={!canEdit}
            />
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="carrier_name">Carrier Name</Label>
              <Input
                id="carrier_name"
                placeholder="Enter carrier..."
                value={carrierName}
                onChange={(e) => handleCarrierNameChange(e.target.value)}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tracking_number">Tracking #</Label>
              <Input
                id="tracking_number"
                placeholder="Enter tracking..."
                value={trackingNumber}
                onChange={(e) => handleTrackingNumberChange(e.target.value)}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="po_number">Reference / PO #</Label>
              <Input
                id="po_number"
                placeholder="Enter reference..."
                value={poNumber}
                onChange={(e) => handlePoNumberChange(e.target.value)}
                disabled={!canEdit}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-6">
            {/* Carrier count */}
            <div className="space-y-2">
              <div className="flex items-center gap-1 justify-center">
                <Label htmlFor="carrier_count">
                  Carrier count <span className="text-red-500">*</span>
                </Label>
                <HelpTip
                  tooltip="Carrier paperwork piece count (what you sign for)."
                  pageKey="receiving.stage1"
                  fieldKey="carrier_count"
                />
              </div>
              <BigCounter
                id="carrier_count"
                value={signedPieces}
                onChange={handleSignedPiecesChange}
                min={0}
                step={1}
                disabled={!canEdit}
              />
            </div>

            {/* Dock Count */}
            <div className="space-y-2">
              <div className="flex items-center gap-1 justify-center">
                <Label htmlFor="dock_count">
                  Dock Count <span className="text-red-500">*</span>
                </Label>
                <HelpTip
                  tooltip="Physical piece count at the dock (Stage 1 actual count)."
                  pageKey="receiving.stage1"
                  fieldKey="dock_count"
                />
              </div>
              <BigCounter
                id="dock_count"
                value={dockCount}
                onChange={handleDockCountChange}
                min={0}
                step={1}
                disabled={!canEdit}
              />
            </div>

            {/* Entry Count */}
            <div className="space-y-2">
              <div className="flex items-center gap-1 justify-center">
                <Label htmlFor="entry_count">Entry Count</Label>
                <HelpTip
                  tooltip="Read-only. Calculated from Stage 2 item rows (each row = 1 carton / package / piece)."
                  pageKey="receiving.stage1"
                  fieldKey="entry_count"
                />
              </div>
              <div className="flex flex-col items-center gap-2">
                <div
                  id="entry_count"
                  className="min-w-20 text-center text-5xl font-bold tabular-nums text-muted-foreground"
                  aria-label="Entry Count (read-only)"
                >
                  {entryCount}
                </div>
                <p className="text-xs text-muted-foreground">Read-only</p>
              </div>
            </div>

            {/* Carrier vs Dock mismatch indicator */}
            {signedPieces > 0 && dockCount > 0 && signedPieces !== dockCount && (
              <div className="flex justify-center">
                <Badge variant="destructive" className="gap-1">
                  <MaterialIcon name="warning" size="sm" />
                  {dockCount > signedPieces ? 'Overage' : 'Shortage'} by {Math.abs(dockCount - signedPieces)}
                </Badge>
              </div>
            )}
          </div>

        </CardContent>
      </Card>

      {/* Mixed Unit Breakdown (optional) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MaterialIcon name="inventory" size="sm" />
            Unit Breakdown (optional)
            <HelpTip
              tooltip="Enter cartons/pallets/crates. Dock Count will auto-calculate as the sum when you use this breakdown (you can still type Carrier count and Dock Count directly)."
              pageKey="receiving.stage1"
              fieldKey="unit_breakdown"
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="cartons">Cartons</Label>
              <Input
                id="cartons"
                type="number"
                min={0}
                value={breakdown.cartons || ''}
                onChange={(e) => handleBreakdownChange('cartons', parseInt(e.target.value) || 0)}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pallets">Pallets</Label>
              <Input
                id="pallets"
                type="number"
                min={0}
                value={breakdown.pallets || ''}
                onChange={(e) => handleBreakdownChange('pallets', parseInt(e.target.value) || 0)}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="crates">Crates</Label>
              <Input
                id="crates"
                type="number"
                min={0}
                value={breakdown.crates || ''}
                onChange={(e) => handleBreakdownChange('crates', parseInt(e.target.value) || 0)}
                disabled={!canEdit}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exceptions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MaterialIcon name="report_problem" size="sm" />
            Exceptions (optional)
            <HelpTip
              tooltip="Select any exceptions observed at the dock. If you select an exception, add a note for each selected chip. Shortage/Overage auto-syncs when Carrier and Dock counts differ."
              pageKey="receiving.stage1"
              fieldKey="exceptions"
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {EXCEPTION_OPTIONS.map((opt) => {
              const isSelected = exceptions.includes(opt.value);
              return (
                <Button
                  key={opt.value}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  className="gap-1.5"
                  onClick={() => toggleException(opt.value)}
                  disabled={!canEdit}
                >
                  <MaterialIcon name={opt.icon} size="sm" />
                  {opt.label}
                </Button>
              );
            })}
          </div>

          {/* Exception notes for selected exceptions */}
          {exceptions.map((ex) => (
            <div key={ex} className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Note for {EXCEPTION_OPTIONS.find((o) => o.value === ex)?.label}
                <span className="text-red-500"> *</span>
              </Label>
              <Textarea
                placeholder="Required: describe the exception..."
                rows={2}
                value={exceptionNotes[ex] || ''}
                onChange={(e) => setExceptionNotes((prev) => ({ ...prev, [ex]: e.target.value }))}
                onBlur={() => void handleExceptionNoteBlur(ex)}
                disabled={!canEdit}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Photos (single field — legacy incoming shipments style) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MaterialIcon name="photo_camera" size="sm" />
            Photos <span className="text-red-500">*</span>
            <Badge variant={getPhotoUrls(receivingPhotos).length >= 1 ? 'default' : 'destructive'}>
              {getPhotoUrls(receivingPhotos).length}
            </Badge>
            <HelpTip
              tooltip="Capture or upload photos (paperwork, condition, etc.)."
              pageKey="receiving.stage1"
              fieldKey="photos"
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {getPhotoUrls(receivingPhotos).length > 0 ? (
            <TaggablePhotoGrid
              photos={receivingPhotos}
              enableTagging={canEdit}
              readonly={!canEdit}
              onPhotosChange={
                canEdit
                  ? async (photos) => {
                      try {
                        await saveReceivingPhotosToShipment(photos);
                      } catch (err: any) {
                        toast({
                          variant: 'destructive',
                          title: 'Photo Error',
                          description: err?.message || 'Failed to save photos',
                        });
                      }
                    }
                  : undefined
              }
            />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No photos yet. At least 1 required.
            </p>
          )}

          {/* Buttons (match Documents layout) */}
          {canEdit && getPhotoUrls(receivingPhotos).length < 20 && (
            <div className="flex gap-2 pt-3">
              <PhotoScannerButton
                entityType="shipment"
                entityId={shipmentId}
                tenantId={profile?.tenant_id}
                existingPhotos={getPhotoUrls(receivingPhotos)}
                maxPhotos={20}
                size="sm"
                variant="outline"
                label="Scan"
                showCount={false}
                className="flex-1"
                onPhotosSaved={async (urls) => {
                  try {
                    await mergeAndSaveReceivingPhotoUrls(urls);
                  } catch (err: any) {
                    toast({
                      variant: 'destructive',
                      title: 'Photo Error',
                      description: err?.message || 'Failed to save photos',
                    });
                  }
                }}
              />
              <PhotoUploadButton
                entityType="shipment"
                entityId={shipmentId}
                tenantId={profile?.tenant_id}
                existingPhotos={getPhotoUrls(receivingPhotos)}
                maxPhotos={20}
                size="sm"
                variant="outline"
                label="Upload"
                className="flex-1"
                showHint={false}
                onPhotosSaved={async (urls) => {
                  try {
                    await mergeAndSaveReceivingPhotoUrls(urls);
                  } catch (err: any) {
                    toast({
                      variant: 'destructive',
                      title: 'Photo Error',
                      description: err?.message || 'Failed to save photos',
                    });
                  }
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MaterialIcon name="description" size="sm" />
            Documents
            <Badge variant="outline">{documents.length}</Badge>
            <HelpTip
              tooltip="Capture or upload delivery paperwork. Tap a document thumbnail to open it, or use the download icon to email/print."
              pageKey="receiving.stage1"
              fieldKey="documents"
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentCapture
            context={{ type: 'shipment', shipmentId, shipmentNumber }}
            maxDocuments={12}
            ocrEnabled={true}
            canEdit={canEdit}
            onDocumentAdded={() => {
              void refetchDocuments();
            }}
            onDocumentRemoved={() => {
              void refetchDocuments();
            }}
          />
        </CardContent>
      </Card>

      {/* Billing (Manager/Admin Only) */}
      {canSeeBilling ? (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MaterialIcon name="attach_money" size="sm" className="text-primary" />
              Billing Calculator
              <HelpTip
                tooltip="Shows billing preview + recorded charges. Use Add Charge/Add Credit to adjust billing. (Manager/Admin only)"
                pageKey="receiving.stage1"
                fieldKey="billing"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setAddChargeOpen(true)}
                disabled={!accountId || !canEdit}
              >
                <MaterialIcon name="attach_money" size="sm" />
                Add Charge
              </Button>
              {canAddCredit ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setAddCreditOpen(true)}
                  disabled={!accountId || !canEdit}
                >
                  <MaterialIcon name="money_off" size="sm" />
                  Add Credit
                </Button>
              ) : null}
            </div>
          </div>

          {accountId ? (
            <BillingCalculator
              shipmentId={shipmentId}
              refreshKey={effectiveBillingRefreshKey}
              title="Billing Calculator"
            />
          ) : (
            <Card>
              <CardContent className="py-4 text-sm text-muted-foreground">
                Select an account to view and edit billing.
              </CardContent>
            </Card>
          )}

          {/* Add Charge Dialog */}
          {accountId ? (
            <AddAddonDialog
              open={addChargeOpen}
              onOpenChange={setAddChargeOpen}
              accountId={accountId}
              shipmentId={shipmentId}
              onSuccess={() => {
                setBillingRefreshKey((prev) => prev + 1);
                onRefresh();
              }}
            />
          ) : null}

          {/* Add Credit Dialog (Admin only) */}
          {accountId ? (
            <AddCreditDialog
              open={addCreditOpen}
              onOpenChange={setAddCreditOpen}
              accountId={accountId}
              shipmentId={shipmentId}
              onSuccess={() => {
                setBillingRefreshKey((prev) => prev + 1);
                onRefresh();
              }}
            />
          ) : null}
        </div>
      ) : null}

      {/* Signature (optional) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MaterialIcon name="draw" size="sm" />
            Signature (optional)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="border rounded-md p-2 bg-white">
            {signatureData ? (
              <img src={signatureData} alt="Signature" className="max-h-24 mx-auto" />
            ) : signatureName.trim() ? (
              <div className="min-h-24 flex items-center justify-center">
                <span className="text-3xl font-cursive italic text-gray-800">
                  {signatureName.trim()}
                </span>
              </div>
            ) : (
              <div className="min-h-24 flex items-center justify-center text-sm text-muted-foreground">
                No signature captured
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-sm text-muted-foreground">
              {signatureName.trim() ? (
                <>
                  Signed by:{' '}
                  <span className="text-foreground">{signatureName.trim()}</span>
                  {formatSignedAt(signatureTimestamp) ? (
                    <>
                      {' '}
                      · Signed at:{' '}
                      <span className="text-foreground">{formatSignedAt(signatureTimestamp)}</span>
                    </>
                  ) : null}
                </>
              ) : (
                <span>Optional</span>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleSignatureDialogOpenChange(true)} disabled={!canEdit}>
                <MaterialIcon name={signatureData || signatureName.trim() ? 'edit' : 'draw'} size="sm" className="mr-2" />
                {signatureData || signatureName.trim() ? 'Edit' : 'Capture'}
              </Button>
              {signatureData || signatureName.trim() ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleClearSignature()}
                  disabled={!canEdit}
                  className="text-red-600 hover:text-red-700"
                >
                  <MaterialIcon name="delete" size="sm" className="mr-1" />
                  Clear
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MaterialIcon name="sticky_note_2" size="sm" />
            Notes (optional)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {accountHighlightShipmentNotes && accountDefaultShipmentNotes?.trim() && (
            <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <div className="font-medium mb-1">Default Shipment Notes</div>
              <p className="whitespace-pre-wrap">{accountDefaultShipmentNotes}</p>
            </div>
          )}
          <Textarea
            placeholder="Add any notes about this delivery..."
            value={notes}
            onChange={(e) => handleNotesUserChange(e.target.value)}
            rows={3}
            disabled={!canEdit}
          />
        </CardContent>
      </Card>

      {/* Complete Stage 1 */}
      {showCompleteButton ? (
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Button
            size="lg"
            onClick={handleComplete}
            disabled={completing || !canEdit}
            className="gap-2"
          >
            {completing ? (
              <MaterialIcon name="progress_activity" size="sm" className="animate-spin" />
            ) : (
              <MaterialIcon name="check_circle" size="sm" />
            )}
            Complete Dock Intake
          </Button>
        </div>
      ) : null}

      {/* Required Exception Note Dialog */}
      <Dialog open={!!pendingRequiredNoteCode} onOpenChange={(open) => !open && setPendingRequiredNoteCode(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MaterialIcon name="edit_note" size="sm" />
              {pendingRequiredNoteCode
                ? `${SHIPMENT_EXCEPTION_CODE_META[pendingRequiredNoteCode].label} requires a note`
                : 'Exception note required'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>
              Note <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={pendingRequiredNote}
              onChange={(e) => setPendingRequiredNote(e.target.value)}
              rows={4}
              placeholder="Please describe what was refused or what the other exception is."
              disabled={!canEdit}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingRequiredNoteCode(null)}>
              Cancel
            </Button>
            <Button onClick={() => void handleSaveRequiredNote()} disabled={!canEdit}>
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Signature Dialog */}
      <Dialog open={showSignatureDialog} onOpenChange={handleSignatureDialogOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MaterialIcon name="draw" size="sm" />
              Delivery Signature
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sig-name">Driver name <span className="text-red-500">*</span></Label>
                <Input
                  id="sig-name"
                  value={signatureDraftName}
                  onChange={(e) => setSignatureDraftName(e.target.value)}
                  placeholder="Driver name (required if drawing)"
                  disabled={!canEdit}
                />
                <p className="text-xs text-muted-foreground">
                  Optional overall. If you draw a signature, Driver name is required.
                </p>
              </div>
              <SignaturePad
                onSignatureChange={(data) => {
                  setSignatureDraftData(data.signatureData);
                  if (data.signatureName) setSignatureDraftName(data.signatureName);
                }}
                initialName={signatureDraftName}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleSignatureDialogOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                void handleSignatureComplete(signatureDraftData, signatureDraftName);
              }}
              disabled={!canEdit || !signatureDraftName.trim() || (!!signatureDraftData && !signatureDraftName.trim())}
            >
              <MaterialIcon name="check" size="sm" className="mr-2" />
              Save Signature
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
