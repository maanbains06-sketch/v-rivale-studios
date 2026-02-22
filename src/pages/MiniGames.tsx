import { useState, useEffect, useCallback, useRef, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import {
  Gamepad2, Trophy, Clock, ArrowLeft, Brain, Zap, BookOpen,
  Shuffle, Target, Lock, Search, Eye, CheckCircle, XCircle, Star,
  Crosshair, Keyboard, Palette, Grid3X3, Calculator, DoorOpen,
  Lightbulb, Key, Flame, Bomb, Skull, Box
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BubbleShooterGame from "@/components/mini-games/BubbleShooterGame";
import BrickBreakerGame from "@/components/mini-games/BrickBreakerGame";

// ─── Types ───────────────────────────────────────────────
interface LeaderboardEntry {
  id: string;
  discord_username: string;
  discord_avatar: string | null;
  discord_id: string | null;
  score: number;
  time_seconds: number | null;
  created_at: string;
}

type GameType =
  | "escape_room" | "memory_match" | "reaction_test" | "trivia_quiz" | "word_scramble"
  | "speed_typer" | "color_match" | "pattern_memory" | "math_blitz" | "aim_trainer"
  | "bomb_defusal" | "snake_runner" | "block_puzzle" | "bubble_shooter" | "brick_breaker";

interface GameDef {
  id: GameType;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  glow: string;
}

const GAMES: GameDef[] = [
  { id: "escape_room", title: "Escape Room", description: "Explore a dark room, find codes & escape in 10 minutes!", icon: <Lock className="w-8 h-8" />, gradient: "from-red-600 via-red-500 to-orange-500", glow: "shadow-red-500/40" },
  { id: "memory_match", title: "Memory Match", description: "Find all matching pairs with flipping 3D cards.", icon: <Brain className="w-8 h-8" />, gradient: "from-purple-600 via-purple-500 to-fuchsia-500", glow: "shadow-purple-500/40" },
  { id: "reaction_test", title: "Reaction Test", description: "Test your reflexes — react when the orb turns green!", icon: <Zap className="w-8 h-8" />, gradient: "from-yellow-500 via-amber-500 to-orange-500", glow: "shadow-yellow-500/40" },
  { id: "trivia_quiz", title: "RP Trivia Quiz", description: "Answer 10 RP knowledge questions against the clock.", icon: <BookOpen className="w-8 h-8" />, gradient: "from-cyan-500 via-sky-500 to-blue-500", glow: "shadow-cyan-500/40" },
  { id: "word_scramble", title: "Word Scramble", description: "Unscramble RP-themed words before time runs out!", icon: <Shuffle className="w-8 h-8" />, gradient: "from-green-500 via-emerald-500 to-teal-500", glow: "shadow-green-500/40" },
  { id: "speed_typer", title: "Speed Typer", description: "Type the words as fast as you can!", icon: <Keyboard className="w-8 h-8" />, gradient: "from-indigo-500 via-blue-500 to-violet-500", glow: "shadow-indigo-500/40" },
  { id: "color_match", title: "Color Match", description: "Does the word match the color? React fast!", icon: <Palette className="w-8 h-8" />, gradient: "from-pink-500 via-rose-500 to-red-500", glow: "shadow-pink-500/40" },
  { id: "pattern_memory", title: "Pattern Memory", description: "Remember and repeat the flashing pattern!", icon: <Grid3X3 className="w-8 h-8" />, gradient: "from-teal-500 via-cyan-500 to-sky-500", glow: "shadow-teal-500/40" },
  { id: "math_blitz", title: "Math Blitz", description: "Solve quick math problems under pressure!", icon: <Calculator className="w-8 h-8" />, gradient: "from-orange-500 via-amber-500 to-yellow-500", glow: "shadow-orange-500/40" },
  { id: "aim_trainer", title: "Aim Trainer", description: "Click the targets as fast and accurately as you can!", icon: <Crosshair className="w-8 h-8" />, gradient: "from-lime-500 via-green-500 to-emerald-500", glow: "shadow-lime-500/40" },
  { id: "bomb_defusal", title: "Bomb Defusal", description: "Cut the right wires before the bomb explodes!", icon: <Bomb className="w-8 h-8" />, gradient: "from-red-700 via-orange-600 to-yellow-500", glow: "shadow-red-600/40" },
  { id: "snake_runner", title: "Snake Runner", description: "Classic snake — eat food, grow longer, don't hit walls!", icon: <Flame className="w-8 h-8" />, gradient: "from-emerald-600 via-green-500 to-lime-400", glow: "shadow-emerald-500/40" },
  { id: "block_puzzle", title: "Block Blast", description: "Tetris-style falling blocks — place them to clear lines & score!", icon: <Box className="w-8 h-8" />, gradient: "from-blue-500 via-cyan-400 to-blue-600", glow: "shadow-blue-500/40" },
  { id: "bubble_shooter", title: "Bubble Shooter", description: "Aim & pop colorful bubbles — match 3+ to clear the board!", icon: <Target className="w-8 h-8" />, gradient: "from-pink-500 via-fuchsia-500 to-purple-500", glow: "shadow-pink-500/40" },
  { id: "brick_breaker", title: "Brick Breaker", description: "Smash colorful bricks with your paddle — collect power-ups & clear levels!", icon: <Skull className="w-8 h-8" />, gradient: "from-cyan-500 via-blue-500 to-indigo-500", glow: "shadow-cyan-500/40" },
];

// ─── 3D Card Wrapper ─────────────────────────────────────
const Card3D = ({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  const handleMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    ref.current.style.transform = `perspective(800px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale3d(1.02, 1.02, 1.02)`;
  };
  const handleLeave = () => { if (ref.current) ref.current.style.transform = "none"; };
  return (
    <div ref={ref} className={`transition-transform duration-300 ease-out ${className}`} style={{ transformStyle: "preserve-3d" }}
      onMouseMove={handleMove} onMouseLeave={handleLeave} onClick={onClick}>
      {children}
    </div>
  );
};

// ─── Neon Digital Timer ──────────────────────────────────
const NeonTimer = ({ seconds, danger = 60 }: { seconds: number; danger?: number }) => {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  const isDanger = seconds <= danger;
  return (
    <div className={`font-mono text-4xl md:text-5xl font-black tracking-wider ${isDanger ? "text-red-400 animate-pulse" : "text-cyan-400"}`}
      style={{ textShadow: isDanger ? "0 0 20px hsl(0 80% 55%), 0 0 40px hsl(0 80% 55% / 0.5)" : "0 0 20px hsl(190 80% 55%), 0 0 40px hsl(190 80% 55% / 0.5)", fontFamily: "'Courier New', monospace" }}>
      {m}:{s}
    </div>
  );
};

// ─── Realtime Leaderboard Component ──────────────────────
const Leaderboard = memo(({ gameType }: { gameType: GameType }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [resolvedAvatars, setResolvedAvatars] = useState<Record<string, { username: string; avatar: string | null }>>({});
  const resolvedRef = useRef<Set<string>>(new Set());

  const fetchScores = useCallback(async () => {
    const { data } = await supabase
      .from("mini_game_scores")
      .select("*")
      .eq("game_type", gameType)
      .order("score", { ascending: false })
      .order("time_seconds", { ascending: true })
      .limit(100);
    if (!data) return;

    // Deduplicate: keep only each user's best score (highest score, then lowest time)
    const bestByUser = new Map<string, LeaderboardEntry>();
    for (const row of data as LeaderboardEntry[]) {
      const key = row.discord_id || row.id;
      const existing = bestByUser.get(key);
      if (!existing || row.score > existing.score || (row.score === existing.score && (row.time_seconds ?? Infinity) < (existing.time_seconds ?? Infinity))) {
        bestByUser.set(key, row);
      }
    }
    const top10 = Array.from(bestByUser.values())
      .sort((a, b) => b.score - a.score || (a.time_seconds ?? Infinity) - (b.time_seconds ?? Infinity))
      .slice(0, 10);
    setEntries(top10);

    // Resolve Discord identities for entries missing proper names
    for (const entry of top10) {
      const discordId = entry.discord_id;
      if (!discordId || !/^\d{17,19}$/.test(discordId)) continue;
      if (resolvedRef.current.has(discordId)) continue;
      // Skip if already has a proper username (not "Player" or empty)
      if (entry.discord_username && entry.discord_username !== "Player" && entry.discord_username !== "Anonymous") continue;
      resolvedRef.current.add(discordId);
      // Fire and forget – updates state when done
      supabase.functions.invoke('fetch-discord-user', { body: { discordId } }).then(({ data: userData }) => {
        if (userData) {
          const resolved = {
            username: userData.displayName || userData.globalName || userData.username || "Unknown",
            avatar: userData.avatar || null,
          };
          setResolvedAvatars(prev => ({ ...prev, [discordId]: resolved }));
          // Also update the score rows in DB so future fetches are correct
          supabase.from("mini_game_scores").update({
            discord_username: resolved.username,
            discord_avatar: resolved.avatar,
          }).eq("discord_id", discordId).eq("game_type", gameType).then(() => {});
        }
      });
    }
  }, [gameType]);

  useEffect(() => {
    fetchScores();
    const channel = supabase
      .channel(`leaderboard-${gameType}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "mini_game_scores", filter: `game_type=eq.${gameType}` }, () => fetchScores())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [gameType, fetchScores]);

  const medals = ["🥇", "🥈", "🥉"];

  const getDisplayName = (e: LeaderboardEntry) => {
    const resolved = e.discord_id ? resolvedAvatars[e.discord_id] : null;
    const name = resolved?.username || e.discord_username;
    return (name && name !== "Player") ? name : "Anonymous";
  };

  const getAvatarUrl = (e: LeaderboardEntry) => {
    const resolved = e.discord_id ? resolvedAvatars[e.discord_id] : null;
    const avatar = resolved?.avatar || e.discord_avatar;
    if (!avatar) return null;
    if (avatar.startsWith("http")) return avatar;
    if (e.discord_id) return `https://cdn.discordapp.com/avatars/${e.discord_id}/${avatar}.png?size=64`;
    return null;
  };

  return (
    <div className="mt-6">
      <div className="relative rounded-2xl border border-yellow-500/20 bg-gradient-to-b from-[hsl(220,20%,8%)] to-[hsl(220,20%,5%)] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-amber-500/5 pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
        <div className="p-4 pb-2 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
          <span className="font-bold text-yellow-400 uppercase tracking-wider text-sm" style={{ textShadow: "0 0 10px hsl(50 90% 55% / 0.4)" }}>Global Leaderboard</span>
          <span className="ml-auto text-[10px] text-cyan-400/60 font-mono">⚡ LIVE</span>
        </div>
        <div className="p-3 space-y-1.5">
          {entries.length === 0 && <p className="text-muted-foreground text-sm text-center py-6 font-mono">No scores yet. Be the first! 🚀</p>}
          {entries.map((e, i) => {
            const displayName = getDisplayName(e);
            const avatarUrl = getAvatarUrl(e);
            return (
              <motion.div key={e.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                  i === 0 ? "bg-gradient-to-r from-yellow-500/15 to-amber-500/8 border border-yellow-500/25 shadow-lg shadow-yellow-500/10" :
                  i === 1 ? "bg-gradient-to-r from-gray-400/10 to-slate-500/5 border border-gray-400/15" :
                  i === 2 ? "bg-gradient-to-r from-amber-700/10 to-orange-700/5 border border-amber-700/15" :
                  "bg-white/[0.02] border border-white/[0.04]"
                }`}>
                <span className="font-bold w-7 text-center text-lg">{i < 3 ? medals[i] : <span className="text-muted-foreground text-sm font-mono">#{i + 1}</span>}</span>
                {avatarUrl ? (
                  <img src={avatarUrl} className="w-7 h-7 rounded-full ring-2 ring-yellow-500/20 object-cover" alt={displayName} onError={(ev) => { (ev.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-muted/30 flex items-center justify-center text-xs font-bold text-muted-foreground">{displayName[0].toUpperCase()}</div>
                )}
                <span className="flex-1 truncate text-sm font-medium">{displayName}</span>
                <span className="text-xs font-mono font-bold text-yellow-400">{e.score} pts</span>
                {e.time_seconds != null && <span className="text-[10px] text-muted-foreground font-mono">{e.time_seconds}s</span>}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
Leaderboard.displayName = "Leaderboard";

// ─── Score Submission Helper ─────────────────────────────
const useSubmitScore = () => {
  const { toast } = useToast();
  return useCallback(async (gameType: GameType, score: number, timeSeconds?: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast({ title: "Login required", variant: "destructive" }); return; }
    const { data: profile } = await supabase.from("profiles").select("discord_username, discord_id, discord_avatar").eq("id", user.id).single();
    const discordUsername = profile?.discord_username || user.user_metadata?.discord_username || "Player";
    const discordId = profile?.discord_id || user.user_metadata?.discord_id || null;
    const discordAvatar = profile?.discord_avatar || null;
    await supabase.from("mini_game_scores").insert({
      user_id: user.id, game_type: gameType, score, time_seconds: timeSeconds ?? null,
      discord_username: discordUsername, discord_id: discordId, discord_avatar: discordAvatar,
    });
    // Award SLRP tokens for mini-game win
    if (score > 0) {
      try {
        const { data: tokenData } = await supabase.functions.invoke('token-economy', {
          body: { action: 'earn_mini_game', gameType, score }
        });
        if (tokenData?.success) {
          toast({ title: `Score submitted! +${tokenData.amount} SLRP 🎉`, description: `Balance: ${tokenData.newBalance} tokens` });
        } else {
          toast({ title: "Score submitted! 🎉", description: tokenData?.error || undefined });
        }
      } catch {
        toast({ title: "Score submitted! 🎉" });
      }
    } else {
      toast({ title: "Score submitted! 🎉" });
    }
  }, [toast]);
};

// ─── Timer Badge ─────────────────────────────────────────
const TimerBadge = ({ seconds, danger = 30 }: { seconds: number; danger?: number }) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return (
    <Badge className={`font-mono text-base px-3 py-1 ${seconds <= danger ? "bg-red-600/80 text-red-100 animate-pulse border-red-500/50" : "bg-cyan-950/60 text-cyan-300 border-cyan-500/30"}`}>
      <Clock className="w-3.5 h-3.5 mr-1.5" />
      {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </Badge>
  );
};

// ─── Game Shell ──────────────────────────────────────────
const GameShell = ({ children, onBack, title, icon, gradient, timer, badges }: {
  children: React.ReactNode; onBack: () => void; title: string;
  icon: React.ReactNode; gradient: string; timer?: React.ReactNode;
  badges?: React.ReactNode;
}) => (
  <div className="space-y-5">
    <div className="flex items-center justify-between flex-wrap gap-3 relative z-[60]">
      <Button variant="ghost" onClick={onBack} className="gap-2 text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /> Back</Button>
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-lg bg-gradient-to-r ${gradient}`}>{icon}</div>
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      <div className="flex items-center gap-2 flex-wrap">{badges}{timer}</div>
    </div>
    {children}
  </div>
);

// ─── Start Screen ────────────────────────────────────────
const StartScreen = ({ title, description, icon, gradient, glow, onStart, onBack, gameType }: {
  title: string; description: string; icon: React.ReactNode; gradient: string; glow: string;
  onStart: () => void; onBack: () => void; gameType: GameType;
}) => (
  <div className="space-y-8 py-8">
    <div className="text-center space-y-6">
      <Card3D>
        <div className={`w-32 h-32 mx-auto rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-2xl ${glow}`}
          style={{ transform: "perspective(600px) rotateX(5deg)" }}>
          <div className="text-foreground drop-shadow-lg" style={{ transform: "translateZ(20px)" }}>{icon}</div>
        </div>
      </Card3D>
      <h2 className="text-4xl font-bold">{title}</h2>
      <p className="text-muted-foreground max-w-md mx-auto text-lg">{description}</p>
      <div className="flex gap-4 justify-center">
        <Button size="lg" className={`bg-gradient-to-r ${gradient} border-0 text-foreground shadow-lg ${glow} hover:scale-105 transition-transform`} onClick={onStart}>
          <Gamepad2 className="w-5 h-5 mr-2" /> Play Now
        </Button>
        <Button variant="outline" size="lg" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
      </div>
    </div>
    <Leaderboard gameType={gameType} />
  </div>
);

// ─── End Screen ──────────────────────────────────────────
const EndScreen = ({ won, title, subtitle, onReplay, onBack, gameType }: {
  won: boolean; title: string; subtitle: string;
  onReplay: () => void; onBack: () => void; gameType: GameType;
}) => (
  <div className="text-center space-y-6 py-8">
    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}>
      {won ? (
        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-green-500/40">
          <CheckCircle className="w-12 h-12 text-foreground" />
        </div>
      ) : (
        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-2xl shadow-red-500/40">
          <XCircle className="w-12 h-12 text-foreground" />
        </div>
      )}
    </motion.div>
    <h2 className="text-3xl font-bold">{title}</h2>
    <p className="text-muted-foreground text-lg">{subtitle}</p>
    <div className="flex gap-4 justify-center">
      <Button size="lg" onClick={onReplay} className="bg-gradient-to-r from-primary to-accent border-0">Play Again</Button>
      <Button variant="outline" size="lg" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
    </div>
    <Leaderboard gameType={gameType} />
  </div>
);

// ════════════════════════════════════════════════════════
// GAME 1: ESCAPE ROOM — Dark Atmospheric Room with Neon HUD
// ════════════════════════════════════════════════════════
const ROOM_OBJECTS = [
  { id: "desk", label: "Old Desk", icon: "🗄️", hint: "Check the drawers...", x: 15, y: 58, w: 14, h: 16 },
  { id: "painting", label: "Painting", icon: "🖼️", hint: "Something behind it...", x: 68, y: 12, w: 16, h: 14 },
  { id: "clock", label: "Wall Clock", icon: "🕐", hint: "The time shows 1-3-3-7", x: 42, y: 8, w: 12, h: 12 },
  { id: "safe", label: "Floor Safe", icon: "🔒", hint: "Needs a 4-digit code", x: 78, y: 62, w: 14, h: 14 },
  { id: "bookshelf", label: "Bookshelf", icon: "📚", hint: "A book title is encrypted...", x: 8, y: 18, w: 14, h: 20 },
  { id: "vent", label: "Air Vent", icon: "🌀", hint: "Something glints inside", x: 52, y: 72, w: 12, h: 12 },
  { id: "window", label: "Barred Window", icon: "🪟", hint: "Moonlight reveals letters", x: 88, y: 25, w: 10, h: 16 },
  { id: "door", label: "Exit Door", icon: "🚪", hint: "Locked — solve all puzzles first", x: 48, y: 42, w: 14, h: 22 },
];

const EscapeRoomGame = ({ onBack }: { onBack: () => void }) => {
  const [timeLeft, setTimeLeft] = useState(480);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [activeObject, setActiveObject] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [riddleAnswer, setRiddleAnswer] = useState("");
  const [decryptInput, setDecryptInput] = useState("");
  const [cipherInput, setCipherInput] = useState("");
  const [foundKey, setFoundKey] = useState(false);
  const [foundClue, setFoundClue] = useState(false);
  const submitScore = useSubmitScore();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const game = GAMES[0];

  useEffect(() => {
    if (!started || gameOver) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(intervalRef.current); setGameOver(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [started, gameOver]);

  const completePuzzle = (id: string) => setCompleted(prev => new Set(prev).add(id));
  const canEscape = completed.has("code") && completed.has("riddle") && completed.has("decrypt") && completed.has("cipher") && foundKey;

  const handleEscape = () => {
    if (!canEscape) return;
    setWon(true); setGameOver(true); clearInterval(intervalRef.current);
    const elapsed = 480 - timeLeft;
    submitScore("escape_room", Math.max(100, 1200 - elapsed * 3), elapsed);
  };

  const reset = () => {
    setStarted(false); setTimeLeft(480); setCompleted(new Set());
    setGameOver(false); setWon(false); setActiveObject(null);
    setCodeInput(""); setRiddleAnswer(""); setDecryptInput(""); setCipherInput("");
    setFoundKey(false); setFoundClue(false);
  };

  if (!started) return <StartScreen title={game.title} description={game.description} icon={<Lock className="w-14 h-14" />} gradient={game.gradient} glow={game.glow} onStart={() => setStarted(true)} onBack={onBack} gameType="escape_room" />;
  if (gameOver) return <EndScreen won={won} title={won ? "You Escaped! 🎉" : "Time's Up!"} subtitle={won ? `Escaped in ${Math.floor((480 - timeLeft) / 60)}m ${(480 - timeLeft) % 60}s` : "You didn't escape in time."} onReplay={reset} onBack={onBack} gameType="escape_room" />;

  const tasks = [
    { label: "Find 4-Digit Code", done: completed.has("code"), icon: "🔢" },
    { label: "Decrypt Message", done: completed.has("decrypt"), icon: "🔐" },
    { label: "Solve Riddle", done: completed.has("riddle"), icon: "💡" },
    { label: "Break Caesar Cipher", done: completed.has("cipher"), icon: "🧩" },
    { label: "Locate Secret Key", done: foundKey, icon: "🔑" },
    { label: "Escape Room", done: won, icon: "🚪" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2 text-muted-foreground"><ArrowLeft className="w-4 h-4" /> Back</Button>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-r from-red-600 to-orange-500"><Lock className="w-5 h-5 text-foreground" /></div>
          Escape Room
        </h2>
        <div />
      </div>

      {/* Main layout: Room + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        {/* Room area */}
        <div className="relative rounded-2xl overflow-hidden border border-red-500/20" style={{ perspective: "1200px" }}>
          {/* Room background */}
          <div className="relative min-h-[450px] md:min-h-[500px]"
            style={{
              background: "radial-gradient(ellipse at 50% 30%, hsl(220 20% 14%) 0%, hsl(220 25% 8%) 50%, hsl(220 30% 4%) 100%)",
            }}>
            {/* Ceiling light glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, hsl(190 70% 55% / 0.15), transparent)" }} />
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-cyan-400/80 shadow-[0_0_20px_hsl(190_80%_55%),0_0_60px_hsl(190_80%_55%/0.5)]" />

            {/* Floor with perspective grid */}
            <div className="absolute bottom-0 left-0 right-0 h-[45%]" style={{ transform: "perspective(500px) rotateX(25deg)", transformOrigin: "bottom" }}>
              <div className="absolute inset-0 opacity-15" style={{
                backgroundImage: "repeating-linear-gradient(90deg, hsl(190 50% 50%) 0px, transparent 1px, transparent 80px), repeating-linear-gradient(0deg, hsl(190 50% 50%) 0px, transparent 1px, transparent 80px)",
              }} />
              <div className="absolute inset-0 bg-gradient-to-t from-[hsl(25,25%,10%)] to-transparent" />
            </div>

            {/* Wall cracks / texture */}
            <div className="absolute top-0 left-0 right-0 h-[55%] opacity-5" style={{
              backgroundImage: "repeating-linear-gradient(0deg, hsl(0 0% 50%) 0px, transparent 1px, transparent 50px)"
            }} />

            {/* Neon border accents */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
            <div className="absolute top-0 bottom-0 left-0 w-[2px] bg-gradient-to-b from-cyan-500/30 via-transparent to-red-500/30" />
            <div className="absolute top-0 bottom-0 right-0 w-[2px] bg-gradient-to-b from-cyan-500/30 via-transparent to-red-500/30" />

            {/* Room Title Overlay */}
            <div className="absolute top-4 left-4 z-20">
              <div className="text-xs font-mono uppercase tracking-[0.3em] text-cyan-400/60">Skylife RP</div>
              <div className="text-lg font-black uppercase tracking-wider text-red-400" style={{ textShadow: "0 0 15px hsl(0 80% 55% / 0.6)" }}>
                BLACKOUT ESCAPE
              </div>
            </div>

            {/* Timer overlay top-right */}
            <div className="absolute top-4 right-4 z-20">
              <NeonTimer seconds={timeLeft} danger={60} />
            </div>

            {/* Room Objects */}
            {ROOM_OBJECTS.map(obj => {
              const isCompleted = obj.id === "desk" ? foundKey : obj.id === "painting" ? completed.has("riddle") :
                obj.id === "clock" ? completed.has("code") : obj.id === "safe" ? completed.has("code") :
                obj.id === "bookshelf" ? completed.has("decrypt") : obj.id === "vent" ? foundKey :
                obj.id === "door" ? won : false;
              const isActive = activeObject === obj.id;
              return (
                <motion.div key={obj.id}
                  className={`absolute cursor-pointer select-none z-10 group`}
                  style={{ left: `${obj.x}%`, top: `${obj.y}%`, width: `${obj.w}%`, height: `${obj.h}%` }}
                  whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveObject(isActive ? null : obj.id)}>
                  <div className={`w-full h-full flex flex-col items-center justify-center gap-1 rounded-xl border transition-all duration-300 backdrop-blur-sm ${
                    isCompleted ? "bg-green-500/10 border-green-500/40 shadow-[0_0_15px_hsl(140_60%_50%/0.3)]" :
                    isActive ? "bg-cyan-500/10 border-cyan-400/50 shadow-[0_0_20px_hsl(190_80%_55%/0.4)]" :
                    "bg-white/[0.03] border-white/[0.08] hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:shadow-[0_0_12px_hsl(190_80%_55%/0.2)]"
                  }`}>
                    <span className="text-2xl md:text-3xl drop-shadow-lg">{obj.icon}</span>
                    <span className="text-[9px] md:text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70 whitespace-nowrap">{obj.label}</span>
                    {isCompleted && <CheckCircle className="w-3.5 h-3.5 text-green-400 absolute -top-1 -right-1 drop-shadow-[0_0_6px_hsl(140_60%_50%)]" />}
                  </div>
                </motion.div>
              );
            })}

            {/* Scanning line effect */}
            <motion.div className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent pointer-events-none z-30"
              animate={{ top: ["0%", "100%"] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} />
          </div>
        </div>

        {/* Sidebar: Tasks + Leaderboard */}
        <div className="space-y-4">
          {/* Task Checklist */}
          <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-[hsl(220,20%,8%)] to-[hsl(220,25%,5%)] overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
            <div className="p-3 border-b border-cyan-500/10">
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2" style={{ textShadow: "0 0 10px hsl(190 80% 55% / 0.4)" }}>
                <Lock className="w-4 h-4" /> Task Checklist
              </h3>
            </div>
            <div className="p-3 space-y-2">
              {tasks.map(t => (
                <div key={t.label} className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-sm transition-all ${
                  t.done ? "bg-green-500/10 border-green-500/25 shadow-[0_0_8px_hsl(140_60%_50%/0.15)]" : "bg-white/[0.02] border-white/[0.05]"
                }`}>
                  <span className="text-base">{t.icon}</span>
                  <span className={`flex-1 font-mono text-xs ${t.done ? "line-through text-green-400/80" : "text-muted-foreground"}`}>{t.label}</span>
                  {t.done && <CheckCircle className="w-3.5 h-3.5 text-green-400" />}
                </div>
              ))}
            </div>
            <div className="px-3 pb-3">
              <Progress value={(tasks.filter(t => t.done).length / tasks.length) * 100} className="h-1.5" />
              <p className="text-[10px] text-muted-foreground/60 font-mono mt-1.5 text-center">{tasks.filter(t => t.done).length}/{tasks.length} COMPLETED</p>
            </div>
          </div>

          {/* Mini Leaderboard */}
          <Leaderboard gameType="escape_room" />
        </div>
      </div>

      {/* Interaction panel */}
      <AnimatePresence mode="wait">
        {activeObject && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }}>
            <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-[hsl(220,20%,8%)] to-[hsl(220,25%,6%)] p-5 space-y-4">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
              {activeObject === "clock" || activeObject === "safe" ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-cyan-400/80 font-mono">
                    <Eye className="w-4 h-4" /> {activeObject === "clock" ? "The clock hands point to 1, 3, 3, 7..." : "The safe needs a 4-digit code."}
                  </div>
                  {!completed.has("code") ? (
                    <div className="flex gap-2">
                      <input value={codeInput} onChange={e => setCodeInput(e.target.value)} maxLength={4} placeholder="_ _ _ _"
                        className="flex-1 bg-black/40 border border-cyan-500/30 rounded-xl px-4 py-2.5 text-center font-mono tracking-[0.5em] text-lg text-cyan-300 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 outline-none" />
                      <Button onClick={() => { if (codeInput === "1337") completePuzzle("code"); }} className="bg-cyan-600 hover:bg-cyan-500 border-0">Unlock</Button>
                    </div>
                  ) : <p className="text-green-400 text-sm flex items-center gap-2 font-mono"><CheckCircle className="w-4 h-4" /> Code: 1337 — Safe opened!</p>}
                </>
              ) : activeObject === "bookshelf" ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-cyan-400/80 font-mono"><BookOpen className="w-4 h-4" /> A book title reads: "ONAQVG" — it's ROT13 encrypted.</div>
                  {!completed.has("decrypt") ? (
                    <div className="flex gap-2">
                      <input value={decryptInput} onChange={e => setDecryptInput(e.target.value)} placeholder="Decrypted word..."
                        className="flex-1 bg-black/40 border border-cyan-500/30 rounded-xl px-4 py-2.5 text-sm font-mono text-cyan-300 focus:border-cyan-400 outline-none" />
                      <Button onClick={() => { if (decryptInput.toLowerCase().trim() === "bandit") completePuzzle("decrypt"); }} className="bg-cyan-600 hover:bg-cyan-500 border-0">Decrypt</Button>
                    </div>
                  ) : <p className="text-green-400 text-sm flex items-center gap-2 font-mono"><CheckCircle className="w-4 h-4" /> Decrypted: BANDIT</p>}
                </>
              ) : activeObject === "painting" ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-cyan-400/80 font-mono"><Lightbulb className="w-4 h-4" /> Behind the painting: "What has keys but no locks?"</div>
                  {!completed.has("riddle") ? (
                    <div className="flex gap-2">
                      <input value={riddleAnswer} onChange={e => setRiddleAnswer(e.target.value)} placeholder="Answer..."
                        className="flex-1 bg-black/40 border border-cyan-500/30 rounded-xl px-4 py-2.5 text-sm font-mono text-cyan-300 focus:border-cyan-400 outline-none" />
                      <Button onClick={() => { const a = riddleAnswer.toLowerCase().trim(); if (["keyboard", "a keyboard", "piano", "a piano"].includes(a)) completePuzzle("riddle"); }} className="bg-cyan-600 hover:bg-cyan-500 border-0">Answer</Button>
                    </div>
                  ) : <p className="text-green-400 text-sm flex items-center gap-2 font-mono"><CheckCircle className="w-4 h-4" /> Riddle solved!</p>}
                </>
              ) : activeObject === "vent" || activeObject === "desk" ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-cyan-400/80 font-mono"><Search className="w-4 h-4" /> {activeObject === "vent" ? "You see something glinting inside the vent..." : "The desk drawer has something..."}</div>
                  {!foundKey ? (
                    <Button onClick={() => setFoundKey(true)} className="bg-gradient-to-r from-amber-500 to-yellow-500 border-0 shadow-lg shadow-amber-500/30">
                      <Key className="w-4 h-4 mr-2" /> Grab the Key
                    </Button>
                  ) : <p className="text-green-400 text-sm flex items-center gap-2 font-mono"><CheckCircle className="w-4 h-4" /> Key obtained! 🔑</p>}
                </>
              ) : activeObject === "window" ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-cyan-400/80 font-mono"><Eye className="w-4 h-4" /> Moonlight reveals scratched letters: "HVFDSH" — Caesar cipher, shift 3 backwards.</div>
                  {!completed.has("cipher") ? (
                    <div className="flex gap-2">
                      <input value={cipherInput} onChange={e => setCipherInput(e.target.value)} placeholder="Decoded word..."
                        className="flex-1 bg-black/40 border border-cyan-500/30 rounded-xl px-4 py-2.5 text-sm font-mono text-cyan-300 focus:border-cyan-400 outline-none" />
                      <Button onClick={() => { if (cipherInput.toLowerCase().trim() === "escape") completePuzzle("cipher"); }} className="bg-cyan-600 hover:bg-cyan-500 border-0">Decode</Button>
                    </div>
                  ) : <p className="text-green-400 text-sm flex items-center gap-2 font-mono"><CheckCircle className="w-4 h-4" /> Decoded: ESCAPE</p>}
                </>
              ) : activeObject === "door" ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-cyan-400/80 font-mono"><DoorOpen className="w-4 h-4" /> {canEscape ? "All puzzles solved — ESCAPE NOW!" : "Solve all puzzles to unlock."}</div>
                  <Button disabled={!canEscape} onClick={handleEscape} className={`w-full ${canEscape ? "bg-gradient-to-r from-green-500 to-emerald-500 border-0 animate-pulse shadow-lg shadow-green-500/30" : "bg-muted/20"}`}>
                    {canEscape ? "🚪 ESCAPE NOW!" : "🔒 Locked"}
                  </Button>
                </>
              ) : (
                <p className="text-sm text-cyan-400/60 font-mono">{ROOM_OBJECTS.find(o => o.id === activeObject)?.hint}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ════════════════════════════════════════════════════════
// GAME 2: MEMORY MATCH
// ════════════════════════════════════════════════════════
const MEMORY_EMOJIS = ["🚗", "🔫", "💰", "🏠", "👮", "🚑", "⚖️", "🎭", "🏦", "💊"];

const MemoryMatchGame = ({ onBack }: { onBack: () => void }) => {
  const [cards, setCards] = useState<{ id: number; emoji: string; flipped: boolean; matched: boolean }[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const submitScore = useSubmitScore();
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const game = GAMES[1];

  const initGame = () => {
    const pairs = [...MEMORY_EMOJIS, ...MEMORY_EMOJIS];
    const shuffled = pairs.sort(() => Math.random() - 0.5).map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
    setCards(shuffled); setSelected([]); setMoves(0); setGameOver(false);
    setStarted(true); setStartTime(Date.now()); setElapsed(0);
  };

  useEffect(() => {
    if (!started || gameOver) return;
    timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 100);
    return () => clearInterval(timerRef.current);
  }, [started, gameOver, startTime]);

  const handleClick = (id: number) => {
    if (selected.length >= 2 || cards[id].flipped || cards[id].matched) return;
    const newCards = [...cards];
    newCards[id].flipped = true;
    setCards(newCards);
    const newSelected = [...selected, id];
    setSelected(newSelected);
    if (newSelected.length === 2) {
      setMoves(m => m + 1);
      if (newCards[newSelected[0]].emoji === newCards[newSelected[1]].emoji) {
        newCards[newSelected[0]].matched = true;
        newCards[newSelected[1]].matched = true;
        setCards([...newCards]); setSelected([]);
        if (newCards.every(c => c.matched)) {
          setGameOver(true); clearInterval(timerRef.current);
          const finalTime = Math.floor((Date.now() - startTime) / 1000);
          setElapsed(finalTime);
          submitScore("memory_match", Math.max(100, 1000 - (moves + 1) * 20 - finalTime * 5), finalTime);
        }
      } else {
        setTimeout(() => { newCards[newSelected[0]].flipped = false; newCards[newSelected[1]].flipped = false; setCards([...newCards]); setSelected([]); }, 800);
      }
    }
  };

  if (!started) return <StartScreen title={game.title} description={game.description} icon={<Brain className="w-14 h-14" />} gradient={game.gradient} glow={game.glow} onStart={initGame} onBack={onBack} gameType="memory_match" />;
  if (gameOver) return <EndScreen won title={`Matched in ${moves} moves!`} subtitle={`Time: ${elapsed}s`} onReplay={initGame} onBack={onBack} gameType="memory_match" />;

  return (
    <GameShell onBack={onBack} title="Memory Match" icon={<Brain className="w-5 h-5 text-foreground" />} gradient={game.gradient}
      badges={<><Badge variant="outline" className="border-purple-500/30">Moves: {moves}</Badge><Badge className="bg-purple-900/40 text-purple-300 border-purple-500/30"><Clock className="w-3 h-3 mr-1" />{elapsed}s</Badge></>}>
      <div className="grid grid-cols-5 gap-3 max-w-xl mx-auto" style={{ perspective: "800px" }}>
        {cards.map(card => (
          <div key={card.id} className="aspect-square cursor-pointer" style={{ perspective: "400px" }} onClick={() => handleClick(card.id)}>
            <motion.div className="w-full h-full relative" style={{ transformStyle: "preserve-3d" }}
              animate={{ rotateY: card.flipped || card.matched ? 180 : 0 }} transition={{ duration: 0.5, type: "spring" }}>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-900/60 to-fuchsia-900/60 border-2 border-purple-500/30 flex items-center justify-center text-2xl font-bold shadow-lg shadow-purple-500/10"
                style={{ backfaceVisibility: "hidden" }}>
                <span className="text-purple-300/60 text-3xl">?</span>
              </div>
              <div className={`absolute inset-0 rounded-xl border-2 flex items-center justify-center text-3xl shadow-lg ${
                card.matched ? "bg-green-900/30 border-green-500/40 shadow-green-500/20" : "bg-purple-900/20 border-purple-400/40 shadow-purple-500/10"
              }`} style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                {card.emoji}
              </div>
            </motion.div>
          </div>
        ))}
      </div>
      <Leaderboard gameType="memory_match" />
    </GameShell>
  );
};

// ════════════════════════════════════════════════════════
// GAME 3: REACTION TEST
// ════════════════════════════════════════════════════════
const ReactionTestGame = ({ onBack }: { onBack: () => void }) => {
  const [state, setState] = useState<"waiting" | "ready" | "go" | "result" | "early">("waiting");
  const [times, setTimes] = useState<number[]>([]);
  const [goTime, setGoTime] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const submitScore = useSubmitScore();

  const startRound = () => {
    setState("ready");
    timeoutRef.current = setTimeout(() => { setState("go"); setGoTime(Date.now()); }, 1500 + Math.random() * 3000);
  };

  const handleClick = () => {
    if (state === "waiting") { startRound(); return; }
    if (state === "ready") { clearTimeout(timeoutRef.current); setState("early"); return; }
    if (state === "go") {
      const ms = Date.now() - goTime;
      const newTimes = [...times, ms];
      setTimes(newTimes);
      if (newTimes.length >= 5) {
        setState("result");
        const avg = Math.round(newTimes.reduce((a, b) => a + b, 0) / newTimes.length);
        submitScore("reaction_test", Math.max(100, 1000 - avg * 2), avg);
      } else setState("waiting");
      return;
    }
    setTimes([]); setState("waiting");
  };

  const avg = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="text-muted-foreground"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
      <motion.div
        className={`min-h-[420px] rounded-3xl flex flex-col items-center justify-center cursor-pointer border-2 transition-all relative overflow-hidden ${
          state === "ready" ? "border-red-500/50 bg-gradient-to-b from-red-950/40 to-red-950/20" :
          state === "go" ? "border-green-500/50 bg-gradient-to-b from-green-950/40 to-green-950/20" :
          state === "early" ? "border-yellow-500/50 bg-gradient-to-b from-yellow-950/30 to-yellow-950/10" :
          state === "result" ? "border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 to-background" :
          "border-border/30 bg-gradient-to-b from-muted/5 to-background"
        }`}
        onClick={handleClick} whileTap={{ scale: 0.98 }}>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30 pointer-events-none" />
        {state === "waiting" && <>
          <motion.div className="w-28 h-28 rounded-full mb-6 shadow-2xl" animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }}
            style={{ background: "radial-gradient(circle at 35% 35%, hsl(45 90% 70%), hsl(35 90% 50%))", boxShadow: "0 0 40px hsl(45 90% 55% / 0.4), inset 0 -5px 15px hsl(35 90% 30% / 0.4)" }} />
          <h3 className="text-2xl font-bold relative z-10">Click to Start</h3>
          <p className="text-muted-foreground mt-2 relative z-10 font-mono">Round {times.length + 1}/5</p>
        </>}
        {state === "ready" && <>
          <motion.div className="w-32 h-32 rounded-full mb-6 shadow-2xl" animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}
            style={{ background: "radial-gradient(circle at 35% 35%, hsl(0 80% 65%), hsl(0 80% 40%))", boxShadow: "0 0 60px hsl(0 80% 55% / 0.5)" }} />
          <h3 className="text-2xl font-bold text-red-400 relative z-10" style={{ textShadow: "0 0 20px hsl(0 80% 55% / 0.5)" }}>Wait for green...</h3>
        </>}
        {state === "go" && <>
          <motion.div className="w-32 h-32 rounded-full mb-6 shadow-2xl" initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring" }}
            style={{ background: "radial-gradient(circle at 35% 35%, hsl(140 80% 65%), hsl(140 70% 40%))", boxShadow: "0 0 60px hsl(140 70% 50% / 0.5)" }} />
          <h3 className="text-2xl font-bold text-green-400 relative z-10" style={{ textShadow: "0 0 20px hsl(140 70% 50% / 0.5)" }}>CLICK NOW!</h3>
        </>}
        {state === "early" && <>
          <XCircle className="w-16 h-16 text-yellow-400 mb-4 relative z-10" />
          <h3 className="text-2xl font-bold text-yellow-400 relative z-10">Too Early!</h3>
          <p className="text-muted-foreground mt-2 relative z-10">Click to restart</p>
        </>}
        {state === "result" && <>
          <Trophy className="w-16 h-16 text-yellow-400 mb-4 relative z-10 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
          <h3 className="text-2xl font-bold relative z-10">Average: {avg}ms</h3>
          <div className="flex gap-2 mt-3 relative z-10">{times.map((t, i) => <Badge key={i} variant="outline" className="font-mono border-cyan-500/30">{t}ms</Badge>)}</div>
          <p className="text-muted-foreground mt-4 relative z-10">Click to play again</p>
        </>}
      </motion.div>
      {times.length > 0 && state !== "result" && <div className="flex gap-2 justify-center">{times.map((t, i) => <Badge key={i} variant="outline" className="font-mono">{t}ms</Badge>)}</div>}
      <Leaderboard gameType="reaction_test" />
    </div>
  );
};

// ════════════════════════════════════════════════════════
// GAME 4: TRIVIA QUIZ
// ════════════════════════════════════════════════════════
const TRIVIA_QUESTIONS = [
  { q: "What does RP stand for?", options: ["Real Play", "Role Play", "Random Play", "Rapid Play"], answer: 1 },
  { q: "What is FiveM?", options: ["A racing game", "A GTA V mod framework", "A chat app", "A streaming service"], answer: 1 },
  { q: "What does 'RDM' mean in RP?", options: ["Random Deathmatch", "Real Death Mode", "Rapid Deploy Mission", "Role Death Match"], answer: 0 },
  { q: "What does 'VDM' stand for?", options: ["Vehicle Death Match", "Very Dangerous Mission", "Virtual Data Mode", "Vehicle Damage Modifier"], answer: 0 },
  { q: "What is 'NVL' in RP?", options: ["New Vehicle License", "Not Valuing Life", "Night Vision Lock", "No Valid Loot"], answer: 1 },
  { q: "What does 'OOC' mean?", options: ["Out Of Character", "Officer On Call", "Over Our Capacity", "Online Or Chat"], answer: 0 },
  { q: "What is metagaming?", options: ["Playing meta builds", "Using OOC info IC", "Speedrunning", "Exploiting bugs"], answer: 1 },
  { q: "What does 'IC' stand for?", options: ["In Chat", "In Character", "Info Channel", "Internal Code"], answer: 1 },
  { q: "What is powergaming?", options: ["Playing powerful characters", "Forcing actions on others", "Using power-ups", "Admin abuse"], answer: 1 },
  { q: "What does 'EMS' stand for?", options: ["Emergency Medical Services", "Extra Mission Squad", "Elite Military Service", "Emergency Motor Squad"], answer: 0 },
  { q: "What is a 'green zone' in RP?", options: ["A safe zone", "A drug zone", "A PvP zone", "An admin zone"], answer: 0 },
  { q: "What does 'COP' stand for in police RP?", options: ["Community Officer Patrol", "Civilian Order Protocol", "Nothing specific", "Call of Patrol"], answer: 2 },
];

const TriviaQuizGame = ({ onBack }: { onBack: () => void }) => {
  const [questions, setQuestions] = useState<typeof TRIVIA_QUESTIONS>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [startTime, setStartTime] = useState(0);
  const submitScore = useSubmitScore();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const game = GAMES[3];

  const initGame = () => {
    setQuestions([...TRIVIA_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 10));
    setCurrent(0); setScore(0); setSelected(null); setGameOver(false);
    setStarted(true); setTimeLeft(90); setStartTime(Date.now());
  };

  useEffect(() => {
    if (!started || gameOver) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(intervalRef.current); setGameOver(true); submitScore("trivia_quiz", score * 100, Math.floor((Date.now() - startTime) / 1000)); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [started, gameOver, startTime, score, submitScore]);

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    const correct = idx === questions[current].answer;
    if (correct) setScore(s => s + 1);
    setTimeout(() => {
      if (current + 1 >= questions.length) {
        setGameOver(true); clearInterval(intervalRef.current);
        submitScore("trivia_quiz", (correct ? score + 1 : score) * 100, Math.floor((Date.now() - startTime) / 1000));
      } else { setCurrent(c => c + 1); setSelected(null); }
    }, 1200);
  };

  if (!started) return <StartScreen title={game.title} description={game.description} icon={<BookOpen className="w-14 h-14" />} gradient={game.gradient} glow={game.glow} onStart={initGame} onBack={onBack} gameType="trivia_quiz" />;
  if (gameOver) return <EndScreen won={score >= 5} title={`${score}/10 Correct!`} subtitle={`Score: ${score * 100} pts`} onReplay={initGame} onBack={onBack} gameType="trivia_quiz" />;

  const q = questions[current];
  return (
    <GameShell onBack={onBack} title="RP Trivia" icon={<BookOpen className="w-5 h-5 text-foreground" />} gradient={game.gradient}
      timer={<TimerBadge seconds={timeLeft} />}
      badges={<><Badge variant="outline" className="border-cyan-500/30">Q{current + 1}/10</Badge><Badge className="bg-cyan-900/40 text-cyan-300 border-cyan-500/30">{score} ✓</Badge></>}>
      <Card3D>
        <Card className="border-cyan-500/20 bg-gradient-to-b from-[hsl(220,20%,10%)] to-[hsl(220,20%,6%)] backdrop-blur-xl">
          <CardContent className="p-8">
            <h3 className="text-xl font-bold mb-6">{q.q}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {q.options.map((opt, i) => (
                <motion.button key={i} whileHover={{ scale: selected === null ? 1.02 : 1 }} whileTap={{ scale: 0.97 }}
                  className={`p-4 rounded-xl border-2 text-left transition-all font-medium ${
                    selected === null ? "border-white/[0.08] hover:border-cyan-500/40 bg-white/[0.02] hover:bg-cyan-500/5" :
                    i === q.answer ? "border-green-500 bg-green-500/15" :
                    i === selected ? "border-red-500 bg-red-500/15" :
                    "border-white/[0.04] bg-white/[0.01] opacity-40"
                  }`} onClick={() => handleAnswer(i)} disabled={selected !== null}>
                  <span className="mr-2 text-muted-foreground font-mono">{["A", "B", "C", "D"][i]}.</span>{opt}
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>
      </Card3D>
      <Leaderboard gameType="trivia_quiz" />
    </GameShell>
  );
};

// ════════════════════════════════════════════════════════
// GAME 5: WORD SCRAMBLE
// ════════════════════════════════════════════════════════
const WORDS = [
  { word: "POLICE", hint: "Law enforcement" }, { word: "MECHANIC", hint: "Fixes vehicles" },
  { word: "HOSPITAL", hint: "Medical facility" }, { word: "ROBBERY", hint: "Crime for money" },
  { word: "EVIDENCE", hint: "Proof in court" }, { word: "WARRANT", hint: "Legal search permission" },
  { word: "SMUGGLE", hint: "Illegal transport" }, { word: "GANGSTER", hint: "Crime org member" },
  { word: "DISPATCH", hint: "Emergency comms" }, { word: "LICENSE", hint: "Driving permit" },
  { word: "CORRUPT", hint: "Dirty cop" }, { word: "HOSTAGE", hint: "Kidnapped person" },
];
const scramble = (word: string): string => { let s = word.split("").sort(() => Math.random() - 0.5).join(""); return s === word ? scramble(word) : s; };

const WordScrambleGame = ({ onBack }: { onBack: () => void }) => {
  const [words, setWords] = useState<typeof WORDS>([]);
  const [current, setCurrent] = useState(0);
  const [guess, setGuess] = useState("");
  const [scrambled, setScrambled] = useState("");
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90);
  const [startTime, setStartTime] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const submitScore = useSubmitScore();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const game = GAMES[4];

  const initGame = () => {
    const shuffled = [...WORDS].sort(() => Math.random() - 0.5).slice(0, 8);
    setWords(shuffled); setCurrent(0); setScore(0); setGameOver(false);
    setStarted(true); setTimeLeft(70); setStartTime(Date.now()); setGuess(""); setFeedback(null);
    setScrambled(scramble(shuffled[0].word));
  };

  useEffect(() => {
    if (!started || gameOver) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(intervalRef.current); setGameOver(true); submitScore("word_scramble", score * 125, Math.floor((Date.now() - startTime) / 1000)); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [started, gameOver, startTime, score, submitScore]);

  const checkAnswer = () => {
    if (guess.toUpperCase().trim() === words[current].word) {
      setFeedback("correct"); const newScore = score + 1; setScore(newScore);
      setTimeout(() => {
        if (current + 1 >= words.length) { setGameOver(true); clearInterval(intervalRef.current); submitScore("word_scramble", newScore * 125, Math.floor((Date.now() - startTime) / 1000)); }
        else { setCurrent(c => c + 1); setGuess(""); setFeedback(null); setScrambled(scramble(words[current + 1].word)); }
      }, 800);
    } else { setFeedback("wrong"); setTimeout(() => setFeedback(null), 600); }
  };

  if (!started) return <StartScreen title={game.title} description={game.description} icon={<Shuffle className="w-14 h-14" />} gradient={game.gradient} glow={game.glow} onStart={initGame} onBack={onBack} gameType="word_scramble" />;
  if (gameOver) return <EndScreen won={score >= 4} title={`${score}/${words.length} Words!`} subtitle={`Score: ${score * 125} pts`} onReplay={initGame} onBack={onBack} gameType="word_scramble" />;

  return (
    <GameShell onBack={onBack} title="Word Scramble" icon={<Shuffle className="w-5 h-5 text-foreground" />} gradient={game.gradient}
      timer={<TimerBadge seconds={timeLeft} danger={20} />}
      badges={<><Badge variant="outline" className="border-green-500/30">Word {current + 1}/{words.length}</Badge><Badge className="bg-green-900/40 text-green-300 border-green-500/30">{score} solved</Badge></>}>
      <Card3D>
        <Card className={`border-2 transition-colors ${feedback === "correct" ? "border-green-500" : feedback === "wrong" ? "border-red-500" : "border-green-500/20"} bg-gradient-to-b from-[hsl(220,20%,10%)] to-[hsl(220,20%,6%)]`}>
          <CardContent className="p-8 text-center space-y-6">
            <p className="text-sm text-muted-foreground font-mono">💡 Hint: {words[current].hint}</p>
            <div className="flex justify-center gap-2 flex-wrap" style={{ perspective: "500px" }}>
              {scrambled.split("").map((ch, i) => (
                <motion.span key={i} initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}
                  className="w-12 h-14 flex items-center justify-center bg-gradient-to-b from-green-900/30 to-emerald-900/30 border-2 border-green-500/30 rounded-xl text-2xl font-bold font-mono shadow-lg shadow-green-500/10">
                  {ch}
                </motion.span>
              ))}
            </div>
            <div className="flex gap-2 max-w-sm mx-auto">
              <input value={guess} onChange={e => setGuess(e.target.value)} onKeyDown={e => e.key === "Enter" && checkAnswer()}
                placeholder="Your answer..." className="flex-1 bg-black/40 border border-green-500/30 rounded-xl px-4 py-2.5 text-center font-mono tracking-widest uppercase text-green-300 focus:border-green-400 outline-none" autoFocus />
              <Button onClick={checkAnswer} className="bg-gradient-to-r from-green-600 to-emerald-600 border-0">Check</Button>
            </div>
          </CardContent>
        </Card>
      </Card3D>
      <Leaderboard gameType="word_scramble" />
    </GameShell>
  );
};

// ════════════════════════════════════════════════════════
// GAME 6: SPEED TYPER — 30 second word blitz
// ════════════════════════════════════════════════════════
const TYPING_WORDS = ["police", "suspect", "arrest", "vehicle", "pursuit", "warrant", "evidence", "robbery",
  "mechanic", "hospital", "dispatch", "smuggle", "corrupt", "gangster", "hostage", "criminal",
  "detective", "undercover", "blackmarket", "courthouse", "interrogation", "surveillance", "jurisdiction",
  "contraband", "conspiracy", "accomplice", "prosecution", "extortion", "trafficking", "testimony"];

const SpeedTyperGame = ({ onBack }: { onBack: () => void }) => {
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [words, setWords] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const submitScore = useSubmitScore();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const game = GAMES[5];

  const initGame = () => {
    const shuffled = [...TYPING_WORDS].sort(() => Math.random() - 0.5);
    setWords(shuffled); setCurrent(0); setInput(""); setScore(0);
    setGameOver(false); setStarted(true); setTimeLeft(30); setCorrect(null);
  };

  useEffect(() => {
    if (!started || gameOver) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setGameOver(true);
          submitScore("speed_typer", score * 50, 30);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [started, gameOver, score, submitScore]);

  const handleInput = (val: string) => {
    setInput(val);
    if (val.toLowerCase().trim() === words[current]) {
      setCorrect(true); const newScore = score + 1; setScore(newScore);
      setTimeout(() => {
        if (current + 1 >= words.length) {
          setGameOver(true); clearInterval(intervalRef.current);
          submitScore("speed_typer", newScore * 50, 30 - timeLeft);
        } else { setCurrent(c => c + 1); setInput(""); setCorrect(null); }
      }, 150);
    }
  };

  if (!started) return <StartScreen title={game.title} description="Type as many words as possible in 30 seconds! More words = more points!" icon={<Keyboard className="w-14 h-14" />} gradient={game.gradient} glow={game.glow} onStart={initGame} onBack={onBack} gameType="speed_typer" />;
  if (gameOver) return <EndScreen won={score >= 8} title={`${score} Words in 30s!`} subtitle={`Score: ${score * 50} pts`} onReplay={initGame} onBack={onBack} gameType="speed_typer" />;

  return (
    <GameShell onBack={onBack} title="Speed Typer" icon={<Keyboard className="w-5 h-5 text-foreground" />} gradient={game.gradient}
      timer={<TimerBadge seconds={timeLeft} danger={10} />} badges={<Badge className="bg-indigo-900/40 text-indigo-300 border-indigo-500/30">{score} words</Badge>}>
      <Card3D>
        <Card className="border-indigo-500/20 bg-gradient-to-b from-[hsl(220,20%,10%)] to-[hsl(220,20%,6%)]">
          <CardContent className="p-10 text-center space-y-8">
            <div className="text-sm text-muted-foreground font-mono">Type the word as fast as you can:</div>
            <motion.div key={current} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="text-5xl font-bold font-mono tracking-wider text-indigo-300"
              style={{ textShadow: "0 0 30px hsl(240 80% 60% / 0.4)" }}>
              {words[current]}
            </motion.div>
            <div className="text-6xl font-black font-mono text-center" style={{
              color: timeLeft <= 10 ? "hsl(0,80%,55%)" : "hsl(190,80%,55%)",
              textShadow: timeLeft <= 10 ? "0 0 30px hsl(0 80% 55% / 0.5)" : "0 0 30px hsl(190 80% 55% / 0.5)",
            }}>{timeLeft}s</div>
            <input value={input} onChange={e => handleInput(e.target.value)} autoFocus
              className={`w-full max-w-md mx-auto bg-black/40 border-2 rounded-xl px-6 py-3 text-center font-mono text-xl tracking-widest transition-colors outline-none ${
                correct ? "border-green-500 text-green-300" : "border-indigo-500/30 text-indigo-200 focus:border-indigo-400"
              }`} />
            <Progress value={(score / 20) * 100} className="max-w-md mx-auto h-2" />
          </CardContent>
        </Card>
      </Card3D>
      <Leaderboard gameType="speed_typer" />
    </GameShell>
  );
};

// ════════════════════════════════════════════════════════
// GAME 7: COLOR MATCH
// ════════════════════════════════════════════════════════
const COLORS = [
  { name: "RED", color: "hsl(0 80% 55%)" }, { name: "BLUE", color: "hsl(220 80% 55%)" },
  { name: "GREEN", color: "hsl(140 70% 45%)" }, { name: "YELLOW", color: "hsl(50 90% 55%)" },
  { name: "PURPLE", color: "hsl(280 70% 55%)" }, { name: "ORANGE", color: "hsl(25 90% 55%)" },
];

const ColorMatchGame = ({ onBack }: { onBack: () => void }) => {
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [wordName, setWordName] = useState("");
  const [wordColor, setWordColor] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const totalRounds = 20;
  const submitScore = useSubmitScore();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const game = GAMES[6];

  const generateRound = () => {
    const nameIdx = Math.floor(Math.random() * COLORS.length);
    const colorIdx = Math.floor(Math.random() * COLORS.length);
    setWordName(COLORS[nameIdx].name); setWordColor(COLORS[colorIdx].color); setFeedback(null);
  };

  const initGame = () => { setRound(0); setScore(0); setGameOver(false); setStarted(true); setTimeLeft(30); generateRound(); };

  useEffect(() => {
    if (!started || gameOver) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => { if (prev <= 1) { clearInterval(intervalRef.current); setGameOver(true); submitScore("color_match", score * 50); return 0; } return prev - 1; });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [started, gameOver, score, submitScore]);

  const answer = (isMatch: boolean) => {
    if (feedback !== null) return;
    const actualMatch = wordName === COLORS.find(c => c.color === wordColor)?.name;
    const correct = isMatch === actualMatch;
    setFeedback(correct); if (correct) setScore(s => s + 1);
    setTimeout(() => {
      if (round + 1 >= totalRounds) { setGameOver(true); clearInterval(intervalRef.current); submitScore("color_match", (correct ? score + 1 : score) * 50); }
      else { setRound(r => r + 1); generateRound(); }
    }, 400);
  };

  if (!started) return <StartScreen title={game.title} description={game.description} icon={<Palette className="w-14 h-14" />} gradient={game.gradient} glow={game.glow} onStart={initGame} onBack={onBack} gameType="color_match" />;
  if (gameOver) return <EndScreen won={score >= 12} title={`${score}/${totalRounds} Correct!`} subtitle={`Score: ${score * 50} pts`} onReplay={initGame} onBack={onBack} gameType="color_match" />;

  return (
    <GameShell onBack={onBack} title="Color Match" icon={<Palette className="w-5 h-5 text-foreground" />} gradient={game.gradient}
      timer={<TimerBadge seconds={timeLeft} danger={10} />}
      badges={<><Badge variant="outline" className="border-pink-500/30">Round {round + 1}/{totalRounds}</Badge><Badge className="bg-pink-900/40 text-pink-300 border-pink-500/30">{score} ✓</Badge></>}>
      <Card3D>
        <Card className={`border-2 transition-colors ${feedback === true ? "border-green-500" : feedback === false ? "border-red-500" : "border-pink-500/20"} bg-gradient-to-b from-[hsl(220,20%,10%)] to-[hsl(220,20%,6%)]`}>
          <CardContent className="p-10 text-center space-y-8">
            <p className="text-sm text-muted-foreground font-mono">Does the word match its display color?</p>
            <motion.div key={round} initial={{ scale: 0.5, rotateX: 90 }} animate={{ scale: 1, rotateX: 0 }} transition={{ type: "spring" }}
              className="text-6xl font-black tracking-wider" style={{ color: wordColor, textShadow: `0 0 40px ${wordColor}50` }}>
              {wordName}
            </motion.div>
            <div className="flex gap-4 justify-center">
              <Button size="lg" onClick={() => answer(true)} className="bg-gradient-to-r from-green-600 to-emerald-600 border-0 text-lg px-8 shadow-lg shadow-green-500/20">✓ Match</Button>
              <Button size="lg" onClick={() => answer(false)} className="bg-gradient-to-r from-red-600 to-rose-600 border-0 text-lg px-8 shadow-lg shadow-red-500/20">✗ No Match</Button>
            </div>
          </CardContent>
        </Card>
      </Card3D>
      <Leaderboard gameType="color_match" />
    </GameShell>
  );
};

// ════════════════════════════════════════════════════════
// GAME 8: PATTERN MEMORY
// ════════════════════════════════════════════════════════
const PatternMemoryGame = ({ onBack }: { onBack: () => void }) => {
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  const [pattern, setPattern] = useState<number[]>([]);
  const [userPattern, setUserPattern] = useState<number[]>([]);
  const [showing, setShowing] = useState(false);
  const [activeCell, setActiveCell] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const submitScore = useSubmitScore();
  const game = GAMES[7];

  const generatePattern = (lvl: number) => { const p: number[] = []; for (let i = 0; i < lvl + 2; i++) p.push(Math.floor(Math.random() * 9)); return p; };

  const showPattern = async (p: number[]) => {
    setShowing(true);
    for (let i = 0; i < p.length; i++) { await new Promise(r => setTimeout(r, 400)); setActiveCell(p[i]); await new Promise(r => setTimeout(r, 500)); setActiveCell(null); }
    setShowing(false);
  };

  const initGame = () => {
    setLevel(1); setScore(0); setGameOver(false); setStarted(true); setFeedback(null);
    const p = generatePattern(1); setPattern(p); setUserPattern([]);
    setTimeout(() => showPattern(p), 500);
  };

  const handleCellClick = (idx: number) => {
    if (showing || gameOver) return;
    setActiveCell(idx); setTimeout(() => setActiveCell(null), 200);
    const newUserPattern = [...userPattern, idx]; setUserPattern(newUserPattern);
    if (newUserPattern[newUserPattern.length - 1] !== pattern[newUserPattern.length - 1]) {
      setFeedback("wrong"); setGameOver(true); submitScore("pattern_memory", score * 100, level); return;
    }
    if (newUserPattern.length === pattern.length) {
      setFeedback("correct"); const newScore = score + 1; setScore(newScore);
      setTimeout(() => {
        if (level >= 10) { setGameOver(true); submitScore("pattern_memory", newScore * 100, level); }
        else { const nextLevel = level + 1; setLevel(nextLevel); setFeedback(null); const p = generatePattern(nextLevel); setPattern(p); setUserPattern([]); setTimeout(() => showPattern(p), 500); }
      }, 800);
    }
  };

  if (!started) return <StartScreen title={game.title} description={game.description} icon={<Grid3X3 className="w-14 h-14" />} gradient={game.gradient} glow={game.glow} onStart={initGame} onBack={onBack} gameType="pattern_memory" />;
  if (gameOver) return <EndScreen won={score >= 5} title={`Level ${level} Reached!`} subtitle={`Score: ${score * 100} pts`} onReplay={initGame} onBack={onBack} gameType="pattern_memory" />;

  return (
    <GameShell onBack={onBack} title="Pattern Memory" icon={<Grid3X3 className="w-5 h-5 text-foreground" />} gradient={game.gradient}
      badges={<><Badge variant="outline" className="border-teal-500/30">Level {level}</Badge><Badge className="bg-teal-900/40 text-teal-300 border-teal-500/30">{score} rounds</Badge>{showing && <Badge className="bg-amber-600/80 text-amber-100 animate-pulse">Memorize!</Badge>}</>}>
      <Card3D>
        <Card className={`border-2 transition-colors ${feedback === "correct" ? "border-green-500" : feedback === "wrong" ? "border-red-500" : "border-teal-500/20"} bg-gradient-to-b from-[hsl(220,20%,10%)] to-[hsl(220,20%,6%)]`}>
          <CardContent className="p-8">
            <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
              {Array.from({ length: 9 }).map((_, i) => (
                <motion.button key={i} whileHover={{ scale: showing ? 1 : 1.05 }} whileTap={{ scale: 0.9 }}
                  className={`aspect-square rounded-xl border-2 transition-all ${
                    activeCell === i ? "bg-gradient-to-br from-teal-400 to-cyan-400 border-teal-400 shadow-[0_0_20px_hsl(180_70%_50%/0.5)] scale-105" :
                    "bg-white/[0.03] border-white/[0.08] hover:border-teal-500/30"
                  }`}
                  onClick={() => handleCellClick(i)} disabled={showing} />
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4 font-mono">
              {showing ? `Memorize the pattern (${pattern.length} cells)...` : `Your turn: ${userPattern.length}/${pattern.length}`}
            </p>
          </CardContent>
        </Card>
      </Card3D>
      <Leaderboard gameType="pattern_memory" />
    </GameShell>
  );
};

// ════════════════════════════════════════════════════════
// GAME 9: MATH BLITZ — Per-question countdown timer
// ════════════════════════════════════════════════════════
const MathBlitzGame = ({ onBack }: { onBack: () => void }) => {
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [problem, setProblem] = useState({ question: "", answer: 0 });
  const [options, setOptions] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [questionTime, setQuestionTime] = useState(8);
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const [streak, setStreak] = useState(0);
  const totalRounds = 20;
  const submitScore = useSubmitScore();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const game = GAMES[8];

  const generateProblem = (rd: number) => {
    const difficulty = Math.min(Math.floor(rd / 5), 3);
    const ops = ["+", "-", "×", "÷"];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a: number, b: number, answer: number;
    const range = 30 + difficulty * 40;
    if (op === "+") { a = Math.floor(Math.random() * range) + 10 + difficulty * 10; b = Math.floor(Math.random() * range) + 10; answer = a + b; }
    else if (op === "-") { a = Math.floor(Math.random() * range) + 30 + difficulty * 15; b = Math.floor(Math.random() * (a - 5)) + 1; answer = a - b; }
    else if (op === "÷") { b = Math.floor(Math.random() * (8 + difficulty * 3)) + 2; answer = Math.floor(Math.random() * (8 + difficulty * 4)) + 2; a = b * answer; }
    else { a = Math.floor(Math.random() * (12 + difficulty * 5)) + 2; b = Math.floor(Math.random() * (12 + difficulty * 5)) + 2; answer = a * b; }
    const opts = [answer];
    while (opts.length < 4) {
      const spread = Math.max(5, Math.floor(answer * 0.3));
      const wrong = answer + (Math.floor(Math.random() * spread * 2) - spread);
      if (wrong !== answer && !opts.includes(wrong) && wrong >= 0) opts.push(wrong);
    }
    setProblem({ question: `${a} ${op} ${b}`, answer });
    setOptions(opts.sort(() => Math.random() - 0.5));
    setFeedback(null);
    // Harder timer as rounds progress
    setQuestionTime(Math.max(4, 8 - Math.floor(rd / 5)));
  };

  const initGame = () => { setScore(0); setRound(0); setGameOver(false); setStarted(true); setStreak(0); generateProblem(0); };

  // Per-question countdown
  useEffect(() => {
    if (!started || gameOver || feedback !== null) return;
    intervalRef.current = setInterval(() => {
      setQuestionTime(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          // Time ran out on this question — treat as wrong
          setFeedback(false);
          setStreak(0);
          setTimeout(() => {
            if (round + 1 >= totalRounds) { setGameOver(true); submitScore("math_blitz", score * 50); }
            else { setRound(r => r + 1); generateProblem(round + 1); }
          }, 600);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [started, gameOver, feedback, round, score, submitScore]);

  const handleAnswer = (val: number) => {
    if (feedback !== null) return;
    clearInterval(intervalRef.current);
    const correct = val === problem.answer;
    setFeedback(correct);
    if (correct) { setScore(s => s + 1); setStreak(s => s + 1); }
    else setStreak(0);
    setTimeout(() => {
      if (round + 1 >= totalRounds) { setGameOver(true); submitScore("math_blitz", (correct ? score + 1 : score) * 50); }
      else { setRound(r => r + 1); generateProblem(round + 1); }
    }, 500);
  };

  if (!started) return <StartScreen title={game.title} description="Solve 20 math problems with a per-question countdown! Gets harder as you progress." icon={<Calculator className="w-14 h-14" />} gradient={game.gradient} glow={game.glow} onStart={initGame} onBack={onBack} gameType="math_blitz" />;
  if (gameOver) return <EndScreen won={score >= 12} title={`${score}/${totalRounds} Correct!`} subtitle={`Score: ${score * 50} pts`} onReplay={initGame} onBack={onBack} gameType="math_blitz" />;

  return (
    <GameShell onBack={onBack} title="Math Blitz" icon={<Calculator className="w-5 h-5 text-foreground" />} gradient={game.gradient}
      timer={<Badge className={`font-mono text-lg px-3 py-1.5 ${questionTime <= 3 ? "bg-red-600/80 text-red-100 animate-pulse border-red-500/50" : "bg-orange-950/60 text-orange-300 border-orange-500/30"}`}>
        <Clock className="w-3.5 h-3.5 mr-1.5" />{questionTime}s
      </Badge>}
      badges={<><Badge variant="outline" className="border-orange-500/30">Q{round + 1}/{totalRounds}</Badge><Badge className="bg-orange-900/40 text-orange-300 border-orange-500/30">{score} ✓</Badge>{streak >= 3 && <Badge className="bg-yellow-900/40 text-yellow-300 border-yellow-500/30 animate-pulse">🔥 {streak} streak</Badge>}</>}>
      <Card3D>
        <Card className="border-orange-500/20 bg-gradient-to-b from-[hsl(220,20%,10%)] to-[hsl(220,20%,6%)]">
          <CardContent className="p-10 text-center space-y-8">
            <motion.div key={round} initial={{ scale: 0.5, rotateX: 90 }} animate={{ scale: 1, rotateX: 0 }} transition={{ type: "spring" }}
              className="text-6xl font-bold font-mono text-orange-300" style={{ textShadow: "0 0 30px hsl(25 90% 55% / 0.4)" }}>
              {problem.question} = ?
            </motion.div>
            {/* Progress bar for per-question timer */}
            <div className="max-w-sm mx-auto">
              <Progress value={(questionTime / Math.max(4, 8 - Math.floor(round / 5))) * 100} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
              {options.map((opt, i) => (
                <motion.button key={i} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className={`p-4 rounded-xl border-2 text-xl font-bold font-mono transition-all ${
                    feedback === null ? "border-white/[0.08] hover:border-orange-500/40 bg-white/[0.02]" :
                    opt === problem.answer ? "border-green-500 bg-green-500/15" :
                    "border-white/[0.04] bg-white/[0.01] opacity-40"
                  }`} onClick={() => handleAnswer(opt)} disabled={feedback !== null}>
                  {opt}
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>
      </Card3D>
      <Leaderboard gameType="math_blitz" />
    </GameShell>
  );
};

// ════════════════════════════════════════════════════════
// GAME 10: AIM TRAINER
// ════════════════════════════════════════════════════════
const AimTrainerGame = ({ onBack }: { onBack: () => void }) => {
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [targets, setTargets] = useState<{ id: number; x: number; y: number; size: number }[]>([]);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [startTime, setStartTime] = useState(0);
  const nextId = useRef(0);
  const submitScore = useSubmitScore();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const spawnRef = useRef<ReturnType<typeof setInterval>>();
  const game = GAMES[9];

  const spawnTarget = () => {
    const id = nextId.current++;
    const size = 22 + Math.random() * 28;
    const x = Math.random() * 85 + 5;
    const y = Math.random() * 80 + 5;
    setTargets(prev => [...prev.slice(-10), { id, x, y, size }]);
    setTimeout(() => setTargets(prev => { if (prev.find(t => t.id === id)) { setMisses(m => m + 1); return prev.filter(t => t.id !== id); } return prev; }), 1400);
  };

  const initGame = () => { setHits(0); setMisses(0); setTargets([]); setGameOver(false); setStarted(true); setTimeLeft(30); setStartTime(Date.now()); nextId.current = 0; };

  useEffect(() => {
    if (!started || gameOver) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(intervalRef.current); clearInterval(spawnRef.current); setGameOver(true); submitScore("aim_trainer", hits * 100 - misses * 20, Math.floor((Date.now() - startTime) / 1000)); return 0; }
        return prev - 1;
      });
    }, 1000);
    spawnRef.current = setInterval(spawnTarget, 500);
    return () => { clearInterval(intervalRef.current); clearInterval(spawnRef.current); };
  }, [started, gameOver, hits, misses, startTime, submitScore]);

  const hitTarget = (id: number, e: React.MouseEvent) => { e.stopPropagation(); setTargets(prev => prev.filter(t => t.id !== id)); setHits(h => h + 1); };

  if (!started) return <StartScreen title={game.title} description={game.description} icon={<Crosshair className="w-14 h-14" />} gradient={game.gradient} glow={game.glow} onStart={initGame} onBack={onBack} gameType="aim_trainer" />;
  if (gameOver) return <EndScreen won={hits >= 20} title={`${hits} Hits!`} subtitle={`Score: ${Math.max(0, hits * 100 - misses * 20)} pts | Misses: ${misses}`} onReplay={initGame} onBack={onBack} gameType="aim_trainer" />;

  return (
    <GameShell onBack={onBack} title="Aim Trainer" icon={<Crosshair className="w-5 h-5 text-foreground" />} gradient={game.gradient}
      timer={<TimerBadge seconds={timeLeft} danger={10} />}
      badges={<><Badge className="bg-green-900/40 text-green-300 border-green-500/30">🎯 {hits}</Badge><Badge variant="outline" className="text-red-400 border-red-500/30">✗ {misses}</Badge></>}>
      <Card className="border-lime-500/20 overflow-hidden">
        <div className="relative min-h-[400px] cursor-crosshair" style={{ background: "radial-gradient(ellipse at 50% 50%, hsl(220 20% 10%) 0%, hsl(220 25% 5%) 100%)" }}>
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: "repeating-linear-gradient(90deg, hsl(140 60% 50%) 0px, transparent 1px, transparent 80px), repeating-linear-gradient(0deg, hsl(140 60% 50%) 0px, transparent 1px, transparent 80px)",
          }} />
          {targets.map(t => (
            <motion.div key={t.id} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              className="absolute cursor-pointer" style={{ left: `${t.x}%`, top: `${t.y}%`, width: t.size, height: t.size }}
              onClick={(e) => hitTarget(t.id, e)}>
              <div className="w-full h-full rounded-full flex items-center justify-center border-2 border-red-400/50 hover:scale-110 transition-transform"
                style={{ background: "radial-gradient(circle at 35% 35%, hsl(0 80% 65%), hsl(0 70% 40%))", boxShadow: "0 0 20px hsl(0 80% 55% / 0.5)" }}>
                <Crosshair className="w-1/2 h-1/2 text-foreground/80" />
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
      <Leaderboard gameType="aim_trainer" />
    </GameShell>
  );
};

// ════════════════════════════════════════════════════════
// GAME 11: BOMB DEFUSAL 💣
// ════════════════════════════════════════════════════════
const WIRE_COLORS = ["red", "blue", "green", "yellow", "white"];
const WIRE_STYLES: Record<string, string> = {
  red: "from-red-600 to-red-400 border-red-500/50 shadow-red-500/30",
  blue: "from-blue-600 to-blue-400 border-blue-500/50 shadow-blue-500/30",
  green: "from-green-600 to-green-400 border-green-500/50 shadow-green-500/30",
  yellow: "from-yellow-600 to-yellow-400 border-yellow-500/50 shadow-yellow-500/30",
  white: "from-gray-300 to-white border-gray-400/50 shadow-gray-400/30",
};

const BombDefusalGame = ({ onBack }: { onBack: () => void }) => {
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [round, setRound] = useState(0);
  const [wires, setWires] = useState<string[]>([]);
  const [correctWire, setCorrectWire] = useState("");
  const [clue, setClue] = useState("");
  const [cutWires, setCutWires] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [scanAngle, setScanAngle] = useState(0);
  const [flashWire, setFlashWire] = useState<string | null>(null);
  const totalRounds = 7;
  const submitScore = useSubmitScore();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const scanRef = useRef<ReturnType<typeof requestAnimationFrame>>();
  const game = GAMES[10];

  const RING_COLORS: Record<string, { stroke: string; fill: string; glow: string }> = {
    red: { stroke: "hsl(0,75%,55%)", fill: "hsl(0,75%,55%)", glow: "0 0 12px hsl(0 75% 55% / 0.6)" },
    blue: { stroke: "hsl(210,80%,55%)", fill: "hsl(210,80%,55%)", glow: "0 0 12px hsl(210 80% 55% / 0.6)" },
    green: { stroke: "hsl(140,70%,45%)", fill: "hsl(140,70%,45%)", glow: "0 0 12px hsl(140 70% 45% / 0.6)" },
    yellow: { stroke: "hsl(50,90%,55%)", fill: "hsl(50,90%,55%)", glow: "0 0 12px hsl(50 90% 55% / 0.6)" },
    white: { stroke: "hsl(0,0%,80%)", fill: "hsl(0,0%,80%)", glow: "0 0 12px hsl(0 0% 80% / 0.6)" },
  };

  const generateRound = (roundNum: number) => {
    const count = Math.min(3 + Math.floor(roundNum / 2), 5);
    const available = [...WIRE_COLORS].sort(() => Math.random() - 0.5).slice(0, count);
    const correct = available[Math.floor(Math.random() * available.length)];
    
    // Cryptic clues that require deduction — never just say the color
    const otherWires = available.filter(w => w !== correct);
    const decoyColor = otherWires[Math.floor(Math.random() * otherWires.length)] || "none";
    const cluePool = [
      // Elimination clues
      `NOT ${otherWires.slice(0, 2).join(", NOT ")}`,
      `Avoid ${decoyColor} at all costs. Think opposite.`,
      `Signal freq matches ${correct.charAt(0).toUpperCase()}${correct.slice(1).split("").reverse().join("")}`,
      // Riddle clues
      ...(correct === "red" ? ["The color of danger", "Blood runs through this wire", "🚨 Emergency frequency"] : []),
      ...(correct === "blue" ? ["Color of the sky at noon", "Ocean depth sensor", "🌊 Maritime channel"] : []),
      ...(correct === "green" ? ["Color of money", "Forest camouflage line", "🌿 Organic signal"] : []),
      ...(correct === "yellow" ? ["Caution tape color", "Solar frequency wire", "⚡ High voltage line"] : []),
      ...(correct === "white" ? ["Color of surrender", "Ghost frequency", "❄️ Arctic channel"] : []),
      // Math/logic clues
      `Wire #${available.indexOf(correct) + 1} from left is safe`,
      `ASCII ${correct.charCodeAt(0)}: decode the first letter`,
      `${available.length} wires total. Safe = position ${available.indexOf(correct) + 1}`,
    ];
    setWires(available); setCorrectWire(correct);
    setClue(cluePool[Math.floor(Math.random() * cluePool.length)]); setCutWires([]);
  };

  const initGame = () => { setRound(0); setScore(0); setGameOver(false); setWon(false); setStarted(true); setTimeLeft(60); setScanAngle(0); setFlashWire(null); generateRound(0); };

  // Scan line animation
  useEffect(() => {
    if (!started || gameOver) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last; last = now;
      setScanAngle(a => (a + dt * 0.04) % 360);
      scanRef.current = requestAnimationFrame(tick);
    };
    scanRef.current = requestAnimationFrame(tick);
    return () => { if (scanRef.current) cancelAnimationFrame(scanRef.current); };
  }, [started, gameOver]);

  useEffect(() => {
    if (!started || gameOver) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => { if (prev <= 1) { clearInterval(intervalRef.current); setGameOver(true); submitScore("bomb_defusal", score * 200); return 0; } return prev - 1; });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [started, gameOver, score, submitScore]);

  const cutWire = (color: string) => {
    if (cutWires.includes(color) || gameOver) return;
    setCutWires(prev => [...prev, color]);
    setFlashWire(color);
    setTimeout(() => setFlashWire(null), 400);
    if (color === correctWire) {
      const newScore = score + 1; setScore(newScore);
      if (round + 1 >= totalRounds) {
        setWon(true); setGameOver(true); clearInterval(intervalRef.current);
        submitScore("bomb_defusal", newScore * 200, 60 - timeLeft);
      } else { setTimeout(() => { setRound(r => { generateRound(r + 1); return r + 1; }); }, 800); }
    } else {
      setGameOver(true); clearInterval(intervalRef.current);
      submitScore("bomb_defusal", score * 200, 60 - timeLeft);
    }
  };

  if (!started) return <StartScreen title={game.title} description={game.description} icon={<Bomb className="w-14 h-14" />} gradient={game.gradient} glow={game.glow} onStart={initGame} onBack={onBack} gameType="bomb_defusal" />;
  if (gameOver) return <EndScreen won={won} title={won ? "Bomb Defused! 💣✅" : "BOOM! 💥"} subtitle={won ? `${score}/${totalRounds} bombs defused!` : `Made it to round ${round + 1}`} onReplay={initGame} onBack={onBack} gameType="bomb_defusal" />;

  const cx = 200, cy = 200, maxR = 180;
  const isDanger = timeLeft <= 15;

  return (
    <GameShell onBack={onBack} title="Bomb Defusal" icon={<Bomb className="w-5 h-5 text-foreground" />} gradient={game.gradient}
      timer={<TimerBadge seconds={timeLeft} danger={15} />}
      badges={<><Badge variant="outline" className="border-red-500/30">Bomb {round + 1}/{totalRounds}</Badge><Badge className="bg-red-900/40 text-red-300 border-red-500/30">{score} defused</Badge></>}>
      
      <div className="flex flex-col items-center gap-4">
        {/* Radar display */}
        <div className="relative" style={{ width: 400, height: 400 }}>
          <svg viewBox="0 0 400 400" className="w-full h-full" style={{ filter: "drop-shadow(0 0 30px hsl(180 60% 30% / 0.3))" }}>
            {/* Background */}
            <defs>
              <radialGradient id="radarBg" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="hsl(180,30%,12%)" />
                <stop offset="100%" stopColor="hsl(220,30%,5%)" />
              </radialGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <circle cx={cx} cy={cy} r={maxR} fill="url(#radarBg)" stroke="hsl(180,40%,25%)" strokeWidth="2" />

            {/* Concentric grid rings */}
            {[0.25, 0.5, 0.75, 1].map(f => (
              <circle key={f} cx={cx} cy={cy} r={maxR * f} fill="none" stroke="hsl(180,40%,20%)" strokeWidth="0.5" strokeDasharray="4 4" />
            ))}

            {/* Cross-hair lines */}
            {[0, 45, 90, 135].map(deg => (
              <line key={deg} x1={cx + maxR * Math.cos(deg * Math.PI / 180)} y1={cy + maxR * Math.sin(deg * Math.PI / 180)}
                x2={cx - maxR * Math.cos(deg * Math.PI / 180)} y2={cy - maxR * Math.sin(deg * Math.PI / 180)}
                stroke="hsl(180,40%,18%)" strokeWidth="0.5" />
            ))}

            {/* Scan line (rotating) */}
            <line x1={cx} y1={cy}
              x2={cx + maxR * Math.cos(scanAngle * Math.PI / 180)}
              y2={cy + maxR * Math.sin(scanAngle * Math.PI / 180)}
              stroke={isDanger ? "hsl(0,80%,50%)" : "hsl(160,90%,50%)"} strokeWidth="2" opacity="0.7" filter="url(#glow)" />
            {/* Scan sweep trail */}
            <path d={`M${cx},${cy} L${cx + maxR * Math.cos(scanAngle * Math.PI / 180)},${cy + maxR * Math.sin(scanAngle * Math.PI / 180)} A${maxR},${maxR} 0 0,0 ${cx + maxR * Math.cos((scanAngle - 30) * Math.PI / 180)},${cy + maxR * Math.sin((scanAngle - 30) * Math.PI / 180)} Z`}
              fill={isDanger ? "hsl(0,80%,50%)" : "hsl(160,90%,50%)"} opacity="0.08" />

            {/* Wire ring segments — each wire is an arc segment */}
            {wires.map((color, i) => {
              const isCut = cutWires.includes(color);
              const ringR = maxR * 0.45 + i * (maxR * 0.45 / wires.length);
              const arcLen = 320 / wires.length;
              const startAngle = (i * (360 / wires.length) + 10) * Math.PI / 180;
              const endAngle = startAngle + (arcLen * Math.PI / 180);
              const x1 = cx + ringR * Math.cos(startAngle);
              const y1 = cy + ringR * Math.sin(startAngle);
              const x2 = cx + ringR * Math.cos(endAngle);
              const y2 = cy + ringR * Math.sin(endAngle);
              const largeArc = arcLen > 180 ? 1 : 0;
              const rc = RING_COLORS[color] || RING_COLORS.white;
              const isFlash = flashWire === color;

              return (
                <g key={color} onClick={() => cutWire(color)} style={{ cursor: isCut ? "default" : "pointer" }}>
                  {/* Glow behind */}
                  {!isCut && (
                    <path d={`M${x1},${y1} A${ringR},${ringR} 0 ${largeArc},1 ${x2},${y2}`}
                      fill="none" stroke={rc.stroke} strokeWidth="12" opacity="0.15" filter="url(#glow)" />
                  )}
                  {/* Main arc */}
                  <path d={`M${x1},${y1} A${ringR},${ringR} 0 ${largeArc},1 ${x2},${y2}`}
                    fill="none" stroke={isCut ? "hsl(0,0%,25%)" : rc.stroke}
                    strokeWidth={isFlash ? "8" : "5"} strokeLinecap="round"
                    opacity={isCut ? 0.3 : 1} style={{ transition: "all 0.2s" }} />
                  {/* Label */}
                  {(() => {
                    const midAngle = (startAngle + endAngle) / 2;
                    const lx = cx + (ringR + 16) * Math.cos(midAngle);
                    const ly = cy + (ringR + 16) * Math.sin(midAngle);
                    return (
                      <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                        fill={isCut ? "hsl(0,0%,40%)" : rc.fill} fontSize="10" fontWeight="bold"
                        style={{ textTransform: "uppercase", pointerEvents: "none" }}>
                        {isCut ? "✂" : color}
                      </text>
                    );
                  })()}
                  {/* Flash effect on cut */}
                  {isFlash && (
                    <circle cx={cx} cy={cy} r={ringR}
                      fill="none" stroke={color === correctWire ? "hsl(140,80%,50%)" : "hsl(0,80%,50%)"}
                      strokeWidth="2" opacity="0.5">
                      <animate attributeName="r" from={String(ringR)} to={String(ringR + 30)} dur="0.4s" fill="freeze" />
                      <animate attributeName="opacity" from="0.5" to="0" dur="0.4s" fill="freeze" />
                    </circle>
                  )}
                </g>
              );
            })}

            {/* Center core */}
            <circle cx={cx} cy={cy} r="28" fill="hsl(220,20%,10%)" stroke={isDanger ? "hsl(0,80%,50%)" : "hsl(180,60%,40%)"} strokeWidth="2" />
            <circle cx={cx} cy={cy} r="18" fill={isDanger ? "hsl(0,50%,20%)" : "hsl(180,30%,15%)"}>
              {isDanger && <animate attributeName="fill" values="hsl(0,50%,20%);hsl(0,70%,35%);hsl(0,50%,20%)" dur="0.8s" repeatCount="indefinite" />}
            </circle>
            <text x={cx} y={cy - 4} textAnchor="middle" fill={isDanger ? "hsl(0,80%,60%)" : "hsl(180,80%,70%)"} fontSize="14" fontWeight="bold" fontFamily="monospace">{timeLeft}s</text>
            <text x={cx} y={cy + 10} textAnchor="middle" fill="hsl(0,0%,50%)" fontSize="7" fontFamily="monospace">DEFUSE</text>

            {/* Outer ticks */}
            {Array.from({ length: 36 }).map((_, i) => {
              const a = (i * 10) * Math.PI / 180;
              const r1 = maxR - 6, r2 = maxR;
              return <line key={i} x1={cx + r1 * Math.cos(a)} y1={cy + r1 * Math.sin(a)} x2={cx + r2 * Math.cos(a)} y2={cy + r2 * Math.sin(a)} stroke="hsl(180,40%,30%)" strokeWidth="1" />;
            })}
          </svg>

          {/* Level badge */}
          <div className="absolute bottom-2 right-2 bg-black/70 border border-cyan-500/30 rounded px-2 py-1">
            <span className="text-[10px] text-cyan-400 font-mono">Level {round + 1}</span>
          </div>
        </div>

        {/* Clue bar */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={clue}
          className="bg-black/60 border border-amber-500/30 rounded-lg px-4 py-2 max-w-md w-full text-center">
          <p className="text-amber-300/90 text-sm font-mono tracking-wide">📋 {clue}</p>
        </motion.div>

        {/* Wire legend — clickable pills below radar */}
        <div className="flex flex-wrap gap-2 justify-center">
          {wires.map(color => {
            const isCut = cutWires.includes(color);
            const rc = RING_COLORS[color] || RING_COLORS.white;
            return (
              <motion.button key={color} whileHover={{ scale: isCut ? 1 : 1.08 }} whileTap={{ scale: 0.95 }}
                disabled={isCut} onClick={() => cutWire(color)}
                className={`px-4 py-2 rounded-full border-2 text-xs font-bold uppercase tracking-wider transition-all ${isCut ? "opacity-30 border-muted" : "cursor-pointer"}`}
                style={{ borderColor: isCut ? undefined : rc.stroke, color: isCut ? "hsl(0,0%,40%)" : rc.fill, boxShadow: isCut ? "none" : rc.glow, background: "hsl(220,20%,8%)" }}>
                {isCut ? `✂ ${color}` : `⚡ ${color}`}
              </motion.button>
            );
          })}
        </div>
      </div>

      <Leaderboard gameType="bomb_defusal" />
    </GameShell>
  );
};

// ════════════════════════════════════════════════════════
// GAME 12: SNAKE RUNNER 🐍
// ════════════════════════════════════════════════════════
const GRID_SIZE = 25;
const CELL_SIZE = 16;

const SnakeRunnerGame = ({ onBack }: { onBack: () => void }) => {
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [snake, setSnake] = useState<{ x: number; y: number }[]>([{ x: 12, y: 12 }]);
  const [food, setFood] = useState({ x: 15, y: 10 });
  const [direction, setDirection] = useState<"up" | "down" | "left" | "right">("right");
  const [score, setScore] = useState(0);
  const dirRef = useRef(direction);
  const gameLoopRef = useRef<ReturnType<typeof setInterval>>();
  const submitScore = useSubmitScore();
  const game = GAMES[11];

  const spawnFood = (snakeBody: { x: number; y: number }[]) => {
    let pos: { x: number; y: number };
    do { pos = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) }; }
    while (snakeBody.some(s => s.x === pos.x && s.y === pos.y));
    return pos;
  };

  const initGame = () => {
    const initial = [{ x: 12, y: 12 }];
    setSnake(initial); setFood(spawnFood(initial)); setDirection("right"); dirRef.current = "right";
    setScore(0); setGameOver(false); setStarted(true);
  };

  useEffect(() => {
    if (!started || gameOver) return;
    const handleKey = (e: KeyboardEvent) => {
      const map: Record<string, "up" | "down" | "left" | "right"> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", s: "down", a: "left", d: "right" };
      const newDir = map[e.key];
      if (!newDir) return;
      const opposites: Record<string, string> = { up: "down", down: "up", left: "right", right: "left" };
      if (opposites[newDir] !== dirRef.current) { dirRef.current = newDir; setDirection(newDir); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [started, gameOver]);

  useEffect(() => {
    if (!started || gameOver) return;
    gameLoopRef.current = setInterval(() => {
      setSnake(prev => {
        const head = { ...prev[0] };
        const dir = dirRef.current;
        if (dir === "up") head.y--; else if (dir === "down") head.y++; else if (dir === "left") head.x--; else head.x++;
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE || prev.some(s => s.x === head.x && s.y === head.y)) {
          setGameOver(true); clearInterval(gameLoopRef.current);
          setScore(sc => { submitScore("snake_runner", sc * 10); return sc; });
          return prev;
        }
        const newSnake = [head, ...prev];
        if (head.x === food.x && head.y === food.y) {
          setScore(s => s + 1);
          setFood(spawnFood(newSnake));
        } else { newSnake.pop(); }
        return newSnake;
      });
    }, 100);
    return () => clearInterval(gameLoopRef.current);
  }, [started, gameOver, food, submitScore]);

  if (!started) return <StartScreen title={game.title} description={game.description} icon={<Flame className="w-14 h-14" />} gradient={game.gradient} glow={game.glow} onStart={initGame} onBack={onBack} gameType="snake_runner" />;
  if (gameOver) return <EndScreen won={score >= 10} title={`Score: ${score}!`} subtitle={`${score * 10} pts — Snake length: ${score + 1}`} onReplay={initGame} onBack={onBack} gameType="snake_runner" />;

  return (
    <GameShell onBack={onBack} title="Snake Runner" icon={<Flame className="w-5 h-5 text-foreground" />} gradient={game.gradient}
      badges={<Badge className="bg-emerald-900/40 text-emerald-300 border-emerald-500/30 font-mono">Score: {score}</Badge>}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative rounded-xl border-2 border-emerald-500/20 overflow-hidden"
          style={{ width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE, background: "radial-gradient(ellipse at 50% 50%, hsl(220 20% 10%) 0%, hsl(220 25% 5%) 100%)" }}>
          <div className="absolute inset-0 opacity-[0.06]" style={{
            backgroundImage: `repeating-linear-gradient(90deg, hsl(140 50% 50%) 0px, transparent 1px, transparent ${CELL_SIZE}px), repeating-linear-gradient(0deg, hsl(140 50% 50%) 0px, transparent 1px, transparent ${CELL_SIZE}px)`
          }} />
          {/* Food */}
          <motion.div className="absolute rounded-full" animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}
            style={{ left: food.x * CELL_SIZE + 1, top: food.y * CELL_SIZE + 1, width: CELL_SIZE - 2, height: CELL_SIZE - 2,
              background: "radial-gradient(circle, hsl(0 80% 60%), hsl(0 70% 40%))", boxShadow: "0 0 10px hsl(0 80% 55% / 0.6)" }} />
          {/* Snake - Golden/Brown scaled design */}
          {snake.map((seg, i) => {
            const isHead = i === 0;
            const pct = Math.min(i / Math.max(snake.length - 1, 1), 1);
            const hue = 35 - pct * 10; // golden 35 → brown 25
            const sat = 75 - pct * 15;
            const light = 55 - pct * 15;
            const segSize = CELL_SIZE - 2;
            return (
              <div key={i} className="absolute transition-all duration-75" style={{
                left: seg.x * CELL_SIZE + 1, top: seg.y * CELL_SIZE + 1,
                width: segSize, height: segSize,
                borderRadius: isHead ? '40%' : i % 2 === 0 ? '25%' : '35%',
                background: isHead
                  ? 'linear-gradient(135deg, hsl(40 80% 55%), hsl(30 70% 40%))'
                  : `linear-gradient(${135 + i * 15}deg, hsl(${hue} ${sat}% ${light}%), hsl(${hue - 5} ${sat - 10}% ${light - 8}%))`,
                boxShadow: isHead
                  ? '0 0 10px hsl(40 80% 50% / 0.6), inset 0 1px 2px hsl(50 90% 70% / 0.3)'
                  : `inset 0 1px 1px hsl(${hue} ${sat}% ${light + 15}% / 0.3), inset 0 -1px 1px hsl(${hue} ${sat}% ${light - 10}% / 0.4)`,
                border: isHead ? '1px solid hsl(40 60% 65% / 0.5)' : `1px solid hsl(${hue} ${sat - 20}% ${light - 5}% / 0.25)`,
              }}>
                {/* Scale pattern on body segments */}
                {!isHead && (
                  <div className="absolute inset-[2px] rounded-[inherit] opacity-30" style={{
                    background: `radial-gradient(circle at 30% 30%, hsl(${hue} ${sat}% ${light + 20}%) 0%, transparent 50%)`
                  }} />
                )}
                {/* Eyes on head */}
                {isHead && <>
                  <div className="absolute rounded-full" style={{
                    width: 4, height: 4, top: 2, left: 2,
                    background: 'radial-gradient(circle, hsl(15 90% 45%), hsl(0 80% 25%))',
                    boxShadow: '0 0 3px hsl(15 90% 50% / 0.8)'
                  }} />
                  <div className="absolute rounded-full" style={{
                    width: 4, height: 4, top: 2, right: 2,
                    background: 'radial-gradient(circle, hsl(15 90% 45%), hsl(0 80% 25%))',
                    boxShadow: '0 0 3px hsl(15 90% 50% / 0.8)'
                  }} />
                </>}
              </div>
            );
          })}
        </div>
        {/* Mobile controls */}
        <div className="grid grid-cols-3 gap-1.5 w-32 md:hidden">
          <div />
          <Button size="sm" variant="outline" className="border-emerald-500/30 h-10" onClick={() => { if (dirRef.current !== "down") { dirRef.current = "up"; setDirection("up"); } }}>↑</Button>
          <div />
          <Button size="sm" variant="outline" className="border-emerald-500/30 h-10" onClick={() => { if (dirRef.current !== "right") { dirRef.current = "left"; setDirection("left"); } }}>←</Button>
          <Button size="sm" variant="outline" className="border-emerald-500/30 h-10" onClick={() => { if (dirRef.current !== "up") { dirRef.current = "down"; setDirection("down"); } }}>↓</Button>
          <Button size="sm" variant="outline" className="border-emerald-500/30 h-10" onClick={() => { if (dirRef.current !== "left") { dirRef.current = "right"; setDirection("right"); } }}>→</Button>
        </div>
        <p className="text-xs text-muted-foreground font-mono">Use WASD or Arrow keys to move</p>
      </div>
      <Leaderboard gameType="snake_runner" />
    </GameShell>
  );
};

// ════════════════════════════════════════════════════════
// GAME 13: BLOCK BLAST — Tetris-style falling blocks!
// ════════════════════════════════════════════════════════
const BG_COLS = 10;
const BG_ROWS = 20;
const BLOCK_COLORS = [
  { bg: "hsl(200,85%,55%)", light: "hsl(200,85%,70%)", dark: "hsl(200,85%,40%)", shadow: "hsl(200,85%,30%)" },
  { bg: "hsl(0,75%,55%)", light: "hsl(0,75%,70%)", dark: "hsl(0,75%,40%)", shadow: "hsl(0,75%,30%)" },
  { bg: "hsl(120,60%,45%)", light: "hsl(120,60%,60%)", dark: "hsl(120,60%,32%)", shadow: "hsl(120,60%,22%)" },
  { bg: "hsl(50,90%,55%)", light: "hsl(50,90%,70%)", dark: "hsl(50,90%,40%)", shadow: "hsl(50,90%,30%)" },
  { bg: "hsl(275,70%,55%)", light: "hsl(275,70%,70%)", dark: "hsl(275,70%,40%)", shadow: "hsl(275,70%,30%)" },
  { bg: "hsl(25,90%,55%)", light: "hsl(25,90%,70%)", dark: "hsl(25,90%,40%)", shadow: "hsl(25,90%,30%)" },
  { bg: "hsl(180,70%,50%)", light: "hsl(180,70%,65%)", dark: "hsl(180,70%,35%)", shadow: "hsl(180,70%,25%)" },
];

const TETROMINOS: { shape: number[][]; color: number }[] = [
  { shape: [[1,1,1,1]], color: 0 },                         // I
  { shape: [[1,1],[1,1]], color: 3 },                        // O
  { shape: [[0,1,0],[1,1,1]], color: 4 },                    // T
  { shape: [[1,0],[1,0],[1,1]], color: 5 },                  // L
  { shape: [[0,1],[0,1],[1,1]], color: 1 },                  // J
  { shape: [[0,1,1],[1,1,0]], color: 2 },                    // S
  { shape: [[1,1,0],[0,1,1]], color: 6 },                    // Z
];

const rotateCW = (shape: number[][]): number[][] => {
  const rows = shape.length, cols = shape[0].length;
  const rotated: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      rotated[c][rows - 1 - r] = shape[r][c];
  return rotated;
};

type FallingPiece = { shape: number[][]; color: number; row: number; col: number };

const BlockPuzzleGame = ({ onBack }: { onBack: () => void }) => {
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [board, setBoard] = useState<(number | null)[][]>([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [linesCleared, setLinesCleared] = useState(0);
  const [combo, setCombo] = useState(0);
  const [current, setCurrent] = useState<FallingPiece | null>(null);
  const [next, setNext] = useState<FallingPiece | null>(null);
  const [flashRows, setFlashRows] = useState<number[]>([]);
  const submitScore = useSubmitScore();
  const game = GAMES[12];
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const boardRef = useRef(board);
  const currentRef = useRef(current);
  const scoreRef = useRef(score);
  const levelRef = useRef(level);
  const linesClearedRef = useRef(linesCleared);
  const comboRef = useRef(combo);
  const gameOverRef = useRef(gameOver);

  boardRef.current = board;
  currentRef.current = current;
  scoreRef.current = score;
  levelRef.current = level;
  linesClearedRef.current = linesCleared;
  comboRef.current = combo;
  gameOverRef.current = gameOver;

  const emptyBoard = (): (number | null)[][] => Array.from({ length: BG_ROWS }, () => Array(BG_COLS).fill(null));

  const spawnPiece = useCallback((): FallingPiece => {
    const t = TETROMINOS[Math.floor(Math.random() * TETROMINOS.length)];
    return { shape: t.shape, color: t.color, row: 0, col: Math.floor((BG_COLS - t.shape[0].length) / 2) };
  }, []);

  const collides = useCallback((b: (number | null)[][], piece: FallingPiece): boolean => {
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c] === 0) continue;
        const br = piece.row + r, bc = piece.col + c;
        if (br < 0 || br >= BG_ROWS || bc < 0 || bc >= BG_COLS) return true;
        if (b[br][bc] !== null) return true;
      }
    }
    return false;
  }, []);

  const lockPiece = useCallback((b: (number | null)[][], piece: FallingPiece): (number | null)[][] => {
    const nb = b.map(row => [...row]);
    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c] === 1) {
          nb[piece.row + r][piece.col + c] = piece.color;
        }
      }
    }
    return nb;
  }, []);

  const clearLines = useCallback((b: (number | null)[][]): { newBoard: (number | null)[][]; cleared: number; clearedRows: number[] } => {
    const clearedRows: number[] = [];
    for (let r = 0; r < BG_ROWS; r++) {
      if (b[r].every(cell => cell !== null)) clearedRows.push(r);
    }
    if (clearedRows.length === 0) return { newBoard: b, cleared: 0, clearedRows: [] };
    const remaining = b.filter((_, i) => !clearedRows.includes(i));
    const emptyRows = Array.from({ length: clearedRows.length }, () => Array(BG_COLS).fill(null) as (number | null)[]);
    return { newBoard: [...emptyRows, ...remaining], cleared: clearedRows.length, clearedRows };
  }, []);

  const getGhostRow = useCallback((b: (number | null)[][], piece: FallingPiece): number => {
    let ghostRow = piece.row;
    while (!collides(b, { ...piece, row: ghostRow + 1 })) ghostRow++;
    return ghostRow;
  }, [collides]);

  const tick = useCallback(() => {
    if (gameOverRef.current) return;
    const b = boardRef.current;
    const piece = currentRef.current;
    if (!piece) return;

    const moved = { ...piece, row: piece.row + 1 };
    if (!collides(b, moved)) {
      setCurrent(moved);
    } else {
      // Lock piece
      const locked = lockPiece(b, piece);
      // Check if game over (piece locked at row 0 or above)
      if (piece.row <= 0) {
        setGameOver(true);
        gameOverRef.current = true;
        clearInterval(intervalRef.current);
        submitScore("block_puzzle", scoreRef.current);
        return;
      }
      const { newBoard, cleared, clearedRows } = clearLines(locked);
      if (cleared > 0) {
        setFlashRows(clearedRows);
        setTimeout(() => setFlashRows([]), 300);
        const points = [0, 100, 300, 500, 800][Math.min(cleared, 4)] * levelRef.current;
        const newCombo = comboRef.current + 1;
        const comboBonus = newCombo > 1 ? 50 * newCombo : 0;
        setScore(s => s + points + comboBonus);
        setCombo(newCombo);
        const newLines = linesClearedRef.current + cleared;
        setLinesCleared(newLines);
        const newLevel = Math.floor(newLines / 10) + 1;
        setLevel(newLevel);
      } else {
        setCombo(0);
      }
      setBoard(newBoard);
      // Spawn next
      const nextPiece = next || spawnPiece();
      if (collides(newBoard, nextPiece)) {
        setGameOver(true);
        gameOverRef.current = true;
        clearInterval(intervalRef.current);
        submitScore("block_puzzle", scoreRef.current + (cleared > 0 ? [0,100,300,500,800][Math.min(cleared,4)] * levelRef.current : 0));
        return;
      }
      setCurrent(nextPiece);
      setNext(spawnPiece());
    }
  }, [collides, lockPiece, clearLines, next, spawnPiece, submitScore]);

  const initGame = useCallback(() => {
    const b = emptyBoard();
    setBoard(b);
    setScore(0); setLevel(1); setLinesCleared(0); setCombo(0);
    setGameOver(false); setFlashRows([]);
    gameOverRef.current = false;
    const p = spawnPiece();
    setCurrent(p);
    setNext(spawnPiece());
    setStarted(true);
  }, [spawnPiece]);

  // Game loop
  useEffect(() => {
    if (!started || gameOver) return;
    clearInterval(intervalRef.current);
    const speed = Math.max(100, 800 - (level - 1) * 70);
    intervalRef.current = setInterval(tick, speed);
    return () => clearInterval(intervalRef.current);
  }, [started, gameOver, level, tick]);

  // Keyboard controls
  useEffect(() => {
    if (!started || gameOver) return;
    const handler = (e: KeyboardEvent) => {
      const piece = currentRef.current;
      const b = boardRef.current;
      if (!piece) return;
      if (e.key === "ArrowLeft" || e.key === "a") {
        e.preventDefault();
        const moved = { ...piece, col: piece.col - 1 };
        if (!collides(b, moved)) setCurrent(moved);
      } else if (e.key === "ArrowRight" || e.key === "d") {
        e.preventDefault();
        const moved = { ...piece, col: piece.col + 1 };
        if (!collides(b, moved)) setCurrent(moved);
      } else if (e.key === "ArrowDown" || e.key === "s") {
        e.preventDefault();
        const moved = { ...piece, row: piece.row + 1 };
        if (!collides(b, moved)) { setCurrent(moved); setScore(s => s + 1); }
      } else if (e.key === "ArrowUp" || e.key === "w") {
        e.preventDefault();
        const rotated = { ...piece, shape: rotateCW(piece.shape) };
        // Wall kick: try 0, -1, +1, -2, +2
        for (const offset of [0, -1, 1, -2, 2]) {
          const kicked = { ...rotated, col: rotated.col + offset };
          if (!collides(b, kicked)) { setCurrent(kicked); break; }
        }
      } else if (e.key === " ") {
        e.preventDefault();
        // Hard drop
        let dropRow = piece.row;
        while (!collides(b, { ...piece, row: dropRow + 1 })) dropRow++;
        const dropped = dropRow - piece.row;
        setScore(s => s + dropped * 2);
        setCurrent({ ...piece, row: dropRow });
        // Force immediate lock on next tick
        setTimeout(tick, 0);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [started, gameOver, collides, tick]);

  const CELL = 30;

  if (!started) return <StartScreen title="Block Blast" description="Tetris-style falling blocks! Rotate & place pieces to clear lines. Speed increases with each level!" icon={<Box className="w-14 h-14" />} gradient={game.gradient} glow={game.glow} onStart={initGame} onBack={onBack} gameType="block_puzzle" />;
  if (gameOver) return <EndScreen won={score >= 1000} title={`Score: ${score}!`} subtitle={`Level ${level} — ${linesCleared} lines cleared`} onReplay={initGame} onBack={onBack} gameType="block_puzzle" />;

  // Build display board with current piece and ghost
  const displayBoard = board.map(row => [...row]);
  const ghostBoard: boolean[][] = Array.from({ length: BG_ROWS }, () => Array(BG_COLS).fill(false));
  if (current) {
    const ghostRow = getGhostRow(board, current);
    // Draw ghost
    for (let r = 0; r < current.shape.length; r++) {
      for (let c = 0; c < current.shape[r].length; c++) {
        if (current.shape[r][c] === 1) {
          const gr = ghostRow + r, gc = current.col + c;
          if (gr >= 0 && gr < BG_ROWS && gc >= 0 && gc < BG_COLS) ghostBoard[gr][gc] = true;
        }
      }
    }
    // Draw current piece
    for (let r = 0; r < current.shape.length; r++) {
      for (let c = 0; c < current.shape[r].length; c++) {
        if (current.shape[r][c] === 1) {
          const br = current.row + r, bc = current.col + c;
          if (br >= 0 && br < BG_ROWS && bc >= 0 && bc < BG_COLS) displayBoard[br][bc] = current.color;
        }
      }
    }
  }

  return (
    <GameShell onBack={onBack} title="Block Blast" icon={<Box className="w-5 h-5 text-foreground" />} gradient={game.gradient}
      badges={<>
        <Badge className="bg-blue-900/40 text-blue-300 border-blue-500/30 font-mono text-base">{score} pts</Badge>
        <Badge className="bg-purple-900/40 text-purple-300 border-purple-500/30">Lv.{level}</Badge>
        {combo > 1 && <Badge className="bg-yellow-900/40 text-yellow-300 border-yellow-500/30 animate-pulse">🔥 x{combo}</Badge>}
      </>}>
      <div className="flex flex-col lg:flex-row items-start justify-center gap-6">
        {/* Game Board */}
        <div className="relative rounded-2xl p-2" style={{ background: "linear-gradient(135deg, hsl(225,50%,25%), hsl(225,50%,15%))", boxShadow: "0 8px 40px hsl(225 50% 10% / 0.8), inset 0 1px 0 hsl(225 40% 40% / 0.3)" }}>
          <div className="grid" style={{ gridTemplateColumns: `repeat(${BG_COLS}, ${CELL}px)`, gap: "1px" }}>
            {displayBoard.map((row, r) =>
              row.map((cell, c) => {
                const isFlash = flashRows.includes(r);
                const isGhost = ghostBoard[r][c] && cell === null;
                const color = cell !== null ? BLOCK_COLORS[cell] : null;

                return (
                  <motion.div
                    key={`${r}-${c}`}
                    style={{ width: CELL, height: CELL }}
                    animate={isFlash ? { opacity: [1, 0.3, 1], scale: [1, 1.05, 0.95] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {cell !== null ? (
                      <div className="w-full h-full rounded-[3px] relative overflow-hidden" style={{
                        background: `linear-gradient(135deg, ${color!.light} 0%, ${color!.bg} 40%, ${color!.dark} 100%)`,
                        boxShadow: `0 2px 4px ${color!.shadow}, inset 0 1px 0 ${color!.light}80, inset 0 -1px 0 ${color!.dark}80`,
                      }}>
                        <div className="absolute inset-0" style={{
                          background: "linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.1) 40%, transparent 60%)",
                        }} />
                      </div>
                    ) : isGhost ? (
                      <div className="w-full h-full rounded-[3px]" style={{
                        background: current ? `${BLOCK_COLORS[current.color].bg}20` : "transparent",
                        border: `1px dashed ${current ? BLOCK_COLORS[current.color].bg + "60" : "transparent"}`,
                      }} />
                    ) : (
                      <div className="w-full h-full rounded-[3px]" style={{
                        background: "hsl(225,40%,14%)",
                        border: "1px solid hsl(225,40%,18%)",
                      }} />
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Side Panel */}
        <div className="flex flex-col gap-4 min-w-[140px]">
          {/* Next Piece Preview */}
          <div className="rounded-xl p-3 text-center" style={{ background: "linear-gradient(135deg, hsl(225,40%,16%), hsl(225,40%,10%))", border: "1px solid hsl(225,40%,22%)" }}>
            <p className="text-xs text-muted-foreground font-mono mb-2 uppercase tracking-wider">Next</p>
            {next && (
              <div className="inline-grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${next.shape[0].length}, 22px)` }}>
                {next.shape.flat().map((cell, i) => {
                  const color = BLOCK_COLORS[next.color];
                  return (
                    <div key={i} style={{ width: 22, height: 22 }}>
                      {cell === 1 ? (
                        <div className="w-full h-full rounded-sm relative overflow-hidden" style={{
                          background: `linear-gradient(135deg, ${color.light} 0%, ${color.bg} 40%, ${color.dark} 100%)`,
                          boxShadow: `0 1px 2px ${color.shadow}`,
                        }}>
                          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)" }} />
                        </div>
                      ) : <div className="w-full h-full" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="rounded-xl p-3 space-y-3" style={{ background: "linear-gradient(135deg, hsl(225,40%,16%), hsl(225,40%,10%))", border: "1px solid hsl(225,40%,22%)" }}>
            <div>
              <p className="text-[10px] text-muted-foreground font-mono uppercase">Score</p>
              <p className="text-xl font-bold font-mono text-cyan-400">{score}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-mono uppercase">Level</p>
              <p className="text-xl font-bold font-mono text-purple-400">{level}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-mono uppercase">Lines</p>
              <p className="text-xl font-bold font-mono text-green-400">{linesCleared}</p>
            </div>
          </div>

          {/* Controls help */}
          <div className="rounded-xl p-3 text-[10px] text-muted-foreground font-mono space-y-1" style={{ background: "linear-gradient(135deg, hsl(225,40%,16%), hsl(225,40%,10%))", border: "1px solid hsl(225,40%,22%)" }}>
            <p>← → Move</p>
            <p>↑ Rotate</p>
            <p>↓ Soft Drop</p>
            <p>Space Hard Drop</p>
          </div>

          {/* Mobile controls */}
          <div className="grid grid-cols-3 gap-1.5 lg:hidden">
            <div />
            <Button size="sm" variant="outline" className="border-blue-500/30 h-10" onClick={() => {
              if (!current) return;
              const rotated = { ...current, shape: rotateCW(current.shape) };
              for (const offset of [0, -1, 1, -2, 2]) {
                const kicked = { ...rotated, col: rotated.col + offset };
                if (!collides(board, kicked)) { setCurrent(kicked); break; }
              }
            }}>↻</Button>
            <div />
            <Button size="sm" variant="outline" className="border-blue-500/30 h-10" onClick={() => {
              if (!current) return;
              const moved = { ...current, col: current.col - 1 };
              if (!collides(board, moved)) setCurrent(moved);
            }}>←</Button>
            <Button size="sm" variant="outline" className="border-blue-500/30 h-10" onClick={() => {
              if (!current) return;
              const moved = { ...current, row: current.row + 1 };
              if (!collides(board, moved)) { setCurrent(moved); setScore(s => s + 1); }
            }}>↓</Button>
            <Button size="sm" variant="outline" className="border-blue-500/30 h-10" onClick={() => {
              if (!current) return;
              const moved = { ...current, col: current.col + 1 };
              if (!collides(board, moved)) setCurrent(moved);
            }}>→</Button>
            <div />
            <Button size="sm" variant="outline" className="border-yellow-500/30 h-10 col-span-1" onClick={() => {
              if (!current) return;
              let dropRow = current.row;
              while (!collides(board, { ...current, row: dropRow + 1 })) dropRow++;
              setScore(s => s + (dropRow - current.row) * 2);
              setCurrent({ ...current, row: dropRow });
              setTimeout(tick, 0);
            }}>⬇</Button>
            <div />
          </div>
        </div>
      </div>
      <Leaderboard gameType="block_puzzle" />
    </GameShell>
  );
};

// ─── Weekly Top Players ──────────────────────────────────
const WeeklyTopPlayers = memo(() => {
  const [players, setPlayers] = useState<{ discord_username: string; discord_avatar: string | null; discord_id: string | null; total_score: number }[]>([]);
  const [resolvedAvatars, setResolvedAvatars] = useState<Record<string, { username: string; avatar: string | null }>>({});
  const resolvedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const fetchWeekly = async () => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase.from("mini_game_scores").select("discord_username, discord_avatar, discord_id, score").gte("created_at", weekAgo);
      if (!data) return;
      const map = new Map<string, { discord_username: string; discord_avatar: string | null; discord_id: string | null; total_score: number }>();
      for (const row of data) {
        const key = row.discord_id || row.discord_username || "anon";
        const existing = map.get(key);
        if (existing) { existing.total_score += row.score; }
        else { map.set(key, { discord_username: row.discord_username || "Anonymous", discord_avatar: row.discord_avatar, discord_id: row.discord_id, total_score: row.score }); }
      }
      const top10 = Array.from(map.values()).sort((a, b) => b.total_score - a.total_score).slice(0, 10);
      setPlayers(top10);

      // Resolve Discord identities
      for (const p of top10) {
        if (!p.discord_id || !/^\d{17,19}$/.test(p.discord_id)) continue;
        if (resolvedRef.current.has(p.discord_id)) continue;
        if (p.discord_username && p.discord_username !== "Player" && p.discord_username !== "Anonymous") continue;
        resolvedRef.current.add(p.discord_id);
        supabase.functions.invoke('fetch-discord-user', { body: { discordId: p.discord_id } }).then(({ data: userData }) => {
          if (userData) {
            setResolvedAvatars(prev => ({ ...prev, [p.discord_id!]: {
              username: userData.displayName || userData.globalName || userData.username || "Unknown",
              avatar: userData.avatar || null,
            }}));
          }
        });
      }
    };
    fetchWeekly();
  }, []);

  const medals = ["🥇", "🥈", "🥉"];
  if (players.length === 0) return null;

  return (
    <div className="max-w-2xl mx-auto mb-10">
      <div className="rounded-2xl border border-yellow-500/20 bg-gradient-to-b from-[hsl(220,20%,8%)] to-[hsl(220,20%,5%)] overflow-hidden">
        <div className="p-4 flex items-center gap-2 border-b border-yellow-500/10">
          <Trophy className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
          <span className="font-bold text-yellow-400 uppercase tracking-wider text-sm" style={{ textShadow: "0 0 10px hsl(50 90% 55% / 0.4)" }}>Weekly Top Players</span>
          <span className="ml-auto text-[10px] text-cyan-400/60 font-mono">All Games Combined</span>
        </div>
        <div className="p-3 space-y-1.5">
          {players.map((p, i) => {
            const resolved = p.discord_id ? resolvedAvatars[p.discord_id] : null;
            const displayName = resolved?.username || p.discord_username || "Anonymous";
            const avatarHash = resolved?.avatar || p.discord_avatar;
            const avatarUrl = avatarHash
              ? (avatarHash.startsWith("http") ? avatarHash : (p.discord_id ? `https://cdn.discordapp.com/avatars/${p.discord_id}/${avatarHash}.png?size=64` : null))
              : null;
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-3 p-2.5 rounded-xl ${i === 0 ? "bg-gradient-to-r from-yellow-500/15 to-amber-500/8 border border-yellow-500/25" : i < 3 ? "bg-white/[0.03] border border-white/[0.06]" : "bg-white/[0.01] border border-white/[0.03]"}`}>
                <span className="font-bold w-7 text-center text-lg">{i < 3 ? medals[i] : <span className="text-muted-foreground text-sm font-mono">#{i+1}</span>}</span>
                {avatarUrl ? (
                  <img src={avatarUrl} className="w-7 h-7 rounded-full ring-2 ring-yellow-500/20 object-cover" alt={displayName} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-muted/30 flex items-center justify-center text-xs font-bold">{displayName[0].toUpperCase()}</div>
                )}
                <span className="flex-1 truncate text-sm font-medium">{displayName}</span>
                <span className="text-xs font-mono font-bold text-yellow-400">{p.total_score} pts</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
WeeklyTopPlayers.displayName = "WeeklyTopPlayers";

// ─── External Game Wrappers ──────────────────────────────
const BubbleShooterWrapper = ({ onBack }: { onBack: () => void }) => {
  const submitScore = useSubmitScore();
  return <BubbleShooterGame onBack={onBack} submitScore={submitScore} GameShell={GameShell} StartScreen={StartScreen} EndScreen={EndScreen} Leaderboard={Leaderboard} game={GAMES[13]} />;
};

const BrickBreakerWrapper = ({ onBack }: { onBack: () => void }) => {
  const submitScore = useSubmitScore();
  return <BrickBreakerGame onBack={onBack} submitScore={submitScore} GameShell={GameShell} StartScreen={StartScreen} EndScreen={EndScreen} Leaderboard={Leaderboard} game={GAMES[14]} />;
};

// ════════════════════════════════════════════════════════
// MAIN HUB
// ════════════════════════════════════════════════════════
const MiniGames = () => {
  const [activeGame, setActiveGame] = useState<GameType | null>(null);

  const renderGame = () => {
    const onBack = () => setActiveGame(null);
    switch (activeGame) {
      case "escape_room": return <EscapeRoomGame onBack={onBack} />;
      case "memory_match": return <MemoryMatchGame onBack={onBack} />;
      case "reaction_test": return <ReactionTestGame onBack={onBack} />;
      case "trivia_quiz": return <TriviaQuizGame onBack={onBack} />;
      case "word_scramble": return <WordScrambleGame onBack={onBack} />;
      case "speed_typer": return <SpeedTyperGame onBack={onBack} />;
      case "color_match": return <ColorMatchGame onBack={onBack} />;
      case "pattern_memory": return <PatternMemoryGame onBack={onBack} />;
      case "math_blitz": return <MathBlitzGame onBack={onBack} />;
      case "aim_trainer": return <AimTrainerGame onBack={onBack} />;
      case "bomb_defusal": return <BombDefusalGame onBack={onBack} />;
      case "snake_runner": return <SnakeRunnerGame onBack={onBack} />;
      case "block_puzzle": return <BlockPuzzleGame onBack={onBack} />;
      case "bubble_shooter": return <BubbleShooterWrapper onBack={onBack} />;
      case "brick_breaker": return <BrickBreakerWrapper onBack={onBack} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8 pt-24">
        <AnimatePresence mode="wait">
          {activeGame ? (
            <motion.div key={activeGame} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {renderGame()}
            </motion.div>
          ) : (
            <motion.div key="hub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="text-center mb-12">
                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="inline-block mb-6">
                  <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center shadow-2xl"
                    style={{ background: "linear-gradient(135deg, hsl(280 70% 50%), hsl(190 80% 50%))", boxShadow: "0 0 40px hsl(280 70% 50% / 0.3), 0 0 80px hsl(190 80% 50% / 0.2)", transform: "perspective(600px) rotateX(5deg) rotateY(-5deg)" }}>
                    <Gamepad2 className="w-10 h-10 text-foreground" />
                  </div>
                </motion.div>
                <h1 className="text-5xl font-bold mb-4" style={{
                  background: "linear-gradient(90deg, hsl(280 70% 65%), hsl(190 80% 55%), hsl(50 90% 55%))",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>Mini Games Arena</h1>
                <p className="text-muted-foreground max-w-lg mx-auto text-lg">
                  15 unique games with live leaderboards. Compete for the top spot!
                </p>
              </div>

              {/* Weekly Top Players */}
              <WeeklyTopPlayers />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 max-w-7xl mx-auto">
                {GAMES.map((game, i) => (
                  <motion.div key={game.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <Card3D className="cursor-pointer h-full" onClick={() => setActiveGame(game.id)}>
                      <Card className="h-full overflow-hidden relative group border-white/[0.06] hover:border-primary/30 transition-all"
                        style={{ background: "linear-gradient(180deg, hsl(220 20% 10%) 0%, hsl(220 25% 6%) 100%)" }}>
                        <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-0 group-hover:opacity-[0.08] transition-opacity duration-300`} />
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-primary/30 transition-all" />
                        <CardHeader className="text-center pb-2 relative z-10">
                          <div className={`w-16 h-16 mx-auto mb-3 rounded-xl bg-gradient-to-br ${game.gradient} flex items-center justify-center shadow-xl ${game.glow}`}>
                            <div className="text-foreground">{game.icon}</div>
                          </div>
                          <CardTitle className="text-lg">{game.title}</CardTitle>
                          <CardDescription className="text-xs">{game.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="text-center pb-5 relative z-10">
                          <Button variant="outline" size="sm" className="border-primary/30 hover:bg-primary/10 hover:border-primary/50">
                            <Gamepad2 className="w-3.5 h-3.5 mr-1.5" /> Play
                          </Button>
                        </CardContent>
                      </Card>
                    </Card3D>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default MiniGames;
