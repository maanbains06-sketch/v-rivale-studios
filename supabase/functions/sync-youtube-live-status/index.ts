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

    // FIRST: Check for definitive NOT LIVE indicators
    const notLiveIndicators = [
      '"isLive":false',
      '"isLiveNow":false',
      'This live stream recording is not available',
      'This video is unavailable',
      'This video is private',
      '"isReplay":true',
      'live_chat_replay',
      '"isPremiere":true',
      '"isUpcoming":true',
      'Premieres',
      'Scheduled for',
      'Stream ended',
      'Streamed live',
      '"playabilityStatus":{"status":"LIVE_STREAM_OFFLINE"',
      'LIVE_STREAM_OFFLINE',
    ];

    for (const indicator of notLiveIndicators) {
      if (html.includes(indicator)) {
        console.log(`${channelName} is NOT LIVE - Found indicator: ${indicator}`);
        return { isLive: false, liveStreamUrl: null, detectedBy: `not_live:${indicator.substring(0, 30)}` };
      }
    }

    // Extract video ID from various sources BEFORE checking redirect
    // This handles cases where the /live page doesn't redirect but contains live video data
    let videoId: string | null = null;
    
    // Try URL first
    const watchMatch = finalUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) {
      videoId = watchMatch[1];
    }
    
    // Try to extract from HTML if not in URL
    if (!videoId) {
      const videoIdPatterns = [
        /"videoId":"([a-zA-Z0-9_-]{11})"/,
        /video-id="([a-zA-Z0-9_-]{11})"/,
        /"currentVideoEndpoint":\{"clickTrackingParams":"[^"]+","watchEndpoint":\{"videoId":"([a-zA-Z0-9_-]{11})"/,
        /"videoDetails":\{"videoId":"([a-zA-Z0-9_-]{11})"/,
        /embed\/([a-zA-Z0-9_-]{11})/,
      ];
      for (const pattern of videoIdPatterns) {
        const match = html.match(pattern);
        if (match) {
          videoId = match[1];
          console.log(`Found video ID in HTML: ${videoId}`);
          break;
        }
      }
    }

    // Check if we're NOT on a watch page AND no video ID found in HTML
    if (!watchMatch && !finalUrl.includes('/watch') && !videoId) {
      console.log(`${channelName} is NOT LIVE - No video redirect (stayed on channel page)`);
      return { isLive: false, liveStreamUrl: null, detectedBy: 'no_video_redirect' };
    }

    // At this point we have a videoId from above, check if it's valid
    if (!videoId) {
      console.log(`${channelName} is NOT LIVE - No video ID found`);
      return { isLive: false, liveStreamUrl: null, detectedBy: 'no_video_id' };
    }

    console.log(`Found video ID: ${videoId} for ${channelName}`);

    // Now check for DEFINITIVE live indicators
    let isLive = false;
    let detectedBy = '';

    // Method 1: Strongest JSON indicators that MUST be true
    const strongLiveIndicators = [
      { pattern: '"isLive":true', name: 'isLive_true' },
      { pattern: '"isLiveNow":true', name: 'isLiveNow_true' },
      { pattern: '"BADGE_STYLE_TYPE_LIVE_NOW"', name: 'badge_live_now' },
      { pattern: '"style":"LIVE"', name: 'style_live' },
    ];

    for (const { pattern, name } of strongLiveIndicators) {
      if (html.includes(pattern)) {
        isLive = true;
        detectedBy = `json:${name}`;
        console.log(`${channelName} is LIVE! Detected via: ${name}`);
        break;
      }
    }

    // Method 2: Check for live badge in player
    if (!isLive) {
      // Look for the live badge specifically in player context
      if (html.includes('"liveBadge":{"liveBadgeRenderer"')) {
        isLive = true;
        detectedBy = 'liveBadgeRenderer';
        console.log(`${channelName} is LIVE! Detected via liveBadgeRenderer`);
      }
    }

    // Method 3: Check for live streaming metadata
    if (!isLive) {
      if (html.includes('"liveStreamabilityRenderer"') && html.includes('"isLiveNow":true')) {
        isLive = true;
        detectedBy = 'liveStreamabilityRenderer';
        console.log(`${channelName} is LIVE! Detected via liveStreamabilityRenderer`);
      }
    }

    // Method 4: Check for active live chat (NOT replay)
    if (!isLive) {
      // Only consider it live if there's live chat AND we haven't seen replay indicators
      const hasLiveChat = html.includes('/live_chat?') || html.includes('"liveChatRenderer"');
      const hasActiveChatIndicator = html.includes('"isReplay":false') || 
                                      (hasLiveChat && !html.includes('live_chat_replay'));
      
      // Additional check: look for continuation token which indicates active chat
      const hasChatContinuation = html.includes('"liveChatContinuation"') && !html.includes('"isReplay":true');
      
      if (hasActiveChatIndicator && hasChatContinuation) {
        // Double check it's not a replay by looking for more indicators
        if (html.includes('"viewCount":{"videoViewCountRenderer":{"viewCount":{"runs"')) {
          // This pattern appears in live streams showing live viewer count
          isLive = true;
          detectedBy = 'live_chat_active';
          console.log(`${channelName} is LIVE! Detected via active live chat`);
        }
      }
    }

    // If still no definitive answer, assume NOT live (safer default)
    if (!isLive) {
      console.log(`${channelName} - No definitive live indicators found, assuming NOT LIVE`);
      return { isLive: false, liveStreamUrl: null, detectedBy: 'no_definitive_indicators' };
    }

    const liveStreamUrl = `https://www.youtube.com/watch?v=${videoId}`;
    return { isLive, liveStreamUrl, detectedBy };

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
        console.log(`STATUS CHANGED for ${youtuber.name}: ${youtuber.is_live} -> ${isLive}`);
      }

      // Update the database
      const { error: updateError } = await supabase
        .from('featured_youtubers')
        .update({ 
          is_live: isLive,
          live_stream_url: isLive ? liveStreamUrl : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', youtuber.id);

      if (updateError) {
        console.error(`Error updating ${youtuber.name}:`, updateError);
      } else {
        console.log(`Updated ${youtuber.name}: is_live=${isLive}, url=${liveStreamUrl || 'null'}, detected_by=${detectedBy}`);
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

      // Small delay between requests
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
