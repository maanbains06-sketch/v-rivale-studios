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
import { Loader2, Flame } from "lucide-react";
import { useApplicationCooldown } from "@/hooks/useApplicationCooldown";
import { ApplicationCooldownTimer } from "@/components/ApplicationCooldownTimer";
import { PendingApplicationAlert } from "@/components/PendingApplicationAlert";
import { ApprovedApplicationAlert } from "@/components/ApprovedApplicationAlert";
import { OnHoldApplicationAlert } from "@/components/OnHoldApplicationAlert";
import CyberpunkFormWrapper from "@/components/CyberpunkFormWrapper";
import CyberpunkFieldset from "@/components/CyberpunkFieldset";

const firefighterSchema = z.object({
  real_name: z.string().trim().min(2, "Real name must be at least 2 characters").max(100, "Real name must be less than 100 characters"),
  in_game_name: z.string().trim().min(2, "In-game name must be at least 2 characters").max(50, "In-game name must be less than 50 characters"),
  discord_id: z.string().trim().min(3, "Discord ID is required").max(50, "Discord ID must be less than 50 characters"),
  steam_id: z.string().trim().min(5, "Steam ID is required").max(50, "Steam ID must be less than 50 characters"),
  weekly_availability: z.string().trim().min(10, "Please provide details about your weekly availability").max(500, "Availability must be less than 500 characters"),
});

type FirefighterFormData = z.infer<typeof firefighterSchema>;

interface FirefighterApplicationFormProps {
  jobImage: string;
}

const FirefighterApplicationForm = ({ jobImage }: FirefighterApplicationFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { 
    isOnCooldown, rejectedAt, loading, handleCooldownEnd, 
    hasPendingApplication, pendingMessage,
    hasApprovedApplication, approvedMessage,
    isOnHold, onHoldMessage
  } = useApplicationCooldown('job_applications', 24, { column: 'job_type', value: 'Firefighter' });

  const form = useForm<FirefighterFormData>({
    resolver: zodResolver(firefighterSchema),
    defaultValues: { real_name: "", in_game_name: "", discord_id: "", steam_id: "", weekly_availability: "" },
  });

  const onSubmit = async (data: FirefighterFormData) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast({ title: "Authentication Required", description: "Please log in to submit a firefighter application.", variant: "destructive" }); return; }

      const { error } = await supabase.from("job_applications").insert({
        user_id: user.id, job_type: "Firefighter", character_name: data.in_game_name,
        phone_number: data.discord_id, age: 18, previous_experience: `Real Name: ${data.real_name}`,
        why_join: "Firefighter Application", character_background: `Steam ID: ${data.steam_id}`,
        availability: data.weekly_availability, status: "pending",
      });
      if (error) throw error;
      toast({ title: "Application Submitted", description: "Your Firefighter application has been submitted successfully. We'll review it soon!" });
      form.reset();
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast({ title: "Submission Failed", description: error.message || "Failed to submit application. Please try again.", variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  if (loading) {
    return (
      <CyberpunkFormWrapper title="Firefighter Application" icon={<Flame className="w-6 h-6" />} description="Join the fire department and save lives">
        <div className="flex justify-center items-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--neon-cyan))]" /></div>
      </CyberpunkFormWrapper>
    );
  }

  if (hasApprovedApplication && approvedMessage) return <ApprovedApplicationAlert message={approvedMessage} jobImage={jobImage} title="Firefighter Application" icon={<Flame className="w-6 h-6 text-green-500" />} />;
  if (isOnHold && onHoldMessage) return <OnHoldApplicationAlert message={onHoldMessage} jobImage={jobImage} title="Firefighter Application" icon={<Flame className="w-6 h-6 text-blue-500" />} />;
  if (hasPendingApplication && pendingMessage) return <PendingApplicationAlert message={pendingMessage} jobImage={jobImage} title="Firefighter Application" icon={<Flame className="w-6 h-6 text-orange-500" />} />;

  if (isOnCooldown && rejectedAt) {
    return (
      <CyberpunkFormWrapper title="Firefighter Application" icon={<Flame className="w-6 h-6" />} description="Join the fire department and save lives">
        <ApplicationCooldownTimer rejectedAt={rejectedAt} cooldownHours={24} onCooldownEnd={handleCooldownEnd} />
      </CyberpunkFormWrapper>
    );
  }

  return (
    <CyberpunkFormWrapper title="Firefighter Application" icon={<Flame className="w-6 h-6" />} description="Join the fire department and serve the community">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <CyberpunkFieldset legend="Personal Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="real_name" render={({ field }) => (
                <FormItem><FormLabel>Real Name *</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="in_game_name" render={({ field }) => (
                <FormItem><FormLabel>In-Game Name *</FormLabel><FormControl><Input placeholder="John_Doe" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="discord_id" render={({ field }) => (
                <FormItem><FormLabel>Discord ID *</FormLabel><FormControl><Input placeholder="username#1234 or username" {...field} /></FormControl><FormDescription>Your Discord username for contact</FormDescription><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="steam_id" render={({ field }) => (
                <FormItem><FormLabel>Steam ID *</FormLabel><FormControl><Input placeholder="STEAM_0:1:12345678" {...field} /></FormControl><FormDescription>Your Steam identifier</FormDescription><FormMessage /></FormItem>
              )} />
            </div>
          </CyberpunkFieldset>

          <CyberpunkFieldset legend="Availability">
            <FormField control={form.control} name="weekly_availability" render={({ field }) => (
              <FormItem><FormLabel>Weekly Availability *</FormLabel><FormControl><Textarea placeholder="" className="min-h-[100px]" {...field} /></FormControl><FormDescription>How much time can you dedicate to this job weekly? Include days, hours, and timezone.</FormDescription><FormMessage /></FormItem>
            )} />
          </CyberpunkFieldset>

          <Button type="submit" className="w-full cyberpunk-submit-btn" disabled={isSubmitting}>
            {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</>) : (<><Flame className="mr-2 h-4 w-4" />Submit Firefighter Application</>)}
          </Button>
        </form>
      </Form>
    </CyberpunkFormWrapper>
  );
};

export default FirefighterApplicationForm;
