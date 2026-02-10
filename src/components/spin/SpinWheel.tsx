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
}

const SEGMENTS: Segment[] = [
  { id: "free_queue", label: "1 Time Free Queue Entry", shortLabel: "Free Queue", icon: <Ticket size={18} />, rare: true, weight: 0.8 },
  { id: "cash_10k", label: "$10,000 Cash", shortLabel: "$10,000", icon: <DollarSign size={18} />, rare: false, weight: 16 },
  { id: "better_luck_1", label: "Better Luck Next Time", shortLabel: "Better Luck!", icon: <X size={18} />, rare: false, weight: 18 },
  { id: "cash_20k", label: "$20,000 Cash", shortLabel: "$20,000", icon: <DollarSign size={18} />, rare: true, weight: 0.8 },
  { id: "mission_skip", label: "1 Daily Mission Skip", shortLabel: "Mission Skip", icon: <SkipForward size={18} />, rare: false, weight: 14 },
  { id: "vehicle", label: "Random Vehicle", shortLabel: "Vehicle", icon: <Car size={18} />, rare: true, weight: 0.8 },
  { id: "cash_5k", label: "$5,000 Cash", shortLabel: "$5,000", icon: <DollarSign size={18} />, rare: false, weight: 18 },
  { id: "mystery_box", label: "Mystery Box", shortLabel: "Mystery Box", icon: <Package size={18} />, rare: true, weight: 0.8 },
  { id: "better_luck_2", label: "Better Luck Next Time", shortLabel: "Better Luck!", icon: <X size={18} />, rare: false, weight: 18 },
  { id: "clothing_1", label: "Clothing Reward", shortLabel: "Clothing", icon: <Shirt size={18} />, rare: true, weight: 0.8 },
  { id: "discount", label: "Discount Coupon", shortLabel: "Discount", icon: <Tag size={18} />, rare: true, weight: 0.8 },
  { id: "clothing_2", label: "Clothing Reward", shortLabel: "Clothing", icon: <Shirt size={18} />, rare: true, weight: 0.8 },
  { id: "name_change", label: "Free Name Change Approval", shortLabel: "Name Change", icon: <IdCard size={18} />, rare: true, weight: 0.8 },
];

const TOTAL_SEGMENTS = SEGMENTS.length;
const SEGMENT_ANGLE = 360 / TOTAL_SEGMENTS;
const COOLDOWN_MS = 2 * 24 * 60 * 60 * 1000; // 48 hours

// ── SVG Helpers ─────────────────────────────────────────────────
const CX = 300, CY = 300, OUTER_R = 270, INNER_R = 75;

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
  const r = (OUTER_R + INNER_R) / 2 + 30;
  const rad = toRad(midDeg);
  return {
    x: CX + r * Math.cos(rad),
    y: CY + r * Math.sin(rad),
    rotation: midDeg + 90,
  };
};

const getIconPosition = (index: number) => {
  const midDeg = index * SEGMENT_ANGLE + SEGMENT_ANGLE / 2 - 90;
  const r = INNER_R + 32;
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

// ── Send Discord Notification ───────────────────────────────────
const sendSpinNotification = async (prizeKey: string, discordId: string | null, discordUsername: string | null) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-spin-notification`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          prize_key: prizeKey,
          discord_id: discordId,
          discord_username: discordUsername,
        }),
      }
    );
    if (!response.ok) {
      console.error("Failed to send spin notification:", await response.text());
    }
  } catch (err) {
    console.error("Error sending spin notification:", err);
  }
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
  const [discordId, setDiscordId] = useState<string | null>(null);
  const [discordUsername, setDiscordUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const wheelRef = useRef<SVGGElement>(null);

  // ── Auth + Cooldown Check ──
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);
      setDiscordId(user.user_metadata?.discord_id || user.user_metadata?.provider_id || null);
      setDiscordUsername(user.user_metadata?.display_name || user.user_metadata?.username || user.user_metadata?.discord_username || null);

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
    targetRotation += (Math.random() - 0.5) * SEGMENT_ANGLE * 0.6;

    setIsSpinning(true);
    setRotation(targetRotation);

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

      // Send Discord notification
      sendSpinNotification(prize.id, discordId, discordUsername);

      // Set cooldown
      const endTime = Date.now() + COOLDOWN_MS;
      setCooldownEnd(endTime);
    }, 4500);
  }, [isSpinning, cooldownEnd, userId, rotation, discordId, discordUsername]);

  const isCoolingDown = !!cooldownEnd;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── LED Dots ──
  const ledDots = Array.from({ length: 32 }, (_, i) => {
    const angle = toRad((i * 360) / 32 - 90);
    const r = OUTER_R + 12;
    return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
  });

  return (
    <div className="flex flex-col items-center gap-8 py-8 px-4">
      {/* ── Cooldown Timer ── */}
      {isCoolingDown && cooldownText && (
        <div className="relative w-full max-w-lg">
          <div className="bg-gradient-to-r from-[#0a1628] via-[#132d4a] to-[#0a1628] border border-[#1e4d6e]/60 rounded-2xl px-8 py-5 text-center shadow-[0_0_40px_rgba(30,77,110,0.4)]">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-cyan-400" />
              <span className="text-xs uppercase tracking-[0.25em] text-cyan-400 font-semibold">Next Spin Available In</span>
            </div>
            <div className="text-3xl md:text-4xl font-bold text-white font-mono tracking-wider">
              {cooldownText}
            </div>
          </div>
        </div>
      )}

      {/* ── Wheel Container ── */}
      <div className="relative select-none" style={{ width: "min(92vw, 640px)", height: "min(92vw, 640px)" }}>
        {/* Pointer / Ticker at top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-20">
          <div className="relative">
            <div
              className="w-0 h-0"
              style={{
                borderLeft: "18px solid transparent",
                borderRight: "18px solid transparent",
                borderTop: "38px solid #e8e8e8",
                filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.6))",
              }}
            />
            <div
              className="absolute top-[2px] left-1/2 -translate-x-1/2 w-0 h-0"
              style={{
                borderLeft: "14px solid transparent",
                borderRight: "14px solid transparent",
                borderTop: "30px solid #c0c0c0",
              }}
            />
          </div>
        </div>

        {/* Outer Glow Ring */}
        <div
          className="absolute inset-[-20px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, transparent 40%, rgba(30,77,110,0.2) 55%, transparent 65%)",
          }}
        />

        {/* SVG Wheel */}
        <svg viewBox="0 0 600 600" className="w-full h-full">
          <defs>
            <radialGradient id="centerGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1a2a3a" />
              <stop offset="100%" stopColor="#0a1420" />
            </radialGradient>
            <filter id="wheelShadow">
              <feDropShadow dx="0" dy="4" stdDeviation="10" floodColor="#000" floodOpacity="0.6" />
            </filter>
            <linearGradient id="chromeRing" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#b0b0b0" />
              <stop offset="25%" stopColor="#e8e8e8" />
              <stop offset="50%" stopColor="#909090" />
              <stop offset="75%" stopColor="#e0e0e0" />
              <stop offset="100%" stopColor="#a0a0a0" />
            </linearGradient>
            <linearGradient id="chromeRing2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#c8c8c8" />
              <stop offset="50%" stopColor="#f0f0f0" />
              <stop offset="100%" stopColor="#b8b8b8" />
            </linearGradient>
          </defs>

          {/* Outer Chrome Ring - Double layer for depth */}
          <circle cx={CX} cy={CY} r={OUTER_R + 18} fill="none" stroke="url(#chromeRing)" strokeWidth="8" />
          <circle cx={CX} cy={CY} r={OUTER_R + 10} fill="none" stroke="url(#chromeRing2)" strokeWidth="3" opacity="0.6" />

          {/* LED Dots */}
          {ledDots.map((dot, i) => (
            <circle
              key={`led-${i}`}
              cx={dot.x}
              cy={dot.y}
              r="4"
              fill={isSpinning ? (i % 2 === 0 ? "#00e5ff" : "#005f7f") : "#00bcd4"}
              opacity={isSpinning ? 0.95 : 0.7}
            >
              {isSpinning && (
                <animate
                  attributeName="opacity"
                  values="0.3;1;0.3"
                  dur={`${0.2 + (i % 4) * 0.08}s`}
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
                  {seg.rare && <path d={path} fill="rgba(255,215,0,0.06)" />}

                  {/* Divider line */}
                  {(() => {
                    const startDeg = i * SEGMENT_ANGLE - 90;
                    const rad = toRad(startDeg);
                    const x1 = CX + INNER_R * Math.cos(rad);
                    const y1 = CY + INNER_R * Math.sin(rad);
                    const x2 = CX + OUTER_R * Math.cos(rad);
                    const y2 = CY + OUTER_R * Math.sin(rad);
                    return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#4a90c2" strokeWidth="1.5" opacity="0.6" />;
                  })()}

                  {/* Icon */}
                  <foreignObject
                    x={iconPos.x - 12}
                    y={iconPos.y - 12}
                    width="24"
                    height="24"
                    style={{ overflow: "visible" }}
                    transform={`rotate(${iconPos.rotation}, ${iconPos.x}, ${iconPos.y})`}
                  >
                    <div className="flex items-center justify-center text-white/90" style={{ width: 24, height: 24 }}>
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
                    fontSize="11"
                    fontWeight="800"
                    letterSpacing="0.8"
                    style={{ textShadow: "0 2px 4px rgba(0,0,0,0.9)" }}
                  >
                    {seg.shortLabel}
                  </text>
                </g>
              );
            })}

            {/* Center Circle */}
            <circle cx={CX} cy={CY} r={INNER_R} fill="url(#centerGrad)" stroke="#3a7cb8" strokeWidth="3" />
            <circle cx={CX} cy={CY} r={INNER_R - 5} fill="none" stroke="#2a5a80" strokeWidth="1.5" opacity="0.5" />

            {/* Center Text */}
            <text x={CX} y={CY - 16} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="13" fontWeight="900" fontStyle="italic" letterSpacing="1.5">
              SKYLIFE
            </text>
            <text x={CX} y={CY + 2} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="10" fontWeight="900" fontStyle="italic" letterSpacing="1">
              ROLEPLAY
            </text>
            <text x={CX} y={CY + 18} textAnchor="middle" dominantBaseline="middle" fill="#4a90c2" fontSize="9" fontWeight="700" fontStyle="italic" letterSpacing="2.5">
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
          className="relative px-16 py-5 text-3xl font-black tracking-[0.35em] uppercase text-white rounded-xl transition-all duration-150 active:translate-y-1"
          style={{
            background: isSpinning
              ? "linear-gradient(180deg, #555, #333)"
              : "linear-gradient(180deg, #ff6b35 0%, #e63946 50%, #c0392b 100%)",
            boxShadow: isSpinning
              ? "0 4px 0 #222, 0 6px 15px rgba(0,0,0,0.3)"
              : "0 8px 0 #8b1a1a, 0 10px 30px rgba(230,57,70,0.5), inset 0 2px 0 rgba(255,255,255,0.25)",
            textShadow: "0 3px 6px rgba(0,0,0,0.6)",
            transform: "translateY(-3px)",
          }}
        >
          {isSpinning ? "SPINNING..." : "SPIN"}
        </div>
        {!isSpinning && !isCoolingDown && userId && (
          <div
            className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              boxShadow: "0 0 40px rgba(230,57,70,0.6), 0 0 80px rgba(255,107,53,0.3)",
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
