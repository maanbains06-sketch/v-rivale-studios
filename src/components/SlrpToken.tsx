import { memo } from "react";
import { motion } from "framer-motion";

interface SlrpTokenProps {
  size?: "sm" | "md" | "lg" | "xl";
  amount?: number;
  animate?: boolean;
  className?: string;
}

const SIZES = {
  sm: { outer: 24, inner: 18, text: "text-[8px]", ring: 1.5 },
  md: { outer: 40, inner: 30, text: "text-[12px]", ring: 2 },
  lg: { outer: 64, inner: 48, text: "text-lg", ring: 3 },
  xl: { outer: 96, inner: 72, text: "text-2xl", ring: 4 },
};

const SlrpToken = memo(({ size = "md", amount, animate = true, className = "" }: SlrpTokenProps) => {
  const s = SIZES[size];

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <motion.span
        className="relative inline-flex items-center justify-center shrink-0"
        style={{ width: s.outer, height: s.outer }}
        animate={animate ? { rotateY: [0, 360] } : undefined}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      >
        {/* Outer glow */}
        <span
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle, hsla(45,100%,60%,0.5) 0%, hsla(35,100%,50%,0.15) 50%, transparent 70%)",
            filter: `blur(${s.ring * 2}px)`,
          }}
        />

        {/* Main coin body */}
        <svg
          width={s.outer}
          height={s.outer}
          viewBox="0 0 96 96"
          fill="none"
          className="relative z-10 drop-shadow-[0_0_8px_hsla(45,100%,55%,0.6)]"
        >
          <defs>
            <radialGradient id="coinFace" cx="40%" cy="35%" r="60%">
              <stop offset="0%" stopColor="hsl(50,100%,75%)" />
              <stop offset="40%" stopColor="hsl(45,100%,55%)" />
              <stop offset="100%" stopColor="hsl(35,90%,35%)" />
            </radialGradient>
            <linearGradient id="coinEdge" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(40,80%,50%)" />
              <stop offset="50%" stopColor="hsl(35,90%,30%)" />
              <stop offset="100%" stopColor="hsl(40,80%,45%)" />
            </linearGradient>
            <linearGradient id="shimmer" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="hsla(50,100%,90%,0)" />
              <stop offset="45%" stopColor="hsla(50,100%,90%,0.4)" />
              <stop offset="55%" stopColor="hsla(50,100%,90%,0.4)" />
              <stop offset="100%" stopColor="hsla(50,100%,90%,0)" />
            </linearGradient>
          </defs>

          {/* Edge / thickness */}
          <ellipse cx="48" cy="52" rx="42" ry="42" fill="url(#coinEdge)" />

          {/* Face */}
          <circle cx="48" cy="48" r="42" fill="url(#coinFace)" />

          {/* Inner ring */}
          <circle cx="48" cy="48" r="35" fill="none" stroke="hsl(40,70%,40%)" strokeWidth="1.5" opacity="0.6" />
          <circle cx="48" cy="48" r="30" fill="none" stroke="hsl(45,80%,55%)" strokeWidth="0.8" opacity="0.4" />

          {/* S letter */}
          <text
            x="48"
            y="56"
            textAnchor="middle"
            fontWeight="900"
            fontSize="36"
            fontFamily="system-ui, sans-serif"
            fill="hsl(35,80%,25%)"
            opacity="0.9"
          >
            S
          </text>
          <text
            x="48"
            y="56"
            textAnchor="middle"
            fontWeight="900"
            fontSize="36"
            fontFamily="system-ui, sans-serif"
            fill="hsl(50,100%,85%)"
            opacity="0.3"
          >
            S
          </text>

          {/* Decorative dots around edge */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const cx = 48 + 38 * Math.cos(angle);
            const cy = 48 + 38 * Math.sin(angle);
            return <circle key={i} cx={cx} cy={cy} r="1.5" fill="hsl(45,80%,55%)" opacity="0.5" />;
          })}

          {/* Shimmer overlay */}
          <circle cx="48" cy="48" r="42" fill="url(#shimmer)" />
        </svg>
      </motion.span>

      {amount !== undefined && (
        <span className={`font-black text-amber-300 ${s.text}`}>
          {amount.toLocaleString()}
        </span>
      )}
    </span>
  );
});

SlrpToken.displayName = "SlrpToken";

export default SlrpToken;
