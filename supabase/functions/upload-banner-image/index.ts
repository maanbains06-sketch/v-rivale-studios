import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Parse the request body for base64 image
    const { imageBase64, fileName } = await req.json();
    
    if (!imageBase64) {
      throw new Error('No image data provided');
    }

    // Decode base64 to bytes
    const imageBytes = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));
    
    const finalFileName = fileName || `skylife-banner-${Date.now()}.jpg`;

    // Upload to storage
    const { data, error } = await supabase.storage
      .from('discord-assets')
      .upload(finalFileName, imageBytes, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('discord-assets')
      .getPublicUrl(finalFileName);

    const publicUrl = urlData.publicUrl;
    console.log('Image uploaded successfully:', publicUrl);

    // Update all discord_rules_sections with the new image
    const { error: updateError } = await supabase
      .from('discord_rules_sections')
      .update({ image_url: publicUrl })
      .neq('section_key', 'placeholder');

    if (updateError) {
      console.error('Error updating sections:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Banner image uploaded and sections updated',
        publicUrl,
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
