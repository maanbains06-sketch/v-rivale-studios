import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, description, topic, startsAt, imageUrl } = await req.json();

    const discordBotToken = Deno.env.get("DISCORD_BOT_TOKEN");
    const channelId = Deno.env.get("DISCORD_DEBATE_CHANNEL_ID");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!discordBotToken || !channelId) {
      throw new Error("Discord configuration missing");
    }

    // Generate debate banner image using AI
    let bannerUrl: string | null = null;
    if (LOVABLE_API_KEY) {
      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [
              {
                role: "user",
                content: `Generate a dramatic debate arena banner image for a roleplay server. The image should have:
- Dark futuristic theme with neon blue and cyan accents
- Large bold text "SKYLIFE ROLEPLAY INDIA" at the top center
- Below it "DEBATE ARENA" in slightly smaller text
- Two microphone icons on either side symbolizing debate
- A dramatic stage/arena setting with spotlights
- Digital/cyber aesthetic with holographic elements
- The text "${title}" subtly visible
- Professional esports tournament style design
- 16:9 aspect ratio`
              }
            ],
            modalities: ["image", "text"],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          if (imageData) {
            bannerUrl = imageData;
          }
        }
      } catch (imgErr) {
        console.error("Failed to generate debate image:", imgErr);
      }
    }

    const startDate = new Date(startsAt);
    const formattedDate = startDate.toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
    const formattedTime = startDate.toLocaleTimeString("en-US", {
      hour: "2-digit", minute: "2-digit", hour12: true,
    });

    // Build Discord message
    const embed: any = {
      title: `🎙️ DEBATE ARENA - ${title.toUpperCase()}`,
      description: `
**SKYLIFE ROLEPLAY INDIA** presents a new debate!

📋 **Topic:** ${topic}
${description ? `\n📝 **Description:** ${description}` : ""}

📅 **Date:** ${formattedDate}
⏰ **Time:** ${formattedTime} IST

🔗 **Join the debate on our website to participate!**

🎤 Join as a listener or speaker
💬 Participate in the live feed chat
👥 See all participants with their avatars

*Don't miss this epic debate!*
      `.trim(),
      color: 0x00d4ff,
      footer: {
        text: "Skylife Roleplay India • Debate Arena",
      },
      timestamp: new Date().toISOString(),
    };

    if (bannerUrl && bannerUrl.startsWith("data:")) {
      // Can't use base64 in Discord embeds, skip image
    } else if (imageUrl) {
      embed.image = { url: imageUrl };
    }

    const messagePayload: any = {
      content: `@everyone\n\n🎙️ **NEW DEBATE ALERT!** 🎙️\n\nA new debate has been scheduled in **Skylife Roleplay India**!\n\n**${title}** - ${topic}\n\n🔥 Join now on the website!`,
      embeds: [embed],
    };

    const discordResponse = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bot ${discordBotToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messagePayload),
      }
    );

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();
      console.error("Discord API error:", errorText);
      throw new Error(`Discord API error: ${discordResponse.status}`);
    }

    const messageData = await discordResponse.json();

    return new Response(
      JSON.stringify({ success: true, messageId: messageData.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-debate-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
