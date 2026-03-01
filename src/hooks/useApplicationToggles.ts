import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ApplicationToggleKey =
  | 'whitelist'
  | 'staff'
  | 'police'
  | 'ems'
  | 'mechanic'
  | 'firefighter'
  | 'weazel_news'
  | 'pdm'
  | 'doj'
  | 'state_department'
  | 'gang'
  | 'business'
  | 'business_job'
  | 'creator'
  | 'ban_appeal';

const ALL_TOGGLE_KEYS: ApplicationToggleKey[] = [
  'whitelist', 'staff', 'police', 'ems', 'mechanic', 'firefighter',
  'weazel_news', 'pdm', 'doj', 'state_department', 'gang',
  'business', 'business_job', 'creator', 'ban_appeal',
];

const TOGGLE_LABELS: Record<ApplicationToggleKey, string> = {
  whitelist: 'Whitelist Application',
  staff: 'Staff Application',
  police: 'Police Application',
  ems: 'EMS Application',
  mechanic: 'Mechanic Application',
  firefighter: 'Firefighter Application',
  weazel_news: 'Weazel News Application',
  pdm: 'PDM Application',
  doj: 'DOJ Application',
  state_department: 'State Department Application',
  gang: 'Gang Application',
  business: 'Business Proposal',
  business_job: 'Business Job Application',
  creator: 'Creator Application',
  ban_appeal: 'Ban Appeal',
};

export { ALL_TOGGLE_KEYS, TOGGLE_LABELS };

export const useApplicationToggles = () => {
  const [toggles, setToggles] = useState<Record<ApplicationToggleKey, boolean>>(() => {
    const defaults: Record<string, boolean> = {};
    ALL_TOGGLE_KEYS.forEach(k => defaults[k] = true);
    return defaults as Record<ApplicationToggleKey, boolean>;
  });
  const [loading, setLoading] = useState(true);

  const fetchToggles = useCallback(async () => {
    try {
      const keys = ALL_TOGGLE_KEYS.map(k => `app_toggle_${k}`);
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', keys);

      if (error) {
        console.error('Error fetching application toggles:', error);
        return;
      }

      if (data) {
        const newToggles: Record<string, boolean> = {};
        ALL_TOGGLE_KEYS.forEach(k => newToggles[k] = true); // default true
        data.forEach((row: any) => {
          const key = row.key.replace('app_toggle_', '') as ApplicationToggleKey;
          newToggles[key] = row.value === 'true';
        });
        setToggles(newToggles as Record<ApplicationToggleKey, boolean>);
      }
    } catch (err) {
      console.error('Error fetching toggles:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchToggles();
  }, [fetchToggles]);

  const updateToggle = useCallback(async (key: ApplicationToggleKey, enabled: boolean) => {
    const dbKey = `app_toggle_${key}`;
    const { error } = await supabase
      .from('site_settings')
      .update({ value: enabled ? 'true' : 'false' })
      .eq('key', dbKey);

    if (error) {
      console.error('Error updating toggle:', error);
      return false;
    }

    setToggles(prev => ({ ...prev, [key]: enabled }));
    return true;
  }, []);

  const isOpen = useCallback((key: ApplicationToggleKey) => {
    return toggles[key] ?? true;
  }, [toggles]);

  return { toggles, loading, updateToggle, isOpen, refetch: fetchToggles };
};

// Lightweight hook for individual form pages
export const useApplicationOpen = (key: ApplicationToggleKey) => {
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', `app_toggle_${key}`)
          .maybeSingle();

        if (!error && data) {
          setIsOpen(data.value === 'true');
        }
      } catch (err) {
        console.error('Error checking application toggle:', err);
      } finally {
        setLoading(false);
      }
    };
    check();
  }, [key]);

  return { isOpen, loading };
};
