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
const ROWS = 15;
const BUBBLE_R = 17;
const BUBBLE_D = BUBBLE_R * 2;
const ROW_H = BUBBLE_R * Math.sqrt(3);
const BOARD_W = COLS * BUBBLE_D + BUBBLE_R;
const BOARD_H = 640;
const SPEED = 12;
const LAUNCH_X = BOARD_W / 2;
const LAUNCH_Y = BOARD_H - 50;
const CEIL_Y = BUBBLE_R + 6;

const COLORS_HSL: [number, number, number][] = [
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
  return { x: BUBBLE_R + col * BUBBLE_D + offset, y: CEIL_Y + row * ROW_H };
}

function getMaxCols(row: number) { return row % 2 === 1 ? COLS - 1 : COLS; }

function snapToGrid(x: number, y: number): { row: number; col: number } {
  let row = Math.round((y - CEIL_Y) / ROW_H);
  row = Math.max(0, Math.min(ROWS - 1, row));
  const offset = row % 2 === 1 ? BUBBLE_R : 0;
  let col = Math.round((x - BUBBLE_R - offset) / BUBBLE_D);
  col = Math.max(0, Math.min(getMaxCols(row) - 1, col));
  return { row, col };
}

function getNeighbors(r: number, c: number): [number, number][] {
  const odd = r % 2 === 1;
  return [
    [r, c - 1], [r, c + 1],
    [r - 1, odd ? c : c - 1], [r - 1, odd ? c + 1 : c],
    [r + 1, odd ? c : c - 1], [r + 1, odd ? c + 1 : c],
  ];
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
    for (const n of getNeighbors(r, c)) stack.push(n);
  }
  return cluster;
}

function findFloating(grid: (number | null)[][]): [number, number][] {
  const visited = new Set<string>();
  const stack: [number, number][] = [];
  if (grid[0]) for (let c = 0; c < grid[0].length; c++) if (grid[0][c] !== null) stack.push([0, c]);
  while (stack.length > 0) {
    const [r, c] = stack.pop()!;
    const key = `${r},${c}`;
    if (visited.has(key)) continue;
    visited.add(key);
    if (r < 0 || r >= grid.length || c < 0 || c >= getMaxCols(r)) continue;
    if (grid[r]?.[c] === null) continue;
    for (const n of getNeighbors(r, c)) stack.push(n);
  }
  const floating: [number, number][] = [];
  for (let r = 0; r < grid.length; r++)
    for (let c = 0; c < getMaxCols(r); c++)
      if (grid[r]?.[c] !== null && !visited.has(`${r},${c}`)) floating.push([r, c]);
  return floating;
}

function spawnGrid(level: number): (number | null)[][] {
  const rows: (number | null)[][] = [];
  const fillRows = Math.min(4 + level, ROWS - 5);
  const numColors = Math.min(3 + Math.floor(level / 2), COLORS_HSL.length);
  for (let r = 0; r < ROWS; r++) {
    const mc = getMaxCols(r);
    rows.push(Array.from({ length: mc }, (_, c) => r < fillRows ? Math.floor(Math.random() * numColors) : null));
  }
  return rows;
}

function drawBubble(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, colorIdx: number, glow = false) {
  if (colorIdx < 0 || colorIdx >= COLORS_HSL.length) return;
  const [h, s, l] = COLORS_HSL[colorIdx];
  ctx.save();
  if (glow) { ctx.shadowColor = hsl(h, s, l, 0.7); ctx.shadowBlur = 20; }
  const grad = ctx.createRadialGradient(x - r * 0.28, y - r * 0.32, r * 0.08, x + r * 0.05, y + r * 0.1, r);
  grad.addColorStop(0, hsl(h, s + 5, l + 28));
  grad.addColorStop(0.35, hsl(h, s, l + 10));
  grad.addColorStop(0.7, hsl(h, s, l));
  grad.addColorStop(1, hsl(h, s - 5, l - 18));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r - 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = hsl(h, s - 10, l - 25, 0.4);
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.shadowBlur = 0;
  // Main highlight
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.beginPath();
  ctx.ellipse(x - r * 0.22, y - r * 0.28, r * 0.32, r * 0.2, -0.4, 0, Math.PI * 2);
  ctx.fill();
  // Tiny sparkle
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.beginPath();
  ctx.arc(x + r * 0.15, y + r * 0.22, r * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Compute bouncing aim line points
function computeAimLine(angle: number): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  let x = LAUNCH_X, y = LAUNCH_Y;
  let vx = Math.cos(angle), vy = Math.sin(angle);
  for (let i = 0; i < 300; i++) {
    x += vx * 3; y += vy * 3;
    if (x < BUBBLE_R) { x = BUBBLE_R; vx = -vx; }
    if (x > BOARD_W - BUBBLE_R) { x = BOARD_W - BUBBLE_R; vx = -vx; }
    if (y < CEIL_Y) break;
    if (i % 4 === 0) points.push({ x, y });
  }
  return points;
}

interface FallingBubble { x: number; y: number; vy: number; color: number; life: number; }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: number; size: number; }

const BubbleShooterGame = ({ onBack, submitScore, GameShell, StartScreen, EndScreen, Leaderboard, game }: BubbleShooterGameProps) => {
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [shotsLeft, setShotsLeft] = useState(50);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<(number | null)[][]>([]);
  const flyRef = useRef<{ x: number; y: number; vx: number; vy: number; color: number } | null>(null);
  const aimRef = useRef(-Math.PI / 2);
  const aimingRef = useRef(false);
  const curColorRef = useRef(0);
  const nextColorRef = useRef(1);
  const scoreRef = useRef(0);
  const shotsRef = useRef(50);
  const levelRef = useRef(1);
  const comboRef = useRef(0);
  const overRef = useRef(false);
  const frameRef = useRef<number>();
  const particles = useRef<Particle[]>([]);
  const fallingBubbles = useRef<FallingBubble[]>([]);
  const comboPopup = useRef<{ val: number; life: number; y: number }>({ val: 0, life: 0, y: 0 });
  const shakeRef = useRef(0);

  const pickColor = useCallback((lvl: number) => {
    const n = Math.min(3 + Math.floor(lvl / 2), COLORS_HSL.length);
    return Math.floor(Math.random() * n);
  }, []);

  const initGame = () => {
    gridRef.current = spawnGrid(1);
    flyRef.current = null;
    aimRef.current = -Math.PI / 2;
    aimingRef.current = false;
    curColorRef.current = pickColor(1);
    nextColorRef.current = pickColor(1);
    scoreRef.current = 0; shotsRef.current = 50; levelRef.current = 1; comboRef.current = 0;
    overRef.current = false;
    particles.current = []; fallingBubbles.current = [];
    comboPopup.current = { val: 0, life: 0, y: 0 };
    shakeRef.current = 0;
    setScore(0); setShotsLeft(50); setLevel(1); setCombo(0); setGameOver(false); setStarted(true);
  };

  const shoot = useCallback(() => {
    if (flyRef.current || overRef.current) return;
    const angle = aimRef.current;
    // Prevent shooting downward
    if (angle > -0.1 || angle < -Math.PI + 0.1) return;
    flyRef.current = {
      x: LAUNCH_X, y: LAUNCH_Y,
      vx: Math.cos(angle) * SPEED, vy: Math.sin(angle) * SPEED,
      color: curColorRef.current,
    };
    curColorRef.current = nextColorRef.current;
    nextColorRef.current = pickColor(levelRef.current);
    shotsRef.current--;
    setShotsLeft(shotsRef.current);
    if (shotsRef.current <= 0) {
      overRef.current = true; setGameOver(true);
      submitScore("bubble_shooter", scoreRef.current);
    }
  }, [submitScore, pickColor]);

  // Input: drag to aim, release to shoot
  useEffect(() => {
    if (!started || gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getAngle = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const sx = BOARD_W / rect.width, sy = BOARD_H / rect.height;
      const mx = (clientX - rect.left) * sx, my = (clientY - rect.top) * sy;
      const a = Math.atan2(my - LAUNCH_Y, mx - LAUNCH_X);
      return Math.max(-Math.PI + 0.12, Math.min(-0.12, a));
    };

    // Mouse
    const onDown = (e: MouseEvent) => { aimingRef.current = true; aimRef.current = getAngle(e.clientX, e.clientY); };
    const onMove = (e: MouseEvent) => { if (aimingRef.current || !flyRef.current) aimRef.current = getAngle(e.clientX, e.clientY); };
    const onUp = () => { if (aimingRef.current) { aimingRef.current = false; shoot(); } };

    // Touch
    const onTouchStart = (e: TouchEvent) => { e.preventDefault(); aimingRef.current = true; aimRef.current = getAngle(e.touches[0].clientX, e.touches[0].clientY); };
    const onTouchMove = (e: TouchEvent) => { e.preventDefault(); if (aimingRef.current) aimRef.current = getAngle(e.touches[0].clientX, e.touches[0].clientY); };
    const onTouchEnd = (e: TouchEvent) => { e.preventDefault(); if (aimingRef.current) { aimingRef.current = false; shoot(); } };

    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") { e.preventDefault(); shoot(); }
      if (e.key === "ArrowLeft") aimRef.current = Math.max(-Math.PI + 0.12, aimRef.current - 0.04);
      if (e.key === "ArrowRight") aimRef.current = Math.min(-0.12, aimRef.current + 0.04);
    };

    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
    };
  }, [started, gameOver, shoot]);

  // Game loop
  useEffect(() => {
    if (!started || gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const loop = () => {
      if (overRef.current) return;
      const grid = gridRef.current;
      const fly = flyRef.current;

      // ── UPDATE ──
      if (fly) {
        fly.x += fly.vx; fly.y += fly.vy;
        if (fly.x < BUBBLE_R) { fly.x = BUBBLE_R; fly.vx = -fly.vx; }
        if (fly.x > BOARD_W - BUBBLE_R) { fly.x = BOARD_W - BUBBLE_R; fly.vx = -fly.vx; }

        let landed = false;
        let bestRow = -1, bestCol = -1;

        // Hit ceiling
        if (fly.y <= CEIL_Y) {
          landed = true;
          const snap = snapToGrid(fly.x, CEIL_Y);
          bestRow = snap.row; bestCol = snap.col;
        }

        // Collision with grid bubbles
        if (!landed) {
          outer: for (let r = 0; r < grid.length; r++) {
            for (let c = 0; c < getMaxCols(r); c++) {
              if (grid[r]?.[c] === null) continue;
              const pos = getBubblePos(r, c);
              const dx = fly.x - pos.x, dy = fly.y - pos.y;
              if (dx * dx + dy * dy < (BUBBLE_R * 1.9) ** 2) {
                // Snap the flying bubble to nearest empty neighbor of the hit bubble
                const neighbors = getNeighbors(r, c);
                let minDist = Infinity;
                for (const [nr, nc] of neighbors) {
                  if (nr < 0 || nr >= ROWS || nc < 0 || nc >= getMaxCols(nr)) continue;
                  while (grid.length <= nr) grid.push(Array(getMaxCols(grid.length)).fill(null));
                  if (grid[nr]?.[nc] !== null) continue;
                  const npos = getBubblePos(nr, nc);
                  const d = (fly.x - npos.x) ** 2 + (fly.y - npos.y) ** 2;
                  if (d < minDist) { minDist = d; bestRow = nr; bestCol = nc; }
                }
                if (bestRow >= 0) landed = true;
                break outer;
              }
            }
          }
        }

        if (landed && bestRow >= 0 && bestCol >= 0) {
          while (grid.length <= bestRow) grid.push(Array(getMaxCols(grid.length)).fill(null));
          grid[bestRow][bestCol] = fly.color;

          const cluster = findCluster(grid, bestRow, bestCol, fly.color);
          let popped = 0;
          if (cluster.length >= 3) {
            for (const [r2, c2] of cluster) {
              const pos = getBubblePos(r2, c2);
              const col = grid[r2][c2]!;
              for (let i = 0; i < 8; i++) {
                const angle = Math.random() * Math.PI * 2;
                const spd = 1.5 + Math.random() * 3;
                particles.current.push({
                  x: pos.x, y: pos.y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd - 1,
                  life: 30 + Math.random() * 15, maxLife: 45, color: col, size: 2 + Math.random() * 3,
                });
              }
              grid[r2][c2] = null;
            }
            popped = cluster.length;
            shakeRef.current = 6;

            // Floating
            const floating = findFloating(grid);
            for (const [r2, c2] of floating) {
              const pos = getBubblePos(r2, c2);
              fallingBubbles.current.push({ x: pos.x, y: pos.y, vy: 0, color: grid[r2][c2]!, life: 60 });
              grid[r2][c2] = null;
              popped++;
            }

            comboRef.current++;
            comboPopup.current = { val: comboRef.current, life: 60, y: getBubblePos(bestRow, bestCol).y };
            setCombo(comboRef.current);
            const pts = popped * 10 * Math.max(1, comboRef.current);
            scoreRef.current += pts;
            setScore(scoreRef.current);
          } else {
            comboRef.current = 0; setCombo(0);
          }

          // Board clear → next level
          const anyLeft = grid.some(row => row.some(c => c !== null));
          if (!anyLeft) {
            scoreRef.current += 500; setScore(scoreRef.current);
            levelRef.current++; setLevel(levelRef.current);
            shotsRef.current += 15; setShotsLeft(shotsRef.current);
            gridRef.current = spawnGrid(levelRef.current);
          }

          // Game over check
          for (let r = ROWS - 4; r < grid.length; r++) {
            if (grid[r]?.some(c => c !== null)) {
              overRef.current = true; setGameOver(true);
              submitScore("bubble_shooter", scoreRef.current);
              break;
            }
          }
          flyRef.current = null;
        } else if (fly.y < -60 || fly.y > BOARD_H + 60) {
          flyRef.current = null;
        }
      }

      // Update particles
      particles.current = particles.current.filter(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.life--;
        return p.life > 0;
      });

      // Falling bubbles
      fallingBubbles.current = fallingBubbles.current.filter(fb => {
        fb.y += fb.vy; fb.vy += 0.5; fb.life--;
        return fb.life > 0 && fb.y < BOARD_H + 40;
      });

      if (comboPopup.current.life > 0) { comboPopup.current.life--; comboPopup.current.y -= 0.5; }
      if (shakeRef.current > 0) shakeRef.current -= 0.5;

      // ── RENDER ──
      ctx.save();
      const shake = shakeRef.current > 0 ? (Math.random() - 0.5) * shakeRef.current : 0;
      ctx.translate(shake, 0);

      ctx.clearRect(-5, 0, BOARD_W + 10, BOARD_H);

      // Background gradient
      const bg = ctx.createLinearGradient(0, 0, 0, BOARD_H);
      bg.addColorStop(0, "hsl(200,80%,18%)");
      bg.addColorStop(0.5, "hsl(210,75%,14%)");
      bg.addColorStop(1, "hsl(220,70%,10%)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, BOARD_W, BOARD_H);

      // Subtle grid pattern
      ctx.strokeStyle = "rgba(255,255,255,0.015)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i < BOARD_W; i += 20) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, BOARD_H); ctx.stroke(); }
      for (let i = 0; i < BOARD_H; i += 20) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(BOARD_W, i); ctx.stroke(); }

      // Side & top rails
      const rail = ctx.createLinearGradient(0, 0, 6, 0);
      rail.addColorStop(0, "hsl(35,75%,45%)"); rail.addColorStop(0.5, "hsl(40,80%,55%)"); rail.addColorStop(1, "hsl(35,70%,40%)");
      ctx.fillStyle = rail;
      ctx.fillRect(0, 0, 4, BOARD_H);
      const rail2 = ctx.createLinearGradient(BOARD_W - 6, 0, BOARD_W, 0);
      rail2.addColorStop(0, "hsl(35,70%,40%)"); rail2.addColorStop(0.5, "hsl(40,80%,55%)"); rail2.addColorStop(1, "hsl(35,75%,45%)");
      ctx.fillStyle = rail2;
      ctx.fillRect(BOARD_W - 4, 0, 4, BOARD_H);
      ctx.fillStyle = "hsl(40,80%,50%)";
      ctx.fillRect(0, 0, BOARD_W, 3);

      // Danger line
      const dangerY = getBubblePos(ROWS - 4, 0).y;
      ctx.save();
      ctx.setLineDash([8, 8]);
      ctx.strokeStyle = "rgba(255,60,60,0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(6, dangerY); ctx.lineTo(BOARD_W - 6, dangerY); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Grid bubbles
      for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < getMaxCols(r); c++) {
          const val = grid[r]?.[c];
          if (val === null || val === undefined) continue;
          const pos = getBubblePos(r, c);
          drawBubble(ctx, pos.x, pos.y, BUBBLE_R, val);
        }
      }

      // Falling bubbles
      for (const fb of fallingBubbles.current) {
        ctx.globalAlpha = Math.min(1, fb.life / 20);
        drawBubble(ctx, fb.x, fb.y, BUBBLE_R, fb.color);
      }
      ctx.globalAlpha = 1;

      // Particles
      for (const p of particles.current) {
        const [h, s, l] = COLORS_HSL[p.color] || [0, 0, 50];
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = hsl(h, s, l + 15);
        ctx.shadowColor = hsl(h, s, l, 0.6);
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;

      // Flying bubble
      if (fly) drawBubble(ctx, fly.x, fly.y, BUBBLE_R, fly.color, true);

      // Combo popup
      if (comboPopup.current.life > 0 && comboPopup.current.val > 1) {
        const alpha = Math.min(1, comboPopup.current.life / 30);
        const scale = 1 + (1 - comboPopup.current.life / 60) * 0.3;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = `bold ${Math.round(28 * scale)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillStyle = "hsl(45,100%,65%)";
        ctx.shadowColor = "hsl(30,100%,40%)";
        ctx.shadowBlur = 12;
        ctx.fillText(`${comboPopup.current.val}x COMBO!`, BOARD_W / 2, comboPopup.current.y);
        ctx.restore();
      }

      // ── Bottom launcher area ──
      const launchGrad = ctx.createLinearGradient(0, BOARD_H - 100, 0, BOARD_H);
      launchGrad.addColorStop(0, "rgba(5,10,20,0)");
      launchGrad.addColorStop(0.5, "rgba(5,10,20,0.85)");
      launchGrad.addColorStop(1, "rgba(5,10,20,1)");
      ctx.fillStyle = launchGrad;
      ctx.fillRect(0, BOARD_H - 100, BOARD_W, 100);

      // Aim guide (bouncing dotted line)
      if (!fly) {
        const aimPts = computeAimLine(aimRef.current);
        for (let i = 0; i < aimPts.length; i++) {
          const t = i / aimPts.length;
          ctx.globalAlpha = 0.6 - t * 0.5;
          ctx.fillStyle = "white";
          ctx.beginPath();
          ctx.arc(aimPts[i].x, aimPts[i].y, Math.max(1.2, 3 - t * 2), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Ghost bubble at end of aim
        if (aimPts.length > 0) {
          const last = aimPts[aimPts.length - 1];
          ctx.globalAlpha = 0.35;
          drawBubble(ctx, last.x, last.y, BUBBLE_R, curColorRef.current);
          ctx.globalAlpha = 1;
        }
      }

      // Launcher platform
      ctx.save();
      const platGrad = ctx.createRadialGradient(LAUNCH_X, LAUNCH_Y + 4, 4, LAUNCH_X, LAUNCH_Y + 4, 34);
      platGrad.addColorStop(0, "hsl(200,25%,28%)");
      platGrad.addColorStop(0.8, "hsl(210,20%,16%)");
      platGrad.addColorStop(1, "hsl(220,25%,10%)");
      ctx.fillStyle = platGrad;
      ctx.beginPath(); ctx.arc(LAUNCH_X, LAUNCH_Y + 4, 30, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "hsl(38,70%,48%)"; ctx.lineWidth = 2; ctx.stroke();
      ctx.strokeStyle = "hsl(38,50%,35%)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(LAUNCH_X, LAUNCH_Y + 4, 22, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();

      // Cannon
      ctx.save();
      ctx.translate(LAUNCH_X, LAUNCH_Y + 4);
      ctx.rotate(aimRef.current + Math.PI / 2);
      const bGrad = ctx.createLinearGradient(-6, 0, 6, 0);
      bGrad.addColorStop(0, "hsl(210,20%,28%)");
      bGrad.addColorStop(0.5, "hsl(200,25%,42%)");
      bGrad.addColorStop(1, "hsl(210,20%,30%)");
      ctx.fillStyle = bGrad;
      ctx.beginPath(); ctx.roundRect(-6, -40, 12, 40, 2); ctx.fill();
      ctx.strokeStyle = "hsl(38,55%,48%)"; ctx.lineWidth = 0.8; ctx.stroke();
      ctx.fillStyle = "hsl(40,75%,50%)"; ctx.fillRect(-8, -43, 16, 4);
      ctx.restore();

      // Current bubble
      drawBubble(ctx, LAUNCH_X, LAUNCH_Y + 2, BUBBLE_R - 1, curColorRef.current);

      // Next bubble
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "bold 8px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("NEXT", LAUNCH_X + 46, LAUNCH_Y - 6);
      drawBubble(ctx, LAUNCH_X + 46, LAUNCH_Y + 8, BUBBLE_R * 0.6, nextColorRef.current);

      // Shots
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "bold 8px sans-serif";
      ctx.fillText("SHOTS", 28, LAUNCH_Y - 6);
      ctx.font = "bold 15px monospace";
      ctx.fillStyle = shotsRef.current > 10 ? "hsl(45,90%,62%)" : "hsl(0,80%,60%)";
      ctx.fillText(`${shotsRef.current}`, 28, LAUNCH_Y + 12);

      // Level
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "bold 8px sans-serif";
      ctx.fillText("LVL", BOARD_W - 28, LAUNCH_Y - 6);
      ctx.font = "bold 15px monospace";
      ctx.fillStyle = "hsl(180,80%,62%)";
      ctx.fillText(`${levelRef.current}`, BOARD_W - 28, LAUNCH_Y + 12);

      // Score top
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.beginPath(); ctx.roundRect(BOARD_W / 2 - 52, 7, 104, 22, 11); ctx.fill();
      ctx.strokeStyle = "hsl(45,65%,50%)"; ctx.lineWidth = 1; ctx.stroke();
      ctx.font = "bold 12px monospace"; ctx.fillStyle = "hsl(45,90%,65%)";
      ctx.textAlign = "center"; ctx.fillText(`⭐ ${scoreRef.current}`, BOARD_W / 2, 22);
      ctx.restore();

      // Instruction
      if (!fly && !overRef.current) {
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.font = "11px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("Drag to aim · Release to shoot", BOARD_W / 2, BOARD_H - 8);
      }

      ctx.restore(); // shake

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [started, gameOver, submitScore]);

  if (!started) return <StartScreen title={game.title} description={game.description} icon={game.icon} gradient={game.gradient} glow={game.glow} onStart={initGame} onBack={onBack} gameType="bubble_shooter" />;
  if (gameOver) return <EndScreen won={score >= 300} title={`Score: ${score}!`} subtitle={`Level ${level} reached — ${50 - shotsLeft} shots fired`} onReplay={initGame} onBack={onBack} gameType="bubble_shooter" />;

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
          className="rounded-2xl max-w-full touch-none"
          style={{ maxWidth: BOARD_W, aspectRatio: `${BOARD_W}/${BOARD_H}`, border: "3px solid hsl(200,50%,35%)", cursor: "crosshair" }}
        />
        <div className="grid grid-cols-3 gap-2 w-52 md:hidden">
          <Button size="sm" variant="outline" className="border-cyan-500/30 h-11 text-lg"
            onClick={() => { aimRef.current = Math.max(-Math.PI + 0.12, aimRef.current - 0.06); }}>◀</Button>
          <Button size="sm" variant="outline" className="border-amber-500/30 h-11 text-lg font-bold"
            onClick={shoot}>🔵 FIRE</Button>
          <Button size="sm" variant="outline" className="border-cyan-500/30 h-11 text-lg"
            onClick={() => { aimRef.current = Math.min(-0.12, aimRef.current + 0.06); }}>▶</Button>
        </div>
        <p className="text-xs text-muted-foreground font-mono">Drag to aim · Release to shoot · ← → Space</p>
      </div>
      <Leaderboard gameType="bubble_shooter" />
    </GameShell>
  );
};

export default BubbleShooterGame;
