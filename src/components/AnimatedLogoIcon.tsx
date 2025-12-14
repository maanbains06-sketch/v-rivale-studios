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
      {/* Circular modern logo */}
      <div 
        className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center"
        style={{
          background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
          boxShadow: '0 0 0 2px #3b82f6, 0 8px 32px rgba(59, 130, 246, 0.3)',
        }}
      >
        {/* Inner ring */}
        <motion.div
          className="absolute inset-[3px] rounded-full"
          style={{
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        />

        {/* Rotating accent ring */}
        <motion.div
          className="absolute inset-[-2px] rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0%, #3b82f6 25%, transparent 50%)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />

        {/* Logo content */}
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          <svg viewBox="0 0 40 40" className="w-[70%] h-[70%]">
            <defs>
              <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            
            {/* Clean S letter */}
            <motion.path
              d="M22 10 L14 10 C11 10, 10 11, 10 13 C10 15, 11 16, 14 16 L18 16 C21 16, 23 17, 23 20 C23 23, 21 24, 18 24 L10 24"
              fill="none"
              stroke="url(#blueGrad)"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
            <motion.path
              d="M27 8 L27 28 L35 28"
              fill="none"
              stroke="url(#blueGrad)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            />
          </svg>
        </div>

        {/* Center glow */}
        <div 
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.15) 0%, transparent 60%)',
          }}
        />

        {/* Indian flag arc at bottom */}
        <svg className="absolute bottom-0 left-0 right-0 h-[6px] w-full">
          <rect x="0" y="0" width="33.33%" height="6" fill="#FF9933" />
          <rect x="33.33%" y="0" width="33.33%" height="6" fill="#FFFFFF" />
          <rect x="66.66%" y="0" width="33.34%" height="6" fill="#138808" />
        </svg>
      </div>
    </motion.div>
  );
};

export default AnimatedLogoIcon;
