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
import { Loader2, Newspaper, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const weazelNewsSchema = z.object({
  character_name: z.string()
    .trim()
    .min(2, "Character name must be at least 2 characters")
    .max(50, "Character name must be less than 50 characters"),
  age: z.number()
    .min(18, "Must be at least 18 years old")
    .max(100, "Invalid age"),
  phone_number: z.string()
    .trim()
    .min(3, "Phone number is required")
    .max(20, "Phone number must be less than 20 characters"),
  previous_experience: z.string()
    .trim()
    .min(50, "Please provide at least 50 characters")
    .max(1000, "Previous experience must be less than 1000 characters"),
  why_join: z.string()
    .trim()
    .min(100, "Please provide at least 100 characters")
    .max(1000, "Response must be less than 1000 characters"),
  character_background: z.string()
    .trim()
    .min(100, "Please provide at least 100 characters")
    .max(2000, "Response must be less than 2000 characters"),
  journalism_experience: z.string()
    .trim()
    .min(75, "Please provide at least 75 characters")
    .max(1500, "Response must be less than 1500 characters"),
  writing_sample: z.string()
    .trim()
    .min(150, "Please provide at least 150 characters")
    .max(3000, "Response must be less than 3000 characters"),
  interview_scenario: z.string()
    .trim()
    .min(100, "Please provide at least 100 characters")
    .max(2000, "Response must be less than 2000 characters"),
  camera_skills: z.string()
    .trim()
    .min(50, "Please provide at least 50 characters")
    .max(1000, "Response must be less than 1000 characters"),
  availability: z.string()
    .trim()
    .min(20, "Please provide detailed availability information")
    .max(500, "Availability must be less than 500 characters"),
  additional_info: z.string()
    .trim()
    .max(1000, "Additional info must be less than 1000 characters")
    .optional(),
});

type WeazelNewsFormData = z.infer<typeof weazelNewsSchema>;

interface WeazelNewsApplicationFormProps {
  jobImage: string;
}

const WeazelNewsApplicationForm = ({ jobImage }: WeazelNewsApplicationFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownDays, setCooldownDays] = useState(0);
  const [checkingCooldown, setCheckingCooldown] = useState(true);

  const form = useForm<WeazelNewsFormData>({
    resolver: zodResolver(weazelNewsSchema),
    defaultValues: {
      character_name: "",
      age: 18,
      phone_number: "",
      previous_experience: "",
      why_join: "",
      character_background: "",
      journalism_experience: "",
      writing_sample: "",
      interview_scenario: "",
      camera_skills: "",
      availability: "",
      additional_info: "",
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
        .from("weazel_news_applications")
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

  const onSubmit = async (data: WeazelNewsFormData) => {
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to submit an application.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("weazel_news_applications")
        .insert({
          ...data,
          user_id: user.id,
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Application Submitted",
        description: "Your Weazel News application has been submitted successfully. We'll review it soon!",
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
            alt="Weazel News"
            className="w-full h-full object-cover object-center opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 rounded-xl bg-primary/20 backdrop-blur-sm">
                <Newspaper className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-1">Weazel News Application</h2>
                <p className="text-muted-foreground">Join the leading news network in San Andreas and tell stories that matter.</p>
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
                You have recently submitted an application for Weazel News. 
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
          alt="Weazel News"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 rounded-xl bg-primary/20 backdrop-blur-sm">
              <Newspaper className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-1">Weazel News Application</h2>
              <p className="text-muted-foreground">Join the leading news network in San Andreas and tell stories that matter.</p>
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
                  name="character_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Character Name *</FormLabel>
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
                        <Input 
                          type="number" 
                          placeholder="25" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 18)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>In-Game Phone Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="555-0123" {...field} />
                    </FormControl>
                    <FormDescription>
                      Your character's in-game phone number
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="why_join"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Why do you want to work at Weazel News? *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Explain your motivation for joining Weazel News. What draws you to journalism in Los Santos? Do you want to be the next big anchor or an investigative reporter?"
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Be genuine and detailed (minimum 100 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="previous_experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Previous Roleplay Experience *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe any relevant roleplay experience, especially in media, journalism, or content creation roles on FiveM or other RP servers..."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Detail your relevant RP background (minimum 50 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="character_background"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Character Background *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell us about your character's background story. Why did they come to Los Santos? What drives them to pursue a career in journalism? What's their dream story to cover?"
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a detailed character background (minimum 100 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="journalism_experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Journalism & Reporting Skills *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Do you have any real-life or in-game experience with journalism, reporting, interviewing, or content creation? Describe your writing style and how you approach storytelling..."
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Explain your journalism background and skills (minimum 75 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="writing_sample"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Writing Sample: Breaking News Report *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Write a short breaking news report about a fictional event in Los Santos. Example: A major heist at the Pacific Standard Bank, a high-speed chase through the city, or a celebrity scandal at the Vinewood Casino. Show us your writing skills!"
                        className="min-h-[180px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Show us your reporting and writing abilities (minimum 150 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="interview_scenario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scenario: How would you conduct an interview with the Mayor about corruption allegations? *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your approach: How would you prepare for the interview? What questions would you ask? How would you handle deflection or hostility? How would you ensure fairness while pursuing the truth?"
                        className="min-h-[150px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Demonstrate your interviewing approach (minimum 100 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="camera_skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Camera & Video Production Skills *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe any experience with camera work, video editing, live broadcasting, or content creation. Are you comfortable operating cameras in the field? Do you have experience with Rockstar Editor or streaming?"
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Detail your technical media skills (minimum 50 characters)
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
                    <FormLabel>Availability *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="What days and times are you available to cover stories and events? Include your timezone. Are you available for breaking news coverage?"
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Be specific about your schedule (minimum 20 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="additional_info"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Information</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional information you'd like to share - portfolio links, previous work samples, special skills, story ideas you'd like to pursue (optional)..."
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Optional: share anything else relevant
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting Application...
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeazelNewsApplicationForm;
