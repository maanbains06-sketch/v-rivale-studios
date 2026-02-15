import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Department display names & emojis
const departmentInfo: Record<string, { name: string; emoji: string; color: number }> = {
  police: { name: '🚔 Police Department', emoji: '🚔', color: 0x3B82F6 },
  ems: { name: '🚑 Emergency Medical Services', emoji: '🚑', color: 0xEF4444 },
  fire: { name: '🚒 Fire Department', emoji: '🚒', color: 0xF97316 },
  firefighter: { name: '🚒 Fire Department', emoji: '🚒', color: 0xF97316 },
  mechanic: { name: '🔧 Mechanic Shop', emoji: '🔧', color: 0xEAB308 },
  doj: { name: '⚖️ Department of Justice', emoji: '⚖️', color: 0x8B5CF6 },
  state: { name: '🏛️ State Department', emoji: '🏛️', color: 0x6366F1 },
  weazel: { name: '📺 Weazel News', emoji: '📺', color: 0x10B981 },
  pdm: { name: '🚗 Premium Deluxe Motorsport', emoji: '🚗', color: 0xEC4899 },
  staff: { name: '⭐ Staff Team', emoji: '⭐', color: 0xFFD700 },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { staffName, staffDiscordId, department, rank, avatarUrl, isTest } = await req.json();

    const botToken = Deno.env.get('DISCORD_BOT_TOKEN');
    const channelId = Deno.env.get('DISCORD_STAFF_WELCOME_CHANNEL_ID');

    if (!botToken || !channelId) {
      throw new Error('Missing DISCORD_BOT_TOKEN or DISCORD_STAFF_WELCOME_CHANNEL_ID');
    }

    const deptInfo = departmentInfo[department] || { name: '🌟 ' + department, emoji: '🌟', color: 0x5865F2 };
    const bannerUrl = 'https://obirpzwvnqveddyuulsb.supabase.co/storage/v1/object/public/assets/staff-welcome-banner.png';
    const timestamp = new Date().toISOString();

    const userMention = staffDiscordId ? `<@${staffDiscordId}>` : staffName;

    // Build the welcome message
    const messagePayload = {
      content: `@everyone\n\n🎉 **NEW STAFF MEMBER ALERT** 🎉\n\nPlease welcome ${userMention} to the **Skylife Roleplay India** family! 🙌`,
      embeds: [
        {
          title: `${deptInfo.emoji} Welcome Aboard, ${staffName}! ${deptInfo.emoji}`,
          description: [
            `> We are thrilled to announce that ${userMention} has officially joined our team!\n`,
            `━━━━━━━━━━━━━━━━━━━━━━`,
            ``,
            `🏢 **Department:** ${deptInfo.name}`,
            `🎖️ **Rank:** ${rank}`,
            `👤 **Name:** ${staffName}`,
            ``,
            `━━━━━━━━━━━━━━━━━━━━━━`,
            ``,
            `> *"Every great team is built one member at a time. Welcome to the Skylife family!"*`,
            ``,
            `🌟 We trust you'll bring dedication and passion to your role.`,
            `💼 Make sure to check in with your department leads.`,
            `🤝 Don't hesitate to reach out if you need any help!`,
          ].join('\n'),
          color: deptInfo.color,
          image: {
            url: bannerUrl,
          },
          thumbnail: avatarUrl ? { url: avatarUrl } : undefined,
          footer: {
            text: '⭐ Skylife Roleplay India • Staff Management',
          },
          timestamp,
        },
      ],
      allowed_mentions: {
        parse: ['everyone', 'users'],
      },
    };

    console.log('Sending staff welcome message to channel:', channelId);

    const discordRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messagePayload),
    });

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      console.error('Discord API error:', errText);
      throw new Error(`Discord API error: ${discordRes.status} - ${errText}`);
    }

    const result = await discordRes.json();
    console.log('Staff welcome message sent successfully:', result.id);

    return new Response(
      JSON.stringify({ success: true, messageId: result.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error sending staff welcome:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
