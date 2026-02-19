import { useEffect, useMemo, useState } from 'react';
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

  const saveDraft = async () => {
    if (!selectedNode || !draft) return;
    try {
      await updateNode(selectedNode.id, {
        label: draft.label?.trim() ? draft.label.trim() : null,
        zone_id: draft.zone_id,
        x: draft.x,
        y: draft.y,
        width: draft.width,
        height: draft.height,
      });
      toast({ title: 'Saved', description: 'Node updated.' });
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Save failed', description: 'Failed to update node.' });
    }
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

  const mapWidth = activeMap?.width ?? 2000;
  const mapHeight = activeMap?.height ?? 1200;
  const gridSize = activeMap?.grid_size ?? 20;

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
              <CardDescription>
                {mapsLoading ? 'Loading…' : `${maps.length} map${maps.length === 1 ? '' : 's'}`}
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
                    viewBox={`0 0 ${mapWidth} ${mapHeight}`}
                    className="min-h-[420px] w-[1000px]"
                    onClick={() => setSelectedNodeId(null)}
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
                      const zoneCode = n.zone_id ? zoneById.get(n.zone_id)?.zone_code : null;
                      const label = (n.label || zoneCode || '').trim();

                      return (
                        <g key={n.id} onClick={(e) => e.stopPropagation()}>
                          <rect
                            x={n.x}
                            y={n.y}
                            width={n.width}
                            height={n.height}
                            fill={isSelected ? 'rgba(59,130,246,0.12)' : 'rgba(15,23,42,0.03)'}
                            stroke={isSelected ? 'rgba(59,130,246,0.9)' : 'rgba(100,116,139,0.7)'}
                            strokeWidth={isSelected ? 2 : 1}
                            className={cn('cursor-pointer')}
                            onClick={() => setSelectedNodeId(n.id)}
                          />
                          {label && (
                            <text
                              x={n.x + 8}
                              y={n.y + 18}
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
              <CardHeader>
                <CardTitle className="text-base">Properties</CardTitle>
                <CardDescription>
                  {selectedNode ? 'Edit the selected rectangle.' : 'Select a rectangle to edit.'}
                </CardDescription>
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
                        value={draft.zone_id ?? ''}
                        onValueChange={(v) => setDraft((d) => (d ? { ...d, zone_id: v || null } : d))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Unassigned</SelectItem>
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
                      <Button onClick={saveDraft} className="flex-1">
                        Save
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

