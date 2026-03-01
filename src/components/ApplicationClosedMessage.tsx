import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ShieldOff } from "lucide-react";
import CyberpunkFormWrapper from "@/components/CyberpunkFormWrapper";

interface ApplicationClosedMessageProps {
  title: string;
  icon?: React.ReactNode;
}

const ApplicationClosedMessage = ({ title, icon }: ApplicationClosedMessageProps) => {
  return (
    <CyberpunkFormWrapper title={title} icon={icon || <ShieldOff className="w-6 h-6" />}>
      <Card className="glass-effect border-red-500/30 bg-red-500/5">
        <CardContent className="p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center space-y-6"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
              className="p-4 rounded-full bg-red-500/20"
            >
              <ShieldOff className="w-12 h-12 text-red-400" />
            </motion.div>

            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-red-400">
                Applications Closed
              </h3>
              <p className="text-muted-foreground max-w-md">
                This application is currently closed and not accepting new submissions. Please check back later for updates.
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-4 py-2 rounded-full">
              <ShieldOff className="w-4 h-4" />
              <span>Check back later for availability</span>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </CyberpunkFormWrapper>
  );
};

export default ApplicationClosedMessage;
