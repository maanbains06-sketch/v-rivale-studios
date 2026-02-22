
-- SLRP Token Economy System

-- 1. User Wallets
CREATE TABLE public.user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0,
  lifetime_earned INTEGER NOT NULL DEFAULT 0,
  lifetime_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet" ON public.user_wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owner can view all wallets" ON public.user_wallets FOR SELECT USING (public.is_owner(auth.uid()));

-- 2. Token Transactions (full history)
CREATE TABLE public.token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL, -- 'earn', 'spend', 'transfer_in', 'transfer_out', 'seasonal_convert'
  source TEXT NOT NULL, -- 'daily_login', 'streak_bonus', 'mini_game', 'gallery_approved', 'purchase', 'transfer', etc.
  description TEXT,
  reference_id UUID, -- optional link to item/game/etc
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.token_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.token_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner can view all transactions" ON public.token_transactions FOR SELECT USING (public.is_owner(auth.uid()));

-- 3. Daily Login Streaks
CREATE TABLE public.daily_login_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_claim_date DATE,
  monthly_claims INTEGER NOT NULL DEFAULT 0,
  monthly_reset_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_login_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streak" ON public.daily_login_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own streak" ON public.daily_login_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own streak" ON public.daily_login_streaks FOR UPDATE USING (auth.uid() = user_id);

-- 4. Daily Earning Caps (anti-abuse)
CREATE TABLE public.daily_earning_caps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  earn_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, earn_date)
);

ALTER TABLE public.daily_earning_caps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own caps" ON public.daily_earning_caps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own caps" ON public.daily_earning_caps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own caps" ON public.daily_earning_caps FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owner can view all caps" ON public.daily_earning_caps FOR SELECT USING (public.is_owner(auth.uid()));

-- 5. Seasonal Currencies (owner-activated)
CREATE TABLE public.seasonal_currencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT, -- emoji or icon name
  multiplier NUMERIC NOT NULL DEFAULT 3,
  is_active BOOLEAN NOT NULL DEFAULT false,
  activated_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seasonal_currencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view seasonal currencies" ON public.seasonal_currencies FOR SELECT USING (true);
CREATE POLICY "Owner can manage seasonal currencies" ON public.seasonal_currencies FOR ALL USING (public.is_owner(auth.uid()));

-- 6. User Seasonal Balances
CREATE TABLE public.user_seasonal_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency_id UUID NOT NULL REFERENCES public.seasonal_currencies(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, currency_id)
);

ALTER TABLE public.user_seasonal_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own seasonal balance" ON public.user_seasonal_balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own seasonal balance" ON public.user_seasonal_balances FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own seasonal balance" ON public.user_seasonal_balances FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owner can view all seasonal balances" ON public.user_seasonal_balances FOR SELECT USING (public.is_owner(auth.uid()));

-- 7. Profile Customization Items (owner managed shop)
CREATE TABLE public.shop_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'username_style', 'badge', 'profile_frame', 'bio_effect', 'limited', 'elite'
  item_type TEXT NOT NULL, -- 'color', 'badge', 'frame', 'effect', 'animated_badge'
  item_data JSONB NOT NULL DEFAULT '{}', -- stores color hex, animation config, image url, etc
  price INTEGER NOT NULL DEFAULT 500,
  is_limited BOOLEAN NOT NULL DEFAULT false,
  max_quantity INTEGER, -- null = unlimited
  sold_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active shop items" ON public.shop_items FOR SELECT USING (is_active = true);
CREATE POLICY "Owner can manage shop items" ON public.shop_items FOR ALL USING (public.is_owner(auth.uid()));

-- 8. User Purchased Items
CREATE TABLE public.user_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
  is_equipped BOOLEAN NOT NULL DEFAULT false,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id)
);

ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inventory" ON public.user_inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own inventory" ON public.user_inventory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own inventory" ON public.user_inventory FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view equipped items" ON public.user_inventory FOR SELECT USING (is_equipped = true);

-- 9. User Profile Customization (equipped items snapshot)
CREATE TABLE public.user_profile_customization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  username_color TEXT, -- hex color
  equipped_badge_id UUID REFERENCES public.shop_items(id),
  equipped_frame_id UUID REFERENCES public.shop_items(id),
  equipped_bio_effect TEXT,
  custom_bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profile_customization ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profile customization" ON public.user_profile_customization FOR SELECT USING (true);
CREATE POLICY "Users can upsert own customization" ON public.user_profile_customization FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own customization" ON public.user_profile_customization FOR UPDATE USING (auth.uid() = user_id);

-- 10. Token Transfers (with tax)
CREATE TABLE public.token_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  tax_amount INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.token_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transfers" ON public.token_transfers FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can create transfers" ON public.token_transfers FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Owner can view all transfers" ON public.token_transfers FOR SELECT USING (public.is_owner(auth.uid()));

-- Auto-create wallet on signup
CREATE OR REPLACE FUNCTION public.create_wallet_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_wallets (user_id, balance) VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.daily_login_streaks (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_wallet
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_wallet_for_new_user();

-- Seed default seasonal currencies
INSERT INTO public.seasonal_currencies (name, slug, icon, multiplier, is_active) VALUES
  ('Halloween Coins', 'halloween', '🎃', 3, false),
  ('Winter Credits', 'winter', '❄️', 3, false),
  ('Anniversary Tokens', 'anniversary', '🎉', 3, false);

-- Add updated_at triggers
CREATE TRIGGER update_user_wallets_updated_at BEFORE UPDATE ON public.user_wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_daily_login_streaks_updated_at BEFORE UPDATE ON public.daily_login_streaks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_daily_earning_caps_updated_at BEFORE UPDATE ON public.daily_earning_caps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_seasonal_currencies_updated_at BEFORE UPDATE ON public.seasonal_currencies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_seasonal_balances_updated_at BEFORE UPDATE ON public.user_seasonal_balances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shop_items_updated_at BEFORE UPDATE ON public.shop_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_profile_customization_updated_at BEFORE UPDATE ON public.user_profile_customization FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for wallets and transactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.token_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.seasonal_currencies;
