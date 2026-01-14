import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhitelistNotificationRequest {
  applicantDiscord: string;
  applicantDiscordId?: string;
  status: 'approved' | 'rejected';
  moderatorName: string;
  moderatorDiscordId?: string;
  adminNotes?: string;
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
        'Authorization': `Bot ${botToken}`,
      },
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch Discord user ${discordId}:`, response.status);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching Discord user ${discordId}:`, error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use the new dedicated whitelist bot token
    const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_WHITELIST_BOT_TOKEN');
    const DISCORD_WHITELIST_CHANNEL_ID = Deno.env.get('DISCORD_WHITELIST_CHANNEL_ID');

    console.log('Checking Discord configuration...');
    console.log('DISCORD_BOT_TOKEN exists:', !!DISCORD_BOT_TOKEN);
    console.log('DISCORD_WHITELIST_CHANNEL_ID:', DISCORD_WHITELIST_CHANNEL_ID);

    if (!DISCORD_BOT_TOKEN || !DISCORD_WHITELIST_CHANNEL_ID) {
      console.error('Missing Discord configuration - BOT_TOKEN:', !!DISCORD_BOT_TOKEN, 'CHANNEL_ID:', !!DISCORD_WHITELIST_CHANNEL_ID);
      return new Response(
        JSON.stringify({ error: 'Discord configuration missing', details: { hasToken: !!DISCORD_BOT_TOKEN, hasChannelId: !!DISCORD_WHITELIST_CHANNEL_ID } }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestBody = await req.json();
    console.log('Received request body:', JSON.stringify(requestBody, null, 2));

    const { 
      applicantDiscord, 
      applicantDiscordId,
      status, 
      moderatorName,
      moderatorDiscordId,
      adminNotes 
    }: WhitelistNotificationRequest = requestBody;

    console.log(`Processing whitelist notification for ${applicantDiscord} (ID: ${applicantDiscordId || 'none'}), status: ${status}`);
    console.log(`Moderator: ${moderatorName} (Discord ID: ${moderatorDiscordId || 'none'})`);

    // Fetch moderator's real Discord name if Discord ID is provided
    let moderatorDisplayName = moderatorName;
    let moderatorAvatarUrl: string | null = null;
    
    if (moderatorDiscordId) {
      const moderatorUser = await fetchDiscordUser(moderatorDiscordId, DISCORD_BOT_TOKEN);
      if (moderatorUser) {
        moderatorDisplayName = moderatorUser.global_name || moderatorUser.username;
        if (moderatorUser.avatar) {
          moderatorAvatarUrl = `https://cdn.discordapp.com/avatars/${moderatorUser.id}/${moderatorUser.avatar}.png?size=128`;
        }
        console.log(`Fetched moderator Discord info: ${moderatorDisplayName}`);
      }
    }

    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    }) + ' ' + now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const isApproved = status === 'approved';
    
    // Enhanced embed colors with more vibrant tones
    const embedColor = isApproved ? 0x57F287 : 0xED4245;
    
    // Enhanced title with more visual appeal
    const title = isApproved 
      ? '🎉 Application Approved!' 
      : '📋 Application Status Update';
    
    const description = isApproved 
      ? `Congratulations! Your whitelist application has been **approved**!\n\n✨ Welcome to **SkyLife RP**! We're excited to have you join our community.`
      : `Your whitelist application has been **reviewed** and unfortunately was not approved at this time.`;

    // Image URLs - hosted on the published site
    const approvedImageUrl = 'https://roleplay-horizon.lovable.app/images/whitelist-approved.jpg';
    const rejectedImageUrl = 'https://roleplay-horizon.lovable.app/images/whitelist-rejected.jpg';
    const imageUrl = isApproved ? approvedImageUrl : rejectedImageUrl;

    // Build applicant mention
    const applicantMention = applicantDiscordId 
      ? `<@${applicantDiscordId}>` 
      : `@${applicantDiscord}`;

    // Build moderator display with real Discord name
    const moderatorMention = moderatorDiscordId 
      ? `<@${moderatorDiscordId}>` 
      : moderatorDisplayName;

    // Build enhanced embed fields with better formatting
    const fields = [
      {
        name: '👤 Applicant',
        value: applicantMention,
        inline: true
      },
      {
        name: '📊 Status',
        value: isApproved ? '```diff\n+ APPROVED\n```' : '```diff\n- REJECTED\n```',
        inline: true
      },
      {
        name: '\u200B', // Empty field for spacing
        value: '\u200B',
        inline: true
      },
      {
        name: '🛡️ Reviewed By',
        value: moderatorMention,
        inline: true
      },
      {
        name: '⏰ Review Time',
        value: `\`${formattedDate}\``,
        inline: true
      },
      {
        name: '\u200B',
        value: '\u200B',
        inline: true
      }
    ];

    // Add rejection reason with enhanced formatting
    if (!isApproved && adminNotes) {
      fields.push({
        name: '📝 Feedback',
        value: `>>> ${adminNotes}`,
        inline: false
      });
    }

    // Add next steps for approved applications
    if (isApproved) {
      fields.push({
        name: '📌 Next Steps',
        value: '1. Make sure to read our server rules\n2. Join the server and create your character\n3. Have fun and enjoy your roleplay experience!',
        inline: false
      });
    } else {
      fields.push({
        name: '💡 What\'s Next?',
        value: 'You may reapply after reviewing your application and addressing the feedback provided. Take your time to improve and try again!',
        inline: false
      });
    }

    // Build the embed with author (moderator info)
    const embed: Record<string, unknown> = {
      title,
      description,
      color: embedColor,
      fields,
      image: {
        url: imageUrl
      },
      footer: {
        text: 'SkyLife RP • Whitelist System',
        icon_url: 'https://roleplay-horizon.lovable.app/images/slrp-logo.png'
      },
      timestamp: now.toISOString()
    };

    // Add moderator as author if we have their avatar
    if (moderatorAvatarUrl) {
      embed.author = {
        name: `Reviewed by ${moderatorDisplayName}`,
        icon_url: moderatorAvatarUrl
      };
    }

    // Send message to Discord channel
    const discordResponse = await fetch(
      `https://discord.com/api/v10/channels/${DISCORD_WHITELIST_CHANNEL_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: applicantMention,
          embeds: [embed]
        }),
      }
    );

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();
      console.error('Discord API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to send Discord notification', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const discordResult = await discordResponse.json();
    console.log('Discord notification sent successfully:', discordResult.id);

    return new Response(
      JSON.stringify({ success: true, messageId: discordResult.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending whitelist notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
