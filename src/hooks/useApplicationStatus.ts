import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ApplicationWithTimeline {
  id: string;
  user_id: string;
  full_name: string;
  position: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export const useApplicationStatus = () => {
  const { data: application, isLoading } = useQuery({
    queryKey: ["my-staff-application"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("staff_applications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as ApplicationWithTimeline | null;
    },
  });

  const getStatusInfo = () => {
    if (!application) {
      return {
        status: "not_submitted",
        label: "Not Submitted",
        description: "You haven't submitted a staff application yet.",
        color: "muted",
        progress: 0,
      };
    }

    const statusMap = {
      pending: {
        status: "pending",
        label: "Under Review",
        description: "Your application is being reviewed by our team.",
        color: "yellow",
        progress: 50,
      },
      approved: {
        status: "approved",
        label: "Approved",
        description: "Congratulations! Your application has been approved.",
        color: "green",
        progress: 100,
      },
      rejected: {
        status: "rejected",
        label: "Not Accepted",
        description: "Unfortunately, your application was not accepted at this time.",
        color: "red",
        progress: 100,
      },
    };

    return statusMap[application.status as keyof typeof statusMap] || statusMap.pending;
  };

  const getTimeline = () => {
    if (!application) return [];

    const timeline = [
      {
        label: "Application Submitted",
        date: application.created_at,
        completed: true,
        description: "Your application was received successfully",
      },
      {
        label: "Under Review",
        date: application.status !== "pending" ? application.updated_at : null,
        completed: application.status !== "pending",
        description: "Our team is reviewing your application",
      },
    ];

    if (application.status === "approved") {
      timeline.push({
        label: "Application Approved",
        date: application.reviewed_at,
        completed: true,
        description: "Your application has been approved! Check your email for next steps.",
      });
    } else if (application.status === "rejected") {
      timeline.push({
        label: "Application Decision",
        date: application.reviewed_at,
        completed: true,
        description: application.admin_notes || "Your application was not accepted at this time.",
      });
    } else {
      timeline.push({
        label: "Decision Pending",
        date: null,
        completed: false,
        description: "Waiting for final decision",
      });
    }

    return timeline;
  };

  return {
    application,
    isLoading,
    statusInfo: getStatusInfo(),
    timeline: getTimeline(),
  };
};