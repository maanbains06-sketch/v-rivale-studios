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
          description: "Get 20% off your purchase with this referral",
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

      // Generate unique promo code for the referred user
      const { data: promoCode } = await supabase.rpc('generate_promo_code');
      
      if (promoCode) {
        const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
        
        await supabase
          .from('promo_codes')
          .insert({
            code: promoCode,
            user_id: userId,
            discount_percentage: 20,
            expires_at: expiresAt,
          });

        // Send email notification with promo code
        try {
          const { data: { user: referredUser } } = await supabase.auth.getUser();
          
          if (referredUser?.email) {
            await supabase.functions.invoke('send-promo-code-email', {
              body: {
                userEmail: referredUser.email,
                userName: referredUser.user_metadata?.discord_username || '',
                promoCode: promoCode,
                discountPercentage: 20,
                expiresAt: expiresAt,
              },
            });
          }
        } catch (emailError) {
          console.error('Error sending promo code email:', emailError);
          // Don't fail the referral if email fails
        }
      }

      // Update referrer's rewards
      const { data: currentRewards } = await supabase
        .from('referral_rewards')
        .select('total_referrals, discount_percentage')
        .eq('user_id', referrerData.user_id)
        .single();

      if (currentRewards) {
        const newTotalReferrals = currentRewards.total_referrals + 1;
        const newDiscount = Math.min(newTotalReferrals * 20, 100); // 20% per referral, cap at 100%

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
