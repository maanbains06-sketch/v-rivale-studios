import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
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

    const body = await req.json();
    const { 
      discord_id, discord_username, steam_id, fivem_id, 
      ban_reason, is_permanent, fivem_ban_id, banned_by,
      action // 'ban' or 'unban'
    } = body;

    console.log('FiveM ban webhook received:', { action, discord_id, steam_id, ban_reason, is_permanent });

    if (action === 'unban') {
      // Unban: deactivate website ban
      const { error } = await supabase
        .from('website_bans')
        .update({ is_active: false, unbanned_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .or(`discord_id.eq.${discord_id},steam_id.eq.${steam_id}`)
        .eq('is_active', true);

      if (error) console.error('Error unbanning:', error);

      // Unblock fingerprints
      if (discord_id) {
        const { data: fingerprints } = await supabase
          .from('device_fingerprints')
          .select('id')
          .eq('user_id', (await supabase.from('profiles').select('id').eq('discord_id', discord_id).maybeSingle()).data?.id);
        
        if (fingerprints?.length) {
          await supabase
            .from('device_fingerprints')
            .update({ is_blocked: false })
            .in('id', fingerprints.map(f => f.id));
        }
      }

      return new Response(JSON.stringify({ success: true, message: 'User unbanned from website' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Only apply website ban for PERMANENT bans
    if (!is_permanent) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Temporary ban - website ban not applied (only permanent bans trigger website ban)' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find user by discord_id or steam_id
    let userId = null;
    if (discord_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('discord_id', discord_id)
        .maybeSingle();
      userId = profile?.id;
    }

    // Get fingerprints and IPs for this user
    let fingerprint_hashes: string[] = [];
    let ip_addresses: string[] = [];

    if (userId) {
      const { data: fps } = await supabase
        .from('device_fingerprints')
        .select('fingerprint_hash, ip_address')
        .eq('user_id', userId);

      if (fps) {
        fingerprint_hashes = [...new Set(fps.map(f => f.fingerprint_hash).filter(Boolean))];
        ip_addresses = [...new Set(fps.map(f => f.ip_address).filter(Boolean))];
      }

      // Block all fingerprints for this user
      await supabase
        .from('device_fingerprints')
        .update({ is_blocked: true })
        .eq('user_id', userId);
    }

    // Create website ban
    const { data: banData, error: banError } = await supabase
      .from('website_bans')
      .insert({
        user_id: userId,
        discord_id,
        discord_username,
        steam_id,
        fivem_id,
        ban_reason: ban_reason || 'Permanent ban from FiveM server',
        ban_source: 'fivem',
        is_permanent: true,
        fingerprint_hashes,
        ip_addresses,
        banned_by: banned_by || 'FiveM Server',
        fivem_ban_id,
      })
      .select()
      .single();

    if (banError) {
      console.error('Error creating ban:', banError);
      throw banError;
    }

    // Send Discord alert
    try {
      await sendDiscordAlert(supabase, {
        discord_id,
        discord_username,
        steam_id,
        ban_reason,
        banned_by,
        fingerprint_hashes,
        ip_addresses,
      });
    } catch (discordError) {
      console.error('Discord alert failed:', discordError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Permanent ban synced to website',
      ban_id: banData.id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('FiveM ban webhook error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function sendDiscordAlert(supabase: any, data: any) {
  const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN');
  const CHANNEL_ID = Deno.env.get('DISCORD_DETECTION_CHANNEL_ID');
  const ADMIN_ROLE_ID = '1466267679320182949';

  if (!DISCORD_BOT_TOKEN || !CHANNEL_ID) {
    console.log('Discord not configured for detection alerts');
    return;
  }

  // Get the public URL for the alert image
  const imageUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.supabase.co')}/storage/v1/object/public/assets/alt-detection-alert.jpg`;

  const embed = {
    title: '🚨 WEBSITE BAN ENFORCED — FiveM Permanent Ban Sync',
    description: `A permanent ban from the FiveM server has been automatically synced to the website.\n\n<@&${ADMIN_ROLE_ID}> — Immediate attention required.`,
    color: 0xFF0000,
    thumbnail: { url: imageUrl },
    fields: [
      {
        name: '👤 Player',
        value: data.discord_id ? `<@${data.discord_id}> (${data.discord_username || 'Unknown'})` : data.discord_username || 'Unknown',
        inline: true,
      },
      {
        name: '🎮 Steam ID',
        value: data.steam_id || 'N/A',
        inline: true,
      },
      {
        name: '🔨 Banned By',
        value: data.banned_by || 'FiveM Server',
        inline: true,
      },
      {
        name: '📝 Ban Reason',
        value: data.ban_reason || 'No reason provided',
        inline: false,
      },
      {
        name: '🖥️ Blocked Fingerprints',
        value: data.fingerprint_hashes?.length > 0 
          ? `${data.fingerprint_hashes.length} device(s) blocked` 
          : 'No fingerprints found',
        inline: true,
      },
      {
        name: '🌐 Known IPs',
        value: data.ip_addresses?.length > 0 
          ? `${data.ip_addresses.length} IP(s) recorded` 
          : 'No IPs recorded',
        inline: true,
      },
      {
        name: '⚡ Actions Taken',
        value: '✅ Website access blocked\n✅ Device fingerprints blocked\n✅ IP addresses recorded\n✅ Alt-account detection active',
        inline: false,
      },
    ],
    image: { url: imageUrl },
    footer: {
      text: 'SKYLIFE ROLEPLAY INDIA • Anti-Cheat System',
    },
    timestamp: new Date().toISOString(),
  };

  const response = await fetch(`https://discord.com/api/v10/channels/${CHANNEL_ID}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: `<@&${ADMIN_ROLE_ID}> 🚨 **PERMANENT BAN SYNCED**${data.discord_id ? ` — <@${data.discord_id}>` : ''}`,
      embeds: [embed],
    }),
  });

  if (!response.ok) {
    console.error('Discord API error:', await response.text());
  }
}
