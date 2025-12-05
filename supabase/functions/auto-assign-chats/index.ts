import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Verify the cron secret for scheduled function calls
function verifyCronSecret(req: Request): boolean {
  const authHeader = req.headers.get("authorization");
  const cronSecret = Deno.env.get("CRON_SECRET");
  
  if (!cronSecret) {
    console.error("CRON_SECRET not configured");
    return false;
  }
  
  // Accept Bearer token or direct secret in header
  if (authHeader === `Bearer ${cronSecret}` || authHeader === cronSecret) {
    return true;
  }
  
  return false;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify cron secret for security
  if (!verifyCronSecret(req)) {
    console.error("Unauthorized: Invalid or missing cron secret");
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('Starting automatic chat assignment...');

    // Auto-assign unassigned chats
    const { data: assignedChats, error: assignError } = await supabaseClient
      .rpc('auto_assign_unassigned_chats');

    if (assignError) {
      console.error('Error auto-assigning chats:', assignError);
      throw assignError;
    }

    console.log(`Auto-assigned ${assignedChats?.length || 0} chats`);

    // Rebalance workload
    const { data: rebalanceResult, error: rebalanceError } = await supabaseClient
      .rpc('rebalance_staff_workload');

    if (rebalanceError) {
      console.error('Error rebalancing workload:', rebalanceError);
      throw rebalanceError;
    }

    console.log('Rebalancing result:', rebalanceResult);

    return new Response(
      JSON.stringify({
        success: true,
        assigned: assignedChats?.length || 0,
        rebalanced: rebalanceResult?.[0]?.rebalanced_count || 0,
        message: 'Chat assignment and workload balancing completed successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in auto-assign-chats function:', error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
