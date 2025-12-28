import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SLRP Logo URL - hosted on your domain
const SLRP_LOGO_URL = "https://preview--slrp-hub.lovable.app/images/slrp-logo-discord.png";

// GTA 5 themed images for each rule section
const GTA_IMAGES = {
  general: "https://i.imgur.com/8Y5Qf9K.jpg", // GTA 5 city skyline
  roleplay: "https://i.imgur.com/JKL3nM2.jpg", // GTA 5 characters
  vehicles: "https://i.imgur.com/2VqP8Nx.jpg", // GTA 5 cars
  combat: "https://i.imgur.com/9RtY4Hs.jpg", // GTA 5 action
  emergency: "https://i.imgur.com/F5mK7Lw.jpg", // GTA 5 police
  communication: "https://i.imgur.com/X8Zp3Qn.jpg", // GTA 5 phone
  header: "https://i.imgur.com/Ug7vP2M.jpg", // GTA 5 Los Santos
};

// Enhanced rule sections with GTA themed images, bold italic formatting
const rulesSections = [
  {
    title: "〘 📜 〙 **__GENERAL SERVER RULES__**",
    color: 0xFFD700, // Gold
    image: GTA_IMAGES.general,
    rules: [
      { emoji: "🔸", text: "***Respect all players and staff members at all times***" },
      { emoji: "🔸", text: "***No harassment, discrimination, or toxic behavior***" },
      { emoji: "🔸", text: "***English and Hindi are the primary languages in-game***" },
      { emoji: "🔸", text: "***No exploiting bugs or glitches - report them immediately***" },
      { emoji: "🔸", text: "***Follow staff instructions without argument***" },
      { emoji: "🔸", text: "***No advertising other servers or communities***" }
    ]
  },
  {
    title: "〘 🎭 〙 **__ROLEPLAY GUIDELINES__**",
    color: 0x9B59B6, // Purple
    image: GTA_IMAGES.roleplay,
    rules: [
      { emoji: "🔹", text: "***Stay in character at all times while in-game***" },
      { emoji: "🔹", text: "***Use /ooc for out-of-character communication***" },
      { emoji: "🔹", text: "***No metagaming - don't use external information in RP***" },
      { emoji: "🔹", text: "***No powergaming - give others a chance to respond***" },
      { emoji: "🔹", text: "***Value your life (Fear RP) in dangerous situations***" },
      { emoji: "🔹", text: "***Create realistic and immersive storylines***" }
    ]
  },
  {
    title: "〘 🚗 〙 **__VEHICLE RULES__**",
    color: 0x3498DB, // Blue
    image: GTA_IMAGES.vehicles,
    rules: [
      { emoji: "🚙", text: "***No VDM (Vehicle Deathmatch) under any circumstances***" },
      { emoji: "🚙", text: "***Follow traffic laws unless in an active RP scenario***" },
      { emoji: "🚙", text: "***No unrealistic driving through mountains or water***" },
      { emoji: "🚙", text: "***Park vehicles properly in designated areas***" },
      { emoji: "🚙", text: "***No combat logging to save your vehicle***" }
    ]
  },
  {
    title: "〘 ⚔️ 〙 **__COMBAT & CRIME RULES__**",
    color: 0xE74C3C, // Red
    image: GTA_IMAGES.combat,
    rules: [
      { emoji: "⚡", text: "***No RDM (Random Deathmatch) - always have valid RP reason***" },
      { emoji: "⚡", text: "***Initiate properly before any hostile action***" },
      { emoji: "⚡", text: "***Respect the New Life Rule (NLR) after death***" },
      { emoji: "⚡", text: "***No cop baiting or intentionally provoking police***" },
      { emoji: "⚡", text: "***Maximum 6 members in criminal activities***" },
      { emoji: "⚡", text: "***No combat logging during active situations***" }
    ]
  },
  {
    title: "〘 👮 〙 **__EMERGENCY SERVICES RULES__**",
    color: 0x2ECC71, // Green
    image: GTA_IMAGES.emergency,
    rules: [
      { emoji: "🚨", text: "***EMS must remain neutral in all criminal activities***" },
      { emoji: "🚨", text: "***Police must follow proper arrest procedures***" },
      { emoji: "🚨", text: "***No corruption without proper RP development***" },
      { emoji: "🚨", text: "***Respond to calls professionally and in character***" },
      { emoji: "🚨", text: "***Follow chain of command within departments***" }
    ]
  },
  {
    title: "〘 💬 〙 **__COMMUNICATION RULES__**",
    color: 0xF39C12, // Orange
    image: GTA_IMAGES.communication,
    rules: [
      { emoji: "📢", text: "***Use appropriate voice chat distance settings***" },
      { emoji: "📢", text: "***No earrape or playing music through mic***" },
      { emoji: "📢", text: "***Keep Discord communications professional***" },
      { emoji: "📢", text: "***No sharing personal information of others***" },
      { emoji: "📢", text: "***Use proper channels for support requests***" }
    ]
  }
];

async function getOrCreateWebhook(channelId: string, botToken: string, ownerUsername: string, ownerAvatarUrl: string | null): Promise<{ id: string; token: string } | null> {
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
    
    // Delete existing SLRP Rules webhook to create fresh one with owner avatar
    const existingWebhook = webhooks.find((wh: any) => wh.name === 'SLRP Rules');
    if (existingWebhook) {
      await fetch(`https://discord.com/api/v10/webhooks/${existingWebhook.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bot ${botToken}` },
      });
    }

    // Create new webhook with owner's avatar
    const createResponse = await fetch(`https://discord.com/api/v10/channels/${channelId}/webhooks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'SLRP Rules',
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

    let ownerAvatarUrl: string | null = null;
    let ownerUsername = 'SLRP Owner';

    if (ownerResponse.ok) {
      const ownerData = await ownerResponse.json();
      ownerUsername = ownerData.global_name || ownerData.username || 'SLRP Owner';
      if (ownerData.avatar) {
        ownerAvatarUrl = `https://cdn.discordapp.com/avatars/${ownerDiscordId}/${ownerData.avatar}.png?size=256`;
      }
      console.log(`Owner profile fetched: ${ownerUsername}, Avatar: ${ownerAvatarUrl ? 'Yes' : 'No'}`);
    }

    const webhook = await getOrCreateWebhook(rulesChannelId, discordBotToken, ownerUsername, ownerAvatarUrl);
    
    const sendMessage = async (payload: any) => {
      if (webhook) {
        // Use owner's avatar and username for webhook messages
        const webhookPayload = {
          ...payload,
          username: ownerUsername,
          avatar_url: ownerAvatarUrl || SLRP_LOGO_URL, // Use owner avatar, fallback to logo
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

    // Enhanced header embed with GTA theme and ANSI colors
    const headerEmbed = {
      author: {
        name: "✧ SKYLIFE ROLEPLAY INDIA ✧",
        icon_url: SLRP_LOGO_URL,
      },
      title: "╔══════════════════════════════════════════════╗\n║   📜  ***S E R V E R   R U L E S***  📜   ║\n╚══════════════════════════════════════════════╝",
      description: `
> 🎮 ***Welcome to SLRP - Skylife Roleplay India!***
> 
> ***Please read and follow all rules below to ensure***
> ***a fair and enjoyable experience for everyone.***

\`\`\`ansi
[1;33m╔════════════════════════════════════════════╗[0m
[1;33m║[0m   [1;31m⚠️  IMPORTANT NOTICE  ⚠️[0m                  [1;33m║[0m
[1;33m╠════════════════════════════════════════════╣[0m
[1;33m║[0m  [1;37mBreaking these rules may result in:[0m       [1;33m║[0m
[1;33m║[0m                                            [1;33m║[0m
[1;33m║[0m  [1;32m➤[0m [0;37mVerbal Warning[0m                         [1;33m║[0m
[1;33m║[0m  [1;32m➤[0m [0;37mTemporary Kick[0m                         [1;33m║[0m
[1;33m║[0m  [1;32m➤[0m [1;31mPermanent Ban[0m                          [1;33m║[0m
[1;33m╚════════════════════════════════════════════╝[0m
\`\`\`

> ✅ ***Staff decisions are FINAL***
> 📝 ***Appeal bans through our Discord server***`,
      color: 0x00D9FF,
      thumbnail: {
        url: SLRP_LOGO_URL,
      },
      image: {
        url: GTA_IMAGES.header,
      },
      footer: {
        text: `✦ SLRP ✦ Posted by ${ownerUsername} ✦ Last Updated`,
        icon_url: ownerAvatarUrl || SLRP_LOGO_URL,
      },
      timestamp: new Date().toISOString(),
    };

    console.log('Sending header embed...');
    await sendMessage({ embeds: [headerEmbed] });
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Send each rule section with enhanced bold/colored design
    for (let i = 0; i < rulesSections.length; i++) {
      const section = rulesSections[i];
      const sectionNumber = i + 1;
      
      // Build colored rules text using ANSI codes in code blocks + bold markdown
      const rulesText = section.rules
        .map((rule, index) => `> ${rule.emoji} **${index + 1}.** ${rule.text}`)
        .join('\n>\n');
      
      const sectionEmbed = {
        author: {
          name: `✦ SLRP RULES • Section ${sectionNumber} ✦`,
          icon_url: SLRP_LOGO_URL,
        },
        title: section.title,
        description: `
\`\`\`ansi
[1;36m▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬[0m
\`\`\`

${rulesText}

\`\`\`ansi
[1;36m▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬[0m
\`\`\``,
        color: section.color,
        thumbnail: {
          url: SLRP_LOGO_URL,
        },
        image: {
          url: section.image,
        },
        footer: {
          text: `✦ Section ${sectionNumber} of ${rulesSections.length} ✦ SLRP ✦ ${ownerUsername}`,
          icon_url: ownerAvatarUrl || SLRP_LOGO_URL,
        },
      };

      console.log(`Sending ${section.title}...`);
      await sendMessage({ embeds: [sectionEmbed] });
      await new Promise(resolve => setTimeout(resolve, 1200));
    }

    // Beautiful closing embed with GTA theme
    const closingEmbed = {
      author: {
        name: "✧ SKYLIFE ROLEPLAY INDIA ✧",
        icon_url: SLRP_LOGO_URL,
      },
      title: "〘 ✨ 〙 **__THANK YOU FOR READING!__**",
      description: `
\`\`\`ansi
[1;32m╔════════════════════════════════════════════╗[0m
[1;32m║[0m      [1;33m🎮  ENJOY YOUR TIME AT SLRP!  🎮[0m       [1;32m║[0m
[1;32m╚════════════════════════════════════════════╝[0m
\`\`\`

> 📋 ***By playing on our server, you agree***
> ***to follow all rules listed above.***
> 
> ❓ ***Questions? Contact our staff team!***

\`\`\`ansi
[1;35m═══════════════ QUICK LINKS ═══════════════[0m

[1;34m🌐[0m [1;37mWebsite[0m    [1;34m💬[0m [1;37mSupport[0m    [1;34m📋[0m [1;37mApply[0m

[1;33m🇮🇳  SLRP - India's Premier GTA V Roleplay Server  🇮🇳[0m
\`\`\``,
      color: 0x00FF88,
      thumbnail: {
        url: SLRP_LOGO_URL,
      },
      footer: {
        text: `✦ SLRP Community ✦ ${ownerUsername} ✦`,
        icon_url: ownerAvatarUrl || SLRP_LOGO_URL,
      },
      timestamp: new Date().toISOString(),
    };

    await sendMessage({ embeds: [closingEmbed] });

    console.log('All rules sent successfully with owner profile!');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Server rules sent to Discord successfully!',
        channelId: rulesChannelId,
        sectionsPosted: rulesSections.length + 2,
        sentAs: webhook ? 'webhook (owner profile)' : 'bot',
        ownerName: ownerUsername,
        ownerAvatar: ownerAvatarUrl,
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
