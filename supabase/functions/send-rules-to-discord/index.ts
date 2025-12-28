import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SLRP Logo URL - hosted on your domain
const SLRP_LOGO_URL = "https://preview--slrp-hub.lovable.app/images/slrp-logo-discord.png";

// Default header image - Clean GTA 5 style cityscape without any text/logos
const DEFAULT_HEADER_IMAGE = "https://preview--slrp-hub.lovable.app/images/discord-rules/header-clean.jpg";

interface RuleItem {
  emoji: string;
  text: string;
}

interface RuleSection {
  id: string;
  section_key: string;
  title: string;
  color: number;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  rules: RuleItem[];
}

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

// Delete all messages in a channel
async function deleteAllMessages(channelId: string, botToken: string): Promise<number> {
  let deletedCount = 0;
  try {
    // Fetch messages (up to 100)
    const messagesResponse = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages?limit=100`, {
      headers: { 'Authorization': `Bot ${botToken}` },
    });

    if (!messagesResponse.ok) {
      console.log('Cannot fetch messages for deletion');
      return 0;
    }

    const messages = await messagesResponse.json();
    console.log(`Found ${messages.length} messages to delete`);

    // Delete each message
    for (const message of messages) {
      try {
        const deleteResponse = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${message.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bot ${botToken}` },
        });

        if (deleteResponse.ok || deleteResponse.status === 204) {
          deletedCount++;
        }
        // Rate limit: wait between deletions
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.log(`Failed to delete message ${message.id}`);
      }
    }

    console.log(`Deleted ${deletedCount} messages`);
    return deletedCount;
  } catch (error) {
    console.error('Error deleting messages:', error);
    return deletedCount;
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!discordBotToken || !rulesChannelId || !ownerDiscordId) {
      throw new Error('Missing required environment variables');
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch rules sections from database
    console.log('Fetching rules sections from database...');
    const { data: rulesSections, error: rulesError } = await supabase
      .from('discord_rules_sections')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (rulesError) {
      console.error('Error fetching rules:', rulesError);
      throw new Error('Failed to fetch rules from database');
    }

    if (!rulesSections || rulesSections.length === 0) {
      throw new Error('No active rules sections found in database');
    }

    console.log(`Found ${rulesSections.length} active rules sections`);

    // Delete all previous messages first
    console.log('Deleting previous messages from channel...');
    const deletedCount = await deleteAllMessages(rulesChannelId, discordBotToken);
    console.log(`Deleted ${deletedCount} old messages`);

    // Wait a moment after deletions
    await new Promise(resolve => setTimeout(resolve, 1000));

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
        // If avatar is animated (hash starts with "a_"), use GIF so Discord can animate it
        const ext = String(ownerData.avatar).startsWith('a_') ? 'gif' : 'png';
        ownerAvatarUrl = `https://cdn.discordapp.com/avatars/${ownerDiscordId}/${ownerData.avatar}.${ext}?size=256`;
      }
      console.log(`Owner profile fetched: ${ownerUsername}, Avatar: ${ownerAvatarUrl ? 'Yes' : 'No'}`);
    }

    const webhook = await getOrCreateWebhook(rulesChannelId, discordBotToken, ownerUsername, ownerAvatarUrl);
    const sentAs = webhook ? 'webhook (shows your profile)' : 'bot (missing Manage Webhooks permission)';

    const fetchImageFile = async (imageUrl: string, baseName: string) => {
      const res = await fetch(imageUrl);
      if (!res.ok) {
        throw new Error(`Failed to fetch image (${res.status}): ${imageUrl}`);
      }
      const contentType = res.headers.get('content-type') || 'image/jpeg';
      const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
      const fileName = `${baseName}.${ext}`;
      const bytes = new Uint8Array(await res.arrayBuffer());
      const file = new File([bytes], fileName, { type: contentType });
      return { file, fileName };
    };

    const sendMessage = async (payload: any, imageToAttach?: { url: string; baseName: string }) => {
      const endpoint = webhook
        ? `https://discord.com/api/v10/webhooks/${webhook.id}/${webhook.token}`
        : `https://discord.com/api/v10/channels/${rulesChannelId}/messages`;

      const headers: Record<string, string> = webhook
        ? {}
        : { 'Authorization': `Bot ${discordBotToken}` };

      // If we need an image, upload it as an attachment so Discord always displays it
      if (imageToAttach?.url) {
        const { file, fileName } = await fetchImageFile(imageToAttach.url, imageToAttach.baseName);

        const basePayload = webhook
          ? {
              ...payload,
              username: ownerUsername,
              avatar_url: ownerAvatarUrl || SLRP_LOGO_URL,
            }
          : payload;

        // Ensure embed image points to the uploaded attachment
        const payloadWithAttachment = structuredClone(basePayload);
        if (payloadWithAttachment?.embeds?.[0]?.image) {
          payloadWithAttachment.embeds[0].image.url = `attachment://${fileName}`;
        }

        const form = new FormData();
        form.append('payload_json', JSON.stringify(payloadWithAttachment));
        form.append('files[0]', file, fileName);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: form,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Message with attachment failed: ${response.status} - ${errorText}`);
        }

        return response;
      }

      // JSON message (no attachment)
      const payloadWithProfile = webhook
        ? {
            ...payload,
            username: ownerUsername,
            avatar_url: ownerAvatarUrl || SLRP_LOGO_URL,
          }
        : payload;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadWithProfile),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${webhook ? 'Webhook' : 'Bot'} message failed: ${response.status} - ${errorText}`);
      }

      return response;
    };

    // Enhanced header embed - clean design without ANSI
    const headerEmbed = {
      author: {
        name: "✧ SKYLIFE ROLEPLAY INDIA ✧",
        icon_url: SLRP_LOGO_URL,
      },
      title: "📜  **S E R V E R   R U L E S**  📜",
      description: `
> 🎮 ***Welcome to SLRP - Skylife Roleplay India!***
> 
> ***Please read and follow all rules below to ensure***
> ***a fair and enjoyable experience for everyone.***

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

⚠️ **IMPORTANT NOTICE**

> ➤ ***Verbal Warning***
> ➤ ***Temporary Kick***
> ➤ ***Permanent Ban***

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

> ✅ ***Staff decisions are FINAL***
> 📝 ***Appeal bans through our Discord server or our official website***`,
      color: 0x00D9FF,
      thumbnail: {
        url: SLRP_LOGO_URL,
      },
      image: {
        url: DEFAULT_HEADER_IMAGE,
      },
      footer: {
        text: `✦ SLRP ✦ Posted by ${ownerUsername} ✦ Last Updated`,
        icon_url: ownerAvatarUrl || SLRP_LOGO_URL,
      },
      timestamp: new Date().toISOString(),
    };

    console.log('Sending header embed...');
    await sendMessage(
      { embeds: [headerEmbed] },
      { url: DEFAULT_HEADER_IMAGE, baseName: 'rules-header' }
    );
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Send each rule section from database
    for (let i = 0; i < rulesSections.length; i++) {
      const section = rulesSections[i] as RuleSection;
      const sectionNumber = i + 1;
      
      // Parse rules - handle both string and array formats
      let rules: RuleItem[] = [];
      if (typeof section.rules === 'string') {
        try {
          rules = JSON.parse(section.rules);
        } catch {
          rules = [];
        }
      } else if (Array.isArray(section.rules)) {
        rules = section.rules;
      }
      
      const rulesText = rules
        .map((rule: RuleItem, index: number) => `> ${rule.emoji} **${index + 1}.** ${rule.text}`)
        .join('\n>\n');
      
      const sectionEmbed = {
        author: {
          name: `✦ SLRP RULES • Section ${sectionNumber} ✦`,
          icon_url: SLRP_LOGO_URL,
        },
        title: section.title,
        description: `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

${rulesText}

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`,
        color: section.color,
        thumbnail: {
          url: SLRP_LOGO_URL,
        },
        image: {
          url: section.image_url || DEFAULT_HEADER_IMAGE,
        },
        footer: {
          text: `✦ Section ${sectionNumber} of ${rulesSections.length} ✦ SLRP ✦ ${ownerUsername}`,
          icon_url: ownerAvatarUrl || SLRP_LOGO_URL,
        },
      };

      console.log(`Sending ${section.title}...`);
      await sendMessage(
        { embeds: [sectionEmbed] },
        { url: section.image_url || DEFAULT_HEADER_IMAGE, baseName: `rules-${section.section_key}` }
      );
      await new Promise(resolve => setTimeout(resolve, 1200));
    }

    // Clean closing embed without ANSI
    const closingEmbed = {
      author: {
        name: "✧ SKYLIFE ROLEPLAY INDIA ✧",
        icon_url: SLRP_LOGO_URL,
      },
      title: "〘 ✨ 〙 **__THANK YOU FOR READING!__**",
      description: `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

🎮 ***ENJOY YOUR TIME AT SLRP!*** 🎮

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

> 📋 ***By playing on our server, you agree***
> ***to follow all rules listed above.***
> 
> ❓ ***Questions? Contact our staff team!***

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

🌐 [**Website**](https://skyliferoleplay.com/) • 💬 [**Support**](https://skyliferoleplay.com/support) • 📋 [**Apply**](https://skyliferoleplay.com/whitelist)

🇮🇳 ***SLRP - India's Premier GTA V Roleplay Server*** 🇮🇳`,
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
        sentAs,
        ownerName: ownerUsername,
        ownerAvatar: ownerAvatarUrl,
        logoUsed: SLRP_LOGO_URL,
        warning: webhook
          ? null
          : 'Bot lacks Manage Webhooks permission in this channel. Grant Manage Webhooks to post as your profile.',
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
