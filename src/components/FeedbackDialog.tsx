import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MessageSquarePlus, Star, Send, Loader2 } from "lucide-react";
import { z } from "zod";

const feedbackSchema = z.object({
  player_name: z.string().trim().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters"),
  player_role: z.string().trim().max(50, "Role must be less than 50 characters").optional(),
  testimonial: z.string().trim().min(10, "Feedback must be at least 10 characters").max(500, "Feedback must be less than 500 characters"),
  rating: z.number().min(1, "Please select a rating").max(5),
});

const FeedbackDialog = () => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

    // Validate form data
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
        is_featured: false, // Admin needs to approve before showing
      });

      if (error) throw error;

      toast({
        title: "Feedback Submitted!",
        description: "Thank you for your feedback. It will appear after review.",
      });

      // Reset form
      setFormData({ player_name: "", player_role: "", testimonial: "" });
      setRating(0);
      setOpen(false);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="group relative overflow-hidden bg-gradient-to-r from-primary/80 to-secondary/80 hover:from-primary hover:to-secondary border-0 text-primary-foreground font-bold px-8 py-6 rounded-2xl shadow-[0_0_30px_rgba(var(--primary),0.3)] hover:shadow-[0_0_40px_rgba(var(--primary),0.5)] transition-all duration-300"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
          <MessageSquarePlus className="w-5 h-5 mr-2" />
          Share Your Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] glass-effect border-primary/30">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gradient flex items-center gap-2">
            <MessageSquarePlus className="w-6 h-6 text-primary" />
            Share Your Experience
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Tell us about your experience at Skylife Roleplay India. Your feedback helps us improve!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Player Name */}
          <div className="space-y-2">
            <Label htmlFor="player_name" className="text-foreground font-medium">
              Your Name / In-Game Name *
            </Label>
            <Input
              id="player_name"
              placeholder="Enter your name"
              value={formData.player_name}
              onChange={(e) => setFormData({ ...formData, player_name: e.target.value })}
              className="bg-background/50 border-border/50 focus:border-primary"
              maxLength={50}
            />
            {errors.player_name && (
              <p className="text-xs text-destructive">{errors.player_name}</p>
            )}
          </div>

          {/* Player Role */}
          <div className="space-y-2">
            <Label htmlFor="player_role" className="text-foreground font-medium">
              Your Role (Optional)
            </Label>
            <Input
              id="player_role"
              placeholder="e.g., Police Officer, Business Owner, Gang Member"
              value={formData.player_role}
              onChange={(e) => setFormData({ ...formData, player_role: e.target.value })}
              className="bg-background/50 border-border/50 focus:border-primary"
              maxLength={50}
            />
            {errors.player_role && (
              <p className="text-xs text-destructive">{errors.player_role}</p>
            )}
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label className="text-foreground font-medium">Your Rating *</Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                {rating > 0 ? `${rating} star${rating > 1 ? "s" : ""}` : "Select rating"}
              </span>
            </div>
            {errors.rating && (
              <p className="text-xs text-destructive">{errors.rating}</p>
            )}
          </div>

          {/* Testimonial */}
          <div className="space-y-2">
            <Label htmlFor="testimonial" className="text-foreground font-medium">
              Your Feedback *
            </Label>
            <Textarea
              id="testimonial"
              placeholder="Share your experience with us..."
              value={formData.testimonial}
              onChange={(e) => setFormData({ ...formData, testimonial: e.target.value })}
              className="bg-background/50 border-border/50 focus:border-primary min-h-[120px] resize-none"
              maxLength={500}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              {errors.testimonial ? (
                <p className="text-destructive">{errors.testimonial}</p>
              ) : (
                <span>Min 10 characters</span>
              )}
              <span>{formData.testimonial.length}/500</span>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-bold py-6 rounded-xl shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] transition-all duration-300"
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
            Your feedback will be reviewed before being published.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackDialog;
