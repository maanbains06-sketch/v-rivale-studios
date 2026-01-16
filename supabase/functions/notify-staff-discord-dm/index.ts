import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotifyStaffRequest {
  chatId: string;
  userName: string;
  subject: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!DISCORD_BOT_TOKEN) {
      console.error('DISCORD_BOT_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Discord bot not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const { chatId, userName, subject }: NotifyStaffRequest = await req.json();
    console.log(`Processing notification for chat ${chatId} from ${userName}`);

    // Get all active staff members who have Discord IDs
    const { data: staffMembers, error: staffError } = await supabase
      .from('staff_members')
      .select('discord_id, name, role_type')
      .eq('is_active', true)
      .not('discord_id', 'is', null);

    if (staffError) {
      console.error('Error fetching staff members:', staffError);
      throw staffError;
    }

    // Check which staff members are offline (not in discord_presence or status is offline)
    const { data: onlineStaff, error: presenceError } = await supabase
      .from('discord_presence')
      .select('discord_id, is_online, status, updated_at')
      .in('discord_id', staffMembers?.map(s => s.discord_id) || []);

    if (presenceError) {
      console.error('Error checking presence:', presenceError);
    }

    const onlineStaffIds = new Set(
      (onlineStaff || [])
        .filter(p => p.is_online && p.status !== 'offline')
        .map(p => p.discord_id)
    );

    // Get offline staff to notify
    const offlineStaff = (staffMembers || []).filter(
      s => s.discord_id && !onlineStaffIds.has(s.discord_id)
    );

    console.log(`Found ${offlineStaff.length} offline staff members to notify`);

    let sentCount = 0;
    let failedCount = 0;

    for (const staff of offlineStaff) {
      try {
        // Create DM channel
        const dmChannelResponse = await fetch('https://discord.com/api/v10/users/@me/channels', {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipient_id: staff.discord_id,
          }),
        });

        if (!dmChannelResponse.ok) {
          console.error(`Failed to create DM channel for ${staff.name}:`, await dmChannelResponse.text());
          failedCount++;
          continue;
        }

        const dmChannel = await dmChannelResponse.json();

        // Send DM
        const embed = {
          title: '🔔 User Requesting Human Support',
          description: `A user on the website is requesting to speak with a human staff member.`,
          color: 0xFFAA00, // Orange/amber color
          fields: [
            {
              name: '👤 User',
              value: userName || 'Anonymous',
              inline: true,
            },
            {
              name: '📋 Subject',
              value: subject || 'Support Request',
              inline: true,
            },
            {
              name: '🔗 Action Required',
              value: `Please log in to the website and check the support chat.\n[Open Support Dashboard](https://roleplay-horizon.lovable.app/admin/support-chat)`,
              inline: false,
            },
          ],
          timestamp: new Date().toISOString(),
          footer: {
            text: 'SkyLife RP • Support System',
            icon_url: 'https://roleplay-horizon.lovable.app/images/slrp-logo.png',
          },
        };

        const messageResponse = await fetch(`https://discord.com/api/v10/channels/${dmChannel.id}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: `<@${staff.discord_id}> 🚨 **Attention Required**`,
            embeds: [embed],
          }),
        });

        if (messageResponse.ok) {
          console.log(`Successfully notified ${staff.name}`);
          sentCount++;
        } else {
          console.error(`Failed to send DM to ${staff.name}:`, await messageResponse.text());
          failedCount++;
        }

        // Rate limit delay
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.error(`Error notifying ${staff.name}:`, err);
        failedCount++;
      }
    }

    // Also create a notification in the database for all staff
    for (const staff of offlineStaff) {
      const { data: staffUser } = await supabase
        .from('staff_members')
        .select('user_id')
        .eq('discord_id', staff.discord_id)
        .single();

      if (staffUser?.user_id) {
        await supabase.from('notifications').insert({
          user_id: staffUser.user_id,
          title: 'User Requesting Human Support',
          message: `${userName || 'A user'} is requesting human assistance for: "${subject || 'Support Request'}"`,
          type: 'support_chats',
          reference_id: chatId,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notified: sentCount,
        failed: failedCount,
        message: `Notified ${sentCount} offline staff members via Discord DM`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in notify-staff-discord-dm:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
