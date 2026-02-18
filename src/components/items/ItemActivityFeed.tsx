/**
 * ItemActivityFeed - Unified activity timeline for an item.
 * Shows all logged events from item_activity with filters, actor name, and time.
 */

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { useItemActivity, type ActivityFilterCategory } from '@/hooks/useItemActivity';
import { format, formatDistanceToNow } from 'date-fns';
import { parseMessageWithLinks } from '@/utils/parseEntityLinks';
import { ActivityDetailsDisplay } from '@/components/activity/ActivityDetailsDisplay';

interface ItemActivityFeedProps {
  itemId: string;
}

const FILTER_OPTIONS: { value: Exclude<ActivityFilterCategory, 'all'>; label: string; icon: string }[] = [
  { value: 'movements', label: 'Movements', icon: 'location_on' },
  { value: 'tasks', label: 'Tasks', icon: 'assignment' },
  { value: 'shipments', label: 'Shipments', icon: 'local_shipping' },
  { value: 'notes', label: 'Notes', icon: 'sticky_note_2' },
  { value: 'billing', label: 'Billing', icon: 'attach_money' },
  { value: 'photos_docs', label: 'Photos & Docs', icon: 'photo_library' },
  { value: 'status_account', label: 'Status/Account', icon: 'tune' },
];

function getEventIcon(eventType: string): string {
  if (eventType.startsWith('item_flag')) return 'flag';
  if (eventType.startsWith('item_scan') || eventType.startsWith('billing')) return 'attach_money';
  if (eventType.startsWith('item_note')) return 'sticky_note_2';
  if (eventType.startsWith('item_photo')) return 'photo_camera';
  if (eventType.startsWith('item_document')) return 'description';
  if (eventType.startsWith('item_status')) return 'swap_horiz';
  if (eventType.startsWith('item_account')) return 'business';
  if (eventType.startsWith('item_class')) return 'category';
  if (eventType.startsWith('item_moved') || eventType.startsWith('item_location')) return 'location_on';
  if (eventType.startsWith('item_field') || eventType.startsWith('item_custom_field')) return 'edit';
  if (eventType.startsWith('item_coverage')) return 'verified_user';
  if (eventType.startsWith('item_shipment') || eventType.startsWith('item_manifest')) return 'local_shipping';
  if (eventType.startsWith('task_')) return 'assignment';
  if (eventType.startsWith('inventory_count')) return 'inventory';
  if (eventType.startsWith('repair_quote')) return 'handyman';
  if (eventType.startsWith('indicator')) return 'warning';
  if (eventType.startsWith('flag_alert')) return 'notifications';
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
  if (eventType.includes('photo') || eventType.includes('document'))
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  if (eventType.includes('shipment') || eventType.includes('manifest'))
    return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
  if (eventType.includes('repair_quote'))
    return 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200';
  if (eventType.includes('coverage'))
    return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
  if (eventType.includes('status') || eventType.includes('account') || eventType.includes('class') || eventType.includes('field'))
    return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
  if (eventType.includes('billing_charge_added'))
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
  if (eventType.includes('indicator'))
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
  return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
}

function getEventCategory(eventType: string): string {
  if (eventType.includes('flag') || eventType.includes('billing') || eventType.includes('scan_charge') || eventType.includes('indicator'))
    return 'billing';
  if (eventType.includes('moved') || eventType.includes('location'))
    return 'movement';
  if (eventType.startsWith('task_'))
    return 'task';
  if (eventType.includes('shipment') || eventType.includes('manifest'))
    return 'shipment';
  if (eventType.includes('note'))
    return 'note';
  if (eventType.includes('photo') || eventType.includes('document'))
    return 'media';
  if (eventType.includes('repair_quote'))
    return 'repair';
  if (eventType.includes('coverage'))
    return 'coverage';
  return 'update';
}

export function ItemActivityFeed({ itemId }: ItemActivityFeedProps) {
  const { activities, loading, multiFilter, toggleFilterCategory, clearFilters } = useItemActivity(itemId);
  const [filterOpen, setFilterOpen] = useState(false);

  const activeFilterCount = multiFilter.size;

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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MaterialIcon name="timeline" size="md" />
              Activity
            </CardTitle>
            <CardDescription>
              Complete timeline of all changes to this item
            </CardDescription>
          </div>

          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="relative h-8 w-8 p-0">
                <MaterialIcon name="filter_list" size="sm" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-[16px] px-0.5 text-[10px] font-medium bg-primary text-primary-foreground rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-xs font-medium text-muted-foreground">Filter by category</span>
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" className="h-5 px-1 text-xs" onClick={clearFilters}>
                      Clear
                    </Button>
                  )}
                </div>
                {FILTER_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted cursor-pointer"
                  >
                    <Checkbox
                      checked={multiFilter.has(opt.value)}
                      onCheckedChange={() => toggleFilterCategory(opt.value)}
                      className="h-4 w-4"
                    />
                    <MaterialIcon name={opt.icon} className="text-[14px] text-muted-foreground" />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>

      <CardContent>
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <MaterialIcon name="timeline" className="text-[36px] text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {activeFilterCount === 0 ? 'No activity recorded yet' : 'No matching activity for the selected filters'}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[450px] pr-4">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

              {/* Events */}
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="relative flex gap-3 pl-10">
                    {/* Timeline dot */}
                    <div className={`absolute left-2 w-5 h-5 rounded-full flex items-center justify-center ${getEventColor(activity.event_type)}`}>
                      <MaterialIcon name={getEventIcon(activity.event_type)} className="text-[12px]" />
                    </div>

                    {/* Event content */}
                    <div className="flex-1 bg-muted/50 rounded-lg p-3 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <span className="font-medium text-sm leading-tight">
                          {parseMessageWithLinks(activity.event_label, undefined, { variant: 'inline' })}
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
                      <ActivityDetailsDisplay details={activity.details} linkVariant="inline" />
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
