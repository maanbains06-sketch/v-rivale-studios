import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useReferralTracking = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const trackReferral = async () => {
      const refCode = searchParams.get('ref');
      
      if (refCode) {
        // Store referral code in localStorage for later use
        localStorage.setItem('referral_code', refCode);
        
        // Show notification about referral discount
        toast({
          title: "🎁 Referral Discount Applied!",
          description: "Get 5% off your first purchase with this referral",
        });

        // Check if user is logged in
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Track the referral if user is logged in
          await trackReferralForUser(refCode, user.id);
        }
      }
    };

    trackReferral();
  }, [searchParams, toast]);

  const trackReferralForUser = async (refCode: string, userId: string) => {
    try {
      // Find the referrer by referral code
      const { data: referrerData, error: referrerError } = await supabase
        .from('referral_codes')
        .select('user_id')
        .eq('referral_code', refCode)
        .single();

      if (referrerError || !referrerData) {
        console.error('Invalid referral code');
        return;
      }

      // Don't allow self-referrals
      if (referrerData.user_id === userId) {
        return;
      }

      // Check if referral already exists
      const { data: existingReferral } = await supabase
        .from('referrals')
        .select('id')
        .eq('referrer_user_id', referrerData.user_id)
        .eq('referred_user_id', userId)
        .maybeSingle();

      if (existingReferral) {
        return; // Already tracked
      }

      // Create new referral record
      await supabase
        .from('referrals')
        .insert({
          referrer_user_id: referrerData.user_id,
          referred_user_id: userId,
        });

      // Update referrer's rewards
      const { data: currentRewards } = await supabase
        .from('referral_rewards')
        .select('total_referrals, discount_percentage')
        .eq('user_id', referrerData.user_id)
        .single();

      if (currentRewards) {
        const newTotalReferrals = currentRewards.total_referrals + 1;
        const newDiscount = Math.min(newTotalReferrals * 10, 50); // Cap at 50%

        await supabase
          .from('referral_rewards')
          .update({
            total_referrals: newTotalReferrals,
            discount_percentage: newDiscount,
          })
          .eq('user_id', referrerData.user_id);
      }
    } catch (error) {
      console.error('Error tracking referral:', error);
    }
  };

  return { trackReferralForUser };
};
