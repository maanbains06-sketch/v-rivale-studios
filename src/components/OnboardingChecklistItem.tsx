import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { OnboardingChecklistItem as ChecklistItem, OnboardingProgress } from "@/hooks/useStaffOnboarding";
import { CheckCircle2, Circle } from "lucide-react";

interface OnboardingChecklistItemProps {
  item: ChecklistItem;
  progress?: OnboardingProgress;
  onToggle: (itemId: string, completed: boolean) => void;
}

export const OnboardingChecklistItemComponent = ({ 
  item, 
  progress, 
  onToggle 
}: OnboardingChecklistItemProps) => {
  const isCompleted = progress?.completed || false;

  const getCategoryColor = (category: ChecklistItem['category']) => {
    const colors = {
      setup: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      training: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      documentation: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      team: "bg-green-500/10 text-green-500 border-green-500/20",
      tools: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    };
    return colors[category];
  };

  return (
    <Card className={`transition-all hover:shadow-md ${isCompleted ? "border-green-500/50 bg-green-50/5" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Checkbox
            checked={isCompleted}
            onCheckedChange={(checked) => onToggle(item.id, checked as boolean)}
            className="mt-1"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h4 className={`font-medium ${isCompleted ? "text-muted-foreground line-through" : ""}`}>
                {item.title}
              </h4>
              {item.is_required && (
                <Badge variant="outline" className="text-xs">Required</Badge>
              )}
              <Badge className={`text-xs ${getCategoryColor(item.category)}`}>
                {item.category}
              </Badge>
            </div>
            <p className={`text-sm ${isCompleted ? "text-muted-foreground" : "text-muted-foreground"}`}>
              {item.description}
            </p>
            {progress?.completed_at && (
              <p className="text-xs text-muted-foreground mt-2">
                Completed on {new Date(progress.completed_at).toLocaleDateString()}
              </p>
            )}
          </div>
          {isCompleted ? (
            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          )}
        </div>
      </CardContent>
    </Card>
  );
};