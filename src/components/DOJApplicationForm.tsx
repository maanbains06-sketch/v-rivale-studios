import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Scale, Gavel, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const dojApplicationSchema = z.object({
  characterName: z.string().min(2, "Character name is required").max(50),
  age: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 21, {
    message: "You must be at least 21 years old for DOJ positions"
  }),
  phoneNumber: z.string().min(7, "Valid phone number is required"),
  discordUsername: z.string().min(3, "Discord username is required"),
  legalExperience: z.string().min(50, "Please provide at least 50 characters about your legal experience"),
  lawKnowledge: z.string().min(50, "Please provide at least 50 characters about your knowledge of law"),
  courtScenario: z.string().min(100, "Please provide at least 100 characters for the court scenario"),
  whyDOJ: z.string().min(50, "Please explain why you want to join DOJ"),
  availability: z.string().min(10, "Please provide your availability"),
  characterBackground: z.string().min(50, "Please provide your character's legal background"),
  additionalInfo: z.string().optional(),
});

type DOJApplicationFormData = z.infer<typeof dojApplicationSchema>;

interface DOJApplicationFormProps {
  applicationType: "judge" | "lawyer";
  jobImage?: string;
}

const DOJApplicationForm = ({ applicationType, jobImage }: DOJApplicationFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const isJudge = applicationType === "judge";
  const title = isJudge ? "Judge Application" : "Attorney Application";
  const Icon = isJudge ? Gavel : Scale;

  const form = useForm<DOJApplicationFormData>({
    resolver: zodResolver(dojApplicationSchema),
    defaultValues: {
      characterName: "",
      age: "",
      phoneNumber: "",
      discordUsername: "",
      legalExperience: "",
      lawKnowledge: "",
      courtScenario: "",
      whyDOJ: "",
      availability: "",
      characterBackground: "",
      additionalInfo: "",
    },
  });

  async function onSubmit(data: DOJApplicationFormData) {
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "You must be logged in to submit an application.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("job_applications")
        .insert({
          user_id: user.id,
          job_type: isJudge ? "DOJ - Judge" : "DOJ - Attorney",
          character_name: data.characterName,
          age: parseInt(data.age),
          phone_number: data.phoneNumber,
          previous_experience: data.legalExperience,
          why_join: data.whyDOJ,
          character_background: data.characterBackground,
          availability: data.availability,
          job_specific_answer: `Law Knowledge: ${data.lawKnowledge}\n\nCourt Scenario Response: ${data.courtScenario}`,
          additional_info: data.additionalInfo || null,
          strengths: `Discord: ${data.discordUsername}`,
        });

      if (error) throw error;
      
      toast({
        title: "Application Submitted Successfully!",
        description: "Thank you for applying to the Department of Justice. We will review your application and contact you via Discord.",
      });
      
      form.reset();
    } catch (error) {
      console.error("Error submitting DOJ application:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="glass-effect border-border/20 overflow-hidden">
      {jobImage && (
        <div className="relative h-48 overflow-hidden">
          <img src={jobImage} alt={title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute bottom-4 left-6 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/20 border border-primary/30">
              <Icon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{title}</h2>
              <p className="text-sm text-muted-foreground">Department of Justice</p>
            </div>
          </div>
        </div>
      )}
      
      <CardHeader className={jobImage ? "pt-4" : ""}>
        {!jobImage && (
          <>
            <div className="flex items-center gap-3 mb-2">
              <Icon className="w-6 h-6 text-primary" />
              <CardTitle className="text-gradient">{title}</CardTitle>
            </div>
            <CardDescription>Department of Justice - San Andreas</CardDescription>
          </>
        )}
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
                    <FormLabel>Character Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Robert Martinez" {...field} />
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
                      <Input type="number" placeholder="21+" {...field} />
                    </FormControl>
                    <FormDescription>Minimum 21 years for DOJ</FormDescription>
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
                    <FormLabel>In-Game Phone Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="555-1234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discordUsername"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discord Username *</FormLabel>
                    <FormControl>
                      <Input placeholder="username#1234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="characterBackground"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Character Legal Background *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={isJudge 
                        ? "Describe your character's legal career journey. Include education (law school), previous positions as attorney/prosecutor, years of experience, notable cases..."
                        : "Describe your character's legal education and any law-related experience. Include law school attended, areas of specialization, internships..."
                      }
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
              name="legalExperience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isJudge ? "Judicial Experience *" : "Legal Experience *"}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={isJudge
                        ? "Describe your experience in legal proceedings, court cases, and any previous experience as a judge or magistrate in RP servers..."
                        : "Describe your experience representing clients, court appearances, legal research, and any RP server legal experience..."
                      }
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
              name="lawKnowledge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Knowledge of San Andreas Law *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Explain your understanding of criminal law, civil law, and court procedures in San Andreas. Mention any penal codes you're familiar with..."
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
              name="courtScenario"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Court Scenario *
                    </div>
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={isJudge
                        ? "Scenario: A defendant is charged with armed robbery. The prosecution presents strong evidence including surveillance footage, but the defense argues illegal search and seizure. How would you handle this case? Explain your ruling process and reasoning..."
                        : "Scenario: Your client is charged with assault causing grievous bodily harm. The victim claims your client attacked unprovoked, but your client claims self-defense. What would be your defense strategy? How would you present the case in court?..."
                      }
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Demonstrate your {isJudge ? "judicial reasoning" : "legal strategy"} skills
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="whyDOJ"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Why Do You Want to Join DOJ? *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={`Explain your motivation for becoming a ${isJudge ? "Judge" : "Attorney"} and how you will contribute to the justice system in San Andreas...`}
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
              name="availability"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weekly Availability & Timezone *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="e.g., Available Monday-Friday 6PM-10PM IST, Weekends 2PM-10PM IST. Can attend scheduled court sessions with 24hr notice..."
                      className="min-h-[80px]"
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
                  <FormLabel>Additional Information</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional information you'd like to share about your qualifications, previous RP experience, or anything else..."
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting Application...
                </>
              ) : (
                <>
                  <Icon className="mr-2 h-4 w-4" />
                  Submit {isJudge ? "Judge" : "Attorney"} Application
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default DOJApplicationForm;