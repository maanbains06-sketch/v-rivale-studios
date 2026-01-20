import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Allowed Discord role IDs for roster VIEW access
const VIEW_ROLE_IDS = [
  "1463143859935772672",
  "1431378586203590687",
  "1431379430797869207",
  "1431378794077487304",
  "1281554246281461792",
  "1281554458563575859",
  "1438258435052535920",
  "1317457907620646972",
];

// Allowed Discord role IDs for roster EDIT access
const EDIT_ROLE_IDS = [
  "1463145983448973519",
  "1451442834229039104",
  "1463143254324285583",
  "1451442686115581963",
  "1451442569018998916",
  "1451442460910817371",
  "1451442274037923960",
  "1451747382592012380",
];

// Owner Discord ID - always has full access
const OWNER_DISCORD_ID = "833680146510381097";

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const discordBotToken = Deno.env.get("DISCORD_BOT_TOKEN");
    const discordServerId = Deno.env.get("DISCORD_SERVER_ID");

    if (!discordBotToken || !discordServerId) {
      console.error("Discord configuration missing");
      return new Response(
        JSON.stringify({ 
          hasAccess: false,
          canEdit: false,
          error: "Discord configuration incomplete"
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { discordId } = await req.json();

    if (!discordId) {
      return new Response(
        JSON.stringify({ 
          hasAccess: false,
          canEdit: false,
          error: "Discord ID is required"
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if owner - full access
    if (discordId === OWNER_DISCORD_ID) {
      console.log(`Owner ${discordId} has full roster access`);
      return new Response(
        JSON.stringify({
          hasAccess: true,
          canEdit: true,
          isOwner: true,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Checking roster access for Discord ID: ${discordId}`);

    // Fetch guild member data
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
        console.log(`User ${discordId} not found in server`);
        return new Response(
          JSON.stringify({ 
            hasAccess: false,
            canEdit: false,
            reason: "User not in Discord server"
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      
      const errorText = await memberResponse.text();
      console.error(`Discord API error: ${memberResponse.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ 
          hasAccess: false,
          canEdit: false,
          error: `Discord API error: ${memberResponse.status}`
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const memberData = await memberResponse.json();
    const userRoles: string[] = memberData.roles || [];
    
    // Check if user has any of the allowed VIEW roles
    const hasAccess = userRoles.some(roleId => VIEW_ROLE_IDS.includes(roleId));
    
    // Check if user has any of the allowed EDIT roles
    const canEdit = userRoles.some(roleId => EDIT_ROLE_IDS.includes(roleId));

    console.log(`User ${discordId} roles: ${userRoles.join(", ")}`);
    console.log(`Has roster view access: ${hasAccess}, Can edit: ${canEdit}`);

    return new Response(
      JSON.stringify({
        hasAccess: hasAccess || canEdit, // Edit access implies view access
        canEdit,
        username: memberData.user?.username || null,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in verify-roster-access function:", error);
    return new Response(
      JSON.stringify({
        hasAccess: false,
        canEdit: false,
        error: error.message
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
