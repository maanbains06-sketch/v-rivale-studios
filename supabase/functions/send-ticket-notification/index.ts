import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TicketNotificationRequest {
  ticketId: string;
  status: string;
  adminNotes?: string;
  resolution?: string;
  isNew?: boolean;
}

interface DiscordUser {
  id: string;
  username: string;
  global_name?: string;
  avatar?: string;
}

async function fetchDiscordUser(discordId: string, botToken: string): Promise<DiscordUser | null> {
  try {
    const response = await fetch(`https://discord.com/api/v10/users/${discordId}`, {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch Discord user:', response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Discord user:', error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    // Channel for new ticket submissions (staff notifications)
    const TICKET_CHANNEL_ID = Deno.env.get('DISCORD_TICKET_CHANNEL_ID') || Deno.env.get('DISCORD_SUPPORT_CHANNEL_ID');
    // Channel for ticket status updates (user responses - on hold, resolved, etc.)
    const TICKET_RESPONSE_CHANNEL_ID = Deno.env.get('DISCORD_TICKET_RESPONSE_CHANNEL_ID') || TICKET_CHANNEL_ID;
    const TICKET_ROLE_ID = Deno.env.get('DISCORD_TICKET_ROLE_ID') || Deno.env.get('DISCORD_SUPPORT_ROLE_ID');

    if (!DISCORD_BOT_TOKEN) {
      console.error('DISCORD_BOT_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Discord bot not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!TICKET_CHANNEL_ID) {
      console.log('No ticket channel configured, skipping notification');
      return new Response(
        JSON.stringify({ message: 'No ticket channel configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const { ticketId, status, adminNotes, resolution, isNew }: TicketNotificationRequest = await req.json();
    console.log(`Processing ticket notification for ticket ${ticketId}, status: ${status}, isNew: ${isNew}`);

    // Fetch ticket details
    const { data: ticket, error: ticketError } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("id", ticketId)
      .single();

    if (ticketError || !ticket) {
      console.error('Ticket not found:', ticketError);
      return new Response(
        JSON.stringify({ error: 'Ticket not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch Discord user info if we have a Discord ID
    let discordUser: DiscordUser | null = null;
    let userDisplayName = ticket.discord_username || 'Unknown User';
    let userAvatarUrl = 'https://skyliferoleplay.com/images/slrp-logo.png';

    if (ticket.discord_id && /^\d{17,19}$/.test(ticket.discord_id)) {
      discordUser = await fetchDiscordUser(ticket.discord_id, DISCORD_BOT_TOKEN);
      if (discordUser) {
        userDisplayName = discordUser.global_name || discordUser.username || userDisplayName;
        if (discordUser.avatar) {
          userAvatarUrl = `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png?size=256`;
        }
      }
    }

    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    }) + ' at ' + now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    // Determine embed color and title based on status
    let embedColor = 0x3498db; // Blue default
    let statusEmoji = '📋';
    let statusTitle = 'Ticket Update';
    let statusMessage = '';

    switch (status) {
      case 'open':
        embedColor = 0x3498db;
        statusEmoji = '🎫';
        statusTitle = isNew ? 'New Support Ticket Created' : 'Ticket Reopened';
        statusMessage = isNew 
          ? `**${userDisplayName}** has submitted a new support ticket requiring attention.`
          : `Ticket from **${userDisplayName}** has been reopened for further review.`;
        break;
      case 'in_progress':
        embedColor = 0xf39c12;
        statusEmoji = '🔧';
        statusTitle = 'Ticket In Progress';
        statusMessage = `A staff member is now working on **${userDisplayName}**'s ticket.`;
        break;
      case 'on_hold':
        embedColor = 0xe67e22;
        statusEmoji = '⏸️';
        statusTitle = 'Ticket On Hold';
        statusMessage = `**${userDisplayName}**'s ticket has been placed on hold. Additional information may be needed.`;
        break;
      case 'resolved':
        embedColor = 0x2ecc71;
        statusEmoji = '✅';
        statusTitle = 'Ticket Resolved';
        statusMessage = `**${userDisplayName}**'s ticket has been successfully resolved and closed.`;
        break;
    }

    // User mention
    const userMention = ticket.discord_id ? `<@${ticket.discord_id}>` : userDisplayName;

    // Category labels
    const categoryLabels: Record<string, string> = {
      whitelist: '🎯 Whitelist Issue',
      refund: '💰 Refund Request',
      account: '👤 Account Issue',
      technical: '🔧 Technical Support',
      staff_complaint: '📢 Staff Complaint',
      ban_inquiry: '⛔ Ban Inquiry',
      other: '📝 Other',
    };

    // Priority labels with emojis
    const priorityEmojis: Record<string, string> = {
      critical: '🔴 **CRITICAL**',
      high: '🟠 High',
      normal: '🟡 Normal',
      low: '🟢 Low',
    };

    // Build embed with author showing user info
    const embed: Record<string, any> = {
      title: `${statusEmoji} ${statusTitle}`,
      description: statusMessage,
      color: embedColor,
      author: {
        name: userDisplayName,
        icon_url: userAvatarUrl,
      },
      fields: [
        {
          name: '🎫 Ticket Number',
          value: `\`${ticket.ticket_number}\``,
          inline: true,
        },
        {
          name: '📁 Category',
          value: categoryLabels[ticket.category] || ticket.category,
          inline: true,
        },
        {
          name: '⚡ Priority',
          value: priorityEmojis[ticket.priority] || ticket.priority,
          inline: true,
        },
        {
          name: '👤 User',
          value: userMention,
          inline: true,
        },
        {
          name: '📋 Subject',
          value: ticket.subject,
          inline: false,
        },
      ],
      thumbnail: {
        url: userAvatarUrl,
      },
      timestamp: new Date().toISOString(),
      footer: {
        text: 'SkyLife RP India • Ticket Support System',
        icon_url: 'https://skyliferoleplay.com/images/slrp-logo.png',
      },
    };

    // Add description preview for new tickets
    if (isNew && ticket.description) {
      embed.fields.push({
        name: '📝 Description',
        value: ticket.description.length > 500 ? ticket.description.substring(0, 500) + '...' : ticket.description,
        inline: false,
      });
    }

    // Add resolution for resolved tickets
    if (status === 'resolved' && resolution) {
      embed.fields.push({
        name: '✅ Resolution',
        value: resolution.length > 500 ? resolution.substring(0, 500) + '...' : resolution,
        inline: false,
      });
    }

    // Add on-hold message
    if (status === 'on_hold' && adminNotes) {
      embed.fields.push({
        name: '📌 On Hold Reason',
        value: adminNotes.length > 500 ? adminNotes.substring(0, 500) + '...' : adminNotes,
        inline: false,
      });
    }

    // Add status-specific branded images
    const statusImages: Record<string, string> = {
      open: 'https://skyliferoleplay.com/images/tickets/ticket-new.jpg',
      in_progress: 'https://skyliferoleplay.com/images/tickets/ticket-in-progress.jpg',
      on_hold: 'https://skyliferoleplay.com/images/tickets/ticket-on-hold.jpg',
      resolved: 'https://skyliferoleplay.com/images/tickets/ticket-resolved.jpg',
    };
    embed.image = { url: statusImages[status] || statusImages.open };

    // Build message content with role ping for new tickets
    let messageContent = '';
    if (isNew && TICKET_ROLE_ID) {
      messageContent = `<@&${TICKET_ROLE_ID}> 🎫 **NEW SUPPORT TICKET**\n\n${userMention} has submitted a new support ticket requiring attention!\n\n**Ticket:** \`${ticket.ticket_number}\`\n**Category:** ${categoryLabels[ticket.category] || ticket.category}\n**Priority:** ${priorityEmojis[ticket.priority] || ticket.priority}`;
    } else if (status === 'resolved') {
      messageContent = `${userMention} 🎉 Your ticket **${ticket.ticket_number}** has been resolved!\n\nThank you for contacting SkyLife RP India Support. If you have any further questions, feel free to submit a new ticket.`;
    } else if (status === 'on_hold') {
      messageContent = `${userMention} ⏸️ Your ticket **${ticket.ticket_number}** has been placed on hold.\n\nOur team needs additional information or is waiting for a response. Please check your ticket status for updates.`;
    } else if (status === 'in_progress') {
      messageContent = `${userMention} 🔧 Your ticket **${ticket.ticket_number}** is now being worked on!\n\nA staff member has picked up your ticket. Please be patient while we investigate your issue.`;
    }

    // Determine which channel to send to based on status
    // New tickets go to TICKET_CHANNEL_ID (for staff), status updates go to TICKET_RESPONSE_CHANNEL_ID (for users)
    const targetChannelId = isNew ? TICKET_CHANNEL_ID : TICKET_RESPONSE_CHANNEL_ID;
    console.log(`Sending notification to channel: ${targetChannelId} (isNew: ${isNew})`);

    const messageResponse = await fetch(`https://discord.com/api/v10/channels/${targetChannelId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: messageContent || undefined,
        embeds: [embed],
        allowed_mentions: {
          roles: TICKET_ROLE_ID ? [TICKET_ROLE_ID] : [],
          users: ticket.discord_id ? [ticket.discord_id] : []
        }
      }),
    });

    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      console.error('Failed to send Discord message:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to send Discord notification', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const messageResult = await messageResponse.json();
    console.log(`Successfully sent ticket notification. Message ID: ${messageResult.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message_id: messageResult.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-ticket-notification:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
