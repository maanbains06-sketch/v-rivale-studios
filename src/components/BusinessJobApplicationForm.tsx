import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Building2, UtensilsCrossed, Wrench, Car, PartyPopper } from "lucide-react";
import { useApplicationCooldown } from "@/hooks/useApplicationCooldown";
import { ApplicationCooldownTimer } from "@/components/ApplicationCooldownTimer";
import { PendingApplicationAlert } from "@/components/PendingApplicationAlert";
import { ApprovedApplicationAlert } from "@/components/ApprovedApplicationAlert";
import { OnHoldApplicationAlert } from "@/components/OnHoldApplicationAlert";
import CyberpunkFormWrapper from "@/components/CyberpunkFormWrapper";
import CyberpunkFieldset from "@/components/CyberpunkFieldset";
import { useApplicationOpen } from "@/hooks/useApplicationToggles";
import ApplicationClosedMessage from "@/components/ApplicationClosedMessage";

const businessJobSchema = z.object({
  business_name: z.string().trim().min(2, "Business name must be at least 2 characters").max(100, "Business name must be less than 100 characters"),
  character_name: z.string().trim().min(2, "Character name must be at least 2 characters").max(50, "Character name must be less than 50 characters"),
  age: z.coerce.number().min(18, "Must be at least 18 years old").max(100, "Invalid age"),
  phone_number: z.string().trim().min(3, "Phone number is required").max(20, "Phone number must be less than 20 characters"),
  previous_experience: z.string().trim().min(50, "Please provide at least 50 characters").max(1000, "Previous experience must be less than 1000 characters"),
  why_join: z.string().trim().min(100, "Please provide at least 100 characters").max(1000, "Response must be less than 1000 characters"),
  character_background: z.string().trim().min(100, "Please provide at least 100 characters").max(2000, "Response must be less than 2000 characters"),
  job_specific_answer: z.string().trim().min(75, "Please provide at least 75 characters").max(1500, "Response must be less than 1500 characters"),
  strengths: z.string().trim().min(50, "Please provide at least 50 characters").max(1000, "Response must be less than 1000 characters"),
  availability: z.string().trim().min(20, "Please provide detailed availability information").max(500, "Availability must be less than 500 characters"),
  additional_info: z.string().trim().max(1000, "Additional info must be less than 1000 characters").optional(),
});

type BusinessJobFormInput = z.input<typeof businessJobSchema>;
type BusinessJobFormData = z.output<typeof businessJobSchema>;

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
}> = {
  "Real Estate Agent": {
    icon: <Building2 className="w-6 h-6" />,
    description: "Help clients find their dream properties.",
    scenarioQuestion: { label: "Scenario: A client wants to buy a property but their budget is $50,000 short. How would you handle this? *", placeholder: "" },
    strengthsPrompt: { label: "What makes you an excellent real estate professional? *", placeholder: "" },
  },
  "Food Service Worker": {
    icon: <UtensilsCrossed className="w-6 h-6" />,
    description: "Join the hospitality industry.",
    scenarioQuestion: { label: "Scenario: During a busy dinner rush, a customer complains their food is cold and demands a refund. How do you handle this? *", placeholder: "" },
    strengthsPrompt: { label: "What makes you stand out in food service? *", placeholder: "" },
  },
  "Business Mechanic": {
    icon: <Wrench className="w-6 h-6" />,
    description: "Work at an established mechanic shop.",
    scenarioQuestion: { label: "Scenario: A customer brings in a vehicle with an expensive repair needed but limited budget. What do you do? *", placeholder: "" },
    strengthsPrompt: { label: "What sets you apart as a mechanic? *", placeholder: "" },
  },
  "Tuner Specialist": {
    icon: <Car className="w-6 h-6" />,
    description: "Specialize in vehicle modifications and performance tuning.",
    scenarioQuestion: { label: "Scenario: A client wants modifications that would make their car illegal for street use. How do you advise them? *", placeholder: "" },
    strengthsPrompt: { label: "What makes you an exceptional tuner? *", placeholder: "" },
  },
  "Entertainment Staff": {
    icon: <PartyPopper className="w-6 h-6" />,
    description: "Be part of the nightlife scene.",
    scenarioQuestion: { label: "Scenario: An intoxicated VIP guest is becoming disruptive and bothering other patrons. How do you handle this? *", placeholder: "" },
    strengthsPrompt: { label: "What makes you perfect for entertainment venues? *", placeholder: "" },
  }
};

const BusinessJobApplicationForm = ({ jobType, jobImage }: BusinessJobApplicationFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const config = jobConfig[jobType];
  const { isOpen: isAppOpen, loading: toggleLoading } = useApplicationOpen('business_job');

  const { 
    isOnCooldown, rejectedAt, loading, handleCooldownEnd, 
    hasPendingApplication, pendingMessage,
    hasApprovedApplication, approvedMessage,
    isOnHold, onHoldMessage
  } = useApplicationCooldown('job_applications', 24, { column: 'job_type', value: jobType });

  const form = useForm<BusinessJobFormInput>({
    resolver: zodResolver(businessJobSchema),
    defaultValues: {
      business_name: "", character_name: "",
      age: "" as unknown as BusinessJobFormInput["age"],
      phone_number: "", previous_experience: "", why_join: "",
      character_background: "", job_specific_answer: "",
      strengths: "", availability: "", additional_info: "",
    },
  });

  const onSubmit = async (data: BusinessJobFormInput) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Authentication Required", description: "Please log in to submit a job application.", variant: "destructive" });
        return;
      }

      const parsed: BusinessJobFormData = businessJobSchema.parse(data);

      const { error } = await supabase.from("job_applications").insert({
        character_name: parsed.character_name, age: parsed.age, phone_number: parsed.phone_number,
        previous_experience: parsed.previous_experience, why_join: parsed.why_join,
        character_background: parsed.character_background, job_specific_answer: parsed.job_specific_answer,
        strengths: parsed.strengths, availability: parsed.availability,
        additional_info: parsed.additional_info, business_name: parsed.business_name,
        job_type: jobType, user_id: user.id, status: "pending",
      });

      if (error) throw error;

      toast({ title: "Application Submitted", description: `Your ${jobType} application has been submitted successfully.` });
      form.reset();
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast({ title: "Submission Failed", description: error.message || "Failed to submit application.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (toggleLoading || loading) {
    return (
      <CyberpunkFormWrapper title={`${jobType} Application`} icon={config.icon} description={config.description}>
        <div className="flex justify-center items-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--neon-cyan))]" /></div>
      </CyberpunkFormWrapper>
    );
  }

  if (!isAppOpen) return <ApplicationClosedMessage title={`${jobType} Application`} icon={config.icon} />;

  if (hasApprovedApplication && approvedMessage) return <ApprovedApplicationAlert message={approvedMessage} jobImage={jobImage} title={`${jobType} Application`} icon={config.icon} />;
  if (isOnHold && onHoldMessage) return <OnHoldApplicationAlert message={onHoldMessage} jobImage={jobImage} title={`${jobType} Application`} icon={config.icon} />;
  if (hasPendingApplication && pendingMessage) return <PendingApplicationAlert message={pendingMessage} jobImage={jobImage} title={`${jobType} Application`} icon={config.icon} />;

  if (isOnCooldown && rejectedAt) {
    return (
      <CyberpunkFormWrapper title={`${jobType} Application`} icon={config.icon}>
        <ApplicationCooldownTimer rejectedAt={rejectedAt} cooldownHours={24} onCooldownEnd={handleCooldownEnd} />
      </CyberpunkFormWrapper>
    );
  }

  return (
    <CyberpunkFormWrapper title={`${jobType} Application`} icon={config.icon} description={config.description}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <CyberpunkFieldset legend="Business & Personal Info">
            <FormField control={form.control} name="business_name" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2"><Building2 className="w-4 h-4 text-[hsl(var(--neon-cyan))]" />Which Business Are You Applying To? *</FormLabel>
                <FormControl><Input placeholder="" {...field} /></FormControl>
                <FormDescription>Provide the exact name of the business or establishment you want to work at</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="character_name" render={({ field }) => (
                <FormItem><FormLabel>Character Name *</FormLabel><FormControl><Input placeholder="" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="age" render={({ field }) => (
                <FormItem><FormLabel>Age *</FormLabel><FormControl><Input type="number" placeholder="" value={(field.value as any) ?? ""} onChange={(e) => field.onChange(e.target.value)} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="phone_number" render={({ field }) => (
              <FormItem><FormLabel>In-Game Phone Number *</FormLabel><FormControl><Input placeholder="" {...field} /></FormControl><FormDescription>Your character's in-game phone number</FormDescription><FormMessage /></FormItem>
            )} />
          </CyberpunkFieldset>

          <CyberpunkFieldset legend="Experience & Motivation">
            <FormField control={form.control} name="why_join" render={({ field }) => (
              <FormItem><FormLabel>Why do you want to work as a {jobType}? *</FormLabel><FormControl><Textarea placeholder="" className="min-h-[120px]" {...field} /></FormControl><FormDescription>Be genuine and detailed (minimum 100 characters)</FormDescription><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="previous_experience" render={({ field }) => (
              <FormItem><FormLabel>Previous Roleplay Experience *</FormLabel><FormControl><Textarea placeholder="" className="min-h-[100px]" {...field} /></FormControl><FormDescription>Detail your relevant RP background (minimum 50 characters)</FormDescription><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="character_background" render={({ field }) => (
              <FormItem><FormLabel>Character Background *</FormLabel><FormControl><Textarea placeholder="" className="min-h-[120px]" {...field} /></FormControl><FormDescription>Provide a detailed character background (minimum 100 characters)</FormDescription><FormMessage /></FormItem>
            )} />
          </CyberpunkFieldset>

          <CyberpunkFieldset legend="Scenario & Strengths">
            <FormField control={form.control} name="job_specific_answer" render={({ field }) => (
              <FormItem><FormLabel>{config.scenarioQuestion.label}</FormLabel><FormControl><Textarea placeholder="" className="min-h-[150px]" {...field} /></FormControl><FormDescription>Provide a comprehensive response demonstrating your critical thinking (minimum 75 characters)</FormDescription><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="strengths" render={({ field }) => (
              <FormItem><FormLabel>{config.strengthsPrompt.label}</FormLabel><FormControl><Textarea placeholder="" className="min-h-[120px]" {...field} /></FormControl><FormDescription>Be specific and honest about your strengths (minimum 50 characters)</FormDescription><FormMessage /></FormItem>
            )} />
          </CyberpunkFieldset>

          <CyberpunkFieldset legend="Availability">
            <FormField control={form.control} name="availability" render={({ field }) => (
              <FormItem><FormLabel>Weekly Availability & Timezone *</FormLabel><FormControl><Textarea placeholder="" className="min-h-[80px]" {...field} /></FormControl><FormDescription>Be specific about your schedule (minimum 20 characters)</FormDescription><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="additional_info" render={({ field }) => (
              <FormItem><FormLabel>Additional Information (Optional)</FormLabel><FormControl><Textarea placeholder="" className="min-h-[80px]" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </CyberpunkFieldset>

          <Button type="submit" className="w-full cyberpunk-submit-btn" disabled={isSubmitting} size="lg">
            {isSubmitting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting Application...</>) : ("Submit Application")}
          </Button>
        </form>
      </Form>
    </CyberpunkFormWrapper>
  );
};

export default BusinessJobApplicationForm;
