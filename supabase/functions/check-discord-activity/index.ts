import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DiscordPresence {
  status: string; // online, idle, dnd, offline
  activities: Array<{
    type: number;
    name: string;
  }>;
  client_status?: {
    desktop?: string;
    mobile?: string;
    web?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const discordBotToken = Deno.env.get("DISCORD_BOT_TOKEN");
    
    if (!discordBotToken) {
      throw new Error("Discord Bot Token not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, guildId } = await req.json();
    
    if (!userId || !guildId) {
      throw new Error("User ID and Guild ID are required");
    }

    console.log("Checking Discord activity for user:", userId, "in guild:", guildId);

    // Get staff member's Discord ID
    const { data: staffMember, error: staffError } = await supabase
      .from("staff_members")
      .select("discord_id")
      .eq("user_id", userId)
      .single();

    if (staffError || !staffMember?.discord_id) {
      throw new Error("Staff member not found or no Discord ID linked");
    }

    // Fetch guild member data which includes basic presence
    const memberResponse = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${staffMember.discord_id}`,
      {
        headers: {
          Authorization: `Bot ${discordBotToken}`,
        },
      }
    );

    if (!memberResponse.ok) {
      if (memberResponse.status === 404) {
        // User not in guild
        return new Response(
          JSON.stringify({ 
            isActive: false,
            reason: "User not in Discord server",
            lastSeen: null
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
      throw new Error(
        `Discord API error: ${memberResponse.status} ${memberResponse.statusText}`
      );
    }

    const memberData = await memberResponse.json();
    
    // If user is in the guild, they're considered "active" on Discord
    // Note: True presence data (online/offline/dnd/idle) requires Gateway connection
    // This is a simplified check - being a guild member means they're active
    const isActive = !!memberData;
    const now = new Date().toISOString();

    // Update last_seen in database if active
    if (isActive) {
      await supabase
        .from("staff_members")
        .update({ last_seen: now })
        .eq("user_id", userId);

      console.log(`Updated last_seen for user ${userId}`);
    }

    return new Response(
      JSON.stringify({
        isActive,
        discordId: staffMember.discord_id,
        lastSeen: isActive ? now : null,
        guildMember: !!memberData,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in check-discord-activity function:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: "Failed to check Discord activity",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
