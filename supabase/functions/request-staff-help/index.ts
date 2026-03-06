import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StaffHelpRequest {
  staffDiscordId?: string;
  staffUsername: string;
  chatSubject: string;
  chatId: string;
  reason: string;
  ticketType: 'live_chat' | 'ticket';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN');
    const HELP_CHANNEL_ID = Deno.env.get('DISCORD_STAFF_HELP_CHANNEL_ID');
    const SUPPORT_ROLE_ID = Deno.env.get('DISCORD_SUPPORT_ROLE_ID');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!DISCORD_BOT_TOKEN) {
      return new Response(JSON.stringify({ error: 'Discord bot not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!HELP_CHANNEL_ID) {
      return new Response(JSON.stringify({ error: 'Staff help channel not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const { staffDiscordId, staffUsername, chatSubject, chatId, reason, ticketType }: StaffHelpRequest = await req.json();

    console.log(`Staff help request from ${staffUsername} for chat ${chatId}`);

    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', {
      month: '2-digit', day: '2-digit', year: 'numeric'
    }) + ' at ' + now.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });

    const staffMention = staffDiscordId ? `<@${staffDiscordId}>` : staffUsername;
    const directLink = `https://skyliferoleplay.com/admin/support-chat?chatId=${chatId}`;

    const embed = {
      title: '🆘 Staff Assistance Required',
      description: `A staff member needs help handling a ${ticketType === 'live_chat' ? 'live chat' : 'support ticket'}.\n\n**Please assist them as soon as possible!**`,
      color: 0xFF4500,
      fields: [
        { name: '👮 Requesting Staff', value: staffMention, inline: true },
        { name: '📋 Chat Subject', value: chatSubject || 'Support Request', inline: true },
        { name: '📝 Reason', value: reason || 'No reason provided', inline: false },
        { name: '⏰ Requested At', value: `\`${formattedDate}\``, inline: false },
        { name: '⚡ Priority', value: '**HIGH** - Staff needs backup immediately', inline: false },
        {
          name: '🔗 Quick Action',
          value: `**[Open This Chat](${directLink})**\n_Or go to [Support Dashboard](https://skyliferoleplay.com/admin/support-chat)_`,
          inline: false
        },
      ],
      image: {
        url: 'https://skyliferoleplay.com/images/staff-help-request.jpg',
      },
      thumbnail: {
        url: 'https://skyliferoleplay.com/images/slrp-logo.png',
      },
      timestamp: new Date().toISOString(),
      footer: {
        text: 'SkyLife RP India • Staff Help Request',
        icon_url: 'https://skyliferoleplay.com/images/slrp-logo.png',
      },
    };

    const roleTag = SUPPORT_ROLE_ID ? `<@&${SUPPORT_ROLE_ID}>` : '@admins';
    const messageContent = `${roleTag} 🆘 **STAFF HELP REQUEST**\n\n${staffMention} needs assistance with a ${ticketType === 'live_chat' ? 'live chat' : 'ticket'}!\n\n**Subject:** ${chatSubject || 'Support Request'}\n**Reason:** ${reason || 'Needs help'}`;

    const messageResponse = await fetch(`https://discord.com/api/v10/channels/${HELP_CHANNEL_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: messageContent,
        embeds: [embed],
        allowed_mentions: {
          roles: SUPPORT_ROLE_ID ? [SUPPORT_ROLE_ID] : [],
          users: staffDiscordId ? [staffDiscordId] : [],
        }
      }),
    });

    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      console.error('Failed to send help request:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to send Discord notification', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const result = await messageResponse.json();
    console.log(`Help request sent. Message ID: ${result.id}`);

    // Also create DB notifications for all active staff
    const { data: staffMembers } = await supabase
      .from('staff_members')
      .select('user_id')
      .eq('is_active', true)
      .not('user_id', 'is', null);

    if (staffMembers?.length) {
      const notifications = staffMembers.map(s => ({
        user_id: s.user_id,
        title: '🆘 Staff Needs Help',
        message: `${staffUsername} is requesting assistance: "${reason || chatSubject}"`,
        type: 'support_chats',
        reference_id: chatId,
      }));
      await supabase.from('notifications').insert(notifications);
    }

    return new Response(JSON.stringify({ success: true, message_id: result.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error in request-staff-help:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
