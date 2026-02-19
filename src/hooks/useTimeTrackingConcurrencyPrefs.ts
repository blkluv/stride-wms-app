import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type TimeTrackingConcurrencyPrefs = {
  allowConcurrentTasks: boolean;
  allowConcurrentShipments: boolean;
  allowConcurrentStocktakes: boolean;
};

const DEFAULT_PREFS: TimeTrackingConcurrencyPrefs = {
  allowConcurrentTasks: true,
  allowConcurrentShipments: true,
  allowConcurrentStocktakes: true,
};

export function useTimeTrackingConcurrencyPrefs() {
  const { profile } = useAuth();
  const [prefs, setPrefs] = useState<TimeTrackingConcurrencyPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!profile?.tenant_id) return;
    setLoading(true);
    try {
      const { data } = await (supabase as any)
        .from('tenant_preferences')
        .select('time_tracking_allow_concurrent_tasks, time_tracking_allow_concurrent_shipments, time_tracking_allow_concurrent_stocktakes')
        .eq('tenant_id', profile.tenant_id)
        .maybeSingle();

      setPrefs({
        allowConcurrentTasks: data?.time_tracking_allow_concurrent_tasks ?? true,
        allowConcurrentShipments: data?.time_tracking_allow_concurrent_shipments ?? true,
        allowConcurrentStocktakes: data?.time_tracking_allow_concurrent_stocktakes ?? true,
      });
    } finally {
      setLoading(false);
    }
  }, [profile?.tenant_id]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { prefs, loading, refetch };
}

