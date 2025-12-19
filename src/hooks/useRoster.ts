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
}

export interface RosterPermission {
  id: string;
  department: string;
  discord_role_id: string;
  discord_role_name: string;
}

export const useRoster = (department: string) => {
  const [entries, setEntries] = useState<RosterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);
  const [permissions, setPermissions] = useState<RosterPermission[]>([]);
  const { toast } = useToast();

  const fetchRoster = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("department_rosters")
        .select("*")
        .eq("department", department)
        .order("display_order", { ascending: true });

      if (error) throw error;
      setEntries(data || []);
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
  }, [department, toast]);

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
        return;
      }

      // Check if user is admin - admins can edit all rosters
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (roleData?.role === "admin") {
        setCanEdit(true);
        return;
      }

      // Check if user is a staff member with matching Discord roles for this department
      const { data: staffMember } = await supabase
        .from("staff_members")
        .select("discord_id")
        .eq("user_id", user.id)
        .single();

      if (!staffMember?.discord_id) {
        setCanEdit(false);
        return;
      }

      // Fetch Discord presence/roles data for this user
      const { data: discordPresence } = await supabase
        .from("discord_presence")
        .select("*")
        .eq("discord_id", staffMember.discord_id)
        .single();

      // For now, if user is staff and has presence in this department's roster, allow editing
      // This can be extended to check actual Discord roles via API
      const { data: permissionData } = await supabase
        .from("roster_edit_permissions")
        .select("*")
        .eq("department", department);

      // If there are no specific permissions set, only admins can edit
      if (!permissionData || permissionData.length === 0) {
        setCanEdit(false);
        return;
      }

      // Check if user has any of the required Discord roles
      // For now, we check if staff member exists and is active
      const { data: isStaffActive } = await supabase
        .from("staff_members")
        .select("is_active, department")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      // Allow editing if staff is active and their department matches
      if (isStaffActive && isStaffActive.department?.toLowerCase() === department.toLowerCase()) {
        setCanEdit(true);
        return;
      }

      setCanEdit(false);
    } catch (error) {
      console.error("Error checking permissions:", error);
      setCanEdit(false);
    }
  }, [department]);

  useEffect(() => {
    fetchRoster();
    fetchPermissions();
    checkEditPermission();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`roster-${department}`)
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
  }, [department, fetchRoster, fetchPermissions, checkEditPermission]);

  return { entries, loading, canEdit, permissions, refetch: fetchRoster };
};

// Get unique sections for a department
export const getDepartmentSections = (department: string): string[] => {
  const sectionsByDepartment: Record<string, string[]> = {
    police: ["High Command", "Command Staff", "Supervisors", "Officers"],
    ems: ["High Command", "Supervisors", "Paramedics", "EMTs"],
    fire: ["High Command", "Captains", "Firefighters"],
    doj: ["Judges", "Attorneys"],
    mechanic: ["Management", "Senior Mechanics", "Mechanics"],
    pdm: ["Management", "Sales Team"],
  };

  return sectionsByDepartment[department] || ["General"];
};

// Status options for roster entries
export const ROSTER_STATUS_OPTIONS = [
  { value: "Active", label: "Active", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  { value: "LOA", label: "LOA", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  { value: "Inactive", label: "Inactive", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  { value: "In Training", label: "In Training", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "Reserved Unit", label: "Reserved Unit", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
];
