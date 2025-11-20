import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const staffApplicationSchema = z.object({
  fullName: z.string()
    .trim()
    .min(2, { message: "Full name must be at least 2 characters" })
    .max(100, { message: "Full name must be less than 100 characters" }),
  age: z.string()
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 18 && Number(val) <= 100, {
      message: "Age must be between 18 and 100"
    }),
  discordUsername: z.string()
    .trim()
    .min(3, { message: "Discord username is required" })
    .max(50, { message: "Discord username must be less than 50 characters" })
    .regex(/^.{2,32}#\d{4}$|^[a-z0-9._]{2,32}$/, { 
      message: "Please enter a valid Discord username (e.g., username#1234 or username)" 
    }),
  inGameName: z.string()
    .trim()
    .min(2, { message: "In-game name must be at least 2 characters" })
    .max(50, { message: "In-game name must be less than 50 characters" }),
  position: z.enum(["moderator", "developer", "event_coordinator", "content_creator"]),
  playtime: z.string()
    .trim()
    .min(1, { message: "Please specify your playtime" })
    .max(200, { message: "Playtime description must be less than 200 characters" }),
  experience: z.string()
    .trim()
    .min(50, { message: "Please provide at least 50 characters about your experience" })
    .max(1000, { message: "Experience must be less than 1000 characters" }),
  whyJoin: z.string()
    .trim()
    .min(50, { message: "Please provide at least 50 characters about why you want to join" })
    .max(1000, { message: "Reason must be less than 1000 characters" }),
  availability: z.string()
    .trim()
    .min(10, { message: "Please provide details about your availability" })
    .max(500, { message: "Availability must be less than 500 characters" }),
  previousExperience: z.string()
    .trim()
    .max(1000, { message: "Previous experience must be less than 1000 characters" })
    .optional(),
});

type StaffApplicationFormData = z.infer<typeof staffApplicationSchema>;

interface StaffApplicationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StaffApplicationForm({ open, onOpenChange }: StaffApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<StaffApplicationFormData>({
    resolver: zodResolver(staffApplicationSchema),
    defaultValues: {
      fullName: "",
      age: "",
      discordUsername: "",
      inGameName: "",
      playtime: "",
      experience: "",
      whyJoin: "",
      availability: "",
      previousExperience: "",
    },
  });

  async function onSubmit(data: StaffApplicationFormData) {
    setIsSubmitting(true);
    
    try {
      // Here you would send the data to your backend/database
      // For now, we'll simulate a submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Application Submitted!",
        description: "Thank you for applying! We'll review your application and contact you on Discord within 3-5 business days.",
      });
      
      form.reset();
      onOpenChange(false);
    } catch (error) {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-gradient">Staff Application Form</DialogTitle>
          <DialogDescription>
            Fill out this form to apply for a staff position at SLRP. All fields are required unless marked optional.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
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
                      <Input type="number" placeholder="18" {...field} />
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
                name="discordUsername"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discord Username *</FormLabel>
                    <FormControl>
                      <Input placeholder="username#1234 or username" {...field} />
                    </FormControl>
                    <FormDescription>We'll contact you here</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="inGameName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>In-Game Character Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John_Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position Applying For *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a position" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="developer">Developer</SelectItem>
                      <SelectItem value="event_coordinator">Event Coordinator</SelectItem>
                      <SelectItem value="content_creator">Content Creator</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="playtime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Playtime on SLRP *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 300+ hours over 6 months" {...field} />
                  </FormControl>
                  <FormDescription>Approximate hours and duration</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="experience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relevant Experience *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your experience with roleplay, moderation, development, or relevant skills..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value.length}/1000 characters (minimum 50)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="whyJoin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Why Do You Want To Join The Staff Team? *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Explain your motivation and what you can contribute to SLRP..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value.length}/1000 characters (minimum 50)
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
                      placeholder="Describe your typical availability (days, hours, timezone)..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Include your timezone and typical hours available
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="previousExperience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Previous Staff Experience (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Have you been staff on other servers? Describe your roles and responsibilities..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Leave blank if none</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
