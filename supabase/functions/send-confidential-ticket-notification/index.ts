import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticketId, category, subject, discordId, discordUsername, priority } = await req.json();

    const botToken = Deno.env.get("DISCORD_BOT_TOKEN");
    const channelId = Deno.env.get("DISCORD_CONFIDENTIAL_CHANNEL_ID");
    const ownerDiscordId = Deno.env.get("OWNER_DISCORD_ID");
    const adminRoleId = Deno.env.get("DISCORD_CONFIDENTIAL_ADMIN_ROLE_ID");

    if (!botToken || !channelId) {
      console.error("Missing DISCORD_BOT_TOKEN or DISCORD_CONFIDENTIAL_CHANNEL_ID");
      return new Response(JSON.stringify({ error: "Missing config" }), { status: 500, headers: corsHeaders });
    }

    const categoryLabels: Record<string, string> = {
      personal_conflict: "👥 Personal Conflict with Member",
      staff_complaint: "⚠️ Staff Complaint",
      harassment: "🚨 Harassment / Bullying",
      staff_support: "🤝 Staff Support Request",
      privacy_concern: "🔐 Privacy Concern",
      other_sensitive: "📋 Other Sensitive Matter",
    };

    const priorityConfig: Record<string, { color: number; emoji: string; label: string; bar: string }> = {
      critical: { color: 0xFF0000, emoji: "🔴", label: "CRITICAL", bar: "🟥🟥🟥🟥🟥" },
      high: { color: 0xFF6600, emoji: "🟠", label: "HIGH", bar: "🟧🟧🟧🟧⬛" },
      normal: { color: 0xFFAA00, emoji: "🟡", label: "NORMAL", bar: "🟨🟨🟨⬛⬛" },
      low: { color: 0x888888, emoji: "⚪", label: "LOW", bar: "⬜⬜⬛⬛⬛" },
    };

    // Fetch user's Discord display name
    let displayName = discordUsername || "Unknown User";
    try {
      const userRes = await fetch(`https://discord.com/api/v10/users/${discordId}`, {
        headers: { Authorization: `Bot ${botToken}` },
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        displayName = userData.global_name || userData.username || discordUsername || "Unknown User";
      }
    } catch { /* use fallback */ }

    const imageUrl = "https://obirpzwvnqveddyuulsb.supabase.co/storage/v1/object/public/assets/confidential-support.jpg";
    const pConfig = priorityConfig[priority] || priorityConfig.critical;

    // Build mention tags
    let mentionContent = `<@${discordId}>`;
    if (ownerDiscordId) mentionContent += ` | <@${ownerDiscordId}>`;
    if (adminRoleId) mentionContent += ` | <@&${adminRoleId}>`;

    const divider = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━";

    const headerEmbed = {
      color: pConfig.color,
      description: `# 🔒 CONFIDENTIAL TICKET\n${divider}\n> *A new confidential support ticket has been submitted*\n> *and requires immediate private attention.*\n${divider}`,
      image: { url: imageUrl },
    };

    const detailsEmbed = {
      color: pConfig.color,
      fields: [
        { name: "📝 Subject", value: `> **${subject || "No subject"}**`, inline: false },
        { name: "📂 Category", value: `> ${categoryLabels[category] || category}`, inline: true },
        { name: "⚡ Priority Level", value: `> ${pConfig.emoji} **${pConfig.label}**\n> ${pConfig.bar}`, inline: true },
        { name: "\u200b", value: divider, inline: false },
        { name: "👤 Submitted By", value: `> <@${discordId}>\n> **${displayName}**`, inline: true },
        { name: "🆔 Discord ID", value: `> \`${discordId}\``, inline: true },
        { name: "🎫 Ticket Reference", value: `> \`#${ticketId?.substring(0, 8) || "N/A"}\``, inline: true },
      ],
      footer: { 
        text: "🔐 Skylife Roleplay India • Confidential Support System",
      },
      timestamp: new Date().toISOString(),
    };

    const payload = {
      content: `🔒 **CONFIDENTIAL TICKET ALERT**\n${mentionContent}`,
      embeds: [headerEmbed, detailsEmbed],
    };

    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Discord API error:", errorText);
      return new Response(JSON.stringify({ error: "Discord send failed", details: errorText }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
