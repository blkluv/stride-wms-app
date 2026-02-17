import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useReceivingSession } from '@/hooks/useReceivingSession';
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions';
import { useItemDisplaySettings } from '@/hooks/useItemDisplaySettings';
import {
  type ItemColumnKey,
  getColumnLabel,
  getViewById,
  getVisibleColumnsForView,
} from '@/lib/items/itemDisplaySettings';
import { isValidUuid, cn } from '@/lib/utils';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AddAddonDialog } from '@/components/billing/AddAddonDialog';
import { AddCreditDialog } from '@/components/billing/AddCreditDialog';
import { BillingCalculator } from '@/components/billing/BillingCalculator';
import { ShipmentCoverageDialog } from '@/components/shipments/ShipmentCoverageDialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { DocumentCapture } from '@/components/scanner/DocumentCapture';
import { PhotoScannerButton } from '@/components/common/PhotoScannerButton';
import { PhotoUploadButton } from '@/components/common/PhotoUploadButton';
import { TaggablePhotoGrid, TaggablePhoto, getPhotoUrls } from '@/components/common/TaggablePhotoGrid';
import { PrintLabelsDialog } from '@/components/inventory/PrintLabelsDialog';
import { ItemLabelData } from '@/lib/labelGenerator';
import { AddShipmentItemDialog } from '@/components/shipments/AddShipmentItemDialog';
import { ShipmentItemRow } from '@/components/shipments/ShipmentItemRow';
import { ReassignAccountDialog } from '@/components/common/ReassignAccountDialog';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { EntityActivityFeed } from '@/components/activity/EntityActivityFeed';
import { SaveButton } from '@/components/ui/SaveButton';
import { SignatureDialog } from '@/components/shipments/SignatureDialog';
import { generateReleasePdf, ReleasePdfData, ReleasePdfItem } from '@/lib/releasePdf';
import { QRScanner } from '@/components/scan/QRScanner';
import { useLocations } from '@/hooks/useLocations';
import { useDocuments } from '@/hooks/useDocuments';
import { hapticError, hapticSuccess } from '@/lib/haptics';
import { HelpButton, usePromptContextSafe } from '@/components/prompts';
import { SOPValidationDialog, SOPBlocker } from '@/components/common/SOPValidationDialog';
import { ShipmentExceptionBadge } from '@/components/shipments/ShipmentExceptionBadge';
import { ShipmentExceptionsChips } from '@/components/shipments/ShipmentExceptionsChips';
import { createCharges } from '@/services/billing';
import { BILLING_DISABLED_ERROR, getEffectiveRate } from '@/lib/billing/chargeTypeUtils';
import { queueAlert, queueBillingEventAlert } from '@/lib/alertQueue';

// ============================================
// TYPES
// ============================================

interface ShipmentItem {
  id: string;
  expected_description: string | null;
  expected_vendor: string | null;
  expected_sidemark: string | null;
  expected_class_id: string | null;
  expected_quantity: number;
  actual_quantity: number | null;
  status: string;
  item_id: string | null;
  expected_class?: {
    id: string;
    code: string;
    name: string;
  } | null;
  item?: {
    id: string;
    item_code: string;
    description: string | null;
    vendor: string | null;
    sidemark: string | null;
    room: string | null;
    class_id: string | null;
    declared_value: number | null;
    coverage_type: string | null;
    current_location?: { code: string } | null;
    account?: { account_name: string } | null;
    class?: { id: string; code: string; name: string } | null;
  } | null;
}

// Type adapter to match ShipmentItemRow expected interface
type ShipmentItemRowData = ShipmentItem & {
  expected_quantity: number | null;
};

// Local type for received item tracking in UI
interface ReceivedItemData {
  shipment_item_id: string;
  expected_description: string | null;
  expected_quantity: number;
  actual_quantity: number;
  expected_vendor: string | null;
  expected_sidemark: string | null;
  expected_item_type_id: string | null;
  notes: string | null;
  status: 'received' | 'partial' | 'missing';
}

type ScanListSortField = 'item_code' | 'location';

interface Shipment {
  id: string;
  shipment_number: string;
  shipment_type: string;
  status: string;
  account_id: string | null;
  warehouse_id: string | null;
  // Outbound / release (SOP) fields
  customer_authorized: boolean | null;
  customer_authorized_at: string | null;
  customer_authorized_by: string | null;
  driver_name: string | null;
  liability_accepted: boolean | null;
  release_to_name: string | null;
  release_to_email: string | null;
  carrier: string | null;
  tracking_number: string | null;
  po_number: string | null;
  expected_arrival_date: string | null;
  received_at: string | null;
  shipped_at: string | null;
  notes: string | null;
  receiving_notes: string | null;
  receiving_photos: (string | TaggablePhoto)[] | null;
  receiving_documents: string[] | null;
  release_type: string | null;
  released_to: string | null;
  release_to_phone: string | null;
  destination_name: string | null;
  origin_name: string | null;
  scheduled_date: string | null;
  sidemark_id: string | null;
  sidemark: string | null;
  signature_data: string | null;
  signature_name: string | null;
  signature_timestamp: string | null;
  created_at: string;
  accounts?: { id: string; account_name: string; account_code: string } | null;
  warehouses?: { id: string; name: string } | null;
}

interface LastScanResult {
  itemCode: string;
  result: 'success' | 'duplicate' | 'invalid' | 'error';
  message: string;
}

// ============================================
// COMPONENT
// ============================================

export default function ShipmentDetail() {
  const { id } = useParams<{ id: string }>();

  // ============================================
  // RENDER-TIME UUID GUARD - executes before any hooks
  // ============================================
  if (!id || !isValidUuid(id)) {
    return <Navigate to="/shipments" replace />;
  }

  // Now we know id is a valid UUID - safe to use hooks
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const { hasPermission, hasRole } = usePermissions();

  // Tenant-managed item list views (systemwide)
  const { settings: itemDisplaySettings, defaultViewId: defaultItemViewId, loading: itemDisplayLoading } = useItemDisplaySettings();
  const [activeItemViewId, setActiveItemViewId] = useState<string>('');

  useEffect(() => {
    if (!activeItemViewId && defaultItemViewId) {
      setActiveItemViewId(defaultItemViewId);
    }
  }, [defaultItemViewId, activeItemViewId]);

  const activeItemView = useMemo(() => {
    return (
      getViewById(itemDisplaySettings, activeItemViewId) ||
      getViewById(itemDisplaySettings, defaultItemViewId) ||
      itemDisplaySettings.views[0]
    );
  }, [itemDisplaySettings, activeItemViewId, defaultItemViewId]);

  const shipmentItemVisibleColumns: ItemColumnKey[] = useMemo(
    () => (activeItemView ? getVisibleColumnsForView(activeItemView) : []),
    [activeItemView]
  );
  const shipmentItemsTableColSpan = 2 + shipmentItemVisibleColumns.length + 3; // checkbox + expand + view columns + (class, status, actions)

  // Only managers and admins can see billing fields
  const canSeeBilling = hasRole('admin') || hasRole('tenant_admin') || hasRole('manager');
  // Only admins can add credits
  const canAddCredit = hasRole('admin') || hasRole('tenant_admin');

  // State
  const [loading, setLoading] = useState(true);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [items, setItems] = useState<ShipmentItem[]>([]);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [receivedItems, setReceivedItems] = useState<ReceivedItemData[]>([]);
  const [receivingPhotos, setReceivingPhotos] = useState<(string | TaggablePhoto)[]>([]);
  const [receivingDocuments, setReceivingDocuments] = useState<string[]>([]);
  const [showPrintLabelsDialog, setShowPrintLabelsDialog] = useState(false);
  const [createdItemIds, setCreatedItemIds] = useState<string[]>([]);
  const [createdItemsForLabels, setCreatedItemsForLabels] = useState<ItemLabelData[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editCarrier, setEditCarrier] = useState('');
  const [editTrackingNumber, setEditTrackingNumber] = useState('');
  const [editPoNumber, setEditPoNumber] = useState('');
  const [editExpectedArrival, setEditExpectedArrival] = useState<Date | undefined>(undefined);
  const [editNotes, setEditNotes] = useState('');
  const [editInternalNotes, setEditInternalNotes] = useState('');
  const [editReleaseType, setEditReleaseType] = useState('');
  const [editReleasedTo, setEditReleasedTo] = useState('');
  const [editReleaseToName, setEditReleaseToName] = useState('');
  const [editReleaseToEmail, setEditReleaseToEmail] = useState('');
  const [editReleaseToPhone, setEditReleaseToPhone] = useState('');
  const [editDriverName, setEditDriverName] = useState('');
  const [editDestinationName, setEditDestinationName] = useState('');
  const [editOriginName, setEditOriginName] = useState('');
  const [editScheduledDate, setEditScheduledDate] = useState<Date | undefined>(undefined);
  const [editCustomerAuthorized, setEditCustomerAuthorized] = useState(false);
  const [addAddonDialogOpen, setAddAddonDialogOpen] = useState(false);
  const [addCreditDialogOpen, setAddCreditDialogOpen] = useState(false);
  const [coverageDialogOpen, setCoverageDialogOpen] = useState(false);
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false);
  const [selectedTaskType, setSelectedTaskType] = useState<string>('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [showOutboundCompleteDialog, setShowOutboundCompleteDialog] = useState(false);
  const [completingOutbound, setCompletingOutbound] = useState(false);
  const [classes, setClasses] = useState<{ id: string; code: string; name: string }[]>([]);
  const [billingRefreshKey, setBillingRefreshKey] = useState(0);
  const [documentRefreshKey, setDocumentRefreshKey] = useState(0);
  const [pullSessionActive, setPullSessionActive] = useState(false);
  const [releaseSessionActive, setReleaseSessionActive] = useState(false);
  const [processingScan, setProcessingScan] = useState(false);
  const [lastScan, setLastScan] = useState<LastScanResult | null>(null);
  const [manualScanValue, setManualScanValue] = useState('');
  const [manualOverrideItemIds, setManualOverrideItemIds] = useState<Set<string>>(new Set());
  const [showPartialReleaseDialog, setShowPartialReleaseDialog] = useState(false);
  const [partialReleaseNote, setPartialReleaseNote] = useState('');
  const [partialReleaseItems, setPartialReleaseItems] = useState<Set<string>>(new Set());
  const [sopValidationOpen, setSopValidationOpen] = useState(false);
  const [sopBlockers, setSopBlockers] = useState<SOPBlocker[]>([]);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [pendingOverrideWarnings, setPendingOverrideWarnings] = useState<SOPBlocker[] | undefined>(undefined);
  const [submittingPartialRelease, setSubmittingPartialRelease] = useState(false);
  const [scanListSortField, setScanListSortField] = useState<ScanListSortField>('location');
  const [scanListSortDirection, setScanListSortDirection] = useState<'asc' | 'desc'>('asc');
  const [accountSettings, setAccountSettings] = useState<{
    default_shipment_notes: string | null;
    highlight_shipment_notes: boolean;
  } | null>(null);

  const { documents, refetch: refetchDocuments } = useDocuments({
    contextType: 'shipment',
    contextId: shipment?.id,
  });

  // Receiving session hook
  const {
    session,
    loading: sessionLoading,
    fetchSession,
    startSession: rawStartSession,
    finishSession: rawFinishSession,
    cancelSession,
  } = useReceivingSession(id);

  const { locations } = useLocations(shipment?.warehouse_id || undefined);

  const normalizeLocationCode = (code?: string | null) =>
    (code || '').toUpperCase().replace(/[_\s]+/g, '-');
  const isOutboundDock = (code?: string | null) => normalizeLocationCode(code) === 'OUTBOUND-DOCK';
  const isReleasedLocation = (code?: string | null) =>
    ['RELEASED', 'RELEASE'].includes(normalizeLocationCode(code));
  const outboundDockLocation = locations.find(location => isOutboundDock(location.code));
  const releasedLocation = locations.find(location => normalizeLocationCode(location.code) === 'RELEASED')
    || locations.find(location => location.type === 'release');

  const logShipmentAudit = useCallback(async (action: string, changes: Record<string, unknown>) => {
    if (!profile?.tenant_id || !profile?.id || !shipment?.id) return;
    const { error } = await (supabase.from('admin_audit_log') as any).insert({
      action,
      actor_id: profile.id,
      tenant_id: profile.tenant_id,
      entity_type: 'shipment',
      entity_id: shipment.id,
      changes_json: changes as Json,
    });

    if (error) {
      console.error('Error logging shipment audit:', error);
    }
  }, [profile?.id, profile?.tenant_id, shipment?.id]);

  // Prompt context for guided prompts
  const promptContext = usePromptContextSafe();

  // startSession is defined after fetchShipment below

  // Wrapped finishSession with prompt trigger and competency tracking
  const finishSession = useCallback(async (
    verificationData: Parameters<typeof rawFinishSession>[0],
    createItems?: Parameters<typeof rawFinishSession>[1]
  ) => {
    // Show completion prompt if available
    if (promptContext?.showPrompt) {
      promptContext.showPrompt('receiving_completion', {
        contextType: 'shipment',
        contextId: id,
      });
    }
    const result = await rawFinishSession(verificationData, createItems);
    // Track competency after completion
    if (promptContext?.trackCompetencyEvent) {
      promptContext.trackCompetencyEvent('receiving', 'task_completed');
    }
    return result;
  }, [rawFinishSession, promptContext, id]);

  // ------------------------------------------
  // Fetch shipment data
  // ------------------------------------------
  const fetchShipment = useCallback(async () => {
    if (!profile?.tenant_id) return;

    try {
      // Fetch shipment with related data
      const { data: shipmentData, error: shipmentError } = await supabase
        .from('shipments')
        .select(`
          *,
          accounts:account_id(id, account_name, account_code),
          warehouses:warehouse_id(id, name)
        `)
        .eq('id', id)
        .eq('tenant_id', profile.tenant_id)
        .is('deleted_at', null)
        .single();

      if (shipmentError) {
        console.error('[ShipmentDetail] fetch shipment failed:', shipmentError);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load shipment' });
        return;
      }

      // Fetch classes first (needed for mapping)
      const { data: classesData } = await supabase
        .from('classes')
        .select('id, code, name')
        .eq('tenant_id', profile.tenant_id)
        .order('code');

      if (classesData) {
        setClasses(classesData);
      }

      // Build class lookup map
      const classById = new Map((classesData || []).map(c => [c.id, c]));

      // Fetch shipment items - use flat queries to avoid nested PostgREST join failures with RLS
      const { data: shipmentItemsRaw, error: itemsError } = await supabase
        .from('shipment_items')
        .select('id, expected_description, expected_vendor, expected_sidemark, expected_class_id, expected_quantity, actual_quantity, status, item_id')
        .eq('shipment_id', id)
        .order('created_at');

      if (itemsError) {
        console.error('[ShipmentDetail] fetch shipment_items failed:', itemsError);
      }

      // Fetch linked items separately to avoid nested join issues
      const itemIds = (shipmentItemsRaw || []).map(si => si.item_id).filter(Boolean) as string[];
      const itemsById = new Map<string, any>();

      if (itemIds.length > 0) {
        const { data: itemsRows, error: itemsFetchError } = await supabase
          .from('items')
          .select('id, item_code, description, vendor, sidemark, room, primary_photo_url, metadata, class_id, declared_value, coverage_type, current_location_id, account_id')
          .in('id', itemIds);

        if (itemsFetchError) {
          console.error('[ShipmentDetail] fetch items failed:', itemsFetchError);
        }

        if (itemsRows && itemsRows.length > 0) {
          // Fetch locations and accounts separately
          const locationIds = [...new Set(itemsRows.map(i => i.current_location_id).filter(Boolean))] as string[];
          const accountIds = [...new Set(itemsRows.map(i => i.account_id).filter(Boolean))] as string[];

          const [locResult, accResult] = await Promise.all([
            locationIds.length > 0
              ? supabase.from('locations').select('id, code').in('id', locationIds)
              : Promise.resolve({ data: [] as { id: string; code: string }[] }),
            accountIds.length > 0
              ? supabase.from('accounts').select('id, account_name').in('id', accountIds)
              : Promise.resolve({ data: [] as { id: string; account_name: string }[] }),
          ]);

          const locMap = new Map((locResult.data || []).map(l => [l.id, l]));
          const accMap = new Map((accResult.data || []).map(a => [a.id, a]));

          for (const row of itemsRows) {
            const loc = row.current_location_id ? locMap.get(row.current_location_id) : null;
            const acc = row.account_id ? accMap.get(row.account_id) : null;
            itemsById.set(row.id, {
              id: row.id,
              item_code: row.item_code,
              sku: null,
              description: row.description,
              vendor: row.vendor,
              sidemark: row.sidemark,
              room: row.room,
              primary_photo_url: row.primary_photo_url ?? null,
              metadata: row.metadata ?? null,
              class_id: row.class_id,
              declared_value: row.declared_value,
              coverage_type: row.coverage_type,
              current_location: loc ? { code: loc.code } : null,
              account: acc ? { account_name: acc.account_name } : null,
            });
          }
        }
      }

      // Combine shipment items with their linked item data and class lookups
      const mappedItems = (shipmentItemsRaw || []).map(si => {
        const item = si.item_id ? itemsById.get(si.item_id) || null : null;
        const expected_class = si.expected_class_id ? classById.get(si.expected_class_id) || null : null;
        if (item?.class_id) {
          item.class = classById.get(item.class_id) || null;
        }
        return { ...si, expected_class, item };
      });

      setShipment(shipmentData as unknown as Shipment);
      setItems(mappedItems as unknown as ShipmentItem[]);
      setBillingRefreshKey(prev => prev + 1); // Trigger billing recalculation

      // Fetch account settings for shipment notes
      if (shipmentData.account_id) {
        const { data: accSettings } = await supabase
          .from('accounts')
          .select('default_shipment_notes, highlight_shipment_notes')
          .eq('id', shipmentData.account_id)
          .single();

        if (accSettings) {
          setAccountSettings({
            default_shipment_notes: accSettings.default_shipment_notes,
            highlight_shipment_notes: accSettings.highlight_shipment_notes || false,
          });
        }
      }

      // Initialize receiving photos/documents from shipment
      if (shipmentData.receiving_photos) {
        setReceivingPhotos(shipmentData.receiving_photos as string[]);
      }
      if (shipmentData.receiving_documents) {
        setReceivingDocuments(shipmentData.receiving_documents as string[]);
      }

      // Check for active session
      await fetchSession();
    } catch (err) {
      console.error('[ShipmentDetail] fetchShipment exception:', err);
    } finally {
      setLoading(false);
    }
  }, [id, profile?.tenant_id, fetchSession, toast]);

  useEffect(() => {
    fetchShipment();
  }, [fetchShipment]);

  // Wrapped startSession with prompt trigger and audit logging
  const startSession = useCallback(async () => {
    // Show pre-task prompt if available (non-blocking, informational only)
    if (promptContext?.showPrompt) {
      promptContext.showPrompt('receiving_pre_task', {
        contextType: 'shipment',
        contextId: id,
      });
    }
    
    // Always start the session regardless of prompt
    const result = await rawStartSession();
    
    // Log status change to audit if session started successfully
    if (result && profile?.tenant_id && profile?.id) {
      await logShipmentAudit('status_changed', {
        previous_status: shipment?.status || 'incoming',
        new_status: 'receiving',
        action: 'Started receiving session',
      });
    }
    
    // Refetch shipment to reflect status change in UI
    await fetchShipment();
    
    return result;
  }, [rawStartSession, promptContext, id, logShipmentAudit, profile?.tenant_id, profile?.id, shipment?.status, fetchShipment]);

  const outboundItems = items.filter(item => item.item?.id);
  const activeOutboundItems = outboundItems.filter(item => item.status !== 'cancelled');
  const allPulled = activeOutboundItems.length > 0
    && activeOutboundItems.every(item => isOutboundDock(item.item?.current_location?.code));
  const allReleased = activeOutboundItems.length > 0
    && activeOutboundItems.every(item => isReleasedLocation(item.item?.current_location?.code));

  const updateShipmentStatus = useCallback(async (status: string) => {
    if (!shipment) return;
    const { error } = await supabase
      .from('shipments')
      .update({ status })
      .eq('id', shipment.id);

    if (error) {
      console.error('Error updating shipment status:', error);
      return;
    }
    await fetchShipment();
  }, [fetchShipment, shipment]);

  useEffect(() => {
    if (!shipment || shipment.shipment_type !== 'outbound') return;
    if (pullSessionActive && allPulled) {
      setPullSessionActive(false);
      toast({
        title: 'Pull complete',
        description: 'All items are staged at Outbound Dock.',
      });
      logShipmentAudit('pull_completed', {
        shipment_id: shipment.id,
        item_count: activeOutboundItems.length,
      });
    }
  }, [activeOutboundItems.length, allPulled, logShipmentAudit, pullSessionActive, shipment, toast]);

  useEffect(() => {
    if (!shipment || shipment.shipment_type !== 'outbound') return;
    if (releaseSessionActive && allReleased) {
      setReleaseSessionActive(false);
      toast({
        title: 'Release scan complete',
        description: 'All items have been scanned as Released.',
      });
      logShipmentAudit('release_scan_completed', {
        shipment_id: shipment.id,
        item_count: activeOutboundItems.length,
      });
      if (shipment.status !== 'released') {
        updateShipmentStatus('released');
      }
    }
  }, [activeOutboundItems.length, allReleased, logShipmentAudit, releaseSessionActive, shipment, toast, updateShipmentStatus]);

  useEffect(() => {
    if (!shipment || shipment.shipment_type !== 'outbound') return;
    if (shipment.status === 'in_progress' && !allPulled && !pullSessionActive) {
      setPullSessionActive(true);
    }
    if (shipment.status === 'released' && !allReleased && !releaseSessionActive) {
      setReleaseSessionActive(true);
    }
  }, [allPulled, allReleased, pullSessionActive, releaseSessionActive, shipment]);

  // ------------------------------------------
  // Initialize received items for finish dialog
  // ------------------------------------------
  const openFinishDialog = () => {
    const initialReceivedItems: ReceivedItemData[] = items.map(item => ({
      shipment_item_id: item.id,
      expected_description: item.expected_description,
      expected_quantity: item.expected_quantity,
      actual_quantity: item.actual_quantity ?? item.expected_quantity,
      expected_vendor: item.expected_vendor,
      expected_sidemark: item.expected_sidemark,
      expected_item_type_id: null,
      notes: null,
      status: 'received' as const,
    }));
    setReceivedItems(initialReceivedItems);
    setShowFinishDialog(true);
  };

  // ------------------------------------------
  // Update received item quantity
  // ------------------------------------------
  const updateReceivedQuantity = (shipmentItemId: string, quantity: number) => {
    setReceivedItems(prev => prev.map(item => {
      if (item.shipment_item_id === shipmentItemId) {
        const status = quantity === 0 ? 'missing' : 
                       quantity < item.expected_quantity ? 'partial' : 'received';
        return { ...item, actual_quantity: quantity, status };
      }
      return item;
    }));
  };

  // ------------------------------------------
  // Handle finish receiving
  // ------------------------------------------
  const handleFinishReceiving = async () => {
    if (!shipment) return;

    // Call SOP validator RPC first
    try {
      const { data: validationResult, error: rpcError } = await (supabase as any).rpc(
        'validate_shipment_receiving_completion',
        { p_shipment_id: shipment.id }
      );

      if (rpcError) {
        console.error('Validation RPC error:', rpcError);
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: 'Failed to validate receiving completion. Please try again.',
        });
        return;
      }

      let result = validationResult as { ok: boolean; blockers: SOPBlocker[] };
      let blockers = (result?.blockers || []).filter(
        (b: SOPBlocker) => b.severity === 'blocking' || !b.severity
      );

      // If ITEMS_WITHOUT_LOCATION blocker fires, attempt auto-assign then re-validate
      const hasLocationBlocker = blockers.some(b => b.code === 'ITEMS_WITHOUT_LOCATION');
      if (hasLocationBlocker && shipment.id) {
        try {
          const { data: assignResult } = await supabase.rpc(
            'rpc_assign_receiving_location_for_shipment',
            { p_shipment_id: shipment.id, p_note: 'Auto-assigned on Finish Receiving validation' }
          );
          const assignRes = assignResult as any;
          if (assignRes?.ok && assignRes.updated_count > 0) {
            toast({
              title: 'Location Assigned',
              description: `${assignRes.updated_count} item(s) assigned to ${assignRes.effective_location_code}.`,
            });
            // Re-validate after assignment
            const { data: revalidation } = await (supabase as any).rpc(
              'validate_shipment_receiving_completion',
              { p_shipment_id: shipment.id }
            );
            if (revalidation) {
              result = revalidation as { ok: boolean; blockers: SOPBlocker[] };
              blockers = (result?.blockers || []).filter(
                (b: SOPBlocker) => b.severity === 'blocking' || !b.severity
              );
            }
          }
        } catch {
          // If auto-assign fails, continue with original blockers
        }
      }

      if (!result?.ok && blockers.length > 0) {
        setSopBlockers(result.blockers);
        setSopValidationOpen(true);
        setShowFinishDialog(false);
        return;
      }
    } catch (err) {
      console.error('Validation error:', err);
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'An unexpected error occurred during validation.',
      });
      return;
    }

    // Validate all items have a class assigned for billing
    const itemsWithoutClass = items.filter(item => {
      // For received items, check item.class_id; for pending items, check expected_class_id
      const hasClass = item.item?.class_id || item.expected_class_id;
      return !hasClass;
    });

    if (itemsWithoutClass.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Class Required',
        description: `${itemsWithoutClass.length} item(s) need a class assigned for billing. Please update them before finishing.`,
      });
      setShowFinishDialog(false);
      return;
    }

    // Convert local ReceivedItemData to VerificationData format expected by hook
    const verificationData = {
      expected_items: items.map(item => ({
        description: item.expected_description || '',
        quantity: item.expected_quantity,
      })),
      received_items: receivedItems
        .filter(item => item.status !== 'missing')
        .map(item => ({
          description: item.expected_description || '',
          quantity: item.actual_quantity,
          shipment_item_id: item.shipment_item_id,
        })),
      discrepancies: receivedItems
        .filter(item => item.actual_quantity !== item.expected_quantity)
        .map(item => ({
          description: item.expected_description || '',
          expected: item.expected_quantity,
          received: item.actual_quantity,
        })),
      backorder_items: receivedItems
        .filter(item => item.actual_quantity < item.expected_quantity)
        .map(item => ({
          description: item.expected_description || '',
          quantity: item.expected_quantity - item.actual_quantity,
        })),
    };

    const result = await finishSession(verificationData, true);

    if (result.success) {
      setShowFinishDialog(false);
      setCreatedItemIds(result.createdItemIds);
      
      // Fetch created items for label printing
      if (result.createdItemIds.length > 0) {
        const { data: createdItems } = await supabase
          .from('items')
          .select('id, item_code, description, vendor, sidemark_id, room')
          .in('id', result.createdItemIds);

        if (createdItems) {
          const labelData: ItemLabelData[] = createdItems.map(item => ({
            id: item.id,
            itemCode: item.item_code || '',
            sku: (item as any).sku || '',
            description: item.description || '',
            vendor: item.vendor || '',
            account: shipment?.accounts?.account_name || '',
            sidemark: '',
            room: (item as any).room || '',
            warehouseName: shipment?.warehouses?.name || '',
          }));
          setCreatedItemsForLabels(labelData);
          setShowPrintLabelsDialog(true);
        }
      }
      
      await fetchShipment();
    }
  };

  // ------------------------------------------
  // Handle cancel receiving
  // ------------------------------------------
  const handleCancelReceiving = async () => {
    await cancelSession();
    await fetchShipment();
  };

  // ------------------------------------------
  // Item selection helpers
  // ------------------------------------------
  const toggleItemSelection = (itemId: string) => {
    setSelectedItemIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    const receivedItems = items.filter(i => i.item?.id);
    if (selectedItemIds.size === receivedItems.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(receivedItems.map(i => i.item!.id)));
    }
  };

  const handleCreateTask = () => {
    if (selectedItemIds.size === 0 || !selectedTaskType) return;
    // Create tasks via the TaskDialog (there is no /tasks/new route).
    setShowCreateTaskDialog(true);
  };

  const handleTaskDialogSuccess = (createdTaskId?: string) => {
    setShowCreateTaskDialog(false);
    setSelectedTaskType('');
    if (createdTaskId) {
      navigate(`/tasks/${createdTaskId}`);
    }
  };

  const handleCreateOutbound = () => {
    if (selectedItemIds.size === 0) return;
    navigate('/shipments/outbound/new', {
      state: {
        itemIds: Array.from(selectedItemIds),
        accountId: shipment?.account_id || '',
      },
    });
  };

  // ------------------------------------------
  // Handle duplicate shipment item
  // ------------------------------------------
  const handleDuplicateItem = async (itemToDuplicate: ShipmentItem) => {
    if (!shipment || !profile?.tenant_id) return;

    try {
      const { error } = await supabase
        .from('shipment_items')
        .insert({
          shipment_id: shipment.id,
          expected_description: itemToDuplicate.expected_description,
          expected_vendor: itemToDuplicate.expected_vendor,
          expected_sidemark: itemToDuplicate.expected_sidemark,
          expected_quantity: itemToDuplicate.expected_quantity,
          expected_class_id: itemToDuplicate.expected_class_id,
          status: 'pending',
        });

      if (error) throw error;

      toast({ title: 'Item duplicated' });
      fetchShipment();
    } catch (error) {
      console.error('Error duplicating item:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to duplicate item' });
    }
  };

  // ------------------------------------------
  // Handle cancel shipment
  // ------------------------------------------
  const handleCancelShipment = async () => {
    if (!shipment) return;
    setCancelling(true);
    try {
      const { error } = await supabase
        .from('shipments')
        .update({ status: 'cancelled' })
        .eq('id', shipment.id);

      if (error) throw error;

      toast({ title: 'Shipment Cancelled' });
      setShowCancelDialog(false);
      fetchShipment();
    } catch (error) {
      console.error('Error cancelling shipment:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to cancel shipment' });
    } finally {
      setCancelling(false);
    }
  };

  const findShipmentItemByScan = (scanValue: string) => {
    const normalized = scanValue.trim().toLowerCase();
    if (!normalized) return null;
    return activeOutboundItems.find(item =>
      item.item?.id?.toLowerCase() === normalized
      || item.item?.item_code?.toLowerCase() === normalized
    ) || null;
  };

  const updateItemLocation = async (itemId: string, locationId: string) => {
    const { error } = await (supabase.from('items') as any)
      .update({ current_location_id: locationId })
      .eq('id', itemId);

    if (error) {
      throw error;
    }
  };

  const updateItemReleasedState = async (itemId: string) => {
    const now = new Date().toISOString();
    const { error } = await (supabase.from('items') as any)
      .update({
        status: 'released',
        released_at: now,
        released_date: now,
      })
      .eq('id', itemId);

    if (error) {
      throw error;
    }
  };

  const updateShipmentItemRelease = async (shipmentItemId: string) => {
    const { error } = await (supabase.from('shipment_items') as any)
      .update({
        status: 'released',
        released_at: new Date().toISOString(),
      })
      .eq('id', shipmentItemId);

    if (error) {
      throw error;
    }
  };

  const handleOutboundScan = async (scanValue: string, mode: 'pull' | 'release') => {
    if (!shipment) return;
    if (processingScan) return;
    const trimmed = scanValue.trim();
    if (!trimmed) return;

    setProcessingScan(true);
    setLastScan(null);

    try {
      const matched = findShipmentItemByScan(trimmed);
      if (!matched || !matched.item?.id) {
        const message = 'This is the wrong item. Please return the item to its previous location.';
        setLastScan({ itemCode: trimmed, result: 'invalid', message });
        hapticError();
        toast({
          variant: 'destructive',
          title: 'Wrong item',
          description: message,
        });
        await logShipmentAudit('scan_invalid', {
          scan_value: trimmed,
          mode,
          message,
        });
        return;
      }

      if (mode === 'pull') {
        if (!outboundDockLocation?.id) {
          toast({
            variant: 'destructive',
            title: 'Outbound Dock missing',
            description: 'Create an OUTBOUND-DOCK location before scanning.',
          });
          return;
        }

        if (isOutboundDock(matched.item.current_location?.code)) {
          const message = 'Item already staged at Outbound Dock.';
          setLastScan({ itemCode: matched.item.item_code, result: 'duplicate', message });
          hapticError();
          toast({ title: 'Duplicate scan', description: message });
          await logShipmentAudit('scan_duplicate', {
            scan_value: trimmed,
            mode,
            item_id: matched.item.id,
          });
          return;
        }

        await updateItemLocation(matched.item.id, outboundDockLocation.id);
        setLastScan({
          itemCode: matched.item.item_code,
          result: 'success',
          message: 'Moved to Outbound Dock.',
        });
        hapticSuccess();
        await logShipmentAudit('pull_scan_success', {
          item_id: matched.item.id,
          shipment_item_id: matched.id,
          location_id: outboundDockLocation.id,
        });
      }

      if (mode === 'release') {
        if (!releasedLocation?.id) {
          toast({
            variant: 'destructive',
            title: 'Released location missing',
            description: 'Create a RELEASED (or type Release) location before scanning.',
          });
          return;
        }

        if (isReleasedLocation(matched.item.current_location?.code)) {
          const message = 'Item already scanned as Released.';
          setLastScan({ itemCode: matched.item.item_code, result: 'duplicate', message });
          hapticError();
          toast({ title: 'Duplicate scan', description: message });
          await logShipmentAudit('scan_duplicate', {
            scan_value: trimmed,
            mode,
            item_id: matched.item.id,
          });
          return;
        }

        await updateItemLocation(matched.item.id, releasedLocation.id);
        await updateItemReleasedState(matched.item.id);
        await updateShipmentItemRelease(matched.id);
        setLastScan({
          itemCode: matched.item.item_code,
          result: 'success',
          message: 'Marked as Released.',
        });
        hapticSuccess();
        await logShipmentAudit('release_scan_success', {
          item_id: matched.item.id,
          shipment_item_id: matched.id,
          location_id: releasedLocation.id,
        });
      }

      await fetchShipment();
    } catch (error) {
      console.error('Error processing scan:', error);
      setLastScan({ itemCode: trimmed, result: 'error', message: 'Failed to process scan.' });
      hapticError();
      toast({
        variant: 'destructive',
        title: 'Scan failed',
        description: 'Unable to update item. Please try again.',
      });
      await logShipmentAudit('scan_error', {
        scan_value: trimmed,
        mode,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setProcessingScan(false);
    }
  };

  const handleStartPull = async () => {
    if (!shipment) return;
    if (!outboundDockLocation?.id) {
      toast({
        variant: 'destructive',
        title: 'Outbound Dock missing',
        description: 'Create an OUTBOUND-DOCK location before starting the pull.',
      });
      return;
    }
    setPullSessionActive(true);
    setReleaseSessionActive(false);
    if (['expected', 'pending'].includes(shipment.status)) {
      await updateShipmentStatus('in_progress');
    }
    await logShipmentAudit('pull_started', {
      shipment_id: shipment.id,
      item_count: activeOutboundItems.length,
    });
  };

  const handleStartRelease = async () => {
    if (!shipment) return;
    if (!allPulled) {
      toast({
        variant: 'destructive',
        title: 'Items not staged',
        description: 'All items must be at Outbound Dock before release scanning.',
      });
      return;
    }
    if (!releasedLocation?.id) {
      toast({
        variant: 'destructive',
        title: 'Released location missing',
        description: 'Create a RELEASED (or type Release) location before starting the release scan.',
      });
      return;
    }
    setReleaseSessionActive(true);
    setPullSessionActive(false);
    await logShipmentAudit('release_scan_started', {
      shipment_id: shipment.id,
      item_count: activeOutboundItems.length,
    });
  };

  const handleManualOverride = async (mode: 'pull' | 'release') => {
    if (manualOverrideItemIds.size === 0) return;
    const targetItems = items.filter(item => item.item?.id && manualOverrideItemIds.has(item.item.id));
    if (targetItems.length === 0) return;
    try {
      for (const targetItem of targetItems) {
        if (!targetItem.item?.id) continue;

        if (mode === 'pull') {
          if (!outboundDockLocation?.id) return;
          await updateItemLocation(targetItem.item.id, outboundDockLocation.id);
          await logShipmentAudit('pull_manual_override', {
            shipment_item_id: targetItem.id,
            item_id: targetItem.item.id,
          });
        }

        if (mode === 'release') {
          if (!releasedLocation?.id) return;
          await updateItemLocation(targetItem.item.id, releasedLocation.id);
          await updateItemReleasedState(targetItem.item.id);
          await updateShipmentItemRelease(targetItem.id);
          await logShipmentAudit('release_manual_override', {
            shipment_item_id: targetItem.id,
            item_id: targetItem.item.id,
          });
        }
      }

      const count = targetItems.length;
      if (mode === 'pull') {
        toast({ title: `${count} item${count > 1 ? 's' : ''} staged`, description: 'Marked as Outbound Dock.' });
      } else {
        toast({ title: `${count} item${count > 1 ? 's' : ''} released`, description: 'Marked as Released.' });
      }

      setManualOverrideItemIds(new Set());
      await fetchShipment();
    } catch (error) {
      console.error('Error applying manual override:', error);
      toast({
        variant: 'destructive',
        title: 'Manual override failed',
        description: 'Unable to update items.',
      });
    }
  };

  const handleSubmitPartialRelease = async () => {
    if (!shipment || partialReleaseItems.size === 0) return;
    if (!partialReleaseNote.trim()) {
      toast({
        variant: 'destructive',
        title: 'Note required',
        description: 'Please add a note explaining the partial release.',
      });
      return;
    }
    setSubmittingPartialRelease(true);
    try {
      const ids = Array.from(partialReleaseItems);

      // 1. Update shipment_items status to cancelled
      const { error } = await (supabase.from('shipment_items') as any)
        .update({
          status: 'cancelled',
          notes: partialReleaseNote || null,
        })
        .in('id', ids);

      if (error) throw error;

      // 2. Restore items to their account's default location (remove from outbound dock)
      // Get the item_ids for the cancelled shipment items
      const cancelledShipmentItems = items.filter(si => ids.includes(si.id) && si.item_id);
      const itemIds = cancelledShipmentItems.map(si => si.item_id).filter(Boolean) as string[];

      if (itemIds.length > 0) {
        // Find a default warehouse location to restore items to (first non-special location or warehouse default)
        const defaultLocation = locations.find(l =>
          l.type === 'storage' || (l.type === 'default' && !isOutboundDock(l.code) && !isReleasedLocation(l.code))
        ) || locations.find(l => !isOutboundDock(l.code) && !isReleasedLocation(l.code) && l.type !== 'release');

        if (defaultLocation?.id) {
          await (supabase.from('items') as any)
            .update({ current_location_id: defaultLocation.id })
            .in('id', itemIds);
        }

        // Reset item status back to stored (from any outbound staging status)
        await (supabase.from('items') as any)
          .update({ status: 'stored' })
          .in('id', itemIds)
          .in('status', ['staged', 'pulling']);
      }

      await logShipmentAudit('partial_release', {
        shipment_id: shipment.id,
        removed_items: ids,
        restored_item_ids: itemIds,
        note: partialReleaseNote || null,
      });
      setPartialReleaseItems(new Set());
      setPartialReleaseNote('');
      setShowPartialReleaseDialog(false);
      await fetchShipment();
      toast({ title: 'Items removed', description: `${ids.length} item(s) removed from shipment and restored to storage.` });
    } catch (error) {
      console.error('Error applying partial release:', error);
      toast({
        variant: 'destructive',
        title: 'Partial release failed',
        description: 'Unable to update shipment items.',
      });
    } finally {
      setSubmittingPartialRelease(false);
    }
  };

  // ------------------------------------------
  // Execute the actual outbound completion with signature capture
  // ------------------------------------------
  const executeOutboundCompletion = async (
    signatureInfo: { signatureData: string | null; signatureName: string },
    overriddenWarnings?: SOPBlocker[]
  ) => {
    if (!shipment) return;

    setCompletingOutbound(true);
    try {
      const now = new Date().toISOString();
      const releasedToName =
        signatureInfo.signatureName?.trim()
        || shipment.released_to
        || shipment.driver_name
        || shipment.release_to_name
        || null;

      // Update shipment with signature and completion data
      const { error: shipmentError } = await supabase
        .from('shipments')
        .update({
          status: 'shipped',
          shipped_at: now,
          completed_at: now,
          completed_by: profile?.id || null,
          signature_data: signatureInfo.signatureData,
          signature_name: signatureInfo.signatureName,
          signature_timestamp: now,
          // Persist release recipient (validation requires released_to OR driver_name)
          released_to: releasedToName,
          driver_name: releasedToName,
          // Keep legacy contact field in sync for older UIs/exports
          release_to_name: releasedToName,
        })
        .eq('id', shipment.id);

      if (shipmentError) throw shipmentError;

      // Update all items in the shipment to released status
      const itemIds = activeOutboundItems.filter(i => i.item_id).map(i => i.item_id);
      if (itemIds.length > 0) {
        const itemUpdate: Record<string, string | null> = {
          status: 'released',
          released_at: now,
          released_date: now,
        };
        if (releasedLocation?.id) {
          itemUpdate.current_location_id = releasedLocation.id;
        }
        const { error: itemsError } = await supabase
          .from('items')
          .update(itemUpdate)
          .in('id', itemIds);

        if (itemsError) throw itemsError;
      }

      // Update shipment_items status to released
      const { error: shipmentItemsError } = await supabase
        .from('shipment_items')
        .update({
          status: 'released',
          released_at: now,
        })
        .eq('shipment_id', shipment.id)
        .neq('status', 'cancelled');

      if (shipmentItemsError) throw shipmentItemsError;

      // Log completion with signature + any overridden warnings
      await logShipmentAudit('shipment_completed', {
        shipment_id: shipment.id,
        item_count: activeOutboundItems.length,
        signature_captured: true,
        signature_name: signatureInfo.signatureName,
        ...(overriddenWarnings && overriddenWarnings.length > 0 && {
          warnings_overridden: overriddenWarnings.map(w => ({
            code: w.code,
            message: w.message,
          })),
          override_by: profile?.id || null,
          override_at: now,
        }),
      });

      // Will-call billing + client alert (non-blocking; completion should still succeed)
      if (
        shipment.shipment_type === 'outbound' &&
        shipment.release_type === 'will_call' &&
        profile?.tenant_id &&
        profile?.id &&
        shipment.account_id
      ) {
        try {
          // Fetch shipment_items + item details for rate lookup and billing context.
          // Do not rely on the page's local item state here (it may be stale after updates).
          const { data: shipmentItemsForBilling, error: shipmentItemsBillingError } = await (supabase
            .from('shipment_items') as any)
            .select(`
              id,
              expected_quantity,
              item_id,
              items:item_id(
                id,
                item_code,
                class_id,
                sidemark_id,
                account_id,
                account:accounts(account_name)
              )
            `)
            .eq('shipment_id', shipment.id)
            .neq('status', 'cancelled')
            .is('deleted_at', null);

          if (shipmentItemsBillingError) throw shipmentItemsBillingError;

          const rawItems = (shipmentItemsForBilling || []) as any[];
          const uniqueItemIds = [
            ...new Set(rawItems.map((si) => si?.items?.id).filter(Boolean) as string[]),
          ];

          // Deduplicate: skip items already billed for this shipment (avoid accidental double-charges).
          const existingBilledItemIds = new Set<string>();
          if (uniqueItemIds.length > 0) {
            const { data: existingEvents, error: existingError } = await supabase
              .from('billing_events')
              .select('item_id')
              .eq('tenant_id', profile.tenant_id)
              .eq('shipment_id', shipment.id)
              .eq('event_type', 'will_call')
              .eq('charge_type', 'Will_Call')
              .neq('status', 'void')
              .in('item_id', uniqueItemIds);

            if (existingError) {
              console.warn('[ShipmentDetail] Unable to check existing billing events (will proceed):', existingError);
            } else {
              (existingEvents || []).forEach((e: any) => {
                if (e?.item_id) existingBilledItemIds.add(e.item_id);
              });
            }
          }

          // Fetch only the classes we need to map class_id → class_code
          const classIds = [
            ...new Set(rawItems.map((si) => si?.items?.class_id).filter(Boolean) as string[]),
          ];
          const classMap = new Map<string, string>();
          if (classIds.length > 0) {
            const { data: classesData, error: classesError } = await supabase
              .from('classes')
              .select('id, code')
              .eq('tenant_id', profile.tenant_id)
              .in('id', classIds);

            if (classesError) throw classesError;
            (classesData || []).forEach((c: any) => {
              if (c?.id) classMap.set(c.id, c.code);
            });
          }

          const chargeRequests: Parameters<typeof createCharges>[0] = [];
          const alertRequests: Array<{
            index: number;
            tenantId: string;
            serviceName: string;
            itemCode: string;
            accountName: string;
            amount: number;
            description: string;
          }> = [];

          for (const si of rawItems) {
            const item = si?.items;
            if (!item?.id || existingBilledItemIds.has(item.id)) continue;

            const accountId: string | null = item.account_id || shipment.account_id;
            if (!accountId) continue;

            const classCode: string | null = item.class_id ? (classMap.get(item.class_id) ?? null) : null;

            // Rate lookup via unified pricing (new system first, legacy fallback)
            let rate = 0;
            let serviceName = 'Will Call';
            let alertRule: string = 'none';
            let hasError = false;
            let errorMessage: string | undefined = undefined;

            try {
              const rateResult = await getEffectiveRate({
                tenantId: profile.tenant_id,
                chargeCode: 'Will_Call',
                accountId,
                classCode: classCode || undefined,
              });

              serviceName = rateResult.charge_name || serviceName;
              alertRule = rateResult.alert_rule || 'none';

              if (rateResult.has_error) {
                rate = 0;
                hasError = true;
                errorMessage = rateResult.error_message || 'Rate lookup error';
              } else {
                rate = rateResult.effective_rate || 0;
              }
            } catch (rateErr: any) {
              const msg = rateErr instanceof Error ? rateErr.message : String(rateErr);
              if (msg === BILLING_DISABLED_ERROR) {
                throw new Error(BILLING_DISABLED_ERROR);
              }
              rate = 0;
              hasError = true;
              errorMessage = msg;
            }

            const quantityRaw = Number(si?.expected_quantity ?? 1);
            const quantity = Number.isFinite(quantityRaw) && quantityRaw > 0 ? quantityRaw : 1;
            const description = `Will Call: ${item.item_code}`;
            const totalAmount = quantity * rate;

            const requestIndex = chargeRequests.length;

            chargeRequests.push({
              tenantId: profile.tenant_id,
              accountId,
              chargeCode: 'Will_Call',
              eventType: 'will_call',
              context: { type: 'shipment', shipmentId: shipment.id, itemId: item.id },
              description,
              quantity,
              classCode,
              rateOverride: rate,
              hasRateError: hasError,
              rateErrorMessage: errorMessage,
              sidemarkId: item.sidemark_id || shipment.sidemark_id || null,
              classId: item.class_id || null,
              metadata: { class_code: classCode },
              userId: profile.id,
            });

            // Track alerts to queue for services with alert_rule: 'email_office'
            if (alertRule === 'email_office') {
              alertRequests.push({
                index: requestIndex,
                tenantId: profile.tenant_id,
                serviceName,
                itemCode: item.item_code,
                accountName:
                  item.account?.account_name ||
                  shipment.accounts?.account_name ||
                  'Unknown Account',
                amount: totalAmount,
                description,
              });
            }
          }

          if (chargeRequests.length > 0) {
            const results = await createCharges(chargeRequests);

            for (const alert of alertRequests) {
              const res = results[alert.index];
              if (res?.success && res.billingEventId) {
                await queueBillingEventAlert(
                  alert.tenantId,
                  res.billingEventId,
                  alert.serviceName,
                  alert.itemCode,
                  alert.accountName,
                  // Use persisted amount if available (promos may adjust totals)
                  typeof res.amount === 'number' ? res.amount : alert.amount,
                  alert.description
                );
              }
            }
          }
        } catch (billingErr: any) {
          if (billingErr?.message === BILLING_DISABLED_ERROR) {
            toast({
              variant: 'destructive',
              title: 'Billing Disabled',
              description: BILLING_DISABLED_ERROR,
            });
          } else {
            console.error('[ShipmentDetail] Outbound billing failed (non-blocking):', billingErr);
          }
        }

        // Queue client-facing "Will Call Released" communication trigger
        try {
          await queueAlert({
            tenantId: profile.tenant_id,
            alertType: 'will_call_released',
            entityType: 'shipment',
            entityId: shipment.id,
            subject: `Will-Call Released — ${shipment.shipment_number}`,
          });
        } catch (alertErr) {
          console.error('[ShipmentDetail] Failed to queue will-call released alert (non-blocking):', alertErr);
        }
      }

      // Generate release PDF and upload as a document
      try {
        const staffName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || null;
        const releasedToForPdf =
          signatureInfo.signatureName?.trim()
          || shipment.released_to
          || shipment.driver_name
          || shipment.release_to_name
          || null;

        const pdfItems: ReleasePdfItem[] = activeOutboundItems.map(si => ({
          itemCode: si.item?.item_code || si.expected_description || '-',
          quantity: si.actual_quantity ?? si.expected_quantity ?? 1,
          description: si.item?.description || si.expected_description || null,
          vendor: si.item?.vendor || si.expected_vendor || null,
          sidemark: si.item?.sidemark || si.expected_sidemark || null,
        }));

        // Fetch tenant settings for branding
        const { data: tenantSettings } = await supabase
          .from('tenant_company_settings')
          .select('company_name, company_address, company_phone, company_email, logo_url')
          .eq('tenant_id', profile?.tenant_id || '')
          .maybeSingle();

        const pdfData: ReleasePdfData = {
          shipmentNumber: shipment.shipment_number,
          shipmentType: shipment.shipment_type,
          releaseType: shipment.release_type,
          releasedTo: releasedToForPdf,
          releaseToPhone: shipment.release_to_phone || null,
          carrier: shipment.carrier,
          trackingNumber: shipment.tracking_number,
          poNumber: shipment.po_number,
          accountName: shipment.accounts?.account_name || null,
          accountCode: shipment.accounts?.account_code || null,
          companyName: tenantSettings?.company_name || 'Warehouse',
          companyAddress: tenantSettings?.company_address || null,
          companyPhone: tenantSettings?.company_phone || null,
          companyEmail: tenantSettings?.company_email || null,
          companyLogo: tenantSettings?.logo_url || null,
          warehouseName: shipment.warehouses?.name || null,
          items: pdfItems,
          signatureData: signatureInfo.signatureData,
          signatureName: signatureInfo.signatureName,
          signedAt: now,
          completedByName: staffName,
          completedAt: now,
        };

        const doc = generateReleasePdf(pdfData);
        const pdfBlob = doc.output('blob');
        const fileName = `Release_${shipment.shipment_number}_${Date.now()}.pdf`;
        const storagePath = `${profile?.tenant_id}/shipment/${shipment.id}/${fileName}`;

        // Upload PDF to storage
        const { error: uploadError } = await supabase.storage
          .from('documents-private')
          .upload(storagePath, pdfBlob, {
            contentType: 'application/pdf',
            upsert: false,
          });

        if (!uploadError) {
          // Create document record via edge function
          await supabase.functions.invoke('create-document', {
            body: {
              context_type: 'shipment',
              context_id: shipment.id,
              file_name: fileName,
              storage_key: storagePath,
              file_size: pdfBlob.size,
              page_count: 1,
              mime_type: 'application/pdf',
              label: `Release Document - ${shipment.shipment_number}`,
              notes: `Release signed by ${releasedToForPdf || 'Driver'}`,
              is_sensitive: false,
            },
          });
        } else {
          console.error('Failed to upload release PDF:', uploadError);
        }
      } catch (pdfErr) {
        console.error('Error generating release PDF (non-blocking):', pdfErr);
      }

      toast({ title: 'Shipment Shipped', description: 'Items have been released and release document generated.' });
      setShowOutboundCompleteDialog(false);
      setShowSignatureDialog(false);
      setPendingOverrideWarnings(undefined);
      setDocumentRefreshKey(prev => prev + 1);
      void refetchDocuments();
      fetchShipment();
    } catch (error) {
      console.error('Error completing outbound shipment:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to complete shipment' });
    } finally {
      setCompletingOutbound(false);
    }
  };

  // ------------------------------------------
  // Handle complete outbound shipment (validates, then executes or shows dialog)
  // ------------------------------------------
  const handleCompleteOutbound = async () => {
    if (!shipment) return;

    // Call SOP validator RPC first
    try {
      const { data: validationResult, error: rpcError } = await (supabase as any).rpc(
        'validate_shipment_outbound_completion',
        { p_shipment_id: shipment.id }
      );

      if (rpcError) {
        console.error('Validation RPC error:', rpcError);
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: 'Failed to validate outbound completion. Please try again.',
        });
        return;
      }

      const result = validationResult as { ok: boolean; blockers: SOPBlocker[] };
      const allBlockers = result?.blockers || [];
      // "Released To / Driver Name" is captured in the Signature dialog immediately after validation,
      // so don't block completion on it here.
      const blockersForDialog = allBlockers.filter((b: SOPBlocker) => b.code !== 'NO_RELEASED_TO');

      const hardBlockers = blockersForDialog.filter(
        (b: SOPBlocker) => b.severity === 'blocking' || !b.severity
      );
      const warnings = blockersForDialog.filter((b: SOPBlocker) => b.severity === 'warning');

      // If there are hard blockers, show the dialog (no override)
      if (hardBlockers.length > 0) {
        setSopBlockers(blockersForDialog);
        setSopValidationOpen(true);
        setShowOutboundCompleteDialog(false);
        return;
      }

      // If there are warnings (but no hard blockers), show the dialog with override option
      if (warnings.length > 0) {
        setSopBlockers(blockersForDialog);
        setSopValidationOpen(true);
        setShowOutboundCompleteDialog(false);
        return;
      }
    } catch (err) {
      console.error('Validation error:', err);
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'An unexpected error occurred during validation.',
      });
      return;
    }

    if (activeOutboundItems.length > 0 && !allReleased) {
      toast({
        variant: 'destructive',
        title: 'Release scanning incomplete',
        description: 'All items must be scanned as Released before completion.',
      });
      return;
    }

    // No blockers, no warnings - show signature dialog to capture signature before completing
    setPendingOverrideWarnings(undefined);
    setShowOutboundCompleteDialog(false);
    setShowSignatureDialog(true);
  };

  // ------------------------------------------
  // Status badge helper
  // ------------------------------------------
  const shipmentStatusLabels: Record<string, string> = {
    expected: 'Expected',
    pending: 'Pending',
    receiving: 'In Progress',
    in_progress: 'In Progress',
    received: 'Received',
    partial: 'Partial',
    released: 'Released',
    shipped: 'Shipped',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  // ------------------------------------------
  // Render loading state
  // ------------------------------------------
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <MaterialIcon name="progress_activity" size="xl" className="animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  // ------------------------------------------
  // Render not found
  // ------------------------------------------
  if (!shipment) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <MaterialIcon name="inventory_2" size="xl" className="mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Shipment Not Found</h2>
          <p className="text-muted-foreground mb-4">This shipment doesn't exist or you don't have access.</p>
          <Button onClick={() => navigate('/shipments')}>
            <MaterialIcon name="arrow_back" size="sm" className="mr-2" />
            Back to Shipments
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const isInbound = shipment.shipment_type === 'inbound' || shipment.shipment_type === 'return';
  const isOutbound = shipment.shipment_type === 'outbound';
  const isDockIntakeShipment = (shipment as any).inbound_kind === 'dock_intake';
  const canReceive = isInbound && ['expected', 'receiving'].includes(shipment.status);
  const isReceiving = session !== null;
  const isReceived = shipment.status === 'received' || shipment.status === 'partial';
  const canStartPull = isOutbound && !pullSessionActive && !allPulled && ['expected', 'pending', 'in_progress'].includes(shipment.status);
  const canStartRelease = isOutbound && allPulled && !releaseSessionActive && !allReleased;
  const canCompleteOutbound = isOutbound && (activeOutboundItems.length === 0 || allReleased);
  const partialReleaseCandidates = activeOutboundItems.filter(item => !isReleasedLocation(item.item?.current_location?.code));

  return (
    <DashboardLayout>
      {/* Header / Billing / Actions (keep stable during sidebar expand/collapse) */}
      <div className="mb-6 grid gap-6 lg:grid-cols-3 lg:items-start">
        {/* Left: shipment identity */}
        <div className="flex items-center gap-3 lg:col-span-2 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
            <MaterialIcon name="arrow_back" size="md" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold">{shipment.shipment_number}</h1>
              <ShipmentExceptionBadge
                shipmentId={shipment.id}
                onClick={
                  isDockIntakeShipment
                    ? () => navigate(`/incoming/dock-intake/${shipment.id}?tab=exceptions`)
                    : undefined
                }
              />
              <StatusIndicator status={shipment.status} label={shipmentStatusLabels[shipment.status]} size="sm" />
              {shipment.release_type && (
                <Badge variant="outline" className="text-xs capitalize">{shipment.release_type.replace(/_/g, ' ')}</Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm truncate">
              {shipment.accounts?.account_name || 'No account'} • {shipment.warehouses?.name || 'No warehouse'}
            </p>
          </div>
        </div>

        {/* Right: billing (top) + actions (below) */}
        <div className="lg:col-span-1 min-w-0 space-y-3">
          {canSeeBilling && shipment.account_id && (
            <BillingCalculator
              shipmentId={shipment.id}
              shipmentDirection={shipment.shipment_type as 'inbound' | 'outbound' | 'return'}
              refreshKey={billingRefreshKey}
              title="Billing Calculator"
            />
          )}

          {/* Action Buttons (below calculator) */}
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Button variant="outline" size="sm" onClick={() => {
              if (!isEditing) {
                setEditCarrier(shipment.carrier || '');
                setEditTrackingNumber(shipment.tracking_number || '');
                setEditPoNumber(shipment.po_number || '');
                setEditExpectedArrival(shipment.expected_arrival_date ? new Date(shipment.expected_arrival_date) : undefined);
                setEditNotes(shipment.notes || '');
                setEditInternalNotes(shipment.receiving_notes || '');
                if (shipment.shipment_type === 'outbound') {
                  setEditReleaseType(
                    shipment.release_type?.startsWith('will_call')
                      ? 'will_call'
                      : (shipment.release_type || 'will_call')
                  );
                  setEditReleasedTo(shipment.released_to || shipment.driver_name || shipment.release_to_name || '');
                  setEditReleaseToName(shipment.release_to_name || '');
                  setEditReleaseToEmail(shipment.release_to_email || '');
                  setEditReleaseToPhone(shipment.release_to_phone || '');
                  setEditDriverName(shipment.driver_name || '');
                  setEditDestinationName(shipment.destination_name || '');
                  setEditOriginName(shipment.origin_name || '');
                  setEditScheduledDate(shipment.scheduled_date ? new Date(shipment.scheduled_date) : undefined);
                  setEditCustomerAuthorized(!!shipment.customer_authorized);
                } else {
                  setEditReleaseType('');
                  setEditReleasedTo('');
                  setEditReleaseToName('');
                  setEditReleaseToEmail('');
                  setEditReleaseToPhone('');
                  setEditDriverName('');
                  setEditDestinationName('');
                  setEditOriginName('');
                  setEditScheduledDate(undefined);
                  setEditCustomerAuthorized(false);
                }
              }
              setIsEditing(!isEditing);
            }}>
              <MaterialIcon name="edit" size="sm" className="mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{isEditing ? 'Cancel Edit' : 'Edit'}</span>
              <span className="sm:hidden">{isEditing ? 'Cancel' : 'Edit'}</span>
            </Button>
            {canReceive && !isReceiving && hasPermission(PERMISSIONS.SHIPMENTS_RECEIVE) && (
              <Button size="sm" onClick={startSession} disabled={sessionLoading}>
                <MaterialIcon name="play_arrow" size="sm" className="mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Start Receiving</span>
                <span className="sm:hidden">Receive</span>
              </Button>
            )}
            {canStartPull && (
              <Button size="sm" onClick={handleStartPull}>
                <MaterialIcon name="qr_code_scanner" size="sm" className="mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Start Pull</span>
                <span className="sm:hidden">Pull</span>
              </Button>
            )}
            {canStartRelease && (
              <Button size="sm" onClick={handleStartRelease}>
                <MaterialIcon name="local_shipping" size="sm" className="mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Start Release Scan</span>
                <span className="sm:hidden">Release</span>
              </Button>
            )}
            {/* Complete Shipment button for outbound shipments */}
            {!isInbound && ['pending', 'expected', 'in_progress', 'released'].includes(shipment.status) && (
              <Button size="sm" onClick={() => setShowOutboundCompleteDialog(true)} disabled={!canCompleteOutbound}>
                <MaterialIcon name="check_circle" size="sm" className="mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Complete Shipment</span>
                <span className="sm:hidden">Complete</span>
              </Button>
            )}
            {shipment.account_id && canSeeBilling && (
              <Button variant="secondary" size="sm" onClick={() => setAddAddonDialogOpen(true)}>
                <MaterialIcon name="attach_money" size="sm" className="mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Add Charge</span>
                <span className="sm:hidden">Charge</span>
              </Button>
            )}
            {/* Add Credit Button - Admin Only */}
            {shipment.account_id && canAddCredit && (
              <Button variant="secondary" size="sm" onClick={() => setAddCreditDialogOpen(true)}>
                <MaterialIcon name="money_off" size="sm" className="mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Add Credit</span>
                <span className="sm:hidden">Credit</span>
              </Button>
            )}
            {/* Add Coverage button - only for inbound shipments with received items */}
            {shipment.account_id && canSeeBilling && isInbound && items.some(i => i.item_id) && (
              <Button variant="outline" size="sm" onClick={() => setCoverageDialogOpen(true)}>
                <MaterialIcon name="verified_user" size="sm" className="mr-1 sm:mr-2 text-blue-600" />
                <span className="hidden sm:inline">Add Coverage</span>
                <span className="sm:hidden">Coverage</span>
              </Button>
            )}
            {/* Reassign Account - moved to selected items bar */}
            {/* Cancel Shipment - only for expected, pending, or receiving shipments */}
            {['expected', 'pending', 'receiving', 'in_progress'].includes(shipment.status) && (
              <Button variant="outline" size="sm" onClick={() => setShowCancelDialog(true)}>
                <MaterialIcon name="block" size="sm" className="mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Cancel</span>
              </Button>
            )}
            {/* Help button for receiving workflow */}
            {isInbound && <HelpButton workflow="receiving" />}
          </div>
        </div>
      </div>

      {/* Receiving In Progress Banner */}
      {isReceiving && (
        <Card className="mb-6 border-primary bg-primary/5">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 bg-primary rounded-full animate-pulse" />
                <span className="font-medium">Receiving in progress</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancelReceiving}>
                  <MaterialIcon name="cancel" size="sm" className="mr-2" />
                  Cancel
                </Button>
                <Button size="sm" onClick={openFinishDialog}>
                  <MaterialIcon name="check_circle" size="sm" className="mr-2" />
                  Finish Receiving
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Outbound Status Banner */}
      {isOutbound && ['expected', 'pending', 'in_progress', 'released'].includes(shipment.status) && (
        <Card className="mb-6 border-blue-500 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse" />
                <span className="font-medium">
                  {allReleased
                    ? 'Outbound release ready to complete'
                    : allPulled
                      ? 'Outbound items staged at dock'
                      : 'Outbound pull in progress'}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowCancelDialog(true)}>
                  <MaterialIcon name="cancel" size="sm" className="mr-2" />
                  Cancel
                </Button>
                {!allPulled && (
                  <Button size="sm" onClick={handleStartPull} disabled={pullSessionActive}>
                    <MaterialIcon name="qr_code_scanner" size="sm" className="mr-2" />
                    Pull Items
                  </Button>
                )}
                {allPulled && !allReleased && (
                  <Button size="sm" onClick={handleStartRelease} disabled={releaseSessionActive}>
                    <MaterialIcon name="local_shipping" size="sm" className="mr-2" />
                    Release Scan
                  </Button>
                )}
                <Button size="sm" onClick={() => setShowOutboundCompleteDialog(true)} disabled={!canCompleteOutbound}>
                  <MaterialIcon name="check_circle" size="sm" className="mr-2" />
                  Complete Release
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Outbound Scanning */}
      {isOutbound && (pullSessionActive || releaseSessionActive) && (
        <Card className="mb-6 border-primary/40">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle>Outbound Scanning</CardTitle>
                <CardDescription>
                  {pullSessionActive
                    ? 'Scan each item to stage it at Outbound Dock.'
                    : 'Scan each item to mark it Released.'}
                </CardDescription>
              </div>
              <div className="text-sm text-muted-foreground">
                {activeOutboundItems.length} item{activeOutboundItems.length !== 1 ? 's' : ''} •
                {' '}
                {pullSessionActive ? 'Staged' : 'Released'} {pullSessionActive ? activeOutboundItems.filter(item => isOutboundDock(item.item?.current_location?.code)).length : activeOutboundItems.filter(item => isReleasedLocation(item.item?.current_location?.code)).length}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
              <div className="space-y-4">
                <QRScanner
                  onScan={(value) => handleOutboundScan(value, pullSessionActive ? 'pull' : 'release')}
                  onError={() => {
                    setLastScan({ itemCode: '', result: 'error', message: 'Scanner error. Please try again.' });
                  }}
                  scanning={!processingScan}
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value={manualScanValue}
                    onChange={(e) => setManualScanValue(e.target.value)}
                    placeholder="Enter or scan item code"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleOutboundScan(manualScanValue, pullSessionActive ? 'pull' : 'release');
                        setManualScanValue('');
                      }
                    }}
                  />
                  <Button
                    onClick={() => {
                      handleOutboundScan(manualScanValue, pullSessionActive ? 'pull' : 'release');
                      setManualScanValue('');
                    }}
                    disabled={!manualScanValue.trim() || processingScan}
                  >
                    Scan
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                {lastScan && (
                  <div className={cn(
                    'rounded-lg border p-3 text-sm',
                    lastScan.result === 'success' && 'border-green-500/40 bg-green-500/10 text-green-500',
                    lastScan.result === 'duplicate' && 'border-yellow-500/40 bg-yellow-500/10 text-yellow-500',
                    (lastScan.result === 'invalid' || lastScan.result === 'error') && 'border-red-500/40 bg-red-500/10 text-red-500'
                  )}>
                    <p className="font-semibold">{lastScan.itemCode || 'Scan Result'}</p>
                    <p>{lastScan.message}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-sm">Manual override</Label>
                  <div className="max-h-40 overflow-y-auto rounded-md border">
                    {(() => {
                      const overrideCandidates = pullSessionActive
                        ? activeOutboundItems.filter(item => !isOutboundDock(item.item?.current_location?.code))
                        : activeOutboundItems.filter(item => !isReleasedLocation(item.item?.current_location?.code));

                      if (overrideCandidates.length === 0) {
                        return (
                          <p className="text-xs text-muted-foreground p-2">
                            All items already {pullSessionActive ? 'pulled' : 'released'}.
                          </p>
                        );
                      }

                      const selectableIds = overrideCandidates
                        .map(item => item.item?.id)
                        .filter(Boolean) as string[];

                      const allSelected =
                        selectableIds.length > 0 && selectableIds.every((id) => manualOverrideItemIds.has(id));

                      const compare = (a: string, b: string) =>
                        a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

                      const dir = scanListSortDirection === 'asc' ? 1 : -1;
                      const getItemCode = (si: ShipmentItem) =>
                        (si.item?.item_code || si.expected_description || '').trim();
                      const getLocationCode = (si: ShipmentItem) =>
                        (si.item?.current_location?.code || '').trim();

                      const sortedCandidates = [...overrideCandidates].sort((a, b) => {
                        const aVal = scanListSortField === 'location' ? getLocationCode(a) : getItemCode(a);
                        const bVal = scanListSortField === 'location' ? getLocationCode(b) : getItemCode(b);
                        return compare(aVal, bVal) * dir;
                      });

                      const toggleSort = (field: ScanListSortField) => {
                        if (scanListSortField === field) {
                          setScanListSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
                        } else {
                          setScanListSortField(field);
                          setScanListSortDirection('asc');
                        }
                      };

                      const sortIconName =
                        scanListSortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';

                      return (
                        <>
                          <div className="sticky top-0 z-10 bg-background px-2 py-1 border-b">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <Checkbox
                                  checked={allSelected}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setManualOverrideItemIds(new Set(selectableIds));
                                    } else {
                                      setManualOverrideItemIds(new Set());
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  className="text-xs font-medium inline-flex items-center gap-1 hover:underline"
                                  onClick={() => toggleSort('item_code')}
                                >
                                  Item Code
                                  {scanListSortField === 'item_code' && (
                                    <MaterialIcon name={sortIconName} size="sm" className="opacity-70" />
                                  )}
                                </button>
                                <span className="text-xs text-muted-foreground">
                                  ({overrideCandidates.length})
                                </span>
                              </div>
                              <button
                                type="button"
                                className="text-xs font-medium inline-flex items-center gap-1 hover:underline"
                                onClick={() => toggleSort('location')}
                              >
                                Location
                                {scanListSortField === 'location' && (
                                  <MaterialIcon name={sortIconName} size="sm" className="opacity-70" />
                                )}
                              </button>
                            </div>
                          </div>
                          <div className="p-2 space-y-1">
                            {sortedCandidates.map(item => (
                              <div key={item.id} className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Checkbox
                                    checked={!!item.item?.id && manualOverrideItemIds.has(item.item.id)}
                                    onCheckedChange={(checked) => {
                                      if (!item.item?.id) return;
                                      setManualOverrideItemIds(prev => {
                                        const next = new Set(prev);
                                        if (checked) {
                                          next.add(item.item!.id);
                                        } else {
                                          next.delete(item.item!.id);
                                        }
                                        return next;
                                      });
                                    }}
                                  />
                                  <span className="text-sm font-mono truncate">
                                    {item.item?.item_code || item.expected_description || 'Unknown item'}
                                  </span>
                                </div>
                                <span className="text-xs font-mono text-muted-foreground">
                                  {item.item?.current_location?.code || '-'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  {manualOverrideItemIds.size > 0 && (
                    <p className="text-xs text-muted-foreground">{manualOverrideItemIds.size} item{manualOverrideItemIds.size > 1 ? 's' : ''} selected</p>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => handleManualOverride(pullSessionActive ? 'pull' : 'release')}
                    disabled={manualOverrideItemIds.size === 0}
                  >
                    Mark {pullSessionActive ? 'Pulled' : 'Released'} ({manualOverrideItemIds.size})
                  </Button>
                </div>
                {releaseSessionActive && (
                  <Button variant="destructive" onClick={() => setShowPartialReleaseDialog(true)}>
                    Partial Release / Remove Items
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Mode */}
      {isEditing && (
        <Card className="mb-6 border-primary/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Edit Shipment</CardTitle>
            <CardDescription>Update shipment details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Outbound-specific fields (legacy outbound system parity) */}
            {isOutbound && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Release Type</Label>
                  <Select value={editReleaseType} onValueChange={setEditReleaseType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select release type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="will_call">Will Call (Pickup/Release)</SelectItem>
                      <SelectItem value="disposal">Disposal</SelectItem>
                      <SelectItem value="return">Return to Sender</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Released To / Driver Name</Label>
                  <Input
                    value={editReleasedTo}
                    onChange={(e) => setEditReleasedTo(e.target.value)}
                    placeholder="Name of person picking up / driver"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-3 rounded-md border p-3">
                  <Checkbox
                    id="customer-authorized"
                    checked={editCustomerAuthorized}
                    onCheckedChange={(checked) => setEditCustomerAuthorized(checked === true)}
                  />
                  <div>
                    <Label htmlFor="customer-authorized" className="cursor-pointer font-medium">
                      Customer Authorized
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Mark when the client approved this outbound release (portal, email, or phone).
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Carrier</Label>
                <Input
                  value={editCarrier}
                  onChange={(e) => setEditCarrier(e.target.value)}
                  placeholder="e.g., FedEx, UPS, Local Delivery"
                />
              </div>
              <div className="space-y-2">
                <Label>Tracking Number</Label>
                <Input
                  value={editTrackingNumber}
                  onChange={(e) => setEditTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                />
              </div>
              <div className="space-y-2">
                <Label>PO Number</Label>
                <Input
                  value={editPoNumber}
                  onChange={(e) => setEditPoNumber(e.target.value)}
                  placeholder="Enter PO number"
                />
              </div>
              <div className="space-y-2">
                <Label>{isOutbound ? 'Expected Pickup/Ship Date' : 'Expected Arrival'}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !editExpectedArrival && 'text-muted-foreground'
                      )}
                    >
                      <MaterialIcon name="calendar_today" size="sm" className="mr-2" />
                      {editExpectedArrival ? format(editExpectedArrival, 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editExpectedArrival}
                      onSelect={setEditExpectedArrival}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              {accountSettings?.highlight_shipment_notes && accountSettings?.default_shipment_notes?.trim() && (
                <div className="rounded-md border border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 p-3 text-sm text-orange-900 dark:text-orange-100">
                  <div className="font-medium mb-1">Default Shipment Notes</div>
                  <p className="whitespace-pre-wrap">{accountSettings.default_shipment_notes}</p>
                </div>
              )}
              {isOutbound ? (
                <Tabs defaultValue="internal" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 h-auto">
                    <TabsTrigger
                      value="public"
                      className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                    >
                      <MaterialIcon name="public" size="sm" />
                      Public
                    </TabsTrigger>
                    <TabsTrigger
                      value="internal"
                      className="gap-2 data-[state=active]:bg-amber-600 data-[state=active]:text-white"
                    >
                      <MaterialIcon name="lock" size="sm" />
                      Internal
                    </TabsTrigger>
                    <TabsTrigger
                      value="exceptions"
                      className="gap-2 data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground"
                    >
                      <MaterialIcon name="warning" size="sm" />
                      Exceptions
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="public" className="mt-2 space-y-2">
                    <div className="rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-3">
                      <div className="flex items-start gap-2">
                        <MaterialIcon name="public" size="sm" className="mt-0.5 text-blue-700 dark:text-blue-300" />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                            Public (Client-visible)
                          </div>
                          <p className="text-xs text-blue-800/90 dark:text-blue-200/90">
                            Visible in the client portal and client-facing communications. Do not include internal process notes.
                          </p>
                        </div>
                      </div>
                    </div>
                    <Textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Add PUBLIC notes for the client..."
                      rows={3}
                      className="border-blue-300 focus-visible:ring-blue-500"
                    />
                  </TabsContent>

                  <TabsContent value="internal" className="mt-2 space-y-2">
                    <div className="rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3">
                      <div className="flex items-start gap-2">
                        <MaterialIcon name="lock" size="sm" className="mt-0.5 text-amber-700 dark:text-amber-300" />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                            Internal (Staff only)
                          </div>
                          <p className="text-xs text-amber-800/90 dark:text-amber-200/90">
                            Only visible to staff. Use for internal instructions, troubleshooting, and operational notes.
                          </p>
                        </div>
                      </div>
                    </div>
                    <Textarea
                      value={editInternalNotes}
                      onChange={(e) => setEditInternalNotes(e.target.value)}
                      placeholder="Add INTERNAL staff-only notes..."
                      rows={3}
                      className="border-amber-300 focus-visible:ring-amber-500"
                    />
                  </TabsContent>

                  <TabsContent value="exceptions" className="mt-2">
                    <div className="rounded-md border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-3 mb-2">
                      <div className="flex items-start gap-2">
                        <MaterialIcon name="warning" size="sm" className="mt-0.5 text-red-700 dark:text-red-300" />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-red-900 dark:text-red-100">
                            Exceptions
                          </div>
                          <p className="text-xs text-red-800/90 dark:text-red-200/90">
                            System and workflow exceptions for this shipment.
                          </p>
                        </div>
                      </div>
                    </div>
                    <ShipmentExceptionsChips shipmentId={shipment.id} showHistory={true} />
                  </TabsContent>
                </Tabs>
              ) : (
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add notes about this shipment..."
                  rows={3}
                />
              )}
            </div>

            {/* Outbound-specific fields */}
            {isOutbound && (
              <>
                <div className="pt-4 border-t">
                  <h4 className="font-medium text-sm mb-3">Outbound / Release Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Contact Name</Label>
                      <Input
                        value={editReleaseToName}
                        onChange={(e) => setEditReleaseToName(e.target.value)}
                        placeholder="Contact person name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Contact Email</Label>
                      <Input
                        type="email"
                        value={editReleaseToEmail}
                        onChange={(e) => setEditReleaseToEmail(e.target.value)}
                        placeholder="email@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Contact Phone</Label>
                      <Input
                        type="tel"
                        value={editReleaseToPhone}
                        onChange={(e) => setEditReleaseToPhone(e.target.value)}
                        placeholder="Phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Driver Name</Label>
                      <Input
                        value={editDriverName}
                        onChange={(e) => setEditDriverName(e.target.value)}
                        placeholder="Driver or pickup person name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Scheduled Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !editScheduledDate && 'text-muted-foreground'
                            )}
                          >
                            <MaterialIcon name="calendar_today" size="sm" className="mr-2" />
                            {editScheduledDate ? format(editScheduledDate, 'PPP') : 'Select date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={editScheduledDate}
                            onSelect={setEditScheduledDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>Origin Name</Label>
                      <Input
                        value={editOriginName}
                        onChange={(e) => setEditOriginName(e.target.value)}
                        placeholder="Pickup location or origin"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Destination Name</Label>
                      <Input
                        value={editDestinationName}
                        onChange={(e) => setEditDestinationName(e.target.value)}
                        placeholder="Delivery location or destination"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-2">
              <SaveButton
                onClick={async () => {
                  const updates: Record<string, unknown> = {
                    carrier: editCarrier.trim() || null,
                    tracking_number: editTrackingNumber.trim() || null,
                    po_number: editPoNumber.trim() || null,
                    expected_arrival_date: editExpectedArrival?.toISOString() || null,
                    notes: editNotes.trim() || null,
                  };

                  // Add outbound-specific fields if this is an outbound shipment
                  if (isOutbound) {
                    updates.receiving_notes = editInternalNotes.trim() || null;
                    updates.release_type = editReleaseType || null;
                    updates.released_to = editReleasedTo.trim() || null;
                    updates.release_to_name = editReleaseToName.trim() || null;
                    updates.release_to_email = editReleaseToEmail.trim() || null;
                    updates.release_to_phone = editReleaseToPhone.trim() || null;
                    updates.driver_name = editDriverName.trim() || null;
                    updates.destination_name = editDestinationName.trim() || null;
                    updates.origin_name = editOriginName.trim() || null;
                    updates.scheduled_date = editScheduledDate?.toISOString() || null;

                    const wasCustomerAuthorized = !!shipment.customer_authorized;
                    updates.customer_authorized = editCustomerAuthorized;
                    if (editCustomerAuthorized !== wasCustomerAuthorized) {
                      if (editCustomerAuthorized) {
                        updates.customer_authorized_at = new Date().toISOString();
                        updates.customer_authorized_by = profile?.id || null;
                      } else {
                        updates.customer_authorized_at = null;
                        updates.customer_authorized_by = null;
                      }
                    }
                  }

                  const { error } = await supabase
                    .from('shipments')
                    .update(updates)
                    .eq('id', shipment.id);
                  if (error) throw error;
                  
                  await logShipmentAudit('shipment_updated', updates);
                  toast({ title: 'Shipment Updated' });
                  fetchShipment();
                  setIsEditing(false);
                }}
                label="Save Changes"
                savedLabel="Saved"
              />
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Shipment Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Shipment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Type</Label>
                <p className="font-medium capitalize">{shipment.shipment_type}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Carrier</Label>
                <p className="font-medium">{shipment.carrier || '-'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Tracking</Label>
                <p className="font-medium">{shipment.tracking_number || '-'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">PO Number</Label>
                <p className="font-medium">{shipment.po_number || '-'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">
                  {isOutbound ? 'Expected Pickup/Ship Date' : 'Expected Arrival'}
                </Label>
                <p className="font-medium">
                  {shipment.expected_arrival_date
                    ? format(new Date(shipment.expected_arrival_date), 'MMM d, yyyy')
                    : '-'}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">
                  {isOutbound ? 'Released To' : 'Received At'}
                </Label>
                <p className="font-medium">
                  {isOutbound
                    ? shipment.released_to || shipment.driver_name || shipment.release_to_name || '-'
                    : shipment.received_at
                      ? format(new Date(shipment.received_at), 'MMM d, yyyy h:mm a')
                      : '-'}
                </p>
              </div>
              {isOutbound && (
                <div>
                  <Label className="text-muted-foreground">Release Type</Label>
                  <p className="font-medium capitalize">{shipment.release_type?.replace(/_/g, ' ') || '-'}</p>
                </div>
              )}
              {isOutbound && (
                <div>
                  <Label className="text-muted-foreground">Customer Authorized</Label>
                  <p className="font-medium">
                    {shipment.customer_authorized ? (
                      <Badge variant="outline" className="text-green-600 border-green-300">Authorized</Badge>
                    ) : (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-300">Not Authorized</Badge>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Outbound-specific fields */}
            {isOutbound && (
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium text-sm mb-3">Release Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {shipment.release_to_name && (
                    <div>
                      <Label className="text-muted-foreground">Contact Name</Label>
                      <p className="font-medium">{shipment.release_to_name}</p>
                    </div>
                  )}
                  {shipment.release_to_email && (
                    <div>
                      <Label className="text-muted-foreground">Contact Email</Label>
                      <p className="font-medium">{shipment.release_to_email}</p>
                    </div>
                  )}
                  {shipment.release_to_phone && (
                    <div>
                      <Label className="text-muted-foreground">Contact Phone</Label>
                      <p className="font-medium">{shipment.release_to_phone}</p>
                    </div>
                  )}
                  {shipment.driver_name && (
                    <div>
                      <Label className="text-muted-foreground">Driver Name</Label>
                      <p className="font-medium">{shipment.driver_name}</p>
                    </div>
                  )}
                  {shipment.scheduled_date && (
                    <div>
                      <Label className="text-muted-foreground">Scheduled Date</Label>
                      <p className="font-medium">
                        {format(new Date(shipment.scheduled_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  )}
                  {shipment.origin_name && (
                    <div>
                      <Label className="text-muted-foreground">Origin</Label>
                      <p className="font-medium">{shipment.origin_name}</p>
                    </div>
                  )}
                  {shipment.destination_name && (
                    <div>
                      <Label className="text-muted-foreground">Destination</Label>
                      <p className="font-medium">{shipment.destination_name}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {accountSettings?.highlight_shipment_notes && accountSettings?.default_shipment_notes?.trim() && (
              <div className="rounded-md border border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 p-3 text-sm text-orange-900 dark:text-orange-100">
                <div className="font-medium mb-1">Default Shipment Notes</div>
                <p className="whitespace-pre-wrap">{accountSettings.default_shipment_notes}</p>
              </div>
            )}

            {isOutbound ? (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Notes</Label>
                <Tabs defaultValue="internal" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 h-auto">
                    <TabsTrigger
                      value="public"
                      className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                    >
                      <MaterialIcon name="public" size="sm" />
                      Public
                    </TabsTrigger>
                    <TabsTrigger
                      value="internal"
                      className="gap-2 data-[state=active]:bg-amber-600 data-[state=active]:text-white"
                    >
                      <MaterialIcon name="lock" size="sm" />
                      Internal
                    </TabsTrigger>
                    <TabsTrigger
                      value="exceptions"
                      className="gap-2 data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground"
                    >
                      <MaterialIcon name="warning" size="sm" />
                      Exceptions
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="public" className="mt-2">
                    <div className="rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-3 mb-2">
                      <div className="flex items-start gap-2">
                        <MaterialIcon name="public" size="sm" className="mt-0.5 text-blue-700 dark:text-blue-300" />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                            Public (Client-visible)
                          </div>
                          <p className="text-xs text-blue-800/90 dark:text-blue-200/90">
                            Visible in client portal and client-facing communications.
                          </p>
                        </div>
                      </div>
                    </div>
                    {shipment.notes?.trim() ? (
                      <p className="whitespace-pre-wrap">{shipment.notes}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">No public notes.</p>
                    )}
                  </TabsContent>

                  <TabsContent value="internal" className="mt-2">
                    <div className="rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3 mb-2">
                      <div className="flex items-start gap-2">
                        <MaterialIcon name="lock" size="sm" className="mt-0.5 text-amber-700 dark:text-amber-300" />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                            Internal (Staff only)
                          </div>
                          <p className="text-xs text-amber-800/90 dark:text-amber-200/90">
                            Only visible to staff.
                          </p>
                        </div>
                      </div>
                    </div>
                    {shipment.receiving_notes?.trim() ? (
                      <p className="whitespace-pre-wrap">{shipment.receiving_notes}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">No internal notes.</p>
                    )}
                  </TabsContent>

                  <TabsContent value="exceptions" className="mt-2">
                    <div className="rounded-md border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-3 mb-2">
                      <div className="flex items-start gap-2">
                        <MaterialIcon name="warning" size="sm" className="mt-0.5 text-red-700 dark:text-red-300" />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-red-900 dark:text-red-100">
                            Exceptions
                          </div>
                        </div>
                      </div>
                    </div>
                    <ShipmentExceptionsChips shipmentId={shipment.id} showHistory={true} />
                  </TabsContent>
                </Tabs>
              </div>
            ) : shipment.notes?.trim() ? (
              <div>
                <Label className="text-muted-foreground">Notes</Label>
                <p className="mt-1 whitespace-pre-wrap">{shipment.notes}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Quick Info / Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expected Items</span>
              <span className="font-medium">{items.length}</span>
            </div>
            {isOutbound ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Released Items</span>
                  <span className="font-medium">
                    {items.filter(i => i.status === 'released').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Released At</span>
                  <span className="font-medium">
                    {shipment.signature_timestamp
                      ? format(new Date(shipment.signature_timestamp), 'MMM d, yyyy h:mm a')
                      : shipment.shipped_at
                        ? format(new Date(shipment.shipped_at), 'MMM d, yyyy h:mm a')
                        : '-'}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Received Items</span>
                <span className="font-medium">
                  {items.filter(i => i.status === 'received').length}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span className="font-medium">
                {format(new Date(shipment.created_at), 'MMM d, yyyy')}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shipment Items */}
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle>Items</CardTitle>
              <CardDescription>Expected and received items for this shipment</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Add Items button for inbound/return shipments that are not completed */}
              {(shipment.shipment_type === 'inbound' || shipment.shipment_type === 'return') &&
               shipment.status !== 'completed' && shipment.status !== 'cancelled' && (
                <Button variant="outline" size="sm" onClick={() => setAddItemDialogOpen(true)}>
                  <MaterialIcon name="add" size="sm" className="mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Add Items</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              )}
              <Select
                value={activeItemViewId || defaultItemViewId || 'default'}
                onValueChange={setActiveItemViewId}
                disabled={itemDisplayLoading || itemDisplaySettings.views.length === 0}
              >
                <SelectTrigger className="w-[140px] sm:w-[180px] h-9">
                  <div className="flex items-center gap-2">
                    <MaterialIcon name="view_list" size="sm" className="text-muted-foreground" />
                    <SelectValue placeholder="View" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {itemDisplaySettings.views.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                      {v.is_default ? ' (default)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            {/* Create Task from selected items */}
            {selectedItemIds.size > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">{selectedItemIds.size} selected</span>
                <Select value={selectedTaskType} onValueChange={setSelectedTaskType}>
                  <SelectTrigger className="w-[130px] sm:w-[160px]">
                    <SelectValue placeholder="Task type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inspection">Inspection</SelectItem>
                    <SelectItem value="Assembly">Assembly</SelectItem>
                    <SelectItem value="Repair">Repair</SelectItem>
                    <SelectItem value="Disposal">Disposal</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={handleCreateTask}
                  disabled={!selectedTaskType}
                >
                  <MaterialIcon name="assignment" size="sm" className="mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Create Task</span>
                  <span className="sm:hidden">Create</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreateOutbound}
                >
                  <MaterialIcon name="local_shipping" size="sm" className="mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Outbound</span>
                  <span className="sm:hidden">Outbound</span>
                </Button>
                {shipment.account_id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReassignDialog(true)}
                  >
                    <MaterialIcon name="swap_horiz" size="sm" className="mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Reassign</span>
                    <span className="sm:hidden">Reassign</span>
                  </Button>
                )}
              </div>
            )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={items.filter(i => i.item?.id).length > 0 && selectedItemIds.size === items.filter(i => i.item?.id).length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="w-10"></TableHead>
                {shipmentItemVisibleColumns.map((col) => (
                  <TableHead key={col}>{getColumnLabel(itemDisplaySettings, col)}</TableHead>
                ))}
                <TableHead className="w-24">Class</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={shipmentItemsTableColSpan} className="text-center text-muted-foreground py-8">
                    No items in this shipment
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <ShipmentItemRow
                    key={item.id}
                    item={item as ShipmentItemRowData}
                    isSelected={item.item?.id ? selectedItemIds.has(item.item.id) : false}
                    visibleColumns={shipmentItemVisibleColumns}
                    onSelect={(checked) => {
                      if (item.item?.id) {
                        if (checked) {
                          setSelectedItemIds(prev => new Set([...prev, item.item!.id]));
                        } else {
                          setSelectedItemIds(prev => {
                            const next = new Set(prev);
                            next.delete(item.item!.id);
                            return next;
                          });
                        }
                      }
                    }}
                    onUpdate={fetchShipment}
                    onDelete={() => fetchShipment()}
                    onDuplicate={handleDuplicateItem}
                    isInbound={isInbound}
                    isCompleted={shipment.status === 'completed' || shipment.status === 'cancelled' || shipment.status === 'shipped'}
                    classes={classes}
                    accountId={shipment.account_id || undefined}
                  />
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Photos Section */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle>Photos</CardTitle>
            <CardDescription>Capture or upload photos</CardDescription>
          </div>
          <div className="flex gap-2">
            <PhotoScannerButton
              entityType="shipment"
              entityId={shipment.id}
              tenantId={profile?.tenant_id}
              existingPhotos={getPhotoUrls(receivingPhotos)}
              maxPhotos={20}
              onPhotosSaved={async (urls) => {
                // Convert new URLs to TaggablePhoto format and merge with existing
                const existingUrls = getPhotoUrls(receivingPhotos);
                const newUrls = urls.filter(u => !existingUrls.includes(u));
                const newTaggablePhotos: TaggablePhoto[] = newUrls.map(url => ({
                  url,
                  isPrimary: false,
                  needsAttention: false,
                  isRepair: false,
                }));
                const normalizedExisting: TaggablePhoto[] = receivingPhotos.map(p =>
                  typeof p === 'string'
                    ? { url: p, isPrimary: false, needsAttention: false, isRepair: false }
                    : p
                );
                const allPhotos = [...normalizedExisting, ...newTaggablePhotos];
                setReceivingPhotos(allPhotos);
                await supabase
                  .from('shipments')
                  .update({ receiving_photos: allPhotos as unknown as Json })
                  .eq('id', shipment.id);
              }}
              label="Photo"
              size="sm"
            />
            <PhotoUploadButton
              entityType="shipment"
              entityId={shipment.id}
              tenantId={profile?.tenant_id}
              existingPhotos={getPhotoUrls(receivingPhotos)}
              maxPhotos={20}
              size="sm"
              onPhotosSaved={async (urls) => {
                // Convert new URLs to TaggablePhoto format and merge with existing
                const existingUrls = getPhotoUrls(receivingPhotos);
                const newUrls = urls.filter(u => !existingUrls.includes(u));
                const newTaggablePhotos: TaggablePhoto[] = newUrls.map(url => ({
                  url,
                  isPrimary: false,
                  needsAttention: false,
                  isRepair: false,
                }));
                const normalizedExisting: TaggablePhoto[] = receivingPhotos.map(p =>
                  typeof p === 'string'
                    ? { url: p, isPrimary: false, needsAttention: false, isRepair: false }
                    : p
                );
                const allPhotos = [...normalizedExisting, ...newTaggablePhotos];
                setReceivingPhotos(allPhotos);
                await supabase
                  .from('shipments')
                  .update({ receiving_photos: allPhotos as unknown as Json })
                  .eq('id', shipment.id);
              }}
            />
          </div>
        </CardHeader>
        <CardContent>
          {receivingPhotos.length > 0 ? (
            <TaggablePhotoGrid
              photos={receivingPhotos}
              onPhotosChange={async (photos) => {
                setReceivingPhotos(photos);
                await supabase
                  .from('shipments')
                  .update({ receiving_photos: photos as unknown as Json })
                  .eq('id', shipment.id);
              }}
              enableTagging={true}
            />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              No photos yet. Tap "Take Photos" to capture.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Documents Section */}
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MaterialIcon name="description" size="sm" />
            Documents
            <Badge variant="outline">{documents.length}</Badge>
          </CardTitle>
          <CardDescription>
            Capture or upload paperwork and supporting shipment documents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentCapture
            refetchKey={documentRefreshKey}
            context={{ type: 'shipment', shipmentId: shipment.id }}
            maxDocuments={12}
            ocrEnabled={true}
            onDocumentAdded={() => {
              void refetchDocuments();
            }}
            onDocumentRemoved={() => {
              void refetchDocuments();
            }}
          />
        </CardContent>
      </Card>

      {/* Receiving Notes (shown when received) */}
      {isReceived && shipment.receiving_notes && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Receiving Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{shipment.receiving_notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Shipment Activity - Comprehensive timeline of all events */}
      <div className="mt-6">
        <EntityActivityFeed entityType="shipment" entityId={shipment.id} title="Activity" description="Complete timeline of billing, operations, and status changes for this shipment" />
      </div>

      {/* Finish Receiving Dialog */}
      <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Finish Receiving</AlertDialogTitle>
            <AlertDialogDescription>
              Verify the quantities received for each item. This will create inventory items.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Expected</TableHead>
                  <TableHead className="text-center w-32">Received</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receivedItems.map((item) => (
                  <TableRow key={item.shipment_item_id}>
                    <TableCell>{item.expected_description || '-'}</TableCell>
                    <TableCell className="text-center">{item.expected_quantity}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        value={item.actual_quantity}
                        onChange={(e) => updateReceivedQuantity(
                          item.shipment_item_id,
                          parseInt(e.target.value) || 0
                        )}
                        className="w-20 text-center mx-auto"
                      />
                    </TableCell>
                    <TableCell>
                      <StatusIndicator status={item.status} size="sm" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {receivedItems.some(i => i.status !== 'received') && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-md text-sm">
              <MaterialIcon name="warning" size="sm" className="text-yellow-600" />
              <span>Some items have discrepancies. These will be flagged for review.</span>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinishReceiving}>
              Complete Receiving
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Print Labels Dialog */}
      <PrintLabelsDialog
        open={showPrintLabelsDialog}
        onOpenChange={setShowPrintLabelsDialog}
        items={createdItemsForLabels}
        title="Print Item Labels"
        description={`${createdItemsForLabels.length} items were created from receiving. Print labels now?`}
      />

      {/* Add Charge Dialog - Manager/Admin Only */}
      {shipment.account_id && canSeeBilling && (
        <AddAddonDialog
          open={addAddonDialogOpen}
          onOpenChange={setAddAddonDialogOpen}
          accountId={shipment.account_id}
          accountName={shipment.accounts?.account_name}
          shipmentId={shipment.id}
          onSuccess={() => {
            fetchShipment();
            setBillingRefreshKey(prev => prev + 1);
          }}
        />
      )}

      {/* Add Credit Dialog - Admin Only */}
      {shipment.account_id && canAddCredit && (
        <AddCreditDialog
          open={addCreditDialogOpen}
          onOpenChange={setAddCreditDialogOpen}
          accountId={shipment.account_id}
          accountName={shipment.accounts?.account_name}
          shipmentId={shipment.id}
          onSuccess={() => {
            fetchShipment();
            setBillingRefreshKey(prev => prev + 1);
          }}
        />
      )}

      {/* Shipment Coverage Dialog - Manager/Admin Only */}
      {shipment.account_id && canSeeBilling && (
        <ShipmentCoverageDialog
          open={coverageDialogOpen}
          onOpenChange={setCoverageDialogOpen}
          shipmentId={shipment.id}
          accountId={shipment.account_id}
          shipmentNumber={shipment.shipment_number}
          itemCount={items.length}
          onSuccess={() => {
            fetchShipment();
            setBillingRefreshKey(prev => prev + 1);
          }}
        />
      )}

      {/* Add Item Dialog for Inbound Shipments */}
      <AddShipmentItemDialog
        open={addItemDialogOpen}
        onOpenChange={setAddItemDialogOpen}
        shipmentId={shipment.id}
        accountId={shipment.account_id || undefined}
        warehouseId={shipment.warehouse_id || undefined}
        sidemarkId={shipment.sidemark_id || undefined}
        tenantId={profile?.tenant_id}
        classes={classes}
        onSuccess={() => {
          fetchShipment();
        }}
      />

      {/* Cancel Shipment Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Shipment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this shipment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Shipment</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelShipment}
              disabled={cancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelling ? (
                <>
                  <MaterialIcon name="progress_activity" size="sm" className="mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Shipment'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Outbound Completion Dialog */}
      <AlertDialog open={showOutboundCompleteDialog} onOpenChange={setShowOutboundCompleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Shipment</AlertDialogTitle>
            <AlertDialogDescription>
              This will release {items.length} item(s) and mark the shipment as shipped.
              {receivingPhotos.length === 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Note: At least one photo is required to complete this shipment.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCompleteOutbound}
              disabled={completingOutbound || receivingPhotos.length === 0}
            >
              {completingOutbound ? (
                <>
                  <MaterialIcon name="progress_activity" size="sm" className="mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                'Complete Shipment'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Partial Release Dialog */}
      <AlertDialog open={showPartialReleaseDialog} onOpenChange={setShowPartialReleaseDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Partial Release</AlertDialogTitle>
            <AlertDialogDescription>
              Select items to remove from this shipment and add a required note.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div className="space-y-2 max-h-64 overflow-y-auto rounded-md border p-3">
              {partialReleaseCandidates.length === 0 ? (
                <p className="text-sm text-muted-foreground">All items are already released.</p>
              ) : (
                partialReleaseCandidates.map(item => (
                  <div key={item.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={partialReleaseItems.has(item.id)}
                        onCheckedChange={(checked) => {
                          setPartialReleaseItems(prev => {
                            const next = new Set(prev);
                            if (checked) {
                              next.add(item.id);
                            } else {
                              next.delete(item.id);
                            }
                            return next;
                          });
                        }}
                      />
                      <div className="text-sm">
                        <p className="font-medium">{item.item?.item_code || item.expected_description || 'Unknown item'}</p>
                        <p className="text-muted-foreground">
                          Location: {item.item?.current_location?.code || '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="space-y-2">
              <Label>Required note</Label>
              <Textarea
                value={partialReleaseNote}
                onChange={(e) => setPartialReleaseNote(e.target.value)}
                placeholder="Explain why items are not being released..."
                rows={3}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmitPartialRelease}
              disabled={submittingPartialRelease || partialReleaseItems.size === 0 || !partialReleaseNote.trim()}
            >
              {submittingPartialRelease ? (
                <>
                  <MaterialIcon name="progress_activity" size="sm" className="mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Remove Selected Items'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Task Dialog (selected shipment items) */}
      <TaskDialog
        open={showCreateTaskDialog}
        onOpenChange={(open) => {
          setShowCreateTaskDialog(open);
          if (!open) setSelectedTaskType('');
        }}
        selectedItemIds={Array.from(selectedItemIds)}
        preSelectedTaskType={selectedTaskType}
        onSuccess={handleTaskDialogSuccess}
      />

      {/* Reassign Account Dialog - operates on selected items */}
      {shipment.account_id && (
        <ReassignAccountDialog
          open={showReassignDialog}
          onOpenChange={(open) => {
            setShowReassignDialog(open);
            if (!open) setSelectedItemIds(new Set());
          }}
          entityType="items"
          entityIds={Array.from(selectedItemIds)}
          currentAccountId={shipment.account_id}
          currentAccountName={shipment.accounts?.account_name}
          onSuccess={() => {
            fetchShipment();
            setSelectedItemIds(new Set());
          }}
          onShipmentCreated={(newShipmentId) => {
            navigate(`/shipments/${newShipmentId}`);
          }}
          tenantId={profile?.tenant_id}
          userId={profile?.id}
        />
      )}

      {/* SOP Validation Dialog */}
      <SOPValidationDialog
        open={sopValidationOpen}
        onOpenChange={setSopValidationOpen}
        blockers={sopBlockers}
        onOverride={() => {
          const warnings = sopBlockers.filter(b => b.severity === 'warning');
          setPendingOverrideWarnings(warnings);
          setSopValidationOpen(false);
          setShowSignatureDialog(true);
        }}
      />

      {/* Signature Dialog - shown after validation passes, before completing outbound */}
      {isOutbound && (
        <SignatureDialog
          open={showSignatureDialog}
          onOpenChange={(open) => {
            setShowSignatureDialog(open);
            if (!open) setPendingOverrideWarnings(undefined);
          }}
          releasedToName={shipment?.released_to || undefined}
          itemCount={activeOutboundItems.length}
          onConfirm={async (sigData) => {
            await executeOutboundCompletion(sigData, pendingOverrideWarnings);
          }}
        />
      )}
    </DashboardLayout>
  );
}
