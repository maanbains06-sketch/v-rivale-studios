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
      console.error('Invalid Discord ID format:', discordId);
      return new Response(
        JSON.stringify({ error: 'Invalid Discord ID format. Please enter your Discord User ID (17-19 digits), not your username.', isMember: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const botToken = Deno.env.get('DISCORD_BOT_TOKEN');
    const serverId = Deno.env.get('DISCORD_SERVER_ID');

    if (!botToken) {
      console.error('DISCORD_BOT_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Discord bot not configured', isMember: false }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!serverId) {
      console.error('DISCORD_SERVER_ID not configured');
      return new Response(
        JSON.stringify({ error: 'Discord server not configured', isMember: false }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Checking membership for Discord ID: ${discordId} in server: ${serverId}`);

    // First, verify the bot can access the guild
    const guildResponse = await fetch(
      `https://discord.com/api/v10/guilds/${serverId}`,
      {
        headers: {
          'Authorization': `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!guildResponse.ok) {
      const guildError = await guildResponse.text();
      console.error(`Bot cannot access guild ${serverId}. Status: ${guildResponse.status}, Error: ${guildError}`);
      
      if (guildResponse.status === 403) {
        console.error('Bot does not have permission to access this guild. Ensure bot is in the server.');
      } else if (guildResponse.status === 401) {
        console.error('Invalid bot token');
      }
      
      // Return a more helpful error but don't block signup if bot has issues
      return new Response(
        JSON.stringify({ 
          error: 'Discord verification temporarily unavailable. Please try again or contact support.',
          isMember: false,
          debug: `Guild access failed: ${guildResponse.status}`
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const guildData = await guildResponse.json();
    console.log(`Bot verified access to guild: ${guildData.name} (${guildData.id})`);

    // Check if user is a member of the Discord server using the bot
    const memberResponse = await fetch(
      `https://discord.com/api/v10/guilds/${serverId}/members/${discordId}`,
      {
        headers: {
          'Authorization': `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`Member lookup response status: ${memberResponse.status}`);

    if (memberResponse.status === 200) {
      const memberData = await memberResponse.json();
      console.log(`User ${discordId} IS a member of the server. Username: ${memberData.user?.username}`);
      return new Response(
        JSON.stringify({ 
          isMember: true, 
          username: memberData.user?.username,
          globalName: memberData.user?.global_name,
          nickname: memberData.nick,
          avatar: memberData.user?.avatar,
          roles: memberData.roles 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (memberResponse.status === 404) {
      console.log(`User ${discordId} is NOT a member of server ${serverId}`);
      return new Response(
        JSON.stringify({ 
          isMember: false, 
          reason: 'You are not a member of our Discord server. Please join our Discord server first, then try again.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (memberResponse.status === 403) {
      const errorBody = await memberResponse.text();
      console.error(`Discord API 403 Forbidden when fetching member. Bot may lack GUILD_MEMBERS intent. Error: ${errorBody}`);
      
      // This typically means the bot doesn't have GUILD_MEMBERS privileged intent enabled
      return new Response(
        JSON.stringify({ 
          error: 'Discord verification requires bot configuration update. Please contact an administrator.',
          isMember: false,
          debug: 'Bot requires GUILD_MEMBERS intent'
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const errorBody = await memberResponse.text();
      console.error(`Discord API error: ${memberResponse.status} - ${errorBody}`);
      return new Response(
        JSON.stringify({ 
          error: 'Unable to verify Discord membership. Please try again.',
          isMember: false,
          debug: `API error: ${memberResponse.status}`
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error checking Discord membership:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Unable to verify Discord membership. Please try again.',
        isMember: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
