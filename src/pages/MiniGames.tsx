import { useState, useEffect, useCallback, useRef, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import { 
  Gamepad2, Trophy, Clock, ArrowLeft, Brain, Zap, BookOpen, 
  Shuffle, Target, Lock, Search, Eye, CheckCircle, XCircle, Star
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

type GameType = "escape_room" | "memory_match" | "reaction_test" | "trivia_quiz" | "word_scramble";

interface GameDef {
  id: GameType;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
}

const GAMES: GameDef[] = [
  { id: "escape_room", title: "Escape Room", description: "Find codes, solve riddles & escape in 10 minutes!", icon: <Lock className="w-8 h-8" />, color: "text-red-400", borderColor: "border-red-500/30" },
  { id: "memory_match", title: "Memory Match", description: "Find all matching pairs as fast as possible.", icon: <Brain className="w-8 h-8" />, color: "text-purple-400", borderColor: "border-purple-500/30" },
  { id: "reaction_test", title: "Reaction Test", description: "Test your reflexes — click when the screen turns green!", icon: <Zap className="w-8 h-8" />, color: "text-yellow-400", borderColor: "border-yellow-500/30" },
  { id: "trivia_quiz", title: "RP Trivia Quiz", description: "Answer 10 RP knowledge questions against the clock.", icon: <BookOpen className="w-8 h-8" />, color: "text-cyan-400", borderColor: "border-cyan-500/30" },
  { id: "word_scramble", title: "Word Scramble", description: "Unscramble RP-themed words before time runs out!", icon: <Shuffle className="w-8 h-8" />, color: "text-green-400", borderColor: "border-green-500/30" },
];

// ─── Leaderboard Component ───────────────────────────────
const Leaderboard = memo(({ gameType }: { gameType: GameType }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("mini_game_scores")
        .select("*")
        .eq("game_type", gameType)
        .order("score", { ascending: false })
        .order("time_seconds", { ascending: true })
        .limit(10);
      if (data) setEntries(data as LeaderboardEntry[]);
    };
    fetch();
  }, [gameType]);

  return (
    <Card className="bg-card/60 backdrop-blur border-border/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-400" /> Top 10</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {entries.length === 0 && <p className="text-muted-foreground text-sm">No scores yet. Be the first!</p>}
        {entries.map((e, i) => (
          <div key={e.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20">
            <span className={`font-bold w-6 text-center ${i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-600" : "text-muted-foreground"}`}>
              {i + 1}
            </span>
            {e.discord_id && e.discord_avatar ? (
              <img src={`https://cdn.discordapp.com/avatars/${e.discord_id}/${e.discord_avatar}.png?size=32`} className="w-6 h-6 rounded-full" alt="" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-muted" />
            )}
            <span className="flex-1 truncate text-sm">{e.discord_username || "Anonymous"}</span>
            <Badge variant="secondary" className="text-xs">{e.score} pts</Badge>
            {e.time_seconds != null && <span className="text-xs text-muted-foreground">{e.time_seconds}s</span>}
          </div>
        ))}
      </CardContent>
    </Card>
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

// ════════════════════════════════════════════════════════
// GAME 1: ESCAPE ROOM
// ════════════════════════════════════════════════════════
const ESCAPE_TASKS = [
  { id: "code", label: "Find the 4-digit code", hint: "Look for numbers hidden in the room..." },
  { id: "riddle", label: "Solve the riddle", hint: "What has keys but no locks?" },
  { id: "object", label: "Find the hidden key", hint: "Click on suspicious objects..." },
  { id: "decrypt", label: "Decrypt the message", hint: "Reverse the cipher text..." },
  { id: "escape", label: "Open the exit door", hint: "Use everything you've found!" },
];

const EscapeRoomGame = ({ onBack }: { onBack: () => void }) => {
  const [timeLeft, setTimeLeft] = useState(600);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [riddleAnswer, setRiddleAnswer] = useState("");
  const [decryptInput, setDecryptInput] = useState("");
  const [foundKey, setFoundKey] = useState(false);
  const submitScore = useSubmitScore();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (!started || gameOver) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [started, gameOver]);

  const complete = (taskId: string) => {
    setCompleted(prev => {
      const next = new Set(prev);
      next.add(taskId);
      if (taskId === "escape" && next.size === 5) {
        setWon(true);
        setGameOver(true);
        clearInterval(intervalRef.current);
        const elapsed = 600 - timeLeft;
        const score = Math.max(100, 1000 - elapsed * 2);
        submitScore("escape_room", score, elapsed);
      }
      return next;
    });
  };

  const canEscape = completed.has("code") && completed.has("riddle") && completed.has("object") && completed.has("decrypt");
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (!started) return (
    <div className="text-center space-y-6 py-12">
      <Lock className="w-20 h-20 mx-auto text-red-400 animate-pulse" />
      <h2 className="text-3xl font-bold">San Andreas Blackmail Escape</h2>
      <p className="text-muted-foreground max-w-md mx-auto">You've been locked in a room. Find the 4-digit code, solve riddles, find hidden objects, and decrypt a message to escape — all within 10 minutes!</p>
      <Button size="lg" className="bg-red-600 hover:bg-red-700" onClick={() => { setStarted(true); startTimeRef.current = Date.now(); }}>
        Start Escape Room
      </Button>
      <Button variant="ghost" onClick={onBack} className="ml-4"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
    </div>
  );

  if (gameOver) return (
    <div className="text-center space-y-6 py-12">
      {won ? (
        <>
          <CheckCircle className="w-20 h-20 mx-auto text-green-400" />
          <h2 className="text-3xl font-bold text-green-400">You Escaped! 🎉</h2>
          <p className="text-muted-foreground">Time: {Math.floor((600 - timeLeft) / 60)}m {(600 - timeLeft) % 60}s</p>
        </>
      ) : (
        <>
          <XCircle className="w-20 h-20 mx-auto text-red-400" />
          <h2 className="text-3xl font-bold text-red-400">Time's Up!</h2>
          <p className="text-muted-foreground">You didn't escape in time. Try again!</p>
        </>
      )}
      <div className="flex gap-4 justify-center">
        <Button onClick={() => { setStarted(false); setTimeLeft(600); setCompleted(new Set()); setGameOver(false); setWon(false); setCodeInput(""); setRiddleAnswer(""); setDecryptInput(""); setFoundKey(false); }}>
          Play Again
        </Button>
        <Button variant="outline" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
      </div>
      <Leaderboard gameType="escape_room" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
        <div className="text-3xl font-mono font-bold text-red-400">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>
      </div>
      
      {/* Room Visual */}
      <Card className="bg-card/60 border-red-500/20 relative overflow-hidden min-h-[300px]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
        <CardContent className="p-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Clickable room objects */}
            <motion.div whileHover={{ scale: 1.05 }} className={`p-4 rounded-lg border cursor-pointer text-center transition-all ${foundKey ? "bg-green-500/20 border-green-500/50" : "bg-muted/30 border-border/50 hover:border-primary/50"}`}
              onClick={() => { if (!foundKey) { setFoundKey(true); complete("object"); } }}>
              <Search className="w-8 h-8 mx-auto mb-2 text-amber-400" />
              <p className="text-xs">{foundKey ? "✅ Key Found!" : "Suspicious Drawer"}</p>
            </motion.div>
            <div className="p-4 rounded-lg border bg-muted/30 border-border/50">
              <Eye className="w-8 h-8 mx-auto mb-2 text-blue-400" />
              <p className="text-xs text-muted-foreground">Code: Look at the wall → <span className="text-primary font-bold">1</span>3<span className="text-primary font-bold">3</span>7</p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/30 border-border/50">
              <Target className="w-8 h-8 mx-auto mb-2 text-purple-400" />
              <p className="text-xs text-muted-foreground">Cipher: "ONAQIB" (ROT13)</p>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} className={`p-4 rounded-lg border cursor-pointer text-center transition-all ${canEscape && !completed.has("escape") ? "bg-green-500/20 border-green-500/50 animate-pulse" : completed.has("escape") ? "bg-green-500/30 border-green-500" : "bg-muted/10 border-border/30 opacity-50"}`}
              onClick={() => { if (canEscape) complete("escape"); }}>
              <Lock className={`w-8 h-8 mx-auto mb-2 ${canEscape ? "text-green-400" : "text-muted-foreground"}`} />
              <p className="text-xs">{completed.has("escape") ? "✅ Escaped!" : canEscape ? "🚪 Click to Escape!" : "🔒 Locked"}</p>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* Task Checklist */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-card/60 border-border/30">
          <CardHeader className="pb-2"><CardTitle className="text-base">Task Checklist</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {ESCAPE_TASKS.map(t => (
              <div key={t.id} className={`flex items-center gap-2 text-sm ${completed.has(t.id) ? "text-green-400 line-through" : ""}`}>
                {completed.has(t.id) ? <CheckCircle className="w-4 h-4 text-green-400" /> : <div className="w-4 h-4 rounded-full border border-muted-foreground" />}
                {t.label}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-card/60 border-border/30">
          <CardHeader className="pb-2"><CardTitle className="text-base">Solve Puzzles</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {/* Code input */}
            {!completed.has("code") && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Enter 4-digit code:</label>
                <div className="flex gap-2">
                  <input value={codeInput} onChange={e => setCodeInput(e.target.value)} maxLength={4} placeholder="____" className="flex-1 bg-muted/30 border border-border/50 rounded px-3 py-1.5 text-sm font-mono tracking-widest" />
                  <Button size="sm" onClick={() => { if (codeInput === "1337") complete("code"); }}>Check</Button>
                </div>
              </div>
            )}
            {completed.has("code") && <p className="text-green-400 text-sm">✅ Code: 1337</p>}

            {/* Riddle */}
            {!completed.has("riddle") && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Riddle: What has keys but no locks?</label>
                <div className="flex gap-2">
                  <input value={riddleAnswer} onChange={e => setRiddleAnswer(e.target.value)} placeholder="Answer..." className="flex-1 bg-muted/30 border border-border/50 rounded px-3 py-1.5 text-sm" />
                  <Button size="sm" onClick={() => { if (riddleAnswer.toLowerCase().trim() === "keyboard" || riddleAnswer.toLowerCase().trim() === "a keyboard" || riddleAnswer.toLowerCase().trim() === "piano" || riddleAnswer.toLowerCase().trim() === "a piano") complete("riddle"); }}>Check</Button>
                </div>
              </div>
            )}
            {completed.has("riddle") && <p className="text-green-400 text-sm">✅ Riddle solved!</p>}

            {/* Decrypt */}
            {!completed.has("decrypt") && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Decrypt "ONAQIB" (ROT13):</label>
                <div className="flex gap-2">
                  <input value={decryptInput} onChange={e => setDecryptInput(e.target.value)} placeholder="Decrypted..." className="flex-1 bg-muted/30 border border-border/50 rounded px-3 py-1.5 text-sm" />
                  <Button size="sm" onClick={() => { if (decryptInput.toLowerCase().trim() === "bandit") complete("decrypt"); }}>Check</Button>
                </div>
              </div>
            )}
            {completed.has("decrypt") && <p className="text-green-400 text-sm">✅ Decrypted: BANDIT</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════
// GAME 2: MEMORY MATCH
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

  const initGame = () => {
    const pairs = [...MEMORY_EMOJIS, ...MEMORY_EMOJIS];
    const shuffled = pairs.sort(() => Math.random() - 0.5).map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
    setCards(shuffled);
    setSelected([]);
    setMoves(0);
    setGameOver(false);
    setStarted(true);
    setStartTime(Date.now());
    setElapsed(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - Date.now()) / 1000)), 1000);
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
        setCards([...newCards]);
        setSelected([]);
        if (newCards.every(c => c.matched)) {
          setGameOver(true);
          clearInterval(timerRef.current);
          const finalTime = Math.floor((Date.now() - startTime) / 1000);
          setElapsed(finalTime);
          const score = Math.max(100, 1000 - (moves + 1) * 20 - finalTime * 5);
          submitScore("memory_match", score, finalTime);
        }
      } else {
        setTimeout(() => {
          newCards[newSelected[0]].flipped = false;
          newCards[newSelected[1]].flipped = false;
          setCards([...newCards]);
          setSelected([]);
        }, 800);
      }
    }
  };

  if (!started) return (
    <div className="text-center space-y-6 py-12">
      <Brain className="w-20 h-20 mx-auto text-purple-400" />
      <h2 className="text-3xl font-bold">Memory Match</h2>
      <p className="text-muted-foreground">Find all 8 matching pairs as fast as possible!</p>
      <Button size="lg" className="bg-purple-600 hover:bg-purple-700" onClick={initGame}>Start Game</Button>
      <Button variant="ghost" onClick={onBack} className="ml-4"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
        <div className="flex gap-4">
          <Badge variant="outline">Moves: {moves}</Badge>
          <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> {elapsed}s</Badge>
        </div>
      </div>
      {gameOver && (
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-bold text-green-400">🎉 You Won!</h3>
          <p className="text-muted-foreground">{moves} moves in {elapsed} seconds</p>
          <Button onClick={initGame}>Play Again</Button>
        </div>
      )}
      <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
        {cards.map(card => (
          <motion.div
            key={card.id}
            whileHover={{ scale: card.matched ? 1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`aspect-square rounded-xl flex items-center justify-center text-3xl cursor-pointer border-2 transition-all ${
              card.matched ? "bg-green-500/20 border-green-500/50" :
              card.flipped ? "bg-primary/20 border-primary/50" :
              "bg-muted/40 border-border/50 hover:border-primary/30"
            }`}
            onClick={() => handleClick(card.id)}
          >
            {card.flipped || card.matched ? card.emoji : "?"}
          </motion.div>
        ))}
      </div>
      {gameOver && <Leaderboard gameType="memory_match" />}
    </div>
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
    const delay = 1500 + Math.random() * 3000;
    timeoutRef.current = setTimeout(() => {
      setState("go");
      setGoTime(Date.now());
    }, delay);
  };

  const handleClick = () => {
    if (state === "waiting") { startRound(); return; }
    if (state === "ready") {
      clearTimeout(timeoutRef.current);
      setState("early");
      return;
    }
    if (state === "go") {
      const reactionMs = Date.now() - goTime;
      const newTimes = [...times, reactionMs];
      setTimes(newTimes);
      if (newTimes.length >= 5) {
        setState("result");
        const avg = Math.round(newTimes.reduce((a, b) => a + b, 0) / newTimes.length);
        const score = Math.max(100, 1000 - avg * 2);
        submitScore("reaction_test", score, Math.round(avg));
      } else {
        setState("waiting");
      }
      return;
    }
    if (state === "early" || state === "result") {
      setTimes([]);
      setState("waiting");
    }
  };

  const avg = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
      <motion.div
        className={`min-h-[400px] rounded-2xl flex flex-col items-center justify-center cursor-pointer border-2 transition-colors ${
          state === "ready" ? "bg-red-500/20 border-red-500" :
          state === "go" ? "bg-green-500/20 border-green-500" :
          state === "early" ? "bg-yellow-500/20 border-yellow-500" :
          state === "result" ? "bg-primary/10 border-primary" :
          "bg-muted/20 border-border/50"
        }`}
        onClick={handleClick}
        whileTap={{ scale: 0.98 }}
      >
        {state === "waiting" && (
          <>
            <Zap className="w-16 h-16 text-yellow-400 mb-4" />
            <h3 className="text-2xl font-bold">Click to Start</h3>
            <p className="text-muted-foreground mt-2">Round {times.length + 1}/5</p>
          </>
        )}
        {state === "ready" && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-500 animate-pulse mb-4" />
            <h3 className="text-2xl font-bold text-red-400">Wait for green...</h3>
          </>
        )}
        {state === "go" && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-500 mb-4" />
            <h3 className="text-2xl font-bold text-green-400">CLICK NOW!</h3>
          </>
        )}
        {state === "early" && (
          <>
            <XCircle className="w-16 h-16 text-yellow-400 mb-4" />
            <h3 className="text-2xl font-bold text-yellow-400">Too Early!</h3>
            <p className="text-muted-foreground mt-2">Click to restart</p>
          </>
        )}
        {state === "result" && (
          <>
            <Trophy className="w-16 h-16 text-yellow-400 mb-4" />
            <h3 className="text-2xl font-bold">Average: {avg}ms</h3>
            <div className="flex gap-2 mt-2">
              {times.map((t, i) => <Badge key={i} variant="outline">{t}ms</Badge>)}
            </div>
            <p className="text-muted-foreground mt-4">Click to play again</p>
          </>
        )}
      </motion.div>
      {times.length > 0 && state !== "result" && (
        <div className="flex gap-2 justify-center">
          {times.map((t, i) => <Badge key={i} variant="outline">{t}ms</Badge>)}
        </div>
      )}
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

  const initGame = () => {
    const shuffled = [...TRIVIA_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 10);
    setQuestions(shuffled);
    setCurrent(0);
    setScore(0);
    setSelected(null);
    setGameOver(false);
    setStarted(true);
    setTimeLeft(120);
    setStartTime(Date.now());
  };

  useEffect(() => {
    if (!started || gameOver) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setGameOver(true);
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          submitScore("trivia_quiz", score * 100, elapsed);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [started, gameOver, startTime, score]);

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    const correct = idx === questions[current].answer;
    if (correct) setScore(s => s + 1);
    setTimeout(() => {
      if (current + 1 >= questions.length) {
        setGameOver(true);
        clearInterval(intervalRef.current);
        const finalScore = (correct ? score + 1 : score) * 100;
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        submitScore("trivia_quiz", finalScore, elapsed);
      } else {
        setCurrent(c => c + 1);
        setSelected(null);
      }
    }, 1200);
  };

  if (!started) return (
    <div className="text-center space-y-6 py-12">
      <BookOpen className="w-20 h-20 mx-auto text-cyan-400" />
      <h2 className="text-3xl font-bold">RP Trivia Quiz</h2>
      <p className="text-muted-foreground">Answer 10 RP knowledge questions. 2 minutes on the clock!</p>
      <Button size="lg" className="bg-cyan-600 hover:bg-cyan-700" onClick={initGame}>Start Quiz</Button>
      <Button variant="ghost" onClick={onBack} className="ml-4"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
    </div>
  );

  if (gameOver) return (
    <div className="text-center space-y-6 py-12">
      <Trophy className="w-20 h-20 mx-auto text-yellow-400" />
      <h2 className="text-3xl font-bold">{score}/10 Correct!</h2>
      <p className="text-muted-foreground">Score: {score * 100} points</p>
      <div className="flex gap-4 justify-center">
        <Button onClick={initGame}>Play Again</Button>
        <Button variant="outline" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
      </div>
      <Leaderboard gameType="trivia_quiz" />
    </div>
  );

  const q = questions[current];
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
        <div className="flex gap-4">
          <Badge variant="outline">Q{current + 1}/10</Badge>
          <Badge variant="secondary">{score} correct</Badge>
          <Badge className={timeLeft < 30 ? "bg-red-600" : ""}><Clock className="w-3 h-3 mr-1" /> {timeLeft}s</Badge>
        </div>
      </div>
      <Card className="bg-card/60 border-border/30">
        <CardContent className="p-8">
          <h3 className="text-xl font-bold mb-6">{q.q}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {q.options.map((opt, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: selected === null ? 1.02 : 1 }}
                whileTap={{ scale: 0.98 }}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selected === null ? "border-border/50 hover:border-primary/50 bg-muted/20" :
                  i === q.answer ? "border-green-500 bg-green-500/20" :
                  i === selected ? "border-red-500 bg-red-500/20" :
                  "border-border/30 bg-muted/10 opacity-50"
                }`}
                onClick={() => handleAnswer(i)}
                disabled={selected !== null}
              >
                {opt}
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ════════════════════════════════════════════════════════
// GAME 5: WORD SCRAMBLE
// ════════════════════════════════════════════════════════
const WORDS = [
  { word: "POLICE", hint: "Law enforcement" },
  { word: "MECHANIC", hint: "Fixes vehicles" },
  { word: "HOSPITAL", hint: "Medical facility" },
  { word: "ROBBERY", hint: "Crime for money" },
  { word: "EVIDENCE", hint: "Proof in court" },
  { word: "WARRANT", hint: "Legal search permission" },
  { word: "SMUGGLE", hint: "Illegal transport" },
  { word: "GANGSTER", hint: "Crime organization member" },
  { word: "DISPATCH", hint: "Emergency comms" },
  { word: "LICENSE", hint: "Driving permit" },
  { word: "CORRUPT", hint: "Dirty cop" },
  { word: "HOSTAGE", hint: "Kidnapped person" },
];

const scramble = (word: string) => word.split("").sort(() => Math.random() - 0.5).join("");

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

  const initGame = () => {
    const shuffled = [...WORDS].sort(() => Math.random() - 0.5).slice(0, 8);
    setWords(shuffled);
    setCurrent(0);
    setScore(0);
    setGameOver(false);
    setStarted(true);
    setTimeLeft(90);
    setStartTime(Date.now());
    setGuess("");
    setFeedback(null);
    const s = scramble(shuffled[0].word);
    setScrambled(s === shuffled[0].word ? scramble(shuffled[0].word) : s);
  };

  useEffect(() => {
    if (!started || gameOver) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setGameOver(true);
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          submitScore("word_scramble", score * 125, elapsed);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [started, gameOver, startTime, score]);

  const checkAnswer = () => {
    if (guess.toUpperCase().trim() === words[current].word) {
      setFeedback("correct");
      const newScore = score + 1;
      setScore(newScore);
      setTimeout(() => {
        if (current + 1 >= words.length) {
          setGameOver(true);
          clearInterval(intervalRef.current);
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          submitScore("word_scramble", newScore * 125, elapsed);
        } else {
          const nextIdx = current + 1;
          setCurrent(nextIdx);
          setGuess("");
          setFeedback(null);
          const s = scramble(words[nextIdx].word);
          setScrambled(s === words[nextIdx].word ? scramble(words[nextIdx].word) : s);
        }
      }, 800);
    } else {
      setFeedback("wrong");
      setTimeout(() => setFeedback(null), 600);
    }
  };

  if (!started) return (
    <div className="text-center space-y-6 py-12">
      <Shuffle className="w-20 h-20 mx-auto text-green-400" />
      <h2 className="text-3xl font-bold">Word Scramble</h2>
      <p className="text-muted-foreground">Unscramble 8 RP-themed words in 90 seconds!</p>
      <Button size="lg" className="bg-green-600 hover:bg-green-700" onClick={initGame}>Start Game</Button>
      <Button variant="ghost" onClick={onBack} className="ml-4"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
    </div>
  );

  if (gameOver) return (
    <div className="text-center space-y-6 py-12">
      <Trophy className="w-20 h-20 mx-auto text-yellow-400" />
      <h2 className="text-3xl font-bold">{score}/{words.length} Words!</h2>
      <p className="text-muted-foreground">Score: {score * 125} points</p>
      <div className="flex gap-4 justify-center">
        <Button onClick={initGame}>Play Again</Button>
        <Button variant="outline" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
      </div>
      <Leaderboard gameType="word_scramble" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
        <div className="flex gap-4">
          <Badge variant="outline">Word {current + 1}/{words.length}</Badge>
          <Badge variant="secondary">{score} solved</Badge>
          <Badge className={timeLeft < 20 ? "bg-red-600" : ""}><Clock className="w-3 h-3 mr-1" /> {timeLeft}s</Badge>
        </div>
      </div>
      <Card className={`bg-card/60 border-2 transition-colors ${feedback === "correct" ? "border-green-500" : feedback === "wrong" ? "border-red-500" : "border-border/30"}`}>
        <CardContent className="p-8 text-center space-y-6">
          <p className="text-sm text-muted-foreground">Hint: {words[current].hint}</p>
          <div className="flex justify-center gap-2">
            {scrambled.split("").map((ch, i) => (
              <span key={i} className="w-10 h-12 flex items-center justify-center bg-primary/20 border border-primary/40 rounded-lg text-xl font-bold font-mono">
                {ch}
              </span>
            ))}
          </div>
          <div className="flex gap-2 max-w-sm mx-auto">
            <input
              value={guess}
              onChange={e => setGuess(e.target.value)}
              onKeyDown={e => e.key === "Enter" && checkAnswer()}
              placeholder="Your answer..."
              className="flex-1 bg-muted/30 border border-border/50 rounded-lg px-4 py-2 text-center font-mono tracking-widest uppercase"
              autoFocus
            />
            <Button onClick={checkAnswer}>Check</Button>
          </div>
        </CardContent>
      </Card>
    </div>
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
              <div className="text-center mb-10">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Gamepad2 className="w-10 h-10 text-primary" />
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    Mini Games
                  </h1>
                </div>
                <p className="text-muted-foreground max-w-lg mx-auto">
                  Challenge yourself with 5 unique mini games. Compete for the top spot on the leaderboards!
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {GAMES.map(game => (
                  <motion.div key={game.id} whileHover={{ scale: 1.03, y: -4 }} whileTap={{ scale: 0.98 }}>
                    <Card 
                      className={`bg-card/60 backdrop-blur cursor-pointer border-2 ${game.borderColor} hover:shadow-lg hover:shadow-primary/10 transition-all h-full`}
                      onClick={() => setActiveGame(game.id)}
                    >
                      <CardHeader className="text-center pb-3">
                        <div className={`mx-auto mb-3 ${game.color}`}>{game.icon}</div>
                        <CardTitle className="text-xl">{game.title}</CardTitle>
                        <CardDescription>{game.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="text-center">
                        <Button variant="outline" className={game.borderColor}>
                          <Gamepad2 className="w-4 h-4 mr-2" /> Play Now
                        </Button>
                      </CardContent>
                    </Card>
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
