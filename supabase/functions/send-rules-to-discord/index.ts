import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Server rules data with images
const rulesSections = [
  {
    title: "📋 General Rules",
    color: 0x00CED1,
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=400&fit=crop",
    rules: [
      { emoji: "🤝", text: "Respect all players and staff members at all times" },
      { emoji: "🚫", text: "No cheating, hacking, or exploiting bugs" },
      { emoji: "📝", text: "Use proper roleplay names and characters" },
      { emoji: "🎭", text: "Stay in character at all times during gameplay" },
      { emoji: "👮", text: "Follow server admin instructions immediately" },
    ],
  },
  {
    title: "🎭 Roleplay Rules",
    color: 0x9B59B6,
    image: "https://images.unsplash.com/photo-1493711662062-fa541f7f897a?w=800&h=400&fit=crop",
    rules: [
      { emoji: "❤️", text: "Value your character's life (No RDM/VDM)" },
      { emoji: "🎬", text: "Follow realistic roleplay standards" },
      { emoji: "⚠️", text: "No power gaming or meta gaming" },
      { emoji: "📻", text: "Use in-game communication systems properly" },
      { emoji: "🎤", text: "Communicate using voice chat only in roleplay" },
    ],
  },
  {
    title: "⚔️ Combat Rules",
    color: 0xE91E63,
    image: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&h=400&fit=crop",
    rules: [
      { emoji: "🗣️", text: "Initiate proper RP before combat" },
      { emoji: "🚷", text: "No combat logging during situations" },
      { emoji: "💀", text: "Respect NLR (New Life Rule) after respawn" },
      { emoji: "✅", text: "Wait for admin approval in major conflicts" },
      { emoji: "🔫", text: "Use appropriate weapons for your character role" },
    ],
  },
  {
    title: "💰 Economy Rules",
    color: 0x2ECC71,
    image: "https://images.unsplash.com/photo-1554672723-d42a16e533db?w=800&h=400&fit=crop",
    rules: [
      { emoji: "🚫", text: "No money glitching or exploits" },
      { emoji: "🏢", text: "Follow realistic business practices" },
      { emoji: "📢", text: "Report suspicious transactions" },
      { emoji: "📄", text: "Maintain proper documentation for large deals" },
      { emoji: "🏠", text: "Respect property ownership and boundaries" },
    ],
  },
  {
    title: "🚗 Vehicle Rules",
    color: 0xF39C12,
    image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&h=400&fit=crop",
    rules: [
      { emoji: "🚦", text: "Drive realistically according to traffic laws" },
      { emoji: "💥", text: "No vehicle ramming without RP reason" },
      { emoji: "🚙", text: "Use appropriate vehicles for your role" },
      { emoji: "🔧", text: "Repair vehicles at designated locations" },
      { emoji: "🚨", text: "Report stolen vehicles to authorities" },
    ],
  },
  {
    title: "👥 Community Rules",
    color: 0x3498DB,
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=400&fit=crop",
    rules: [
      { emoji: "🆘", text: "Be helpful to new players" },
      { emoji: "📋", text: "Report rule violations to staff" },
      { emoji: "🎉", text: "Participate in community events" },
      { emoji: "💬", text: "Provide constructive feedback" },
      { emoji: "✨", text: "Maintain a positive gaming environment" },
    ],
  },
];

async function getOrCreateWebhook(channelId: string, botToken: string, ownerName: string, ownerAvatar: string | null): Promise<{ id: string; token: string } | null> {
  try {
    // First, try to get existing webhooks
    const webhooksResponse = await fetch(`https://discord.com/api/v10/channels/${channelId}/webhooks`, {
      headers: {
        'Authorization': `Bot ${botToken}`,
      },
    });

    if (!webhooksResponse.ok) {
      console.log('Cannot access webhooks, will use bot messages instead');
      return null;
    }

    const webhooks = await webhooksResponse.json();
    
    // Look for our existing webhook
    const existingWebhook = webhooks.find((wh: any) => wh.name === 'SLRP Rules');
    if (existingWebhook) {
      return { id: existingWebhook.id, token: existingWebhook.token };
    }

    // Create new webhook
    const createResponse = await fetch(`https://discord.com/api/v10/channels/${channelId}/webhooks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'SLRP Rules',
        avatar: ownerAvatar,
      }),
    });

    if (!createResponse.ok) {
      console.log('Cannot create webhook, will use bot messages instead');
      return null;
    }

    const newWebhook = await createResponse.json();
    return { id: newWebhook.id, token: newWebhook.token };
  } catch (error) {
    console.error('Webhook error:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const discordBotToken = Deno.env.get('DISCORD_BOT_TOKEN');
    const rulesChannelId = Deno.env.get('DISCORD_RULES_CHANNEL_ID');
    const ownerDiscordId = Deno.env.get('OWNER_DISCORD_ID');

    if (!discordBotToken || !rulesChannelId || !ownerDiscordId) {
      throw new Error('Missing required environment variables');
    }

    console.log('Fetching owner Discord profile...');
    
    // Fetch owner's Discord profile
    const ownerResponse = await fetch(`https://discord.com/api/v10/users/${ownerDiscordId}`, {
      headers: { 'Authorization': `Bot ${discordBotToken}` },
    });

    let ownerAvatar: string | null = null;
    let ownerUsername = 'SLRP Owner';
    let ownerAvatarBase64: string | null = null;

    if (ownerResponse.ok) {
      const ownerData = await ownerResponse.json();
      ownerUsername = ownerData.global_name || ownerData.username || 'SLRP Owner';
      if (ownerData.avatar) {
        ownerAvatar = `https://cdn.discordapp.com/avatars/${ownerDiscordId}/${ownerData.avatar}.png?size=256`;
        
        // Fetch avatar as base64 for webhook
        try {
          const avatarResponse = await fetch(ownerAvatar);
          if (avatarResponse.ok) {
            const avatarBuffer = await avatarResponse.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(avatarBuffer)));
            ownerAvatarBase64 = `data:image/png;base64,${base64}`;
          }
        } catch (e) {
          console.log('Could not fetch avatar for webhook');
        }
      }
    }

    console.log(`Owner profile: ${ownerUsername}`);

    // Try to get/create webhook for sending as the owner
    const webhook = await getOrCreateWebhook(rulesChannelId, discordBotToken, ownerUsername, ownerAvatarBase64);
    
    const sendMessage = async (payload: any) => {
      if (webhook) {
        // Send via webhook (appears as owner)
        const webhookPayload = {
          ...payload,
          username: ownerUsername,
          avatar_url: ownerAvatar,
        };
        
        const response = await fetch(`https://discord.com/api/v10/webhooks/${webhook.id}/${webhook.token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookPayload),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Webhook failed: ${response.status} - ${errorText}`);
        }
        return response;
      } else {
        // Fallback to bot message
        const response = await fetch(`https://discord.com/api/v10/channels/${rulesChannelId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${discordBotToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Bot message failed: ${response.status} - ${errorText}`);
        }
        return response;
      }
    };

    // Create beautiful header embed
    const headerEmbed = {
      title: "╔══════════════════════════════════════╗\n║        📜 SLRP SERVER RULES        ║\n╚══════════════════════════════════════╝",
      description: `Welcome to **SLRP**! 🎮\n\n> *Please read and follow all rules below to ensure a fair and enjoyable experience for everyone in our community.*\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n⚠️ **IMPORTANT NOTICE**\n\`\`\`diff\n- Breaking these rules may result in:\n- • Verbal Warning\n- • Temporary Kick\n- • Permanent Ban\n\`\`\`\n\n✅ *Staff decisions are final*\n📝 *Appeal bans through our Discord server*\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      color: 0x00D9FF,
      thumbnail: {
        url: ownerAvatar || "https://cdn.discordapp.com/embed/avatars/0.png",
      },
      image: {
        url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=400&fit=crop",
      },
      footer: {
        text: `SLRP • Posted by ${ownerUsername} • Last Updated`,
        icon_url: ownerAvatar || "https://cdn.discordapp.com/embed/avatars/0.png",
      },
      timestamp: new Date().toISOString(),
    };

    console.log('Sending header embed...');
    await sendMessage({ embeds: [headerEmbed] });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Send each rule section with enhanced design
    for (let i = 0; i < rulesSections.length; i++) {
      const section = rulesSections[i];
      const sectionNumber = i + 1;
      
      const rulesText = section.rules
        .map((rule, index) => `${rule.emoji} **${index + 1}.** ${rule.text}`)
        .join('\n\n');
      
      const sectionEmbed = {
        title: `${section.title}`,
        description: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${rulesText}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        color: section.color,
        thumbnail: {
          url: ownerAvatar || "https://cdn.discordapp.com/embed/avatars/0.png",
        },
        image: {
          url: section.image,
        },
        footer: {
          text: `Section ${sectionNumber} of ${rulesSections.length} • SLRP Rules • ${ownerUsername}`,
          icon_url: ownerAvatar || "https://cdn.discordapp.com/embed/avatars/0.png",
        },
      };

      console.log(`Sending ${section.title}...`);
      await sendMessage({ embeds: [sectionEmbed] });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Send closing embed
    const closingEmbed = {
      title: "✨ Thank You For Reading!",
      description: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n> 🎮 **Enjoy your time at SLRP!**\n> \n> By playing on our server, you agree to follow all rules listed above.\n> \n> Questions? Contact our staff team!\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n**Quick Links:**\n🌐 [Website](https://slrp.com) • 💬 [Support](https://slrp.com/support) • 📋 [Apply](https://slrp.com/whitelist)`,
      color: 0x00FF88,
      thumbnail: {
        url: ownerAvatar || "https://cdn.discordapp.com/embed/avatars/0.png",
      },
      footer: {
        text: `SLRP Community • ${ownerUsername}`,
        icon_url: ownerAvatar || "https://cdn.discordapp.com/embed/avatars/0.png",
      },
      timestamp: new Date().toISOString(),
    };

    await sendMessage({ embeds: [closingEmbed] });

    console.log('All rules sent successfully!');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Server rules sent to Discord successfully!',
        channelId: rulesChannelId,
        sectionsPosted: rulesSections.length + 2,
        sentAs: webhook ? 'webhook' : 'bot',
        ownerName: ownerUsername,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error sending rules to Discord:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
