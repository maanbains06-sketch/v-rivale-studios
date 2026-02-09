
-- Alt Account Detection table
CREATE TABLE public.alt_account_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_user_id UUID NOT NULL,
  alt_user_id UUID NOT NULL,
  detection_type TEXT NOT NULL, -- 'ip_match', 'fingerprint_match', 'behavior_pattern'
  confidence_score INTEGER NOT NULL DEFAULT 0, -- 0-100
  ip_address TEXT,
  fingerprint_hash TEXT,
  details JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'flagged', -- 'flagged', 'confirmed', 'dismissed'
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  discord_alert_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Website Bans table (synced with FiveM permanent bans)
CREATE TABLE public.website_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  discord_id TEXT,
  discord_username TEXT,
  steam_id TEXT,
  fivem_id TEXT,
  ban_reason TEXT NOT NULL,
  ban_source TEXT NOT NULL DEFAULT 'fivem', -- 'fivem', 'website', 'alt_detection'
  is_permanent BOOLEAN NOT NULL DEFAULT true,
  fingerprint_hashes TEXT[] DEFAULT '{}',
  ip_addresses TEXT[] DEFAULT '{}',
  banned_by TEXT,
  unbanned_by UUID,
  unbanned_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  fivem_ban_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Device fingerprints for blocking
CREATE TABLE public.device_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  fingerprint_hash TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  screen_resolution TEXT,
  timezone TEXT,
  language TEXT,
  platform TEXT,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Login IP tracking for alt detection
CREATE TABLE public.login_ip_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ip_address TEXT NOT NULL,
  fingerprint_hash TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alt_account_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_ip_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins/owners can view detection data
CREATE POLICY "Staff can view alt detections" ON public.alt_account_detections
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can update alt detections" ON public.alt_account_detections
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert alt detections" ON public.alt_account_detections
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Website bans: admins can manage, service role can insert
CREATE POLICY "Staff can view website bans" ON public.website_bans
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can manage website bans" ON public.website_bans
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anon can check own ban" ON public.website_bans
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "Auth users can check bans" ON public.website_bans
  FOR SELECT TO authenticated
  USING (true);

-- Device fingerprints: insert allowed for tracking, select for admins
CREATE POLICY "Anyone can insert fingerprints" ON public.device_fingerprints
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff can view fingerprints" ON public.device_fingerprints
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can update fingerprints" ON public.device_fingerprints
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Login IP log: insert for all auth, select for admins
CREATE POLICY "Auth users can log IPs" ON public.login_ip_log
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can view IP logs" ON public.login_ip_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for bans (to enforce in real-time)
ALTER PUBLICATION supabase_realtime ADD TABLE public.website_bans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alt_account_detections;

-- Indexes for performance
CREATE INDEX idx_alt_detections_primary ON public.alt_account_detections(primary_user_id);
CREATE INDEX idx_alt_detections_alt ON public.alt_account_detections(alt_user_id);
CREATE INDEX idx_alt_detections_status ON public.alt_account_detections(status);
CREATE INDEX idx_website_bans_active ON public.website_bans(is_active) WHERE is_active = true;
CREATE INDEX idx_website_bans_discord ON public.website_bans(discord_id);
CREATE INDEX idx_website_bans_steam ON public.website_bans(steam_id);
CREATE INDEX idx_device_fingerprints_hash ON public.device_fingerprints(fingerprint_hash);
CREATE INDEX idx_device_fingerprints_blocked ON public.device_fingerprints(is_blocked) WHERE is_blocked = true;
CREATE INDEX idx_login_ip_log_user ON public.login_ip_log(user_id);
CREATE INDEX idx_login_ip_log_ip ON public.login_ip_log(ip_address);
