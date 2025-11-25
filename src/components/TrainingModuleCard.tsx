import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, FileText, Video, Code, CheckCircle2, Circle } from "lucide-react";
import { TrainingModule, TrainingProgress } from "@/hooks/useStaffTraining";

interface TrainingModuleCardProps {
  module: TrainingModule;
  progress?: TrainingProgress;
  onComplete: (moduleId: string) => void;
  onViewDetails: (module: TrainingModule) => void;
}

export const TrainingModuleCard = ({ 
  module, 
  progress, 
  onComplete,
  onViewDetails 
}: TrainingModuleCardProps) => {
  const isCompleted = progress?.completed || false;

  const getModuleIcon = () => {
    switch (module.module_type) {
      case "video":
        return <Video className="h-5 w-5" />;
      case "document":
        return <FileText className="h-5 w-5" />;
      case "quiz":
        return <CheckCircle2 className="h-5 w-5" />;
      case "interactive":
        return <Code className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <Card className={`transition-all hover:shadow-lg ${isCompleted ? "border-green-500/50 bg-green-50/5" : ""}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className={`p-2 rounded-lg ${isCompleted ? "bg-green-500/10 text-green-500" : "bg-primary/10 text-primary"}`}>
              {getModuleIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg mb-2 flex items-center gap-2">
                {module.title}
                {module.is_required && (
                  <Badge variant="outline" className="text-xs">Required</Badge>
                )}
              </CardTitle>
              <CardDescription>{module.description}</CardDescription>
            </div>
          </div>
          {isCompleted ? (
            <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
          ) : (
            <Circle className="h-6 w-6 text-muted-foreground flex-shrink-0" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {module.duration_minutes && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{module.duration_minutes} minutes</span>
          </div>
        )}

        {progress?.score && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Score</span>
              <span className="font-medium">{progress.score}%</span>
            </div>
            <Progress value={progress.score} className="h-2" />
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onViewDetails(module)}
          >
            View Module
          </Button>
          {!isCompleted && (
            <Button
              className="flex-1"
              onClick={() => onComplete(module.id)}
            >
              Mark Complete
            </Button>
          )}
        </div>

        {progress?.completed_at && (
          <p className="text-xs text-muted-foreground text-center">
            Completed on {new Date(progress.completed_at).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
};