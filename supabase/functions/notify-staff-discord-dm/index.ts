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
    const OWNER_DISCORD_ID = Deno.env.get('OWNER_DISCORD_ID');

    if (!DISCORD_BOT_TOKEN) {
      console.error('DISCORD_BOT_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Discord bot not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const { chatId, userName, subject }: NotifyStaffRequest = await req.json();
    console.log(`Processing human support notification for chat ${chatId} from ${userName}`);

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

    // Build list of Discord IDs to notify (all staff + owner)
    const discordIdsToNotify: { discord_id: string; name: string }[] = [];

    // Add all staff members
    if (staffMembers) {
      staffMembers.forEach(staff => {
        if (staff.discord_id) {
          discordIdsToNotify.push({
            discord_id: staff.discord_id,
            name: staff.name || 'Staff Member'
          });
        }
      });
    }

    // Add owner if not already in list
    if (OWNER_DISCORD_ID && !discordIdsToNotify.some(s => s.discord_id === OWNER_DISCORD_ID)) {
      discordIdsToNotify.push({
        discord_id: OWNER_DISCORD_ID,
        name: 'Owner'
      });
    }

    console.log(`Notifying ${discordIdsToNotify.length} people via Discord DM`);

    let sentCount = 0;
    let failedCount = 0;

    for (const recipient of discordIdsToNotify) {
      try {
        // Create DM channel
        const dmChannelResponse = await fetch('https://discord.com/api/v10/users/@me/channels', {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipient_id: recipient.discord_id,
          }),
        });

        if (!dmChannelResponse.ok) {
          const errorText = await dmChannelResponse.text();
          console.error(`Failed to create DM channel for ${recipient.name}:`, errorText);
          failedCount++;
          continue;
        }

        const dmChannel = await dmChannelResponse.json();

        // Send DM with the notification
        const embed = {
          title: '🚨 User Requesting Human Support',
          description: `A user on the website has requested to speak with a human staff member. Please assist them as soon as possible.`,
          color: 0xFF6B6B, // Red color for urgency
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
              name: '⚡ Priority',
              value: '**HIGH** - Immediate attention needed',
              inline: false,
            },
            {
              name: '🔗 Action Required',
              value: `Please log in to the website and check the support chat.\n**[Open Support Dashboard](https://roleplay-horizon.lovable.app/admin/support-chat)**`,
              inline: false,
            },
          ],
          timestamp: new Date().toISOString(),
          footer: {
            text: 'SkyLife RP • Human Support Request',
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
            content: `<@${recipient.discord_id}> 🚨 **HUMAN SUPPORT REQUESTED**\n\n**${userName || 'A user'}** has opened a support chat on the website and is requesting human assistance!\n\n**Subject:** ${subject || 'Support Request'}`,
            embeds: [embed],
          }),
        });

        if (messageResponse.ok) {
          console.log(`Successfully notified ${recipient.name} (${recipient.discord_id})`);
          sentCount++;
        } else {
          const errorText = await messageResponse.text();
          console.error(`Failed to send DM to ${recipient.name}:`, errorText);
          failedCount++;
        }

        // Rate limit delay to avoid Discord API limits
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.error(`Error notifying ${recipient.name}:`, err);
        failedCount++;
      }
    }

    // Also create database notifications for staff with user_id
    for (const staff of staffMembers || []) {
      if (!staff.discord_id) continue;
      
      const { data: staffUser } = await supabase
        .from('staff_members')
        .select('user_id')
        .eq('discord_id', staff.discord_id)
        .single();

      if (staffUser?.user_id) {
        await supabase.from('notifications').insert({
          user_id: staffUser.user_id,
          title: '🚨 User Requesting Human Support',
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
        message: `Notified ${sentCount} staff members via Discord DM`,
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
