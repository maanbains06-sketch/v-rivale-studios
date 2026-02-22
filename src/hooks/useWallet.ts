import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WalletData {
  balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
}

interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_claim_date: string | null;
  monthly_claims: number;
}

interface SeasonalBalance {
  id: string;
  balance: number;
  currency_id: string;
  seasonal_currencies: {
    name: string;
    slug: string;
    icon: string;
    multiplier: number;
    is_active: boolean;
  };
}

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  source: string;
  description: string;
  created_at: string;
}

export const useWallet = () => {
  const { toast } = useToast();
  const [wallet, setWallet] = useState<WalletData>({ balance: 0, lifetime_earned: 0, lifetime_spent: 0 });
  const [streak, setStreak] = useState<StreakData>({ current_streak: 0, longest_streak: 0, last_claim_date: null, monthly_claims: 0 });
  const [dailyEarned, setDailyEarned] = useState(0);
  const [dailyCap, setDailyCap] = useState(250);
  const [seasonalBalances, setSeasonalBalances] = useState<SeasonalBalance[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [canClaimDaily, setCanClaimDaily] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchWallet = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('token-economy', {
        body: { action: 'get_wallet' }
      });
      if (error) throw error;
      if (data) {
        setWallet(data.wallet);
        setStreak(data.streak);
        setDailyEarned(data.dailyEarned);
        setDailyCap(data.dailyCap);
        setSeasonalBalances(data.seasonalBalances || []);
        setRecentTransactions(data.recentTransactions || []);
        setCanClaimDaily(data.canClaimDaily);
      }
    } catch (e) {
      console.error('Failed to fetch wallet:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
    // Realtime wallet updates
    const channel = supabase
      .channel('wallet-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_wallets' }, () => fetchWallet())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchWallet]);

  const claimDaily = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('token-economy', {
      body: { action: 'claim_daily' }
    });
    if (error || data?.error) {
      toast({ title: "Cannot claim", description: data?.error || "Failed to claim daily reward", variant: "destructive" });
      return false;
    }
    toast({ title: `+${data.reward} SLRP Tokens!`, description: `Day ${data.streak} streak! Balance: ${data.newBalance}` });
    await fetchWallet();
    return true;
  }, [toast, fetchWallet]);

  const purchaseItem = useCallback(async (itemId: string) => {
    const { data, error } = await supabase.functions.invoke('token-economy', {
      body: { action: 'purchase_item', itemId }
    });
    if (error || data?.error) {
      toast({ title: "Purchase failed", description: data?.error || "Failed to purchase item", variant: "destructive" });
      return false;
    }
    toast({ title: "Item Purchased!", description: `${data.item} - Balance: ${data.newBalance}` });
    await fetchWallet();
    return true;
  }, [toast, fetchWallet]);

  const equipItem = useCallback(async (itemId: string, category: string) => {
    const { data, error } = await supabase.functions.invoke('token-economy', {
      body: { action: 'equip_item', itemId, category }
    });
    if (error || data?.error) {
      toast({ title: "Equip failed", description: data?.error || "Failed to equip", variant: "destructive" });
      return false;
    }
    toast({ title: "Item Equipped!" });
    return true;
  }, [toast]);

  const transferTokens = useCallback(async (receiverDiscordId: string, amount: number) => {
    const { data, error } = await supabase.functions.invoke('token-economy', {
      body: { action: 'transfer', receiverDiscordId, amount }
    });
    if (error || data?.error) {
      toast({ title: "Transfer failed", description: data?.error || "Failed to transfer", variant: "destructive" });
      return false;
    }
    toast({ title: "Transfer Successful!", description: `Sent ${data.sent} to ${data.receiver} (Tax: ${data.tax})` });
    await fetchWallet();
    return true;
  }, [toast, fetchWallet]);

  const convertSeasonal = useCallback(async (currencyId: string, amount: number) => {
    const { data, error } = await supabase.functions.invoke('token-economy', {
      body: { action: 'convert_seasonal', currencyId, amount }
    });
    if (error || data?.error) {
      toast({ title: "Conversion failed", description: data?.error || "Failed to convert", variant: "destructive" });
      return false;
    }
    toast({ title: "Converted!", description: `${data.converted} seasonal tokens → SLRP Tokens` });
    await fetchWallet();
    return true;
  }, [toast, fetchWallet]);

  return {
    wallet, streak, dailyEarned, dailyCap, seasonalBalances, recentTransactions,
    canClaimDaily, loading, fetchWallet, claimDaily, purchaseItem, equipItem,
    transferTokens, convertSeasonal
  };
};
