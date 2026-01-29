import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApplicationNotificationRequest {
  applicationType: string;
  applicantName: string;
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

interface AppConfig {
  channelEnvKey: string;
  title: string;
  departmentName: string;
  color: { approved: number; rejected: number };
  emoji: string;
  imageKey: string;
}

// Base URL for notification images
const BASE_IMAGE_URL = 'https://roleplay-horizon.lovable.app/images/applications';

const applicationConfigs: Record<string, AppConfig> = {
  'Police Department': {
    channelEnvKey: 'DISCORD_PD_CHANNEL_ID',
    title: 'Police Department Application',
    departmentName: 'Police Department',
    color: { approved: 0x3B82F6, rejected: 0xED4245 },
    emoji: '👮',
    imageKey: 'pd'
  },
  'police': {
    channelEnvKey: 'DISCORD_PD_CHANNEL_ID',
    title: 'Police Department Application',
    departmentName: 'Police Department',
    color: { approved: 0x3B82F6, rejected: 0xED4245 },
    emoji: '👮',
    imageKey: 'pd'
  },
  'EMS': {
    channelEnvKey: 'DISCORD_EMS_CHANNEL_ID',
    title: 'EMS Application',
    departmentName: 'EMS',
    color: { approved: 0xEF4444, rejected: 0xED4245 },
    emoji: '🚑',
    imageKey: 'ems'
  },
  'ems': {
    channelEnvKey: 'DISCORD_EMS_CHANNEL_ID',
    title: 'EMS Application',
    departmentName: 'EMS',
    color: { approved: 0xEF4444, rejected: 0xED4245 },
    emoji: '🚑',
    imageKey: 'ems'
  },
  'Mechanic': {
    channelEnvKey: 'DISCORD_MECHANIC_CHANNEL_ID',
    title: 'Mechanic Application',
    departmentName: 'Mechanic Shop',
    color: { approved: 0xF97316, rejected: 0xED4245 },
    emoji: '🔧',
    imageKey: 'mechanic'
  },
  'mechanic': {
    channelEnvKey: 'DISCORD_MECHANIC_CHANNEL_ID',
    title: 'Mechanic Application',
    departmentName: 'Mechanic Shop',
    color: { approved: 0xF97316, rejected: 0xED4245 },
    emoji: '🔧',
    imageKey: 'mechanic'
  },
  'DOJ - Judge': {
    channelEnvKey: 'DISCORD_DOJ_JUDGE_CHANNEL_ID',
    title: 'DOJ Judge Application',
    departmentName: 'Department of Justice',
    color: { approved: 0x8B5CF6, rejected: 0xED4245 },
    emoji: '⚖️',
    imageKey: 'doj-judge'
  },
  'judge': {
    channelEnvKey: 'DISCORD_DOJ_JUDGE_CHANNEL_ID',
    title: 'DOJ Judge Application',
    departmentName: 'Department of Justice',
    color: { approved: 0x8B5CF6, rejected: 0xED4245 },
    emoji: '⚖️',
    imageKey: 'doj-judge'
  },
  'DOJ - Attorney': {
    channelEnvKey: 'DISCORD_DOJ_ATTORNEY_CHANNEL_ID',
    title: 'DOJ Attorney Application',
    departmentName: 'Department of Justice',
    color: { approved: 0x8B5CF6, rejected: 0xED4245 },
    emoji: '⚖️',
    imageKey: 'doj-attorney'
  },
  'attorney': {
    channelEnvKey: 'DISCORD_DOJ_ATTORNEY_CHANNEL_ID',
    title: 'DOJ Attorney Application',
    departmentName: 'Department of Justice',
    color: { approved: 0x8B5CF6, rejected: 0xED4245 },
    emoji: '⚖️',
    imageKey: 'doj-attorney'
  },
  'State Department': {
    channelEnvKey: 'DISCORD_STATE_CHANNEL_ID',
    title: 'State Department Application',
    departmentName: 'State Department',
    color: { approved: 0x10B981, rejected: 0xED4245 },
    emoji: '🏛️',
    imageKey: 'state'
  },
  'state': {
    channelEnvKey: 'DISCORD_STATE_CHANNEL_ID',
    title: 'State Department Application',
    departmentName: 'State Department',
    color: { approved: 0x10B981, rejected: 0xED4245 },
    emoji: '🏛️',
    imageKey: 'state'
  },
  'Gang RP': {
    channelEnvKey: 'DISCORD_GANG_CHANNEL_ID',
    title: 'Gang RP Application',
    departmentName: 'Gang RP',
    color: { approved: 0x991B1B, rejected: 0xED4245 },
    emoji: '🔫',
    imageKey: 'gang'
  },
  'gang': {
    channelEnvKey: 'DISCORD_GANG_CHANNEL_ID',
    title: 'Gang RP Application',
    departmentName: 'Gang RP',
    color: { approved: 0x991B1B, rejected: 0xED4245 },
    emoji: '🔫',
    imageKey: 'gang'
  },
  'Gang Roleplay': {
    channelEnvKey: 'DISCORD_GANG_CHANNEL_ID',
    title: 'Gang RP Application',
    departmentName: 'Gang RP',
    color: { approved: 0x991B1B, rejected: 0xED4245 },
    emoji: '🔫',
    imageKey: 'gang'
  },
  'PDM': {
    channelEnvKey: 'DISCORD_PDM_CHANNEL_ID',
    title: 'PDM Dealership Application',
    departmentName: 'Premium Deluxe Motorsport',
    color: { approved: 0xEAB308, rejected: 0xED4245 },
    emoji: '🚗',
    imageKey: 'pdm'
  },
  'pdm': {
    channelEnvKey: 'DISCORD_PDM_CHANNEL_ID',
    title: 'PDM Dealership Application',
    departmentName: 'Premium Deluxe Motorsport',
    color: { approved: 0xEAB308, rejected: 0xED4245 },
    emoji: '🚗',
    imageKey: 'pdm'
  },
  'Firefighter': {
    channelEnvKey: 'DISCORD_FIREFIGHTER_CHANNEL_ID',
    title: 'Fire Department Application',
    departmentName: 'Fire Department',
    color: { approved: 0xDC2626, rejected: 0xED4245 },
    emoji: '🚒',
    imageKey: 'firefighter'
  },
  'firefighter': {
    channelEnvKey: 'DISCORD_FIREFIGHTER_CHANNEL_ID',
    title: 'Fire Department Application',
    departmentName: 'Fire Department',
    color: { approved: 0xDC2626, rejected: 0xED4245 },
    emoji: '🚒',
    imageKey: 'firefighter'
  },
  'Weazel News': {
    channelEnvKey: 'DISCORD_WEAZEL_CHANNEL_ID',
    title: 'Weazel News Application',
    departmentName: 'Weazel News',
    color: { approved: 0x06B6D4, rejected: 0xED4245 },
    emoji: '📺',
    imageKey: 'weazel'
  },
  'weazel': {
    channelEnvKey: 'DISCORD_WEAZEL_CHANNEL_ID',
    title: 'Weazel News Application',
    departmentName: 'Weazel News',
    color: { approved: 0x06B6D4, rejected: 0xED4245 },
    emoji: '📺',
    imageKey: 'weazel'
  },
  'weazel_news': {
    channelEnvKey: 'DISCORD_WEAZEL_CHANNEL_ID',
    title: 'Weazel News Application',
    departmentName: 'Weazel News',
    color: { approved: 0x06B6D4, rejected: 0xED4245 },
    emoji: '📺',
    imageKey: 'weazel'
  },
  'Creator': {
    channelEnvKey: 'DISCORD_CREATOR_CHANNEL_ID',
    title: 'Creator Program Application',
    departmentName: 'Creator Program',
    color: { approved: 0xA855F7, rejected: 0xED4245 },
    emoji: '🎬',
    imageKey: 'creator'
  },
  'creator': {
    channelEnvKey: 'DISCORD_CREATOR_CHANNEL_ID',
    title: 'Creator Program Application',
    departmentName: 'Creator Program',
    color: { approved: 0xA855F7, rejected: 0xED4245 },
    emoji: '🎬',
    imageKey: 'creator'
  },
  'Staff': {
    channelEnvKey: 'DISCORD_STAFF_CHANNEL_ID',
    title: 'Staff Application',
    departmentName: 'Staff Team',
    color: { approved: 0x22C55E, rejected: 0xED4245 },
    emoji: '⭐',
    imageKey: 'staff'
  },
  'staff': {
    channelEnvKey: 'DISCORD_STAFF_CHANNEL_ID',
    title: 'Staff Application',
    departmentName: 'Staff Team',
    color: { approved: 0x22C55E, rejected: 0xED4245 },
    emoji: '⭐',
    imageKey: 'staff'
  }
};

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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_WHITELIST_BOT_TOKEN');
    
    if (!DISCORD_BOT_TOKEN) {
      console.error('DISCORD_WHITELIST_BOT_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Discord bot token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: ApplicationNotificationRequest = await req.json();
    const { applicationType, applicantName, applicantDiscordId, status, moderatorName, moderatorDiscordId, adminNotes } = body;

    console.log(`Processing ${applicationType} notification for ${applicantName}, status: ${status}`);

    // Get config for this application type
    const config = applicationConfigs[applicationType];
    if (!config) {
      console.error(`Unknown application type: ${applicationType}`);
      return new Response(
        JSON.stringify({ error: `Unknown application type: ${applicationType}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get channel ID
    const channelId = Deno.env.get(config.channelEnvKey);
    if (!channelId) {
      console.error(`${config.channelEnvKey} not configured`);
      return new Response(
        JSON.stringify({ error: `Discord channel not configured for ${applicationType}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch moderator's Discord info
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
    const isApproved = status === 'approved';

    // Build applicant mention
    const applicantMention = applicantDiscordId 
      ? `<@${applicantDiscordId}>` 
      : `**${applicantName}**`;

    // Build moderator display
    const moderatorMention = moderatorDiscordId 
      ? `<@${moderatorDiscordId}>` 
      : `**${moderatorDisplayName}**`;

    // Build image URL for this application type
    const imageUrl = `${BASE_IMAGE_URL}/${config.imageKey}-${isApproved ? 'approved' : 'rejected'}.jpg`;
    console.log(`Using notification image: ${imageUrl}`);

    // Clean embed design with image
    const embed: Record<string, unknown> = {
      title: isApproved 
        ? `${config.emoji} ${config.title} - APPROVED ✅` 
        : `${config.emoji} ${config.title} - REJECTED ❌`,
      description: isApproved 
        ? `Congratulations! Your application for **${config.departmentName}** has been approved!\n\n🎉 Welcome to the team!`
        : `Your application for **${config.departmentName}** has been reviewed and unfortunately was not approved at this time.`,
      color: isApproved ? config.color.approved : config.color.rejected,
      fields: [
        {
          name: '👤 Applicant',
          value: applicantMention,
          inline: true
        },
        {
          name: '🛡️ Reviewed By',
          value: moderatorMention,
          inline: true
        },
        {
          name: '📊 Status',
          value: isApproved ? '✅ **APPROVED**' : '❌ **REJECTED**',
          inline: true
        }
      ],
      image: {
        url: imageUrl
      },
      thumbnail: {
        url: 'https://roleplay-horizon.lovable.app/images/slrp-logo.png'
      },
      footer: {
        text: `SkyLife RP • ${config.departmentName}`,
        icon_url: 'https://roleplay-horizon.lovable.app/images/slrp-logo.png'
      },
      timestamp: now.toISOString()
    };

    // Add admin notes if provided
    if (adminNotes && adminNotes.trim()) {
      (embed.fields as any[]).push({
        name: isApproved ? '📝 Staff Notes' : '📝 Feedback',
        value: adminNotes,
        inline: false
      });
    }

    // Add next steps
    if (isApproved) {
      (embed.fields as any[]).push({
        name: '📌 Next Steps',
        value: `Welcome to **${config.departmentName}**!\n• Check Discord for role updates\n• Report for duty and enjoy!`,
        inline: false
      });
    } else {
      (embed.fields as any[]).push({
        name: '💡 What\'s Next?',
        value: 'You may reapply after reviewing your application. Take your time to improve and try again!',
        inline: false
      });
    }

    // Add moderator as author if we have their avatar
    if (moderatorAvatarUrl) {
      embed.author = {
        name: `Reviewed by ${moderatorDisplayName}`,
        icon_url: moderatorAvatarUrl
      };
    }

    console.log(`Sending notification to channel ${channelId}`);

    // Send message to Discord
    const discordResponse = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: applicantMention,
          embeds: [embed],
          allowed_mentions: {
            users: applicantDiscordId ? [applicantDiscordId] : []
          }
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
    console.error('Error sending application notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});