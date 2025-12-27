import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Winner {
  discord_id: string;
  discord_username: string | null;
  place: number;
}

interface WinnerAnnouncementRequest {
  giveaway_id: string;
  giveaway_title: string;
  prize: string;
  winners: Winner[];
  website_url: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const discordBotToken = Deno.env.get('DISCORD_BOT_TOKEN');
    const channelId = Deno.env.get('DISCORD_WINNER_CHANNEL_ID');

    if (!discordBotToken) {
      console.error('DISCORD_BOT_TOKEN not configured');
      throw new Error('Discord bot token not configured');
    }

    if (!channelId) {
      console.error('DISCORD_WINNER_CHANNEL_ID not configured');
      throw new Error('Discord winner channel ID not configured');
    }

    const body: WinnerAnnouncementRequest = await req.json();
    console.log('Received winner announcement request:', JSON.stringify(body, null, 2));

    const { giveaway_title, prize, winners, website_url } = body;

    if (!winners || winners.length === 0) {
      throw new Error('No winners provided');
    }

    // Fetch Discord user info for each winner to get their avatar
    const winnersWithAvatars: Array<Winner & { avatar_url: string }> = [];
    
    for (const winner of winners) {
      let avatarUrl = 'https://cdn.discordapp.com/embed/avatars/0.png'; // Default avatar
      
      if (winner.discord_id) {
        try {
          const userResponse = await fetch(
            `https://discord.com/api/v10/users/${winner.discord_id}`,
            {
              headers: {
                'Authorization': `Bot ${discordBotToken}`,
              },
            }
          );
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            if (userData.avatar) {
              const extension = userData.avatar.startsWith('a_') ? 'gif' : 'png';
              avatarUrl = `https://cdn.discordapp.com/avatars/${winner.discord_id}/${userData.avatar}.${extension}?size=256`;
            }
          }
        } catch (error) {
          console.error(`Failed to fetch Discord user ${winner.discord_id}:`, error);
        }
      }
      
      winnersWithAvatars.push({
        ...winner,
        avatar_url: avatarUrl,
      });
    }

    // Create fields for each winner
    const winnerFields = winnersWithAvatars.map((winner, index) => {
      const placeEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
      const displayName = winner.discord_username || `<@${winner.discord_id}>`;
      
      return {
        name: `${placeEmoji} ${index === 0 ? '1st Place' : index === 1 ? '2nd Place' : index === 2 ? '3rd Place' : `${index + 1}th Place`}`,
        value: winner.discord_id ? `<@${winner.discord_id}>\n${displayName}` : displayName,
        inline: true
      };
    });

    // Build Discord embed with winner profiles
    const embed: Record<string, unknown> = {
      title: `🎉 GIVEAWAY WINNERS 🎉`,
      description: `**${giveaway_title}**\n\nCongratulations to our lucky winner${winners.length > 1 ? 's' : ''}! 🎊`,
      color: 0xFFD700, // Gold color
      fields: [
        {
          name: '🏆 Prize',
          value: prize,
          inline: false
        },
        ...winnerFields,
      ],
      footer: {
        text: `Thank you to everyone who participated! Stay tuned for more giveaways! 🍀`
      },
      timestamp: new Date().toISOString()
    };

    // If single winner, add their avatar as thumbnail
    if (winnersWithAvatars.length === 1 && winnersWithAvatars[0].avatar_url) {
      embed.thumbnail = { url: winnersWithAvatars[0].avatar_url };
    }

    // Create mentions for all winners
    const winnerMentions = winners
      .filter(w => w.discord_id)
      .map(w => `<@${w.discord_id}>`)
      .join(' ');

    // Create message payload
    const messagePayload = {
      content: `🎁 **GIVEAWAY WINNERS ANNOUNCED!** 🎁\n\n${winnerMentions}\n\nCongratulations! You've won the **${giveaway_title}**! 🎉`,
      embeds: [embed],
      components: [
        {
          type: 1, // Action Row
          components: [
            {
              type: 2, // Button
              style: 5, // Link button
              label: '🎁 View All Giveaways',
              url: website_url
            }
          ]
        }
      ]
    };

    console.log('Sending winner announcement to Discord channel:', channelId);
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
    console.log('Successfully sent winner announcement to Discord');

    return new Response(JSON.stringify({ 
      success: true, 
      message_id: discordData.id,
      channel_id: channelId,
      winners_count: winners.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in send-winner-announcement function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
