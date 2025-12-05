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

    console.log('Starting SLA breach check and notifications...');

    // Call the check_sla_breach function which now includes notifications
    const { error: checkError } = await supabaseClient.rpc('check_sla_breach');

    if (checkError) {
      console.error('Error checking SLA breaches:', checkError);
      throw checkError;
    }

    console.log('SLA breach check and notifications completed successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'SLA notifications sent' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in check-sla-notifications function:', error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
