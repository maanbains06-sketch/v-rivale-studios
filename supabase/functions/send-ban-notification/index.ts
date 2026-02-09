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

    // Fetch banner who did the ban (owner) - get their real Discord identity
    let bannedByName = 'Server Owner';
    let bannedByDiscordId: string | null = null;
    if (banned_by_user_id) {
      // First get discord_id from profiles
      const { data: bannerProfile } = await supabase
        .from('profiles')
        .select('discord_username, discord_id')
        .eq('id', banned_by_user_id)
        .maybeSingle();
      
      if (bannerProfile?.discord_id) {
        bannedByDiscordId = bannerProfile.discord_id;
        // Fetch real Discord display name via Discord API
        try {
          const discordRes = await fetch(`https://discord.com/api/v10/users/${bannerProfile.discord_id}`, {
            headers: { 'Authorization': `Bot ${DISCORD_BOT_TOKEN}` },
          });
          if (discordRes.ok) {
            const discordUser = await discordRes.json();
            bannedByName = discordUser.global_name || discordUser.username || bannerProfile.discord_username || 'Server Owner';
          } else if (bannerProfile.discord_username) {
            bannedByName = bannerProfile.discord_username;
          }
        } catch {
          if (bannerProfile.discord_username) {
            bannedByName = bannerProfile.discord_username;
          }
        }
      } else if (bannerProfile?.discord_username) {
        bannedByName = bannerProfile.discord_username;
      }
    }

    const STORAGE_BASE = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/discord-assets`;
    const bannerUrl = `${STORAGE_BASE}/website-ban-alert.jpg`;
    const logoUrl = `${STORAGE_BASE}/slrp-logo.png`;

    const userMention = discord_id ? `<@${discord_id}>` : (discord_username || 'Unknown User');
    const userDisplay = discord_id
      ? `<@${discord_id}>\n**${discord_username || 'Unknown'}**`
      : `**${discord_username || 'Unknown'}**`;

    const embed = {
      author: {
        name: 'SKYLIFE ROLEPLAY INDIA • Ban Enforcement',
        icon_url: logoUrl,
      },
      title: '🔨 WEBSITE BAN — User Has Been Banned',
      description: `A user has been **permanently banned** from the Skylife Roleplay India website by the server administration.`,
      color: 0xFF0000,
      thumbnail: { url: logoUrl },
      fields: [
        {
          name: '━━━━━ BANNED USER ━━━━━',
          value: '\u200b',
          inline: false,
        },
        {
          name: '👤 Player',
          value: userDisplay,
          inline: true,
        },
        {
          name: '🆔 Discord ID',
          value: discord_id ? `**${discord_id}**` : '**N/A**',
          inline: true,
        },
        {
          name: '\u200b',
          value: '\u200b',
          inline: true,
        },
        {
          name: '━━━━━ BAN DETAILS ━━━━━',
          value: '\u200b',
          inline: false,
        },
        {
          name: '📝 Ban Reason',
          value: `> **${ban_reason}**`,
          inline: false,
        },
        {
          name: '🔨 Banned By',
          value: bannedByDiscordId ? `<@${bannedByDiscordId}>\n**${bannedByName}**` : `**${bannedByName}**`,
          inline: true,
        },
        {
          name: '📅 Ban Date',
          value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
          inline: true,
        },
        {
          name: '⏳ Duration',
          value: '🔴 **PERMANENT**',
          inline: true,
        },
        {
          name: '━━━━━ ACTIONS TAKEN ━━━━━',
          value: '✅ Website access permanently blocked\n✅ Device fingerprints flagged\n✅ IP addresses recorded\n✅ Alt-account detection activated',
          inline: false,
        },
      ],
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
        content: `@everyone 🔨 **WEBSITE BAN** — ${userMention} has been **permanently banned** from the website.`,
        embeds: [embed],
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
