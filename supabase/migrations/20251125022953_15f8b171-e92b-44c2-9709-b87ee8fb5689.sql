-- Create staff training modules table
CREATE TABLE public.staff_training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  module_type TEXT NOT NULL CHECK (module_type IN ('video', 'document', 'quiz', 'interactive')),
  duration_minutes INTEGER,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create staff onboarding checklist table
CREATE TABLE public.staff_onboarding_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('setup', 'training', 'documentation', 'team', 'tools')),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create staff training progress table
CREATE TABLE public.staff_training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.staff_training_modules(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  score INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(staff_user_id, module_id)
);

-- Create staff onboarding progress table
CREATE TABLE public.staff_onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checklist_item_id UUID NOT NULL REFERENCES public.staff_onboarding_checklist(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(staff_user_id, checklist_item_id)
);

-- Enable RLS
ALTER TABLE public.staff_training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_onboarding_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_onboarding_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for training modules
CREATE POLICY "Staff can view training modules"
  ON public.staff_training_modules
  FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins can manage training modules"
  ON public.staff_training_modules
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for onboarding checklist
CREATE POLICY "Staff can view onboarding checklist"
  ON public.staff_onboarding_checklist
  FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins can manage onboarding checklist"
  ON public.staff_onboarding_checklist
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for training progress
CREATE POLICY "Staff can view own training progress"
  ON public.staff_training_progress
  FOR SELECT
  USING (auth.uid() = staff_user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can update own training progress"
  ON public.staff_training_progress
  FOR ALL
  USING (auth.uid() = staff_user_id OR has_role(auth.uid(), 'admin'));

-- RLS Policies for onboarding progress
CREATE POLICY "Staff can view own onboarding progress"
  ON public.staff_onboarding_progress
  FOR SELECT
  USING (auth.uid() = staff_user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can update own onboarding progress"
  ON public.staff_onboarding_progress
  FOR ALL
  USING (auth.uid() = staff_user_id OR has_role(auth.uid(), 'admin'));

-- Insert sample training modules
INSERT INTO public.staff_training_modules (title, description, content, module_type, duration_minutes, display_order, is_required) VALUES
('Welcome to SLRP', 'Introduction to our server and community guidelines', '# Welcome to SLRP\n\nWelcome to our staff team! This module will introduce you to our server culture, values, and expectations.\n\n## Our Mission\nTo create the most immersive and enjoyable roleplay experience.\n\n## Core Values\n- Respect\n- Professionalism\n- Community First\n- Continuous Improvement', 'document', 15, 1, true),
('Server Rules & Policies', 'Understanding our server rules and enforcement policies', '# Server Rules & Policies\n\nAs a staff member, you must thoroughly understand all server rules and policies.\n\n## Key Areas\n1. Roleplay Rules\n2. Community Standards\n3. Enforcement Guidelines\n4. Appeal Process', 'document', 30, 2, true),
('Staff Tools & Commands', 'Learn how to use staff tools and admin commands', '# Staff Tools & Commands\n\nThis module covers all the tools and commands you''ll use as a staff member.\n\n## Essential Commands\n- Player management\n- Vehicle spawning\n- Teleportation\n- Moderation tools', 'interactive', 45, 3, true),
('Conflict Resolution', 'Best practices for handling player disputes and conflicts', '# Conflict Resolution\n\nLearn how to effectively mediate player disputes and maintain server harmony.\n\n## Key Principles\n1. Stay neutral\n2. Listen actively\n3. Document everything\n4. Escalate when needed', 'video', 25, 4, true);

-- Insert sample onboarding checklist items
INSERT INTO public.staff_onboarding_checklist (title, description, category, display_order, is_required) VALUES
('Discord Server Access', 'Join the staff Discord server and verify your role', 'setup', 1, true),
('Read Staff Handbook', 'Review the complete staff handbook and guidelines', 'documentation', 2, true),
('Complete Training Modules', 'Finish all required training modules', 'training', 3, true),
('Setup Staff Tools', 'Install and configure necessary staff tools and plugins', 'tools', 4, true),
('Meet the Team', 'Introduction meeting with leadership and other staff', 'team', 5, true),
('Shadow a Senior Staff', 'Observe an experienced staff member handling tickets', 'training', 6, true),
('First Supervised Session', 'Handle your first tickets with senior staff supervision', 'training', 7, true),
('Receive Staff Credentials', 'Get your in-game admin permissions activated', 'setup', 8, true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_training_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_staff_training_modules_updated_at
  BEFORE UPDATE ON public.staff_training_modules
  FOR EACH ROW
  EXECUTE FUNCTION update_training_updated_at();

CREATE TRIGGER update_staff_training_progress_updated_at
  BEFORE UPDATE ON public.staff_training_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_training_updated_at();

CREATE TRIGGER update_staff_onboarding_progress_updated_at
  BEFORE UPDATE ON public.staff_onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_training_updated_at();