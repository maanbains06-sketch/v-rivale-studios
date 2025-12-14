import { motion } from "framer-motion";

interface AnimatedLogoIconProps {
  className?: string;
}

const AnimatedLogoIcon = ({ className = "" }: AnimatedLogoIconProps) => {
  return (
    <motion.div 
      className={`relative cursor-pointer ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Main container with premium gradient */}
      <div 
        className="relative w-full h-full rounded-lg overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%)',
          boxShadow: '0 4px 20px rgba(0, 255, 255, 0.15), 0 0 40px rgba(0, 255, 255, 0.05), inset 0 1px 0 rgba(255,255,255,0.1)',
          border: '1px solid rgba(0, 255, 255, 0.3)',
        }}
      >
        {/* Animated scanning line */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, rgba(0, 255, 255, 0.08) 50%, transparent 100%)',
            height: '30%',
          }}
          animate={{
            top: ['-30%', '130%'],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
        />

        {/* Premium SL Logo */}
        <div className="relative w-full h-full flex items-center justify-center p-1">
          <svg 
            viewBox="0 0 60 40" 
            className="w-full h-full"
            style={{
              filter: 'drop-shadow(0 0 6px rgba(0, 255, 255, 0.6))',
            }}
          >
            <defs>
              {/* Premium cyan gradient */}
              <linearGradient id="cyanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00ffff" />
                <stop offset="50%" stopColor="#00d4ff" />
                <stop offset="100%" stopColor="#0099ff" />
              </linearGradient>
              
              {/* Gold accent gradient */}
              <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffd700" />
                <stop offset="100%" stopColor="#ffaa00" />
              </linearGradient>

              {/* Glow filter */}
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* S Letter - Bold GTA style */}
            <motion.path
              d="M8 10 L22 10 Q26 10 26 14 L26 16 Q26 20 22 20 L12 20 Q8 20 8 24 L8 26 Q8 30 12 30 L26 30"
              fill="none"
              stroke="url(#cyanGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
            
            {/* L Letter - Bold GTA style */}
            <motion.path
              d="M34 10 L34 30 L52 30"
              fill="none"
              stroke="url(#cyanGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
            />

            {/* Small decorative star */}
            <motion.path
              d="M54 8 L55 10 L57 10 L55.5 11.5 L56 14 L54 12.5 L52 14 L52.5 11.5 L51 10 L53 10 Z"
              fill="url(#goldGradient)"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1 }}
            />
          </svg>
        </div>

        {/* Indian flag accent bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] flex overflow-hidden">
          <motion.div 
            className="flex-1"
            style={{ background: '#FF9933' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, delay: 1.2 }}
          />
          <motion.div 
            className="flex-1"
            style={{ background: '#FFFFFF' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, delay: 1.3 }}
          />
          <motion.div 
            className="flex-1"
            style={{ background: '#138808' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, delay: 1.4 }}
          />
        </div>

        {/* Corner brackets */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <motion.path
            d="M 4 12 L 4 4 L 12 4"
            fill="none"
            stroke="url(#goldGradient)"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          />
          <motion.path
            d="M 88 4 L 96 4 L 96 12"
            fill="none"
            stroke="url(#goldGradient)"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, delay: 0.9 }}
          />
          <defs>
            <linearGradient id="goldGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffd700" />
              <stop offset="100%" stopColor="#ffaa00" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </motion.div>
  );
};

export default AnimatedLogoIcon;
