import { motion } from "framer-motion";

interface AnimatedLogoIconProps {
  className?: string;
}

const AnimatedLogoIcon = ({ className = "" }: AnimatedLogoIconProps) => {
  return (
    <motion.div 
      className={`relative cursor-pointer ${className}`}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      <div 
        className="relative w-full h-full rounded-lg overflow-hidden flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Elegant border */}
        <div 
          className="absolute inset-0 rounded-lg"
          style={{
            border: '1.5px solid rgba(255, 215, 0, 0.4)',
          }}
        />

        {/* Main Logo */}
        <svg viewBox="0 0 48 32" className="w-[85%] h-[85%]">
          <defs>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffd700" />
              <stop offset="50%" stopColor="#f4c430" />
              <stop offset="100%" stopColor="#daa520" />
            </linearGradient>
          </defs>
          
          {/* S Letter - Elegant serif style */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <path
              d="M6 8 C6 6, 8 5, 12 5 L18 5 C21 5, 22 6.5, 22 8 L22 10 C22 12, 20 13, 17 13 L11 13 C8 13, 6 14.5, 6 17 L6 19 C6 22, 8 24, 12 24 L18 24 C21 24, 22 22.5, 22 20"
              fill="none"
              stroke="url(#goldGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.g>
          
          {/* L Letter - Elegant serif style */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <path
              d="M28 5 L28 24 L42 24"
              fill="none"
              stroke="url(#goldGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Serif accent on L */}
            <path
              d="M26 5 L30 5"
              fill="none"
              stroke="url(#goldGrad)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </motion.g>
        </svg>

        {/* Subtle shine effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.05) 50%, transparent 60%)',
          }}
          animate={{
            x: ['-100%', '200%'],
          }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
        />

        {/* Indian flag accent - bottom */}
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
