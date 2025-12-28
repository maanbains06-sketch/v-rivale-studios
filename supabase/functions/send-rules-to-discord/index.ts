import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Server rules data
const rulesSections = [
  {
    title: "📋 General Rules",
    color: 0x00CED1, // Cyan
    rules: [
      "Respect all players and staff members at all times",
      "No cheating, hacking, or exploiting bugs",
      "Use proper roleplay names and characters",
      "Stay in character at all times during gameplay",
      "Follow server admin instructions immediately",
    ],
  },
  {
    title: "🎭 Roleplay Rules",
    color: 0x9B59B6, // Purple
    rules: [
      "Value your character's life (No RDM/VDM)",
      "Follow realistic roleplay standards",
      "No power gaming or meta gaming",
      "Use in-game communication systems properly",
      "Communicate using voice chat only in roleplay",
    ],
  },
  {
    title: "⚔️ Combat Rules",
    color: 0xE91E63, // Pink
    rules: [
      "Initiate proper RP before combat",
      "No combat logging during situations",
      "Respect NLR (New Life Rule) after respawn",
      "Wait for admin approval in major conflicts",
      "Use appropriate weapons for your character role",
    ],
  },
  {
    title: "💰 Economy Rules",
    color: 0x2ECC71, // Green
    rules: [
      "No money glitching or exploits",
      "Follow realistic business practices",
      "Report suspicious transactions",
      "Maintain proper documentation for large deals",
      "Respect property ownership and boundaries",
    ],
  },
  {
    title: "🚗 Vehicle Rules",
    color: 0xF39C12, // Orange
    rules: [
      "Drive realistically according to traffic laws",
      "No vehicle ramming without RP reason",
      "Use appropriate vehicles for your role",
      "Repair vehicles at designated locations",
      "Report stolen vehicles to authorities",
    ],
  },
  {
    title: "👥 Community Rules",
    color: 0x3498DB, // Blue
    rules: [
      "Be helpful to new players",
      "Report rule violations to staff",
      "Participate in community events",
      "Provide constructive feedback",
      "Maintain a positive gaming environment",
    ],
  },
];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const discordBotToken = Deno.env.get('DISCORD_BOT_TOKEN');
    const rulesChannelId = Deno.env.get('DISCORD_RULES_CHANNEL_ID');
    const ownerDiscordId = Deno.env.get('OWNER_DISCORD_ID');

    if (!discordBotToken) {
      throw new Error('Missing DISCORD_BOT_TOKEN');
    }
    if (!rulesChannelId) {
      throw new Error('Missing DISCORD_RULES_CHANNEL_ID');
    }
    if (!ownerDiscordId) {
      throw new Error('Missing OWNER_DISCORD_ID');
    }

    console.log('Fetching owner Discord profile...');
    
    // Fetch owner's Discord profile
    const ownerResponse = await fetch(`https://discord.com/api/v10/users/${ownerDiscordId}`, {
      headers: {
        'Authorization': `Bot ${discordBotToken}`,
      },
    });

    let ownerAvatar = null;
    let ownerUsername = 'SLRP Owner';

    if (ownerResponse.ok) {
      const ownerData = await ownerResponse.json();
      ownerUsername = ownerData.global_name || ownerData.username || 'SLRP Owner';
      if (ownerData.avatar) {
        ownerAvatar = `https://cdn.discordapp.com/avatars/${ownerDiscordId}/${ownerData.avatar}.png?size=256`;
      }
    }

    console.log(`Owner profile: ${ownerUsername}`);

    // Create the main header embed
    const headerEmbed = {
      title: "📜 SLRP Server Rules",
      description: "Welcome to **SLRP**! Please read and follow all rules to ensure a fair and enjoyable experience for everyone.\n\n⚠️ **Breaking these rules may result in warnings, kicks, or permanent bans.**\n\n*Staff decisions are final. Appeal bans through our Discord server.*",
      color: 0x00D9FF, // Neon cyan
      thumbnail: {
        url: ownerAvatar || "https://cdn.discordapp.com/embed/avatars/0.png",
      },
      author: {
        name: ownerUsername,
        icon_url: ownerAvatar || "https://cdn.discordapp.com/embed/avatars/0.png",
      },
      footer: {
        text: "SLRP • Last Updated",
        icon_url: ownerAvatar || "https://cdn.discordapp.com/embed/avatars/0.png",
      },
      timestamp: new Date().toISOString(),
    };

    // Send header embed first
    const headerPayload = {
      embeds: [headerEmbed],
    };

    console.log('Sending header embed...');
    
    const headerResponse = await fetch(`https://discord.com/api/v10/channels/${rulesChannelId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${discordBotToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(headerPayload),
    });

    if (!headerResponse.ok) {
      const errorText = await headerResponse.text();
      console.error('Discord API error (header):', errorText);
      throw new Error(`Failed to send header embed: ${headerResponse.status}`);
    }

    // Send each rule section as a separate embed
    for (const section of rulesSections) {
      const rulesText = section.rules.map((rule, index) => `**${index + 1}.** ${rule}`).join('\n');
      
      const sectionEmbed = {
        title: section.title,
        description: rulesText,
        color: section.color,
        footer: {
          text: `Posted by ${ownerUsername}`,
          icon_url: ownerAvatar || "https://cdn.discordapp.com/embed/avatars/0.png",
        },
      };

      const sectionPayload = {
        embeds: [sectionEmbed],
      };

      console.log(`Sending ${section.title}...`);

      const sectionResponse = await fetch(`https://discord.com/api/v10/channels/${rulesChannelId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${discordBotToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sectionPayload),
      });

      if (!sectionResponse.ok) {
        const errorText = await sectionResponse.text();
        console.error(`Discord API error (${section.title}):`, errorText);
        throw new Error(`Failed to send ${section.title}: ${sectionResponse.status}`);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('All rules sent successfully!');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Server rules sent to Discord successfully!',
        channelId: rulesChannelId,
        sectionsPosted: rulesSections.length + 1, // +1 for header
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error sending rules to Discord:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
