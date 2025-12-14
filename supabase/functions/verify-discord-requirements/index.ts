import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    if (!discordBotToken) {
      console.error("Discord Bot Token not configured");
      return new Response(
        JSON.stringify({ 
          error: "Discord Bot Token not configured",
          isInServer: false,
          hasWhitelistRole: false
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!discordServerId || !whitelistRoleId) {
      console.error("Discord Server ID or Whitelist Role ID not configured");
      return new Response(
        JSON.stringify({ 
          error: "Discord configuration incomplete",
          isInServer: false,
          hasWhitelistRole: false
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { discordId } = await req.json();

    if (!discordId) {
      return new Response(
        JSON.stringify({ 
          error: "Discord ID is required",
          isInServer: false,
          hasWhitelistRole: false
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Checking Discord requirements for user: ${discordId} in server: ${discordServerId}`);

    // Fetch guild member data to check if user is in server and has roles
    const memberResponse = await fetch(
      `https://discord.com/api/v10/guilds/${discordServerId}/members/${discordId}`,
      {
        headers: {
          Authorization: `Bot ${discordBotToken}`,
        },
      }
    );

    if (!memberResponse.ok) {
      if (memberResponse.status === 404) {
        console.log(`User ${discordId} not found in server ${discordServerId}`);
        return new Response(
          JSON.stringify({ 
            isInServer: false,
            hasWhitelistRole: false,
            reason: "User not in Discord server"
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      
      const errorText = await memberResponse.text();
      console.error(`Discord API error: ${memberResponse.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ 
          error: `Discord API error: ${memberResponse.status}`,
          isInServer: false,
          hasWhitelistRole: false
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const memberData = await memberResponse.json();
    const userRoles: string[] = memberData.roles || [];
    
    const isInServer = true;
    const hasWhitelistRole = userRoles.includes(whitelistRoleId);

    console.log(`User ${discordId} - In Server: ${isInServer}, Has Whitelist Role: ${hasWhitelistRole}`);
    console.log(`User roles: ${userRoles.join(", ")}`);
    console.log(`Looking for whitelist role: ${whitelistRoleId}`);

    return new Response(
      JSON.stringify({
        isInServer,
        hasWhitelistRole,
        username: memberData.user?.username || null,
        nickname: memberData.nick || null,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in verify-discord-requirements function:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        isInServer: false,
        hasWhitelistRole: false
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
