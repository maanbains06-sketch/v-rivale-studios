import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      return 0x00ff88; // Bright neon green
    case "maintenance":
      return 0xffaa00; // Bright amber/orange
    case "offline":
      return 0xff3366; // Bright red/pink
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

function createCountdownBar(countdown: { days: number; hours: number; minutes: number; seconds: number } | null): string {
  if (!countdown) return "";
  
  const { days, hours, minutes, seconds } = countdown;
  
  // Create a visual countdown display
  const daysStr = days > 0 ? `**${days.toString().padStart(2, '0')}**` : "**00**";
  const hoursStr = `**${hours.toString().padStart(2, '0')}**`;
  const minutesStr = `**${minutes.toString().padStart(2, '0')}**`;
  const secondsStr = `**${seconds.toString().padStart(2, '0')}**`;
  
  return `\`\`\`\n┌─────────────────────────────────┐\n│  ${days.toString().padStart(2, '0')} DAYS  │  ${hours.toString().padStart(2, '0')} HRS  │  ${minutes.toString().padStart(2, '0')} MIN  │  ${seconds.toString().padStart(2, '0')} SEC  │\n└─────────────────────────────────┘\n\`\`\``;
}

function createVisualCountdown(countdown: { days: number; hours: number; minutes: number; seconds: number } | null): string {
  if (!countdown) return "*Calculating...*";
  
  const { days, hours, minutes, seconds } = countdown;
  
  let parts = [];
  if (days > 0) parts.push(`***${days}*** days`);
  if (hours > 0) parts.push(`***${hours}*** hours`);
  if (minutes > 0) parts.push(`***${minutes}*** minutes`);
  parts.push(`***${seconds}*** seconds`);
  
  return parts.join(" ┃ ");
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN");
    const DISCORD_STATUS_CHANNEL_ID = Deno.env.get("DISCORD_STATUS_CHANNEL_ID");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!DISCORD_BOT_TOKEN) {
      return new Response(
        JSON.stringify({ error: "Discord bot token not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!DISCORD_STATUS_CHANNEL_ID) {
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
      scheduledEndAt = null,
      messageId = null
    } = body;

    console.log("Processing website status:", { status, usersActive, uptime, messageId });

    const statusColor = getStatusColor(status);
    const statusEmoji = getStatusEmoji(status);
    const statusText = getStatusText(status);
    const timestamp = new Date().toISOString();

    // Build enhanced embed fields with visual separators
    const fields = [];

    // Header separator
    fields.push({
      name: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      value: "✨ ***LIVE WEBSITE STATUS*** ✨",
      inline: false
    });

    // Status field with glow effect
    fields.push({
      name: `${statusEmoji} ▎***STATUS***`,
      value: status === "online" 
        ? `\`\`\`diff\n+ ${statusText}\n\`\`\``
        : status === "maintenance"
        ? `\`\`\`fix\n${statusText}\n\`\`\``
        : `\`\`\`diff\n- ${statusText}\n\`\`\``,
      inline: true
    });

    // Users Active field
    fields.push({
      name: "👥 ▎***USERS ACTIVE***",
      value: `\`\`\`css\n[ ${usersActive} Online ]\n\`\`\``,
      inline: true
    });

    // Separator
    fields.push({
      name: "\u200B",
      value: "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬",
      inline: false
    });

    // Website link
    fields.push({
      name: "🌐 ▎***WEBSITE LINK***",
      value: `**[🔗 ${websiteUrl.replace('https://', '')}](${websiteUrl})**`,
      inline: true
    });

    // Uptime field
    fields.push({
      name: "⏱️ ▎***UPTIME***",
      value: `\`\`\`yaml\n${uptime}\n\`\`\``,
      inline: true
    });

    // Add maintenance countdown section ONLY when under maintenance
    if (status === "maintenance" && maintenanceCountdown) {
      fields.push({
        name: "\u200B",
        value: "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬",
        inline: false
      });

      fields.push({
        name: "⏳ ▎***MAINTENANCE COUNTDOWN***",
        value: createCountdownBar(maintenanceCountdown),
        inline: false
      });

      // Add remaining time in text format
      fields.push({
        name: "🔄 ***Time Remaining***",
        value: `> ${createVisualCountdown(maintenanceCountdown)}`,
        inline: false
      });
    }

    // Footer separator
    fields.push({
      name: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      value: "\u200B",
      inline: false
    });

    // Build the enhanced embed
    const embed = {
      color: statusColor,
      author: {
        name: "✨ SkyLife Roleplay India ✨",
        icon_url: "https://skyliferoleplay.com/images/slrp-logo.png"
      },
      title: "🌐 ***WEBSITE STATUS*** 🌐",
      description: customMessage 
        ? `> *${customMessage}*` 
        : status === "online" 
          ? "> ✅ ***All systems operational! Website is live.***"
          : status === "maintenance"
          ? "> 🔧 ***Scheduled maintenance in progress. Please wait...***"
          : "> ⚠️ ***Website is currently unavailable.***",
      fields,
      thumbnail: {
        url: "https://skyliferoleplay.com/images/slrp-logo.png"
      },
      image: {
        url: "https://skyliferoleplay.com/images/social-card.jpg"
      },
      footer: {
        text: "🤖 SkyLife Status Bot • Live Updates",
        icon_url: "https://skyliferoleplay.com/images/slrp-logo.png"
      },
      timestamp
    };

    // Create button components
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
      console.log("Editing existing message:", messageId);
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
      } else {
        console.log("Edit failed, creating new message");
      }
    }

    // Create new message if needed
    if (!discordResponse) {
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
      console.error("Discord API error:", discordResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to send Discord message", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const discordData = await discordResponse.json();
    console.log(`Status ${isEdit ? 'updated' : 'sent'}:`, discordData.id);

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
        message: `Website status ${isEdit ? 'updated' : 'sent'} successfully`
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
