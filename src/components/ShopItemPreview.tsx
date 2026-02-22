import { memo } from "react";
import { motion } from "framer-motion";

interface ShopItemPreviewProps {
  itemType: string;
  itemData: any;
  category: string;
}

const ShopItemPreview = memo(({ itemType, itemData, category }: ShopItemPreviewProps) => {
  const color = itemData?.color || "#8b5cf6";
  const gradient = itemData?.gradient;
  const animation = itemData?.animation;
  const hasGlow = itemData?.glow;
  const hasParticles = itemData?.particles;
  const emoji = itemData?.emoji || "🏅";

  // Color / Username style preview
  if (itemType === "color") {
    return (
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        {/* Background glow */}
        {hasGlow && (
          <motion.div
            className="absolute inset-0 rounded-full blur-3xl opacity-30"
            style={{ background: `radial-gradient(circle, ${color}, transparent 70%)` }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
        {/* Particles */}
        {hasParticles && <FloatingParticles color={color} count={6} />}
        {/* Username text preview */}
        <motion.span
          className="text-xl font-black z-10 tracking-wide"
          style={{
            background: gradient
              ? `linear-gradient(135deg, ${color}, ${gradient})`
              : color,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: hasGlow ? `drop-shadow(0 0 8px ${color}80)` : undefined,
          }}
          animate={
            animation === "pulse" ? { scale: [1, 1.05, 1] } :
            animation === "wave" ? { y: [0, -3, 0, 3, 0] } :
            animation === "flicker" ? { opacity: [1, 0.6, 1, 0.8, 1] } :
            animation === "shimmer" ? { filter: [`drop-shadow(0 0 4px ${color}40)`, `drop-shadow(0 0 12px ${color}90)`, `drop-shadow(0 0 4px ${color}40)`] } :
            animation === "rainbow" ? { filter: ["hue-rotate(0deg)", "hue-rotate(360deg)"] } :
            animation === "drip" ? { y: [0, 2, 0], scaleY: [1, 1.04, 1] } :
            animation === "frost" ? { scale: [1, 1.02, 1], opacity: [0.9, 1, 0.9] } :
            animation === "lava" ? { scale: [1, 1.03, 0.98, 1] } :
            animation === "phantom" ? { opacity: [1, 0.3, 0.7, 1] } :
            animation === "dragonfire" ? { scale: [1, 1.06, 1], filter: [`drop-shadow(0 0 6px ${color}60)`, `drop-shadow(0 0 16px ${color}ff)`, `drop-shadow(0 0 6px ${color}60)`] } :
            animation === "void" ? { scale: [1, 0.97, 1.03, 1], opacity: [1, 0.7, 1] } :
            animation === "glitch" ? { x: [0, -3, 3, -1, 1, 0], skewX: [0, -2, 2, 0], opacity: [1, 0.7, 1, 0.85, 1] } :
            animation === "supernova_text" ? { scale: [1, 1.08, 0.95, 1.05, 1], filter: [`drop-shadow(0 0 6px ${color}60)`, `drop-shadow(0 0 20px ${color}ff)`, `drop-shadow(0 0 6px ${color}60)`] } :
            { scale: [1, 1.03, 1] }
          }
          transition={{ duration: animation === "rainbow" ? 3 : animation === "glitch" ? 0.5 : animation === "supernova_text" ? 2 : 2, repeat: Infinity, ease: "easeInOut" }}
        >
          Username
        </motion.span>
      </div>
    );
  }

  // Badge preview
  if (itemType === "badge" || itemType === "animated_badge") {
    const badgeAnim = itemData?.animation;
    const glowColor = itemData?.glow;
    return (
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        {glowColor && (
          <motion.div
            className="absolute w-20 h-20 rounded-full blur-2xl opacity-25"
            style={{ background: glowColor }}
            animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0.35, 0.15] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
        {hasParticles && <FloatingParticles color={glowColor || color} count={5} />}
        <motion.div
          className="text-5xl z-10"
          style={{ filter: glowColor ? `drop-shadow(0 0 10px ${glowColor})` : undefined }}
          animate={
            badgeAnim === "bounce" ? { y: [0, -8, 0] } :
            badgeAnim === "shake" ? { rotate: [0, -8, 8, -4, 4, 0] } :
            badgeAnim === "spin" ? { rotate: [0, 360] } :
            badgeAnim === "pulse" ? { scale: [1, 1.2, 1] } :
            badgeAnim === "flame" ? { y: [0, -4, 0], scale: [1, 1.1, 1], rotate: [0, 3, -3, 0] } :
            badgeAnim === "glow_pulse" ? { scale: [1, 1.15, 1], filter: [`drop-shadow(0 0 4px ${glowColor || color}40)`, `drop-shadow(0 0 16px ${glowColor || color}ff)`, `drop-shadow(0 0 4px ${glowColor || color}40)`] } :
            badgeAnim === "celestial" ? { rotate: [0, 360], scale: [1, 1.1, 1] } :
            itemType === "animated_badge" ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } :
            {}
          }
          transition={{
            duration: badgeAnim === "spin" ? 4 : badgeAnim === "celestial" ? 6 : 1.5,
            repeat: Infinity,
            ease: badgeAnim === "spin" || badgeAnim === "celestial" ? "linear" : "easeInOut",
          }}
        >
          {emoji}
        </motion.div>
        {/* Orbiting dots for celestial */}
        {itemData?.orbiting && (
          <>
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full z-10"
                style={{ background: glowColor || "#fbbf24" }}
                animate={{ rotate: [i * 120, i * 120 + 360] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                <motion.div
                  className="w-2 h-2 rounded-full"
                  style={{ background: glowColor || "#fbbf24", transform: "translateX(28px)" }}
                />
              </motion.div>
            ))}
          </>
        )}
      </div>
    );
  }

  // Frame preview
  if (itemType === "frame") {
    const frameAnim = itemData?.animation;
    const frameStyle = itemData?.style;
    return (
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        {hasGlow && (
          <motion.div
            className="absolute w-24 h-24 rounded-full blur-3xl opacity-20"
            style={{ background: gradient ? `linear-gradient(135deg, ${color}, ${gradient})` : color }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        )}
        {hasParticles && <FloatingParticles color={color} count={4} />}
        <motion.div
          className="w-16 h-16 rounded-xl border-[3px] z-10 flex items-center justify-center"
          style={{
            borderImage: gradient ? `linear-gradient(135deg, ${color}, ${gradient}) 1` : undefined,
            borderColor: gradient ? undefined : color,
            boxShadow: hasGlow ? `0 0 15px ${color}60, inset 0 0 8px ${color}20` : undefined,
          }}
          animate={
            frameAnim === "pulse" ? { boxShadow: [`0 0 8px ${color}30`, `0 0 20px ${color}80`, `0 0 8px ${color}30`] } :
            frameAnim === "rotate" ? { rotate: [0, 360] } :
            frameAnim === "warp" ? { scale: [1, 1.05, 0.97, 1], borderRadius: ["12px", "16px", "10px", "12px"] } :
            frameAnim === "sparkle" ? { boxShadow: [`0 0 5px ${color}20`, `0 0 25px ${color}90, 0 0 40px ${color}40`, `0 0 5px ${color}20`] } :
            frameAnim === "holographic" ? { filter: ["hue-rotate(0deg)", "hue-rotate(180deg)", "hue-rotate(360deg)"] } :
            frameAnim === "galaxy" ? { rotate: [0, 360], boxShadow: [`0 0 10px ${color}40`, `0 0 25px ${color}80`, `0 0 10px ${color}40`] } :
            {}
          }
          transition={{
            duration: frameAnim === "rotate" || frameAnim === "galaxy" ? 6 : 2.5,
            repeat: Infinity,
            ease: frameAnim === "rotate" || frameAnim === "galaxy" ? "linear" : "easeInOut",
          }}
        >
          <div className="w-8 h-8 rounded-md bg-muted/50" />
        </motion.div>
      </div>
    );
  }

  // Effect preview
  if (itemType === "effect") {
    const effect = itemData?.effect;
    const effectColor = itemData?.color || "#fbbf24";
    const intensity = itemData?.intensity;
    const particleCount = intensity === "max" ? 12 : intensity === "high" ? 8 : intensity === "medium" ? 5 : 3;
    return (
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        {/* Central text */}
        <span className="text-xs font-semibold text-muted-foreground z-10 uppercase tracking-widest">
          {effect}
        </span>
        {/* Effect particles */}
        {Array.from({ length: particleCount }).map((_, i) => {
          const angle = (i / particleCount) * 360;
          const radius = 30 + Math.random() * 20;
          const size = 2 + Math.random() * 4;
          return (
            <motion.div
              key={i}
              className="absolute rounded-full z-0"
              style={{
                width: size,
                height: size,
                background: effect === "rainbow" || effect === "aurora" || effect === "stardust"
                  ? `hsl(${(i / particleCount) * 360}, 80%, 60%)`
                  : effectColor,
                filter: `blur(${effect === "glow" || effect === "smoke" ? 2 : 0}px)`,
                boxShadow: `0 0 ${size * 2}px ${effectColor}80`,
                borderRadius: effect === "cherry" ? "50% 0 50% 50%" : "50%",
              }}
              animate={
                effect === "sparkle" ? { x: [Math.cos(angle * Math.PI / 180) * radius, Math.cos((angle + 30) * Math.PI / 180) * radius], y: [Math.sin(angle * Math.PI / 180) * radius, Math.sin((angle + 30) * Math.PI / 180) * radius], opacity: [0, 1, 0], scale: [0, 1.5, 0] } :
                effect === "fire" ? { y: [20, -30], x: [Math.random() * 20 - 10, Math.random() * 20 - 10], opacity: [1, 0], scale: [1, 0.3] } :
                effect === "ice" ? { y: [-20, 30], opacity: [0, 1, 0], rotate: [0, 180] } :
                effect === "rainbow" ? { x: [Math.cos(angle * Math.PI / 180) * 20, Math.cos(angle * Math.PI / 180) * radius], y: [Math.sin(angle * Math.PI / 180) * 20, Math.sin(angle * Math.PI / 180) * radius], opacity: [0, 1, 0] } :
                effect === "glow" ? { scale: [0.8, 1.5, 0.8], opacity: [0.3, 0.8, 0.3] } :
                effect === "meteor" ? { x: [50, -50], y: [-30, 30], opacity: [1, 0] } :
                effect === "supernova" ? { scale: [0, 2, 0], opacity: [0, 1, 0], x: [0, Math.cos(angle * Math.PI / 180) * 50], y: [0, Math.sin(angle * Math.PI / 180) * 50] } :
                effect === "cherry" ? { y: [-30, 40], x: [Math.random() * 30 - 15, Math.random() * 30 - 15], opacity: [0, 1, 0.3], rotate: [0, 360] } :
                effect === "lightning" ? { opacity: [0, 1, 0, 1, 0], scale: [0.5, 1.8, 0.5], x: [Math.random() * 40 - 20, Math.random() * 40 - 20] } :
                effect === "smoke" ? { y: [20, -20], opacity: [0, 0.5, 0], scale: [0.5, 2, 2.5], x: [0, Math.random() * 20 - 10] } :
                effect === "bubbles" ? { y: [30, -30], opacity: [0, 0.8, 0], scale: [0.3, 1, 0.6] } :
                effect === "stardust" ? { x: [Math.cos(angle * Math.PI / 180) * 15, Math.cos(angle * Math.PI / 180) * radius], y: [Math.sin(angle * Math.PI / 180) * 15, Math.sin(angle * Math.PI / 180) * radius], opacity: [0, 1, 0], scale: [0, 1.2, 0] } :
                effect === "drip_effect" ? { y: [0, 40], opacity: [1, 0], scaleY: [1, 1.5] } :
                effect === "aurora" ? { x: [Math.cos(angle * Math.PI / 180) * 20, Math.cos((angle + 60) * Math.PI / 180) * radius], y: [Math.sin(angle * Math.PI / 180) * 20, Math.sin((angle + 60) * Math.PI / 180) * radius], opacity: [0, 0.7, 0], scale: [1, 2, 1] } :
                effect === "plasma" ? { x: [Math.cos(angle * Math.PI / 180) * 10, Math.cos(angle * Math.PI / 180) * radius * 1.2], y: [Math.sin(angle * Math.PI / 180) * 10, Math.sin(angle * Math.PI / 180) * radius * 1.2], opacity: [0.8, 0, 0.8], scale: [1, 0.3, 1] } :
                effect === "void_collapse" ? { x: [Math.cos(angle * Math.PI / 180) * 50, 0], y: [Math.sin(angle * Math.PI / 180) * 50, 0], opacity: [0, 1, 0], scale: [1.5, 0, 1.5] } :
                effect === "black_hole" ? { x: [Math.cos(angle * Math.PI / 180) * 45, 0], y: [Math.sin(angle * Math.PI / 180) * 45, 0], opacity: [1, 0], scale: [1, 0] } :
                effect === "phoenix" ? { y: [30, -40], x: [Math.random() * 30 - 15, Math.random() * 20 - 10], opacity: [0, 1, 0], scale: [0.5, 1.5, 0] } :
                { opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }
              }
              transition={{
                duration: effect === "fire" || effect === "phoenix" ? 1 : effect === "meteor" ? 0.8 : effect === "supernova" ? 1.5 : effect === "lightning" ? 0.4 : effect === "smoke" ? 3 : effect === "black_hole" || effect === "void_collapse" ? 2.5 : effect === "aurora" ? 4 : 2,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeOut",
              }}
            />
          );
        })}
      </div>
    );
  }

  // Fallback
  return (
    <div className="w-full h-full flex items-center justify-center">
      <span className="text-3xl">{emoji}</span>
    </div>
  );
});

// Floating particles helper component
const FloatingParticles = memo(({ color, count }: { color: string; count: number }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1.5 h-1.5 rounded-full z-0"
        style={{
          background: color,
          boxShadow: `0 0 6px ${color}`,
          left: `${15 + Math.random() * 70}%`,
          top: `${15 + Math.random() * 70}%`,
        }}
        animate={{
          y: [0, -10 - Math.random() * 15, 0],
          x: [0, Math.random() * 10 - 5, 0],
          opacity: [0, 0.8, 0],
          scale: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 2 + Math.random(),
          repeat: Infinity,
          delay: i * 0.3,
          ease: "easeInOut",
        }}
      />
    ))}
  </>
));

ShopItemPreview.displayName = "ShopItemPreview";
FloatingParticles.displayName = "FloatingParticles";

export default ShopItemPreview;
