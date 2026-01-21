import { Card, CardContent } from "@/components/ui/card";
import { Pause, Clock, Info } from "lucide-react";
import { motion } from "framer-motion";

interface OnHoldApplicationAlertProps {
  message: string;
  jobImage?: string;
  title?: string;
  icon?: React.ReactNode;
}

export const OnHoldApplicationAlert = ({ 
  message, 
  jobImage,
  title = "Application On Hold",
  icon
}: OnHoldApplicationAlertProps) => {
  return (
    <div className="space-y-6">
      {/* Job Header with Image - if provided */}
      {jobImage && (
        <div className="relative rounded-2xl overflow-hidden h-64 group">
          <img 
            src={jobImage} 
            alt="Application On Hold"
            className="w-full h-full object-cover object-top opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 rounded-xl bg-blue-500/20 backdrop-blur-sm">
                {icon || <Pause className="w-6 h-6 text-blue-500" />}
              </div>
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-1">{title}</h2>
                <p className="text-muted-foreground">Additional review in progress</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Card className="glass-effect border-blue-500/30 bg-blue-500/5">
        <CardContent className="p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center space-y-6"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="p-4 rounded-full bg-blue-500/20"
            >
              <Pause className="w-12 h-12 text-blue-400" />
            </motion.div>

            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-blue-400">
                Application On Hold
              </h3>
              <p className="text-muted-foreground max-w-md">
                {message}
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-blue-400 bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20">
              <Info className="w-4 h-4" />
              <span>Our team may reach out for additional information</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-4 py-2 rounded-full">
              <Clock className="w-4 h-4" />
              <span>You will be notified once a decision is made</span>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnHoldApplicationAlert;
