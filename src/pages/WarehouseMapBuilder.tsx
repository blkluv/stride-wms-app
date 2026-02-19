import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useWarehouseMaps } from '@/hooks/useWarehouseMaps';
import { useWarehouseZones } from '@/hooks/useWarehouseZones';
import { useWarehouseMapNodes } from '@/hooks/useWarehouseMapNodes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type NodeDraft = {
  label: string;
  zone_id: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
};

const UNASSIGNED_ZONE_VALUE = '__unassigned__';

type DragMode = 'move' | 'resize_se';
type DragState = {
  nodeId: string;
  mode: DragMode;
  startPointer: { x: number; y: number };
  startNode: { x: number; y: number; width: number; height: number };
};

export default function WarehouseMapBuilder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedMapIdParam = searchParams.get('mapId');

  const { warehouses } = useWarehouses();
  const warehouse = useMemo(
    () => warehouses.find((w) => w.id === warehouseId) || null,
    [warehouses, warehouseId]
  );

  const {
    maps,
    loading: mapsLoading,
    createMap,
    updateMap,
    setDefaultMap,
    getDefaultMap,
  } = useWarehouseMaps(warehouseId);

  const { zones } = useWarehouseZones(warehouseId);

  const activeMap = useMemo(() => {
    if (selectedMapIdParam) {
      return maps.find((m) => m.id === selectedMapIdParam) || null;
    }
    return getDefaultMap();
  }, [getDefaultMap, maps, selectedMapIdParam]);

  const [mapDraft, setMapDraft] = useState<{ width: number; height: number; grid_size: number } | null>(null);
  const [mapSaving, setMapSaving] = useState(false);
  const [mapSaveError, setMapSaveError] = useState<string | null>(null);
  const [mapLastSavedAt, setMapLastSavedAt] = useState<number | null>(null);
  const mapSaveErrorToastRef = useRef(false);

  useEffect(() => {
    if (!activeMap) {
      setMapDraft(null);
      return;
    }
    setMapDraft({
      width: activeMap.width ?? 2000,
      height: activeMap.height ?? 1200,
      grid_size: activeMap.grid_size ?? 20,
    });
    setMapSaveError(null);
    mapSaveErrorToastRef.current = false;
  }, [activeMap?.id]);

  // Self-heal: if maps exist but none is marked default, pick the most recently updated.
  useEffect(() => {
    if (!warehouseId) return;
    if (maps.length === 0) return;
    if (maps.some((m) => m.is_default)) return;
    if (selectedMapIdParam) return;

    void setDefaultMap(maps[0].id).catch((err) => {
      console.error('[WarehouseMapBuilder] failed to set default map', err);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maps, selectedMapIdParam, warehouseId]);

  const mapIdForNodes = activeMap?.id;
  const {
    nodes,
    loading: nodesLoading,
    createNode,
    updateNode,
    deleteNode,
  } = useWarehouseMapNodes(mapIdForNodes);

  const zoneById = useMemo(() => new Map(zones.map((z) => [z.id, z])), [zones]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  const [draft, setDraft] = useState<NodeDraft | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  const [autoSaving, setAutoSaving] = useState(false);
  const [autoSaveError, setAutoSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const autoSaveErrorToastRef = useRef(false);

  useEffect(() => {
    if (!selectedNode) {
      setDraft(null);
      return;
    }
    setDraft({
      label: selectedNode.label || '',
      zone_id: selectedNode.zone_id,
      x: selectedNode.x,
      y: selectedNode.y,
      width: selectedNode.width,
      height: selectedNode.height,
    });
  }, [selectedNode]);

  const [createMapOpen, setCreateMapOpen] = useState(false);
  const [newMapName, setNewMapName] = useState('');
  const [creatingMap, setCreatingMap] = useState(false);

  const handleCreateMap = async () => {
    if (!newMapName.trim()) {
      toast({ variant: 'destructive', title: 'Name required', description: 'Enter a map name.' });
      return;
    }

    try {
      setCreatingMap(true);
      const created = await createMap({ name: newMapName.trim() });
      setCreateMapOpen(false);
      setNewMapName('');
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('mapId', created.id);
        return next;
      });
      toast({ title: 'Map created', description: 'Map has been created.' });
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Create failed', description: 'Failed to create map.' });
    } finally {
      setCreatingMap(false);
    }
  };

  const handleAddNode = async () => {
    if (!activeMap) return;
    try {
      const created = await createNode({
        x: 40,
        y: 40,
        width: 160,
        height: 100,
        label: null,
        zone_id: null,
        sort_order: nodes.length,
      });
      setSelectedNodeId(created.id);
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add rectangle.' });
    }
  };

  // Duplicate selected rectangle (Ctrl/Cmd + D)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isDuplicate = (e.ctrlKey || e.metaKey) && String(e.key || '').toLowerCase() === 'd';
      if (!isDuplicate) return;

      const activeEl = document.activeElement as HTMLElement | null;
      const isTyping =
        !!activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.isContentEditable);
      if (isTyping) return;

      if (!activeMap || !selectedNode || !draft) return;

      e.preventDefault();
      e.stopPropagation();

      const width = mapDraft?.width ?? activeMap.width ?? 2000;
      const height = mapDraft?.height ?? activeMap.height ?? 1200;
      const grid = mapDraft?.grid_size ?? activeMap.grid_size ?? 20;

      // Duplicates cannot keep zone_id due to (map_id, zone_id) uniqueness.
      void createNode({
        x: Math.min(draft.x + grid, Math.max(0, width - draft.width)),
        y: Math.min(draft.y + grid, Math.max(0, height - draft.height)),
        width: draft.width,
        height: draft.height,
        label: draft.label?.trim() ? draft.label.trim() : null,
        zone_id: null,
        sort_order: nodes.length,
      })
        .then((created) => {
          setSelectedNodeId(created.id);
          toast({ title: 'Duplicated', description: 'Rectangle duplicated.' });
        })
        .catch((err) => {
          console.error(err);
          toast({ variant: 'destructive', title: 'Duplicate failed', description: 'Failed to duplicate rectangle.' });
        });
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeMap, createNode, draft, mapDraft, nodes.length, selectedNode, toast]);

  const isDraftDirty = useMemo(() => {
    if (!selectedNode || !draft) return false;
    const normalizedDraftLabel = draft.label?.trim() ? draft.label.trim() : null;
    const normalizedSelectedLabel = selectedNode.label?.trim() ? selectedNode.label.trim() : null;
    return (
      normalizedDraftLabel !== normalizedSelectedLabel ||
      draft.zone_id !== selectedNode.zone_id ||
      draft.x !== selectedNode.x ||
      draft.y !== selectedNode.y ||
      draft.width !== selectedNode.width ||
      draft.height !== selectedNode.height
    );
  }, [draft, selectedNode]);

  const saveDraft = async ({ silent }: { silent?: boolean } = {}) => {
    if (!selectedNode || !draft) return;
    if (!isDraftDirty) return;
    try {
      setAutoSaveError(null);
      setAutoSaving(true);
      await updateNode(selectedNode.id, {
        label: draft.label?.trim() ? draft.label.trim() : null,
        zone_id: draft.zone_id,
        x: draft.x,
        y: draft.y,
        width: draft.width,
        height: draft.height,
      });
      setLastSavedAt(Date.now());
      autoSaveErrorToastRef.current = false;
      if (!silent) {
        toast({ title: 'Saved', description: 'Rectangle updated.' });
      }
    } catch (err) {
      console.error(err);
      setAutoSaveError('Autosave failed');
      if (!silent || !autoSaveErrorToastRef.current) {
        autoSaveErrorToastRef.current = true;
        toast({ variant: 'destructive', title: 'Save failed', description: 'Failed to update rectangle.' });
      }
    } finally {
      setAutoSaving(false);
    }
  };

  const saveDraftRef = useRef(saveDraft);
  saveDraftRef.current = saveDraft;

  // Autosave node changes after 500ms idle.
  useEffect(() => {
    if (!selectedNode || !draft) return;
    if (!isDraftDirty) return;
    if (autoSaving) return;
    if (drag) return;

    const t = window.setTimeout(() => {
      void saveDraft({ silent: true });
    }, 500);

    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSaving, draft, drag, isDraftDirty, selectedNode?.id]);

  const handleSelectNode = (nextNodeId: string | null) => {
    // Best-effort: flush pending edits before switching selections.
    if (selectedNode && draft && isDraftDirty) {
      void saveDraft({ silent: true });
    }
    setSelectedNodeId(nextNodeId);
  };

  const handleSetDefault = async () => {
    if (!activeMap) return;
    try {
      await setDefaultMap(activeMap.id);
      toast({ title: 'Default map set', description: 'This map is now the default.' });
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to set default map.' });
    }
  };

  const isMapDraftDirty = useMemo(() => {
    if (!activeMap || !mapDraft) return false;
    const width = activeMap.width ?? 2000;
    const height = activeMap.height ?? 1200;
    const grid = activeMap.grid_size ?? 20;
    return mapDraft.width !== width || mapDraft.height !== height || mapDraft.grid_size !== grid;
  }, [activeMap, mapDraft]);

  const saveMapDraft = async ({ silent }: { silent?: boolean } = {}) => {
    if (!activeMap || !mapDraft) return;
    try {
      setMapSaveError(null);
      setMapSaving(true);
      await updateMap(activeMap.id, {
        width: mapDraft.width,
        height: mapDraft.height,
        grid_size: mapDraft.grid_size,
      });
      setMapLastSavedAt(Date.now());
      mapSaveErrorToastRef.current = false;
      if (!silent) {
        toast({ title: 'Saved', description: 'Map settings updated.' });
      }
    } catch (err) {
      console.error(err);
      setMapSaveError('Autosave failed');
      if (!silent || !mapSaveErrorToastRef.current) {
        mapSaveErrorToastRef.current = true;
        toast({ variant: 'destructive', title: 'Save failed', description: 'Failed to update map settings.' });
      }
    } finally {
      setMapSaving(false);
    }
  };

  // Autosave map settings after 500ms idle.
  useEffect(() => {
    if (!activeMap || !mapDraft) return;
    if (!isMapDraftDirty) return;
    if (mapSaving) return;

    const t = window.setTimeout(() => {
      void saveMapDraft({ silent: true });
    }, 500);

    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMap?.id, isMapDraftDirty, mapDraft, mapSaving]);

  const mapWidth = mapDraft?.width ?? activeMap?.width ?? 2000;
  const mapHeight = mapDraft?.height ?? activeMap?.height ?? 1200;
  const gridSize = mapDraft?.grid_size ?? activeMap?.grid_size ?? 20;

  const getSvgPoint = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  };

  const beginDrag = (e: React.PointerEvent, node: { id: string; label: string | null; zone_id: string | null; x: number; y: number; width: number; height: number }, mode: DragMode) => {
    e.stopPropagation();
    e.preventDefault();

    handleSelectNode(node.id);
    setDraft({
      label: node.label || '',
      zone_id: node.zone_id,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
    });

    const startPointer = getSvgPoint(e.clientX, e.clientY);
    setDrag({
      nodeId: node.id,
      mode,
      startPointer,
      startNode: { x: node.x, y: node.y, width: node.width, height: node.height },
    });
  };

  useEffect(() => {
    if (!drag) return;

    const snap = (v: number) => Math.round(v / gridSize) * gridSize;
    const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

    const handleMove = (e: PointerEvent) => {
      const p = getSvgPoint(e.clientX, e.clientY);
      const dx = p.x - drag.startPointer.x;
      const dy = p.y - drag.startPointer.y;

      setDraft((d) => {
        if (!d) return d;
        if (selectedNodeId !== drag.nodeId) return d;

        if (drag.mode === 'move') {
          const nextX = snap(drag.startNode.x + dx);
          const nextY = snap(drag.startNode.y + dy);
          const maxX = Math.max(0, mapWidth - drag.startNode.width);
          const maxY = Math.max(0, mapHeight - drag.startNode.height);
          return {
            ...d,
            x: clamp(nextX, 0, maxX),
            y: clamp(nextY, 0, maxY),
          };
        }

        // resize_se
        const nextW = snap(drag.startNode.width + dx);
        const nextH = snap(drag.startNode.height + dy);
        const maxW = Math.max(gridSize, mapWidth - drag.startNode.x);
        const maxH = Math.max(gridSize, mapHeight - drag.startNode.y);
        return {
          ...d,
          width: clamp(Math.max(nextW, gridSize), gridSize, maxW),
          height: clamp(Math.max(nextH, gridSize), gridSize, maxH),
        };
      });
    };

    const handleUp = () => {
      setDrag(null);
      // Save immediately on drag end; autosave will also catch any remaining changes.
      window.setTimeout(() => {
        void saveDraftRef.current({ silent: true });
      }, 0);
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    window.addEventListener('pointerup', handleUp, { passive: true });
    window.addEventListener('pointercancel', handleUp, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag, gridSize, mapHeight, mapWidth, selectedNodeId]);

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-20">
        <div className="flex items-start justify-between gap-3">
          <PageHeader
            primaryText="Map"
            accentText="Builder"
            description={warehouse ? `${warehouse.name} (${warehouse.code})` : 'Build a warehouse map by placing zone rectangles.'}
          />

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <MaterialIcon name="arrow_back" size="sm" className="mr-2" />
              Back
            </Button>
            {warehouseId && (
              <Button variant="outline" asChild>
                <Link to={`/warehouses/${warehouseId}/zones`}>
                  <MaterialIcon name="grid_on" size="sm" className="mr-2" />
                  Zones
                </Link>
              </Button>
            )}
            {warehouseId && (
              <Button variant="outline" asChild>
                <Link to={`/warehouses/${warehouseId}/heatmap`}>
                  <MaterialIcon name="whatshot" size="sm" className="mr-2" />
                  Heat Map
                </Link>
              </Button>
            )}
            <Button variant="outline" onClick={() => setCreateMapOpen(true)}>
              <MaterialIcon name="add" size="sm" className="mr-2" />
              New Map
            </Button>
          </div>
        </div>

        {/* Map selector */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>Maps</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <span>
                  {mapsLoading ? 'Loading…' : `${maps.length} map${maps.length === 1 ? '' : 's'}`}
                </span>
                {activeMap && (
                  <span
                    className={cn(
                      'text-xs flex items-center gap-1.5',
                      mapSaveError ? 'text-destructive' : 'text-muted-foreground'
                    )}
                    title={mapSaveError || undefined}
                  >
                    {mapSaving ? (
                      <>
                        <MaterialIcon name="progress_activity" size="sm" className="animate-spin" />
                        Saving…
                      </>
                    ) : mapSaveError ? (
                      <>
                        <MaterialIcon name="error" size="sm" />
                        Autosave failed
                      </>
                    ) : isMapDraftDirty ? (
                      <>
                        <MaterialIcon name="edit" size="sm" />
                        Unsaved
                      </>
                    ) : mapLastSavedAt ? (
                      <>
                        <MaterialIcon name="check_circle" size="sm" />
                        Saved
                      </>
                    ) : null}
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={activeMap?.id ?? ''}
                onValueChange={(v) => {
                  setSelectedNodeId(null);
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    next.set('mapId', v);
                    return next;
                  });
                }}
              >
                <SelectTrigger className="w-[260px]">
                  <SelectValue placeholder="Select map" />
                </SelectTrigger>
                <SelectContent>
                  {maps.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}{m.is_default ? ' (Default)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {activeMap && !activeMap.is_default && (
                <Button variant="outline" onClick={handleSetDefault}>
                  Set Default
                </Button>
              )}
            </div>
          </CardHeader>
          {activeMap && mapDraft && (
            <CardContent className="pt-0">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Width</Label>
                  <Input
                    type="number"
                    min={200}
                    value={mapDraft.width}
                    onChange={(e) =>
                      setMapDraft((d) =>
                        d ? { ...d, width: Math.max(Number(e.target.value) || 0, 200) } : d
                      )
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Height</Label>
                  <Input
                    type="number"
                    min={200}
                    value={mapDraft.height}
                    onChange={(e) =>
                      setMapDraft((d) =>
                        d ? { ...d, height: Math.max(Number(e.target.value) || 0, 200) } : d
                      )
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Grid</Label>
                  <Input
                    type="number"
                    min={5}
                    value={mapDraft.grid_size}
                    onChange={(e) =>
                      setMapDraft((d) =>
                        d ? { ...d, grid_size: Math.max(Number(e.target.value) || 0, 5) } : d
                      )
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!isMapDraftDirty || mapSaving}
                  onClick={() => void saveMapDraft()}
                >
                  Save now
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Empty state */}
        {!activeMap ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <MaterialIcon name="map" />
              </div>
              <div className="font-medium">No map configured</div>
              <div className="text-sm text-muted-foreground mt-1">
                Create your first map to start placing zone rectangles.
              </div>
              <div className="mt-4">
                <Button onClick={() => setCreateMapOpen(true)}>
                  <MaterialIcon name="add" size="sm" className="mr-2" />
                  Create Map
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
            {/* Canvas */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">{activeMap.name}</CardTitle>
                  <CardDescription>
                    {nodesLoading ? 'Loading rectangles…' : `${nodes.length} rectangle${nodes.length === 1 ? '' : 's'}`}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={handleAddNode}>
                    <MaterialIcon name="crop_square" size="sm" className="mr-2" />
                    Add Rectangle
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-auto rounded border bg-background">
                  <svg
                    ref={svgRef}
                    viewBox={`0 0 ${mapWidth} ${mapHeight}`}
                    className="min-h-[420px] w-[1000px]"
                    onClick={() => handleSelectNode(null)}
                  >
                    <defs>
                      <pattern id="hmv-grid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
                        <path
                          d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
                          fill="none"
                          stroke="rgba(148,163,184,0.35)"
                          strokeWidth="1"
                        />
                      </pattern>
                    </defs>
                    <rect x="0" y="0" width={mapWidth} height={mapHeight} fill="url(#hmv-grid)" />

                    {nodes.map((n) => {
                      const isSelected = n.id === selectedNodeId;
                      const renderNode = isSelected && draft
                        ? {
                            ...n,
                            x: draft.x,
                            y: draft.y,
                            width: draft.width,
                            height: draft.height,
                            zone_id: draft.zone_id,
                            label: draft.label?.trim() ? draft.label.trim() : null,
                          }
                        : n;

                      const zoneCode = renderNode.zone_id ? zoneById.get(renderNode.zone_id)?.zone_code : null;
                      const label = (renderNode.label || zoneCode || '').trim();

                      const nodeForDrag = {
                        id: renderNode.id,
                        label: renderNode.label,
                        zone_id: renderNode.zone_id,
                        x: renderNode.x,
                        y: renderNode.y,
                        width: renderNode.width,
                        height: renderNode.height,
                      };

                      return (
                        <g key={n.id} onClick={(e) => e.stopPropagation()}>
                          <rect
                            x={renderNode.x}
                            y={renderNode.y}
                            width={renderNode.width}
                            height={renderNode.height}
                            fill={isSelected ? 'rgba(59,130,246,0.12)' : 'rgba(15,23,42,0.03)'}
                            stroke={isSelected ? 'rgba(59,130,246,0.9)' : 'rgba(100,116,139,0.7)'}
                            strokeWidth={isSelected ? 2 : 1}
                            className={cn(isSelected ? 'cursor-move' : 'cursor-pointer')}
                            onPointerDown={(e) => beginDrag(e, nodeForDrag, 'move')}
                          />
                          {isSelected && (
                            <rect
                              x={renderNode.x + renderNode.width - 12}
                              y={renderNode.y + renderNode.height - 12}
                              width={12}
                              height={12}
                              rx={2}
                              fill="rgba(59,130,246,0.9)"
                              stroke="rgba(255,255,255,0.9)"
                              strokeWidth={1}
                              className="cursor-nwse-resize"
                              onPointerDown={(e) => beginDrag(e, nodeForDrag, 'resize_se')}
                            />
                          )}
                          {label && (
                            <text
                              x={renderNode.x + 8}
                              y={renderNode.y + 18}
                              fontSize="14"
                              fill="rgba(15,23,42,0.75)"
                            >
                              {label}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </CardContent>
            </Card>

            {/* Sidebar */}
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Properties</CardTitle>
                  <CardDescription>
                    {selectedNode ? 'Edit the selected rectangle.' : 'Select a rectangle to edit.'}
                  </CardDescription>
                </div>
                {selectedNode && (
                  <div
                    className={cn(
                      'text-xs flex items-center gap-1.5',
                      autoSaveError ? 'text-destructive' : 'text-muted-foreground'
                    )}
                    title={autoSaveError || undefined}
                  >
                    {autoSaving ? (
                      <>
                        <MaterialIcon name="progress_activity" size="sm" className="animate-spin" />
                        Saving…
                      </>
                    ) : autoSaveError ? (
                      <>
                        <MaterialIcon name="error" size="sm" />
                        Autosave failed
                      </>
                    ) : isDraftDirty ? (
                      <>
                        <MaterialIcon name="edit" size="sm" />
                        Unsaved
                      </>
                    ) : lastSavedAt ? (
                      <>
                        <MaterialIcon name="check_circle" size="sm" />
                        Saved
                      </>
                    ) : null}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {!selectedNode || !draft ? (
                  <div className="text-sm text-muted-foreground">
                    Tip: Click a rectangle on the canvas, then assign a Zone.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Zone</Label>
                      <Select
                        value={draft.zone_id ?? UNASSIGNED_ZONE_VALUE}
                        onValueChange={(v) =>
                          setDraft((d) => (d ? { ...d, zone_id: v === UNASSIGNED_ZONE_VALUE ? null : v } : d))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UNASSIGNED_ZONE_VALUE}>Unassigned</SelectItem>
                          {zones.map((z) => (
                            <SelectItem key={z.id} value={z.id}>
                              {z.zone_code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Label (optional)</Label>
                      <Input
                        value={draft.label}
                        onChange={(e) => setDraft((d) => (d ? { ...d, label: e.target.value } : d))}
                        placeholder="Overrides zone label on the map"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>X</Label>
                        <Input
                          type="number"
                          value={draft.x}
                          onChange={(e) => setDraft((d) => (d ? { ...d, x: Number(e.target.value) || 0 } : d))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Y</Label>
                        <Input
                          type="number"
                          value={draft.y}
                          onChange={(e) => setDraft((d) => (d ? { ...d, y: Number(e.target.value) || 0 } : d))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Width</Label>
                        <Input
                          type="number"
                          value={draft.width}
                          onChange={(e) => setDraft((d) => (d ? { ...d, width: Math.max(Number(e.target.value) || 0, 1) } : d))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Height</Label>
                        <Input
                          type="number"
                          value={draft.height}
                          onChange={(e) => setDraft((d) => (d ? { ...d, height: Math.max(Number(e.target.value) || 0, 1) } : d))}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        onClick={() => void saveDraft()}
                        className="flex-1"
                        disabled={!isDraftDirty || autoSaving}
                      >
                        {autoSaving ? (
                          <>
                            <MaterialIcon name="progress_activity" size="sm" className="mr-2 animate-spin" />
                            Saving…
                          </>
                        ) : (
                          'Save now'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className="text-destructive"
                        onClick={async () => {
                          try {
                            await deleteNode(selectedNode.id);
                            setSelectedNodeId(null);
                            toast({ title: 'Deleted', description: 'Rectangle removed.' });
                          } catch (err) {
                            console.error(err);
                            toast({ variant: 'destructive', title: 'Delete failed', description: 'Failed to delete rectangle.' });
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Create map dialog */}
      <Dialog open={createMapOpen} onOpenChange={setCreateMapOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Map</DialogTitle>
            <DialogDescription>
              Create a warehouse map template. The first map is automatically set as Default.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Map name *</Label>
            <Input value={newMapName} onChange={(e) => setNewMapName(e.target.value)} placeholder="Main Warehouse Layout" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateMapOpen(false)} disabled={creatingMap}>
              Cancel
            </Button>
            <Button onClick={handleCreateMap} disabled={creatingMap}>
              {creatingMap ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

