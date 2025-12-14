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
      <div 
        className="relative w-full h-full rounded-md overflow-hidden flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
          border: '2px solid #00d4ff',
          boxShadow: '0 0 20px rgba(0, 212, 255, 0.4), inset 0 0 20px rgba(0, 212, 255, 0.1)',
        }}
      >
        {/* Animated glow pulse */}
        <motion.div
          className="absolute inset-0 rounded-md"
          animate={{
            boxShadow: [
              'inset 0 0 15px rgba(0, 212, 255, 0.1)',
              'inset 0 0 25px rgba(0, 212, 255, 0.2)',
              'inset 0 0 15px rgba(0, 212, 255, 0.1)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* SL Text Logo */}
        <svg viewBox="0 0 50 30" className="w-[80%] h-[80%]">
          <defs>
            <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00ffff" />
              <stop offset="50%" stopColor="#00d4ff" />
              <stop offset="100%" stopColor="#0088ff" />
            </linearGradient>
            <filter id="textGlow">
              <feGaussianBlur stdDeviation="0.8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {/* S Letter */}
          <motion.text
            x="5"
            y="23"
            fill="url(#textGradient)"
            fontSize="22"
            fontWeight="900"
            fontFamily="Arial Black, sans-serif"
            filter="url(#textGlow)"
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            S
          </motion.text>
          
          {/* L Letter */}
          <motion.text
            x="22"
            y="23"
            fill="url(#textGradient)"
            fontSize="22"
            fontWeight="900"
            fontFamily="Arial Black, sans-serif"
            filter="url(#textGlow)"
            initial={{ opacity: 0, x: 5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            L
          </motion.text>
        </svg>

        {/* Indian flag stripe */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] flex">
          <div className="flex-1" style={{ background: '#FF9933' }} />
          <div className="flex-1" style={{ background: '#FFFFFF' }} />
          <div className="flex-1" style={{ background: '#138808' }} />
        </div>
      </div>
    </motion.div>
  );
};

export default AnimatedLogoIcon;
