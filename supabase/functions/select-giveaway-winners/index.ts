import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { giveaway_id, auto_check } = await req.json();

    // If auto_check is true, check for giveaways that have ended and need winners selected
    if (auto_check) {
      const now = new Date().toISOString();
      
      // Find active giveaways that have passed their end date
      const { data: endedGiveaways, error: fetchError } = await supabase
        .from('giveaways')
        .select('id, title, winner_count')
        .eq('status', 'active')
        .lt('end_date', now);

      if (fetchError) {
        throw new Error(`Failed to fetch ended giveaways: ${fetchError.message}`);
      }

      const results = [];

      for (const giveaway of endedGiveaways || []) {
        try {
          // Check if winners already exist
          const { count: winnersCount } = await supabase
            .from('giveaway_winners')
            .select('*', { count: 'exact', head: true })
            .eq('giveaway_id', giveaway.id);

          if (winnersCount && winnersCount > 0) {
            results.push({ giveaway_id: giveaway.id, status: 'skipped', reason: 'Winners already selected' });
            continue;
          }

          // Select winners using the database function
          const { data: winners, error: selectError } = await supabase
            .rpc('select_giveaway_winners', { p_giveaway_id: giveaway.id });

          if (selectError) {
            results.push({ giveaway_id: giveaway.id, status: 'error', error: selectError.message });
          } else {
            results.push({ 
              giveaway_id: giveaway.id, 
              title: giveaway.title,
              status: 'success', 
              winners_selected: winners?.length || 0 
            });
          }
        } catch (err) {
          results.push({ giveaway_id: giveaway.id, status: 'error', error: String(err) });
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Processed ${endedGiveaways?.length || 0} ended giveaways`,
          results 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Manual winner selection for a specific giveaway
    if (!giveaway_id) {
      return new Response(
        JSON.stringify({ success: false, error: "giveaway_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if winners already exist
    const { count: existingWinners } = await supabase
      .from('giveaway_winners')
      .select('*', { count: 'exact', head: true })
      .eq('giveaway_id', giveaway_id);

    if (existingWinners && existingWinners > 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Winners already selected for this giveaway" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Select winners using the database function
    const { data: winners, error: selectError } = await supabase
      .rpc('select_giveaway_winners', { p_giveaway_id: giveaway_id });

    if (selectError) {
      throw new Error(`Failed to select winners: ${selectError.message}`);
    }

    // Get winner details
    const { data: winnerDetails, error: detailsError } = await supabase
      .from('giveaway_winners')
      .select('*')
      .eq('giveaway_id', giveaway_id);

    if (detailsError) {
      console.error('Error fetching winner details:', detailsError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Selected ${winners?.length || 0} winner(s)`,
        winners: winnerDetails || winners
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in select-giveaway-winners:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
