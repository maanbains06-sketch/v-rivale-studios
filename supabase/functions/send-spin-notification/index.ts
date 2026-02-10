import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STORAGE_BASE = "https://obirpzwvnqveddyuulsb.supabase.co/storage/v1/object/public/discord-assets";
const PRIZE_IMAGE_BASE = `${STORAGE_BASE}/spin-prizes`;
const LOGO_URL = `${STORAGE_BASE}/slrp-logo.png`;

interface PrizeConfig {
  color: number;
  emoji: string;
  image: string;
  title: string;
  description: string;
  rarity: string;
  rarityEmoji: string;
  claimMethod: string;
}

const PRIZE_CONFIGS: Record<string, PrizeConfig> = {
  free_queue: {
    color: 0xFFD700,
    emoji: "🎫",
    image: `${PRIZE_IMAGE_BASE}/free-queue.png`,
    title: "FREE QUEUE ENTRY",
    description: "Skip the line and jump straight into the city!",
    rarity: "⭐ RARE",
    rarityEmoji: "🌟",
    claimMethod: "Automatically applied on next login",
  },
  cash_10k: {
    color: 0x2ECC71,
    emoji: "💰",
    image: `${PRIZE_IMAGE_BASE}/cash.png`,
    title: "$10,000 CASH",
    description: "Money bags incoming! 💵",
    rarity: "Common",
    rarityEmoji: "🎰",
    claimMethod: "Delivered in-city automatically",
  },
  cash_5k: {
    color: 0x2ECC71,
    emoji: "💵",
    image: `${PRIZE_IMAGE_BASE}/cash.png`,
    title: "$5,000 CASH",
    description: "Every dollar counts! 🤑",
    rarity: "Common",
    rarityEmoji: "🎰",
    claimMethod: "Delivered in-city automatically",
  },
  cash_20k: {
    color: 0xFFD700,
    emoji: "🤑",
    image: `${PRIZE_IMAGE_BASE}/cash.png`,
    title: "$20,000 CASH",
    description: "A massive jackpot! The city is theirs! 🎰💰",
    rarity: "⭐ RARE",
    rarityEmoji: "🌟",
    claimMethod: "Delivered in-city automatically",
  },
  vehicle: {
    color: 0xFFD700,
    emoji: "🚗",
    image: `${PRIZE_IMAGE_BASE}/vehicle.png`,
    title: "RANDOM VEHICLE",
    description: "A brand new ride is waiting in the garage! 🏎️✨",
    rarity: "⭐ RARE",
    rarityEmoji: "🌟",
    claimMethod: "Contact a staff member to claim",
  },
  mystery_box: {
    color: 0x9B59B6,
    emoji: "📦",
    image: `${PRIZE_IMAGE_BASE}/mystery-box.png`,
    title: "MYSTERY BOX",
    description: "What's inside? Only fate knows... 🔮✨",
    rarity: "⭐ RARE",
    rarityEmoji: "🌟",
    claimMethod: "Contact a staff member to reveal",
  },
  discount: {
    color: 0xF39C12,
    emoji: "🏷️",
    image: `${PRIZE_IMAGE_BASE}/discount.png`,
    title: "DISCOUNT COUPON",
    description: "Save big on your next purchase! 🎁",
    rarity: "⭐ RARE",
    rarityEmoji: "🌟",
    claimMethod: "A staff member will deliver it manually",
  },
  clothing_1: {
    color: 0xE91E63,
    emoji: "👕",
    image: `${PRIZE_IMAGE_BASE}/clothing.png`,
    title: "CLOTHING REWARD",
    description: "Fresh drip incoming! Time to style up in the city! 👗✨",
    rarity: "⭐ RARE",
    rarityEmoji: "🌟",
    claimMethod: "Delivered in-city automatically",
  },
  clothing_2: {
    color: 0xE91E63,
    emoji: "👕",
    image: `${PRIZE_IMAGE_BASE}/clothing.png`,
    title: "CLOTHING REWARD",
    description: "New threads for the streets! Looking fresh! 👔✨",
    rarity: "⭐ RARE",
    rarityEmoji: "🌟",
    claimMethod: "Delivered in-city automatically",
  },
  name_change: {
    color: 0x3498DB,
    emoji: "🪪",
    image: `${PRIZE_IMAGE_BASE}/name-change.png`,
    title: "FREE NAME CHANGE",
    description: "Time for a fresh identity! 📝",
    rarity: "⭐ RARE",
    rarityEmoji: "🌟",
    claimMethod: "Contact a staff member to apply",
  },
  mission_skip: {
    color: 0xE67E22,
    emoji: "⏭️",
    image: `${PRIZE_IMAGE_BASE}/mission-skip.png`,
    title: "MISSION SKIP",
    description: "Skip the grind, keep the rewards! ⚡",
    rarity: "Common",
    rarityEmoji: "🎰",
    claimMethod: "Automatically applied",
  },
  better_luck_1: {
    color: 0x95A5A6,
    emoji: "😢",
    image: `${PRIZE_IMAGE_BASE}/better-luck.png`,
    title: "BETTER LUCK NEXT TIME",
    description: "Luck wasn't on their side this time... 💔",
    rarity: "—",
    rarityEmoji: "💔",
    claimMethod: "",
  },
  better_luck_2: {
    color: 0x95A5A6,
    emoji: "😢",
    image: `${PRIZE_IMAGE_BASE}/better-luck.png`,
    title: "BETTER LUCK NEXT TIME",
    description: "The wheel said no... but the next spin could be the big one!",
    rarity: "—",
    rarityEmoji: "💔",
    claimMethod: "",
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

    const userMention = discord_id ? `<@${discord_id}>` : null;
    const displayName = discord_username || "Unknown Player";
    const isBetterLuck = prize_key === "better_luck_1" || prize_key === "better_luck_2";
    const isRare = config.rarity.includes("RARE");
    const timestamp = `<t:${Math.floor(Date.now() / 1000)}:F>`;

    const userDisplay = discord_id
      ? `<@${discord_id}>\n**${displayName}**`
      : `**${displayName}**`;

    // Build embed matching the professional style of other notifications
    let embed: Record<string, unknown>;

    if (isBetterLuck) {
      embed = {
        author: {
          name: "SKYLIFE ROLEPLAY INDIA • Spin & Win",
          icon_url: LOGO_URL,
        },
        title: `😢 ${config.title}`,
        description: `A player tried their luck on the **Skylife Spin & Win** wheel, but fortune wasn't smiling today...`,
        color: config.color,
        thumbnail: { url: LOGO_URL },
        fields: [
          {
            name: "━━━━━ PLAYER ━━━━━",
            value: "\u200b",
            inline: false,
          },
          {
            name: "👤 Player",
            value: userDisplay,
            inline: true,
          },
          {
            name: "🆔 Discord ID",
            value: discord_id ? `**${discord_id}**` : "**N/A**",
            inline: true,
          },
          {
            name: "\u200b",
            value: "\u200b",
            inline: true,
          },
          {
            name: "━━━━━ RESULT ━━━━━",
            value: "\u200b",
            inline: false,
          },
          {
            name: "🎰 Outcome",
            value: `> **${config.description}**`,
            inline: false,
          },
          {
            name: "⏰ Next Chance",
            value: "Spin again after the **24-hour** cooldown!",
            inline: true,
          },
          {
            name: "💡 Tip",
            value: "Stay active in the city for bonus spins!",
            inline: true,
          },
          {
            name: "📅 Spin Date",
            value: timestamp,
            inline: true,
          },
        ],
        image: { url: config.image },
        footer: {
          text: "😔 SKYLIFE ROLEPLAY INDIA • Better luck next spin!",
          icon_url: LOGO_URL,
        },
        timestamp: new Date().toISOString(),
      };
    } else {
      embed = {
        author: {
          name: "SKYLIFE ROLEPLAY INDIA • Spin & Win",
          icon_url: LOGO_URL,
        },
        title: `${config.emoji} ${config.title} WON!`,
        description: isRare
          ? `🌟 **A RARE PRIZE has been won!** 🌟\nThe Lucky Wheel has blessed a player with an incredible reward!`
          : `🎉 **CONGRATULATIONS!**\nThe Lucky Wheel has chosen a winner!`,
        color: config.color,
        thumbnail: { url: LOGO_URL },
        fields: [
          {
            name: "━━━━━ WINNER ━━━━━",
            value: "\u200b",
            inline: false,
          },
          {
            name: "👤 Player",
            value: userDisplay,
            inline: true,
          },
          {
            name: "🆔 Discord ID",
            value: discord_id ? `**${discord_id}**` : "**N/A**",
            inline: true,
          },
          {
            name: "\u200b",
            value: "\u200b",
            inline: true,
          },
          {
            name: "━━━━━ PRIZE DETAILS ━━━━━",
            value: "\u200b",
            inline: false,
          },
          {
            name: `${config.emoji} Prize`,
            value: `> **${config.title}**`,
            inline: true,
          },
          {
            name: "🏆 Rarity",
            value: `> **${config.rarity}**`,
            inline: true,
          },
          {
            name: "📝 Description",
            value: `> ${config.description}`,
            inline: false,
          },
          {
            name: "━━━━━ CLAIM INFO ━━━━━",
            value: "\u200b",
            inline: false,
          },
          {
            name: "📦 How to Claim",
            value: `> **${config.claimMethod}**`,
            inline: true,
          },
          {
            name: "📅 Won On",
            value: timestamp,
            inline: true,
          },
        ],
        image: { url: config.image },
        footer: {
          text: isRare
            ? "🌟 RARE PRIZE • SKYLIFE ROLEPLAY INDIA • Spin & Win"
            : "🎰 SKYLIFE ROLEPLAY INDIA • Spin & Win",
          icon_url: LOGO_URL,
        },
        timestamp: new Date().toISOString(),
      };
    }

    // Build content message with proper tagging
    let content: string;
    if (isBetterLuck) {
      content = userMention
        ? `${userMention} tried the **Skylife Spin & Win** wheel... 😢`
        : `**${displayName}** tried the **Skylife Spin & Win** wheel... 😢`;
    } else {
      const winnerTag = userMention || `**${displayName}**`;
      content = isRare
        ? `@everyone\n\n🌟🎰 **━━━━━━ RARE PRIZE WON! ━━━━━━** 🎰🌟\n\n${winnerTag} just won a **${config.title}** from the Lucky Wheel! 🎉🎉`
        : `@everyone\n\n🎰 **━━━━━━ SKYLIFE SPIN & WIN ━━━━━━** 🎰\n\n${winnerTag} just won from the Lucky Wheel! 🎉`;
    }

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
            parse: ["everyone"],
            users: discord_id ? [discord_id] : [],
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
