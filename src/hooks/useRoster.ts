import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface RosterEntry {
  id: string;
  department: string;
  section: string;
  callsign: string | null;
  name: string;
  rank: string;
  status: string;
  department_logs: string | null;
  discord_id: string | null;
  sub_department: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
  strikes: number;
  shop_name: string | null;
}

export interface RosterPermission {
  id: string;
  department: string;
  discord_role_id: string;
  discord_role_name: string;
}

// Owner Discord ID for full access
const OWNER_DISCORD_ID = "833680146510381097";

export const useRoster = (department: string, shopName?: string) => {
  const [entries, setEntries] = useState<RosterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);
  const [canView, setCanView] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [permissions, setPermissions] = useState<RosterPermission[]>([]);
  const { toast } = useToast();

  const fetchRoster = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("department_rosters")
        .select("*")
        .eq("department", department)
        .order("display_order", { ascending: true });

      // Filter by shop name if provided
      if (shopName) {
        query = query.eq("shop_name", shopName);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEntries((data as RosterEntry[]) || []);
    } catch (error: any) {
      console.error("Error fetching roster:", error);
      toast({
        title: "Error loading roster",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [department, shopName, toast]);

  const fetchPermissions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("roster_edit_permissions")
        .select("*")
        .eq("department", department);

      if (error) throw error;
      setPermissions(data || []);
    } catch (error) {
      console.error("Error fetching permissions:", error);
    }
  }, [department]);

  const checkEditPermission = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCanEdit(false);
        setCanView(false);
        setIsOwner(false);
        return;
      }

      // Check if user is admin - admins can edit and view all rosters
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (roleData?.role === "admin") {
        setCanEdit(true);
        setCanView(true);
        setIsOwner(true);
        return;
      }

      // Get user's Discord ID from staff_members or profiles
      let userDiscordId: string | null = null;

      // First check staff_members
      const { data: staffMember } = await supabase
        .from("staff_members")
        .select("discord_id")
        .eq("user_id", user.id)
        .single();

      if (staffMember?.discord_id) {
        userDiscordId = staffMember.discord_id;
      } else {
        // Check profiles as fallback
        const { data: profile } = await supabase
          .from("profiles")
          .select("discord_username")
          .eq("id", user.id)
          .single();
        
        // If discord_username looks like a Discord ID (all numbers), use it
        if (profile?.discord_username && /^\d+$/.test(profile.discord_username)) {
          userDiscordId = profile.discord_username;
        }
      }

      // Check if user is the owner
      if (userDiscordId === OWNER_DISCORD_ID) {
        console.log("Owner detected via Discord ID");
        setCanEdit(true);
        setCanView(true);
        setIsOwner(true);
        return;
      }

      // Check against roster_owner_access table
      if (userDiscordId) {
        const { data: ownerAccess } = await supabase
          .from("roster_owner_access")
          .select("*")
          .eq("discord_id", userDiscordId)
          .single();

        if (ownerAccess) {
          console.log("Owner access found in database");
          setCanEdit(true);
          setCanView(true);
          setIsOwner(true);
          return;
        }

        // Verify Discord roles via edge function
        try {
          const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
            "verify-roster-permissions",
            {
              body: { discordId: userDiscordId, department },
            }
          );

          if (!verifyError && verifyData?.canEdit) {
            console.log("Permission granted via Discord role verification");
            setCanEdit(true);
            setCanView(true);
            setIsOwner(verifyData.isOwner || false);
            return;
          }
        } catch (err) {
          console.error("Error calling verify-roster-permissions:", err);
        }
      }

      setCanEdit(false);
      setCanView(false);
      setIsOwner(false);
    } catch (error) {
      console.error("Error checking permissions:", error);
      setCanEdit(false);
      setCanView(false);
      setIsOwner(false);
    }
  }, [department]);

  useEffect(() => {
    fetchRoster();
    fetchPermissions();
    checkEditPermission();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`roster-${department}${shopName ? `-${shopName}` : ""}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "department_rosters",
          filter: `department=eq.${department}`,
        },
        () => {
          fetchRoster();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [department, shopName, fetchRoster, fetchPermissions, checkEditPermission]);

  return { entries, loading, canEdit, canView, isOwner, permissions, refetch: fetchRoster };
};

// Get unique sections for a department
export const getDepartmentSections = (department: string, shopName?: string): string[] => {
  const sectionsByDepartment: Record<string, string[]> = {
    police: ["High Command", "Command Staff", "Supervisors", "Officers", "Cadets", "Solo Cadets", "Strikes"],
    ems: ["High Command", "Supervisors", "Paramedics", "EMTs", "Strikes"],
    fire: ["High Command", "Captains", "Firefighters", "Strikes"],
    doj: ["Judges", "Attorneys", "State Staff", "Strikes"],
    mechanic: ["Management", "Senior Mechanics", "Mechanics", "Strikes"],
    pdm: ["Management", "Sales Team", "Strikes"],
  };

  return sectionsByDepartment[department] || ["General", "Strikes"];
};

// Shop configurations for multi-shop departments
export const getMechanicShops = (): { id: string; name: string; editable: boolean }[] => [
  { id: "main", name: "Main Shop", editable: true },
  { id: "shop2", name: "Shop 2", editable: true },
  { id: "shop3", name: "Shop 3", editable: true },
];

export const getPdmShops = (): { id: string; name: string; editable: boolean }[] => [
  { id: "main", name: "PDM Main", editable: true },
  { id: "shop2", name: "PDM Shop 2", editable: true },
];

// Departments that should NOT show callsign column
export const DEPARTMENTS_WITHOUT_CALLSIGN = ["mechanic", "pdm"];

// Status options for roster entries
export const ROSTER_STATUS_OPTIONS = [
  { value: "Active", label: "Active", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  { value: "LOA", label: "LOA", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  { value: "Inactive", label: "Inactive", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  { value: "In Training", label: "In Training", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "Reserved Unit", label: "Reserved Unit", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
];
