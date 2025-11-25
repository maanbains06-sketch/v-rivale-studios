import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";
import { MessageCircle, FileCheck, Settings, LogIn, LogOut, Activity } from "lucide-react";

interface ActivityLog {
  id: string;
  staff_user_id: string;
  action_type: string;
  action_description: string;
  related_id: string | null;
  related_type: string | null;
  metadata: any;
  created_at: string;
}

interface StaffActivityLogProps {
  staffUserId?: string;
  limit?: number;
  showTitle?: boolean;
}

const StaffActivityLog = ({ staffUserId, limit = 20, showTitle = true }: StaffActivityLogProps) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
    setupRealtimeSubscription();
  }, [staffUserId]);

  const fetchActivities = async () => {
    try {
      let query = supabase
        .from("staff_activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (staffUserId) {
        query = query.eq("staff_user_id", staffUserId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel("staff-activity-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "staff_activity_log",
          filter: staffUserId ? `staff_user_id=eq.${staffUserId}` : undefined,
        },
        (payload) => {
          setActivities((prev) => [payload.new as ActivityLog, ...prev.slice(0, limit - 1)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "chat_response":
        return <MessageCircle className="h-4 w-4" />;
      case "application_review":
        return <FileCheck className="h-4 w-4" />;
      case "status_change":
        return <Settings className="h-4 w-4" />;
      case "login":
        return <LogIn className="h-4 w-4" />;
      case "logout":
        return <LogOut className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case "chat_response":
        return "bg-blue-500/10 text-blue-500";
      case "application_review":
        return "bg-green-500/10 text-green-500";
      case "status_change":
        return "bg-yellow-500/10 text-yellow-500";
      case "login":
        return "bg-purple-500/10 text-purple-500";
      case "logout":
        return "bg-gray-500/10 text-gray-500";
      default:
        return "bg-accent text-foreground";
    }
  };

  if (loading) {
    return (
      <Card className="glass-effect border-border/20">
        {showTitle && (
          <CardHeader>
            <CardTitle className="text-lg">Activity Log</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect border-border/20">
      {showTitle && (
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {activities.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No recent activity</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {activities.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${getActionColor(activity.action_type)}`}>
                      {getActionIcon(activity.action_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {activity.action_description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {activity.action_type.replace("_", " ")}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      {activity.metadata && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {JSON.stringify(activity.metadata)}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(activity.created_at), "MMM d, HH:mm")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default StaffActivityLog;
