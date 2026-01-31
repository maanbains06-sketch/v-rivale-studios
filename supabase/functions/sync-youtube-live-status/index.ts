import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Extract channel ID/handle from various YouTube URL formats
function extractChannelIdentifier(url: string): { type: 'handle' | 'id' | 'custom', value: string } | null {
  const cleanUrl = url.split('?')[0].replace(/\/$/, '');
  
  const handleMatch = cleanUrl.match(/youtube\.com\/@([^\/]+)/);
  if (handleMatch) return { type: 'handle', value: handleMatch[1] };
  
  const channelIdMatch = cleanUrl.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]+)/);
  if (channelIdMatch) return { type: 'id', value: channelIdMatch[1] };
  
  const customMatch = cleanUrl.match(/youtube\.com\/c\/([^\/]+)/);
  if (customMatch) return { type: 'custom', value: customMatch[1] };
  
  const userMatch = cleanUrl.match(/youtube\.com\/user\/([^\/]+)/);
  if (userMatch) return { type: 'custom', value: userMatch[1] };
  
  return null;
}

// Extract stream title from HTML - improved patterns
function extractStreamTitle(html: string): string | null {
  const patterns = [
    // Primary player metadata
    /"title"\s*:\s*\{\s*"runs"\s*:\s*\[\s*\{\s*"text"\s*:\s*"([^"]+)"/,
    /"videoDetails":[^}]*"title"\s*:\s*"([^"]+)"/,
    /"title":"([^"]+)","lengthSeconds"/,
    /"title":"([^"]+)","channelId"/,
    // OpenGraph
    /<meta\s+property="og:title"\s+content="([^"]+)"/,
    /<meta\s+name="title"\s+content="([^"]+)"/,
    // Fallback
    /<title>([^<]+)<\/title>/,
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
      if (title && title.length > 0 && !title.toLowerCase().includes('youtube')) {
        return title;
      }
    }
  }
  return null;
}

// Extract video ID from HTML - prioritize primary content
// If expectedChannelId is provided, try to pick a videoId that references that channel nearby
// (prevents selecting a featured/recommended live stream from another creator on the /live page).
function extractVideoId(html: string, finalUrl: string, expectedChannelId?: string | null): string | null {
  // 1. Check URL first (most reliable if redirected to /watch)
  const watchMatch = finalUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];
  
  // 2. OpenGraph URL
  const ogMatch = html.match(/<meta\s+property="og:url"\s+content="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})"/);
  if (ogMatch) return ogMatch[1];
  
  // 3. Canonical link
  const canonicalMatch = html.match(/<link\s+rel="canonical"\s+href="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})"/);
  if (canonicalMatch) return canonicalMatch[1];
  
  // 4. Video details (player data)
  const videoDetailsMatch = html.match(/"videoDetails":\{[^}]*"videoId":"([a-zA-Z0-9_-]{11})"/);
  if (videoDetailsMatch) return videoDetailsMatch[1];
  
  // 5. Look for videoId near LIVE indicators
  const liveMarkers = ['"isLive":true', '"isLiveNow":true', '"BADGE_STYLE_TYPE_LIVE_NOW"', '"liveChatRenderer"'];
  const videoIdRe = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
  let m: RegExpExecArray | null;
  
  while ((m = videoIdRe.exec(html))) {
    const id = m[1];
    const idx = m.index;
    const start = Math.max(0, idx - 3000);
    const end = Math.min(html.length, idx + 3000);
    const windowHtml = html.slice(start, end);
    
    const hasLiveMarker = liveMarkers.some(marker => windowHtml.includes(marker));
    const isReplay = windowHtml.includes('"isReplay":true');
    
    if (hasLiveMarker && !isReplay) {
      // If we know the expected channel id, prefer a videoId that references it nearby.
      if (expectedChannelId) {
        const referencesExpected = windowHtml.includes(`\"videoOwnerChannelId\":\"${expectedChannelId}\"`) ||
                                   windowHtml.includes(`\"ownerChannelId\":\"${expectedChannelId}\"`) ||
                                   windowHtml.includes(`\"channelId\":\"${expectedChannelId}\"`);
        if (referencesExpected) return id;
        // Otherwise keep scanning; we only fall back later.
        continue;
      }
      return id;
    }
  }
  
  // 6. Fallback: first videoId found
  const firstMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
  if (firstMatch) return firstMatch[1];
  
  return null;
}

// Get stream thumbnail from video ID
function getStreamThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
}

// When /live is unreliable (often surfaces featured/hosted streams), use the channel's /streams page
// which is scoped to that channel and tends to include the correct owned LIVE item.
async function findOwnedLiveVideoIdFromStreamsPage(
  expectedChannelId: string,
  headers: Record<string, string>,
  channelName: string
): Promise<string | null> {
  const streamsUrl = `https://www.youtube.com/channel/${expectedChannelId}/streams`;
  console.log(`${channelName} - Fallback: checking streams page: ${streamsUrl}`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const res = await fetch(streamsUrl, {
      headers,
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const html = await res.text();
    const finalUrl = res.url;
    console.log(`${channelName} - Streams final URL: ${finalUrl}`);

    // Try to pick a LIVE videoId that references the expected channel.
    const videoId = extractVideoId(html, finalUrl, expectedChannelId);
    if (videoId) {
      console.log(`${channelName} - Streams page candidate video ID: ${videoId}`);
      return videoId;
    }

    return null;
  } catch (e: any) {
    console.log(`${channelName} - Streams fallback failed: ${e?.message || e}`);
    return null;
  }
}

// Fallback: verify ownership via YouTube oEmbed (works even if HTML is consent/limited)
// Note: oEmbed often returns author_url as a /@handle (no /channel/UC...); when that happens,
// resolve the handle to a canonical channel ID and compare.
async function verifyOwnershipViaOEmbed(liveStreamUrl: string, expectedChannelId: string): Promise<{ ok: boolean; reason: string }> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(liveStreamUrl)}&format=json`;
    const res = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json,text/plain;q=0.9,*/*;q=0.8',
      },
    });

    if (!res.ok) {
      return { ok: false, reason: `oembed_http_${res.status}` };
    }

    const data = await res.json() as { author_url?: string; author_name?: string };
    const authorUrl = data?.author_url || '';

    // Often returns: https://www.youtube.com/channel/UCxxxxxxxx
    const idMatch = authorUrl.match(/\/channel\/(UC[a-zA-Z0-9_-]+)/);
    if (idMatch?.[1]) {
      return { ok: idMatch[1] === expectedChannelId, reason: `oembed_author_channel:${idMatch[1]}` };
    }

    // If no channel id in author_url, try resolving @handle/custom URL to canonical /channel/UC...
    if (authorUrl) {
      const resolved = await getExpectedChannelId(authorUrl);
      if (resolved) {
        return { ok: resolved === expectedChannelId, reason: `oembed_resolved_channel:${resolved}` };
      }
    }

    // If still no channel id, we can't strictly verify.
    return { ok: false, reason: `oembed_no_channel_id:${data?.author_name || 'unknown'}` };
  } catch (e: any) {
    return { ok: false, reason: `oembed_error:${e?.message || e}` };
  }
}

// Extract channel ID from HTML to verify ownership
function extractChannelIdFromHtml(html: string): string | null {
  const patterns = [
    /"channelId":"(UC[a-zA-Z0-9_-]+)"/,
    /"ownerChannelId":"(UC[a-zA-Z0-9_-]+)"/,
    /"videoOwnerChannelId":"(UC[a-zA-Z0-9_-]+)"/,
    /channel\/(UC[a-zA-Z0-9_-]+)/,
    /"externalChannelId":"(UC[a-zA-Z0-9_-]+)"/,
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Extract the expected channel ID from the channel's main page
async function getExpectedChannelId(channelUrl: string): Promise<string | null> {
  const identifier = extractChannelIdentifier(channelUrl);
  if (!identifier) return null;
  
  // If already a channel ID, use it directly
  if (identifier.type === 'id') {
    return identifier.value;
  }
  
  // Otherwise fetch the channel page to get the canonical channel ID
  let pageUrl: string;
  if (identifier.type === 'handle') {
    pageUrl = `https://www.youtube.com/@${identifier.value}`;
  } else {
    pageUrl = `https://www.youtube.com/c/${identifier.value}`;
  }
  
  try {
    const response = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    
    const html = await response.text();
    
    // Look for canonical channel ID
    const patterns = [
      /<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[a-zA-Z0-9_-]+)"/,
      /"channelId":"(UC[a-zA-Z0-9_-]+)"/,
      /"externalId":"(UC[a-zA-Z0-9_-]+)"/,
      /channel\/(UC[a-zA-Z0-9_-]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        console.log(`Found expected channel ID: ${match[1]}`);
        return match[1];
      }
    }
  } catch (error) {
    console.error(`Error fetching channel page for ID:`, error);
  }
  
  return null;
}

// Verify that the stream belongs to the expected channel
function verifyStreamOwnership(html: string, expectedChannelId: string | null, channelName: string): { isOwned: boolean; reason: string } {
  if (!expectedChannelId) {
    // If we couldn't get the expected channel ID, fall back to name matching
    const authorPatterns = [
      /"author":"([^"]+)"/,
      /"ownerChannelName":"([^"]+)"/,
      /"channelName":"([^"]+)"/,
      /<link itemprop="name" content="([^"]+)">/,
    ];
    
    for (const pattern of authorPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const author = match[1].toLowerCase().replace(/\s+/g, '');
        const expected = channelName.toLowerCase().replace(/\s+/g, '');
        
        // Check if names are similar (allowing for minor differences)
        if (author.includes(expected) || expected.includes(author) || 
            author === expected) {
          return { isOwned: true, reason: `name_match:${match[1]}` };
        } else {
          console.log(`Name mismatch: stream author="${match[1]}" vs expected="${channelName}"`);
          return { isOwned: false, reason: `name_mismatch:${match[1]}` };
        }
      }
    }
    
    return { isOwned: false, reason: 'no_author_found' };
  }
  
  // Check videoOwnerChannelId (most reliable)
  const ownerIdMatch = html.match(/"videoOwnerChannelId":"(UC[a-zA-Z0-9_-]+)"/);
  if (ownerIdMatch) {
    if (ownerIdMatch[1] === expectedChannelId) {
      return { isOwned: true, reason: 'videoOwnerChannelId_match' };
    } else {
      console.log(`Channel ID mismatch: stream owner="${ownerIdMatch[1]}" vs expected="${expectedChannelId}"`);
      return { isOwned: false, reason: `channelId_mismatch:${ownerIdMatch[1]}` };
    }
  }
  
  // Check ownerChannelId
  const ownerMatch = html.match(/"ownerChannelId":"(UC[a-zA-Z0-9_-]+)"/);
  if (ownerMatch) {
    if (ownerMatch[1] === expectedChannelId) {
      return { isOwned: true, reason: 'ownerChannelId_match' };
    } else {
      console.log(`Owner ID mismatch: stream owner="${ownerMatch[1]}" vs expected="${expectedChannelId}"`);
      return { isOwned: false, reason: `ownerId_mismatch:${ownerMatch[1]}` };
    }
  }

  // Safer fallback: extract channelId ONLY from the videoDetails object.
  // This avoids false positives from recommended videos elsewhere in the HTML.
  const videoDetailsBlock = html.match(/"videoDetails":\{[\s\S]*?\}/);
  if (videoDetailsBlock?.[0]) {
    const vdChannelId = videoDetailsBlock[0].match(/"channelId":"(UC[a-zA-Z0-9_-]+)"/);
    if (vdChannelId?.[1]) {
      if (vdChannelId[1] === expectedChannelId) {
        return { isOwned: true, reason: 'videoDetails_channelId_match' };
      }
      console.log(`videoDetails channelId mismatch: "${vdChannelId[1]}" vs expected "${expectedChannelId}"`);
      return { isOwned: false, reason: `videoDetails_channelId_mismatch:${vdChannelId[1]}` };
    }
  }

  // IMPORTANT: When an expectedChannelId is provided, we require a definitive owner id match.
  // Using generic "channelId" or author name matching can false-positive due to recommended videos
  // embedded in the HTML.
  return { isOwned: false, reason: 'no_definitive_owner_id' };
}

// Check live status by fetching the channel's /live page
async function checkLiveStatus(channelUrl: string, channelName: string, storedChannelId: string | null): Promise<{
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

  // Use stored channel ID if available, otherwise try to get it from the channel page
  let expectedChannelId = storedChannelId;
  if (!expectedChannelId) {
    expectedChannelId = await getExpectedChannelId(channelUrl);
    console.log(`No stored channel ID, fetched from page: ${expectedChannelId || 'not found'}`);
  } else {
    console.log(`Using stored channel ID: ${expectedChannelId}`);
  }
  console.log(`Expected channel ID for ${channelName}: ${expectedChannelId || 'not found'}`);

  // Build the /live URL
  // CRITICAL: If we have a stored/expected channel ID (UC...), always prefer the canonical
  // /channel/<UC...>/live endpoint. In practice this is the most reliable way to get an owned
  // live redirect; the @handle/live page often surfaces featured/hosted lives.
  let livePageUrl: string;
  if (expectedChannelId) {
    livePageUrl = `https://www.youtube.com/channel/${expectedChannelId}/live`;
  } else if (identifier.type === 'handle') {
    livePageUrl = `https://www.youtube.com/@${identifier.value}/live`;
  } else if (identifier.type === 'id') {
    livePageUrl = `https://www.youtube.com/channel/${identifier.value}/live`;
  } else {
    livePageUrl = `https://www.youtube.com/c/${identifier.value}/live`;
  }

  console.log(`Checking live page: ${livePageUrl} for ${channelName}`);

  try {
    const defaultHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Upgrade-Insecure-Requests': '1',
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    
    const response = await fetch(livePageUrl, {
      headers: defaultHeaders,
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    
    const html = await response.text();
    const finalUrl = response.url;
    
    console.log(`Final URL for ${channelName}: ${finalUrl}`);

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

    // Only check for explicit NOT LIVE if the page has these indicators
    // Be lenient - don't block if we're not sure
    let definitelyNotLive = false;
    for (const indicator of notLiveIndicators) {
      // Only consider it NOT LIVE if the indicator appears AND there's no contradicting LIVE indicator nearby
      if (html.includes(indicator.text)) {
        // Double check for live indicators
        const hasLiveIndicator = html.includes('"isLive":true') || 
                                  html.includes('"isLiveNow":true') ||
                                  html.includes('"BADGE_STYLE_TYPE_LIVE_NOW"');
        
        if (!hasLiveIndicator) {
          console.log(`${channelName} is NOT LIVE - Found indicator: ${indicator.name}`);
          definitelyNotLive = true;
          break;
        }
      }
    }

    if (definitelyNotLive) {
      return { isLive: false, liveStreamUrl: null, liveStreamTitle: null, liveStreamThumbnail: null, detectedBy: 'not_live_indicator' };
    }

    // Check for LIVE indicators
    let isLive = false;
    let detectedBy = '';

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
        const isReplay = html.includes('"isReplay":true') || html.includes('live_chat_replay');
        if (!isReplay) {
          isLive = true;
          detectedBy = `json:${name}`;
          console.log(`${channelName} is LIVE! Detected via: ${name}`);
          break;
        }
      }
    }

    // Check for active live chat
    if (!isLive) {
      const hasLiveChat = html.includes('/live_chat?') && !html.includes('live_chat_replay');
      const hasRealtimeChat = html.includes('"liveChatContinuation"') && !html.includes('"isReplay":true');
      
      if (hasLiveChat || hasRealtimeChat) {
        isLive = true;
        detectedBy = 'live_chat_active';
        console.log(`${channelName} is LIVE! Detected via active live chat`);
      }
    }

    // Check if redirected to /watch page (strong indicator of live)
    if (!isLive && finalUrl.includes('/watch')) {
      const hasVideoDetails = html.includes('"videoDetails"');
      const hasLiveElements = html.includes('"liveBadgeRenderer"') || 
                              html.includes('"isLive"') ||
                              html.includes('"lengthSeconds":"0"');
      
      if (hasVideoDetails || hasLiveElements) {
        isLive = true;
        detectedBy = 'watch_redirect';
        console.log(`${channelName} is LIVE! Detected via /watch redirect`);
      }
    }

    // If not live, return early
    if (!isLive) {
      console.log(`${channelName} - No live indicators found`);
      return { isLive: false, liveStreamUrl: null, liveStreamTitle: null, liveStreamThumbnail: null, detectedBy: 'no_live_indicators' };
    }

    // Extract video ID (needed for definitive ownership verification)
    const videoId = extractVideoId(html, finalUrl, expectedChannelId);
    
    // If we have an expectedChannelId (manual channel id), require a watch-page verification.
    // The /live page often lacks videoOwnerChannelId and can false-positive from recommendations.
    if (expectedChannelId && !videoId) {
      console.log(`${channelName} - Live indicators found but no video ID; cannot verify ownership, marking as NOT LIVE`);
      return {
        isLive: false,
        liveStreamUrl: null,
        liveStreamTitle: null,
        liveStreamThumbnail: null,
        detectedBy: detectedBy + '_no_video_id_for_verification',
      };
    }

    // Build watch URL (if we have it)
    let liveStreamUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : livePageUrl;

    // If channel ID is provided and we have a videoId, verify ownership on the watch page
    // (most reliable place for videoOwnerChannelId).
    let ownershipHtml = html;
    if (expectedChannelId && videoId) {
      try {
        const watchRes = await fetch(liveStreamUrl, {
          headers: defaultHeaders,
          redirect: 'follow',
        });
        ownershipHtml = await watchRes.text();
      } catch (e: any) {
        console.log(`${channelName} - Failed to fetch watch page for ownership verification: ${e?.message || e}`);
      }
    }

    // *** CRITICAL: Verify stream ownership ***
    let ownership = verifyStreamOwnership(ownershipHtml, expectedChannelId, channelName);

    // If we have a manual channel id and HTML-based checks can't find definitive owner IDs,
    // fall back to oEmbed for the specific watch URL.
    if (!ownership.isOwned && expectedChannelId && videoId && ownership.reason === 'no_definitive_owner_id') {
      const o = await verifyOwnershipViaOEmbed(liveStreamUrl, expectedChannelId);
      if (o.ok) {
        ownership = { isOwned: true, reason: o.reason };
      } else {
        ownership = { isOwned: false, reason: `${ownership.reason}|${o.reason}` };
      }
    }
    console.log(`${channelName} - Ownership check: ${ownership.isOwned ? 'OWNED' : 'NOT OWNED'} (${ownership.reason})`);

    // If ownership verification fails, attempt a strict fallback:
    // - Find an owned LIVE videoId on /streams (channel-scoped)
    // - Verify ownership on the watch page
    if (!ownership.isOwned && expectedChannelId) {
      const fallbackVideoId = await findOwnedLiveVideoIdFromStreamsPage(expectedChannelId, defaultHeaders, channelName);
      if (fallbackVideoId) {
        const fallbackWatchUrl = `https://www.youtube.com/watch?v=${fallbackVideoId}`;
        try {
          const watchRes = await fetch(fallbackWatchUrl, {
            headers: defaultHeaders,
            redirect: 'follow',
          });
          const watchHtml = await watchRes.text();
          let fbOwnership = verifyStreamOwnership(watchHtml, expectedChannelId, channelName);

          // If HTML can't provide definitive owner IDs, use oEmbed as the strict fallback.
          if (!fbOwnership.isOwned && fbOwnership.reason === 'no_definitive_owner_id') {
            const o = await verifyOwnershipViaOEmbed(fallbackWatchUrl, expectedChannelId);
            fbOwnership = o.ok
              ? { isOwned: true, reason: o.reason }
              : { isOwned: false, reason: `${fbOwnership.reason}|${o.reason}` };
          }

          console.log(`${channelName} - Streams fallback ownership: ${fbOwnership.isOwned ? 'OWNED' : 'NOT OWNED'} (${fbOwnership.reason})`);

          if (fbOwnership.isOwned) {
            ownership = fbOwnership;
            ownershipHtml = watchHtml;
            liveStreamUrl = fallbackWatchUrl;

            console.log(`${channelName} - Using streams fallback video ID: ${fallbackVideoId}`);
            // NOTE: Keep 'videoId' const untouched; we derive thumbnail from URL later.
          }
        } catch (e: any) {
          console.log(`${channelName} - Streams fallback watch fetch failed: ${e?.message || e}`);
        }
      }
    }

    if (!ownership.isOwned) {
      console.log(`${channelName} - Stream belongs to another channel, marking as NOT LIVE`);
      return {
        isLive: false,
        liveStreamUrl: null,
        liveStreamTitle: null,
        liveStreamThumbnail: null,
        detectedBy: `ownership_failed:${ownership.reason}`,
      };
    }

    // Extract stream info (prefer watch page HTML if we fetched it)
    const titleHtml = expectedChannelId ? ownershipHtml : html;
    let liveStreamTitle = extractStreamTitle(titleHtml);
    const urlVideoIdMatch = liveStreamUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    const thumbVideoId = urlVideoIdMatch?.[1] || videoId || null;
    const liveStreamThumbnail = thumbVideoId ? getStreamThumbnail(thumbVideoId) : null;
    
    // Fallback title if extraction failed
    if (!liveStreamTitle) {
      liveStreamTitle = `${channelName} is Live!`;
    }
    
    if (thumbVideoId) console.log(`${channelName} - LIVE with video ID: ${thumbVideoId}`);
    console.log(`${channelName} - Title: ${liveStreamTitle}`);
    console.log(`${channelName} - Thumbnail: ${liveStreamThumbnail}`);

    return { isLive: true, liveStreamUrl, liveStreamTitle, liveStreamThumbnail, detectedBy: `${detectedBy}_${ownership.reason}` };

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
      .select('id, channel_url, channel_id, is_live, name')
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

    // Process channels in parallel for faster syncing
    const checkPromises = youtubers.map(async (youtuber) => {
      console.log(`\n--- Checking: ${youtuber.name} ---`);
      
      // Pass stored channel_id for reliable ownership verification
      const { isLive, liveStreamUrl, liveStreamTitle, liveStreamThumbnail, detectedBy } = await checkLiveStatus(youtuber.channel_url, youtuber.name, youtuber.channel_id || null);
      
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
        console.log(`Updated ${youtuber.name}: is_live=${isLive}, title=${liveStreamTitle || 'null'}`);
      }

      return { 
        id: youtuber.id, 
        name: youtuber.name, 
        wasLive: youtuber.is_live || false,
        isLive, 
        liveUrl: liveStreamUrl || undefined,
        liveTitle: liveStreamTitle || undefined,
        liveThumbnail: liveStreamThumbnail || undefined,
        detectedBy,
        statusChanged
      };
    });

    // Wait for all checks to complete
    const allResults = await Promise.all(checkPromises);
    results.push(...allResults);

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
