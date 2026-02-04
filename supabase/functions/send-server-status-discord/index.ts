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
    hours: number;
    minutes: number;
    seconds: number;
  } | null;
  scheduledEndAt?: string | null;
  messageId?: string | null; // For editing existing messages
}

function getStatusColor(status: string): number {
  switch (status) {
    case "online":
      return 0x22c55e; // Vibrant Green
    case "maintenance":
      return 0xf59e0b; // Amber/Orange
    case "offline":
      return 0xef4444; // Red
    default:
      return 0x6b7280; // Gray
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
      return "Online";
    case "maintenance":
      return "Under Maintenance";
    case "offline":
      return "Offline";
    default:
      return "Unknown";
  }
}

function formatCountdown(countdown: { hours: number; minutes: number; seconds: number } | null): string {
  if (!countdown) return "";
  const parts = [];
  if (countdown.hours > 0) parts.push(`${countdown.hours}h`);
  if (countdown.minutes > 0) parts.push(`${countdown.minutes}m`);
  if (countdown.seconds > 0 || parts.length === 0) parts.push(`${countdown.seconds}s`);
  return parts.join(" ");
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN");
    const DISCORD_STATUS_CHANNEL_ID = Deno.env.get("DISCORD_STATUS_CHANNEL_ID");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!DISCORD_BOT_TOKEN) {
      console.error("Discord bot token not configured");
      return new Response(
        JSON.stringify({ error: "Discord bot token not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!DISCORD_STATUS_CHANNEL_ID) {
      console.error("Discord status channel ID not configured");
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

    console.log("Processing website status for Discord:", { status, usersActive, uptime, messageId });

    const statusColor = getStatusColor(status);
    const statusEmoji = getStatusEmoji(status);
    const statusText = getStatusText(status);
    const timestamp = new Date().toISOString();

    // Build embed fields - all text in bold italic format
    const fields = [
      {
        name: "╔══════════════════════════════╗",
        value: "\u200B",
        inline: false
      },
      {
        name: "📊 ***STATUS***",
        value: `${statusEmoji} ***${statusText}***`,
        inline: true
      },
      {
        name: "👥 ***USERS ACTIVE***",
        value: `***${usersActive}*** *online now*`,
        inline: true
      },
      {
        name: "╠══════════════════════════════╣",
        value: "\u200B",
        inline: false
      },
      {
        name: "🌐 ***WEBSITE***",
        value: `[***Visit SkyLife Roleplay***](${websiteUrl})`,
        inline: false
      },
      {
        name: "⏱️ ***UPTIME***",
        value: `***${uptime}***`,
        inline: true
      }
    ];

    // Add maintenance countdown section ONLY when under maintenance
    if (status === "maintenance" && (maintenanceCountdown || scheduledEndAt)) {
      const countdownText = maintenanceCountdown 
        ? formatCountdown(maintenanceCountdown)
        : "Calculating...";
      
      fields.push({
        name: "⏳ ***MAINTENANCE COUNTDOWN***",
        value: `🔄 ***${countdownText}*** *remaining*`,
        inline: true
      });
    }

    // Add decorative footer separator
    fields.push({
      name: "╚══════════════════════════════╝",
      value: "\u200B",
      inline: false
    });

    // Build the enhanced embed message
    const embed = {
      color: statusColor,
      author: {
        name: "✨ SkyLife Roleplay India ✨",
        icon_url: "https://skyliferoleplay.com/images/slrp-logo.png"
      },
      title: "🌐 ***Website Status*** 🌐",
      description: customMessage 
        ? `*${customMessage}*` 
        : `*Real-time status updates from SkyLife Roleplay*\n\n${status === "online" ? "✅ *All systems operational!*" : status === "maintenance" ? "🔧 *Scheduled maintenance in progress*" : "⚠️ *Website is currently unavailable*"}`,
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
        type: 1, // Action Row
        components: [
          {
            type: 2, // Button
            style: 5, // Link
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

    // If we have a message ID, try to edit the existing message
    if (messageId) {
      console.log("Attempting to edit existing message:", messageId);
      const editResponse = await fetch(
        `https://discord.com/api/v10/channels/${DISCORD_STATUS_CHANNEL_ID}/messages/${messageId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            embeds: [embed],
            components
          }),
        }
      );
      
      if (editResponse.ok) {
        discordResponse = editResponse;
        isEdit = true;
      } else {
        console.log("Edit failed, creating new message");
      }
    }

    // Create new message if no messageId or edit failed
    if (!discordResponse) {
      discordResponse = await fetch(
        `https://discord.com/api/v10/channels/${DISCORD_STATUS_CHANNEL_ID}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            embeds: [embed],
            components
          }),
        }
      );
      isEdit = false;
    }

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();
      console.error("Discord API error:", discordResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: "Failed to send Discord message", 
          details: errorText 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const discordData = await discordResponse.json();
    console.log(`Website status ${isEdit ? 'updated' : 'sent'} successfully:`, discordData.id);

    // Store the message ID in the database for future edits
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
        message: `Website status ${isEdit ? 'updated' : 'sent'} to Discord successfully`
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in send-server-status-discord:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
