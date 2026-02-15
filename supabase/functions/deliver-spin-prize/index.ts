import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Prizes that can be automatically delivered to FiveM
const AUTO_DELIVERABLE: Record<string, { type: string; amount?: number; description: string }> = {
  cash_5k:       { type: "cash",          amount: 5000,  description: "$5,000 Cash" },
  cash_10k:      { type: "cash",          amount: 10000, description: "$10,000 Cash" },
  cash_20k:      { type: "cash",          amount: 20000, description: "$20,000 Cash" },
  free_queue:    { type: "free_queue",                    description: "Free Queue Entry" },
  mission_skip:  { type: "mission_skip",                  description: "Daily Mission Skip" },
  clothing_1:    { type: "clothing",                      description: "Clothing Reward" },
  clothing_2:    { type: "clothing",                      description: "Clothing Reward" },
  protein_shake: { type: "protein_shake",                 description: "Protein Shake (2x Gym XP 24h)" },
};

// Manual prizes (vehicle, mystery_box, discount, name_change) are NOT auto-delivered

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prize_key, discord_id, discord_username } = await req.json();

    if (!prize_key || !discord_id) {
      return new Response(JSON.stringify({ error: "Missing prize_key or discord_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prizeConfig = AUTO_DELIVERABLE[prize_key];
    if (!prizeConfig) {
      // Not auto-deliverable (vehicle, mystery_box, etc.) - manual claim needed
      return new Response(JSON.stringify({ 
        success: false, 
        manual: true, 
        message: "This prize requires manual staff delivery" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const FIVEM_SERVER_IP = Deno.env.get("FIVEM_SERVER_IP");
    const FIVEM_SERVER_PORT = Deno.env.get("FIVEM_SERVER_PORT");
    const FIVEM_CALLBACK_KEY = Deno.env.get("FIVEM_CALLBACK_KEY");

    if (!FIVEM_SERVER_IP || !FIVEM_SERVER_PORT || !FIVEM_CALLBACK_KEY) {
      throw new Error("Missing FiveM server configuration");
    }

    const callbackUrl = `http://${FIVEM_SERVER_IP}:${FIVEM_SERVER_PORT}/slrp-spin-reward`;

    console.log(`Delivering prize "${prize_key}" to Discord ID: ${discord_id}`);

    const response = await fetch(callbackUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${FIVEM_CALLBACK_KEY}`,
      },
      body: JSON.stringify({
        discord_id,
        discord_username: discord_username || "Unknown",
        prize_type: prizeConfig.type,
        prize_key,
        amount: prizeConfig.amount || 0,
        description: prizeConfig.description,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("FiveM server error:", errorText);
      
      // Store pending reward for later delivery if server is offline
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      
      await fetch(`${SUPABASE_URL}/rest/v1/pending_rewards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({
          discord_id,
          prize_key,
          prize_type: prizeConfig.type,
          amount: prizeConfig.amount || 0,
          status: "pending",
        }),
      });

      return new Response(JSON.stringify({ 
        success: false, 
        queued: true,
        message: "Server offline - reward queued for delivery when player joins" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    console.log("FiveM delivery result:", result);

    return new Response(JSON.stringify({ 
      success: true, 
      delivered: true,
      message: "Prize delivered to FiveM server" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error delivering spin prize:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
