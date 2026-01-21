-- Fix "Failed to close application" by ensuring non-whitelist application tables have review metadata columns
-- Tables present in this project: job_applications, pdm_applications, creator_applications, firefighter_applications, weazel_news_applications, staff_applications, ban_appeals

ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

ALTER TABLE public.pdm_applications
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

ALTER TABLE public.creator_applications
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

ALTER TABLE public.firefighter_applications
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

ALTER TABLE public.weazel_news_applications
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

ALTER TABLE public.staff_applications
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

ALTER TABLE public.ban_appeals
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_job_applications_reviewed_by ON public.job_applications (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_pdm_applications_reviewed_by ON public.pdm_applications (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_creator_applications_reviewed_by ON public.creator_applications (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_firefighter_applications_reviewed_by ON public.firefighter_applications (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_weazel_news_applications_reviewed_by ON public.weazel_news_applications (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_staff_applications_reviewed_by ON public.staff_applications (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_ban_appeals_reviewed_by ON public.ban_appeals (reviewed_by);