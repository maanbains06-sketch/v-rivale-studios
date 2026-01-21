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
 * Universal function to update application status for any application type.
 * Works for all panels (Admin, OwnerPanel) without errors.
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
