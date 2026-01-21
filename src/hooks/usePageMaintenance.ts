import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMaintenanceAccess } from './useMaintenanceAccess';

export interface PageMaintenanceSetting {
  id: string;
  page_key: string;
  page_name: string;
  is_enabled: boolean;
  maintenance_message: string | null;
  cooldown_minutes: number;
  enabled_at: string | null;
  scheduled_end_at: string | null;
  created_at: string;
  updated_at: string;
}

interface UsePageMaintenanceReturn {
  settings: PageMaintenanceSetting[];
  loading: boolean;
  refetch: () => Promise<void>;
  isPageUnderMaintenance: (pageKey: string) => boolean;
  getPageMaintenance: (pageKey: string) => PageMaintenanceSetting | undefined;
  getTimeRemaining: (pageKey: string) => { hours: number; minutes: number; seconds: number } | null;
}

export const usePageMaintenance = (): UsePageMaintenanceReturn => {
  const [settings, setSettings] = useState<PageMaintenanceSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const { hasAccess, isStaffOrOwner } = useMaintenanceAccess();

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('page_maintenance_settings')
        .select('*')
        .order('page_name');

      if (error) {
        console.error('Error fetching page maintenance settings:', error);
        return;
      }

      setSettings((data as PageMaintenanceSetting[]) || []);
    } catch (err) {
      console.error('Error in fetchSettings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('page_maintenance_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'page_maintenance_settings',
        },
        () => {
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSettings]);

  const isPageUnderMaintenance = useCallback((pageKey: string): boolean => {
    // Staff and owners can always access pages
    if (hasAccess && isStaffOrOwner) {
      return false;
    }

    const pageSetting = settings.find(s => s.page_key === pageKey);
    if (!pageSetting || !pageSetting.is_enabled) {
      return false;
    }

    // Check if maintenance has a scheduled end and if it's passed
    if (pageSetting.scheduled_end_at) {
      const endTime = new Date(pageSetting.scheduled_end_at);
      if (endTime < new Date()) {
        return false; // Maintenance period has ended
      }
    }

    return true;
  }, [settings, hasAccess, isStaffOrOwner]);

  const getPageMaintenance = useCallback((pageKey: string): PageMaintenanceSetting | undefined => {
    return settings.find(s => s.page_key === pageKey);
  }, [settings]);

  const getTimeRemaining = useCallback((pageKey: string): { hours: number; minutes: number; seconds: number } | null => {
    const pageSetting = settings.find(s => s.page_key === pageKey);
    if (!pageSetting?.scheduled_end_at) return null;

    const endTime = new Date(pageSetting.scheduled_end_at);
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();

    if (diff <= 0) return null;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds };
  }, [settings]);

  return { 
    settings, 
    loading, 
    refetch: fetchSettings, 
    isPageUnderMaintenance,
    getPageMaintenance,
    getTimeRemaining
  };
};
