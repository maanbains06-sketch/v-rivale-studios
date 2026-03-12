import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get auth token from header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const { staff_member_id, status, elapsed_seconds } = await req.json();

    if (!staff_member_id || !status || !elapsed_seconds) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    const today = new Date().toISOString().split("T")[0];

    // Upsert the activity record for today
    const updateField = status === "active" ? "active_seconds" :
                        status === "idle" ? "idle_seconds" : "background_seconds";

    // Try to get existing record
    const { data: existing } = await supabase
      .from("staff_activity_tracking")
      .select("id, active_seconds, idle_seconds, background_seconds")
      .eq("staff_member_id", staff_member_id)
      .eq("tracking_date", today)
      .maybeSingle();

    if (existing) {
      const currentVal = (existing as any)[updateField] || 0;
      await supabase
        .from("staff_activity_tracking")
        .update({
          [updateField]: currentVal + elapsed_seconds,
          last_heartbeat_at: new Date().toISOString(),
          last_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("staff_activity_tracking")
        .insert({
          staff_member_id,
          user_id: user.id,
          tracking_date: today,
          [updateField]: elapsed_seconds,
          last_heartbeat_at: new Date().toISOString(),
          last_status: status,
        });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
};

serve(handler);
