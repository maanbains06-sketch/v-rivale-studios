import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Eye, MessageCircle } from "lucide-react";

interface ActiveViewer {
  userId: string;
  discordId: string | null;
  discordUsername: string | null;
  discordAvatar: string | null;
  isStaff?: boolean;
}

interface ActiveStaffIndicatorProps {
  viewers: ActiveViewer[];
  type: 'ticket' | 'chat';
  compact?: boolean;
}

const ActiveStaffIndicator = ({ viewers, type, compact = false }: ActiveStaffIndicatorProps) => {
  if (viewers.length === 0) return null;

  const getAvatarUrl = (viewer: ActiveViewer) => {
    if (viewer.discordAvatar && viewer.discordId) {
      // Handle full URL or just hash
      if (viewer.discordAvatar.startsWith('http')) {
        return viewer.discordAvatar;
      }
      return `https://cdn.discordapp.com/avatars/${viewer.discordId}/${viewer.discordAvatar}.png`;
    }
    return null;
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              <div className="flex -space-x-2">
                {viewers.slice(0, 3).map((viewer, idx) => (
                  <Avatar key={viewer.userId} className="h-5 w-5 border-2 border-background ring-2 ring-green-500/50">
                    <AvatarImage src={getAvatarUrl(viewer) || undefined} />
                    <AvatarFallback className="text-[8px] bg-green-500/20 text-green-400">
                      {getInitials(viewer.discordUsername)}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              {viewers.length > 3 && (
                <span className="text-xs text-green-400 font-medium">+{viewers.length - 3}</span>
              )}
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-semibold text-xs flex items-center gap-1.5">
                {type === 'ticket' ? <Eye className="w-3 h-3" /> : <MessageCircle className="w-3 h-3" />}
                Staff Currently {type === 'ticket' ? 'Viewing' : 'Chatting'}:
              </p>
              {viewers.map((viewer) => (
                <p key={viewer.userId} className="text-xs text-muted-foreground">
                  • {viewer.discordUsername || 'Unknown Staff'}
                </p>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 backdrop-blur-sm">
      <div className="flex -space-x-2">
        {viewers.slice(0, 3).map((viewer) => (
          <TooltipProvider key={viewer.userId}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-6 w-6 border-2 border-background ring-2 ring-green-500/50 cursor-pointer hover:ring-green-400 transition-all">
                  <AvatarImage src={getAvatarUrl(viewer) || undefined} />
                  <AvatarFallback className="text-[10px] bg-green-500/20 text-green-400">
                    {getInitials(viewer.discordUsername)}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs font-medium">{viewer.discordUsername || 'Unknown Staff'}</p>
                <p className="text-xs text-muted-foreground">
                  {type === 'ticket' ? 'Viewing this ticket' : 'In this chat'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
      
      {viewers.length > 3 && (
        <span className="text-xs text-green-400 font-medium">+{viewers.length - 3} more</span>
      )}
      
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
        <span className="text-xs font-medium text-green-400">
          {type === 'ticket' ? 'Staff Viewing' : 'Staff Active'}
        </span>
      </div>
    </div>
  );
};

export default ActiveStaffIndicator;
