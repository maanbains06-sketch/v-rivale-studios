import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to automatically verify whitelist role on signup
 * This runs once when user signs up to check if they already have the whitelist role
 */
export const useWhitelistAutoVerification = () => {
  const verifyWhitelistRole = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const discordId = user.user_metadata?.discord_id;
      if (!discordId || !/^\d{17,19}$/.test(discordId)) return;

      // Check if user already has whitelist verification recorded
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!existingProfile) return;

      // Verify Discord requirements (server membership and whitelist role)
      const { data: reqData, error: reqError } = await supabase.functions.invoke('verify-discord-requirements', {
        body: { discordId }
      });

      if (reqError) {
        console.error('Error verifying Discord requirements:', reqError);
        return;
      }

      const hasWhitelistRole = reqData?.hasWhitelistRole || false;

      if (hasWhitelistRole) {
        console.log('User has whitelist role, auto-verified on signup');
      }

      return { hasWhitelistRole, isInServer: reqData?.isInServer };
    } catch (error) {
      console.error('Whitelist auto-verification error:', error);
    }
  }, []);

  useEffect(() => {
    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Only run on initial sign in or sign up
      if (event === 'SIGNED_IN' && session?.user) {
        // Small delay to ensure metadata is available
        setTimeout(() => {
          verifyWhitelistRole();
        }, 1000);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [verifyWhitelistRole]);

  return { verifyWhitelistRole };
};
