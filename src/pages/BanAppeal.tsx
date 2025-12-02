import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import headerBg from "@/assets/header-support.jpg";

const BanAppeal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    discordUsername: "",
    banReason: "",
    appealReason: "",
    additionalInfo: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to submit a ban appeal.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      const { error } = await supabase.from("ban_appeals").insert({
        user_id: user.id,
        discord_username: formData.discordUsername,
        steam_id: "N/A", // Steam ID removed from authentication
        ban_reason: formData.banReason,
        appeal_reason: formData.appealReason,
        additional_info: formData.additionalInfo || null,
      });

      if (error) throw error;

      toast({
        title: "Ban Appeal Submitted",
        description: "Your appeal has been submitted successfully. Our team will review it shortly.",
      });

      navigate("/");
    } catch (error) {
      console.error("Error submitting ban appeal:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your appeal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader
        title="Ban Appeal"
        description="Submit an appeal if you believe your ban was unjustified"
        backgroundImage={headerBg}
      />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <Card className="glass-effect border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-8 h-8 text-primary" />
                <CardTitle className="text-3xl">Submit Ban Appeal</CardTitle>
              </div>
              <CardDescription className="text-base">
                Please provide detailed and honest information about your ban. False information may result in permanent denial of your appeal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="discordUsername">Discord Username *</Label>
                  <Input
                    id="discordUsername"
                    name="discordUsername"
                    placeholder="username#0000"
                    value={formData.discordUsername}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="banReason">Reason for Ban (as stated by staff) *</Label>
                  <Textarea
                    id="banReason"
                    name="banReason"
                    placeholder="What were you banned for?"
                    value={formData.banReason}
                    onChange={handleChange}
                    required
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appealReason">Why Should We Unban You? *</Label>
                  <Textarea
                    id="appealReason"
                    name="appealReason"
                    placeholder="Explain why you believe the ban should be lifted. Be honest and detailed."
                    value={formData.appealReason}
                    onChange={handleChange}
                    required
                    className="min-h-[150px]"
                  />
                  <p className="text-sm text-muted-foreground">
                    Provide a detailed explanation of your perspective and any evidence that supports your appeal.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalInfo">Additional Information (Optional)</Label>
                  <Textarea
                    id="additionalInfo"
                    name="additionalInfo"
                    placeholder="Any other relevant details..."
                    value={formData.additionalInfo}
                    onChange={handleChange}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold text-sm">Important Notes:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Appeals are typically reviewed within 48-72 hours</li>
                    <li>Being respectful and honest increases your chances</li>
                    <li>Multiple appeals for the same ban may result in longer review times</li>
                    <li>Spamming or harassing staff will result in permanent denial</li>
                  </ul>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary/90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Appeal"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BanAppeal;