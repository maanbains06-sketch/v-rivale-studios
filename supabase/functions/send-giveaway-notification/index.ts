import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GiveawayNotificationRequest {
  title: string;
  description: string | null;
  prize: string;
  prize_image_url: string | null;
  start_date: string;
  end_date: string;
  status: string;
  winner_count: number;
  giveaway_id: string;
  website_url: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const discordBotToken = Deno.env.get('DISCORD_BOT_TOKEN');
    const channelId = Deno.env.get('DISCORD_GIVEAWAY_CHANNEL_ID');
    const ownerDiscordId = Deno.env.get('OWNER_DISCORD_ID');

    if (!discordBotToken) {
      console.error('DISCORD_BOT_TOKEN not configured');
      throw new Error('Discord bot token not configured');
    }

    if (!channelId) {
      console.error('DISCORD_GIVEAWAY_CHANNEL_ID not configured');
      throw new Error('Discord giveaway channel ID not configured');
    }

    const body: GiveawayNotificationRequest = await req.json();
    console.log('Received giveaway notification request:', JSON.stringify(body, null, 2));

    const { title, description, prize, prize_image_url, start_date, end_date, status, winner_count, website_url } = body;

    // Fetch owner's Discord profile for the embed author
    let ownerUsername = 'Giveaway Manager';
    let ownerAvatarUrl = '';
    
    if (ownerDiscordId) {
      try {
        const ownerResponse = await fetch(
          `https://discord.com/api/v10/users/${ownerDiscordId}`,
          {
            headers: {
              'Authorization': `Bot ${discordBotToken}`,
            },
          }
        );
        
        if (ownerResponse.ok) {
          const ownerData = await ownerResponse.json();
          ownerUsername = ownerData.global_name || ownerData.username || 'Giveaway Manager';
          if (ownerData.avatar) {
            const extension = ownerData.avatar.startsWith('a_') ? 'gif' : 'png';
            ownerAvatarUrl = `https://cdn.discordapp.com/avatars/${ownerDiscordId}/${ownerData.avatar}.${extension}?size=256`;
          }
        }
      } catch (error) {
        console.error('Failed to fetch owner Discord profile:', error);
      }
    }

    // Format dates for display
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const formatDate = (date: Date) => date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Determine embed color based on status
    const embedColor = status === 'active' ? 0x00FF00 : status === 'upcoming' ? 0xFFD700 : 0x808080;
    
    // Create status emoji
    const statusEmoji = status === 'active' ? '🔴 LIVE NOW' : status === 'upcoming' ? '📅 UPCOMING' : '⏹️ ENDED';

    // Build Discord embed
    const embed: Record<string, unknown> = {
      title: `🎁 ${title}`,
      description: description || 'Enter for a chance to win amazing prizes!',
      color: embedColor,
      author: {
        name: ownerUsername,
        icon_url: ownerAvatarUrl || undefined,
      },
      fields: [
        {
          name: '🏆 Prize',
          value: prize,
          inline: true
        },
        {
          name: '👥 Winners',
          value: `${winner_count} winner${winner_count > 1 ? 's' : ''}`,
          inline: true
        },
        {
          name: '📊 Status',
          value: statusEmoji,
          inline: true
        },
        {
          name: '📅 Start Date',
          value: formatDate(startDate),
          inline: true
        },
        {
          name: '⏰ End Date',
          value: formatDate(endDate),
          inline: true
        }
      ],
      footer: {
        text: 'Click the button below to enter! Good luck! 🍀'
      },
      timestamp: new Date().toISOString()
    };

    // Add prize image if available
    if (prize_image_url) {
      embed.image = { url: prize_image_url };
    }

    // Create message with button component
    const messagePayload = {
      content: status === 'active' 
        ? '🎉 **NEW GIVEAWAY ALERT!** 🎉\n\nA new giveaway is now **LIVE**! Don\'t miss your chance to win!' 
        : '📢 **GIVEAWAY SCHEDULED!** 📢\n\nA new giveaway has been scheduled! Mark your calendars!',
      embeds: [embed],
      components: [
        {
          type: 1, // Action Row
          components: [
            {
              type: 2, // Button
              style: 5, // Link button
              label: status === 'active' ? '🎁 Enter Giveaway Now!' : '📅 View Giveaway',
              url: website_url
            }
          ]
        }
      ]
    };

    console.log('Sending message to Discord channel:', channelId);
    console.log('Message payload:', JSON.stringify(messagePayload, null, 2));

    // Send message to Discord channel
    const discordResponse = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${discordBotToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messagePayload),
    });

    const responseText = await discordResponse.text();
    console.log('Discord API response status:', discordResponse.status);
    console.log('Discord API response:', responseText);

    if (!discordResponse.ok) {
      console.error('Failed to send Discord message:', responseText);
      throw new Error(`Failed to send Discord notification: ${responseText}`);
    }

    const discordData = JSON.parse(responseText);
    console.log('Successfully sent giveaway notification to Discord');

    return new Response(JSON.stringify({ 
      success: true, 
      message_id: discordData.id,
      channel_id: channelId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in send-giveaway-notification function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
