import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AssignRoleRequest {
  applicationType: string;
  discordUserId: string;
}

// Map application types to their Discord role IDs (from environment variables)
const applicationRoleMap: Record<string, string> = {
  'whitelist': 'DISCORD_WHITELIST_ROLE_ID',
  'Whitelist': 'DISCORD_WHITELIST_ROLE_ID',
  'police': 'DISCORD_POLICE_ROLE_ID',
  'Police Department': 'DISCORD_POLICE_ROLE_ID',
  'ems': 'DISCORD_EMS_ROLE_ID',
  'EMS': 'DISCORD_EMS_ROLE_ID',
  'mechanic': 'DISCORD_MECHANIC_ROLE_ID',
  'Mechanic': 'DISCORD_MECHANIC_ROLE_ID',
  'judge': 'DISCORD_DOJ_JUDGE_ROLE_IDS',
  'DOJ - Judge': 'DISCORD_DOJ_JUDGE_ROLE_IDS',
  'attorney': 'DISCORD_DOJ_ATTORNEY_ROLE_IDS',
  'DOJ - Attorney': 'DISCORD_DOJ_ATTORNEY_ROLE_IDS',
  'creator': 'DISCORD_CREATOR_ROLE_ID_1',
  'Creator': 'DISCORD_CREATOR_ROLE_ID_1',
  'firefighter': 'DISCORD_FIRE_ROLE_ID',
  'Firefighter': 'DISCORD_FIRE_ROLE_ID',
  'fire': 'DISCORD_FIRE_ROLE_ID',
  'state': 'DISCORD_STATE_ROLE_ID',
  'State Department': 'DISCORD_STATE_ROLE_ID',
  'pdm': 'DISCORD_PDM_ROLE_ID',
  'PDM': 'DISCORD_PDM_ROLE_ID',
  'weazel_news': 'DISCORD_WEAZEL_ROLE_ID',
  'Weazel News': 'DISCORD_WEAZEL_ROLE_ID',
  'weazel': 'DISCORD_WEAZEL_ROLE_ID',
};

// Excluded application types that should NOT get auto role assignment
const excludedTypes = ['staff', 'Staff', 'gang', 'Gang RP', 'Gang Roleplay', 'ban_appeal'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN');
    const DISCORD_SERVER_ID = Deno.env.get('DISCORD_SERVER_ID');

    if (!DISCORD_BOT_TOKEN) {
      console.error('DISCORD_BOT_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Discord bot not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!DISCORD_SERVER_ID) {
      console.error('DISCORD_SERVER_ID not configured');
      return new Response(
        JSON.stringify({ error: 'Discord server ID not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { applicationType, discordUserId }: AssignRoleRequest = await req.json();

    console.log(`Processing auto role assignment for ${applicationType}, Discord ID: ${discordUserId}`);

    // Check if this is an excluded type
    if (excludedTypes.includes(applicationType)) {
      console.log(`Application type ${applicationType} is excluded from auto role assignment`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Application type excluded from auto role assignment',
          skipped: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the role environment variable key
    const roleEnvKey = applicationRoleMap[applicationType];
    if (!roleEnvKey) {
      console.error(`Unknown application type: ${applicationType}`);
      return new Response(
        JSON.stringify({ 
          error: `Unknown application type: ${applicationType}`,
          success: false 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the role ID(s) from environment
    const roleIdValue = Deno.env.get(roleEnvKey);
    if (!roleIdValue) {
      console.error(`${roleEnvKey} not configured`);
      return new Response(
        JSON.stringify({ 
          error: `Role not configured for ${applicationType}`,
          success: false 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse multiple role IDs (comma-separated)
    const roleIds = roleIdValue.split(',').map(id => id.trim()).filter(id => id);
    console.log(`Assigning ${roleIds.length} role(s): ${roleIds.join(', ')}`);

    const results: { roleId: string; success: boolean; error?: string }[] = [];

    // Assign each role
    for (const roleId of roleIds) {
      const endpoint = `https://discord.com/api/v10/guilds/${DISCORD_SERVER_ID}/members/${discordUserId}/roles/${roleId}`;
      
      console.log(`Assigning role ${roleId} to user ${discordUserId}`);

      try {
        const discordResponse = await fetch(endpoint, {
          method: 'PUT',
          headers: {
            'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
            'Content-Type': 'application/json',
          },
        });

        if (!discordResponse.ok) {
          const errorText = await discordResponse.text();
          console.error(`Failed to assign role ${roleId}: ${discordResponse.status} - ${errorText}`);
          results.push({ roleId, success: false, error: errorText });
        } else {
          console.log(`Successfully assigned role ${roleId}`);
          results.push({ roleId, success: true });
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Error assigning role ${roleId}:`, errorMsg);
        results.push({ roleId, success: false, error: errorMsg });
      }

      // Small delay between role assignments to avoid rate limits
      if (roleIds.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 250));
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`Role assignment complete: ${successCount} succeeded, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: successCount > 0,
        message: `Assigned ${successCount}/${roleIds.length} role(s) successfully`,
        results,
        applicationType,
        discordUserId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in auto-assign-application-role:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
