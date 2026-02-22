import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface BubbleShooterGameProps {
  onBack: () => void;
  submitScore: (gameType: string, score: number, time?: number) => void;
  GameShell: React.ComponentType<any>;
  StartScreen: React.ComponentType<any>;
  EndScreen: React.ComponentType<any>;
  Leaderboard: React.ComponentType<any>;
  game: { title: string; description: string; icon: React.ReactNode; gradient: string; glow: string };
}

const COLS = 10;
const ROWS = 12;
const BUBBLE_R = 22;
const BOARD_W = COLS * BUBBLE_R * 2 + BUBBLE_R;
const BOARD_H = 560;
const COLORS = [
  "hsl(0 75% 55%)",   // red
  "hsl(210 80% 55%)", // blue
  "hsl(120 65% 45%)", // green
  "hsl(45 90% 55%)",  // yellow
  "hsl(280 70% 55%)", // purple
  "hsl(30 85% 55%)",  // orange
];

interface Bubble {
  row: number;
  col: number;
  color: number;
}

interface FlyingBubble {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: number;
}

const getBubblePos = (row: number, col: number) => {
  const offset = row % 2 === 1 ? BUBBLE_R : 0;
  return {
    x: col * BUBBLE_R * 2 + BUBBLE_R + offset,
    y: row * (BUBBLE_R * 1.73) + BUBBLE_R + 10,
  };
};

const BubbleShooterGame = ({ onBack, submitScore, GameShell, StartScreen, EndScreen, Leaderboard, game }: BubbleShooterGameProps) => {
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [grid, setGrid] = useState<(number | null)[][]>([]);
  const [currentColor, setCurrentColor] = useState(0);
  const [nextColor, setNextColor] = useState(0);
  const [aimAngle, setAimAngle] = useState(-Math.PI / 2);
  const [flying, setFlying] = useState<FlyingBubble | null>(null);
  const [popping, setPopping] = useState<{ x: number; y: number; color: number }[]>([]);
  const [shotsLeft, setShotsLeft] = useState(50);
  const [level, setLevel] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>();

  const initGrid = useCallback(() => {
    const rows: (number | null)[][] = [];
    const fillRows = Math.min(4 + level, ROWS - 3);
    for (let r = 0; r < ROWS; r++) {
      const maxCols = r % 2 === 1 ? COLS - 1 : COLS;
      const row: (number | null)[] = [];
      for (let c = 0; c < maxCols; c++) {
        row.push(r < fillRows ? Math.floor(Math.random() * Math.min(3 + level, COLORS.length)) : null);
      }
      rows.push(row);
    }
    return rows;
  }, [level]);

  const initGame = () => {
    const g = initGrid();
    setGrid(g);
    setScore(0);
    setShotsLeft(50);
    setLevel(1);
    setCurrentColor(Math.floor(Math.random() * 4));
    setNextColor(Math.floor(Math.random() * 4));
    setFlying(null);
    setPopping([]);
    setGameOver(false);
    setStarted(true);
  };

  // Find connected same-color bubbles (flood fill)
  const findCluster = useCallback((g: (number | null)[][], row: number, col: number, color: number): [number, number][] => {
    const visited = new Set<string>();
    const cluster: [number, number][] = [];
    const stack: [number, number][] = [[row, col]];
    while (stack.length > 0) {
      const [r, c] = stack.pop()!;
      const key = `${r},${c}`;
      if (visited.has(key)) continue;
      visited.add(key);
      if (r < 0 || r >= g.length || c < 0 || c >= (g[r]?.length ?? 0)) continue;
      if (g[r][c] !== color) continue;
      cluster.push([r, c]);
      // Get neighbors
      const isOdd = r % 2 === 1;
      const neighbors: [number, number][] = [
        [r, c - 1], [r, c + 1],
        [r - 1, c], [r + 1, c],
        [r - 1, isOdd ? c + 1 : c - 1],
        [r + 1, isOdd ? c + 1 : c - 1],
      ];
      for (const n of neighbors) stack.push(n);
    }
    return cluster;
  }, []);

  // Find floating bubbles (not connected to top)
  const findFloating = useCallback((g: (number | null)[][]) => {
    const visited = new Set<string>();
    const stack: [number, number][] = [];
    // Start from top row
    for (let c = 0; c < (g[0]?.length ?? 0); c++) {
      if (g[0][c] !== null) stack.push([0, c]);
    }
    while (stack.length > 0) {
      const [r, c] = stack.pop()!;
      const key = `${r},${c}`;
      if (visited.has(key)) continue;
      visited.add(key);
      if (r < 0 || r >= g.length || c < 0 || c >= (g[r]?.length ?? 0)) continue;
      if (g[r][c] === null) continue;
      const isOdd = r % 2 === 1;
      const neighbors: [number, number][] = [
        [r, c - 1], [r, c + 1],
        [r - 1, c], [r + 1, c],
        [r - 1, isOdd ? c + 1 : c - 1],
        [r + 1, isOdd ? c + 1 : c - 1],
      ];
      for (const n of neighbors) stack.push(n);
    }
    const floating: [number, number][] = [];
    for (let r = 0; r < g.length; r++) {
      for (let c = 0; c < (g[r]?.length ?? 0); c++) {
        if (g[r][c] !== null && !visited.has(`${r},${c}`)) {
          floating.push([r, c]);
        }
      }
    }
    return floating;
  }, []);

  const shoot = useCallback(() => {
    if (flying || gameOver) return;
    const startX = BOARD_W / 2;
    const startY = BOARD_H - 30;
    const speed = 14;
    setFlying({
      x: startX, y: startY,
      vx: Math.cos(aimAngle) * speed,
      vy: Math.sin(aimAngle) * speed,
      color: currentColor,
    });
    setCurrentColor(nextColor);
    setNextColor(Math.floor(Math.random() * Math.min(3 + level, COLORS.length)));
    setShotsLeft(s => s - 1);
  }, [flying, gameOver, aimAngle, currentColor, nextColor, level]);

  // Game loop for flying bubble
  useEffect(() => {
    if (!flying || !started || gameOver) return;

    const loop = () => {
      setFlying(prev => {
        if (!prev) return null;
        let { x, y, vx, vy, color } = prev;
        x += vx;
        y += vy;

        // Wall bounce
        if (x < BUBBLE_R) { x = BUBBLE_R; vx = -vx; }
        if (x > BOARD_W - BUBBLE_R) { x = BOARD_W - BUBBLE_R; vx = -vx; }

        // Check collision with grid bubbles
        let landed = false;
        let landRow = -1, landCol = -1;

        if (y <= BUBBLE_R + 10) {
          landed = true;
          landRow = 0;
          const offset = 0;
          landCol = Math.round((x - BUBBLE_R - offset) / (BUBBLE_R * 2));
          landCol = Math.max(0, Math.min(COLS - 1, landCol));
        } else {
          setGrid(g => {
            for (let r = 0; r < g.length && !landed; r++) {
              for (let c = 0; c < (g[r]?.length ?? 0) && !landed; c++) {
                if (g[r][c] === null) continue;
                const pos = getBubblePos(r, c);
                const dx = x - pos.x;
                const dy = y - pos.y;
                if (Math.sqrt(dx * dx + dy * dy) < BUBBLE_R * 1.8) {
                  landed = true;
                  // Find best empty neighbor
                  const isOdd = r % 2 === 1;
                  const neighbors: [number, number][] = [
                    [r, c - 1], [r, c + 1],
                    [r - 1, c], [r + 1, c],
                    [r - 1, isOdd ? c + 1 : c - 1],
                    [r + 1, isOdd ? c + 1 : c - 1],
                  ];
                  let bestDist = Infinity;
                  for (const [nr, nc] of neighbors) {
                    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= (nr % 2 === 1 ? COLS - 1 : COLS)) continue;
                    while (g.length <= nr) g.push(Array(nr % 2 === 1 ? COLS - 1 : COLS).fill(null));
                    if (g[nr]?.[nc] !== null) continue;
                    const nPos = getBubblePos(nr, nc);
                    const dist = Math.sqrt((x - nPos.x) ** 2 + (y - nPos.y) ** 2);
                    if (dist < bestDist) { bestDist = dist; landRow = nr; landCol = nc; }
                  }
                }
              }
            }
            return g;
          });
        }

        if (landed && landRow >= 0 && landCol >= 0) {
          // Place bubble
          setGrid(g => {
            const newG = g.map(r => [...r]);
            while (newG.length <= landRow) newG.push(Array(newG.length % 2 === 1 ? COLS - 1 : COLS).fill(null));
            if (landCol < newG[landRow].length) {
              newG[landRow][landCol] = color;
            }

            // Check cluster
            const cluster = findCluster(newG, landRow, landCol, color);
            if (cluster.length >= 3) {
              const popPositions = cluster.map(([r, c]) => {
                const pos = getBubblePos(r, c);
                return { x: pos.x, y: pos.y, color };
              });
              setPopping(popPositions);
              setTimeout(() => setPopping([]), 400);

              for (const [r, c] of cluster) newG[r][c] = null;
              setScore(s => s + cluster.length * 10);

              // Remove floating
              const floating = findFloating(newG);
              if (floating.length > 0) {
                const floatPops = floating.map(([r, c]) => {
                  const pos = getBubblePos(r, c);
                  return { x: pos.x, y: pos.y, color: newG[r][c]! };
                });
                setPopping(p => [...p, ...floatPops]);
                for (const [r, c] of floating) newG[r][c] = null;
                setScore(s => s + floating.length * 15);
              }
            }

            // Check if all cleared (win / next level)
            const anyLeft = newG.some(row => row.some(c => c !== null));
            if (!anyLeft) {
              setScore(s => s + 200);
              setLevel(l => l + 1);
              setShotsLeft(s => s + 20);
              setTimeout(() => {
                setGrid(initGrid());
              }, 500);
            }

            // Check game over - bubbles reached bottom
            for (let r = ROWS - 2; r < newG.length; r++) {
              if (newG[r]?.some(c => c !== null)) {
                setGameOver(true);
                setScore(s => { submitScore("bubble_shooter", s); return s; });
                break;
              }
            }

            return newG;
          });

          setShotsLeft(s => {
            if (s <= 1) {
              setGameOver(true);
              setScore(sc => { submitScore("bubble_shooter", sc); return sc; });
            }
            return s;
          });

          return null; // Stop flying
        }

        // Off top
        if (y < -50) return null;

        return { x, y, vx, vy, color };
      });

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [flying, started, gameOver, findCluster, findFloating, submitScore, initGrid]);

  // Mouse aim
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current || flying) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const sx = BOARD_W / 2;
    const sy = BOARD_H - 30;
    const angle = Math.atan2(my - sy, mx - sx);
    setAimAngle(Math.max(-Math.PI + 0.15, Math.min(-0.15, angle)));
  }, [flying]);

  // Click / key to shoot
  useEffect(() => {
    if (!started || gameOver) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Space") { e.preventDefault(); shoot(); }
      if (e.key === "ArrowLeft") setAimAngle(a => Math.max(-Math.PI + 0.15, a - 0.05));
      if (e.key === "ArrowRight") setAimAngle(a => Math.min(-0.15, a + 0.05));
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [started, gameOver, shoot]);

  if (!started) return <StartScreen title={game.title} description={game.description} icon={game.icon} gradient={game.gradient} glow={game.glow} onStart={initGame} onBack={onBack} gameType="bubble_shooter" />;
  if (gameOver) return <EndScreen won={score >= 300} title={`Score: ${score}!`} subtitle={`Level ${level} reached — ${50 - shotsLeft} shots fired`} onReplay={initGame} onBack={onBack} gameType="bubble_shooter" />;

  const shooterX = BOARD_W / 2;
  const shooterY = BOARD_H - 30;
  const aimEndX = shooterX + Math.cos(aimAngle) * 80;
  const aimEndY = shooterY + Math.sin(aimAngle) * 80;

  return (
    <GameShell onBack={onBack} title="Bubble Shooter" icon={game.icon} gradient={game.gradient}
      badges={<>
        <Badge className="bg-pink-900/40 text-pink-300 border-pink-500/30 font-mono">{score} pts</Badge>
        <Badge className="bg-cyan-900/40 text-cyan-300 border-cyan-500/30 font-mono">Lvl {level}</Badge>
        <Badge className="bg-amber-900/40 text-amber-300 border-amber-500/30 font-mono">🎯 {shotsLeft}</Badge>
      </>}>
      <div className="flex flex-col items-center gap-4">
        <div
          ref={canvasRef}
          className="relative rounded-xl overflow-hidden border-2 border-pink-500/20 cursor-crosshair select-none"
          style={{
            width: BOARD_W,
            height: BOARD_H,
            background: "linear-gradient(180deg, hsl(240 30% 8%) 0%, hsl(260 25% 12%) 50%, hsl(240 20% 6%) 100%)"
          }}
          onMouseMove={handleMouseMove}
          onClick={shoot}
        >
          {/* Stars background */}
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white/20" style={{
              width: Math.random() * 2 + 1, height: Math.random() * 2 + 1,
              left: `${Math.random() * 100}%`, top: `${Math.random() * 70}%`,
            }} />
          ))}

          {/* Grid bubbles */}
          {grid.map((row, r) => row.map((color, c) => {
            if (color === null) return null;
            const pos = getBubblePos(r, c);
            return (
              <div key={`${r}-${c}`} className="absolute" style={{
                left: pos.x - BUBBLE_R, top: pos.y - BUBBLE_R,
                width: BUBBLE_R * 2, height: BUBBLE_R * 2,
              }}>
                <div className="w-full h-full rounded-full" style={{
                  background: `radial-gradient(circle at 35% 30%, ${COLORS[color]}dd, ${COLORS[color]}90 60%, ${COLORS[color]}50)`,
                  boxShadow: `0 0 12px ${COLORS[color]}60, inset 0 -4px 8px ${COLORS[color]}40, inset 0 2px 4px hsl(0 0% 100% / 0.3)`,
                  border: `1px solid ${COLORS[color]}80`,
                }}>
                  {/* Shine */}
                  <div className="absolute top-[15%] left-[20%] w-[30%] h-[25%] rounded-full bg-white/30 blur-[1px]" />
                </div>
              </div>
            );
          }))}

          {/* Popping animation */}
          <AnimatePresence>
            {popping.map((p, i) => (
              <motion.div key={`pop-${i}`}
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 2, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="absolute rounded-full"
                style={{
                  left: p.x - BUBBLE_R, top: p.y - BUBBLE_R,
                  width: BUBBLE_R * 2, height: BUBBLE_R * 2,
                  background: `radial-gradient(circle, ${COLORS[p.color]}aa, transparent)`,
                }}
              />
            ))}
          </AnimatePresence>

          {/* Flying bubble */}
          {flying && (
            <div className="absolute" style={{
              left: flying.x - BUBBLE_R, top: flying.y - BUBBLE_R,
              width: BUBBLE_R * 2, height: BUBBLE_R * 2,
            }}>
              <div className="w-full h-full rounded-full" style={{
                background: `radial-gradient(circle at 35% 30%, ${COLORS[flying.color]}dd, ${COLORS[flying.color]}90)`,
                boxShadow: `0 0 20px ${COLORS[flying.color]}80`,
              }}>
                <div className="absolute top-[15%] left-[20%] w-[30%] h-[25%] rounded-full bg-white/30 blur-[1px]" />
              </div>
            </div>
          )}

          {/* Aim line */}
          {!flying && (
            <svg className="absolute inset-0 pointer-events-none" width={BOARD_W} height={BOARD_H}>
              <line x1={shooterX} y1={shooterY} x2={aimEndX} y2={aimEndY}
                stroke="hsl(0 0% 100% / 0.4)" strokeWidth="2" strokeDasharray="6 4" />
              {/* Extended guide dots */}
              {Array.from({ length: 8 }).map((_, i) => {
                const t = (i + 2) * 20;
                return (
                  <circle key={i}
                    cx={shooterX + Math.cos(aimAngle) * t}
                    cy={shooterY + Math.sin(aimAngle) * t}
                    r="2" fill="hsl(0 0% 100% / 0.2)" />
                );
              })}
            </svg>
          )}

          {/* Shooter platform */}
          <div className="absolute bottom-0 left-0 right-0 h-16" style={{
            background: "linear-gradient(0deg, hsl(240 20% 10%) 0%, transparent 100%)"
          }}>
            {/* Current bubble */}
            <div className="absolute rounded-full" style={{
              left: shooterX - BUBBLE_R, bottom: 10,
              width: BUBBLE_R * 2, height: BUBBLE_R * 2,
              background: `radial-gradient(circle at 35% 30%, ${COLORS[currentColor]}dd, ${COLORS[currentColor]}90)`,
              boxShadow: `0 0 20px ${COLORS[currentColor]}60`,
              border: `2px solid hsl(0 0% 100% / 0.3)`,
            }}>
              <div className="absolute top-[15%] left-[20%] w-[30%] h-[25%] rounded-full bg-white/30 blur-[1px]" />
            </div>
            {/* Next bubble preview */}
            <div className="absolute rounded-full" style={{
              left: shooterX + BUBBLE_R * 2.5, bottom: 16,
              width: BUBBLE_R * 1.3, height: BUBBLE_R * 1.3,
              background: `radial-gradient(circle, ${COLORS[nextColor]}aa, ${COLORS[nextColor]}60)`,
              border: `1px solid hsl(0 0% 100% / 0.15)`,
            }} />
            <span className="absolute text-[9px] text-white/40 font-mono" style={{
              left: shooterX + BUBBLE_R * 2.2, bottom: 6,
            }}>NEXT</span>
          </div>
        </div>

        {/* Mobile controls */}
        <div className="grid grid-cols-3 gap-2 w-48 md:hidden">
          <Button size="sm" variant="outline" className="border-pink-500/30 h-10"
            onClick={() => setAimAngle(a => Math.max(-Math.PI + 0.15, a - 0.08))}>◀</Button>
          <Button size="sm" variant="outline" className="border-pink-500/30 h-10"
            onClick={shoot}>🔵 Shoot</Button>
          <Button size="sm" variant="outline" className="border-pink-500/30 h-10"
            onClick={() => setAimAngle(a => Math.min(-0.15, a + 0.08))}>▶</Button>
        </div>

        <p className="text-xs text-muted-foreground font-mono">Click to shoot • ← → to aim • Space to fire</p>
      </div>
      <Leaderboard gameType="bubble_shooter" />
    </GameShell>
  );
};

export default BubbleShooterGame;
