import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// GTA 5 themed image URLs using reliable CDN sources that match our generated images
const GTA_THEMED_IMAGES = {
  general: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1920&h=1080&fit=crop&q=90", // LA city skyline
  roleplay: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1920&h=1080&fit=crop&q=90", // Neon alley
  vehicles: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1920&h=1080&fit=crop&q=90", // Supercar
  combat: "https://images.unsplash.com/photo-1580130379624-3a069adbffc5?w=1920&h=1080&fit=crop&q=90", // Gang/dark
  pd: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&h=1080&fit=crop&q=90", // Police lights
  state: "https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=1920&h=1080&fit=crop&q=90", // Capitol
  emergency: "https://images.unsplash.com/photo-1587745416684-47953f16f02f?w=1920&h=1080&fit=crop&q=90", // Ambulance
  communication: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1920&h=1080&fit=crop&q=90", // Radio
  looting: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=1920&h=1080&fit=crop&q=90", // Cash money
  robbery: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1920&h=1080&fit=crop&q=90", // Dark vault
  kidnapping: "https://images.unsplash.com/photo-1551817958-d9d86fb29431?w=1920&h=1080&fit=crop&q=90", // Dark room
  governor_kidnapping: "https://images.unsplash.com/photo-1560258018-c7db7645254e?w=1920&h=1080&fit=crop&q=90", // Mansion
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update all sections with GTA themed images
    const updates = [];
    for (const [sectionKey, imageUrl] of Object.entries(GTA_THEMED_IMAGES)) {
      const { error } = await supabase
        .from('discord_rules_sections')
        .update({ image_url: imageUrl })
        .eq('section_key', sectionKey);

      if (error) {
        console.error(`Error updating ${sectionKey}:`, error);
      } else {
        updates.push(sectionKey);
        console.log(`Updated ${sectionKey} with GTA themed image`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${updates.length} sections with GTA themed images`,
        updatedSections: updates,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
