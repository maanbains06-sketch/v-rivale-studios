import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface FavoriteStaffButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
  variant?: "icon" | "button";
  className?: string;
}

export const FavoriteStaffButton = ({ 
  isFavorite, 
  onToggle, 
  variant = "icon",
  className 
}: FavoriteStaffButtonProps) => {
  if (variant === "button") {
    return (
      <Button
        variant={isFavorite ? "default" : "outline"}
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={cn(
          "gap-2",
          isFavorite && "bg-primary hover:bg-primary/90",
          className
        )}
      >
        <Star 
          className={cn(
            "w-4 h-4",
            isFavorite && "fill-primary-foreground"
          )} 
        />
        {isFavorite ? "Favorited" : "Add to Favorites"}
      </Button>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className={cn(
              "h-8 w-8 rounded-full hover:bg-primary/10",
              className
            )}
          >
            <Star 
              className={cn(
                "w-4 h-4 transition-all",
                isFavorite 
                  ? "fill-primary text-primary animate-pulse" 
                  : "text-muted-foreground hover:text-primary"
              )} 
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isFavorite ? "Remove from favorites" : "Add to favorites"}</p>
          <p className="text-xs text-muted-foreground">Get notified when they come online</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
