import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, Wrench, Timer, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface MaintenanceCountdownProps {
  scheduledEnd?: string;
  endTime?: Date;
  customMessage?: string;
  title?: string;
}

export const MaintenanceCountdown = ({ scheduledEnd, endTime, customMessage, title }: MaintenanceCountdownProps) => {
  // Support both string and Date formats
  const endDateString = scheduledEnd || (endTime ? endTime.toISOString() : undefined);
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    if (!endDateString) return;

    const calculateTimeRemaining = () => {
      const endDate = new Date(endDateString);
      const now = new Date();
      const diff = endDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds, isExpired: false });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [endDateString]);

  if (!endDateString) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-orange-500/10 border border-orange-500/30">
        <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-orange-400">Estimated Duration: Unknown</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {customMessage || "Please check back later for updates."}
          </p>
        </div>
      </div>
    );
  }

  if (timeRemaining.isExpired) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Clock className="w-5 h-5 text-green-400" />
        </motion.div>
        <div>
          <p className="text-sm font-medium text-green-400">Maintenance should be complete!</p>
          <p className="text-xs text-muted-foreground mt-0.5">Refresh the page to check if the site is back online.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Countdown Timer */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {/* Days */}
        <motion.div 
          className="flex flex-col items-center"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-orange-600/30 to-orange-800/30 border border-orange-500/40 flex items-center justify-center shadow-lg shadow-orange-500/10">
            <span className="text-2xl font-mono font-bold text-orange-300">
              {String(timeRemaining.days).padStart(2, '0')}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wider">Days</span>
        </motion.div>

        <span className="text-xl font-bold text-orange-400/50 self-start mt-4">:</span>

        {/* Hours */}
        <motion.div 
          className="flex flex-col items-center"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
        >
          <div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-primary/30 to-primary/50 border border-primary/40 flex items-center justify-center shadow-lg shadow-primary/10">
            <span className="text-2xl font-mono font-bold text-primary-foreground">
              {String(timeRemaining.hours).padStart(2, '0')}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wider">Hours</span>
        </motion.div>

        <span className="text-xl font-bold text-primary/50 self-start mt-4">:</span>

        {/* Minutes */}
        <motion.div 
          className="flex flex-col items-center"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
        >
          <div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600/30 to-blue-800/30 border border-blue-500/40 flex items-center justify-center shadow-lg shadow-blue-500/10">
            <span className="text-2xl font-mono font-bold text-blue-300">
              {String(timeRemaining.minutes).padStart(2, '0')}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wider">Minutes</span>
        </motion.div>

        <span className="text-xl font-bold text-blue-400/50 self-start mt-4">:</span>

        {/* Seconds */}
        <motion.div className="flex flex-col items-center">
          <motion.div
            className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-600/30 to-cyan-800/30 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-500/10"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <span className="text-2xl font-mono font-bold text-cyan-300">
              {String(timeRemaining.seconds).padStart(2, '0')}
            </span>
          </motion.div>
          <span className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wider">Seconds</span>
        </motion.div>
      </div>

      {/* Scheduled End Time */}
      <div className="flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground">
        {title && <span className="font-medium text-foreground">{title}</span>}
        <div className="flex items-center gap-2">
          <Calendar className="w-3 h-3" />
          <span>Scheduled completion: {new Date(endDateString).toLocaleString()}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default MaintenanceCountdown;
