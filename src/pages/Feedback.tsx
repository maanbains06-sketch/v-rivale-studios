import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Star, Send, Loader2, MessageSquare, User, Briefcase, CheckCircle } from "lucide-react";
import { z } from "zod";
import { motion } from "framer-motion";
import headerCommunityBg from "@/assets/header-community.jpg";

const feedbackSchema = z.object({
  player_name: z.string().trim().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters"),
  player_role: z.string().trim().max(50, "Role must be less than 50 characters").optional(),
  testimonial: z.string().trim().min(10, "Feedback must be at least 10 characters").max(500, "Feedback must be less than 500 characters"),
  rating: z.number().min(1, "Please select a rating").max(5),
});

const Feedback = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [formData, setFormData] = useState({
    player_name: "",
    player_role: "",
    testimonial: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validationResult = feedbackSchema.safeParse({
      ...formData,
      rating,
    });

    if (!validationResult.success) {
      const newErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("testimonials").insert({
        player_name: formData.player_name.trim(),
        player_role: formData.player_role.trim() || null,
        testimonial: formData.testimonial.trim(),
        rating,
        is_featured: false,
      });

      if (error) throw error;

      // Send email notification to owner
      try {
        await supabase.functions.invoke("send-feedback-notification", {
          body: {
            player_name: formData.player_name.trim(),
            player_role: formData.player_role.trim() || null,
            testimonial: formData.testimonial.trim(),
            rating,
          },
        });
      } catch (notifyError) {
        console.error("Failed to send notification:", notifyError);
      }

      setIsSubmitted(true);
      toast({
        title: "Feedback Submitted!",
        description: "Thank you for your feedback. It will appear after review.",
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <PageHeader
          title="Thank You!"
          description="Your feedback has been submitted"
          badge="Feedback Received"
          backgroundImage={headerCommunityBg}
          pageKey="community"
        />
        
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-lg mx-auto text-center"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-gradient mb-4">Feedback Submitted!</h2>
            <p className="text-muted-foreground mb-8">
              Thank you for taking the time to share your experience with us. Your feedback helps us improve and grow our community. It will be reviewed and featured once approved.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate("/")} variant="outline">
                Back to Home
              </Button>
              <Button onClick={() => {
                setIsSubmitted(false);
                setFormData({ player_name: "", player_role: "", testimonial: "" });
                setRating(0);
              }}>
                Submit Another
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader
        title="Share Your Feedback"
        description="Tell us about your experience at Skylife Roleplay India"
        badge="Community Voices"
        backgroundImage={headerCommunityBg}
        pageKey="community"
      />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="glass-effect border-primary/20 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
              
              <CardHeader className="relative text-center pb-2">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold text-gradient">
                  We Value Your Opinion
                </CardTitle>
                <CardDescription className="text-muted-foreground max-w-md mx-auto">
                  Your feedback helps us create a better roleplay experience for everyone. Share your thoughts, suggestions, or appreciation!
                </CardDescription>
              </CardHeader>

              <CardContent className="relative pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Player Name */}
                  <div className="space-y-2">
                    <Label htmlFor="player_name" className="text-foreground font-medium flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      Your Name / In-Game Name *
                    </Label>
                    <Input
                      id="player_name"
                      placeholder="Enter your name or character name"
                      value={formData.player_name}
                      onChange={(e) => setFormData({ ...formData, player_name: e.target.value })}
                      className="bg-background/50 border-border/50 focus:border-primary h-12"
                      maxLength={50}
                    />
                    {errors.player_name && (
                      <p className="text-xs text-destructive">{errors.player_name}</p>
                    )}
                  </div>

                  {/* Player Role */}
                  <div className="space-y-2">
                    <Label htmlFor="player_role" className="text-foreground font-medium flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-primary" />
                      Your Role (Optional)
                    </Label>
                    <Input
                      id="player_role"
                      placeholder="e.g., Police Officer, Business Owner, Gang Member"
                      value={formData.player_role}
                      onChange={(e) => setFormData({ ...formData, player_role: e.target.value })}
                      className="bg-background/50 border-border/50 focus:border-primary h-12"
                      maxLength={50}
                    />
                    {errors.player_role && (
                      <p className="text-xs text-destructive">{errors.player_role}</p>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="space-y-3">
                    <Label className="text-foreground font-medium flex items-center gap-2">
                      <Star className="w-4 h-4 text-primary" />
                      Your Rating *
                    </Label>
                    <div className="flex items-center justify-center gap-3 py-4 px-6 bg-background/30 rounded-xl border border-border/30">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <motion.button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`w-10 h-10 transition-all duration-200 ${
                              star <= (hoveredRating || rating)
                                ? "text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        </motion.button>
                      ))}
                    </div>
                    <p className="text-center text-sm text-muted-foreground">
                      {rating === 0 && "Click to rate your experience"}
                      {rating === 1 && "Poor - Needs improvement"}
                      {rating === 2 && "Fair - Below average"}
                      {rating === 3 && "Good - Average experience"}
                      {rating === 4 && "Very Good - Above average"}
                      {rating === 5 && "Excellent - Outstanding experience!"}
                    </p>
                    {errors.rating && (
                      <p className="text-xs text-destructive text-center">{errors.rating}</p>
                    )}
                  </div>

                  {/* Testimonial */}
                  <div className="space-y-2">
                    <Label htmlFor="testimonial" className="text-foreground font-medium flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      Your Feedback *
                    </Label>
                    <Textarea
                      id="testimonial"
                      placeholder="Share your experience, what you love about SLRP, suggestions for improvement, or memorable moments..."
                      value={formData.testimonial}
                      onChange={(e) => setFormData({ ...formData, testimonial: e.target.value })}
                      className="bg-background/50 border-border/50 focus:border-primary min-h-[150px] resize-none"
                      maxLength={500}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      {errors.testimonial ? (
                        <p className="text-destructive">{errors.testimonial}</p>
                      ) : (
                        <span>Minimum 10 characters</span>
                      )}
                      <span className={formData.testimonial.length > 450 ? "text-yellow-500" : ""}>
                        {formData.testimonial.length}/500
                      </span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-14 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-bold text-lg rounded-xl shadow-[0_0_30px_rgba(var(--primary),0.3)] hover:shadow-[0_0_40px_rgba(var(--primary),0.5)] transition-all duration-300"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Submit Feedback
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Your feedback will be reviewed before being published on our website.
                    We appreciate your honest opinions!
                  </p>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 text-center"
          >
            <p className="text-muted-foreground text-sm">
              Have questions or need support?{" "}
              <a href="/support" className="text-primary hover:underline">
                Contact our support team
              </a>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Feedback;
