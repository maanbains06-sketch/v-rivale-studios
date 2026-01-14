import { AlertCircle, Clock, Bell } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ApplicationsPausedAlertProps {
  variant?: "alert" | "card";
  applicationType?: string;
}

const ApplicationsPausedAlert = ({ 
  variant = "alert", 
  applicationType = "Applications" 
}: ApplicationsPausedAlertProps) => {
  const navigate = useNavigate();

  if (variant === "card") {
    return (
      <Card className="glass-effect border-orange-500/30 bg-orange-500/5">
        <CardContent className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/20 border border-orange-500/30 mb-6">
            <Clock className="w-8 h-8 text-orange-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-orange-400 mb-3">
            {applicationType} Temporarily Paused
          </h2>
          
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            We're currently not accepting new applications. This is usually temporary 
            while we process existing applications or during special events.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate("/")}>
              Return Home
            </Button>
            <Button variant="outline" onClick={() => navigate("/community")}>
              <Bell className="w-4 h-4 mr-2" />
              Join Discord for Updates
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            Check back later or join our Discord to be notified when applications reopen.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Alert className="border-orange-500/30 bg-orange-500/5">
      <AlertCircle className="h-4 w-4 text-orange-400" />
      <AlertTitle className="text-orange-400">Applications Paused</AlertTitle>
      <AlertDescription className="mt-2 text-muted-foreground">
        {applicationType} are currently paused. Please check back later or join our 
        Discord server for updates on when applications will reopen.
      </AlertDescription>
    </Alert>
  );
};

export default ApplicationsPausedAlert;
