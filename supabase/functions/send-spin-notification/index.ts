import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STORAGE_BASE = "https://obirpzwvnqveddyuulsb.supabase.co/storage/v1/object/public/discord-assets/spin-prizes";

interface PrizeConfig {
  color: number;
  emoji: string;
  image: string;
  title: string;
  description: string;
  footer: string;
}

const PRIZE_CONFIGS: Record<string, PrizeConfig> = {
  free_queue: {
    color: 0xFFD700,
    emoji: "🎫",
    image: `${STORAGE_BASE}/free-queue.png`,
    title: "🎫 FREE QUEUE ENTRY WON!",
    description: "has won a **1 Time Free Queue Entry**! Skip the line and jump straight into the city! 🏙️",
    footer: "🌟 RARE PRIZE • Skylife Roleplay India",
  },
  cash_10k: {
    color: 0x2ECC71,
    emoji: "💰",
    image: `${STORAGE_BASE}/cash.png`,
    title: "💰 $10,000 CASH WON!",
    description: "has won **$10,000 Cash**! Money bags incoming! 💵",
    footer: "💸 Skylife Roleplay India • Spin & Win",
  },
  cash_5k: {
    color: 0x2ECC71,
    emoji: "💵",
    image: `${STORAGE_BASE}/cash.png`,
    title: "💵 $5,000 CASH WON!",
    description: "has won **$5,000 Cash**! Every dollar counts! 🤑",
    footer: "💸 Skylife Roleplay India • Spin & Win",
  },
  cash_20k: {
    color: 0xFFD700,
    emoji: "🤑",
    image: `${STORAGE_BASE}/cash.png`,
    title: "🤑 $20,000 CASH WON!",
    description: "has won **$20,000 Cash**! A massive jackpot! The city is theirs! 🎰💰",
    footer: "🌟 RARE PRIZE • Skylife Roleplay India",
  },
  vehicle: {
    color: 0xFFD700,
    emoji: "🚗",
    image: `${STORAGE_BASE}/vehicle.png`,
    title: "🚗 RANDOM VEHICLE WON!",
    description: "has won a **Random Vehicle**! A brand new ride is waiting in the garage! 🏎️✨",
    footer: "🌟 RARE PRIZE • Skylife Roleplay India",
  },
  mystery_box: {
    color: 0x9B59B6,
    emoji: "📦",
    image: `${STORAGE_BASE}/mystery-box.png`,
    title: "📦 MYSTERY BOX WON!",
    description: "has won a **Mystery Box**! What's inside? Only fate knows... 🔮✨",
    footer: "🌟 RARE PRIZE • Skylife Roleplay India",
  },
  discount: {
    color: 0xF39C12,
    emoji: "🏷️",
    image: `${STORAGE_BASE}/discount.png`,
    title: "🏷️ DISCOUNT COUPON WON!",
    description: "has won a **Discount Coupon**! Save big on your next purchase! A staff member will deliver it manually. 🎁",
    footer: "🌟 RARE PRIZE • Skylife Roleplay India",
  },
  clothing_1: {
    color: 0xE91E63,
    emoji: "👕",
    image: `${STORAGE_BASE}/clothing.png`,
    title: "👕 CLOTHING REWARD WON!",
    description: "has won a **Clothing Reward**! Fresh drip incoming! Time to style up in the city! 👗✨",
    footer: "🌟 RARE PRIZE • Skylife Roleplay India",
  },
  clothing_2: {
    color: 0xE91E63,
    emoji: "👕",
    image: `${STORAGE_BASE}/clothing.png`,
    title: "👕 CLOTHING REWARD WON!",
    description: "has won a **Clothing Reward**! New threads for the streets! Looking fresh! 👔✨",
    footer: "🌟 RARE PRIZE • Skylife Roleplay India",
  },
  name_change: {
    color: 0x3498DB,
    emoji: "🪪",
    image: `${STORAGE_BASE}/name-change.png`,
    title: "🪪 FREE NAME CHANGE WON!",
    description: "has won a **Free Name Change Approval**! Time for a fresh identity! 📝",
    footer: "🌟 RARE PRIZE • Skylife Roleplay India",
  },
  mission_skip: {
    color: 0xE67E22,
    emoji: "⏭️",
    image: `${STORAGE_BASE}/mission-skip.png`,
    title: "⏭️ MISSION SKIP WON!",
    description: "has won a **1 Daily Mission Skip**! Skip the grind, keep the rewards! ⚡",
    footer: "⚡ Skylife Roleplay India • Spin & Win",
  },
  better_luck_1: {
    color: 0x95A5A6,
    emoji: "😢",
    image: `${STORAGE_BASE}/better-luck.png`,
    title: "😢 Better Luck Next Time...",
    description: "spun the wheel but luck wasn't on their side this time... 💔 Don't give up, try again after the cooldown!",
    footer: "😔 Skylife Roleplay India • Better luck next spin!",
  },
  better_luck_2: {
    color: 0x95A5A6,
    emoji: "😢",
    image: `${STORAGE_BASE}/better-luck.png`,
    title: "😢 Better Luck Next Time...",
    description: "tried their luck but the wheel said no... 😭 The next spin could be the big one!",
    footer: "😔 Skylife Roleplay India • Don't lose hope!",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prize_key, discord_id, discord_username } = await req.json();

    const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN");
    const DISCORD_SPIN_CHANNEL_ID = Deno.env.get("DISCORD_SPIN_CHANNEL_ID");

    if (!DISCORD_BOT_TOKEN || !DISCORD_SPIN_CHANNEL_ID) {
      throw new Error("Missing Discord configuration");
    }

    const config = PRIZE_CONFIGS[prize_key];
    if (!config) {
      throw new Error(`Unknown prize key: ${prize_key}`);
    }

    const userMention = discord_id ? `<@${discord_id}>` : (discord_username || "A player");
    const displayName = discord_username || "Unknown Player";

    const isBetterLuck = prize_key === "better_luck_1" || prize_key === "better_luck_2";

    const embed = {
      title: config.title,
      description: `${config.emoji} ${userMention} (${displayName}) ${config.description}`,
      color: config.color,
      image: { url: config.image },
      thumbnail: {
        url: discord_id
          ? `https://cdn.discordapp.com/avatars/${discord_id}/${discord_id}.png`
          : undefined,
      },
      footer: {
        text: config.footer,
      },
      timestamp: new Date().toISOString(),
      fields: isBetterLuck
        ? [
            {
              name: "⏰ Next Chance",
              value: "Spin again after the 48-hour cooldown!",
              inline: true,
            },
          ]
        : [
            {
              name: "🎰 Prize Type",
              value: config.emoji + " " + (PRIZE_CONFIGS[prize_key]?.title?.replace(/^[^\s]+\s/, "") || prize_key),
              inline: true,
            },
            {
              name: "🏆 Rarity",
              value: ["free_queue", "cash_20k", "vehicle", "mystery_box", "discount", "clothing_1", "clothing_2", "name_change"].includes(prize_key)
                ? "⭐ RARE" 
                : "Common",
              inline: true,
            },
          ],
    };

    // Remove thumbnail if no discord_id
    if (!discord_id) {
      delete embed.thumbnail;
    }

    const content = isBetterLuck
      ? `${userMention} tried the **Skylife Spin & Win** wheel... 😢`
      : `@everyone\n\n🎰 **SKYLIFE SPIN & WIN** 🎰\n${userMention} just won from the Lucky Wheel! 🎉`;

    const response = await fetch(
      `https://discord.com/api/v10/channels/${DISCORD_SPIN_CHANNEL_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          embeds: [embed],
          allowed_mentions: {
            parse: ["everyone", "users"],
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Discord API error:", errorText);
      throw new Error(`Discord API error: ${response.status}`);
    }

    const result = await response.json();

    return new Response(JSON.stringify({ success: true, message_id: result.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending spin notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
