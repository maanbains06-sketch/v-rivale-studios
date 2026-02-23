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
import { Loader2, Car } from "lucide-react";
import { useApplicationCooldown } from "@/hooks/useApplicationCooldown";
import { ApplicationCooldownTimer } from "@/components/ApplicationCooldownTimer";
import { PendingApplicationAlert } from "@/components/PendingApplicationAlert";
import { ApprovedApplicationAlert } from "@/components/ApprovedApplicationAlert";
import { OnHoldApplicationAlert } from "@/components/OnHoldApplicationAlert";
import CyberpunkFormWrapper from "@/components/CyberpunkFormWrapper";
import CyberpunkFieldset from "@/components/CyberpunkFieldset";

const pdmApplicationSchema = z.object({
  character_name: z.string().trim().min(2, "Character name must be at least 2 characters").max(50, "Character name must be less than 50 characters"),
  discord_id: z.string().trim().regex(/^\d{17,19}$/, "Discord ID must be 17-19 digits"),
  age: z.number().min(18, "Must be at least 18 years old").max(100, "Invalid age"),
  phone_number: z.string().trim().min(3, "Phone number is required").max(20, "Phone number must be less than 20 characters"),
  previous_experience: z.string().trim().min(50, "Please provide at least 50 characters").max(1000),
  why_join: z.string().trim().min(100, "Please provide at least 100 characters").max(1000),
  character_background: z.string().trim().min(100, "Please provide at least 100 characters").max(2000),
  sales_experience: z.string().trim().min(75, "Please provide at least 75 characters").max(1500),
  vehicle_knowledge: z.string().trim().min(75, "Please provide at least 75 characters").max(1500),
  customer_scenario: z.string().trim().min(100, "Please provide at least 100 characters").max(2000),
  availability: z.string().trim().min(20, "Please provide detailed availability information").max(500),
  additional_info: z.string().trim().max(1000).optional(),
});

type PDMApplicationFormData = z.infer<typeof pdmApplicationSchema>;

interface PDMApplicationFormProps { jobImage: string; }

const PDMApplicationForm = ({ jobImage }: PDMApplicationFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isOnCooldown, rejectedAt, loading, handleCooldownEnd, hasPendingApplication, pendingMessage, hasApprovedApplication, approvedMessage, isOnHold, onHoldMessage } = useApplicationCooldown('job_applications', 24, { column: 'job_type', value: 'PDM' });

  const form = useForm<PDMApplicationFormData>({
    resolver: zodResolver(pdmApplicationSchema),
    defaultValues: { character_name: "", discord_id: "", age: 18, phone_number: "", previous_experience: "", why_join: "", character_background: "", sales_experience: "", vehicle_knowledge: "", customer_scenario: "", availability: "", additional_info: "" },
  });

  const onSubmit = async (data: PDMApplicationFormData) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast({ title: "Authentication Required", description: "Please log in to submit an application.", variant: "destructive" }); return; }
      const { error } = await supabase.from("job_applications").insert({
        user_id: user.id, job_type: "PDM", character_name: data.character_name, discord_id: data.discord_id, age: data.age, phone_number: data.phone_number,
        previous_experience: data.previous_experience, why_join: data.why_join, character_background: data.character_background, availability: data.availability,
        job_specific_answer: `Sales Experience: ${data.sales_experience}\n\nVehicle Knowledge: ${data.vehicle_knowledge}\n\nCustomer Scenario: ${data.customer_scenario}`,
        additional_info: data.additional_info || null, status: "pending",
      });
      if (error) throw error;
      toast({ title: "Application Submitted", description: "Your PDM application has been submitted successfully. We'll review it soon!" });
      form.reset();
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast({ title: "Submission Failed", description: error.message || "Failed to submit application. Please try again.", variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  if (loading) return <CyberpunkFormWrapper title="PDM Car Dealership Application" icon={<Car className="w-6 h-6" />} description="Join the premium car dealership team"><div className="flex justify-center items-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--neon-cyan))]" /></div></CyberpunkFormWrapper>;
  if (hasApprovedApplication && approvedMessage) return <ApprovedApplicationAlert message={approvedMessage} jobImage={jobImage} title="PDM Car Dealership Application" icon={<Car className="w-6 h-6 text-green-500" />} />;
  if (isOnHold && onHoldMessage) return <OnHoldApplicationAlert message={onHoldMessage} jobImage={jobImage} title="PDM Car Dealership Application" icon={<Car className="w-6 h-6 text-blue-500" />} />;
  if (hasPendingApplication && pendingMessage) return <PendingApplicationAlert message={pendingMessage} jobImage={jobImage} title="PDM Car Dealership Application" icon={<Car className="w-6 h-6 text-primary" />} />;
  if (isOnCooldown && rejectedAt) return <CyberpunkFormWrapper title="PDM Car Dealership Application" icon={<Car className="w-6 h-6" />} description="Join the premium car dealership team"><ApplicationCooldownTimer rejectedAt={rejectedAt} cooldownHours={24} onCooldownEnd={handleCooldownEnd} /></CyberpunkFormWrapper>;

  return (
    <CyberpunkFormWrapper title="PDM Car Dealership Application" icon={<Car className="w-6 h-6" />} description="Join the premium car dealership team and help customers find their dream vehicles.">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <CyberpunkFieldset legend="Personal Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="character_name" render={({ field }) => (<FormItem><FormLabel>Character Name *</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="age" render={({ field }) => (<FormItem><FormLabel>Age *</FormLabel><FormControl><Input type="number" placeholder="25" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 18)} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="discord_id" render={({ field }) => (<FormItem><FormLabel>Discord ID *</FormLabel><FormControl><Input placeholder="e.g., 123456789012345678" {...field} /></FormControl><FormDescription>Your 17-19 digit Discord ID (required for role assignment)</FormDescription><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="phone_number" render={({ field }) => (<FormItem><FormLabel>In-Game Phone Number *</FormLabel><FormControl><Input placeholder="" {...field} /></FormControl><FormDescription>Your character's in-game phone number</FormDescription><FormMessage /></FormItem>)} />
          </CyberpunkFieldset>

          <CyberpunkFieldset legend="Experience & Motivation">
            <FormField control={form.control} name="why_join" render={({ field }) => (<FormItem><FormLabel>Why do you want to work at PDM Car Dealership? *</FormLabel><FormControl><Textarea placeholder="" className="min-h-[120px]" {...field} /></FormControl><FormDescription>Be genuine and detailed (minimum 100 characters)</FormDescription><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="previous_experience" render={({ field }) => (<FormItem><FormLabel>Previous Roleplay Experience *</FormLabel><FormControl><Textarea placeholder="" className="min-h-[100px]" {...field} /></FormControl><FormDescription>Detail your relevant RP background (minimum 50 characters)</FormDescription><FormMessage /></FormItem>)} />
          </CyberpunkFieldset>

          <CyberpunkFieldset legend="Character Background">
            <FormField control={form.control} name="character_background" render={({ field }) => (<FormItem><FormLabel>Character Background *</FormLabel><FormControl><Textarea placeholder="" className="min-h-[120px]" {...field} /></FormControl><FormDescription>Provide a detailed character background (minimum 100 characters)</FormDescription><FormMessage /></FormItem>)} />
          </CyberpunkFieldset>

          <CyberpunkFieldset legend="Sales & Vehicle Knowledge">
            <FormField control={form.control} name="sales_experience" render={({ field }) => (<FormItem><FormLabel>Sales Experience & Skills *</FormLabel><FormControl><Textarea placeholder="" className="min-h-[120px]" {...field} /></FormControl><FormDescription>Explain your sales background and customer handling skills (minimum 75 characters)</FormDescription><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="vehicle_knowledge" render={({ field }) => (<FormItem><FormLabel>Vehicle Knowledge *</FormLabel><FormControl><Textarea placeholder="" className="min-h-[120px]" {...field} /></FormControl><FormDescription>Show us your automotive knowledge (minimum 75 characters)</FormDescription><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="customer_scenario" render={({ field }) => (<FormItem><FormLabel>Scenario: A customer comes in with a budget of $50,000 looking for a family car. They're indecisive and comparing with a competitor. How would you handle this sale? *</FormLabel><FormControl><Textarea placeholder="" className="min-h-[150px]" {...field} /></FormControl><FormDescription>Provide a comprehensive response demonstrating your sales approach (minimum 100 characters)</FormDescription><FormMessage /></FormItem>)} />
          </CyberpunkFieldset>

          <CyberpunkFieldset legend="Availability">
            <FormField control={form.control} name="availability" render={({ field }) => (<FormItem><FormLabel>Availability *</FormLabel><FormControl><Textarea placeholder="" className="min-h-[80px]" {...field} /></FormControl><FormDescription>Be specific about your schedule (minimum 20 characters)</FormDescription><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="additional_info" render={({ field }) => (<FormItem><FormLabel>Additional Information</FormLabel><FormControl><Textarea placeholder="" className="min-h-[80px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
          </CyberpunkFieldset>

          <Button type="submit" className="w-full cyberpunk-submit-btn" disabled={isSubmitting}>
            {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</>) : (<><Car className="mr-2 h-4 w-4" />Submit PDM Application</>)}
          </Button>
        </form>
      </Form>
    </CyberpunkFormWrapper>
  );
};

export default PDMApplicationForm;
