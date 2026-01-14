import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, UserX, MessageSquareOff, ImageOff } from "lucide-react";

interface FeatureDisabledAlertProps {
  feature: 'registration' | 'support_chat' | 'gallery_submissions';
  className?: string;
}

const featureConfig = {
  registration: {
    icon: UserX,
    title: "Registration Temporarily Disabled",
    description: "We're not accepting new registrations at the moment. Please check back later or contact us on Discord for more information.",
  },
  support_chat: {
    icon: MessageSquareOff,
    title: "Support Chat Temporarily Unavailable",
    description: "Our live support chat is currently disabled. Please try again later or reach out to us via Discord for urgent matters.",
  },
  gallery_submissions: {
    icon: ImageOff,
    title: "Gallery Submissions Paused",
    description: "We're not accepting new gallery submissions at the moment. Please check back later to share your content with the community.",
  },
};

export const FeatureDisabledAlert = ({ feature, className = "" }: FeatureDisabledAlertProps) => {
  const config = featureConfig[feature];
  const Icon = config.icon;

  return (
    <Alert variant="destructive" className={`bg-destructive/10 border-destructive/30 ${className}`}>
      <Icon className="h-5 w-5" />
      <AlertTitle className="text-lg font-semibold">{config.title}</AlertTitle>
      <AlertDescription className="text-muted-foreground">
        {config.description}
      </AlertDescription>
    </Alert>
  );
};

export default FeatureDisabledAlert;
