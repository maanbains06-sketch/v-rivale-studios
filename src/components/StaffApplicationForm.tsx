import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import headerStaff from "@/assets/header-staff.jpg";

const staffApplicationSchema = z.object({
  fullName: z.string()
    .trim()
    .min(2, { message: "Full name must be at least 2 characters" })
    .max(100, { message: "Full name must be less than 100 characters" }),
  age: z.string()
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 18 && Number(val) <= 100, {
      message: "Age must be between 18 and 100"
    }),
  discordUsername: z.string()
    .trim()
    .min(3, { message: "Discord username is required" })
    .max(50, { message: "Discord username must be less than 50 characters" })
    .regex(/^.{2,32}#\d{4}$|^[a-z0-9._]{2,32}$/, { 
      message: "Please enter a valid Discord username (e.g., username#1234 or username)" 
    }),
  inGameName: z.string()
    .trim()
    .min(2, { message: "In-game name must be at least 2 characters" })
    .max(50, { message: "In-game name must be less than 50 characters" }),
  position: z.string().min(1, { message: "Please select a position" }),
  playtime: z.string()
    .trim()
    .min(1, { message: "Please specify your playtime" })
    .max(200, { message: "Playtime description must be less than 200 characters" }),
  experience: z.string()
    .trim()
    .min(50, { message: "Please provide at least 50 characters about your experience" })
    .max(1000, { message: "Experience must be less than 1000 characters" }),
  whyJoin: z.string()
    .trim()
    .min(50, { message: "Please provide at least 50 characters about why you want to join" })
    .max(1000, { message: "Reason must be less than 1000 characters" }),
  availability: z.string()
    .trim()
    .min(10, { message: "Please provide details about your availability" })
    .max(500, { message: "Availability must be less than 500 characters" }),
  previousExperience: z.string()
    .trim()
    .max(1000, { message: "Previous experience must be less than 1000 characters" })
    .optional(),
});

type StaffApplicationFormData = z.infer<typeof staffApplicationSchema>;

interface StaffApplicationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PositionOption {
  value: string;
  label: string;
  description: string;
  isLocked?: boolean;
  memberCount?: number;
  maxMembers?: number;
}

export function StaffApplicationForm({ open, onOpenChange }: StaffApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(true);
  const [isEligible, setIsEligible] = useState(false);
  const [eligibilityMessage, setEligibilityMessage] = useState("");
  const [availablePositions, setAvailablePositions] = useState<PositionOption[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    async function checkEligibilityAndTeamCapacity() {
      if (!open) return;
      
      setIsCheckingEligibility(true);
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsEligible(false);
          setEligibilityMessage("You must be logged in to apply for staff positions.");
          setIsCheckingEligibility(false);
          return;
        }

        // Check whitelist status
        const { data: whitelistApp, error } = await supabase
          .from("whitelist_applications")
          .select("status")
          .eq("user_id", user.id)
          .eq("status", "approved")
          .maybeSingle();

        if (error) {
          console.error("Error checking whitelist status:", error);
          setIsEligible(false);
          setEligibilityMessage("Unable to verify your whitelist status. Please try again later.");
          setIsCheckingEligibility(false);
          return;
        }
        
        if (!whitelistApp) {
          setIsEligible(false);
          setEligibilityMessage("You must have an approved whitelist application before applying for staff positions. Please complete the whitelist application first.");
          setIsCheckingEligibility(false);
          return;
        }

        // Fetch team settings from database (excluding administration_team)
        const { data: teamSettings } = await supabase
          .from("staff_team_settings")
          .select("*")
          .eq("is_enabled", true)
          .neq("team_value", "administration_team");

        if (!teamSettings || teamSettings.length === 0) {
          setIsEligible(false);
          setEligibilityMessage("No staff positions are currently available. Please check back later.");
          setIsCheckingEligibility(false);
          return;
        }

        // Count approved applications per team position
        const { data: approvedApps } = await supabase
          .from("staff_applications")
          .select("position")
          .eq("status", "approved");

        const teamCounts: Record<string, number> = {};
        approvedApps?.forEach(app => {
          teamCounts[app.position] = (teamCounts[app.position] || 0) + 1;
        });

        // Build positions from database settings with lock status
        const positionsWithStatus: PositionOption[] = teamSettings.map(setting => {
          const memberCount = teamCounts[setting.team_value] || 0;
          return {
            value: setting.team_value,
            label: setting.team_label,
            description: setting.team_description || "",
            memberCount,
            maxMembers: setting.max_members,
            isLocked: memberCount >= setting.max_members
          };
        });

        // Check if all positions are full
        const allFull = positionsWithStatus.every(p => p.isLocked);
        if (allFull) {
          setIsEligible(false);
          setEligibilityMessage("All staff positions are currently filled (3/3). Please check back later when positions become available.");
          setAvailablePositions([]);
          setIsCheckingEligibility(false);
          return;
        }

        // Filter out full positions from the dropdown
        const openPositions = positionsWithStatus.filter(p => !p.isLocked);
        
        setAvailablePositions(openPositions);
        setIsEligible(true);
        setEligibilityMessage("");
      } catch (error) {
        console.error("Error:", error);
        setIsEligible(false);
        setEligibilityMessage("An error occurred. Please try again later.");
      } finally {
        setIsCheckingEligibility(false);
      }
    }

    checkEligibilityAndTeamCapacity();

    // Set up real-time subscription for live updates
    const channel = supabase
      .channel('staff_applications_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'staff_applications' },
        () => {
          checkEligibilityAndTeamCapacity();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'staff_team_settings' },
        () => {
          checkEligibilityAndTeamCapacity();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open]);

  const form = useForm<StaffApplicationFormData>({
    resolver: zodResolver(staffApplicationSchema),
    defaultValues: {
      fullName: "",
      age: "",
      discordUsername: "",
      inGameName: "",
      position: "",
      playtime: "",
      experience: "",
      whyJoin: "",
      availability: "",
      previousExperience: "",
    },
  });

  async function onSubmit(data: StaffApplicationFormData) {
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "You must be logged in to submit an application.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("staff_applications")
        .insert({
          user_id: user.id,
          full_name: data.fullName,
          age: parseInt(data.age),
          discord_username: data.discordUsername,
          in_game_name: data.inGameName,
          position: data.position,
          playtime: data.playtime,
          experience: data.experience,
          why_join: data.whyJoin,
          availability: data.availability,
          previous_experience: data.previousExperience || null,
        });

      if (error) throw error;
      
      toast({
        title: "Application Submitted Successfully!",
        description: "Thank you for your interest! Our team will review your application and contact you on Discord within 3-5 business days if you're selected for an interview.",
      });
      
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting application:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        {/* Staff Header Image */}
        <div className="relative h-40 overflow-hidden rounded-t-lg">
          <img 
            src={headerStaff} 
            alt="Staff Application"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          <div className="absolute bottom-4 left-6 right-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/20 backdrop-blur-sm border border-primary/30">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Join Our Elite Staff Team</h2>
                <p className="text-sm text-muted-foreground">Apply to become part of our professional team</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Staff Benefits Section */}
          <div className="glass-effect rounded-lg p-4 border border-primary/20 mb-4">
            <h3 className="font-semibold text-primary mb-2">Staff Member Benefits</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Real-time presence system with online status tracking</li>
              <li>• Comprehensive activity logging and performance metrics</li>
              <li>• Direct communication with server management</li>
              <li>• Access to staff-only tools and resources</li>
              <li>• Recognition through achievement badges</li>
              <li>• Professional development and training opportunities</li>
            </ul>
          </div>

        {isCheckingEligibility ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Checking eligibility...</span>
          </div>
        ) : !isEligible ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Not Eligible</AlertTitle>
            <AlertDescription>
              {eligibilityMessage}
            </AlertDescription>
          </Alert>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
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
                      <Input type="number" placeholder="18" {...field} />
                    </FormControl>
                    <FormDescription>Must be 18 or older</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="discordUsername"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discord Username *</FormLabel>
                    <FormControl>
                      <Input placeholder="username#1234 or username" {...field} />
                    </FormControl>
                    <FormDescription>We'll contact you here</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="inGameName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>In-Game Character Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John_Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Applying For *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a team" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availablePositions.map((position) => (
                        <SelectItem 
                          key={position.value} 
                          value={position.value}
                          disabled={position.isLocked}
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${position.isLocked ? 'text-muted-foreground' : ''}`}>
                                {position.label}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                position.isLocked 
                                  ? 'bg-destructive/20 text-destructive' 
                                  : 'bg-primary/20 text-primary'
                              }`}>
                                {position.memberCount}/{position.maxMembers}
                              </span>
                              {position.isLocked && (
                                <span className="text-xs text-destructive font-medium">FULL</span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">{position.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the team that best matches your skills
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="playtime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Playtime on SLRP *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 300+ hours over 6 months" {...field} />
                  </FormControl>
                  <FormDescription>Approximate hours and duration</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="experience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relevant Experience & Skills *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your experience with roleplay, moderation, development, or relevant skills. Include any technical expertise, leadership experience, or community management background..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="flex justify-between">
                    <span>Be specific about your qualifications and achievements</span>
                    <span className="text-xs">{field.value.length}/1000 (min 50)</span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="whyJoin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Why Do You Want To Join Our Staff Team? *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Explain your motivation, what unique value you bring, and how you'll contribute to creating the best roleplay experience for our community..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="flex justify-between">
                    <span>Share your passion and commitment to SLRP</span>
                    <span className="text-xs">{field.value.length}/1000 (min 50)</span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="availability"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weekly Availability & Timezone *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Example: Available Monday-Friday 6PM-11PM EST, and weekends 12PM-12AM EST. Approximately 20-30 hours per week..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Be specific about days, hours, and your timezone. Staff members are expected to maintain consistent presence.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="previousExperience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Previous Staff Experience (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="If you have previous experience as staff on other servers, please describe your role, duration, and what you learned..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting Application...
                </>
              ) : (
                "Submit Staff Application"
              )}
            </Button>
          </form>
        </Form>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}