import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VERSION = "v3.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WebsiteStatusRequest {
  status: "online" | "maintenance" | "offline";
  usersActive?: number;
  uptime?: string;
  customMessage?: string;
  websiteUrl?: string;
  discordUrl?: string;
  maintenanceCountdown?: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null;
  scheduledEndAt?: string | null;
  messageId?: string | null;
}

function getStatusColor(status: string): number {
  switch (status) {
    case "online":
      return 0x43b581; // Discord green
    case "maintenance":
      return 0xfaa61a; // Discord amber
    case "offline":
      return 0xf04747; // Discord red
    default:
      return 0x6b7280;
  }
}

function getStatusEmoji(status: string): string {
  switch (status) {
    case "online":
      return "🟢";
    case "maintenance":
      return "🟡";
    case "offline":
      return "🔴";
    default:
      return "⚪";
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case "online":
      return "ONLINE";
    case "maintenance":
      return "UNDER MAINTENANCE";
    case "offline":
      return "OFFLINE";
    default:
      return "UNKNOWN";
  }
}

function createVisualCountdown(countdown: { days: number; hours: number; minutes: number; seconds: number } | null): string {
  if (!countdown) return "```\n⏳ Calculating...\n```";
  
  const { days, hours, minutes, seconds } = countdown;
  
  const d = days.toString().padStart(2, '0');
  const h = hours.toString().padStart(2, '0');
  const m = minutes.toString().padStart(2, '0');
  const s = seconds.toString().padStart(2, '0');
  
  // Visual box countdown with proper formatting
  return `\`\`\`ansi
\u001b[1;33m┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ⏰  ${d}  ┃  ${h}  ┃  ${m}  ┃  ${s}  ┃
┃     DAYS   HRS   MIN   SEC  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\u001b[0m
\`\`\``;
}

function createStatusBox(status: string, emoji: string, statusText: string): string {
  if (status === "online") {
    return `\`\`\`diff
+ ${emoji} ${statusText}
\`\`\``;
  } else if (status === "maintenance") {
    return `\`\`\`fix
${emoji} ${statusText}
\`\`\``;
  } else {
    return `\`\`\`diff
- ${emoji} ${statusText}
\`\`\``;
  }
}

function createUsersBox(count: number): string {
  // Use diff block to create a more "glowing" highlighted background in Discord
  return `\`\`\`diff\n+ 👥 ${count} ONLINE\n\`\`\``;
}

function createUptimeBox(uptime: string): string {
  return `\`\`\`ini\n[ ⏱️ Uptime: ${uptime} ]\n\`\`\``;
}

function createWebsiteLinkBox(url: string): string {
  const cleanUrl = url.replace('https://', '').replace('http://', '');
  return `\`\`\`prolog
🌐 ${cleanUrl}
\`\`\``;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`[${VERSION}] Processing request`);
    
    const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN");
    const DISCORD_STATUS_CHANNEL_ID = Deno.env.get("DISCORD_STATUS_CHANNEL_ID");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!DISCORD_BOT_TOKEN) {
      console.log(`[${VERSION}] Missing DISCORD_BOT_TOKEN`);
      return new Response(
        JSON.stringify({ error: "Discord bot token not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!DISCORD_STATUS_CHANNEL_ID) {
      console.log(`[${VERSION}] Missing DISCORD_STATUS_CHANNEL_ID`);
      return new Response(
        JSON.stringify({ error: "Discord status channel ID not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: WebsiteStatusRequest = await req.json();
    const {
      status,
      usersActive = 0,
      uptime = "N/A",
      customMessage,
      websiteUrl = "https://skyliferoleplay.com",
      discordUrl = "https://discord.gg/skyliferp",
      maintenanceCountdown = null,
      messageId = null
    } = body;

    console.log(`[${VERSION}] Status:`, { status, usersActive, uptime, messageId, maintenanceCountdown });

    const statusColor = getStatusColor(status);
    const statusEmoji = getStatusEmoji(status);
    const statusText = getStatusText(status);
    const timestamp = new Date().toISOString();

    // Build description with highlighted sections
    let description = "";
    
    // Custom message or default
    if (customMessage) {
      description += `> ✨ ***${customMessage}***\n\n`;
    } else if (status === "online") {
      description += "> ✅ ***All systems operational! Website is running smoothly.***\n\n";
    } else if (status === "maintenance") {
      description += "> 🔧 ***Scheduled maintenance in progress. Please wait...***\n\n";
    } else {
      description += "> ⚠️ ***Website is currently unavailable. We're working on it!***\n\n";
    }
    
    // Separator
    description += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
    
    // STATUS section with highlighted background
    description += "**📊 STATUS**\n";
    description += createStatusBox(status, statusEmoji, statusText);
    description += "\n";
    
    // USERS ACTIVE section with highlighted background
    description += "**👥 USERS ACTIVE**\n";
    description += createUsersBox(usersActive);
    description += "\n";
    
    // WEBSITE LINK section
    description += "**🌐 WEBSITE LINK**\n";
    description += createWebsiteLinkBox(websiteUrl);
    description += `[***Click to Visit***](${websiteUrl})\n\n`;
    
    // UPTIME section with highlighted background
    description += "**⏱️ UPTIME**\n";
    description += createUptimeBox(uptime);
    
    // MAINTENANCE COUNTDOWN - only shown during maintenance with visual box
    if (status === "maintenance" && maintenanceCountdown) {
      description += "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
      description += "**⏳ MAINTENANCE COUNTDOWN**\n";
      description += createVisualCountdown(maintenanceCountdown);
    }

    // Build the embed - using description for highlighted fields
    const embed = {
      color: statusColor,
      author: {
        name: "✨ SkyLife Roleplay India ✨",
        icon_url: "https://skyliferoleplay.com/images/slrp-logo.png"
      },
      title: "🌐 ***WEBSITE STATUS*** 🌐",
      description,
      thumbnail: {
        url: "https://skyliferoleplay.com/images/slrp-logo.png"
      },
      image: {
        url: "https://skyliferoleplay.com/images/social-card.jpg"
      },
      footer: {
        text: `🤖 SkyLife Status Bot • Live Updates • ${VERSION}`,
        icon_url: "https://skyliferoleplay.com/images/slrp-logo.png"
      },
      timestamp
    };

    // Button components
    const components = [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 5,
            label: "🌐 Visit Website",
            url: websiteUrl
          },
          {
            type: 2,
            style: 5,
            label: "💬 Join Discord",
            url: discordUrl
          }
        ]
      }
    ];

    let discordResponse: Response | null = null;
    let isEdit = false;

    // Try to edit existing message if we have a message ID
    if (messageId) {
      console.log(`[${VERSION}] Editing message:`, messageId);
      const editResponse = await fetch(
        `https://discord.com/api/v10/channels/${DISCORD_STATUS_CHANNEL_ID}/messages/${messageId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ embeds: [embed], components }),
        }
      );
      
      if (editResponse.ok) {
        discordResponse = editResponse;
        isEdit = true;
        console.log(`[${VERSION}] Edit successful`);
      } else {
        const errText = await editResponse.text();
        console.log(`[${VERSION}] Edit failed:`, editResponse.status, errText);
      }
    }

    // Create new message if needed
    if (!discordResponse) {
      console.log(`[${VERSION}] Creating new message`);
      discordResponse = await fetch(
        `https://discord.com/api/v10/channels/${DISCORD_STATUS_CHANNEL_ID}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ embeds: [embed], components }),
        }
      );
      isEdit = false;
    }

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();
      console.error(`[${VERSION}] Discord error:`, discordResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to send Discord message", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const discordData = await discordResponse.json();
    console.log(`[${VERSION}] Success:`, discordData.id);

    // Store message ID for future edits
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      await supabaseAdmin
        .from('site_settings')
        .upsert({ 
          key: 'discord_status_message_id', 
          value: discordData.id,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: discordData.id,
        isEdit,
        message: `Website status ${isEdit ? 'updated' : 'sent'} successfully`,
        _version: VERSION
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error(`[${VERSION}] Error:`, error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
