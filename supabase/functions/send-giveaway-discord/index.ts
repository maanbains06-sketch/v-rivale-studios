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

      // Build embed WITHOUT black background - using clean design
      embed = {
        title: "🎁 NEW GIVEAWAY 🎁",
        description: [
          `## ✨ ${payload.giveaway.title} ✨`,
          "",
          payload.giveaway.description || "*An incredible prize is up for grabs!*",
          "",
          "**🔥 Don't miss this amazing opportunity! 🔥**"
        ].join("\n"),
        color: 0xFFD700, // Gold color
        fields: [
          {
            name: "💎 Prize",
            value: `**${payload.giveaway.prize}**`,
            inline: false
          },
          {
            name: "🏆 Winners",
            value: `**${payload.giveaway.winner_count}** lucky winner${payload.giveaway.winner_count > 1 ? 's' : ''}!`,
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
            name: "📝 How to Enter",
            value: [
              "1️⃣ Click **Enter Giveaway** button below",
              "2️⃣ Login or Register on our website",
              "3️⃣ Click the **Enter** button on the page",
              "4️⃣ Wait for the results! 🎉"
            ].join("\n"),
            inline: false
          }
        ],
        thumbnail: {
          url: LOGO_URL
        },
        footer: {
          text: "🎮 SkyLife Roleplay Giveaways • Best of luck! 🍀",
          icon_url: LOGO_URL
        },
        timestamp: new Date().toISOString()
      };

      // Add prize image if provided (no black background)
      if (payload.giveaway.prize_image_url) {
        embed.image = { url: payload.giveaway.prize_image_url };
      }

      content = "# 🎊 @everyone NEW GIVEAWAY! 🎊\n\n> 🎁 **An amazing prize awaits one lucky winner!**\n> ⏰ **Limited time only - Enter now!**";

      // Add action buttons
      components = [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 5,
              label: "🎉 Enter Giveaway",
              url: GIVEAWAY_URL
            },
            {
              type: 2,
              style: 5,
              label: "🌐 Visit Website",
              url: WEBSITE_URL
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
      console.log("Winners data:", JSON.stringify(winners, null, 2));
      
      // Fetch Discord IDs for all winners from profiles - improved lookup
      const enrichedWinners = await Promise.all(
        winners.map(async (winner) => {
          // If we already have a valid Discord ID, use it
          if (winner.discord_id && /^\d{17,19}$/.test(winner.discord_id)) {
            console.log(`Winner ${winner.discord_username} already has valid Discord ID: ${winner.discord_id}`);
            return winner;
          }
          
          console.log(`Fetching Discord ID for user: ${winner.user_id}`);
          
          // Try to get Discord ID from profiles table
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("discord_id, discord_username")
            .eq("id", winner.user_id)
            .single();
          
          if (error) {
            console.error(`Error fetching profile for ${winner.user_id}:`, error);
          }
          
          if (profile?.discord_id && /^\d{17,19}$/.test(profile.discord_id)) {
            console.log(`Found Discord ID for ${winner.discord_username}: ${profile.discord_id}`);
            return {
              ...winner,
              discord_id: profile.discord_id,
              discord_username: profile.discord_username || winner.discord_username
            };
          }
          
          // Fallback: try to get Discord ID from giveaway_entries table
          const { data: entry } = await supabase
            .from("giveaway_entries")
            .select("discord_id, discord_username")
            .eq("user_id", winner.user_id)
            .eq("giveaway_id", payload.giveaway.id)
            .single();
          
          if (entry?.discord_id && /^\d{17,19}$/.test(entry.discord_id)) {
            console.log(`Found Discord ID from entries for ${winner.discord_username}: ${entry.discord_id}`);
            return {
              ...winner,
              discord_id: entry.discord_id,
              discord_username: entry.discord_username || winner.discord_username
            };
          }
          
          console.log(`No valid Discord ID found for user: ${winner.user_id}`);
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

      // Build embed WITHOUT black background
      embed = {
        title: "🏆 WINNERS ANNOUNCED! 🏆",
        description: [
          `## 🎉 ${payload.giveaway.title} 🎉`,
          "",
          "**🌟 Congratulations to our amazing winners! 🌟**"
        ].join("\n"),
        color: 0x00FF00, // Green color
        thumbnail: {
          url: LOGO_URL
        },
        fields: [
          {
            name: "💎 Prize Won",
            value: `**${payload.giveaway.prize}**`,
            inline: false
          },
          {
            name: `👑 Winner${enrichedWinners.length > 1 ? 's' : ''} (${enrichedWinners.length})`,
            value: winnerListForEmbed.join('\n') || '❌ No winners selected',
            inline: false
          },
          {
            name: "📬 How to Claim",
            value: [
              "📩 Check your Discord DMs",
              "⏰ Respond within 24 hours",
              "🎉 Enjoy your prize!"
            ].join("\n"),
            inline: false
          },
          {
            name: "⚠️ Important",
            value: "Make sure your DMs are **OPEN**. Claim within **48 hours** or a new winner will be selected!",
            inline: false
          }
        ],
        footer: {
          text: "🙏 Thank you all for participating! • SkyLife Roleplay",
          icon_url: LOGO_URL
        },
        timestamp: new Date().toISOString()
      };

      // Add prize image if provided
      if (payload.giveaway.prize_image_url) {
        embed.image = { url: payload.giveaway.prize_image_url };
      }

      // Build the content with winner mentions at the start
      const mentionString = winnerMentions.length > 0 ? winnerMentions.join(' ') : '';
      content = [
        "# 🎊 GIVEAWAY WINNERS! 🎊",
        "",
        mentionString,
        "",
        `> 🏆 **Congratulations! You won the ${payload.giveaway.title}!**`,
        "> 📬 **Check your DMs for prize claim instructions!**"
      ].join("\n");
      
      console.log("Final content message:", content);

      components = [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 5,
              label: "🎁 View More Giveaways",
              url: GIVEAWAY_URL
            },
            {
              type: 2,
              style: 5,
              label: "🌐 Visit Website",
              url: WEBSITE_URL
            }
          ]
        }
      ];

    } else {
      throw new Error("Invalid payload type: " + payload.type);
    }

    // Build allowed_mentions - use enrichedWinners for winner announcements
    const winnerDiscordIds: string[] = [];
    if (payload.type === 'winner_selected' && payload.winners) {
      // For winner selection, use the enrichedWinners we built above
      // Get the discord_ids from the embed fields (they were built from enrichedWinners)
      payload.winners.forEach(w => {
        if (w.discord_id && /^\d{17,19}$/.test(w.discord_id)) {
          winnerDiscordIds.push(w.discord_id);
        }
      });
    }
    
    const allowedMentions: any = {
      parse: ["everyone"]
    };
    
    if (winnerDiscordIds.length > 0) {
      allowedMentions.users = winnerDiscordIds;
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
          content: content,
          embeds: [embed],
          components: components,
          allowed_mentions: allowedMentions
        }),
      }
    );

    const responseText = await discordResponse.text();
    console.log("Discord API response status:", discordResponse.status);

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
