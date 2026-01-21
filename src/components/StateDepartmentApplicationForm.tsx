import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Building2 } from "lucide-react";
import { useApplicationCooldown } from "@/hooks/useApplicationCooldown";
import { ApplicationCooldownTimer } from "@/components/ApplicationCooldownTimer";
import { PendingApplicationAlert } from "@/components/PendingApplicationAlert";
import { ApprovedApplicationAlert } from "@/components/ApprovedApplicationAlert";
import { OnHoldApplicationAlert } from "@/components/OnHoldApplicationAlert";
const formSchema = z.object({
  characterName: z.string().min(2, "Character name must be at least 2 characters"),
  age: z.number().min(18, "Must be at least 18").max(100, "Must be under 100"),
  phoneNumber: z.string().min(7, "Phone number must be at least 7 digits"),
  departmentRole: z.string().min(1, "Please select a department role"),
  governmentExperience: z.string().min(50, "Please provide at least 50 characters about your government RP experience"),
  lawKnowledge: z.string().min(50, "Please describe your knowledge of laws and regulations"),
  proposedPolicies: z.string().min(50, "Please describe at least one policy you would propose"),
  citizenScenario: z.string().min(50, "Please provide a detailed response to the citizen scenario"),
  corruption: z.string().min(50, "Please describe how you would handle corruption"),
  whyJoin: z.string().min(50, "Please provide at least 50 characters"),
  availability: z.string().min(1, "Please select your availability"),
  additionalInfo: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface StateDepartmentApplicationFormProps {
  jobImage?: string;
}

const StateDepartmentApplicationForm = ({ jobImage }: StateDepartmentApplicationFormProps) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { 
    isOnCooldown, 
    rejectedAt, 
    loading: cooldownLoading, 
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
    { column: 'job_type', value: 'State Department' }
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      characterName: "",
      age: 21,
      phoneNumber: "",
      departmentRole: "",
      governmentExperience: "",
      lawKnowledge: "",
      proposedPolicies: "",
      citizenScenario: "",
      corruption: "",
      whyJoin: "",
      availability: "",
      additionalInfo: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to submit an application.",
          variant: "destructive",
        });
        return;
      }

      // Check for existing pending application
      const { data: existingApp } = await supabase
        .from("job_applications")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("job_type", "State Department")
        .in("status", ["pending", "on_hold"])
        .single();

      if (existingApp) {
        toast({
          title: "Application Exists",
          description: "You already have a pending State Department application.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("job_applications")
        .insert({
          user_id: user.id,
          job_type: "State Department",
          character_name: values.characterName,
          age: values.age,
          phone_number: values.phoneNumber,
          previous_experience: values.governmentExperience,
          character_background: `Department Role: ${values.departmentRole}\n\nLaw Knowledge: ${values.lawKnowledge}\n\nProposed Policies: ${values.proposedPolicies}\n\nCorruption Handling: ${values.corruption}`,
          job_specific_answer: values.citizenScenario,
          why_join: values.whyJoin,
          availability: values.availability,
          additional_info: values.additionalInfo || null,
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Application Submitted",
        description: "Your State Department application has been submitted for review.",
      });

      navigate("/application-status");
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (cooldownLoading) {
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
        title="State Department Application"
        icon={<Building2 className="w-6 h-6 text-green-500" />}
      />
    );
  }

  if (isOnHold && onHoldMessage) {
    return (
      <OnHoldApplicationAlert 
        message={onHoldMessage}
        jobImage={jobImage}
        title="State Department Application"
        icon={<Building2 className="w-6 h-6 text-blue-500" />}
      />
    );
  }

  if (hasPendingApplication && pendingMessage) {
    return (
      <PendingApplicationAlert 
        message={pendingMessage}
        jobImage={jobImage}
        title="State Department Application"
        icon={<Building2 className="w-6 h-6 text-amber-400" />}
      />
    );
  }

  if (isOnCooldown && rejectedAt) {
    return (
      <Card className="glass-effect border-border/20">
        <CardHeader>
          {jobImage && (
            <div className="relative h-48 -mx-6 -mt-6 mb-6 overflow-hidden rounded-t-lg">
              <img src={jobImage} alt="State Department" className="w-full h-full object-cover opacity-50" />
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
              <div className="absolute bottom-4 left-6 flex items-center gap-3">
                <Building2 className="w-8 h-8 text-amber-400" />
                <span className="text-2xl font-bold text-white">State Department</span>
              </div>
            </div>
          )}
          <CardTitle className="text-gradient flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            State Department Application
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ApplicationCooldownTimer 
            rejectedAt={rejectedAt} 
            cooldownHours={24}
            onCooldownEnd={handleCooldownEnd}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect border-border/20">
      <CardHeader>
        {jobImage && (
          <div className="relative h-48 -mx-6 -mt-6 mb-6 overflow-hidden rounded-t-lg">
            <img src={jobImage} alt="State Department" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
            <div className="absolute bottom-4 left-6 flex items-center gap-3">
              <Building2 className="w-8 h-8 text-amber-400" />
              <span className="text-2xl font-bold text-white">State Department</span>
            </div>
          </div>
        )}
        <CardTitle className="text-gradient flex items-center gap-2">
          <Building2 className="w-6 h-6" />
          State Department Application
        </CardTitle>
        <CardDescription>
          Apply to serve in the State Government. Shape policies, manage public affairs, and represent the people.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="characterName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Character Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Smith" {...field} />
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
                    <FormLabel>Character Age</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                      />
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
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>In-Game Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="555-1234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="departmentRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desired Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="governor_staff">Governor's Staff</SelectItem>
                        <SelectItem value="public_relations">Public Relations Officer</SelectItem>
                        <SelectItem value="policy_advisor">Policy Advisor</SelectItem>
                        <SelectItem value="secretary">Department Secretary</SelectItem>
                        <SelectItem value="inspector">State Inspector</SelectItem>
                        <SelectItem value="clerk">Government Clerk</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="availability"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weekly Availability</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select availability" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="5-10">5-10 hours per week</SelectItem>
                      <SelectItem value="10-20">10-20 hours per week</SelectItem>
                      <SelectItem value="20-30">20-30 hours per week</SelectItem>
                      <SelectItem value="30+">30+ hours per week</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="governmentExperience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Government RP Experience</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe any previous experience with government roleplay in GTA 5 RP or other servers..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Include any political, administrative, or public service roles</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lawKnowledge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Knowledge of Laws & Regulations</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your understanding of San Andreas laws, city ordinances, and government procedures..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>What do you know about how laws are created and enforced?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="proposedPolicies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Policy Proposal</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="If you could propose one new policy or law for Los Santos, what would it be and why?"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Be creative and think about what would benefit the community</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="citizenScenario"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scenario: Citizen Complaint</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="A citizen comes to you claiming the police unfairly impounded their vehicle. How would you handle this situation?"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Describe your approach step by step</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="corruption"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scenario: Handling Corruption</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="You discover that a fellow government official is accepting bribes. What do you do?"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Explain your decision-making process</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="whyJoin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Why do you want to join the State Department?</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="What motivates you to serve in government and what unique perspective do you bring?"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="additionalInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Information (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any other information you'd like to share..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default StateDepartmentApplicationForm;
