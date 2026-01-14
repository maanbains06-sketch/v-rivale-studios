import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AssignRoleRequest {
  applicationId: string;
  discordId?: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const discordBotToken = Deno.env.get("DISCORD_BOT_TOKEN");
    const discordServerId = Deno.env.get("DISCORD_SERVER_ID");
    const whitelistRoleId = Deno.env.get("DISCORD_WHITELIST_ROLE_ID");

    if (!discordBotToken || !discordServerId || !whitelistRoleId) {
      console.error("Missing Discord configuration");
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Discord configuration incomplete" 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { applicationId, discordId: providedDiscordId }: AssignRoleRequest = await req.json();

    if (!applicationId && !providedDiscordId) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Application ID or Discord ID is required" 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let discordId = providedDiscordId;

    // If applicationId provided, get the discord_id from the application
    if (applicationId) {
      // Get the application to find the user
      const { data: application, error: appError } = await supabase
        .from("whitelist_applications")
        .select("user_id, discord, status")
        .eq("id", applicationId)
        .single();

      if (appError || !application) {
        console.error("Application not found:", appError);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: "Application not found" 
          }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Check if application is approved
      if (application.status !== "approved") {
        console.log("Application not approved, status:", application.status);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: "Application is not approved" 
          }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Get the user's discord_id from auth.users metadata
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
        application.user_id
      );

      if (userError || !userData.user) {
        console.error("User not found:", userError);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: "User not found" 
          }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      discordId = userData.user.user_metadata?.discord_id;
    }

    if (!discordId || !/^\d{17,19}$/.test(discordId)) {
      console.error("Invalid Discord ID:", discordId);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Invalid or missing Discord ID for user" 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Assigning whitelist role ${whitelistRoleId} to user ${discordId} in server ${discordServerId}`);

    // Assign the whitelist role using Discord API
    const roleResponse = await fetch(
      `https://discord.com/api/v10/guilds/${discordServerId}/members/${discordId}/roles/${whitelistRoleId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bot ${discordBotToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!roleResponse.ok) {
      const errorText = await roleResponse.text();
      console.error(`Discord API error: ${roleResponse.status} - ${errorText}`);
      
      // Check if user is not in server
      if (roleResponse.status === 404) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: "User is not in the Discord server. They must join the server first." 
          }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Failed to assign Discord role: ${roleResponse.status}` 
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Successfully assigned whitelist role to Discord user ${discordId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Whitelist role assigned successfully",
        discordId,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in assign-whitelist-role function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});