import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.83.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, chatId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Initialize Supabase client for fetching knowledge base articles
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch relevant knowledge articles for context
    const { data: articles } = await supabase
      .from("knowledge_articles")
      .select("title, content, summary")
      .eq("is_published", true)
      .limit(5);

    const knowledgeContext = articles
      ?.map((a) => `Article: ${a.title}\n${a.summary || a.content.slice(0, 300)}`)
      .join("\n\n") || "";

    const systemPrompt = `You are a helpful support assistant for SLRP (Roleplay Server). Your role is to:

1. Answer common questions about the server, applications, and support processes
2. Guide users to the right resources
3. If a question is complex or requires human judgment, politely suggest they wait for a staff member

Knowledge Base Context:
${knowledgeContext}

Common Topics:
- Whitelist applications: Explain the process, requirements, and timeline
- Ban appeals: Guide on how to submit and what to include
- Server rules: Direct users to the rules page
- Job applications: Explain in-game job application process
- Gallery submissions: Help with uploading screenshots/videos
- Store purchases: General info about tiers and perks

If you don't know something or it requires admin action, say: "This requires assistance from our support team. A staff member will help you shortly."

Be friendly, concise, and professional.`;

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
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
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
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
