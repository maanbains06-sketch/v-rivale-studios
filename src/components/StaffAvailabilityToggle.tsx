import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const StaffAvailabilityToggle = () => {
  const [isAvailable, setIsAvailable] = useState(true);
  const [maxChats, setMaxChats] = useState(5);
  const [currentWorkload, setCurrentWorkload] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("staff_availability")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setIsAvailable(data.is_available);
      setMaxChats(data.max_concurrent_chats);
      setCurrentWorkload(data.current_workload);
    } else {
      // Create initial availability record
      await supabase.from("staff_availability").insert({
        user_id: user.id,
        is_available: true,
        max_concurrent_chats: 5,
      });
    }
  };

  const toggleAvailability = async (checked: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("staff_availability")
      .upsert({
        user_id: user.id,
        is_available: checked,
        max_concurrent_chats: maxChats,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update availability",
        variant: "destructive",
      });
      return;
    }

    setIsAvailable(checked);
    toast({
      title: "Availability Updated",
      description: `You are now ${checked ? "available" : "unavailable"} for chat assignments`,
    });
  };

  const updateMaxChats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("staff_availability")
      .update({ max_concurrent_chats: maxChats })
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update max chats",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Updated",
      description: `Maximum concurrent chats set to ${maxChats}`,
    });
  };

  return (
    <Card className="glass-effect border-border/20">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="availability">Available for Chat Assignment</Label>
            <Switch
              id="availability"
              checked={isAvailable}
              onCheckedChange={toggleAvailability}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-chats">Maximum Concurrent Chats</Label>
            <div className="flex gap-2">
              <Input
                id="max-chats"
                type="number"
                min="1"
                max="20"
                value={maxChats}
                onChange={(e) => setMaxChats(parseInt(e.target.value))}
                className="w-24"
              />
              <Button onClick={updateMaxChats} variant="outline" size="sm">
                Update
              </Button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Current workload: {currentWorkload} / {maxChats} chats
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
