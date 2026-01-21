import { Card, CardContent } from "@/components/ui/card";
import { Clock, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

interface PendingApplicationAlertProps {
  message: string;
  jobImage?: string;
  title?: string;
  icon?: React.ReactNode;
}

export const PendingApplicationAlert = ({ 
  message, 
  jobImage,
  title = "Application Pending",
  icon
}: PendingApplicationAlertProps) => {
  return (
    <div className="space-y-6">
      {/* Job Header with Image - if provided */}
      {jobImage && (
        <div className="relative rounded-2xl overflow-hidden h-64 group">
          <img 
            src={jobImage} 
            alt="Application"
            className="w-full h-full object-cover object-top opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 rounded-xl bg-amber-500/20 backdrop-blur-sm">
                {icon || <Clock className="w-6 h-6 text-amber-500" />}
              </div>
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-1">{title}</h2>
                <p className="text-muted-foreground">Your application is being reviewed</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Card className="glass-effect border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center space-y-6"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="p-4 rounded-full bg-amber-500/20"
            >
              <AlertTriangle className="w-12 h-12 text-amber-400" />
            </motion.div>

            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-amber-400">
                Application Already Submitted
              </h3>
              <p className="text-muted-foreground max-w-md">
                {message}
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-4 py-2 rounded-full">
              <Clock className="w-4 h-4" />
              <span>You will be notified once your application is reviewed</span>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingApplicationAlert;
