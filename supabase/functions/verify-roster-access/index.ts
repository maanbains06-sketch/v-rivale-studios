import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Department type definition
type DepartmentKey = 'police' | 'ems' | 'fire' | 'mechanic' | 'doj' | 'state' | 'weazel' | 'pdm' | 'staff';

// Mapping of Discord role IDs to department access
const DEPARTMENT_ROLE_MAPPING: Record<DepartmentKey, string[]> = {
  police: [
    "1463143859935772672", // PD Management role
    "1431378586203590687", // PD role
  ],
  ems: [
    "1431379430797869207", // EMS Management role
    "1431378794077487304", // EMS role
  ],
  fire: [
    "1281554246281461792", // Fire Management role
    "1281554458563575859", // Fire role
  ],
  mechanic: [
    "1438258435052535920", // Mechanic Management role
    "1317457907620646972", // Mechanic role
  ],
  doj: [
    "1463145983448973519", // DOJ Management role
    "1451442834229039104", // DOJ role
  ],
  state: [
    "1463143254324285583", // State Management role
    "1451442686115581963", // State role
  ],
  weazel: [
    "1451442569018998916", // Weazel Management role
    "1451442460910817371", // Weazel role
  ],
  pdm: [
    "1451442274037923960", // PDM Management role
    "1451747382592012380", // PDM role
  ],
  staff: [
    "1463145983448973519", // Staff Management
    "1451442834229039104", // Admin role
  ],
};

// Roles that grant VIEW access to ALL departments
const ALL_DEPARTMENTS_VIEW_ROLES = [
  "1463143859935772672", // Leadership
  "1463145983448973519", // Head Admin
];

// Roles that grant EDIT access (per department or all)
const EDIT_ROLE_IDS = [
  "1463145983448973519", // Head Admin - can edit all
  "1451442834229039104", // Admin - can edit all
  "1463143254324285583", // Management roles...
  "1451442686115581963",
  "1451442569018998916",
  "1451442460910817371",
  "1451442274037923960",
  "1451747382592012380",
];

// Owner Discord ID - always has full access
const OWNER_DISCORD_ID = "833680146510381097";

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const discordBotToken = Deno.env.get("DISCORD_BOT_TOKEN");
    const discordServerId = Deno.env.get("DISCORD_SERVER_ID");

    if (!discordBotToken || !discordServerId) {
      console.error("Discord configuration missing");
      return new Response(
        JSON.stringify({ 
          hasAccess: false,
          canEdit: false,
          accessibleDepartments: [],
          error: "Discord configuration incomplete"
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { discordId } = await req.json();

    if (!discordId) {
      return new Response(
        JSON.stringify({ 
          hasAccess: false,
          canEdit: false,
          accessibleDepartments: [],
          error: "Discord ID is required"
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if owner - full access to all departments
    if (discordId === OWNER_DISCORD_ID) {
      console.log(`Owner ${discordId} has full roster access to all departments`);
      return new Response(
        JSON.stringify({
          hasAccess: true,
          canEdit: true,
          isOwner: true,
          accessibleDepartments: ['police', 'ems', 'fire', 'mechanic', 'doj', 'state', 'weazel', 'pdm', 'staff'] as DepartmentKey[],
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Checking roster access for Discord ID: ${discordId}`);

    // Fetch guild member data to get their roles
    const memberResponse = await fetch(
      `https://discord.com/api/v10/guilds/${discordServerId}/members/${discordId}`,
      {
        headers: {
          Authorization: `Bot ${discordBotToken}`,
        },
      }
    );

    if (!memberResponse.ok) {
      if (memberResponse.status === 404) {
        console.log(`User ${discordId} not found in server`);
        return new Response(
          JSON.stringify({ 
            hasAccess: false,
            canEdit: false,
            accessibleDepartments: [],
            reason: "User not in Discord server"
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      
      const errorText = await memberResponse.text();
      console.error(`Discord API error: ${memberResponse.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ 
          hasAccess: false,
          canEdit: false,
          accessibleDepartments: [],
          error: `Discord API error: ${memberResponse.status}`
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const memberData = await memberResponse.json();
    const userRoles: string[] = memberData.roles || [];
    
    console.log(`User ${discordId} roles: ${userRoles.join(", ")}`);

    // Check if user has roles that grant access to all departments
    const hasAllDepartmentsAccess = userRoles.some(roleId => ALL_DEPARTMENTS_VIEW_ROLES.includes(roleId));
    
    // Check which specific departments the user can access
    const accessibleDepartments: DepartmentKey[] = [];
    
    if (hasAllDepartmentsAccess) {
      // User has access to all departments
      accessibleDepartments.push('police', 'ems', 'fire', 'mechanic', 'doj', 'state', 'weazel', 'pdm', 'staff');
    } else {
      // Check each department for role-based access
      for (const [dept, roleIds] of Object.entries(DEPARTMENT_ROLE_MAPPING)) {
        if (userRoles.some(userRole => roleIds.includes(userRole))) {
          accessibleDepartments.push(dept as DepartmentKey);
        }
      }
    }

    // Check if user has any of the allowed EDIT roles
    const hasEditAccess = userRoles.some(roleId => EDIT_ROLE_IDS.includes(roleId));

    const hasAccess = accessibleDepartments.length > 0;

    console.log(`User ${discordId} - Has access: ${hasAccess}, Can edit: ${hasEditAccess}, Departments: ${accessibleDepartments.join(", ")}`);

    return new Response(
      JSON.stringify({
        hasAccess,
        canEdit: hasEditAccess,
        accessibleDepartments,
        username: memberData.user?.username || null,
        userRoles: userRoles,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in verify-roster-access function:", error);
    return new Response(
      JSON.stringify({
        hasAccess: false,
        canEdit: false,
        accessibleDepartments: [],
        error: error.message
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
