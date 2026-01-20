import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface YouTubeChannelStatus {
  channelId: string;
  isLive: boolean;
  liveStreamUrl?: string;
  viewerCount?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all featured youtubers
    const { data: youtubers, error: fetchError } = await supabase
      .from('featured_youtubers')
      .select('id, channel_url, is_live')
      .eq('is_active', true);

    if (fetchError) throw fetchError;

    if (!youtubers || youtubers.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active youtubers to check", updated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { id: string; isLive: boolean; error?: string }[] = [];

    for (const youtuber of youtubers) {
      try {
        // Fetch the YouTube channel page to check live status
        const response = await fetch(youtuber.channel_url + '/live', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          redirect: 'follow',
        });

        const html = await response.text();
        
        // Check if the page indicates a live stream
        // YouTube live pages have specific markers
        const isLive = html.includes('"isLive":true') || 
                       html.includes('"isLiveNow":true') ||
                       html.includes('{"isLiveContent":true}') ||
                       (html.includes('/watch?v=') && html.includes('"isLive"'));

        // Extract live stream URL if live
        let liveStreamUrl: string | null = null;
        if (isLive) {
          const watchMatch = html.match(/\/watch\?v=([a-zA-Z0-9_-]+)/);
          if (watchMatch) {
            liveStreamUrl = `https://www.youtube.com/watch?v=${watchMatch[1]}`;
          }
        }

        // Update the database if status changed
        if (youtuber.is_live !== isLive) {
          const { error: updateError } = await supabase
            .from('featured_youtubers')
            .update({ 
              is_live: isLive,
              live_stream_url: liveStreamUrl,
              updated_at: new Date().toISOString()
            })
            .eq('id', youtuber.id);

          if (updateError) {
            results.push({ id: youtuber.id, isLive, error: updateError.message });
          } else {
            results.push({ id: youtuber.id, isLive });
          }
        } else {
          results.push({ id: youtuber.id, isLive });
        }
      } catch (checkError: any) {
        console.error(`Error checking ${youtuber.channel_url}:`, checkError);
        results.push({ id: youtuber.id, isLive: false, error: checkError.message });
      }
    }

    const updatedCount = results.filter(r => !r.error).length;

    return new Response(
      JSON.stringify({ 
        message: `Checked ${youtubers.length} channels`, 
        results,
        updated: updatedCount 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error syncing YouTube live status:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
