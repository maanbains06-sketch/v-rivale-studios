import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useApplicationToggles, ALL_TOGGLE_KEYS, TOGGLE_LABELS } from "@/hooks/useApplicationToggles";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ToggleLeft } from "lucide-react";
import { Label } from "@/components/ui/label";

const ApplicationToggleManager = () => {
  const { toggles, loading, updateToggle } = useApplicationToggles();
  const { toast } = useToast();

  const handleToggle = async (key: typeof ALL_TOGGLE_KEYS[number], enabled: boolean) => {
    const success = await updateToggle(key, enabled);
    if (success) {
      toast({
        title: enabled ? "Application Opened" : "Application Closed",
        description: `${TOGGLE_LABELS[key]} is now ${enabled ? 'open' : 'closed'} for users.`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update application toggle.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ToggleLeft className="w-5 h-5" />
          Application Toggles
        </CardTitle>
        <CardDescription>
          Enable or disable applications. When disabled, users will see a "closed" message instead of the form.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_TOGGLE_KEYS.map((key) => (
            <div
              key={key}
              className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <Label htmlFor={`toggle-${key}`} className="text-sm font-medium cursor-pointer flex-1 pr-3">
                {TOGGLE_LABELS[key]}
              </Label>
              <Switch
                id={`toggle-${key}`}
                checked={toggles[key]}
                onCheckedChange={(checked) => handleToggle(key, checked)}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ApplicationToggleManager;
