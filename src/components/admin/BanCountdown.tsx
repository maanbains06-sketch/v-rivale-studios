import { useEffect, useState } from "react";
import { Ban, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BanCountdownProps {
  expiresAt: string;
  playerName: string;
}

const BanCountdown = ({ expiresAt, playerName }: BanCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft("Expired");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const parts: string[] = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0) parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);

      setTimeLeft(parts.join(" "));
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (isExpired) return null;

  return (
    <Badge
      variant="destructive"
      className="flex items-center gap-1.5 text-xs font-mono animate-pulse"
    >
      <Ban className="w-3 h-3" />
      <Clock className="w-3 h-3" />
      {timeLeft}
    </Badge>
  );
};

export default BanCountdown;
