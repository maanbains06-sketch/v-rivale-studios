import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Giveaway {
  id: string;
  title: string;
  description: string | null;
  prize: string;
  prize_image_url: string | null;
  start_date: string;
  end_date: string;
  status: string;
  winner_count: number;
}

async function sendDiscordNotification(giveaway: Giveaway, status: 'active' | 'ended', websiteUrl: string) {
  const discordBotToken = Deno.env.get('DISCORD_BOT_TOKEN');
  const channelId = Deno.env.get('DISCORD_GIVEAWAY_CHANNEL_ID');

  if (!discordBotToken || !channelId) {
    console.error('Discord credentials not configured');
    return false;
  }

  const startDate = new Date(giveaway.start_date);
  const endDate = new Date(giveaway.end_date);
  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const embedColor = status === 'active' ? 0x00FF00 : 0xFF6B6B;
  const statusEmoji = status === 'active' ? '🔴 LIVE NOW' : '🏁 ENDED';

  const embed: Record<string, unknown> = {
    title: status === 'active' ? `🎁 ${giveaway.title} is NOW LIVE!` : `🏁 ${giveaway.title} has ENDED!`,
    description: status === 'active' 
      ? (giveaway.description || 'Enter now for a chance to win amazing prizes!')
      : 'Thank you to everyone who participated! Winners will be announced soon.',
    color: embedColor,
    fields: [
      {
        name: '🏆 Prize',
        value: giveaway.prize,
        inline: true
      },
      {
        name: '👥 Winners',
        value: `${giveaway.winner_count} winner${giveaway.winner_count > 1 ? 's' : ''}`,
        inline: true
      },
      {
        name: '📊 Status',
        value: statusEmoji,
        inline: true
      },
      {
        name: '📅 Start Date',
        value: formatDate(startDate),
        inline: true
      },
      {
        name: '⏰ End Date',
        value: formatDate(endDate),
        inline: true
      }
    ],
    footer: {
      text: status === 'active' 
        ? 'Click the button below to enter! Good luck! 🍀'
        : 'Stay tuned for the winner announcement! 🎊'
    },
    timestamp: new Date().toISOString()
  };

  if (giveaway.prize_image_url) {
    embed.image = { url: giveaway.prize_image_url };
  }

  const messagePayload = {
    content: status === 'active' 
      ? '🚨 **GIVEAWAY IS NOW LIVE!** 🚨\n\n@everyone The giveaway has started! Enter now before it\'s too late!' 
      : '🏁 **GIVEAWAY HAS ENDED!** 🏁\n\nThank you for participating! Winners will be selected soon.',
    embeds: [embed],
    components: status === 'active' ? [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 5,
            label: '🎁 Enter Giveaway Now!',
            url: websiteUrl
          }
        ]
      }
    ] : []
  };

  console.log('Sending Discord notification for giveaway:', giveaway.title, 'Status:', status);

  const discordResponse = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bot ${discordBotToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messagePayload),
  });

  if (!discordResponse.ok) {
    const errorText = await discordResponse.text();
    console.error('Failed to send Discord notification:', errorText);
    return false;
  }

  console.log('Successfully sent Discord notification for:', giveaway.title);
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();
    const websiteUrl = 'https://slrp.lovable.app/giveaway';

    console.log('Checking giveaway statuses at:', now);

    // Find upcoming giveaways that should now be active
    const { data: upcomingToActive, error: upcomingError } = await supabase
      .from('giveaways')
      .select('*')
      .eq('status', 'upcoming')
      .lte('start_date', now);

    if (upcomingError) {
      console.error('Error fetching upcoming giveaways:', upcomingError);
      throw upcomingError;
    }

    console.log('Found', upcomingToActive?.length || 0, 'giveaways to activate');

    // Find active giveaways that should now be ended
    const { data: activeToEnded, error: activeError } = await supabase
      .from('giveaways')
      .select('*')
      .eq('status', 'active')
      .lte('end_date', now);

    if (activeError) {
      console.error('Error fetching active giveaways:', activeError);
      throw activeError;
    }

    console.log('Found', activeToEnded?.length || 0, 'giveaways to end');

    const results = {
      activated: [] as string[],
      ended: [] as string[],
      notificationsSent: 0,
      errors: [] as string[]
    };

    // Process upcoming -> active transitions
    for (const giveaway of upcomingToActive || []) {
      const { error: updateError } = await supabase
        .from('giveaways')
        .update({ status: 'active' })
        .eq('id', giveaway.id);

      if (updateError) {
        console.error('Error activating giveaway:', giveaway.id, updateError);
        results.errors.push(`Failed to activate: ${giveaway.title}`);
        continue;
      }

      results.activated.push(giveaway.title);
      console.log('Activated giveaway:', giveaway.title);

      // Send Discord notification
      const notificationSent = await sendDiscordNotification(giveaway, 'active', websiteUrl);
      if (notificationSent) {
        results.notificationsSent++;
      }
    }

    // Process active -> ended transitions
    for (const giveaway of activeToEnded || []) {
      const { error: updateError } = await supabase
        .from('giveaways')
        .update({ status: 'ended' })
        .eq('id', giveaway.id);

      if (updateError) {
        console.error('Error ending giveaway:', giveaway.id, updateError);
        results.errors.push(`Failed to end: ${giveaway.title}`);
        continue;
      }

      results.ended.push(giveaway.title);
      console.log('Ended giveaway:', giveaway.title);

      // Send Discord notification for ended giveaway
      const notificationSent = await sendDiscordNotification(giveaway, 'ended', websiteUrl);
      if (notificationSent) {
        results.notificationsSent++;
      }
    }

    console.log('Status check complete:', JSON.stringify(results, null, 2));

    return new Response(JSON.stringify({
      success: true,
      checked_at: now,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in check-giveaway-status function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
