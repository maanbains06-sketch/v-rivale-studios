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

    const priorityConfig: Record<string, { color: number; label: string; icon: string }> = {
      critical: { color: 0xED4245, label: "CRITICAL", icon: "🔴" },
      high: { color: 0xFE7434, label: "HIGH", icon: "🟠" },
      normal: { color: 0xFEE75C, label: "NORMAL", icon: "🟡" },
      low: { color: 0x95A5A6, label: "LOW", icon: "⚪" },
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
    const ticketRef = ticketId?.substring(0, 8) || "N/A";

    // Only tag the submitting user and admin role — NOT the owner
    let mentionContent = `<@${discordId}>`;
    if (adminRoleId) mentionContent += ` <@&${adminRoleId}>`;

    const embed = {
      title: "🔒  Confidential Ticket Submitted",
      description: [
        `A new **confidential** ticket requires private review.\n`,
        `**Subject**`,
        `${subject || "No subject"}\n`,
        `**Category**`,
        `${categoryLabels[category] || category}\n`,
        `**Priority**`,
        `${pConfig.icon}  ${pConfig.label}\n`,
        `**Submitted By**`,
        `<@${discordId}>  •  ${displayName}\n`,
        `**Ticket ID**`,
        `\`${ticketRef}\``,
      ].join("\n"),
      color: pConfig.color,
      image: { url: imageUrl },
      footer: {
        text: "Skylife Roleplay India  •  Confidential Support",
      },
      timestamp: new Date().toISOString(),
    };

    const payload = {
      content: mentionContent,
      embeds: [embed],
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
