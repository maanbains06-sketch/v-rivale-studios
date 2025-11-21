import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DiscordUserRequest {
  discordId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { discordId }: DiscordUserRequest = await req.json();

    console.log("Fetching Discord user info for ID:", discordId);

    // Fetch Discord user info using Discord API
    const discordResponse = await fetch(`https://discord.com/api/v10/users/${discordId}`, {
      headers: {
        Authorization: `Bot ${Deno.env.get("DISCORD_BOT_TOKEN")}`,
      },
    });

    if (!discordResponse.ok) {
      throw new Error(`Discord API error: ${discordResponse.status} ${discordResponse.statusText}`);
    }

    const userData = await discordResponse.json();

    console.log("Discord user data retrieved:", userData);

    // Format the response
    const result = {
      id: userData.id,
      username: userData.username,
      discriminator: userData.discriminator,
      globalName: userData.global_name || userData.username,
      avatar: userData.avatar 
        ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/${parseInt(userData.discriminator) % 5}.png`,
      displayName: userData.global_name || `${userData.username}#${userData.discriminator}`,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in fetch-discord-user function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Make sure Discord Bot Token is configured and the Discord ID is valid"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
