import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  death: "Death Report",
  arrest: "Arrest Report",
  shootout: "Shootout Report",
  court_case: "Court Case",
  impound: "Vehicle Impound",
  event: "City Event",
  chase: "Police Chase",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const {
      event_type,
      character_name,
      location,
      details,
      screenshot_base64,
      screenshot_url,
      video_base64,
      video_url,
      involved_parties,
      timestamp,
      weapon,
      vehicle,
      charges,
      officer_name,
      judge_name,
      verdict,
      chase_duration,
      chase_end_reason,
    } = body;

    if (!event_type || !character_name) {
      return new Response(
        JSON.stringify({ error: "event_type and character_name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle image upload
    let imageUrl: string | null = null;
    if (screenshot_base64) {
      const imageData = decode(screenshot_base64);
      const fileName = `${event_type}/${Date.now()}-${crypto.randomUUID()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("news-images")
        .upload(fileName, imageData, { contentType: "image/jpeg", upsert: false });
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("news-images").getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      } else {
        console.error("Image upload error:", uploadError);
      }
    } else if (screenshot_url) {
      imageUrl = screenshot_url;
    }

    // Handle video upload
    let videoUrl: string | null = null;
    if (video_base64) {
      const videoData = decode(video_base64);
      const videoFileName = `${event_type}/${Date.now()}-${crypto.randomUUID()}.mp4`;
      const { error: videoUploadError } = await supabase.storage
        .from("news-videos")
        .upload(videoFileName, videoData, { contentType: "video/mp4", upsert: false });
      if (!videoUploadError) {
        const { data: videoUrlData } = supabase.storage.from("news-videos").getPublicUrl(videoFileName);
        videoUrl = videoUrlData.publicUrl;
      } else {
        console.error("Video upload error:", videoUploadError);
      }
    } else if (video_url) {
      videoUrl = video_url;
    }

    // Determine media type
    let mediaType = "none";
    if (imageUrl && videoUrl) mediaType = "both";
    else if (videoUrl) mediaType = "video";
    else if (imageUrl) mediaType = "image";

    // Build context for AI article generation
    const eventContext = buildEventContext({
      event_type, character_name, location, details,
      involved_parties, timestamp, weapon, vehicle,
      charges, officer_name, judge_name, verdict,
      chase_duration, chase_end_reason,
    });

    // Generate AI news article
    let headline = `${EVENT_TYPE_LABELS[event_type] || "Breaking News"}: Incident involving ${character_name}`;
    let articleBody = details || "Details are still emerging about this incident.";

    if (lovableApiKey) {
      try {
        const aiResult = await generateNewsArticle(lovableApiKey, event_type, eventContext, !!videoUrl);
        if (aiResult) {
          headline = aiResult.headline;
          articleBody = aiResult.article;
        }
      } catch (e) {
        console.error("AI generation failed, using fallback:", e);
      }
    }

    // Store article
    const { data: article, error: insertError } = await supabase
      .from("rp_news_articles")
      .insert({
        event_type,
        headline,
        article_body: articleBody,
        character_name,
        location: location || "Los Santos",
        image_url: imageUrl,
        video_url: videoUrl,
        media_type: mediaType,
        event_data: {
          involved_parties, timestamp, weapon, vehicle,
          charges, officer_name, judge_name, verdict, details,
          chase_duration, chase_end_reason,
        },
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ success: true, article_id: article.id, headline }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("News webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildEventContext(data: Record<string, any>): string {
  const parts: string[] = [];
  parts.push(`Event Type: ${EVENT_TYPE_LABELS[data.event_type] || data.event_type}`);
  parts.push(`Primary Individual: ${data.character_name}`);
  if (data.location) parts.push(`Location: ${data.location}`);
  if (data.timestamp) parts.push(`Time: ${data.timestamp}`);
  if (data.details) parts.push(`Details: ${data.details}`);
  if (data.involved_parties) parts.push(`Other Parties: ${data.involved_parties}`);
  if (data.weapon) parts.push(`Weapon: ${data.weapon}`);
  if (data.vehicle) parts.push(`Vehicle: ${data.vehicle}`);
  if (data.charges) parts.push(`Charges: ${data.charges}`);
  if (data.officer_name) parts.push(`Responding Officer: ${data.officer_name}`);
  if (data.judge_name) parts.push(`Presiding Judge: ${data.judge_name}`);
  if (data.verdict) parts.push(`Verdict: ${data.verdict}`);
  if (data.chase_duration) parts.push(`Chase Duration: ${data.chase_duration}`);
  if (data.chase_end_reason) parts.push(`Chase Ended: ${data.chase_end_reason}`);
  return parts.join("\n");
}

async function generateNewsArticle(
  apiKey: string,
  eventType: string,
  context: string,
  hasVideo: boolean
): Promise<{ headline: string; article: string } | null> {
  const videoNote = hasVideo
    ? "\nNote: This article has accompanying video footage. Mention that footage/video is available when relevant (e.g., 'Security camera footage obtained by The City Chronicle shows...' or 'Dashcam footage from the pursuing unit reveals...')."
    : "";

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `You are a professional news journalist for "The City Chronicle", a newspaper in the city of Los Santos. You write realistic, immersive news articles based on roleplay events.

Rules:
- Write in third person, professional journalist style
- Never break RP or mention it's a game/server
- Treat all events as real occurrences in Los Santos
- Keep articles 2-4 paragraphs long
- Include dramatic but realistic language
- Reference locations as real places in Los Santos
- Use proper journalism structure: lead, body, quotes (fabricated witness quotes are fine)
- Never use real-world references outside the RP universe
- Always refer to characters by their RP names
- For police chases, describe the chase dramatically with route details and how it ended${videoNote}`,
        },
        {
          role: "user",
          content: `Write a news article for the following event:\n\n${context}`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "write_news_article",
            description: "Write a news article with headline and body",
            parameters: {
              type: "object",
              properties: {
                headline: { type: "string", description: "News headline, max 100 chars" },
                article: { type: "string", description: "Full news article body, 2-4 paragraphs" },
              },
              required: ["headline", "article"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "write_news_article" } },
    }),
  });

  if (!response.ok) {
    console.error("AI API error:", response.status, await response.text());
    return null;
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

  if (toolCall?.function?.arguments) {
    try {
      return JSON.parse(toolCall.function.arguments);
    } catch {
      console.error("Failed to parse AI tool call arguments");
    }
  }

  const content = data.choices?.[0]?.message?.content;
  if (content) {
    try {
      return JSON.parse(content);
    } catch {
      return { headline: `Breaking: Incident in Los Santos`, article: content };
    }
  }

  return null;
}
