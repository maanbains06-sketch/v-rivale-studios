import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface CricketGameProps {
  onBack: () => void;
  submitScore: (gameType: string, score: number, time?: number) => void;
  GameShell: React.ComponentType<any>;
  StartScreen: React.ComponentType<any>;
  EndScreen: React.ComponentType<any>;
  Leaderboard: React.ComponentType<any>;
  game: { title: string; description: string; icon: React.ReactNode; gradient: string; glow: string };
}

type ShotResult = "six" | "four" | "three" | "two" | "one" | "dot" | "wicket" | "wide";
type BallType = "fast" | "spin" | "yorker" | "bouncer" | "swing";
type ShotDirection = "straight" | "cover" | "midwicket" | "square" | "fine";

const W = 420;
const H = 560;
const CX = W / 2;
const CY = H / 2;

// Fielder positions (x%, y%) on the oval ground
const FIELDERS = [
  { pos: [50, 12], label: "Long On" },
  { pos: [22, 18], label: "Deep Cover" },
  { pos: [78, 18], label: "Deep Mid" },
  { pos: [12, 38], label: "Point" },
  { pos: [88, 38], label: "Square Leg" },
  { pos: [30, 35], label: "Cover" },
  { pos: [70, 35], label: "Mid Wicket" },
  { pos: [38, 50], label: "Mid Off" },
  { pos: [62, 50], label: "Mid On" },
  { pos: [50, 22], label: "Long Off" },
  { pos: [15, 55], label: "Slip" },
];

const SHOT_TYPES: { name: string; key: string; direction: ShotDirection; power: number; icon: string }[] = [
  { name: "Straight Drive", key: "w", direction: "straight", power: 0.85, icon: "⬆️" },
  { name: "Cover Drive", key: "a", direction: "cover", power: 0.75, icon: "↖️" },
  { name: "Pull Shot", key: "d", direction: "midwicket", power: 0.9, icon: "↗️" },
  { name: "Cut Shot", key: "q", direction: "square", power: 0.7, icon: "⬅️" },
  { name: "Flick", key: "e", direction: "fine", power: 0.65, icon: "➡️" },
  { name: "Defend", key: "s", direction: "straight", power: 0.15, icon: "🛡️" },
];

const BALL_TYPES: { type: BallType; label: string; speed: number; swing: number }[] = [
  { type: "fast", label: "Fast", speed: 1.0, swing: 0.1 },
  { type: "spin", label: "Spin", speed: 0.6, swing: 0.4 },
  { type: "yorker", label: "Yorker", speed: 1.1, swing: 0.05 },
  { type: "bouncer", label: "Bouncer", speed: 0.9, swing: 0.15 },
  { type: "swing", label: "Swing", speed: 0.85, swing: 0.35 },
];

// Shot direction to angle (degrees, 0 = up)
const DIR_ANGLES: Record<ShotDirection, number> = {
  straight: 0, cover: -40, midwicket: 40, square: -80, fine: 80,
};

const CricketGame = ({ onBack, submitScore, GameShell, StartScreen, EndScreen, Leaderboard, game }: CricketGameProps) => {
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [runs, setRuns] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [balls, setBalls] = useState(0);
  const [ballInPlay, setBallInPlay] = useState(false);
  const [ballPos, setBallPos] = useState({ x: 0.5, y: 0 });
  const [shotResult, setShotResult] = useState<ShotResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [swingPhase, setSwingPhase] = useState<"idle" | "ready" | "swing">("idle");
  const [difficulty, setDifficulty] = useState(1);
  const [combo, setCombo] = useState(0);
  const [currentBallType, setCurrentBallType] = useState<BallType>("fast");
  const [bowlerRunning, setBowlerRunning] = useState(false);
  const [shotBallTrail, setShotBallTrail] = useState<{ x: number; y: number; angle: number } | null>(null);
  const [thisOver, setThisOver] = useState<string[]>([]);
  const [strikeRate, setStrikeRate] = useState(0);
  const [recentBalls, setRecentBalls] = useState<ShotResult[]>([]);
  const ballAnimRef = useRef<number>();
  const canHit = useRef(false);
  const ballYRef = useRef(0);

  const MAX_BALLS = 30;
  const MAX_WICKETS = 5;

  const initGame = () => {
    setRuns(0); setWickets(0); setBalls(0); setGameOver(false);
    setStarted(true); setBallInPlay(false); setShotResult(null);
    setShowResult(false); setSwingPhase("idle"); setCombo(0);
    setDifficulty(1); setBowlerRunning(false); setShotBallTrail(null);
    setThisOver([]); setStrikeRate(0); setRecentBalls([]);
  };

  const bowlBall = useCallback(() => {
    if (ballInPlay || gameOver || bowlerRunning) return;

    // Bowler run-up animation
    setBowlerRunning(true);
    const bt = BALL_TYPES[Math.floor(Math.random() * BALL_TYPES.length)];
    setCurrentBallType(bt.type);

    setTimeout(() => {
      setBowlerRunning(false);
      const xStart = 0.5 + (Math.random() - 0.5) * 0.15;
      setBallPos({ x: xStart, y: 0 });
      setBallInPlay(true);
      canHit.current = false;
      setSwingPhase("ready");
      setShotResult(null);
      setShowResult(false);
      setShotBallTrail(null);
      ballYRef.current = 0;

      const speed = (2.5 + difficulty * 0.4) * bt.speed;
      const duration = 1400 / speed;
      const swingDir = (Math.random() - 0.5) * bt.swing;
      let startTs: number;

      const animate = (ts: number) => {
        if (!startTs) startTs = ts;
        const elapsed = ts - startTs;
        const progress = Math.min(elapsed / duration, 1);
        const xDrift = swingDir * Math.sin(progress * Math.PI);
        setBallPos({ x: xStart + xDrift * 0.15, y: progress });
        ballYRef.current = progress;

        if (progress >= 0.5 && progress <= 0.82) {
          canHit.current = true;
        } else if (progress > 0.82) {
          canHit.current = false;
        }

        if (progress < 1) {
          ballAnimRef.current = requestAnimationFrame(animate);
        } else {
          handleMiss();
        }
      };
      ballAnimRef.current = requestAnimationFrame(animate);
    }, 600);
  }, [ballInPlay, gameOver, bowlerRunning, difficulty]);

  const handleMiss = () => {
    if (ballAnimRef.current) cancelAnimationFrame(ballAnimRef.current);
    setBallInPlay(false);
    setSwingPhase("idle");
    canHit.current = false;
    const wicketChance = 0.12 + difficulty * 0.06;
    if (Math.random() < wicketChance) {
      handleResult("wicket");
    } else {
      handleResult("dot");
    }
  };

  const attemptShot = useCallback((shotIndex: number) => {
    if (!ballInPlay || !canHit.current || gameOver) return;
    if (ballAnimRef.current) cancelAnimationFrame(ballAnimRef.current);

    setSwingPhase("swing");
    const shot = SHOT_TYPES[shotIndex];

    // Timing quality
    const timingScore = 1 - Math.abs(ballYRef.current - 0.65) / 0.2;
    const clampedTiming = Math.max(0, Math.min(1, timingScore));

    const totalQuality = clampedTiming * shot.power;
    const rand = Math.random();

    let result: ShotResult;
    if (shot.power < 0.2) {
      // Defend
      result = rand < 0.1 ? "one" : "dot";
    } else if (totalQuality > 0.82 && rand > 0.15) {
      result = "six";
    } else if (totalQuality > 0.65 && rand > 0.1) {
      result = "four";
    } else if (totalQuality > 0.5) {
      result = rand > 0.4 ? "three" : "two";
    } else if (totalQuality > 0.3) {
      result = rand > 0.5 ? "two" : "one";
    } else if (totalQuality > 0.15) {
      result = "dot";
    } else {
      result = rand < 0.35 + difficulty * 0.08 ? "wicket" : "dot";
    }

    // Show ball trajectory
    const angle = DIR_ANGLES[shot.direction];
    const dist = result === "six" ? 0.95 : result === "four" ? 0.8 : result === "three" ? 0.6 : result === "two" ? 0.45 : result === "one" ? 0.3 : 0.1;
    setShotBallTrail({ x: 50 + Math.sin((angle * Math.PI) / 180) * dist * 45, y: 50 - Math.cos((angle * Math.PI) / 180) * dist * 45, angle });

    handleResult(result);
  }, [ballInPlay, gameOver, difficulty]);

  const handleResult = (result: ShotResult) => {
    setBallInPlay(false);
    canHit.current = false;
    setShotResult(result);
    setShowResult(true);

    const runsMap: Record<ShotResult, number> = { six: 6, four: 4, three: 3, two: 2, one: 1, dot: 0, wicket: 0, wide: 1 };
    const earned = runsMap[result];
    const symbols: Record<ShotResult, string> = { six: "6", four: "4", three: "3", two: "2", one: "1", dot: "•", wicket: "W", wide: "Wd" };

    setRecentBalls(prev => [...prev.slice(-5), result]);

    if (result === "wicket") {
      setWickets(w => {
        const nw = w + 1;
        if (nw >= MAX_WICKETS) endGame(runs);
        return nw;
      });
      setCombo(0);
    } else {
      if (earned >= 4) setCombo(c => c + 1);
      else setCombo(0);
      setRuns(r => r + earned);
    }

    setBalls(b => {
      const nb = b + 1;
      setThisOver(prev => {
        const updated = [...prev, symbols[result]];
        if (updated.length >= 6) return [];
        return updated;
      });
      if (nb >= MAX_BALLS) {
        setTimeout(() => endGame(runs + earned), 1500);
      }
      if (nb % 6 === 0) {
        setDifficulty(d => Math.min(d + 0.4, 5));
      }
      setStrikeRate(nb > 0 ? Math.round(((runs + earned) / nb) * 100) : 0);
      return nb;
    });

    setSwingPhase("idle");

    if (result !== "wicket" || wickets < MAX_WICKETS - 1) {
      setTimeout(() => {
        setShowResult(false);
        setShotBallTrail(null);
        if (balls + 1 < MAX_BALLS) bowlBall();
      }, 2000);
    }
  };

  const endGame = (finalRuns: number) => {
    setGameOver(true);
    submitScore("cricket", finalRuns);
  };

  useEffect(() => {
    if (!started || gameOver) return;
    const handleKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === " " && !ballInPlay && !bowlerRunning) { e.preventDefault(); bowlBall(); return; }
      const idx = SHOT_TYPES.findIndex(s => s.key === key);
      if (idx >= 0) { e.preventDefault(); attemptShot(idx); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [started, gameOver, bowlBall, attemptShot, ballInPlay, bowlerRunning]);

  useEffect(() => {
    return () => { if (ballAnimRef.current) cancelAnimationFrame(ballAnimRef.current); };
  }, []);

  const oversStr = `${Math.floor(balls / 6)}.${balls % 6}`;
  const currentOver = Math.floor(balls / 6) + 1;
  const runRate = balls > 0 ? ((runs / balls) * 6).toFixed(1) : "0.0";

  const resultColors: Record<ShotResult, string> = {
    six: "text-yellow-300", four: "text-green-300", three: "text-blue-300",
    two: "text-cyan-300", one: "text-white", dot: "text-gray-400", wicket: "text-red-400", wide: "text-orange-300"
  };
  const resultLabels: Record<ShotResult, string> = {
    six: "MAXIMUM SIX! 💥", four: "FOUR RUNS!", three: "THREE!", two: "TWO RUNS",
    one: "SINGLE", dot: "DOT BALL •", wicket: "WICKET! OUT! 🔴", wide: "WIDE"
  };

  if (!started) return <StartScreen title={game.title} description={game.description} icon={game.icon} gradient={game.gradient} glow={game.glow} onStart={initGame} onBack={onBack} gameType="cricket" />;
  if (gameOver) return <EndScreen won={runs >= 50} title={`${runs} Runs Scored!`} subtitle={`${runs} pts • ${oversStr} overs • SR: ${strikeRate}`} onReplay={initGame} onBack={onBack} gameType="cricket" />;

  return (
    <GameShell onBack={onBack} title="Cricket" icon={game.icon} gradient={game.gradient}
      badges={<>
        {combo >= 2 && <Badge className="bg-yellow-900/40 text-yellow-300 border-yellow-500/30 font-mono animate-pulse">🔥 x{combo}</Badge>}
      </>}>
      <div className="flex flex-col items-center gap-3">
        {/* ── Scoreboard HUD ── */}
        <div className="w-full max-w-[420px] rounded-lg overflow-hidden" style={{
          background: "linear-gradient(90deg, hsl(220 30% 12%), hsl(220 25% 8%))",
          border: "1px solid hsl(220 20% 20%)"
        }}>
          {/* Top score bar */}
          <div className="flex items-center justify-between px-3 py-1.5" style={{ borderBottom: "1px solid hsl(220 20% 18%)" }}>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-xs font-bold text-blue-300">YOU</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xl font-black text-white font-mono">{runs}/{wickets}</span>
              <span className="text-xs text-gray-400 font-mono">({oversStr} ov)</span>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-gray-500">SR</div>
              <div className="text-xs font-bold text-cyan-400 font-mono">{strikeRate}</div>
            </div>
          </div>
          {/* Bottom info bar */}
          <div className="flex items-center justify-between px-3 py-1" style={{ background: "hsl(220 30% 10%)" }}>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500">THIS OVER</span>
              <div className="flex gap-1">
                {thisOver.map((b, i) => (
                  <span key={i} className={`text-[10px] font-mono px-1 rounded ${
                    b === "W" ? "bg-red-900/50 text-red-300" :
                    b === "6" ? "bg-yellow-900/50 text-yellow-300" :
                    b === "4" ? "bg-green-900/50 text-green-300" :
                    "bg-white/5 text-gray-400"
                  }`}>{b}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-gray-500">RR <span className="text-cyan-400 font-mono">{runRate}</span></span>
              <span className="text-[10px] text-gray-500">BALL <span className="text-amber-300 font-mono font-bold">{currentBallType.toUpperCase()}</span></span>
            </div>
          </div>
        </div>

        {/* ── Cricket Ground (Top-Down View) ── */}
        <div className="relative rounded-xl overflow-hidden" style={{
          width: W, height: H,
          background: "radial-gradient(ellipse 100% 100% at 50% 50%, hsl(130 55% 32%) 0%, hsl(130 50% 25%) 60%, hsl(130 45% 18%) 100%)",
          border: "2px solid hsl(130 30% 20%)",
          boxShadow: "inset 0 0 60px hsl(130 40% 10% / 0.5), 0 8px 32px rgba(0,0,0,0.5)"
        }}>
          {/* Outfield ring / boundary */}
          <div className="absolute inset-[8px] rounded-full border-2 border-white/15" />
          <div className="absolute inset-[10px] rounded-full" style={{
            background: "radial-gradient(ellipse at 50% 50%, transparent 55%, hsl(130 40% 20% / 0.4) 100%)"
          }} />

          {/* 30-yard circle */}
          <div className="absolute" style={{
            left: "20%", right: "20%", top: "18%", bottom: "18%",
            borderRadius: "50%", border: "1px dashed hsl(0 0% 100% / 0.12)"
          }} />

          {/* Grass mowing pattern */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="absolute left-0 right-0" style={{
              top: `${i * 12.5}%`, height: "6.25%",
              background: i % 2 === 0 ? "hsl(130 55% 33% / 0.15)" : "transparent"
            }} />
          ))}

          {/* Pitch strip (center) */}
          <div className="absolute left-1/2 -translate-x-1/2" style={{
            width: 32, top: "28%", bottom: "22%",
            background: "linear-gradient(180deg, hsl(40 45% 52%), hsl(38 40% 47%), hsl(35 38% 42%))",
            borderRadius: 3,
            boxShadow: "0 0 10px hsl(40 30% 30% / 0.4)"
          }}>
            {/* Crease lines */}
            <div className="absolute top-[10%] left-[-8px] right-[-8px] h-[1.5px] bg-white/60" />
            <div className="absolute bottom-[12%] left-[-8px] right-[-8px] h-[1.5px] bg-white/60" />
            {/* Popping crease */}
            <div className="absolute top-[15%] left-[-12px] right-[-12px] h-[1px] bg-white/30" />
            <div className="absolute bottom-[17%] left-[-12px] right-[-12px] h-[1px] bg-white/30" />
          </div>

          {/* Stumps — bowler end */}
          <div className="absolute left-1/2 -translate-x-1/2 flex gap-[2px]" style={{ top: "29%" }}>
            {[0,1,2].map(i => (
              <div key={i} className="rounded-t-full" style={{
                width: 2.5, height: 12,
                background: "linear-gradient(180deg, hsl(45 80% 75%), hsl(35 60% 50%))",
                boxShadow: "0 0 3px hsl(45 80% 60% / 0.5)"
              }} />
            ))}
          </div>

          {/* Stumps — batsman end */}
          <div className="absolute left-1/2 -translate-x-1/2 flex gap-[2px]" style={{ bottom: "24%" }}>
            {[0,1,2].map(i => (
              <div key={i} className="rounded-t-full" style={{
                width: 2.5, height: 12,
                background: "linear-gradient(180deg, hsl(45 80% 75%), hsl(35 60% 50%))",
                boxShadow: "0 0 3px hsl(45 80% 60% / 0.5)"
              }} />
            ))}
          </div>

          {/* Fielders */}
          {FIELDERS.map((f, i) => (
            <div key={i} className="absolute flex flex-col items-center" style={{
              left: `${f.pos[0]}%`, top: `${f.pos[1]}%`, transform: "translate(-50%, -50%)"
            }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px]" style={{
                background: "linear-gradient(135deg, hsl(45 80% 55%), hsl(35 70% 40%))",
                border: "1.5px solid hsl(45 70% 65% / 0.6)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.3)"
              }}>
                <span className="text-[7px]">🧍</span>
              </div>
              <span className="text-[7px] text-white/30 mt-0.5 whitespace-nowrap">{f.label}</span>
            </div>
          ))}

          {/* Bowler */}
          <motion.div className="absolute left-1/2 -translate-x-1/2" style={{ top: bowlerRunning ? "25%" : "20%" }}
            animate={bowlerRunning ? { top: ["18%", "28%"], scale: [0.9, 1.1, 1] } : {}}
            transition={bowlerRunning ? { duration: 0.5, ease: "easeIn" } : {}}>
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{
                background: "linear-gradient(135deg, hsl(45 80% 55%), hsl(40 70% 40%))",
                border: "2px solid hsl(45 70% 65%)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
              }}>
                <span className="text-xs">🎳</span>
              </div>
              <span className="text-[8px] text-white/40 mt-0.5">Bowler</span>
            </div>
          </motion.div>

          {/* Batsman (at bottom of pitch) */}
          <motion.div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: "20%" }}
            animate={swingPhase === "swing" ? { rotate: [0, -25, 50, 0], scale: [1, 1.05, 1.15, 1] } : {}}
            transition={swingPhase === "swing" ? { duration: 0.35 } : {}}>
            <div className="flex flex-col items-center relative">
              {/* Player body */}
              <div className="w-8 h-8 rounded-full flex items-center justify-center relative" style={{
                background: "linear-gradient(135deg, hsl(210 80% 50%), hsl(210 70% 38%))",
                border: "2px solid hsl(210 60% 60%)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
              }}>
                <span className="text-sm">🏏</span>
              </div>
              {/* Bat */}
              <motion.div className="absolute -right-2 top-0 origin-bottom-left"
                animate={swingPhase === "swing" ? { rotate: [-15, 60, 0] } : { rotate: -15 }}
                transition={{ duration: 0.3 }}>
                <div style={{
                  width: 3, height: 18, borderRadius: 2,
                  background: "linear-gradient(180deg, hsl(35 70% 60%), hsl(30 60% 40%))",
                  boxShadow: "0 0 4px hsl(35 60% 50% / 0.4)"
                }} />
              </motion.div>
              <span className="text-[8px] text-white/40 mt-0.5">Batsman</span>
            </div>
          </motion.div>

          {/* Non-striker */}
          <div className="absolute flex flex-col items-center" style={{ left: "55%", top: "30%" }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{
              background: "linear-gradient(135deg, hsl(210 70% 50%), hsl(210 60% 38%))",
              border: "1.5px solid hsl(210 50% 55%)",
            }}>
              <span className="text-[8px]">🧍</span>
            </div>
            <span className="text-[7px] text-white/30 mt-0.5">Non-Striker</span>
          </div>

          {/* Wicket Keeper */}
          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center" style={{ bottom: "15%" }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{
              background: "linear-gradient(135deg, hsl(45 80% 55%), hsl(35 70% 40%))",
              border: "1.5px solid hsl(45 60% 55%)",
            }}>
              <span className="text-[8px]">🧤</span>
            </div>
            <span className="text-[7px] text-white/30 mt-0.5">Keeper</span>
          </div>

          {/* Ball — bowling delivery */}
          {ballInPlay && (
            <motion.div className="absolute z-20" style={{
              left: `${ballPos.x * 100}%`,
              top: `${28 + ballPos.y * 48}%`,
              transform: "translate(-50%, -50%)"
            }}>
              <div className="relative">
                <div style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: "radial-gradient(circle at 35% 35%, hsl(0 85% 58%), hsl(0 80% 30%))",
                  boxShadow: "0 0 8px hsl(0 80% 50% / 0.7), 0 0 20px hsl(0 70% 40% / 0.3)"
                }} />
                <div className="absolute inset-0 rounded-full" style={{ border: "0.5px solid hsl(0 0% 100% / 0.3)" }} />
              </div>
            </motion.div>
          )}

          {/* Sweet spot indicator */}
          {ballInPlay && (
            <div className="absolute left-1/2 -translate-x-1/2 z-10" style={{
              top: "60%", width: 50, height: 20, borderRadius: 6,
              border: `2px dashed ${canHit.current ? "hsl(120 70% 50% / 0.6)" : "hsl(0 0% 40% / 0.2)"}`,
              background: canHit.current ? "hsl(120 70% 50% / 0.08)" : "transparent",
              transition: "all 0.15s"
            }} />
          )}

          {/* Shot ball trajectory */}
          <AnimatePresence>
            {shotBallTrail && (
              <motion.div className="absolute z-20"
                initial={{ left: "50%", top: "76%", scale: 1, opacity: 1 }}
                animate={{ left: `${shotBallTrail.x}%`, top: `${shotBallTrail.y}%`, scale: 0.6, opacity: 0.8 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: "radial-gradient(circle, hsl(0 85% 58%), hsl(0 75% 35%))",
                  boxShadow: "0 0 12px hsl(0 80% 50% / 0.8)"
                }} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Shot result overlay */}
          <AnimatePresence>
            {showResult && shotResult && (
              <motion.div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
                initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <div className="px-6 py-3 rounded-xl" style={{
                  background: shotResult === "six" ? "hsl(45 80% 50% / 0.2)" :
                    shotResult === "four" ? "hsl(130 70% 40% / 0.2)" :
                    shotResult === "wicket" ? "hsl(0 70% 40% / 0.25)" : "hsl(0 0% 0% / 0.3)",
                  backdropFilter: "blur(4px)",
                  border: `1px solid ${shotResult === "wicket" ? "hsl(0 60% 50% / 0.4)" : "hsl(0 0% 100% / 0.1)"}`,
                }}>
                  <div className={`text-3xl font-black ${resultColors[shotResult]} text-center`}
                    style={{ textShadow: "0 0 20px currentColor" }}>
                    {resultLabels[shotResult]}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Boundary rope */}
          <div className="absolute inset-[6px] rounded-full pointer-events-none" style={{
            border: "2px solid hsl(0 0% 100% / 0.08)",
          }} />
        </div>

        {/* ── Shot Controls ── */}
        <div className="w-full max-w-[420px] rounded-lg p-2" style={{
          background: "hsl(220 25% 10%)", border: "1px solid hsl(220 20% 18%)"
        }}>
          <div className="grid grid-cols-3 gap-1.5">
            {SHOT_TYPES.map((shot, i) => (
              <Button key={shot.name} variant="ghost" size="sm"
                className="h-9 text-[11px] font-mono border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5"
                onClick={() => attemptShot(i)}
                disabled={!ballInPlay || !canHit.current}>
                <span className="mr-1">{shot.icon}</span>
                {shot.name}
                <span className="ml-1 text-[9px] text-gray-500">[{shot.key.toUpperCase()}]</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Bowl button */}
        {!ballInPlay && !showResult && !bowlerRunning && (
          <Button onClick={bowlBall}
            className="bg-gradient-to-r from-green-600 to-emerald-500 text-foreground font-bold px-8 shadow-lg shadow-green-500/20">
            🎳 Ready — Bowl [SPACE]
          </Button>
        )}
        {bowlerRunning && (
          <div className="text-sm text-amber-400 font-mono animate-pulse">Bowler running in...</div>
        )}

        <p className="text-[10px] text-muted-foreground font-mono">
          SPACE = Bowl | W = Straight | A = Cover | D = Pull | Q = Cut | E = Flick | S = Defend
        </p>
      </div>
      <Leaderboard gameType="cricket" />
    </GameShell>
  );
};

export default CricketGame;
