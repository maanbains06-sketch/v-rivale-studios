import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { CheckCircle2, Clock, XCircle, Loader2, LogOut } from "lucide-react";

const whitelistSchema = z.object({
  steamId: z.string()
    .trim()
    .min(17, "Steam ID must be at least 17 characters")
    .max(20, "Steam ID must not exceed 20 characters")
    .regex(/^STEAM_[0-5]:[01]:\d+$/, "Invalid Steam ID format (e.g., STEAM_0:1:12345678)"),
  discord: z.string()
    .trim()
    .min(2, "Discord username is required")
    .max(37, "Discord username must not exceed 37 characters"),
  age: z.string()
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 16, "Must be at least 16 years old")
    .refine((val) => !isNaN(Number(val)) && Number(val) <= 100, "Please enter a valid age"),
  experience: z.string()
    .trim()
    .min(50, "Please provide at least 50 characters about your roleplay experience")
    .max(500, "Experience description must not exceed 500 characters"),
  backstory: z.string()
    .trim()
    .min(100, "Character backstory must be at least 100 characters")
    .max(1000, "Character backstory must not exceed 1000 characters"),
});

type WhitelistFormValues = z.infer<typeof whitelistSchema>;

interface Application {
  id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at: string | null;
  admin_notes: string | null;
  steam_id: string;
  discord: string;
  age: number;
  experience: string;
  backstory: string;
}

const Whitelist = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingApplication, setExistingApplication] = useState<Application | null>(null);

  const form = useForm<WhitelistFormValues>({
    resolver: zodResolver(whitelistSchema),
    defaultValues: {
      steamId: "",
      discord: "",
      age: "",
      experience: "",
      backstory: "",
    },
  });

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          navigate("/auth");
        } else {
          // Check for existing application
          setTimeout(() => {
            checkExistingApplication(session.user.id);
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate("/auth");
      } else {
        checkExistingApplication(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkExistingApplication = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("whitelist_applications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching application:", error);
      }

      if (data) {
        setExistingApplication(data);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const onSubmit = async (data: WhitelistFormValues) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to submit an application.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("whitelist_applications")
        .insert({
          user_id: user.id,
          steam_id: data.steamId,
          discord: data.discord,
          age: parseInt(data.age),
          experience: data.experience,
          backstory: data.backstory,
          status: "pending",
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Application Submitted!",
        description: "We'll review your application within 24-48 hours and contact you on Discord.",
      });

      // Refresh the application status
      await checkExistingApplication(user.id);
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500"><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>;
      case "approved":
        return <Badge variant="outline" className="border-green-500 text-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="border-red-500 text-red-500"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-12 flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <PageHeader 
        title="Whitelist Application"
        description="Apply to join SLRP and become part of our exclusive roleplay community"
      />
      
      <main className="pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* Sign Out Button */}
            <div className="flex justify-end mb-8 animate-fade-in">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>

            {/* Existing Application Status */}
            {existingApplication && (
              <Card className="glass-effect border-border/20 mb-8 animate-fade-in">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-2">Your Application Status</h3>
                      <p className="text-sm text-muted-foreground">
                        Submitted on {new Date(existingApplication.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {getStatusBadge(existingApplication.status)}
                  </div>

                  {existingApplication.status === "pending" && (
                    <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 mt-4">
                      <p className="text-sm text-foreground">
                        Your application is currently under review. Our staff team will review it within 24-48 hours. 
                        You will be contacted on Discord: <strong>{existingApplication.discord}</strong>
                      </p>
                    </div>
                  )}

                  {existingApplication.status === "approved" && (
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 mt-4">
                      <p className="text-sm text-foreground font-semibold mb-2">
                        Congratulations! Your application has been approved.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        You can now join the server. Check your Discord for server connection details.
                      </p>
                    </div>
                  )}

                  {existingApplication.status === "rejected" && (
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 mt-4">
                      <p className="text-sm text-foreground font-semibold mb-2">
                        Your application was not approved.
                      </p>
                      {existingApplication.admin_notes && (
                        <p className="text-sm text-muted-foreground mb-2">
                          <strong>Reason:</strong> {existingApplication.admin_notes}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        You may reapply after 7 days. Please review our requirements and improve your application.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Application Form - Only show if no pending/approved application */}
            {(!existingApplication || existingApplication.status === "rejected") && (
              <div className="glass-effect rounded-xl p-8 border border-border/20 animate-fade-in">
                <div className="mb-6 p-4 glass-effect rounded-lg border border-primary/20">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-foreground/80">
                      <p className="font-semibold mb-2">Application Requirements:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Must be 16+ years old</li>
                        <li>Active Discord account required</li>
                        <li>Valid Steam ID from GTA V</li>
                        <li>Detailed roleplay experience description (min. 50 characters)</li>
                        <li>Creative character backstory (min. 100 characters)</li>
                        <li>Commitment to server rules and quality RP</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="steamId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Steam ID *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="STEAM_0:1:12345678" 
                              {...field}
                              className="bg-background/50"
                            />
                          </FormControl>
                          <FormDescription>
                            Your Steam ID in format: STEAM_0:1:12345678
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="discord"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discord Username *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="username or username#1234" 
                              {...field}
                              className="bg-background/50"
                            />
                          </FormControl>
                          <FormDescription>
                            Your Discord username - we'll contact you here
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="18" 
                              {...field}
                              className="bg-background/50"
                            />
                          </FormControl>
                          <FormDescription>
                            You must be at least 16 years old to join
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="experience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Roleplay Experience *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your previous roleplay experience, what servers you've played on, your favorite roleplay scenarios, etc. (minimum 50 characters)"
                              className="min-h-[120px] bg-background/50 resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            {field.value.length}/500 characters (minimum 50 required)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="backstory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Character Backstory *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Create a detailed backstory for your character. Include their background, personality, goals, and what brought them to Los Santos. Be creative! (minimum 100 characters)"
                              className="min-h-[180px] bg-background/50 resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            {field.value.length}/1000 characters (minimum 100 required)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="pt-4">
                      <Button
                        type="submit"
                        size="lg"
                        className="w-full bg-primary hover:bg-primary/90"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Submitting Application...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Submit Application
                          </>
                        )}
                      </Button>
                    </div>

                    <p className="text-xs text-center text-muted-foreground mt-4">
                      By submitting this application, you agree to follow all server rules and guidelines. 
                      False information may result in permanent ban.
                    </p>
                  </form>
                </Form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Whitelist;
