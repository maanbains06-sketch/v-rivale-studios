import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, Wrench, AlertCircle, Zap } from 'lucide-react';

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
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-yellow-500/10 border border-orange-500/30 p-6"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,146,60,0.15),transparent_50%)]" />
        <div className="relative flex items-center gap-4">
          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center border border-orange-500/30">
            <AlertCircle className="w-7 h-7 text-orange-400" />
          </div>
          <div>
            <p className="text-lg font-semibold text-orange-400">Estimated Duration: Unknown</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {customMessage || "Please check back later for updates."}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (timeRemaining.isExpired) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-teal-500/10 border border-green-500/30 p-6"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.15),transparent_50%)]" />
        <div className="relative flex items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center border border-green-500/30"
          >
            <Zap className="w-7 h-7 text-green-400" />
          </motion.div>
          <div>
            <p className="text-lg font-semibold text-green-400">Maintenance Complete!</p>
            <p className="text-sm text-muted-foreground mt-0.5">Refresh the page to check if the site is back online.</p>
          </div>
        </div>
      </motion.div>
    );
  }

  const timeUnits = [
    { value: timeRemaining.days, label: 'Days', color: 'from-orange-500 to-amber-500', glow: 'shadow-orange-500/20' },
    { value: timeRemaining.hours, label: 'Hours', color: 'from-primary to-primary/70', glow: 'shadow-primary/20' },
    { value: timeRemaining.minutes, label: 'Minutes', color: 'from-blue-500 to-indigo-500', glow: 'shadow-blue-500/20' },
    { value: timeRemaining.seconds, label: 'Seconds', color: 'from-cyan-500 to-teal-500', glow: 'shadow-cyan-500/20' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Countdown Timer */}
      <div className="flex items-center justify-center gap-3 md:gap-4 flex-wrap">
        {timeUnits.map((unit, index) => (
          <motion.div
            key={unit.label}
            className="flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <motion.div
              className={`relative w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br ${unit.color} p-[2px] shadow-lg ${unit.glow}`}
              animate={unit.label === 'Seconds' ? { scale: [1, 1.02, 1] } : { scale: [1, 1.01, 1] }}
              transition={{ duration: unit.label === 'Seconds' ? 1 : 2, repeat: Infinity }}
            >
              <div className="w-full h-full rounded-2xl bg-background/95 backdrop-blur-xl flex items-center justify-center">
                <span className="text-2xl md:text-3xl font-mono font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {String(unit.value).padStart(2, '0')}
                </span>
              </div>
              {/* Animated border glow */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${unit.color} opacity-20 blur-xl -z-10`} />
            </motion.div>
            <span className="text-[10px] md:text-xs text-muted-foreground mt-2 uppercase tracking-wider font-medium">
              {unit.label}
            </span>
            
            {/* Separator */}
            {index < timeUnits.length - 1 && (
              <motion.span 
                className="hidden md:block absolute translate-x-[3.5rem] md:translate-x-[4.5rem] text-xl font-bold text-muted-foreground/30"
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                :
              </motion.span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Status Bar */}
      <motion.div 
        className="relative h-2 w-full max-w-md mx-auto rounded-full bg-muted/30 overflow-hidden"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div 
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-blue-500 to-cyan-500 rounded-full"
          animate={{ 
            width: ['0%', '100%'],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ 
            width: { duration: 2, repeat: Infinity, repeatType: 'reverse' },
            opacity: { duration: 1.5, repeat: Infinity }
          }}
        />
      </motion.div>

      {/* Info Section */}
      <div className="flex flex-col items-center justify-center gap-2 text-sm">
        {title && (
          <motion.span 
            className="font-semibold text-foreground flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Wrench className="w-4 h-4 text-primary" />
            {title}
          </motion.span>
        )}
        <motion.div 
          className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/20 px-4 py-2 rounded-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Expected completion: {new Date(endDateString).toLocaleString()}</span>
        </motion.div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -z-10" />
    </motion.div>
  );
};

export default MaintenanceCountdown;
