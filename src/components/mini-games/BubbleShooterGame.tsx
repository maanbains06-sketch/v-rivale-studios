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

const COLS = 11;
const ROWS = 14;
const BUBBLE_R = 20;
const BOARD_W = COLS * BUBBLE_R * 2 + BUBBLE_R;
const BOARD_H = 640;

// Bright vivid colors matching the reference image
const COLORS = [
  { main: "hsl(0 85% 55%)", light: "hsl(0 90% 72%)", dark: "hsl(0 80% 38%)", glow: "hsl(0 85% 55% / 0.5)" },       // Red
  { main: "hsl(210 90% 55%)", light: "hsl(210 95% 72%)", dark: "hsl(210 85% 38%)", glow: "hsl(210 90% 55% / 0.5)" }, // Blue
  { main: "hsl(120 75% 48%)", light: "hsl(120 80% 65%)", dark: "hsl(120 70% 32%)", glow: "hsl(120 75% 48% / 0.5)" }, // Green
  { main: "hsl(50 95% 55%)", light: "hsl(50 100% 75%)", dark: "hsl(50 85% 38%)", glow: "hsl(50 95% 55% / 0.5)" },    // Yellow
  { main: "hsl(280 80% 58%)", light: "hsl(280 85% 75%)", dark: "hsl(280 75% 40%)", glow: "hsl(280 80% 58% / 0.5)" }, // Purple
  { main: "hsl(25 95% 55%)", light: "hsl(25 100% 72%)", dark: "hsl(25 90% 38%)", glow: "hsl(25 95% 55% / 0.5)" },    // Orange
  { main: "hsl(330 85% 58%)", light: "hsl(330 90% 75%)", dark: "hsl(330 80% 40%)", glow: "hsl(330 85% 58% / 0.5)" }, // Pink
];

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
    y: row * (BUBBLE_R * 1.73) + BUBBLE_R + 8,
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
  const [shotsLeft, setShotsLeft] = useState(60);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>();

  const initGrid = useCallback(() => {
    const rows: (number | null)[][] = [];
    const fillRows = Math.min(5 + level, ROWS - 4);
    const numColors = Math.min(4 + Math.floor(level / 2), COLORS.length);
    for (let r = 0; r < ROWS; r++) {
      const maxCols = r % 2 === 1 ? COLS - 1 : COLS;
      const row: (number | null)[] = [];
      for (let c = 0; c < maxCols; c++) {
        row.push(r < fillRows ? Math.floor(Math.random() * numColors) : null);
      }
      rows.push(row);
    }
    return rows;
  }, [level]);

  const initGame = () => {
    const g = initGrid();
    setGrid(g);
    setScore(0);
    setShotsLeft(60);
    setLevel(1);
    setCombo(0);
    setShowCombo(false);
    setCurrentColor(Math.floor(Math.random() * 4));
    setNextColor(Math.floor(Math.random() * 4));
    setFlying(null);
    setPopping([]);
    setGameOver(false);
    setStarted(true);
  };

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

  const findFloating = useCallback((g: (number | null)[][]) => {
    const visited = new Set<string>();
    const stack: [number, number][] = [];
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
    const startY = BOARD_H - 55;
    const speed = 16;
    setFlying({
      x: startX, y: startY,
      vx: Math.cos(aimAngle) * speed,
      vy: Math.sin(aimAngle) * speed,
      color: currentColor,
    });
    setCurrentColor(nextColor);
    setNextColor(Math.floor(Math.random() * Math.min(4 + Math.floor(level / 2), COLORS.length)));
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

        if (x < BUBBLE_R) { x = BUBBLE_R; vx = -vx; }
        if (x > BOARD_W - BUBBLE_R) { x = BOARD_W - BUBBLE_R; vx = -vx; }

        let landed = false;
        let landRow = -1, landCol = -1;

        if (y <= BUBBLE_R + 8) {
          landed = true;
          landRow = 0;
          landCol = Math.round((x - BUBBLE_R) / (BUBBLE_R * 2));
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
          setGrid(g => {
            const newG = g.map(r => [...r]);
            while (newG.length <= landRow) newG.push(Array(newG.length % 2 === 1 ? COLS - 1 : COLS).fill(null));
            if (landCol < newG[landRow].length) {
              newG[landRow][landCol] = color;
            }

            const cluster = findCluster(newG, landRow, landCol, color);
            if (cluster.length >= 3) {
              const popPositions = cluster.map(([r, c]) => {
                const pos = getBubblePos(r, c);
                return { x: pos.x, y: pos.y, color };
              });
              setPopping(popPositions);
              setTimeout(() => setPopping([]), 400);

              for (const [r, c] of cluster) newG[r][c] = null;
              const comboMultiplier = Math.max(1, combo);
              setScore(s => s + cluster.length * 10 * comboMultiplier);
              setCombo(c => c + 1);
              setShowCombo(true);
              setTimeout(() => setShowCombo(false), 800);

              const floating = findFloating(newG);
              if (floating.length > 0) {
                const floatPops = floating.map(([r, c]) => {
                  const pos = getBubblePos(r, c);
                  return { x: pos.x, y: pos.y, color: newG[r][c]! };
                });
                setPopping(p => [...p, ...floatPops]);
                for (const [r, c] of floating) newG[r][c] = null;
                setScore(s => s + floating.length * 20 * comboMultiplier);
              }
            } else {
              setCombo(0);
            }

            const anyLeft = newG.some(row => row.some(c => c !== null));
            if (!anyLeft) {
              setScore(s => s + 500);
              setLevel(l => l + 1);
              setShotsLeft(s => s + 25);
              setTimeout(() => {
                setGrid(initGrid());
              }, 600);
            }

            for (let r = ROWS - 3; r < newG.length; r++) {
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

          return null;
        }

        if (y < -50) return null;
        return { x, y, vx, vy, color };
      });

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [flying, started, gameOver, findCluster, findFloating, submitScore, initGrid, combo]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current || flying) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const sx = BOARD_W / 2;
    const sy = BOARD_H - 55;
    const angle = Math.atan2(my - sy, mx - sx);
    setAimAngle(Math.max(-Math.PI + 0.1, Math.min(-0.1, angle)));
  }, [flying]);

  const handleTouch = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!canvasRef.current || flying) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const mx = touch.clientX - rect.left;
    const my = touch.clientY - rect.top;
    const sx = BOARD_W / 2;
    const sy = BOARD_H - 55;
    const angle = Math.atan2(my - sy, mx - sx);
    setAimAngle(Math.max(-Math.PI + 0.1, Math.min(-0.1, angle)));
  }, [flying]);

  useEffect(() => {
    if (!started || gameOver) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Space") { e.preventDefault(); shoot(); }
      if (e.key === "ArrowLeft") setAimAngle(a => Math.max(-Math.PI + 0.1, a - 0.04));
      if (e.key === "ArrowRight") setAimAngle(a => Math.min(-0.1, a + 0.04));
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [started, gameOver, shoot]);

  if (!started) return <StartScreen title={game.title} description={game.description} icon={game.icon} gradient={game.gradient} glow={game.glow} onStart={initGame} onBack={onBack} gameType="bubble_shooter" />;
  if (gameOver) return <EndScreen won={score >= 300} title={`Score: ${score}!`} subtitle={`Level ${level} reached — ${60 - shotsLeft} shots fired`} onReplay={initGame} onBack={onBack} gameType="bubble_shooter" />;

  const shooterX = BOARD_W / 2;
  const shooterY = BOARD_H - 55;
  const aimLen = 120;
  const aimEndX = shooterX + Math.cos(aimAngle) * aimLen;
  const aimEndY = shooterY + Math.sin(aimAngle) * aimLen;

  // Cannon rotation angle in degrees
  const cannonDeg = (aimAngle * 180 / Math.PI) + 90;

  return (
    <GameShell onBack={onBack} title="Bubble Shooter" icon={game.icon} gradient={game.gradient}
      badges={<>
        <Badge className="bg-amber-900/40 text-amber-300 border-amber-500/30 font-mono text-sm">⭐ {score}</Badge>
        <Badge className="bg-cyan-900/40 text-cyan-300 border-cyan-500/30 font-mono text-sm">Lvl {level}</Badge>
        <Badge className="bg-rose-900/40 text-rose-300 border-rose-500/30 font-mono text-sm">🎯 {shotsLeft}</Badge>
      </>}>
      <div className="flex flex-col items-center gap-3">
        <div
          ref={canvasRef}
          className="relative rounded-2xl overflow-hidden cursor-crosshair select-none"
          style={{
            width: BOARD_W,
            height: BOARD_H,
            background: "linear-gradient(180deg, hsl(195 85% 35%) 0%, hsl(200 80% 28%) 30%, hsl(210 75% 22%) 60%, hsl(220 70% 15%) 100%)",
            boxShadow: "0 0 40px hsl(200 80% 30% / 0.4), inset 0 0 60px hsl(200 80% 20% / 0.3)",
            border: "3px solid hsl(200 60% 40% / 0.5)",
          }}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouch}
          onClick={shoot}
        >
          {/* Decorative side panels - like the reference */}
          <div className="absolute left-0 top-0 bottom-0 w-[6px]" style={{
            background: "linear-gradient(180deg, hsl(35 80% 50%), hsl(25 70% 40%), hsl(35 80% 50%))",
            boxShadow: "2px 0 8px hsl(35 80% 50% / 0.3)"
          }} />
          <div className="absolute right-0 top-0 bottom-0 w-[6px]" style={{
            background: "linear-gradient(180deg, hsl(35 80% 50%), hsl(25 70% 40%), hsl(35 80% 50%))",
            boxShadow: "-2px 0 8px hsl(35 80% 50% / 0.3)"
          }} />

          {/* Top bar / ceiling */}
          <div className="absolute top-0 left-0 right-0 h-[6px]" style={{
            background: "linear-gradient(90deg, hsl(35 80% 45%), hsl(40 85% 55%), hsl(35 80% 45%))",
            boxShadow: "0 2px 10px hsl(35 80% 50% / 0.4)"
          }} />

          {/* Subtle bubble-pattern background */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "radial-gradient(circle, hsl(0 0% 100%) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }} />

          {/* Grid bubbles */}
          {grid.map((row, r) => row.map((color, c) => {
            if (color === null || color >= COLORS.length) return null;
            const pos = getBubblePos(r, c);
            const clr = COLORS[color];
            return (
              <div key={`${r}-${c}`} className="absolute" style={{
                left: pos.x - BUBBLE_R, top: pos.y - BUBBLE_R,
                width: BUBBLE_R * 2, height: BUBBLE_R * 2,
                zIndex: 2,
              }}>
                <div className="w-full h-full rounded-full relative" style={{
                  background: `radial-gradient(circle at 38% 28%, ${clr.light} 0%, ${clr.main} 45%, ${clr.dark} 100%)`,
                  boxShadow: `0 3px 8px ${clr.dark}80, 0 0 16px ${clr.glow}, inset 0 -3px 6px ${clr.dark}60, inset 0 2px 4px ${clr.light}60`,
                  border: `1.5px solid ${clr.light}40`,
                }}>
                  {/* Main shine highlight */}
                  <div className="absolute rounded-full" style={{
                    top: '12%', left: '18%', width: '35%', height: '30%',
                    background: `radial-gradient(ellipse, hsl(0 0% 100% / 0.65) 0%, hsl(0 0% 100% / 0.1) 70%, transparent 100%)`,
                    filter: 'blur(0.5px)',
                  }} />
                  {/* Small secondary shine */}
                  <div className="absolute rounded-full" style={{
                    top: '55%', right: '18%', width: '15%', height: '12%',
                    background: 'hsl(0 0% 100% / 0.2)',
                    filter: 'blur(0.5px)',
                  }} />
                </div>
              </div>
            );
          }))}

          {/* Popping animation - burst effect */}
          <AnimatePresence>
            {popping.map((p, i) => {
              const clr = p.color < COLORS.length ? COLORS[p.color] : COLORS[0];
              return (
                <motion.div key={`pop-${i}-${p.x}-${p.y}`}
                  initial={{ scale: 1, opacity: 1 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="absolute rounded-full"
                  style={{
                    left: p.x - BUBBLE_R, top: p.y - BUBBLE_R,
                    width: BUBBLE_R * 2, height: BUBBLE_R * 2,
                    background: `radial-gradient(circle, ${clr.main}cc, ${clr.main}40, transparent)`,
                    zIndex: 10,
                  }}
                />
              );
            })}
          </AnimatePresence>

          {/* Combo text */}
          <AnimatePresence>
            {showCombo && combo > 1 && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0, y: 0 }}
                animate={{ scale: 1.2, opacity: 1, y: -30 }}
                exit={{ scale: 0.8, opacity: 0, y: -60 }}
                transition={{ duration: 0.5 }}
                className="absolute z-20 font-black text-center"
                style={{
                  left: '50%', top: '45%',
                  transform: 'translateX(-50%)',
                  color: 'hsl(45 100% 60%)',
                  fontSize: combo > 3 ? '2.5rem' : '2rem',
                  textShadow: '0 0 20px hsl(45 100% 50%), 0 0 40px hsl(30 90% 50%), 0 2px 4px hsl(0 0% 0% / 0.5)',
                  fontFamily: "'Arial Black', sans-serif",
                }}
              >
                {combo}x COMBO!
              </motion.div>
            )}
          </AnimatePresence>

          {/* Flying bubble */}
          {flying && flying.color < COLORS.length && (
            <div className="absolute" style={{
              left: flying.x - BUBBLE_R, top: flying.y - BUBBLE_R,
              width: BUBBLE_R * 2, height: BUBBLE_R * 2,
              zIndex: 15,
            }}>
              <div className="w-full h-full rounded-full relative" style={{
                background: `radial-gradient(circle at 38% 28%, ${COLORS[flying.color].light}, ${COLORS[flying.color].main} 50%, ${COLORS[flying.color].dark})`,
                boxShadow: `0 0 24px ${COLORS[flying.color].glow}, 0 0 48px ${COLORS[flying.color].glow}`,
              }}>
                <div className="absolute rounded-full" style={{
                  top: '12%', left: '18%', width: '35%', height: '30%',
                  background: 'radial-gradient(ellipse, hsl(0 0% 100% / 0.7), transparent)',
                  filter: 'blur(0.5px)',
                }} />
              </div>
            </div>
          )}

          {/* Aim guide - dotted line */}
          {!flying && (
            <svg className="absolute inset-0 pointer-events-none" width={BOARD_W} height={BOARD_H} style={{ zIndex: 5 }}>
              {/* Dotted guide line */}
              {Array.from({ length: 15 }).map((_, i) => {
                const t = (i + 1) * 18;
                const cx = shooterX + Math.cos(aimAngle) * t;
                const cy = shooterY + Math.sin(aimAngle) * t;
                if (cy < 10) return null;
                return (
                  <circle key={i}
                    cx={cx} cy={cy}
                    r={Math.max(1, 3 - i * 0.15)}
                    fill={`hsl(0 0% 100% / ${Math.max(0.1, 0.5 - i * 0.03)})`}
                  />
                );
              })}
            </svg>
          )}

          {/* Bottom platform / launcher area */}
          <div className="absolute bottom-0 left-0 right-0" style={{
            height: 90,
            background: "linear-gradient(0deg, hsl(220 40% 8%) 0%, hsl(210 35% 12%) 50%, transparent 100%)",
            zIndex: 8,
          }}>
            {/* Launcher base ring */}
            <div className="absolute rounded-full" style={{
              left: shooterX - 36, bottom: 8,
              width: 72, height: 72,
              background: "radial-gradient(circle, hsl(200 30% 20%) 40%, hsl(210 25% 15%) 70%, hsl(220 30% 10%))",
              border: "3px solid hsl(35 70% 45%)",
              boxShadow: "0 0 20px hsl(35 70% 45% / 0.3), inset 0 -4px 12px hsl(0 0% 0% / 0.5), inset 0 2px 6px hsl(35 70% 55% / 0.2)",
            }}>
              {/* Inner ring detail */}
              <div className="absolute inset-[6px] rounded-full" style={{
                border: "2px solid hsl(35 60% 40% / 0.4)",
              }} />
              {/* Metallic shine on base */}
              <div className="absolute top-[8px] left-[12px] w-[20px] h-[8px] rounded-full" style={{
                background: "hsl(35 80% 65% / 0.3)",
                filter: "blur(1px)",
              }} />
            </div>

            {/* Cannon barrel */}
            <div className="absolute" style={{
              left: shooterX - 8,
              bottom: 44,
              width: 16,
              height: 40,
              transformOrigin: "center bottom",
              transform: `rotate(${cannonDeg}deg)`,
              background: "linear-gradient(90deg, hsl(210 20% 30%), hsl(200 25% 45%), hsl(210 20% 35%))",
              borderRadius: "4px 4px 2px 2px",
              border: "1px solid hsl(35 60% 50% / 0.4)",
              boxShadow: "0 -2px 8px hsl(200 30% 40% / 0.3)",
              zIndex: 9,
            }}>
              {/* Cannon tip */}
              <div className="absolute -top-1 left-[-2px] right-[-2px] h-[6px] rounded-t-md" style={{
                background: "linear-gradient(90deg, hsl(35 70% 45%), hsl(40 80% 55%), hsl(35 70% 45%))",
              }} />
            </div>

            {/* Current bubble (in cannon) */}
            {currentColor < COLORS.length && (
              <div className="absolute rounded-full" style={{
                left: shooterX - BUBBLE_R + 1,
                bottom: 28,
                width: BUBBLE_R * 2 - 2,
                height: BUBBLE_R * 2 - 2,
                background: `radial-gradient(circle at 38% 28%, ${COLORS[currentColor].light}, ${COLORS[currentColor].main} 50%, ${COLORS[currentColor].dark})`,
                boxShadow: `0 0 16px ${COLORS[currentColor].glow}`,
                border: `2px solid ${COLORS[currentColor].light}50`,
                zIndex: 10,
              }}>
                <div className="absolute rounded-full" style={{
                  top: '12%', left: '18%', width: '35%', height: '28%',
                  background: 'radial-gradient(ellipse, hsl(0 0% 100% / 0.6), transparent)',
                  filter: 'blur(0.5px)',
                }} />
              </div>
            )}

            {/* Next bubble */}
            {nextColor < COLORS.length && (
              <div className="absolute" style={{ left: shooterX + 50, bottom: 22, zIndex: 10 }}>
                <div className="text-[8px] font-bold text-white/40 text-center mb-[2px] tracking-wider">NEXT</div>
                <div className="rounded-full" style={{
                  width: BUBBLE_R * 1.4,
                  height: BUBBLE_R * 1.4,
                  background: `radial-gradient(circle at 35% 30%, ${COLORS[nextColor].light}cc, ${COLORS[nextColor].main}aa)`,
                  border: `1px solid ${COLORS[nextColor].light}30`,
                  boxShadow: `0 0 8px ${COLORS[nextColor].glow}`,
                }}>
                  <div className="absolute rounded-full" style={{
                    top: '15%', left: '20%', width: '30%', height: '25%',
                    background: 'hsl(0 0% 100% / 0.3)',
                    filter: 'blur(0.5px)',
                  }} />
                </div>
              </div>
            )}

            {/* Shots counter on left */}
            <div className="absolute left-4 bottom-6 text-center" style={{ zIndex: 10 }}>
              <div className="text-[8px] font-bold text-white/40 tracking-wider">SHOTS</div>
              <div className="text-lg font-black" style={{
                color: shotsLeft > 10 ? 'hsl(45 90% 60%)' : 'hsl(0 80% 60%)',
                textShadow: shotsLeft > 10 ? '0 0 8px hsl(45 90% 50% / 0.5)' : '0 0 8px hsl(0 80% 50% / 0.5)',
              }}>{shotsLeft}</div>
            </div>

            {/* Level indicator on right */}
            <div className="absolute right-4 bottom-6 text-center" style={{ zIndex: 10 }}>
              <div className="text-[8px] font-bold text-white/40 tracking-wider">LEVEL</div>
              <div className="text-lg font-black" style={{
                color: 'hsl(180 80% 60%)',
                textShadow: '0 0 8px hsl(180 80% 50% / 0.5)',
              }}>{level}</div>
            </div>
          </div>

          {/* Score display at top */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
            <div className="px-6 py-1.5 rounded-full" style={{
              background: "hsl(220 30% 10% / 0.8)",
              border: "1px solid hsl(45 70% 50% / 0.3)",
              boxShadow: "0 2px 12px hsl(0 0% 0% / 0.4)",
            }}>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold" style={{ color: "hsl(45 80% 60%)" }}>⭐</span>
                <span className="text-sm font-black tracking-wider" style={{
                  color: "hsl(45 90% 65%)",
                  textShadow: "0 0 8px hsl(45 90% 50% / 0.5)",
                }}>{score}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile controls */}
        <div className="grid grid-cols-3 gap-2 w-52 md:hidden">
          <Button size="sm" variant="outline" className="border-cyan-500/30 h-11 text-lg"
            onClick={() => setAimAngle(a => Math.max(-Math.PI + 0.1, a - 0.06))}>◀</Button>
          <Button size="sm" variant="outline" className="border-amber-500/30 h-11 text-lg font-bold"
            onClick={shoot}>🔵 FIRE</Button>
          <Button size="sm" variant="outline" className="border-cyan-500/30 h-11 text-lg"
            onClick={() => setAimAngle(a => Math.min(-0.1, a + 0.06))}>▶</Button>
        </div>

        <p className="text-xs text-muted-foreground font-mono">Click/Tap to shoot • ← → to aim • Space to fire</p>
      </div>
      <Leaderboard gameType="bubble_shooter" />
    </GameShell>
  );
};

export default BubbleShooterGame;
