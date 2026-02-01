import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ManagePendingRoleRequest {
  discordId: string;
  action: "add" | "remove";
  applicationId?: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const discordBotToken = Deno.env.get("DISCORD_BOT_TOKEN");
    const discordServerId = Deno.env.get("DISCORD_SERVER_ID");
    const pendingRoleId = Deno.env.get("DISCORD_PENDING_WHITELIST_ROLE_ID");

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

    if (!pendingRoleId) {
      console.log("Pending whitelist role ID not configured, skipping");
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "Pending role not configured, skipping",
          skipped: true
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { discordId, action, applicationId }: ManagePendingRoleRequest = await req.json();

    if (!discordId) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Discord ID is required" 
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

    if (!action || !["add", "remove"].includes(action)) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Invalid action. Must be 'add' or 'remove'" 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`${action === 'add' ? 'Assigning' : 'Removing'} pending whitelist role (${pendingRoleId}) ${action === 'add' ? 'to' : 'from'} user ${discordId}`);

    // Use PUT for add, DELETE for remove
    const method = action === "add" ? "PUT" : "DELETE";
    
    const roleResponse = await fetch(
      `https://discord.com/api/v10/guilds/${discordServerId}/members/${discordId}/roles/${pendingRoleId}`,
      {
        method,
        headers: {
          Authorization: `Bot ${discordBotToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!roleResponse.ok) {
      const errorText = await roleResponse.text();
      console.error(`Discord API error: ${roleResponse.status} - ${errorText}`);
      
      // User not in server (404) - not a failure for remove action
      if (roleResponse.status === 404) {
        if (action === "remove") {
          return new Response(
            JSON.stringify({ 
              success: true,
              message: "User not in server or role not found, no action needed",
              skipped: true
            }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
        return new Response(
          JSON.stringify({ 
            success: false,
            error: "User is not in the Discord server"
          }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Permission denied
      if (roleResponse.status === 403) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: "Bot lacks permission to manage this role. Check role hierarchy."
          }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Failed to ${action} Discord role: ${roleResponse.status}` 
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Successfully ${action === 'add' ? 'assigned' : 'removed'} pending whitelist role ${action === 'add' ? 'to' : 'from'} Discord user ${discordId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Pending whitelist role ${action === 'add' ? 'assigned' : 'removed'} successfully`,
        discordId,
        action,
        applicationId,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in manage-pending-whitelist-role function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
