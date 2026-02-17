import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { winnerName, categoryName, prize, voteCount, totalVotes, pollTitle } = await req.json();

    const botToken = Deno.env.get('DISCORD_BOT_TOKEN');
    const channelId = Deno.env.get('DISCORD_AWARD_CHANNEL_ID');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!botToken || !channelId) {
      throw new Error('Missing DISCORD_BOT_TOKEN or DISCORD_AWARD_CHANNEL_ID');
    }

    let winnerImageUrl: string | null = null;

    // Generate winner image using Lovable AI
    if (lovableApiKey) {
      try {
        const imagePrompt = `Create a premium award winner announcement banner image. Golden trophy with glowing effects in the center. Text "SKYLIFE ROLEPLAY INDIA" at the top in bold golden letters. Text "WEEKLY AWARD WINNER" below it. The winner name "${winnerName}" displayed prominently. Category "${categoryName}" shown. Dark luxury background with golden particles and light rays. Professional esports award ceremony style. 16:9 aspect ratio. Ultra high resolution.`;

        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [{ role: "user", content: imagePrompt }],
            modalities: ["image", "text"],
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

          if (imageData) {
            // Upload to Supabase storage
            const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
            const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

            const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
            const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

            const fileName = `award-winner-${Date.now()}.png`;
            const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/assets/${fileName}`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${serviceKey}`,
                'Content-Type': 'image/png',
              },
              body: binaryData,
            });

            if (uploadRes.ok) {
              winnerImageUrl = `${supabaseUrl}/storage/v1/object/public/assets/${fileName}`;
            }
          }
        }
      } catch (imgErr) {
        console.error('Image generation failed, continuing without image:', imgErr);
      }
    }

    const votePercentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
    const timestamp = new Date().toISOString();

    const embed: any = {
      title: `🏆 WEEKLY AWARD WINNER 🏆`,
      description: [
        `# 🎉 ${winnerName}`,
        ``,
        `> Has been crowned the **${categoryName}** of the week!`,
        ``,
        `━━━━━━━━━━━━━━━━━━━━━━`,
        ``,
        `📊 **Poll:** ${pollTitle}`,
        `🗳️ **Votes:** ${voteCount} out of ${totalVotes} (${votePercentage}%)`,
        prize ? `🎁 **Prize:** ${prize}` : null,
        ``,
        `━━━━━━━━━━━━━━━━━━━━━━`,
        ``,
        `> *Congratulations from the entire Skylife Roleplay India community!*`,
        `> *Keep up the amazing roleplay! 🌟*`,
      ].filter(Boolean).join('\n'),
      color: 0xFFD700,
      footer: {
        text: '🏆 Skylife Roleplay India • Weekly Awards',
      },
      timestamp,
    };

    if (winnerImageUrl) {
      embed.image = { url: winnerImageUrl };
    }

    const messagePayload = {
      content: `@everyone\n\n🏆 **WEEKLY AWARD WINNER ANNOUNCEMENT** 🏆\n\nThe votes are in! Congratulations to our winner! 🎉`,
      embeds: [embed],
      allowed_mentions: {
        parse: ['everyone', 'users'],
      },
    };

    console.log('Sending award winner announcement to channel:', channelId);

    const discordRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messagePayload),
    });

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      console.error('Discord API error:', errText);
      throw new Error(`Discord API error: ${discordRes.status} - ${errText}`);
    }

    const result = await discordRes.json();
    console.log('Award winner announcement sent:', result.id);

    return new Response(
      JSON.stringify({ success: true, messageId: result.id, imageUrl: winnerImageUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error sending award winner:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
