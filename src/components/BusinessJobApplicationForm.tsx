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
import { Loader2, Building2, UtensilsCrossed, Wrench, Car, PartyPopper } from "lucide-react";
import { useApplicationCooldown } from "@/hooks/useApplicationCooldown";
import { ApplicationCooldownTimer } from "@/components/ApplicationCooldownTimer";
import { PendingApplicationAlert } from "@/components/PendingApplicationAlert";
import { ApprovedApplicationAlert } from "@/components/ApprovedApplicationAlert";
import { OnHoldApplicationAlert } from "@/components/OnHoldApplicationAlert";

const businessJobSchema = z.object({
  business_name: z.string()
    .trim()
    .min(2, "Business name must be at least 2 characters")
    .max(100, "Business name must be less than 100 characters"),
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

type BusinessJobFormData = z.infer<typeof businessJobSchema>;

export type BusinessJobType = 
  | "Real Estate Agent" 
  | "Food Service Worker" 
  | "Business Mechanic" 
  | "Tuner Specialist" 
  | "Entertainment Staff";

interface BusinessJobApplicationFormProps {
  jobType: BusinessJobType;
  jobImage: string;
}

const jobConfig: Record<BusinessJobType, {
  icon: React.ReactNode;
  description: string;
  scenarioQuestion: { label: string; placeholder: string };
  strengthsPrompt: { label: string; placeholder: string };
  color: string;
}> = {
  "Real Estate Agent": {
    icon: <Building2 className="w-6 h-6 text-blue-400" />,
    description: "Help clients find their dream properties. Manage listings, conduct viewings, and close deals in the Los Santos real estate market.",
    scenarioQuestion: {
      label: "Scenario: A client wants to buy a property but their budget is $50,000 short. How would you handle this? *",
      placeholder: "Describe your negotiation approach, alternative solutions you'd propose, and how you'd maintain the client relationship while being realistic about their options..."
    },
    strengthsPrompt: {
      label: "What makes you an excellent real estate professional? *",
      placeholder: "Describe your sales skills, knowledge of the property market, networking abilities, and customer service experience..."
    },
    color: "blue-500"
  },
  "Food Service Worker": {
    icon: <UtensilsCrossed className="w-6 h-6 text-orange-400" />,
    description: "Join the hospitality industry. Work as a chef, server, or manager in one of Los Santos' finest restaurants.",
    scenarioQuestion: {
      label: "Scenario: During a busy dinner rush, a customer complains their food is cold and demands a refund. How do you handle this? *",
      placeholder: "Walk us through your approach to resolving the complaint, managing the kitchen communication, and ensuring customer satisfaction while maintaining workflow..."
    },
    strengthsPrompt: {
      label: "What makes you stand out in food service? *",
      placeholder: "Describe your culinary skills, customer service abilities, ability to work under pressure, and experience in hospitality..."
    },
    color: "orange-500"
  },
  "Business Mechanic": {
    icon: <Wrench className="w-6 h-6 text-green-400" />,
    description: "Work at an established mechanic shop. Repair vehicles, provide quality service, and build a reputation for excellence.",
    scenarioQuestion: {
      label: "Scenario: A customer brings in a vehicle with an expensive repair needed but limited budget. What do you do? *",
      placeholder: "Explain how you'd diagnose the issue, present repair options at different price points, prioritize safety, and maintain customer trust..."
    },
    strengthsPrompt: {
      label: "What sets you apart as a mechanic? *",
      placeholder: "Highlight your technical expertise, diagnostic skills, ability to explain repairs to non-technical customers, and work ethic..."
    },
    color: "green-500"
  },
  "Tuner Specialist": {
    icon: <Car className="w-6 h-6 text-purple-400" />,
    description: "Specialize in vehicle modifications and performance tuning. Work with premium cars and demanding clients.",
    scenarioQuestion: {
      label: "Scenario: A client wants modifications that would make their car illegal for street use. How do you advise them? *",
      placeholder: "Describe how you'd educate the client about legal limits, offer street-legal alternatives, and balance their desires with practical considerations..."
    },
    strengthsPrompt: {
      label: "What makes you an exceptional tuner? *",
      placeholder: "Describe your knowledge of performance parts, custom fabrication skills, understanding of car culture, and attention to detail..."
    },
    color: "purple-500"
  },
  "Entertainment Staff": {
    icon: <PartyPopper className="w-6 h-6 text-pink-400" />,
    description: "Be part of the nightlife scene. Work at nightclubs, bars, or event venues as staff, security, or management.",
    scenarioQuestion: {
      label: "Scenario: An intoxicated VIP guest is becoming disruptive and bothering other patrons. How do you handle this? *",
      placeholder: "Walk us through your de-escalation approach, how you'd protect other guests while respecting the VIP status, and when you'd involve security..."
    },
    strengthsPrompt: {
      label: "What makes you perfect for entertainment venues? *",
      placeholder: "Describe your people skills, ability to handle difficult situations, experience with nightlife, and energy for late-night shifts..."
    },
    color: "pink-500"
  }
};

const BusinessJobApplicationForm = ({ jobType, jobImage }: BusinessJobApplicationFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const config = jobConfig[jobType];

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

  const form = useForm<BusinessJobFormData>({
    resolver: zodResolver(businessJobSchema),
    defaultValues: {
      business_name: "",
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

  const onSubmit = async (data: BusinessJobFormData) => {
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
          character_name: data.character_name,
          age: data.age,
          phone_number: data.phone_number,
          previous_experience: data.previous_experience,
          why_join: data.why_join,
          character_background: data.character_background,
          job_specific_answer: data.job_specific_answer,
          strengths: data.strengths,
          availability: data.availability,
          additional_info: data.additional_info,
          business_name: data.business_name,
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
        icon={config.icon}
      />
    );
  }

  if (isOnHold && onHoldMessage) {
    return (
      <OnHoldApplicationAlert 
        message={onHoldMessage}
        jobImage={jobImage}
        title={`${jobType} Application`}
        icon={config.icon}
      />
    );
  }

  if (hasPendingApplication && pendingMessage) {
    return (
      <PendingApplicationAlert 
        message={pendingMessage}
        jobImage={jobImage}
        title={`${jobType} Application`}
        icon={config.icon}
      />
    );
  }

  if (isOnCooldown && rejectedAt) {
    return (
      <div className="space-y-6">
        <div className="relative rounded-2xl overflow-hidden h-64 group">
          <img 
            src={jobImage} 
            alt={`${jobType} Career`}
            className="w-full h-full object-cover object-center opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="flex items-center gap-4 mb-3">
              <div className={`p-3 rounded-xl bg-${config.color}/20 backdrop-blur-sm`}>
                {config.icon}
              </div>
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-1">{jobType} Application</h2>
                <p className="text-muted-foreground">{config.description}</p>
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
            <div className={`p-3 rounded-xl bg-${config.color}/20 backdrop-blur-sm`}>
              {config.icon}
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-1">{jobType} Application</h2>
              <p className="text-muted-foreground">{config.description}</p>
            </div>
          </div>
        </div>
      </div>

      <Card className="glass-effect border-border/20">
        <CardContent className="pt-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Business Name Field - Important for identifying which specific business */}
              <FormField
                control={form.control}
                name="business_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-amber-500" />
                      Which Business Are You Applying To? *
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={`Enter the name of the ${jobType.toLowerCase()} business you're applying to...`} 
                        className="border-amber-500/30 focus:border-amber-500/50"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Provide the exact name of the business or establishment you want to work at
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                    <FormLabel>Why do you want to work as a {jobType}? *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Explain your motivation for pursuing this career path. What drives you to work in this industry?"
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
                        placeholder="Describe any relevant roleplay experience in similar roles. Include servers, positions held, and what you learned..."
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
                        placeholder="Tell us about your character's background, story, and why they want this job..."
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
                    <FormLabel>{config.scenarioQuestion.label}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={config.scenarioQuestion.placeholder}
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
                    <FormLabel>{config.strengthsPrompt.label}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={config.strengthsPrompt.placeholder}
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
                        placeholder="Example: Monday-Friday 6PM-11PM IST, weekends 12PM-12AM IST. Approximately 20-30 hours per week..."
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
                    <FormLabel>Additional Information (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional skills, certifications, or information you'd like us to know..."
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
                size="lg"
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

export default BusinessJobApplicationForm;
