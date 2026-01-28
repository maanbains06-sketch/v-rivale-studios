import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Department type definition
type DepartmentKey = 'police' | 'ems' | 'fire' | 'mechanic' | 'doj' | 'state' | 'weazel' | 'pdm' | 'staff';

// Discord Role ID mappings - EXACT role IDs for each department
// Users with these roles can VIEW their corresponding roster ONLY
const ROSTER_ROLE_MAPPING: Record<string, DepartmentKey> = {
  "1451442274037923960": "police",    // Police Department role
  "1451442460910817371": "ems",       // EMS Department role
  "1451442569018998916": "fire",      // Fire Department role
  "1451442834229039104": "mechanic",  // Mechanic Shop role
  "1463145983448973519": "doj",       // Department of Justice role
  "1451442686115581963": "state",     // State Department role
  "1463143254324285583": "weazel",    // Weazel News role
  "1451747382592012380": "pdm",       // Premium Deluxe Motorsport role
};

// Roles that grant EDIT access to their corresponding department roster
const ROSTER_EDIT_ROLES: Record<string, DepartmentKey> = {
  "1451442274037923960": "police",    // PD role can edit PD roster
  "1451442460910817371": "ems",       // EMS role can edit EMS roster
  "1451442569018998916": "fire",      // Fire role can edit Fire roster
  "1451442834229039104": "mechanic",  // Mechanic role can edit Mechanic roster
  "1463145983448973519": "doj",       // DOJ role can edit DOJ roster
  "1451442686115581963": "state",     // State role can edit State roster
  "1463143254324285583": "weazel",    // Weazel role can edit Weazel roster
  "1451747382592012380": "pdm",       // PDM role can edit PDM roster
};

// Leadership/Admin roles that grant access to ALL rosters (optional - can add if needed)
const GLOBAL_ACCESS_ROLES: string[] = [
  // Add any leadership/admin role IDs here if you want some roles to see all rosters
];

// Global edit roles (can edit ALL rosters)
const GLOBAL_EDIT_ROLES: string[] = [
  // Add any leadership/admin role IDs here if you want some roles to edit all rosters
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

    // Check if user has global access roles
    const hasGlobalAccess = userRoles.some(roleId => GLOBAL_ACCESS_ROLES.includes(roleId));
    const hasGlobalEditAccess = userRoles.some(roleId => GLOBAL_EDIT_ROLES.includes(roleId));
    
    // Determine accessible departments based on user's Discord roles
    const accessibleDepartments: DepartmentKey[] = [];
    const editableDepartments: DepartmentKey[] = [];
    
    if (hasGlobalAccess) {
      // User has access to all departments
      const allDepts: DepartmentKey[] = ['police', 'ems', 'fire', 'mechanic', 'doj', 'state', 'weazel', 'pdm', 'staff'];
      accessibleDepartments.push(...allDepts);
      
      if (hasGlobalEditAccess) {
        editableDepartments.push(...allDepts);
      }
    } else {
      // Check each user role against department role mappings
      for (const userRole of userRoles) {
        // Check if this role grants view access to a department
        const viewDept = ROSTER_ROLE_MAPPING[userRole];
        if (viewDept && !accessibleDepartments.includes(viewDept)) {
          accessibleDepartments.push(viewDept);
        }
        
        // Check if this role grants edit access to a department
        const editDept = ROSTER_EDIT_ROLES[userRole];
        if (editDept && !editableDepartments.includes(editDept)) {
          editableDepartments.push(editDept);
        }
      }
    }

    const hasAccess = accessibleDepartments.length > 0;
    const canEdit = editableDepartments.length > 0 || hasGlobalEditAccess;

    console.log(`User ${discordId} - Has access: ${hasAccess}, Can edit: ${canEdit}`);
    console.log(`Accessible departments: ${accessibleDepartments.join(", ") || "none"}`);
    console.log(`Editable departments: ${editableDepartments.join(", ") || "none"}`);

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
