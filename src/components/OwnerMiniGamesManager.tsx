import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOwnerAuditLog } from "@/hooks/useOwnerAuditLog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Gamepad2, Trash2, RotateCcw, AlertTriangle, Trophy, Calendar } from "lucide-react";

const ALL_GAMES = [
  { id: "escape_room", title: "Escape Room" },
  { id: "memory_match", title: "Memory Match" },
  { id: "reaction_test", title: "Reaction Test" },
  { id: "trivia_quiz", title: "RP Trivia Quiz" },
  { id: "word_scramble", title: "Word Scramble" },
  { id: "speed_typer", title: "Speed Typer" },
  { id: "color_match", title: "Color Match" },
  { id: "pattern_memory", title: "Pattern Memory" },
  { id: "math_blitz", title: "Math Blitz" },
  { id: "aim_trainer", title: "Aim Trainer" },
  { id: "bomb_defusal", title: "Bomb Defusal" },
  { id: "snake_runner", title: "Snake Runner" },
  { id: "block_puzzle", title: "Block Blast" },
  { id: "bubble_shooter", title: "Bubble Shooter" },
  { id: "space_invaders", title: "Space Invaders" },
];

const OwnerMiniGamesManager = () => {
  const { toast } = useToast();
  const { logAction } = useOwnerAuditLog();
  const [resetting, setResetting] = useState<string | null>(null);
  const [resettingAll, setResettingAll] = useState(false);
  const [resettingWeekly, setResettingWeekly] = useState(false);
  const [confirmResetAll, setConfirmResetAll] = useState(false);
  const [confirmResetWeekly, setConfirmResetWeekly] = useState(false);
  const [confirmResetSingle, setConfirmResetSingle] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const loadCounts = async () => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const [allResult, weeklyResult] = await Promise.all([
      supabase.from("mini_game_scores").select("game_type"),
      supabase.from("mini_game_scores").select("id").gte("created_at", weekAgo),
    ]);
    if (allResult.data) {
      const counts: Record<string, number> = {};
      allResult.data.forEach(d => { counts[d.game_type] = (counts[d.game_type] || 0) + 1; });
      setScores(counts);
    }
    setWeeklyCount(weeklyResult.data?.length || 0);
    setLoaded(true);
  };

  if (!loaded) loadCounts();

  const resetSingleGame = async (gameId: string) => {
    setResetting(gameId);
    const { error } = await supabase.from("mini_game_scores").delete().eq("game_type", gameId);
    if (error) {
      toast({ title: "Error resetting leaderboard", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Leaderboard Reset", description: `${ALL_GAMES.find(g => g.id === gameId)?.title} scores cleared.` });
      logAction({ actionType: "reset_leaderboard", actionDescription: `Reset leaderboard for ${gameId}` });
      setScores(prev => ({ ...prev, [gameId]: 0 }));
    }
    setResetting(null);
    setConfirmResetSingle(null);
  };

  const resetAllGames = async () => {
    setResettingAll(true);
    const { error } = await supabase.from("mini_game_scores").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) {
      toast({ title: "Error resetting all leaderboards", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "All Leaderboards Reset", description: "Every mini-game leaderboard has been cleared." });
      logAction({ actionType: "reset_all_leaderboards", actionDescription: "Reset ALL mini-game leaderboards" });
      setScores({});
      setWeeklyCount(0);
    }
    setResettingAll(false);
    setConfirmResetAll(false);
  };

  const resetWeeklyLeaderboard = async () => {
    setResettingWeekly(true);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from("mini_game_scores").delete().gte("created_at", weekAgo);
    if (error) {
      toast({ title: "Error resetting weekly leaderboard", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Weekly Leaderboard Reset", description: "All scores from the past 7 days have been cleared." });
      logAction({ actionType: "reset_weekly_leaderboard", actionDescription: "Reset weekly mini-game leaderboard positions" });
      setWeeklyCount(0);
      // Refresh all counts since weekly scores are a subset
      loadCounts();
    }
    setResettingWeekly(false);
    setConfirmResetWeekly(false);
  };

  const totalScores = Object.values(scores).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="w-5 h-5" /> Mini Games Management
              </CardTitle>
              <CardDescription>Reset leaderboards and manage all mini-games</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                <Trophy className="w-3 h-3 mr-1" /> {totalScores} total
              </Badge>
              <Badge variant="outline" className="text-sm">
                <Calendar className="w-3 h-3 mr-1" /> {weeklyCount} weekly
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Reset Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <div>
              <Button variant="destructive" className="w-full gap-2" onClick={() => setConfirmResetAll(true)} disabled={resettingAll}>
                <RotateCcw className="w-4 h-4" />
                {resettingAll ? "Resetting..." : "Reset ALL Leaderboards"}
              </Button>
              <p className="text-xs text-muted-foreground mt-1 text-center">
                Delete all scores from every game
              </p>
            </div>
            <div>
              <Button variant="outline" className="w-full gap-2 border-orange-500/30 text-orange-400 hover:bg-orange-500/10" onClick={() => setConfirmResetWeekly(true)} disabled={resettingWeekly}>
                <Calendar className="w-4 h-4" />
                {resettingWeekly ? "Resetting..." : "Reset Weekly Leaderboard"}
              </Button>
              <p className="text-xs text-muted-foreground mt-1 text-center">
                Delete scores from last 7 days only
              </p>
            </div>
          </div>

          {/* Individual Games */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ALL_GAMES.map(game => (
              <div key={game.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-3">
                  <Gamepad2 className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{game.title}</p>
                    <p className="text-xs text-muted-foreground">{scores[game.id] || 0} scores</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-400 hover:text-red-300 border-red-500/30"
                  onClick={() => setConfirmResetSingle(game.id)}
                  disabled={resetting === game.id}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  {resetting === game.id ? "..." : "Reset"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Confirm Reset All */}
      <AlertDialog open={confirmResetAll} onOpenChange={setConfirmResetAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" /> Reset ALL Leaderboards?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {totalScores} scores across all 13 mini-games including the weekly leaderboard. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={resetAllGames} className="bg-red-600 hover:bg-red-700">
              Reset All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Reset Weekly */}
      <AlertDialog open={confirmResetWeekly} onOpenChange={setConfirmResetWeekly}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-400" /> Reset Weekly Leaderboard?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will delete {weeklyCount} scores from the past 7 days. The weekly top players leaderboard will be cleared. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={resetWeeklyLeaderboard} className="bg-orange-600 hover:bg-orange-700">
              Reset Weekly
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Reset Single */}
      <AlertDialog open={!!confirmResetSingle} onOpenChange={() => setConfirmResetSingle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset {ALL_GAMES.find(g => g.id === confirmResetSingle)?.title} Leaderboard?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all scores for this game. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmResetSingle && resetSingleGame(confirmResetSingle)} className="bg-red-600 hover:bg-red-700">
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OwnerMiniGamesManager;
