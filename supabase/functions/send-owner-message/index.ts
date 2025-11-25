import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactRequest {
  name: string;
  discordId: string;
  message: string;
}

const OWNER_DISCORD_ID = "YOUR_OWNER_DISCORD_ID"; // Replace with actual owner Discord ID

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, discordId, message }: ContactRequest = await req.json();

    console.log("Received contact message:", { name, discordId });

    if (!name || !discordId || !message) {
      throw new Error("Missing required fields: name, discordId, or message");
    }

    // Validate input lengths
    if (name.length > 100 || discordId.length > 100 || message.length > 2000) {
      throw new Error("Input exceeds maximum allowed length");
    }

    // Get the Discord bot token
    const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN");
    if (!DISCORD_BOT_TOKEN) {
      throw new Error("Discord bot token not configured");
    }

    // Create DM channel with owner
    console.log("Creating DM channel with owner...");
    const dmChannelResponse = await fetch(
      `https://discord.com/api/v10/users/@me/channels`,
      {
        method: "POST",
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient_id: OWNER_DISCORD_ID,
        }),
      }
    );

    if (!dmChannelResponse.ok) {
      const errorText = await dmChannelResponse.text();
      console.error("Failed to create DM channel:", errorText);
      throw new Error(`Failed to create DM channel: ${dmChannelResponse.status}`);
    }

    const dmChannel = await dmChannelResponse.json();
    console.log("DM channel created:", dmChannel.id);

    // Format the message embed
    const embedMessage = {
      embeds: [
        {
          title: "📬 New Message from Website",
          color: 0x00ff88, // Green color
          fields: [
            {
              name: "👤 From",
              value: name,
              inline: false,
            },
            {
              name: "💬 Discord ID",
              value: discordId,
              inline: false,
            },
            {
              name: "📝 Message",
              value: message,
              inline: false,
            },
          ],
          footer: {
            text: "Server Owner Contact Form",
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    // Send the message to the DM channel
    console.log("Sending message to owner...");
    const sendMessageResponse = await fetch(
      `https://discord.com/api/v10/channels/${dmChannel.id}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(embedMessage),
      }
    );

    if (!sendMessageResponse.ok) {
      const errorText = await sendMessageResponse.text();
      console.error("Failed to send message:", errorText);
      throw new Error(`Failed to send message: ${sendMessageResponse.status}`);
    }

    console.log("Message sent successfully to owner");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Message delivered to server owner" 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-owner-message function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Failed to deliver message to server owner"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
