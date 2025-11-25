import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface StaffOnlineIndicatorProps {
  isOnline: boolean;
  lastSeen?: string | null;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export const StaffOnlineIndicator = ({ 
  isOnline, 
  lastSeen, 
  size = "md",
  showLabel = false 
}: StaffOnlineIndicatorProps) => {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  const formatLastSeen = (lastSeenDate: string | null) => {
    if (!lastSeenDate) return "Never";
    
    const date = new Date(lastSeenDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getTooltipText = () => {
    if (isOnline) return "Online now";
    return `Last seen ${formatLastSeen(lastSeen)}`;
  };

  if (showLabel) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge 
              variant={isOnline ? "default" : "secondary"}
              className={cn(
                "flex items-center gap-1.5 text-xs",
                isOnline 
                  ? "bg-green-500 hover:bg-green-600 text-white" 
                  : "bg-muted text-muted-foreground"
              )}
            >
              <div className={cn(
                "rounded-full animate-pulse",
                sizeClasses[size],
                isOnline ? "bg-white" : "bg-muted-foreground"
              )} />
              {isOnline ? "Online" : "Offline"}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getTooltipText()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div 
            className={cn(
              "rounded-full border-2 border-background",
              sizeClasses[size],
              isOnline 
                ? "bg-green-500 animate-pulse shadow-lg shadow-green-500/50" 
                : "bg-gray-400"
            )}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
