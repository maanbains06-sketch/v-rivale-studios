-- Create table to store automatically detected server updates
CREATE TABLE public.server_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  update_type TEXT NOT NULL DEFAULT 'resource', -- 'resource', 'config', 'script'
  resource_name TEXT,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table to store the last known resources list
CREATE TABLE public.server_resource_snapshot (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resources TEXT[] NOT NULL DEFAULT '{}',
  resource_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.server_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_resource_snapshot ENABLE ROW LEVEL SECURITY;

-- Anyone can view server updates (public info)
CREATE POLICY "Anyone can view server updates" 
ON public.server_updates 
FOR SELECT 
USING (true);

-- Service role can manage server updates
CREATE POLICY "Service role can manage server updates" 
ON public.server_updates 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Anyone can view resource snapshot
CREATE POLICY "Anyone can view resource snapshot" 
ON public.server_resource_snapshot 
FOR SELECT 
USING (true);

-- Service role can manage resource snapshot
CREATE POLICY "Service role can manage resource snapshot" 
ON public.server_resource_snapshot 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Insert initial snapshot record
INSERT INTO public.server_resource_snapshot (resources, resource_count) VALUES ('{}', 0);