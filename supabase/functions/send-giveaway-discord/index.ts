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

    let channelId: string;
    let embed: any;

    if (payload.type === 'new_giveaway') {
      channelId = GIVEAWAY_CHANNEL_ID || "";
      if (!channelId) throw new Error("DISCORD_GIVEAWAY_CHANNEL_ID not configured");

      const endDate = new Date(payload.giveaway.end_date);
      const formattedEndDate = endDate.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });

      embed = {
        title: "🎉 NEW GIVEAWAY ALERT! 🎉",
        description: `**${payload.giveaway.title}**\n\n${payload.giveaway.description || 'No description provided.'}\n\n🎁 **Prize:** ${payload.giveaway.prize}\n🏆 **Winners:** ${payload.giveaway.winner_count}\n⏰ **Ends:** ${formattedEndDate}`,
        color: 0xFFD700, // Gold color
        thumbnail: payload.giveaway.prize_image_url ? { url: payload.giveaway.prize_image_url } : undefined,
        fields: [
          {
            name: "📝 How to Enter",
            value: "Visit our website and click 'Enter Giveaway' on the Giveaway page!",
            inline: false
          },
          {
            name: "🔗 Enter Now",
            value: "[Click here to enter!](https://skyliferoleplay.com/giveaway)",
            inline: false
          }
        ],
        footer: {
          text: "SkyLife Roleplay • Good Luck! 🍀",
          icon_url: "https://skyliferoleplay.com/images/slrp-logo.png"
        },
        timestamp: new Date().toISOString()
      };
    } else if (payload.type === 'winner_selected') {
      channelId = WINNER_CHANNEL_ID || "";
      if (!channelId) throw new Error("DISCORD_WINNER_CHANNEL_ID not configured");

      const winners = payload.winners || [];
      const winnerMentions = winners.map((w, i) => {
        const mention = w.discord_id ? `<@${w.discord_id}>` : `**${w.discord_username || 'Unknown User'}**`;
        return `${i + 1}. ${mention}`;
      }).join('\n');

      embed = {
        title: "🏆 GIVEAWAY WINNERS ANNOUNCED! 🏆",
        description: `**${payload.giveaway.title}**\n\n🎁 **Prize:** ${payload.giveaway.prize}\n\n**🎊 Congratulations to our winners!**\n\n${winnerMentions}`,
        color: 0x00FF00, // Green color
        thumbnail: payload.giveaway.prize_image_url ? { url: payload.giveaway.prize_image_url } : undefined,
        fields: [
          {
            name: "📬 Claim Your Prize",
            value: "Winners will be contacted via Discord DM to claim their prizes!",
            inline: false
          }
        ],
        footer: {
          text: "SkyLife Roleplay • Thank you for participating! 🙏",
          icon_url: "https://skyliferoleplay.com/images/slrp-logo.png"
        },
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error("Invalid payload type");
    }

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
          content: payload.type === 'winner_selected' && payload.winners?.length 
            ? `🎉 ${payload.winners.map(w => w.discord_id ? `<@${w.discord_id}>` : '').filter(Boolean).join(' ')} 🎉`
            : "@everyone 🎁",
          embeds: [embed]
        }),
      }
    );

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();
      console.error("Discord API error:", errorText);
      throw new Error(`Discord API error: ${discordResponse.status}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
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