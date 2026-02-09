import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id, ip_address, fingerprint_hash, user_agent } = await req.json();

    if (!user_id) throw new Error('user_id required');

    // Log the IP/fingerprint
    if (ip_address) {
      await supabase.from('login_ip_log').insert({
        user_id,
        ip_address,
        fingerprint_hash,
        user_agent,
      });
    }

    // Store/update fingerprint
    if (fingerprint_hash) {
      const { data: existing } = await supabase
        .from('device_fingerprints')
        .select('id, is_blocked')
        .eq('user_id', user_id)
        .eq('fingerprint_hash', fingerprint_hash)
        .maybeSingle();

      if (existing) {
        // Check if this fingerprint is blocked
        if (existing.is_blocked) {
          await sendBanAlert(user_id, 'Device has been banned (fingerprint blocked)', fingerprint_hash);
          return new Response(JSON.stringify({ 
            blocked: true, 
            reason: 'This device has been banned from accessing the website.' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        await supabase
          .from('device_fingerprints')
          .update({ ip_address, user_agent, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        // Check if this fingerprint belongs to a banned device
        const { data: blockedFp } = await supabase
          .from('device_fingerprints')
          .select('id, user_id')
          .eq('fingerprint_hash', fingerprint_hash)
          .eq('is_blocked', true)
          .limit(1);

        if (blockedFp && blockedFp.length > 0) {
          // This device is banned! Block and record
          await supabase.from('device_fingerprints').insert({
            user_id,
            fingerprint_hash,
            ip_address,
            user_agent,
            is_blocked: true,
          });

          await sendBanAlert(user_id, 'New account on a banned device (fingerprint match)', fingerprint_hash);

          return new Response(JSON.stringify({ 
            blocked: true, 
            reason: 'This device has been banned from accessing the website.' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        await supabase.from('device_fingerprints').insert({
          user_id,
          fingerprint_hash,
          ip_address,
          user_agent,
        });
      }
    }

    // Check for alt accounts by IP
    const detections: any[] = [];

    if (ip_address) {
      const { data: ipMatches } = await supabase
        .from('login_ip_log')
        .select('user_id')
        .eq('ip_address', ip_address)
        .neq('user_id', user_id);

      const uniqueUserIds = [...new Set(ipMatches?.map(m => m.user_id) || [])];

      for (const altUserId of uniqueUserIds) {
        // Check if already detected
        const { data: existingDetection } = await supabase
          .from('alt_account_detections')
          .select('id')
          .or(`and(primary_user_id.eq.${user_id},alt_user_id.eq.${altUserId}),and(primary_user_id.eq.${altUserId},alt_user_id.eq.${user_id})`)
          .eq('detection_type', 'ip_match')
          .maybeSingle();

        if (!existingDetection) {
          // Get profiles for both users
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, discord_username, discord_id')
            .in('id', [user_id, altUserId]);

          const primaryProfile = profiles?.find(p => p.id === user_id);
          const altProfile = profiles?.find(p => p.id === altUserId);

          const ipMatchCount = ipMatches?.filter(m => m.user_id === altUserId).length || 0;
          const confidence = Math.min(95, 40 + (ipMatchCount * 10));

          const { data: detection } = await supabase
            .from('alt_account_detections')
            .insert({
              primary_user_id: user_id,
              alt_user_id: altUserId,
              detection_type: 'ip_match',
              confidence_score: confidence,
              ip_address,
              fingerprint_hash,
              details: {
                primary_username: primaryProfile?.discord_username,
                primary_discord_id: primaryProfile?.discord_id,
                alt_username: altProfile?.discord_username,
                alt_discord_id: altProfile?.discord_id,
                shared_ip: ip_address,
                match_count: ipMatchCount,
              },
            })
            .select()
            .single();

          if (detection) {
            detections.push(detection);
            // Send Discord alert
            await sendDetectionAlert(detection);
          }
        }
      }
    }

    // Check for alt accounts by fingerprint
    if (fingerprint_hash) {
      const { data: fpMatches } = await supabase
        .from('device_fingerprints')
        .select('user_id')
        .eq('fingerprint_hash', fingerprint_hash)
        .neq('user_id', user_id);

      const uniqueFpUserIds = [...new Set(fpMatches?.map(m => m.user_id).filter(Boolean) || [])];

      for (const altUserId of uniqueFpUserIds) {
        const { data: existingDetection } = await supabase
          .from('alt_account_detections')
          .select('id')
          .or(`and(primary_user_id.eq.${user_id},alt_user_id.eq.${altUserId}),and(primary_user_id.eq.${altUserId},alt_user_id.eq.${user_id})`)
          .eq('detection_type', 'fingerprint_match')
          .maybeSingle();

        if (!existingDetection) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, discord_username, discord_id')
            .in('id', [user_id, altUserId]);

          const primaryProfile = profiles?.find(p => p.id === user_id);
          const altProfile = profiles?.find(p => p.id === altUserId);

          const { data: detection } = await supabase
            .from('alt_account_detections')
            .insert({
              primary_user_id: user_id,
              alt_user_id: altUserId,
              detection_type: 'fingerprint_match',
              confidence_score: 85,
              ip_address,
              fingerprint_hash,
              details: {
                primary_username: primaryProfile?.discord_username,
                primary_discord_id: primaryProfile?.discord_id,
                alt_username: altProfile?.discord_username,
                alt_discord_id: altProfile?.discord_id,
                shared_fingerprint: fingerprint_hash,
              },
            })
            .select()
            .single();

          if (detection) {
            detections.push(detection);
            await sendDetectionAlert(detection);
          }
        }
      }
    }

    // Check if user is website-banned
    const { data: ban } = await supabase
      .from('website_bans')
      .select('id, ban_reason')
      .eq('is_active', true)
      .or(`user_id.eq.${user_id}${fingerprint_hash ? `,fingerprint_hashes.cs.{${fingerprint_hash}}` : ''}`)
      .limit(1);

    if (ban && ban.length > 0) {
      await sendBanAlert(user_id, ban[0].ban_reason || 'Website ban active', fingerprint_hash);
      return new Response(JSON.stringify({ 
        blocked: true, 
        reason: ban[0].ban_reason || 'You are banned from this website.' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      blocked: false, 
      detections_found: detections.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Alt detection error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      blocked: false,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function sendDetectionAlert(detection: any) {
  const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN');
  const CHANNEL_ID = Deno.env.get('DISCORD_DETECTION_CHANNEL_ID');
  const ADMIN_ROLE_ID = '1466267679320182949';

  if (!DISCORD_BOT_TOKEN || !CHANNEL_ID) return;

  const details = detection.details || {};
  const isIpMatch = detection.detection_type === 'ip_match';
  const confidence = detection.confidence_score || 0;

  const bannerUrl = 'https://skyliferoleplay.com/images/alt-detection-alert.jpg';
  const logoUrl = 'https://skyliferoleplay.com/images/slrp-logo.png';

  // Color based on confidence
  const embedColor = confidence >= 80 ? 0xED4245 : confidence >= 50 ? 0xFEE75C : 0x57F287;

  // Confidence bar visual
  const filledBlocks = Math.round(confidence / 10);
  const emptyBlocks = 10 - filledBlocks;
  const confidenceBar = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
  const severityLabel = confidence >= 80 ? '🔴 HIGH RISK' : confidence >= 50 ? '🟡 MEDIUM RISK' : '🟢 LOW RISK';

  // User display
  const account1 = details.primary_discord_id
    ? `<@${details.primary_discord_id}>\n\`${details.primary_username || 'Unknown'}\``
    : `\`${details.primary_username || 'Unknown'}\``;

  const account2 = details.alt_discord_id
    ? `<@${details.alt_discord_id}>\n\`${details.alt_username || 'Unknown'}\``
    : `\`${details.alt_username || 'Unknown'}\``;

  const sharedValue = isIpMatch
    ? `\`${detection.ip_address || 'Hidden'}\``
    : `\`${detection.fingerprint_hash?.substring(0, 20)}...\``;

  const embed = {
    author: {
      name: 'SKYLIFE ROLEPLAY INDIA • Security System',
      icon_url: logoUrl,
    },
    title: isIpMatch
      ? '🌐 ALT-ACCOUNT DETECTED — IP Address Match'
      : '🖥️ ALT-ACCOUNT DETECTED — Device Fingerprint Match',
    description: `Two accounts have been flagged sharing the same **${isIpMatch ? 'IP address' : 'device fingerprint'}**. Immediate review is recommended.`,
    color: embedColor,
    thumbnail: { url: logoUrl },
    fields: [
      {
        name: '━━━━━ ACCOUNT DETAILS ━━━━━',
        value: '\u200b',
        inline: false,
      },
      {
        name: '👤 Primary Account',
        value: account1,
        inline: true,
      },
      {
        name: '⚠️ Suspected Alt',
        value: account2,
        inline: true,
      },
      {
        name: '\u200b',
        value: '\u200b',
        inline: true,
      },
      {
        name: '━━━━━ THREAT ANALYSIS ━━━━━',
        value: '\u200b',
        inline: false,
      },
      {
        name: '📊 Confidence Level',
        value: `\`${confidenceBar}\` **${confidence}%**\n${severityLabel}`,
        inline: true,
      },
      {
        name: isIpMatch ? '🌐 Shared IP' : '🖥️ Shared Fingerprint',
        value: sharedValue,
        inline: true,
      },
      ...(isIpMatch && details.match_count ? [{
        name: '🔁 Match Count',
        value: `**${details.match_count}** shared login(s)`,
        inline: true,
      }] : []),
      {
        name: '━━━━━ ACTION REQUIRED ━━━━━',
        value: `<@&${ADMIN_ROLE_ID}> — Please investigate and take appropriate action.\nUse the **Owner Panel → Detection** page to review and manage.`,
        inline: false,
      },
    ],
    image: { url: bannerUrl },
    footer: {
      text: 'SKYLIFE ROLEPLAY INDIA • Alt-Account Detection System',
      icon_url: logoUrl,
    },
    timestamp: new Date().toISOString(),
  };

  try {
    const mentionParts = [`<@&${ADMIN_ROLE_ID}>`];
    if (details.primary_discord_id) mentionParts.push(`<@${details.primary_discord_id}>`);
    if (details.alt_discord_id) mentionParts.push(`<@${details.alt_discord_id}>`);

    await fetch(`https://discord.com/api/v10/channels/${CHANNEL_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: `🚨 **ALT-ACCOUNT ALERT** — ${mentionParts.join(' ')}`,
        embeds: [embed],
      }),
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    await supabase
      .from('alt_account_detections')
      .update({ discord_alert_sent: true })
      .eq('id', detection.id);
  } catch (error) {
    console.error('Failed to send detection alert:', error);
  }
}

async function sendBanAlert(userId: string, banReason: string, fingerprint?: string) {
  const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN');
  const CHANNEL_ID = Deno.env.get('DISCORD_DETECTION_CHANNEL_ID');
  const ADMIN_ROLE_ID = '1466267679320182949';

  if (!DISCORD_BOT_TOKEN || !CHANNEL_ID) return;

  const logoUrl = 'https://skyliferoleplay.com/images/slrp-logo.png';

  // Look up user profile
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data: profile } = await supabase
    .from('profiles')
    .select('discord_username, discord_id')
    .eq('id', userId)
    .maybeSingle();

  const userDisplay = profile?.discord_id
    ? `<@${profile.discord_id}>\n\`${profile.discord_username || 'Unknown'}\``
    : `\`${profile?.discord_username || userId}\``;

  const embed = {
    author: {
      name: 'SKYLIFE ROLEPLAY INDIA • Ban Enforcement',
      icon_url: logoUrl,
    },
    title: '🔨 WEBSITE BAN — Access Blocked',
    description: 'A user has been **denied access** to the website due to an active ban.',
    color: 0x000000,
    thumbnail: { url: logoUrl },
    fields: [
      {
        name: '👤 Banned User',
        value: userDisplay,
        inline: true,
      },
      {
        name: '📋 Ban Reason',
        value: banReason || 'No reason specified',
        inline: true,
      },
      ...(fingerprint ? [{
        name: '🖥️ Device Fingerprint',
        value: `\`${fingerprint.substring(0, 20)}...\``,
        inline: false,
      }] : []),
      {
        name: '🛡️ Enforcement',
        value: 'This user will be blocked on **all devices** and **accounts** linked to their fingerprint/IP.',
        inline: false,
      },
    ],
    footer: {
      text: 'SKYLIFE ROLEPLAY INDIA • Website Ban System',
      icon_url: logoUrl,
    },
    timestamp: new Date().toISOString(),
  };

  try {
    await fetch(`https://discord.com/api/v10/channels/${CHANNEL_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: `🔨 **WEBSITE BAN ENFORCED** — <@&${ADMIN_ROLE_ID}>`,
        embeds: [embed],
      }),
    });
  } catch (error) {
    console.error('Failed to send ban alert:', error);
  }
}
