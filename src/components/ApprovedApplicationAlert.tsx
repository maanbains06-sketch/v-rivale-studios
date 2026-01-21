import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, PartyPopper, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface ApprovedApplicationAlertProps {
  message: string;
  jobImage?: string;
  title?: string;
  icon?: React.ReactNode;
}

export const ApprovedApplicationAlert = ({ 
  message, 
  jobImage,
  title = "Application Approved",
  icon
}: ApprovedApplicationAlertProps) => {
  return (
    <div className="space-y-6">
      {/* Job Header with Image - if provided */}
      {jobImage && (
        <div className="relative rounded-2xl overflow-hidden h-64 group">
          <img 
            src={jobImage} 
            alt="Application Approved"
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 rounded-xl bg-green-500/20 backdrop-blur-sm">
                {icon || <CheckCircle className="w-6 h-6 text-green-500" />}
              </div>
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-1">{title}</h2>
                <p className="text-muted-foreground">Congratulations on your acceptance!</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Card className="glass-effect border-green-500/30 bg-green-500/5">
        <CardContent className="p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center space-y-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.1
              }}
              className="relative"
            >
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className="p-4 rounded-full bg-green-500/20"
              >
                <PartyPopper className="w-12 h-12 text-green-400" />
              </motion.div>
              
              {/* Sparkle effects */}
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                }}
                className="absolute -top-2 -right-2"
              >
                <Sparkles className="w-6 h-6 text-yellow-400" />
              </motion.div>
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  delay: 0.5
                }}
                className="absolute -bottom-1 -left-2"
              >
                <Sparkles className="w-5 h-5 text-yellow-400" />
              </motion.div>
            </motion.div>

            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-green-400">
                🎉 Congratulations! 🎉
              </h3>
              <p className="text-muted-foreground max-w-md">
                {message}
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20">
              <CheckCircle className="w-4 h-4" />
              <span>You're officially part of the team!</span>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApprovedApplicationAlert;
