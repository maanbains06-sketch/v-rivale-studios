import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Discord Role ID mappings for each department
const JOB_PANEL_ROLES = {
  pd: '1451442274037923960',
  ems: '1451442460910817371',
  firefighter: '1451442569018998916',
  doj: '1463145983448973519',
  state: '1451442686115581963',
  mechanic: '1451442834229039104',
  pdm: '1451747382592012380',
  weazel: '1463143254324285583',
} as const;

type DepartmentKey = keyof typeof JOB_PANEL_ROLES;

interface UserRolesResponse {
  hasAccess: boolean;
  isOwner: boolean;
  accessibleDepartments: DepartmentKey[];
  userDiscordId: string | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', hasAccess: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const discordBotToken = Deno.env.get('DISCORD_BOT_TOKEN');
    const discordServerId = Deno.env.get('DISCORD_SERVER_ID');

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    
    if (claimsError || !claimsData?.user) {
      console.error('Auth error:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', hasAccess: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const user = claimsData.user;
    const userDiscordId = user.user_metadata?.discord_id || 
                          user.user_metadata?.provider_id || 
                          user.user_metadata?.sub;

    console.log('Checking job panel access for user:', user.id, 'Discord ID:', userDiscordId);

    // Check if user is owner
    const ownerDiscordId = Deno.env.get('OWNER_DISCORD_ID');
    const isOwner = userDiscordId === ownerDiscordId;

    if (isOwner) {
      console.log('User is owner, granting full access');
      return new Response(
        JSON.stringify({
          hasAccess: true,
          isOwner: true,
          accessibleDepartments: Object.keys(JOB_PANEL_ROLES) as DepartmentKey[],
          userDiscordId,
        } as UserRolesResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!userDiscordId || !/^\d{17,19}$/.test(userDiscordId)) {
      console.log('Invalid Discord ID');
      return new Response(
        JSON.stringify({ hasAccess: false, isOwner: false, accessibleDepartments: [], userDiscordId: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!discordBotToken || !discordServerId) {
      console.error('Discord configuration missing');
      return new Response(
        JSON.stringify({ error: 'Discord configuration missing', hasAccess: false }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch user's roles from Discord
    console.log('Fetching Discord member roles for:', userDiscordId);
    const memberResponse = await fetch(
      `https://discord.com/api/v10/guilds/${discordServerId}/members/${userDiscordId}`,
      {
        headers: {
          Authorization: `Bot ${discordBotToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!memberResponse.ok) {
      const errorText = await memberResponse.text();
      console.error('Discord API error:', memberResponse.status, errorText);
      
      // User might not be in server
      if (memberResponse.status === 404) {
        return new Response(
          JSON.stringify({ hasAccess: false, isOwner: false, accessibleDepartments: [], userDiscordId }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to fetch Discord roles', hasAccess: false }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const memberData = await memberResponse.json();
    const userRoles: string[] = memberData.roles || [];
    
    console.log('User Discord roles:', userRoles);

    // Check which departments the user has access to
    const accessibleDepartments: DepartmentKey[] = [];
    
    for (const [dept, roleId] of Object.entries(JOB_PANEL_ROLES)) {
      if (userRoles.includes(roleId)) {
        accessibleDepartments.push(dept as DepartmentKey);
        console.log(`User has access to ${dept} (role: ${roleId})`);
      }
    }

    const hasAccess = accessibleDepartments.length > 0;
    
    console.log('Final access result:', { hasAccess, accessibleDepartments });

    return new Response(
      JSON.stringify({
        hasAccess,
        isOwner: false,
        accessibleDepartments,
        userDiscordId,
      } as UserRolesResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-job-panel-access:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', hasAccess: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
