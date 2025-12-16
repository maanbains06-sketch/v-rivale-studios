import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
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

interface WidgetMember {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  status: string; // online, idle, dnd
  avatar_url: string;
}

// Simple in-memory rate limiting (resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 requests per minute per discord_id

const isRateLimited = (discordId: string): boolean => {
  const now = Date.now();
  const entry = rateLimitMap.get(discordId);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(discordId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }
  
  entry.count++;
  return false;
};

const getAvatarUrl = (user: DiscordUser): string => {
  if (user.avatar) {
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`;
  }
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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const discordBotToken = Deno.env.get("DISCORD_BOT_TOKEN");
    const guildId = Deno.env.get("DISCORD_SERVER_ID");
    const cronSecret = Deno.env.get("CRON_SECRET");

    if (!discordBotToken) {
      throw new Error("Discord Bot Token not configured");
    }

    if (!guildId) {
      throw new Error("Discord Server ID not configured");
    }

    // Authentication check
    const authHeader = req.headers.get("authorization");
    const apiKeyHeader = req.headers.get("x-api-key");
    
    // Check if this is a server-side call (cron, bot, or internal)
    const isServerCall = apiKeyHeader === cronSecret || 
                         apiKeyHeader === discordBotToken ||
                         authHeader === `Bearer ${supabaseServiceKey}`;
    
    // For webhook/presence updates, require authentication
    let isAuthenticated = isServerCall;
    let authenticatedUserId: string | null = null;
    
    // If not a server call, check for user authentication
    if (!isServerCall && authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      // Verify the JWT token using anon key client
      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
      
      if (!authError && user) {
        // Check if user is a staff member
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: staffMember } = await supabase
          .from("staff_members")
          .select("id, discord_id, user_id")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .single();
        
        if (staffMember) {
          isAuthenticated = true;
          authenticatedUserId = user.id;
          console.log(`Authenticated staff user: ${user.id}`);
        }
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if this is a webhook call from a Discord bot with presence updates
    let presenceUpdates: PresenceUpdate[] = [];
    let isWebhookUpdate = false;

    try {
      const body = await req.json();
      
      // For webhook presence updates, require authentication
      if (body.presenceUpdates || body.discord_id || body.staff_member_id) {
        if (!isAuthenticated) {
          console.log("Rejected unauthenticated presence update attempt");
          return new Response(
            JSON.stringify({ error: "Unauthorized", message: "Authentication required for presence updates" }),
            {
              status: 401,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            }
          );
        }
      }
      
      if (body.presenceUpdates && Array.isArray(body.presenceUpdates)) {
        // Handle website presence updates (staff_member_id based)
        for (const update of body.presenceUpdates) {
          // Rate limit check per discord_id
          if (update.discord_id && isRateLimited(update.discord_id)) {
            console.log(`Rate limited presence update for ${update.discord_id}`);
            continue;
          }
          
          if (update.staff_member_id && !update.discord_id) {
            // For authenticated user updates, verify they're updating their own presence
            if (authenticatedUserId) {
              const { data: staff } = await supabase
                .from("staff_members")
                .select("discord_id, user_id")
                .eq("id", update.staff_member_id)
                .single();
              
              // Only allow updating own presence unless server call
              if (staff?.discord_id && (isServerCall || staff.user_id === authenticatedUserId)) {
                if (!isRateLimited(staff.discord_id)) {
                  presenceUpdates.push({
                    discord_id: staff.discord_id,
                    is_online: update.is_online,
                    status: update.status || (update.is_online ? 'online' : 'offline')
                  });
                }
              }
            } else if (isServerCall) {
              // Server calls can update any presence
              const { data: staff } = await supabase
                .from("staff_members")
                .select("discord_id")
                .eq("id", update.staff_member_id)
                .single();
              
              if (staff?.discord_id && !isRateLimited(staff.discord_id)) {
                presenceUpdates.push({
                  discord_id: staff.discord_id,
                  is_online: update.is_online,
                  status: update.status || (update.is_online ? 'online' : 'offline')
                });
              }
            }
          } else if (update.discord_id && !isRateLimited(update.discord_id)) {
            presenceUpdates.push(update);
          }
        }
        isWebhookUpdate = true;
        console.log(`Received ${presenceUpdates.length} presence updates (authenticated: ${isServerCall ? 'server' : 'user'})`);
      } else if (body.discord_id && typeof body.is_online === 'boolean') {
        // Single presence update - rate limit check
        if (!isRateLimited(body.discord_id)) {
          presenceUpdates = [{ 
            discord_id: body.discord_id, 
            is_online: body.is_online,
            status: body.status || (body.is_online ? 'online' : 'offline')
          }];
          isWebhookUpdate = true;
          console.log(`Received single presence update for ${body.discord_id}: ${body.is_online ? 'online' : 'offline'}`);
        } else {
          console.log(`Rate limited single presence update for ${body.discord_id}`);
        }
      } else if (body.staff_member_id && typeof body.is_online === 'boolean') {
        // Website presence update via staff_member_id - verify ownership
        const { data: staff } = await supabase
          .from("staff_members")
          .select("discord_id, user_id")
          .eq("id", body.staff_member_id)
          .single();
        
        // Only allow if server call or user owns this staff record
        if (staff?.discord_id && (isServerCall || staff.user_id === authenticatedUserId)) {
          if (!isRateLimited(staff.discord_id)) {
            presenceUpdates = [{
              discord_id: staff.discord_id,
              is_online: body.is_online,
              status: body.status || (body.is_online ? 'online' : 'offline')
            }];
            isWebhookUpdate = true;
            console.log(`Received website presence update for staff ${body.staff_member_id}: ${body.is_online ? 'online' : 'offline'}`);
          }
        } else if (!isServerCall && staff?.user_id !== authenticatedUserId) {
          console.log(`Rejected presence update: user ${authenticatedUserId} cannot update staff ${body.staff_member_id}`);
          return new Response(
            JSON.stringify({ error: "Forbidden", message: "Cannot update another user's presence" }),
            {
              status: 403,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            }
          );
        }
      }
    } catch {
      // No body or invalid JSON - proceed with widget sync (only for server calls)
      if (!isServerCall) {
        return new Response(
          JSON.stringify({ error: "Unauthorized", message: "Authentication required" }),
          {
            status: 401,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
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

    if (isWebhookUpdate) {
      // Process webhook presence updates from Discord bot
      for (const update of presenceUpdates) {
        const staffInfo = staffByDiscordId.get(update.discord_id);
        
        if (!staffInfo) {
          console.log(`Discord ID ${update.discord_id} not found in staff members`);
          continue;
        }

        // Upsert presence record with actual status
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
    } else {
      // Use Discord Widget API to get REAL online presence
      // This only shows members who are actually online and have enabled "Display in widget"
      console.log("Fetching real presence from Discord Widget API...");
      
      let onlineDiscordIds = new Set<string>();
      let widgetMemberData = new Map<string, WidgetMember>();
      
      try {
        const widgetResponse = await fetch(
          `https://discord.com/api/v10/guilds/${guildId}/widget.json`
        );

        if (widgetResponse.ok) {
          const widgetData = await widgetResponse.json();
          console.log(`Widget shows ${widgetData.members?.length || 0} online members`);
          
          // Widget members are ACTUALLY online
          if (widgetData.members && Array.isArray(widgetData.members)) {
            widgetData.members.forEach((member: WidgetMember) => {
              if (member.id) {
                onlineDiscordIds.add(member.id);
                widgetMemberData.set(member.id, member);
              }
            });
          }
        } else {
          console.log("Widget API not available (widget may be disabled). Using Gateway presence fallback...");
          
          // Fallback: Try to get presence from bot's perspective using Gateway status
          // The REST API doesn't provide presence, but we can check if we have recent updates
          const { data: recentPresence } = await supabase
            .from("discord_presence")
            .select("discord_id, is_online, updated_at")
            .gt("updated_at", new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Last 5 minutes
          
          if (recentPresence) {
            recentPresence.forEach((p) => {
              if (p.is_online) {
                onlineDiscordIds.add(p.discord_id);
              }
            });
            console.log(`Found ${onlineDiscordIds.size} recently online from database cache`);
          }
        }
      } catch (error) {
        console.error("Error fetching widget data:", error);
      }

      // Also fetch guild members for profile updates
      try {
        const guildResponse = await fetch(
          `https://discord.com/api/v10/guilds/${guildId}/members?limit=1000`,
          {
            headers: {
              Authorization: `Bot ${discordBotToken}`,
            },
          }
        );

        if (guildResponse.ok) {
          const guildMembers = await guildResponse.json();
          
          // Create a map of Discord user data for profile updates
          const discordUserData = new Map<string, DiscordUser>();
          guildMembers.forEach((member: any) => {
            if (member.user?.id) {
              discordUserData.set(member.user.id, member.user);
            }
          });

          // Update each staff member
          for (const [discordId, staffInfo] of staffByDiscordId) {
            const discordUser = discordUserData.get(discordId);
            const isOnline = onlineDiscordIds.has(discordId);
            const widgetMember = widgetMemberData.get(discordId);
            
            // Determine status from widget or default
            let status = 'offline';
            if (isOnline && widgetMember) {
              status = widgetMember.status; // online, idle, dnd
            } else if (isOnline) {
              status = 'online';
            }
            
            // Update staff member's Discord profile info if we have data
            if (discordUser) {
              const newDisplayName = discordUser.global_name || discordUser.username;
              const newUsername = discordUser.username;
              const newAvatar = getAvatarUrl(discordUser);
              
              const { error: updateError } = await supabase
                .from("staff_members")
                .update({
                  name: newDisplayName,
                  discord_username: newUsername,
                  discord_avatar: newAvatar,
                  ...(isOnline ? { last_seen: now } : {}),
                })
                .eq("id", staffInfo.id);
              
              if (!updateError) {
                profilesUpdated++;
              }
            }
            
            // Upsert presence record with REAL online status
            const { error: upsertError } = await supabase
              .from("discord_presence")
              .upsert({
                discord_id: discordId,
                staff_member_id: staffInfo.id,
                is_online: isOnline,
                status: status,
                last_online_at: isOnline ? now : undefined,
                updated_at: now,
              }, {
                onConflict: 'discord_id'
              });

            if (!upsertError) {
              updatedCount++;
              if (isOnline) {
                console.log(`${staffInfo.name} is ONLINE (${status})`);
              }
            } else {
              console.error(`Error upserting presence for ${discordId}:`, upsertError);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching guild members:", error);
      }
    }

    const onlineStaff = Array.from(staffByDiscordId.values()).filter(s => {
      // Check database for current online status
      return true;
    });

    console.log(`Successfully updated ${updatedCount} presence records and ${profilesUpdated} profiles`);

    return new Response(
      JSON.stringify({
        message: "Discord presence synced successfully",
        totalStaff: staffMembers.length,
        updated: updatedCount,
        profilesUpdated: profilesUpdated,
        timestamp: now,
        mode: isWebhookUpdate ? 'webhook' : 'widget',
        note: isWebhookUpdate 
          ? 'Received presence from Discord bot' 
          : 'Using Discord Widget API - ensure server widget is enabled and staff have "Display in widget" on',
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
