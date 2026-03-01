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
import { Loader2, Newspaper } from "lucide-react";
import { useApplicationCooldown } from "@/hooks/useApplicationCooldown";
import { ApplicationCooldownTimer } from "@/components/ApplicationCooldownTimer";
import { PendingApplicationAlert } from "@/components/PendingApplicationAlert";
import { ApprovedApplicationAlert } from "@/components/ApprovedApplicationAlert";
import { OnHoldApplicationAlert } from "@/components/OnHoldApplicationAlert";
import CyberpunkFormWrapper from "@/components/CyberpunkFormWrapper";
import CyberpunkFieldset from "@/components/CyberpunkFieldset";
import { useApplicationOpen } from "@/hooks/useApplicationToggles";
import ApplicationClosedMessage from "@/components/ApplicationClosedMessage";

const weazelNewsSchema = z.object({
  character_name: z.string().trim().min(2).max(50),
  discord_id: z.string().trim().regex(/^\d{17,19}$/, "Discord ID must be 17-19 digits"),
  age: z.number().min(18).max(100),
  phone_number: z.string().trim().min(3).max(20),
  previous_experience: z.string().trim().min(50).max(1000),
  why_join: z.string().trim().min(100).max(1000),
  character_background: z.string().trim().min(100).max(2000),
  journalism_experience: z.string().trim().min(75).max(1500),
  writing_sample: z.string().trim().min(150).max(3000),
  interview_scenario: z.string().trim().min(100).max(2000),
  camera_skills: z.string().trim().min(50).max(1000),
  availability: z.string().trim().min(20).max(500),
  additional_info: z.string().trim().max(1000).optional(),
});

type WeazelNewsFormData = z.infer<typeof weazelNewsSchema>;
interface WeazelNewsApplicationFormProps { jobImage: string; }

const WeazelNewsApplicationForm = ({ jobImage }: WeazelNewsApplicationFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isOpen: isAppOpen, loading: toggleLoading } = useApplicationOpen('weazel_news');

  const { isOnCooldown, rejectedAt, loading, handleCooldownEnd, hasPendingApplication, pendingMessage, hasApprovedApplication, approvedMessage, isOnHold, onHoldMessage } = useApplicationCooldown('job_applications', 24, { column: 'job_type', value: 'Weazel News' });

  const form = useForm<WeazelNewsFormData>({
    resolver: zodResolver(weazelNewsSchema),
    defaultValues: { character_name: "", discord_id: "", age: 18, phone_number: "", previous_experience: "", why_join: "", character_background: "", journalism_experience: "", writing_sample: "", interview_scenario: "", camera_skills: "", availability: "", additional_info: "" },
  });

  const onSubmit = async (data: WeazelNewsFormData) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast({ title: "Authentication Required", description: "Please log in to submit an application.", variant: "destructive" }); return; }
      const { error } = await supabase.from("job_applications").insert({
        user_id: user.id, job_type: "Weazel News", character_name: data.character_name, discord_id: data.discord_id, age: data.age, phone_number: data.phone_number,
        previous_experience: data.previous_experience, why_join: data.why_join, character_background: data.character_background, availability: data.availability,
        job_specific_answer: `Journalism Experience: ${data.journalism_experience}\n\nWriting Sample: ${data.writing_sample}\n\nInterview Scenario: ${data.interview_scenario}\n\nCamera Skills: ${data.camera_skills}`,
        additional_info: data.additional_info || null, status: "pending",
      });
      if (error) throw error;
      toast({ title: "Application Submitted", description: "Your Weazel News application has been submitted successfully." });
      form.reset();
    } catch (error: any) {
      toast({ title: "Submission Failed", description: error.message || "Failed to submit application.", variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  if (toggleLoading || loading) return <CyberpunkFormWrapper title="Weazel News Application" icon={<Newspaper className="w-6 h-6" />} description="Join the leading news network in San Andreas"><div className="flex justify-center items-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--neon-cyan))]" /></div></CyberpunkFormWrapper>;
  if (!isAppOpen) return <ApplicationClosedMessage title="Weazel News Application" icon={<Newspaper className="w-6 h-6" />} />;
  if (hasApprovedApplication && approvedMessage) return <ApprovedApplicationAlert message={approvedMessage} jobImage={jobImage} title="Weazel News Application" icon={<Newspaper className="w-6 h-6 text-green-500" />} />;
  if (isOnHold && onHoldMessage) return <OnHoldApplicationAlert message={onHoldMessage} jobImage={jobImage} title="Weazel News Application" icon={<Newspaper className="w-6 h-6 text-blue-500" />} />;
  if (hasPendingApplication && pendingMessage) return <PendingApplicationAlert message={pendingMessage} jobImage={jobImage} title="Weazel News Application" icon={<Newspaper className="w-6 h-6 text-primary" />} />;
  if (isOnCooldown && rejectedAt) return <CyberpunkFormWrapper title="Weazel News Application" icon={<Newspaper className="w-6 h-6" />}><ApplicationCooldownTimer rejectedAt={rejectedAt} cooldownHours={24} onCooldownEnd={handleCooldownEnd} /></CyberpunkFormWrapper>;

  return (
    <CyberpunkFormWrapper title="Weazel News Application" icon={<Newspaper className="w-6 h-6" />} description="Join the leading news network in San Andreas and tell stories that matter.">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <CyberpunkFieldset legend="Personal Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="character_name" render={({ field }) => (<FormItem><FormLabel>Character Name *</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="age" render={({ field }) => (<FormItem><FormLabel>Age *</FormLabel><FormControl><Input type="number" placeholder="25" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 18)} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="discord_id" render={({ field }) => (<FormItem><FormLabel>Discord ID *</FormLabel><FormControl><Input placeholder="e.g., 123456789012345678" {...field} /></FormControl><FormDescription>Your 17-19 digit Discord ID</FormDescription><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="phone_number" render={({ field }) => (<FormItem><FormLabel>In-Game Phone Number *</FormLabel><FormControl><Input placeholder="" {...field} /></FormControl><FormDescription>Your character's in-game phone number</FormDescription><FormMessage /></FormItem>)} />
          </CyberpunkFieldset>

          <CyberpunkFieldset legend="Experience & Motivation">
            <FormField control={form.control} name="why_join" render={({ field }) => (<FormItem><FormLabel>Why do you want to work at Weazel News? *</FormLabel><FormControl><Textarea placeholder="" className="min-h-[120px]" {...field} /></FormControl><FormDescription>Be genuine and detailed (minimum 100 characters)</FormDescription><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="previous_experience" render={({ field }) => (<FormItem><FormLabel>Previous Roleplay Experience *</FormLabel><FormControl><Textarea placeholder="" className="min-h-[100px]" {...field} /></FormControl><FormDescription>Detail your relevant RP background (minimum 50 characters)</FormDescription><FormMessage /></FormItem>)} />
          </CyberpunkFieldset>

          <CyberpunkFieldset legend="Character Background">
            <FormField control={form.control} name="character_background" render={({ field }) => (<FormItem><FormLabel>Character Background *</FormLabel><FormControl><Textarea placeholder="" className="min-h-[120px]" {...field} /></FormControl><FormDescription>Provide a detailed character background (minimum 100 characters)</FormDescription><FormMessage /></FormItem>)} />
          </CyberpunkFieldset>

          <CyberpunkFieldset legend="Journalism Skills">
            <FormField control={form.control} name="journalism_experience" render={({ field }) => (<FormItem><FormLabel>Journalism & Reporting Skills *</FormLabel><FormControl><Textarea placeholder="" className="min-h-[120px]" {...field} /></FormControl><FormDescription>Explain your journalism background and skills (minimum 75 characters)</FormDescription><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="writing_sample" render={({ field }) => (<FormItem><FormLabel>Writing Sample: Breaking News Report *</FormLabel><FormControl><Textarea placeholder="" className="min-h-[180px]" {...field} /></FormControl><FormDescription>Show us your reporting and writing abilities (minimum 150 characters)</FormDescription><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="interview_scenario" render={({ field }) => (<FormItem><FormLabel>Scenario: How would you conduct an interview with the Mayor about corruption allegations? *</FormLabel><FormControl><Textarea placeholder="" className="min-h-[150px]" {...field} /></FormControl><FormDescription>Demonstrate your interviewing approach (minimum 100 characters)</FormDescription><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="camera_skills" render={({ field }) => (<FormItem><FormLabel>Camera & Video Production Skills *</FormLabel><FormControl><Textarea placeholder="" className="min-h-[100px]" {...field} /></FormControl><FormDescription>Detail your technical media skills (minimum 50 characters)</FormDescription><FormMessage /></FormItem>)} />
          </CyberpunkFieldset>

          <CyberpunkFieldset legend="Availability">
            <FormField control={form.control} name="availability" render={({ field }) => (<FormItem><FormLabel>Weekly Availability & Timezone *</FormLabel><FormControl><Textarea placeholder="" className="min-h-[80px]" {...field} /></FormControl><FormDescription>Be specific about your schedule (minimum 20 characters)</FormDescription><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="additional_info" render={({ field }) => (<FormItem><FormLabel>Additional Information</FormLabel><FormControl><Textarea placeholder="" className="min-h-[80px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
          </CyberpunkFieldset>

          <Button type="submit" className="w-full cyberpunk-submit-btn" disabled={isSubmitting}>
            {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</>) : (<><Newspaper className="mr-2 h-4 w-4" />Submit Weazel News Application</>)}
          </Button>
        </form>
      </Form>
    </CyberpunkFormWrapper>
  );
};

export default WeazelNewsApplicationForm;
