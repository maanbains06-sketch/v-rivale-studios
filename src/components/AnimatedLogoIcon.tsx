import { motion } from "framer-motion";

interface AnimatedLogoIconProps {
  className?: string;
}

const AnimatedLogoIcon = ({ className = "" }: AnimatedLogoIconProps) => {
  return (
    <motion.div 
      className={`relative cursor-pointer ${className}`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Outer glow effect */}
      <motion.div 
        className="absolute inset-[-4px] rounded-lg"
        animate={{
          boxShadow: [
            '0 0 15px hsl(180 100% 50% / 0.6), 0 0 30px hsl(180 100% 40% / 0.3)',
            '0 0 20px hsl(200 100% 50% / 0.7), 0 0 40px hsl(200 100% 40% / 0.4)',
            '0 0 15px hsl(180 100% 50% / 0.6), 0 0 30px hsl(180 100% 40% / 0.3)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Main container */}
      <div 
        className="relative w-full h-full rounded-lg overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, hsl(220 30% 12%) 0%, hsl(240 25% 8%) 100%)',
          border: '2px solid hsl(180 100% 45% / 0.6)',
        }}
      >
        {/* Animated gradient border */}
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent, hsl(180 100% 50% / 0.3), transparent)',
            backgroundSize: '200% 100%',
          }}
          animate={{
            backgroundPosition: ['200% 0', '-200% 0'],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />

        {/* SL Text Logo */}
        <div className="relative w-full h-full flex items-center justify-center">
          <motion.svg 
            viewBox="0 0 48 32" 
            className="w-[85%] h-[85%]"
            animate={{
              filter: [
                'drop-shadow(0 0 3px hsl(180 100% 50%)) drop-shadow(0 0 8px hsl(180 100% 40% / 0.5))',
                'drop-shadow(0 0 5px hsl(200 100% 55%)) drop-shadow(0 0 12px hsl(200 100% 45% / 0.6))',
                'drop-shadow(0 0 3px hsl(180 100% 50%)) drop-shadow(0 0 8px hsl(180 100% 40% / 0.5))',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <defs>
              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(180 100% 55%)" />
                <stop offset="50%" stopColor="hsl(200 100% 60%)" />
                <stop offset="100%" stopColor="hsl(220 100% 65%)" />
              </linearGradient>
              <linearGradient id="logoGradient2" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(40 100% 55%)" />
                <stop offset="100%" stopColor="hsl(45 100% 65%)" />
              </linearGradient>
            </defs>
            
            {/* S Letter */}
            <motion.path
              d="M4,8 Q4,4 10,4 L18,4 Q22,4 22,8 L22,10 Q22,14 18,14 L10,14 Q6,14 6,18 L6,20 Q6,24 10,24 L18,24 Q22,24 22,20"
              fill="none"
              stroke="url(#logoGradient)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
            
            {/* L Letter */}
            <motion.path
              d="M28,4 L28,24 L44,24"
              fill="none"
              stroke="url(#logoGradient)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
            />
          </motion.svg>
        </div>

        {/* Bottom accent line - Indian flag inspired */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] flex">
          <motion.div 
            className="flex-1"
            style={{ background: 'hsl(25 100% 50%)' }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.div 
            className="flex-1"
            style={{ background: 'hsl(0 0% 95%)' }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div 
            className="flex-1"
            style={{ background: 'hsl(120 70% 35%)' }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
          />
        </div>

        {/* Subtle corner accents */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
          <motion.path
            d="M 8 25 L 8 8 L 25 8"
            fill="none"
            stroke="hsl(45 100% 55%)"
            strokeWidth="2"
            strokeLinecap="round"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.path
            d="M 75 8 L 92 8 L 92 25"
            fill="none"
            stroke="hsl(45 100% 55%)"
            strokeWidth="2"
            strokeLinecap="round"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          />
          <motion.path
            d="M 8 75 L 8 92 L 25 92"
            fill="none"
            stroke="hsl(180 100% 50%)"
            strokeWidth="2"
            strokeLinecap="round"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          />
          <motion.path
            d="M 75 92 L 92 92 L 92 75"
            fill="none"
            stroke="hsl(180 100% 50%)"
            strokeWidth="2"
            strokeLinecap="round"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
          />
        </svg>
      </div>
    </motion.div>
  );
};

export default AnimatedLogoIcon;
