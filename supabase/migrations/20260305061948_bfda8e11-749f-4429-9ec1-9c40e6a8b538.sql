
-- Add suspect_in_game_name and suspect_fivem_id columns to case_files
ALTER TABLE public.case_files ADD COLUMN IF NOT EXISTS suspect_in_game_name text;
ALTER TABLE public.case_files ADD COLUMN IF NOT EXISTS suspect_fivem_id text;

-- Add witness_discord_username to witnesses
ALTER TABLE public.case_file_witnesses ADD COLUMN IF NOT EXISTS witness_discord_username text;

-- Create case_file_suspect_evidence table
CREATE TABLE IF NOT EXISTS public.case_file_suspect_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES public.case_files(id) ON DELETE CASCADE NOT NULL,
  evidence_type text NOT NULL DEFAULT 'screenshot',
  file_url text,
  file_name text,
  description text,
  uploaded_by text NOT NULL,
  uploaded_by_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.case_file_suspect_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage suspect evidence" ON public.case_file_suspect_evidence
  FOR ALL USING (
    public.is_owner(auth.uid()) OR EXISTS (
      SELECT 1 FROM public.staff_members 
      WHERE discord_id = public.get_user_discord_id() AND is_active = true
    )
  );

-- Create player_status_records table
CREATE TABLE IF NOT EXISTS public.player_status_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id text NOT NULL,
  discord_username text,
  discord_avatar text,
  total_cases integer DEFAULT 0,
  total_bans integer DEFAULT 0,
  total_warnings integer DEFAULT 0,
  last_case_date timestamptz,
  risk_level text DEFAULT 'low',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(discord_id)
);

ALTER TABLE public.player_status_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view player status" ON public.player_status_records
  FOR ALL USING (
    public.is_owner(auth.uid()) OR EXISTS (
      SELECT 1 FROM public.staff_members 
      WHERE discord_id = public.get_user_discord_id() AND is_active = true
    )
  );
