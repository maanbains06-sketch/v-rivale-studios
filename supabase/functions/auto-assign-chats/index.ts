import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});