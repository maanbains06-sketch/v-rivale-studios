import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GiveawayPayload {
  type: 'new_giveaway' | 'winner_selected';
  giveaway: {
    title: string;
    description: string;
    prize: string;
    end_date: string;
    winner_count: number;
    prize_image_url?: string;
  };
  winners?: Array<{
    discord_username: string;
    discord_id?: string;
    user_id: string;
  }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: GiveawayPayload = await req.json();
    const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN");
    const GIVEAWAY_CHANNEL_ID = Deno.env.get("DISCORD_GIVEAWAY_CHANNEL_ID");
    const WINNER_CHANNEL_ID = Deno.env.get("DISCORD_WINNER_CHANNEL_ID");

    if (!DISCORD_BOT_TOKEN) {
      throw new Error("DISCORD_BOT_TOKEN not configured");
    }

    console.log("Processing giveaway notification:", payload.type);

    let channelId: string;
    let embed: any;
    let content: string;

    if (payload.type === 'new_giveaway') {
      channelId = GIVEAWAY_CHANNEL_ID || "";
      if (!channelId) throw new Error("DISCORD_GIVEAWAY_CHANNEL_ID not configured");

      const endDate = new Date(payload.giveaway.end_date);
      const discordTimestamp = Math.floor(endDate.getTime() / 1000);

      embed = {
        title: "🎁 NEW GIVEAWAY ALERT! 🎁",
        description: `# ${payload.giveaway.title}\n\n${payload.giveaway.description || '*No description provided*'}\n\n━━━━━━━━━━━━━━━━━━━━━━`,
        color: 0xFFD700,
        thumbnail: payload.giveaway.prize_image_url ? { url: payload.giveaway.prize_image_url } : undefined,
        fields: [
          {
            name: "🎁 Prize",
            value: `\`\`\`${payload.giveaway.prize}\`\`\``,
            inline: false
          },
          {
            name: "🏆 Winners",
            value: `${payload.giveaway.winner_count} lucky winner${payload.giveaway.winner_count > 1 ? 's' : ''}`,
            inline: true
          },
          {
            name: "⏰ Ends",
            value: `<t:${discordTimestamp}:R>`,
            inline: true
          },
          {
            name: "\u200B",
            value: "━━━━━━━━━━━━━━━━━━━━━━",
            inline: false
          },
          {
            name: "📝 How to Enter",
            value: "Visit our website and click **'Enter Giveaway'** on the [Giveaway Page](https://skyliferoleplay.com/giveaway)!",
            inline: false
          }
        ],
        image: payload.giveaway.prize_image_url ? { url: payload.giveaway.prize_image_url } : undefined,
        footer: {
          text: "🍀 SkyLife Roleplay • Good Luck! 🍀",
          icon_url: "https://skyliferoleplay.com/images/slrp-logo.png"
        },
        timestamp: new Date().toISOString()
      };

      content = "# 🎉 @everyone NEW GIVEAWAY! 🎉\n\n> Don't miss your chance to win amazing prizes!";

    } else if (payload.type === 'winner_selected') {
      channelId = WINNER_CHANNEL_ID || "";
      if (!channelId) throw new Error("DISCORD_WINNER_CHANNEL_ID not configured");

      const winners = payload.winners || [];
      
      // Build winner mentions and list
      const winnerMentions: string[] = [];
      const winnerList: string[] = [];
      
      winners.forEach((w, i) => {
        if (w.discord_id) {
          winnerMentions.push(`<@${w.discord_id}>`);
          winnerList.push(`${i + 1}. <@${w.discord_id}> (${w.discord_username || 'Unknown'})`);
        } else {
          winnerList.push(`${i + 1}. **${w.discord_username || 'Unknown User'}**`);
        }
      });

      embed = {
        title: "🏆 GIVEAWAY WINNERS ANNOUNCED! 🏆",
        description: `# ${payload.giveaway.title}\n\n🎊 **Congratulations to our lucky winner${winners.length > 1 ? 's' : ''}!** 🎊\n\n━━━━━━━━━━━━━━━━━━━━━━`,
        color: 0x00FF00,
        thumbnail: payload.giveaway.prize_image_url ? { url: payload.giveaway.prize_image_url } : undefined,
        fields: [
          {
            name: "🎁 Prize Won",
            value: `\`\`\`${payload.giveaway.prize}\`\`\``,
            inline: false
          },
          {
            name: "👑 Winner" + (winners.length > 1 ? 's' : ''),
            value: winnerList.join('\n') || 'No winners',
            inline: false
          },
          {
            name: "\u200B",
            value: "━━━━━━━━━━━━━━━━━━━━━━",
            inline: false
          },
          {
            name: "📬 Claim Your Prize",
            value: "Winners will be contacted via **Discord DM** to claim their prizes!\nPlease make sure your DMs are open.",
            inline: false
          }
        ],
        footer: {
          text: "🙏 SkyLife Roleplay • Thank you for participating!",
          icon_url: "https://skyliferoleplay.com/images/slrp-logo.png"
        },
        timestamp: new Date().toISOString()
      };

      // Build the content message with winner mentions
      const mentionString = winnerMentions.length > 0 ? winnerMentions.join(' ') : '';
      content = `# 🎉 CONGRATULATIONS! 🎉\n\n${mentionString}\n\n> You have won the **${payload.giveaway.title}** giveaway!`;

    } else {
      throw new Error("Invalid payload type");
    }

    console.log("Sending to Discord channel:", channelId);

    // Send to Discord
    const discordResponse = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bot ${DISCORD_BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content,
          embeds: [embed],
          allowed_mentions: {
            parse: ["everyone", "users"]
          }
        }),
      }
    );

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();
      console.error("Discord API error:", errorText);
      throw new Error(`Discord API error: ${discordResponse.status} - ${errorText}`);
    }

    const result = await discordResponse.json();
    console.log("Discord message sent successfully:", result.id);

    return new Response(
      JSON.stringify({ success: true, message_id: result.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
