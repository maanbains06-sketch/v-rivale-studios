import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const jobApplicationSchema = z.object({
  characterName: z.string().trim().min(2, "Character name must be at least 2 characters").max(100),
  age: z.number().min(18, "Must be 18 or older").max(100),
  phoneNumber: z.string().trim().min(7, "Valid phone number required").max(20),
  previousExperience: z.string().trim().min(50, "Please provide at least 50 characters").max(2000),
  whyJoin: z.string().trim().min(50, "Please provide at least 50 characters").max(2000),
  characterBackground: z.string().trim().min(100, "Please provide at least 100 characters").max(3000),
  availability: z.string().trim().min(20, "Please describe your availability").max(500),
  additionalInfo: z.string().max(1000).optional(),
});

type JobApplicationFormData = z.infer<typeof jobApplicationSchema>;

interface JobApplicationFormProps {
  jobType: "police" | "ems" | "mechanic";
  jobTitle: string;
  description: string;
}

const JobApplicationForm = ({ jobType, jobTitle, description }: JobApplicationFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<JobApplicationFormData>({
    resolver: zodResolver(jobApplicationSchema),
  });

  const onSubmit = async (data: JobApplicationFormData) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to submit a job application.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("job_applications").insert({
        user_id: user.id,
        job_type: jobType,
        character_name: data.characterName,
        age: data.age,
        phone_number: data.phoneNumber,
        previous_experience: data.previousExperience,
        why_join: data.whyJoin,
        character_background: data.characterBackground,
        availability: data.availability,
        additional_info: data.additionalInfo || null,
      });

      if (error) throw error;

      toast({
        title: "Application Submitted!",
        description: "Your application has been received. We'll review it and get back to you soon.",
      });
      
      reset();
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

  return (
    <Card className="glass-effect border-primary/30">
      <CardHeader>
        <CardTitle className="text-xl text-primary">{jobTitle} Application</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${jobType}-characterName`}>Character Name *</Label>
              <Input
                id={`${jobType}-characterName`}
                {...register("characterName")}
                placeholder="John Doe"
              />
              {errors.characterName && (
                <p className="text-sm text-destructive">{errors.characterName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${jobType}-age`}>Character Age *</Label>
              <Input
                id={`${jobType}-age`}
                type="number"
                {...register("age", { valueAsNumber: true })}
                placeholder="25"
              />
              {errors.age && (
                <p className="text-sm text-destructive">{errors.age.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${jobType}-phoneNumber`}>Phone Number *</Label>
            <Input
              id={`${jobType}-phoneNumber`}
              {...register("phoneNumber")}
              placeholder="555-0123"
            />
            {errors.phoneNumber && (
              <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${jobType}-previousExperience`}>Previous Experience *</Label>
            <Textarea
              id={`${jobType}-previousExperience`}
              {...register("previousExperience")}
              placeholder="Describe your previous work experience and relevant skills (minimum 50 characters)"
              className="min-h-[100px]"
            />
            {errors.previousExperience && (
              <p className="text-sm text-destructive">{errors.previousExperience.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${jobType}-whyJoin`}>Why do you want to join? *</Label>
            <Textarea
              id={`${jobType}-whyJoin`}
              {...register("whyJoin")}
              placeholder="Explain your motivation for joining this department (minimum 50 characters)"
              className="min-h-[100px]"
            />
            {errors.whyJoin && (
              <p className="text-sm text-destructive">{errors.whyJoin.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${jobType}-characterBackground`}>Character Background Story *</Label>
            <Textarea
              id={`${jobType}-characterBackground`}
              {...register("characterBackground")}
              placeholder="Tell us your character's backstory and how they ended up in Los Santos (minimum 100 characters)"
              className="min-h-[150px]"
            />
            {errors.characterBackground && (
              <p className="text-sm text-destructive">{errors.characterBackground.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${jobType}-availability`}>Availability & Schedule *</Label>
            <Textarea
              id={`${jobType}-availability`}
              {...register("availability")}
              placeholder="When are you typically available to play? (e.g., weekdays 6pm-11pm EST, weekends flexible)"
              className="min-h-[80px]"
            />
            {errors.availability && (
              <p className="text-sm text-destructive">{errors.availability.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${jobType}-additionalInfo`}>Additional Information (Optional)</Label>
            <Textarea
              id={`${jobType}-additionalInfo`}
              {...register("additionalInfo")}
              placeholder="Any additional information you'd like to share"
              className="min-h-[80px]"
            />
            {errors.additionalInfo && (
              <p className="text-sm text-destructive">{errors.additionalInfo.message}</p>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Application"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default JobApplicationForm;
