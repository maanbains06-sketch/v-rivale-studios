import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import headerWhitelist from "@/assets/header-whitelist.jpg";
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
import { CheckCircle2, Clock, XCircle, Loader2, LogOut, Timer, Save, FileText, Mail } from "lucide-react";
import { differenceInDays, differenceInHours, differenceInMinutes, addDays } from "date-fns";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import ApplicationsPausedAlert from "@/components/ApplicationsPausedAlert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const whitelistSchema = z.object({
  discord: z.string()
    .trim()
    .min(2, "Discord username is required")
    .max(37, "Discord username must not exceed 37 characters"),
  discordId: z.string()
    .trim()
    .max(20, "Discord ID must not exceed 20 characters")
    .optional(),
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
  status: "pending" | "approved" | "rejected" | "on_hold" | "closed";
  created_at: string;
  reviewed_at: string | null;
  admin_notes: string | null;
  discord: string;
  age: number;
  experience: string;
  backstory: string;
}

interface ApplicationDraft {
  id: string;
  discord: string | null;
  age: number | null;
  experience: string | null;
  backstory: string | null;
  updated_at: string;
}

const Whitelist = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingApplication, setExistingApplication] = useState<Application | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [savingDraft, setSavingDraft] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [existingDraft, setExistingDraft] = useState<ApplicationDraft | null>(null);
  const [showLoadDraftDialog, setShowLoadDraftDialog] = useState(false);
  
  const { settings: siteSettings, loading: settingsLoading } = useSiteSettings();

  const form = useForm<WhitelistFormValues>({
    resolver: zodResolver(whitelistSchema),
    defaultValues: {
      discord: "",
      discordId: "",
      age: "",
      experience: "",
      backstory: "",
    },
  });

  useEffect(() => {
    const checkAuth = async (session: Session | null) => {
      if (session?.user) {
        // Check for existing application
        setTimeout(() => {
          checkExistingApplication(session.user.id);
          checkExistingDraft(session.user.id);
        }, 0);
      } else {
        navigate("/auth");
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        checkAuth(session);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      checkAuth(session);
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  // Update current time every minute for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

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

  const checkExistingDraft = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("whitelist_application_drafts")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching draft:", error);
      }

      if (data) {
        setExistingDraft(data);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const saveDraft = async () => {
    if (!user) return;

    setSavingDraft(true);
    const formValues = form.getValues();

    try {
      const draftData = {
        user_id: user.id,
        discord: formValues.discord || null,
        age: formValues.age ? parseInt(formValues.age) : null,
        experience: formValues.experience || null,
        backstory: formValues.backstory || null,
      };

      // Check if draft exists
      if (existingDraft) {
        // Update existing draft
        const { error } = await supabase
          .from("whitelist_application_drafts")
          .update(draftData)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Insert new draft
        const { error } = await supabase
          .from("whitelist_application_drafts")
          .insert(draftData);

        if (error) throw error;
      }

      toast({
        title: "Draft Saved",
        description: "Your application draft has been saved successfully.",
      });

      // Refresh draft data
      await checkExistingDraft(user.id);
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save draft. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingDraft(false);
    }
  };

  const loadDraft = () => {
    if (!existingDraft) return;

    form.setValue("discord", existingDraft.discord || "");
    form.setValue("age", existingDraft.age ? existingDraft.age.toString() : "");
    form.setValue("experience", existingDraft.experience || "");
    form.setValue("backstory", existingDraft.backstory || "");

    setShowLoadDraftDialog(false);
    toast({
      title: "Draft Loaded",
      description: "Your saved draft has been loaded into the form.",
    });
  };

  const deleteDraft = async () => {
    if (!user || !existingDraft) return;

    try {
      const { error } = await supabase
        .from("whitelist_application_drafts")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      setExistingDraft(null);
      toast({
        title: "Draft Deleted",
        description: "Your application draft has been deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete draft.",
        variant: "destructive",
      });
    }
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
          discord: data.discord,
          discord_id: data.discordId || null,
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
      
      // Delete draft after successful submission
      if (existingDraft) {
        await deleteDraft();
      }

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

  // Calculate reapplication eligibility for rejected applications
  const reapplicationInfo = useMemo(() => {
    if (!existingApplication || existingApplication.status !== "rejected") {
      return null;
    }

    const rejectionDate = new Date(existingApplication.reviewed_at || existingApplication.created_at);
    const reapplyDate = addDays(rejectionDate, 1);
    const now = currentTime;

    const canReapply = now >= reapplyDate;
    
    if (canReapply) {
      return { canReapply: true, timeRemaining: null };
    }

    const daysLeft = differenceInDays(reapplyDate, now);
    const hoursLeft = differenceInHours(reapplyDate, now) % 24;
    const minutesLeft = differenceInMinutes(reapplyDate, now) % 60;

    return {
      canReapply: false,
      timeRemaining: { days: daysLeft, hours: hoursLeft, minutes: minutesLeft },
      reapplyDate
    };
  }, [existingApplication, currentTime]);

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

  if (loading || settingsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-12 flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Show paused message if applications are paused and user has no existing application
  if (siteSettings.applications_paused && !existingApplication) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <PageHeader 
          title="Whitelist Application"
          description="Apply to join SLRP and become part of our exclusive roleplay community"
          backgroundImage={headerWhitelist}
        />
        <main className="pb-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <ApplicationsPausedAlert variant="card" applicationType="Whitelist Applications" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <PageHeader 
        title="Whitelist Application"
        description="Apply to join SLRP and become part of our exclusive roleplay community"
        backgroundImage={headerWhitelist}
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

            {/* Application Response Header */}
            {existingApplication && (
              <div className="mb-8 animate-fade-in">
                {/* Status Header */}
                {existingApplication.status === "approved" && (
                  <div className="glass-effect rounded-xl p-8 border-2 border-green-500/50 bg-green-500/5">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 rounded-full bg-green-500/20">
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-green-500 mb-1">Application Approved!</h2>
                        <p className="text-sm text-muted-foreground">
                          Reviewed on {existingApplication.reviewed_at ? new Date(existingApplication.reviewed_at).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                      {getStatusBadge(existingApplication.status)}
                    </div>
                    
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                        <p className="text-foreground font-semibold mb-3">
                          🎉 Congratulations! Welcome to SLRP!
                        </p>
                        <p className="text-sm text-muted-foreground mb-2">
                          Your whitelist application has been approved by our staff team. You can now join our server and start your roleplay journey.
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <strong>Next Steps:</strong> Check your Discord (<strong>{existingApplication.discord}</strong>) for server connection details and community guidelines.
                        </p>
                      </div>
                      
                      {existingApplication.admin_notes && (
                        <div className="p-4 rounded-lg bg-background/50 border border-border/20">
                          <p className="text-xs text-muted-foreground mb-1 font-semibold">Admin Note:</p>
                          <p className="text-sm text-foreground">{existingApplication.admin_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {existingApplication.status === "rejected" && (
                  <div className="glass-effect rounded-xl p-8 border-2 border-red-500/50 bg-red-500/5">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 rounded-full bg-red-500/20">
                        <XCircle className="w-8 h-8 text-red-500" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-red-500 mb-1">Application Rejected</h2>
                        <p className="text-sm text-muted-foreground">
                          Reviewed on {existingApplication.reviewed_at ? new Date(existingApplication.reviewed_at).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                      {getStatusBadge(existingApplication.status)}
                    </div>
                    
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                        <p className="text-foreground font-semibold mb-3">
                          Your application was not approved at this time.
                        </p>
                        {existingApplication.admin_notes && (
                          <div className="mb-3">
                            <p className="text-sm text-muted-foreground mb-2">
                              <strong>Rejection Reason:</strong>
                            </p>
                            <p className="text-sm text-foreground bg-background/50 p-3 rounded border border-border/20">
                              {existingApplication.admin_notes}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Reapplication Countdown Timer */}
                      {reapplicationInfo && !reapplicationInfo.canReapply && reapplicationInfo.timeRemaining && (
                        <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                          <div className="flex items-start gap-3">
                            <Timer className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-foreground font-semibold mb-2">
                                Reapplication Waiting Period
                              </p>
                              <div className="flex items-center gap-4 mb-3">
                                <div className="flex-1 grid grid-cols-3 gap-2">
                                  <div className="text-center p-3 rounded-lg bg-background/50 border border-border/20">
                                    <div className="text-2xl font-bold text-orange-500">
                                      {reapplicationInfo.timeRemaining.days}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">Days</div>
                                  </div>
                                  <div className="text-center p-3 rounded-lg bg-background/50 border border-border/20">
                                    <div className="text-2xl font-bold text-orange-500">
                                      {reapplicationInfo.timeRemaining.hours}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">Hours</div>
                                  </div>
                                  <div className="text-center p-3 rounded-lg bg-background/50 border border-border/20">
                                    <div className="text-2xl font-bold text-orange-500">
                                      {reapplicationInfo.timeRemaining.minutes}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">Minutes</div>
                                  </div>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                You can submit a new application on{" "}
                                <strong className="text-foreground">
                                  {reapplicationInfo.reapplyDate?.toLocaleDateString()} at{" "}
                                  {reapplicationInfo.reapplyDate?.toLocaleTimeString()}
                                </strong>
                              </p>
                              <div className="flex items-center gap-2 mt-3 p-2 rounded bg-blue-500/5 border border-blue-500/10">
                                <Mail className="w-4 h-4 text-blue-500" />
                                <p className="text-xs text-muted-foreground">
                                  You'll receive an email notification at <strong>{existingApplication.discord}</strong> when the waiting period ends.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {reapplicationInfo && reapplicationInfo.canReapply && (
                        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                          <p className="text-sm text-foreground">
                            ✅ <strong>You can now reapply!</strong> The 7-day waiting period has ended. Please review the rejection reason and submit a new application below.
                          </p>
                        </div>
                      )}
                      
                      <div className="p-4 rounded-lg bg-background/50 border border-border/20">
                        <p className="text-xs text-muted-foreground mb-2 font-semibold">Tips for Reapplication:</p>
                        <ul className="text-sm text-foreground space-y-1 list-disc list-inside">
                          <li>Address the issues mentioned in the rejection reason</li>
                          <li>Provide more detailed roleplay experience</li>
                          <li>Create a more comprehensive character backstory</li>
                          <li>Review our server rules and guidelines</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {existingApplication.status === "pending" && (
                  <div className="glass-effect rounded-xl p-8 border-2 border-yellow-500/50 bg-yellow-500/5">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 rounded-full bg-yellow-500/20">
                        <Clock className="w-8 h-8 text-yellow-500" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-yellow-500 mb-1">Application Under Review</h2>
                        <p className="text-sm text-muted-foreground">
                          Submitted on {new Date(existingApplication.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {getStatusBadge(existingApplication.status)}
                    </div>
                    
                    <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <p className="text-foreground font-semibold mb-3">
                        Your application is currently being reviewed by our staff team.
                      </p>
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Review Time:</strong> Applications are typically reviewed within 24-48 hours.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Contact:</strong> You will be contacted on Discord at <strong>{existingApplication.discord}</strong> once a decision is made.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Application Form - Only show if no pending/approved application AND reapplication period has passed */}
            {(!existingApplication || (existingApplication.status === "rejected" && reapplicationInfo?.canReapply)) && (
              <div className="glass-effect rounded-xl p-8 border border-border/20 animate-fade-in">
                <div className="mb-6 p-4 glass-effect rounded-lg border border-primary/20">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-foreground/80">
                      <p className="font-semibold mb-2">Application Requirements:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Must be 16+ years old</li>
                        <li>Active Discord account required</li>
                        <li>Detailed roleplay experience description (min. 50 characters)</li>
                        <li>Creative character backstory (min. 100 characters)</li>
                        <li>Commitment to server rules and quality RP</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
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
                        name="discordId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Discord ID</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., 123456789012345678" 
                                {...field}
                                className="bg-background/50"
                              />
                            </FormControl>
                            <FormDescription>
                              Your 18-digit Discord ID (optional)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

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


                    <div className="pt-4 flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className="flex-1"
                        onClick={saveDraft}
                        disabled={savingDraft || submitting}
                      >
                        {savingDraft ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Draft
                          </>
                        )}
                      </Button>
                      <Button
                        type="submit"
                        size="lg"
                        className="flex-1 bg-primary hover:bg-primary/90"
                        disabled={submitting || savingDraft}
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

      {/* Load Draft Confirmation Dialog */}
      <AlertDialog open={showLoadDraftDialog} onOpenChange={setShowLoadDraftDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Load Saved Draft?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace any information you've currently entered in the form with your saved draft.
              Any unsaved changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={loadDraft}>Load Draft</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Whitelist;
