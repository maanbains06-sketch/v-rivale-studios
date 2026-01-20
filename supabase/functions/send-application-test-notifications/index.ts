import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChannelConfig {
  name: string;
  channelEnvKey: string;
  approvedImage: string;
  rejectedImage: string;
  title: string;
  color: { approved: number; rejected: number };
}

const BASE_URL = 'https://id-preview--a7c56489-c067-439f-8b7a-1e11115ed907.lovable.app/images/applications';

// Only channels with images available
const channelConfigs: ChannelConfig[] = [
  {
    name: 'Police Department',
    channelEnvKey: 'DISCORD_PD_CHANNEL_ID',
    approvedImage: `${BASE_URL}/pd-approved.jpg`,
    rejectedImage: `${BASE_URL}/pd-rejected.jpg`,
    title: 'Police Department Application',
    color: { approved: 0x3B82F6, rejected: 0xED4245 }
  },
  {
    name: 'EMS',
    channelEnvKey: 'DISCORD_EMS_CHANNEL_ID',
    approvedImage: `${BASE_URL}/ems-approved.jpg`,
    rejectedImage: `${BASE_URL}/ems-rejected.jpg`,
    title: 'EMS Application',
    color: { approved: 0xEF4444, rejected: 0xED4245 }
  },
  {
    name: 'Mechanic',
    channelEnvKey: 'DISCORD_MECHANIC_CHANNEL_ID',
    approvedImage: `${BASE_URL}/mechanic-approved.jpg`,
    rejectedImage: `${BASE_URL}/mechanic-rejected.jpg`,
    title: 'Mechanic Application',
    color: { approved: 0xF97316, rejected: 0xED4245 }
  },
  {
    name: 'DOJ - Judge',
    channelEnvKey: 'DISCORD_DOJ_JUDGE_CHANNEL_ID',
    approvedImage: `${BASE_URL}/doj-judge-approved.jpg`,
    rejectedImage: `${BASE_URL}/doj-judge-rejected.jpg`,
    title: 'DOJ Judge Application',
    color: { approved: 0x8B5CF6, rejected: 0xED4245 }
  },
  {
    name: 'DOJ - Attorney',
    channelEnvKey: 'DISCORD_DOJ_ATTORNEY_CHANNEL_ID',
    approvedImage: `${BASE_URL}/doj-attorney-approved.jpg`,
    rejectedImage: `${BASE_URL}/doj-attorney-rejected.jpg`,
    title: 'DOJ Attorney Application',
    color: { approved: 0x8B5CF6, rejected: 0xED4245 }
  },
  {
    name: 'State Department',
    channelEnvKey: 'DISCORD_STATE_CHANNEL_ID',
    approvedImage: `${BASE_URL}/state-approved.jpg`,
    rejectedImage: `${BASE_URL}/state-rejected.jpg`,
    title: 'State Department Application',
    color: { approved: 0x10B981, rejected: 0xED4245 }
  }
];

async function sendTestMessage(
  botToken: string,
  channelId: string,
  config: ChannelConfig,
  status: 'approved' | 'rejected'
): Promise<{ success: boolean; error?: string }> {
  const isApproved = status === 'approved';
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

  const embed = {
    title: isApproved ? `🎉 ${config.title} Approved!` : `📋 ${config.title} Status Update`,
    description: isApproved 
      ? `Congratulations! Your ${config.name} application has been **approved**!\n\n✨ Welcome to the team! We're excited to have you.`
      : `Your ${config.name} application has been **reviewed** and unfortunately was not approved at this time.`,
    color: isApproved ? config.color.approved : config.color.rejected,
    fields: [
      {
        name: '👤 Applicant',
        value: '@TestApplicant',
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
        value: 'System Test',
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
      },
      {
        name: '📝 Notes',
        value: `>>> This is a **test notification** for the ${config.name} application system.`,
        inline: false
      }
    ],
    image: {
      url: isApproved ? config.approvedImage : config.rejectedImage
    },
    footer: {
      text: `SkyLife RP • ${config.name} System`,
      icon_url: 'https://roleplay-horizon.lovable.app/images/slrp-logo.png'
    },
    timestamp: now.toISOString()
  };

  try {
    const response = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: `🧪 **TEST NOTIFICATION** - ${config.name} ${status.toUpperCase()}`,
          embeds: [embed]
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to send ${config.name} ${status}:`, errorText);
      return { success: false, error: errorText };
    }

    console.log(`✅ Sent ${config.name} ${status} notification`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error sending ${config.name} ${status}:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_WHITELIST_BOT_TOKEN');
    
    if (!DISCORD_BOT_TOKEN) {
      return new Response(
        JSON.stringify({ error: 'DISCORD_WHITELIST_BOT_TOKEN not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: { channel: string; approved: boolean; rejected: boolean; error?: string }[] = [];

    for (const config of channelConfigs) {
      const channelId = Deno.env.get(config.channelEnvKey);
      
      if (!channelId) {
        console.log(`⚠️ Skipping ${config.name}: ${config.channelEnvKey} not configured`);
        results.push({ 
          channel: config.name, 
          approved: false, 
          rejected: false, 
          error: `${config.channelEnvKey} not configured` 
        });
        continue;
      }

      console.log(`📤 Sending test messages for ${config.name} to channel ${channelId}...`);
      
      // Send approved notification
      const approvedResult = await sendTestMessage(DISCORD_BOT_TOKEN, channelId, config, 'approved');
      
      // Small delay between messages
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Send rejected notification
      const rejectedResult = await sendTestMessage(DISCORD_BOT_TOKEN, channelId, config, 'rejected');
      
      results.push({
        channel: config.name,
        approved: approvedResult.success,
        rejected: rejectedResult.success,
        error: approvedResult.error || rejectedResult.error
      });
      
      // Delay between channels to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const successCount = results.filter(r => r.approved && r.rejected).length;
    const totalConfigured = results.filter(r => !r.error?.includes('not configured')).length;

    console.log(`\n📊 Summary: ${successCount}/${totalConfigured} channels received both notifications`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        summary: {
          totalChannels: channelConfigs.length,
          configuredChannels: totalConfigured,
          successfulChannels: successCount
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending test notifications:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
