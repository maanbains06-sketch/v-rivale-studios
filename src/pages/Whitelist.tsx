import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2 } from "lucide-react";

const whitelistSchema = z.object({
  steamId: z.string()
    .min(17, "Steam ID must be at least 17 characters")
    .max(20, "Steam ID must not exceed 20 characters")
    .regex(/^STEAM_[0-5]:[01]:\d+$/, "Invalid Steam ID format (e.g., STEAM_0:1:12345678)"),
  discord: z.string()
    .min(2, "Discord username is required")
    .max(37, "Discord username must not exceed 37 characters")
    .regex(/^.{2,32}#\d{4}$|^[a-z0-9_.]{2,32}$/, "Invalid Discord format (e.g., username#1234 or username)"),
  age: z.string()
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 16, "Must be at least 16 years old")
    .refine((val) => !isNaN(Number(val)) && Number(val) <= 100, "Please enter a valid age"),
  experience: z.string()
    .min(50, "Please provide at least 50 characters about your roleplay experience")
    .max(500, "Experience description must not exceed 500 characters"),
  backstory: z.string()
    .min(100, "Character backstory must be at least 100 characters")
    .max(1000, "Character backstory must not exceed 1000 characters"),
});

type WhitelistFormValues = z.infer<typeof whitelistSchema>;

const Whitelist = () => {
  const { toast } = useToast();
  const form = useForm<WhitelistFormValues>({
    resolver: zodResolver(whitelistSchema),
    defaultValues: {
      steamId: "",
      discord: "",
      age: "",
      experience: "",
      backstory: "",
    },
  });

  const onSubmit = (data: WhitelistFormValues) => {
    console.log("Whitelist application submitted:", data);
    toast({
      title: "Application Submitted!",
      description: "We'll review your application within 24-48 hours and contact you on Discord.",
    });
    form.reset();
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold text-gradient mb-4">Whitelist Application</h1>
              <p className="text-xl text-muted-foreground">
                Apply to join SLRP and become part of our exclusive community
              </p>
            </div>

            <div className="glass-effect rounded-xl p-8 border border-border/20">
              <div className="mb-6 p-4 glass-effect rounded-lg border border-primary/20">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-foreground/80">
                    <p className="font-semibold mb-1">Application Requirements:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Must be 16+ years old</li>
                      <li>Active Discord account required</li>
                      <li>Previous roleplay experience preferred</li>
                      <li>Commitment to server rules and quality RP</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="steamId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Steam ID</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="STEAM_0:1:12345678" 
                            {...field}
                            className="bg-background/50 border-border/40"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="discord"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discord Username</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="username#1234 or username" 
                            {...field}
                            className="bg-background/50 border-border/40"
                          />
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
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="18" 
                            {...field}
                            className="bg-background/50 border-border/40"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Roleplay Experience</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us about your previous roleplay experience in GTA or other games..."
                            className="min-h-32 bg-background/50 border-border/40 resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="backstory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Character Backstory</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Create a detailed backstory for your character. Include their history, personality, goals, and why they came to Los Santos..."
                            className="min-h-40 bg-background/50 border-border/40 resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6"
                  >
                    Submit Application
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Whitelist;
