import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FRAUD_ALERT_CHANNEL_ID = '1470356566980165674';
const ADMIN_ROLE_ID = '1466267679320182949';
const FRAUD_IMAGE_URL = 'https://obirpzwvnqveddyuulsb.supabase.co/storage/v1/object/public/discord-assets/fraud-detection-alert.jpg';

interface FileResult {
  url: string;
  result: {
    isSuspicious: boolean;
    flags: string[];
    details: Record<string, any>;
    riskLevel: string;
    category: string;
  };
}

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
  fileResults?: FileResult[];
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

function formatFileProof(fileResults: FileResult[]): string {
  if (!fileResults || fileResults.length === 0) {
    return '*No detailed file analysis available*';
  }

  const proofLines: string[] = [];
  
  for (const file of fileResults) {
    if (!file.result.isSuspicious) continue;
    
    const fileName = file.url.split('/').pop() || 'Unknown File';
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.url);
    const isVideo = /\.(mp4|webm|mov|avi|mkv)$/i.test(file.url);
    const fileType = isImage ? '🖼️ IMAGE' : isVideo ? '🎬 VIDEO' : '📄 FILE';
    
    proofLines.push(`\n**${fileType}: \`${fileName}\`**`);
    proofLines.push(`└ Risk Level: **${file.result.riskLevel.toUpperCase()}**`);
    
    // Add specific proof details
    const details = file.result.details;
    
    if (details.editingSoftware) {
      proofLines.push(`└ 🔍 **Editing Software Found:** \`${details.editingSoftware.toUpperCase()}\``);
    }
    
    if (details.encoder) {
      proofLines.push(`└ 🔍 **Video Encoder Found:** \`${details.encoder.toUpperCase()}\``);
    }
    
    if (details.reencoder) {
      proofLines.push(`└ 🔍 **Re-encoding Marker:** \`${details.reencoder.toUpperCase()}\``);
    }
    
    if (details.contentType) {
      proofLines.push(`└ 📁 File Type: \`${details.contentType}\``);
    }
    
    if (details.fileSize) {
      const sizeKB = Math.round(details.fileSize / 1024);
      const sizeMB = (details.fileSize / (1024 * 1024)).toFixed(2);
      const sizeStr = sizeKB < 1024 ? `${sizeKB} KB` : `${sizeMB} MB`;
      proofLines.push(`└ 📦 File Size: \`${sizeStr}\``);
      
      if (isImage && details.fileSize < 10000) {
        proofLines.push(`└ ⚠️ **SUSPICIOUS:** File size too small - likely heavily cropped/compressed`);
      }
    }
    
    if (details.isScreenRecording) {
      proofLines.push(`└ 🖥️ **Screen Recording Detected** - Not direct game capture`);
    }
    
    // Add all flags as proof points
    if (file.result.flags && file.result.flags.length > 0) {
      proofLines.push(`└ 🚩 **Evidence of Manipulation:**`);
      for (const flag of file.result.flags.slice(0, 5)) {
        proofLines.push(`   • ${flag}`);
      }
      if (file.result.flags.length > 5) {
        proofLines.push(`   • *...and ${file.result.flags.length - 5} more issues*`);
      }
    }
  }
  
  return proofLines.length > 0 ? proofLines.join('\n') : '*No suspicious files detected*';
}

function buildTechnicalProofEmbed(fileResults: FileResult[]): any {
  const suspiciousFiles = fileResults?.filter(f => f.result.isSuspicious) || [];
  
  if (suspiciousFiles.length === 0) {
    return null;
  }
  
  const proofDetails: string[] = [];
  
  for (const file of suspiciousFiles) {
    const fileName = file.url.split('/').pop() || 'Unknown';
    const details = file.result.details;
    
    proofDetails.push(`**📄 ${fileName}**`);
    
    // Technical metadata proof
    if (details.editingSoftware) {
      proofDetails.push(`• EXIF Software Tag: \`${details.editingSoftware}\``);
      proofDetails.push(`  ↳ This software signature was found embedded in file metadata`);
    }
    
    if (details.encoder) {
      proofDetails.push(`• Encoder Signature: \`${details.encoder}\``);
      proofDetails.push(`  ↳ Video was processed through this encoding software`);
    }
    
    if (details.reencoder) {
      proofDetails.push(`• Re-encode Marker: \`${details.reencoder}\``);
      proofDetails.push(`  ↳ File shows signs of being re-processed/converted`);
    }
    
    // File anomalies
    if (details.fileSize && details.fileSize < 10000 && /\.(jpg|jpeg|png)$/i.test(file.url)) {
      proofDetails.push(`• Anomaly: Extremely small image (${Math.round(details.fileSize / 1024)}KB)`);
      proofDetails.push(`  ↳ Normal screenshots are typically 100KB-2MB`);
    }
    
    proofDetails.push('');
  }
  
  return {
    title: '🔬 TECHNICAL PROOF OF MANIPULATION',
    description: 'The following metadata signatures were extracted from the submitted files:',
    color: 0x8B0000, // Dark red
    fields: [
      {
        name: '📊 Metadata Analysis Results',
        value: proofDetails.join('\n').slice(0, 1024) || 'Analysis data unavailable',
        inline: false
      },
      {
        name: '💡 What This Means',
        value: '**Editing software signatures** in file metadata prove the file was opened and modified in an image/video editor before submission.\n\n**Re-encoding markers** indicate the original video was converted or processed, which is commonly done to hide editing artifacts.',
        inline: false
      }
    ],
    footer: {
      text: '🛡️ Automated Metadata Forensics | SKYLIFE ROLEPLAY',
      icon_url: 'https://skyliferoleplay.com/images/slrp-logo.png'
    }
  };
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
      fileResults,
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
    
    // Format detailed file proof
    const fileProofText = formatFileProof(fileResults || []);
    
    // Build message preview if available
    const messageField = messagePreview ? [{
      name: '💬 Message Preview',
      value: messagePreview.length > 200 ? messagePreview.slice(0, 200) + '...' : messagePreview,
      inline: false
    }] : [];
    
    // Build suspicious files preview with links
    const filesPreview = fileUrls && fileUrls.length > 0 
      ? fileUrls.slice(0, 3).map((url, i) => {
          const fileName = url.split('/').pop() || `File ${i + 1}`;
          return `[📎 ${fileName}](${url})`;
        }).join('\n')
      : '*No files attached*';
    const extraFiles = fileUrls && fileUrls.length > 3 ? `\n*... and ${fileUrls.length - 3} more files*` : '';
    
    // Main alert embed
    const mainEmbed = {
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
        ...(fileUrls && fileUrls.length > 0 ? [{
          name: '📎 Flagged Files',
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
    
    // Proof embed with detailed file analysis
    const proofEmbed = {
      title: '🔍 DETAILED PROOF & EVIDENCE',
      description: 'The following issues were detected during automated file analysis:',
      color: 0x2C2F33,
      fields: [
        {
          name: '📂 File-by-File Analysis',
          value: fileProofText.slice(0, 1024) || '*No file analysis available*',
          inline: false
        },
        {
          name: '🚩 Summary of Issues Detected',
          value: flags.slice(0, 8).map((flag, i) => `${i + 1}. ${flag}`).join('\n').slice(0, 1024) || '*No issues listed*',
          inline: false
        }
      ],
      footer: {
        text: 'This proof was extracted from file metadata and content analysis'
      }
    };
    
    // Build technical proof embed if we have file results
    const technicalProofEmbed = buildTechnicalProofEmbed(fileResults || []);
    
    // Prepare embeds array
    const embeds = [mainEmbed, proofEmbed];
    if (technicalProofEmbed) {
      embeds.push(technicalProofEmbed);
    }
    
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
          content: `${alertHeader}\n\n**Risk Level: ${riskEmoji} ${riskLevel.toUpperCase()}**\n\n> 📌 **Scroll down for detailed proof of manipulation**\n\nPlease review immediately.`,
          embeds: embeds,
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
