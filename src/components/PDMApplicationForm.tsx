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
import { Loader2, Car } from "lucide-react";
import { useApplicationCooldown } from "@/hooks/useApplicationCooldown";
import { ApplicationCooldownTimer } from "@/components/ApplicationCooldownTimer";
import { PendingApplicationAlert } from "@/components/PendingApplicationAlert";

const pdmApplicationSchema = z.object({
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
  sales_experience: z.string()
    .trim()
    .min(75, "Please provide at least 75 characters")
    .max(1500, "Response must be less than 1500 characters"),
  vehicle_knowledge: z.string()
    .trim()
    .min(75, "Please provide at least 75 characters")
    .max(1500, "Response must be less than 1500 characters"),
  customer_scenario: z.string()
    .trim()
    .min(100, "Please provide at least 100 characters")
    .max(2000, "Response must be less than 2000 characters"),
  availability: z.string()
    .trim()
    .min(20, "Please provide detailed availability information")
    .max(500, "Availability must be less than 500 characters"),
  additional_info: z.string()
    .trim()
    .max(1000, "Additional info must be less than 1000 characters")
    .optional(),
});

type PDMApplicationFormData = z.infer<typeof pdmApplicationSchema>;

interface PDMApplicationFormProps {
  jobImage: string;
}

const PDMApplicationForm = ({ jobImage }: PDMApplicationFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isOnCooldown, rejectedAt, loading, handleCooldownEnd, hasPendingApplication, pendingMessage } = useApplicationCooldown(
    'job_applications',
    24,
    { column: 'job_type', value: 'PDM' }
  );

  const form = useForm<PDMApplicationFormData>({
    resolver: zodResolver(pdmApplicationSchema),
    defaultValues: {
      character_name: "",
      age: 18,
      phone_number: "",
      previous_experience: "",
      why_join: "",
      character_background: "",
      sales_experience: "",
      vehicle_knowledge: "",
      customer_scenario: "",
      availability: "",
      additional_info: "",
    },
  });

  const onSubmit = async (data: PDMApplicationFormData) => {
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
        .from("job_applications")
        .insert({
          user_id: user.id,
          job_type: "PDM",
          character_name: data.character_name,
          age: data.age,
          phone_number: data.phone_number,
          previous_experience: data.previous_experience,
          why_join: data.why_join,
          character_background: data.character_background,
          availability: data.availability,
          job_specific_answer: `Sales Experience: ${data.sales_experience}\n\nVehicle Knowledge: ${data.vehicle_knowledge}\n\nCustomer Scenario: ${data.customer_scenario}`,
          additional_info: data.additional_info || null,
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Application Submitted",
        description: "Your PDM application has been submitted successfully. We'll review it soon!",
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

  if (hasPendingApplication && pendingMessage) {
    return (
      <PendingApplicationAlert 
        message={pendingMessage}
        jobImage={jobImage}
        title="PDM Car Dealership Application"
        icon={<Car className="w-6 h-6 text-primary" />}
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
            alt="PDM Car Dealership"
            className="w-full h-full object-cover object-center opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 rounded-xl bg-primary/20 backdrop-blur-sm">
                <Car className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-1">PDM Car Dealership Application</h2>
                <p className="text-muted-foreground">Join the premium car dealership team and help customers find their dream vehicles.</p>
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
          alt="PDM Car Dealership"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 rounded-xl bg-primary/20 backdrop-blur-sm">
              <Car className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-1">PDM Car Dealership Application</h2>
              <p className="text-muted-foreground">Join the premium car dealership team and help customers find their dream vehicles.</p>
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
                    <FormLabel>Why do you want to work at PDM Car Dealership? *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Explain your motivation for joining PDM. What attracts you to the car sales industry?"
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
                        placeholder="Describe any relevant roleplay experience, especially in sales or customer service roles..."
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
                        placeholder="Tell us about your character's background and how they ended up wanting to work in car sales..."
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
                name="sales_experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sales Experience & Skills *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your sales experience, negotiation skills, and how you handle customer objections. Include any real-life or in-game sales experience..."
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Explain your sales background and customer handling skills (minimum 75 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vehicle_knowledge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Knowledge *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Demonstrate your knowledge of vehicles - types, brands, features, performance specs. What makes you qualified to recommend vehicles to customers?"
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Show us your automotive knowledge (minimum 75 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customer_scenario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scenario: A customer comes in with a budget of $50,000 looking for a family car. They're indecisive and comparing with a competitor. How would you handle this sale? *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Walk us through your approach: greeting, needs assessment, vehicle recommendations, handling objections, closing techniques, and after-sale follow-up..."
                        className="min-h-[150px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a comprehensive response demonstrating your sales approach (minimum 100 characters)
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
                        placeholder="What days and times are you available to work? Include your timezone..."
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
                        placeholder="Any additional information you'd like to share (optional)..."
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
                    <Car className="mr-2 h-4 w-4" />
                    Submit PDM Application
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

export default PDMApplicationForm;
