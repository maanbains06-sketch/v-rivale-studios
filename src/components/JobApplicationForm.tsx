import { useState } from "react";
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
import { Loader2, Shield, Heart, Wrench } from "lucide-react";
import { useApplicationCooldown } from "@/hooks/useApplicationCooldown";
import { ApplicationCooldownTimer } from "@/components/ApplicationCooldownTimer";
import { PendingApplicationAlert } from "@/components/PendingApplicationAlert";
import { ApprovedApplicationAlert } from "@/components/ApprovedApplicationAlert";
import { OnHoldApplicationAlert } from "@/components/OnHoldApplicationAlert";
const jobApplicationSchema = z.object({
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
  job_specific_answer: z.string()
    .trim()
    .min(75, "Please provide at least 75 characters")
    .max(1500, "Response must be less than 1500 characters"),
  strengths: z.string()
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

type JobApplicationFormData = z.infer<typeof jobApplicationSchema>;

interface JobApplicationFormProps {
  jobType: "Police Department" | "EMS" | "Mechanic";
  jobImage: string;
}

const JobApplicationForm = ({ jobType, jobImage }: JobApplicationFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { 
    isOnCooldown, 
    rejectedAt, 
    loading, 
    handleCooldownEnd, 
    hasPendingApplication, 
    pendingMessage,
    hasApprovedApplication,
    approvedMessage,
    isOnHold,
    onHoldMessage
  } = useApplicationCooldown(
    'job_applications',
    24,
    { column: 'job_type', value: jobType }
  );

  const form = useForm<JobApplicationFormData>({
    resolver: zodResolver(jobApplicationSchema),
    defaultValues: {
      character_name: "",
      age: 18,
      phone_number: "",
      previous_experience: "",
      why_join: "",
      character_background: "",
      job_specific_answer: "",
      strengths: "",
      availability: "",
      additional_info: "",
    },
  });

  const onSubmit = async (data: JobApplicationFormData) => {
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to submit a job application.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("job_applications")
        .insert({
          ...data,
          job_type: jobType,
          user_id: user.id,
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Application Submitted",
        description: `Your ${jobType} application has been submitted successfully. We'll review it soon!`,
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

  const getJobDescription = () => {
    switch (jobType) {
      case "Police Department":
        return "Join the LSPD and serve with honor. Uphold the law, protect citizens, and maintain order in San Andreas.";
      case "EMS":
        return "Become a lifesaver. Provide critical emergency medical care and make a difference when every second counts.";
      case "Mechanic":
        return "Master the art of automotive excellence. Keep the city moving with expert repairs and diagnostics.";
    }
  };

  const getJobSpecificQuestion = () => {
    switch (jobType) {
      case "Police Department":
        return {
          label: "Scenario: Describe a high-stakes situation where you witnessed a fellow officer breaking protocol. *",
          placeholder: "How would you handle this situation while maintaining team integrity and public safety? Walk us through your thought process, actions, and expected outcomes..."
        };
      case "EMS":
        return {
          label: "Scenario: You arrive at a scene with three critical patients but can only stabilize one immediately. *",
          placeholder: "Walk us through your decision-making process. How would you triage, communicate with your team, and manage patient and family expectations in this life-or-death situation..."
        };
      case "Mechanic":
        return {
          label: "Scenario: A high-value client brings in a custom vehicle with an intermittent electrical issue you've never encountered. *",
          placeholder: "Describe your diagnostic approach, tools you'd use, how you'd research the problem, and how you'd manage client expectations throughout the process..."
        };
    }
  };

  const getStrengthsPrompt = () => {
    switch (jobType) {
      case "Police Department":
        return {
          label: "What makes you uniquely qualified for law enforcement in SLRP? *",
          placeholder: "Describe specific skills, personality traits, past experiences, or unique perspectives that set you apart as a law enforcement professional..."
        };
      case "EMS":
        return {
          label: "What makes you stand out as an EMS professional? *",
          placeholder: "Detail your medical knowledge, interpersonal skills, ability to work under pressure, or life experiences that make you exceptional in emergency medical services..."
        };
      case "Mechanic":
        return {
          label: "What sets you apart as a mechanic? *",
          placeholder: "Highlight your technical skills, problem-solving abilities, customer service strengths, or experiences that make you a superior automotive technician..."
        };
    }
  };

  const getJobIcon = () => {
    switch (jobType) {
      case "Police Department":
        return <Shield className="w-6 h-6 text-primary" />;
      case "EMS":
        return <Heart className="w-6 h-6 text-primary" />;
      case "Mechanic":
        return <Wrench className="w-6 h-6 text-primary" />;
    }
  };

  if (loading) {
    return (
      <Card className="glass-effect border-border/20">
        <CardContent className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (hasApprovedApplication && approvedMessage) {
    return (
      <ApprovedApplicationAlert 
        message={approvedMessage}
        jobImage={jobImage}
        title={`${jobType} Application`}
        icon={getJobIcon()}
      />
    );
  }

  if (isOnHold && onHoldMessage) {
    return (
      <OnHoldApplicationAlert 
        message={onHoldMessage}
        jobImage={jobImage}
        title={`${jobType} Application`}
        icon={getJobIcon()}
      />
    );
  }

  if (hasPendingApplication && pendingMessage) {
    return (
      <PendingApplicationAlert 
        message={pendingMessage}
        jobImage={jobImage}
        title={`${jobType} Application`}
        icon={getJobIcon()}
      />
    );
  }

  if (isOnCooldown && rejectedAt) {
    return (
      <div className="space-y-6">
        {/* Job Header with Image */}
        <div className="relative rounded-2xl overflow-hidden h-64 group">
          <img 
            src={jobImage} 
            alt={`${jobType} Career`}
            className="w-full h-full object-cover object-center opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 rounded-xl bg-primary/20 backdrop-blur-sm">
                {getJobIcon()}
              </div>
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-1">{jobType} Application</h2>
                <p className="text-muted-foreground">{getJobDescription()}</p>
              </div>
            </div>
          </div>
        </div>
        
        <ApplicationCooldownTimer 
          rejectedAt={rejectedAt} 
          cooldownHours={24}
          onCooldownEnd={handleCooldownEnd}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Job Header with Image */}
      <div className="relative rounded-2xl overflow-hidden h-64 group">
        <img 
          src={jobImage} 
          alt={`${jobType} Career`}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 rounded-xl bg-primary/20 backdrop-blur-sm">
              {getJobIcon()}
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-1">{jobType} Application</h2>
              <p className="text-muted-foreground">{getJobDescription()}</p>
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
                  <FormLabel>Why do you want to join the {jobType}? *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder=""
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
                      placeholder=""
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
                      placeholder=""
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
              name="job_specific_answer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{getJobSpecificQuestion().label}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder=""
                      className="min-h-[150px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a comprehensive response demonstrating your critical thinking (minimum 75 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="strengths"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{getStrengthsPrompt().label}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder=""
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Be specific and honest about your strengths (minimum 50 characters)
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
                      placeholder=""
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  {getJobIcon()}
                  <span className="ml-2">Submit {jobType} Application</span>
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

export default JobApplicationForm;
