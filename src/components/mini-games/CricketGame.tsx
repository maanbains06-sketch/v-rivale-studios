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

type ShotResult = "six" | "four" | "three" | "two" | "one" | "dot" | "wicket";

const PITCH_WIDTH = 360;
const PITCH_HEIGHT = 500;

const BALL_ZONES = [
  { label: "Off Side", x: 0.2, color: "hsl(200 70% 50%)" },
  { label: "Straight", x: 0.5, color: "hsl(140 70% 50%)" },
  { label: "Leg Side", x: 0.8, color: "hsl(30 70% 50%)" },
];

const SHOT_TYPES = [
  { name: "Drive", key: "d", power: 0.7, timing: 0.12 },
  { name: "Pull", key: "p", power: 0.9, timing: 0.08 },
  { name: "Cut", key: "c", power: 0.6, timing: 0.15 },
  { name: "Defend", key: "f", power: 0.2, timing: 0.25 },
];

const CricketGame = ({ onBack, submitScore, GameShell, StartScreen, EndScreen, Leaderboard, game }: CricketGameProps) => {
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [runs, setRuns] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [balls, setBalls] = useState(0);
  const [ballInPlay, setBallInPlay] = useState(false);
  const [ballPos, setBallPos] = useState({ x: 0.5, y: 0 });
  const [ballZone, setBallZone] = useState(1);
  const [shotResult, setShotResult] = useState<ShotResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [swingPhase, setSwingPhase] = useState<"idle" | "ready" | "swing">("idle");
  const [ballSpeed, setBallSpeed] = useState(3);
  const [difficulty, setDifficulty] = useState(1);
  const [combo, setCombo] = useState(0);
  const [lastShotName, setLastShotName] = useState("");
  const ballAnimRef = useRef<number>();
  const ballStartTime = useRef(0);
  const canHit = useRef(false);

  const MAX_BALLS = 30; // 5 overs
  const MAX_WICKETS = 5;

  const initGame = () => {
    setRuns(0); setWickets(0); setBalls(0); setGameOver(false);
    setStarted(true); setBallInPlay(false); setShotResult(null);
    setShowResult(false); setSwingPhase("idle"); setCombo(0);
    setDifficulty(1); setBallSpeed(3);
  };

  const bowlBall = useCallback(() => {
    if (ballInPlay || gameOver) return;
    const zone = Math.floor(Math.random() * 3);
    const xVariation = (Math.random() - 0.5) * 0.3;
    setBallZone(zone);
    setBallPos({ x: BALL_ZONES[zone].x + xVariation, y: 0 });
    setBallInPlay(true);
    canHit.current = false;
    setSwingPhase("ready");
    setShotResult(null);
    setShowResult(false);
    ballStartTime.current = Date.now();

    const speed = ballSpeed + difficulty * 0.5;
    const duration = 1200 / speed;
    let startTs: number;

    const animate = (ts: number) => {
      if (!startTs) startTs = ts;
      const elapsed = ts - startTs;
      const progress = Math.min(elapsed / duration, 1);
      setBallPos(prev => ({ ...prev, y: progress }));

      // Sweet spot zone: 0.55–0.75
      if (progress >= 0.55 && progress <= 0.85) {
        canHit.current = true;
      } else if (progress > 0.85) {
        canHit.current = false;
      }

      if (progress < 1) {
        ballAnimRef.current = requestAnimationFrame(animate);
      } else {
        // Ball passed - dot ball or missed
        handleMiss();
      }
    };
    ballAnimRef.current = requestAnimationFrame(animate);
  }, [ballInPlay, gameOver, ballSpeed, difficulty]);

  const handleMiss = () => {
    if (ballAnimRef.current) cancelAnimationFrame(ballAnimRef.current);
    setBallInPlay(false);
    setSwingPhase("idle");
    canHit.current = false;

    // Random chance of wicket on miss (higher with difficulty)
    const wicketChance = 0.15 + difficulty * 0.05;
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
    setLastShotName(shot.name);

    // Timing quality (how close to sweet spot 0.65)
    const timingScore = 1 - Math.abs(ballPos.y - 0.65) / 0.2;
    const clampedTiming = Math.max(0, Math.min(1, timingScore));

    // Zone matching bonus
    const zoneBonus = (shotIndex === 0 && ballZone === 0) || (shotIndex === 1 && ballZone === 2) || (shotIndex === 2 && ballZone === 0) ? 0.2 : 0;

    const totalQuality = clampedTiming * shot.power + zoneBonus;
    const rand = Math.random();

    let result: ShotResult;
    if (totalQuality > 0.85 && rand > 0.2) { result = "six"; }
    else if (totalQuality > 0.7 && rand > 0.15) { result = "four"; }
    else if (totalQuality > 0.55) { result = rand > 0.5 ? "three" : "two"; }
    else if (totalQuality > 0.3) { result = "one"; }
    else if (totalQuality > 0.15) { result = "dot"; }
    else { result = rand < 0.4 + difficulty * 0.1 ? "wicket" : "dot"; }

    handleResult(result);
  }, [ballInPlay, gameOver, ballPos.y, ballZone, difficulty]);

  const handleResult = (result: ShotResult) => {
    setBallInPlay(false);
    canHit.current = false;
    setShotResult(result);
    setShowResult(true);

    const runsMap: Record<ShotResult, number> = { six: 6, four: 4, three: 3, two: 2, one: 1, dot: 0, wicket: 0 };
    const earnedRuns = runsMap[result];

    if (result === "wicket") {
      setWickets(w => {
        const newW = w + 1;
        if (newW >= MAX_WICKETS) {
          endGame(runs);
        }
        return newW;
      });
      setCombo(0);
    } else {
      if (earnedRuns >= 4) setCombo(c => c + 1);
      else setCombo(0);
      setRuns(r => r + earnedRuns);
    }

    setBalls(b => {
      const newB = b + 1;
      if (newB >= MAX_BALLS && wickets < MAX_WICKETS - 1) {
        setTimeout(() => endGame(runs + earnedRuns), 1500);
      }
      // Increase difficulty every 6 balls
      if (newB % 6 === 0) {
        setDifficulty(d => Math.min(d + 0.5, 5));
        setBallSpeed(s => Math.min(s + 0.3, 6));
      }
      return newB;
    });

    setSwingPhase("idle");

    // Auto-bowl next ball
    if (result !== "wicket" || wickets < MAX_WICKETS - 1) {
      setTimeout(() => {
        setShowResult(false);
        if (balls + 1 < MAX_BALLS) bowlBall();
      }, 1800);
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
      if (key === " " && !ballInPlay) { bowlBall(); return; }
      const idx = SHOT_TYPES.findIndex(s => s.key === key);
      if (idx >= 0) attemptShot(idx);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [started, gameOver, bowlBall, attemptShot, ballInPlay]);

  useEffect(() => {
    return () => { if (ballAnimRef.current) cancelAnimationFrame(ballAnimRef.current); };
  }, []);

  const oversStr = `${Math.floor(balls / 6)}.${balls % 6}`;
  const resultColors: Record<ShotResult, string> = {
    six: "text-yellow-400", four: "text-green-400", three: "text-blue-400",
    two: "text-cyan-400", one: "text-white", dot: "text-gray-400", wicket: "text-red-500"
  };
  const resultLabels: Record<ShotResult, string> = {
    six: "SIX! 🏏💥", four: "FOUR! 🏏", three: "THREE RUNS", two: "TWO RUNS",
    one: "ONE RUN", dot: "DOT BALL", wicket: "OUT! ❌"
  };

  if (!started) return <StartScreen title={game.title} description={game.description} icon={game.icon} gradient={game.gradient} glow={game.glow} onStart={initGame} onBack={onBack} gameType="cricket" />;
  if (gameOver) return <EndScreen won={runs >= 50} title={`${runs} Runs!`} subtitle={`${runs} pts — ${oversStr} overs, ${wickets} wickets`} onReplay={initGame} onBack={onBack} gameType="cricket" />;

  return (
    <GameShell onBack={onBack} title="Cricket" icon={game.icon} gradient={game.gradient}
      badges={<>
        <Badge className="bg-emerald-900/40 text-emerald-300 border-emerald-500/30 font-mono">{runs} Runs</Badge>
        <Badge className="bg-red-900/40 text-red-300 border-red-500/30 font-mono">{wickets}/{MAX_WICKETS} Wkts</Badge>
        <Badge className="bg-cyan-900/40 text-cyan-300 border-cyan-500/30 font-mono">{oversStr} Ov</Badge>
        {combo >= 2 && <Badge className="bg-yellow-900/40 text-yellow-300 border-yellow-500/30 font-mono animate-pulse">🔥 x{combo}</Badge>}
      </>}>
      <div className="flex flex-col items-center gap-4">
        {/* Cricket Pitch */}
        <div className="relative rounded-xl overflow-hidden border-2 border-emerald-500/20" style={{
          width: PITCH_WIDTH, height: PITCH_HEIGHT,
          background: "linear-gradient(180deg, hsl(200 60% 55%) 0%, hsl(200 50% 45%) 15%, hsl(130 50% 35%) 15%, hsl(130 45% 30%) 100%)"
        }}>
          {/* Sky clouds */}
          <div className="absolute top-2 left-8 w-16 h-6 rounded-full bg-white/20 blur-sm" />
          <div className="absolute top-4 right-12 w-20 h-5 rounded-full bg-white/15 blur-sm" />

          {/* Pitch strip */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0" style={{
            width: 60, height: PITCH_HEIGHT * 0.85,
            background: "linear-gradient(180deg, hsl(40 50% 55%) 0%, hsl(35 45% 50%) 50%, hsl(30 40% 45%) 100%)",
            borderRadius: "4px 4px 0 0"
          }} />

          {/* Crease lines */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-[60px] w-[80px] h-[2px] bg-white/70" />
          <div className="absolute left-1/2 -translate-x-1/2 top-[80px] w-[80px] h-[2px] bg-white/70" />

          {/* Stumps - bowler end */}
          <div className="absolute left-1/2 -translate-x-1/2 top-[70px] flex gap-[3px]">
            {[0,1,2].map(i => <div key={i} className="w-[3px] h-[20px] bg-yellow-200/90 rounded-t-full" />)}
          </div>

          {/* Stumps - batsman end */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-[50px] flex gap-[3px]">
            {[0,1,2].map(i => <div key={i} className="w-[3px] h-[20px] bg-yellow-200/90 rounded-t-full" />)}
          </div>

          {/* Bowler */}
          <div className="absolute left-1/2 -translate-x-1/2 top-[30px]">
            <div className="w-8 h-8 rounded-full bg-gradient-to-b from-blue-400 to-blue-600 border-2 border-white/30 flex items-center justify-center text-xs">🎳</div>
          </div>

          {/* Batsman */}
          <motion.div className="absolute left-1/2 -translate-x-1/2 bottom-[80px]"
            animate={swingPhase === "swing" ? { rotate: [-10, 45, 0], scale: [1, 1.1, 1] } : {}}>
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-b from-amber-400 to-amber-600 border-2 border-white/30 flex items-center justify-center text-lg">🏏</div>
              {/* Bat */}
              <div className="absolute -right-3 top-1/2 w-8 h-[3px] bg-yellow-200 rounded origin-left"
                style={{ transform: swingPhase === "swing" ? "rotate(-30deg)" : "rotate(10deg)" }} />
            </div>
          </motion.div>

          {/* Ball */}
          {ballInPlay && (
            <motion.div className="absolute left-1/2 -translate-x-1/2" style={{
              left: `${ballPos.x * 100}%`,
              top: `${15 + ballPos.y * 70}%`,
            }}>
              <div className="relative">
                <div className="w-4 h-4 rounded-full" style={{
                  background: "radial-gradient(circle at 35% 35%, hsl(0 85% 60%), hsl(0 80% 35%))",
                  boxShadow: "0 0 10px hsl(0 80% 50% / 0.6), 0 2px 4px rgba(0,0,0,0.4)"
                }} />
                {/* Ball seam */}
                <div className="absolute inset-0 rounded-full border border-white/30" />
              </div>
            </motion.div>
          )}

          {/* Timing zone indicator */}
          {ballInPlay && (
            <div className="absolute left-1/2 -translate-x-1/2 bottom-[100px] w-[80px] h-[40px] border-2 border-dashed rounded-lg"
              style={{
                borderColor: canHit.current ? "hsl(120 80% 50% / 0.7)" : "hsl(0 0% 50% / 0.3)",
                background: canHit.current ? "hsl(120 80% 50% / 0.1)" : "transparent"
              }} />
          )}

          {/* Shot result overlay */}
          <AnimatePresence>
            {showResult && shotResult && (
              <motion.div className="absolute inset-0 flex items-center justify-center z-10"
                initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                <div className={`text-4xl font-black ${resultColors[shotResult]} drop-shadow-lg`}
                  style={{ textShadow: "0 0 30px currentColor, 0 0 60px currentColor" }}>
                  {resultLabels[shotResult]}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Zone indicators at bottom */}
          <div className="absolute bottom-2 left-0 right-0 flex justify-around px-8">
            {BALL_ZONES.map((z, i) => (
              <div key={i} className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{
                color: z.color, background: `${z.color}20`, border: `1px solid ${z.color}40`,
                opacity: ballInPlay && ballZone === i ? 1 : 0.4
              }}>{z.label}</div>
            ))}
          </div>
        </div>

        {/* Shot buttons */}
        <div className="grid grid-cols-4 gap-2 w-full max-w-[360px]">
          {SHOT_TYPES.map((shot, i) => (
            <Button key={shot.name} variant="outline" size="sm"
              className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 font-mono text-xs"
              onClick={() => attemptShot(i)}
              disabled={!ballInPlay || !canHit.current}>
              {shot.name} [{shot.key.toUpperCase()}]
            </Button>
          ))}
        </div>

        {/* Bowl button */}
        {!ballInPlay && !showResult && (
          <Button onClick={bowlBall} className="bg-gradient-to-r from-emerald-600 to-green-500 text-foreground font-bold px-8">
            🎳 Bowl [SPACE]
          </Button>
        )}

        {/* Controls hint */}
        <p className="text-xs text-muted-foreground font-mono">
          SPACE = Bowl | D = Drive | P = Pull | C = Cut | F = Defend
        </p>
      </div>
      <Leaderboard gameType="cricket" />
    </GameShell>
  );
};

export default CricketGame;
