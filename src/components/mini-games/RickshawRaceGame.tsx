import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface RickshawRaceGameProps {
  onBack: () => void;
  submitScore: (gameType: string, score: number, time?: number) => void;
  GameShell: React.ComponentType<any>;
  StartScreen: React.ComponentType<any>;
  EndScreen: React.ComponentType<any>;
  Leaderboard: React.ComponentType<any>;
  game: { title: string; description: string; icon: React.ReactNode; gradient: string; glow: string };
}

const ROAD_WIDTH = 360;
const ROAD_HEIGHT = 520;
const LANES = [0.2, 0.5, 0.8]; // 3 lanes
const RICKSHAW_SIZE = 40;

interface Obstacle {
  id: number;
  lane: number;
  y: number;
  type: "car" | "pothole" | "cow" | "barrel";
  emoji: string;
}

interface Coin {
  id: number;
  lane: number;
  y: number;
}

const OBSTACLE_EMOJIS: Record<string, string> = {
  car: "🚗", pothole: "🕳️", cow: "🐄", barrel: "🛢️"
};

const RickshawRaceGame = ({ onBack, submitScore, GameShell, StartScreen, EndScreen, Leaderboard, game }: RickshawRaceGameProps) => {
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [lane, setLane] = useState(1); // 0, 1, 2
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(3);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [lives, setLives] = useState(3);
  const [hit, setHit] = useState(false);
  const [boost, setBoost] = useState(false);
  const [boostFuel, setBoostFuel] = useState(100);
  const frameRef = useRef<number>();
  const lastObstacle = useRef(0);
  const lastCoin = useRef(0);
  const obstacleId = useRef(0);
  const coinId = useRef(0);
  const laneRef = useRef(1);

  const initGame = () => {
    setScore(0); setDistance(0); setSpeed(3); setLane(1); laneRef.current = 1;
    setObstacles([]); setCoins([]); setLives(3); setHit(false);
    setBoost(false); setBoostFuel(100); setGameOver(false); setStarted(true);
    lastObstacle.current = 0; lastCoin.current = 0;
    obstacleId.current = 0; coinId.current = 0;
  };

  const switchLane = useCallback((dir: "left" | "right") => {
    if (gameOver) return;
    setLane(prev => {
      const next = dir === "left" ? Math.max(0, prev - 1) : Math.min(2, prev + 1);
      laneRef.current = next;
      return next;
    });
  }, [gameOver]);

  const toggleBoost = useCallback((on: boolean) => {
    if (boostFuel <= 0) return;
    setBoost(on);
  }, [boostFuel]);

  useEffect(() => {
    if (!started || gameOver) return;
    const handleKey = (e: KeyboardEvent) => {
      const key = e.key;
      if (key === "ArrowLeft" || key === "a") switchLane("left");
      if (key === "ArrowRight" || key === "d") switchLane("right");
      if (key === "ArrowUp" || key === "w") toggleBoost(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w") toggleBoost(false);
    };
    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup", handleKeyUp);
    return () => { window.removeEventListener("keydown", handleKey); window.removeEventListener("keyup", handleKeyUp); };
  }, [started, gameOver, switchLane, toggleBoost]);

  useEffect(() => {
    if (!started || gameOver) return;

    let lastTs = 0;
    const gameLoop = (ts: number) => {
      if (!lastTs) lastTs = ts;
      const dt = Math.min((ts - lastTs) / 16, 3); // normalize to ~60fps
      lastTs = ts;

      const currentSpeed = boost ? speed * 1.6 : speed;

      // Update distance/score
      setDistance(d => d + currentSpeed * dt * 0.5);
      setScore(s => s + Math.round(currentSpeed * dt * 0.3));

      // Boost fuel
      if (boost) setBoostFuel(f => Math.max(0, f - dt * 0.8));

      // Spawn obstacles
      lastObstacle.current += dt;
      if (lastObstacle.current > 40 / speed) {
        lastObstacle.current = 0;
        const types: Array<"car" | "pothole" | "cow" | "barrel"> = ["car", "pothole", "cow", "barrel"];
        const type = types[Math.floor(Math.random() * types.length)];
        const obstacleLane = Math.floor(Math.random() * 3);
        setObstacles(prev => [...prev, {
          id: obstacleId.current++, lane: obstacleLane, y: -30,
          type, emoji: OBSTACLE_EMOJIS[type]
        }]);
      }

      // Spawn coins
      lastCoin.current += dt;
      if (lastCoin.current > 25 / speed) {
        lastCoin.current = 0;
        const coinLane = Math.floor(Math.random() * 3);
        setCoins(prev => [...prev, { id: coinId.current++, lane: coinLane, y: -20 }]);
      }

      // Move obstacles
      setObstacles(prev => {
        const updated = prev.map(o => ({ ...o, y: o.y + currentSpeed * dt * 2.5 })).filter(o => o.y < ROAD_HEIGHT + 50);
        // Collision detection
        const currentLane = laneRef.current;
        for (const o of updated) {
          if (o.lane === currentLane && o.y > ROAD_HEIGHT - 90 && o.y < ROAD_HEIGHT - 30) {
            // Hit!
            setHit(true);
            setLives(l => {
              const newL = l - 1;
              if (newL <= 0) {
                setGameOver(true);
                setScore(s => { submitScore("rickshaw_race", s); return s; });
              }
              return newL;
            });
            setTimeout(() => setHit(false), 500);
            return updated.filter(x => x.id !== o.id);
          }
        }
        return updated;
      });

      // Move coins
      setCoins(prev => {
        const updated = prev.map(c => ({ ...c, y: c.y + currentSpeed * dt * 2.5 })).filter(c => c.y < ROAD_HEIGHT + 50);
        const currentLane = laneRef.current;
        const collected: number[] = [];
        for (const c of updated) {
          if (c.lane === currentLane && c.y > ROAD_HEIGHT - 90 && c.y < ROAD_HEIGHT - 30) {
            collected.push(c.id);
            setScore(s => s + 50);
            setBoostFuel(f => Math.min(100, f + 10));
          }
        }
        return collected.length > 0 ? updated.filter(c => !collected.includes(c.id)) : updated;
      });

      // Gradually increase speed
      setSpeed(s => Math.min(s + 0.0003 * dt, 8));

      if (!gameOver) frameRef.current = requestAnimationFrame(gameLoop);
    };

    frameRef.current = requestAnimationFrame(gameLoop);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [started, gameOver, speed, boost, submitScore]);

  if (!started) return <StartScreen title={game.title} description={game.description} icon={game.icon} gradient={game.gradient} glow={game.glow} onStart={initGame} onBack={onBack} gameType="rickshaw_race" />;
  if (gameOver) return <EndScreen won={score >= 500} title={`Score: ${score}!`} subtitle={`${score} pts — Distance: ${Math.round(distance)}m`} onReplay={initGame} onBack={onBack} gameType="rickshaw_race" />;

  const rickshawX = LANES[lane] * ROAD_WIDTH;

  return (
    <GameShell onBack={onBack} title="Auto Rickshaw Race" icon={game.icon} gradient={game.gradient}
      badges={<>
        <Badge className="bg-amber-900/40 text-amber-300 border-amber-500/30 font-mono">{score} pts</Badge>
        <Badge className="bg-red-900/40 text-red-300 border-red-500/30 font-mono">❤️ {lives}</Badge>
        <Badge className="bg-cyan-900/40 text-cyan-300 border-cyan-500/30 font-mono">{Math.round(distance)}m</Badge>
      </>}>
      <div className="flex flex-col items-center gap-4">
        {/* Road */}
        <div className="relative rounded-xl overflow-hidden border-2 border-amber-500/20" style={{
          width: ROAD_WIDTH, height: ROAD_HEIGHT,
          background: "linear-gradient(180deg, hsl(220 15% 15%) 0%, hsl(220 10% 12%) 100%)"
        }}>
          {/* Road markings - animated */}
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div key={i} className="absolute left-1/2 -translate-x-1/2" style={{
              width: 3, height: 30, background: "hsl(50 70% 60% / 0.4)", borderRadius: 2,
            }}
            animate={{ y: [i * 50 - 50, i * 50 + 50] }}
            transition={{ repeat: Infinity, duration: 0.5 / speed, ease: "linear" }}
            />
          ))}

          {/* Lane dividers */}
          {[0.35, 0.65].map((x, i) => (
            <div key={i} className="absolute top-0 bottom-0" style={{
              left: `${x * 100}%`, width: 2,
              background: "repeating-linear-gradient(180deg, hsl(0 0% 60% / 0.3) 0px, hsl(0 0% 60% / 0.3) 20px, transparent 20px, transparent 40px)"
            }} />
          ))}

          {/* Road edges */}
          <div className="absolute left-[4%] top-0 bottom-0 w-[3px] bg-white/30" />
          <div className="absolute right-[4%] top-0 bottom-0 w-[3px] bg-white/30" />

          {/* Pavement/sidewalk left */}
          <div className="absolute left-0 top-0 bottom-0 w-[4%]" style={{
            background: "linear-gradient(90deg, hsl(30 20% 25%), hsl(30 15% 20%))"
          }} />
          <div className="absolute right-0 top-0 bottom-0 w-[4%]" style={{
            background: "linear-gradient(-90deg, hsl(30 20% 25%), hsl(30 15% 20%))"
          }} />

          {/* Obstacles */}
          {obstacles.map(o => (
            <div key={o.id} className="absolute text-2xl" style={{
              left: LANES[o.lane] * ROAD_WIDTH - 15,
              top: o.y,
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
            }}>
              {o.emoji}
            </div>
          ))}

          {/* Coins */}
          {coins.map(c => (
            <div key={c.id} className="absolute" style={{
              left: LANES[c.lane] * ROAD_WIDTH - 8,
              top: c.y,
            }}>
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 border border-yellow-200/50 flex items-center justify-center text-[8px] font-bold shadow-lg shadow-yellow-500/30">₹</div>
            </div>
          ))}

          {/* Rickshaw */}
          <motion.div className="absolute" animate={{ left: rickshawX - RICKSHAW_SIZE / 2 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{ bottom: 50, width: RICKSHAW_SIZE }}>
            <div className={`relative ${hit ? "animate-pulse" : ""}`}>
              {/* Rickshaw body */}
              <div className="relative" style={{ width: RICKSHAW_SIZE, height: RICKSHAW_SIZE + 10 }}>
                {/* Roof/canopy */}
                <div className="absolute -top-1 left-[2px] right-[2px] h-[14px] rounded-t-lg" style={{
                  background: "linear-gradient(135deg, hsl(120 70% 40%), hsl(120 60% 30%))",
                  boxShadow: "0 -2px 6px hsl(120 70% 40% / 0.3)"
                }} />
                {/* Body */}
                <div className="absolute top-[12px] left-0 right-0 h-[24px] rounded-b-lg" style={{
                  background: "linear-gradient(180deg, hsl(50 80% 55%), hsl(45 70% 45%))",
                  border: "1px solid hsl(45 60% 60% / 0.5)"
                }}>
                  {/* Window */}
                  <div className="absolute top-[2px] left-[6px] right-[6px] h-[8px] rounded-sm bg-sky-300/40" />
                </div>
                {/* Front wheel */}
                <div className="absolute bottom-0 left-[2px] w-[10px] h-[10px] rounded-full bg-gray-800 border border-gray-600">
                  <motion.div className="w-full h-full rounded-full border-t-2 border-gray-400" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.3, ease: "linear" }} />
                </div>
                {/* Rear wheels */}
                <div className="absolute bottom-0 right-[2px] w-[10px] h-[10px] rounded-full bg-gray-800 border border-gray-600">
                  <motion.div className="w-full h-full rounded-full border-t-2 border-gray-400" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.3, ease: "linear" }} />
                </div>
                {/* Headlight */}
                <div className="absolute top-[16px] left-1/2 -translate-x-1/2 w-[4px] h-[4px] rounded-full bg-yellow-300"
                  style={{ boxShadow: "0 0 6px hsl(50 100% 70%), 0 -8px 15px hsl(50 100% 70% / 0.3)" }} />
              </div>

              {/* Speed lines when boosting */}
              {boost && <>
                <div className="absolute -bottom-3 left-1 w-6 h-[2px] bg-gradient-to-l from-orange-400 to-transparent animate-pulse" />
                <div className="absolute -bottom-6 left-3 w-4 h-[2px] bg-gradient-to-l from-yellow-400 to-transparent animate-pulse" />
              </>}

              {/* Hit flash */}
              {hit && <div className="absolute inset-0 bg-red-500/50 rounded-lg animate-ping" />}
            </div>
          </motion.div>

          {/* Boost bar */}
          <div className="absolute top-3 left-3 right-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-amber-400">BOOST</span>
              <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                <motion.div className="h-full rounded-full" animate={{ width: `${boostFuel}%` }}
                  style={{ background: boostFuel > 30 ? "linear-gradient(90deg, hsl(45 80% 55%), hsl(30 90% 50%))" : "hsl(0 70% 50%)" }} />
              </div>
            </div>
          </div>

          {/* Speed indicator */}
          <div className="absolute bottom-3 right-3 text-[10px] font-mono text-cyan-400/60">
            {Math.round(speed * 20)} km/h
          </div>
        </div>

        {/* Mobile controls */}
        <div className="grid grid-cols-3 gap-2 w-48 md:hidden">
          <Button size="sm" variant="outline" className="border-amber-500/30 h-10" onClick={() => switchLane("left")}>←</Button>
          <Button size="sm" variant="outline" className="border-amber-500/30 h-10" onClick={() => toggleBoost(!boost)}>🚀</Button>
          <Button size="sm" variant="outline" className="border-amber-500/30 h-10" onClick={() => switchLane("right")}>→</Button>
        </div>

        <p className="text-xs text-muted-foreground font-mono">← → or A/D to switch lanes | ↑ or W to boost</p>
      </div>
      <Leaderboard gameType="rickshaw_race" />
    </GameShell>
  );
};

export default RickshawRaceGame;
