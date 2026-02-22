import { useState, useEffect, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown } from "lucide-react";
import SlrpToken from "./SlrpToken";
import StyledUsername from "./StyledUsername";
import StyledAvatar from "./StyledAvatar";
import { motion } from "framer-motion";

interface RichUser {
  user_id: string;
  balance: number;
  discord_username: string | null;
  discord_id: string | null;
  discord_avatar: string | null;
}

const WealthLeaderboard = memo(() => {
  const [topUsers, setTopUsers] = useState<RichUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase.functions.invoke("token-economy", {
          body: { action: "get_leaderboard", type: "richest" }
        });
        setTopUsers(data?.leaderboard?.slice(0, 10) || []);
      } catch (e) {
        console.error("Failed to load wealth leaderboard:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading || topUsers.length === 0) return null;

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-gradient-to-br from-amber-500/5 via-background to-background border-amber-500/20 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Crown className="w-5 h-5 text-amber-400" />
            <span className="bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent font-black">
              RICHEST PLAYERS
            </span>
            <SlrpToken size="sm" animate={false} />
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-1">
            {topUsers.map((user, idx) => (
              <motion.div
                key={user.user_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-accent/30 ${idx < 3 ? "bg-amber-500/5" : ""}`}
              >
                <span className="w-6 text-center font-black text-sm">
                  {idx < 3 ? medals[idx] : <span className="text-muted-foreground">#{idx + 1}</span>}
                </span>
                <StyledAvatar
                  userId={user.user_id}
                  discordId={user.discord_id || undefined}
                  discordAvatar={user.discord_avatar || undefined}
                  username={user.discord_username || "?"}
                  size="sm"
                />
                <StyledUsername
                  userId={user.user_id}
                  username={user.discord_username || "Unknown"}
                  className="flex-1 text-sm font-medium truncate"
                />
                <SlrpToken size="sm" amount={user.balance} animate={false} />
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

WealthLeaderboard.displayName = "WealthLeaderboard";
export default WealthLeaderboard;
