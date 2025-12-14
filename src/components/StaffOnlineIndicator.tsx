import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface StaffOnlineIndicatorProps {
  isOnline: boolean;
  lastSeen?: string | null;
  status?: string; // online, idle, dnd, offline, unknown
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const statusConfig = {
  online: {
    color: "bg-green-500",
    shadow: "shadow-green-500/50",
    badgeBg: "bg-green-500 hover:bg-green-600",
    label: "Online",
    dotColor: "bg-white",
  },
  idle: {
    color: "bg-yellow-500",
    shadow: "shadow-yellow-500/50",
    badgeBg: "bg-yellow-500 hover:bg-yellow-600",
    label: "Idle",
    dotColor: "bg-white",
  },
  dnd: {
    color: "bg-red-500",
    shadow: "shadow-red-500/50",
    badgeBg: "bg-red-500 hover:bg-red-600",
    label: "Do Not Disturb",
    dotColor: "bg-white",
  },
  offline: {
    color: "bg-gray-400",
    shadow: "",
    badgeBg: "bg-muted",
    label: "Offline",
    dotColor: "bg-muted-foreground",
  },
  unknown: {
    color: "bg-gray-400",
    shadow: "",
    badgeBg: "bg-muted",
    label: "Unknown",
    dotColor: "bg-muted-foreground",
  },
};

export const StaffOnlineIndicator = ({ 
  isOnline, 
  lastSeen,
  status = isOnline ? "online" : "offline",
  size = "md",
  showLabel = false 
}: StaffOnlineIndicatorProps) => {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  // Normalize status - if online but status is 'unknown', treat as online
  const normalizedStatus = isOnline && status === 'offline' ? 'online' : 
                          !isOnline && status === 'online' ? 'offline' : 
                          status;
  
  const config = statusConfig[normalizedStatus as keyof typeof statusConfig] || statusConfig.offline;

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
    if (isOnline) {
      if (normalizedStatus === 'idle') return "Away / Idle";
      if (normalizedStatus === 'dnd') return "Do Not Disturb";
      return "Online now (Discord)";
    }
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
                  ? `${config.badgeBg} text-white` 
                  : "bg-muted text-muted-foreground"
              )}
            >
              <div className={cn(
                "rounded-full",
                sizeClasses[size],
                isOnline ? `${config.dotColor} animate-pulse` : config.dotColor
              )} />
              {config.label}
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
              config.color,
              isOnline && "animate-pulse shadow-lg",
              isOnline && config.shadow
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