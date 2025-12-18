import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  global_name: string | null;
  avatar: string | null;
  banner: string | null;
  banner_color: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const discordBotToken = Deno.env.get("DISCORD_BOT_TOKEN");
    if (!discordBotToken) {
      throw new Error("Discord Bot Token not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all active staff members with discord_id
    const { data: staffMembers, error: fetchError } = await supabase
      .from("staff_members")
      .select("id, discord_id, name, discord_username, discord_avatar, discord_banner")
      .eq("is_active", true)
      .not("discord_id", "is", null);

    if (fetchError) {
      throw new Error(`Failed to fetch staff members: ${fetchError.message}`);
    }

    console.log(`Found ${staffMembers?.length || 0} active staff members to sync`);

    const results: Array<{ staffId: string; name: string; success: boolean; error?: string; banner?: string | null }> = [];

    for (const staff of staffMembers || []) {
      try {
        // Fetch Discord user info
        const discordResponse = await fetch(
          `https://discord.com/api/v10/users/${staff.discord_id}`,
          {
            headers: {
              Authorization: `Bot ${discordBotToken}`,
            },
          }
        );

        if (!discordResponse.ok) {
          const errorText = await discordResponse.text();
          console.error(`Discord API error for ${staff.name}:`, errorText);
          results.push({
            staffId: staff.id,
            name: staff.name,
            success: false,
            error: `Discord API error: ${discordResponse.status}`,
          });
          continue;
        }

        const userData: DiscordUser = await discordResponse.json();

        // Build avatar URL
        const avatarUrl = userData.avatar
          ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png?size=256`
          : `https://cdn.discordapp.com/embed/avatars/${
              userData.discriminator === "0"
                ? (BigInt(userData.id) >> BigInt(22)) % BigInt(6)
                : parseInt(userData.discriminator) % 5
            }.png`;

        // Build banner URL (if user has a banner)
        let bannerUrl: string | null = null;
        if (userData.banner) {
          // Check if it's an animated banner (starts with a_)
          const extension = userData.banner.startsWith('a_') ? 'gif' : 'png';
          bannerUrl = `https://cdn.discordapp.com/banners/${userData.id}/${userData.banner}.${extension}?size=600`;
        }

        const displayName = userData.global_name || userData.username;

        // Update staff member
        const { error: updateError } = await supabase
          .from("staff_members")
          .update({
            name: displayName,
            discord_username: userData.username,
            discord_avatar: avatarUrl,
            discord_banner: bannerUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", staff.id);

        if (updateError) {
          console.error(`Failed to update ${staff.name}:`, updateError);
          results.push({
            staffId: staff.id,
            name: staff.name,
            success: false,
            error: updateError.message,
          });
        } else {
          console.log(`Updated ${staff.name} -> ${displayName}, banner: ${bannerUrl || 'none'}`);
          results.push({
            staffId: staff.id,
            name: displayName,
            success: true,
            banner: bannerUrl,
          });
        }

        // Rate limit: Discord allows 50 requests per second, but let's be safe
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (err) {
        console.error(`Error processing ${staff.name}:`, err);
        results.push({
          staffId: staff.id,
          name: staff.name,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;
    const bannersFound = results.filter((r) => r.banner).length;

    console.log(`Sync complete: ${successCount} success, ${failCount} failed, ${bannersFound} banners found`);

    return new Response(
      JSON.stringify({
        message: `Synced ${successCount} staff members, ${failCount} failed, ${bannersFound} banners found`,
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error in sync-staff-discord-info:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
