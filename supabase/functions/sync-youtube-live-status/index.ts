import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
      .select('id, channel_url, is_live, name')
      .eq('is_active', true);

    if (fetchError) throw fetchError;

    if (!youtubers || youtubers.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active youtubers to check", updated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Checking ${youtubers.length} channels for live status`);

    const results: { id: string; name: string; isLive: boolean; liveUrl?: string; detectedBy?: string; error?: string }[] = [];

    for (const youtuber of youtubers) {
      try {
        // Clean the channel URL - remove query params
        let channelUrl = youtuber.channel_url.split('?')[0];
        if (!channelUrl.endsWith('/live')) {
          channelUrl = channelUrl.replace(/\/$/, '') + '/live';
        }

        console.log(`Checking: ${youtuber.name} at ${channelUrl}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(channelUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
          redirect: 'follow',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const html = await response.text();
        const finalUrl = response.url;
        
        console.log(`Response URL for ${youtuber.name}: ${finalUrl}`);

        let isLive = false;
        let liveStreamUrl: string | null = null;
        let detectedBy = '';

        // Extract video ID if redirected to watch page
        const videoIdMatch = finalUrl.match(/[?&]v=([a-zA-Z0-9_-]+)/) || 
                            html.match(/video-id="([a-zA-Z0-9_-]+)"/) ||
                            html.match(/"videoId":"([a-zA-Z0-9_-]+)"/);
        
        const videoId = videoIdMatch?.[1];
        
        if (videoId) {
          console.log(`Found video ID: ${videoId} for ${youtuber.name}`);
          
          // Detection Method 1: HTML attributes indicating live stream
          const liveHtmlIndicators = [
            'live-chat-present',
            'live-chat-present-and-expanded',
            'is-live-video',
            'ytp-live',
          ];
          
          for (const indicator of liveHtmlIndicators) {
            if (html.includes(indicator)) {
              isLive = true;
              liveStreamUrl = `https://www.youtube.com/watch?v=${videoId}`;
              detectedBy = `html-attr:${indicator}`;
              console.log(`${youtuber.name} is LIVE! Detected via HTML attribute: ${indicator}`);
              break;
            }
          }

          // Detection Method 2: JSON data in page
          if (!isLive) {
            const jsonIndicators = [
              { pattern: '"isLive":true', name: 'isLive:true' },
              { pattern: '"isLiveNow":true', name: 'isLiveNow:true' },
              { pattern: '"isLiveContent":true', name: 'isLiveContent:true' },
              { pattern: '"isLiveBroadcast":true', name: 'isLiveBroadcast:true' },
              { pattern: '"BADGE_STYLE_TYPE_LIVE_NOW"', name: 'badge-live-now' },
              { pattern: '"liveBadge"', name: 'liveBadge' },
              { pattern: '"style":"LIVE"', name: 'style:LIVE' },
            ];

            for (const { pattern, name } of jsonIndicators) {
              if (html.includes(pattern)) {
                // Make sure it's not a false positive
                if (!html.includes('"isLive":false')) {
                  isLive = true;
                  liveStreamUrl = `https://www.youtube.com/watch?v=${videoId}`;
                  detectedBy = `json:${name}`;
                  console.log(`${youtuber.name} is LIVE! Detected via JSON: ${name}`);
                  break;
                }
              }
            }
          }

          // Detection Method 3: Check for live chat iframe or elements
          if (!isLive) {
            if (html.includes('live_chat') || html.includes('/live_chat')) {
              isLive = true;
              liveStreamUrl = `https://www.youtube.com/watch?v=${videoId}`;
              detectedBy = 'live_chat_url';
              console.log(`${youtuber.name} is LIVE! Detected via live chat URL`);
            }
          }

          // Detection Method 4: Check meta tags
          if (!isLive) {
            if (html.includes('og:type" content="video.other"') && finalUrl.includes('/watch')) {
              // This combined with being redirected from /live suggests it's live
              if (!html.includes('This live stream recording is not available') && 
                  !html.includes('This video is unavailable')) {
                isLive = true;
                liveStreamUrl = `https://www.youtube.com/watch?v=${videoId}`;
                detectedBy = 'redirect-to-watch';
                console.log(`${youtuber.name} likely LIVE! Redirected from /live to watch page`);
              }
            }
          }
        }

        // Update the database
        const { error: updateError } = await supabase
          .from('featured_youtubers')
          .update({ 
            is_live: isLive,
            live_stream_url: liveStreamUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', youtuber.id);

        if (updateError) {
          console.error(`Error updating ${youtuber.name}:`, updateError);
          results.push({ id: youtuber.id, name: youtuber.name, isLive, error: updateError.message });
        } else {
          console.log(`Updated ${youtuber.name}: isLive=${isLive}, detectedBy=${detectedBy || 'none'}`);
          results.push({ id: youtuber.id, name: youtuber.name, isLive, liveUrl: liveStreamUrl || undefined, detectedBy: detectedBy || undefined });
        }

      } catch (checkError: any) {
        console.error(`Error checking ${youtuber.name}:`, checkError.message);
        results.push({ id: youtuber.id, name: youtuber.name, isLive: youtuber.is_live || false, error: checkError.message });
      }
    }

    const liveCount = results.filter(r => r.isLive).length;
    console.log(`Sync complete: ${liveCount}/${youtubers.length} channels are live`);

    return new Response(
      JSON.stringify({ 
        message: `Checked ${youtubers.length} channels`, 
        liveCount,
        results,
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
