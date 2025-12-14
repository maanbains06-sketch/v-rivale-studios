import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DiscordUserRequest {
  discordId: string;
  updateStaffMember?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { discordId, updateStaffMember }: DiscordUserRequest = await req.json();

    console.log("Fetching Discord user info for ID:", discordId);

    const discordBotToken = Deno.env.get("DISCORD_BOT_TOKEN");
    if (!discordBotToken) {
      throw new Error("Discord Bot Token not configured");
    }

    // Fetch Discord user info using Discord API
    const discordResponse = await fetch(`https://discord.com/api/v10/users/${discordId}`, {
      headers: {
        Authorization: `Bot ${discordBotToken}`,
      },
    });

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();
      console.error("Discord API error:", errorText);
      throw new Error(`Discord API error: ${discordResponse.status} ${discordResponse.statusText}`);
    }

    const userData = await discordResponse.json();

    console.log("Discord user data retrieved:", userData);

    // Format the response
    const avatarUrl = userData.avatar 
      ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png?size=256`
      : `https://cdn.discordapp.com/embed/avatars/${userData.discriminator === '0' ? (BigInt(userData.id) >> BigInt(22)) % BigInt(6) : parseInt(userData.discriminator) % 5}.png`;

    const result = {
      id: userData.id,
      username: userData.username,
      discriminator: userData.discriminator,
      globalName: userData.global_name || userData.username,
      avatar: avatarUrl,
      displayName: userData.global_name || userData.username,
    };

    // If updateStaffMember is true, update the database
    if (updateStaffMember) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { error: updateError } = await supabase
        .from("staff_members")
        .update({
          name: result.displayName,
          discord_username: result.username,
          discord_avatar: result.avatar,
        })
        .eq("discord_id", discordId);

      if (updateError) {
        console.error("Error updating staff member:", updateError);
      } else {
        console.log("Staff member updated successfully");
      }
    }

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
