import { motion } from "framer-motion";

interface AnimatedLogoIconProps {
  className?: string;
}

const AnimatedLogoIcon = ({ className = "" }: AnimatedLogoIconProps) => {
  return (
    <motion.div 
      className={`relative cursor-pointer ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Hexagon shaped logo */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Hexagon background */}
        <svg viewBox="0 0 60 52" className="absolute inset-0 w-full h-full">
          <defs>
            <linearGradient id="hexBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
            <linearGradient id="hexBorder" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>
          
          {/* Outer hexagon border */}
          <motion.polygon
            points="30,2 56,15 56,37 30,50 4,37 4,15"
            fill="url(#hexBg)"
            stroke="url(#hexBorder)"
            strokeWidth="2"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
          
          {/* Inner hexagon accent */}
          <polygon
            points="30,8 50,18 50,34 30,44 10,34 10,18"
            fill="none"
            stroke="rgba(245, 158, 11, 0.2)"
            strokeWidth="1"
          />
        </svg>

        {/* SL Letters */}
        <svg viewBox="0 0 40 34" className="relative z-10 w-[65%] h-[65%]">
          <defs>
            <linearGradient id="letterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          
          {/* S letter */}
          <motion.path
            d="M18 8 L10 8 C7 8, 6 9, 6 11 C6 13, 7 14, 10 14 L14 14 C17 14, 19 15, 19 18 C19 21, 17 22, 14 22 L6 22"
            fill="none"
            stroke="url(#letterGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          
          {/* L letter */}
          <motion.path
            d="M25 8 L25 22 L35 22"
            fill="none"
            stroke="url(#letterGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          />
        </svg>

        {/* Animated corner glow */}
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
          style={{ background: '#f59e0b', boxShadow: '0 0 10px #f59e0b' }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Indian flag stripe at bottom */}
        <div className="absolute bottom-[2px] left-[20%] right-[20%] h-[2px] flex rounded-full overflow-hidden">
          <div className="flex-1" style={{ background: '#FF9933' }} />
          <div className="flex-1" style={{ background: '#FFFFFF' }} />
          <div className="flex-1" style={{ background: '#138808' }} />
        </div>
      </div>
    </motion.div>
  );
};

export default AnimatedLogoIcon;
