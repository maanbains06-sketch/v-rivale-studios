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
  Lightbulb, Key, Flame
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  | "speed_typer" | "color_match" | "pattern_memory" | "math_blitz" | "aim_trainer";

interface GameDef {
  id: GameType;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  glow: string;
}

const GAMES: GameDef[] = [
  { id: "escape_room", title: "Escape Room", description: "Explore a 3D room, find codes & escape in 10 minutes!", icon: <Lock className="w-8 h-8" />, gradient: "from-red-600 via-red-500 to-orange-500", glow: "shadow-red-500/40" },
  { id: "memory_match", title: "Memory Match", description: "Find all matching pairs with flipping 3D cards.", icon: <Brain className="w-8 h-8" />, gradient: "from-purple-600 via-purple-500 to-fuchsia-500", glow: "shadow-purple-500/40" },
  { id: "reaction_test", title: "Reaction Test", description: "Test your reflexes — react when the orb turns green!", icon: <Zap className="w-8 h-8" />, gradient: "from-yellow-500 via-amber-500 to-orange-500", glow: "shadow-yellow-500/40" },
  { id: "trivia_quiz", title: "RP Trivia Quiz", description: "Answer 10 RP knowledge questions against the clock.", icon: <BookOpen className="w-8 h-8" />, gradient: "from-cyan-500 via-sky-500 to-blue-500", glow: "shadow-cyan-500/40" },
  { id: "word_scramble", title: "Word Scramble", description: "Unscramble RP-themed words before time runs out!", icon: <Shuffle className="w-8 h-8" />, gradient: "from-green-500 via-emerald-500 to-teal-500", glow: "shadow-green-500/40" },
  { id: "speed_typer", title: "Speed Typer", description: "Type the words as fast as you can — accuracy matters!", icon: <Keyboard className="w-8 h-8" />, gradient: "from-indigo-500 via-blue-500 to-violet-500", glow: "shadow-indigo-500/40" },
  { id: "color_match", title: "Color Match", description: "Does the word match the color? React fast!", icon: <Palette className="w-8 h-8" />, gradient: "from-pink-500 via-rose-500 to-red-500", glow: "shadow-pink-500/40" },
  { id: "pattern_memory", title: "Pattern Memory", description: "Remember and repeat the flashing pattern!", icon: <Grid3X3 className="w-8 h-8" />, gradient: "from-teal-500 via-cyan-500 to-sky-500", glow: "shadow-teal-500/40" },
  { id: "math_blitz", title: "Math Blitz", description: "Solve quick math problems under pressure!", icon: <Calculator className="w-8 h-8" />, gradient: "from-orange-500 via-amber-500 to-yellow-500", glow: "shadow-orange-500/40" },
  { id: "aim_trainer", title: "Aim Trainer", description: "Click the targets as fast and accurately as you can!", icon: <Crosshair className="w-8 h-8" />, gradient: "from-lime-500 via-green-500 to-emerald-500", glow: "shadow-lime-500/40" },
];

// ─── 3D Card Wrapper ─────────────────────────────────────
const Card3D = ({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  const handleMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    ref.current.style.transform = `perspective(800px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) scale3d(1.02, 1.02, 1.02)`;
  };
  const handleLeave = () => {
    if (ref.current) ref.current.style.transform = "perspective(800px) rotateY(0deg) rotateX(0deg) scale3d(1,1,1)";
  };
  return (
    <div ref={ref} className={`transition-transform duration-300 ease-out ${className}`} style={{ transformStyle: "preserve-3d" }}
      onMouseMove={handleMove} onMouseLeave={handleLeave} onClick={onClick}>
      {children}
    </div>
  );
};

// ─── Realtime Leaderboard Component ──────────────────────
const Leaderboard = memo(({ gameType }: { gameType: GameType }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  const fetchScores = useCallback(async () => {
    const { data } = await supabase
      .from("mini_game_scores")
      .select("*")
      .eq("game_type", gameType)
      .order("score", { ascending: false })
      .order("time_seconds", { ascending: true })
      .limit(10);
    if (data) setEntries(data as LeaderboardEntry[]);
  }, [gameType]);

  useEffect(() => {
    fetchScores();
    // Realtime subscription
    const channel = supabase
      .channel(`leaderboard-${gameType}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "mini_game_scores", filter: `game_type=eq.${gameType}` }, () => {
        fetchScores();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [gameType, fetchScores]);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="mt-6">
      <Card3D>
        <Card className="bg-card/80 backdrop-blur-xl border-border/40 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-amber-500/5 pointer-events-none" />
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
              <span className="bg-gradient-to-r from-yellow-300 to-amber-400 bg-clip-text text-transparent">Top 10 Leaderboard</span>
              <span className="ml-auto text-[10px] text-muted-foreground font-normal italic">⚡ Live</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 relative z-10">
            {entries.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">No scores yet. Be the first! 🚀</p>}
            {entries.map((e, i) => (
              <motion.div key={e.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                  i === 0 ? "bg-gradient-to-r from-yellow-500/15 to-amber-500/10 border border-yellow-500/20" :
                  i === 1 ? "bg-gradient-to-r from-gray-400/10 to-slate-400/5 border border-gray-400/15" :
                  i === 2 ? "bg-gradient-to-r from-amber-700/10 to-orange-700/5 border border-amber-700/15" :
                  "bg-muted/15 border border-transparent"
                }`}>
                <span className="font-bold w-7 text-center text-lg">{i < 3 ? medals[i] : `#${i + 1}`}</span>
                {e.discord_id && e.discord_avatar ? (
                  <img src={`https://cdn.discordapp.com/avatars/${e.discord_id}/${e.discord_avatar}.png?size=32`} className="w-7 h-7 rounded-full ring-2 ring-border/40" alt="" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs">?</div>
                )}
                <span className="flex-1 truncate text-sm font-medium">{e.discord_username || "Anonymous"}</span>
                <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">{e.score} pts</Badge>
                {e.time_seconds != null && <span className="text-xs text-muted-foreground font-mono">{e.time_seconds}s</span>}
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </Card3D>
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
    const meta = user.user_metadata || {};
    await supabase.from("mini_game_scores").insert({
      user_id: user.id,
      game_type: gameType,
      score,
      time_seconds: timeSeconds ?? null,
      discord_username: meta.discord_username || meta.full_name || "Player",
      discord_id: meta.discord_id || null,
      discord_avatar: meta.avatar || null,
    });
    toast({ title: "Score submitted! 🎉" });
  }, [toast]);
};

// ─── Game Shell (shared wrapper with timer + back) ───────
const GameShell = ({ children, onBack, title, icon, gradient, timer, badges }: {
  children: React.ReactNode; onBack: () => void; title: string;
  icon: React.ReactNode; gradient: string; timer?: React.ReactNode;
  badges?: React.ReactNode;
}) => (
  <div className="space-y-5">
    <div className="flex items-center justify-between flex-wrap gap-3">
      <Button variant="ghost" onClick={onBack} className="gap-2"><ArrowLeft className="w-4 h-4" /> Back</Button>
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-lg bg-gradient-to-r ${gradient}`}>{icon}</div>
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      <div className="flex items-center gap-2">{badges}{timer}</div>
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

// ─── Timer Badge ─────────────────────────────────────────
const TimerBadge = ({ seconds, danger = 30 }: { seconds: number; danger?: number }) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return (
    <Badge className={`font-mono text-base px-3 py-1 ${seconds <= danger ? "bg-red-600 animate-pulse" : "bg-muted/60"}`}>
      <Clock className="w-3.5 h-3.5 mr-1.5" />
      {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </Badge>
  );
};

// ════════════════════════════════════════════════════════
// GAME 1: ESCAPE ROOM (3D Room)
// ════════════════════════════════════════════════════════
const ROOM_OBJECTS = [
  { id: "desk", label: "Old Desk", icon: "🗄️", hint: "Check the drawers...", x: 10, y: 55 },
  { id: "painting", label: "Painting", icon: "🖼️", hint: "Something behind it...", x: 70, y: 15 },
  { id: "clock", label: "Wall Clock", icon: "🕐", hint: "The time shows 1-3-3-7", x: 40, y: 10 },
  { id: "safe", label: "Floor Safe", icon: "🔒", hint: "Needs a 4-digit code", x: 75, y: 65 },
  { id: "bookshelf", label: "Bookshelf", icon: "📚", hint: "A book title is encrypted...", x: 15, y: 20 },
  { id: "vent", label: "Air Vent", icon: "🌀", hint: "Something glints inside", x: 50, y: 75 },
  { id: "window", label: "Barred Window", icon: "🪟", hint: "Moonlight reveals letters", x: 85, y: 35 },
  { id: "door", label: "Exit Door", icon: "🚪", hint: "Locked — solve all puzzles first", x: 50, y: 45 },
];

const EscapeRoomGame = ({ onBack }: { onBack: () => void }) => {
  const [timeLeft, setTimeLeft] = useState(600);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [activeObject, setActiveObject] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [riddleAnswer, setRiddleAnswer] = useState("");
  const [decryptInput, setDecryptInput] = useState("");
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

  const completePuzzle = (id: string) => {
    setCompleted(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const canEscape = completed.has("code") && completed.has("riddle") && completed.has("decrypt") && foundKey;

  const handleEscape = () => {
    if (!canEscape) return;
    setWon(true); setGameOver(true); clearInterval(intervalRef.current);
    const elapsed = 600 - timeLeft;
    submitScore("escape_room", Math.max(100, 1000 - elapsed * 2), elapsed);
  };

  const reset = () => {
    setStarted(false); setTimeLeft(600); setCompleted(new Set());
    setGameOver(false); setWon(false); setActiveObject(null);
    setCodeInput(""); setRiddleAnswer(""); setDecryptInput("");
    setFoundKey(false); setFoundClue(false);
  };

  if (!started) return <StartScreen title={game.title} description={game.description} icon={<Lock className="w-14 h-14" />} gradient={game.gradient} glow={game.glow} onStart={() => setStarted(true)} onBack={onBack} gameType="escape_room" />;
  if (gameOver) return <EndScreen won={won} title={won ? "You Escaped! 🎉" : "Time's Up!"} subtitle={won ? `Escaped in ${Math.floor((600 - timeLeft) / 60)}m ${(600 - timeLeft) % 60}s` : "You didn't escape in time."} onReplay={reset} onBack={onBack} gameType="escape_room" />;

  return (
    <GameShell onBack={onBack} title="Escape Room" icon={<Lock className="w-5 h-5 text-foreground" />} gradient={game.gradient} timer={<TimerBadge seconds={timeLeft} />}>
      {/* 3D Room */}
      <Card className="border-red-500/20 overflow-hidden relative" style={{ perspective: "1200px" }}>
        <div className="relative min-h-[400px] bg-gradient-to-b from-[hsl(220,20%,12%)] via-[hsl(220,18%,10%)] to-[hsl(220,22%,8%)] overflow-hidden"
          style={{ transformStyle: "preserve-3d" }}>
          {/* Room floor perspective */}
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-b from-transparent to-[hsl(25,30%,12%)]"
            style={{ transform: "perspective(600px) rotateX(30deg)", transformOrigin: "bottom" }}>
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: "repeating-linear-gradient(90deg, hsl(0,0%,30%) 0px, transparent 1px, transparent 60px), repeating-linear-gradient(0deg, hsl(0,0%,30%) 0px, transparent 1px, transparent 60px)",
            }} />
          </div>
          {/* Wall lines */}
          <div className="absolute top-0 left-0 right-0 h-1/2 opacity-10"
            style={{ backgroundImage: "repeating-linear-gradient(0deg, hsl(0,0%,40%) 0px, transparent 1px, transparent 40px)" }} />
          {/* Ambient light */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-60 h-60 rounded-full bg-amber-500/10 blur-3xl" />

          {/* Room objects */}
          {ROOM_OBJECTS.map(obj => {
            const isCompleted = obj.id === "desk" ? foundKey : obj.id === "painting" ? foundClue :
              obj.id === "clock" ? completed.has("code") : obj.id === "safe" ? completed.has("code") :
              obj.id === "bookshelf" ? completed.has("decrypt") : obj.id === "vent" ? foundKey :
              obj.id === "door" ? (won) : false;
            const isActive = activeObject === obj.id;
            return (
              <motion.div key={obj.id}
                className={`absolute cursor-pointer select-none transition-all duration-200 ${isActive ? "z-20 scale-110" : "z-10 hover:scale-105"}`}
                style={{ left: `${obj.x}%`, top: `${obj.y}%`, transform: "translate(-50%, -50%)" }}
                whileHover={{ y: -4 }} whileTap={{ scale: 0.95 }}
                onClick={() => setActiveObject(isActive ? null : obj.id)}>
                <div className={`flex flex-col items-center gap-1 p-2 rounded-xl backdrop-blur-sm border transition-all ${
                  isCompleted ? "bg-green-500/20 border-green-500/40 shadow-lg shadow-green-500/20" :
                  isActive ? "bg-primary/20 border-primary/40 shadow-lg shadow-primary/20" :
                  "bg-muted/30 border-border/30 hover:border-primary/30"
                }`}>
                  <span className="text-2xl" style={{ transform: "translateZ(10px)" }}>{obj.icon}</span>
                  <span className="text-[10px] font-medium whitespace-nowrap">{obj.label}</span>
                  {isCompleted && <CheckCircle className="w-3 h-3 text-green-400 absolute -top-1 -right-1" />}
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>

      {/* Interaction panel */}
      <AnimatePresence mode="wait">
        {activeObject && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }}>
            <Card className="border-primary/30 bg-card/90 backdrop-blur-xl">
              <CardContent className="p-5 space-y-4">
                {activeObject === "clock" || activeObject === "safe" ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Eye className="w-4 h-4" /> {activeObject === "clock" ? "The clock hands point to 1, 3, 3, 7..." : "The safe needs a 4-digit code."}
                    </div>
                    {!completed.has("code") ? (
                      <div className="flex gap-2">
                        <input value={codeInput} onChange={e => setCodeInput(e.target.value)} maxLength={4} placeholder="_ _ _ _"
                          className="flex-1 bg-muted/30 border border-border/50 rounded-xl px-4 py-2.5 text-center font-mono tracking-[0.5em] text-lg" />
                        <Button onClick={() => { if (codeInput === "1337") completePuzzle("code"); }}>Unlock</Button>
                      </div>
                    ) : <p className="text-green-400 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Code: 1337 — Safe opened!</p>}
                  </>
                ) : activeObject === "bookshelf" ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BookOpen className="w-4 h-4" /> A book title reads: "ONAQVG" — it's ROT13 encrypted.
                    </div>
                    {!completed.has("decrypt") ? (
                      <div className="flex gap-2">
                        <input value={decryptInput} onChange={e => setDecryptInput(e.target.value)} placeholder="Decrypted word..."
                          className="flex-1 bg-muted/30 border border-border/50 rounded-xl px-4 py-2.5 text-sm" />
                        <Button onClick={() => { if (decryptInput.toLowerCase().trim() === "bandit") completePuzzle("decrypt"); }}>Decrypt</Button>
                      </div>
                    ) : <p className="text-green-400 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Decrypted: BANDIT</p>}
                  </>
                ) : activeObject === "painting" ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><Lightbulb className="w-4 h-4" /> Behind the painting: "What has keys but no locks?"</div>
                    {!completed.has("riddle") ? (
                      <div className="flex gap-2">
                        <input value={riddleAnswer} onChange={e => setRiddleAnswer(e.target.value)} placeholder="Answer..."
                          className="flex-1 bg-muted/30 border border-border/50 rounded-xl px-4 py-2.5 text-sm" />
                        <Button onClick={() => { const a = riddleAnswer.toLowerCase().trim(); if (a === "keyboard" || a === "a keyboard" || a === "piano" || a === "a piano") completePuzzle("riddle"); }}>Answer</Button>
                      </div>
                    ) : <p className="text-green-400 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Riddle solved!</p>}
                  </>
                ) : activeObject === "vent" || activeObject === "desk" ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><Search className="w-4 h-4" /> {activeObject === "vent" ? "You see something glinting inside the vent..." : "The desk drawer has something..."}</div>
                    {!foundKey ? (
                      <Button onClick={() => setFoundKey(true)} className="bg-gradient-to-r from-amber-500 to-yellow-500 border-0">
                        <Key className="w-4 h-4 mr-2" /> Grab the Key
                      </Button>
                    ) : <p className="text-green-400 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Key obtained! 🔑</p>}
                  </>
                ) : activeObject === "door" ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><DoorOpen className="w-4 h-4" /> The exit door. {canEscape ? "All puzzles solved — you can escape!" : "Solve all puzzles first."}</div>
                    <Button disabled={!canEscape} onClick={handleEscape} className={`w-full ${canEscape ? "bg-gradient-to-r from-green-500 to-emerald-500 border-0 animate-pulse" : ""}`}>
                      {canEscape ? "🚪 ESCAPE NOW!" : "🔒 Locked"}
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {ROOM_OBJECTS.find(o => o.id === activeObject)?.hint}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: "Code", done: completed.has("code"), icon: "🔢" },
          { label: "Riddle", done: completed.has("riddle"), icon: "💡" },
          { label: "Decrypt", done: completed.has("decrypt"), icon: "🔐" },
          { label: "Key", done: foundKey, icon: "🔑" },
        ].map(t => (
          <div key={t.label} className={`flex items-center gap-2 p-2.5 rounded-xl border text-sm ${t.done ? "bg-green-500/15 border-green-500/30" : "bg-muted/15 border-border/30"}`}>
            <span>{t.icon}</span>
            <span className={t.done ? "line-through text-green-400" : ""}>{t.label}</span>
            {t.done && <CheckCircle className="w-3.5 h-3.5 text-green-400 ml-auto" />}
          </div>
        ))}
      </div>
    </GameShell>
  );
};

// ════════════════════════════════════════════════════════
// GAME 2: MEMORY MATCH (3D Flip Cards)
// ════════════════════════════════════════════════════════
const MEMORY_EMOJIS = ["🚗", "🔫", "💰", "🏠", "👮", "🚑", "⚖️", "🎭"];

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
      badges={<><Badge variant="outline">Moves: {moves}</Badge><Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />{elapsed}s</Badge></>}>
      <div className="grid grid-cols-4 gap-3 max-w-lg mx-auto" style={{ perspective: "800px" }}>
        {cards.map(card => (
          <div key={card.id} className="aspect-square cursor-pointer" style={{ perspective: "400px" }} onClick={() => handleClick(card.id)}>
            <motion.div
              className="w-full h-full relative"
              style={{ transformStyle: "preserve-3d" }}
              animate={{ rotateY: card.flipped || card.matched ? 180 : 0 }}
              transition={{ duration: 0.4, type: "spring" }}>
              {/* Front (hidden) */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-600/40 to-fuchsia-600/40 border-2 border-purple-500/30 flex items-center justify-center text-2xl font-bold backface-hidden"
                style={{ backfaceVisibility: "hidden" }}>
                <span className="text-purple-300">?</span>
              </div>
              {/* Back (emoji) */}
              <div className={`absolute inset-0 rounded-xl border-2 flex items-center justify-center text-3xl backface-hidden ${
                card.matched ? "bg-green-500/20 border-green-500/40" : "bg-primary/15 border-primary/40"
              }`} style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                {card.emoji}
              </div>
            </motion.div>
          </div>
        ))}
      </div>
    </GameShell>
  );
};

// ════════════════════════════════════════════════════════
// GAME 3: REACTION TEST (3D Orb)
// ════════════════════════════════════════════════════════
const ReactionTestGame = ({ onBack }: { onBack: () => void }) => {
  const [state, setState] = useState<"waiting" | "ready" | "go" | "result" | "early">("waiting");
  const [times, setTimes] = useState<number[]>([]);
  const [goTime, setGoTime] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const submitScore = useSubmitScore();
  const game = GAMES[2];

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
      <Button variant="ghost" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
      <motion.div
        className={`min-h-[420px] rounded-3xl flex flex-col items-center justify-center cursor-pointer border-2 transition-colors relative overflow-hidden ${
          state === "ready" ? "border-red-500 bg-gradient-to-b from-red-500/10 to-red-900/20" :
          state === "go" ? "border-green-500 bg-gradient-to-b from-green-500/10 to-green-900/20" :
          state === "early" ? "border-yellow-500 bg-gradient-to-b from-yellow-500/10 to-yellow-900/20" :
          state === "result" ? "border-primary bg-gradient-to-b from-primary/10 to-primary/5" :
          "border-border/50 bg-muted/10"
        }`}
        onClick={handleClick} whileTap={{ scale: 0.98 }}
        style={{ perspective: "600px" }}>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />
        {state === "waiting" && <>
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 shadow-2xl shadow-yellow-500/40 mb-6"
            style={{ transform: "perspective(400px) translateZ(20px)" }} />
          <h3 className="text-2xl font-bold">Click to Start</h3>
          <p className="text-muted-foreground mt-2">Round {times.length + 1}/5</p>
        </>}
        {state === "ready" && <>
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-red-500 to-rose-600 shadow-2xl shadow-red-500/50 animate-pulse mb-6" />
          <h3 className="text-2xl font-bold text-red-400">Wait for green...</h3>
        </>}
        {state === "go" && <>
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-2xl shadow-green-500/50 mb-6" />
          <h3 className="text-2xl font-bold text-green-400">CLICK NOW!</h3>
        </>}
        {state === "early" && <>
          <XCircle className="w-16 h-16 text-yellow-400 mb-4" />
          <h3 className="text-2xl font-bold text-yellow-400">Too Early!</h3>
          <p className="text-muted-foreground mt-2">Click to restart</p>
        </>}
        {state === "result" && <>
          <Trophy className="w-16 h-16 text-yellow-400 mb-4" />
          <h3 className="text-2xl font-bold">Average: {avg}ms</h3>
          <div className="flex gap-2 mt-3">{times.map((t, i) => <Badge key={i} variant="outline" className="font-mono">{t}ms</Badge>)}</div>
          <p className="text-muted-foreground mt-4">Click to play again</p>
        </>}
      </motion.div>
      {times.length > 0 && state !== "result" && <div className="flex gap-2 justify-center">{times.map((t, i) => <Badge key={i} variant="outline" className="font-mono">{t}ms</Badge>)}</div>}
      {state === "result" && <Leaderboard gameType="reaction_test" />}
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
    setStarted(true); setTimeLeft(120); setStartTime(Date.now());
  };

  useEffect(() => {
    if (!started || gameOver) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current); setGameOver(true);
          submitScore("trivia_quiz", score * 100, Math.floor((Date.now() - startTime) / 1000));
          return 0;
        }
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
      badges={<><Badge variant="outline">Q{current + 1}/10</Badge><Badge variant="secondary">{score} ✓</Badge></>}>
      <Card3D>
        <Card className="border-cyan-500/20 bg-card/80 backdrop-blur-xl">
          <CardContent className="p-8">
            <h3 className="text-xl font-bold mb-6">{q.q}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {q.options.map((opt, i) => (
                <motion.button key={i} whileHover={{ scale: selected === null ? 1.02 : 1 }} whileTap={{ scale: 0.97 }}
                  className={`p-4 rounded-xl border-2 text-left transition-all font-medium ${
                    selected === null ? "border-border/50 hover:border-cyan-500/50 bg-muted/20 hover:bg-cyan-500/10" :
                    i === q.answer ? "border-green-500 bg-green-500/20" :
                    i === selected ? "border-red-500 bg-red-500/20" :
                    "border-border/20 bg-muted/5 opacity-40"
                  }`} onClick={() => handleAnswer(i)} disabled={selected !== null}>
                  <span className="mr-2 text-muted-foreground">{["A", "B", "C", "D"][i]}.</span>{opt}
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>
      </Card3D>
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
const scramble = (word: string) => { let s = word.split("").sort(() => Math.random() - 0.5).join(""); return s === word ? scramble(word) : s; };

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
    setStarted(true); setTimeLeft(90); setStartTime(Date.now()); setGuess(""); setFeedback(null);
    setScrambled(scramble(shuffled[0].word));
  };

  useEffect(() => {
    if (!started || gameOver) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current); setGameOver(true);
          submitScore("word_scramble", score * 125, Math.floor((Date.now() - startTime) / 1000));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [started, gameOver, startTime, score, submitScore]);

  const checkAnswer = () => {
    if (guess.toUpperCase().trim() === words[current].word) {
      setFeedback("correct");
      const newScore = score + 1;
      setScore(newScore);
      setTimeout(() => {
        if (current + 1 >= words.length) {
          setGameOver(true); clearInterval(intervalRef.current);
          submitScore("word_scramble", newScore * 125, Math.floor((Date.now() - startTime) / 1000));
        } else {
          setCurrent(c => c + 1); setGuess(""); setFeedback(null);
          setScrambled(scramble(words[current + 1].word));
        }
      }, 800);
    } else { setFeedback("wrong"); setTimeout(() => setFeedback(null), 600); }
  };

  if (!started) return <StartScreen title={game.title} description={game.description} icon={<Shuffle className="w-14 h-14" />} gradient={game.gradient} glow={game.glow} onStart={initGame} onBack={onBack} gameType="word_scramble" />;
  if (gameOver) return <EndScreen won={score >= 4} title={`${score}/${words.length} Words!`} subtitle={`Score: ${score * 125} pts`} onReplay={initGame} onBack={onBack} gameType="word_scramble" />;

  return (
    <GameShell onBack={onBack} title="Word Scramble" icon={<Shuffle className="w-5 h-5 text-foreground" />} gradient={game.gradient}
      timer={<TimerBadge seconds={timeLeft} danger={20} />}
      badges={<><Badge variant="outline">Word {current + 1}/{words.length}</Badge><Badge variant="secondary">{score} solved</Badge></>}>
      <Card3D>
        <Card className={`border-2 transition-colors ${feedback === "correct" ? "border-green-500" : feedback === "wrong" ? "border-red-500" : "border-green-500/20"} bg-card/80 backdrop-blur-xl`}>
          <CardContent className="p-8 text-center space-y-6">
            <p className="text-sm text-muted-foreground">💡 Hint: {words[current].hint}</p>
            <div className="flex justify-center gap-2 flex-wrap" style={{ perspective: "500px" }}>
              {scrambled.split("").map((ch, i) => (
                <motion.span key={i} initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}
                  className="w-12 h-14 flex items-center justify-center bg-gradient-to-b from-green-500/20 to-emerald-600/20 border-2 border-green-500/30 rounded-xl text-2xl font-bold font-mono shadow-lg shadow-green-500/10">
                  {ch}
                </motion.span>
              ))}
            </div>
            <div className="flex gap-2 max-w-sm mx-auto">
              <input value={guess} onChange={e => setGuess(e.target.value)} onKeyDown={e => e.key === "Enter" && checkAnswer()}
                placeholder="Your answer..." className="flex-1 bg-muted/30 border border-border/50 rounded-xl px-4 py-2.5 text-center font-mono tracking-widest uppercase" autoFocus />
              <Button onClick={checkAnswer} className="bg-gradient-to-r from-green-500 to-emerald-500 border-0">Check</Button>
            </div>
          </CardContent>
        </Card>
      </Card3D>
    </GameShell>
  );
};

// ════════════════════════════════════════════════════════
// GAME 6: SPEED TYPER
// ════════════════════════════════════════════════════════
const TYPING_WORDS = ["police", "suspect", "arrest", "vehicle", "pursuit", "warrant", "evidence", "robbery",
  "mechanic", "hospital", "dispatch", "smuggle", "corrupt", "gangster", "hostage", "criminal",
  "detective", "undercover", "blackmarket", "courthouse"];

const SpeedTyperGame = ({ onBack }: { onBack: () => void }) => {
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [words, setWords] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [startTime, setStartTime] = useState(0);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const submitScore = useSubmitScore();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const game = GAMES[5];

  const initGame = () => {
    const shuffled = [...TYPING_WORDS].sort(() => Math.random() - 0.5);
    setWords(shuffled); setCurrent(0); setInput(""); setScore(0);
    setGameOver(false); setStarted(true); setTimeLeft(60); setStartTime(Date.now()); setCorrect(null);
  };

  useEffect(() => {
    if (!started || gameOver) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current); setGameOver(true);
          submitScore("speed_typer", score * 50, Math.floor((Date.now() - startTime) / 1000));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [started, gameOver, startTime, score, submitScore]);

  const handleInput = (val: string) => {
    setInput(val);
    if (val.toLowerCase().trim() === words[current]) {
      setCorrect(true); setScore(s => s + 1);
      setTimeout(() => {
        if (current + 1 >= words.length) {
          setGameOver(true); clearInterval(intervalRef.current);
          submitScore("speed_typer", (score + 1) * 50, Math.floor((Date.now() - startTime) / 1000));
        } else { setCurrent(c => c + 1); setInput(""); setCorrect(null); }
      }, 200);
    }
  };

  if (!started) return <StartScreen title={game.title} description={game.description} icon={<Keyboard className="w-14 h-14" />} gradient={game.gradient} glow={game.glow} onStart={initGame} onBack={onBack} gameType="speed_typer" />;
  if (gameOver) return <EndScreen won={score >= 10} title={`${score} Words Typed!`} subtitle={`Score: ${score * 50} pts`} onReplay={initGame} onBack={onBack} gameType="speed_typer" />;

  return (
    <GameShell onBack={onBack} title="Speed Typer" icon={<Keyboard className="w-5 h-5 text-foreground" />} gradient={game.gradient}
      timer={<TimerBadge seconds={timeLeft} />} badges={<Badge variant="secondary">{score} typed</Badge>}>
      <Card3D>
        <Card className="border-indigo-500/20 bg-card/80 backdrop-blur-xl">
          <CardContent className="p-10 text-center space-y-8">
            <div className="text-sm text-muted-foreground">Type the word:</div>
            <motion.div key={current} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="text-5xl font-bold font-mono tracking-wider bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent"
              style={{ textShadow: "0 0 30px hsl(240 80% 60% / 0.3)" }}>
              {words[current]}
            </motion.div>
            <input value={input} onChange={e => handleInput(e.target.value)} autoFocus
              className={`w-full max-w-md mx-auto bg-muted/30 border-2 rounded-xl px-6 py-3 text-center font-mono text-xl tracking-widest transition-colors ${
                correct ? "border-green-500" : "border-border/50 focus:border-indigo-500"
              }`} />
            <Progress value={(score / words.length) * 100} className="max-w-md mx-auto h-2" />
          </CardContent>
        </Card>
      </Card3D>
    </GameShell>
  );
};

// ════════════════════════════════════════════════════════
// GAME 7: COLOR MATCH
// ════════════════════════════════════════════════════════
const COLORS = [
  { name: "RED", color: "hsl(0 80% 55%)" },
  { name: "BLUE", color: "hsl(220 80% 55%)" },
  { name: "GREEN", color: "hsl(140 70% 45%)" },
  { name: "YELLOW", color: "hsl(50 90% 55%)" },
  { name: "PURPLE", color: "hsl(280 70% 55%)" },
  { name: "ORANGE", color: "hsl(25 90% 55%)" },
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
    setWordName(COLORS[nameIdx].name);
    setWordColor(COLORS[colorIdx].color);
    setFeedback(null);
  };

  const initGame = () => {
    setRound(0); setScore(0); setGameOver(false); setStarted(true); setTimeLeft(30);
    generateRound();
  };

  useEffect(() => {
    if (!started || gameOver) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(intervalRef.current); setGameOver(true); submitScore("color_match", score * 50); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [started, gameOver, score, submitScore]);

  const answer = (isMatch: boolean) => {
    if (feedback !== null) return;
    const actualMatch = wordName === COLORS.find(c => c.color === wordColor)?.name;
    const correct = isMatch === actualMatch;
    setFeedback(correct);
    if (correct) setScore(s => s + 1);
    setTimeout(() => {
      if (round + 1 >= totalRounds) {
        setGameOver(true); clearInterval(intervalRef.current);
        submitScore("color_match", (correct ? score + 1 : score) * 50);
      } else { setRound(r => r + 1); generateRound(); }
    }, 400);
  };

  if (!started) return <StartScreen title={game.title} description={game.description} icon={<Palette className="w-14 h-14" />} gradient={game.gradient} glow={game.glow} onStart={initGame} onBack={onBack} gameType="color_match" />;
  if (gameOver) return <EndScreen won={score >= 12} title={`${score}/${totalRounds} Correct!`} subtitle={`Score: ${score * 50} pts`} onReplay={initGame} onBack={onBack} gameType="color_match" />;

  return (
    <GameShell onBack={onBack} title="Color Match" icon={<Palette className="w-5 h-5 text-foreground" />} gradient={game.gradient}
      timer={<TimerBadge seconds={timeLeft} danger={10} />}
      badges={<><Badge variant="outline">Round {round + 1}/{totalRounds}</Badge><Badge variant="secondary">{score} ✓</Badge></>}>
      <Card3D>
        <Card className={`border-2 transition-colors ${feedback === true ? "border-green-500" : feedback === false ? "border-red-500" : "border-pink-500/20"} bg-card/80 backdrop-blur-xl`}>
          <CardContent className="p-10 text-center space-y-8">
            <p className="text-sm text-muted-foreground">Does the word match its display color?</p>
            <motion.div key={round} initial={{ scale: 0.5, rotateX: 90 }} animate={{ scale: 1, rotateX: 0 }} transition={{ type: "spring" }}
              className="text-6xl font-black tracking-wider" style={{ color: wordColor, textShadow: `0 0 30px ${wordColor}40` }}>
              {wordName}
            </motion.div>
            <div className="flex gap-4 justify-center">
              <Button size="lg" onClick={() => answer(true)} className="bg-gradient-to-r from-green-500 to-emerald-500 border-0 text-lg px-8">
                ✓ Match
              </Button>
              <Button size="lg" onClick={() => answer(false)} className="bg-gradient-to-r from-red-500 to-rose-500 border-0 text-lg px-8">
                ✗ No Match
              </Button>
            </div>
          </CardContent>
        </Card>
      </Card3D>
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

  const generatePattern = (lvl: number) => {
    const length = lvl + 2;
    const p: number[] = [];
    for (let i = 0; i < length; i++) p.push(Math.floor(Math.random() * 9));
    return p;
  };

  const showPattern = async (p: number[]) => {
    setShowing(true);
    for (let i = 0; i < p.length; i++) {
      await new Promise(r => setTimeout(r, 400));
      setActiveCell(p[i]);
      await new Promise(r => setTimeout(r, 500));
      setActiveCell(null);
    }
    setShowing(false);
  };

  const initGame = () => {
    setLevel(1); setScore(0); setGameOver(false); setStarted(true); setFeedback(null);
    const p = generatePattern(1);
    setPattern(p); setUserPattern([]);
    setTimeout(() => showPattern(p), 500);
  };

  const handleCellClick = (idx: number) => {
    if (showing || gameOver) return;
    setActiveCell(idx);
    setTimeout(() => setActiveCell(null), 200);
    const newUserPattern = [...userPattern, idx];
    setUserPattern(newUserPattern);

    if (newUserPattern[newUserPattern.length - 1] !== pattern[newUserPattern.length - 1]) {
      setFeedback("wrong"); setGameOver(true);
      submitScore("pattern_memory", score * 100, level);
      return;
    }

    if (newUserPattern.length === pattern.length) {
      setFeedback("correct");
      const newScore = score + 1;
      setScore(newScore);
      setTimeout(() => {
        if (level >= 10) {
          setGameOver(true);
          submitScore("pattern_memory", newScore * 100, level);
        } else {
          const nextLevel = level + 1;
          setLevel(nextLevel); setFeedback(null);
          const p = generatePattern(nextLevel);
          setPattern(p); setUserPattern([]);
          setTimeout(() => showPattern(p), 500);
        }
      }, 800);
    }
  };

  if (!started) return <StartScreen title={game.title} description={game.description} icon={<Grid3X3 className="w-14 h-14" />} gradient={game.gradient} glow={game.glow} onStart={initGame} onBack={onBack} gameType="pattern_memory" />;
  if (gameOver) return <EndScreen won={score >= 5} title={`Level ${level} Reached!`} subtitle={`Score: ${score * 100} pts`} onReplay={initGame} onBack={onBack} gameType="pattern_memory" />;

  return (
    <GameShell onBack={onBack} title="Pattern Memory" icon={<Grid3X3 className="w-5 h-5 text-foreground" />} gradient={game.gradient}
      badges={<><Badge variant="outline">Level {level}</Badge><Badge variant="secondary">{score} rounds</Badge>{showing && <Badge className="bg-amber-600 animate-pulse">Memorize!</Badge>}</>}>
      <Card3D>
        <Card className={`border-2 transition-colors ${feedback === "correct" ? "border-green-500" : feedback === "wrong" ? "border-red-500" : "border-teal-500/20"} bg-card/80 backdrop-blur-xl`}>
          <CardContent className="p-8">
            <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto" style={{ perspective: "500px" }}>
              {Array.from({ length: 9 }).map((_, i) => (
                <motion.button key={i} whileHover={{ scale: showing ? 1 : 1.05 }} whileTap={{ scale: 0.9 }}
                  className={`aspect-square rounded-xl border-2 transition-all text-2xl font-bold ${
                    activeCell === i ? "bg-gradient-to-br from-teal-400 to-cyan-400 border-teal-400 shadow-lg shadow-teal-400/40 scale-105" :
                    "bg-muted/30 border-border/40 hover:border-teal-500/40"
                  }`}
                  onClick={() => handleCellClick(i)} disabled={showing}
                  style={{ transform: activeCell === i ? "perspective(400px) translateZ(10px)" : "perspective(400px) translateZ(0)" }}>
                </motion.button>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              {showing ? `Memorize the pattern (${pattern.length} cells)...` : `Your turn: ${userPattern.length}/${pattern.length}`}
            </p>
          </CardContent>
        </Card>
      </Card3D>
    </GameShell>
  );
};

// ════════════════════════════════════════════════════════
// GAME 9: MATH BLITZ
// ════════════════════════════════════════════════════════
const MathBlitzGame = ({ onBack }: { onBack: () => void }) => {
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [problem, setProblem] = useState({ question: "", answer: 0 });
  const [options, setOptions] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const totalRounds = 20;
  const submitScore = useSubmitScore();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const game = GAMES[8];

  const generateProblem = () => {
    const ops = ["+", "-", "×"];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a: number, b: number, answer: number;
    if (op === "+") { a = Math.floor(Math.random() * 50) + 1; b = Math.floor(Math.random() * 50) + 1; answer = a + b; }
    else if (op === "-") { a = Math.floor(Math.random() * 50) + 20; b = Math.floor(Math.random() * 20) + 1; answer = a - b; }
    else { a = Math.floor(Math.random() * 12) + 2; b = Math.floor(Math.random() * 12) + 2; answer = a * b; }
    const opts = [answer];
    while (opts.length < 4) {
      const wrong = answer + (Math.floor(Math.random() * 20) - 10);
      if (wrong !== answer && !opts.includes(wrong) && wrong >= 0) opts.push(wrong);
    }
    setProblem({ question: `${a} ${op} ${b}`, answer });
    setOptions(opts.sort(() => Math.random() - 0.5));
    setFeedback(null);
  };

  const initGame = () => {
    setScore(0); setRound(0); setGameOver(false); setStarted(true); setTimeLeft(60);
    generateProblem();
  };

  useEffect(() => {
    if (!started || gameOver) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(intervalRef.current); setGameOver(true); submitScore("math_blitz", score * 50); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [started, gameOver, score, submitScore]);

  const handleAnswer = (val: number) => {
    if (feedback !== null) return;
    const correct = val === problem.answer;
    setFeedback(correct);
    if (correct) setScore(s => s + 1);
    setTimeout(() => {
      if (round + 1 >= totalRounds) {
        setGameOver(true); clearInterval(intervalRef.current);
        submitScore("math_blitz", (correct ? score + 1 : score) * 50);
      } else { setRound(r => r + 1); generateProblem(); }
    }, 400);
  };

  if (!started) return <StartScreen title={game.title} description={game.description} icon={<Calculator className="w-14 h-14" />} gradient={game.gradient} glow={game.glow} onStart={initGame} onBack={onBack} gameType="math_blitz" />;
  if (gameOver) return <EndScreen won={score >= 12} title={`${score}/${totalRounds} Correct!`} subtitle={`Score: ${score * 50} pts`} onReplay={initGame} onBack={onBack} gameType="math_blitz" />;

  return (
    <GameShell onBack={onBack} title="Math Blitz" icon={<Calculator className="w-5 h-5 text-foreground" />} gradient={game.gradient}
      timer={<TimerBadge seconds={timeLeft} danger={15} />}
      badges={<><Badge variant="outline">Q{round + 1}/{totalRounds}</Badge><Badge variant="secondary">{score} ✓</Badge></>}>
      <Card3D>
        <Card className="border-orange-500/20 bg-card/80 backdrop-blur-xl">
          <CardContent className="p-10 text-center space-y-8">
            <motion.div key={round} initial={{ scale: 0.5, rotateX: 90 }} animate={{ scale: 1, rotateX: 0 }} transition={{ type: "spring" }}
              className="text-6xl font-bold font-mono bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              {problem.question} = ?
            </motion.div>
            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
              {options.map((opt, i) => (
                <motion.button key={i} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className={`p-4 rounded-xl border-2 text-xl font-bold font-mono transition-all ${
                    feedback === null ? "border-border/50 hover:border-orange-500/50 bg-muted/20" :
                    opt === problem.answer ? "border-green-500 bg-green-500/20" :
                    "border-border/20 bg-muted/5 opacity-40"
                  }`} onClick={() => handleAnswer(opt)} disabled={feedback !== null}>
                  {opt}
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>
      </Card3D>
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
    const size = 30 + Math.random() * 30;
    const x = Math.random() * 80 + 5;
    const y = Math.random() * 75 + 5;
    setTargets(prev => [...prev.slice(-8), { id, x, y, size }]);
    // Auto-remove after 2s
    setTimeout(() => setTargets(prev => {
      if (prev.find(t => t.id === id)) { setMisses(m => m + 1); return prev.filter(t => t.id !== id); }
      return prev;
    }), 2000);
  };

  const initGame = () => {
    setHits(0); setMisses(0); setTargets([]); setGameOver(false); setStarted(true);
    setTimeLeft(30); setStartTime(Date.now()); nextId.current = 0;
  };

  useEffect(() => {
    if (!started || gameOver) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current); clearInterval(spawnRef.current);
          setGameOver(true); submitScore("aim_trainer", hits * 100 - misses * 20, Math.floor((Date.now() - startTime) / 1000));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    spawnRef.current = setInterval(spawnTarget, 700);
    return () => { clearInterval(intervalRef.current); clearInterval(spawnRef.current); };
  }, [started, gameOver, hits, misses, startTime, submitScore]);

  const hitTarget = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setTargets(prev => prev.filter(t => t.id !== id));
    setHits(h => h + 1);
  };

  if (!started) return <StartScreen title={game.title} description={game.description} icon={<Crosshair className="w-14 h-14" />} gradient={game.gradient} glow={game.glow} onStart={initGame} onBack={onBack} gameType="aim_trainer" />;
  if (gameOver) return <EndScreen won={hits >= 20} title={`${hits} Hits!`} subtitle={`Score: ${Math.max(0, hits * 100 - misses * 20)} pts | Misses: ${misses}`} onReplay={initGame} onBack={onBack} gameType="aim_trainer" />;

  return (
    <GameShell onBack={onBack} title="Aim Trainer" icon={<Crosshair className="w-5 h-5 text-foreground" />} gradient={game.gradient}
      timer={<TimerBadge seconds={timeLeft} danger={10} />}
      badges={<><Badge variant="secondary" className="bg-green-500/20 text-green-400">🎯 {hits}</Badge><Badge variant="outline" className="text-red-400">✗ {misses}</Badge></>}>
      <Card className="border-lime-500/20 bg-card/80 backdrop-blur-xl overflow-hidden">
        <div className="relative min-h-[400px] cursor-crosshair bg-gradient-to-b from-[hsl(220,20%,8%)] to-[hsl(220,20%,12%)]"
          style={{ perspective: "800px" }}>
          {/* Grid lines for depth */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: "repeating-linear-gradient(90deg, hsl(140,60%,50%) 0px, transparent 1px, transparent 80px), repeating-linear-gradient(0deg, hsl(140,60%,50%) 0px, transparent 1px, transparent 80px)",
          }} />
          {targets.map(t => (
            <motion.div key={t.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0 }}
              className="absolute cursor-pointer"
              style={{ left: `${t.x}%`, top: `${t.y}%`, width: t.size, height: t.size }}
              onClick={(e) => hitTarget(t.id, e)}>
              <div className="w-full h-full rounded-full bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/50 flex items-center justify-center border-2 border-red-400/50 hover:scale-110 transition-transform">
                <Crosshair className="w-1/2 h-1/2 text-foreground/80" />
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </GameShell>
  );
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
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary via-purple-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-primary/30"
                    style={{ transform: "perspective(600px) rotateX(5deg) rotateY(-5deg)" }}>
                    <Gamepad2 className="w-10 h-10 text-foreground" />
                  </div>
                </motion.div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                  Mini Games Arena
                </h1>
                <p className="text-muted-foreground max-w-lg mx-auto text-lg">
                  10 unique games with live leaderboards. Compete for the top spot!
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 max-w-6xl mx-auto">
                {GAMES.map((game, i) => (
                  <motion.div key={game.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card3D className="cursor-pointer h-full" onClick={() => setActiveGame(game.id)}>
                      <Card className="bg-card/70 backdrop-blur-xl border-border/30 hover:border-primary/30 transition-all h-full overflow-hidden relative group">
                        <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
                        <CardHeader className="text-center pb-2 relative z-10">
                          <div className={`w-16 h-16 mx-auto mb-3 rounded-xl bg-gradient-to-br ${game.gradient} flex items-center justify-center shadow-xl ${game.glow}`}
                            style={{ transform: "translateZ(15px)" }}>
                            <div className="text-foreground">{game.icon}</div>
                          </div>
                          <CardTitle className="text-lg">{game.title}</CardTitle>
                          <CardDescription className="text-xs">{game.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="text-center pb-5 relative z-10">
                          <Button variant="outline" size="sm" className="border-primary/30 hover:bg-primary/10">
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
