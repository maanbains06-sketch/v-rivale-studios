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
import CyberpunkFormWrapper from "@/components/CyberpunkFormWrapper";
import CyberpunkFieldset from "@/components/CyberpunkFieldset";

const jobApplicationSchema = z.object({
  character_name: z.string()
    .trim()
    .min(2, "Character name must be at least 2 characters")
    .max(50, "Character name must be less than 50 characters"),
  discord_id: z.string()
    .trim()
    .regex(/^\d{17,19}$/, "Discord ID must be 17-19 digits"),
  age: z.coerce.number()
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

type JobApplicationFormInput = z.input<typeof jobApplicationSchema>;
type JobApplicationFormData = z.output<typeof jobApplicationSchema>;

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

  const form = useForm<JobApplicationFormInput>({
    resolver: zodResolver(jobApplicationSchema),
    defaultValues: {
      character_name: "",
      discord_id: "",
      age: "" as unknown as JobApplicationFormInput["age"],
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

  const onSubmit = async (data: JobApplicationFormInput) => {
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

      const parsed: JobApplicationFormData = jobApplicationSchema.parse(data);

      const { error } = await supabase
        .from("job_applications")
        .insert({
          ...parsed,
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
        return <Shield className="w-6 h-6" />;
      case "EMS":
        return <Heart className="w-6 h-6" />;
      case "Mechanic":
        return <Wrench className="w-6 h-6" />;
    }
  };

  if (loading) {
    return (
      <CyberpunkFormWrapper title={`${jobType} Application`} icon={getJobIcon()} description={getJobDescription()}>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--neon-cyan))]" />
        </div>
      </CyberpunkFormWrapper>
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
      <CyberpunkFormWrapper title={`${jobType} Application`} icon={getJobIcon()} description={getJobDescription()}>
        <ApplicationCooldownTimer 
          rejectedAt={rejectedAt} 
          cooldownHours={24}
          onCooldownEnd={handleCooldownEnd}
        />
      </CyberpunkFormWrapper>
    );
  }

  return (
    <CyberpunkFormWrapper title={`${jobType} Application`} icon={getJobIcon()} description={getJobDescription()}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <CyberpunkFieldset legend="Personal Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="character_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Character Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="" {...field} />
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
                        placeholder="" 
                        value={(field.value as any) ?? ""}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="discord_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discord ID *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 123456789012345678" {...field} />
                  </FormControl>
                  <FormDescription>
                    Your 17-19 digit Discord ID (required for role assignment)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>In-Game Phone Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="" {...field} />
                  </FormControl>
                  <FormDescription>
                    Your character's in-game phone number
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CyberpunkFieldset>

          <CyberpunkFieldset legend="Experience & Motivation">
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
          </CyberpunkFieldset>

          <CyberpunkFieldset legend="Character Background">
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
          </CyberpunkFieldset>

          <CyberpunkFieldset legend="Scenario & Strengths">
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
          </CyberpunkFieldset>

          <CyberpunkFieldset legend="Availability">
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
          </CyberpunkFieldset>

          <Button 
            type="submit" 
            className="w-full cyberpunk-submit-btn"
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
    </CyberpunkFormWrapper>
  );
};

export default JobApplicationForm;
