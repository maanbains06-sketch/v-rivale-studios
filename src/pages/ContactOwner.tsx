import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import headerSupport from "@/assets/header-support.jpg";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, ArrowLeft } from "lucide-react";

const ContactOwner = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    discordId: "",
    message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.discordId || !formData.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields before sending.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-owner-message", {
        body: {
          name: formData.name.trim(),
          discordId: formData.discordId.trim(),
          message: formData.message.trim()
        }
      });

      if (error) throw error;

      toast({
        title: "Message Sent!",
        description: "Your message has been delivered to the server owner.",
      });

      // Reset form
      setFormData({ name: "", discordId: "", message: "" });
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({
        title: "Failed to Send",
        description: error.message || "Could not deliver your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <PageHeader 
        title="Contact Server Owner"
        description="Send a direct message to the server owner. Your message will be delivered via Discord DM."
        backgroundImage={headerSupport}
      />
      
      <main className="container mx-auto px-4 pb-12 pt-8">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Card className="glass-effect border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl">Send Message to Owner</CardTitle>
              <CardDescription>
                Fill out the form below to send a direct message to the server owner.
                Please provide accurate information so we can respond appropriately.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="glass-effect"
                    maxLength={100}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discordId">Discord ID</Label>
                  <Input
                    id="discordId"
                    type="text"
                    placeholder="Your Discord username or ID"
                    value={formData.discordId}
                    onChange={(e) => setFormData(prev => ({ ...prev, discordId: e.target.value }))}
                    className="glass-effect"
                    maxLength={100}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Example: username#1234 or your Discord user ID
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Your Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Type your message here..."
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    className="glass-effect min-h-[200px]"
                    maxLength={2000}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.message.length} / 2000 characters
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  disabled={loading}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {loading ? "Sending..." : "Send Message"}
                </Button>
              </form>

              <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Note:</strong> This message will be sent directly to the server owner's Discord DM. 
                  Please be respectful and provide clear, detailed information about your inquiry.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ContactOwner;
