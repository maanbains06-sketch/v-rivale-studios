
-- Case Files main table
CREATE TABLE public.case_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_ref TEXT NOT NULL UNIQUE,
  case_origin TEXT NOT NULL DEFAULT 'staff_observation',
  priority_impact TEXT NOT NULL DEFAULT 'medium',
  priority_urgency TEXT NOT NULL DEFAULT 'medium',
  severity TEXT NOT NULL DEFAULT 'minor',
  status TEXT NOT NULL DEFAULT 'open',
  suspect_discord_id TEXT,
  suspect_steam_id TEXT,
  suspect_name TEXT,
  suspect_hex_id TEXT,
  behavioral_tags TEXT[] DEFAULT '{}',
  rules_violated TEXT[] DEFAULT '{}',
  suggested_punishment TEXT,
  asset_freeze BOOLEAN DEFAULT false,
  created_by TEXT NOT NULL,
  created_by_user_id UUID,
  assigned_to TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  resolution_notes TEXT,
  resolution_letter_sent BOOLEAN DEFAULT false,
  locked BOOLEAN DEFAULT false,
  locked_by TEXT,
  locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Evidence locker
CREATE TABLE public.case_file_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.case_files(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL DEFAULT 'screenshot',
  file_url TEXT,
  file_name TEXT,
  description TEXT,
  timestamp_markers JSONB DEFAULT '[]',
  uploaded_by TEXT NOT NULL,
  uploaded_by_user_id UUID,
  upload_ip TEXT,
  media_date TIMESTAMPTZ,
  locked BOOLEAN DEFAULT false,
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Witness depositions
CREATE TABLE public.case_file_witnesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.case_files(id) ON DELETE CASCADE,
  access_code TEXT NOT NULL UNIQUE DEFAULT upper(substring(md5(random()::text) from 1 for 8)),
  witness_name TEXT,
  witness_discord_id TEXT,
  deposition TEXT,
  submitted_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Staff judicial chat / deliberation
CREATE TABLE public.case_file_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.case_files(id) ON DELETE CASCADE,
  author_discord_id TEXT NOT NULL,
  author_name TEXT,
  author_avatar TEXT,
  message TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'discussion',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Voting module
CREATE TABLE public.case_file_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.case_files(id) ON DELETE CASCADE,
  voter_discord_id TEXT NOT NULL,
  voter_name TEXT,
  voter_role_type TEXT NOT NULL DEFAULT 'moderator',
  vote TEXT NOT NULL,
  vote_weight INTEGER NOT NULL DEFAULT 1,
  is_veto BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(case_id, voter_discord_id)
);

-- Audit log (chain of custody)
CREATE TABLE public.case_file_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.case_files(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_description TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  performed_by_user_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  time_spent_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Statements for cross-linking
CREATE TABLE public.case_file_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.case_files(id) ON DELETE CASCADE,
  suspect_discord_id TEXT NOT NULL,
  statement TEXT NOT NULL,
  given_to TEXT NOT NULL,
  given_to_name TEXT,
  flagged_inconsistency BOOLEAN DEFAULT false,
  inconsistency_details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.case_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_file_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_file_witnesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_file_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_file_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_file_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_file_statements ENABLE ROW LEVEL SECURITY;

-- RLS: Staff and owner can do everything on case_files
CREATE POLICY "Staff can manage case files" ON public.case_files
  FOR ALL TO authenticated
  USING (
    public.is_owner() OR EXISTS (
      SELECT 1 FROM public.staff_members
      WHERE discord_id = public.get_user_discord_id() AND is_active = true
    )
  )
  WITH CHECK (
    public.is_owner() OR EXISTS (
      SELECT 1 FROM public.staff_members
      WHERE discord_id = public.get_user_discord_id() AND is_active = true
    )
  );

-- Same policy for child tables
CREATE POLICY "Staff can manage evidence" ON public.case_file_evidence
  FOR ALL TO authenticated
  USING (
    public.is_owner() OR EXISTS (
      SELECT 1 FROM public.staff_members
      WHERE discord_id = public.get_user_discord_id() AND is_active = true
    )
  )
  WITH CHECK (
    public.is_owner() OR EXISTS (
      SELECT 1 FROM public.staff_members
      WHERE discord_id = public.get_user_discord_id() AND is_active = true
    )
  );

CREATE POLICY "Staff can manage witnesses" ON public.case_file_witnesses
  FOR ALL TO authenticated
  USING (
    public.is_owner() OR EXISTS (
      SELECT 1 FROM public.staff_members
      WHERE discord_id = public.get_user_discord_id() AND is_active = true
    )
  )
  WITH CHECK (
    public.is_owner() OR EXISTS (
      SELECT 1 FROM public.staff_members
      WHERE discord_id = public.get_user_discord_id() AND is_active = true
    )
  );

CREATE POLICY "Staff can manage notes" ON public.case_file_notes
  FOR ALL TO authenticated
  USING (
    public.is_owner() OR EXISTS (
      SELECT 1 FROM public.staff_members
      WHERE discord_id = public.get_user_discord_id() AND is_active = true
    )
  )
  WITH CHECK (
    public.is_owner() OR EXISTS (
      SELECT 1 FROM public.staff_members
      WHERE discord_id = public.get_user_discord_id() AND is_active = true
    )
  );

CREATE POLICY "Staff can manage votes" ON public.case_file_votes
  FOR ALL TO authenticated
  USING (
    public.is_owner() OR EXISTS (
      SELECT 1 FROM public.staff_members
      WHERE discord_id = public.get_user_discord_id() AND is_active = true
    )
  )
  WITH CHECK (
    public.is_owner() OR EXISTS (
      SELECT 1 FROM public.staff_members
      WHERE discord_id = public.get_user_discord_id() AND is_active = true
    )
  );

CREATE POLICY "Staff can manage audit log" ON public.case_file_audit_log
  FOR ALL TO authenticated
  USING (
    public.is_owner() OR EXISTS (
      SELECT 1 FROM public.staff_members
      WHERE discord_id = public.get_user_discord_id() AND is_active = true
    )
  )
  WITH CHECK (
    public.is_owner() OR EXISTS (
      SELECT 1 FROM public.staff_members
      WHERE discord_id = public.get_user_discord_id() AND is_active = true
    )
  );

CREATE POLICY "Staff can manage statements" ON public.case_file_statements
  FOR ALL TO authenticated
  USING (
    public.is_owner() OR EXISTS (
      SELECT 1 FROM public.staff_members
      WHERE discord_id = public.get_user_discord_id() AND is_active = true
    )
  )
  WITH CHECK (
    public.is_owner() OR EXISTS (
      SELECT 1 FROM public.staff_members
      WHERE discord_id = public.get_user_discord_id() AND is_active = true
    )
  );

-- Witnesses can submit depositions via access code (public read on witnesses for access code validation)
CREATE POLICY "Anyone can read witness by access code" ON public.case_file_witnesses
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "Anyone can update witness deposition" ON public.case_file_witnesses
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

-- Enable realtime for case file notes (judicial chat)
ALTER PUBLICATION supabase_realtime ADD TABLE public.case_file_notes;

-- Generate case reference IDs
CREATE OR REPLACE FUNCTION public.generate_case_ref()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_ref TEXT;
  year_str TEXT;
  seq_num INTEGER;
BEGIN
  year_str := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(
    CASE WHEN case_ref ~ ('^SL-' || year_str || '-[A-Z0-9]+$')
    THEN substring(case_ref from length('SL-' || year_str || '-') + 1)::integer
    ELSE 0 END
  ), 0) + 1 INTO seq_num
  FROM public.case_files;
  new_ref := 'SL-' || year_str || '-' || lpad(seq_num::text, 3, '0');
  RETURN new_ref;
END;
$$;

-- Auto-generate case_ref on insert
CREATE OR REPLACE FUNCTION public.auto_set_case_ref()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.case_ref IS NULL OR NEW.case_ref = '' THEN
    NEW.case_ref := generate_case_ref();
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_case_file_ref
  BEFORE INSERT ON public.case_files
  FOR EACH ROW EXECUTE FUNCTION public.auto_set_case_ref();

-- Updated_at trigger
CREATE TRIGGER trg_case_file_updated
  BEFORE UPDATE ON public.case_files
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
