-- Create table for editable Discord rules sections
CREATE TABLE public.discord_rules_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  color INTEGER NOT NULL DEFAULT 16766720,
  image_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.discord_rules_sections ENABLE ROW LEVEL SECURITY;

-- Only owners can read/write rules
CREATE POLICY "Only owners can view rules" 
ON public.discord_rules_sections 
FOR SELECT 
USING (public.is_owner(auth.uid()));

CREATE POLICY "Only owners can insert rules" 
ON public.discord_rules_sections 
FOR INSERT 
WITH CHECK (public.is_owner(auth.uid()));

CREATE POLICY "Only owners can update rules" 
ON public.discord_rules_sections 
FOR UPDATE 
USING (public.is_owner(auth.uid()));

CREATE POLICY "Only owners can delete rules" 
ON public.discord_rules_sections 
FOR DELETE 
USING (public.is_owner(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_discord_rules_sections_updated_at
BEFORE UPDATE ON public.discord_rules_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default rules sections including PD and State Department
INSERT INTO public.discord_rules_sections (section_key, title, color, image_url, display_order, rules) VALUES
('general', '〘 📜 〙 **__GENERAL SERVER RULES__**', 16766720, 'https://images.unsplash.com/photo-1493711662062-fa541f7f3d24?w=800&q=80', 1, '[
  {"emoji": "🔸", "text": "***Respect all players and staff members at all times***"},
  {"emoji": "🔸", "text": "***No harassment, discrimination, or toxic behavior***"},
  {"emoji": "🔸", "text": "***English and Hindi are the primary languages in-game***"},
  {"emoji": "🔸", "text": "***No exploiting bugs or glitches - report them immediately***"},
  {"emoji": "🔸", "text": "***Follow staff instructions without argument***"},
  {"emoji": "🔸", "text": "***No advertising other servers or communities***"}
]'::jsonb),

('roleplay', '〘 🎭 〙 **__ROLEPLAY GUIDELINES__**', 10181046, 'https://images.unsplash.com/photo-1511882150382-421056c89033?w=800&q=80', 2, '[
  {"emoji": "🔹", "text": "***Stay in character at all times while in-game***"},
  {"emoji": "🔹", "text": "***Use /ooc for out-of-character communication***"},
  {"emoji": "🔹", "text": "***No metagaming - don''t use external information in RP***"},
  {"emoji": "🔹", "text": "***No powergaming - give others a chance to respond***"},
  {"emoji": "🔹", "text": "***Value your life (Fear RP) in dangerous situations***"},
  {"emoji": "🔹", "text": "***Create realistic and immersive storylines***"}
]'::jsonb),

('vehicles', '〘 🚗 〙 **__VEHICLE RULES__**', 3447003, 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80', 3, '[
  {"emoji": "🚙", "text": "***No VDM (Vehicle Deathmatch) under any circumstances***"},
  {"emoji": "🚙", "text": "***Follow traffic laws unless in an active RP scenario***"},
  {"emoji": "🚙", "text": "***No unrealistic driving through mountains or water***"},
  {"emoji": "🚙", "text": "***Park vehicles properly in designated areas***"},
  {"emoji": "🚙", "text": "***No combat logging to save your vehicle***"}
]'::jsonb),

('combat', '〘 ⚔️ 〙 **__COMBAT & CRIME RULES__**', 15158332, 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&q=80', 4, '[
  {"emoji": "⚡", "text": "***No RDM (Random Deathmatch) - always have valid RP reason***"},
  {"emoji": "⚡", "text": "***Initiate properly before any hostile action***"},
  {"emoji": "⚡", "text": "***Respect the New Life Rule (NLR) after death***"},
  {"emoji": "⚡", "text": "***No cop baiting or intentionally provoking police***"},
  {"emoji": "⚡", "text": "***Maximum 6 members in criminal activities***"},
  {"emoji": "⚡", "text": "***No combat logging during active situations***"}
]'::jsonb),

('pd', '〘 👮 〙 **__POLICE DEPARTMENT RULES__**', 255, 'https://images.unsplash.com/photo-1589578228447-e1a4e481c6c8?w=800&q=80', 5, '[
  {"emoji": "🚔", "text": "***Follow proper arrest and Miranda rights procedures***"},
  {"emoji": "🚔", "text": "***Use appropriate force levels based on situation***"},
  {"emoji": "🚔", "text": "***Maintain professionalism during all interactions***"},
  {"emoji": "🚔", "text": "***Follow chain of command and report to supervisors***"},
  {"emoji": "🚔", "text": "***Document all arrests and incidents properly***"},
  {"emoji": "🚔", "text": "***No corruption without High Command approval***"}
]'::jsonb),

('state', '〘 🏛️ 〙 **__STATE DEPARTMENT RULES__**', 7419530, 'https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=800&q=80', 6, '[
  {"emoji": "🏛️", "text": "***Represent the state professionally at all times***"},
  {"emoji": "🏛️", "text": "***Follow all government protocols and procedures***"},
  {"emoji": "🏛️", "text": "***Maintain neutrality in civilian disputes***"},
  {"emoji": "🏛️", "text": "***Coordinate with all emergency services***"},
  {"emoji": "🏛️", "text": "***Report directly to state leadership***"},
  {"emoji": "🏛️", "text": "***Enforce city regulations and policies***"}
]'::jsonb),

('emergency', '〘 🚑 〙 **__EMERGENCY SERVICES RULES__**', 3066993, 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&q=80', 7, '[
  {"emoji": "🚨", "text": "***EMS must remain neutral in all criminal activities***"},
  {"emoji": "🚨", "text": "***Police must follow proper arrest procedures***"},
  {"emoji": "🚨", "text": "***No corruption without proper RP development***"},
  {"emoji": "🚨", "text": "***Respond to calls professionally and in character***"},
  {"emoji": "🚨", "text": "***Follow chain of command within departments***"}
]'::jsonb),

('communication', '〘 💬 〙 **__COMMUNICATION RULES__**', 15965202, 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80', 8, '[
  {"emoji": "📢", "text": "***Use appropriate voice chat distance settings***"},
  {"emoji": "📢", "text": "***No earrape or playing music through mic***"},
  {"emoji": "📢", "text": "***Keep Discord communications professional***"},
  {"emoji": "📢", "text": "***No sharing personal information of others***"},
  {"emoji": "📢", "text": "***Use proper channels for support requests***"}
]'::jsonb);