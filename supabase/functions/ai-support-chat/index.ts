import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.83.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation constants
const MAX_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 2000;
const VALID_ROLES = ["user", "assistant", "system"];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Rate limiting configuration
const RATE_LIMIT = 10; // requests per minute
const RATE_WINDOW_MS = 60 * 1000; // 1 minute

interface Message {
  role: string;
  content: string;
}

interface RequestBody {
  messages: Message[];
  chatId?: string;
}

// Validate and sanitize message
function validateMessage(msg: unknown): msg is Message {
  if (typeof msg !== 'object' || msg === null) return false;
  const m = msg as Record<string, unknown>;
  return (
    typeof m.role === 'string' &&
    VALID_ROLES.includes(m.role) &&
    typeof m.content === 'string' &&
    m.content.length > 0 &&
    m.content.length <= MAX_MESSAGE_LENGTH
  );
}

// Validate request body
function validateRequestBody(body: unknown): { valid: boolean; error?: string; data?: RequestBody } {
  if (typeof body !== 'object' || body === null) {
    return { valid: false, error: 'Invalid request body' };
  }
  
  const b = body as Record<string, unknown>;
  
  // Validate messages array
  if (!Array.isArray(b.messages)) {
    return { valid: false, error: 'Messages must be an array' };
  }
  
  if (b.messages.length === 0) {
    return { valid: false, error: 'Messages array cannot be empty' };
  }
  
  if (b.messages.length > MAX_MESSAGES) {
    return { valid: false, error: `Maximum ${MAX_MESSAGES} messages allowed` };
  }
  
  // Validate each message
  for (let i = 0; i < b.messages.length; i++) {
    if (!validateMessage(b.messages[i])) {
      return { valid: false, error: `Invalid message at index ${i}` };
    }
  }
  
  // Validate chatId if provided
  if (b.chatId !== undefined) {
    if (typeof b.chatId !== 'string' || !UUID_REGEX.test(b.chatId)) {
      return { valid: false, error: 'Invalid chat ID format' };
    }
  }
  
  return { 
    valid: true, 
    data: { 
      messages: b.messages as Message[], 
      chatId: b.chatId as string | undefined 
    } 
  };
}

// Simple in-memory rate limiting (resets on function cold start)
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

serve(async (req) => {
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
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate request body
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const validation = validateRequestBody(rawBody);
    if (!validation.valid || !validation.data) {
      console.warn("Validation failed:", validation.error);
      return new Response(
        JSON.stringify({ error: validation.error || "Invalid request" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { messages, chatId } = validation.data;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check for escalation keywords
    const lastMessage = messages[messages.length - 1]?.content || '';
    const escalationKeywords = [
      'speak to manager', 'talk to manager', 'human support', 'real person',
      'urgent', 'emergency', 'immediate help', 'escalate', 'supervisor',
      'not helpful', 'useless', 'terrible support'
    ];
    
    const shouldEscalate = escalationKeywords.some(keyword => 
      lastMessage.toLowerCase().includes(keyword)
    );

    if (shouldEscalate && chatId) {
      const authHeader = req.headers.get("authorization");
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const userSupabase = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false },
          global: { headers: { Authorization: `Bearer ${token}` } },
        });

        await userSupabase
          .from("support_chats")
          .update({ 
            status: 'in_progress',
            priority: 'high',
            tags: ['auto_escalated', 'human_requested']
          })
          .eq("id", chatId);

        // Send escalation message
        await userSupabase.from("support_messages").insert({
          chat_id: chatId,
          user_id: "00000000-0000-0000-0000-000000000000",
          message: "I've detected you need immediate human assistance. Your request has been escalated to our support team with high priority. A staff member will assist you shortly.",
          is_staff: true,
        });

        return new Response(JSON.stringify({ 
          message: "I've detected you need immediate human assistance. Your request has been escalated to our support team with high priority. A staff member will assist you shortly.",
          escalated: true 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Detect language from user message
    let detectedLanguage = 'en';
    if (lastMessage) {
      const languageDetectionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { 
              role: "system", 
              content: "Detect the language of the user message and respond with ONLY the ISO 639-1 language code (e.g., 'en' for English, 'es' for Spanish, 'fr' for French, 'de' for German, 'it' for Italian, 'pt' for Portuguese, 'ru' for Russian, 'zh' for Chinese, 'ja' for Japanese, 'ko' for Korean, 'ar' for Arabic, etc.). Nothing else." 
            },
            { role: "user", content: lastMessage },
          ],
          stream: false,
        }),
      });

      if (languageDetectionResponse.ok) {
        const langResult = await languageDetectionResponse.json();
        const langText = langResult.choices[0].message.content.trim().toLowerCase();
        detectedLanguage = langText.slice(0, 2); // Take first 2 chars for safety
      }

      // Store detected language in chat
      if (chatId) {
        const authHeader = req.headers.get("authorization");
        if (authHeader) {
          const token = authHeader.replace("Bearer ", "");
          const userSupabase = createClient(supabaseUrl, supabaseKey, {
            auth: { persistSession: false },
            global: { headers: { Authorization: `Bearer ${token}` } },
          });

          await userSupabase
            .from("support_chats")
            .update({ detected_language: detectedLanguage })
            .eq("id", chatId);
        }
      }
    }

    // First, analyze sentiment
    const sentimentPrompt = `Analyze the sentiment and frustration level of this user message. Respond with a JSON object containing:
- sentiment: one of "positive", "neutral", "negative", "frustrated"
- score: a number from -1 (very negative/frustrated) to 1 (very positive)
- reasoning: brief explanation

User message: "${messages[messages.length - 1]?.content || ''}"`;

    const sentimentResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a sentiment analysis expert. Always respond with valid JSON only." },
          { role: "user", content: sentimentPrompt },
        ],
        stream: false,
      }),
    });

    let sentimentData = { sentiment: "neutral", score: 0 };
    if (sentimentResponse.ok) {
      const sentimentResult = await sentimentResponse.json();
      const sentimentText = sentimentResult.choices[0].message.content;
      try {
        const parsed = JSON.parse(sentimentText.replace(/```json\n?|\n?```/g, ''));
        sentimentData = { sentiment: parsed.sentiment, score: parsed.score };
      } catch (e) {
        console.error("Failed to parse sentiment:", e);
      }
    }

    // Update chat sentiment
    if (chatId) {
      const authHeader = req.headers.get("authorization");
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const userSupabase = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false },
          global: { headers: { Authorization: `Bearer ${token}` } },
        });

        await userSupabase
          .from("support_chats")
          .update({ 
            sentiment: sentimentData.sentiment,
            sentiment_score: sentimentData.score 
          })
          .eq("id", chatId);
      }
    }

    // Fetch previous chat history for context
    let conversationContext = "";
    let storedLanguage = detectedLanguage;
    if (chatId) {
      const authHeader = req.headers.get("authorization");
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const userSupabase = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false },
          global: { headers: { Authorization: `Bearer ${token}` } },
        });

        const { data: chatData } = await userSupabase
          .from("support_chats")
          .select("subject, priority, tags, detected_language")
          .eq("id", chatId)
          .single();

        if (chatData) {
          storedLanguage = chatData.detected_language || detectedLanguage;
          conversationContext = `\n\nChat Context:\n- Subject: ${chatData.subject}\n- Priority: ${chatData.priority}\n- Tags: ${chatData.tags?.join(', ') || 'none'}\n- User Language: ${storedLanguage}`;
        }
      }
    }

    const languageInstructions = storedLanguage !== 'en' 
      ? `\n\nIMPORTANT: The user is communicating in ${storedLanguage} language. You MUST respond in ${storedLanguage}. All your responses should be in the user's language (${storedLanguage}).`
      : '';

    const systemPrompt = `You are a helpful support assistant for Skylife RP (Roleplay Server). Your role is to:

1. Answer common questions about the server, applications, and support processes
2. Guide users to the right resources
3. Remember the conversation history and provide contextual responses based on previous messages
4. If a question is complex, requires admin action, or you cannot fully resolve it, politely suggest: "If you need further assistance, you can request human support using the 'Request Human' button."
5. Be especially empathetic and helpful if you detect user frustration

Common Topics:
- Whitelist applications: Explain the process, requirements, and timeline
- Ban appeals: Guide on how to submit and what to include
- Server rules: Direct users to the rules page
- Job applications: Explain in-game job application process
- Gallery submissions: Help with uploading screenshots/videos
- Store purchases: General info about tiers and perks

If something requires admin action or you're uncertain, remind them they can request human support.

${conversationContext}

${languageInstructions}

${sentimentData.sentiment === 'frustrated' ? 'IMPORTANT: The user seems frustrated. Be extra empathetic, acknowledge their concerns, and suggest requesting human support for faster resolution.' : ''}

Be friendly, concise, professional, and use the conversation history to provide personalized support.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Service is busy. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("AI gateway error:", response.status);
      return new Response(
        JSON.stringify({ error: "Unable to process your request" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message.content;

    // Save AI response to support_messages if chatId provided
    if (chatId) {
      const authHeader = req.headers.get("authorization");
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const userSupabase = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false },
          global: { headers: { Authorization: `Bearer ${token}` } },
        });

        await userSupabase.from("support_messages").insert({
          chat_id: chatId,
          user_id: "00000000-0000-0000-0000-000000000000", // System user ID for AI
          message: aiMessage,
          is_staff: true,
        });

        await userSupabase
          .from("support_chats")
          .update({ last_message_at: new Date().toISOString() })
          .eq("id", chatId);
      }
    }

    return new Response(JSON.stringify({ message: aiMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in ai-support-chat:", error);
    return new Response(
      JSON.stringify({ error: "Unable to process your request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
