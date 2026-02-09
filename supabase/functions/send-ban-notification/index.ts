import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { discord_id, discord_username, ban_reason, banned_by_user_id } = await req.json();

    if (!ban_reason) throw new Error('ban_reason is required');

    const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN');
    const CHANNEL_ID = Deno.env.get('DISCORD_BAN_CHANNEL_ID');

    if (!DISCORD_BOT_TOKEN || !CHANNEL_ID) {
      throw new Error('Discord bot token or ban channel ID not configured');
    }

    // Fetch banner who did the ban (owner)
    let bannedByName = 'Server Owner';
    if (banned_by_user_id) {
      const { data: bannerProfile } = await supabase
        .from('profiles')
        .select('discord_username, discord_id')
        .eq('id', banned_by_user_id)
        .maybeSingle();
      if (bannerProfile?.discord_username) {
        bannedByName = bannerProfile.discord_username;
      }
    }

    const STORAGE_BASE = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/discord-assets`;
    const bannerUrl = `${STORAGE_BASE}/website-ban-alert.jpg`;
    const logoUrl = `${STORAGE_BASE}/slrp-logo.png`;

    const userMention = discord_id ? `<@${discord_id}>` : (discord_username || 'Unknown User');
    const userDisplay = discord_id
      ? `<@${discord_id}>\n\`${discord_username || 'Unknown'}\``
      : `\`${discord_username || 'Unknown'}\``;

    const timestamp = Math.floor(Date.now() / 1000);

    const headerEmbed = {
      color: 0xED4245,
      author: {
        name: 'SKYLIFE ROLEPLAY INDIA',
        icon_url: logoUrl,
      },
      title: '⛔ WEBSITE BAN ENFORCEMENT',
      description: [
        `> A user has been **permanently banned** from the`,
        `> **Skylife Roleplay India** website by administration.`,
        '',
        `🔗 **Ban Reference:** BAN-${Date.now().toString(36).toUpperCase()}`,
      ].join('\n'),
      thumbnail: { url: logoUrl },
      color: 0xED4245,
    };

    const playerEmbed = {
      color: 0xED4245,
      fields: [
        {
          name: '👤 Banned Player',
          value: userDisplay,
          inline: true,
        },
        {
          name: '🆔 Discord ID',
          value: discord_id ? discord_id : 'Not Linked',
          inline: true,
        },
        {
          name: '🔨 Banned By',
          value: bannedByName,
          inline: true,
        },
      ],
    };

    const reasonEmbed = {
      color: 0xFF6347,
      fields: [
        {
          name: '📋 Ban Reason',
          value: `> ${ban_reason.split('\n').join('\n> ')}`,
          inline: false,
        },
      ],
    };

    const detailsEmbed = {
      color: 0xFFA500,
      fields: [
        {
          name: '📅 Ban Date',
          value: `<t:${timestamp}:F>`,
          inline: true,
        },
        {
          name: '⏳ Duration',
          value: '🔴 **PERMANENT**',
          inline: true,
        },
        {
          name: '⚖️ Status',
          value: '🚫 **ACTIVE**',
          inline: true,
        },
      ],
    };

    const actionsEmbed = {
      color: 0x57F287,
      title: '🛡️ Enforcement Actions',
      description: [
        '✅ Website access permanently revoked',
        '✅ Device fingerprints flagged & blocked',
        '✅ IP addresses logged for monitoring',
        '✅ Alt-account detection system activated',
        '✅ All active sessions terminated',
      ].join('\n'),
      image: { url: bannerUrl },
      footer: {
        text: '🇮🇳 SKYLIFE ROLEPLAY INDIA • Website Ban System',
        icon_url: logoUrl,
      },
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(`https://discord.com/api/v10/channels/${CHANNEL_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: `@everyone\n\n⛔ **WEBSITE BAN** — ${userMention} has been **permanently banned** from the Skylife Roleplay India website.`,
        embeds: [headerEmbed, playerEmbed, reasonEmbed, detailsEmbed, actionsEmbed],
        allowed_mentions: { parse: ['everyone', 'users'] },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Discord API error:', errorText);
      throw new Error(`Discord API error: ${response.status}`);
    }

    await response.text();

    return new Response(JSON.stringify({ success: true, message: 'Ban notification sent to Discord' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Ban notification error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
