import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

// Extract stream title from HTML
function extractStreamTitle(html: string): string | null {
  const patterns = [
    /"title"\s*:\s*\{\s*"runs"\s*:\s*\[\s*\{\s*"text"\s*:\s*"([^"]+)"/,
    /"title":"([^"]+)"/,
    /<meta name="title" content="([^"]+)"/,
    /<title>([^<]+)<\/title>/,
    /"videoDetails":\{[^}]*"title":"([^"]+)"/,
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      let title = match[1];
      // Decode unicode escapes
      title = title.replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => 
        String.fromCharCode(parseInt(code, 16))
      );
      // Remove " - YouTube" suffix
      title = title.replace(/ - YouTube$/, '').trim();
      if (title && title.length > 0) {
        return title;
      }
    }
  }
  return null;
}

function extractCanonicalWatchVideoId(html: string): string | null {
  const match = html.match(/<link\s+rel="canonical"\s+href="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})"/);
  return match?.[1] ?? null;
}

function extractOgWatchVideoId(html: string): string | null {
  const patterns = [
    /<meta\s+property="og:url"\s+content="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})"/,
    /<meta\s+property="og:video:url"\s+content="https:\/\/www\.youtube\.com\/embed\/([a-zA-Z0-9_-]{11})"/,
    /<meta\s+property="og:video:secure_url"\s+content="https:\/\/www\.youtube\.com\/embed\/([a-zA-Z0-9_-]{11})"/,
  ];

  for (const p of patterns) {
    const m = html.match(p);
    if (m?.[1]) return m[1];
  }

  return null;
}

function extractPrimaryVideoIdFromHtml(html: string): string | null {
  // 1) Prefer a videoId that is in the SAME neighborhood as LIVE markers.
  // This avoids picking random/recommended videos on the /live page.
  const liveMarkers = [
    '"isLive":true',
    '"isLiveNow":true',
    '"BADGE_STYLE_TYPE_LIVE_NOW"',
    '"liveStreamabilityRenderer"',
    '"liveChatRenderer"',
  ];

  const videoIdRe = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
  let m: RegExpExecArray | null;
  while ((m = videoIdRe.exec(html))) {
    const id = m[1];
    const idx = m.index;
    const start = Math.max(0, idx - 2500);
    const end = Math.min(html.length, idx + 2500);
    const windowHtml = html.slice(start, end);

    const hasLiveMarker = liveMarkers.some((marker) => windowHtml.includes(marker));
    const hasReplayMarker = windowHtml.includes('"isReplay":true') || windowHtml.includes('live_chat_replay');

    if (hasLiveMarker && !hasReplayMarker) {
      return id;
    }
  }

  // 2) Fallback to the page's primary player response / videoDetails.
  const patterns: RegExp[] = [
    /"videoDetails":\{[^}]*"videoId":"([a-zA-Z0-9_-]{11})"/,
    /"videoDetails":\{[^}]*"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"/,
    /"currentVideoEndpoint":\{"clickTrackingParams":"[^"]+","watchEndpoint":\{"videoId":"([a-zA-Z0-9_-]{11})"/,
  ];
  for (const p of patterns) {
    const mm = html.match(p);
    if (mm?.[1]) return mm[1];
  }

  return null;
}

// Extract stream thumbnail from video ID
function getStreamThumbnail(videoId: string): string {
  // Use maxresdefault for highest quality, fallback to hqdefault
  return `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
}

// Extract channel ID from HTML to verify ownership
function extractChannelIdFromHtml(html: string): string | null {
  const patterns = [
    /"channelId":"(UC[a-zA-Z0-9_-]{22})"/,
    /"externalChannelId":"(UC[a-zA-Z0-9_-]{22})"/,
    /channel\/(UC[a-zA-Z0-9_-]{22})/,
    /"browseId":"(UC[a-zA-Z0-9_-]{22})"/,
    // Escaped JSON variants (sometimes present in consent / embedded blobs)
    /\\"channelId\\":\\"(UC[a-zA-Z0-9_-]{22})\\"/,
    /\\"externalChannelId\\":\\"(UC[a-zA-Z0-9_-]{22})\\"/,
    /\\"browseId\\":\\"(UC[a-zA-Z0-9_-]{22})\\"/,
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

// Extract the channel ID of the video owner from video page HTML
function extractVideoOwnerChannelId(html: string): string | null {
  const patterns = [
    /"videoDetails":\{[^}]*"channelId":"(UC[a-zA-Z0-9_-]{22})"/,
    /"ownerChannelName":[^,]+,"externalChannelId":"(UC[a-zA-Z0-9_-]{22})"/,
    /"playerMicroformatRenderer":\{[^}]*"externalChannelId":"(UC[a-zA-Z0-9_-]{22})"/,
    /"shortBylineText":\{"runs":\[\{"text":"[^"]+","navigationEndpoint":\{"[^}]+,"browseEndpoint":\{"browseId":"(UC[a-zA-Z0-9_-]{22})"/,
    /"author":"[^"]+","channelId":"(UC[a-zA-Z0-9_-]{22})"/,
    // Escaped JSON variants (common when the HTML embeds JSON as a string)
    /\\"videoDetails\\":\{[^}]*\\"channelId\\":\\"(UC[a-zA-Z0-9_-]{22})\\"/,
    /\\"externalChannelId\\":\\"(UC[a-zA-Z0-9_-]{22})\\"/,
    /\\"browseId\\":\\"(UC[a-zA-Z0-9_-]{22})\\"/,
    /\\"channelId\\":\\"(UC[a-zA-Z0-9_-]{22})\\"/,
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

// Check live status by fetching the channel's /live page
async function checkLiveStatus(channelUrl: string, channelName: string): Promise<{
  isLive: boolean;
  liveStreamUrl: string | null;
  liveStreamTitle: string | null;
  liveStreamThumbnail: string | null;
  detectedBy: string;
}> {
  const identifier = extractChannelIdentifier(channelUrl);
  if (!identifier) {
    console.log(`Could not extract channel identifier from: ${channelUrl}`);
    return { isLive: false, liveStreamUrl: null, liveStreamTitle: null, liveStreamThumbnail: null, detectedBy: 'invalid_url' };
  }

  // Build the /live URL based on identifier type
  let livePageUrl: string;
  let channelPageUrl: string;
  if (identifier.type === 'handle') {
    livePageUrl = `https://www.youtube.com/@${identifier.value}/live`;
    channelPageUrl = `https://www.youtube.com/@${identifier.value}`;
  } else if (identifier.type === 'id') {
    livePageUrl = `https://www.youtube.com/channel/${identifier.value}/live`;
    channelPageUrl = `https://www.youtube.com/channel/${identifier.value}`;
  } else {
    livePageUrl = `https://www.youtube.com/c/${identifier.value}/live`;
    channelPageUrl = `https://www.youtube.com/c/${identifier.value}`;
  }

  console.log(`Checking live page: ${livePageUrl} for ${channelName}`);

  try {
    const defaultHeaders: Record<string, string> = {
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
    };

    const fetchHtml = async (url: string, timeoutMs: number) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(url, {
        headers: defaultHeaders,
        redirect: 'follow',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return {
        html: await response.text(),
        finalUrl: response.url,
      };
    };

    const { html, finalUrl } = await fetchHtml(livePageUrl, 20000);
    
    console.log(`Final URL for ${channelName}: ${finalUrl}`);

    // IMPORTANT: Resolve the *expected* channel ID from the channel's main page.
    // The /live page may include other channels' metadata (recommendations), so it is not reliable.
    let expectedChannelId: string | null = null;
    
    // If the identifier is already a channel ID, use it directly
    if (identifier.type === 'id') {
      expectedChannelId = identifier.value;
    } else {
      try {
        const channelPage = await fetchHtml(channelPageUrl, 15000);
        expectedChannelId = extractChannelIdFromHtml(channelPage.html);
        console.log(`Resolved expected channel ID for ${channelName} from channel page (${channelPage.finalUrl}): ${expectedChannelId}`);
      } catch (e: any) {
        console.error(`${channelName} - Failed to resolve expected channel ID from channel page:`, e?.message || e);
        // Fallback to best-effort from /live HTML if channel page fails
        expectedChannelId = extractChannelIdFromHtml(html);
      }
    }
    
    console.log(`Expected channel ID for ${channelName}: ${expectedChannelId}`);

    // Extract video ID from various sources
    let videoId: string | null = null;

    // Highest priority: OpenGraph URL (tends to be accurate for /live pages)
    videoId = extractOgWatchVideoId(html);
    if (videoId) {
      console.log(`Found video ID from OpenGraph metadata: ${videoId}`);
    }

    // Highest priority: player/videoDetails on the page (avoids grabbing recommended videos)
    if (!videoId) {
      videoId = extractPrimaryVideoIdFromHtml(html);
      if (videoId) {
        console.log(`Found primary video ID from player data: ${videoId}`);
      }
    }

    // Prefer canonical watch URL (usually points to the channel's live stream)
    if (!videoId) {
      videoId = extractCanonicalWatchVideoId(html);
      if (videoId) {
        console.log(`Found video ID from canonical link: ${videoId}`);
      }
    }
    
    // Try URL next (if redirected to a /watch page)
    if (!videoId) {
      const watchMatch = finalUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
      if (watchMatch) {
        videoId = watchMatch[1];
        console.log(`Found video ID in URL: ${videoId}`);
      }
    }
    
    // Try to extract from HTML if not in URL
    if (!videoId) {
      const videoIdPatterns = [
        /"videoId":"([a-zA-Z0-9_-]{11})"/,
        /video-id="([a-zA-Z0-9_-]{11})"/,
        /embed\/([a-zA-Z0-9_-]{11})/,
      ];
      for (const pattern of videoIdPatterns) {
        const match = html.match(pattern);
        if (match) {
          videoId = match[1];
          console.log(`Found fallback video ID in HTML: ${videoId}`);
          break;
        }
      }
    }

    // FIRST: Check for definitive NOT LIVE indicators
    const notLiveIndicators = [
      { text: '"isLive":false', name: 'isLive_false' },
      { text: '"isLiveNow":false', name: 'isLiveNow_false' },
      { text: 'This live stream recording is not available', name: 'recording_unavailable' },
      { text: 'This video is unavailable', name: 'video_unavailable' },
      { text: 'This video is private', name: 'video_private' },
      { text: '"isReplay":true', name: 'is_replay' },
      { text: '"isPremiere":true', name: 'is_premiere' },
      { text: '"isUpcoming":true', name: 'is_upcoming' },
      { text: 'LIVE_STREAM_OFFLINE', name: 'stream_offline' },
    ];

    for (const indicator of notLiveIndicators) {
      if (html.includes(indicator.text)) {
        console.log(`${channelName} is NOT LIVE - Found indicator: ${indicator.name}`);
        return { isLive: false, liveStreamUrl: null, liveStreamTitle: null, liveStreamThumbnail: null, detectedBy: `not_live:${indicator.name}` };
      }
    }

    // Check for LIVE indicators - be more permissive
    let isLive = false;
    let detectedBy = '';

    // IMPROVED: Check multiple live indicators and be more lenient
    const liveIndicators = [
      { pattern: '"isLive":true', name: 'isLive_true' },
      { pattern: '"isLiveNow":true', name: 'isLiveNow_true' },
      { pattern: '"BADGE_STYLE_TYPE_LIVE_NOW"', name: 'badge_live_now' },
      { pattern: '"style":"LIVE"', name: 'style_live' },
      { pattern: '"liveBadge":', name: 'liveBadge' },
      { pattern: '"liveChatRenderer"', name: 'liveChatRenderer' },
      { pattern: '"liveStreamabilityRenderer"', name: 'liveStreamabilityRenderer' },
      { pattern: '"broadcastId":', name: 'broadcastId' },
      { pattern: '"latencyClass":"MDE_STREAM_OPTIMIZATIONS_RENDERER_LATENCY_', name: 'latency_class' },
      { pattern: '"isLiveContent":true', name: 'isLiveContent_true' },
      { pattern: '"LIVE_STREAM_STARTED"', name: 'stream_started' },
    ];

    for (const { pattern, name } of liveIndicators) {
      if (html.includes(pattern)) {
        // Double-check it's not a replay by looking at context
        const isReplay = html.includes('"isReplay":true') || html.includes('live_chat_replay');
        if (!isReplay) {
          isLive = true;
          detectedBy = `json:${name}`;
          console.log(`${channelName} is LIVE! Detected via: ${name}`);
          break;
        }
      }
    }

    // Method 2: Check for active live chat (NOT replay)
    if (!isLive) {
      const hasLiveChat = html.includes('/live_chat?') && !html.includes('live_chat_replay');
      const hasRealtimeChat = html.includes('"liveChatContinuation"') && !html.includes('"isReplay":true');
      
      if (hasLiveChat || hasRealtimeChat) {
        isLive = true;
        detectedBy = 'live_chat_active';
        console.log(`${channelName} is LIVE! Detected via active live chat`);
      }
    }

    // Method 3: Check if redirected to /watch AND has a video ID AND page has live stream elements
    if (!isLive && videoId && (finalUrl.includes('/watch') || html.includes('"videoDetails"'))) {
      // Check for any live-related content without strong NOT LIVE markers
      const hasLiveElements = html.includes('"liveBadgeRenderer"') || 
                              html.includes('"viewCount":{"videoViewCountRenderer":{"viewCount":{"runs"') ||
                              html.includes('"isLive"') ||
                              (html.includes('"publishDate"') === false && html.includes('"lengthSeconds":"0"'));
      
      if (hasLiveElements) {
        isLive = true;
        detectedBy = 'live_elements_detected';
        console.log(`${channelName} is LIVE! Detected via live elements in watch page`);
      }
    }

    // If still no video found and stayed on channel page, not live
    if (!videoId) {
      console.log(`${channelName} is NOT LIVE - No video ID found`);
      return { isLive: false, liveStreamUrl: null, liveStreamTitle: null, liveStreamThumbnail: null, detectedBy: 'no_video_id' };
    }

    // If not live, return early
    if (!isLive) {
      console.log(`${channelName} - No definitive live indicators found`);
      return { isLive: false, liveStreamUrl: null, liveStreamTitle: null, liveStreamThumbnail: null, detectedBy: 'no_live_indicators' };
    }

    // CRITICAL: Verify the video actually belongs to this channel
    // IMPORTANT: YouTube /live pages sometimes surface other channels' streams.
    // We must confirm ownership based on the video's actual watch page when needed.
    let videoOwnerChannelId = extractVideoOwnerChannelId(html);
    console.log(`Video owner channel ID (from live page): ${videoOwnerChannelId}, Expected: ${expectedChannelId}`);

    // Extract the author name for additional logging / fallback
    const authorPatterns = [
      /"ownerChannelName":"([^"]+)"/,  // Most reliable for video owner
      /"videoDetails":[^}]*"author":"([^"]+)"/,  // From video details specifically
      /"author":"([^"]+)"/,
      /"shortBylineText":\{"runs":\[\{"text":"([^"]+)"/,
    ];
    
    let videoAuthor: string | null = null;
    for (const pattern of authorPatterns) {
      const match = html.match(pattern);
      if (match) {
        videoAuthor = match[1];
        break;
      }
    }
    
    console.log(`Video author (from live page): "${videoAuthor}", Channel name: "${channelName}"`);

    // If we have an expected channel ID but couldn't reliably extract the owner ID from the /live HTML,
    // fetch the video's watch page and extract the owner channel ID there (much more reliable).
    if (expectedChannelId && (!videoOwnerChannelId || videoOwnerChannelId !== expectedChannelId)) {
      const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
      console.log(`${channelName} - Verifying ownership via watch page: ${watchUrl}`);
      try {
        const watch = await fetchHtml(watchUrl, 15000);
        const watchOwner = extractVideoOwnerChannelId(watch.html);
        console.log(`${channelName} - Video owner channel ID (from watch page): ${watchOwner}, Expected: ${expectedChannelId}`);
        if (watchOwner) {
          videoOwnerChannelId = watchOwner;
        }
      } catch (e: any) {
        console.error(`${channelName} - Watch page verification failed:`, e?.message || e);
      }
    }

    // If the watch page doesn't contain an owner channel ID (common when YouTube serves consent/blocked pages),
    // use oEmbed to get the author URL, then resolve that to a channel ID.
    if (expectedChannelId && !videoOwnerChannelId) {
      try {
        const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(
          `https://www.youtube.com/watch?v=${videoId}`,
        )}&format=json`;
        console.log(`${channelName} - Resolving ownership via oEmbed: ${oEmbedUrl}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(oEmbedUrl, {
          headers: {
            'User-Agent': defaultHeaders['User-Agent'],
            'Accept': 'application/json',
          },
          redirect: 'follow',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const authorUrl: string | undefined = data?.author_url;
          console.log(`${channelName} - oEmbed author_url: ${authorUrl}`);

          if (authorUrl) {
            // If oEmbed gives a direct /channel/UC... URL, extract it immediately.
            const directChannelMatch = authorUrl.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})/);
            if (directChannelMatch) {
              videoOwnerChannelId = directChannelMatch[1];
              console.log(`${channelName} - Owner channel ID resolved directly from oEmbed author_url: ${videoOwnerChannelId}`);
            } else {
              // Otherwise resolve the channel ID by fetching the author URL page.
              const authorIdentifier = extractChannelIdentifier(authorUrl);
              if (authorIdentifier) {
                let authorPageUrl: string;
                if (authorIdentifier.type === 'handle') {
                  authorPageUrl = `https://www.youtube.com/@${authorIdentifier.value}`;
                } else if (authorIdentifier.type === 'id') {
                  authorPageUrl = `https://www.youtube.com/channel/${authorIdentifier.value}`;
                } else {
                  authorPageUrl = `https://www.youtube.com/c/${authorIdentifier.value}`;
                }

                console.log(`${channelName} - Fetching author page to resolve channel ID: ${authorPageUrl}`);
                const authorPage = await fetchHtml(authorPageUrl, 12000);
                const resolved = extractChannelIdFromHtml(authorPage.html);
                console.log(`${channelName} - Owner channel ID resolved from author page: ${resolved}`);
                if (resolved) {
                  videoOwnerChannelId = resolved;
                }
              }
            }
          }
        } else {
          console.log(`${channelName} - oEmbed request failed: ${res.status}`);
        }
      } catch (e: any) {
        console.error(`${channelName} - oEmbed ownership resolution failed:`, e?.message || e);
      }
    }

    // FINAL OWNERSHIP DECISION
    // In practice, YouTube often serves consent/blocked HTML or mixed metadata on /live.
    // For the website UX we prefer false-positives that link to the channel /live page
    // over false-negatives that hide live streamers completely.
    let preferLivePageUrl = false;

    // If we know the expected channel ID:
    // - when we can verify match: great
    // - when we cannot verify OR mismatch: still show as live but link to /live
    if (expectedChannelId) {
      if (videoOwnerChannelId && videoOwnerChannelId !== expectedChannelId) {
        console.log(`${channelName} - Ownership mismatch (expected: ${expectedChannelId}, got: ${videoOwnerChannelId}); keeping LIVE but linking to /live to avoid false negatives`);
        preferLivePageUrl = true;
        detectedBy = `${detectedBy}|ownership_mismatch`;
      }

      if (videoOwnerChannelId === expectedChannelId) {
        console.log(`${channelName} - Ownership verified via channel ID match: ${expectedChannelId}`);
      } else {
        console.log(`${channelName} - Ownership not verifiable (missing owner channel ID); allowing LIVE to avoid false negatives`);
        preferLivePageUrl = true;
        detectedBy = `${detectedBy}|ownership_unverified`;
      }
    }

    // Extract stream title and thumbnail
    const liveStreamUrl = preferLivePageUrl ? finalUrl : `https://www.youtube.com/watch?v=${videoId}`;
    const liveStreamTitle = preferLivePageUrl ? null : extractStreamTitle(html);
    const liveStreamThumbnail = preferLivePageUrl ? null : getStreamThumbnail(videoId);
    
    console.log(`${channelName} stream title: ${liveStreamTitle}`);
    console.log(`${channelName} stream thumbnail: ${liveStreamThumbnail}`);

    return { isLive, liveStreamUrl, liveStreamTitle, liveStreamThumbnail, detectedBy };

  } catch (error: any) {
    console.error(`Error checking ${channelName}:`, error.message);
    return { isLive: false, liveStreamUrl: null, liveStreamTitle: null, liveStreamThumbnail: null, detectedBy: `error:${error.message}` };
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
      liveTitle?: string;
      liveThumbnail?: string;
      detectedBy: string;
      statusChanged: boolean;
    }[] = [];

    for (const youtuber of youtubers) {
      console.log(`\n--- Checking: ${youtuber.name} ---`);
      
      const { isLive, liveStreamUrl, liveStreamTitle, liveStreamThumbnail, detectedBy } = await checkLiveStatus(youtuber.channel_url, youtuber.name);
      
      const statusChanged = youtuber.is_live !== isLive;
      
      if (statusChanged) {
        console.log(`STATUS CHANGED for ${youtuber.name}: ${youtuber.is_live} -> ${isLive}`);
      }

      // Update the database with all live stream info
      const { error: updateError } = await supabase
        .from('featured_youtubers')
        .update({ 
          is_live: isLive,
          live_stream_url: isLive ? liveStreamUrl : null,
          live_stream_title: isLive ? liveStreamTitle : null,
          live_stream_thumbnail: isLive ? liveStreamThumbnail : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', youtuber.id);

      if (updateError) {
        console.error(`Error updating ${youtuber.name}:`, updateError);
      } else {
        console.log(`Updated ${youtuber.name}: is_live=${isLive}, title=${liveStreamTitle || 'null'}, detected_by=${detectedBy}`);
      }

      results.push({ 
        id: youtuber.id, 
        name: youtuber.name, 
        wasLive: youtuber.is_live || false,
        isLive, 
        liveUrl: liveStreamUrl || undefined,
        liveTitle: liveStreamTitle || undefined,
        liveThumbnail: liveStreamThumbnail || undefined,
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
