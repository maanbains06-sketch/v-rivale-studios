import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { discordId } = await req.json();
    
    if (!discordId) {
      console.error('No Discord ID provided');
      return new Response(
        JSON.stringify({ error: 'Discord ID is required', isMember: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const botToken = Deno.env.get('DISCORD_BOT_TOKEN');
    const serverId = Deno.env.get('DISCORD_SERVER_ID');

    if (!botToken || !serverId) {
      console.error('Missing DISCORD_BOT_TOKEN or DISCORD_SERVER_ID');
      return new Response(
        JSON.stringify({ error: 'Server configuration error', isMember: false }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Checking membership for Discord ID: ${discordId} in server: ${serverId}`);

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
      const errorText = await response.text();
      console.error(`Discord API error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: `Discord API error: ${response.status}`, isMember: false }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error checking Discord membership:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, isMember: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
