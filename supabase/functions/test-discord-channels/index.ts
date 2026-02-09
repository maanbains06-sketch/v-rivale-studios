import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const botToken = Deno.env.get('DISCORD_BOT_TOKEN');
  if (!botToken) {
    return new Response(JSON.stringify({ error: 'DISCORD_BOT_TOKEN not set' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const channels: { name: string; envKey: string }[] = [
    { name: 'Whitelist', envKey: 'DISCORD_WHITELIST_CHANNEL_ID' },
    { name: 'Staff Applications', envKey: 'DISCORD_STAFF_CHANNEL_ID' },
    { name: 'Police Department', envKey: 'DISCORD_PD_CHANNEL_ID' },
    { name: 'EMS', envKey: 'DISCORD_EMS_CHANNEL_ID' },
    { name: 'Mechanic', envKey: 'DISCORD_MECHANIC_CHANNEL_ID' },
    { name: 'PDM (Car Dealership)', envKey: 'DISCORD_PDM_CHANNEL_ID' },
    { name: 'Weazel News', envKey: 'DISCORD_WEAZEL_CHANNEL_ID' },
    { name: 'Firefighter', envKey: 'DISCORD_FIREFIGHTER_CHANNEL_ID' },
    { name: 'Gang RP', envKey: 'DISCORD_GANG_CHANNEL_ID' },
    { name: 'Creator Program', envKey: 'DISCORD_CREATOR_CHANNEL_ID' },
    { name: 'State Department', envKey: 'DISCORD_STATE_CHANNEL_ID' },
    { name: 'DOJ Attorney', envKey: 'DISCORD_DOJ_ATTORNEY_CHANNEL_ID' },
    { name: 'DOJ Judge', envKey: 'DISCORD_DOJ_JUDGE_CHANNEL_ID' },
    { name: 'Support', envKey: 'DISCORD_SUPPORT_CHANNEL_ID' },
    { name: 'Tickets', envKey: 'DISCORD_TICKET_CHANNEL_ID' },
    { name: 'Ticket Responses', envKey: 'DISCORD_TICKET_RESPONSE_CHANNEL_ID' },
    { name: 'Giveaway', envKey: 'DISCORD_GIVEAWAY_CHANNEL_ID' },
    { name: 'Winner Announcements', envKey: 'DISCORD_WINNER_CHANNEL_ID' },
    { name: 'Rules', envKey: 'DISCORD_RULES_CHANNEL_ID' },
    { name: 'Server Status', envKey: 'DISCORD_STATUS_CHANNEL_ID' },
    { name: 'Alt Detection', envKey: 'DISCORD_DETECTION_CHANNEL_ID' },
    { name: 'Fraud Detection', envKey: '_HARDCODED_', hardcodedId: '1470356566980165674' },
  ] as { name: string; envKey: string; hardcodedId?: string }[];

  const results: { channel: string; status: string; error?: string }[] = [];

  for (const ch of channels) {
    const channelId = ch.hardcodedId || Deno.env.get(ch.envKey);
    if (!channelId) {
      results.push({ channel: ch.name, status: 'skipped', error: `${ch.envKey} not configured` });
      continue;
    }

    try {
      const embed = {
        title: '✅ Channel Test — SKYLIFE ROLEPLAY INDIA',
        description: `This is a test message for the **${ch.name}** channel.\n\nIf you see this, the bot has proper permissions here.`,
        color: 0xFF6B00,
        footer: { text: `Channel: ${ch.name} • ${ch.envKey}` },
        timestamp: new Date().toISOString(),
        thumbnail: {
          url: 'https://skyliferoleplay.com/images/slrp-logo.png'
        }
      };

      const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ embeds: [embed] }),
      });

      if (res.ok) {
        results.push({ channel: ch.name, status: 'sent' });
      } else {
        const errData = await res.json().catch(() => ({}));
        results.push({ channel: ch.name, status: 'failed', error: `${res.status}: ${errData.message || 'Unknown'}` });
      }
    } catch (err) {
      results.push({ channel: ch.name, status: 'failed', error: err instanceof Error ? err.message : 'Unknown error' });
    }

    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 500));
  }

  const sent = results.filter(r => r.status === 'sent').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const skipped = results.filter(r => r.status === 'skipped').length;

  return new Response(JSON.stringify({ 
    summary: { total: channels.length, sent, failed, skipped },
    results 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
