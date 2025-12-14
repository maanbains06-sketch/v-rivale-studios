import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PresenceUpdate {
  discord_id: string;
  is_online: boolean;
  status?: string; // online, idle, dnd, offline
}

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  global_name?: string;
  avatar?: string;
}

const getAvatarUrl = (user: DiscordUser): string => {
  if (user.avatar) {
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`;
  }
  // Default avatar based on discriminator or user ID
  const defaultIndex = user.discriminator === '0' 
    ? (BigInt(user.id) >> BigInt(22)) % BigInt(6)
    : parseInt(user.discriminator) % 5;
  return `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const discordBotToken = Deno.env.get("DISCORD_BOT_TOKEN");
    const guildId = Deno.env.get("DISCORD_SERVER_ID");

    if (!discordBotToken) {
      throw new Error("Discord Bot Token not configured");
    }

    if (!guildId) {
      throw new Error("Discord Server ID not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if this is a webhook call from a Discord bot with presence updates
    let presenceUpdates: PresenceUpdate[] = [];
    let isBulkSync = false;

    try {
      const body = await req.json();
      if (body.presenceUpdates && Array.isArray(body.presenceUpdates)) {
        presenceUpdates = body.presenceUpdates;
        console.log(`Received ${presenceUpdates.length} presence updates from Discord bot`);
      } else if (body.discord_id && typeof body.is_online === 'boolean') {
        // Single presence update
        presenceUpdates = [{ 
          discord_id: body.discord_id, 
          is_online: body.is_online,
          status: body.status || (body.is_online ? 'online' : 'offline')
        }];
        console.log(`Received single presence update for ${body.discord_id}: ${body.is_online ? 'online' : 'offline'}`);
      } else {
        isBulkSync = true;
      }
    } catch {
      isBulkSync = true;
    }

    // Fetch all staff members with Discord IDs
    const { data: staffMembers, error: staffError } = await supabase
      .from("staff_members")
      .select("id, discord_id, name, discord_username, discord_avatar")
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

    // Create a map of discord_id to staff member
    const staffByDiscordId = new Map<string, { id: string; name: string; discord_username?: string; discord_avatar?: string }>();
    staffMembers.forEach((staff) => {
      if (staff.discord_id) {
        staffByDiscordId.set(staff.discord_id, { 
          id: staff.id, 
          name: staff.name,
          discord_username: staff.discord_username,
          discord_avatar: staff.discord_avatar
        });
      }
    });

    let updatedCount = 0;
    let profilesUpdated = 0;
    const now = new Date().toISOString();

    if (isBulkSync) {
      // Bulk sync - fetch guild members from Discord API
      console.log("Performing bulk sync from Discord API...");
      
      try {
        const guildResponse = await fetch(
          `https://discord.com/api/v10/guilds/${guildId}/members?limit=1000`,
          {
            headers: {
              Authorization: `Bot ${discordBotToken}`,
            },
          }
        );

        if (!guildResponse.ok) {
          const errorText = await guildResponse.text();
          console.error(`Discord API error: ${guildResponse.status} - ${errorText}`);
          throw new Error(`Discord API error: ${guildResponse.status}`);
        }

        const guildMembers = await guildResponse.json();
        console.log(`Retrieved ${guildMembers.length} guild members from Discord`);

        // Create a map of Discord user data
        const discordUserData = new Map<string, DiscordUser>();
        guildMembers.forEach((member: any) => {
          if (member.user?.id) {
            discordUserData.set(member.user.id, member.user);
          }
        });

        // Get Discord IDs of members in the guild
        const guildMemberIds = new Set<string>();
        guildMembers.forEach((member: any) => {
          if (member.user?.id) {
            guildMemberIds.add(member.user.id);
          }
        });

        // Update presence and profile info for each staff member
        for (const [discordId, staffInfo] of staffByDiscordId) {
          const isInGuild = guildMemberIds.has(discordId);
          const discordUser = discordUserData.get(discordId);
          
          // Update staff member's Discord profile info if we have data
          if (discordUser) {
            const newDisplayName = discordUser.global_name || discordUser.username;
            const newUsername = discordUser.username;
            const newAvatar = getAvatarUrl(discordUser);
            
            // Update name, username, and avatar from Discord
            const { error: updateError } = await supabase
              .from("staff_members")
              .update({
                name: newDisplayName,
                discord_username: newUsername,
                discord_avatar: newAvatar,
                last_seen: isInGuild ? now : undefined,
              })
              .eq("id", staffInfo.id);
            
            if (!updateError) {
              profilesUpdated++;
              console.log(`Updated Discord profile for ${staffInfo.name} -> ${newDisplayName}`);
            } else {
              console.error(`Error updating profile for ${staffInfo.name}:`, updateError);
            }
          }
          
          // Upsert presence record
          const { error: upsertError } = await supabase
            .from("discord_presence")
            .upsert({
              discord_id: discordId,
              staff_member_id: staffInfo.id,
              is_online: isInGuild, // Consider them potentially online if in guild
              status: isInGuild ? 'online' : 'offline',
              last_online_at: isInGuild ? now : undefined,
              updated_at: now,
            }, {
              onConflict: 'discord_id'
            });

          if (!upsertError) {
            updatedCount++;
          } else {
            console.error(`Error upserting presence for ${discordId}:`, upsertError);
          }

          // Also update staff_members.last_seen
          if (isInGuild && !discordUser) {
            await supabase
              .from("staff_members")
              .update({ last_seen: now })
              .eq("id", staffInfo.id);
          }
        }
      } catch (error) {
        console.error("Error fetching from Discord API:", error);
        // Set all staff to offline if we can't reach Discord
        for (const [discordId, staffInfo] of staffByDiscordId) {
          await supabase
            .from("discord_presence")
            .upsert({
              discord_id: discordId,
              staff_member_id: staffInfo.id,
              is_online: false,
              status: 'offline',
              updated_at: now,
            }, {
              onConflict: 'discord_id'
            });
        }
      }
    } else {
      // Process individual presence updates (from Discord bot webhook)
      for (const update of presenceUpdates) {
        const staffInfo = staffByDiscordId.get(update.discord_id);
        
        if (!staffInfo) {
          console.log(`Discord ID ${update.discord_id} not found in staff members`);
          continue;
        }

        // Fetch user info from Discord API for profile sync
        try {
          const userResponse = await fetch(
            `https://discord.com/api/v10/users/${update.discord_id}`,
            {
              headers: {
                Authorization: `Bot ${discordBotToken}`,
              },
            }
          );

          if (userResponse.ok) {
            const discordUser: DiscordUser = await userResponse.json();
            const newDisplayName = discordUser.global_name || discordUser.username;
            const newUsername = discordUser.username;
            const newAvatar = getAvatarUrl(discordUser);
            
            // Update staff member's name, username, and avatar from Discord
            await supabase
              .from("staff_members")
              .update({
                name: newDisplayName,
                discord_username: newUsername,
                discord_avatar: newAvatar,
                last_seen: update.is_online ? now : undefined,
              })
              .eq("id", staffInfo.id);
            
            profilesUpdated++;
            console.log(`Updated Discord profile for ${staffInfo.name} -> ${newDisplayName}`);
          }
        } catch (error) {
          console.error(`Error fetching user info for ${update.discord_id}:`, error);
        }

        // Upsert presence record
        const { error: upsertError } = await supabase
          .from("discord_presence")
          .upsert({
            discord_id: update.discord_id,
            staff_member_id: staffInfo.id,
            is_online: update.is_online,
            status: update.status || (update.is_online ? 'online' : 'offline'),
            last_online_at: update.is_online ? now : undefined,
            updated_at: now,
          }, {
            onConflict: 'discord_id'
          });

        if (!upsertError) {
          updatedCount++;
          console.log(`Updated presence for ${staffInfo.name} (${update.discord_id}): ${update.status || (update.is_online ? 'online' : 'offline')}`);
        } else {
          console.error(`Error upserting presence for ${update.discord_id}:`, upsertError);
        }

        // Update staff_members.last_seen if online
        if (update.is_online) {
          await supabase
            .from("staff_members")
            .update({ last_seen: now })
            .eq("id", staffInfo.id);
        }
      }
    }

    console.log(`Successfully updated ${updatedCount} presence records and ${profilesUpdated} profiles`);

    return new Response(
      JSON.stringify({
        message: "Discord presence synced successfully",
        totalStaff: staffMembers.length,
        updated: updatedCount,
        profilesUpdated: profilesUpdated,
        timestamp: now,
        mode: isBulkSync ? 'bulk' : 'webhook',
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
        details: "Failed to sync Discord presence",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
