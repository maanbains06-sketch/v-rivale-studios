import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!DISCORD_BOT_TOKEN) {
      console.error("DISCORD_BOT_TOKEN not configured");
      throw new Error("DISCORD_BOT_TOKEN not configured");
    }

    console.log("=== Giveaway Discord Notification ===");
    console.log("Type:", payload.type);
    console.log("Giveaway:", payload.giveaway.title);

    // Create Supabase client to fetch Discord IDs if needed
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    let channelId: string;
    let embed: any;
    let content: string;

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
        title: "🎁 NEW GIVEAWAY ALERT! 🎁",
        description: `# ${payload.giveaway.title}\n\n${payload.giveaway.description || '*An amazing prize awaits!*'}\n\n━━━━━━━━━━━━━━━━━━━━━━`,
        color: 0xFFD700, // Gold color
        thumbnail: {
          url: "https://cdn.discordapp.com/emojis/1234567890.gif" // You can replace with actual gif
        },
        fields: [
          {
            name: "🎁 Prize",
            value: `\`\`\`fix\n${payload.giveaway.prize}\n\`\`\``,
            inline: false
          },
          {
            name: "🏆 Winners",
            value: `**${payload.giveaway.winner_count}** lucky winner${payload.giveaway.winner_count > 1 ? 's' : ''} will be selected!`,
            inline: true
          },
          {
            name: "⏰ Ends In",
            value: `<t:${discordTimestamp}:R>\n(<t:${discordTimestamp}:F>)`,
            inline: true
          },
          {
            name: "\u200B",
            value: "━━━━━━━━━━━━━━━━━━━━━━",
            inline: false
          },
          {
            name: "📝 How to Enter",
            value: "🔗 **[Click Here to Enter](https://roleplay-horizon.lovable.app/giveaway)**\n\n> Visit our website and click the **'Enter Giveaway'** button!",
            inline: false
          }
        ],
        image: payload.giveaway.prize_image_url ? { url: payload.giveaway.prize_image_url } : undefined,
        footer: {
          text: "🍀 SkyLife Roleplay Giveaways • Good Luck! 🍀",
          icon_url: "https://roleplay-horizon.lovable.app/images/slrp-logo.png"
        },
        timestamp: new Date().toISOString()
      };

      content = "# 🎉 @everyone NEW GIVEAWAY! 🎉\n\n> 🎁 Don't miss your chance to win amazing prizes! 🎁";

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
          // If discord_id is already provided, use it
          if (winner.discord_id) {
            console.log(`Winner ${winner.discord_username} already has Discord ID: ${winner.discord_id}`);
            return winner;
          }
          
          // Otherwise, fetch from profiles table
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
      
      enrichedWinners.forEach((w, i) => {
        const emoji = ['🥇', '🥈', '🥉'][i] || '🏅';
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
        title: "🏆 GIVEAWAY WINNERS ANNOUNCED! 🏆",
        description: `# 🎊 ${payload.giveaway.title} 🎊\n\n**Congratulations to our amazing winner${enrichedWinners.length > 1 ? 's' : ''}!**\n\n━━━━━━━━━━━━━━━━━━━━━━`,
        color: 0x00FF00, // Green color for winners
        thumbnail: {
          url: payload.giveaway.prize_image_url || "https://roleplay-horizon.lovable.app/images/slrp-logo.png"
        },
        fields: [
          {
            name: "🎁 Prize Won",
            value: `\`\`\`fix\n${payload.giveaway.prize}\n\`\`\``,
            inline: false
          },
          {
            name: `👑 Winner${enrichedWinners.length > 1 ? 's' : ''} (${enrichedWinners.length})`,
            value: winnerListForEmbed.join('\n') || '❌ No winners selected',
            inline: false
          },
          {
            name: "\u200B",
            value: "━━━━━━━━━━━━━━━━━━━━━━",
            inline: false
          },
          {
            name: "📬 How to Claim Your Prize",
            value: "```\n1. Check your Discord DMs\n2. Respond within 24 hours\n3. Follow the instructions to claim!\n```",
            inline: false
          },
          {
            name: "⚠️ Important",
            value: "> Make sure your DMs are **open** so we can contact you!\n> Prize must be claimed within **48 hours** or a new winner will be selected.",
            inline: false
          }
        ],
        footer: {
          text: "🙏 Thank you to everyone who participated! • SkyLife Roleplay",
          icon_url: "https://roleplay-horizon.lovable.app/images/slrp-logo.png"
        },
        timestamp: new Date().toISOString()
      };

      // Build the content message with all winner mentions at the start
      const mentionString = winnerMentions.length > 0 ? winnerMentions.join(' ') : '';
      content = `# 🎉🎊 CONGRATULATIONS TO OUR WINNERS! 🎊🎉\n\n${mentionString}\n\n> 🏆 You have won the **${payload.giveaway.title}** giveaway!\n> 📬 Check your DMs for prize claim instructions!`;
      
      console.log("Final content message:", content);

    } else {
      throw new Error("Invalid payload type: " + payload.type);
    }

    console.log("Sending message to Discord channel:", channelId);

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
            parse: ["everyone", "users"],
            users: payload.winners?.filter(w => w.discord_id).map(w => w.discord_id) || []
          }
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
