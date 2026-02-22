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

    const { playerId, playerName, action, reason, banDuration } = await req.json();

    if (!playerId || !action || !['kick', 'ban'].includes(action)) {
      throw new Error('Invalid request parameters');
    }

    const serverIp = Deno.env.get('FIVEM_SERVER_IP');
    const serverPort = Deno.env.get('FIVEM_SERVER_PORT');

    if (!serverIp || !serverPort) {
      throw new Error('FiveM server not configured');
    }

    // Calculate ban expiry if timed ban
    let expiresAt: string | null = null;
    let banType = 'permanent';
    let banDurationValue: number | null = null;

    if (action === 'ban' && banDuration) {
      banType = banDuration.type || 'permanent';
      banDurationValue = banDuration.value || null;

      if (banType === 'hours' && banDurationValue) {
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + banDurationValue);
        expiresAt = expiry.toISOString();
      } else if (banType === 'days' && banDurationValue) {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + banDurationValue);
        expiresAt = expiry.toISOString();
      }
      // permanent: expiresAt stays null
    }

    // Store ban in database using service role client
    if (action === 'ban') {
      const serviceClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Deactivate any existing active bans for this player
      await serviceClient
        .from('player_bans')
        .update({ is_active: false })
        .eq('player_id', playerId.toString())
        .eq('is_active', true);

      // Insert new ban
      await serviceClient.from('player_bans').insert({
        player_id: playerId.toString(),
        player_name: playerName || `Player ${playerId}`,
        reason: reason || 'No reason provided',
        ban_type: banType,
        ban_duration_value: banDurationValue,
        expires_at: expiresAt,
        banned_by: user.id,
        is_active: true,
      });
    }

    // Log the action in staff activity
    const durationText = banType === 'permanent'
      ? 'permanently'
      : `for ${banDurationValue} ${banType}`;

    await supabase.from('staff_activity_log').insert({
      staff_user_id: user.id,
      action_type: action,
      action_description: `${action === 'kick' ? 'Kicked' : `Banned (${durationText})`} player ${playerName || playerId}`,
      related_type: 'player',
      related_id: playerId.toString(),
      metadata: { reason, playerId, banType, banDurationValue, expiresAt },
    });

    // Execute FiveM command
    const command = action === 'kick' 
      ? `kick ${playerId} ${reason}`
      : `ban ${playerId} ${reason}`;

    console.log(`Executing command: ${command}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Player ${action}ed successfully`,
        action,
        playerId,
        reason,
        banType,
        banDurationValue,
        expiresAt,
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
