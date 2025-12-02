import { useState } from "react";
import DOMPurify from "dompurify";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TrainingModuleCard } from "@/components/TrainingModuleCard";
import { OnboardingChecklistItemComponent } from "@/components/OnboardingChecklistItem";
import { useStaffTraining, TrainingModule } from "@/hooks/useStaffTraining";
import { useStaffOnboarding } from "@/hooks/useStaffOnboarding";
import { GraduationCap, CheckSquare, Award, Loader2 } from "lucide-react";

const StaffOnboarding = () => {
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);
  const training = useStaffTraining();
  const onboarding = useStaffOnboarding();

  if (training.isLoading || onboarding.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[80vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const overallProgress = Math.round(
    ((training.calculateProgress.percentage + onboarding.calculateProgress.percentage) / 2)
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Staff Onboarding</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Welcome to the team! Complete your training and onboarding checklist to get started.
          </p>
        </div>

        {/* Overall Progress */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Overall Progress
                </CardTitle>
                <CardDescription>
                  Complete all required items to finish your onboarding
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-lg px-4 py-2">
                {overallProgress}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={overallProgress} className="h-3" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Training Modules</span>
                  <span className="font-medium">
                    {training.calculateProgress.completed} / {training.calculateProgress.total}
                  </span>
                </div>
                <Progress value={training.calculateProgress.percentage} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Onboarding Tasks</span>
                  <span className="font-medium">
                    {onboarding.calculateProgress.completed} / {onboarding.calculateProgress.total}
                  </span>
                </div>
                <Progress value={onboarding.calculateProgress.percentage} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="training" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="training" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Training
            </TabsTrigger>
            <TabsTrigger value="checklist" className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Checklist
            </TabsTrigger>
          </TabsList>

          <TabsContent value="training" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {training.modules?.map((module) => (
                <TrainingModuleCard
                  key={module.id}
                  module={module}
                  progress={training.getModuleProgress(module.id)}
                  onComplete={() => training.completeModule({ moduleId: module.id })}
                  onViewDetails={setSelectedModule}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="checklist" className="space-y-6">
            {["setup", "training", "documentation", "team", "tools"].map((category) => {
              const items = onboarding.getItemsByCategory(category as any);
              if (items.length === 0) return null;

              return (
                <div key={category} className="space-y-4">
                  <h3 className="text-xl font-semibold capitalize">{category}</h3>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <OnboardingChecklistItemComponent
                        key={item.id}
                        item={item}
                        progress={onboarding.getItemProgress(item.id)}
                        onToggle={(itemId, completed) => 
                          onboarding.toggleItem({ itemId, completed })
                        }
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </TabsContent>
        </Tabs>

        {/* Module Detail Dialog */}
        <Dialog open={!!selectedModule} onOpenChange={() => setSelectedModule(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedModule?.title}</DialogTitle>
              <DialogDescription>{selectedModule?.description}</DialogDescription>
            </DialogHeader>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedModule?.content || "") }} />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default StaffOnboarding;