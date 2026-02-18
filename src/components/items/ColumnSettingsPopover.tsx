/**
 * ColumnSettingsPopover - Inline column visibility and reorder controls.
 * Appears as an icon button near a table header; opens a dropdown with
 * checkboxes to show/hide columns and drag handles to reorder them.
 * Persists changes to the tenant's item display settings.
 */

import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useItemDisplaySettings } from '@/hooks/useItemDisplaySettings';
import {
  BUILTIN_ITEM_COLUMNS,
  REQUIRED_ITEM_COLUMNS,
  customFieldColumnKey,
  getColumnLabel,
  getDefaultViewId,
  getViewById,
  type ItemColumnKey,
  type ItemDisplaySettingsV1,
  type ItemListViewDefinition,
} from '@/lib/items/itemDisplaySettings';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableColumnItem({
  columnKey,
  label,
  visible,
  required,
  onToggle,
}: {
  columnKey: string;
  label: string;
  visible: boolean;
  required: boolean;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: columnKey,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 py-1 px-1 rounded hover:bg-muted">
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <MaterialIcon name="drag_indicator" className="text-[14px]" />
      </button>
      <Checkbox
        checked={visible}
        disabled={required}
        onCheckedChange={onToggle}
        className="h-3.5 w-3.5"
      />
      <span className="text-sm flex-1 truncate">{label}</span>
    </div>
  );
}

interface ColumnSettingsPopoverProps {
  viewId?: string;
}

export function ColumnSettingsPopover({ viewId }: ColumnSettingsPopoverProps) {
  const { settings, defaultViewId, saveSettings, saving } = useItemDisplaySettings();
  const [open, setOpen] = useState(false);
  const [localDraft, setLocalDraft] = useState<ItemDisplaySettingsV1 | null>(null);

  const activeViewId = viewId || defaultViewId;

  const draft = localDraft || settings;
  const activeView = useMemo(
    () => getViewById(draft, activeViewId) || draft.views[0],
    [draft, activeViewId]
  );

  const sensors = useSensors(useSensor(PointerSensor));

  const handleOpen = useCallback((isOpen: boolean) => {
    if (isOpen) {
      setLocalDraft({ ...settings, views: settings.views.map(v => ({ ...v })) });
    } else if (localDraft) {
      void saveSettings(localDraft);
      setLocalDraft(null);
    }
    setOpen(isOpen);
  }, [settings, localDraft, saveSettings]);

  const updateActiveView = useCallback(
    (updater: (view: ItemListViewDefinition) => ItemListViewDefinition) => {
      setLocalDraft((prev) => {
        const base = prev || settings;
        const nextViews = base.views.map((v) => (v.id === activeView.id ? updater(v) : v));
        return { ...base, views: nextViews };
      });
    },
    [settings, activeView.id]
  );

  const toggleColumn = useCallback(
    (key: ItemColumnKey) => {
      if (REQUIRED_ITEM_COLUMNS.has(key)) return;
      updateActiveView((view) => {
        const isHidden = view.hidden.includes(key);
        return {
          ...view,
          hidden: isHidden ? view.hidden.filter((k) => k !== key) : [...view.hidden, key],
        };
      });
    },
    [updateActiveView]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      updateActiveView((view) => {
        const oldIndex = view.order.indexOf(active.id as ItemColumnKey);
        const newIndex = view.order.indexOf(over.id as ItemColumnKey);
        if (oldIndex === -1 || newIndex === -1) return view;
        return { ...view, order: arrayMove(view.order, oldIndex, newIndex) };
      });
    },
    [updateActiveView]
  );

  const resetToDefault = useCallback(() => {
    setLocalDraft((prev) => {
      const base = prev || settings;
      const customColumns = base.custom_fields
        .filter((f) => f.enabled && f.show_in_lists)
        .map((f) => customFieldColumnKey(f.key));

      const order: ItemColumnKey[] = [...BUILTIN_ITEM_COLUMNS.map((c) => c.key), ...customColumns];
      const hidden: ItemColumnKey[] = BUILTIN_ITEM_COLUMNS.filter((c) => c.default_hidden).map((c) => c.key);

      return {
        ...base,
        views: base.views.map((v) => (v.id === activeViewId ? { ...v, order, hidden } : v)),
      };
    });
  }, [settings, activeViewId]);

  if (!activeView) return null;

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Column settings">
          <MaterialIcon name="view_column" className="text-[16px]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60 p-2 max-h-[400px] overflow-auto">
        <div className="space-y-1">
          <div className="flex items-center justify-between px-1 py-1">
            <span className="text-xs font-medium text-muted-foreground">Columns</span>
            <Button variant="ghost" size="sm" className="h-5 px-1 text-xs" onClick={resetToDefault}>
              Reset
            </Button>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={activeView.order} strategy={verticalListSortingStrategy}>
              {activeView.order.map((key) => (
                <SortableColumnItem
                  key={key}
                  columnKey={key}
                  label={getColumnLabel(draft, key)}
                  visible={!activeView.hidden.includes(key)}
                  required={REQUIRED_ITEM_COLUMNS.has(key)}
                  onToggle={() => toggleColumn(key)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </PopoverContent>
    </Popover>
  );
}
