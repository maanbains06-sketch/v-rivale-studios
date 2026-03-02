
-- Create staff_contracts table for Staff & Administrator Agreements
CREATE TABLE public.staff_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_name TEXT NOT NULL,
  staff_email TEXT,
  staff_discord_id TEXT,
  staff_role TEXT,
  contract_data JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  valid_from TEXT,
  valid_until TEXT,
  owner_signature TEXT,
  owner_signed_at TIMESTAMPTZ,
  staff_signature TEXT,
  staff_signed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff_contracts ENABLE ROW LEVEL SECURITY;

-- Owner can do everything
CREATE POLICY "Owner full access to staff_contracts"
  ON public.staff_contracts FOR ALL
  USING (public.is_owner(auth.uid()));

-- Staff can view their own contracts (matched by discord_id)
CREATE POLICY "Staff can view own contracts"
  ON public.staff_contracts FOR SELECT
  USING (staff_discord_id = public.get_user_discord_id());

-- Trigger for updated_at
CREATE TRIGGER update_staff_contracts_updated_at
  BEFORE UPDATE ON public.staff_contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
