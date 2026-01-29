import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SmilePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactionCount } from "@/hooks/useGalleryReactions";

// Discord-style emoji set
const EMOJI_OPTIONS = [
  "❤️", "👍", "👎", "😂", "😍", "🔥", "👏", "🎉",
  "😮", "😢", "😡", "🤔", "👀", "💯", "✨", "🚀",
  "💪", "🙌", "😎", "🤩", "💀", "🥳", "😱", "🤯"
];

interface GalleryReactionPickerProps {
  reactions: ReactionCount[];
  onReact: (emoji: string) => void;
  loading?: boolean;
  variant?: "card" | "viewer";
}

export const GalleryReactionPicker = ({
  reactions,
  onReact,
  loading = false,
  variant = "card"
}: GalleryReactionPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleEmojiClick = (emoji: string) => {
    onReact(emoji);
    setIsOpen(false);
  };

  const handleExistingReactionClick = (e: React.MouseEvent, emoji: string) => {
    e.stopPropagation();
    onReact(emoji);
  };

  return (
    <div className="flex items-center gap-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
      {/* Existing reactions */}
      {reactions.map((reaction) => (
        <Button
          key={reaction.emoji}
          variant="ghost"
          size="sm"
          disabled={loading}
          onClick={(e) => handleExistingReactionClick(e, reaction.emoji)}
          className={cn(
            "h-7 px-2 gap-1 text-xs rounded-full transition-all",
            reaction.hasReacted
              ? "bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30"
              : "bg-muted/50 hover:bg-muted text-muted-foreground",
            variant === "viewer" && "bg-white/10 hover:bg-white/20 text-white border-white/20"
          )}
        >
          <span className="text-sm">{reaction.emoji}</span>
          <span>{reaction.count}</span>
        </Button>
      ))}

      {/* Add reaction button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={loading}
            className={cn(
              "h-7 w-7 p-0 rounded-full",
              variant === "viewer"
                ? "text-white/70 hover:text-white hover:bg-white/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <SmilePlus className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[280px] p-2" 
          align="start"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="grid grid-cols-8 gap-1">
            {EMOJI_OPTIONS.map((emoji) => {
              const existingReaction = reactions.find(r => r.emoji === emoji);
              return (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEmojiClick(emoji)}
                  className={cn(
                    "h-8 w-8 p-0 text-lg hover:bg-muted hover:scale-125 transition-transform",
                    existingReaction?.hasReacted && "bg-primary/20"
                  )}
                >
                  {emoji}
                </Button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

