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
  primaryCategory?: 'manipulation' | 'inappropriate' | 'language' | 'fake' | 'clean';
  fileUrls: string[];
  playerName?: string;
  playerId?: string;
  subject?: string;
  messagePreview?: string;
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

function getCategoryInfo(category: string): { emoji: string; title: string; description: string } {
  switch (category) {
    case 'manipulation':
      return {
        emoji: '🖌️',
        title: 'EDITED/MANIPULATED FILES',
        description: 'The attached files show signs of editing, manipulation, or post-processing. The evidence may have been altered to fabricate claims.'
      };
    case 'fake':
      return {
        emoji: '🎭',
        title: 'FAKE/FABRICATED EVIDENCE',
        description: 'The files appear to be fabricated or artificially created. This includes composite images, fake screenshots, or generated content.'
      };
    case 'inappropriate':
      return {
        emoji: '🔞',
        title: '18+ / INAPPROPRIATE CONTENT',
        description: 'The submission contains sexually explicit, violent, or other inappropriate content that violates community guidelines.'
      };
    case 'language':
      return {
        emoji: '🚫',
        title: 'PROFANITY / BAD LANGUAGE',
        description: 'The submission contains offensive language, profanity, or abusive text that violates community standards.'
      };
    default:
      return {
        emoji: '⚠️',
        title: 'SUSPICIOUS SUBMISSION',
        description: 'The submission has been flagged for review due to potential policy violations.'
      };
  }
}

function getSubmissionTypeName(type: string): string {
  const typeMap: Record<string, string> = {
    'ticket': 'Support Ticket',
    'support_ticket': 'Support Ticket',
    'support_chat': 'Live Support Chat',
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

function getActionRequired(category: string): string {
  switch (category) {
    case 'manipulation':
      return '**ACTION REQUIRED:**\n• Request original, unedited files from the user\n• Compare timestamps and metadata\n• Consider rejecting if manipulation is confirmed\n• Document the incident in admin notes';
    case 'fake':
      return '**ACTION REQUIRED:**\n• Do NOT accept this as valid evidence\n• Request authentic, verifiable proof\n• Consider issuing a warning for fake evidence submission\n• Escalate if this is a repeat offense';
    case 'inappropriate':
      return '**IMMEDIATE ACTION REQUIRED:**\n• Delete the content immediately\n• Issue a formal warning or ban based on severity\n• Document the violation\n• Report to senior staff if content is illegal';
    case 'language':
      return '**ACTION REQUIRED:**\n• Issue a verbal/written warning for language\n• Remind user of community guidelines\n• Process the request if underlying issue is valid\n• Note the behavior in user records';
    default:
      return '**ACTION REQUIRED:**\n• Review the submission carefully\n• Request clarification if needed\n• Document any suspicious activity\n• Consult senior staff if unsure';
  }
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
      primaryCategory = 'manipulation',
      fileUrls,
      playerName,
      playerId,
      subject,
      messagePreview
    } = payload;
    
    console.log(`Sending fraud alert for ${submissionType} - ${submissionId}, Risk: ${riskLevel}, Category: ${primaryCategory}`);
    
    const riskEmoji = getRiskEmoji(riskLevel);
    const submissionTypeName = getSubmissionTypeName(submissionType);
    const categoryInfo = getCategoryInfo(primaryCategory);
    const actionRequired = getActionRequired(primaryCategory);
    
    // Build the flags list with proper formatting (max 10 to avoid embed limits)
    const flagsList = flags.slice(0, 10).map((flag) => `• ${flag}`).join('\n');
    const extraFlags = flags.length > 10 ? `\n*... and ${flags.length - 10} more issues*` : '';
    
    // Build suspicious files preview
    const filesPreview = fileUrls && fileUrls.length > 0 
      ? fileUrls.slice(0, 3).map((url, i) => {
          const fileName = url.split('/').pop() || `File ${i + 1}`;
          return `[📎 ${fileName}](${url})`;
        }).join('\n')
      : '*No files attached*';
    const extraFiles = fileUrls && fileUrls.length > 3 ? `\n*... and ${fileUrls.length - 3} more files*` : '';
    
    // Build message preview if available
    const messageField = messagePreview ? [{
      name: '💬 Message Preview',
      value: messagePreview.length > 200 ? messagePreview.slice(0, 200) + '...' : messagePreview,
      inline: false
    }] : [];
    
    // Build the Discord embed
    const embed = {
      title: `${categoryInfo.emoji} ${categoryInfo.title}`,
      description: `**${riskEmoji} RISK LEVEL: ${riskLevel.toUpperCase()}**\n\n${categoryInfo.description}`,
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
        ...messageField,
        {
          name: '🚩 Issues Detected',
          value: flagsList + extraFlags || '*Unknown issue detected*',
          inline: false
        },
        ...(fileUrls && fileUrls.length > 0 ? [{
          name: '📎 Suspicious Files',
          value: filesPreview + extraFiles,
          inline: false
        }] : []),
        {
          name: '⚡ Required Action',
          value: actionRequired,
          inline: false
        }
      ],
      footer: {
        text: '🛡️ SKYLIFE ROLEPLAY INDIA | Automated Fraud Detection',
        icon_url: 'https://skyliferoleplay.com/images/slrp-logo.png'
      },
      timestamp: new Date().toISOString()
    };
    
    // Build alert header based on category
    let alertHeader = '';
    switch (primaryCategory) {
      case 'inappropriate':
        alertHeader = `# 🔞 18+ CONTENT ALERT\n\n<@&${ADMIN_ROLE_ID}> — **INAPPROPRIATE CONTENT** submitted by <@${discordId}>!`;
        break;
      case 'language':
        alertHeader = `# 🚫 PROFANITY ALERT\n\n<@&${ADMIN_ROLE_ID}> — **OFFENSIVE LANGUAGE** detected from <@${discordId}>!`;
        break;
      case 'fake':
        alertHeader = `# 🎭 FAKE EVIDENCE ALERT\n\n<@&${ADMIN_ROLE_ID}> — **FABRICATED EVIDENCE** detected from <@${discordId}>!`;
        break;
      default:
        alertHeader = `# 🖌️ EDITED FILES ALERT\n\n<@&${ADMIN_ROLE_ID}> — **MANIPULATED FILES** detected from <@${discordId}>!`;
    }
    
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
          content: `${alertHeader}\n\n**Risk Level: ${riskEmoji} ${riskLevel.toUpperCase()}**\n\nPlease review immediately.`,
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
