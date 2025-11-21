-- Create staff members table
CREATE TABLE public.staff_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  discord_id TEXT NOT NULL UNIQUE,
  discord_username TEXT,
  discord_avatar TEXT,
  email TEXT,
  steam_id TEXT,
  role TEXT NOT NULL,
  role_type TEXT NOT NULL CHECK (role_type IN ('owner', 'admin', 'moderator', 'developer', 'staff', 'event_manager')),
  department TEXT NOT NULL CHECK (department IN ('leadership', 'administration', 'moderation', 'development', 'support', 'events')),
  bio TEXT,
  responsibilities TEXT[],
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;

-- Public can view active staff members
CREATE POLICY "Anyone can view active staff members"
ON public.staff_members
FOR SELECT
USING (is_active = true);

-- Admins can view all staff members
CREATE POLICY "Admins can view all staff members"
ON public.staff_members
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can insert staff members
CREATE POLICY "Admins can insert staff members"
ON public.staff_members
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Admins can update staff members
CREATE POLICY "Admins can update staff members"
ON public.staff_members
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Admins can delete staff members
CREATE POLICY "Admins can delete staff members"
ON public.staff_members
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_staff_members_updated_at
BEFORE UPDATE ON public.staff_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();