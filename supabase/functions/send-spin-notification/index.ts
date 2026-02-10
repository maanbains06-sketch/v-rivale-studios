import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STORAGE_BASE = "https://obirpzwvnqveddyuulsb.supabase.co/storage/v1/object/public/discord-assets/spin-prizes";

interface PrizeConfig {
  color: number;
  emoji: string;
  image: string;
  title: string;
  description: string;
  footer: string;
  rarity: string;
  rarityEmoji: string;
}

const PRIZE_CONFIGS: Record<string, PrizeConfig> = {
  free_queue: {
    color: 0xFFD700,
    emoji: "🎫",
    image: `${STORAGE_BASE}/free-queue.png`,
    title: "FREE QUEUE ENTRY WON!",
    description: "Skip the line and jump straight into the city!",
    footer: "⭐ RARE PRIZE • Skylife Roleplay India",
    rarity: "⭐ RARE",
    rarityEmoji: "🌟",
  },
  cash_10k: {
    color: 0x2ECC71,
    emoji: "💰",
    image: `${STORAGE_BASE}/cash.png`,
    title: "$10,000 CASH WON!",
    description: "Money bags incoming!",
    footer: "💸 Skylife Roleplay India • Spin & Win",
    rarity: "Common",
    rarityEmoji: "🎰",
  },
  cash_5k: {
    color: 0x2ECC71,
    emoji: "💵",
    image: `${STORAGE_BASE}/cash.png`,
    title: "$5,000 CASH WON!",
    description: "Every dollar counts!",
    footer: "💸 Skylife Roleplay India • Spin & Win",
    rarity: "Common",
    rarityEmoji: "🎰",
  },
  cash_20k: {
    color: 0xFFD700,
    emoji: "🤑",
    image: `${STORAGE_BASE}/cash.png`,
    title: "$20,000 CASH WON!",
    description: "A massive jackpot! The city is theirs!",
    footer: "⭐ RARE PRIZE • Skylife Roleplay India",
    rarity: "⭐ RARE",
    rarityEmoji: "🌟",
  },
  vehicle: {
    color: 0xFFD700,
    emoji: "🚗",
    image: `${STORAGE_BASE}/vehicle.png`,
    title: "RANDOM VEHICLE WON!",
    description: "A brand new ride is waiting in the garage!",
    footer: "⭐ RARE PRIZE • Skylife Roleplay India",
    rarity: "⭐ RARE",
    rarityEmoji: "🌟",
  },
  mystery_box: {
    color: 0x9B59B6,
    emoji: "📦",
    image: `${STORAGE_BASE}/mystery-box.png`,
    title: "MYSTERY BOX WON!",
    description: "What's inside? Only fate knows...",
    footer: "⭐ RARE PRIZE • Skylife Roleplay India",
    rarity: "⭐ RARE",
    rarityEmoji: "🌟",
  },
  discount: {
    color: 0xF39C12,
    emoji: "🏷️",
    image: `${STORAGE_BASE}/discount.png`,
    title: "DISCOUNT COUPON WON!",
    description: "Save big on your next purchase! A staff member will deliver it manually.",
    footer: "⭐ RARE PRIZE • Skylife Roleplay India",
    rarity: "⭐ RARE",
    rarityEmoji: "🌟",
  },
  clothing_1: {
    color: 0xE91E63,
    emoji: "👕",
    image: `${STORAGE_BASE}/clothing.png`,
    title: "CLOTHING REWARD WON!",
    description: "Fresh drip incoming! Time to style up in the city!",
    footer: "⭐ RARE PRIZE • Skylife Roleplay India",
    rarity: "⭐ RARE",
    rarityEmoji: "🌟",
  },
  clothing_2: {
    color: 0xE91E63,
    emoji: "👕",
    image: `${STORAGE_BASE}/clothing.png`,
    title: "CLOTHING REWARD WON!",
    description: "New threads for the streets! Looking fresh!",
    footer: "⭐ RARE PRIZE • Skylife Roleplay India",
    rarity: "⭐ RARE",
    rarityEmoji: "🌟",
  },
  name_change: {
    color: 0x3498DB,
    emoji: "🪪",
    image: `${STORAGE_BASE}/name-change.png`,
    title: "FREE NAME CHANGE WON!",
    description: "Time for a fresh identity!",
    footer: "⭐ RARE PRIZE • Skylife Roleplay India",
    rarity: "⭐ RARE",
    rarityEmoji: "🌟",
  },
  mission_skip: {
    color: 0xE67E22,
    emoji: "⏭️",
    image: `${STORAGE_BASE}/mission-skip.png`,
    title: "MISSION SKIP WON!",
    description: "Skip the grind, keep the rewards!",
    footer: "⚡ Skylife Roleplay India • Spin & Win",
    rarity: "Common",
    rarityEmoji: "🎰",
  },
  better_luck_1: {
    color: 0x95A5A6,
    emoji: "😢",
    image: `${STORAGE_BASE}/better-luck.png`,
    title: "Better Luck Next Time...",
    description: "Luck wasn't on their side this time...",
    footer: "😔 Skylife Roleplay India • Better luck next spin!",
    rarity: "—",
    rarityEmoji: "💔",
  },
  better_luck_2: {
    color: 0x95A5A6,
    emoji: "😢",
    image: `${STORAGE_BASE}/better-luck.png`,
    title: "Better Luck Next Time...",
    description: "The wheel said no... but the next spin could be the big one!",
    footer: "😔 Skylife Roleplay India • Don't lose hope!",
    rarity: "—",
    rarityEmoji: "💔",
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

    // Build the rich embed
    const embed: Record<string, unknown> = {
      title: `${config.emoji} ${config.title}`,
      color: config.color,
      image: { url: config.image },
      footer: {
        text: config.footer,
        icon_url: "https://obirpzwvnqveddyuulsb.supabase.co/storage/v1/object/public/discord-assets/spin-prizes/free-queue.png",
      },
      timestamp: new Date().toISOString(),
    };

    if (isBetterLuck) {
      embed.description = [
        `${config.emoji} ${userMention ? `${userMention} (${displayName})` : `**${displayName}**`} ${config.description}`,
        "",
        "> 💔 Don't give up! Your luck could change next time!",
      ].join("\n");

      embed.fields = [
        {
          name: "⏰ Next Chance",
          value: "Spin again after the **48-hour** cooldown!",
          inline: true,
        },
        {
          name: "💡 Tip",
          value: "Stay active in the city for bonus spins!",
          inline: true,
        },
      ];
    } else {
      embed.description = [
        `🎉 **CONGRATULATIONS!**`,
        "",
        `${config.emoji} ${userMention ? `${userMention} (${displayName})` : `**${displayName}**`} ${config.description}`,
        "",
        `> ${config.rarityEmoji} **Prize:** ${config.title.replace(" WON!", "")}`,
        `> 🏆 **Rarity:** ${config.rarity}`,
      ].join("\n");

      embed.fields = [
        {
          name: "🎰 How to Claim",
          value: "Visit the **Spin & Win** page on our website or contact a staff member!",
          inline: false,
        },
      ];
    }

    // Build content with proper tagging
    let content: string;
    if (isBetterLuck) {
      content = userMention
        ? `${userMention} tried the **Skylife Spin & Win** wheel... 😢`
        : `**${displayName}** tried the **Skylife Spin & Win** wheel... 😢`;
    } else {
      content = [
        `@everyone`,
        "",
        `🎰 **━━━━━━ SKYLIFE SPIN & WIN ━━━━━━** 🎰`,
        "",
        userMention
          ? `${userMention} just won from the Lucky Wheel! 🎉🎉`
          : `**${displayName}** just won from the Lucky Wheel! 🎉🎉`,
      ].join("\n");
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
