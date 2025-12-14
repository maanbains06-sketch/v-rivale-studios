import { motion } from "framer-motion";

interface AnimatedLogoIconProps {
  className?: string;
}

const AnimatedLogoIcon = ({ className = "" }: AnimatedLogoIconProps) => {
  return (
    <motion.div 
      className={`relative cursor-pointer ${className}`}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Hexagon shaped logo */}
      <div className="relative w-full h-full flex items-center justify-center">
        
        {/* Outer glow pulse */}
        <motion.div
          className="absolute inset-[-4px]"
          style={{
            background: 'transparent',
            filter: 'blur(8px)',
          }}
          animate={{
            boxShadow: [
              '0 0 15px hsl(199 89% 48% / 0.3)',
              '0 0 25px hsl(185 100% 50% / 0.5)',
              '0 0 15px hsl(199 89% 48% / 0.3)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Hexagon background */}
        <svg viewBox="0 0 60 52" className="absolute inset-0 w-full h-full">
          <defs>
            <linearGradient id="hexBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(220 20% 6%)" />
              <stop offset="100%" stopColor="hsl(220 18% 10%)" />
            </linearGradient>
            <linearGradient id="hexBorder" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(199 89% 48%)" />
              <stop offset="100%" stopColor="hsl(185 100% 50%)" />
            </linearGradient>
            <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="hsl(199 89% 70% / 0.3)" />
              <stop offset="100%" stopColor="transparent" />
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
          
          {/* Inner hexagon accent - pulsing */}
          <motion.polygon
            points="30,8 50,18 50,34 30,44 10,34 10,18"
            fill="none"
            stroke="hsl(199 89% 48% / 0.2)"
            strokeWidth="1"
            animate={{
              stroke: [
                'hsl(199 89% 48% / 0.15)',
                'hsl(199 89% 48% / 0.35)',
                'hsl(199 89% 48% / 0.15)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Rotating light dot on border */}
          <motion.circle
            r="2"
            fill="hsl(185 100% 60%)"
            filter="url(#glow)"
            animate={{
              cx: [30, 56, 56, 30, 4, 4, 30],
              cy: [2, 15, 37, 50, 37, 15, 2],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
        </svg>

        {/* SL Letters */}
        <svg viewBox="0 0 40 34" className="relative z-10 w-[65%] h-[65%]">
          <defs>
            <linearGradient id="letterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(185 100% 50%)" />
              <stop offset="100%" stopColor="hsl(199 89% 48%)" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {/* S letter */}
          <motion.path
            d="M18 8 L10 8 C7 8, 6 9, 6 11 C6 13, 7 14, 10 14 L14 14 C17 14, 19 15, 19 18 C19 21, 17 22, 14 22 L6 22"
            fill="none"
            stroke="url(#letterGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#glow)"
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
            filter="url(#glow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          />
        </svg>

        {/* Shimmer overlay */}
        <motion.div
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, hsl(199 89% 70% / 0.1) 50%, transparent 60%)',
          }}
          animate={{
            x: ['-100%', '200%'],
          }}
          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1, ease: "easeInOut" }}
        />

        {/* Top corner glow */}
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary"
          style={{ boxShadow: '0 0 12px hsl(185 100% 50%)' }}
          animate={{ 
            opacity: [0.4, 1, 0.4],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Bottom corners */}
        <motion.div
          className="absolute bottom-[8px] left-[8px] w-1.5 h-1.5 rounded-full"
          style={{ background: 'hsl(185 100% 50%)', boxShadow: '0 0 8px hsl(185 100% 50%)' }}
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
        />
        <motion.div
          className="absolute bottom-[8px] right-[8px] w-1.5 h-1.5 rounded-full"
          style={{ background: 'hsl(185 100% 50%)', boxShadow: '0 0 8px hsl(185 100% 50%)' }}
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
        />

        {/* Indian flag stripe at bottom */}
        <div className="absolute bottom-[2px] left-[20%] right-[20%] h-[2px] flex rounded-full overflow-hidden">
          <motion.div 
            className="flex-1" 
            style={{ background: '#FF9933' }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div 
            className="flex-1" 
            style={{ background: '#FFFFFF' }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
          />
          <motion.div 
            className="flex-1" 
            style={{ background: '#138808' }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default AnimatedLogoIcon;
