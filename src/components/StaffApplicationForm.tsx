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
import { Loader2, AlertCircle, Users, Shield, CheckCircle, Pause, PartyPopper, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useWhitelistAccess } from "@/hooks/useWhitelistAccess";
import { useApplicationCooldown } from "@/hooks/useApplicationCooldown";
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
  discordId: z.string()
    .trim()
    .max(20, { message: "Discord ID must be less than 20 characters" })
    .optional(),
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
  
  // Use the same whitelist access hook as Job/Gang applications
  const { 
    hasAccess: hasWhitelistRole, 
    isInServer,
    loading: isWhitelistLoading, 
    discordId,
    error: whitelistError
  } = useWhitelistAccess();

  // Use centralized cooldown hook for staff applications
  const { 
    loading: cooldownLoading, 
    hasPendingApplication, 
    pendingMessage,
    hasApprovedApplication,
    approvedMessage,
    isOnHold,
    onHoldMessage,
    isOnCooldown,
    rejectedAt
  } = useApplicationCooldown('staff_applications', 24);

  // Map team_value to staff_members department
  const teamToDepartmentMap: Record<string, string> = {
    'staff_team': 'staff',
    'support_team': 'support',
    'event_team': 'event',
    'administration_team': 'administration',
  };

  useEffect(() => {
    async function checkEligibilityAndTeamCapacity() {
      if (!open) return;
      
      // Wait for whitelist check to complete
      if (isWhitelistLoading) return;
      
      setIsCheckingEligibility(true);
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsEligible(false);
          setEligibilityMessage("You must be logged in to apply for staff positions.");
          setIsCheckingEligibility(false);
          return;
        }

        // Check whitelist role access (same as Job/Gang applications)
        if (!hasWhitelistRole) {
          setIsEligible(false);
          if (!discordId) {
            setEligibilityMessage("You must be logged in with a Discord account to apply for staff positions.");
          } else if (!isInServer) {
            setEligibilityMessage("You must be a member of the SLRP Discord server to apply for staff positions. Please join our Discord server first.");
          } else {
            setEligibilityMessage("You must have the Whitelisted role on Discord to apply for staff positions. Please complete your whitelist application and get approved first.");
          }
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

        // Count ACTUAL active staff members by department (not applications)
        const { data: staffMembers } = await supabase
          .from("staff_members")
          .select("department")
          .eq("is_active", true);

        const departmentCounts: Record<string, number> = {};
        staffMembers?.forEach(member => {
          const dept = member.department?.toLowerCase();
          if (dept) {
            departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
          }
        });

        // Build positions from database settings with lock status based on actual staff
        const positionsWithStatus: PositionOption[] = teamSettings.map(setting => {
          // Map team_value to department name
          const department = teamToDepartmentMap[setting.team_value] || setting.team_value.replace('_team', '');
          const memberCount = departmentCounts[department] || 0;
          return {
            value: setting.team_value,
            label: setting.team_label,
            description: setting.team_description || "",
            memberCount,
            maxMembers: setting.max_members,
            isLocked: memberCount >= setting.max_members
          };
        });

        // Check if all positions are full - BUT still allow submission (will be placed "on hold")
        const allFull = positionsWithStatus.every(p => p.isLocked);
        
        // Show all positions - full ones can still be selected but will be placed on hold
        setAvailablePositions(positionsWithStatus);
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

    // Set up real-time subscription for live updates on ACTUAL staff members
    const channel = supabase
      .channel('staff_live_tracking')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'staff_members' },
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
  }, [open, isWhitelistLoading, hasWhitelistRole, isInServer, discordId]);

  const form = useForm<StaffApplicationFormData>({
    resolver: zodResolver(staffApplicationSchema),
    defaultValues: {
      fullName: "",
      age: "",
      discordUsername: "",
      discordId: discordId || "",
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

      // Check if the selected position is currently full
      const selectedPosition = availablePositions.find(p => p.value === data.position);
      const isPositionFull = selectedPosition?.isLocked || false;
      const applicationStatus = isPositionFull ? 'on_hold' : 'pending';

      const { error } = await supabase
        .from("staff_applications")
        .insert({
          user_id: user.id,
          full_name: data.fullName,
          age: parseInt(data.age),
          discord_username: data.discordUsername,
          discord_id: data.discordId || null,
          in_game_name: data.inGameName,
          position: data.position,
          playtime: data.playtime,
          experience: data.experience,
          why_join: data.whyJoin,
          availability: data.availability,
          previous_experience: data.previousExperience || null,
          status: applicationStatus,
          admin_notes: isPositionFull ? 'Application placed on hold - position currently at full capacity' : null,
        });

      if (error) throw error;
      
      const statusMessage = isPositionFull 
        ? "Your application has been placed on hold as this position is currently full. You'll be notified when a slot opens up."
        : "Thank you for your interest! Our team will review your application and contact you on Discord within 3-5 business days if you're selected for an interview.";
      
      toast({
        title: isPositionFull ? "Application On Hold" : "Application Submitted Successfully!",
        description: statusMessage,
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

        {cooldownLoading || isCheckingEligibility ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Checking eligibility...</span>
          </div>
        ) : hasApprovedApplication && approvedMessage ? (
          <div className="text-center py-8 space-y-4">
            <div className="p-4 rounded-full bg-green-500/20 w-20 h-20 mx-auto flex items-center justify-center">
              <PartyPopper className="w-10 h-10 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-green-400">🎉 Congratulations! 🎉</h3>
            <p className="text-muted-foreground max-w-md mx-auto">{approvedMessage}</p>
            <div className="flex items-center justify-center gap-2 text-sm text-green-400 bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20 w-fit mx-auto">
              <CheckCircle className="w-4 h-4" />
              <span>You're officially part of the team!</span>
            </div>
          </div>
        ) : isOnHold && onHoldMessage ? (
          <div className="text-center py-8 space-y-4">
            <div className="p-4 rounded-full bg-blue-500/20 w-20 h-20 mx-auto flex items-center justify-center">
              <Pause className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-blue-400">Application On Hold</h3>
            <p className="text-muted-foreground max-w-md mx-auto">{onHoldMessage}</p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/30 px-4 py-2 rounded-full w-fit mx-auto">
              <Clock className="w-4 h-4" />
              <span>You will be notified once a decision is made</span>
            </div>
          </div>
        ) : hasPendingApplication && pendingMessage ? (
          <div className="text-center py-8 space-y-4">
            <div className="p-4 rounded-full bg-amber-500/20 w-20 h-20 mx-auto flex items-center justify-center">
              <Clock className="w-10 h-10 text-amber-400" />
            </div>
            <h3 className="text-2xl font-bold text-amber-400">Application Pending</h3>
            <p className="text-muted-foreground max-w-md mx-auto">{pendingMessage}</p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/30 px-4 py-2 rounded-full w-fit mx-auto">
              <Clock className="w-4 h-4" />
              <span>You will be notified once your application is reviewed</span>
            </div>
          </div>
        ) : isOnCooldown && rejectedAt ? (
          <div className="text-center py-8 space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Cooldown Active</AlertTitle>
              <AlertDescription>
                Your previous application was rejected. You can reapply after 24 hours from the rejection time.
              </AlertDescription>
            </Alert>
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
                name="discordId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discord ID</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 123456789012345678" {...field} />
                    </FormControl>
                    <FormDescription>Your 18-digit Discord ID (optional)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
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
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${position.isLocked ? 'text-amber-500' : ''}`}>
                                {position.label}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                position.isLocked 
                                  ? 'bg-amber-500/20 text-amber-500' 
                                  : 'bg-primary/20 text-primary'
                              }`}>
                                {position.memberCount}/{position.maxMembers}
                              </span>
                              {position.isLocked && (
                                <span className="text-xs text-amber-500 font-medium">WAITLIST</span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">{position.description}</span>
                            {position.isLocked && (
                              <span className="text-xs text-amber-500/80 mt-0.5">Applications will be placed on hold until a slot opens</span>
                            )}
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
                      placeholder=""
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
                      placeholder=""
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
                      placeholder=""
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
                      placeholder=""
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