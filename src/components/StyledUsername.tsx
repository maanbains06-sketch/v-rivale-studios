import { memo } from "react";
import { useProfileCustomization } from "@/hooks/useProfileCustomization";
import { motion } from "framer-motion";

interface StyledUsernameProps {
  userId?: string;
  username: string;
  className?: string;
  showBadge?: boolean;
}

const BIO_EFFECTS: Record<string, string> = {
  sparkle: "animate-pulse",
  glow: "drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]",
  rainbow: "bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent",
  fire: "drop-shadow-[0_0_6px_rgba(239,68,68,0.6)]",
  ice: "drop-shadow-[0_0_6px_rgba(56,189,248,0.6)]",
  neon: "drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]",
};

const StyledUsername = memo(({ userId, username, className = "", showBadge = true }: StyledUsernameProps) => {
  const { customization } = useProfileCustomization(userId);

  const nameStyle: React.CSSProperties = {};
  if (customization.username_color) {
    nameStyle.color = customization.username_color;
  }

  const effectClass = customization.equipped_bio_effect 
    ? BIO_EFFECTS[customization.equipped_bio_effect] || ""
    : "";

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span style={nameStyle} className={effectClass}>
        {username}
      </span>
      {showBadge && customization.badge_emoji && (
        customization.badge_animated ? (
          <motion.span
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-sm"
          >
            {customization.badge_emoji}
          </motion.span>
        ) : (
          <span className="text-sm">{customization.badge_emoji}</span>
        )
      )}
    </span>
  );
});

StyledUsername.displayName = "StyledUsername";
export default StyledUsername;
