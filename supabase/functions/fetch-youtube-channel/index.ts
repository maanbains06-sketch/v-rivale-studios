import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface YouTubeChannelInfo {
  channelId: string;
  channelName: string;
  avatarUrl: string;
  subscriberCount?: string;
  description?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { channelUrl } = await req.json();

    if (!channelUrl) {
      throw new Error("Channel URL is required");
    }

    // Extract channel identifier from URL
    const patterns = [
      { regex: /youtube\.com\/channel\/([^\/\?]+)/, type: 'id' },
      { regex: /youtube\.com\/c\/([^\/\?]+)/, type: 'custom' },
      { regex: /youtube\.com\/@([^\/\?]+)/, type: 'handle' },
      { regex: /youtube\.com\/user\/([^\/\?]+)/, type: 'user' }
    ];

    let channelIdentifier: string | null = null;
    let identifierType: string = '';

    for (const pattern of patterns) {
      const match = channelUrl.match(pattern.regex);
      if (match) {
        channelIdentifier = match[1];
        identifierType = pattern.type;
        break;
      }
    }

    if (!channelIdentifier) {
      throw new Error("Could not parse YouTube channel URL");
    }

    // Fetch the channel page to scrape basic info
    let pageUrl = channelUrl;
    if (!pageUrl.includes('youtube.com')) {
      pageUrl = `https://www.youtube.com/@${channelIdentifier}`;
    }

    const response = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch YouTube page: ${response.status}`);
    }

    const html = await response.text();

    // Extract channel name from various places in the HTML
    let channelName = channelIdentifier.replace(/@/, '').replace(/-/g, ' ');
    
    // Try to find the channel name in the page title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    if (titleMatch) {
      const title = titleMatch[1];
      // Remove " - YouTube" suffix
      const cleanTitle = title.replace(/ - YouTube$/, '').trim();
      if (cleanTitle && !cleanTitle.includes('404') && !cleanTitle.includes('Error')) {
        channelName = cleanTitle;
      }
    }

    // Try to find og:title for more accurate name
    const ogTitleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
    if (ogTitleMatch) {
      channelName = ogTitleMatch[1];
    }

    // Try to find the avatar/profile picture
    let avatarUrl = '';
    
    // Look for profile picture in various patterns
    const avatarPatterns = [
      /"avatar":\{"thumbnails":\[\{"url":"([^"]+)"/,
      /"thumbnails":\[\{"url":"([^"]+)","width":48/,
      /yt-img-shadow"\s+src="([^"]+)"/,
      /<meta property="og:image" content="([^"]+)"/
    ];

    for (const pattern of avatarPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        avatarUrl = match[1];
        // Convert to higher resolution if possible
        avatarUrl = avatarUrl.replace(/=s\d+-/, '=s176-').replace(/=s\d+$/, '=s176');
        break;
      }
    }

    // If no avatar found, use a placeholder based on channel name
    if (!avatarUrl) {
      avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(channelName)}&background=ff0000&color=ffffff&size=176&bold=true`;
    }

    const result: YouTubeChannelInfo = {
      channelId: channelIdentifier,
      channelName,
      avatarUrl,
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error fetching YouTube channel:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});