import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting configuration
const RATE_LIMIT = 20; // requests per minute
const RATE_WINDOW_MS = 60 * 1000; // 1 minute

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);
  
  if (!entry || (now - entry.windowStart) > RATE_WINDOW_MS) {
    rateLimitMap.set(identifier, { count: 1, windowStart: now });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT) {
    return false;
  }
  
  entry.count++;
  return true;
}

// Validate Discord ID format (17-19 digit snowflake)
function isValidDiscordId(id: string): boolean {
  return typeof id === 'string' && /^\d{17,19}$/.test(id);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client identifier for rate limiting
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    
    // Check rate limit
    if (!checkRateLimit(clientIP)) {
      console.warn(`Rate limit exceeded for Discord verification from IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.', isMember: false }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid request', isMember: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof body !== 'object' || body === null) {
      return new Response(
        JSON.stringify({ error: 'Invalid request', isMember: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { discordId } = body as { discordId: unknown };
    
    if (!discordId) {
      console.error('No Discord ID provided');
      return new Response(
        JSON.stringify({ error: 'Discord ID is required', isMember: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate Discord ID format
    if (!isValidDiscordId(discordId as string)) {
      console.error('Invalid Discord ID format');
      return new Response(
        JSON.stringify({ error: 'Invalid Discord ID format', isMember: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const botToken = Deno.env.get('DISCORD_BOT_TOKEN');
    const serverId = Deno.env.get('DISCORD_SERVER_ID');

    if (!botToken || !serverId) {
      console.error('Missing Discord configuration');
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable', isMember: false }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Checking membership for Discord ID: ${discordId}`);

    // Check if user is a member of the Discord server using the bot
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${serverId}/members/${discordId}`,
      {
        headers: {
          'Authorization': `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status === 200) {
      const memberData = await response.json();
      console.log(`User ${discordId} is a member of the server`);
      return new Response(
        JSON.stringify({ 
          isMember: true, 
          username: memberData.user?.username,
          nickname: memberData.nick,
          roles: memberData.roles 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (response.status === 404) {
      console.log(`User ${discordId} is NOT a member of the server`);
      return new Response(
        JSON.stringify({ isMember: false, reason: 'User is not a member of the Discord server' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.error(`Discord API error: ${response.status}`);
      return new Response(
        JSON.stringify({ error: 'Unable to verify membership', isMember: false }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error checking Discord membership:', error);
    return new Response(
      JSON.stringify({ error: 'Unable to verify membership', isMember: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
