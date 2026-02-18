import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useSearchParams } from 'react-router-dom';
import { Stage1DockIntake } from './Stage1DockIntake';
import type { MatchingParamsUpdate } from './Stage1DockIntake';
import { Stage2DetailedReceiving } from './Stage2DetailedReceiving';
import type { ItemMatchingParams } from './Stage2DetailedReceiving';
import { ExceptionsTab } from './ExceptionsTab';
import { useShipmentExceptions } from '@/hooks/useShipmentExceptions';
import DockIntakeMatchingPanel from '@/components/incoming/DockIntakeMatchingPanel';
import type { CandidateParams } from '@/hooks/useInboundCandidates';
import { downloadReceivingPdf, storeReceivingPdf, type ReceivingPdfData } from '@/lib/receivingPdf';
import { queueReceivingDiscrepancyAlert, queueShipmentReceivedAlert } from '@/lib/alertQueue';
import { ShipmentExceptionBadge } from '@/components/shipments/ShipmentExceptionBadge';
import { ShipmentNumberBadge } from '@/components/shipments/ShipmentNumberBadge';
import { ShipmentNotesSection } from '@/components/shipments/ShipmentNotesSection';

interface ShipmentData {
  id: string;
  shipment_number: string;
  inbound_status: string | null;
  inbound_kind: string | null;
  account_id: string | null;
  vendor_name: string | null;
  signed_pieces: number | null;
  received_pieces: number | null;
  driver_name: string | null;
  signature_data: string | null;
  signature_name: string | null;
  dock_intake_breakdown: Record<string, unknown> | null;
  notes: string | null;
  warehouse_id: string | null;
  sidemark_id: string | null;
  metadata: Record<string, unknown> | null;
  shipment_exception_type: string | null;
}

interface ReceivingStageRouterProps {
  shipmentId: string;
}

type InboundStatus = 'draft' | 'stage1_complete' | 'receiving' | 'closed';

export function ReceivingStageRouter({ shipmentId }: ReceivingStageRouterProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [shipment, setShipment] = useState<ShipmentData | null>(null);
  const [accountName, setAccountName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'receiving' | 'exceptions' | 'notes'>(() => {
    const tab = searchParams.get('tab');
    if (tab === 'exceptions') return 'exceptions';
    if (tab === 'notes') return 'notes';
    return 'receiving';
  });
  const [mobileMatchingOpen, setMobileMatchingOpen] = useState(false);
  const [pdfRetrying, setPdfRetrying] = useState(false);
  const { openCount } = useShipmentExceptions(shipmentId);

  // Live matching params from Stage 1 fields (updated as user types)
  const [liveMatchingParams, setLiveMatchingParams] = useState<MatchingParamsUpdate | null>(null);

  // Item-level matching params from Stage 2 (updated as user enters item details)
  const [itemMatchingParams, setItemMatchingParams] = useState<ItemMatchingParams | null>(null);

  // Stage 2 row count (Entry Count) computed from Stage 2 items table
  const [entryCount, setEntryCount] = useState<number>(0);

  // Billing calculator refresh key (shared across Stage 1 + Stage 2)
  // Stage 2 autosaves bump this so Stage 1 billing preview updates in real time.
  const [billingRefreshKey, setBillingRefreshKey] = useState(0);

  // Stage 1 UI state:
  // - Stage 1 always defaults to expanded on page load.
  // - Once Stage 2 is open (receiving/closed), users can minimize Stage 1 into a compact summary.
  const [stage1Expanded, setStage1Expanded] = useState(true);

  // Stage 2 UI state (expanded/collapsed) persists locally per shipment
  const stage2ExpandedKey = `receiving.stage2.expanded.${shipmentId}`;
  const [stage2Expanded, setStage2Expanded] = useState<boolean>(false);
  const [startingStage2, setStartingStage2] = useState(false);
  const [closedEditMode, setClosedEditMode] = useState(false);

  useEffect(() => {
    // Always expand Stage 1 when opening the intake page.
    setStage1Expanded(true);
  }, [shipmentId]);

  useEffect(() => {
    // Stage 1 can only be minimized once Stage 2 is open.
    const inboundStatus = (shipment?.inbound_status || 'draft') as InboundStatus;
    if (inboundStatus !== 'receiving' && inboundStatus !== 'closed') {
      setStage1Expanded(true);
    }
  }, [shipment?.inbound_status]);

  useEffect(() => {
    // Leaving closed state should re-lock edits by default.
    if (shipment?.inbound_status !== 'closed') {
      setClosedEditMode(false);
    }
  }, [shipment?.inbound_status]);

  const fetchShipment = useCallback(async () => {
    if (!shipmentId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('id', shipmentId)
        .single();

      if (error) throw error;
      setShipment(data as any);

      // Fetch account name
      if ((data as any).account_id) {
        const { data: account } = await supabase
          .from('accounts')
          .select('account_name')
          .eq('id', (data as any).account_id)
          .single();
        setAccountName(account?.account_name || null);
      }
    } catch (err) {
      console.error('[ReceivingStageRouter] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [shipmentId]);

  useEffect(() => {
    fetchShipment();
  }, [fetchShipment]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    setActiveTab(tab === 'exceptions' ? 'exceptions' : tab === 'notes' ? 'notes' : 'receiving');
  }, [searchParams]);

  const setTab = (tab: 'receiving' | 'exceptions' | 'notes') => {
    setActiveTab(tab);
    const next = new URLSearchParams(searchParams);
    if (tab === 'exceptions') next.set('tab', 'exceptions');
    else if (tab === 'notes') next.set('tab', 'notes');
    else next.delete('tab');
    setSearchParams(next, { replace: true });
  };

  const handleStageChange = () => {
    // Reset item-level params when transitioning stages
    setItemMatchingParams(null);
    fetchShipment();
  };

  // Handle live matching param updates from Stage 1
  const handleMatchingParamsChange = useCallback((params: MatchingParamsUpdate) => {
    setLiveMatchingParams(params);
  }, []);

  // Handle item-level matching param updates from Stage 2
  const handleItemMatchingParamsChange = useCallback((params: ItemMatchingParams) => {
    setItemMatchingParams(params);
  }, []);

  // Stage 2 expansion defaults:
  // - Not started (draft/stage1_complete): collapsed.
  // - Started (receiving): expanded unless user collapsed locally (localStorage).
  useEffect(() => {
    const inboundStatus = (shipment?.inbound_status || 'draft') as InboundStatus;

    if (inboundStatus !== 'receiving' && inboundStatus !== 'closed') {
      setStage2Expanded(false);
      setEntryCount(0);
      return;
    }

    try {
      const persisted = localStorage.getItem(stage2ExpandedKey);
      setStage2Expanded(persisted == null ? true : persisted === 'true');
    } catch {
      setStage2Expanded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipment?.inbound_status, stage2ExpandedKey]);

  const handleStage2ExpandedChange = (open: boolean) => {
    setStage2Expanded(open);
    try {
      localStorage.setItem(stage2ExpandedKey, String(open));
    } catch {
      // Non-blocking (e.g., private browsing / storage disabled)
    }
  };

  const handleStartStage2 = async () => {
    if (startingStage2) return;
    setStartingStage2(true);
    try {
      const { error } = await supabase
        .from('shipments')
        .update({ inbound_status: 'receiving' } as any)
        .eq('id', shipmentId);

      if (error) throw error;

      try {
        localStorage.setItem(stage2ExpandedKey, 'true');
      } catch {
        // Non-blocking
      }

      setStage2Expanded(true);
      toast({ title: 'Stage 2 started', description: 'Detailed receiving is now available.' });
      handleStageChange();
    } catch (err: any) {
      console.error('[ReceivingStageRouter] start stage2 error:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err?.message || 'Failed to start Stage 2',
      });
    } finally {
      setStartingStage2(false);
    }
  };

  const buildPdfData = async (s: ShipmentData): Promise<ReceivingPdfData> => {
    // Fetch company info for PDF
    const { data: company } = await supabase
      .from('tenant_company_settings')
      .select('company_name, company_address, company_phone, company_email, logo_url')
      .eq('tenant_id', profile!.tenant_id)
      .maybeSingle();

    // Fetch warehouse name
    let warehouseName: string | null = null;
    if (s.warehouse_id) {
      const { data: wh } = await supabase
        .from('warehouses')
        .select('name')
        .eq('id', s.warehouse_id)
        .single();
      warehouseName = wh?.name || null;
    }

    // Fetch items
    const { data: items } = await (supabase as any)
      .from('shipment_items')
      .select('expected_description, actual_quantity, expected_vendor, expected_sidemark')
      .eq('shipment_id', shipmentId)
      .eq('status', 'received');

    return {
      shipmentNumber: s.shipment_number,
      vendorName: s.vendor_name,
      accountName: accountName,
      signedPieces: s.signed_pieces,
      receivedPieces: s.received_pieces,
      driverName: s.driver_name,
      companyName: company?.company_name || 'Stride WMS',
      companyAddress: company?.company_address || null,
      companyPhone: company?.company_phone || null,
      companyEmail: company?.company_email || null,
      warehouseName,
      signatureData: s.signature_data,
      signatureName: s.signature_name || null,
      items: (items || []).map((i: any) => ({
        description: i.expected_description || '-',
        quantity: i.actual_quantity || 0,
        vendor: i.expected_vendor || null,
        sidemark: i.expected_sidemark || null,
      })),
      receivedAt: new Date().toISOString(),
    };
  };

  const handleReceivingComplete = async () => {
    // Generate + store PDF (non-blocking)
    if (shipment && profile?.tenant_id) {
      try {
        const pdfData = await buildPdfData(shipment);
        const result = await storeReceivingPdf(pdfData, shipmentId, profile.tenant_id, profile.id);
        if (!result.success) {
          toast({
            variant: 'destructive',
            title: 'Receiving Document not saved',
            description: 'Receiving was completed, but the Receiving Document could not be saved. You can retry from the PDF section.',
          });
        }
      } catch {
        console.warn('[ReceivingStageRouter] PDF generation failed (non-blocking)');
      }

      // Fire alerts (non-blocking)
      try {
        // Client + internal: Shipment received notification (with optional Exceptions section)
        void queueShipmentReceivedAlert(
          profile.tenant_id,
          shipmentId,
          shipment.shipment_number,
          entryCount
        );

        const { data: exceptions } = await (supabase as any)
          .from('shipment_exceptions')
          .select('id')
          .eq('shipment_id', shipmentId)
          .eq('tenant_id', profile.tenant_id)
          .eq('status', 'open');

        if (exceptions && exceptions.length > 0) {
          queueReceivingDiscrepancyAlert(
            profile.tenant_id,
            shipmentId,
            shipment.shipment_number,
            exceptions.length
          );
        }
      } catch {
        // Alert failure is non-blocking
      }
    }

    fetchShipment();
  };

  // PDF download for closed shipments
  const handleDownloadPdf = async () => {
    if (!shipment || !profile?.tenant_id) return;

    // Check if PDF exists in metadata
    const meta = shipment.metadata as Record<string, unknown> | null;
    const pdfKey = meta?.receiving_pdf_key as string | undefined;

    if (pdfKey) {
      // Download from storage
      const { data, error } = await supabase.storage
        .from('documents-private')
        .createSignedUrl(pdfKey, 300);

      if (!error && data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
        return;
      }
    }

    // Fallback: generate + download directly
    try {
      const pdfData = await buildPdfData(shipment);
      downloadReceivingPdf(pdfData);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'PDF Error',
        description: err?.message || 'Failed to generate PDF',
      });
    }
  };

  // Retry PDF generation for closed shipments
  const handleRetryPdf = async () => {
    if (!shipment || !profile?.tenant_id) return;
    setPdfRetrying(true);
    try {
      const pdfData = await buildPdfData(shipment);
      const result = await storeReceivingPdf(pdfData, shipmentId, profile.tenant_id, profile.id);
      if (result.success) {
        toast({ title: 'PDF Generated', description: 'Receiving PDF has been stored.' });
        fetchShipment(); // Refresh metadata
      } else {
        throw new Error('Storage failed');
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'PDF Retry Failed',
        description: err?.message || 'Could not generate PDF. Try again later.',
      });
    } finally {
      setPdfRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <MaterialIcon name="progress_activity" size="lg" className="animate-spin text-primary" />
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <MaterialIcon name="error" size="xl" className="mb-2 opacity-40" />
        <p>Shipment not found.</p>
      </div>
    );
  }

  const status = (shipment.inbound_status || 'draft') as InboundStatus;

  // Build matching params: use live values from Stage 1 form when available, fallback to persisted shipment data
  const matchingParams: CandidateParams = {
    accountId: liveMatchingParams?.accountId ?? shipment.account_id,
    pieces: liveMatchingParams?.pieces ?? shipment.signed_pieces,
    // Item-level params from Stage 2
    itemDescription: itemMatchingParams?.itemDescription || null,
    itemVendor: itemMatchingParams?.itemVendor || null,
  };

  const hasPdf = !!(shipment.metadata as Record<string, unknown> | null)?.receiving_pdf_key;

  // Matching panel is useful throughout intake + receiving (hide only once closed).
  const showMatchingPanel = status !== 'closed';

  // Shared matching panel component
  const matchingPanelContent = showMatchingPanel ? (
    <DockIntakeMatchingPanel
      dockIntakeId={shipmentId}
      params={matchingParams}
      onLinked={fetchShipment}
      showItemRefinement={status === 'receiving'}
    />
  ) : null;

  // Render based on inbound_status
  const renderStageContent = () => {
    switch (status) {
      case 'draft':
        return (
          <div className="space-y-6">
            <Stage1DockIntake
              shipmentId={shipmentId}
              shipmentNumber={shipment.shipment_number}
              shipment={shipment as any}
              onComplete={handleStageChange}
              onRefresh={fetchShipment}
              onMatchingParamsChange={handleMatchingParamsChange}
              onOpenExceptions={() => setTab('exceptions')}
              entryCount={entryCount}
              externalBillingRefreshKey={billingRefreshKey}
              showCompleteButton={true}
            />

            <Card className="border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MaterialIcon name="inventory_2" size="sm" />
                  Stage 2 — Detailed Receiving
                </CardTitle>
                <CardDescription>
                  Complete Stage 1 to unlock Stage 2 item entry.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        );

      case 'stage1_complete':
        return (
          <div className="space-y-6">
            <Stage1DockIntake
              shipmentId={shipmentId}
              shipmentNumber={shipment.shipment_number}
              shipment={shipment as any}
              onComplete={handleStageChange}
              onRefresh={fetchShipment}
              onMatchingParamsChange={handleMatchingParamsChange}
              onOpenExceptions={() => setTab('exceptions')}
              entryCount={entryCount}
              externalBillingRefreshKey={billingRefreshKey}
              showCompleteButton={false}
            />

            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <MaterialIcon name="inventory_2" size="sm" className="text-primary" />
                      Stage 2 — Detailed Receiving
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Stage 1 is complete. Tap Start Stage 2 when you’re ready to enter item rows.
                    </CardDescription>
                  </div>
                  <Button onClick={() => void handleStartStage2()} disabled={startingStage2} className="gap-2">
                    {startingStage2 ? (
                      <MaterialIcon name="progress_activity" size="sm" className="animate-spin" />
                    ) : (
                      <MaterialIcon name="play_arrow" size="sm" />
                    )}
                    Start Stage 2
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Entry Count will update automatically as you add/remove Stage 2 rows.
              </CardContent>
            </Card>
          </div>
        );

      case 'receiving':
        {
          const carrierCount = liveMatchingParams?.pieces ?? shipment.signed_pieces ?? 0;
          const dockCount = liveMatchingParams?.dockCount ?? shipment.received_pieces ?? 0;
          const mismatch =
            (Number(carrierCount) || 0) > 0 &&
            (Number(dockCount) || 0) > 0 &&
            Number(carrierCount) !== Number(dockCount);
          const mismatchLabel = mismatch
            ? dockCount > carrierCount
              ? `Overage by ${dockCount - carrierCount}`
              : `Shortage by ${carrierCount - dockCount}`
            : null;

          const stage1CompactSummary = (
            <Card className="border-dashed">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap text-sm">
                    <MaterialIcon name="local_shipping" size="sm" className="text-primary" />
                    <span className="font-medium">Stage 1</span>
                    <Badge variant="outline" className="font-mono whitespace-nowrap">
                      {shipment.shipment_number}
                    </Badge>
                    <Badge variant="outline" className="h-5 text-xs">
                      Carrier {carrierCount || 0}
                    </Badge>
                    <Badge variant="outline" className="h-5 text-xs">
                      Dock {dockCount || 0}
                    </Badge>
                    <Badge variant={entryCount > 0 ? 'default' : 'outline'} className="h-5 text-xs">
                      Entry {entryCount}
                    </Badge>
                    {mismatchLabel ? (
                      <Badge variant="destructive" className="h-5 text-xs gap-1">
                        <MaterialIcon name="warning" size="sm" />
                        {mismatchLabel}
                      </Badge>
                    ) : null}
                    <ShipmentExceptionBadge shipmentId={shipmentId} onClick={() => setTab('exceptions')} />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setStage1Expanded(true)}
                  >
                    <MaterialIcon name="expand_more" size="sm" />
                    Expand Stage 1
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>
                  <span className="font-medium text-foreground">Account:</span> {accountName || '-'}
                </span>
                {shipment.vendor_name ? (
                  <span>
                    <span className="font-medium text-foreground">Vendor:</span> {shipment.vendor_name}
                  </span>
                ) : null}
                {(shipment as any).carrier ? (
                  <span>
                    <span className="font-medium text-foreground">Carrier:</span> {(shipment as any).carrier}
                  </span>
                ) : null}
                {(shipment as any).tracking_number ? (
                  <span>
                    <span className="font-medium text-foreground">Tracking:</span>{' '}
                    {(shipment as any).tracking_number}
                  </span>
                ) : null}
                {(shipment as any).po_number ? (
                  <span>
                    <span className="font-medium text-foreground">PO/Ref:</span> {(shipment as any).po_number}
                  </span>
                ) : null}
                {shipment.driver_name ? (
                  <span>
                    <span className="font-medium text-foreground">Driver:</span> {shipment.driver_name}
                  </span>
                ) : null}
                <span>
                  <span className="font-medium text-foreground">Signature:</span>{' '}
                  {shipment.signature_data || shipment.signature_name ? 'Captured' : 'None'}
                </span>
              </CardContent>
            </Card>
          );

          return (
            <div className="space-y-6">
              {stage1Expanded ? (
                <>
                  <Stage1DockIntake
                    shipmentId={shipmentId}
                    shipmentNumber={shipment.shipment_number}
                    shipment={shipment as any}
                    onComplete={handleStageChange}
                    onRefresh={fetchShipment}
                    onMatchingParamsChange={handleMatchingParamsChange}
                    onOpenExceptions={() => setTab('exceptions')}
                    entryCount={entryCount}
                    externalBillingRefreshKey={billingRefreshKey}
                    showCompleteButton={false}
                  />
                  <div className="flex justify-end px-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setStage1Expanded(false)}
                    >
                      <MaterialIcon name="expand_less" size="sm" />
                      Minimize Stage 1
                    </Button>
                  </div>
                </>
              ) : (
                stage1CompactSummary
              )}

              <Collapsible open={stage2Expanded} onOpenChange={handleStage2ExpandedChange}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
                  <div className="flex items-center gap-2 text-sm">
                    <MaterialIcon name="inventory_2" size="sm" className="text-primary" />
                    <span className="font-medium">Stage 2</span>
                    <Badge variant={entryCount > 0 ? 'default' : 'outline'} className="h-5 text-xs">
                      Entry {entryCount}
                    </Badge>
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <MaterialIcon name={stage2Expanded ? 'expand_less' : 'expand_more'} size="sm" />
                      {stage2Expanded ? 'Minimize Stage 2' : 'Expand Stage 2'}
                    </Button>
                  </CollapsibleTrigger>
                </div>

                <CollapsibleContent forceMount className="mt-4">
                  <Stage2DetailedReceiving
                    shipmentId={shipmentId}
                    shipmentNumber={shipment.shipment_number}
                    shipment={shipment as any}
                    dockCount={liveMatchingParams?.dockCount ?? shipment.received_pieces ?? null}
                    onComplete={handleReceivingComplete}
                    onRefresh={fetchShipment}
                    onItemMatchingParamsChange={handleItemMatchingParamsChange}
                    onEntryCountChange={setEntryCount}
                    onOpenExceptions={() => setTab('exceptions')}
                    onOpenNotes={() => setTab('notes')}
                    onBillingRefresh={() => setBillingRefreshKey((prev) => prev + 1)}
                  />
                </CollapsibleContent>
              </Collapsible>
            </div>
          );
        }

      case 'closed':
        {
          const carrierCount = liveMatchingParams?.pieces ?? shipment.signed_pieces ?? 0;
          const dockCount = liveMatchingParams?.dockCount ?? shipment.received_pieces ?? 0;
          const mismatch =
            (Number(carrierCount) || 0) > 0 &&
            (Number(dockCount) || 0) > 0 &&
            Number(carrierCount) !== Number(dockCount);
          const mismatchLabel = mismatch
            ? dockCount > carrierCount
              ? `Overage by ${dockCount - carrierCount}`
              : `Shortage by ${carrierCount - dockCount}`
            : null;

          const stage1CompactSummary = (
            <Card className="border-dashed">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap text-sm">
                    <MaterialIcon name="local_shipping" size="sm" className="text-primary" />
                    <span className="font-medium">Stage 1</span>
                    <Badge variant="outline" className="font-mono whitespace-nowrap">
                      {shipment.shipment_number}
                    </Badge>
                    <Badge variant="outline" className="h-5 text-xs">
                      Carrier {carrierCount || 0}
                    </Badge>
                    <Badge variant="outline" className="h-5 text-xs">
                      Dock {dockCount || 0}
                    </Badge>
                    <Badge variant={entryCount > 0 ? 'default' : 'outline'} className="h-5 text-xs">
                      Entry {entryCount}
                    </Badge>
                    {mismatchLabel ? (
                      <Badge variant="destructive" className="h-5 text-xs gap-1">
                        <MaterialIcon name="warning" size="sm" />
                        {mismatchLabel}
                      </Badge>
                    ) : null}
                    <ShipmentExceptionBadge shipmentId={shipmentId} onClick={() => setTab('exceptions')} />
                    {closedEditMode ? (
                      <Badge variant="secondary" className="h-5 text-xs">
                        Editing unlocked
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="h-5 text-xs">
                        Read-only
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setStage1Expanded(true)}
                  >
                    <MaterialIcon name="expand_more" size="sm" />
                    Expand Stage 1
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>
                  <span className="font-medium text-foreground">Account:</span> {accountName || '-'}
                </span>
                {shipment.vendor_name ? (
                  <span>
                    <span className="font-medium text-foreground">Vendor:</span> {shipment.vendor_name}
                  </span>
                ) : null}
                {(shipment as any).carrier ? (
                  <span>
                    <span className="font-medium text-foreground">Carrier:</span> {(shipment as any).carrier}
                  </span>
                ) : null}
                {(shipment as any).tracking_number ? (
                  <span>
                    <span className="font-medium text-foreground">Tracking:</span>{' '}
                    {(shipment as any).tracking_number}
                  </span>
                ) : null}
                {(shipment as any).po_number ? (
                  <span>
                    <span className="font-medium text-foreground">PO/Ref:</span> {(shipment as any).po_number}
                  </span>
                ) : null}
                {shipment.driver_name ? (
                  <span>
                    <span className="font-medium text-foreground">Driver:</span> {shipment.driver_name}
                  </span>
                ) : null}
                <span>
                  <span className="font-medium text-foreground">Signature:</span>{' '}
                  {shipment.signature_data || shipment.signature_name ? 'Captured' : 'None'}
                </span>
              </CardContent>
            </Card>
          );

          return (
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <MaterialIcon name="check_circle" size="sm" className="text-green-500" />
                        Receiving Complete
                        <Badge variant="outline" className="font-mono whitespace-nowrap">
                          {shipment.shipment_number}
                        </Badge>
                        {closedEditMode ? (
                          <Badge variant="secondary" className="text-xs">
                            Editing unlocked
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Read-only
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        This dock intake is closed. You can still view it, and optionally unlock edits.
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
                        <MaterialIcon name="picture_as_pdf" size="sm" className="mr-2" />
                        {hasPdf ? 'Download PDF' : 'Generate PDF'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleRetryPdf} disabled={pdfRetrying}>
                        {pdfRetrying ? (
                          <MaterialIcon name="progress_activity" size="sm" className="mr-2 animate-spin" />
                        ) : (
                          <MaterialIcon name="refresh" size="sm" className="mr-2" />
                        )}
                        Regenerate PDF
                      </Button>
                      <Button
                        variant={closedEditMode ? 'secondary' : 'default'}
                        size="sm"
                        onClick={() => setClosedEditMode((prev) => !prev)}
                      >
                        <MaterialIcon name={closedEditMode ? 'lock' : 'edit'} size="sm" className="mr-2" />
                        {closedEditMode ? 'Done' : 'Edit'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span>Signed: {shipment.signed_pieces ?? '-'}</span>
                  <span>Dock: {shipment.received_pieces ?? '-'}</span>
                  <span>Entry: {entryCount}</span>
                </CardContent>
              </Card>

              {stage1Expanded ? (
                <>
                  <Stage1DockIntake
                    shipmentId={shipmentId}
                    shipmentNumber={shipment.shipment_number}
                    shipment={shipment as any}
                    onComplete={handleStageChange}
                    onRefresh={fetchShipment}
                    onMatchingParamsChange={handleMatchingParamsChange}
                    onOpenExceptions={() => setTab('exceptions')}
                    entryCount={entryCount}
                    externalBillingRefreshKey={billingRefreshKey}
                    showCompleteButton={false}
                    readOnly={!closedEditMode}
                  />
                  <div className="flex justify-end px-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setStage1Expanded(false)}
                    >
                      <MaterialIcon name="expand_less" size="sm" />
                      Minimize Stage 1
                    </Button>
                  </div>
                </>
              ) : (
                stage1CompactSummary
              )}

              <Collapsible open={stage2Expanded} onOpenChange={handleStage2ExpandedChange}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
                  <div className="flex items-center gap-2 text-sm">
                    <MaterialIcon name="inventory_2" size="sm" className="text-primary" />
                    <span className="font-medium">Stage 2</span>
                    <Badge variant={entryCount > 0 ? 'default' : 'outline'} className="h-5 text-xs">
                      Entry {entryCount}
                    </Badge>
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <MaterialIcon name={stage2Expanded ? 'expand_less' : 'expand_more'} size="sm" />
                      {stage2Expanded ? 'Minimize Stage 2' : 'Expand Stage 2'}
                    </Button>
                  </CollapsibleTrigger>
                </div>

                <CollapsibleContent forceMount className="mt-4">
                  <Stage2DetailedReceiving
                    shipmentId={shipmentId}
                    shipmentNumber={shipment.shipment_number}
                    shipment={shipment as any}
                    dockCount={liveMatchingParams?.dockCount ?? shipment.received_pieces ?? null}
                    onComplete={handleReceivingComplete}
                    onRefresh={fetchShipment}
                    onItemMatchingParamsChange={handleItemMatchingParamsChange}
                    onEntryCountChange={setEntryCount}
                    onOpenExceptions={() => setTab('exceptions')}
                    onOpenNotes={() => setTab('notes')}
                    onBillingRefresh={() => setBillingRefreshKey((prev) => prev + 1)}
                    readOnly={!closedEditMode}
                    showCompleteButton={false}
                  />
                </CollapsibleContent>
              </Collapsible>
            </div>
          );
        }

      default:
        return (
          <div className="text-center py-12 text-muted-foreground">
            <p>Unknown status: {status}</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <ShipmentNumberBadge
          shipmentNumber={shipment.shipment_number}
          exceptionType={shipment.shipment_exception_type}
        />
        <ShipmentExceptionBadge
          shipmentId={shipmentId}
          onClick={() => setTab('exceptions')}
        />
      </div>
    <Tabs value={activeTab} onValueChange={(value) => setTab(value as 'receiving' | 'exceptions' | 'notes')}>
      <TabsList className="flex-wrap h-auto gap-1 mb-4">
        <TabsTrigger value="receiving" className="gap-2">
          <MaterialIcon name="inventory_2" size="sm" />
          Receiving
        </TabsTrigger>
        <TabsTrigger value="exceptions" className="gap-2">
          <MaterialIcon name="report_problem" size="sm" />
          Exceptions
          {openCount > 0 && (
            <Badge variant="destructive" className="ml-1 h-5 min-w-5 text-xs">
              {openCount}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="notes" className="gap-2">
          <MaterialIcon name="chat" size="sm" />
          Notes
        </TabsTrigger>
      </TabsList>

      <TabsContent value="receiving">
        {showMatchingPanel ? (
          <>
            <div className="grid gap-6 lg:grid-cols-[1fr,380px]">
              {renderStageContent()}
              {/* Desktop: inline matching panel */}
              <div className="hidden lg:block">
                <div className="sticky top-4">
                  {matchingPanelContent}
                </div>
              </div>
            </div>

            {/* Mobile: FAB to open matching panel */}
            <div className="fixed bottom-6 right-6 lg:hidden z-40">
              <Button
                size="lg"
                className="rounded-full h-14 w-14 shadow-lg"
                onClick={() => setMobileMatchingOpen(true)}
              >
                <MaterialIcon name="search" size="md" />
              </Button>
            </div>

            {/* Mobile: matching bottom sheet */}
            <Sheet open={mobileMatchingOpen} onOpenChange={setMobileMatchingOpen}>
              <SheetContent
                side="bottom"
                className="h-auto max-h-[85vh] rounded-t-xl"
              >
                <SheetHeader>
                  <SheetTitle>Matching Candidates</SheetTitle>
                </SheetHeader>
                <div className="mt-4 overflow-y-auto max-h-[calc(85vh-80px)]">
                  <DockIntakeMatchingPanel
                    dockIntakeId={shipmentId}
                    params={matchingParams}
                    onLinked={() => {
                      fetchShipment();
                      setMobileMatchingOpen(false);
                    }}
                    showItemRefinement={status === 'receiving'}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </>
        ) : (
          renderStageContent()
        )}
      </TabsContent>

      <TabsContent value="exceptions">
        <ExceptionsTab shipmentId={shipmentId} />
      </TabsContent>

      <TabsContent value="notes">
        {shipment ? (
          <ShipmentNotesSection shipmentId={shipmentId} accountId={shipment.account_id} />
        ) : null}
      </TabsContent>
    </Tabs>
    </div>
  );
}
