import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type ApplicationTable = 
  | 'whitelist_applications'
  | 'job_applications'
  | 'ban_appeals'
  | 'staff_applications'
  | 'creator_applications'
  | 'firefighter_applications'
  | 'weazel_news_applications'
  | 'pdm_applications';

interface UseRealtimeApplicationsProps {
  onWhitelistChange?: () => void;
  onJobChange?: () => void;
  onBanAppealChange?: () => void;
  onStaffChange?: () => void;
  onCreatorChange?: () => void;
  onFirefighterChange?: () => void;
  onWeazelChange?: () => void;
  onPdmChange?: () => void;
  showNotifications?: boolean;
}

const tableDisplayNames: Record<ApplicationTable, string> = {
  whitelist_applications: 'Whitelist',
  job_applications: 'Job',
  ban_appeals: 'Ban Appeal',
  staff_applications: 'Staff',
  creator_applications: 'Creator',
  firefighter_applications: 'Firefighter',
  weazel_news_applications: 'Weazel News',
  pdm_applications: 'PDM',
};

export const useRealtimeApplications = ({
  onWhitelistChange,
  onJobChange,
  onBanAppealChange,
  onStaffChange,
  onCreatorChange,
  onFirefighterChange,
  onWeazelChange,
  onPdmChange,
  showNotifications = true,
}: UseRealtimeApplicationsProps) => {
  const { toast } = useToast();

  const handleChange = useCallback(
    (
      table: ApplicationTable,
      payload: RealtimePostgresChangesPayload<{ [key: string]: any }>,
      callback?: () => void
    ) => {
      const displayName = tableDisplayNames[table];

      if (payload.eventType === 'INSERT' && showNotifications) {
        toast({
          title: `New ${displayName} Application`,
          description: 'A new application has been submitted.',
          duration: 4000,
        });
      } else if (payload.eventType === 'UPDATE' && showNotifications) {
        const newStatus = (payload.new as any)?.status;
        if (newStatus) {
          toast({
            title: `${displayName} Application Updated`,
            description: `Status changed to: ${newStatus}`,
            duration: 3000,
          });
        }
      }

      callback?.();
    },
    [toast, showNotifications]
  );

  useEffect(() => {
    const channel = supabase
      .channel('applications-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'whitelist_applications' },
        (payload) => handleChange('whitelist_applications', payload, onWhitelistChange)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'job_applications' },
        (payload) => handleChange('job_applications', payload, onJobChange)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ban_appeals' },
        (payload) => handleChange('ban_appeals', payload, onBanAppealChange)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'staff_applications' },
        (payload) => handleChange('staff_applications', payload, onStaffChange)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'creator_applications' },
        (payload) => handleChange('creator_applications', payload, onCreatorChange)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'firefighter_applications' },
        (payload) => handleChange('firefighter_applications', payload, onFirefighterChange)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'weazel_news_applications' },
        (payload) => handleChange('weazel_news_applications', payload, onWeazelChange)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pdm_applications' },
        (payload) => handleChange('pdm_applications', payload, onPdmChange)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    handleChange,
    onWhitelistChange,
    onJobChange,
    onBanAppealChange,
    onStaffChange,
    onCreatorChange,
    onFirefighterChange,
    onWeazelChange,
    onPdmChange,
  ]);
};
