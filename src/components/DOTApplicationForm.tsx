import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, HardHat, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const dotSchema = z.object({
  real_name: z.string()
    .trim()
    .min(2, "Real name must be at least 2 characters")
    .max(100, "Real name must be less than 100 characters"),
  in_game_name: z.string()
    .trim()
    .min(2, "In-game name must be at least 2 characters")
    .max(50, "In-game name must be less than 50 characters"),
  discord_id: z.string()
    .trim()
    .min(3, "Discord ID is required")
    .max(50, "Discord ID must be less than 50 characters"),
  steam_id: z.string()
    .trim()
    .min(5, "Steam ID is required")
    .max(50, "Steam ID must be less than 50 characters"),
  weekly_availability: z.string()
    .trim()
    .min(10, "Please provide details about your weekly availability")
    .max(500, "Availability must be less than 500 characters"),
});

type DOTFormData = z.infer<typeof dotSchema>;

interface DOTApplicationFormProps {
  jobImage: string;
}

const DOTApplicationForm = ({ jobImage }: DOTApplicationFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownDays, setCooldownDays] = useState(0);
  const [checkingCooldown, setCheckingCooldown] = useState(true);

  const form = useForm<DOTFormData>({
    resolver: zodResolver(dotSchema),
    defaultValues: {
      real_name: "",
      in_game_name: "",
      discord_id: "",
      steam_id: "",
      weekly_availability: "",
    },
  });

  useEffect(() => {
    checkApplicationCooldown();
  }, []);

  const checkApplicationCooldown = async () => {
    setCheckingCooldown(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setCheckingCooldown(false);
        return;
      }

      // Check for existing applications in the last 10 days
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

      const { data: recentApps } = await supabase
        .from("dot_applications")
        .select("created_at")
        .eq("user_id", user.id)
        .gte("created_at", tenDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(1);

      if (recentApps && recentApps.length > 0) {
        const lastAppDate = new Date(recentApps[0].created_at);
        const daysSinceLastApp = Math.floor((Date.now() - lastAppDate.getTime()) / (1000 * 60 * 60 * 24));
        const remainingDays = 10 - daysSinceLastApp;
        
        if (remainingDays > 0) {
          setCooldownActive(true);
          setCooldownDays(remainingDays);
        }
      }
    } catch (error) {
      console.error("Error checking cooldown:", error);
    } finally {
      setCheckingCooldown(false);
    }
  };

  const onSubmit = async (data: DOTFormData) => {
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to submit a DOT application.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("dot_applications")
        .insert({
          ...data,
          user_id: user.id,
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Application Submitted",
        description: "Your DOT application has been submitted successfully. We'll review it soon!",
      });

      form.reset();
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingCooldown) {
    return (
      <Card className="glass-effect border-border/20">
        <CardContent className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (cooldownActive) {
    return (
      <div className="space-y-6">
        {/* Job Header with Image */}
        <div className="relative rounded-2xl overflow-hidden h-64 group">
          <img 
            src={jobImage} 
            alt="DOT Career"
            className="w-full h-full object-cover object-center opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 rounded-xl bg-amber-500/20 backdrop-blur-sm">
                <HardHat className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-1">DOT Application</h2>
                <p className="text-muted-foreground">Join the Department of Transportation</p>
              </div>
            </div>
          </div>
        </div>
        
        <Card className="glass-effect border-border/20">
          <CardContent className="pt-6">
            <Alert className="border-border/20">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Application Cooldown Active</AlertTitle>
              <AlertDescription>
                You have recently submitted a DOT application. 
                Please wait {cooldownDays} more day{cooldownDays !== 1 ? 's' : ''} before submitting another application.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Job Header with Image */}
      <div className="relative rounded-2xl overflow-hidden h-64 group">
        <img 
          src={jobImage} 
          alt="DOT Career"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 rounded-xl bg-amber-500/20 backdrop-blur-sm">
              <HardHat className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-1">DOT Application</h2>
              <p className="text-muted-foreground">Join the Department of Transportation and serve the city</p>
            </div>
          </div>
        </div>
      </div>

      <Card className="glass-effect border-border/20">
        <CardContent className="pt-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="real_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Real Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="in_game_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>In-Game Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John_Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="discord_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discord ID *</FormLabel>
                      <FormControl>
                        <Input placeholder="username#1234 or username" {...field} />
                      </FormControl>
                      <FormDescription>
                        Your Discord username for contact
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="steam_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Steam ID *</FormLabel>
                      <FormControl>
                        <Input placeholder="STEAM_0:1:12345678" {...field} />
                      </FormControl>
                      <FormDescription>
                        Your Steam identifier
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="weekly_availability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weekly Availability *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Example: Monday-Friday 6PM-11PM IST, weekends 12PM-12AM IST. Approximately 20-30 hours per week..."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      How much time can you dedicate to this job weekly? Include days, hours, and timezone.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full bg-amber-500 hover:bg-amber-600"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <HardHat className="mr-2 h-4 w-4" />
                    Submit DOT Application
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DOTApplicationForm;
