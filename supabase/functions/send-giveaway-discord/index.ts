import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GiveawayPayload {
  type: 'new_giveaway' | 'winner_selected';
  giveaway: {
    id?: string;
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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!DISCORD_BOT_TOKEN) {
      console.error("DISCORD_BOT_TOKEN not configured");
      throw new Error("DISCORD_BOT_TOKEN not configured");
    }

    console.log("=== Giveaway Discord Notification ===");
    console.log("Type:", payload.type);
    console.log("Giveaway:", payload.giveaway.title);

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    let channelId: string;
    let embed: any;
    let content: string;
    let components: any[] = [];

    // Website URLs
    const WEBSITE_URL = "https://roleplay-horizon.lovable.app";
    const GIVEAWAY_URL = `${WEBSITE_URL}/giveaway`;
    const LOGO_URL = `${WEBSITE_URL}/images/slrp-logo.png`;

    if (payload.type === 'new_giveaway') {
      channelId = GIVEAWAY_CHANNEL_ID || "";
      if (!channelId) {
        console.error("DISCORD_GIVEAWAY_CHANNEL_ID not configured");
        throw new Error("DISCORD_GIVEAWAY_CHANNEL_ID not configured");
      }

      console.log("Sending NEW GIVEAWAY notification to channel:", channelId);

      const endDate = new Date(payload.giveaway.end_date);
      const discordTimestamp = Math.floor(endDate.getTime() / 1000);

      embed = {
        title: "🎁✨ NEW GIVEAWAY ALERT ✨🎁",
        description: [
          `# ${payload.giveaway.title}`,
          "",
          payload.giveaway.description || "*An incredible prize is up for grabs!*",
          "",
          "```",
          "╔═══════════════════════════════════════╗",
          "║     🌟 DON'T MISS THIS OPPORTUNITY! 🌟     ║",
          "╚═══════════════════════════════════════╝",
          "```"
        ].join("\n"),
        color: 0xFFD700,
        fields: [
          {
            name: "🎁 PRIZE",
            value: `>>> **${payload.giveaway.prize}**`,
            inline: false
          },
          {
            name: "🏆 Winners",
            value: `\`${payload.giveaway.winner_count}\` lucky winner${payload.giveaway.winner_count > 1 ? 's' : ''}`,
            inline: true
          },
          {
            name: "⏰ Ends",
            value: `<t:${discordTimestamp}:R>`,
            inline: true
          },
          {
            name: "📅 End Date",
            value: `<t:${discordTimestamp}:F>`,
            inline: true
          },
          {
            name: "━━━━━━━━━━━━━━━━━━━━",
            value: "\u200B",
            inline: false
          },
          {
            name: "🎮 How to Enter",
            value: [
              ">>> 1️⃣ Click the **Enter Giveaway** button below",
              "2️⃣ Login/Register on our website",
              "3️⃣ Click **Enter Giveaway** on the page",
              "",
              "*That's it! You're in! 🎉*"
            ].join("\n"),
            inline: false
          }
        ],
        image: payload.giveaway.prize_image_url ? { url: payload.giveaway.prize_image_url } : undefined,
        thumbnail: {
          url: LOGO_URL
        },
        footer: {
          text: "🍀 SkyLife Roleplay • May luck be with you! 🍀",
          icon_url: LOGO_URL
        },
        timestamp: new Date().toISOString()
      };

      content = [
        "# 🎊 @everyone NEW GIVEAWAY! 🎊",
        "",
        "> 🎁 **An amazing prize awaits one lucky winner!**",
        "> ⏰ **Limited time only - Enter now!**"
      ].join("\n");

      // Add action buttons
      components = [
        {
          type: 1, // Action Row
          components: [
            {
              type: 2, // Button
              style: 5, // Link button
              label: "🎉 Enter Giveaway",
              url: GIVEAWAY_URL,
              emoji: { name: "🎁" }
            },
            {
              type: 2,
              style: 5,
              label: "📋 View All Giveaways",
              url: GIVEAWAY_URL,
              emoji: { name: "📋" }
            },
            {
              type: 2,
              style: 5,
              label: "🌐 Visit Website",
              url: WEBSITE_URL,
              emoji: { name: "🌐" }
            }
          ]
        }
      ];

    } else if (payload.type === 'winner_selected') {
      channelId = WINNER_CHANNEL_ID || "";
      if (!channelId) {
        console.error("DISCORD_WINNER_CHANNEL_ID not configured");
        throw new Error("DISCORD_WINNER_CHANNEL_ID not configured");
      }

      console.log("Sending WINNER notification to channel:", channelId);

      let winners = payload.winners || [];
      console.log("Winners received:", winners.length);
      
      // Fetch Discord IDs for all winners from profiles if not already provided
      const enrichedWinners = await Promise.all(
        winners.map(async (winner) => {
          if (winner.discord_id) {
            console.log(`Winner ${winner.discord_username} already has Discord ID: ${winner.discord_id}`);
            return winner;
          }
          
          console.log(`Fetching Discord ID for user: ${winner.user_id}`);
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("discord_id, discord_username")
            .eq("id", winner.user_id)
            .single();
          
          if (error) {
            console.error(`Error fetching profile for ${winner.user_id}:`, error);
          }
          
          if (profile?.discord_id) {
            console.log(`Found Discord ID for ${winner.discord_username}: ${profile.discord_id}`);
            return {
              ...winner,
              discord_id: profile.discord_id,
              discord_username: profile.discord_username || winner.discord_username
            };
          }
          
          console.log(`No Discord ID found for user: ${winner.user_id}`);
          return winner;
        })
      );
      
      // Build winner mentions and list
      const winnerMentions: string[] = [];
      const winnerListForEmbed: string[] = [];
      const emojis = ['🥇', '🥈', '🥉', '🏅', '🎖️', '⭐', '✨', '💫', '🌟', '💎'];
      
      enrichedWinners.forEach((w, i) => {
        const emoji = emojis[i] || '🏆';
        if (w.discord_id) {
          winnerMentions.push(`<@${w.discord_id}>`);
          winnerListForEmbed.push(`${emoji} <@${w.discord_id}>`);
          console.log(`Added mention for: <@${w.discord_id}>`);
        } else {
          winnerListForEmbed.push(`${emoji} **${w.discord_username || 'Unknown User'}**`);
          console.log(`No Discord ID for winner, using username: ${w.discord_username}`);
        }
      });

      console.log("Winner mentions:", winnerMentions);
      console.log("Winner list for embed:", winnerListForEmbed);

      embed = {
        title: "🏆🎊 WINNERS ANNOUNCED! 🎊🏆",
        description: [
          `# 🎉 ${payload.giveaway.title}`,
          "",
          "```",
          "╔═══════════════════════════════════════╗",
          "║    🌟 CONGRATULATIONS WINNERS! 🌟    ║",
          "╚═══════════════════════════════════════╝",
          "```",
          "",
          "*The wait is over! Our lucky winners have been selected!*"
        ].join("\n"),
        color: 0x00FF00,
        thumbnail: {
          url: payload.giveaway.prize_image_url || LOGO_URL
        },
        fields: [
          {
            name: "🎁 Prize Won",
            value: `>>> **${payload.giveaway.prize}**`,
            inline: false
          },
          {
            name: `👑 Winner${enrichedWinners.length > 1 ? 's' : ''} (${enrichedWinners.length})`,
            value: winnerListForEmbed.join('\n') || '❌ No winners selected',
            inline: false
          },
          {
            name: "━━━━━━━━━━━━━━━━━━━━",
            value: "\u200B",
            inline: false
          },
          {
            name: "📬 Prize Claim Instructions",
            value: [
              ">>> **Step 1:** Check your Discord DMs 📩",
              "**Step 2:** Respond within 24 hours ⏰",
              "**Step 3:** Follow the claim instructions 📋",
              "**Step 4:** Enjoy your prize! 🎉"
            ].join("\n"),
            inline: false
          },
          {
            name: "⚠️ Important Notice",
            value: [
              "```diff",
              "+ Make sure your DMs are OPEN!",
              "- Prize must be claimed within 48 hours",
              "- Unclaimed prizes will be redrawn",
              "```"
            ].join("\n"),
            inline: false
          }
        ],
        image: {
          url: payload.giveaway.prize_image_url || undefined
        },
        footer: {
          text: "🙏 Thank you to everyone who participated! • SkyLife Roleplay",
          icon_url: LOGO_URL
        },
        timestamp: new Date().toISOString()
      };

      // Build the content message with all winner mentions at the start
      const mentionString = winnerMentions.length > 0 ? winnerMentions.join(' ') : '';
      content = [
        "# 🎊✨ GIVEAWAY WINNERS! ✨🎊",
        "",
        `${mentionString}`,
        "",
        `> 🏆 **Congratulations! You won the ${payload.giveaway.title}!**`,
        "> 📬 **Check your DMs for prize claim instructions!**"
      ].join("\n");
      
      console.log("Final content message:", content);

      // Add action buttons for winners
      components = [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 5,
              label: "🎁 View More Giveaways",
              url: GIVEAWAY_URL,
              emoji: { name: "🎁" }
            },
            {
              type: 2,
              style: 5,
              label: "🌐 Visit Website",
              url: WEBSITE_URL,
              emoji: { name: "🌐" }
            }
          ]
        }
      ];

    } else {
      throw new Error("Invalid payload type: " + payload.type);
    }

    // Build allowed_mentions properly - users and parse:["users"] are mutually exclusive
    const winnerDiscordIds = payload.winners?.filter(w => w.discord_id).map(w => w.discord_id) || [];
    const allowedMentions: any = {
      parse: ["everyone"]
    };
    
    // If we have specific user IDs, use those instead of parse: ["users"]
    if (winnerDiscordIds.length > 0) {
      allowedMentions.users = winnerDiscordIds;
    }

    // Send to Discord with components (buttons)
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
          components: components,
          allowed_mentions: allowedMentions
        }),
      }
    );

    const responseText = await discordResponse.text();
    console.log("Discord API response status:", discordResponse.status);
    console.log("Discord API response:", responseText);

    if (!discordResponse.ok) {
      console.error("Discord API error:", responseText);
      throw new Error(`Discord API error: ${discordResponse.status} - ${responseText}`);
    }

    const result = JSON.parse(responseText);
    console.log("Discord message sent successfully! Message ID:", result.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message_id: result.id,
        channel_id: channelId,
        type: payload.type
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-giveaway-discord:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
