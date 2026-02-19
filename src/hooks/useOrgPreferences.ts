import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type ContainerVolumeMode = 'units_only' | 'bounded_footprint';
export type SpaceTrackingMode = 'none' | 'cubic_feet' | 'dimensions';
export type InventoryGroupMode = 'none' | 'description' | 'container';
export type InventoryLineFormat = 'default' | 'single_line';

export interface OrgPreferences {
  container_volume_mode: ContainerVolumeMode;
  space_tracking_mode: SpaceTrackingMode;
  inventory_group_mode: InventoryGroupMode;
  inventory_line_format: InventoryLineFormat;
  /**
   * Client portal only:
   * When true, clients may request partial quantities from grouped items (qty > 1),
   * which creates a warehouse "Split" task and blocks the job until completed.
   * When false, the request is allowed but marked "Pending review" (manual workflow).
   */
  client_partial_grouped_enabled: boolean;
}

const DEFAULTS: OrgPreferences = {
  container_volume_mode: 'bounded_footprint',
  space_tracking_mode: 'none',
  inventory_group_mode: 'none',
  inventory_line_format: 'single_line',
  // Conservative default: require manual review unless explicitly enabled.
  client_partial_grouped_enabled: false,
};

export function useOrgPreferences() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<OrgPreferences>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    if (!profile?.tenant_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tenant_settings')
        .select('setting_key, setting_value')
        .eq('tenant_id', profile.tenant_id)
        .in('setting_key', [
          'container_volume_mode',
          'space_tracking_mode',
          'inventory_group_mode',
          'inventory_line_format',
          'client_partial_grouped_enabled',
        ]);

      if (error) throw error;

      const prefs = { ...DEFAULTS };
      data?.forEach((row) => {
        if (row.setting_key === 'container_volume_mode' && row.setting_value) {
          prefs.container_volume_mode = (row.setting_value as unknown as string) as ContainerVolumeMode;
        }
        if (row.setting_key === 'space_tracking_mode' && row.setting_value) {
          prefs.space_tracking_mode = (row.setting_value as unknown as string) as SpaceTrackingMode;
        }
        if (row.setting_key === 'inventory_group_mode' && row.setting_value) {
          prefs.inventory_group_mode = (row.setting_value as unknown as string) as InventoryGroupMode;
        }
        if (row.setting_key === 'inventory_line_format' && row.setting_value) {
          prefs.inventory_line_format = (row.setting_value as unknown as string) as InventoryLineFormat;
        }
        if (row.setting_key === 'client_partial_grouped_enabled') {
          const v = row.setting_value as unknown;
          if (typeof v === 'boolean') {
            prefs.client_partial_grouped_enabled = v;
          } else if (typeof v === 'string') {
            prefs.client_partial_grouped_enabled = v.trim().toLowerCase() === 'true';
          } else {
            prefs.client_partial_grouped_enabled = DEFAULTS.client_partial_grouped_enabled;
          }
        }
      });

      setPreferences(prefs);
    } catch (error) {
      console.error('Error fetching org preferences:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.tenant_id]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreference = useCallback(async <K extends keyof OrgPreferences>(key: K, value: OrgPreferences[K]) => {
    if (!profile?.tenant_id) return false;

    try {
      // Upsert the key-value pair
      const { error } = await (supabase as any)
        .from('tenant_settings')
        .upsert(
          [{
            tenant_id: profile.tenant_id,
            setting_key: key,
            setting_value: value as any,
            updated_by: profile.id,
            updated_at: new Date().toISOString(),
          }],
          { onConflict: 'tenant_id,setting_key' }
        );

      if (error) throw error;

      setPreferences((prev) => ({ ...prev, [key]: value } as OrgPreferences));
      toast({
        title: 'Preference Updated',
        description: `${key.replace(/_/g, ' ')} has been saved.`,
      });
      return true;
    } catch (error) {
      console.error('Error updating preference:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Failed to save preference.',
      });
      return false;
    }
  }, [profile?.tenant_id, profile?.id, toast]);

  return {
    preferences,
    loading,
    updatePreference,
    refetch: fetchPreferences,
  };
}
