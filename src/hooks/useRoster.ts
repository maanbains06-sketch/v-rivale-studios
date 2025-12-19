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

export const useRoster = (department: string) => {
  const [entries, setEntries] = useState<RosterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);
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

  const checkEditPermission = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCanEdit(false);
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      setCanEdit(roleData?.role === "admin" || roleData?.role === "moderator");
    } catch (error) {
      setCanEdit(false);
    }
  }, []);

  useEffect(() => {
    fetchRoster();
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
  }, [department, fetchRoster, checkEditPermission]);

  return { entries, loading, canEdit, refetch: fetchRoster };
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
