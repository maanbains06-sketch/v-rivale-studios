import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Delete ALL mini game scores — full reset of every leaderboard
    const { error, count } = await supabase
      .from("mini_game_scores")
      .delete({ count: "exact" })
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) throw error;

    console.log(`Weekly full leaderboard reset: deleted ${count} scores across all games`);

    return new Response(JSON.stringify({ success: true, deleted: count }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Weekly reset error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
