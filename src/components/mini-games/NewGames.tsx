import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Clock, CheckCircle, XCircle, Shield, Skull,
  Volume2, Box, Lock, Target, Brain, Crosshair, Gamepad2,
  Users, Car, DollarSign, Map, Radio, Heart, Eye, Flame,
  Star, Zap, TrendingUp, AlertTriangle
} from "lucide-react";

// ─── Re-export types needed by parent ────────────────────
export type NewGameType =
  | "heist_planner" | "audio_guess" | "mystery_box" | "lockpick"
  | "interrogation" | "street_racing" | "money_laundering" | "smuggler_route"
  | "clip_guess" | "radio_decode" | "survival_24h" | "double_agent"
  | "ego_meter" | "chaos_meter" | "city_control" | "karma_wheel";

// ─── Shared Utilities ────────────────────────────────────
const Card3D = ({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  const handleMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    ref.current.style.transform = `perspective(800px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale3d(1.02, 1.02, 1.02)`;
  };
  const handleLeave = () => { if (ref.current) ref.current.style.transform = "none"; };
  return (
    <div ref={ref} className={`transition-transform duration-300 ease-out ${className}`} style={{ transformStyle: "preserve-3d" }}
      onMouseMove={handleMove} onMouseLeave={handleLeave} onClick={onClick}>
      {children}
    </div>
  );
};

const TimerBadge = ({ seconds, danger = 30 }: { seconds: number; danger?: number }) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return (
    <Badge className={`font-mono text-base px-3 py-1 ${seconds <= danger ? "bg-red-600/80 text-red-100 animate-pulse border-red-500/50" : "bg-cyan-950/60 text-cyan-300 border-cyan-500/30"}`}>
      <Clock className="w-3.5 h-3.5 mr-1.5" />
      {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </Badge>
  );
};

const GameShell = ({ children, onBack, title, icon, gradient, timer, badges }: {
  children: React.ReactNode; onBack: () => void; title: string;
  icon: React.ReactNode; gradient: string; timer?: React.ReactNode;
  badges?: React.ReactNode;
}) => (
  <div className="space-y-5">
    <div className="flex items-center justify-between flex-wrap gap-3">
      <Button variant="ghost" onClick={onBack} className="gap-2 text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /> Back</Button>
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-lg bg-gradient-to-r ${gradient}`}>{icon}</div>
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      <div className="flex items-center gap-2">{badges}{timer}</div>
    </div>
    {children}
  </div>
);

// ════════════════════════════════════════════════════════
// 1. HEIST PLANNING SIMULATOR
// ════════════════════════════════════════════════════════
const CREW_OPTIONS = [
  { label: "Solo (1)", risk: 0.3, bonus: 2 },
  { label: "Duo (2)", risk: 0.5, bonus: 1.5 },
  { label: "Squad (4)", risk: 0.7, bonus: 1 },
  { label: "Army (6)", risk: 0.85, bonus: 0.7 },
];
const WEAPON_OPTIONS = [
  { label: "🔪 Knife", risk: 0.2, stealth: 0.8 },
  { label: "🔫 Pistol", risk: 0.5, stealth: 0.5 },
  { label: "💣 Explosives", risk: 0.9, stealth: 0.1 },
  { label: "🤜 Bare Hands", risk: 0.1, stealth: 0.95 },
];
const ENTRY_OPTIONS = [
  { label: "🚪 Front Door", risk: 0.3, speed: 0.9 },
  { label: "🪟 Rooftop", risk: 0.6, speed: 0.5 },
  { label: "🕳️ Sewer", risk: 0.7, speed: 0.3 },
  { label: "🚗 Drive-Through", risk: 0.5, speed: 0.8 },
];
const ESCAPE_OPTIONS = [
  { label: "🏎️ Sports Car", risk: 0.4, speed: 0.95 },
  { label: "🚁 Helicopter", risk: 0.7, speed: 0.99 },
  { label: "🏃 On Foot", risk: 0.2, speed: 0.3 },
  { label: "🚤 Speedboat", risk: 0.6, speed: 0.85 },
];
const FAIL_MESSAGES = [
  "Your getaway car ran out of gas 2 blocks away. 😂",
  "Your crew member accidentally pocket-dialed 911. 📱",
  "You forgot the bag for the money. Classic. 💰",
  "The vault was empty — it was a decoy! 🏦",
  "A security guard recognized you from high school. 👋",
  "Your mask was on backwards the whole time. 🎭",
  "The helicopter pilot fell asleep. 😴",
  "You triggered a paint bomb. You're now bright pink. 🩷",
];

export const HeistPlannerGame = ({ onBack }: { onBack: () => void }) => {
  const [phase, setPhase] = useState<"plan" | "execute" | "result">("plan");
  const [crew, setCrew] = useState(0);
  const [weapon, setWeapon] = useState(0);
  const [entry, setEntry] = useState(0);
  const [escape, setEscape] = useState(0);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<"success" | "partial" | "fail" | null>(null);
  const [successChance, setSuccessChance] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const calculateSuccess = () => {
    const crewFactor = CREW_OPTIONS[crew].risk;
    const weaponFactor = WEAPON_OPTIONS[weapon].stealth;
    const entryFactor = 1 - ENTRY_OPTIONS[entry].risk;
    const escapeFactor = ESCAPE_OPTIONS[escape].speed;
    return Math.min(95, Math.max(5, Math.round((crewFactor * 0.25 + weaponFactor * 0.2 + entryFactor * 0.25 + escapeFactor * 0.3) * 100)));
  };

  const executeHeist = () => {
    const chance = calculateSuccess();
    setSuccessChance(chance);
    setPhase("execute");
    setProgress(0);
    let p = 0;
    intervalRef.current = setInterval(() => {
      p += 2;
      setProgress(p);
      if (p >= 100) {
        clearInterval(intervalRef.current);
        const roll = Math.random() * 100;
        if (roll <= chance) setResult("success");
        else if (roll <= chance + 20) setResult("partial");
        else setResult("fail");
        setPhase("result");
      }
    }, 60);
  };

  const reset = () => { setPhase("plan"); setProgress(0); setResult(null); };

  const OptionSelector = ({ label, options, value, onChange }: { label: string; options: { label: string }[]; value: number; onChange: (v: number) => void }) => (
    <div className="space-y-2">
      <p className="text-sm font-mono text-cyan-400/80 uppercase tracking-wider">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt, i) => (
          <motion.button key={i} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => onChange(i)}
            className={`p-3 rounded-xl border-2 text-sm font-medium transition-all text-left ${
              value === i ? "border-cyan-500 bg-cyan-500/15 shadow-[0_0_15px_hsl(190_80%_50%/0.3)]" : "border-white/[0.08] hover:border-cyan-500/30 bg-white/[0.02]"
            }`}>
            {opt.label}
          </motion.button>
        ))}
      </div>
    </div>
  );

  return (
    <GameShell onBack={onBack} title="Heist Planner" icon={<Shield className="w-5 h-5 text-foreground" />} gradient="from-amber-600 via-orange-500 to-red-500">
      <Card3D>
        <Card className="border-amber-500/20 bg-gradient-to-b from-[hsl(220,20%,10%)] to-[hsl(220,20%,6%)]">
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              {phase === "plan" && (
                <motion.div key="plan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-amber-400" style={{ textShadow: "0 0 20px hsl(38 90% 55% / 0.4)" }}>🏦 Plan Your Heist</h3>
                    <p className="text-muted-foreground text-sm mt-1">Choose wisely — every decision affects your success rate.</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <OptionSelector label="👥 Crew Size" options={CREW_OPTIONS} value={crew} onChange={setCrew} />
                    <OptionSelector label="🔫 Weapons" options={WEAPON_OPTIONS} value={weapon} onChange={setWeapon} />
                    <OptionSelector label="🚪 Entry Point" options={ENTRY_OPTIONS} value={entry} onChange={setEntry} />
                    <OptionSelector label="🚗 Escape Vehicle" options={ESCAPE_OPTIONS} value={escape} onChange={setEscape} />
                  </div>
                  <div className="text-center space-y-3">
                    <div className="inline-block bg-black/40 border border-amber-500/30 rounded-xl px-6 py-3">
                      <p className="text-xs text-muted-foreground font-mono">ESTIMATED SUCCESS</p>
                      <p className="text-3xl font-black text-amber-400 font-mono">{calculateSuccess()}%</p>
                    </div>
                    <div>
                      <Button onClick={executeHeist} className="bg-gradient-to-r from-amber-600 to-red-600 border-0 text-lg px-8 py-3 shadow-lg shadow-amber-500/30">
                        🎯 Execute Heist
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
              {phase === "execute" && (
                <motion.div key="execute" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6 py-8">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                    <Shield className="w-16 h-16 text-amber-400 mx-auto" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-amber-400">Heist In Progress...</h3>
                  <div className="max-w-md mx-auto space-y-2">
                    <Progress value={progress} className="h-4" />
                    <p className="text-sm text-muted-foreground font-mono">{progress}% complete</p>
                  </div>
                  <div className="text-xs text-muted-foreground/60 font-mono space-y-1">
                    {progress > 20 && <p>📡 Bypassing security cameras...</p>}
                    {progress > 40 && <p>🔓 Cracking the vault...</p>}
                    {progress > 60 && <p>💰 Grabbing the loot...</p>}
                    {progress > 80 && <p>🚨 Alarms triggered! Moving to exit...</p>}
                  </div>
                </motion.div>
              )}
              {phase === "result" && (
                <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 py-6">
                  {result === "success" && (
                    <>
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}>
                        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-green-500/40">
                          <CheckCircle className="w-12 h-12 text-foreground" />
                        </div>
                      </motion.div>
                      <h3 className="text-3xl font-bold text-green-400">HEIST SUCCESS! 💰</h3>
                      <p className="text-muted-foreground">Clean getaway! +{Math.round(successChance * 10)} XP earned!</p>
                    </>
                  )}
                  {result === "partial" && (
                    <>
                      <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-2xl shadow-yellow-500/40">
                        <AlertTriangle className="w-12 h-12 text-foreground" />
                      </div>
                      <h3 className="text-3xl font-bold text-yellow-400">PARTIAL SUCCESS ⚡</h3>
                      <p className="text-muted-foreground">Got some loot but took heat. +{Math.round(successChance * 3)} XP</p>
                    </>
                  )}
                  {result === "fail" && (
                    <>
                      <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-2xl shadow-red-500/40">
                        <XCircle className="w-12 h-12 text-foreground" />
                      </div>
                      <h3 className="text-3xl font-bold text-red-400">HEIST FAILED! 🚨</h3>
                      <p className="text-muted-foreground text-lg italic">"{FAIL_MESSAGES[Math.floor(Math.random() * FAIL_MESSAGES.length)]}"</p>
                    </>
                  )}
                  <Button onClick={reset} className="bg-gradient-to-r from-amber-600 to-orange-600 border-0 mt-4">Plan Another Heist</Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </Card3D>
    </GameShell>
  );
};

// ════════════════════════════════════════════════════════
// 2. AUDIO GUESS GAME
// ════════════════════════════════════════════════════════
const AUDIO_ROUNDS = [
  { description: "🔊 WEEEE-WOOO WEEEE-WOOO! High-pitched, alternating tone.", answer: "Police Siren", options: ["Police Siren", "Ambulance", "Fire Truck", "Car Alarm"] },
  { description: "🔊 VRRRROOOOMMM... deep rumbling, engine revving up and down.", answer: "Car Engine", options: ["Car Engine", "Motorcycle", "Helicopter", "Lawnmower"] },
  { description: "🔊 CHA-CHACK! Quick metallic sliding and clicking sound.", answer: "Gun Reload", options: ["Gun Reload", "Door Lock", "Switchblade", "Lighter"] },
  { description: "🔊 SLAM! Heavy wooden thud followed by slight rattle.", answer: "Door Slam", options: ["Door Slam", "Gunshot", "Thunder", "Car Crash"] },
  { description: "🔊 BEEP... BEEP... BEEP... Steady electronic pulse.", answer: "Heart Monitor", options: ["Heart Monitor", "Alarm Clock", "Microwave", "Metal Detector"] },
  { description: "🔊 SCREEEECH! High-pitched rubber on asphalt, then impact.", answer: "Car Crash", options: ["Car Crash", "Train Brake", "Door Slam", "Thunder"] },
  { description: "🔊 CHOP-CHOP-CHOP-CHOP... rhythmic whirring overhead.", answer: "Helicopter", options: ["Helicopter", "Drone", "Fan", "Car Engine"] },
  { description: "🔊 RING-RING! RING-RING! Classic bell tone, repeated.", answer: "Phone Ring", options: ["Phone Ring", "School Bell", "Alarm", "Doorbell"] },
  { description: "🔊 CRACK! Sharp, sudden explosive pop echoing.", answer: "Gunshot", options: ["Gunshot", "Firework", "Door Slam", "Thunder"] },
  { description: "🔊 Ksshhhh... static crackling, then muffled voice.", answer: "Walkie-Talkie", options: ["Walkie-Talkie", "Radio Static", "Phone Call", "Microphone"] },
];

export const AudioGuessGame = ({ onBack }: { onBack: () => void }) => {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [rounds] = useState(() => [...AUDIO_ROUNDS].sort(() => Math.random() - 0.5).slice(0, 8));

  const handleAnswer = (answer: string) => {
    if (selected) return;
    setSelected(answer);
    const correct = answer === rounds[round].answer;
    if (correct) setScore(s => s + 1);
    setTimeout(() => {
      if (round + 1 >= rounds.length) setGameOver(true);
      else { setRound(r => r + 1); setSelected(null); }
    }, 1200);
  };

  const reset = () => { setRound(0); setScore(0); setSelected(null); setGameOver(false); };

  if (gameOver) return (
    <GameShell onBack={onBack} title="Audio Guess" icon={<Volume2 className="w-5 h-5 text-foreground" />} gradient="from-violet-600 via-purple-500 to-fuchsia-500">
      <div className="text-center space-y-6 py-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
          <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center shadow-2xl ${score >= 5 ? "bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/40" : "bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/40"}`}>
            {score >= 5 ? <CheckCircle className="w-12 h-12 text-foreground" /> : <XCircle className="w-12 h-12 text-foreground" />}
          </div>
        </motion.div>
        <h2 className="text-3xl font-bold">{score}/{rounds.length} Correct!</h2>
        <p className="text-muted-foreground">{score >= 6 ? "Sharp ears! 🎧" : score >= 4 ? "Not bad!" : "Need more practice! 🔊"}</p>
        <Button onClick={reset} className="bg-gradient-to-r from-violet-600 to-purple-600 border-0">Play Again</Button>
      </div>
    </GameShell>
  );

  const q = rounds[round];
  return (
    <GameShell onBack={onBack} title="Audio Guess" icon={<Volume2 className="w-5 h-5 text-foreground" />} gradient="from-violet-600 via-purple-500 to-fuchsia-500"
      badges={<><Badge variant="outline" className="border-violet-500/30">Round {round + 1}/{rounds.length}</Badge><Badge className="bg-violet-900/40 text-violet-300 border-violet-500/30">{score} ✓</Badge></>}>
      <Card3D>
        <Card className="border-violet-500/20 bg-gradient-to-b from-[hsl(220,20%,10%)] to-[hsl(220,20%,6%)]">
          <CardContent className="p-8 space-y-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground font-mono mb-4">LISTEN CAREFULLY...</p>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: [0.9, 1.05, 0.9] }} transition={{ repeat: Infinity, duration: 2 }}
                className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-2xl shadow-violet-500/40 mb-4">
                <Volume2 className="w-10 h-10 text-foreground" />
              </motion.div>
              <div className="bg-black/40 border border-violet-500/30 rounded-xl p-4 max-w-lg mx-auto">
                <p className="text-violet-300 font-mono text-lg">{q.description}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
              {q.options.map(opt => (
                <motion.button key={opt} whileHover={{ scale: selected ? 1 : 1.03 }} whileTap={{ scale: 0.97 }}
                  disabled={!!selected} onClick={() => handleAnswer(opt)}
                  className={`p-4 rounded-xl border-2 text-sm font-bold transition-all ${
                    !selected ? "border-white/[0.08] hover:border-violet-500/40 bg-white/[0.02]" :
                    opt === q.answer ? "border-green-500 bg-green-500/15" :
                    opt === selected ? "border-red-500 bg-red-500/15" :
                    "border-white/[0.04] opacity-40"
                  }`}>
                  {opt}
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>
      </Card3D>
    </GameShell>
  );
};

// ════════════════════════════════════════════════════════
// 3. MYSTERY CLICK BOX
// ════════════════════════════════════════════════════════
export const MysteryBoxGame = ({ onBack }: { onBack: () => void }) => {
  const [revealed, setRevealed] = useState<number | null>(null);
  const [jackpotIdx] = useState(() => Math.floor(Math.random() * 9));
  const [rewards] = useState(() => {
    const r = Array.from({ length: 9 }, () => Math.floor(Math.random() * 30) + 5);
    r[Math.floor(Math.random() * 9)] = 500; // jackpot
    return r;
  });

  const reset = () => { window.location.reload(); }; // Simple reset

  const EMOJIS = ["🎁", "📦", "🎲", "💎", "🃏", "🔮", "🎰", "🏆", "⚡"];

  return (
    <GameShell onBack={onBack} title="Mystery Box" icon={<Box className="w-5 h-5 text-foreground" />} gradient="from-emerald-600 via-green-500 to-teal-500">
      <Card3D>
        <Card className="border-emerald-500/20 bg-gradient-to-b from-[hsl(220,20%,10%)] to-[hsl(220,20%,6%)]">
          <CardContent className="p-8 text-center space-y-6">
            <h3 className="text-2xl font-bold text-emerald-400" style={{ textShadow: "0 0 20px hsl(160 80% 50% / 0.4)" }}>
              🎁 Pick a Box!
            </h3>
            <p className="text-muted-foreground text-sm">Only ONE box has the JACKPOT (500 XP)! Others give small XP.</p>
            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
              {Array.from({ length: 9 }).map((_, i) => {
                const isRevealed = revealed !== null;
                const isSelected = revealed === i;
                const isJackpot = rewards[i] === 500;
                return (
                  <motion.button key={i} whileHover={{ scale: isRevealed ? 1 : 1.1, rotateY: isRevealed ? 0 : 10 }}
                    whileTap={{ scale: 0.9 }} onClick={() => !isRevealed && setRevealed(i)}
                    disabled={isRevealed}
                    className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center text-3xl transition-all relative overflow-hidden ${
                      isRevealed
                        ? isSelected
                          ? isJackpot ? "border-yellow-400 bg-gradient-to-br from-yellow-500/20 to-amber-600/20 shadow-[0_0_30px_hsl(50_90%_55%/0.4)]" : "border-cyan-500 bg-cyan-500/10"
                          : isJackpot ? "border-yellow-400/50 bg-yellow-500/10" : "border-white/[0.05] bg-white/[0.01] opacity-40"
                        : "border-emerald-500/30 bg-gradient-to-br from-emerald-900/20 to-teal-900/20 hover:border-emerald-400/50 hover:shadow-[0_0_20px_hsl(160_70%_50%/0.2)] cursor-pointer"
                    }`}
                    style={{ perspective: "500px" }}>
                    {isRevealed ? (
                      <motion.div initial={{ rotateY: 180, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} className="text-center">
                        <span className="text-2xl">{isJackpot ? "💎" : "📦"}</span>
                        <p className={`text-xs font-bold font-mono mt-1 ${isJackpot ? "text-yellow-400" : "text-muted-foreground"}`}>
                          {rewards[i]} XP
                        </p>
                      </motion.div>
                    ) : (
                      <span className="text-3xl">{EMOJIS[i]}</span>
                    )}
                  </motion.button>
                );
              })}
            </div>
            {revealed !== null && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <p className={`text-xl font-bold ${rewards[revealed] === 500 ? "text-yellow-400" : "text-cyan-400"}`}>
                  {rewards[revealed] === 500 ? "🎉 JACKPOT! 500 XP!" : `You got ${rewards[revealed]} XP`}
                </p>
                <Button onClick={onBack} className="bg-gradient-to-r from-emerald-600 to-teal-600 border-0">Back to Games</Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </Card3D>
    </GameShell>
  );
};

// ════════════════════════════════════════════════════════
// 4. LOCKPICK TIMING CHALLENGE
// ════════════════════════════════════════════════════════
export const LockpickGame = ({ onBack }: { onBack: () => void }) => {
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | null>(null);
  const [position, setPosition] = useState(0);
  const [direction, setDirection] = useState(1);
  const [attempts, setAttempts] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [failed, setFailed] = useState(false);
  const [level, setLevel] = useState(1);
  const animRef = useRef<ReturnType<typeof setInterval>>();
  const startRef = useRef(Date.now());

  const zones: Record<string, { green: [number, number]; speed: number; maxAttempts: number }> = {
    easy: { green: [35, 65], speed: 2, maxAttempts: 5 },
    medium: { green: [40, 58], speed: 3.5, maxAttempts: 3 },
    hard: { green: [44, 54], speed: 5.5, maxAttempts: 2 },
  };

  useEffect(() => {
    if (!difficulty || unlocked || failed) return;
    startRef.current = Date.now();
    animRef.current = setInterval(() => {
      setPosition(p => {
        let next = p + direction * zones[difficulty].speed;
        if (next >= 100 || next <= 0) setDirection(d => -d);
        return Math.max(0, Math.min(100, next));
      });
    }, 16);
    return () => clearInterval(animRef.current);
  }, [difficulty, direction, unlocked, failed]);

  const tryUnlock = () => {
    if (!difficulty) return;
    const zone = zones[difficulty];
    if (position >= zone.green[0] && position <= zone.green[1]) {
      if (level < 3) {
        setLevel(l => l + 1);
        setPosition(0);
      } else {
        setUnlocked(true);
        clearInterval(animRef.current);
      }
    } else {
      setAttempts(a => {
        if (a + 1 >= zone.maxAttempts) {
          setFailed(true);
          clearInterval(animRef.current);
        }
        return a + 1;
      });
    }
  };

  const reset = () => {
    setDifficulty(null); setPosition(0); setDirection(1); setAttempts(0);
    setUnlocked(false); setFailed(false); setLevel(1);
  };

  if (!difficulty) return (
    <GameShell onBack={onBack} title="Lockpick" icon={<Lock className="w-5 h-5 text-foreground" />} gradient="from-yellow-600 via-amber-500 to-orange-500">
      <Card3D>
        <Card className="border-yellow-500/20 bg-gradient-to-b from-[hsl(220,20%,10%)] to-[hsl(220,20%,6%)]">
          <CardContent className="p-8 text-center space-y-6">
            <Lock className="w-16 h-16 mx-auto text-yellow-400" style={{ filter: "drop-shadow(0 0 15px hsl(50 90% 55% / 0.5))" }} />
            <h3 className="text-2xl font-bold text-yellow-400">Choose Difficulty</h3>
            <div className="flex gap-4 justify-center flex-wrap">
              {(["easy", "medium", "hard"] as const).map(d => (
                <Button key={d} onClick={() => setDifficulty(d)}
                  className={`text-lg px-6 py-3 border-0 capitalize ${
                    d === "easy" ? "bg-gradient-to-r from-green-600 to-emerald-600" :
                    d === "medium" ? "bg-gradient-to-r from-yellow-600 to-amber-600" :
                    "bg-gradient-to-r from-red-600 to-rose-600"
                  }`}>
                  {d === "easy" ? "🟢" : d === "medium" ? "🟡" : "🔴"} {d}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </Card3D>
    </GameShell>
  );

  if (unlocked || failed) return (
    <GameShell onBack={onBack} title="Lockpick" icon={<Lock className="w-5 h-5 text-foreground" />} gradient="from-yellow-600 via-amber-500 to-orange-500">
      <div className="text-center space-y-6 py-8">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
          <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center shadow-2xl ${unlocked ? "bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/40" : "bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/40"}`}>
            {unlocked ? <CheckCircle className="w-12 h-12 text-foreground" /> : <XCircle className="w-12 h-12 text-foreground" />}
          </div>
        </motion.div>
        <h2 className="text-3xl font-bold">{unlocked ? "🔓 Unlocked!" : "🔒 Lock Jammed!"}</h2>
        <p className="text-muted-foreground">{unlocked ? `Picked in ${((Date.now() - startRef.current) / 1000).toFixed(1)}s on ${difficulty}!` : "Too many failed attempts!"}</p>
        <div className="flex gap-4 justify-center">
          <Button onClick={reset} className="bg-gradient-to-r from-yellow-600 to-amber-600 border-0">Try Again</Button>
          <Button variant="outline" onClick={onBack}>Back</Button>
        </div>
      </div>
    </GameShell>
  );

  const zone = zones[difficulty];

  return (
    <GameShell onBack={onBack} title="Lockpick" icon={<Lock className="w-5 h-5 text-foreground" />} gradient="from-yellow-600 via-amber-500 to-orange-500"
      badges={<><Badge variant="outline" className="border-yellow-500/30 capitalize">{difficulty}</Badge><Badge className="bg-yellow-900/40 text-yellow-300 border-yellow-500/30">Lock {level}/3</Badge></>}>
      <Card3D>
        <Card className="border-yellow-500/20 bg-gradient-to-b from-[hsl(220,20%,10%)] to-[hsl(220,20%,6%)]">
          <CardContent className="p-8 space-y-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground font-mono mb-2">Hit the <span className="text-green-400">GREEN ZONE</span> to unlock! Attempts: {attempts}/{zone.maxAttempts}</p>
            </div>
            {/* The bar */}
            <div className="relative h-12 rounded-full bg-black/60 border border-yellow-500/20 overflow-hidden max-w-lg mx-auto">
              {/* Green zone */}
              <div className="absolute top-0 bottom-0 bg-green-500/30 border-x border-green-400/50"
                style={{ left: `${zone.green[0]}%`, width: `${zone.green[1] - zone.green[0]}%` }} />
              {/* Pin */}
              <motion.div className="absolute top-0 bottom-0 w-1.5 bg-yellow-400 shadow-[0_0_15px_hsl(50_90%_55%/0.8)]"
                style={{ left: `${position}%` }} />
            </div>
            <div className="text-center">
              <Button onClick={tryUnlock} size="lg"
                className="bg-gradient-to-r from-yellow-600 to-amber-600 border-0 text-xl px-12 shadow-lg shadow-yellow-500/30">
                🔓 UNLOCK
              </Button>
            </div>
          </CardContent>
        </Card>
      </Card3D>
    </GameShell>
  );
};

// ════════════════════════════════════════════════════════
// 5. INTERROGATION MIND GAME
// ════════════════════════════════════════════════════════
const SUSPECTS = [
  { name: "Vinny 'The Snake' Moretti", profile: "Known associate of the Moretti family. Multiple priors.", avatar: "🐍" },
  { name: "Jade Chen", profile: "Club owner. Suspected money laundering front.", avatar: "💎" },
  { name: "Big Tony", profile: "Enforcer. Witness places him at the scene.", avatar: "🥊" },
];

const SUSPECT_RESPONSES: Record<string, Record<string, { text: string; confessionDelta: number }>> = {
  pressure: {
    nervous: { text: "I... I don't know what you're talking about, man! *sweating*", confessionDelta: 15 },
    calm: { text: "You got nothing on me. I want my lawyer.", confessionDelta: -5 },
    angry: { text: "You think you can scare me?! I've been through worse!", confessionDelta: 8 },
  },
  bluff: {
    nervous: { text: "Wait... you have footage? No... that can't be right...", confessionDelta: 20 },
    calm: { text: "Nice try, detective. I know a bluff when I see one.", confessionDelta: -10 },
    angry: { text: "You're lying! ...aren't you?", confessionDelta: 12 },
  },
  evidence: {
    nervous: { text: "Okay, okay! But it wasn't supposed to go down like that!", confessionDelta: 25 },
    calm: { text: "That... that could be anyone. It proves nothing.", confessionDelta: 10 },
    angry: { text: "WHERE DID YOU GET THAT?! *slams table*", confessionDelta: 18 },
  },
  goodcop: {
    nervous: { text: "...you really think you can help me? *tears up*", confessionDelta: 22 },
    calm: { text: "I appreciate the approach, but I'm not stupid.", confessionDelta: 5 },
    angry: { text: "Don't play nice with me... but... maybe we can talk.", confessionDelta: 15 },
  },
};

export const InterrogationGame = ({ onBack }: { onBack: () => void }) => {
  const [confession, setConfession] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [messages, setMessages] = useState<{ from: string; text: string }[]>([]);
  const [suspect] = useState(() => SUSPECTS[Math.floor(Math.random() * SUSPECTS.length)]);
  const [mood, setMood] = useState<"nervous" | "calm" | "angry">("calm");
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!started || gameOver) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(intervalRef.current); setGameOver(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [started, gameOver]);

  const useTactic = (tactic: string) => {
    const responses = SUSPECT_RESPONSES[tactic];
    const response = responses[mood];
    setMessages(prev => [
      ...prev,
      { from: "You", text: tactic === "pressure" ? "🔥 Pressure: 'We know what you did. Talk NOW.'" : tactic === "bluff" ? "🃏 Bluff: 'We have video footage of everything.'" : tactic === "evidence" ? "📋 Evidence: *slides folder across table*" : "☕ Good Cop: 'Help me help you. Cooperate and we can work something out.'" },
      { from: suspect.name, text: response.text },
    ]);
    setConfession(prev => {
      const next = Math.min(100, Math.max(0, prev + response.confessionDelta));
      if (next >= 100) { setGameOver(true); clearInterval(intervalRef.current); }
      return next;
    });
    // Mood shifts randomly
    const moods: ("nervous" | "calm" | "angry")[] = ["nervous", "calm", "angry"];
    setMood(moods[Math.floor(Math.random() * moods.length)]);
  };

  if (!started) return (
    <GameShell onBack={onBack} title="Interrogation" icon={<Eye className="w-5 h-5 text-foreground" />} gradient="from-slate-600 via-gray-500 to-zinc-600">
      <Card3D>
        <Card className="border-slate-500/20 bg-gradient-to-b from-[hsl(220,20%,10%)] to-[hsl(220,20%,6%)]">
          <CardContent className="p-8 text-center space-y-6">
            <div className="text-6xl">{suspect.avatar}</div>
            <h3 className="text-2xl font-bold">Interrogate: {suspect.name}</h3>
            <p className="text-muted-foreground text-sm">{suspect.profile}</p>
            <p className="text-sm text-cyan-400/80 font-mono">Get the confession meter to 100% before time runs out!</p>
            <Button onClick={() => setStarted(true)} className="bg-gradient-to-r from-slate-600 to-gray-600 border-0 text-lg px-8">
              🕵️ Begin Interrogation
            </Button>
          </CardContent>
        </Card>
      </Card3D>
    </GameShell>
  );

  return (
    <GameShell onBack={onBack} title="Interrogation" icon={<Eye className="w-5 h-5 text-foreground" />} gradient="from-slate-600 via-gray-500 to-zinc-600"
      timer={<TimerBadge seconds={timeLeft} danger={30} />}>
      <div className="grid md:grid-cols-[1fr_300px] gap-4">
        <Card className="border-slate-500/20 bg-gradient-to-b from-[hsl(220,20%,10%)] to-[hsl(220,20%,6%)]">
          <CardContent className="p-4 space-y-4">
            {/* Chat log */}
            <div className="h-64 overflow-y-auto space-y-2 p-2">
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  className={`p-2 rounded-lg text-sm ${msg.from === "You" ? "bg-cyan-500/10 border border-cyan-500/20 ml-8" : "bg-white/[0.03] border border-white/[0.05] mr-8"}`}>
                  <span className="font-bold text-xs text-muted-foreground">{msg.from}:</span>
                  <p className="mt-1">{msg.text}</p>
                </motion.div>
              ))}
            </div>
            {/* Tactics */}
            {!gameOver && (
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => useTactic("pressure")} variant="outline" className="border-red-500/30 hover:bg-red-500/10">🔥 Pressure</Button>
                <Button onClick={() => useTactic("bluff")} variant="outline" className="border-purple-500/30 hover:bg-purple-500/10">🃏 Bluff</Button>
                <Button onClick={() => useTactic("evidence")} variant="outline" className="border-blue-500/30 hover:bg-blue-500/10">📋 Evidence</Button>
                <Button onClick={() => useTactic("goodcop")} variant="outline" className="border-green-500/30 hover:bg-green-500/10">☕ Good Cop</Button>
              </div>
            )}
            {gameOver && (
              <div className="text-center space-y-3">
                <h3 className={`text-xl font-bold ${confession >= 100 ? "text-green-400" : "text-red-400"}`}>
                  {confession >= 100 ? "🎉 CONFESSION OBTAINED!" : "⏰ Time's up — suspect walks free."}
                </h3>
                <Button onClick={onBack} className="bg-gradient-to-r from-slate-600 to-gray-600 border-0">Back to Games</Button>
              </div>
            )}
          </CardContent>
        </Card>
        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="border-slate-500/20 bg-gradient-to-b from-[hsl(220,20%,10%)] to-[hsl(220,20%,6%)]">
            <CardContent className="p-4 space-y-3">
              <div className="text-center">
                <span className="text-4xl">{suspect.avatar}</span>
                <p className="text-sm font-bold mt-2">{suspect.name}</p>
                <Badge className={`mt-1 ${mood === "nervous" ? "bg-yellow-900/40 text-yellow-300" : mood === "angry" ? "bg-red-900/40 text-red-300" : "bg-blue-900/40 text-blue-300"}`}>
                  {mood === "nervous" ? "😰 Nervous" : mood === "angry" ? "😡 Angry" : "😐 Calm"}
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-muted-foreground">Confession</span>
                  <span className={confession >= 100 ? "text-green-400" : "text-cyan-400"}>{confession}%</span>
                </div>
                <div className="h-3 bg-black/40 rounded-full overflow-hidden border border-slate-500/20">
                  <motion.div className="h-full rounded-full" animate={{ width: `${confession}%` }}
                    style={{ background: confession >= 80 ? "linear-gradient(90deg, hsl(140 70% 50%), hsl(160 70% 40%))" : "linear-gradient(90deg, hsl(200 70% 50%), hsl(220 70% 40%))" }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </GameShell>
  );
};

// ════════════════════════════════════════════════════════
// 6. STREET RACING PREDICTION
// ════════════════════════════════════════════════════════
export const StreetRacingGame = ({ onBack }: { onBack: () => void }) => {
  const [bet, setBet] = useState<"A" | "B" | null>(null);
  const [racing, setRacing] = useState(false);
  const [posA, setPosA] = useState(0);
  const [posB, setPosB] = useState(0);
  const [winner, setWinner] = useState<"A" | "B" | null>(null);
  const animRef = useRef<ReturnType<typeof setInterval>>();

  const startRace = (choice: "A" | "B") => {
    setBet(choice); setRacing(true); setPosA(0); setPosB(0); setWinner(null);
    animRef.current = setInterval(() => {
      setPosA(prev => {
        const next = prev + Math.random() * 4 + 1;
        if (next >= 100) { clearInterval(animRef.current); setWinner("A"); setRacing(false); }
        return Math.min(100, next);
      });
      setPosB(prev => {
        const next = prev + Math.random() * 4 + 1;
        if (next >= 100) { clearInterval(animRef.current); setWinner("B"); setRacing(false); }
        return Math.min(100, next);
      });
    }, 80);
  };

  const reset = () => { setBet(null); setRacing(false); setPosA(0); setPosB(0); setWinner(null); };

  return (
    <GameShell onBack={onBack} title="Street Racing" icon={<Car className="w-5 h-5 text-foreground" />} gradient="from-red-600 via-orange-500 to-yellow-500">
      <Card3D>
        <Card className="border-red-500/20 bg-gradient-to-b from-[hsl(220,20%,10%)] to-[hsl(220,20%,6%)]">
          <CardContent className="p-6 space-y-6">
            <h3 className="text-2xl font-bold text-center text-red-400" style={{ textShadow: "0 0 20px hsl(0 80% 55% / 0.4)" }}>🏁 Street Race</h3>
            {/* Track A */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-red-400 w-14">Car A</span>
                <div className="flex-1 h-10 bg-black/40 rounded-full border border-red-500/20 relative overflow-hidden">
                  <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-red-600/30 to-red-500/10 rounded-full" style={{ width: `${posA}%` }} />
                  <motion.div className="absolute top-1 text-2xl" animate={{ left: `${Math.min(posA, 92)}%` }} transition={{ type: "tween" }}>🏎️</motion.div>
                </div>
              </div>
              {/* Track B */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-blue-400 w-14">Car B</span>
                <div className="flex-1 h-10 bg-black/40 rounded-full border border-blue-500/20 relative overflow-hidden">
                  <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-blue-600/30 to-blue-500/10 rounded-full" style={{ width: `${posB}%` }} />
                  <motion.div className="absolute top-1 text-2xl" animate={{ left: `${Math.min(posB, 92)}%` }} transition={{ type: "tween" }}>🚗</motion.div>
                </div>
              </div>
            </div>
            {/* Betting / Result */}
            {!bet && !winner && (
              <div className="text-center space-y-3">
                <p className="text-muted-foreground text-sm font-mono">Place your bet!</p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={() => startRace("A")} className="bg-gradient-to-r from-red-600 to-orange-600 border-0 text-lg px-8">🏎️ Bet Car A</Button>
                  <Button onClick={() => startRace("B")} className="bg-gradient-to-r from-blue-600 to-cyan-600 border-0 text-lg px-8">🚗 Bet Car B</Button>
                </div>
              </div>
            )}
            {racing && <p className="text-center text-yellow-400 font-mono animate-pulse text-lg">🏁 Racing...</p>}
            {winner && (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-3">
                <h3 className={`text-2xl font-bold ${bet === winner ? "text-green-400" : "text-red-400"}`}>
                  {bet === winner ? "🎉 You Won!" : "😞 You Lost!"}
                </h3>
                <p className="text-muted-foreground">Car {winner} wins! {bet === winner ? "+200 XP" : "Better luck next time!"}</p>
                <Button onClick={reset} className="bg-gradient-to-r from-red-600 to-orange-600 border-0">Race Again</Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </Card3D>
    </GameShell>
  );
};

// ════════════════════════════════════════════════════════
// 7. MONEY LAUNDERING STRATEGY
// ════════════════════════════════════════════════════════
export const MoneyLaunderingGame = ({ onBack }: { onBack: () => void }) => {
  const [allocations, setAllocations] = useState({ casino: 25, realEstate: 25, fakeInvoices: 25, offshore: 25 });
  const [result, setResult] = useState<"success" | "caught" | null>(null);
  const total = Object.values(allocations).reduce((a, b) => a + b, 0);

  const adjust = (key: keyof typeof allocations, delta: number) => {
    setAllocations(prev => {
      const next = { ...prev };
      next[key] = Math.max(0, Math.min(100, next[key] + delta));
      return next;
    });
  };

  const execute = () => {
    const max = Math.max(...Object.values(allocations));
    const min = Math.min(...Object.values(allocations));
    const spread = max - min;
    // Risk: higher concentration = more risky. Best is balanced.
    const riskScore = spread / 100;
    const caught = Math.random() < riskScore * 0.8 + 0.1;
    setResult(caught ? "caught" : "success");
  };

  const channels = [
    { key: "casino" as const, label: "🎰 Casino", color: "text-yellow-400" },
    { key: "realEstate" as const, label: "🏠 Real Estate", color: "text-blue-400" },
    { key: "fakeInvoices" as const, label: "📄 Fake Invoices", color: "text-green-400" },
    { key: "offshore" as const, label: "🏝️ Offshore", color: "text-purple-400" },
  ];

  return (
    <GameShell onBack={onBack} title="Money Laundering" icon={<DollarSign className="w-5 h-5 text-foreground" />} gradient="from-green-600 via-emerald-500 to-teal-500">
      <Card3D>
        <Card className="border-green-500/20 bg-gradient-to-b from-[hsl(220,20%,10%)] to-[hsl(220,20%,6%)]">
          <CardContent className="p-6 space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-green-400">💰 Launder $1,000,000</h3>
              <p className="text-muted-foreground text-sm mt-1">Split the money wisely. Too much in one channel = CAUGHT!</p>
            </div>
            {!result ? (
              <>
                <div className="space-y-4 max-w-md mx-auto">
                  {channels.map(ch => (
                    <div key={ch.key} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className={`text-sm font-mono ${ch.color}`}>{ch.label}</span>
                        <span className="text-sm font-mono font-bold">{allocations[ch.key]}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => adjust(ch.key, -5)}>-</Button>
                        <div className="flex-1 h-3 bg-black/40 rounded-full overflow-hidden border border-white/[0.05]">
                          <div className="h-full rounded-full transition-all" style={{ width: `${allocations[ch.key]}%`, background: `linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))` }} />
                        </div>
                        <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => adjust(ch.key, 5)}>+</Button>
                      </div>
                    </div>
                  ))}
                </div>
                <p className={`text-center font-mono text-sm ${total !== 100 ? "text-red-400" : "text-green-400"}`}>
                  Total: {total}% {total !== 100 && "(must equal 100%)"}
                </p>
                <div className="text-center">
                  <Button onClick={execute} disabled={total !== 100} className="bg-gradient-to-r from-green-600 to-emerald-600 border-0 text-lg px-8">
                    💵 Execute Laundering
                  </Button>
                </div>
              </>
            ) : (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-4 py-4">
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center shadow-2xl ${result === "success" ? "bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/40" : "bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/40"}`}>
                  {result === "success" ? <CheckCircle className="w-10 h-10 text-foreground" /> : <Skull className="w-10 h-10 text-foreground" />}
                </div>
                <h3 className={`text-2xl font-bold ${result === "success" ? "text-green-400" : "text-red-400"}`}>
                  {result === "success" ? "💰 Clean Money!" : "🚔 BUSTED!"}
                </h3>
                <p className="text-muted-foreground">{result === "success" ? "Successfully laundered! +300 XP" : "The feds tracked your money trail!"}</p>
                <Button onClick={() => setResult(null)} className="bg-gradient-to-r from-green-600 to-emerald-600 border-0">Try Again</Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </Card3D>
    </GameShell>
  );
};

// ════════════════════════════════════════════════════════
// 8. SMUGGLER ROUTE PLANNER
// ════════════════════════════════════════════════════════
const ROUTES = [
  { name: "🛣️ Highway", risk: 30, time: 20, reward: 60, desc: "Fast but heavy police patrol" },
  { name: "🌲 Forest", risk: 50, time: 60, reward: 80, desc: "Slow & dangerous but high reward" },
  { name: "🏙️ City Center", risk: 70, time: 40, reward: 100, desc: "Most reward but highest risk" },
];

export const SmugglerRouteGame = ({ onBack }: { onBack: () => void }) => {
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null);
  const [result, setResult] = useState<"success" | "fail" | null>(null);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const startRun = (idx: number) => {
    setSelectedRoute(idx); setProgress(0); setResult(null);
    let p = 0;
    intervalRef.current = setInterval(() => {
      p += 3;
      setProgress(p);
      if (p >= 100) {
        clearInterval(intervalRef.current);
        const success = Math.random() * 100 > ROUTES[idx].risk;
        setResult(success ? "success" : "fail");
      }
    }, 50);
  };

  const reset = () => { setSelectedRoute(null); setResult(null); setProgress(0); };

  return (
    <GameShell onBack={onBack} title="Smuggler Route" icon={<Map className="w-5 h-5 text-foreground" />} gradient="from-amber-700 via-yellow-600 to-orange-600">
      <Card3D>
        <Card className="border-amber-500/20 bg-gradient-to-b from-[hsl(220,20%,10%)] to-[hsl(220,20%,6%)]">
          <CardContent className="p-6 space-y-6">
            <h3 className="text-2xl font-bold text-center text-amber-400">📦 Choose Your Route</h3>
            {selectedRoute === null ? (
              <div className="grid md:grid-cols-3 gap-4">
                {ROUTES.map((route, i) => (
                  <motion.button key={i} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => startRun(i)}
                    className="p-4 rounded-xl border-2 border-white/[0.08] hover:border-amber-500/40 bg-white/[0.02] text-left space-y-3">
                    <h4 className="text-lg font-bold">{route.name}</h4>
                    <p className="text-xs text-muted-foreground">{route.desc}</p>
                    <div className="space-y-1 text-xs font-mono">
                      <div className="flex justify-between"><span className="text-red-400">Risk:</span><span>{route.risk}%</span></div>
                      <div className="flex justify-between"><span className="text-blue-400">Time:</span><span>{route.time}min</span></div>
                      <div className="flex justify-between"><span className="text-green-400">Reward:</span><span>{route.reward} XP</span></div>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : result === null ? (
              <div className="text-center space-y-4 py-6">
                <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 0.5 }}>
                  <span className="text-5xl">🚐</span>
                </motion.div>
                <h4 className="text-xl font-bold text-amber-400">Smuggling via {ROUTES[selectedRoute].name}...</h4>
                <Progress value={progress} className="max-w-sm mx-auto h-3" />
                <p className="text-sm text-muted-foreground font-mono">{progress}%</p>
              </div>
            ) : (
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center space-y-4 py-4">
                <span className="text-5xl">{result === "success" ? "✅" : "🚨"}</span>
                <h3 className={`text-2xl font-bold ${result === "success" ? "text-green-400" : "text-red-400"}`}>
                  {result === "success" ? `Delivered! +${ROUTES[selectedRoute].reward} XP` : "Intercepted by police! 🚔"}
                </h3>
                <Button onClick={reset} className="bg-gradient-to-r from-amber-600 to-orange-600 border-0">Try Again</Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </Card3D>
    </GameShell>
  );
};

// ════════════════════════════════════════════════════════
// 9. RP CLIP GUESS OUTCOME
// ════════════════════════════════════════════════════════
const CLIP_SCENARIOS = [
  { scenario: "🎬 A suspect runs from police during a traffic stop. Cop draws taser. Suspect turns corner into alley...", answer: "Arrest", options: ["Arrest", "Escape", "Betrayal", "Deal"] },
  { scenario: "🎬 Two gang leaders meet at an abandoned warehouse. Bodyguards stay outside. Handshake offered...", answer: "Deal", options: ["Arrest", "Escape", "Betrayal", "Deal"] },
  { scenario: "🎬 Informant is wired. Meeting with the boss. Boss pulls out a phone scanner...", answer: "Betrayal", options: ["Arrest", "Escape", "Betrayal", "Deal"] },
  { scenario: "🎬 Driver speeds through checkpoint. Spike strips ahead. Driver swerves into a field...", answer: "Escape", options: ["Arrest", "Escape", "Betrayal", "Deal"] },
  { scenario: "🎬 Undercover cop in a drug deal. Seller gets suspicious, reaches under table...", answer: "Arrest", options: ["Arrest", "Escape", "Betrayal", "Deal"] },
  { scenario: "🎬 Bank robber holds hostages. Negotiator on phone. Robber starts releasing hostages one by one...", answer: "Deal", options: ["Arrest", "Escape", "Betrayal", "Deal"] },
];

export const ClipGuessGame = ({ onBack }: { onBack: () => void }) => {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [scenarios] = useState(() => [...CLIP_SCENARIOS].sort(() => Math.random() - 0.5));

  const handleAnswer = (ans: string) => {
    if (selected) return;
    setSelected(ans);
    if (ans === scenarios[round].answer) setScore(s => s + 1);
    setTimeout(() => {
      if (round + 1 >= scenarios.length) setGameOver(true);
      else { setRound(r => r + 1); setSelected(null); }
    }, 1500);
  };

  if (gameOver) return (
    <GameShell onBack={onBack} title="Clip Guess" icon={<Eye className="w-5 h-5 text-foreground" />} gradient="from-indigo-600 via-blue-500 to-cyan-500">
      <div className="text-center space-y-6 py-8">
        <h2 className="text-3xl font-bold">{score}/{scenarios.length} Correct!</h2>
        <p className="text-muted-foreground">{score >= 4 ? "You read situations like a pro! 🕵️" : "Keep practicing your RP instincts!"}</p>
        <Button onClick={onBack} className="bg-gradient-to-r from-indigo-600 to-blue-600 border-0">Back to Games</Button>
      </div>
    </GameShell>
  );

  const sc = scenarios[round];
  return (
    <GameShell onBack={onBack} title="Clip Guess" icon={<Eye className="w-5 h-5 text-foreground" />} gradient="from-indigo-600 via-blue-500 to-cyan-500"
      badges={<Badge className="bg-indigo-900/40 text-indigo-300 border-indigo-500/30">{score} correct</Badge>}>
      <Card3D>
        <Card className="border-indigo-500/20 bg-gradient-to-b from-[hsl(220,20%,10%)] to-[hsl(220,20%,6%)]">
          <CardContent className="p-6 space-y-6">
            <p className="text-xs text-muted-foreground text-center font-mono">SCENARIO {round + 1}/{scenarios.length}</p>
            <div className="bg-black/40 border border-indigo-500/20 rounded-xl p-4">
              <p className="text-indigo-300 leading-relaxed">{sc.scenario}</p>
            </div>
            <p className="text-center text-sm text-muted-foreground font-mono">What happens next?</p>
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
              {sc.options.map(opt => (
                <motion.button key={opt} whileHover={{ scale: selected ? 1 : 1.03 }} whileTap={{ scale: 0.97 }}
                  disabled={!!selected} onClick={() => handleAnswer(opt)}
                  className={`p-3 rounded-xl border-2 font-bold text-sm transition-all ${
                    !selected ? "border-white/[0.08] hover:border-indigo-500/40 bg-white/[0.02]" :
                    opt === sc.answer ? "border-green-500 bg-green-500/15" :
                    opt === selected ? "border-red-500 bg-red-500/15" : "border-white/[0.04] opacity-40"
                  }`}>
                  {opt === "Arrest" ? "🚔" : opt === "Escape" ? "🏃" : opt === "Betrayal" ? "🗡️" : "🤝"} {opt}
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>
      </Card3D>
    </GameShell>
  );
};

// ════════════════════════════════════════════════════════
// 10. RADIO TRANSMISSION DECODE
// ════════════════════════════════════════════════════════
const RADIO_MESSAGES = [
  { encoded: "VXVSHFW DW GRFNV", decoded: "SUSPECT AT DOCKS", shift: 3, hint: "Caesar cipher, shift 3" },
  { encoded: "EDFNXS UHTXHVWHG", decoded: "BACKUP REQUESTED", shift: 3, hint: "Caesar cipher, shift 3" },
  { encoded: "GURS QEBC VF NG ZVQAVTUG", decoded: "THE DROP IS AT MIDNIGHT", shift: 13, hint: "ROT13 cipher" },
  { encoded: "XOFH JXDUGY", decoded: "CODE PURPLE", shift: 19, hint: "Caesar cipher, shift 19" },
  { encoded: "WKLV LV D GUDJ", decoded: "THIS IS A DRAG", shift: 3, hint: "Caesar cipher, shift 3" },
];

export const RadioDecodeGame = ({ onBack }: { onBack: () => void }) => {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [input, setInput] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [messages] = useState(() => [...RADIO_MESSAGES].sort(() => Math.random() - 0.5).slice(0, 4));

  const checkAnswer = () => {
    if (input.toUpperCase().trim() === messages[round].decoded) {
      setFeedback("correct"); setScore(s => s + 1);
      setTimeout(() => {
        if (round + 1 >= messages.length) setGameOver(true);
        else { setRound(r => r + 1); setInput(""); setFeedback(null); setShowHint(false); }
      }, 1000);
    } else { setFeedback("wrong"); setTimeout(() => setFeedback(null), 800); }
  };

  if (gameOver) return (
    <GameShell onBack={onBack} title="Radio Decode" icon={<Radio className="w-5 h-5 text-foreground" />} gradient="from-cyan-600 via-teal-500 to-green-500">
      <div className="text-center space-y-6 py-8">
        <h2 className="text-3xl font-bold">{score}/{messages.length} Decoded!</h2>
        <Button onClick={onBack} className="bg-gradient-to-r from-cyan-600 to-teal-600 border-0">Back to Games</Button>
      </div>
    </GameShell>
  );

  const msg = messages[round];
  return (
    <GameShell onBack={onBack} title="Radio Decode" icon={<Radio className="w-5 h-5 text-foreground" />} gradient="from-cyan-600 via-teal-500 to-green-500"
      badges={<Badge className="bg-cyan-900/40 text-cyan-300 border-cyan-500/30">{score} decoded</Badge>}>
      <Card3D>
        <Card className={`border-2 transition-colors ${feedback === "correct" ? "border-green-500" : feedback === "wrong" ? "border-red-500" : "border-cyan-500/20"} bg-gradient-to-b from-[hsl(220,20%,10%)] to-[hsl(220,20%,6%)]`}>
          <CardContent className="p-8 text-center space-y-6">
            <p className="text-xs text-muted-foreground font-mono">📻 INCOMING TRANSMISSION...</p>
            <div className="bg-black/60 border border-cyan-500/30 rounded-xl p-4">
              <p className="text-cyan-300 font-mono text-xl tracking-widest">{msg.encoded}</p>
            </div>
            {showHint && <p className="text-yellow-400/80 text-sm font-mono">💡 Hint: {msg.hint}</p>}
            <div className="flex gap-2 max-w-md mx-auto">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && checkAnswer()}
                placeholder="Decoded message..." className="flex-1 bg-black/40 border border-cyan-500/30 rounded-xl px-4 py-2.5 text-center font-mono uppercase tracking-widest text-cyan-300 focus:border-cyan-400 outline-none" />
              <Button onClick={checkAnswer} className="bg-cyan-600 hover:bg-cyan-500 border-0">Decode</Button>
            </div>
            {!showHint && <Button variant="ghost" size="sm" onClick={() => setShowHint(true)} className="text-muted-foreground">💡 Need a hint?</Button>}
          </CardContent>
        </Card>
      </Card3D>
    </GameShell>
  );
};

// ════════════════════════════════════════════════════════
// 11. 24-HOUR SURVIVAL SIMULATOR
// ════════════════════════════════════════════════════════
const SURVIVAL_EVENTS = [
  { text: "🚔 Police checkpoint ahead.", options: [{ label: "Comply", money: 0, heat: -10, trust: 5, survival: 5 }, { label: "Run", money: 0, heat: 20, trust: -5, survival: -15 }, { label: "Bribe", money: -200, heat: -5, trust: -10, survival: 0 }] },
  { text: "💼 Business opportunity: invest $500 for potential return.", options: [{ label: "Invest", money: -500, heat: 0, trust: 10, survival: 0 }, { label: "Decline", money: 0, heat: 0, trust: 0, survival: 0 }, { label: "Scam them", money: 300, heat: 15, trust: -20, survival: -5 }] },
  { text: "🗡️ Someone offers to betray your rival for info.", options: [{ label: "Accept", money: -100, heat: 10, trust: -15, survival: 5 }, { label: "Refuse", money: 0, heat: 0, trust: 10, survival: 0 }, { label: "Report them", money: 0, heat: -5, trust: 15, survival: 5 }] },
  { text: "💰 Robbery attempt on your stash.", options: [{ label: "Fight back", money: 0, heat: 15, trust: 5, survival: -10 }, { label: "Give in", money: -400, heat: -5, trust: -10, survival: 5 }, { label: "Negotiate", money: -200, heat: 0, trust: 5, survival: 0 }] },
  { text: "💵 Bribe request from corrupt official.", options: [{ label: "Pay", money: -300, heat: -15, trust: 0, survival: 10 }, { label: "Refuse", money: 0, heat: 10, trust: 5, survival: -5 }, { label: "Blackmail back", money: 200, heat: 20, trust: -10, survival: -10 }] },
  { text: "🏥 You're injured. Hospital or black market doctor?", options: [{ label: "Hospital", money: -500, heat: 5, trust: 5, survival: 20 }, { label: "Street doc", money: -200, heat: 0, trust: -5, survival: 10 }, { label: "Tough it out", money: 0, heat: 0, trust: 0, survival: -15 }] },
  { text: "📞 Anonymous tip about a warehouse full of goods.", options: [{ label: "Investigate", money: 400, heat: 15, trust: 0, survival: -5 }, { label: "Ignore", money: 0, heat: 0, trust: 5, survival: 5 }, { label: "Sell the tip", money: 200, heat: 5, trust: -10, survival: 0 }] },
  { text: "🤝 Alliance offer from a rival gang.", options: [{ label: "Accept", money: 300, heat: 10, trust: -15, survival: 5 }, { label: "Decline", money: 0, heat: 5, trust: 10, survival: 0 }, { label: "Double cross", money: 500, heat: 25, trust: -25, survival: -15 }] },
];

export const Survival24hGame = ({ onBack }: { onBack: () => void }) => {
  const [hour, setHour] = useState(0);
  const [money, setMoney] = useState(1000);
  const [heat, setHeat] = useState(20);
  const [trust, setTrust] = useState(50);
  const [survival, setSurvival] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [events] = useState(() => [...SURVIVAL_EVENTS, ...SURVIVAL_EVENTS, ...SURVIVAL_EVENTS].sort(() => Math.random() - 0.5).slice(0, 24));

  const makeChoice = (option: { money: number; heat: number; trust: number; survival: number }) => {
    const newMoney = money + option.money;
    const newHeat = Math.max(0, Math.min(100, heat + option.heat));
    const newTrust = Math.max(0, Math.min(100, trust + option.trust));
    const newSurvival = Math.max(0, Math.min(100, survival + option.survival));
    setMoney(newMoney); setHeat(newHeat); setTrust(newTrust); setSurvival(newSurvival);
    if (newSurvival <= 0 || newHeat >= 100) { setGameOver(true); return; }
    if (hour + 1 >= 24) { setGameOver(true); return; }
    setHour(h => h + 1);
  };

  const survived = survival > 0 && heat < 100 && hour >= 23;

  if (gameOver) return (
    <GameShell onBack={onBack} title="24h Survival" icon={<Heart className="w-5 h-5 text-foreground" />} gradient="from-rose-600 via-red-500 to-orange-500">
      <div className="text-center space-y-6 py-8">
        <span className="text-5xl">{survived ? "🎉" : "💀"}</span>
        <h2 className="text-3xl font-bold">{survived ? "YOU SURVIVED!" : survival <= 0 ? "You didn't make it..." : "Heat reached 100% — BUSTED!"}</h2>
        <div className="flex gap-4 justify-center text-sm font-mono">
          <span>💰 ${money}</span><span>🔥 {heat}%</span><span>🤝 {trust}%</span><span>❤️ {survival}%</span>
        </div>
        <p className="text-muted-foreground">Score: {Math.max(0, money + trust * 10 + survival * 5 - heat * 5)}</p>
        <Button onClick={onBack} className="bg-gradient-to-r from-rose-600 to-red-600 border-0">Back to Games</Button>
      </div>
    </GameShell>
  );

  const ev = events[hour];
  return (
    <GameShell onBack={onBack} title="24h Survival" icon={<Heart className="w-5 h-5 text-foreground" />} gradient="from-rose-600 via-red-500 to-orange-500"
      badges={<Badge className="bg-rose-900/40 text-rose-300 border-rose-500/30 font-mono">Hour {hour + 1}/24</Badge>}>
      <div className="grid md:grid-cols-[1fr_200px] gap-4">
        <Card3D>
          <Card className="border-rose-500/20 bg-gradient-to-b from-[hsl(220,20%,10%)] to-[hsl(220,20%,6%)]">
            <CardContent className="p-6 space-y-6">
              <div className="bg-black/40 border border-rose-500/20 rounded-xl p-4">
                <p className="text-rose-300 text-lg">{ev.text}</p>
              </div>
              <div className="space-y-2">
                {ev.options.map((opt, i) => (
                  <motion.button key={i} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => makeChoice(opt)}
                    className="w-full p-3 rounded-xl border border-white/[0.08] hover:border-rose-500/30 bg-white/[0.02] text-left flex justify-between items-center">
                    <span className="font-medium">{opt.label}</span>
                    <div className="flex gap-2 text-xs font-mono">
                      {opt.money !== 0 && <span className={opt.money > 0 ? "text-green-400" : "text-red-400"}>${opt.money}</span>}
                      {opt.heat !== 0 && <span className={opt.heat > 0 ? "text-red-400" : "text-blue-400"}>🔥{opt.heat > 0 ? "+" : ""}{opt.heat}</span>}
                    </div>
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>
        </Card3D>
        {/* Stats sidebar */}
        <Card className="border-rose-500/20 bg-gradient-to-b from-[hsl(220,20%,10%)] to-[hsl(220,20%,6%)]">
          <CardContent className="p-4 space-y-3">
            {[
              { label: "💰 Money", value: `$${money}`, pct: Math.min(100, money / 20), color: "bg-green-500" },
              { label: "🔥 Heat", value: `${heat}%`, pct: heat, color: "bg-red-500" },
              { label: "🤝 Trust", value: `${trust}%`, pct: trust, color: "bg-blue-500" },
              { label: "❤️ Survival", value: `${survival}%`, pct: survival, color: "bg-pink-500" },
            ].map(stat => (
              <div key={stat.label} className="space-y-1">
                <div className="flex justify-between text-xs font-mono"><span>{stat.label}</span><span>{stat.value}</span></div>
                <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${stat.color} transition-all`} style={{ width: `${stat.pct}%` }} />
                </div>
              </div>
            ))}
            <Progress value={(hour / 24) * 100} className="h-1.5 mt-4" />
            <p className="text-[10px] text-center text-muted-foreground font-mono">{hour}/24 hours survived</p>
          </CardContent>
        </Card>
      </div>
    </GameShell>
  );
};

// ════════════════════════════════════════════════════════
// 12. DOUBLE AGENT DETECTION
// ════════════════════════════════════════════════════════
const AGENT_POOL = [
  { name: "Marcus Cole", role: "Arms Dealer", logs: ["Seen near police HQ 3 times", "Large deposits from unknown source", "Changed phone number twice this week"], suspicious: true },
  { name: "Elena Vasquez", role: "Club Manager", logs: ["Regular schedule", "Known friends in gang", "Clean financial records"], suspicious: false },
  { name: "Dmitri Volkov", role: "Mechanic", logs: ["Works 9-5", "No suspicious contacts", "Family man, 2 kids"], suspicious: false },
  { name: "Sarah Kim", role: "Informant", logs: ["Frequently changes locations", "Encrypted messages to unknown", "Asking about shipment schedules"], suspicious: true },
  { name: "Tony Rizzo", role: "Driver", logs: ["Loyal for 5 years", "Never late on deliveries", "Close with the boss"], suspicious: false },
  { name: "Yuki Tanaka", role: "Accountant", logs: ["Missing $50k in books", "New luxury car", "Whispers on phone at work"], suspicious: true },
  { name: "Carlos Mendez", role: "Bouncer", logs: ["Reliable worker", "Ex-military background", "Keeps to himself"], suspicious: false },
  { name: "Nadia Petrov", role: "Courier", logs: ["Takes unusual routes", "Met with unknown men in suits", "Arrived late three times"], suspicious: true },
];

export const DoubleAgentGame = ({ onBack }: { onBack: () => void }) => {
  const [profiles, setProfiles] = useState<typeof AGENT_POOL>([]);
  const [agentIdx, setAgentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const maxRounds = 3;

  const generateRound = useCallback(() => {
    const suspicious = AGENT_POOL.filter(p => p.suspicious).sort(() => Math.random() - 0.5);
    const clean = AGENT_POOL.filter(p => !p.suspicious).sort(() => Math.random() - 0.5);
    const agent = suspicious[0];
    const others = clean.slice(0, 4);
    const all = [...others, agent].sort(() => Math.random() - 0.5);
    setProfiles(all);
    setAgentIdx(all.indexOf(agent));
    setSelected(null);
  }, []);

  useEffect(() => { generateRound(); }, [generateRound]);

  const makeGuess = (idx: number) => {
    setSelected(idx);
    if (idx === agentIdx) setScore(s => s + 1);
    setTimeout(() => {
      if (round + 1 >= maxRounds) { setRound(r => r + 1); }
      else { setRound(r => r + 1); generateRound(); }
    }, 2000);
  };

  if (round >= maxRounds) return (
    <GameShell onBack={onBack} title="Double Agent" icon={<Crosshair className="w-5 h-5 text-foreground" />} gradient="from-slate-700 via-gray-600 to-zinc-600">
      <div className="text-center space-y-6 py-8">
        <h2 className="text-3xl font-bold">{score}/{maxRounds} Agents Found!</h2>
        <p className="text-muted-foreground">{score === maxRounds ? "Master detective! 🕵️" : "Some slipped through..."}</p>
        <Button onClick={onBack} className="bg-gradient-to-r from-slate-600 to-gray-600 border-0">Back to Games</Button>
      </div>
    </GameShell>
  );

  return (
    <GameShell onBack={onBack} title="Double Agent" icon={<Crosshair className="w-5 h-5 text-foreground" />} gradient="from-slate-700 via-gray-600 to-zinc-600"
      badges={<Badge className="bg-slate-900/60 text-slate-300 border-slate-500/30">Round {round + 1}/{maxRounds}</Badge>}>
      <Card className="border-slate-500/20 bg-gradient-to-b from-[hsl(220,20%,10%)] to-[hsl(220,20%,6%)]">
        <CardContent className="p-6 space-y-4">
          <p className="text-center text-sm text-muted-foreground font-mono">🕵️ Identify the undercover agent from these profiles</p>
          <div className="grid md:grid-cols-5 gap-3">
            {profiles.map((p, i) => (
              <motion.button key={i} whileHover={{ scale: selected !== null ? 1 : 1.03 }} whileTap={{ scale: 0.97 }}
                disabled={selected !== null} onClick={() => makeGuess(i)}
                className={`p-3 rounded-xl border-2 text-left space-y-2 transition-all ${
                  selected === null ? "border-white/[0.08] hover:border-cyan-500/30 bg-white/[0.02]" :
                  i === agentIdx ? "border-red-500 bg-red-500/10" :
                  i === selected ? "border-yellow-500 bg-yellow-500/10" : "border-white/[0.04] opacity-40"
                }`}>
                <p className="text-sm font-bold">{p.name}</p>
                <Badge variant="outline" className="text-[10px]">{p.role}</Badge>
                <div className="space-y-1">
                  {p.logs.map((log, j) => (
                    <p key={j} className="text-[10px] text-muted-foreground">• {log}</p>
                  ))}
                </div>
                {selected !== null && i === agentIdx && (
                  <Badge className="bg-red-900/40 text-red-300 border-red-500/30 text-[10px]">AGENT</Badge>
                )}
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>
    </GameShell>
  );
};

// ════════════════════════════════════════════════════════
// 13. EGO METER CHALLENGE
// ════════════════════════════════════════════════════════
const EGO_QUESTIONS = [
  { q: "A rival disrespects you in public. You...", options: [{ label: "Destroy them publicly", ego: 15, corruption: 10, loyalty: -5, power: 15 }, { label: "Ignore it, move on", ego: -5, corruption: 0, loyalty: 10, power: -5 }, { label: "Handle it privately", ego: 5, corruption: 5, loyalty: 5, power: 5 }] },
  { q: "You find out a friend betrayed you for money. You...", options: [{ label: "Cut them off forever", ego: 10, corruption: 0, loyalty: 15, power: 5 }, { label: "Forgive but never forget", ego: 0, corruption: 0, loyalty: 10, power: 0 }, { label: "Use it as leverage", ego: 5, corruption: 15, loyalty: -10, power: 10 }] },
  { q: "A cop offers to look the other way for a price. You...", options: [{ label: "Pay without hesitation", ego: 0, corruption: 15, loyalty: 0, power: 5 }, { label: "Report the cop", ego: -5, corruption: -10, loyalty: 15, power: -5 }, { label: "Negotiate a better deal", ego: 10, corruption: 10, loyalty: -5, power: 10 }] },
  { q: "You're offered leadership of a crew, but must betray the current leader.", options: [{ label: "Take it", ego: 15, corruption: 15, loyalty: -15, power: 20 }, { label: "Refuse", ego: -5, corruption: -5, loyalty: 20, power: -10 }, { label: "Warn the leader", ego: 0, corruption: -10, loyalty: 20, power: 0 }] },
  { q: "Someone donates $10,000 to your cause. No strings attached?", options: [{ label: "Accept, no questions", ego: 5, corruption: 10, loyalty: 0, power: 5 }, { label: "Investigate the source", ego: 0, corruption: -5, loyalty: 5, power: 0 }, { label: "Demand they work for you too", ego: 15, corruption: 5, loyalty: -5, power: 15 }] },
  { q: "Your crew fails a job badly. You...", options: [{ label: "Punish them harshly", ego: 10, corruption: 5, loyalty: -10, power: 15 }, { label: "Take responsibility", ego: -5, corruption: 0, loyalty: 20, power: 0 }, { label: "Find a scapegoat", ego: 5, corruption: 15, loyalty: -15, power: 10 }] },
  { q: "An innocent person gets caught in your crossfire. You...", options: [{ label: "Walk away", ego: 5, corruption: 15, loyalty: -5, power: 5 }, { label: "Help them", ego: -10, corruption: -10, loyalty: 15, power: -5 }, { label: "Pay them off silently", ego: 0, corruption: 5, loyalty: 5, power: 0 }] },
  { q: "You discover you have a mole in your operation. You...", options: [{ label: "Execute them publicly", ego: 15, corruption: 15, loyalty: -5, power: 20 }, { label: "Feed them false info", ego: 10, corruption: 5, loyalty: 5, power: 15 }, { label: "Give them a chance to explain", ego: -5, corruption: -5, loyalty: 15, power: -5 }] },
];

export const EgoMeterGame = ({ onBack }: { onBack: () => void }) => {
  const [current, setCurrent] = useState(0);
  const [stats, setStats] = useState({ ego: 50, corruption: 20, loyalty: 50, power: 30 });
  const [gameOver, setGameOver] = useState(false);
  const [questions] = useState(() => [...EGO_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 8));

  const answer = (option: { ego: number; corruption: number; loyalty: number; power: number }) => {
    setStats(prev => ({
      ego: Math.max(0, Math.min(100, prev.ego + option.ego)),
      corruption: Math.max(0, Math.min(100, prev.corruption + option.corruption)),
      loyalty: Math.max(0, Math.min(100, prev.loyalty + option.loyalty)),
      power: Math.max(0, Math.min(100, prev.power + option.power)),
    }));
    if (current + 1 >= questions.length) setGameOver(true);
    else setCurrent(c => c + 1);
  };

  const getTitle = () => {
    if (stats.power > 70 && stats.corruption > 60) return "🔥 Power Hungry Tyrant";
    if (stats.loyalty > 70 && stats.ego < 40) return "🤝 Balanced Leader";
    if (stats.corruption > 70) return "🐍 The Corrupt One";
    if (stats.ego > 70) return "👑 Egomaniac";
    if (stats.loyalty > 60 && stats.power < 40) return "🕶️ Silent Operator";
    return "⚖️ The Neutral";
  };

  if (gameOver) return (
    <GameShell onBack={onBack} title="Ego Meter" icon={<Star className="w-5 h-5 text-foreground" />} gradient="from-fuchsia-600 via-pink-500 to-rose-500">
      <Card3D>
        <Card className="border-fuchsia-500/20 bg-gradient-to-b from-[hsl(220,20%,10%)] to-[hsl(220,20%,6%)]">
          <CardContent className="p-8 text-center space-y-6">
            <h2 className="text-4xl font-bold">{getTitle()}</h2>
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              {[
                { label: "👑 Ego", value: stats.ego, color: "bg-yellow-500" },
                { label: "🐍 Corruption", value: stats.corruption, color: "bg-red-500" },
                { label: "🤝 Loyalty", value: stats.loyalty, color: "bg-blue-500" },
                { label: "⚡ Power", value: stats.power, color: "bg-purple-500" },
              ].map(s => (
                <div key={s.label} className="space-y-1 text-left">
                  <div className="flex justify-between text-xs font-mono"><span>{s.label}</span><span>{s.value}%</span></div>
                  <div className="h-3 bg-black/40 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={onBack} className="bg-gradient-to-r from-fuchsia-600 to-pink-600 border-0">Back to Games</Button>
          </CardContent>
        </Card>
      </Card3D>
    </GameShell>
  );

  return (
    <GameShell onBack={onBack} title="Ego Meter" icon={<Star className="w-5 h-5 text-foreground" />} gradient="from-fuchsia-600 via-pink-500 to-rose-500"
      badges={<Badge className="bg-fuchsia-900/40 text-fuchsia-300 border-fuchsia-500/30">{current + 1}/{questions.length}</Badge>}>
      <Card3D>
        <Card className="border-fuchsia-500/20 bg-gradient-to-b from-[hsl(220,20%,10%)] to-[hsl(220,20%,6%)]">
          <CardContent className="p-6 space-y-6">
            <motion.h3 key={current} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-xl font-bold text-center">
              {questions[current].q}
            </motion.h3>
            <div className="space-y-2 max-w-lg mx-auto">
              {questions[current].options.map((opt, i) => (
                <motion.button key={i} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => answer(opt)}
                  className="w-full p-4 rounded-xl border border-white/[0.08] hover:border-fuchsia-500/30 bg-white/[0.02] text-left font-medium transition-all">
                  {opt.label}
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>
      </Card3D>
    </GameShell>
  );
};

// ════════════════════════════════════════════════════════
// 14. CHAOS METER TRIGGER
// ════════════════════════════════════════════════════════
export const ChaosMeterGame = ({ onBack }: { onBack: () => void }) => {
  const [chaos, setChaos] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [milestones, setMilestones] = useState<number[]>([]);

  const addChaos = () => {
    const add = Math.random() * 3 + 0.5;
    setChaos(prev => {
      const next = Math.min(100, prev + add);
      if (next >= 25 && !milestones.includes(25)) setMilestones(m => [...m, 25]);
      if (next >= 50 && !milestones.includes(50)) setMilestones(m => [...m, 50]);
      if (next >= 75 && !milestones.includes(75)) setMilestones(m => [...m, 75]);
      if (next >= 100 && !milestones.includes(100)) setMilestones(m => [...m, 100]);
      return next;
    });
    setClicks(c => c + 1);
  };

  const isComplete = chaos >= 100;

  return (
    <GameShell onBack={onBack} title="Chaos Meter" icon={<Flame className="w-5 h-5 text-foreground" />} gradient="from-red-700 via-orange-600 to-yellow-500">
      <Card3D>
        <Card className="border-red-500/20 bg-gradient-to-b from-[hsl(220,20%,10%)] to-[hsl(220,20%,6%)]">
          <CardContent className="p-8 text-center space-y-6">
            <h3 className="text-2xl font-bold text-red-400" style={{ textShadow: "0 0 20px hsl(0 80% 55% / 0.4)" }}>💣 CHAOS METER</h3>
            {/* Meter */}
            <div className="relative h-8 bg-black/60 rounded-full border border-red-500/20 overflow-hidden max-w-md mx-auto">
              <motion.div className="h-full rounded-full" animate={{ width: `${chaos}%` }}
                style={{ background: chaos < 50 ? "linear-gradient(90deg, hsl(200 70% 50%), hsl(50 90% 55%))" : chaos < 80 ? "linear-gradient(90deg, hsl(50 90% 55%), hsl(25 90% 55%))" : "linear-gradient(90deg, hsl(25 90% 55%), hsl(0 80% 55%))" }} />
              <span className="absolute inset-0 flex items-center justify-center text-sm font-mono font-bold">{Math.round(chaos)}%</span>
            </div>
            <p className="text-sm text-muted-foreground font-mono">Clicks: {clicks}</p>
            {!isComplete ? (
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.8 }}>
                <Button onClick={addChaos} size="lg" className="bg-gradient-to-r from-red-600 to-orange-600 border-0 text-xl px-10 py-4 shadow-2xl shadow-red-500/30">
                  💥 INCREASE CHAOS
                </Button>
              </motion.div>
            ) : (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }} className="space-y-3">
                <h3 className="text-3xl font-bold text-yellow-400">🔓 CHAOS UNLEASHED!</h3>
                <p className="text-muted-foreground">Double XP activated! Secret badge unlocked! 🏅</p>
                <div className="flex gap-2 justify-center flex-wrap">
                  <Badge className="bg-yellow-900/40 text-yellow-300">2x XP</Badge>
                  <Badge className="bg-purple-900/40 text-purple-300">🏅 Chaos Agent</Badge>
                  <Badge className="bg-red-900/40 text-red-300">🔥 First to 100%</Badge>
                </div>
              </motion.div>
            )}
            {/* Milestones */}
            <div className="flex gap-2 justify-center flex-wrap">
              {[25, 50, 75, 100].map(m => (
                <Badge key={m} className={milestones.includes(m) ? "bg-green-900/40 text-green-300 border-green-500/30" : "bg-white/[0.03] text-muted-foreground/40 border-white/[0.05]"}>
                  {m}% {milestones.includes(m) ? "✓" : ""}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </Card3D>
    </GameShell>
  );
};

// ════════════════════════════════════════════════════════
// 15. CITY CONTROL TUG-OF-WAR
// ════════════════════════════════════════════════════════
export const CityControlGame = ({ onBack }: { onBack: () => void }) => {
  const [factions, setFactions] = useState({ police: 25, mafia: 25, business: 25, civilians: 25 });
  const total = Object.values(factions).reduce((a, b) => a + b, 0);

  const support = (faction: keyof typeof factions) => {
    setFactions(prev => ({ ...prev, [faction]: prev[faction] + Math.floor(Math.random() * 5) + 1 }));
  };

  const factionData = [
    { key: "police" as const, label: "🚔 Police", color: "from-blue-600 to-cyan-600", barColor: "bg-blue-500" },
    { key: "mafia" as const, label: "🔫 Mafia", color: "from-red-600 to-rose-600", barColor: "bg-red-500" },
    { key: "business" as const, label: "💼 Business", color: "from-green-600 to-emerald-600", barColor: "bg-green-500" },
    { key: "civilians" as const, label: "🏘️ Civilians", color: "from-yellow-600 to-amber-600", barColor: "bg-yellow-500" },
  ];

  const leader = factionData.reduce((a, b) => factions[a.key] >= factions[b.key] ? a : b);

  return (
    <GameShell onBack={onBack} title="City Control" icon={<Users className="w-5 h-5 text-foreground" />} gradient="from-purple-700 via-violet-600 to-indigo-600">
      <Card3D>
        <Card className="border-purple-500/20 bg-gradient-to-b from-[hsl(220,20%,10%)] to-[hsl(220,20%,6%)]">
          <CardContent className="p-6 space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-purple-400">🏙️ City Control</h3>
              <p className="text-sm text-muted-foreground mt-1">Support your faction! Currently leading: <span className="font-bold">{leader.label}</span></p>
            </div>
            {/* Tug bar */}
            <div className="h-6 bg-black/40 rounded-full overflow-hidden flex border border-purple-500/20">
              {factionData.map(f => (
                <div key={f.key} className={`${f.barColor} transition-all`} style={{ width: `${(factions[f.key] / total) * 100}%` }} />
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {factionData.map(f => (
                <div key={f.key} className="text-center space-y-2">
                  <p className="text-sm font-bold">{f.label}</p>
                  <p className="text-xs font-mono text-muted-foreground">{Math.round((factions[f.key] / total) * 100)}%</p>
                  <Button onClick={() => support(f.key)} size="sm" className={`bg-gradient-to-r ${f.color} border-0 w-full`}>
                    Support
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Card3D>
    </GameShell>
  );
};

// ════════════════════════════════════════════════════════
// 16. KARMA MULTIPLIER WHEEL
// ════════════════════════════════════════════════════════
const WHEEL_SEGMENTS = [
  { label: "x1", multiplier: 1, color: "hsl(200,70%,50%)" },
  { label: "x2", multiplier: 2, color: "hsl(140,70%,45%)" },
  { label: "x5", multiplier: 5, color: "hsl(50,90%,55%)" },
  { label: "x10", multiplier: 10, color: "hsl(280,70%,55%)" },
  { label: "LOSE ALL", multiplier: 0, color: "hsl(0,80%,55%)" },
  { label: "x1", multiplier: 1, color: "hsl(200,70%,50%)" },
  { label: "x2", multiplier: 2, color: "hsl(140,70%,45%)" },
  { label: "LOSE ALL", multiplier: 0, color: "hsl(0,80%,55%)" },
];

export const KarmaWheelGame = ({ onBack }: { onBack: () => void }) => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<typeof WHEEL_SEGMENTS[0] | null>(null);
  const [karma, setKarma] = useState(100);

  const spin = () => {
    if (spinning || karma <= 0) return;
    setSpinning(true); setResult(null);
    const extraRotation = 1440 + Math.random() * 720; // 4-6 full spins
    const newRotation = rotation + extraRotation;
    setRotation(newRotation);

    setTimeout(() => {
      const normalizedAngle = newRotation % 360;
      const segmentAngle = 360 / WHEEL_SEGMENTS.length;
      const idx = Math.floor(normalizedAngle / segmentAngle) % WHEEL_SEGMENTS.length;
      const segment = WHEEL_SEGMENTS[idx];
      setResult(segment);
      if (segment.multiplier === 0) setKarma(0);
      else setKarma(prev => prev * segment.multiplier);
      setSpinning(false);
    }, 3000);
  };

  const segmentAngle = 360 / WHEEL_SEGMENTS.length;

  return (
    <GameShell onBack={onBack} title="Karma Wheel" icon={<Zap className="w-5 h-5 text-foreground" />} gradient="from-yellow-600 via-amber-500 to-orange-500">
      <Card3D>
        <Card className="border-yellow-500/20 bg-gradient-to-b from-[hsl(220,20%,10%)] to-[hsl(220,20%,6%)]">
          <CardContent className="p-6 text-center space-y-6">
            <h3 className="text-2xl font-bold text-yellow-400">🎲 Karma: {karma} pts</h3>
            {/* Wheel */}
            <div className="relative w-64 h-64 mx-auto">
              <motion.svg viewBox="0 0 200 200" className="w-full h-full" animate={{ rotate: rotation }} transition={{ duration: 3, ease: [0.17, 0.67, 0.12, 0.99] }}>
                {WHEEL_SEGMENTS.map((seg, i) => {
                  const startAngle = i * segmentAngle;
                  const endAngle = startAngle + segmentAngle;
                  const x1 = 100 + 90 * Math.cos((startAngle * Math.PI) / 180);
                  const y1 = 100 + 90 * Math.sin((startAngle * Math.PI) / 180);
                  const x2 = 100 + 90 * Math.cos((endAngle * Math.PI) / 180);
                  const y2 = 100 + 90 * Math.sin((endAngle * Math.PI) / 180);
                  const midAngle = startAngle + segmentAngle / 2;
                  const tx = 100 + 55 * Math.cos((midAngle * Math.PI) / 180);
                  const ty = 100 + 55 * Math.sin((midAngle * Math.PI) / 180);
                  return (
                    <g key={i}>
                      <path d={`M100,100 L${x1},${y1} A90,90 0 0,1 ${x2},${y2} Z`} fill={seg.color} stroke="hsl(220,20%,8%)" strokeWidth="2" />
                      <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="10" fontWeight="bold"
                        transform={`rotate(${midAngle}, ${tx}, ${ty})`}>
                        {seg.label}
                      </text>
                    </g>
                  );
                })}
                <circle cx="100" cy="100" r="15" fill="hsl(220,20%,10%)" stroke="hsl(50,90%,55%)" strokeWidth="2" />
              </motion.svg>
              {/* Pointer */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 text-yellow-400 text-2xl">▼</div>
            </div>

            {result && !spinning && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <p className={`text-xl font-bold ${result.multiplier === 0 ? "text-red-400" : "text-green-400"}`}>
                  {result.multiplier === 0 ? "💀 You lost everything!" : `${result.label}! Karma is now ${karma}`}
                </p>
              </motion.div>
            )}

            <Button onClick={spin} disabled={spinning || karma <= 0} size="lg"
              className="bg-gradient-to-r from-yellow-600 to-amber-600 border-0 text-lg px-10 shadow-lg shadow-yellow-500/30 disabled:opacity-50">
              {karma <= 0 ? "No Karma Left" : spinning ? "Spinning..." : "🎰 SPIN THE WHEEL"}
            </Button>
          </CardContent>
        </Card>
      </Card3D>
    </GameShell>
  );
};
