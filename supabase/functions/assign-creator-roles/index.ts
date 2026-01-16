import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AssignCreatorRolesRequest {
  discordId: string;
  applicationId?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN');
    const DISCORD_SERVER_ID = Deno.env.get('DISCORD_SERVER_ID');
    const CREATOR_ROLE_ID_1 = Deno.env.get('DISCORD_CREATOR_ROLE_ID_1');
    const CREATOR_ROLE_ID_2 = Deno.env.get('DISCORD_CREATOR_ROLE_ID_2');

    console.log('Checking Discord configuration...');
    console.log('DISCORD_BOT_TOKEN exists:', !!DISCORD_BOT_TOKEN);
    console.log('DISCORD_SERVER_ID:', DISCORD_SERVER_ID);
    console.log('CREATOR_ROLE_ID_1:', CREATOR_ROLE_ID_1);
    console.log('CREATOR_ROLE_ID_2:', CREATOR_ROLE_ID_2);

    if (!DISCORD_BOT_TOKEN || !DISCORD_SERVER_ID) {
      console.error('Missing Discord configuration');
      return new Response(
        JSON.stringify({ error: 'Discord configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!CREATOR_ROLE_ID_1 && !CREATOR_ROLE_ID_2) {
      console.error('No creator role IDs configured');
      return new Response(
        JSON.stringify({ error: 'Creator role IDs not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { discordId, applicationId }: AssignCreatorRolesRequest = await req.json();

    if (!discordId || !/^\d{17,19}$/.test(discordId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid Discord ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Assigning creator roles to Discord user ${discordId}`);

    const roleIds = [CREATOR_ROLE_ID_1, CREATOR_ROLE_ID_2].filter(Boolean);
    const results: { roleId: string; success: boolean; error?: string }[] = [];

    for (const roleId of roleIds) {
      try {
        const response = await fetch(
          `https://discord.com/api/v10/guilds/${DISCORD_SERVER_ID}/members/${discordId}/roles/${roleId}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok || response.status === 204) {
          console.log(`Successfully assigned role ${roleId} to user ${discordId}`);
          results.push({ roleId: roleId!, success: true });
        } else if (response.status === 404) {
          const errorText = await response.text();
          console.error(`User not found or role not found: ${errorText}`);
          results.push({ roleId: roleId!, success: false, error: 'User or role not found' });
        } else {
          const errorText = await response.text();
          console.error(`Failed to assign role ${roleId}: ${errorText}`);
          results.push({ roleId: roleId!, success: false, error: errorText });
        }

        // Rate limit delay
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (err) {
        console.error(`Error assigning role ${roleId}:`, err);
        results.push({ roleId: roleId!, success: false, error: String(err) });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const allSuccess = successCount === roleIds.length;

    return new Response(
      JSON.stringify({
        success: allSuccess,
        rolesAssigned: successCount,
        totalRoles: roleIds.length,
        results,
        message: allSuccess
          ? `Successfully assigned ${successCount} creator role(s)`
          : `Assigned ${successCount}/${roleIds.length} roles`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in assign-creator-roles:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
