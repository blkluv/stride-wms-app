import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface WarehouseMapZoneCapacityRow {
  zone_id: string | null;
  zone_code: string | null;
  zone_description: string | null;
  node_id: string;
  node_label: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  used_cu_ft: number | null;
  capacity_cu_ft: number | null;
  free_cu_ft: number | null;
  utilization_pct: number | null;
  state: string | null;
  location_count: number | null;
}

export function useWarehouseMapZoneCapacity(mapId?: string) {
  const { toast } = useToast();
  const [rows, setRows] = useState<WarehouseMapZoneCapacityRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  const fetchCapacity = useCallback(async (overrideMapId?: string) => {
    const targetMapId = overrideMapId || mapId;
    if (!targetMapId) {
      setRows([]);
      setLastRefreshedAt(null);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('rpc_get_warehouse_map_zone_capacity', {
        p_map_id: targetMapId,
      });

      if (error) throw error;
      setRows((data || []) as unknown as WarehouseMapZoneCapacityRow[]);
      setLastRefreshedAt(new Date());
    } catch (error) {
      console.error('Error fetching map zone capacity:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load heat map capacity data.',
      });
    } finally {
      setLoading(false);
    }
  }, [mapId, toast]);

  useEffect(() => {
    fetchCapacity();
  }, [fetchCapacity]);

  return {
    rows,
    loading,
    lastRefreshedAt,
    fetchCapacity,
    refetch: fetchCapacity,
  };
}

