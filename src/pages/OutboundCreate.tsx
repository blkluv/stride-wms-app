import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useOutboundTypes, useAccountItems } from '@/hooks/useOutbound';
import { useSidemarks } from '@/hooks/useSidemarks';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { SearchableSelect, SelectOption } from '@/components/ui/searchable-select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { HelpButton } from '@/components/prompts';

// ============================================
// TYPES
// ============================================

interface Account {
  id: string;
  account_name: string;
  account_code: string | null;
}

interface Warehouse {
  id: string;
  name: string;
}

interface FormErrors {
  account?: string;
  warehouse?: string;
  outbound_type?: string;
  release_type?: string;
  items?: string;
}

// ============================================
// COMPONENT
// ============================================

export default function OutboundCreate() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const { toast } = useToast();

  // Get pre-selected items from navigation state (from Inventory or Item Details)
  const preSelectedItemIds = (location.state as any)?.itemIds || [];
  const preSelectedAccountId = (location.state as any)?.accountId || '';

  // Hooks
  const { outboundTypes, loading: typesLoading } = useOutboundTypes();

  // Draft outbound shipment (create immediately to get OUT-##### number)
  const [draftShipmentId, setDraftShipmentId] = useState<string | null>(null);
  const [draftShipmentNumber, setDraftShipmentNumber] = useState<string | null>(null);
  const [draftCreating, setDraftCreating] = useState(false);
  const draftCreateStartedRef = useRef(false);
  const draftFinalizedRef = useRef(false);
  const draftCleanupStartedRef = useRef(false);

  const cleanupDraftShipment = useCallback(async () => {
    if (!profile?.tenant_id) return;
    if (!draftShipmentId) return;
    if (draftFinalizedRef.current) return;
    if (draftCleanupStartedRef.current) return;
    draftCleanupStartedRef.current = true;

    try {
      const now = new Date().toISOString();

      // If anything allocated items for this draft, restore them before removing draft rows.
      const { data: draftItems, error: draftItemsError } = await (supabase.from('shipment_items') as any)
        .select('item_id')
        .eq('shipment_id', draftShipmentId);

      if (!draftItemsError) {
        const draftItemIds: string[] = (Array.isArray(draftItems) ? draftItems : [])
          .map((r: any) => r?.item_id)
          .filter((v: any) => typeof v === 'string');

        if (draftItemIds.length > 0) {
          await (supabase.from('items') as any)
            .update({ status: 'stored' })
            .in('id', draftItemIds)
            .eq('status', 'allocated');
        }
      } else {
        console.warn('[OutboundCreate] draft cleanup fetch items error:', draftItemsError);
      }

      // Best-effort cleanup so abandoned drafts don't appear in outbound lists.
      await (supabase.from('shipment_items') as any)
        .delete()
        .eq('shipment_id', draftShipmentId);

      await (supabase.from('shipments') as any)
        .update({ deleted_at: now, status: 'cancelled' })
        .eq('tenant_id', profile.tenant_id)
        .eq('id', draftShipmentId);
    } catch (err) {
      console.warn('[OutboundCreate] draft cleanup error:', err);
    }
  }, [draftShipmentId, profile?.tenant_id]);

  // Form state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});

  // Shipment fields
  const [accountId, setAccountId] = useState<string>(preSelectedAccountId);
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [outboundTypeId, setOutboundTypeId] = useState<string>('');
  const [sidemarkId, setSidemarkId] = useState<string>('');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [releaseType, setReleaseType] = useState<string>('will_call');
  const [releasedTo, setReleasedTo] = useState('');
  const [releaseToEmail, setReleaseToEmail] = useState('');
  const [releaseToPhone, setReleaseToPhone] = useState('');
  const [customerAuthorized, setCustomerAuthorized] = useState(true);
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [poNumber, setPoNumber] = useState('');

  // Item selection
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set(preSelectedItemIds));
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch account items
  const { items: accountItems, loading: itemsLoading } = useAccountItems(accountId || undefined);

  // Fetch sidemarks filtered by account
  const { sidemarks, loading: sidemarksLoading } = useSidemarks(accountId || undefined);

  // Create draft shipment on entry (OUT# assigned by DB trigger)
  useEffect(() => {
    if (!profile?.tenant_id || !profile?.id) return;
    if (draftShipmentId) return;
    if (draftCreateStartedRef.current) return;
    draftCreateStartedRef.current = true;

    const createDraft = async () => {
      setDraftCreating(true);
      try {
        const now = new Date().toISOString();
        const { data, error } = await (supabase.from('shipments') as any)
          .insert({
            tenant_id: profile.tenant_id,
            shipment_type: 'outbound',
            status: 'pending',
            // Create as soft-deleted so abandoned drafts don't surface as real shipments.
            // We'll "un-delete" it on successful submit.
            deleted_at: now,
            // Seed account if the user navigated here from an item context
            account_id: preSelectedAccountId || null,
            created_by: profile.id,
            customer_authorized: true,
            customer_authorized_at: now,
            customer_authorized_by: profile.id,
            release_type: 'will_call',
          })
          .select('id, shipment_number')
          .single();

        if (error) throw error;
        setDraftShipmentId(data.id);
        setDraftShipmentNumber(data.shipment_number);
      } catch (err: any) {
        console.error('[OutboundCreate] draft create error:', err);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: err?.message || 'Failed to start outbound shipment',
        });
        // Allow retry if the user refreshes
        draftCreateStartedRef.current = false;
      } finally {
        setDraftCreating(false);
      }
    };

    void createDraft();
  }, [profile?.tenant_id, profile?.id, draftShipmentId, preSelectedAccountId, toast]);

  // Cleanup draft shipment if the user abandons the page.
  useEffect(() => {
    return () => {
      void cleanupDraftShipment();
    };
  }, [cleanupDraftShipment]);
  // ------------------------------------------
  // Fetch reference data
  // ------------------------------------------
  useEffect(() => {
    if (!profile?.tenant_id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch accounts
        const accountsRes = await (supabase.from('accounts') as any)
          .select('id, account_name, account_code')
          .eq('tenant_id', profile.tenant_id)
          .is('deleted_at', null)
          .order('account_name');

        // Fetch warehouses
        const warehousesRes = await (supabase.from('warehouses') as any)
          .select('id, name')
          .eq('tenant_id', profile.tenant_id)
          .is('deleted_at', null)
          .order('name');

        if (accountsRes.error) {
          console.error('[OutboundCreate] accounts fetch:', accountsRes.error);
        }
        if (warehousesRes.error) {
          console.error('[OutboundCreate] warehouses fetch:', warehousesRes.error);
        }

        setAccounts(accountsRes.data || []);
        setWarehouses(warehousesRes.data || []);

        // Set default warehouse if only one exists
        if (warehousesRes.data?.length === 1) {
          setWarehouseId(warehousesRes.data[0].id);
        }

        // Set default outbound type (Will Call)
        // This will be set after outbound types load
      } catch (err) {
        console.error('[OutboundCreate] fetchData exception:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile?.tenant_id]);

  // Set default outbound type when types load
  useEffect(() => {
    if (outboundTypes.length > 0 && !outboundTypeId) {
      const willCall = outboundTypes.find(t => t.name === 'Will Call');
      setOutboundTypeId(willCall?.id || outboundTypes[0].id);
    }
  }, [outboundTypes, outboundTypeId]);

  // Convert to SelectOption arrays
  const accountOptions: SelectOption[] = useMemo(
    () => accounts.map(a => ({
      value: a.id,
      label: a.account_name,
      subtitle: a.account_code || undefined,
    })),
    [accounts]
  );

  const warehouseOptions: SelectOption[] = useMemo(
    () => warehouses.map(w => ({ value: w.id, label: w.name })),
    [warehouses]
  );

  const outboundTypeOptions: SelectOption[] = useMemo(
    () => outboundTypes.map(t => ({ value: t.id, label: t.name })),
    [outboundTypes]
  );

  const sidemarkOptions: SelectOption[] = useMemo(
    () => sidemarks.map(s => ({
      value: s.id,
      label: s.sidemark_name,
      subtitle: s.sidemark_code || undefined,
    })),
    [sidemarks]
  );

  const releaseTypeOptions: SelectOption[] = useMemo(
    () => ([
      { value: 'will_call', label: 'Will Call (Pickup/Release)' },
      { value: 'disposal', label: 'Disposal' },
      { value: 'return', label: 'Return to Sender' },
    ]),
    []
  );

  // Filter items by search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return accountItems;
    const query = searchQuery.toLowerCase();
    return accountItems.filter(item =>
      item.item_code?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.vendor?.toLowerCase().includes(query) ||
      item.location?.code?.toLowerCase().includes(query) ||
      item.sidemark?.sidemark_name?.toLowerCase().includes(query) ||
      item.room?.toLowerCase().includes(query)
    );
  }, [accountItems, searchQuery]);

  const itemQuantityById = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of accountItems as any[]) {
      const qty = typeof item?.quantity === 'number' && Number.isFinite(item.quantity) ? item.quantity : 1;
      if (typeof item?.id === 'string') {
        map.set(item.id, qty);
      }
    }
    return map;
  }, [accountItems]);

  // ------------------------------------------
  // Item selection handlers
  // ------------------------------------------
  const toggleItemSelection = (itemId: string) => {
    const newSet = new Set(selectedItemIds);
    if (newSet.has(itemId)) {
      newSet.delete(itemId);
    } else {
      newSet.add(itemId);
    }
    setSelectedItemIds(newSet);
    if (errors.items) {
      setErrors({ ...errors, items: undefined });
    }
  };

  const selectAllItems = () => {
    const allIds = new Set(filteredItems.map(item => item.id));
    setSelectedItemIds(allIds);
    if (errors.items) {
      setErrors({ ...errors, items: undefined });
    }
  };

  const deselectAllItems = () => {
    setSelectedItemIds(new Set());
  };

  // ------------------------------------------
  // Validation
  // ------------------------------------------
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!accountId) {
      newErrors.account = 'Please select an account';
    }
    if (!warehouseId) {
      newErrors.warehouse = 'Please select a warehouse';
    }
    if (!outboundTypeId) {
      newErrors.outbound_type = 'Please select an outbound type';
    }
    if (selectedItemIds.size === 0) {
      newErrors.items = 'Please select at least one item';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ------------------------------------------
  // Submit handler
  // ------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.tenant_id || !profile?.id) {
      toast({ variant: 'destructive', title: 'Error', description: 'Not authenticated' });
      return;
    }

    if (!validate()) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Please fix the errors below' });
      return;
    }

    if (!draftShipmentId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Outbound shipment draft not ready yet. Please wait a moment and try again.',
      });
      return;
    }

    setSaving(true);

    try {
      const itemIds = Array.from(selectedItemIds);

      // 1) Fetch existing items so retries are idempotent (and can reconcile deselections)
      const { data: existingItems, error: existingError } = await (supabase.from('shipment_items') as any)
        .select('item_id')
        .eq('shipment_id', draftShipmentId);

      if (existingError) throw existingError;
      const existingItemIds: string[] = (Array.isArray(existingItems) ? existingItems : [])
        .map((r: any) => r?.item_id)
        .filter((v: any) => typeof v === 'string');

      const removedItemIds = existingItemIds.filter((id) => !selectedItemIds.has(id));

      // 2) Update the draft shipment details (keep it soft-deleted until everything succeeds)
      const { error: updateError } = await (supabase.from('shipments') as any)
        .update({
          account_id: accountId,
          warehouse_id: warehouseId,
          outbound_type_id: outboundTypeId,
          sidemark_id: sidemarkId || null,
          expected_arrival_date: expectedDate || null,
          notes: notes || null,
          release_type: releaseType || null,
          released_to: releasedTo.trim() || null,
          driver_name: releasedTo.trim() || null,
          // Keep legacy contact fields in sync (used by older release flows)
          release_to_name: releasedTo.trim() || null,
          release_to_email: releaseToEmail.trim() || null,
          release_to_phone: releaseToPhone.trim() || null,
          customer_authorized: customerAuthorized,
          customer_authorized_at: customerAuthorized ? new Date().toISOString() : null,
          customer_authorized_by: customerAuthorized ? profile.id : null,
          carrier: carrier.trim() || null,
          tracking_number: trackingNumber.trim() || null,
          po_number: poNumber.trim() || null,
        })
        .eq('id', draftShipmentId);

      if (updateError) throw updateError;

      // 3) Replace shipment_items to exactly match the current selection
      const { error: deleteItemsError } = await (supabase.from('shipment_items') as any)
        .delete()
        .eq('shipment_id', draftShipmentId);
      if (deleteItemsError) throw deleteItemsError;

      const toInsert = itemIds.map((item_id) => ({
        shipment_id: draftShipmentId,
        item_id,
        expected_quantity: itemQuantityById.get(item_id) ?? 1,
        status: 'pending',
      }));

      if (toInsert.length > 0) {
        const { error: insertError } = await (supabase.from('shipment_items') as any).insert(toInsert);
        if (insertError) throw insertError;
      }

      // 4) Best-effort: un-allocate items removed from the draft selection
      if (removedItemIds.length > 0) {
        const { error: deallocateError } = await (supabase.from('items') as any)
          .update({ status: 'stored' })
          .in('id', removedItemIds)
          .eq('status', 'allocated');
        if (deallocateError) throw deallocateError;
      }

      // 5) Finalize the draft by un-deleting it before allocating inventory
      const { error: finalizeError } = await (supabase.from('shipments') as any)
        .update({ deleted_at: null })
        .eq('id', draftShipmentId);
      if (finalizeError) throw finalizeError;

      // 6) Mark selected items as allocated (after the shipment is visible)
      if (itemIds.length > 0) {
        const { error: allocateError } = await (supabase.from('items') as any)
          .update({ status: 'allocated' })
          .in('id', itemIds);
        if (allocateError) throw allocateError;
      }

      toast({
        title: 'Outbound Shipment Created',
        description: draftShipmentNumber ? `Shipment ${draftShipmentNumber} created.` : 'Outbound shipment created.',
      });

      draftFinalizedRef.current = true;
      navigate(`/shipments/${draftShipmentId}`);
    } catch (err: any) {
      console.error('[OutboundCreate] submit error:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Failed to create outbound shipment',
      });
    } finally {
      setSaving(false);
    }
  };

  // ------------------------------------------
  // Loading state
  // ------------------------------------------
  if (loading || typesLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <MaterialIcon name="progress_activity" size="xl" className="animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto max-w-4xl px-4 pb-safe">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 pt-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
            <MaterialIcon name="arrow_back" size="md" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold truncate flex items-center gap-2">
              Create Outbound Shipment
              <Badge variant="outline" className="font-mono whitespace-nowrap">
                {draftCreating ? 'Generating…' : (draftShipmentNumber || '—')}
              </Badge>
            </h1>
            <p className="text-sm text-muted-foreground">Select items to ship out</p>
          </div>
          <HelpButton workflow="outbound" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Shipment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Shipment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Account */}
              <div className="space-y-1.5">
                <Label>
                  Account <span className="text-destructive">*</span>
                </Label>
                <SearchableSelect
                  data-testid="account-select"
                  options={accountOptions}
                  value={accountId}
                  onChange={(v) => {
                    setAccountId(v);
                    setSidemarkId('');
                    setSelectedItemIds(new Set()); // Clear selection when account changes
                    if (errors.account) setErrors({ ...errors, account: undefined });
                  }}
                  placeholder="Select account..."
                  searchPlaceholder="Search accounts..."
                  emptyText="No accounts found"
                  recentKey="outbound-accounts"
                  error={errors.account}
                />
              </div>

              {/* Outbound Type & Warehouse - side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>
                    Outbound Type <span className="text-destructive">*</span>
                  </Label>
                  <SearchableSelect
                    data-testid="outbound-type-select"
                    options={outboundTypeOptions}
                    value={outboundTypeId}
                    onChange={(v) => {
                      setOutboundTypeId(v);
                      if (errors.outbound_type) setErrors({ ...errors, outbound_type: undefined });
                    }}
                    placeholder="Select type..."
                    searchPlaceholder="Search types..."
                    emptyText="No types found"
                    error={errors.outbound_type}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>
                    Warehouse <span className="text-destructive">*</span>
                  </Label>
                  <SearchableSelect
                    data-testid="warehouse-select"
                    options={warehouseOptions}
                    value={warehouseId}
                    onChange={(v) => {
                      setWarehouseId(v);
                      if (errors.warehouse) setErrors({ ...errors, warehouse: undefined });
                    }}
                    placeholder="Select warehouse..."
                    searchPlaceholder="Search warehouses..."
                    emptyText="No warehouses found"
                    error={errors.warehouse}
                  />
                </div>
              </div>

              {/* Sidemark (filtered by account) */}
              {accountId && (
                <div className="space-y-1.5">
                  <Label>Sidemark / Project</Label>
                  <SearchableSelect
                    options={sidemarkOptions}
                    value={sidemarkId}
                    onChange={setSidemarkId}
                    placeholder={sidemarksLoading ? 'Loading...' : 'Select sidemark (optional)...'}
                    searchPlaceholder="Search sidemarks..."
                    emptyText="No sidemarks for this account"
                    disabled={sidemarksLoading}
                    clearable
                  />
                </div>
              )}

              {/* Legacy outbound release fields (restore) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Carrier</Label>
                  <Input
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    placeholder="e.g., FedEx, UPS, Local Delivery"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Tracking Number</Label>
                  <Input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Tracking number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>PO Number</Label>
                  <Input
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    placeholder="Purchase order number"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Release Type</Label>
                  <SearchableSelect
                    data-testid="release-type-select"
                    options={releaseTypeOptions}
                    value={releaseType}
                    onChange={(v) => {
                      setReleaseType(v);
                      if (errors.release_type) setErrors({ ...errors, release_type: undefined });
                    }}
                    placeholder="Select release type..."
                    searchPlaceholder="Search release types..."
                    emptyText="No release types found"
                    error={errors.release_type}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Released To / Driver Name</Label>
                  <Input
                    value={releasedTo}
                    onChange={(e) => setReleasedTo(e.target.value)}
                    placeholder="Name of person picking up / driver"
                  />
                  <p className="text-xs text-muted-foreground">
                    Required before completing the release (signature step will also ask).
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>Release Contact Phone</Label>
                  <Input
                    value={releaseToPhone}
                    onChange={(e) => setReleaseToPhone(e.target.value)}
                    placeholder="(555) 555-5555"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Release Contact Email</Label>
                <Input
                  type="email"
                  value={releaseToEmail}
                  onChange={(e) => setReleaseToEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-md border bg-muted/30">
                <Checkbox
                  id="customer-authorized"
                  checked={customerAuthorized}
                  onCheckedChange={(checked) => setCustomerAuthorized(checked === true)}
                  className="mt-1"
                />
                <div>
                  <Label htmlFor="customer-authorized" className="cursor-pointer font-medium">
                    Customer Authorized
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Mark when the client has approved this outbound request (portal, email, or phone).
                  </p>
                </div>
              </div>

              {/* Expected Date */}
              <div className="space-y-1.5">
                <Label>Expected Pickup/Ship Date</Label>
                <Input
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes about this shipment..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Items Selection */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Select Items</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedItemIds.size} item{selectedItemIds.size !== 1 ? 's' : ''} selected
                </p>
              </div>
              {accountId && accountItems.length > 0 && (
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={selectAllItems}>
                    Select All
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={deselectAllItems}>
                    Clear
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!accountId ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <MaterialIcon name="inventory_2" size="xl" className="text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Select an account to view available items</p>
                </div>
              ) : itemsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <MaterialIcon name="progress_activity" size="lg" className="animate-spin text-muted-foreground" />
                </div>
              ) : accountItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <MaterialIcon name="error" size="xl" className="text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No available items for this account</p>
                  <p className="text-sm text-muted-foreground">Items must be in storage to be shipped</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <MaterialIcon name="search" size="sm" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  {/* Error message */}
                  {errors.items && (
                    <p className="text-sm text-destructive">{errors.items}</p>
                  )}

                  {/* Items table */}
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Item Code</TableHead>
                          <TableHead className="w-16 text-right">Qty</TableHead>
                          <TableHead className="hidden md:table-cell">Vendor</TableHead>
                          <TableHead className="hidden md:table-cell">Description</TableHead>
                          <TableHead className="hidden sm:table-cell">Location</TableHead>
                          <TableHead className="hidden md:table-cell">Sidemark</TableHead>
                          <TableHead className="hidden lg:table-cell">Room</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredItems.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                              No items match your search
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredItems.map((item) => (
                            <TableRow
                              key={item.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => toggleItemSelection(item.id)}
                            >
                              <TableCell>
                                <input
                                  type="checkbox"
                                  checked={selectedItemIds.has(item.id)}
                                  onChange={() => toggleItemSelection(item.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-4 w-4 rounded border border-primary accent-primary cursor-pointer"
                                />
                              </TableCell>
                              <TableCell className="font-medium">{item.item_code}</TableCell>
                              <TableCell className="text-right">
                                {typeof (item as any).quantity === 'number' ? (item as any).quantity : '-'}
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {item.vendor || '-'}
                              </TableCell>
                              <TableCell className="hidden md:table-cell max-w-[240px] truncate">
                                {item.description || '-'}
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                {item.location?.code || '-'}
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {item.sidemark?.sidemark_name || '-'}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                                {item.room || '-'}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-3 pb-6">
            <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="submit"
              data-testid="create-outbound-submit"
              disabled={saving || selectedItemIds.size === 0 || !draftShipmentId}
              className="min-w-[160px]"
            >
              {saving ? (
                <>
                  <MaterialIcon name="progress_activity" size="sm" className="mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <MaterialIcon name="save" size="sm" className="mr-2" />
                  Create Outbound
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
