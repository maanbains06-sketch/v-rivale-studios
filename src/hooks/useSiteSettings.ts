import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SiteSettings {
  maintenance_mode: boolean;
  applications_paused: boolean;
  registration_enabled: boolean;
  support_chat_enabled: boolean;
  gallery_submissions_enabled: boolean;
  auto_approve_veterans: boolean;
  announcement_banner: string;
  announcement_type: string;
  // Individual application type toggles
  whitelist_applications_enabled: boolean;
  staff_applications_enabled: boolean;
  job_applications_enabled: boolean;
  ban_appeals_enabled: boolean;
  gang_applications_enabled: boolean;
  creator_applications_enabled: boolean;
  // Business header visibility
  business_header_hidden: boolean;
  // Business jobs section visibility
  business_jobs_hidden: boolean;
  // Featured positions carousel visibility
  featured_positions_hidden: boolean;
}

interface UseSiteSettingsReturn {
  settings: SiteSettings;
  loading: boolean;
  refetch: () => Promise<void>;
}

const defaultSettings: SiteSettings = {
  maintenance_mode: false,
  applications_paused: false,
  registration_enabled: true,
  support_chat_enabled: true,
  gallery_submissions_enabled: true,
  auto_approve_veterans: false,
  announcement_banner: '',
  announcement_type: 'info',
  // Individual application type toggles - default to true
  whitelist_applications_enabled: true,
  staff_applications_enabled: true,
  job_applications_enabled: true,
  ban_appeals_enabled: true,
  gang_applications_enabled: true,
  creator_applications_enabled: true,
  // Business header - default to visible (false = not hidden)
  business_header_hidden: false,
  // Business jobs - default to visible (false = not hidden)
  business_jobs_hidden: false,
  // Featured positions - default to visible (false = not hidden)
  featured_positions_hidden: false,
};

// Cache settings in localStorage for instant loading
const CACHE_KEY = 'slrp_site_settings';
const CACHE_DURATION = 1000 * 60 * 1; // 1 minute cache - shorter to ensure settings sync faster

interface CachedSettings {
  settings: SiteSettings;
  timestamp: number;
}

export const useSiteSettings = (): UseSiteSettingsReturn => {
  const [settings, setSettings] = useState<SiteSettings>(() => {
    // Try to load from cache immediately for instant UI
    // But only use cache for non-critical settings
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: CachedSettings = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_DURATION) {
          return parsed.settings;
        }
      }
    } catch {
      // Ignore
    }
    return defaultSettings;
  });
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', [
          'maintenance_mode',
          'applications_paused',
          'registration_enabled',
          'support_chat_enabled',
          'gallery_submissions_enabled',
          'auto_approve_veterans',
          'announcement_banner',
          'announcement_type',
          'whitelist_applications_enabled',
          'staff_applications_enabled',
          'job_applications_enabled',
          'ban_appeals_enabled',
          'gang_applications_enabled',
          'creator_applications_enabled',
          'business_header_hidden',
          'business_jobs_hidden',
          'featured_positions_hidden',
        ]);

      if (error) {
        console.error('Error fetching site settings:', error);
        return;
      }

      if (data) {
        const settingsMap: Record<string, string> = {};
        data.forEach((s) => {
          settingsMap[s.key] = s.value;
        });

        const newSettings: SiteSettings = {
          maintenance_mode: settingsMap.maintenance_mode === 'true',
          applications_paused: settingsMap.applications_paused === 'true',
          registration_enabled: settingsMap.registration_enabled !== 'false',
          support_chat_enabled: settingsMap.support_chat_enabled !== 'false',
          gallery_submissions_enabled: settingsMap.gallery_submissions_enabled !== 'false',
          auto_approve_veterans: settingsMap.auto_approve_veterans === 'true',
          announcement_banner: settingsMap.announcement_banner || '',
          announcement_type: settingsMap.announcement_type || 'info',
          // Individual application type toggles - default to true if not set
          whitelist_applications_enabled: settingsMap.whitelist_applications_enabled !== 'false',
          staff_applications_enabled: settingsMap.staff_applications_enabled !== 'false',
          job_applications_enabled: settingsMap.job_applications_enabled !== 'false',
          ban_appeals_enabled: settingsMap.ban_appeals_enabled !== 'false',
          gang_applications_enabled: settingsMap.gang_applications_enabled !== 'false',
          creator_applications_enabled: settingsMap.creator_applications_enabled !== 'false',
          business_header_hidden: settingsMap.business_header_hidden === 'true',
          business_jobs_hidden: settingsMap.business_jobs_hidden === 'true',
          featured_positions_hidden: settingsMap.featured_positions_hidden === 'true',
        };

        setSettings(newSettings);
        try {
          const cacheData: CachedSettings = { settings: newSettings, timestamp: Date.now() };
          localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        } catch {
          // Ignore storage errors
        }
      }
    } catch (err) {
      console.error('Error in fetchSettings:', err);
    } finally {
      setLoading(false);
      fetchedRef.current = true;
    }
  }, []);

  useEffect(() => {
    // Always fetch fresh data on mount to ensure settings are current
    // Cache is only used for initial render to prevent flicker
    fetchSettings();

    // Subscribe to realtime changes - refetch on any site_settings change
    const channel = supabase
      .channel('site_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings',
        },
        (payload) => {
          // Clear cache and refetch on any change to ensure UI stays in sync
          console.log('[useSiteSettings] Setting changed, clearing cache and refetching:', payload);
          try {
            localStorage.removeItem(CACHE_KEY);
          } catch {
            // Ignore
          }
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSettings]);

  return { settings, loading, refetch: fetchSettings };
};