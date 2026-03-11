import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { roomName, roomNumber, creatorUsername, creatorDiscordId } = await req.json();

    const botToken = Deno.env.get('DISCORD_BOT_TOKEN');
    const channelId = Deno.env.get('DISCORD_CINEMA_CHANNEL_ID');

    if (!botToken || !channelId) {
      console.error('Missing DISCORD_BOT_TOKEN or DISCORD_CINEMA_CHANNEL_ID');
      return new Response(JSON.stringify({ error: 'Missing configuration' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch Discord user info if we have a Discord ID to get proper username
    let displayName = creatorUsername || 'Unknown';
    let userMention = displayName;
    
    if (creatorDiscordId && /^\d{17,19}$/.test(creatorDiscordId)) {
      userMention = `<@${creatorDiscordId}>`;
      
      // Fetch Discord username
      try {
        const userRes = await fetch(`https://discord.com/api/v10/users/${creatorDiscordId}`, {
          headers: { Authorization: `Bot ${botToken}` },
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          displayName = userData.global_name || userData.username || displayName;
        }
      } catch (e) {
        console.warn('Failed to fetch Discord user:', e);
      }
    }

    const bannerUrl = 'https://obirpzwvnqveddyuulsb.supabase.co/storage/v1/object/public/assets/cinema-hub-banner.png';
    const roomNum = String(roomNumber).padStart(2, '0');
    const timestamp = new Date().toISOString();

    const messagePayload = {
      content: `@everyone\n\n🎬 **CINEMA HUB — NEW ROOM CREATED!** 🎬\n\n${userMention} just opened a cinema room! Come join the watch party! 🍿`,
      embeds: [
        {
          title: `🎥 Room #${roomNum} — ${roomName}`,
          description: [
            `> 🎬 A brand new cinema room is **LIVE** and waiting for viewers!\n`,
            `🎭 **Room Name:** ${roomName}`,
            `🔢 **Room Number:** #${roomNum}`,
            `👤 **Created By:** ${userMention}`,
            ``,
            `━━━━━━━━━━━━━━━━━━━━━━━━━`,
            ``,
            `🍿 **What can you do?**`,
            `> 📺 Watch YouTube/Twitch together`,
            `> 🖥️ Share your screen`,
            `> 🎙️ Voice chat with everyone`,
            `> 💬 Live room chat`,
            ``,
            `━━━━━━━━━━━━━━━━━━━━━━━━━`,
            ``,
            `🚀 **[Join Now on Skylife Roleplay India Website!](https://roleplay-horizon.lovable.app/cinema-hub)**`,
          ].join('\n'),
          color: 0xE50914, // Cinema red
          image: {
            url: bannerUrl,
          },
          thumbnail: {
            url: 'https://cdn.discordapp.com/emojis/1160302312175194164.png',
          },
          footer: {
            text: '🎬 Skylife Roleplay India • Cinema Hub',
          },
          timestamp: timestamp,
        },
      ],
      allowed_mentions: {
        parse: ['everyone'],
      },
    };

    const discordRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messagePayload),
    });

    if (!discordRes.ok) {
      const errorText = await discordRes.text();
      console.error('Discord API error:', errorText);
      return new Response(JSON.stringify({ error: 'Discord API error', details: errorText }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await discordRes.json();
    console.log('Cinema notification sent successfully:', result.id);

    return new Response(JSON.stringify({ success: true, messageId: result.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
