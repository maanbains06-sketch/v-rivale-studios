import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhitelistNotificationRequest {
  applicantDiscord: string;
  applicantDiscordId?: string;
  status: 'approved' | 'rejected';
  moderatorName: string;
  moderatorDiscordId?: string;
  adminNotes?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN');
    const DISCORD_WHITELIST_CHANNEL_ID = Deno.env.get('DISCORD_WHITELIST_CHANNEL_ID');

    if (!DISCORD_BOT_TOKEN || !DISCORD_WHITELIST_CHANNEL_ID) {
      console.error('Missing Discord configuration');
      return new Response(
        JSON.stringify({ error: 'Discord configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { 
      applicantDiscord, 
      applicantDiscordId,
      status, 
      moderatorName,
      moderatorDiscordId,
      adminNotes 
    }: WhitelistNotificationRequest = await req.json();

    console.log(`Processing whitelist notification for ${applicantDiscord}, status: ${status}`);

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

    const isApproved = status === 'approved';
    
    // Embed color: Green for approved, Red for rejected
    const embedColor = isApproved ? 0x00ff00 : 0xff0000;
    
    // Title and description based on status
    const title = isApproved ? '✅ Application Accepted' : '❌ Application Rejected';
    const description = isApproved 
      ? `Your Application has been **Accepted**, Welcome aboard!`
      : `Your Application has been **Rejected**.`;

    // Image URLs - these should be hosted publicly
    const approvedImageUrl = 'https://obirpzwvnqveddyuulsb.supabase.co/storage/v1/object/public/discord-assets/whitelist-approved.png';
    const rejectedImageUrl = 'https://obirpzwvnqveddyuulsb.supabase.co/storage/v1/object/public/discord-assets/whitelist-rejected.png';
    const imageUrl = isApproved ? approvedImageUrl : rejectedImageUrl;

    // Build applicant mention
    const applicantMention = applicantDiscordId 
      ? `<@${applicantDiscordId}>` 
      : `@${applicantDiscord}`;

    // Build moderator mention
    const moderatorMention = moderatorDiscordId 
      ? `<@${moderatorDiscordId}>` 
      : moderatorName;

    // Build embed fields
    const fields = [
      {
        name: '👤 Applicant',
        value: applicantMention,
        inline: true
      },
      {
        name: '⏰ Time of Response',
        value: formattedDate,
        inline: true
      },
      {
        name: '🛡️ Moderator',
        value: moderatorMention,
        inline: true
      }
    ];

    // Add admin notes if provided and rejected
    if (!isApproved && adminNotes) {
      fields.push({
        name: '📝 Reason',
        value: adminNotes,
        inline: false
      });
    }

    const embed = {
      title,
      description,
      color: embedColor,
      fields,
      image: {
        url: imageUrl
      },
      footer: {
        text: '#SkyLife'
      },
      timestamp: now.toISOString()
    };

    // Send message to Discord channel
    const discordResponse = await fetch(
      `https://discord.com/api/v10/channels/${DISCORD_WHITELIST_CHANNEL_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: applicantMention,
          embeds: [embed]
        }),
      }
    );

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();
      console.error('Discord API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to send Discord notification', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const discordResult = await discordResponse.json();
    console.log('Discord notification sent successfully:', discordResult.id);

    return new Response(
      JSON.stringify({ success: true, messageId: discordResult.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending whitelist notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
