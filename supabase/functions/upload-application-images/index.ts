import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const IMAGES_TO_UPLOAD = [
  { name: 'pd-approved.jpg', sourcePath: 'public/images/applications/pd-approved.jpg' },
  { name: 'pd-rejected.jpg', sourcePath: 'public/images/applications/pd-rejected.jpg' },
  { name: 'ems-approved.jpg', sourcePath: 'public/images/applications/ems-approved.jpg' },
  { name: 'ems-rejected.jpg', sourcePath: 'public/images/applications/ems-rejected.jpg' },
  { name: 'mechanic-approved.jpg', sourcePath: 'public/images/applications/mechanic-approved.jpg' },
  { name: 'mechanic-rejected.jpg', sourcePath: 'public/images/applications/mechanic-rejected.jpg' },
  { name: 'doj-judge-approved.jpg', sourcePath: 'public/images/applications/doj-judge-approved.jpg' },
  { name: 'doj-judge-rejected.jpg', sourcePath: 'public/images/applications/doj-judge-rejected.jpg' },
  { name: 'doj-attorney-approved.jpg', sourcePath: 'public/images/applications/doj-attorney-approved.jpg' },
  { name: 'doj-attorney-rejected.jpg', sourcePath: 'public/images/applications/doj-attorney-rejected.jpg' },
  { name: 'state-approved.jpg', sourcePath: 'public/images/applications/state-approved.jpg' },
  { name: 'state-rejected.jpg', sourcePath: 'public/images/applications/state-rejected.jpg' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const results: { name: string; success: boolean; url?: string; error?: string }[] = [];
    
    // Source URLs - try multiple sources
    const sources = [
      'https://roleplay-horizon.lovable.app/images/applications',
      'https://skyliferoleplay.com/images/applications',
    ];
    
    for (const image of IMAGES_TO_UPLOAD) {
      let uploaded = false;
      let lastError = '';
      
      for (const baseUrl of sources) {
        try {
          const imageUrl = `${baseUrl}/${image.name}`;
          console.log(`Trying to fetch ${image.name} from ${imageUrl}...`);
          
          const response = await fetch(imageUrl);
          
          if (!response.ok) {
            lastError = `HTTP ${response.status} from ${baseUrl}`;
            continue;
          }
          
          const contentType = response.headers.get('content-type');
          if (!contentType?.includes('image')) {
            lastError = `Not an image (${contentType}) from ${baseUrl}`;
            continue;
          }
          
          const imageData = await response.arrayBuffer();
          
          // Upload to Supabase Storage
          const { data, error } = await supabase.storage
            .from('discord-assets')
            .upload(`applications/${image.name}`, imageData, {
              contentType: 'image/jpeg',
              upsert: true
            });
          
          if (error) {
            lastError = error.message;
            continue;
          }
          
          const { data: urlData } = supabase.storage
            .from('discord-assets')
            .getPublicUrl(`applications/${image.name}`);
          
          results.push({
            name: image.name,
            success: true,
            url: urlData.publicUrl
          });
          
          console.log(`✅ Uploaded ${image.name} to ${urlData.publicUrl}`);
          uploaded = true;
          break;
          
        } catch (error) {
          lastError = error instanceof Error ? error.message : 'Unknown error';
        }
      }
      
      if (!uploaded) {
        results.push({
          name: image.name,
          success: false,
          error: lastError
        });
        console.error(`❌ Failed to upload ${image.name}: ${lastError}`);
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`\n📊 Uploaded ${successCount}/${IMAGES_TO_UPLOAD.length} images`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        summary: {
          total: IMAGES_TO_UPLOAD.length,
          uploaded: successCount,
          failed: IMAGES_TO_UPLOAD.length - successCount
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error uploading images:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
