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
  approvedImage: string;
  rejectedImage: string;
  title: string;
  departmentName: string;
  color: { approved: number; rejected: number };
}

const BASE_URL = 'https://id-preview--a7c56489-c067-439f-8b7a-1e11115ed907.lovable.app/images/applications';

const applicationConfigs: Record<string, AppConfig> = {
  'Police Department': {
    channelEnvKey: 'DISCORD_PD_CHANNEL_ID',
    approvedImage: `${BASE_URL}/pd-approved.jpg`,
    rejectedImage: `${BASE_URL}/pd-rejected.jpg`,
    title: 'Police Department Application',
    departmentName: 'Police Department',
    color: { approved: 0x3B82F6, rejected: 0xED4245 }
  },
  'police': {
    channelEnvKey: 'DISCORD_PD_CHANNEL_ID',
    approvedImage: `${BASE_URL}/pd-approved.jpg`,
    rejectedImage: `${BASE_URL}/pd-rejected.jpg`,
    title: 'Police Department Application',
    departmentName: 'Police Department',
    color: { approved: 0x3B82F6, rejected: 0xED4245 }
  },
  'EMS': {
    channelEnvKey: 'DISCORD_EMS_CHANNEL_ID',
    approvedImage: `${BASE_URL}/ems-approved.jpg`,
    rejectedImage: `${BASE_URL}/ems-rejected.jpg`,
    title: 'EMS Application',
    departmentName: 'EMS',
    color: { approved: 0xEF4444, rejected: 0xED4245 }
  },
  'ems': {
    channelEnvKey: 'DISCORD_EMS_CHANNEL_ID',
    approvedImage: `${BASE_URL}/ems-approved.jpg`,
    rejectedImage: `${BASE_URL}/ems-rejected.jpg`,
    title: 'EMS Application',
    departmentName: 'EMS',
    color: { approved: 0xEF4444, rejected: 0xED4245 }
  },
  'Mechanic': {
    channelEnvKey: 'DISCORD_MECHANIC_CHANNEL_ID',
    approvedImage: `${BASE_URL}/mechanic-approved.jpg`,
    rejectedImage: `${BASE_URL}/mechanic-rejected.jpg`,
    title: 'Mechanic Application',
    departmentName: 'Mechanic Shop',
    color: { approved: 0xF97316, rejected: 0xED4245 }
  },
  'mechanic': {
    channelEnvKey: 'DISCORD_MECHANIC_CHANNEL_ID',
    approvedImage: `${BASE_URL}/mechanic-approved.jpg`,
    rejectedImage: `${BASE_URL}/mechanic-rejected.jpg`,
    title: 'Mechanic Application',
    departmentName: 'Mechanic Shop',
    color: { approved: 0xF97316, rejected: 0xED4245 }
  },
  'DOJ - Judge': {
    channelEnvKey: 'DISCORD_DOJ_JUDGE_CHANNEL_ID',
    approvedImage: `${BASE_URL}/doj-judge-approved.jpg`,
    rejectedImage: `${BASE_URL}/doj-judge-rejected.jpg`,
    title: 'DOJ Judge Application',
    departmentName: 'Department of Justice',
    color: { approved: 0x8B5CF6, rejected: 0xED4245 }
  },
  'DOJ - Attorney': {
    channelEnvKey: 'DISCORD_DOJ_ATTORNEY_CHANNEL_ID',
    approvedImage: `${BASE_URL}/doj-attorney-approved.jpg`,
    rejectedImage: `${BASE_URL}/doj-attorney-rejected.jpg`,
    title: 'DOJ Attorney Application',
    departmentName: 'Department of Justice',
    color: { approved: 0x8B5CF6, rejected: 0xED4245 }
  },
  'State Department': {
    channelEnvKey: 'DISCORD_STATE_CHANNEL_ID',
    approvedImage: `${BASE_URL}/state-approved.jpg`,
    rejectedImage: `${BASE_URL}/state-rejected.jpg`,
    title: 'State Department Application',
    departmentName: 'State Department',
    color: { approved: 0x10B981, rejected: 0xED4245 }
  },
  'state': {
    channelEnvKey: 'DISCORD_STATE_CHANNEL_ID',
    approvedImage: `${BASE_URL}/state-approved.jpg`,
    rejectedImage: `${BASE_URL}/state-rejected.jpg`,
    title: 'State Department Application',
    departmentName: 'State Department',
    color: { approved: 0x10B981, rejected: 0xED4245 }
  },
  'Gang RP': {
    channelEnvKey: 'DISCORD_GANG_CHANNEL_ID',
    approvedImage: `${BASE_URL}/gang-approved.jpg`,
    rejectedImage: `${BASE_URL}/gang-rejected.jpg`,
    title: 'Gang RP Application',
    departmentName: 'Gang RP',
    color: { approved: 0x991B1B, rejected: 0xED4245 }
  },
  'PDM': {
    channelEnvKey: 'DISCORD_PDM_CHANNEL_ID',
    approvedImage: `${BASE_URL}/pdm-approved.jpg`,
    rejectedImage: `${BASE_URL}/pdm-rejected.jpg`,
    title: 'PDM Dealership Application',
    departmentName: 'Premium Deluxe Motorsport',
    color: { approved: 0xEAB308, rejected: 0xED4245 }
  },
  'Firefighter': {
    channelEnvKey: 'DISCORD_FIREFIGHTER_CHANNEL_ID',
    approvedImage: `${BASE_URL}/firefighter-approved.jpg`,
    rejectedImage: `${BASE_URL}/firefighter-rejected.jpg`,
    title: 'Firefighter Application',
    departmentName: 'Fire Department',
    color: { approved: 0xDC2626, rejected: 0xED4245 }
  },
  'Weazel News': {
    channelEnvKey: 'DISCORD_WEAZEL_CHANNEL_ID',
    approvedImage: `${BASE_URL}/weazel-approved.jpg`,
    rejectedImage: `${BASE_URL}/weazel-rejected.jpg`,
    title: 'Weazel News Application',
    departmentName: 'Weazel News',
    color: { approved: 0x06B6D4, rejected: 0xED4245 }
  },
  'Creator': {
    channelEnvKey: 'DISCORD_CREATOR_CHANNEL_ID',
    approvedImage: `${BASE_URL}/creator-approved.jpg`,
    rejectedImage: `${BASE_URL}/creator-rejected.jpg`,
    title: 'Creator Program Application',
    departmentName: 'Creator Program',
    color: { approved: 0xA855F7, rejected: 0xED4245 }
  },
  'Staff': {
    channelEnvKey: 'DISCORD_STAFF_CHANNEL_ID',
    approvedImage: `${BASE_URL}/staff-approved.jpg`,
    rejectedImage: `${BASE_URL}/staff-rejected.jpg`,
    title: 'Staff Application',
    departmentName: 'Staff Team',
    color: { approved: 0x22C55E, rejected: 0xED4245 }
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
    const imageUrl = isApproved ? config.approvedImage : config.rejectedImage;

    // Build applicant mention
    const applicantMention = applicantDiscordId 
      ? `<@${applicantDiscordId}>` 
      : `@${applicantName}`;

    // Build moderator display
    const moderatorMention = moderatorDiscordId 
      ? `<@${moderatorDiscordId}>` 
      : moderatorDisplayName;

    // Build fields
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
        name: '\u200B',
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

    // Add admin notes if provided
    if (adminNotes && adminNotes.trim()) {
      fields.push({
        name: isApproved ? '📝 Notes from Staff' : '📝 Reason / Feedback',
        value: `>>> ${adminNotes}`,
        inline: false
      });
    }

    // Add next steps
    if (isApproved) {
      fields.push({
        name: '📌 Next Steps',
        value: `1. Welcome to the **${config.departmentName}**!\n2. Check your Discord for role updates\n3. Report for duty and enjoy your new role!`,
        inline: false
      });
    } else {
      fields.push({
        name: '💡 What\'s Next?',
        value: adminNotes?.trim() 
          ? 'Please review the feedback above. You may reapply after addressing the concerns mentioned.'
          : 'You may reapply after reviewing your application. Take your time to improve and try again!',
        inline: false
      });
    }

    // Build embed with REQUIRED image
    const embed: Record<string, unknown> = {
      title: isApproved ? `🎉 ${config.title} Approved!` : `📋 ${config.title} Status Update`,
      description: isApproved 
        ? `Congratulations! Your ${config.departmentName} application has been **approved**!\n\n✨ Welcome to the team! We're excited to have you.`
        : `Your ${config.departmentName} application has been **reviewed** and unfortunately was not approved at this time.`,
      color: isApproved ? config.color.approved : config.color.rejected,
      fields,
      image: {
        url: imageUrl
      },
      footer: {
        text: `SkyLife RP • ${config.departmentName}`,
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

    console.log(`Sending notification to channel ${channelId} with image: ${imageUrl}`);

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
      JSON.stringify({ success: true, messageId: discordResult.id, imageUrl }),
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
