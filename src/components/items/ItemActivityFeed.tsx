/**
 * ItemActivityFeed - Unified activity timeline for an item.
 * Shows all logged events from item_activity with filters, actor name, and time.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { useItemActivity, categorizeItemEvent } from '@/hooks/useItemActivity';
import { format, formatDistanceToNow } from 'date-fns';
import { parseMessageWithLinks } from '@/utils/parseEntityLinks';
import { ActivityDetailsDisplay } from '@/components/activity/ActivityDetailsDisplay';
import { useMemo, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEntityMap } from '@/hooks/useEntityMap';

interface ItemActivityFeedProps {
  itemId: string;
}

type ItemFilterKey =
  | 'movements'
  | 'tasks'
  | 'shipments'
  | 'notes'
  | 'billing'
  | 'photos_docs'
  | 'status_account'
  | 'repair';

const FILTER_OPTIONS: Array<{ value: ItemFilterKey; label: string; icon: string }> = [
  { value: 'movements', label: 'Movements', icon: 'location_on' },
  { value: 'tasks', label: 'Tasks', icon: 'assignment' },
  { value: 'shipments', label: 'Shipments', icon: 'local_shipping' },
  { value: 'notes', label: 'Notes', icon: 'sticky_note_2' },
  { value: 'billing', label: 'Billing', icon: 'attach_money' },
  { value: 'photos_docs', label: 'Photos & Docs', icon: 'photo_library' },
  { value: 'status_account', label: 'Status/Account', icon: 'tune' },
  { value: 'repair', label: 'Repair', icon: 'handyman' },
];

function getEventIcon(eventType: string): string {
  if (eventType.startsWith('item_flag')) return 'flag';
  if (eventType.startsWith('item_scan') || eventType.startsWith('billing')) return 'attach_money';
  if (eventType.startsWith('item_note')) return 'sticky_note_2';
  if (eventType.startsWith('item_photo')) return 'photo_camera';
  if (eventType.includes('document')) return 'description';
  if (eventType.startsWith('item_shipment_') || eventType.includes('received_in_shipment') || eventType.includes('released_in_shipment')) return 'local_shipping';
  if (eventType.startsWith('repair_quote_') || eventType.startsWith('item_repair_')) return 'handyman';
  if (eventType.startsWith('item_status')) return 'swap_horiz';
  if (eventType.startsWith('item_account')) return 'business';
  if (eventType.startsWith('item_class')) return 'category';
  if (eventType.startsWith('item_moved') || eventType.startsWith('item_location')) return 'location_on';
  if (eventType.startsWith('item_field') || eventType.startsWith('item_custom_field')) return 'edit';
  if (eventType.startsWith('task_')) return 'assignment';
  if (eventType.startsWith('inventory_count')) return 'inventory';
  return 'history';
}

function getEventColor(eventType: string): string {
  if (eventType.includes('flag_applied') || eventType.includes('billing_event_created') || eventType.includes('scan_charge'))
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  if (eventType.includes('flag_removed') || eventType.includes('voided'))
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  if (eventType.includes('moved') || eventType.includes('location'))
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
  if (eventType.startsWith('task_'))
    return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
  if (eventType.includes('note'))
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  if (eventType.includes('photo'))
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  if (eventType.includes('document'))
    return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
  if (eventType.includes('shipment') || eventType.includes('received_in_shipment') || eventType.includes('released_in_shipment'))
    return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
  if (eventType.startsWith('repair_quote_') || eventType.startsWith('item_repair_'))
    return 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200';
  if (eventType.includes('status') || eventType.includes('account') || eventType.includes('class') || eventType.includes('field'))
    return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
  if (eventType.includes('billing_charge_added'))
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
  return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
}

function getEventCategory(eventType: string): string {
  const cat = categorizeItemEvent(eventType);
  switch (cat) {
    case 'movements': return 'movements';
    case 'tasks': return 'tasks';
    case 'shipments': return 'shipments';
    case 'notes': return 'notes';
    case 'billing': return 'billing';
    case 'photos_docs': return 'photos & docs';
    case 'status_account': return 'status/account';
    case 'repair': return 'repair';
    default: return 'update';
  }
}

export function ItemActivityFeed({ itemId }: ItemActivityFeedProps) {
  const { activities, loading } = useItemActivity(itemId);
  const entityMap = useEntityMap(activities, '[ItemActivityFeed] entity resolution failed:');
  const [selected, setSelected] = useState<Set<ItemFilterKey>>(new Set());

  const filteredActivities = useMemo(() => {
    if (selected.size === 0) return activities;
    return activities.filter((a) => selected.has(categorizeItemEvent(a.event_type) as ItemFilterKey));
  }, [activities, selected]);

  const activeFilterCount = selected.size;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MaterialIcon name="timeline" size="md" />
            Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4 pl-10">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MaterialIcon name="timeline" size="md" />
          Activity
        </CardTitle>
        <CardDescription>
          Complete timeline of all changes to this item
        </CardDescription>
        <div className="flex items-center justify-between gap-2 pt-2">
          <div className="text-xs text-muted-foreground">
            {activeFilterCount === 0 ? 'All categories' : `${activeFilterCount} filter${activeFilterCount === 1 ? '' : 's'} selected`}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8" title="Filter activity">
                <MaterialIcon name="filter_list" className="text-[18px]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter activity</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={selected.size === 0}
                onCheckedChange={(checked) => {
                  if (checked) setSelected(new Set());
                }}
              >
                <MaterialIcon name="list" className="text-[16px] mr-2" />
                All
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              {FILTER_OPTIONS.map((opt) => (
                <DropdownMenuCheckboxItem
                  key={opt.value}
                  checked={selected.has(opt.value)}
                  onCheckedChange={(checked) => {
                    setSelected((prev) => {
                      const next = new Set(prev);
                      if (checked) next.add(opt.value);
                      else next.delete(opt.value);
                      return next;
                    });
                  }}
                >
                  <MaterialIcon name={opt.icon} className="text-[16px] mr-2" />
                  {opt.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent>
        {filteredActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <MaterialIcon name="timeline" className="text-[36px] text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {activeFilterCount === 0 ? 'No activity recorded yet' : 'No activity in the selected categories'}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[450px] pr-4">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

              {/* Events */}
              <div className="space-y-3">
                {filteredActivities.map((activity) => (
                  <div key={activity.id} className="relative flex gap-3 pl-10">
                    {/* Timeline dot */}
                    <div className={`absolute left-2 w-5 h-5 rounded-full flex items-center justify-center ${getEventColor(activity.event_type)}`}>
                      <MaterialIcon name={getEventIcon(activity.event_type)} className="text-[12px]" />
                    </div>

                    {/* Event content */}
                    <div className="flex-1 bg-muted/50 rounded-lg p-3 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <span className="font-medium text-sm leading-tight">
                          {parseMessageWithLinks(activity.event_label, entityMap, { variant: 'inline' })}
                        </span>
                        <Badge variant="outline" className="text-[10px] px-1 flex-shrink-0">
                          {getEventCategory(activity.event_type)}
                        </Badge>
                      </div>

                      {/* Actor + time */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {activity.actor_name && (
                          <>
                            <span className="font-medium">{activity.actor_name}</span>
                            <span>-</span>
                          </>
                        )}
                        <span title={format(new Date(activity.created_at), 'MMM d, yyyy h:mm:ss a')}>
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </span>
                      </div>

                      {/* Expandable details */}
                      <ActivityDetailsDisplay details={activity.details} entityMap={entityMap} linkVariant="inline" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
