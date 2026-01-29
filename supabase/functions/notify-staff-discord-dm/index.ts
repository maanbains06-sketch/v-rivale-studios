import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotifyStaffRequest {
  chatId: string;
  userName: string;
  subject: string;
  userDiscordId?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const SUPPORT_CHANNEL_ID = Deno.env.get('DISCORD_SUPPORT_CHANNEL_ID');
    const SUPPORT_ROLE_ID = Deno.env.get('DISCORD_SUPPORT_ROLE_ID');

    if (!DISCORD_BOT_TOKEN) {
      console.error('DISCORD_BOT_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Discord bot not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!SUPPORT_CHANNEL_ID || !SUPPORT_ROLE_ID) {
      console.error('Support channel or role ID not configured');
      return new Response(
        JSON.stringify({ error: 'Support channel configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const { chatId, userName, subject, userDiscordId }: NotifyStaffRequest = await req.json();
    console.log(`Processing human support notification for chat ${chatId} from ${userName}`);

    // Get user's Discord info if we have their Discord ID
    let userDisplayName = userName || 'Anonymous User';
    let userMention = userDisplayName;
    
    if (userDiscordId) {
      userMention = `<@${userDiscordId}>`;
      console.log(`User Discord ID: ${userDiscordId}`);
    }

    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    }) + ' at ' + now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    // Build the embed for the support channel
    const embed = {
      title: '🚨 Human Support Requested',
      description: `A user on the website has requested to speak with a human staff member.\n\n**Please assist them as soon as possible!**`,
      color: 0xFF6B6B, // Red color for urgency
      fields: [
        {
          name: '👤 User',
          value: userMention,
          inline: true,
        },
        {
          name: '📋 Subject',
          value: subject || 'Support Request',
          inline: true,
        },
        {
          name: '⏰ Requested At',
          value: `\`${formattedDate}\``,
          inline: false,
        },
        {
          name: '⚡ Priority',
          value: '**HIGH** - Immediate attention needed',
          inline: false,
        },
        {
          name: '🔗 Action Required',
          value: `Please log in to the website and check the support chat.\n**[Open Support Dashboard](https://roleplay-horizon.lovable.app/admin/support-chat)**`,
          inline: false,
        },
      ],
      thumbnail: {
        url: 'https://roleplay-horizon.lovable.app/images/slrp-logo.png',
      },
      timestamp: new Date().toISOString(),
      footer: {
        text: 'SkyLife RP • Human Support Request',
        icon_url: 'https://roleplay-horizon.lovable.app/images/slrp-logo.png',
      },
    };

    // Send message to support channel with role ping
    const messageContent = `<@&${SUPPORT_ROLE_ID}> 🚨 **HUMAN SUPPORT REQUESTED**\n\n${userMention} has opened a support chat on the website and is requesting human assistance!\n\n**Subject:** ${subject || 'Support Request'}`;

    console.log(`Sending notification to support channel: ${SUPPORT_CHANNEL_ID}`);

    const messageResponse = await fetch(`https://discord.com/api/v10/channels/${SUPPORT_CHANNEL_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: messageContent,
        embeds: [embed],
        allowed_mentions: {
          roles: [SUPPORT_ROLE_ID],
          users: userDiscordId ? [userDiscordId] : []
        }
      }),
    });

    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      console.error('Failed to send message to support channel:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to send Discord notification', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const messageResult = await messageResponse.json();
    console.log(`Successfully sent notification to support channel. Message ID: ${messageResult.id}`);

    // Also create database notifications for staff with user_id
    const { data: staffMembers } = await supabase
      .from('staff_members')
      .select('user_id')
      .eq('is_active', true)
      .not('user_id', 'is', null);

    if (staffMembers && staffMembers.length > 0) {
      const notifications = staffMembers.map(staff => ({
        user_id: staff.user_id,
        title: '🚨 User Requesting Human Support',
        message: `${userName || 'A user'} is requesting human assistance for: "${subject || 'Support Request'}"`,
        type: 'support_chats',
        reference_id: chatId,
      }));

      await supabase.from('notifications').insert(notifications);
      console.log(`Created ${notifications.length} database notifications for staff`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        channel_id: SUPPORT_CHANNEL_ID,
        message_id: messageResult.id,
        message: 'Notification sent to support channel successfully',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in notify-staff-discord-dm:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
