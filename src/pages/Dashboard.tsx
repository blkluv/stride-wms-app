import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSelectedWarehouse } from '@/contexts/WarehouseContext';
import { useDashboardStats, PutAwayItem, TaskItem, ShipmentItem } from '@/hooks/useDashboardStats';
import { useCountUp } from '@/hooks/useCountUp';
import { CapacityCard } from '@/components/dashboard/CapacityCard';
import { HeatMapHeroTile } from '@/components/dashboard/HeatMapHeroTile';
import { ActiveJobsCard } from '@/components/dashboard/ActiveJobsCard';
import { SortableDashboardTile } from '@/components/dashboard/SortableDashboardTile';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDashboardPreferences } from '@/hooks/useDashboardPreferences';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';

/** Animated count display for dashboard tiles */
function AnimatedCount({ value, delay = 0, className }: { value: number; delay?: number; className?: string }) {
  const animated = useCountUp(value, 600, delay);
  return <span className={className}>{animated}</span>;
}

/**
 * Format minutes to a readable time string
 * e.g., 135 -> "2h 15m", 45 -> "45 min"
 */
function formatTimeEstimate(minutes: number): string {
  if (minutes <= 0) return '';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

type ExpandedCard = 'put_away' | 'inspection' | 'assembly' | 'incoming_shipments' | 'repairs' | 'repair_quotes' | null;

type DashboardCardId =
  | 'heat_map'
  | 'warehouse_capacity'
  | 'active_jobs'
  | Exclude<ExpandedCard, null>;

const DASHBOARD_CARD_LABELS: Record<DashboardCardId, string> = {
  heat_map: 'Heat Map (Preview)',
  warehouse_capacity: 'Warehouse Capacity',
  active_jobs: 'Active Jobs',
  put_away: 'Put Away',
  inspection: 'Needs Inspection',
  assembly: 'Needs Assembly',
  incoming_shipments: 'Expected Shipments',
  repairs: 'Repairs',
  repair_quotes: 'Repair Quotes',
};

const DEFAULT_DASHBOARD_CARD_ORDER: DashboardCardId[] = [
  'heat_map',
  'warehouse_capacity',
  'put_away',
  'inspection',
  'assembly',
  'incoming_shipments',
  'repairs',
  'repair_quotes',
  'active_jobs',
];

/**
 * Phase 2 Dashboard (Command Center)
 * Requirements:
 * - 5 large tiles: Put Away, Needs Inspection, Needs Assembly, Incoming Shipments, Repairs
 * - Each tile shows total count + urgent badge if urgent > 0
 * - Each tile has expandable dropdown showing items
 * - Clicking each tile navigates to the correct page with the correct default filter/tab
 */
export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const {
    stats,
    putAwayItems,
    inspectionTasks,
    assemblyTasks,
    repairTasks,
    incomingShipments,
    loading,
    refetch
  } = useDashboardStats();
  const { warehouses, selectedWarehouseId, setSelectedWarehouseId } = useSelectedWarehouse();
  const [expandedCard, setExpandedCard] = useState<ExpandedCard>(null);

  const isMobile = useIsMobile();
  const layoutKey = isMobile ? 'mobile' : 'desktop';

  const {
    cardOrder,
    hiddenCards,
    loading: dashboardPrefsLoading,
    updateCardOrder,
    toggleCardVisibility,
    resetToDefault,
  } = useDashboardPreferences({
    layout: layoutKey,
    availableCardIds: DEFAULT_DASHBOARD_CARD_ORDER,
    defaultCardOrder: DEFAULT_DASHBOARD_CARD_ORDER,
  });

  const hiddenSet = useMemo(() => new Set(hiddenCards), [hiddenCards]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const toggleCard = (key: ExpandedCard) => {
    setExpandedCard(expandedCard === key ? null : key);
  };

  const tiles = useMemo(
    () => [
      {
        key: 'put_away' as ExpandedCard,
        title: 'PUT AWAY',
        emoji: '📦',
        count: stats.putAwayCount,
        urgent: stats.putAwayUrgentCount,
        description: 'Items on receiving dock',
        bgColor: 'bg-card border border-border shadow-sm',
        countColor: 'text-purple-600 dark:text-purple-400',
        onClick: () => navigate('/inventory?location=receiving'),
        timeEstimate: stats.putAwayTimeEstimate,
      },
      {
        key: 'inspection' as ExpandedCard,
        title: 'NEEDS INSPECTION',
        emoji: '🔍',
        count: stats.needToInspect,
        urgent: stats.urgentNeedToInspect,
        description: 'Pending inspection tasks',
        bgColor: 'bg-card border border-border shadow-sm',
        countColor: 'text-amber-600 dark:text-amber-400',
        onClick: () => navigate('/tasks?type=Inspection&status=pending'),
        timeEstimate: stats.inspectionTimeEstimate,
      },
      {
        key: 'assembly' as ExpandedCard,
        title: 'NEEDS ASSEMBLY',
        emoji: '🔧',
        count: stats.needToAssemble,
        urgent: stats.urgentNeedToAssemble,
        description: 'Pending assembly tasks',
        bgColor: 'bg-card border border-border shadow-sm',
        countColor: 'text-blue-600 dark:text-blue-400',
        onClick: () => navigate('/tasks?type=Assembly&status=pending'),
        timeEstimate: stats.assemblyTimeEstimate,
      },
      {
        key: 'incoming_shipments' as ExpandedCard,
        title: 'EXPECTED SHIPMENTS',
        emoji: '🚚',
        count: stats.incomingShipments,
        urgent: stats.incomingShipmentsUrgentCount,
        description: 'Expected / not received',
        bgColor: 'bg-card border border-border shadow-sm',
        countColor: 'text-orange-500 dark:text-orange-400',
        onClick: () => navigate('/incoming/manager?tab=expected'),
        timeEstimate: stats.incomingShipmentsTimeEstimate,
      },
      {
        key: 'repairs' as ExpandedCard,
        title: 'REPAIRS',
        emoji: '🔨',
        count: stats.repairCount,
        urgent: stats.urgentNeedToRepair,
        description: 'Pending repair tasks',
        bgColor: 'bg-card border border-border shadow-sm',
        countColor: 'text-red-600 dark:text-red-400',
        onClick: () => navigate('/tasks?type=Repair&status=pending'),
        timeEstimate: stats.repairTimeEstimate,
      },
      {
        key: 'repair_quotes' as ExpandedCard,
        title: 'REPAIR QUOTES',
        emoji: '📋',
        count: stats.repairQuotesCount,
        urgent: 0,
        description: 'Quotes needing action',
        bgColor: 'bg-card border border-border shadow-sm',
        countColor: 'text-indigo-600 dark:text-indigo-400',
        onClick: () => navigate('/repair-quotes'),
        timeEstimate: 0,
      },
    ],
    [navigate, stats]
  );

  // Get items for expanded card
  const getExpandedItems = (key: ExpandedCard) => {
    switch (key) {
      case 'put_away':
        return putAwayItems;
      case 'inspection':
        return inspectionTasks;
      case 'assembly':
        return assemblyTasks;
      case 'repairs':
        return repairTasks;
      case 'incoming_shipments':
        return incomingShipments;
      default:
        return [];
    }
  };

  // Render item row based on type
  const renderItemRow = (item: PutAwayItem | TaskItem | ShipmentItem, key: ExpandedCard) => {
    if (key === 'put_away') {
      const putAwayItem = item as PutAwayItem;
      return (
        <div
          key={putAwayItem.id}
          className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer group"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/inventory/${putAwayItem.id}`);
          }}
          role="button"
        >
          <div className="flex-1 min-w-0">
            <div className="font-mono text-sm font-medium truncate">{putAwayItem.item_code}</div>
            {putAwayItem.description && (
              <div className="text-xs text-muted-foreground truncate">{putAwayItem.description}</div>
            )}
          </div>
          <MaterialIcon name="chevron_right" size="sm" className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
        </div>
      );
    }

    if (key === 'incoming_shipments') {
      const shipment = item as ShipmentItem;

      const resolveIncomingRoute = () => {
        // Prefer inbound_kind routing into the new Incoming Manager flows.
        const kind = (shipment.inbound_kind || '').toLowerCase();
        if (kind === 'manifest') return `/incoming/manifest/${shipment.id}`;
        if (kind === 'dock_intake') return `/incoming/dock-intake/${shipment.id}`;
        if (kind === 'expected') return `/incoming/expected/${shipment.id}`;

        // Fallback: older records without inbound_kind
        return `/incoming/expected/${shipment.id}`;
      };

      return (
        <div
          key={shipment.id}
          className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer group"
          onClick={(e) => {
            e.stopPropagation();
            navigate(resolveIncomingRoute());
          }}
          role="button"
        >
          <div className="flex-1 min-w-0">
            <div className="font-mono text-sm font-medium truncate">{shipment.shipment_number}</div>
            <div className="text-xs text-muted-foreground truncate">
              {shipment.account?.account_name || 'Unknown'} • {shipment.carrier || 'No carrier'}
            </div>
          </div>
          <MaterialIcon name="chevron_right" size="sm" className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
        </div>
      );
    }

    // Task items (inspection, assembly, repairs)
    const task = item as TaskItem;
    return (
      <div
        key={task.id}
        className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer group"
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/tasks?id=${task.id}`);
        }}
        role="button"
      >
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{task.title}</div>
          {task.item && (
            <div className="text-xs text-foreground/80 truncate font-mono">
              {task.item.item_code}
              {task.item.location?.code && (
                <span className="ml-2 text-muted-foreground">📍 {task.item.location.code}</span>
              )}
            </div>
          )}
          <div className="text-xs text-muted-foreground truncate">
            {task.account?.account_name || 'No account'}
            {task.priority === 'urgent' && (
              <Badge variant="destructive" className="ml-2 text-[10px] px-1 py-0">Urgent</Badge>
            )}
          </div>
        </div>
        <MaterialIcon name="chevron_right" size="sm" className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
      </div>
    );
  };

  const tileById = useMemo(() => {
    const m = new Map<string, (typeof tiles)[number]>();
    for (const t of tiles) m.set(t.key, t);
    return m;
  }, [tiles]);

  const orderedCardIds = useMemo(() => {
    const saved = (cardOrder as string[]).filter((id) => DEFAULT_DASHBOARD_CARD_ORDER.includes(id as DashboardCardId)) as DashboardCardId[];
    const missing = DEFAULT_DASHBOARD_CARD_ORDER.filter((id) => !saved.includes(id));
    return [...saved, ...missing];
  }, [cardOrder]);

  const visibleOrderedCardIds = useMemo(
    () => orderedCardIds.filter((id) => !hiddenSet.has(id)),
    [hiddenSet, orderedCardIds]
  );

  const renderDashboardCard = (id: DashboardCardId, index: number) => {
    if (id === 'heat_map') {
      if (!selectedWarehouseId) return null;
      return <HeatMapHeroTile warehouseId={selectedWarehouseId} />;
    }

    if (id === 'warehouse_capacity') {
      return <CapacityCard warehouseId={selectedWarehouseId ?? undefined} />;
    }

    if (id === 'active_jobs') {
      return <ActiveJobsCard />;
    }

    const t = tileById.get(id);
    if (!t) return null;

    const isExpanded = expandedCard === t.key;
    const items = getExpandedItems(t.key);
    const timeStr = t.timeEstimate ? formatTimeEstimate(t.timeEstimate) : '';

    return (
      <Card className="hover:shadow-lg transition-shadow relative" data-testid={`dashboard-tile-${t.key}`}>
        {/* Expand/Collapse Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6 z-10"
          data-testid={`dashboard-expand-${t.key}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleCard(t.key);
          }}
        >
          <MaterialIcon
            name="expand_more"
            size="sm"
            className={cn("transition-transform duration-200", isExpanded && "rotate-180")}
          />
        </Button>

        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pr-10">
          <div className="flex items-center gap-2">
            <CardTitle className="text-[11px] font-semibold tracking-wide text-muted-foreground">
              {t.title}
            </CardTitle>
            {typeof t.urgent === 'number' && t.urgent > 0 && (
              <Badge className="bg-red-500 text-white text-[10px]">
                ⚠️ {t.urgent}
              </Badge>
            )}
          </div>
          <div className={`emoji-tile emoji-tile-lg rounded-lg ${t.bgColor}`}>
            {t.emoji}
          </div>
        </CardHeader>

        <CardContent>
          <div
            className="flex items-baseline gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={t.onClick}
            role="button"
          >
            <AnimatedCount
              value={t.count ?? 0}
              delay={index * 80}
              className={`text-3xl font-bold ${t.countColor}`}
            />
            {timeStr && t.count > 0 && (
              <span className="text-sm text-muted-foreground">
                ⏱️ ~{timeStr}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{t.description}</p>

          {/* Expandable Items List */}
          {isExpanded && items.length > 0 && (
            <div className="mt-4 border-t pt-3">
              <ScrollArea className="max-h-64">
                <div className="space-y-1">
                  {items.slice(0, 10).map((item) => renderItemRow(item, t.key))}
                </div>
              </ScrollArea>
              {items.length > 10 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    t.onClick();
                  }}
                >
                  View all {t.count} items
                </Button>
              )}
            </div>
          )}

          {isExpanded && items.length === 0 && (
            <div className="mt-4 border-t pt-3 text-center text-sm text-muted-foreground">
              No items to display
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderedCards = visibleOrderedCardIds.flatMap((id, index) => {
    const element = renderDashboardCard(id, index);
    if (!element) return [];
    const spanClass =
      id === 'heat_map' || id === 'active_jobs' ? 'md:col-span-2 lg:col-span-3' : undefined;
    return [{ id, element: (
      <SortableDashboardTile key={id} id={id} className={spanClass}>
        {element}
      </SortableDashboardTile>
    ) }];
  });

  const sortableIds = renderedCards.map((c) => c.id);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id) as DashboardCardId;
    const overId = String(over.id) as DashboardCardId;

    const oldIndex = sortableIds.indexOf(activeId);
    const newIndex = sortableIds.indexOf(overId);
    if (oldIndex < 0 || newIndex < 0) return;

    const nextSortableOrder = arrayMove(sortableIds, oldIndex, newIndex);

    // Merge reorder back into the full order list, leaving hidden/non-rendered cards in place.
    const movable = new Set(sortableIds);
    let nextIdx = 0;
    const nextFullOrder = orderedCardIds.map((id) => {
      if (!movable.has(id)) return id;
      const replacement = nextSortableOrder[nextIdx++];
      return replacement ?? id;
    });

    await updateCardOrder(nextFullOrder);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-20">
        <div className="flex items-center justify-between gap-3">
          <PageHeader
            primaryText="Command"
            accentText="Center"
            description={`Welcome back${profile?.first_name ? `, ${profile.first_name}` : ''}.`}
            data-testid="page-header"
          />
          <div className="flex items-center gap-2">
            {warehouses.length > 1 && (
              <Select value={selectedWarehouseId ?? ''} onValueChange={(v) => setSelectedWarehouseId(v || null)}>
                <SelectTrigger className="w-[180px] h-9 text-xs">
                  <SelectValue placeholder="Warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((wh) => (
                    <SelectItem key={wh.id} value={wh.id}>
                      {wh.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MaterialIcon name="tune" size="sm" className="mr-2" />
                  Customize
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  Dashboard cards ({layoutKey})
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {DEFAULT_DASHBOARD_CARD_ORDER.map((id) => {
                  const isVisible = !hiddenSet.has(id);
                  return (
                    <DropdownMenuCheckboxItem
                      key={id}
                      checked={isVisible}
                      onCheckedChange={(checked) => {
                        if (checked === isVisible) return;
                        if (expandedCard === (id as ExpandedCard)) setExpandedCard(null);
                        void toggleCardVisibility(id);
                      }}
                    >
                      {DASHBOARD_CARD_LABELS[id]}
                    </DropdownMenuCheckboxItem>
                  );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setExpandedCard(null);
                    void resetToDefault();
                  }}
                  disabled={dashboardPrefsLoading}
                >
                  <MaterialIcon name="restart_alt" size="sm" className="mr-2" />
                  Reset to default
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" onClick={refetch} disabled={loading} data-testid="refresh-button">
              <MaterialIcon name={loading ? "sync" : "refresh"} size="sm" className={cn("mr-2", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <MaterialIcon name="progress_activity" size="xl" className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {renderedCards.length === 0 ? (
                  <Card className="md:col-span-2 lg:col-span-3">
                    <CardContent className="py-10 text-center text-muted-foreground">
                      No dashboard cards selected.
                    </CardContent>
                  </Card>
                ) : (
                  renderedCards.map((c) => c.element)
                )}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </DashboardLayout>
  );
}
