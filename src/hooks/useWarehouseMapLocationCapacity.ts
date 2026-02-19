import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface WarehouseMapLocationCapacityRow {
  location_id: string;
  location_code: string;
  zone_id: string;
  used_cu_ft: number | null;
  capacity_cu_ft: number | null;
  free_cu_ft: number | null;
  utilization_pct: number | null;
}

/**
 * Location-level capacity rollup for Heat Map drill-down.
 *
 * Important: do not fetch on initial heat map load (can be large).
 * Fetch on-demand when a zone is selected.
 */
export function useWarehouseMapLocationCapacity(mapId?: string, zoneId?: string | null) {
  const { toast } = useToast();
  const [rows, setRows] = useState<WarehouseMapLocationCapacityRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  const fetchLocations = useCallback(async (overrideMapId?: string) => {
    const targetMapId = overrideMapId || mapId;
    if (!targetMapId || !zoneId) {
      setRows([]);
      setLastRefreshedAt(null);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('rpc_get_warehouse_zone_location_capacity', {
        p_map_id: targetMapId,
        p_zone_id: zoneId,
      });
      if (error) throw error;

      setRows((data || []) as unknown as WarehouseMapLocationCapacityRow[]);
      setLastRefreshedAt(new Date());
    } catch (error) {
      console.error('Error fetching map location capacity:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load location drill-down data.',
      });
    } finally {
      setLoading(false);
    }
  }, [mapId, toast, zoneId]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  return {
    rows,
    loading,
    lastRefreshedAt,
    fetchLocations,
    refetch: fetchLocations,
  };
}

