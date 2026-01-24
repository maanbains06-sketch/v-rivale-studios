import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RemoveRoleRequest {
  discordId: string;
  roleType: "whitelist" | "pd" | "ems" | "mechanic" | "state" | "doj-attorney" | "doj-judge";
}

// Map role types to environment variable names
const roleEnvMap: Record<string, string> = {
  "whitelist": "DISCORD_WHITELIST_ROLE_ID",
  "pd": "DISCORD_PD_ROLE_ID",
  "ems": "DISCORD_EMS_ROLE_ID",
  "mechanic": "DISCORD_MECHANIC_ROLE_ID",
  "state": "DISCORD_STATE_ROLE_ID",
  "doj-attorney": "DISCORD_DOJ_ATTORNEY_ROLE_ID",
  "doj-judge": "DISCORD_DOJ_JUDGE_ROLE_ID",
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const discordBotToken = Deno.env.get("DISCORD_BOT_TOKEN");
    const discordServerId = Deno.env.get("DISCORD_SERVER_ID");

    if (!discordBotToken || !discordServerId) {
      console.error("Missing Discord configuration");
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Discord configuration incomplete" 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { discordId, roleType }: RemoveRoleRequest = await req.json();

    if (!discordId) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Discord ID is required" 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!roleType || !roleEnvMap[roleType]) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Invalid or missing role type" 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate Discord ID format (17-19 digits)
    if (!/^\d{17,19}$/.test(discordId)) {
      console.error("Invalid Discord ID format:", discordId);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Invalid Discord ID format" 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get the role ID from environment
    const roleId = Deno.env.get(roleEnvMap[roleType]);
    
    if (!roleId) {
      console.log(`Role ID not configured for ${roleType}, skipping role removal`);
      return new Response(
        JSON.stringify({ 
          success: true,
          message: `Role ${roleType} not configured, skipping removal`,
          skipped: true
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Removing ${roleType} role (${roleId}) from user ${discordId} in server ${discordServerId}`);

    // Remove the role using Discord API (DELETE instead of PUT)
    const roleResponse = await fetch(
      `https://discord.com/api/v10/guilds/${discordServerId}/members/${discordId}/roles/${roleId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bot ${discordBotToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!roleResponse.ok) {
      const errorText = await roleResponse.text();
      console.error(`Discord API error: ${roleResponse.status} - ${errorText}`);
      
      // Check if user is not in server (404) - this is not a failure case
      if (roleResponse.status === 404) {
        return new Response(
          JSON.stringify({ 
            success: true,
            message: "User not in server or role not found, no action needed",
            skipped: true
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Check if bot doesn't have permission (403)
      if (roleResponse.status === 403) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: "Bot lacks permission to remove this role. Check role hierarchy."
          }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Failed to remove Discord role: ${roleResponse.status}` 
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Successfully removed ${roleType} role from Discord user ${discordId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${roleType} role removed successfully`,
        discordId,
        roleType,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in remove-discord-role function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
