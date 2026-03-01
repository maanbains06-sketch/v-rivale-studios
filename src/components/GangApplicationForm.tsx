import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Users, AlertTriangle } from "lucide-react";
import { useApplicationCooldown } from "@/hooks/useApplicationCooldown";
import { ApplicationCooldownTimer } from "@/components/ApplicationCooldownTimer";
import { PendingApplicationAlert } from "@/components/PendingApplicationAlert";
import { ApprovedApplicationAlert } from "@/components/ApprovedApplicationAlert";
import { OnHoldApplicationAlert } from "@/components/OnHoldApplicationAlert";
import CyberpunkFormWrapper from "@/components/CyberpunkFormWrapper";
import CyberpunkFieldset from "@/components/CyberpunkFieldset";
import { useApplicationOpen } from "@/hooks/useApplicationToggles";
import ApplicationClosedMessage from "@/components/ApplicationClosedMessage";

const gangFormSchema = z.object({
  discord_username: z.string().min(2, "Discord username is required"),
  discord_id: z.string().regex(/^\d{17,19}$/, "Discord ID must be 17-19 digits"),
  steam_id: z.string().min(5, "Steam ID is required"),
  age: z.number().min(16, "You must be at least 16 years old"),
  character_name: z.string().min(2, "Character name is required"),
  timezone: z.string().min(1, "Timezone is required"),
  rp_experience: z.string().min(50, "Please provide at least 50 characters"),
  gang_type_preference: z.string().min(1, "Please select your gang type preference"),
  character_backstory: z.string().min(100, "Please provide a detailed backstory"),
  gang_joining_reason: z.string().min(50, "Please explain why you want to join gang RP"),
  criminal_rp_experience: z.string().min(50, "Please describe your criminal RP experience"),
  conflict_scenario: z.string().min(100, "Please provide a detailed response"),
  police_chase_scenario: z.string().min(100, "Please describe how you would handle this"),
  turf_war_scenario: z.string().min(100, "Please describe your approach"),
  loyalty_definition: z.string().min(50, "Please define what loyalty means"),
  ranking_system_understanding: z.string().min(50, "Please explain your understanding"),
  initiation_willingness: z.string().min(1, "Please select your answer"),
  daily_availability: z.string().min(20, "Please describe your availability"),
  gang_rules_understanding: z.string().min(50, "Please explain your understanding"),
  previous_gang_experience: z.string().min(30, "Please describe any previous experience"),
  roleplay_scenario: z.string().min(150, "Please provide a detailed scenario"),
});

type GangFormData = z.infer<typeof gangFormSchema>;

interface GangApplicationFormProps {
  jobImage?: string;
}

const GangApplicationForm = ({ jobImage }: GangApplicationFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isOpen: isAppOpen, loading: toggleLoading } = useApplicationOpen('gang');

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
    { column: 'job_type', value: 'Gang Roleplay' }
  );

  const form = useForm<GangFormData>({
    resolver: zodResolver(gangFormSchema),
    defaultValues: {
      discord_username: "",
      discord_id: "",
      steam_id: "",
      age: 18 as number,
      character_name: "",
      timezone: "",
      rp_experience: "",
      gang_type_preference: "",
      character_backstory: "",
      gang_joining_reason: "",
      criminal_rp_experience: "",
      conflict_scenario: "",
      police_chase_scenario: "",
      turf_war_scenario: "",
      loyalty_definition: "",
      ranking_system_understanding: "",
      initiation_willingness: "",
      daily_availability: "",
      gang_rules_understanding: "",
      previous_gang_experience: "",
      roleplay_scenario: "",
    },
  });

  const onSubmit = async (data: GangFormData) => {
    try {
      setIsSubmitting(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to submit an application",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("job_applications")
        .insert({
          user_id: user.id,
          job_type: "Gang Roleplay",
          character_name: data.character_name,
          discord_id: data.discord_id,
          phone_number: data.discord_username,
          age: data.age,
          previous_experience: data.rp_experience,
          why_join: data.gang_joining_reason,
          character_background: data.character_backstory,
          availability: data.daily_availability,
          job_specific_answer: JSON.stringify({
            steam_id: data.steam_id,
            timezone: data.timezone,
            gang_type_preference: data.gang_type_preference,
            criminal_rp_experience: data.criminal_rp_experience,
            conflict_scenario: data.conflict_scenario,
            police_chase_scenario: data.police_chase_scenario,
            turf_war_scenario: data.turf_war_scenario,
            loyalty_definition: data.loyalty_definition,
            ranking_system_understanding: data.ranking_system_understanding,
            initiation_willingness: data.initiation_willingness,
            gang_rules_understanding: data.gang_rules_understanding,
            previous_gang_experience: data.previous_gang_experience,
            roleplay_scenario: data.roleplay_scenario,
          }),
          strengths: `Gang Type: ${data.gang_type_preference}, Timezone: ${data.timezone}`,
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Application Submitted!",
        description: "Your gang roleplay application has been submitted successfully. We'll review it soon!",
      });

      form.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit application",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (toggleLoading || loading) {
    return (
      <CyberpunkFormWrapper title="Gang Roleplay Application" icon={<Users className="w-6 h-6" />} description="Join the criminal underworld of San Andreas">
        <div className="flex justify-center items-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--neon-cyan))]" /></div>
      </CyberpunkFormWrapper>
    );
  }

  if (!isAppOpen) return <ApplicationClosedMessage title="Gang Roleplay Application" icon={<Users className="w-6 h-6" />} />;

  if (hasApprovedApplication && approvedMessage) {
    return <ApprovedApplicationAlert message={approvedMessage} jobImage={jobImage} title="Gang Roleplay Application" icon={<Users className="w-6 h-6 text-green-500" />} />;
  }

  if (isOnHold && onHoldMessage) {
    return <OnHoldApplicationAlert message={onHoldMessage} jobImage={jobImage} title="Gang Roleplay Application" icon={<Users className="w-6 h-6 text-blue-500" />} />;
  }

  if (hasPendingApplication && pendingMessage) {
    return <PendingApplicationAlert message={pendingMessage} jobImage={jobImage} title="Gang Roleplay Application" icon={<Users className="w-6 h-6 text-red-400" />} />;
  }

  if (isOnCooldown && rejectedAt) {
    return (
      <CyberpunkFormWrapper title="Gang Roleplay Application" icon={<Users className="w-6 h-6" />}>
        <ApplicationCooldownTimer rejectedAt={rejectedAt} cooldownHours={24} onCooldownEnd={handleCooldownEnd} />
      </CyberpunkFormWrapper>
    );
  }

  return (
    <CyberpunkFormWrapper title="Gang Roleplay Application" icon={<Users className="w-6 h-6" />} description="Join the criminal underworld of San Andreas">
      {/* Warning */}
      <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-semibold text-foreground mb-1">Important Notice</p>
            <p>Gang roleplay involves criminal activities within the server rules. You must understand and follow all gang RP guidelines. Breaking rules will result in removal from the gang and possible server ban.</p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <CyberpunkFieldset legend="Player Details">
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="discord_username" render={({ field }) => (
                <FormItem><FormLabel>Discord Username *</FormLabel><FormControl><Input placeholder="username#0000" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="steam_id" render={({ field }) => (
                <FormItem><FormLabel>Steam ID *</FormLabel><FormControl><Input placeholder="STEAM_0:1:12345678" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="age" render={({ field }) => (
                <FormItem><FormLabel>Your Age *</FormLabel><FormControl><Input type="number" min={16} {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 16)} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="character_name" render={({ field }) => (
                <FormItem><FormLabel>Character Name *</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="timezone" render={({ field }) => (
                <FormItem><FormLabel>Your Timezone *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select timezone" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="IST">IST (India Standard Time)</SelectItem>
                      <SelectItem value="GMT">GMT (Greenwich Mean Time)</SelectItem>
                      <SelectItem value="EST">EST (Eastern Standard Time)</SelectItem>
                      <SelectItem value="PST">PST (Pacific Standard Time)</SelectItem>
                      <SelectItem value="CET">CET (Central European Time)</SelectItem>
                      <SelectItem value="AEST">AEST (Australian Eastern Time)</SelectItem>
                    </SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="gang_type_preference" render={({ field }) => (
                <FormItem><FormLabel>Gang Type Preference *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select gang type" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="street_gang">Street Gang</SelectItem>
                      <SelectItem value="motorcycle_club">Motorcycle Club</SelectItem>
                      <SelectItem value="mafia">Mafia / Organized Crime</SelectItem>
                      <SelectItem value="cartel">Cartel</SelectItem>
                      <SelectItem value="any">Open to Any</SelectItem>
                    </SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
            </div>
          </CyberpunkFieldset>

          <CyberpunkFieldset legend="Roleplay Experience">
            <FormField control={form.control} name="rp_experience" render={({ field }) => (
              <FormItem><FormLabel>1. Describe your overall roleplay experience *</FormLabel><FormControl><Textarea placeholder="" className="min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="criminal_rp_experience" render={({ field }) => (
              <FormItem><FormLabel>2. What is your experience with criminal roleplay? *</FormLabel><FormControl><Textarea placeholder="" className="min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="previous_gang_experience" render={({ field }) => (
              <FormItem><FormLabel>3. Have you been part of any gangs in other RP servers? *</FormLabel><FormControl><Textarea placeholder="" className="min-h-[80px]" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </CyberpunkFieldset>

          <CyberpunkFieldset legend="Character & Story">
            <FormField control={form.control} name="character_backstory" render={({ field }) => (
              <FormItem><FormLabel>4. Write your character's backstory and how they got into gang life *</FormLabel><FormControl><Textarea placeholder="" className="min-h-[150px]" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="gang_joining_reason" render={({ field }) => (
              <FormItem><FormLabel>5. Why does your character want to join a gang? *</FormLabel><FormControl><Textarea placeholder="" className="min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </CyberpunkFieldset>

          <CyberpunkFieldset legend="Scenario Questions">
            <FormField control={form.control} name="conflict_scenario" render={({ field }) => (
              <FormItem><FormLabel>6. A rival gang member insults your gang in public. How do you handle it? *</FormLabel><FormControl><Textarea placeholder="" className="min-h-[120px]" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="police_chase_scenario" render={({ field }) => (
              <FormItem><FormLabel>7. During a drug deal, police arrive. What do you do? *</FormLabel><FormControl><Textarea placeholder="" className="min-h-[120px]" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="turf_war_scenario" render={({ field }) => (
              <FormItem><FormLabel>8. Your gang leader orders you to participate in a turf war. How do you approach it? *</FormLabel><FormControl><Textarea placeholder="" className="min-h-[120px]" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="roleplay_scenario" render={({ field }) => (
              <FormItem><FormLabel>9. Write a short roleplay scenario involving your character in gang activities *</FormLabel><FormControl><Textarea placeholder="Create a detailed RP scenario showing your character in action..." className="min-h-[150px]" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </CyberpunkFieldset>

          <CyberpunkFieldset legend="Understanding & Commitment">
            <FormField control={form.control} name="loyalty_definition" render={({ field }) => (
              <FormItem><FormLabel>10. What does loyalty mean to you in gang RP? *</FormLabel><FormControl><Textarea placeholder="Define loyalty in the context of gang roleplay..." className="min-h-[80px]" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="ranking_system_understanding" render={({ field }) => (
              <FormItem><FormLabel>11. How do you understand gang hierarchy and ranking systems? *</FormLabel><FormControl><Textarea placeholder="" className="min-h-[80px]" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="initiation_willingness" render={({ field }) => (
              <FormItem><FormLabel>12. Are you willing to go through initiation RP? *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select your answer" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="yes">Yes, fully committed</SelectItem>
                    <SelectItem value="yes_with_limits">Yes, with some limits</SelectItem>
                    <SelectItem value="need_more_info">Need more information</SelectItem>
                  </SelectContent>
                </Select><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="gang_rules_understanding" render={({ field }) => (
              <FormItem><FormLabel>13. How will you ensure you follow server and gang rules? *</FormLabel><FormControl><Textarea placeholder="" className="min-h-[80px]" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="daily_availability" render={({ field }) => (
              <FormItem><FormLabel>14. What is your daily/weekly availability? *</FormLabel><FormControl><Textarea placeholder="" className="min-h-[80px]" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </CyberpunkFieldset>

          <Button type="submit" className="w-full cyberpunk-submit-btn" disabled={isSubmitting}>
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</>
            ) : (
              <><Users className="mr-2 h-4 w-4" />Submit Gang Application</>
            )}
          </Button>
        </form>
      </Form>
    </CyberpunkFormWrapper>
  );
};

export default GangApplicationForm;
