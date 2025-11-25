import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Zap, RefreshCw } from "lucide-react";

export const ManualChatAssignment = () => {
  const { toast } = useToast();
  const [assigning, setAssigning] = useState(false);

  const triggerAutoAssignment = async () => {
    setAssigning(true);
    
    try {
      const { data, error } = await supabase.rpc('auto_assign_unassigned_chats');

      if (error) throw error;

      const assignedCount = data?.length || 0;
      
      toast({
        title: "Assignment Complete",
        description: `${assignedCount} chat(s) assigned to available staff members.`,
      });
    } catch (error) {
      console.error('Error auto-assigning chats:', error);
      toast({
        title: "Error",
        description: "Failed to assign chats.",
        variant: "destructive",
      });
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Card className="glass-effect border-border/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Manual Assignment Controls
        </CardTitle>
        <CardDescription>
          Manually trigger chat assignment and workload balancing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Button
            onClick={triggerAutoAssignment}
            disabled={assigning}
            className="w-full"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${assigning ? 'animate-spin' : ''}`} />
            Assign Unassigned Chats
          </Button>
          <p className="text-xs text-muted-foreground">
            Manually assign all unassigned chats to available staff members based on current workload
          </p>
        </div>

        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs">
          <strong className="text-foreground">Note:</strong> The system automatically runs these 
          operations every 2 minutes. Manual triggers are only needed for immediate action.
        </div>
      </CardContent>
    </Card>
  );
};