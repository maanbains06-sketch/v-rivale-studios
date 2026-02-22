import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface SpaceInvadersGameProps {
  onBack: () => void;
  submitScore: (gameType: string, score: number, time?: number) => void;
  GameShell: React.ComponentType<any>;
  StartScreen: React.ComponentType<any>;
  EndScreen: React.ComponentType<any>;
  Leaderboard: React.ComponentType<any>;
  game: { title: string; description: string; icon: React.ReactNode; gradient: string; glow: string };
}

const BOARD_W = 480;
const BOARD_H = 560;
const PLAYER_W = 44;
const PLAYER_H = 28;
const BULLET_SPEED = 8;
const ENEMY_COLS = 8;
const ENEMY_ROWS = 5;
const ENEMY_SIZE = 32;
const ENEMY_GAP = 10;

interface Enemy {
  id: number;
  row: number;
  col: number;
  x: number;
  y: number;
  alive: boolean;
  type: number; // 0-2 different alien types
}

interface Bullet {
  id: number;
  x: number;
  y: number;
  isEnemy: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

const ALIEN_DESIGNS = [
  // Type 0 - squid
  { body: "hsl(120 70% 55%)", eyes: "⟁", shape: "M4 8L16 0L28 8L24 16H8Z" },
  // Type 1 - crab
  { body: "hsl(200 75% 55%)", eyes: "◈", shape: "M2 12L16 2L30 12L26 20H6Z" },
  // Type 2 - octopus
  { body: "hsl(320 70% 55%)", eyes: "◉", shape: "M6 6L16 0L26 6V16H6Z" },
];

const SpaceInvadersGame = ({ onBack, submitScore, GameShell, StartScreen, EndScreen, Leaderboard, game }: SpaceInvadersGameProps) => {
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [playerX, setPlayerX] = useState(BOARD_W / 2);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [enemyDir, setEnemyDir] = useState(1);
  const [enemySpeed, setEnemySpeed] = useState(0.5);
  const [canShoot, setCanShoot] = useState(true);
  const frameRef = useRef<number>();
  const keysRef = useRef<Set<string>>(new Set());
  const bulletId = useRef(0);
  const particleId = useRef(0);
  const lastEnemyShot = useRef(0);

  const spawnEnemies = useCallback((w: number) => {
    const en: Enemy[] = [];
    let id = 0;
    const rows = Math.min(ENEMY_ROWS + Math.floor(w / 3), 7);
    const startX = (BOARD_W - (ENEMY_COLS * (ENEMY_SIZE + ENEMY_GAP))) / 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < ENEMY_COLS; c++) {
        en.push({
          id: id++, row: r, col: c,
          x: startX + c * (ENEMY_SIZE + ENEMY_GAP),
          y: 40 + r * (ENEMY_SIZE + ENEMY_GAP),
          alive: true,
          type: r < 1 ? 2 : r < 3 ? 1 : 0,
        });
      }
    }
    return en;
  }, []);

  const initGame = () => {
    setScore(0); setLives(3); setWave(1);
    setPlayerX(BOARD_W / 2);
    setEnemies(spawnEnemies(1));
    setBullets([]); setParticles([]);
    setEnemyDir(1); setEnemySpeed(0.5);
    setCanShoot(true); setGameOver(false); setStarted(true);
    lastEnemyShot.current = 0;
  };

  const addParticles = useCallback((x: number, y: number, color: string, count = 8) => {
    const parts: Particle[] = [];
    for (let i = 0; i < count; i++) {
      parts.push({
        id: particleId.current++,
        x, y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 20 + Math.random() * 15,
        color,
      });
    }
    setParticles(p => [...p, ...parts]);
  }, []);

  // Key handling
  useEffect(() => {
    if (!started || gameOver) return;
    const down = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (e.code === "Space") {
        e.preventDefault();
        if (canShoot) {
          setBullets(b => [...b, { id: bulletId.current++, x: playerX, y: BOARD_H - 50, isEnemy: false }]);
          setCanShoot(false);
          setTimeout(() => setCanShoot(true), 250);
        }
      }
    };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [started, gameOver, canShoot, playerX]);

  // Main game loop
  useEffect(() => {
    if (!started || gameOver) return;

    const loop = () => {
      // Player movement
      const keys = keysRef.current;
      setPlayerX(px => {
        let nx = px;
        if (keys.has("ArrowLeft") || keys.has("a")) nx -= 5;
        if (keys.has("ArrowRight") || keys.has("d")) nx += 5;
        return Math.max(PLAYER_W / 2, Math.min(BOARD_W - PLAYER_W / 2, nx));
      });

      // Move bullets
      setBullets(prev => prev.map(b => ({
        ...b, y: b.y + (b.isEnemy ? 3.5 : -BULLET_SPEED)
      })).filter(b => b.y > -10 && b.y < BOARD_H + 10));

      // Move enemies
      setEnemies(prev => {
        let hitEdge = false;
        const updated = prev.map(e => {
          if (!e.alive) return e;
          const nx = e.x + enemyDir * enemySpeed;
          if (nx < 5 || nx > BOARD_W - ENEMY_SIZE - 5) hitEdge = true;
          return { ...e, x: nx };
        });
        if (hitEdge) {
          setEnemyDir(d => -d);
          return updated.map(e => ({ ...e, y: e.y + 12 }));
        }
        return updated;
      });

      // Enemy shooting
      lastEnemyShot.current++;
      if (lastEnemyShot.current > 60) {
        lastEnemyShot.current = 0;
        setEnemies(prev => {
          const alive = prev.filter(e => e.alive);
          if (alive.length > 0) {
            const shooter = alive[Math.floor(Math.random() * alive.length)];
            setBullets(b => [...b, {
              id: bulletId.current++,
              x: shooter.x + ENEMY_SIZE / 2,
              y: shooter.y + ENEMY_SIZE,
              isEnemy: true,
            }]);
          }
          return prev;
        });
      }

      // Collision: player bullets vs enemies
      setBullets(bPrev => {
        const toRemove = new Set<number>();
        setEnemies(ePrev => {
          const updated = ePrev.map(e => {
            if (!e.alive) return e;
            for (const b of bPrev) {
              if (b.isEnemy) continue;
              if (toRemove.has(b.id)) continue;
              if (b.x > e.x && b.x < e.x + ENEMY_SIZE && b.y > e.y && b.y < e.y + ENEMY_SIZE) {
                toRemove.add(b.id);
                const pts = (e.type + 1) * 30;
                setScore(s => s + pts);
                addParticles(e.x + ENEMY_SIZE / 2, e.y + ENEMY_SIZE / 2, ALIEN_DESIGNS[e.type].body);
                return { ...e, alive: false };
              }
            }
            return e;
          });

          // Check wave clear
          if (updated.every(e => !e.alive)) {
            setWave(w => {
              const nw = w + 1;
              setEnemies(spawnEnemies(nw));
              setEnemySpeed(0.5 + nw * 0.15);
              setScore(s => s + 100);
              return nw;
            });
          }

          // Check enemies reached bottom
          if (updated.some(e => e.alive && e.y + ENEMY_SIZE > BOARD_H - 60)) {
            setGameOver(true);
            setScore(s => { submitScore("space_invaders", s); return s; });
          }

          return updated;
        });
        return bPrev.filter(b => !toRemove.has(b.id));
      });

      // Collision: enemy bullets vs player
      setBullets(bPrev => {
        const toRemove = new Set<number>();
        setPlayerX(px => {
          for (const b of bPrev) {
            if (!b.isEnemy) continue;
            if (b.x > px - PLAYER_W / 2 && b.x < px + PLAYER_W / 2 && b.y > BOARD_H - 50 && b.y < BOARD_H - 20) {
              toRemove.add(b.id);
              addParticles(px, BOARD_H - 40, "hsl(45 90% 60%)", 12);
              setLives(l => {
                if (l <= 1) {
                  setGameOver(true);
                  setScore(s => { submitScore("space_invaders", s); return s; });
                }
                return l - 1;
              });
            }
          }
          return px;
        });
        return bPrev.filter(b => !toRemove.has(b.id));
      });

      // Update particles
      setParticles(prev => prev.map(p => ({
        ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - 1,
      })).filter(p => p.life > 0));

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [started, gameOver, enemyDir, enemySpeed, addParticles, spawnEnemies, submitScore]);

  if (!started) return <StartScreen title={game.title} description={game.description} icon={game.icon} gradient={game.gradient} glow={game.glow} onStart={initGame} onBack={onBack} gameType="space_invaders" />;
  if (gameOver) return <EndScreen won={score >= 500} title={`Score: ${score}!`} subtitle={`Wave ${wave} reached • ${enemies.filter(e => !e.alive).length} aliens destroyed`} onReplay={initGame} onBack={onBack} gameType="space_invaders" />;

  return (
    <GameShell onBack={onBack} title="Space Invaders" icon={game.icon} gradient={game.gradient}
      badges={<>
        <Badge className="bg-green-900/40 text-green-300 border-green-500/30 font-mono">{score} pts</Badge>
        <Badge className="bg-red-900/40 text-red-300 border-red-500/30 font-mono">❤️ {lives}</Badge>
        <Badge className="bg-purple-900/40 text-purple-300 border-purple-500/30 font-mono">Wave {wave}</Badge>
      </>}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative rounded-xl overflow-hidden border-2 border-green-500/20 select-none"
          style={{ width: BOARD_W, height: BOARD_H, background: "linear-gradient(180deg, hsl(240 30% 3%) 0%, hsl(260 25% 6%) 100%)" }}
          onClick={() => {
            if (canShoot) {
              setBullets(b => [...b, { id: bulletId.current++, x: playerX, y: BOARD_H - 50, isEnemy: false }]);
              setCanShoot(false);
              setTimeout(() => setCanShoot(true), 250);
            }
          }}>
          {/* Stars */}
          {Array.from({ length: 60 }).map((_, i) => (
            <div key={i} className="absolute rounded-full" style={{
              width: Math.random() * 2 + 0.5, height: Math.random() * 2 + 0.5,
              left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
              background: `hsl(${Math.random() * 60 + 200} 60% ${50 + Math.random() * 30}%)`,
              opacity: 0.3 + Math.random() * 0.4,
            }} />
          ))}

          {/* Enemies */}
          {enemies.filter(e => e.alive).map(e => {
            const design = ALIEN_DESIGNS[e.type];
            return (
              <motion.div key={e.id}
                className="absolute flex items-center justify-center"
                style={{ left: e.x, top: e.y, width: ENEMY_SIZE, height: ENEMY_SIZE }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: e.col * 0.1 }}>
                <div className="w-full h-full rounded-md relative" style={{
                  background: `radial-gradient(circle at 50% 40%, ${design.body}, ${design.body}80)`,
                  boxShadow: `0 0 10px ${design.body}60, inset 0 -3px 6px ${design.body}40`,
                  clipPath: e.type === 0
                    ? "polygon(20% 0%, 80% 0%, 100% 40%, 90% 100%, 70% 80%, 50% 100%, 30% 80%, 10% 100%, 0% 40%)"
                    : e.type === 1
                    ? "polygon(10% 20%, 30% 0%, 70% 0%, 90% 20%, 100% 60%, 85% 100%, 15% 100%, 0% 60%)"
                    : "polygon(25% 0%, 75% 0%, 100% 30%, 100% 70%, 80% 100%, 60% 85%, 40% 85%, 20% 100%, 0% 70%, 0% 30%)"
                }}>
                  {/* Eyes */}
                  <div className="absolute flex gap-[4px]" style={{ top: '30%', left: '50%', transform: 'translateX(-50%)' }}>
                    <div className="w-[5px] h-[5px] rounded-full bg-white shadow-[0_0_4px_white]" />
                    <div className="w-[5px] h-[5px] rounded-full bg-white shadow-[0_0_4px_white]" />
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Bullets */}
          {bullets.map(b => (
            <div key={b.id} className="absolute" style={{
              left: b.x - 2, top: b.y - 6,
              width: 4, height: 12,
              borderRadius: 2,
              background: b.isEnemy
                ? "linear-gradient(180deg, hsl(0 80% 60%), hsl(30 90% 50%))"
                : "linear-gradient(180deg, hsl(120 80% 70%), hsl(180 90% 60%))",
              boxShadow: b.isEnemy
                ? "0 0 8px hsl(0 80% 60%), 0 0 16px hsl(0 80% 60% / 0.5)"
                : "0 0 8px hsl(120 80% 60%), 0 0 16px hsl(120 80% 60% / 0.5)",
            }} />
          ))}

          {/* Particles */}
          {particles.map(p => (
            <div key={p.id} className="absolute rounded-full" style={{
              left: p.x - 2, top: p.y - 2,
              width: 4, height: 4,
              background: p.color,
              opacity: p.life / 30,
              boxShadow: `0 0 4px ${p.color}`,
            }} />
          ))}

          {/* Player ship */}
          <div className="absolute" style={{
            left: playerX - PLAYER_W / 2,
            top: BOARD_H - 48,
            width: PLAYER_W, height: PLAYER_H,
          }}>
            <div className="w-full h-full relative">
              {/* Ship body */}
              <div className="absolute inset-0" style={{
                background: "linear-gradient(180deg, hsl(200 80% 55%), hsl(220 70% 40%))",
                clipPath: "polygon(50% 0%, 100% 70%, 90% 100%, 10% 100%, 0% 70%)",
                boxShadow: "0 0 15px hsl(200 80% 55% / 0.5)",
              }} />
              {/* Cockpit */}
              <div className="absolute" style={{
                left: '35%', top: '25%', width: '30%', height: '35%',
                borderRadius: '50%',
                background: "radial-gradient(circle, hsl(180 90% 70%), hsl(200 80% 50%))",
                boxShadow: "0 0 8px hsl(180 90% 70% / 0.6)",
              }} />
              {/* Engine glow */}
              <div className="absolute bottom-[-4px] left-[30%] w-[40%] h-[8px] rounded-b-full"
                style={{
                  background: "radial-gradient(ellipse, hsl(30 90% 60%), hsl(0 80% 50%), transparent)",
                  boxShadow: "0 4px 12px hsl(30 90% 60% / 0.6)",
                  animation: "pulse 0.3s infinite alternate",
                }} />
            </div>
          </div>

          {/* Ground line */}
          <div className="absolute bottom-12 left-4 right-4 h-px bg-green-500/20" />

          {/* Score popup area */}
          <div className="absolute top-2 left-0 right-0 flex justify-center">
            <span className="text-[10px] font-mono text-green-400/50">WAVE {wave}</span>
          </div>
        </div>

        {/* Mobile controls */}
        <div className="grid grid-cols-3 gap-2 w-56 md:hidden">
          <Button size="sm" variant="outline" className="border-green-500/30 h-12 text-lg"
            onTouchStart={() => keysRef.current.add("ArrowLeft")}
            onTouchEnd={() => keysRef.current.delete("ArrowLeft")}>◀</Button>
          <Button size="sm" variant="outline" className="border-red-500/30 h-12 text-lg"
            onClick={() => {
              if (canShoot) {
                setBullets(b => [...b, { id: bulletId.current++, x: playerX, y: BOARD_H - 50, isEnemy: false }]);
                setCanShoot(false);
                setTimeout(() => setCanShoot(true), 250);
              }
            }}>🔫</Button>
          <Button size="sm" variant="outline" className="border-green-500/30 h-12 text-lg"
            onTouchStart={() => keysRef.current.add("ArrowRight")}
            onTouchEnd={() => keysRef.current.delete("ArrowRight")}>▶</Button>
        </div>

        <p className="text-xs text-muted-foreground font-mono">← → to move • Space to shoot • Click to fire</p>
      </div>
      <Leaderboard gameType="space_invaders" />
    </GameShell>
  );
};

export default SpaceInvadersGame;
