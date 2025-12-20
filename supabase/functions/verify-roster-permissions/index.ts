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
    const { discordId, department } = await req.json();

    if (!discordId) {
      return new Response(
        JSON.stringify({ canEdit: false, error: 'Discord ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN');
    const DISCORD_SERVER_ID = Deno.env.get('DISCORD_SERVER_ID');
    const OWNER_DISCORD_ID = Deno.env.get('OWNER_DISCORD_ID') || '833680146510381097';

    // Check if this is the owner - they have full access
    if (discordId === OWNER_DISCORD_ID) {
      console.log(`Owner access granted for Discord ID: ${discordId}`);
      return new Response(
        JSON.stringify({ canEdit: true, isOwner: true, roles: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!DISCORD_BOT_TOKEN || !DISCORD_SERVER_ID) {
      console.error('Discord credentials not configured');
      return new Response(
        JSON.stringify({ canEdit: false, error: 'Discord not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Fetch user's roles from Discord
    console.log(`Fetching Discord roles for user: ${discordId} in guild: ${DISCORD_SERVER_ID}`);
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${DISCORD_SERVER_ID}/members/${discordId}`,
      {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`User ${discordId} not found in guild`);
        return new Response(
          JSON.stringify({ canEdit: false, error: 'User not found in Discord server', roles: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error(`Discord API error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ canEdit: false, error: 'Failed to fetch Discord data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const member = await response.json();
    const userRoles: string[] = member.roles || [];
    console.log(`User ${discordId} has roles: ${userRoles.join(', ')}`);

    // Define department role mappings
    const departmentRoles: Record<string, string> = {
      police: '1451442274037923960',
      ems: '1451442460910817371',
      fire: '1451442569018998916',
      doj: '1451442686115581963',
      mechanic: '1451442834229039104',
      pdm: '1451747382592012380',
    };

    // Check if user has the required role for the department
    const requiredRole = departmentRoles[department];
    const canEdit = requiredRole ? userRoles.includes(requiredRole) : false;

    console.log(`Department: ${department}, Required role: ${requiredRole}, Can edit: ${canEdit}`);

    return new Response(
      JSON.stringify({ 
        canEdit, 
        isOwner: false, 
        roles: userRoles,
        hasRequiredRole: canEdit,
        requiredRole 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error verifying roster permissions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ canEdit: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
