import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Department type definition
type DepartmentKey = 'police' | 'ems' | 'fire' | 'mechanic' | 'doj' | 'state' | 'weazel' | 'pdm' | 'staff';

// Discord Role ID mappings for each department roster access
// These are the department lead/management roles that grant access to view their roster
const ROSTER_VIEW_ROLES: Record<DepartmentKey, string[]> = {
  police: [
    "1451442274037923960", // PD Lead/Management role
    "1431378586203590687", // PD Member role
  ],
  ems: [
    "1451442460910817371", // EMS Lead/Management role
    "1431379430797869207", // EMS Member role
    "1431378794077487304", // EMS Secondary role
  ],
  fire: [
    "1451442569018998916", // Fire Lead/Management role
    "1281554246281461792", // Fire Member role
    "1281554458563575859", // Fire Secondary role
  ],
  mechanic: [
    "1451442834229039104", // Mechanic Lead/Management role
    "1438258435052535920", // Mechanic Member role
    "1317457907620646972", // Mechanic Secondary role
  ],
  doj: [
    "1463145983448973519", // DOJ Lead/Management role
  ],
  state: [
    "1451442686115581963", // State Lead/Management role
  ],
  weazel: [
    "1463143254324285583", // Weazel Lead/Management role
  ],
  pdm: [
    "1451747382592012380", // PDM Lead/Management role
  ],
  staff: [
    "1463143859935772672", // Staff/Leadership role
    "1463145983448973519", // Admin role
  ],
};

// Roles that grant access to ALL department rosters (Leadership/Admin roles)
const ALL_DEPARTMENTS_ACCESS_ROLES = [
  "1463143859935772672", // Leadership role
  "1463145983448973519", // Head Admin role
  "1451442834229039104", // Admin role
];

// Roles that grant EDIT access to rosters (per department or globally)
const ROSTER_EDIT_ROLES: Record<DepartmentKey, string[]> = {
  police: ["1451442274037923960"], // PD Lead can edit PD roster
  ems: ["1451442460910817371"], // EMS Lead can edit EMS roster
  fire: ["1451442569018998916"], // Fire Lead can edit Fire roster
  mechanic: ["1451442834229039104"], // Mechanic Lead can edit Mechanic roster
  doj: ["1463145983448973519"], // DOJ Lead can edit DOJ roster
  state: ["1451442686115581963"], // State Lead can edit State roster
  weazel: ["1463143254324285583"], // Weazel Lead can edit Weazel roster
  pdm: ["1451747382592012380"], // PDM Lead can edit PDM roster
  staff: ["1463143859935772672", "1463145983448973519"], // Leadership/Admin can edit Staff roster
};

// Global edit roles (can edit ALL rosters)
const GLOBAL_EDIT_ROLES = [
  "1463143859935772672", // Leadership role
  "1463145983448973519", // Head Admin role
];

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const discordBotToken = Deno.env.get("DISCORD_BOT_TOKEN");
    const discordServerId = Deno.env.get("DISCORD_SERVER_ID");
    const ownerDiscordId = Deno.env.get("OWNER_DISCORD_ID") || "833680146510381097";

    if (!discordBotToken || !discordServerId) {
      console.error("Discord configuration missing");
      return new Response(
        JSON.stringify({ 
          hasAccess: false,
          canEdit: false,
          accessibleDepartments: [],
          editableDepartments: [],
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
          editableDepartments: [],
          error: "Discord ID is required"
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const allDepartments: DepartmentKey[] = ['police', 'ems', 'fire', 'mechanic', 'doj', 'state', 'weazel', 'pdm', 'staff'];

    // Check if owner - full access to all departments with edit rights
    if (discordId === ownerDiscordId) {
      console.log(`Owner ${discordId} has full roster access to all departments`);
      return new Response(
        JSON.stringify({
          hasAccess: true,
          canEdit: true,
          isOwner: true,
          accessibleDepartments: allDepartments,
          editableDepartments: allDepartments,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Checking roster access for Discord ID: ${discordId}`);

    // Fetch guild member data to get their roles - this is the live fetch from Discord
    const memberResponse = await fetch(
      `https://discord.com/api/v10/guilds/${discordServerId}/members/${discordId}`,
      {
        headers: {
          Authorization: `Bot ${discordBotToken}`,
          "Content-Type": "application/json",
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
            editableDepartments: [],
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
          editableDepartments: [],
          error: `Discord API error: ${memberResponse.status}`
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const memberData = await memberResponse.json();
    const userRoles: string[] = memberData.roles || [];
    
    console.log(`User ${discordId} live Discord roles: ${userRoles.join(", ")}`);

    // Check if user has roles that grant access to ALL departments
    const hasAllDepartmentsAccess = userRoles.some(roleId => ALL_DEPARTMENTS_ACCESS_ROLES.includes(roleId));
    
    // Check if user has global edit access
    const hasGlobalEditAccess = userRoles.some(roleId => GLOBAL_EDIT_ROLES.includes(roleId));
    
    // Determine accessible departments
    const accessibleDepartments: DepartmentKey[] = [];
    const editableDepartments: DepartmentKey[] = [];
    
    if (hasAllDepartmentsAccess) {
      // User has access to all departments
      accessibleDepartments.push(...allDepartments);
      
      if (hasGlobalEditAccess) {
        // User can edit all departments
        editableDepartments.push(...allDepartments);
      }
    } else {
      // Check each department for role-based access
      for (const dept of allDepartments) {
        const viewRoles = ROSTER_VIEW_ROLES[dept] || [];
        const editRoles = ROSTER_EDIT_ROLES[dept] || [];
        
        const hasViewAccess = userRoles.some(userRole => viewRoles.includes(userRole));
        const hasEditAccess = userRoles.some(userRole => editRoles.includes(userRole));
        
        if (hasViewAccess || hasEditAccess) {
          accessibleDepartments.push(dept);
        }
        
        if (hasEditAccess) {
          editableDepartments.push(dept);
        }
      }
    }

    const hasAccess = accessibleDepartments.length > 0;
    const canEdit = editableDepartments.length > 0 || hasGlobalEditAccess;

    console.log(`User ${discordId} - Has access: ${hasAccess}, Can edit: ${canEdit}`);
    console.log(`Accessible departments: ${accessibleDepartments.join(", ")}`);
    console.log(`Editable departments: ${editableDepartments.join(", ")}`);

    return new Response(
      JSON.stringify({
        hasAccess,
        canEdit,
        isOwner: false,
        accessibleDepartments,
        editableDepartments,
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
        editableDepartments: [],
        error: error.message
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
