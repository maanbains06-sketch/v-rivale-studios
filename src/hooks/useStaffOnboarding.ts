import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OnboardingChecklistItem {
  id: string;
  title: string;
  description: string;
  category: "setup" | "training" | "documentation" | "team" | "tools";
  display_order: number;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface OnboardingProgress {
  id: string;
  staff_user_id: string;
  checklist_item_id: string;
  completed: boolean;
  completed_at: string | null;
  notes: string | null;
}

export const useStaffOnboarding = () => {
  const queryClient = useQueryClient();

  const { data: checklist, isLoading: checklistLoading } = useQuery({
    queryKey: ["onboarding-checklist"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_onboarding_checklist")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as OnboardingChecklistItem[];
    },
  });

  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ["onboarding-progress"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("staff_onboarding_progress")
        .select("*")
        .eq("staff_user_id", user.id);

      if (error) throw error;
      return data as OnboardingProgress[];
    },
  });

  const toggleItemMutation = useMutation({
    mutationFn: async ({ itemId, completed, notes }: { 
      itemId: string; 
      completed: boolean;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("staff_onboarding_progress")
        .upsert({
          staff_user_id: user.id,
          checklist_item_id: itemId,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
          notes: notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-progress"] });
      toast.success("Progress updated!");
    },
    onError: () => {
      toast.error("Failed to update progress");
    },
  });

  const getItemProgress = (itemId: string) => {
    return progress?.find((p) => p.checklist_item_id === itemId);
  };

  const calculateProgress = () => {
    if (!checklist || !progress) return { completed: 0, total: 0, percentage: 0 };
    
    const requiredItems = checklist.filter(item => item.is_required);
    const completedCount = requiredItems.filter(
      item => progress.some(p => p.checklist_item_id === item.id && p.completed)
    ).length;

    return {
      completed: completedCount,
      total: requiredItems.length,
      percentage: requiredItems.length > 0 
        ? Math.round((completedCount / requiredItems.length) * 100)
        : 0,
    };
  };

  const getItemsByCategory = (category: OnboardingChecklistItem['category']) => {
    return checklist?.filter(item => item.category === category) || [];
  };

  return {
    checklist,
    progress,
    isLoading: checklistLoading || progressLoading,
    toggleItem: toggleItemMutation.mutate,
    getItemProgress,
    calculateProgress: calculateProgress(),
    getItemsByCategory,
  };
};