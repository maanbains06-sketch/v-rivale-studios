import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FRAUD_ALERT_CHANNEL_ID = '1470356566980165674';
const ADMIN_ROLE_ID = '1466267679320182949';
const FRAUD_IMAGE_URL = 'https://skyliferoleplay.com/images/fraud-detection-alert.jpg';

interface FraudAlertPayload {
  submissionType: string;
  submissionId: string;
  submissionNumber?: string;
  discordId: string;
  discordUsername?: string;
  flags: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  fileUrls: string[];
  playerName?: string;
  playerId?: string;
  subject?: string;
}

function getRiskColor(riskLevel: string): number {
  switch (riskLevel) {
    case 'critical': return 0xFF0000; // Red
    case 'high': return 0xFF6600; // Orange
    case 'medium': return 0xFFCC00; // Yellow
    default: return 0x999999; // Grey
  }
}

function getRiskEmoji(riskLevel: string): string {
  switch (riskLevel) {
    case 'critical': return '🚨';
    case 'high': return '⚠️';
    case 'medium': return '⚡';
    default: return 'ℹ️';
  }
}

function getSubmissionTypeName(type: string): string {
  const typeMap: Record<string, string> = {
    'ticket': 'Support Ticket',
    'support_ticket': 'Support Ticket',
    'whitelist': 'Whitelist Application',
    'job_application': 'Job Application',
    'police': 'Police Application',
    'ems': 'EMS Application',
    'mechanic': 'Mechanic Application',
    'firefighter': 'Fire Department Application',
    'pdm': 'PDM Application',
    'weazel': 'Weazel News Application',
    'doj': 'DOJ Application',
    'state': 'State Department Application',
    'gang': 'Gang Application',
    'staff': 'Staff Application',
    'creator': 'Creator Application',
    'business': 'Business Proposal',
    'ban_appeal': 'Ban Appeal',
    'gallery': 'Gallery Submission',
    'refund': 'Refund Request',
  };
  return typeMap[type.toLowerCase()] || type;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN');
    
    if (!DISCORD_BOT_TOKEN) {
      console.error('DISCORD_BOT_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Discord bot token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const payload: FraudAlertPayload = await req.json();
    const {
      submissionType,
      submissionId,
      submissionNumber,
      discordId,
      discordUsername,
      flags,
      riskLevel,
      fileUrls,
      playerName,
      playerId,
      subject
    } = payload;
    
    console.log(`Sending fraud alert for ${submissionType} - ${submissionId}, Risk: ${riskLevel}`);
    
    const riskEmoji = getRiskEmoji(riskLevel);
    const submissionTypeName = getSubmissionTypeName(submissionType);
    
    // Build the flags list (max 10 to avoid embed limits)
    const flagsList = flags.slice(0, 10).map((flag, i) => `${i + 1}. ${flag}`).join('\n');
    const extraFlags = flags.length > 10 ? `\n... and ${flags.length - 10} more issues` : '';
    
    // Build suspicious files preview
    const filesPreview = fileUrls.slice(0, 3).map((url, i) => {
      const fileName = url.split('/').pop() || `File ${i + 1}`;
      return `[${fileName}](${url})`;
    }).join('\n');
    const extraFiles = fileUrls.length > 3 ? `\n... and ${fileUrls.length - 3} more files` : '';
    
    // Build the Discord embed
    const embed = {
      title: `${riskEmoji} FRAUD ALERT: Suspicious Evidence Detected`,
      description: `**Manipulated or edited files have been detected in a submission!**\n\nThis alert was triggered by our automated metadata scanning system. The attached files show signs of editing, manipulation, or re-encoding that may indicate fake evidence.`,
      color: getRiskColor(riskLevel),
      image: {
        url: FRAUD_IMAGE_URL
      },
      thumbnail: {
        url: 'https://skyliferoleplay.com/images/slrp-logo.png'
      },
      fields: [
        {
          name: '📋 Submission Type',
          value: submissionTypeName,
          inline: true
        },
        {
          name: '🔢 Reference ID',
          value: submissionNumber || submissionId.slice(0, 8),
          inline: true
        },
        {
          name: '🚦 Risk Level',
          value: `**${riskLevel.toUpperCase()}**`,
          inline: true
        },
        {
          name: '👤 Submitted By',
          value: `<@${discordId}>${discordUsername ? ` (${discordUsername})` : ''}`,
          inline: true
        },
        ...(playerName ? [{
          name: '🎮 Player Name',
          value: playerName,
          inline: true
        }] : []),
        ...(playerId ? [{
          name: '🆔 Player ID',
          value: playerId,
          inline: true
        }] : []),
        ...(subject ? [{
          name: '📝 Subject',
          value: subject.length > 100 ? subject.slice(0, 100) + '...' : subject,
          inline: false
        }] : []),
        {
          name: '🚩 Detected Issues',
          value: flagsList + extraFlags || 'Unknown manipulation detected',
          inline: false
        },
        {
          name: '📎 Suspicious Files',
          value: filesPreview + extraFiles || 'Files flagged',
          inline: false
        },
        {
          name: '⚡ Action Required',
          value: 'Please review this submission carefully. The attached evidence may be fabricated, edited, or manipulated. Consider requesting original, unedited proof from the user.',
          inline: false
        }
      ],
      footer: {
        text: '🛡️ SKYLIFE ROLEPLAY INDIA | Fraud Detection System',
        icon_url: 'https://skyliferoleplay.com/images/slrp-logo.png'
      },
      timestamp: new Date().toISOString()
    };
    
    // Send to Discord
    const discordResponse = await fetch(
      `https://discord.com/api/v10/channels/${FRAUD_ALERT_CHANNEL_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: `# 🚨 FRAUD ALERT\n\n<@&${ADMIN_ROLE_ID}> — Suspicious evidence detected from <@${discordId}>!\n\n**Risk Level: ${riskEmoji} ${riskLevel.toUpperCase()}**\n\nPlease review immediately.`,
          embeds: [embed],
          allowed_mentions: {
            roles: [ADMIN_ROLE_ID],
            users: [discordId]
          }
        })
      }
    );
    
    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();
      console.error('Discord API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to send Discord alert', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const result = await discordResponse.json();
    console.log('Fraud alert sent successfully:', result.id);
    
    return new Response(
      JSON.stringify({ success: true, messageId: result.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in send-fraud-alert:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
