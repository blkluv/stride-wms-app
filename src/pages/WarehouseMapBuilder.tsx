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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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

type SidebarSection = 'properties' | 'zones' | 'alias' | 'groups';

type ViewBox = { x: number; y: number; w: number; h: number };
type PanState = { startClient: { x: number; y: number }; startView: ViewBox };
type BoxSelectState = { start: { x: number; y: number }; current: { x: number; y: number } };

export default function WarehouseMapBuilder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();
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
    refetch: refetchNodes,
  } = useWarehouseMapNodes(mapIdForNodes);

  const zoneById = useMemo(() => new Map(zones.map((z) => [z.id, z])), [zones]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(() => new Set());
  const selectedCount = selectedNodeIds.size;
  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  const [draft, setDraft] = useState<NodeDraft | null>(null);
  const zoneIdToNodeId = useMemo(() => {
    const m = new Map<string, string>();
    for (const n of nodes) {
      if (n.zone_id) m.set(n.zone_id, n.id);
    }
    return m;
  }, [nodes]);

  const filteredZones = useMemo(() => {
    const q = zoneSearch.trim().toLowerCase();
    if (!q) return zones;
    return zones.filter((z) => {
      const code = String(z.zone_code || '').toLowerCase();
      const desc = String(z.description || '').toLowerCase();
      return code.includes(q) || desc.includes(q);
    });
  }, [zoneSearch, zones]);

  const unplacedZones = useMemo(
    () => filteredZones.filter((z) => !zoneIdToNodeId.has(z.id)),
    [filteredZones, zoneIdToNodeId]
  );

  const placedZones = useMemo(
    () => filteredZones.filter((z) => zoneIdToNodeId.has(z.id)),
    [filteredZones, zoneIdToNodeId]
  );

  const groupBoxes = useMemo(() => {
    const byLabel = new Map<string, { minX: number; minY: number; maxX: number; maxY: number; count: number }>();

    for (const n of nodes) {
      const label = (n.group_label || '').trim();
      if (!label) continue;

      const x = n.id === selectedNodeId && draft ? draft.x : n.x;
      const y = n.id === selectedNodeId && draft ? draft.y : n.y;
      const w = n.id === selectedNodeId && draft ? draft.width : n.width;
      const h = n.id === selectedNodeId && draft ? draft.height : n.height;

      const existing = byLabel.get(label);
      if (!existing) {
        byLabel.set(label, { minX: x, minY: y, maxX: x + w, maxY: y + h, count: 1 });
      } else {
        existing.minX = Math.min(existing.minX, x);
        existing.minY = Math.min(existing.minY, y);
        existing.maxX = Math.max(existing.maxX, x + w);
        existing.maxY = Math.max(existing.maxY, y + h);
        existing.count += 1;
      }
    }

    return Array.from(byLabel.entries())
      .map(([label, box]) => ({ label, ...box }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [draft, nodes, selectedNodeId]);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  const [sidebarSection, setSidebarSection] = useState<SidebarSection>('properties');
  const [groupLabelDraft, setGroupLabelDraft] = useState('');
  const [zoneSearch, setZoneSearch] = useState('');
  const [groupSaving, setGroupSaving] = useState(false);

  const [autoSaving, setAutoSaving] = useState(false);
  const [autoSaveError, setAutoSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const autoSaveErrorToastRef = useRef(false);

  useEffect(() => {
    if (!profile?.id) return;
    const saved = localStorage.getItem(`hmv.mapBuilder.sidebarSection.${profile.id}`);
    if (saved === 'properties' || saved === 'zones' || saved === 'alias' || saved === 'groups') {
      setSidebarSection(saved);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id) return;
    localStorage.setItem(`hmv.mapBuilder.sidebarSection.${profile.id}`, sidebarSection);
  }, [profile?.id, sidebarSection]);

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

  // Keep selection state valid if nodes are refetched/deleted.
  useEffect(() => {
    if (nodes.length === 0) {
      if (selectedNodeId || selectedNodeIds.size > 0) {
        setSelectedNodeId(null);
        setSelectedNodeIds(new Set());
      }
      return;
    }

    const valid = new Set(nodes.map((n) => n.id));
    const filtered = new Set(Array.from(selectedNodeIds).filter((id) => valid.has(id)));
    const nextActive =
      selectedNodeId && valid.has(selectedNodeId)
        ? selectedNodeId
        : filtered.size > 0
          ? filtered.values().next().value
          : null;

    if (filtered.size !== selectedNodeIds.size) {
      setSelectedNodeIds(filtered);
    }
    if (nextActive !== selectedNodeId) {
      setSelectedNodeId(nextActive);
    }
  }, [nodes, selectedNodeId, selectedNodeIds]);

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
      setSelectedNodeIds(new Set([created.id]));
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
          setSelectedNodeIds(new Set([created.id]));
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

  const clearSelection = () => {
    // Best-effort: flush pending edits before clearing selection.
    if (selectedNode && draft && isDraftDirty) {
      void saveDraftRef.current({ silent: true });
    }
    setSelectedNodeId(null);
    setSelectedNodeIds(new Set());
  };

  const selectSingleNode = (nodeId: string) => {
    // Best-effort: flush pending edits before switching active selection.
    if (selectedNodeId && selectedNodeId !== nodeId && selectedNode && draft && isDraftDirty) {
      void saveDraftRef.current({ silent: true });
    }
    setSelectedNodeId(nodeId);
    setSelectedNodeIds(new Set([nodeId]));
  };

  const toggleNodeSelected = (nodeId: string) => {
    setSelectedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }

      // Maintain an active selection id when possible.
      if (next.size === 0) {
        setSelectedNodeId(null);
      } else if (!selectedNodeId || !next.has(selectedNodeId)) {
        setSelectedNodeId(next.values().next().value || null);
      }

      return next;
    });
  };

  const setGroupLabelForSelection = async (nextGroupLabel: string | null) => {
    if (!mapIdForNodes) return;
    const ids = Array.from(selectedNodeIds);
    if (ids.length === 0) return;

    try {
      setGroupSaving(true);
      const normalized = nextGroupLabel?.trim() ? nextGroupLabel.trim() : null;

      const { error } = await supabase
        .from('warehouse_map_nodes')
        .update({
          group_label: normalized,
          updated_by: profile?.id ?? null,
        } as any)
        .in('id', ids);

      if (error) throw error;

      await refetchNodes();
      toast({
        title: 'Group updated',
        description: normalized ? `Assigned group "${normalized}"` : 'Cleared group assignment',
      });
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Update failed', description: 'Failed to update group labels.' });
    } finally {
      setGroupSaving(false);
    }
  };

  const selectNodesByGroup = (groupLabel: string) => {
    const ids = nodes.filter((n) => (n.group_label || '').trim() === groupLabel).map((n) => n.id);
    if (ids.length === 0) return;

    // Best-effort: flush pending edits before switching selections.
    if (selectedNode && draft && isDraftDirty) {
      void saveDraftRef.current({ silent: true });
    }

    setSelectedNodeIds(new Set(ids));
    setSelectedNodeId(ids[0]);
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

  const [view, setView] = useState<ViewBox>(() => ({ x: 0, y: 0, w: mapWidth, h: mapHeight }));
  const [pan, setPan] = useState<PanState | null>(null);
  const [boxSelect, setBoxSelect] = useState<BoxSelectState | null>(null);
  const suppressNextClickRef = useRef(false);

  // Reset viewport when switching maps or resizing map dimensions.
  useEffect(() => {
    setView({ x: 0, y: 0, w: mapWidth, h: mapHeight });
  }, [activeMap?.id, mapHeight, mapWidth]);

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

  const clampView = (vb: ViewBox): ViewBox => {
    const minW = 200;
    const minH = 200;
    const w = Math.min(Math.max(vb.w, minW), mapWidth);
    const h = Math.min(Math.max(vb.h, minH), mapHeight);
    const x = Math.min(Math.max(vb.x, 0), Math.max(0, mapWidth - w));
    const y = Math.min(Math.max(vb.y, 0), Math.max(0, mapHeight - h));
    return { x, y, w, h };
  };

  const zoomAtClient = (clientX: number, clientY: number, factor: number) => {
    setView((prev) => {
      const p = getSvgPoint(clientX, clientY);
      const nextW = prev.w * factor;
      const nextH = prev.h * factor;
      const rx = prev.w > 0 ? (p.x - prev.x) / prev.w : 0.5;
      const ry = prev.h > 0 ? (p.y - prev.y) / prev.h : 0.5;
      const next: ViewBox = {
        x: p.x - rx * nextW,
        y: p.y - ry * nextH,
        w: nextW,
        h: nextH,
      };
      return clampView(next);
    });
  };

  const zoomBy = (factor: number) => {
    setView((prev) => {
      const cx = prev.x + prev.w / 2;
      const cy = prev.y + prev.h / 2;
      const nextW = prev.w * factor;
      const nextH = prev.h * factor;
      return clampView({
        x: cx - nextW / 2,
        y: cy - nextH / 2,
        w: nextW,
        h: nextH,
      });
    });
  };

  const resetView = () => {
    setView({ x: 0, y: 0, w: mapWidth, h: mapHeight });
  };

  const beginDrag = (e: React.PointerEvent, node: { id: string; label: string | null; zone_id: string | null; x: number; y: number; width: number; height: number }, mode: DragMode) => {
    e.stopPropagation();
    e.preventDefault();

    selectSingleNode(node.id);
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

  // Background interactions: Alt+drag pan, Shift+drag box-select.
  useEffect(() => {
    if (!pan && !boxSelect) return;

    const handleMove = (e: PointerEvent) => {
      if (pan) {
        const svg = svgRef.current;
        const rect = svg?.getBoundingClientRect();
        if (rect && rect.width > 0 && rect.height > 0) {
          const scaleX = pan.startView.w / rect.width;
          const scaleY = pan.startView.h / rect.height;
          const dx = (e.clientX - pan.startClient.x) * scaleX;
          const dy = (e.clientY - pan.startClient.y) * scaleY;
          setView(clampView({
            x: pan.startView.x - dx,
            y: pan.startView.y - dy,
            w: pan.startView.w,
            h: pan.startView.h,
          }));
        }
      }

      if (boxSelect) {
        setBoxSelect((prev) => {
          if (!prev) return prev;
          const p = getSvgPoint(e.clientX, e.clientY);
          return { ...prev, current: p };
        });
      }
    };

    const finalizeBoxSelection = (box: BoxSelectState) => {
      const minX = Math.min(box.start.x, box.current.x);
      const maxX = Math.max(box.start.x, box.current.x);
      const minY = Math.min(box.start.y, box.current.y);
      const maxY = Math.max(box.start.y, box.current.y);
      const hits: string[] = [];

      for (const n of nodes) {
        const x = n.id === selectedNodeId && draft ? draft.x : n.x;
        const y = n.id === selectedNodeId && draft ? draft.y : n.y;
        const w = n.id === selectedNodeId && draft ? draft.width : n.width;
        const h = n.id === selectedNodeId && draft ? draft.height : n.height;

        const intersects =
          x < maxX &&
          x + w > minX &&
          y < maxY &&
          y + h > minY;
        if (intersects) hits.push(n.id);
      }

      if (hits.length === 0) return;

      setSelectedNodeIds((prev) => {
        const next = new Set(prev);
        for (const id of hits) next.add(id);
        return next;
      });
      setSelectedNodeId((prev) => prev ?? hits[0]);
    };

    const handleUp = () => {
      if (boxSelect) {
        finalizeBoxSelection(boxSelect);
      }
      setPan(null);
      setBoxSelect(null);
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
  }, [boxSelect, clampView, draft, getSvgPoint, nodes, pan, selectedNodeId]);

  const defaultNodeSize = { width: 160, height: 100 };

  const suggestNewNodePosition = (index: number) => {
    const padding = Math.max(gridSize * 2, 20);
    const stepX = Math.max(defaultNodeSize.width + gridSize * 2, 180);
    const stepY = Math.max(defaultNodeSize.height + gridSize * 2, 130);
    const maxCols = Math.max(1, Math.floor((mapWidth - padding) / stepX));
    const col = index % maxCols;
    const row = Math.floor(index / maxCols);
    const x = padding + col * stepX;
    const y = padding + row * stepY;

    return {
      x: Math.min(x, Math.max(0, mapWidth - defaultNodeSize.width)),
      y: Math.min(y, Math.max(0, mapHeight - defaultNodeSize.height)),
    };
  };

  const handlePlaceZoneOnMap = async (zoneId: string) => {
    if (!activeMap) return;
    if (zoneIdToNodeId.has(zoneId)) {
      toast({ title: 'Already placed', description: 'That zone already has a rectangle on this map.' });
      return;
    }
    try {
      const { x, y } = suggestNewNodePosition(nodes.length);
      const created = await createNode({
        x,
        y,
        width: defaultNodeSize.width,
        height: defaultNodeSize.height,
        label: null,
        zone_id: zoneId,
        sort_order: nodes.length,
      });
      setSelectedNodeId(created.id);
      setSelectedNodeIds(new Set([created.id]));
      toast({ title: 'Placed', description: 'Zone rectangle added to the map.' });
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Place failed', description: 'Failed to place zone rectangle.' });
    }
  };

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
                  clearSelection();
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
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => zoomBy(1.25)}
                    title="Zoom out"
                  >
                    <MaterialIcon name="zoom_out" size="sm" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => zoomBy(0.8)}
                    title="Zoom in"
                  >
                    <MaterialIcon name="zoom_in" size="sm" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={resetView}
                    title="Reset view"
                  >
                    <MaterialIcon name="center_focus_strong" size="sm" />
                  </Button>
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
                    viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
                    className="min-h-[420px] w-[1000px]"
                    onClick={() => {
                      if (suppressNextClickRef.current) {
                        suppressNextClickRef.current = false;
                        return;
                      }
                      clearSelection();
                    }}
                    onPointerDown={(e) => {
                      // Background-only: nodes stopPropagation in their handlers.
                      if (e.altKey) {
                        e.preventDefault();
                        suppressNextClickRef.current = true;
                        setPan({ startClient: { x: e.clientX, y: e.clientY }, startView: view });
                        return;
                      }
                      if (e.shiftKey) {
                        e.preventDefault();
                        suppressNextClickRef.current = true;
                        const p = getSvgPoint(e.clientX, e.clientY);
                        setBoxSelect({ start: p, current: p });
                      }
                    }}
                    onWheel={(e) => {
                      // Zoom with Ctrl/trackpad pinch (prevents accidental zoom while scrolling).
                      if (!e.ctrlKey && !e.metaKey) return;
                      e.preventDefault();
                      const factor = e.deltaY < 0 ? 0.9 : 1.1;
                      zoomAtClient(e.clientX, e.clientY, factor);
                    }}
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

                    {/* Group labels (computed from node group_label) */}
                    {groupBoxes.map((g) => (
                      <text
                        key={g.label}
                        x={g.minX}
                        y={Math.max(g.minY - 8, 18)}
                        fontSize="16"
                        fill="rgba(15,23,42,0.7)"
                        stroke="rgba(255,255,255,0.9)"
                        strokeWidth={3}
                        paintOrder="stroke"
                      >
                        {g.label}
                      </text>
                    ))}

                    {nodes.map((n) => {
                      const isActive = n.id === selectedNodeId;
                      const isSelected = selectedNodeIds.has(n.id);
                      const renderNode = isActive && draft
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
                            fill={isSelected ? 'rgba(59,130,246,0.10)' : 'rgba(15,23,42,0.03)'}
                            stroke={
                              isActive
                                ? 'rgba(59,130,246,0.9)'
                                : isSelected
                                  ? 'rgba(59,130,246,0.55)'
                                  : 'rgba(100,116,139,0.7)'
                            }
                            strokeWidth={isActive || isSelected ? 2 : 1}
                            className={cn(isActive && selectedCount === 1 ? 'cursor-move' : 'cursor-pointer')}
                            onPointerDown={(e) => {
                              if (e.shiftKey) {
                                e.stopPropagation();
                                e.preventDefault();
                                if (isActive && draft && isDraftDirty) {
                                  void saveDraftRef.current({ silent: true });
                                }
                                toggleNodeSelected(renderNode.id);
                                return;
                              }
                              beginDrag(e, nodeForDrag, 'move');
                            }}
                          />
                          {isActive && selectedCount === 1 && (
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

                    {boxSelect && (
                      <rect
                        x={Math.min(boxSelect.start.x, boxSelect.current.x)}
                        y={Math.min(boxSelect.start.y, boxSelect.current.y)}
                        width={Math.abs(boxSelect.current.x - boxSelect.start.x)}
                        height={Math.abs(boxSelect.current.y - boxSelect.start.y)}
                        fill="rgba(59,130,246,0.12)"
                        stroke="rgba(59,130,246,0.7)"
                        strokeWidth={1}
                        pointerEvents="none"
                      />
                    )}
                  </svg>
                </div>
              </CardContent>
            </Card>

            {/* Sidebar */}
            <Card>
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">Preferences</CardTitle>
                    <CardDescription>
                      {selectedCount === 0
                        ? 'No rectangles selected.'
                        : selectedCount === 1
                          ? '1 rectangle selected.'
                          : `${selectedCount} rectangles selected.`}
                    </CardDescription>
                  </div>
                  {selectedCount === 1 && selectedNode && (
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
                </div>

                <div className="flex items-center gap-2">
                  <Select value={sidebarSection} onValueChange={(v) => setSidebarSection(v as SidebarSection)}>
                    <SelectTrigger className="h-8 w-[180px] text-xs">
                      <SelectValue placeholder="Section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="properties">Properties</SelectItem>
                      <SelectItem value="zones">Zones</SelectItem>
                      <SelectItem value="alias">Alias</SelectItem>
                      <SelectItem value="groups">Groups</SelectItem>
                    </SelectContent>
                  </Select>
                  {selectedCount > 1 && (
                    <div className="text-xs text-muted-foreground">Shift+click to adjust selection</div>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                {sidebarSection === 'properties' && (
                  <div className="space-y-4">
                    {selectedCount === 0 ? (
                      <div className="text-sm text-muted-foreground">
                        Select a rectangle to edit geometry. Tip: Shift+click to multi-select.
                      </div>
                    ) : selectedCount > 1 ? (
                      <div className="text-sm text-muted-foreground">
                        Geometry editing is only available for a single selection.
                      </div>
                    ) : !selectedNode || !draft ? (
                      <div className="text-sm text-muted-foreground">Loading selection…</div>
                    ) : (
                      <>
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
                                clearSelection();
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

                        <div className="text-xs text-muted-foreground">
                          Tip: Ctrl/Cmd+D duplicates the selected rectangle (duplicate is unassigned).
                        </div>
                      </>
                    )}
                  </div>
                )}

                {sidebarSection === 'zones' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Search zones</Label>
                      <Input
                        value={zoneSearch}
                        onChange={(e) => setZoneSearch(e.target.value)}
                        placeholder="ZN-001, Overflow…"
                      />
                    </div>

                    {selectedCount === 1 && selectedNode && draft && (
                      <div className="space-y-2">
                        <Label>Selected rectangle zone</Label>
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
                            {zones.map((z) => {
                              const usedByNodeId = zoneIdToNodeId.get(z.id);
                              const disabled = !!usedByNodeId && usedByNodeId !== selectedNode.id;
                              return (
                                <SelectItem key={z.id} value={z.id} disabled={disabled}>
                                  {z.zone_code}{disabled ? ' (already placed)' : ''}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          One rectangle per zone (you can unassign a zone to move it).
                        </p>
                      </div>
                    )}

                    {selectedCount > 1 && (
                      <div className="text-sm text-muted-foreground">
                        Select a single rectangle to assign a Zone.
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Unplaced zones</Label>
                        <div className="text-xs text-muted-foreground">{unplacedZones.length}</div>
                      </div>
                      {unplacedZones.length === 0 ? (
                        <div className="text-sm text-muted-foreground">All zones are placed on this map.</div>
                      ) : (
                        <div className="max-h-56 overflow-auto space-y-1 pr-1">
                          {unplacedZones.slice(0, 60).map((z) => (
                            <div
                              key={z.id}
                              className="flex items-center justify-between gap-2 rounded border px-2 py-1.5"
                            >
                              <div className="min-w-0">
                                <div className="font-mono text-xs truncate">{z.zone_code}</div>
                                {z.description && (
                                  <div className="text-[11px] text-muted-foreground truncate">{z.description}</div>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => void handlePlaceZoneOnMap(z.id)}
                              >
                                Place
                              </Button>
                            </div>
                          ))}
                          {unplacedZones.length > 60 && (
                            <div className="text-xs text-muted-foreground py-1">
                              Showing first 60 — use search to find a specific zone.
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Placed zones</Label>
                        <div className="text-xs text-muted-foreground">{placedZones.length}</div>
                      </div>
                      {placedZones.length === 0 ? (
                        <div className="text-sm text-muted-foreground">No zones placed yet.</div>
                      ) : (
                        <div className="max-h-40 overflow-auto space-y-1 pr-1">
                          {placedZones.slice(0, 40).map((z) => {
                            const nodeId = zoneIdToNodeId.get(z.id);
                            return (
                              <div
                                key={z.id}
                                className="flex items-center justify-between gap-2 rounded border px-2 py-1.5"
                              >
                                <div className="min-w-0">
                                  <div className="font-mono text-xs truncate">{z.zone_code}</div>
                                  {z.description && (
                                    <div className="text-[11px] text-muted-foreground truncate">{z.description}</div>
                                  )}
                                </div>
                                {nodeId && (
                                  <Button size="sm" variant="outline" onClick={() => selectSingleNode(nodeId)}>
                                    Select
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                          {placedZones.length > 40 && (
                            <div className="text-xs text-muted-foreground py-1">
                              Showing first 40 — use search to find a specific zone.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {sidebarSection === 'alias' && (
                  <div className="space-y-4">
                    {selectedCount !== 1 || !selectedNode || !draft ? (
                      <div className="text-sm text-muted-foreground">
                        Select a single rectangle to edit its alias.
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label>Alias (optional)</Label>
                          <Input
                            value={draft.label}
                            onChange={(e) => setDraft((d) => (d ? { ...d, label: e.target.value } : d))}
                            placeholder="Overrides zone label on the map"
                          />
                          <p className="text-xs text-muted-foreground">
                            If empty, the map shows the zone code.
                          </p>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDraft((d) => (d ? { ...d, label: '' } : d))}
                          >
                            Clear alias
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {sidebarSection === 'groups' && (
                  <div className="space-y-4">
                    <div className="text-xs text-muted-foreground">
                      Groups are user-defined collections (rows, sections, overflow, etc.). Apply to any mixed selection.
                    </div>

                    <div className="space-y-2">
                      <Label>Group label</Label>
                      <Input
                        value={groupLabelDraft}
                        onChange={(e) => setGroupLabelDraft(e.target.value)}
                        placeholder="Row A, Overflow, Dock…"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => void setGroupLabelForSelection(groupLabelDraft)}
                          disabled={selectedCount === 0 || groupSaving}
                        >
                          Apply to selection
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => void setGroupLabelForSelection(null)}
                          disabled={selectedCount === 0 || groupSaving}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Existing groups</Label>
                        <div className="text-xs text-muted-foreground">{groupBoxes.length}</div>
                      </div>
                      {groupBoxes.length === 0 ? (
                        <div className="text-sm text-muted-foreground">No groups yet.</div>
                      ) : (
                        <div className="max-h-56 overflow-auto space-y-1 pr-1">
                          {groupBoxes.map((g) => (
                            <div
                              key={g.label}
                              className="flex items-center justify-between gap-2 rounded border px-2 py-1.5"
                            >
                              <button
                                type="button"
                                className="min-w-0 text-left"
                                onClick={() => setGroupLabelDraft(g.label)}
                                title="Click to use this label"
                              >
                                <div className="text-sm font-medium truncate">{g.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  {g.count} rectangle{g.count === 1 ? '' : 's'}
                                </div>
                              </button>
                              <Button size="sm" variant="outline" onClick={() => selectNodesByGroup(g.label)}>
                                Select
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
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

