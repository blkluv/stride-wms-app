import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  BUILTIN_ITEM_COLUMNS,
  REQUIRED_ITEM_COLUMNS,
  type ItemColumnKey,
  type ItemDisplaySettingsV1,
  customFieldColumnKey,
  getColumnLabel,
  getViewById,
} from '@/lib/items/itemDisplaySettings';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableColumnRow({
  columnKey,
  label,
  visible,
  required,
  onToggleVisible,
}: {
  columnKey: ItemColumnKey;
  label: string;
  visible: boolean;
  required: boolean;
  onToggleVisible: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: columnKey,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-md border px-2 py-1.5 bg-background"
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <MaterialIcon name="drag_indicator" size="sm" />
      </button>

      <Checkbox
        checked={visible}
        disabled={required}
        onCheckedChange={onToggleVisible}
        className="h-4 w-4"
        aria-label={visible ? `Hide ${label}` : `Show ${label}`}
      />

      <div className="flex-1 min-w-0">
        <div className="text-sm truncate">{label}</div>
      </div>

      {required && (
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
          Required
        </span>
      )}
    </div>
  );
}

export function ItemColumnsPopover({
  settings,
  viewId,
  disabled,
  onSave,
}: {
  settings: ItemDisplaySettingsV1;
  viewId: string;
  disabled?: boolean;
  onSave: (next: ItemDisplaySettingsV1) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);

  const view = useMemo(() => {
    return getViewById(settings, viewId) || settings.views[0];
  }, [settings, viewId]);

  const [draftOrder, setDraftOrder] = useState<ItemColumnKey[]>(view.order);
  const [draftHidden, setDraftHidden] = useState<ItemColumnKey[]>(view.hidden);

  // Re-initialize the draft when opening (or when switching views while open).
  useEffect(() => {
    if (!open) return;
    setDraftOrder(view.order);
    setDraftHidden(view.hidden);
  }, [open, view.id]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setDraftOrder((items) => {
      const oldIndex = items.indexOf(active.id as ItemColumnKey);
      const newIndex = items.indexOf(over.id as ItemColumnKey);
      if (oldIndex === -1 || newIndex === -1) return items;
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const isVisible = (key: ItemColumnKey) => !draftHidden.includes(key);

  const toggleColumnVisible = (key: ItemColumnKey) => {
    if (REQUIRED_ITEM_COLUMNS.has(key)) return;
    setDraftHidden((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const handleResetToDefault = () => {
    const builtinOrder = BUILTIN_ITEM_COLUMNS.map((c) => c.key);
    const customCols = settings.custom_fields
      .filter((f) => f.enabled && f.show_in_lists)
      .map((f) => customFieldColumnKey(f.key));

    const nextOrder: ItemColumnKey[] = [...builtinOrder, ...customCols];
    const nextHidden: ItemColumnKey[] = BUILTIN_ITEM_COLUMNS
      .filter((c) => c.default_hidden)
      .map((c) => c.key)
      .filter((k) => !REQUIRED_ITEM_COLUMNS.has(k));

    setDraftOrder(nextOrder);
    setDraftHidden(nextHidden);
  };

  const handleApply = async () => {
    const next: ItemDisplaySettingsV1 = {
      ...settings,
      views: settings.views.map((v) =>
        v.id === view.id ? { ...v, order: draftOrder, hidden: draftHidden } : v
      ),
    };

    const ok = await onSave(next);
    if (ok) setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10"
          disabled={disabled}
          aria-label="Edit visible columns"
          title="Columns"
        >
          <MaterialIcon name="view_column" size="sm" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[320px] p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">Columns</div>
            <div className="text-xs text-muted-foreground truncate">
              View: {view.name}
            </div>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={handleResetToDefault}>
            <MaterialIcon name="restart_alt" size="sm" className="mr-1" />
            Reset
          </Button>
        </div>

        <Separator className="my-2" />

        <ScrollArea className="h-[320px] pr-2">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={draftOrder} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {draftOrder.map((key) => (
                  <SortableColumnRow
                    key={key}
                    columnKey={key}
                    label={getColumnLabel(settings, key)}
                    visible={isVisible(key)}
                    required={REQUIRED_ITEM_COLUMNS.has(key)}
                    onToggleVisible={() => toggleColumnVisible(key)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </ScrollArea>

        <Separator className="my-2" />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleApply}>
            <MaterialIcon name="save" size="sm" className="mr-1" />
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

