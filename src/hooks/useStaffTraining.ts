import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  content: string;
  module_type: "video" | "document" | "quiz" | "interactive";
  duration_minutes: number | null;
  display_order: number;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrainingProgress {
  id: string;
  staff_user_id: string;
  module_id: string;
  completed: boolean;
  completed_at: string | null;
  score: number | null;
  notes: string | null;
}

export const useStaffTraining = () => {
  const queryClient = useQueryClient();

  const { data: modules, isLoading: modulesLoading } = useQuery({
    queryKey: ["training-modules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_training_modules")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as TrainingModule[];
    },
  });

  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ["training-progress"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("staff_training_progress")
        .select("*")
        .eq("staff_user_id", user.id);

      if (error) throw error;
      return data as TrainingProgress[];
    },
  });

  const completeModuleMutation = useMutation({
    mutationFn: async ({ moduleId, score }: { moduleId: string; score?: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("staff_training_progress")
        .upsert({
          staff_user_id: user.id,
          module_id: moduleId,
          completed: true,
          completed_at: new Date().toISOString(),
          score: score || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-progress"] });
      toast.success("Training module completed!");
    },
    onError: () => {
      toast.error("Failed to update progress");
    },
  });

  const getModuleProgress = (moduleId: string) => {
    return progress?.find((p) => p.module_id === moduleId);
  };

  const calculateProgress = () => {
    if (!modules || !progress) return { completed: 0, total: 0, percentage: 0 };
    
    const requiredModules = modules.filter(m => m.is_required);
    const completedCount = requiredModules.filter(
      m => progress.some(p => p.module_id === m.id && p.completed)
    ).length;

    return {
      completed: completedCount,
      total: requiredModules.length,
      percentage: requiredModules.length > 0 
        ? Math.round((completedCount / requiredModules.length) * 100)
        : 0,
    };
  };

  return {
    modules,
    progress,
    isLoading: modulesLoading || progressLoading,
    completeModule: completeModuleMutation.mutate,
    getModuleProgress,
    calculateProgress: calculateProgress(),
  };
};