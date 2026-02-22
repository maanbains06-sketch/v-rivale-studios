import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface BrickBreakerGameProps {
  onBack: () => void;
  submitScore: (gameType: string, score: number, time?: number) => void;
  GameShell: React.ComponentType<any>;
  StartScreen: React.ComponentType<any>;
  EndScreen: React.ComponentType<any>;
  Leaderboard: React.ComponentType<any>;
  game: { title: string; description: string; icon: React.ReactNode; gradient: string; glow: string };
}

const BOARD_W = 520;
const BOARD_H = 620;
const PADDLE_W = 90;
const PADDLE_H = 14;
const BALL_R = 8;
const BRICK_COLS = 10;
const BRICK_ROWS = 8;
const BRICK_W = 46;
const BRICK_H = 18;
const BRICK_GAP = 3;
const BRICK_OFFSET_X = (BOARD_W - (BRICK_COLS * (BRICK_W + BRICK_GAP) - BRICK_GAP)) / 2;
const BRICK_OFFSET_Y = 60;

const BRICK_COLORS = [
  { main: "hsl(0 85% 55%)", light: "hsl(0 90% 70%)", dark: "hsl(0 80% 38%)", glow: "hsl(0 85% 55% / 0.4)" },
  { main: "hsl(25 90% 55%)", light: "hsl(25 95% 72%)", dark: "hsl(25 85% 38%)", glow: "hsl(25 90% 55% / 0.4)" },
  { main: "hsl(50 90% 50%)", light: "hsl(50 95% 68%)", dark: "hsl(50 85% 35%)", glow: "hsl(50 90% 50% / 0.4)" },
  { main: "hsl(120 70% 45%)", light: "hsl(120 75% 62%)", dark: "hsl(120 65% 30%)", glow: "hsl(120 70% 45% / 0.4)" },
  { main: "hsl(200 80% 50%)", light: "hsl(200 85% 68%)", dark: "hsl(200 75% 35%)", glow: "hsl(200 80% 50% / 0.4)" },
  { main: "hsl(260 75% 55%)", light: "hsl(260 80% 72%)", dark: "hsl(260 70% 38%)", glow: "hsl(260 75% 55% / 0.4)" },
  { main: "hsl(300 70% 50%)", light: "hsl(300 75% 68%)", dark: "hsl(300 65% 35%)", glow: "hsl(300 70% 50% / 0.4)" },
  { main: "hsl(340 80% 55%)", light: "hsl(340 85% 72%)", dark: "hsl(340 75% 38%)", glow: "hsl(340 80% 55% / 0.4)" },
];

interface Brick {
  id: number;
  row: number;
  col: number;
  x: number;
  y: number;
  alive: boolean;
  hits: number; // hits remaining
  colorIdx: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface PowerUp {
  id: number;
  x: number;
  y: number;
  type: "wide" | "multi" | "slow";
  vy: number;
}

const BrickBreakerGame = ({ onBack, submitScore, GameShell, StartScreen, EndScreen, Leaderboard, game }: BrickBreakerGameProps) => {
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);

  const paddleX = useRef(BOARD_W / 2);
  const ballPos = useRef({ x: BOARD_W / 2, y: BOARD_H - 60 });
  const ballVel = useRef({ x: 3, y: -4 });
  const bricksRef = useRef<Brick[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const paddleWidth = useRef(PADDLE_W);
  const frameRef = useRef<number>();
  const particleId = useRef(0);
  const powerUpId = useRef(0);
  const launched = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const comboRef = useRef(0);
  const levelRef = useRef(1);
  const gameOverRef = useRef(false);
  const wideTimer = useRef<NodeJS.Timeout>();

  const spawnBricks = useCallback((lvl: number) => {
    const bricks: Brick[] = [];
    let id = 0;
    const rows = Math.min(BRICK_ROWS, 4 + lvl);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        const hits = r < 2 && lvl > 2 ? 2 : 1;
        bricks.push({
          id: id++, row: r, col: c,
          x: BRICK_OFFSET_X + c * (BRICK_W + BRICK_GAP),
          y: BRICK_OFFSET_Y + r * (BRICK_H + BRICK_GAP),
          alive: true,
          hits,
          colorIdx: r % BRICK_COLORS.length,
        });
      }
    }
    return bricks;
  }, []);

  const initGame = () => {
    scoreRef.current = 0;
    livesRef.current = 3;
    comboRef.current = 0;
    levelRef.current = 1;
    gameOverRef.current = false;
    paddleX.current = BOARD_W / 2;
    ballPos.current = { x: BOARD_W / 2, y: BOARD_H - 60 };
    ballVel.current = { x: 3, y: -4 };
    bricksRef.current = spawnBricks(1);
    particlesRef.current = [];
    powerUpsRef.current = [];
    paddleWidth.current = PADDLE_W;
    launched.current = false;
    setScore(0);
    setLives(3);
    setLevel(1);
    setCombo(0);
    setGameOver(false);
    setStarted(true);
  };

  const addParticles = (x: number, y: number, color: string, count = 6) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        id: particleId.current++,
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 15 + Math.random() * 15,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  };

  // Mouse / touch control
  useEffect(() => {
    if (!started || gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMove = (clientX: number) => {
      const rect = canvas.getBoundingClientRect();
      const scale = BOARD_W / rect.width;
      paddleX.current = Math.max(paddleWidth.current / 2, Math.min(BOARD_W - paddleWidth.current / 2, (clientX - rect.left) * scale));
    };

    const handleClick = () => {
      if (!launched.current) launched.current = true;
    };

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => { e.preventDefault(); handleMove(e.touches[0].clientX); };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") { e.preventDefault(); launched.current = true; }
      if (e.key === "ArrowLeft") paddleX.current = Math.max(paddleWidth.current / 2, paddleX.current - 20);
      if (e.key === "ArrowRight") paddleX.current = Math.min(BOARD_W - paddleWidth.current / 2, paddleX.current + 20);
    };

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("touchstart", handleClick);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("touchstart", handleClick);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [started, gameOver]);

  // Main game loop with canvas rendering
  useEffect(() => {
    if (!started || gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const loop = () => {
      if (gameOverRef.current) return;

      const pw = paddleWidth.current;
      const px = paddleX.current;
      const ball = ballPos.current;
      const vel = ballVel.current;

      // Move ball
      if (launched.current) {
        ball.x += vel.x;
        ball.y += vel.y;

        // Wall bounce
        if (ball.x - BALL_R < 0) { ball.x = BALL_R; vel.x = Math.abs(vel.x); }
        if (ball.x + BALL_R > BOARD_W) { ball.x = BOARD_W - BALL_R; vel.x = -Math.abs(vel.x); }
        if (ball.y - BALL_R < 0) { ball.y = BALL_R; vel.y = Math.abs(vel.y); }

        // Paddle bounce
        if (ball.y + BALL_R >= BOARD_H - 30 && ball.y + BALL_R <= BOARD_H - 16 && vel.y > 0) {
          if (ball.x > px - pw / 2 - 5 && ball.x < px + pw / 2 + 5) {
            const offset = (ball.x - px) / (pw / 2);
            vel.x = offset * 5;
            vel.y = -Math.abs(vel.y);
            const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
            const maxSpeed = 6 + levelRef.current * 0.3;
            if (speed > maxSpeed) {
              vel.x = (vel.x / speed) * maxSpeed;
              vel.y = (vel.y / speed) * maxSpeed;
            }
            comboRef.current = 0;
            setCombo(0);
          }
        }

        // Ball lost
        if (ball.y > BOARD_H + 20) {
          livesRef.current--;
          setLives(livesRef.current);
          if (livesRef.current <= 0) {
            gameOverRef.current = true;
            setGameOver(true);
            submitScore("brick_breaker", scoreRef.current);
            return;
          }
          ball.x = px;
          ball.y = BOARD_H - 60;
          vel.x = 3;
          vel.y = -4;
          launched.current = false;
          comboRef.current = 0;
          setCombo(0);
        }

        // Brick collision
        for (const brick of bricksRef.current) {
          if (!brick.alive) continue;
          if (ball.x + BALL_R > brick.x && ball.x - BALL_R < brick.x + BRICK_W &&
              ball.y + BALL_R > brick.y && ball.y - BALL_R < brick.y + BRICK_H) {
            brick.hits--;
            if (brick.hits <= 0) {
              brick.alive = false;
              comboRef.current++;
              setCombo(comboRef.current);
              const pts = 10 * (brick.row + 1) + comboRef.current * 5;
              scoreRef.current += pts;
              setScore(scoreRef.current);
              addParticles(brick.x + BRICK_W / 2, brick.y + BRICK_H / 2, BRICK_COLORS[brick.colorIdx].main, 10);

              // Chance to drop power-up
              if (Math.random() < 0.15) {
                const types: ("wide" | "multi" | "slow")[] = ["wide", "slow"];
                powerUpsRef.current.push({
                  id: powerUpId.current++,
                  x: brick.x + BRICK_W / 2,
                  y: brick.y + BRICK_H,
                  type: types[Math.floor(Math.random() * types.length)],
                  vy: 2,
                });
              }
            }

            // Reflect ball
            const fromLeft = ball.x - (brick.x - BALL_R);
            const fromRight = (brick.x + BRICK_W + BALL_R) - ball.x;
            const fromTop = ball.y - (brick.y - BALL_R);
            const fromBottom = (brick.y + BRICK_H + BALL_R) - ball.y;
            const minH = Math.min(fromLeft, fromRight);
            const minV = Math.min(fromTop, fromBottom);
            if (minH < minV) vel.x = -vel.x;
            else vel.y = -vel.y;
            break;
          }
        }

        // Check level clear
        if (bricksRef.current.every(b => !b.alive)) {
          levelRef.current++;
          setLevel(levelRef.current);
          scoreRef.current += 200;
          setScore(scoreRef.current);
          bricksRef.current = spawnBricks(levelRef.current);
          ball.x = BOARD_W / 2;
          ball.y = BOARD_H - 60;
          vel.x = 3;
          vel.y = -(4 + levelRef.current * 0.3);
          launched.current = false;
          comboRef.current = 0;
          setCombo(0);
        }
      } else {
        ball.x = px;
        ball.y = BOARD_H - 60;
      }

      // Move power-ups
      for (let i = powerUpsRef.current.length - 1; i >= 0; i--) {
        const pu = powerUpsRef.current[i];
        pu.y += pu.vy;
        if (pu.y > BOARD_H) { powerUpsRef.current.splice(i, 1); continue; }
        // Catch
        if (pu.y + 10 > BOARD_H - 30 && pu.y < BOARD_H - 16 && pu.x > px - pw / 2 && pu.x < px + pw / 2) {
          if (pu.type === "wide") {
            paddleWidth.current = Math.min(160, pw + 30);
            if (wideTimer.current) clearTimeout(wideTimer.current);
            wideTimer.current = setTimeout(() => { paddleWidth.current = PADDLE_W; }, 8000);
          } else if (pu.type === "slow") {
            vel.x *= 0.7;
            vel.y *= 0.7;
          }
          addParticles(pu.x, pu.y, "hsl(50 95% 65%)", 8);
          scoreRef.current += 25;
          setScore(scoreRef.current);
          powerUpsRef.current.splice(i, 1);
        }
      }

      // Update particles
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.life--;
        return p.life > 0;
      });

      // ─── RENDER ───
      ctx.clearRect(0, 0, BOARD_W, BOARD_H);

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, BOARD_H);
      bgGrad.addColorStop(0, "hsl(230 30% 6%)");
      bgGrad.addColorStop(1, "hsl(250 25% 10%)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, BOARD_W, BOARD_H);

      // Stars
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      for (let i = 0; i < 40; i++) {
        const sx = (i * 137.5) % BOARD_W;
        const sy = (i * 97.3) % BOARD_H;
        ctx.beginPath();
        ctx.arc(sx, sy, 0.5 + (i % 3) * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Bricks
      for (const brick of bricksRef.current) {
        if (!brick.alive) continue;
        const c = BRICK_COLORS[brick.colorIdx];
        // Shadow
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fillRect(brick.x + 2, brick.y + 2, BRICK_W, BRICK_H);
        // Main body
        const grad = ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + BRICK_H);
        grad.addColorStop(0, c.light);
        grad.addColorStop(0.5, c.main);
        grad.addColorStop(1, c.dark);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(brick.x, brick.y, BRICK_W, BRICK_H, 3);
        ctx.fill();
        // Highlight
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.fillRect(brick.x + 2, brick.y + 1, BRICK_W - 4, 4);
        // Multi-hit indicator
        if (brick.hits > 1) {
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.font = "bold 10px monospace";
          ctx.textAlign = "center";
          ctx.fillText("●", brick.x + BRICK_W / 2, brick.y + BRICK_H / 2 + 4);
        }
        // Glow
        ctx.shadowColor = c.glow;
        ctx.shadowBlur = 8;
        ctx.strokeStyle = c.main;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.roundRect(brick.x, brick.y, BRICK_W, BRICK_H, 3);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Power-ups
      for (const pu of powerUpsRef.current) {
        ctx.save();
        ctx.shadowColor = pu.type === "wide" ? "hsl(200 90% 60%)" : "hsl(50 90% 60%)";
        ctx.shadowBlur = 12;
        ctx.fillStyle = pu.type === "wide" ? "hsl(200 85% 55%)" : "hsl(50 90% 55%)";
        ctx.beginPath();
        ctx.arc(pu.x, pu.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "white";
        ctx.font = "bold 9px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(pu.type === "wide" ? "W" : "S", pu.x, pu.y);
        ctx.restore();
      }

      // Paddle
      const padY = BOARD_H - 30;
      ctx.save();
      ctx.shadowColor = "hsl(200 85% 55%)";
      ctx.shadowBlur = 15;
      const padGrad = ctx.createLinearGradient(px - pw / 2, padY, px - pw / 2, padY + PADDLE_H);
      padGrad.addColorStop(0, "hsl(200 90% 65%)");
      padGrad.addColorStop(0.5, "hsl(210 85% 50%)");
      padGrad.addColorStop(1, "hsl(220 80% 40%)");
      ctx.fillStyle = padGrad;
      ctx.beginPath();
      ctx.roundRect(px - pw / 2, padY, pw, PADDLE_H, 7);
      ctx.fill();
      // Paddle highlight
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.fillRect(px - pw / 2 + 4, padY + 1, pw - 8, 3);
      ctx.restore();

      // Ball
      ctx.save();
      ctx.shadowColor = "hsl(45 95% 65%)";
      ctx.shadowBlur = 18;
      const ballGrad = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 1, ball.x, ball.y, BALL_R);
      ballGrad.addColorStop(0, "hsl(45 100% 90%)");
      ballGrad.addColorStop(0.5, "hsl(40 95% 65%)");
      ballGrad.addColorStop(1, "hsl(35 90% 50%)");
      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Particles
      for (const p of particlesRef.current) {
        ctx.globalAlpha = p.life / 30;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (p.life / 30), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;

      // HUD
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`LEVEL ${levelRef.current}`, BOARD_W / 2, 20);

      if (!launched.current) {
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Click or press SPACE to launch", BOARD_W / 2, BOARD_H / 2 + 60);
      }

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [started, gameOver, spawnBricks, submitScore]);

  if (!started) return <StartScreen title={game.title} description={game.description} icon={game.icon} gradient={game.gradient} glow={game.glow} onStart={initGame} onBack={onBack} gameType="brick_breaker" />;
  if (gameOver) return <EndScreen won={score >= 500} title={`Score: ${score}!`} subtitle={`Level ${level} reached • ${combo} max combo`} onReplay={initGame} onBack={onBack} gameType="brick_breaker" />;

  return (
    <GameShell onBack={onBack} title="Brick Breaker" icon={game.icon} gradient={game.gradient}
      badges={<>
        <Badge className="bg-yellow-900/40 text-yellow-300 border-yellow-500/30 font-mono">{score} pts</Badge>
        <Badge className="bg-red-900/40 text-red-300 border-red-500/30 font-mono">❤️ {lives}</Badge>
        <Badge className="bg-cyan-900/40 text-cyan-300 border-cyan-500/30 font-mono">Lv {level}</Badge>
        {combo > 2 && <Badge className="bg-orange-900/40 text-orange-300 border-orange-500/30 font-mono animate-pulse">🔥 x{combo}</Badge>}
      </>}>
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={BOARD_W}
          height={BOARD_H}
          className="rounded-xl border-2 border-cyan-500/20 cursor-none max-w-full"
          style={{ maxWidth: BOARD_W, aspectRatio: `${BOARD_W}/${BOARD_H}` }}
        />
        <p className="text-xs text-muted-foreground font-mono">Move mouse to control paddle • Click/Space to launch</p>
      </div>
      <Leaderboard gameType="brick_breaker" />
    </GameShell>
  );
};

export default BrickBreakerGame;
