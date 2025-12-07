import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.83.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const discordBotToken = Deno.env.get('DISCORD_BOT_TOKEN');

    if (!discordBotToken) {
      console.error('DISCORD_BOT_TOKEN is not configured');
      return new Response(
        JSON.stringify({ error: 'Discord bot token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, discordUserId, action } = await req.json();

    console.log(`Processing Discord role ${action} for user ${userId}, Discord ID: ${discordUserId}`);

    // Get Discord settings from site_settings
    const { data: settings, error: settingsError } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['whitelist_discord_role_id', 'discord_server_id']);

    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch Discord settings' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const roleId = settings?.find(s => s.key === 'whitelist_discord_role_id')?.value;
    const serverId = settings?.find(s => s.key === 'discord_server_id')?.value;

    if (!roleId || !serverId) {
      console.error('Discord role ID or server ID not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Discord settings not configured',
          message: 'Please configure the Discord server ID and whitelist role ID in admin settings'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Assign or remove role based on action
    const endpoint = `https://discord.com/api/v10/guilds/${serverId}/members/${discordUserId}/roles/${roleId}`;
    const method = action === 'add' ? 'PUT' : 'DELETE';

    console.log(`Making Discord API request: ${method} ${endpoint}`);

    const discordResponse = await fetch(endpoint, {
      method,
      headers: {
        'Authorization': `Bot ${discordBotToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();
      console.error(`Discord API error: ${discordResponse.status} - ${errorText}`);
      
      // Handle specific Discord errors
      if (discordResponse.status === 404) {
        return new Response(
          JSON.stringify({ 
            error: 'User not found in server',
            message: 'The user must be a member of the Discord server to receive the role'
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          error: 'Failed to assign Discord role',
          details: errorText 
        }),
        { status: discordResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully ${action === 'add' ? 'assigned' : 'removed'} Discord role`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Role ${action === 'add' ? 'assigned' : 'removed'} successfully` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in assign-discord-role function:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
