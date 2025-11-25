import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (!roles?.some(r => r.role === 'admin')) {
      throw new Error('Not authorized');
    }

    const { playerId, action, reason } = await req.json();

    if (!playerId || !action || !['kick', 'ban'].includes(action)) {
      throw new Error('Invalid request parameters');
    }

    const serverIp = Deno.env.get('FIVEM_SERVER_IP');
    const serverPort = Deno.env.get('FIVEM_SERVER_PORT');
    const adminKey = Deno.env.get('FIVEM_ADMIN_KEY');

    if (!serverIp || !serverPort) {
      throw new Error('FiveM server not configured');
    }

    // Log the action in staff activity
    await supabase.from('staff_activity_log').insert({
      staff_user_id: user.id,
      action_type: action,
      action_description: `${action === 'kick' ? 'Kicked' : 'Banned'} player ${playerId}`,
      related_type: 'player',
      related_id: playerId.toString(),
      metadata: { reason, playerId },
    });

    // Execute FiveM command
    // Note: This is a placeholder. The actual implementation depends on your FiveM server setup
    // You might need to use txAdmin API, RCON, or custom resource endpoints
    const command = action === 'kick' 
      ? `kick ${playerId} ${reason}`
      : `ban ${playerId} ${reason}`;

    console.log(`Executing command: ${command}`);
    
    // If you have a custom admin API endpoint on your FiveM server:
    // const response = await fetch(`http://${serverIp}:${serverPort}/admin`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${adminKey}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({ command, playerId, reason }),
    // });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Player ${action}ed successfully`,
        action,
        playerId,
        reason,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in admin-player-action:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      }),
      {
        status: error instanceof Error && error.message.includes('authorized') ? 403 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
