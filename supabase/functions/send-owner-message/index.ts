import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const RATE_LIMIT = 3; // requests per minute
const RATE_WINDOW_MS = 60 * 1000; // 1 minute

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);
  
  if (!entry || (now - entry.windowStart) > RATE_WINDOW_MS) {
    rateLimitMap.set(identifier, { count: 1, windowStart: now });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT) {
    return false;
  }
  
  entry.count++;
  return true;
}

// Validate Discord ID format (17-19 digit snowflake)
function isValidDiscordId(id: string): boolean {
  return /^\d{17,19}$/.test(id);
}

// Sanitize text for Discord embeds
function sanitizeForDiscord(text: string): string {
  return text
    .replace(/[<>@&]/g, '') // Remove Discord formatting chars
    .replace(/```/g, '`​`​`') // Break code block attempts with zero-width spaces
    .trim();
}

// Validate name (alphanumeric, spaces, basic punctuation)
function isValidName(name: string): boolean {
  return /^[\p{L}\p{N}\s\-_.,']+$/u.test(name) && name.length >= 1 && name.length <= 100;
}

interface ContactRequest {
  name: string;
  discordId: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client identifier for rate limiting
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    
    // Check rate limit
    if (!checkRateLimit(clientIP)) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ 
          error: "Too many requests",
          details: "Please wait a minute before sending another message"
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Parse request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ 
          error: "Invalid request",
          details: "Please check your input and try again"
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate request structure
    if (typeof body !== 'object' || body === null) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid request",
          details: "Please check your input and try again"
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { name, discordId, message } = body as ContactRequest;

    // Validate required fields
    if (!name || !discordId || !message) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required fields",
          details: "Please fill in all required fields"
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate types
    if (typeof name !== 'string' || typeof discordId !== 'string' || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ 
          error: "Invalid input format",
          details: "Please check your input and try again"
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate input lengths
    if (name.length > 100 || discordId.length > 20 || message.length > 2000) {
      return new Response(
        JSON.stringify({ 
          error: "Input too long",
          details: "Please shorten your message and try again"
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate name format
    if (!isValidName(name)) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid name format",
          details: "Please enter a valid name"
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate Discord ID format
    if (!isValidDiscordId(discordId)) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid Discord ID",
          details: "Please enter a valid Discord ID (17-19 digit number)"
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate message is not empty after trimming
    if (message.trim().length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "Empty message",
          details: "Please enter a message"
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Sanitize inputs for Discord
    const sanitizedName = sanitizeForDiscord(name).slice(0, 100);
    const sanitizedMessage = sanitizeForDiscord(message).slice(0, 2000);

    console.log("Processing contact message from Discord ID:", discordId);

    // Get the Discord bot token
    const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN");
    if (!DISCORD_BOT_TOKEN) {
      console.error("Discord bot token not configured");
      return new Response(
        JSON.stringify({ 
          error: "Service temporarily unavailable",
          details: "Contact feature is not configured"
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get owner Discord ID from environment secret
    const OWNER_DISCORD_ID = Deno.env.get("OWNER_DISCORD_ID");
    if (!OWNER_DISCORD_ID) {
      console.error("Owner Discord ID not configured");
      return new Response(
        JSON.stringify({ 
          error: "Service temporarily unavailable",
          details: "Contact feature is not configured"
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
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
      console.error("Failed to create DM channel:", dmChannelResponse.status);
      return new Response(
        JSON.stringify({ 
          error: "Unable to deliver message",
          details: "Please try again later or contact us through Discord"
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const dmChannel = await dmChannelResponse.json();
    console.log("DM channel created successfully");

    // Format the message embed with sanitized content
    const embedMessage = {
      embeds: [
        {
          title: "📬 New Message from Website",
          color: 0x00ff88, // Green color
          fields: [
            {
              name: "👤 From",
              value: sanitizedName || "Anonymous",
              inline: false,
            },
            {
              name: "💬 Discord ID",
              value: discordId,
              inline: false,
            },
            {
              name: "📝 Message",
              value: sanitizedMessage || "(empty)",
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
      console.error("Failed to send message:", sendMessageResponse.status);
      return new Response(
        JSON.stringify({ 
          error: "Unable to deliver message",
          details: "Please try again later or contact us through Discord"
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
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
  } catch (error) {
    console.error("Error in send-owner-message function:", error);
    return new Response(
      JSON.stringify({ 
        error: "Unable to process your request",
        details: "Please try again later"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
