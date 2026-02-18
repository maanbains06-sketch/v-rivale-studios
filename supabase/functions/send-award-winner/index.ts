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
    const {
      winnerName,
      winnerDiscordId,
      winnerServerName,
      winnerDiscordUsername,
      winnerImageUrl,
      categoryName,
      prize,
      voteCount,
      totalVotes,
      pollTitle,
    } = await req.json();

    const botToken = Deno.env.get('DISCORD_BOT_TOKEN');
    const channelId = Deno.env.get('DISCORD_AWARD_CHANNEL_ID');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!botToken || !channelId) {
      throw new Error('Missing DISCORD_BOT_TOKEN or DISCORD_AWARD_CHANNEL_ID');
    }

    // ── Build Discord tag ──────────────────────────────────────────────────
    // Format: @mention/serverName or @username/serverName
    const discordMention = winnerDiscordId ? `<@${winnerDiscordId}>` : null;
    const usernameTag = winnerDiscordUsername ? `@${winnerDiscordUsername}` : winnerName;
    const serverTag = winnerServerName ? `/${winnerServerName}` : "";
    const fullTag = discordMention
      ? `${discordMention} (${usernameTag}${serverTag})`
      : `${usernameTag}${serverTag}`;

    // ── Generate winner image using Lovable AI ─────────────────────────────
    let generatedImageUrl: string | null = null;

    if (lovableApiKey) {
      try {
        const imagePrompt = `Create a stunning premium award winner announcement banner image. Style: dark luxury background with deep navy and black tones. Golden trophy in the center with glowing particles and light rays emanating from it. Text "SKYLIFE ROLEPLAY INDIA" prominently at the top in bold golden metallic letters with a subtle glow effect. Below it: "🏆 WEEKLY AWARD WINNER 🏆". The winner name "${winnerName}" displayed in large white bold text in the center. Category label "${categoryName}" in golden italic text below the name. Add decorative golden stars, confetti, and sparkle effects around the trophy. Professional esports/gaming award ceremony aesthetic. 16:9 widescreen aspect ratio. Ultra high resolution photorealistic render.`;

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
              generatedImageUrl = `${supabaseUrl}/storage/v1/object/public/assets/${fileName}`;
              console.log('Winner image generated and uploaded:', generatedImageUrl);
            }
          }
        }
      } catch (imgErr) {
        console.error('Image generation failed, continuing without generated image:', imgErr);
      }
    }

    const votePercentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
    const timestamp = new Date().toISOString();

    // Use generated image first, fallback to nominee's own image URL
    const finalImageUrl = generatedImageUrl || winnerImageUrl;

    // ── Build Discord embed ────────────────────────────────────────────────
    const embed: any = {
      title: `🏆 WEEKLY AWARD WINNER — ${categoryName.toUpperCase()} 🏆`,
      description: [
        `## 🎊 Congratulations ${discordMention || winnerName}!`,
        ``,
        `> **${winnerName}${serverTag}** has been crowned the **${categoryName}** of the week!`,
        ``,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        ``,
        `📊 **Poll:** ${pollTitle}`,
        `🗳️ **Votes:** ${voteCount} out of ${totalVotes} total (${votePercentage}%)`,
        prize ? `🎁 **Prize:** ${prize}` : null,
        winnerDiscordId ? `🔖 **Discord Tag:** ${fullTag}` : null,
        ``,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        ``,
        `> *Congratulations from the entire Skylife Roleplay India community!*`,
        `> *Keep up the amazing roleplay and keep shining! 🌟*`,
      ].filter(Boolean).join('\n'),
      color: 0xFFD700,
      thumbnail: winnerImageUrl ? { url: winnerImageUrl } : undefined,
      footer: {
        text: '🏆 Skylife Roleplay India • Weekly Awards System',
        icon_url: 'https://cdn.discordapp.com/embed/avatars/0.png',
      },
      timestamp,
    };

    // Attach the generated AI image as main image (big banner)
    if (finalImageUrl) {
      embed.image = { url: finalImageUrl };
    }

    // ── Build message content ──────────────────────────────────────────────
    // Use @everyone + @mention winner if we have discord ID
    const mentionContent = winnerDiscordId
      ? `@everyone\n\n🏆 **WEEKLY AWARD WINNER ANNOUNCEMENT** 🏆\n\nCongratulations to ${discordMention} — **${winnerName}${serverTag}** for winning **${categoryName}** of the week! 🎉`
      : `@everyone\n\n🏆 **WEEKLY AWARD WINNER ANNOUNCEMENT** 🏆\n\nCongratulations to **${winnerName}${serverTag}** for winning **${categoryName}** of the week! 🎉`;

    const messagePayload = {
      content: mentionContent,
      embeds: [embed],
      allowed_mentions: {
        parse: ['everyone'],
        users: winnerDiscordId ? [winnerDiscordId] : [],
      },
    };

    console.log('Sending award winner announcement to channel:', channelId);
    console.log('Winner discord ID for mention:', winnerDiscordId);

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
    console.log('Award winner announcement sent, message ID:', result.id);

    return new Response(
      JSON.stringify({ success: true, messageId: result.id, imageUrl: finalImageUrl }),
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
