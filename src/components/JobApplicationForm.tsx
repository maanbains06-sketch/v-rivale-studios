import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Shield, Heart, Wrench } from "lucide-react";

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
    .min(10, "Please provide at least 10 characters")
    .max(1000, "Previous experience must be less than 1000 characters"),
  why_join: z.string()
    .trim()
    .min(20, "Please provide at least 20 characters")
    .max(1000, "Response must be less than 1000 characters"),
  character_background: z.string()
    .trim()
    .min(50, "Please provide at least 50 characters for character background")
    .max(2000, "Character background must be less than 2000 characters"),
  availability: z.string()
    .trim()
    .min(10, "Please describe your availability")
    .max(500, "Availability must be less than 500 characters"),
  additional_info: z.string()
    .trim()
    .max(1000, "Additional info must be less than 1000 characters")
    .optional(),
});

type JobApplicationFormData = z.infer<typeof jobApplicationSchema>;

interface JobApplicationFormProps {
  jobType: "Police Department" | "EMS" | "Mechanic";
}

const JobApplicationForm = ({ jobType }: JobApplicationFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<JobApplicationFormData>({
    resolver: zodResolver(jobApplicationSchema),
    defaultValues: {
      character_name: "",
      age: 18,
      phone_number: "",
      previous_experience: "",
      why_join: "",
      character_background: "",
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
        return "Join the LSPD and help maintain law and order in San Andreas. Serve and protect the community.";
      case "EMS":
        return "Save lives as an Emergency Medical Services professional. Provide critical medical care to citizens.";
      case "Mechanic":
        return "Keep vehicles running smoothly. Provide repair and maintenance services to the community.";
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

  return (
    <Card className="glass-effect border-border/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          {getJobIcon()}
          <div>
            <CardTitle className="text-gradient">{jobType} Application</CardTitle>
            <CardDescription>{getJobDescription()}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
                      placeholder="Explain your motivation for joining this position..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Minimum 20 characters
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
                  <FormLabel>Previous Experience *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe any relevant roleplay experience..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Previous roleplay experience in similar roles (minimum 10 characters)
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
                  <FormLabel>Character Background Story *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell us about your character's background and story..."
                      className="min-h-[150px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Provide detailed background about your character (minimum 50 characters)
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
                      placeholder="What days/times are you typically available to play?"
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Your typical availability for roleplay
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
                      placeholder="Any additional information you'd like to share..."
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
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
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

export default JobApplicationForm;
