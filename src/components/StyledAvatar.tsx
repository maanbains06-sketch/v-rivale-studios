import { memo } from "react";
import { useProfileCustomization } from "@/hooks/useProfileCustomization";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface StyledAvatarProps {
  userId?: string;
  discordId?: string;
  discordAvatar?: string;
  username?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-16 h-16",
};

const StyledAvatar = memo(({ userId, discordId, discordAvatar, username, className = "", size = "md" }: StyledAvatarProps) => {
  const { customization } = useProfileCustomization(userId);

  const avatarUrl = discordId && discordAvatar
    ? `https://cdn.discordapp.com/avatars/${discordId}/${discordAvatar}.png?size=128`
    : undefined;

  const frameStyle: React.CSSProperties = {};
  if (customization.frame_color) {
    frameStyle.boxShadow = `0 0 0 3px ${customization.frame_color}, 0 0 12px ${customization.frame_color}40`;
    frameStyle.borderColor = customization.frame_color;
  }

  return (
    <Avatar className={`${SIZES[size]} ${className} ${customization.frame_color ? "border-2" : ""}`} style={frameStyle}>
      <AvatarImage src={avatarUrl} alt={username || "User"} />
      <AvatarFallback className="text-xs bg-muted">
        {(username || "?")[0]?.toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
});

StyledAvatar.displayName = "StyledAvatar";
export default StyledAvatar;
