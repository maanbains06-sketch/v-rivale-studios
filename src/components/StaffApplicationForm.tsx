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
import { Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  position: z.enum([
    "administrator",
    "moderator", 
    "developer", 
    "support_staff",
    "event_coordinator",
    "content_creator"
  ]),
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

export function StaffApplicationForm({ open, onOpenChange }: StaffApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(true);
  const [isEligible, setIsEligible] = useState(false);
  const [eligibilityMessage, setEligibilityMessage] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    async function checkWhitelistStatus() {
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
        } else if (!whitelistApp) {
          setIsEligible(false);
          setEligibilityMessage("You must have an approved whitelist application before applying for staff positions. Please complete the whitelist application first.");
        } else {
          setIsEligible(true);
          setEligibilityMessage("");
        }
      } catch (error) {
        console.error("Error:", error);
        setIsEligible(false);
        setEligibilityMessage("An error occurred. Please try again later.");
      } finally {
        setIsCheckingEligibility(false);
      }
    }

    checkWhitelistStatus();
  }, [open]);

  const form = useForm<StaffApplicationFormData>({
    resolver: zodResolver(staffApplicationSchema),
    defaultValues: {
      fullName: "",
      age: "",
      discordUsername: "",
      inGameName: "",
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-gradient">Join Our Elite Staff Team</DialogTitle>
          <DialogDescription className="text-base">
            Apply to become part of our professional team. Staff members get access to advanced tools including real-time presence tracking, activity logs, and priority support systems.
          </DialogDescription>
        </DialogHeader>

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
                  <FormLabel>Position Applying For *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a position" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="administrator">
                        <div className="flex flex-col">
                          <span className="font-semibold">Administrator</span>
                          <span className="text-xs text-muted-foreground">Server management, policy enforcement, staff coordination</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="moderator">
                        <div className="flex flex-col">
                          <span className="font-semibold">Moderator</span>
                          <span className="text-xs text-muted-foreground">Community safety, rule enforcement, player reports</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="developer">
                        <div className="flex flex-col">
                          <span className="font-semibold">Developer</span>
                          <span className="text-xs text-muted-foreground">Feature development, bug fixes, technical support</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="support_staff">
                        <div className="flex flex-col">
                          <span className="font-semibold">Support Staff</span>
                          <span className="text-xs text-muted-foreground">Player assistance, ticket management, issue resolution</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="event_coordinator">
                        <div className="flex flex-col">
                          <span className="font-semibold">Event Coordinator</span>
                          <span className="text-xs text-muted-foreground">Event planning, hosting, community engagement</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="content_creator">
                        <div className="flex flex-col">
                          <span className="font-semibold">Content Creator</span>
                          <span className="text-xs text-muted-foreground">Media production, social presence, community outreach</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the position that best matches your skills and interests
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
                  <FormLabel>Previous Staff/Leadership Experience (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Have you been staff on other servers or held leadership roles? Describe your positions, responsibilities, achievements, and lessons learned..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Leave blank if none. This helps us understand your background.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Application Notice */}
            <div className="bg-muted/30 rounded-lg p-4 border border-border/20">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Application Process:</strong> After submission, your application will be reviewed by our management team. If selected, you'll be contacted on Discord for an interview within 3-5 business days. All applications are kept confidential.
              </p>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
