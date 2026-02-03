import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ServerStatusRequest {
  status: "online" | "maintenance" | "offline";
  players?: number;
  maxPlayers?: number;
  connectCommand?: string;
  nextRestart?: string;
  uptime?: string;
  customMessage?: string;
  websiteUrl?: string;
  discordUrl?: string;
}

function getStatusColor(status: string): number {
  switch (status) {
    case "online":
      return 0x00ff00; // Green
    case "maintenance":
      return 0xffff00; // Yellow
    case "offline":
      return 0xff0000; // Red
    default:
      return 0x808080; // Gray
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

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN");
    const DISCORD_STATUS_CHANNEL_ID = Deno.env.get("DISCORD_STATUS_CHANNEL_ID");

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

    const body: ServerStatusRequest = await req.json();
    const {
      status,
      players = 0,
      maxPlayers = 64,
      connectCommand = "connect cfx.re/join/skylife",
      nextRestart = "N/A",
      uptime = "N/A",
      customMessage,
      websiteUrl = "https://skyliferoleplay.com",
      discordUrl = "https://discord.gg/skyliferp"
    } = body;

    console.log("Sending server status to Discord:", { status, players, maxPlayers });

    const statusColor = getStatusColor(status);
    const statusEmoji = getStatusEmoji(status);
    const statusText = getStatusText(status);
    const timestamp = new Date().toISOString();

    // Build the embed message like the reference image
    const embed = {
      color: statusColor,
      author: {
        name: "SkyLife Roleplay India",
        icon_url: "https://skyliferoleplay.com/images/slrp-logo.png"
      },
      title: "🎮 SkyLife Roleplay Server Status",
      description: customMessage || "Real-time server status update from SkyLife Status Bot",
      fields: [
        {
          name: "▎ STATUS",
          value: `${statusEmoji} **${statusText}**`,
          inline: true
        },
        {
          name: "▎ PLAYERS",
          value: `👥 **${players}/${maxPlayers}**`,
          inline: true
        },
        {
          name: "━━━━━━━━━━━━━━━━━━━━━━━━━━",
          value: "\u200B",
          inline: false
        },
        {
          name: "▎ F8 CONNECT COMMAND",
          value: `\`\`\`${connectCommand}\`\`\``,
          inline: false
        },
        {
          name: "▎ NEXT RESTART",
          value: `⏰ ${nextRestart}`,
          inline: true
        },
        {
          name: "▎ UPTIME",
          value: `⏱️ ${uptime}`,
          inline: true
        }
      ],
      image: {
        url: "https://skyliferoleplay.com/images/social-card.jpg"
      },
      footer: {
        text: "SkyLife Status Bot • Updated",
        icon_url: "https://skyliferoleplay.com/images/slrp-logo.png"
      },
      timestamp
    };

    // Create button components for Connect and Website
    const components = [
      {
        type: 1, // Action Row
        components: [
          {
            type: 2, // Button
            style: 5, // Link
            label: "🌐 Website",
            url: websiteUrl
          },
          {
            type: 2,
            style: 5,
            label: "💬 Discord",
            url: discordUrl
          }
        ]
      }
    ];

    // Send the message to Discord
    const discordResponse = await fetch(
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
    console.log("Server status message sent successfully:", discordData.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: discordData.id,
        message: "Server status sent to Discord successfully"
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
