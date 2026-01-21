import { supabase } from "@/integrations/supabase/client";
import { ApplicationType } from "@/components/UnifiedApplicationsTable";

// Map ApplicationType to the applicationType string expected by edge functions
const applicationTypeMap: Record<ApplicationType, string> = {
  whitelist: 'whitelist',
  police: 'Police Department',
  ems: 'EMS',
  mechanic: 'Mechanic',
  judge: 'DOJ - Judge',
  attorney: 'DOJ - Attorney',
  state: 'State Department',
  staff: 'Staff',
  gang: 'Gang RP',
  ban_appeal: 'ban_appeal',
  creator: 'Creator',
  firefighter: 'Firefighter',
  weazel_news: 'Weazel News',
  pdm: 'PDM',
};

interface SendDiscordNotificationParams {
  applicationType: ApplicationType;
  applicantName: string;
  applicantDiscordId?: string | null;
  status: 'approved' | 'rejected';
  adminNotes?: string | null;
}

/**
 * Sends Discord notification for application approval/rejection.
 * Works for all application types.
 */
export const sendDiscordNotification = async ({
  applicationType,
  applicantName,
  applicantDiscordId,
  status,
  adminNotes,
}: SendDiscordNotificationParams): Promise<{ success: boolean; error?: string }> => {
  try {
    // Get current user and staff info for moderator details
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('No authenticated user, skipping Discord notification');
      return { success: false, error: 'No authenticated user' };
    }

    const userDiscordId = user.user_metadata?.provider_id || user.user_metadata?.discord_id;
    
    // Try to get staff member info
    let staffData: { name: string; discord_id: string | null } | null = null;
    
    if (userDiscordId) {
      const { data } = await supabase
        .from("staff_members")
        .select("name, discord_id")
        .eq("discord_id", userDiscordId)
        .single();
      staffData = data;
    }
    
    if (!staffData && user.id) {
      const { data } = await supabase
        .from("staff_members")
        .select("name, discord_id")
        .eq("user_id", user.id)
        .single();
      staffData = data;
    }

    const moderatorName = staffData?.name || user.email || "Staff";
    const moderatorDiscordId = staffData?.discord_id || userDiscordId;

    // Whitelist uses a separate dedicated function
    if (applicationType === 'whitelist') {
      const notificationPayload = {
        applicantDiscord: applicantName,
        applicantDiscordId: applicantDiscordId || undefined,
        status,
        moderatorName,
        moderatorDiscordId,
        adminNotes: adminNotes || undefined,
      };

      console.log("Sending whitelist Discord notification:", notificationPayload);
      
      const { data, error } = await supabase.functions.invoke("send-whitelist-notification", {
        body: notificationPayload
      });

      if (error) {
        console.error("Failed to send whitelist Discord notification:", error);
        return { success: false, error: error.message };
      }

      console.log("Whitelist Discord notification sent:", data);
      return { success: true };
    }

    // Ban appeals don't get Discord notifications (for now)
    if (applicationType === 'ban_appeal') {
      console.log("Ban appeals don't send Discord notifications");
      return { success: true };
    }

    // All other application types use send-application-notification
    const mappedType = applicationTypeMap[applicationType];
    
    const notificationPayload = {
      applicationType: mappedType,
      applicantName,
      applicantDiscordId: applicantDiscordId || undefined,
      status,
      moderatorName,
      moderatorDiscordId,
      adminNotes: adminNotes || undefined,
    };

    console.log("Sending application Discord notification:", notificationPayload);

    const { data, error } = await supabase.functions.invoke("send-application-notification", {
      body: notificationPayload
    });

    if (error) {
      console.error("Failed to send application Discord notification:", error);
      return { success: false, error: error.message };
    }

    console.log("Application Discord notification sent:", data);
    return { success: true };
  } catch (err: any) {
    console.error("Error sending Discord notification:", err);
    return { success: false, error: err.message || 'Unknown error' };
  }
};
