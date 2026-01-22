import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Extract channel ID/handle from various YouTube URL formats
function extractChannelIdentifier(url: string): { type: 'handle' | 'id' | 'custom', value: string } | null {
  const cleanUrl = url.split('?')[0].replace(/\/$/, '');
  
  // Handle format: youtube.com/@username
  const handleMatch = cleanUrl.match(/youtube\.com\/@([^\/]+)/);
  if (handleMatch) {
    return { type: 'handle', value: handleMatch[1] };
  }
  
  // Channel ID format: youtube.com/channel/UC...
  const channelIdMatch = cleanUrl.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]+)/);
  if (channelIdMatch) {
    return { type: 'id', value: channelIdMatch[1] };
  }
  
  // Custom URL format: youtube.com/c/username
  const customMatch = cleanUrl.match(/youtube\.com\/c\/([^\/]+)/);
  if (customMatch) {
    return { type: 'custom', value: customMatch[1] };
  }
  
  // User format: youtube.com/user/username
  const userMatch = cleanUrl.match(/youtube\.com\/user\/([^\/]+)/);
  if (userMatch) {
    return { type: 'custom', value: userMatch[1] };
  }
  
  return null;
}

// Check live status by fetching the channel's /live page
async function checkLiveStatus(channelUrl: string, channelName: string): Promise<{
  isLive: boolean;
  liveStreamUrl: string | null;
  detectedBy: string;
}> {
  const identifier = extractChannelIdentifier(channelUrl);
  if (!identifier) {
    console.log(`Could not extract channel identifier from: ${channelUrl}`);
    return { isLive: false, liveStreamUrl: null, detectedBy: 'invalid_url' };
  }

  // Build the /live URL based on identifier type
  let livePageUrl: string;
  if (identifier.type === 'handle') {
    livePageUrl = `https://www.youtube.com/@${identifier.value}/live`;
  } else if (identifier.type === 'id') {
    livePageUrl = `https://www.youtube.com/channel/${identifier.value}/live`;
  } else {
    livePageUrl = `https://www.youtube.com/c/${identifier.value}/live`;
  }

  console.log(`Checking live page: ${livePageUrl} for ${channelName}`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(livePageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const html = await response.text();
    const finalUrl = response.url;
    
    console.log(`Final URL for ${channelName}: ${finalUrl}`);

    // Extract video ID from URL or page
    let videoId: string | null = null;
    
    // Check if redirected to a watch page (strong indicator of live)
    const watchMatch = finalUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) {
      videoId = watchMatch[1];
      console.log(`Redirected to watch page with video ID: ${videoId}`);
    }
    
    // Also try to extract from page source
    if (!videoId) {
      const videoIdPatterns = [
        /"videoId":"([a-zA-Z0-9_-]{11})"/,
        /video-id="([a-zA-Z0-9_-]{11})"/,
        /\/watch\?v=([a-zA-Z0-9_-]{11})/,
        /"currentVideoEndpoint":\{"watchEndpoint":\{"videoId":"([a-zA-Z0-9_-]{11})"/,
      ];
      
      for (const pattern of videoIdPatterns) {
        const match = html.match(pattern);
        if (match) {
          videoId = match[1];
          break;
        }
      }
    }

    if (!videoId) {
      console.log(`No video ID found for ${channelName} - likely not live`);
      return { isLive: false, liveStreamUrl: null, detectedBy: 'no_video_id' };
    }

    console.log(`Found video ID: ${videoId} for ${channelName}`);

    // Now check if the video is actually LIVE
    let isLive = false;
    let detectedBy = '';

    // Method 1: Strong JSON indicators
    const strongLiveIndicators = [
      { pattern: '"isLive":true', name: 'isLive_true', negative: '"isLive":false' },
      { pattern: '"isLiveNow":true', name: 'isLiveNow_true', negative: '"isLiveNow":false' },
      { pattern: '"isLiveBroadcast":true', name: 'isLiveBroadcast', negative: null },
      { pattern: '"isLiveContent":true', name: 'isLiveContent', negative: null },
      { pattern: '"BADGE_STYLE_TYPE_LIVE_NOW"', name: 'badge_live_now', negative: null },
      { pattern: '"liveBadge":', name: 'liveBadge', negative: null },
    ];

    for (const { pattern, name, negative } of strongLiveIndicators) {
      if (html.includes(pattern)) {
        // Check for negative pattern if exists
        if (negative && html.includes(negative)) {
          console.log(`Found ${pattern} but also ${negative} - skipping`);
          continue;
        }
        isLive = true;
        detectedBy = `json:${name}`;
        console.log(`${channelName} is LIVE! Detected via: ${name}`);
        break;
      }
    }

    // Method 2: HTML attribute indicators
    if (!isLive) {
      const htmlIndicators = [
        'ytp-live',
        'ytp-live-badge',
        'live-chat-present-and-expanded',
        'live-chat-present',
        'is-live-video',
      ];
      
      for (const indicator of htmlIndicators) {
        if (html.includes(indicator)) {
          isLive = true;
          detectedBy = `html:${indicator}`;
          console.log(`${channelName} is LIVE! Detected via HTML: ${indicator}`);
          break;
        }
      }
    }

    // Method 3: Live chat URL presence
    if (!isLive) {
      if (html.includes('/live_chat?') || html.includes('live_chat_replay') === false && html.includes('live_chat')) {
        // Make sure it's not a replay
        if (!html.includes('"isReplay":true') && !html.includes('live_chat_replay')) {
          isLive = true;
          detectedBy = 'live_chat_present';
          console.log(`${channelName} is LIVE! Detected via live chat URL`);
        }
      }
    }

    // Method 4: Check if /live redirected to a watch page (usually means live)
    if (!isLive && watchMatch && finalUrl.includes('/watch')) {
      // Only consider it live if we don't see offline indicators
      const offlineIndicators = [
        'This video is unavailable',
        'This video is private',
        'This live stream recording is not available',
        'Premiere',
        '"isUpcoming":true',
        '"isPremiere":true',
      ];
      
      let isOffline = false;
      for (const indicator of offlineIndicators) {
        if (html.includes(indicator)) {
          isOffline = true;
          console.log(`${channelName} video appears to be offline/upcoming: ${indicator}`);
          break;
        }
      }
      
      if (!isOffline) {
        // Additional check: look for live-specific metadata
        if (html.includes('"style":"LIVE"') || html.includes('"liveStreamabilityRenderer"')) {
          isLive = true;
          detectedBy = 'redirect_with_live_meta';
          console.log(`${channelName} is LIVE! Detected via redirect + live metadata`);
        }
      }
    }

    const liveStreamUrl = isLive && videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;

    return { isLive, liveStreamUrl, detectedBy: detectedBy || 'not_detected' };

  } catch (error: any) {
    console.error(`Error checking ${channelName}:`, error.message);
    return { isLive: false, liveStreamUrl: null, detectedBy: `error:${error.message}` };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all active featured youtubers
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

    console.log(`=== Starting live status check for ${youtubers.length} channels ===`);

    const results: { 
      id: string; 
      name: string; 
      wasLive: boolean;
      isLive: boolean; 
      liveUrl?: string; 
      detectedBy: string;
      statusChanged: boolean;
    }[] = [];

    for (const youtuber of youtubers) {
      console.log(`\n--- Checking: ${youtuber.name} ---`);
      
      const { isLive, liveStreamUrl, detectedBy } = await checkLiveStatus(youtuber.channel_url, youtuber.name);
      
      const statusChanged = youtuber.is_live !== isLive;
      
      if (statusChanged) {
        console.log(`Status CHANGED for ${youtuber.name}: ${youtuber.is_live} -> ${isLive}`);
      }

      // Update the database - always update to ensure fresh data
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
      } else {
        console.log(`Updated ${youtuber.name}: is_live=${isLive}, url=${liveStreamUrl || 'null'}`);
      }

      results.push({ 
        id: youtuber.id, 
        name: youtuber.name, 
        wasLive: youtuber.is_live || false,
        isLive, 
        liveUrl: liveStreamUrl || undefined, 
        detectedBy,
        statusChanged
      });

      // Small delay between requests to be respectful to YouTube
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const liveCount = results.filter(r => r.isLive).length;
    const changedCount = results.filter(r => r.statusChanged).length;
    
    console.log(`\n=== Sync complete ===`);
    console.log(`Live: ${liveCount}/${youtubers.length}`);
    console.log(`Status changes: ${changedCount}`);

    return new Response(
      JSON.stringify({ 
        message: `Checked ${youtubers.length} channels`, 
        liveCount,
        changedCount,
        results,
        timestamp: new Date().toISOString()
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
