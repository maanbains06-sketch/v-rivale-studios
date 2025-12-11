import { supabase } from '@/integrations/supabase/client';

interface LogActionParams {
  actionType: string;
  actionDescription: string;
  targetTable?: string;
  targetId?: string;
  oldValue?: any;
  newValue?: any;
}

export const useOwnerAuditLog = () => {
  const logAction = async ({
    actionType,
    actionDescription,
    targetTable,
    targetId,
    oldValue,
    newValue
  }: LogActionParams) => {
    try {
      const { error } = await supabase.rpc('log_owner_action', {
        p_action_type: actionType,
        p_action_description: actionDescription,
        p_target_table: targetTable || null,
        p_target_id: targetId || null,
        p_old_value: oldValue ? JSON.stringify(oldValue) : null,
        p_new_value: newValue ? JSON.stringify(newValue) : null
      });

      if (error) {
        console.error('Failed to log owner action:', error);
      }
    } catch (error) {
      console.error('Error logging owner action:', error);
    }
  };

  return { logAction };
};
