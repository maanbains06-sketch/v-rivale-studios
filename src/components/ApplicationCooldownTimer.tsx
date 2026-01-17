import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, Timer, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ApplicationCooldownTimerProps {
  rejectedAt: string;
  cooldownHours?: number;
  onCooldownEnd?: () => void;
}

export const ApplicationCooldownTimer = ({ 
  rejectedAt, 
  cooldownHours = 24,
  onCooldownEnd 
}: ApplicationCooldownTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const rejectedDate = new Date(rejectedAt);
      const cooldownEnd = new Date(rejectedDate.getTime() + cooldownHours * 60 * 60 * 1000);
      const now = new Date();
      const diff = cooldownEnd.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
        onCooldownEnd?.();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ hours, minutes, seconds, isExpired: false });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [rejectedAt, cooldownHours, onCooldownEnd]);

  if (timeRemaining.isExpired) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full"
      >
        <Card className="bg-gradient-to-br from-green-500/20 via-emerald-500/15 to-teal-500/20 border-green-500/30 overflow-hidden">
          <CardContent className="p-6 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center"
            >
              <RefreshCw className="w-8 h-8 text-green-400" />
            </motion.div>
            <h3 className="text-xl font-bold text-green-400 mb-2">Cooldown Expired!</h3>
            <p className="text-muted-foreground">You can now submit a new application.</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <Card className="bg-gradient-to-br from-red-500/20 via-orange-500/15 to-amber-500/20 border-red-500/30 overflow-hidden relative">
        {/* Animated background effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-red-500/20 to-transparent rounded-full blur-3xl"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-20 -left-20 w-60 h-60 bg-gradient-to-tr from-orange-500/20 to-transparent rounded-full blur-3xl"
            animate={{ 
              scale: [1.2, 1, 1.2],
              opacity: [0.5, 0.3, 0.5]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </div>

        <CardContent className="p-6 relative z-10">
          <div className="text-center space-y-4">
            {/* Icon */}
            <motion.div
              animate={{ 
                y: [0, -5, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/30 to-orange-500/30 border border-red-500/40 shadow-lg shadow-red-500/20"
            >
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </motion.div>

            {/* Title */}
            <div>
              <h3 className="text-xl font-bold text-red-400 mb-1">Application Cooldown Active</h3>
              <p className="text-sm text-muted-foreground">
                Your previous application was rejected. Please wait before reapplying.
              </p>
            </div>

            {/* Timer Display */}
            <div className="flex items-center justify-center gap-4">
              {/* Hours */}
              <motion.div
                className="flex flex-col items-center"
                animate={{ scale: timeRemaining.hours === 0 ? [1, 0.95, 1] : 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600/40 to-red-800/40 border border-red-500/50 flex items-center justify-center shadow-lg shadow-red-500/20 overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)]" />
                  <span className="text-3xl font-mono font-bold text-red-300">
                    {String(timeRemaining.hours).padStart(2, '0')}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">Hours</span>
              </motion.div>

              <span className="text-3xl font-bold text-red-400/60 self-start mt-6">:</span>

              {/* Minutes */}
              <motion.div
                className="flex flex-col items-center"
                animate={{ scale: timeRemaining.minutes === 0 && timeRemaining.hours === 0 ? [1, 0.95, 1] : 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-600/40 to-orange-800/40 border border-orange-500/50 flex items-center justify-center shadow-lg shadow-orange-500/20 overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)]" />
                  <span className="text-3xl font-mono font-bold text-orange-300">
                    {String(timeRemaining.minutes).padStart(2, '0')}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">Minutes</span>
              </motion.div>

              <span className="text-3xl font-bold text-orange-400/60 self-start mt-6">:</span>

              {/* Seconds */}
              <motion.div className="flex flex-col items-center">
                <motion.div
                  className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-600/40 to-amber-800/40 border border-amber-500/50 flex items-center justify-center shadow-lg shadow-amber-500/20 overflow-hidden"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)]" />
                  <span className="text-3xl font-mono font-bold text-amber-300">
                    {String(timeRemaining.seconds).padStart(2, '0')}
                  </span>
                </motion.div>
                <span className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">Seconds</span>
              </motion.div>
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-xs mx-auto">
              <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-amber-500"
                  initial={{ width: '100%' }}
                  animate={{ 
                    width: `${((timeRemaining.hours * 3600 + timeRemaining.minutes * 60 + timeRemaining.seconds) / (cooldownHours * 3600)) * 100}%` 
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Footer text */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Timer className="w-3 h-3" />
              <span>Cooldown period: {cooldownHours} hours</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ApplicationCooldownTimer;
