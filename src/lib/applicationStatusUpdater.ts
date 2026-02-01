import { supabase } from "@/integrations/supabase/client";
import { ApplicationType } from "@/components/UnifiedApplicationsTable";

export type ApplicationTable = 
  | 'whitelist_applications'
  | 'job_applications'
  | 'staff_applications'
  | 'ban_appeals'
  | 'creator_applications'
  | 'firefighter_applications'
  | 'weazel_news_applications'
  | 'pdm_applications';

export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'on_hold' | 'closed';

// Map application type to table name
export const getTableForApplicationType = (type: ApplicationType): ApplicationTable => {
  const tableMap: Record<ApplicationType, ApplicationTable> = {
    whitelist: 'whitelist_applications',
    staff: 'staff_applications',
    police: 'job_applications',
    ems: 'job_applications',
    mechanic: 'job_applications',
    judge: 'job_applications',
    attorney: 'job_applications',
    state: 'job_applications',
    gang: 'job_applications',  // Gang applications are stored in job_applications
    ban_appeal: 'ban_appeals',
    creator: 'creator_applications',
    firefighter: 'firefighter_applications',
    weazel_news: 'weazel_news_applications',
    pdm: 'pdm_applications',
  };
  return tableMap[type];
};

interface UpdateApplicationStatusParams {
  id: string;
  type: ApplicationType;
  status: ApplicationStatus;
  notes?: string | null;
}

interface UpdateApplicationStatusResult {
  success: boolean;
  error?: string;
}

/**
 * Helper function to get Discord ID from an application
 */
const getDiscordIdFromApplication = async (
  id: string, 
  type: ApplicationType, 
  table: ApplicationTable
): Promise<string | null> => {
  try {
    // Different tables store discord_id in different columns
    if (table === 'whitelist_applications') {
      const { data } = await supabase
        .from('whitelist_applications')
        .select('discord_id')
        .eq('id', id)
        .single();
      return data?.discord_id || null;
    }
    
    if (table === 'job_applications') {
      const { data } = await supabase
        .from('job_applications')
        .select('discord_id')
        .eq('id', id)
        .single();
      return data?.discord_id || null;
    }
    
    if (table === 'creator_applications') {
      const { data } = await supabase
        .from('creator_applications')
        .select('discord_id')
        .eq('id', id)
        .single();
      return data?.discord_id || null;
    }
    
    if (table === 'firefighter_applications') {
      const { data } = await supabase
        .from('firefighter_applications')
        .select('discord_id')
        .eq('id', id)
        .single();
      return data?.discord_id || null;
    }
    
    if (table === 'weazel_news_applications') {
      const { data } = await supabase
        .from('weazel_news_applications')
        .select('discord_id')
        .eq('id', id)
        .single();
      return data?.discord_id || null;
    }
    
    if (table === 'pdm_applications') {
      const { data } = await supabase
        .from('pdm_applications')
        .select('discord_id')
        .eq('id', id)
        .single();
      return data?.discord_id || null;
    }
    
    if (table === 'staff_applications') {
      const { data } = await supabase
        .from('staff_applications')
        .select('discord_id')
        .eq('id', id)
        .single();
      return data?.discord_id || null;
    }
    
    return null;
  } catch (err) {
    console.error('Error fetching discord_id:', err);
    return null;
  }
};

/**
 * Universal function to update application status for any application type.
 * Works for all panels (Admin, OwnerPanel) without errors.
 * Automatically assigns Discord roles when applications are approved.
 */
export const updateApplicationStatusGeneric = async ({
  id,
  type,
  status,
  notes = null,
}: UpdateApplicationStatusParams): Promise<UpdateApplicationStatusResult> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const table = getTableForApplicationType(type);

    // Build the update payload
    const updatePayload: Record<string, any> = {
      status,
      reviewed_by: user?.id || null,
      reviewed_at: new Date().toISOString(),
    };

    // Only include admin_notes if provided (for close/open we don't modify notes)
    if (notes !== undefined && notes !== null) {
      updatePayload.admin_notes = notes;
    }

    // Get discord_id before updating (needed for role assignment and pending role removal)
    let discordId: string | null = null;
    if (status === 'approved' || status === 'rejected') {
      discordId = await getDiscordIdFromApplication(id, type, table);
      console.log(`Fetched Discord ID for ${type} application ${id}: ${discordId}`);
    }

    // Use 'as any' to allow dynamic table access since all application tables share the same structure
    const { data: updatedRows, error } = await supabase
      .from(table as any)
      .update(updatePayload)
      .eq('id', id)
      .select('id');

    if (error) {
      console.error('Application status update error:', { table, id, status, error });
      return { success: false, error: error.message };
    }

    // Check if any rows were updated (RLS might block)
    if (!updatedRows || updatedRows.length === 0) {
      console.error('Application update blocked (0 rows updated):', { table, id, status });
      return { success: false, error: 'Update was blocked by permissions (0 rows updated)' };
    }

    // Handle Discord role assignment when approved
    if (status === 'approved' && discordId && /^\d{17,19}$/.test(discordId)) {
      try {
        // Call auto-assign-application-role for all types (except excluded ones like gang, staff, ban_appeal)
        const excludedFromRoleAssignment = ['gang', 'ban_appeal', 'staff'];
        
        if (!excludedFromRoleAssignment.includes(type)) {
          const { data: roleResult, error: roleError } = await supabase.functions.invoke('auto-assign-application-role', {
            body: {
              applicationType: type,
              discordUserId: discordId,
            },
          });
          
          if (roleError) {
            console.error(`Failed to assign Discord role for ${type}:`, roleError);
          } else {
            console.log(`Discord role assigned for ${type}:`, roleResult);
          }
        }
      } catch (roleError) {
        console.error('Failed to assign Discord role (non-blocking):', roleError);
      }
    }

    // Remove pending whitelist role when whitelist application is approved or rejected
    if (type === 'whitelist' && discordId && /^\d{17,19}$/.test(discordId) && (status === 'approved' || status === 'rejected')) {
      try {
        console.log(`Removing pending whitelist role for Discord ID: ${discordId}, status: ${status}`);
        const { data: roleRemoveResult, error: roleRemoveError } = await supabase.functions.invoke('manage-pending-whitelist-role', {
          body: {
            discordId,
            action: 'remove',
            applicationId: id,
          },
        });
        
        if (roleRemoveError) {
          console.error('Error removing pending whitelist role:', roleRemoveError);
        } else {
          console.log(`Pending whitelist role removal result:`, roleRemoveResult);
        }
      } catch (roleError) {
        console.error('Failed to remove pending role (non-blocking):', roleError);
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('Unexpected error updating application status:', err);
    return { success: false, error: err.message || 'Unknown error occurred' };
  }
};

/**
 * Mark an application as closed
 */
export const markApplicationClosed = async (id: string, type: ApplicationType): Promise<UpdateApplicationStatusResult> => {
  return updateApplicationStatusGeneric({ id, type, status: 'closed' });
};

/**
 * Mark an application as open (pending)
 */
export const markApplicationOpen = async (id: string, type: ApplicationType): Promise<UpdateApplicationStatusResult> => {
  return updateApplicationStatusGeneric({ id, type, status: 'pending' });
};
