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
import { Loader2, Building2, UtensilsCrossed, Wrench, Car, ArrowLeft, CheckCircle2, PartyPopper } from "lucide-react";
import { useApplicationCooldown } from "@/hooks/useApplicationCooldown";
import { ApplicationCooldownTimer } from "@/components/ApplicationCooldownTimer";
import { PendingApplicationAlert } from "@/components/PendingApplicationAlert";
import { ApprovedApplicationAlert } from "@/components/ApprovedApplicationAlert";
import { OnHoldApplicationAlert } from "@/components/OnHoldApplicationAlert";
import { motion } from "framer-motion";

const businessApplicationSchema = z.object({
  business_name: z.string()
    .trim()
    .min(3, "Business name must be at least 3 characters")
    .max(100, "Business name must be less than 100 characters"),
  owner_name: z.string()
    .trim()
    .min(2, "Owner name must be at least 2 characters")
    .max(50, "Owner name must be less than 50 characters"),
  phone_number: z.string()
    .trim()
    .min(3, "Phone number is required")
    .max(20, "Phone number must be less than 20 characters"),
  investment_amount: z.string()
    .trim()
    .min(1, "Investment amount is required")
    .max(50, "Investment amount must be less than 50 characters"),
  target_customers: z.string()
    .trim()
    .min(30, "Please describe your target customer base")
    .max(500, "Target customers must be less than 500 characters"),
  business_plan: z.string()
    .trim()
    .min(150, "Please provide at least 150 characters for your business plan")
    .max(3000, "Business plan must be less than 3000 characters"),
  previous_experience: z.string()
    .trim()
    .min(50, "Please provide at least 50 characters")
    .max(1000, "Previous experience must be less than 1000 characters"),
  why_this_business: z.string()
    .trim()
    .min(100, "Please provide at least 100 characters")
    .max(1500, "Response must be less than 1500 characters"),
  employee_count: z.string()
    .trim()
    .min(1, "Please specify expected employee count")
    .max(100, "Employee count must be less than 100 characters"),
  operating_hours: z.string()
    .trim()
    .min(10, "Please provide operating hours")
    .max(200, "Operating hours must be less than 200 characters"),
  unique_selling_point: z.string()
    .trim()
    .min(50, "Please provide at least 50 characters")
    .max(1000, "Unique selling point must be less than 1000 characters"),
  additional_info: z.string()
    .trim()
    .max(1000, "Additional info must be less than 1000 characters")
    .optional(),
});

type BusinessApplicationFormData = z.infer<typeof businessApplicationSchema>;

export type BusinessType = "real_estate" | "food_joint" | "mechanic_shop" | "tuner_shop" | "entertainment";

interface BusinessApplicationFormProps {
  businessType: BusinessType;
  onBack: () => void;
}

const businessConfig: Record<BusinessType, {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
  planPrompt: string;
  uspPrompt: string;
  targetPrompt: string;
}> = {
  real_estate: {
    title: "Real Estate Agency",
    description: "Buy, sell, and manage properties across Los Santos. Build your real estate empire.",
    icon: <Building2 className="w-8 h-8" />,
    color: "text-blue-500",
    bgGradient: "from-blue-500/20 via-blue-600/10 to-transparent",
    planPrompt: "Describe your vision for the real estate agency. What properties will you focus on? How will you attract clients? What services will you offer (rentals, sales, property management)?",
    uspPrompt: "What makes your real estate agency unique? Do you have a niche market focus or innovative approach to property deals?",
    targetPrompt: "Who are your ideal clients? Luxury buyers, first-time homeowners, commercial investors, or rental seekers?",
  },
  food_joint: {
    title: "Food Joint / Restaurant",
    description: "Serve delicious food to the citizens of Los Santos. From fast food to fine dining.",
    icon: <UtensilsCrossed className="w-8 h-8" />,
    color: "text-orange-500",
    bgGradient: "from-orange-500/20 via-orange-600/10 to-transparent",
    planPrompt: "Describe your restaurant concept. What cuisine will you serve? What's the dining experience like? How will you source ingredients and manage the kitchen?",
    uspPrompt: "What makes your food joint special? Signature dishes, unique ambiance, or innovative service style?",
    targetPrompt: "Who will be your main customers? Late-night crowds, families, business professionals, or tourists?",
  },
  mechanic_shop: {
    title: "Mechanic Shop",
    description: "Repair, maintain, and customize vehicles. Keep Los Santos moving.",
    icon: <Wrench className="w-8 h-8" />,
    color: "text-green-500",
    bgGradient: "from-green-500/20 via-green-600/10 to-transparent",
    planPrompt: "Describe your mechanic shop operations. What services will you offer? How will you handle emergency repairs? What's your pricing strategy?",
    uspPrompt: "What sets your mechanic shop apart? Specialized expertise, quick turnaround, or premium customer service?",
    targetPrompt: "Who are your target customers? Daily drivers, commercial fleets, luxury car owners, or emergency repairs?",
  },
  tuner_shop: {
    title: "Tuner Shop",
    description: "Transform vehicles into performance machines. Custom builds and racing modifications.",
    icon: <Car className="w-8 h-8" />,
    color: "text-purple-500",
    bgGradient: "from-purple-500/20 via-purple-600/10 to-transparent",
    planPrompt: "Describe your tuner shop vision. What modifications will you specialize in? Performance tuning, visual mods, or both? How will you build your reputation in the racing scene?",
    uspPrompt: "What makes your tuner shop the go-to destination? Exclusive parts, racing expertise, or custom fabrication skills?",
    targetPrompt: "Who are your ideal customers? Street racers, car enthusiasts, show car builders, or drift scene members?",
  },
  entertainment: {
    title: "Entertainment Venue",
    description: "Create unforgettable experiences with clubs, bars, and event spaces.",
    icon: <PartyPopper className="w-8 h-8" />,
    color: "text-pink-500",
    bgGradient: "from-pink-500/20 via-pink-600/10 to-transparent",
    planPrompt: "Describe your entertainment venue vision. What type of venue will it be (nightclub, bar, event space)? What events will you host? How will you create a unique atmosphere and experience?",
    uspPrompt: "What makes your venue stand out? Exclusive atmosphere, celebrity appearances, themed nights, or premium VIP services?",
    targetPrompt: "Who are your ideal patrons? Party-goers, corporate event organizers, high-rollers, or the general nightlife crowd?",
  },
};

const BusinessApplicationForm = ({ businessType, onBack }: BusinessApplicationFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const config = businessConfig[businessType];

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
    'business_applications',
    48,
    { column: 'business_type', value: businessType }
  );

  const form = useForm<BusinessApplicationFormData>({
    resolver: zodResolver(businessApplicationSchema),
    defaultValues: {
      business_name: "",
      owner_name: "",
      phone_number: "",
      investment_amount: "",
      target_customers: "",
      business_plan: "",
      previous_experience: "",
      why_this_business: "",
      employee_count: "",
      operating_hours: "",
      unique_selling_point: "",
      additional_info: "",
    },
  });

  const onSubmit = async (data: BusinessApplicationFormData) => {
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to submit a business application.",
          variant: "destructive",
        });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("discord_id")
        .eq("id", user.id)
        .single();

      const { error } = await supabase
        .from("business_applications")
        .insert({
          business_name: data.business_name,
          owner_name: data.owner_name,
          phone_number: data.phone_number,
          investment_amount: data.investment_amount,
          target_customers: data.target_customers,
          business_plan: data.business_plan,
          previous_experience: data.previous_experience,
          why_this_business: data.why_this_business,
          employee_count: data.employee_count,
          operating_hours: data.operating_hours,
          unique_selling_point: data.unique_selling_point,
          additional_info: data.additional_info || null,
          business_type: businessType,
          user_id: user.id,
          discord_id: profile?.discord_id || null,
          status: "pending",
        } as any);

      if (error) throw error;

      toast({
        title: "Application Submitted!",
        description: `Your ${config.title} application has been submitted successfully. We'll review it soon!`,
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

  if (hasApprovedApplication && approvedMessage) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Business Types
        </Button>
        <ApprovedApplicationAlert 
          message={approvedMessage}
          title={`${config.title} Application`}
          icon={config.icon}
        />
      </div>
    );
  }

  if (isOnHold && onHoldMessage) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Business Types
        </Button>
        <OnHoldApplicationAlert 
          message={onHoldMessage}
          title={`${config.title} Application`}
          icon={config.icon}
        />
      </div>
    );
  }

  if (hasPendingApplication && pendingMessage) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Business Types
        </Button>
        <PendingApplicationAlert 
          message={pendingMessage}
          title={`${config.title} Application`}
          icon={config.icon}
        />
      </div>
    );
  }

  if (isOnCooldown && rejectedAt) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Business Types
        </Button>
        <ApplicationCooldownTimer 
          rejectedAt={rejectedAt} 
          cooldownHours={48}
          onCooldownEnd={handleCooldownEnd}
        />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ArrowLeft className="w-4 h-4" /> Back to Business Types
      </Button>

      {/* Business Header */}
      <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${config.bgGradient} border border-border/20 p-8`}>
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-xl bg-background/50 backdrop-blur-sm ${config.color}`}>
            {config.icon}
          </div>
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-1">{config.title}</h2>
            <p className="text-muted-foreground">{config.description}</p>
          </div>
        </div>
      </div>

      <Card className="glass-effect border-border/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            Business Proposal Application
          </CardTitle>
          <CardDescription>
            Fill out this form to apply for a {config.title.toLowerCase()} license. All fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Business Type Display */}
              <div className="p-4 rounded-xl bg-muted/50 border border-border/30">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${config.color} bg-background`}>
                    {config.icon}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Applying For</p>
                    <p className="font-semibold text-foreground">{config.title}</p>
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="business_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Business Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Los Santos Properties LLC" {...field} />
                      </FormControl>
                      <FormDescription>
                        What will you name your {config.title.toLowerCase()}?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="owner_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner Name (IC) *</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>In-Game Phone Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="555-0123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="investment_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Investment Amount *</FormLabel>
                      <FormControl>
                        <Input placeholder="$500,000" {...field} />
                      </FormControl>
                      <FormDescription>
                        How much are you willing to invest initially?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="target_customers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Customer Base *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={config.targetPrompt}
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Describe who your ideal customers are
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="business_plan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Plan *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={config.planPrompt}
                        className="min-h-[180px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a detailed business plan (minimum 150 characters)
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
                    <FormLabel>Previous Business/RP Experience *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe any previous experience running businesses in RP or similar roles..."
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
                name="why_this_business"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Why Do You Want This Business? *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Explain your motivation for starting this particular business. What drives your passion for this venture?"
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="employee_count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Employee Count *</FormLabel>
                      <FormControl>
                        <Input placeholder="5-10 employees" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="operating_hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Operating Hours *</FormLabel>
                      <FormControl>
                        <Input placeholder="Mon-Sat 9AM-9PM IST" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="unique_selling_point"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unique Selling Point *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={config.uspPrompt}
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
                name="additional_info"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Information (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any other information you'd like to share about your business proposal..."
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting Application...
                  </>
                ) : (
                  <>
                    Submit Business Proposal
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default BusinessApplicationForm;
