import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Car, Shirt, Gift, Tag, Ticket, IdCard, SkipForward, X, DollarSign, Package, Clock, Star
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// ── Prize Segments ──────────────────────────────────────────────
interface Segment {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  rare: boolean;
  weight: number;
  color1: string;
  color2: string;
}

const SEGMENTS: Segment[] = [
  { id: "free_queue", label: "1 Time Free Queue Entry", shortLabel: "Free Queue", icon: <Ticket size={16} />, rare: true, weight: 0.8, color1: "#0d2137", color2: "#1a3d5c" },
  { id: "cash_10k", label: "$10,000 Cash", shortLabel: "$10,000", icon: <DollarSign size={16} />, rare: false, weight: 16, color1: "#132d4a", color2: "#1e4568" },
  { id: "better_luck_1", label: "Better Luck Next Time", shortLabel: "Better Luck!", icon: <X size={16} />, rare: false, weight: 18, color1: "#0d2137", color2: "#1a3d5c" },
  { id: "cash_20k", label: "$20,000 Cash", shortLabel: "$20,000", icon: <DollarSign size={16} />, rare: true, weight: 0.8, color1: "#132d4a", color2: "#1e4568" },
  { id: "mission_skip", label: "1 Daily Mission Skip", shortLabel: "Mission Skip", icon: <SkipForward size={16} />, rare: false, weight: 14, color1: "#0d2137", color2: "#1a3d5c" },
  { id: "vehicle", label: "Random Vehicle", shortLabel: "Vehicle", icon: <Car size={16} />, rare: true, weight: 0.8, color1: "#132d4a", color2: "#1e4568" },
  { id: "cash_5k", label: "$5,000 Cash", shortLabel: "$5,000", icon: <DollarSign size={16} />, rare: false, weight: 18, color1: "#0d2137", color2: "#1a3d5c" },
  { id: "mystery_box", label: "Mystery Box", shortLabel: "Mystery Box", icon: <Package size={16} />, rare: true, weight: 0.8, color1: "#132d4a", color2: "#1e4568" },
  { id: "better_luck_2", label: "Better Luck Next Time", shortLabel: "Better Luck!", icon: <X size={16} />, rare: false, weight: 18, color1: "#0d2137", color2: "#1a3d5c" },
  { id: "clothing_1", label: "Clothing Reward", shortLabel: "Clothing", icon: <Shirt size={16} />, rare: true, weight: 0.8, color1: "#132d4a", color2: "#1e4568" },
  { id: "discount", label: "Discount Coupon", shortLabel: "Discount", icon: <Tag size={16} />, rare: true, weight: 0.8, color1: "#0d2137", color2: "#1a3d5c" },
  { id: "clothing_2", label: "Clothing Reward", shortLabel: "Clothing", icon: <Shirt size={16} />, rare: true, weight: 0.8, color1: "#132d4a", color2: "#1e4568" },
  { id: "name_change", label: "Free Name Change Approval", shortLabel: "Name Change", icon: <IdCard size={16} />, rare: true, weight: 0.8, color1: "#0d2137", color2: "#1a3d5c" },
];

const TOTAL_SEGMENTS = SEGMENTS.length;
const SEGMENT_ANGLE = 360 / TOTAL_SEGMENTS;
const COOLDOWN_MS = 2 * 24 * 60 * 60 * 1000; // 48 hours

// ── SVG Helpers ─────────────────────────────────────────────────
const CX = 250, CY = 250, OUTER_R = 220, INNER_R = 65;

const toRad = (deg: number) => (deg * Math.PI) / 180;

const getSegmentPath = (index: number) => {
  const startDeg = index * SEGMENT_ANGLE - 90;
  const endDeg = startDeg + SEGMENT_ANGLE;
  const s = toRad(startDeg);
  const e = toRad(endDeg);

  const x1o = CX + OUTER_R * Math.cos(s);
  const y1o = CY + OUTER_R * Math.sin(s);
  const x2o = CX + OUTER_R * Math.cos(e);
  const y2o = CY + OUTER_R * Math.sin(e);
  const x1i = CX + INNER_R * Math.cos(s);
  const y1i = CY + INNER_R * Math.sin(s);
  const x2i = CX + INNER_R * Math.cos(e);
  const y2i = CY + INNER_R * Math.sin(e);

  return `M${x1i},${y1i} L${x1o},${y1o} A${OUTER_R},${OUTER_R} 0 0,1 ${x2o},${y2o} L${x2i},${y2i} A${INNER_R},${INNER_R} 0 0,0 ${x1i},${y1i} Z`;
};

const getTextPosition = (index: number) => {
  const midDeg = index * SEGMENT_ANGLE + SEGMENT_ANGLE / 2 - 90;
  const r = (OUTER_R + INNER_R) / 2 + 20;
  const rad = toRad(midDeg);
  return {
    x: CX + r * Math.cos(rad),
    y: CY + r * Math.sin(rad),
    rotation: midDeg + 90,
  };
};

const getIconPosition = (index: number) => {
  const midDeg = index * SEGMENT_ANGLE + SEGMENT_ANGLE / 2 - 90;
  const r = INNER_R + 28;
  const rad = toRad(midDeg);
  return {
    x: CX + r * Math.cos(rad),
    y: CY + r * Math.sin(rad),
    rotation: midDeg + 90,
  };
};

// ── Weighted Random Selection ───────────────────────────────────
const selectPrize = (): number => {
  const totalWeight = SEGMENTS.reduce((s, seg) => s + seg.weight, 0);
  let rand = Math.random() * totalWeight;
  for (let i = 0; i < SEGMENTS.length; i++) {
    rand -= SEGMENTS[i].weight;
    if (rand <= 0) return i;
  }
  return SEGMENTS.length - 1;
};

// ── Cooldown Timer ──────────────────────────────────────────────
const formatCountdown = (ms: number) => {
  if (ms <= 0) return null;
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  parts.push(`${String(hours).padStart(2, "0")}h`);
  parts.push(`${String(mins).padStart(2, "0")}m`);
  parts.push(`${String(secs).padStart(2, "0")}s`);
  return parts.join(" : ");
};

// ── Main Component ──────────────────────────────────────────────
const SpinWheel = () => {
  const { toast } = useToast();
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wonPrize, setWonPrize] = useState<Segment | null>(null);
  const [showPrizeDialog, setShowPrizeDialog] = useState(false);
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null);
  const [cooldownText, setCooldownText] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const wheelRef = useRef<SVGGElement>(null);

  // ── Auth + Cooldown Check ──
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      const { data: lastSpin } = await supabase
        .from("spin_results")
        .select("created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (lastSpin && lastSpin.length > 0) {
        const lastTime = new Date(lastSpin[0].created_at).getTime();
        const endTime = lastTime + COOLDOWN_MS;
        if (endTime > Date.now()) {
          setCooldownEnd(endTime);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  // ── Cooldown Ticker ──
  useEffect(() => {
    if (!cooldownEnd) { setCooldownText(null); return; }
    const tick = () => {
      const remaining = cooldownEnd - Date.now();
      if (remaining <= 0) {
        setCooldownEnd(null);
        setCooldownText(null);
      } else {
        setCooldownText(formatCountdown(remaining));
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [cooldownEnd]);

  // ── Spin Logic ──
  const handleSpin = useCallback(async () => {
    if (isSpinning || cooldownEnd || !userId) return;

    const prizeIndex = selectPrize();
    const prize = SEGMENTS[prizeIndex];

    // Calculate target rotation
    const segCenter = prizeIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
    const minNewRotation = rotation + 360 * 5;
    const remainder = minNewRotation % 360;
    let targetRotation = minNewRotation + (segCenter - remainder);
    if (targetRotation < minNewRotation) targetRotation += 360;
    // Add randomness within segment
    targetRotation += (Math.random() - 0.5) * SEGMENT_ANGLE * 0.6;

    setIsSpinning(true);
    setRotation(targetRotation);

    // Wait for spin animation to complete
    setTimeout(async () => {
      setWonPrize(prize);
      setShowPrizeDialog(true);
      setIsSpinning(false);

      // Save to DB
      const { error } = await supabase.from("spin_results").insert({
        user_id: userId,
        prize_key: prize.id,
        prize_label: prize.label,
        is_rare: prize.rare,
      });

      if (error) {
        console.error("Failed to save spin result:", error);
      }

      // Set cooldown
      const endTime = Date.now() + COOLDOWN_MS;
      setCooldownEnd(endTime);
    }, 4500);
  }, [isSpinning, cooldownEnd, userId, rotation]);

  const isCoolingDown = !!cooldownEnd;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── LED Dots ──
  const ledDots = Array.from({ length: 26 }, (_, i) => {
    const angle = toRad((i * 360) / 26 - 90);
    const r = OUTER_R + 10;
    return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
  });

  return (
    <div className="flex flex-col items-center gap-6 py-8 px-4">
      {/* ── Cooldown Timer ── */}
      {isCoolingDown && cooldownText && (
        <div className="relative w-full max-w-md">
          <div className="bg-gradient-to-r from-[#0a1628] via-[#132d4a] to-[#0a1628] border border-[#1e4d6e]/60 rounded-2xl px-6 py-4 text-center shadow-[0_0_30px_rgba(30,77,110,0.3)]">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="text-xs uppercase tracking-widest text-cyan-400 font-semibold">Next Spin Available In</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-white font-mono tracking-wider">
              {cooldownText}
            </div>
          </div>
        </div>
      )}

      {/* ── Wheel Container ── */}
      <div className="relative select-none" style={{ width: "min(90vw, 520px)", height: "min(90vw, 520px)" }}>
        {/* Pointer / Ticker at top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
          <div
            className="w-0 h-0"
            style={{
              borderLeft: "16px solid transparent",
              borderRight: "16px solid transparent",
              borderTop: "32px solid #e0e0e0",
              filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.5))",
            }}
          />
        </div>

        {/* Outer Glow */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle, transparent 42%, rgba(30,77,110,0.15) 60%, transparent 70%)",
          }}
        />

        {/* SVG Wheel */}
        <svg viewBox="0 0 500 500" className="w-full h-full">
          <defs>
            <radialGradient id="centerGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1a2a3a" />
              <stop offset="100%" stopColor="#0a1420" />
            </radialGradient>
            <filter id="wheelShadow">
              <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#000" floodOpacity="0.5" />
            </filter>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer Chrome Ring */}
          <circle cx={CX} cy={CY} r={OUTER_R + 14} fill="none" stroke="url(#chromeRing)" strokeWidth="6" />
          <defs>
            <linearGradient id="chromeRing" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c0c0c0" />
              <stop offset="30%" stopColor="#e8e8e8" />
              <stop offset="50%" stopColor="#a0a0a0" />
              <stop offset="70%" stopColor="#e0e0e0" />
              <stop offset="100%" stopColor="#b0b0b0" />
            </linearGradient>
          </defs>

          {/* LED Dots */}
          {ledDots.map((dot, i) => (
            <circle
              key={`led-${i}`}
              cx={dot.x}
              cy={dot.y}
              r="3"
              fill={isSpinning ? (i % 2 === 0 ? "#00e5ff" : "#005f7f") : "#00bcd4"}
              opacity={isSpinning ? 0.9 : 0.6}
            >
              {isSpinning && (
                <animate
                  attributeName="opacity"
                  values="0.3;1;0.3"
                  dur={`${0.3 + (i % 3) * 0.1}s`}
                  repeatCount="indefinite"
                />
              )}
            </circle>
          ))}

          {/* Spinning Group */}
          <g
            ref={wheelRef}
            style={{
              transformOrigin: `${CX}px ${CY}px`,
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning
                ? "transform 4.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)"
                : "none",
            }}
            filter="url(#wheelShadow)"
          >
            {/* Segments */}
            {SEGMENTS.map((seg, i) => {
              const path = getSegmentPath(i);
              const textPos = getTextPosition(i);
              const iconPos = getIconPosition(i);
              const fillColor = i % 2 === 0 ? "#0f2744" : "#163d5c";

              return (
                <g key={seg.id + i}>
                  {/* Segment fill */}
                  <path d={path} fill={fillColor} stroke="#2a6090" strokeWidth="0.5" />
                  {/* Rare shimmer */}
                  {seg.rare && <path d={path} fill="rgba(255,215,0,0.05)" />}

                  {/* Divider line */}
                  {(() => {
                    const startDeg = i * SEGMENT_ANGLE - 90;
                    const rad = toRad(startDeg);
                    const x1 = CX + INNER_R * Math.cos(rad);
                    const y1 = CY + INNER_R * Math.sin(rad);
                    const x2 = CX + OUTER_R * Math.cos(rad);
                    const y2 = CY + OUTER_R * Math.sin(rad);
                    return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#4a90c2" strokeWidth="1" opacity="0.5" />;
                  })()}

                  {/* Icon (as foreignObject for React icons) */}
                  <foreignObject
                    x={iconPos.x - 10}
                    y={iconPos.y - 10}
                    width="20"
                    height="20"
                    style={{ overflow: "visible" }}
                    transform={`rotate(${iconPos.rotation}, ${iconPos.x}, ${iconPos.y})`}
                  >
                    <div className="flex items-center justify-center text-white/90" style={{ width: 20, height: 20 }}>
                      {seg.icon}
                    </div>
                  </foreignObject>

                  {/* Text */}
                  <text
                    x={textPos.x}
                    y={textPos.y}
                    transform={`rotate(${textPos.rotation}, ${textPos.x}, ${textPos.y})`}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="9"
                    fontWeight="700"
                    letterSpacing="0.5"
                    style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
                  >
                    {seg.shortLabel}
                  </text>
                </g>
              );
            })}

            {/* Center Circle */}
            <circle cx={CX} cy={CY} r={INNER_R} fill="url(#centerGrad)" stroke="#3a7cb8" strokeWidth="2" />
            <circle cx={CX} cy={CY} r={INNER_R - 4} fill="none" stroke="#2a5a80" strokeWidth="1" opacity="0.5" />

            {/* Center Text */}
            <text x={CX} y={CY - 12} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="10" fontWeight="900" fontStyle="italic" letterSpacing="1">
              SKYLIFE
            </text>
            <text x={CX} y={CY + 2} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="8" fontWeight="900" fontStyle="italic" letterSpacing="0.8">
              ROLEPLAY
            </text>
            <text x={CX} y={CY + 14} textAnchor="middle" dominantBaseline="middle" fill="#4a90c2" fontSize="7" fontWeight="700" fontStyle="italic" letterSpacing="2">
              INDIA
            </text>
          </g>
        </svg>
      </div>

      {/* ── 3D SPIN Button ── */}
      <button
        onClick={handleSpin}
        disabled={isSpinning || isCoolingDown || !userId}
        className="relative group disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ perspective: "600px" }}
      >
        <div
          className="relative px-14 py-4 text-2xl font-black tracking-[0.3em] uppercase text-white rounded-xl transition-all duration-150 active:translate-y-1"
          style={{
            background: isSpinning
              ? "linear-gradient(180deg, #555, #333)"
              : "linear-gradient(180deg, #ff6b35 0%, #e63946 50%, #c0392b 100%)",
            boxShadow: isSpinning
              ? "0 4px 0 #222, 0 6px 15px rgba(0,0,0,0.3)"
              : "0 6px 0 #8b1a1a, 0 8px 25px rgba(230,57,70,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
            textShadow: "0 2px 4px rgba(0,0,0,0.5)",
            transform: "translateY(-2px)",
          }}
        >
          {isSpinning ? "SPINNING..." : "SPIN"}
        </div>
        {/* Glow effect */}
        {!isSpinning && !isCoolingDown && userId && (
          <div
            className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              boxShadow: "0 0 30px rgba(230,57,70,0.5), 0 0 60px rgba(255,107,53,0.3)",
            }}
          />
        )}
      </button>

      {!userId && (
        <p className="text-sm text-muted-foreground">Login with Discord to spin the wheel</p>
      )}

      {/* ── Prize Result Dialog ── */}
      <Dialog open={showPrizeDialog} onOpenChange={setShowPrizeDialog}>
        <DialogContent className="sm:max-w-md border-[#1e4d6e]/60 bg-gradient-to-b from-[#0a1628] to-[#132d4a]">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-black text-white">
              {wonPrize?.rare ? (
                <span className="flex items-center justify-center gap-2">
                  <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                  RARE PRIZE!
                  <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                </span>
              ) : (
                "🎉 You Won!"
              )}
            </DialogTitle>
            <DialogDescription className="text-center text-lg pt-4">
              <span className="flex flex-col items-center gap-4">
                <span
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xl font-bold ${
                    wonPrize?.rare
                      ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                      : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  }`}
                >
                  {wonPrize?.icon}
                  {wonPrize?.label}
                </span>
                {wonPrize?.id === "better_luck_1" || wonPrize?.id === "better_luck_2" ? (
                  <span className="text-sm text-muted-foreground">Try again after the cooldown!</span>
                ) : wonPrize?.id === "discount" ? (
                  <span className="text-sm text-muted-foreground">A staff member will deliver your coupon manually.</span>
                ) : (
                  <span className="text-sm text-muted-foreground">Your prize will be delivered in-city automatically!</span>
                )}
              </span>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SpinWheel;
