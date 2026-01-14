import { Wrench, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface MaintenancePageProps {
  onCheckAccess?: () => void;
}

const MaintenancePage = ({ onCheckAccess }: MaintenancePageProps) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-lg w-full text-center"
      >
        <div className="glass-effect rounded-2xl p-8 md:p-12 border-border/20 space-y-6">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-orange-500/20 border border-orange-500/30 mb-4"
          >
            <Wrench className="w-12 h-12 text-orange-400 animate-bounce" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl md:text-4xl font-bold text-gradient"
          >
            Under Maintenance
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground text-lg"
          >
            We're performing scheduled maintenance to improve your experience. 
            The site will be back online shortly.
          </motion.p>

          {/* Info Cards */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-2 gap-4 mt-8"
          >
            <div className="p-4 rounded-lg bg-muted/30 border border-border/20 text-center">
              <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Expected Duration</p>
              <p className="font-semibold text-foreground">Brief Downtime</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border border-border/20 text-center">
              <Shield className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Data Status</p>
              <p className="font-semibold text-foreground">Safe & Secure</p>
            </div>
          </motion.div>

          {/* Staff Access Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="pt-4"
          >
            <p className="text-xs text-muted-foreground mb-3">
              Staff members can access the site during maintenance
            </p>
            {onCheckAccess && (
              <Button variant="outline" onClick={onCheckAccess} size="sm">
                Staff Login
              </Button>
            )}
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-xs text-muted-foreground pt-4"
          >
            Thank you for your patience. — SLRP Team
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
};

export default MaintenancePage;
