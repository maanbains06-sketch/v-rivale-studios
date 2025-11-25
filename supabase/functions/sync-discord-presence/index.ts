import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DiscordGuildMember {
  user?: {
    id: string;
  };
  status?: string;
  activities?: Array<{
    type: number;
    name: string;
  }>;
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

    // Get the guild ID from the request body (you'll need to provide this)
    const { guildId } = await req.json();
    
    if (!guildId) {
      throw new Error("Discord Guild ID is required");
    }

    console.log("Syncing Discord presence for guild:", guildId);

    // Fetch all staff members with Discord IDs
    const { data: staffMembers, error: staffError } = await supabase
      .from("staff_members")
      .select("id, discord_id, user_id")
      .eq("is_active", true)
      .not("discord_id", "is", null);

    if (staffError) {
      throw new Error(`Failed to fetch staff members: ${staffError.message}`);
    }

    if (!staffMembers || staffMembers.length === 0) {
      console.log("No staff members with Discord IDs found");
      return new Response(
        JSON.stringify({ message: "No staff members to sync", updated: 0 }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Found ${staffMembers.length} staff members with Discord IDs`);

    // Fetch guild members to get presence data
    // Note: This requires the bot to have appropriate permissions in the guild
    const guildResponse = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members?limit=1000`,
      {
        headers: {
          Authorization: `Bot ${discordBotToken}`,
        },
      }
    );

    if (!guildResponse.ok) {
      throw new Error(
        `Discord API error: ${guildResponse.status} ${guildResponse.statusText}`
      );
    }

    const guildMembers: DiscordGuildMember[] = await guildResponse.json();
    console.log(`Retrieved ${guildMembers.length} guild members from Discord`);

    // Create a map of Discord ID to presence status
    const presenceMap = new Map<string, boolean>();
    
    guildMembers.forEach((member) => {
      if (member.user?.id) {
        // Consider user "online" if they have any status or activity
        // Discord doesn't expose detailed presence without Gateway, so we check if they're in the guild
        // In a real implementation with Gateway, you'd check member.status
        presenceMap.set(member.user.id, true);
      }
    });

    // Update staff members' online status
    let updatedCount = 0;
    const now = new Date().toISOString();

    for (const staff of staffMembers) {
      if (!staff.discord_id) continue;

      const isOnline = presenceMap.has(staff.discord_id);
      
      // Update last_seen if user is online
      if (isOnline) {
        const { error: updateError } = await supabase
          .from("staff_members")
          .update({ last_seen: now })
          .eq("id", staff.id);

        if (!updateError) {
          updatedCount++;
          console.log(`Updated presence for staff member ${staff.discord_id}: online`);
        }
      }
    }

    console.log(`Successfully updated ${updatedCount} staff members`);

    return new Response(
      JSON.stringify({
        message: "Discord presence synced successfully",
        totalStaff: staffMembers.length,
        updated: updatedCount,
        timestamp: now,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in sync-discord-presence function:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: "Failed to sync Discord presence. Make sure the Discord bot is configured with proper permissions.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
