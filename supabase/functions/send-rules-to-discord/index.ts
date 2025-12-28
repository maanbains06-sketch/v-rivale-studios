import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SLRP Logo URL - hosted on your domain
const SLRP_LOGO_URL = "https://preview--slrp-hub.lovable.app/images/slrp-logo-discord.png";

// Enhanced rule sections with italic formatting and better design
const rulesSections = [
  {
    title: "〘 📜 〙 GENERAL SERVER RULES",
    color: 0xFFD700, // Gold
    image: "https://images.unsplash.com/photo-1511882150382-421056c89033?w=800&q=80",
    rules: [
      { emoji: "➊", text: "_Respect all players and staff members at all times_" },
      { emoji: "➋", text: "_No harassment, discrimination, or toxic behavior_" },
      { emoji: "➌", text: "_English and Hindi are the primary languages in-game_" },
      { emoji: "➍", text: "_No exploiting bugs or glitches - report them immediately_" },
      { emoji: "➎", text: "_Follow staff instructions without argument_" },
      { emoji: "➏", text: "_No advertising other servers or communities_" }
    ]
  },
  {
    title: "〘 🎭 〙 ROLEPLAY GUIDELINES",
    color: 0x9B59B6, // Purple
    image: "https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800&q=80",
    rules: [
      { emoji: "➊", text: "_Stay in character at all times while in-game_" },
      { emoji: "➋", text: "_Use /ooc for out-of-character communication_" },
      { emoji: "➌", text: "_No metagaming - don't use external information in RP_" },
      { emoji: "➍", text: "_No powergaming - give others a chance to respond_" },
      { emoji: "➎", text: "_Value your life (Fear RP) in dangerous situations_" },
      { emoji: "➏", text: "_Create realistic and immersive storylines_" }
    ]
  },
  {
    title: "〘 🚗 〙 VEHICLE RULES",
    color: 0x3498DB, // Blue
    image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80",
    rules: [
      { emoji: "➊", text: "_No VDM (Vehicle Deathmatch) under any circumstances_" },
      { emoji: "➋", text: "_Follow traffic laws unless in an active RP scenario_" },
      { emoji: "➌", text: "_No unrealistic driving through mountains or water_" },
      { emoji: "➍", text: "_Park vehicles properly in designated areas_" },
      { emoji: "➎", text: "_No combat logging to save your vehicle_" }
    ]
  },
  {
    title: "〘 ⚔️ 〙 COMBAT & CRIME RULES",
    color: 0xE74C3C, // Red
    image: "https://images.unsplash.com/photo-1579566346927-c68383817a25?w=800&q=80",
    rules: [
      { emoji: "➊", text: "_No RDM (Random Deathmatch) - always have valid RP reason_" },
      { emoji: "➋", text: "_Initiate properly before any hostile action_" },
      { emoji: "➌", text: "_Respect the New Life Rule (NLR) after death_" },
      { emoji: "➍", text: "_No cop baiting or intentionally provoking police_" },
      { emoji: "➎", text: "_Maximum 6 members in criminal activities_" },
      { emoji: "➏", text: "_No combat logging during active situations_" }
    ]
  },
  {
    title: "〘 👮 〙 EMERGENCY SERVICES RULES",
    color: 0x2ECC71, // Green
    image: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&q=80",
    rules: [
      { emoji: "➊", text: "_EMS must remain neutral in all criminal activities_" },
      { emoji: "➋", text: "_Police must follow proper arrest procedures_" },
      { emoji: "➌", text: "_No corruption without proper RP development_" },
      { emoji: "➍", text: "_Respond to calls professionally and in character_" },
      { emoji: "➎", text: "_Follow chain of command within departments_" }
    ]
  },
  {
    title: "〘 💬 〙 COMMUNICATION RULES",
    color: 0xF39C12, // Orange
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
    rules: [
      { emoji: "➊", text: "_Use appropriate voice chat distance settings_" },
      { emoji: "➋", text: "_No earrape or playing music through mic_" },
      { emoji: "➌", text: "_Keep Discord communications professional_" },
      { emoji: "➍", text: "_No sharing personal information of others_" },
      { emoji: "➎", text: "_Use proper channels for support requests_" }
    ]
  }
];

async function getOrCreateWebhook(channelId: string, botToken: string, ownerName: string, ownerAvatar: string | null): Promise<{ id: string; token: string } | null> {
  try {
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
    
    const existingWebhook = webhooks.find((wh: any) => wh.name === 'SLRP Rules');
    if (existingWebhook) {
      return { id: existingWebhook.id, token: existingWebhook.token };
    }

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

    const webhook = await getOrCreateWebhook(rulesChannelId, discordBotToken, ownerUsername, ownerAvatarBase64);
    
    const sendMessage = async (payload: any) => {
      if (webhook) {
        const webhookPayload = {
          ...payload,
          username: ownerUsername,
          avatar_url: SLRP_LOGO_URL,
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

    // Beautiful header embed with SLRP logo
    const headerEmbed = {
      author: {
        name: "SKYLIFE ROLEPLAY INDIA",
        icon_url: SLRP_LOGO_URL,
      },
      title: "╔═══════════════════════════════════════════╗\n║     📜  *S E R V E R   R U L E S*  📜    ║\n╚═══════════════════════════════════════════╝",
      description: `\n\n> _**Welcome to SLRP - Skylife Roleplay India!**_ 🎮\n> \n> _Please read and follow all rules below to ensure_\n> _a fair and enjoyable experience for everyone._\n\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n⚠️ **_IMPORTANT NOTICE_**\n\`\`\`ansi\n[2;31m[1;31m⛔ Breaking these rules may result in:[0m[2;31m[0m\n\n   • Verbal Warning\n   • Temporary Kick  \n   • Permanent Ban\n\`\`\`\n\n✅ _Staff decisions are **final**_\n📝 _Appeal bans through our Discord server_\n\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`,
      color: 0x00D9FF,
      thumbnail: {
        url: SLRP_LOGO_URL,
      },
      image: {
        url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=400&fit=crop",
      },
      footer: {
        text: `✦ SLRP ✦ Posted by ${ownerUsername} ✦ Last Updated`,
        icon_url: SLRP_LOGO_URL,
      },
      timestamp: new Date().toISOString(),
    };

    console.log('Sending header embed...');
    await sendMessage({ embeds: [headerEmbed] });
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Send each rule section with enhanced italic design
    for (let i = 0; i < rulesSections.length; i++) {
      const section = rulesSections[i];
      const sectionNumber = i + 1;
      
      const rulesText = section.rules
        .map((rule, index) => `> ${rule.emoji} **${index + 1}.** ${rule.text}`)
        .join('\n>\n');
      
      const sectionEmbed = {
        author: {
          name: `SLRP RULES • Section ${sectionNumber}`,
          icon_url: SLRP_LOGO_URL,
        },
        title: section.title,
        description: `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n${rulesText}\n\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`,
        color: section.color,
        thumbnail: {
          url: SLRP_LOGO_URL,
        },
        image: {
          url: section.image,
        },
        footer: {
          text: `✦ Section ${sectionNumber} of ${rulesSections.length} ✦ SLRP ✦ ${ownerUsername}`,
          icon_url: SLRP_LOGO_URL,
        },
      };

      console.log(`Sending ${section.title}...`);
      await sendMessage({ embeds: [sectionEmbed] });
      await new Promise(resolve => setTimeout(resolve, 1200));
    }

    // Beautiful closing embed
    const closingEmbed = {
      author: {
        name: "SKYLIFE ROLEPLAY INDIA",
        icon_url: SLRP_LOGO_URL,
      },
      title: "〘 ✨ 〙 THANK YOU FOR READING!",
      description: `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n> 🎮 _**Enjoy your time at SLRP!**_\n> \n> _By playing on our server, you agree_\n> _to follow all rules listed above._\n> \n> _Questions? Contact our staff team!_\n\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n**_Quick Links:_**\n🌐 _[Website](https://slrp.com)_ • 💬 _[Support](https://slrp.com/support)_ • 📋 _[Apply](https://slrp.com/whitelist)_\n\n🇮🇳 _**SLRP - India's Premier GTA V Roleplay Server**_ 🇮🇳`,
      color: 0x00FF88,
      thumbnail: {
        url: SLRP_LOGO_URL,
      },
      footer: {
        text: `✦ SLRP Community ✦ ${ownerUsername} ✦`,
        icon_url: SLRP_LOGO_URL,
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
        logoUsed: SLRP_LOGO_URL,
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
