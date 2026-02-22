import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
const BUBBLE_R = 18;
const BOARD_W = COLS * BUBBLE_R * 2 + BUBBLE_R * 2;
const BOARD_H = 620;
const SPEED = 14;

const COLORS_HSL = [
  [0, 85, 55],     // Red
  [210, 90, 55],   // Blue
  [120, 75, 48],   // Green
  [50, 95, 55],    // Yellow
  [280, 80, 58],   // Purple
  [25, 95, 55],    // Orange
  [330, 85, 58],   // Pink
];

function hsl(h: number, s: number, l: number, a = 1) {
  return a < 1 ? `hsla(${h},${s}%,${l}%,${a})` : `hsl(${h},${s}%,${l}%)`;
}

function getBubblePos(row: number, col: number) {
  const offset = row % 2 === 1 ? BUBBLE_R : 0;
  return {
    x: BUBBLE_R + col * BUBBLE_R * 2 + offset,
    y: BUBBLE_R + row * (BUBBLE_R * 1.73) + 10,
  };
}

function getMaxCols(row: number) {
  return row % 2 === 1 ? COLS - 1 : COLS;
}

function findCluster(grid: (number | null)[][], row: number, col: number, color: number): [number, number][] {
  const visited = new Set<string>();
  const cluster: [number, number][] = [];
  const stack: [number, number][] = [[row, col]];
  while (stack.length > 0) {
    const [r, c] = stack.pop()!;
    const key = `${r},${c}`;
    if (visited.has(key)) continue;
    visited.add(key);
    if (r < 0 || r >= grid.length || c < 0 || c >= getMaxCols(r)) continue;
    if (grid[r]?.[c] !== color) continue;
    cluster.push([r, c]);
    const odd = r % 2 === 1;
    const neighbors: [number, number][] = [
      [r, c - 1], [r, c + 1],
      [r - 1, c], [r + 1, c],
      [r - 1, odd ? c + 1 : c - 1],
      [r + 1, odd ? c + 1 : c - 1],
    ];
    for (const n of neighbors) stack.push(n);
  }
  return cluster;
}

function findFloating(grid: (number | null)[][]): [number, number][] {
  const visited = new Set<string>();
  const stack: [number, number][] = [];
  if (grid[0]) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[0][c] !== null) stack.push([0, c]);
    }
  }
  while (stack.length > 0) {
    const [r, c] = stack.pop()!;
    const key = `${r},${c}`;
    if (visited.has(key)) continue;
    visited.add(key);
    if (r < 0 || r >= grid.length || c < 0 || c >= getMaxCols(r)) continue;
    if (grid[r]?.[c] === null) continue;
    const odd = r % 2 === 1;
    const neighbors: [number, number][] = [
      [r, c - 1], [r, c + 1],
      [r - 1, c], [r + 1, c],
      [r - 1, odd ? c + 1 : c - 1],
      [r + 1, odd ? c + 1 : c - 1],
    ];
    for (const n of neighbors) stack.push(n);
  }
  const floating: [number, number][] = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < getMaxCols(r); c++) {
      if (grid[r]?.[c] !== null && !visited.has(`${r},${c}`)) {
        floating.push([r, c]);
      }
    }
  }
  return floating;
}

function spawnGrid(level: number): (number | null)[][] {
  const rows: (number | null)[][] = [];
  const fillRows = Math.min(5 + level, ROWS - 4);
  const numColors = Math.min(4 + Math.floor(level / 2), COLORS_HSL.length);
  for (let r = 0; r < ROWS; r++) {
    const mc = getMaxCols(r);
    const row: (number | null)[] = [];
    for (let c = 0; c < mc; c++) {
      row.push(r < fillRows ? Math.floor(Math.random() * numColors) : null);
    }
    rows.push(row);
  }
  return rows;
}

function drawBubble(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, colorIdx: number, glow = false) {
  const [h, s, l] = COLORS_HSL[colorIdx];
  ctx.save();
  if (glow) {
    ctx.shadowColor = hsl(h, s, l, 0.6);
    ctx.shadowBlur = 18;
  }
  // Main body
  const grad = ctx.createRadialGradient(x - r * 0.25, y - r * 0.3, r * 0.1, x, y, r);
  grad.addColorStop(0, hsl(h, s, l + 20));
  grad.addColorStop(0.5, hsl(h, s, l));
  grad.addColorStop(1, hsl(h, s, l - 15));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r - 1, 0, Math.PI * 2);
  ctx.fill();
  // Border
  ctx.strokeStyle = hsl(h, s, l + 10, 0.4);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.shadowBlur = 0;
  // Highlight
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.beginPath();
  ctx.ellipse(x - r * 0.2, y - r * 0.3, r * 0.35, r * 0.25, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // Small secondary highlight
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.beginPath();
  ctx.ellipse(x + r * 0.2, y + r * 0.25, r * 0.15, r * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

const BubbleShooterGame = ({ onBack, submitScore, GameShell, StartScreen, EndScreen, Leaderboard, game }: BubbleShooterGameProps) => {
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [shotsLeft, setShotsLeft] = useState(60);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<(number | null)[][]>([]);
  const flyingRef = useRef<{ x: number; y: number; vx: number; vy: number; color: number } | null>(null);
  const aimRef = useRef(-Math.PI / 2);
  const currentColorRef = useRef(0);
  const nextColorRef = useRef(1);
  const scoreRef = useRef(0);
  const shotsRef = useRef(60);
  const levelRef = useRef(1);
  const comboRef = useRef(0);
  const gameOverRef = useRef(false);
  const frameRef = useRef<number>();
  const popParticles = useRef<{ x: number; y: number; vx: number; vy: number; life: number; color: number }[]>([]);
  const comboText = useRef<{ val: number; life: number }>({ val: 0, life: 0 });

  const initGame = () => {
    gridRef.current = spawnGrid(1);
    flyingRef.current = null;
    aimRef.current = -Math.PI / 2;
    currentColorRef.current = Math.floor(Math.random() * 4);
    nextColorRef.current = Math.floor(Math.random() * 4);
    scoreRef.current = 0;
    shotsRef.current = 60;
    levelRef.current = 1;
    comboRef.current = 0;
    gameOverRef.current = false;
    popParticles.current = [];
    comboText.current = { val: 0, life: 0 };
    setScore(0);
    setShotsLeft(60);
    setLevel(1);
    setCombo(0);
    setGameOver(false);
    setStarted(true);
  };

  const shoot = useCallback(() => {
    if (flyingRef.current || gameOverRef.current) return;
    const sx = BOARD_W / 2;
    const sy = BOARD_H - 55;
    const angle = aimRef.current;
    flyingRef.current = {
      x: sx, y: sy,
      vx: Math.cos(angle) * SPEED,
      vy: Math.sin(angle) * SPEED,
      color: currentColorRef.current,
    };
    const numColors = Math.min(4 + Math.floor(levelRef.current / 2), COLORS_HSL.length);
    currentColorRef.current = nextColorRef.current;
    nextColorRef.current = Math.floor(Math.random() * numColors);
    shotsRef.current--;
    setShotsLeft(shotsRef.current);
    if (shotsRef.current <= 0) {
      gameOverRef.current = true;
      setGameOver(true);
      submitScore("bubble_shooter", scoreRef.current);
    }
  }, [submitScore]);

  // Input handling
  useEffect(() => {
    if (!started || gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateAim = (clientX: number, clientY: number) => {
      if (flyingRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = BOARD_W / rect.width;
      const scaleY = BOARD_H / rect.height;
      const mx = (clientX - rect.left) * scaleX;
      const my = (clientY - rect.top) * scaleY;
      const angle = Math.atan2(my - (BOARD_H - 55), mx - BOARD_W / 2);
      aimRef.current = Math.max(-Math.PI + 0.15, Math.min(-0.15, angle));
    };

    const onMouseMove = (e: MouseEvent) => updateAim(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => { e.preventDefault(); updateAim(e.touches[0].clientX, e.touches[0].clientY); };
    const onClick = () => shoot();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") { e.preventDefault(); shoot(); }
      if (e.key === "ArrowLeft") aimRef.current = Math.max(-Math.PI + 0.15, aimRef.current - 0.05);
      if (e.key === "ArrowRight") aimRef.current = Math.min(-0.15, aimRef.current + 0.05);
    };

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("click", onClick);
    canvas.addEventListener("touchstart", onClick, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    return () => {
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("touchstart", onClick);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [started, gameOver, shoot]);

  // Main game loop
  useEffect(() => {
    if (!started || gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const loop = () => {
      if (gameOverRef.current) return;
      const grid = gridRef.current;
      const fly = flyingRef.current;

      // ── Update flying bubble ──
      if (fly) {
        fly.x += fly.vx;
        fly.y += fly.vy;

        // Wall bounce
        if (fly.x < BUBBLE_R) { fly.x = BUBBLE_R; fly.vx = -fly.vx; }
        if (fly.x > BOARD_W - BUBBLE_R) { fly.x = BOARD_W - BUBBLE_R; fly.vx = -fly.vx; }

        let landed = false;
        let landRow = -1;
        let landCol = -1;

        // Hit ceiling
        if (fly.y <= BUBBLE_R + 10) {
          landed = true;
          landRow = 0;
          const offset = 0; // row 0 is even
          landCol = Math.round((fly.x - BUBBLE_R - offset) / (BUBBLE_R * 2));
          landCol = Math.max(0, Math.min(COLS - 1, landCol));
        }

        // Collision with existing bubbles
        if (!landed) {
          for (let r = 0; r < grid.length; r++) {
            for (let c = 0; c < getMaxCols(r); c++) {
              if (grid[r]?.[c] === null) continue;
              const pos = getBubblePos(r, c);
              const dx = fly.x - pos.x;
              const dy = fly.y - pos.y;
              if (dx * dx + dy * dy < (BUBBLE_R * 1.85) ** 2) {
                // Find the best empty neighbor slot closest to the flying bubble
                const odd = r % 2 === 1;
                const neighbors: [number, number][] = [
                  [r, c - 1], [r, c + 1],
                  [r - 1, c], [r + 1, c],
                  [r - 1, odd ? c + 1 : c - 1],
                  [r + 1, odd ? c + 1 : c - 1],
                ];
                let bestDist = Infinity;
                for (const [nr, nc] of neighbors) {
                  if (nr < 0 || nr >= ROWS || nc < 0 || nc >= getMaxCols(nr)) continue;
                  // Ensure row exists
                  while (grid.length <= nr) grid.push(new Array(getMaxCols(grid.length)).fill(null));
                  if (grid[nr]?.[nc] !== null) continue;
                  const nPos = getBubblePos(nr, nc);
                  const dist = (fly.x - nPos.x) ** 2 + (fly.y - nPos.y) ** 2;
                  if (dist < bestDist) {
                    bestDist = dist;
                    landRow = nr;
                    landCol = nc;
                  }
                }
                if (landRow >= 0) landed = true;
                break;
              }
            }
            if (landed) break;
          }
        }

        if (landed && landRow >= 0 && landCol >= 0) {
          // Place bubble
          while (grid.length <= landRow) grid.push(new Array(getMaxCols(grid.length)).fill(null));
          if (landCol < getMaxCols(landRow)) {
            grid[landRow][landCol] = fly.color;
          }

          // Find matching cluster
          const cluster = findCluster(grid, landRow, landCol, fly.color);
          let popped = 0;
          if (cluster.length >= 3) {
            for (const [r, c] of cluster) {
              const pos = getBubblePos(r, c);
              for (let i = 0; i < 5; i++) {
                popParticles.current.push({
                  x: pos.x, y: pos.y,
                  vx: (Math.random() - 0.5) * 6,
                  vy: (Math.random() - 0.5) * 6,
                  life: 20 + Math.random() * 10,
                  color: grid[r][c]!,
                });
              }
              grid[r][c] = null;
            }
            popped = cluster.length;

            // Remove floating bubbles
            const floating = findFloating(grid);
            for (const [r, c] of floating) {
              const pos = getBubblePos(r, c);
              for (let i = 0; i < 3; i++) {
                popParticles.current.push({
                  x: pos.x, y: pos.y,
                  vx: (Math.random() - 0.5) * 4,
                  vy: Math.random() * 3 + 1,
                  life: 25 + Math.random() * 10,
                  color: grid[r][c]!,
                });
              }
              grid[r][c] = null;
              popped++;
            }

            comboRef.current++;
            comboText.current = { val: comboRef.current, life: 50 };
            setCombo(comboRef.current);
            const pts = popped * 10 * Math.max(1, comboRef.current);
            scoreRef.current += pts;
            setScore(scoreRef.current);
          } else {
            comboRef.current = 0;
            setCombo(0);
          }

          // Check if board is clear
          const anyLeft = grid.some(row => row.some(c => c !== null));
          if (!anyLeft) {
            scoreRef.current += 500;
            setScore(scoreRef.current);
            levelRef.current++;
            setLevel(levelRef.current);
            shotsRef.current += 20;
            setShotsLeft(shotsRef.current);
            gridRef.current = spawnGrid(levelRef.current);
          }

          // Check game over - bubbles too low
          for (let r = ROWS - 3; r < grid.length; r++) {
            if (grid[r]?.some(c => c !== null)) {
              gameOverRef.current = true;
              setGameOver(true);
              submitScore("bubble_shooter", scoreRef.current);
              break;
            }
          }

          flyingRef.current = null;
        } else if (fly.y < -50) {
          flyingRef.current = null;
        }
      }

      // Update particles
      popParticles.current = popParticles.current.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.life--;
        return p.life > 0;
      });

      if (comboText.current.life > 0) comboText.current.life--;

      // ── RENDER ──
      ctx.clearRect(0, 0, BOARD_W, BOARD_H);

      // Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, BOARD_H);
      bgGrad.addColorStop(0, "hsl(195,85%,35%)");
      bgGrad.addColorStop(0.3, "hsl(200,80%,28%)");
      bgGrad.addColorStop(0.7, "hsl(210,75%,22%)");
      bgGrad.addColorStop(1, "hsl(220,70%,15%)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, BOARD_W, BOARD_H);

      // Side rails
      const railGrad = ctx.createLinearGradient(0, 0, 0, BOARD_H);
      railGrad.addColorStop(0, "hsl(35,80%,50%)");
      railGrad.addColorStop(0.5, "hsl(25,70%,40%)");
      railGrad.addColorStop(1, "hsl(35,80%,50%)");
      ctx.fillStyle = railGrad;
      ctx.fillRect(0, 0, 5, BOARD_H);
      ctx.fillRect(BOARD_W - 5, 0, 5, BOARD_H);

      // Top bar
      ctx.fillStyle = "hsl(40,85%,50%)";
      ctx.fillRect(0, 0, BOARD_W, 5);

      // Grid bubbles
      for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < getMaxCols(r); c++) {
          const val = grid[r]?.[c];
          if (val === null || val === undefined || val >= COLORS_HSL.length) continue;
          const pos = getBubblePos(r, c);
          drawBubble(ctx, pos.x, pos.y, BUBBLE_R, val);
        }
      }

      // Flying bubble
      if (flyingRef.current) {
        const f = flyingRef.current;
        if (f.color < COLORS_HSL.length) {
          drawBubble(ctx, f.x, f.y, BUBBLE_R, f.color, true);
        }
      }

      // Pop particles
      for (const p of popParticles.current) {
        if (p.color >= COLORS_HSL.length) continue;
        const [h, s, l] = COLORS_HSL[p.color];
        ctx.globalAlpha = p.life / 30;
        ctx.fillStyle = hsl(h, s, l);
        ctx.shadowColor = hsl(h, s, l, 0.5);
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 * (p.life / 30), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;

      // Combo text
      if (comboText.current.life > 0 && comboText.current.val > 1) {
        ctx.save();
        ctx.globalAlpha = comboText.current.life / 50;
        ctx.font = "bold 32px sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "hsl(45,100%,60%)";
        ctx.shadowColor = "hsl(30,90%,50%)";
        ctx.shadowBlur = 15;
        ctx.fillText(`${comboText.current.val}x COMBO!`, BOARD_W / 2, BOARD_H / 2 - 20);
        ctx.restore();
      }

      // ── Bottom launcher area ──
      const launchY = BOARD_H - 90;
      const botGrad = ctx.createLinearGradient(0, launchY, 0, BOARD_H);
      botGrad.addColorStop(0, "rgba(10,15,25,0)");
      botGrad.addColorStop(0.4, "rgba(10,15,25,0.8)");
      botGrad.addColorStop(1, "rgba(10,15,25,1)");
      ctx.fillStyle = botGrad;
      ctx.fillRect(0, launchY, BOARD_W, 90);

      const cx = BOARD_W / 2;
      const cy = BOARD_H - 55;

      // Aim guide (dotted line)
      if (!flyingRef.current) {
        const angle = aimRef.current;
        for (let i = 1; i <= 18; i++) {
          const t = i * 16;
          const dx = cx + Math.cos(angle) * t;
          const dy = cy + Math.sin(angle) * t;
          if (dy < 8) break;
          ctx.globalAlpha = Math.max(0.1, 0.5 - i * 0.025);
          ctx.fillStyle = "white";
          ctx.beginPath();
          ctx.arc(dx, dy, Math.max(1, 3 - i * 0.12), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // Launcher base
      ctx.save();
      const baseGrad = ctx.createRadialGradient(cx, cy + 10, 5, cx, cy + 10, 35);
      baseGrad.addColorStop(0, "hsl(200,30%,25%)");
      baseGrad.addColorStop(0.7, "hsl(210,25%,18%)");
      baseGrad.addColorStop(1, "hsl(220,30%,12%)");
      ctx.fillStyle = baseGrad;
      ctx.beginPath();
      ctx.arc(cx, cy + 10, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "hsl(35,70%,50%)";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      // Inner ring
      ctx.strokeStyle = "hsl(35,60%,40%)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy + 10, 24, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Cannon barrel
      ctx.save();
      const cannonAngle = aimRef.current + Math.PI / 2;
      ctx.translate(cx, cy + 10);
      ctx.rotate(cannonAngle);
      const barrelGrad = ctx.createLinearGradient(-7, 0, 7, 0);
      barrelGrad.addColorStop(0, "hsl(210,20%,30%)");
      barrelGrad.addColorStop(0.5, "hsl(200,25%,45%)");
      barrelGrad.addColorStop(1, "hsl(210,20%,35%)");
      ctx.fillStyle = barrelGrad;
      ctx.beginPath();
      ctx.roundRect(-7, -42, 14, 42, 3);
      ctx.fill();
      ctx.strokeStyle = "hsl(35,60%,50%)";
      ctx.lineWidth = 1;
      ctx.stroke();
      // Barrel tip
      ctx.fillStyle = "hsl(40,80%,50%)";
      ctx.fillRect(-9, -45, 18, 4);
      ctx.restore();

      // Current bubble in launcher
      if (currentColorRef.current < COLORS_HSL.length) {
        drawBubble(ctx, cx, cy + 8, BUBBLE_R - 2, currentColorRef.current);
      }

      // Next bubble
      if (nextColorRef.current < COLORS_HSL.length) {
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.font = "bold 8px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("NEXT", cx + 48, cy - 2);
        drawBubble(ctx, cx + 48, cy + 12, BUBBLE_R * 0.65, nextColorRef.current);
      }

      // Shots left
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.font = "bold 8px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("SHOTS", 30, cy - 2);
      ctx.font = "bold 16px monospace";
      ctx.fillStyle = shotsRef.current > 10 ? "hsl(45,90%,60%)" : "hsl(0,80%,60%)";
      ctx.fillText(`${shotsRef.current}`, 30, cy + 16);

      // Level
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.font = "bold 8px sans-serif";
      ctx.fillText("LEVEL", BOARD_W - 30, cy - 2);
      ctx.font = "bold 16px monospace";
      ctx.fillStyle = "hsl(180,80%,60%)";
      ctx.fillText(`${levelRef.current}`, BOARD_W - 30, cy + 16);

      // Score at top
      ctx.save();
      ctx.fillStyle = "rgba(10,15,30,0.7)";
      ctx.beginPath();
      ctx.roundRect(BOARD_W / 2 - 50, 8, 100, 24, 12);
      ctx.fill();
      ctx.strokeStyle = "hsl(45,70%,50%)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.font = "bold 12px monospace";
      ctx.fillStyle = "hsl(45,90%,65%)";
      ctx.textAlign = "center";
      ctx.fillText(`⭐ ${scoreRef.current}`, BOARD_W / 2, 24);
      ctx.restore();

      if (!flyingRef.current && !gameOverRef.current) {
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Click to shoot!", BOARD_W / 2, BOARD_H / 2 + 80);
      }

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [started, gameOver, submitScore]);

  if (!started) return <StartScreen title={game.title} description={game.description} icon={game.icon} gradient={game.gradient} glow={game.glow} onStart={initGame} onBack={onBack} gameType="bubble_shooter" />;
  if (gameOver) return <EndScreen won={score >= 300} title={`Score: ${score}!`} subtitle={`Level ${level} reached — ${60 - shotsLeft} shots fired`} onReplay={initGame} onBack={onBack} gameType="bubble_shooter" />;

  return (
    <GameShell onBack={onBack} title="Bubble Shooter" icon={game.icon} gradient={game.gradient}
      badges={<>
        <Badge className="bg-amber-900/40 text-amber-300 border-amber-500/30 font-mono text-sm">⭐ {score}</Badge>
        <Badge className="bg-cyan-900/40 text-cyan-300 border-cyan-500/30 font-mono text-sm">Lvl {level}</Badge>
        <Badge className="bg-rose-900/40 text-rose-300 border-rose-500/30 font-mono text-sm">🎯 {shotsLeft}</Badge>
        {combo > 1 && <Badge className="bg-orange-900/40 text-orange-300 border-orange-500/30 font-mono text-sm animate-pulse">🔥 x{combo}</Badge>}
      </>}>
      <div className="flex flex-col items-center gap-3">
        <canvas
          ref={canvasRef}
          width={BOARD_W}
          height={BOARD_H}
          className="rounded-2xl cursor-crosshair max-w-full"
          style={{ maxWidth: BOARD_W, aspectRatio: `${BOARD_W}/${BOARD_H}`, border: "3px solid hsl(200,60%,40%)" }}
        />
        <div className="grid grid-cols-3 gap-2 w-52 md:hidden">
          <Button size="sm" variant="outline" className="border-cyan-500/30 h-11 text-lg"
            onClick={() => { aimRef.current = Math.max(-Math.PI + 0.15, aimRef.current - 0.06); }}>◀</Button>
          <Button size="sm" variant="outline" className="border-amber-500/30 h-11 text-lg font-bold"
            onClick={shoot}>🔵 FIRE</Button>
          <Button size="sm" variant="outline" className="border-cyan-500/30 h-11 text-lg"
            onClick={() => { aimRef.current = Math.min(-0.15, aimRef.current + 0.06); }}>▶</Button>
        </div>
        <p className="text-xs text-muted-foreground font-mono">Click to shoot • ← → to aim • Space to fire</p>
      </div>
      <Leaderboard gameType="bubble_shooter" />
    </GameShell>
  );
};

export default BubbleShooterGame;
