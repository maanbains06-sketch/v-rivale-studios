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
    <div className="flex flex-col items-center gap-10 py-8 px-4">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(0,229,255,0.15) 0%, rgba(0,100,200,0.05) 40%, transparent 70%)" }}
        />
      </div>

      {/* ── Cooldown Timer ── */}
      {isCoolingDown && cooldownText && (
        <div className="relative w-full max-w-lg z-10">
          <div className="relative overflow-hidden bg-gradient-to-r from-[#0a1628] via-[#132d4a] to-[#0a1628] border border-cyan-500/30 rounded-2xl px-8 py-5 text-center shadow-[0_0_60px_rgba(0,200,255,0.15)]">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent animate-pulse" />
            <div className="relative flex items-center justify-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-cyan-400 animate-pulse" />
              <span className="text-xs uppercase tracking-[0.25em] text-cyan-400 font-semibold">Next Spin Available In</span>
            </div>
            <div className="relative text-3xl md:text-4xl font-bold text-white font-mono tracking-wider"
              style={{ textShadow: "0 0 20px rgba(0,229,255,0.5)" }}>
              {cooldownText}
            </div>
          </div>
        </div>
      )}

      {/* ── Wheel Container ── */}
      <div className="relative select-none z-10" style={{ width: "min(92vw, 640px)", height: "min(92vw, 640px)" }}>

        {/* Outer Pulsing Aura */}
        <div className="absolute inset-[-60px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, transparent 35%, rgba(0,229,255,0.08) 45%, rgba(0,150,255,0.04) 55%, transparent 65%)",
            animation: isSpinning ? "pulse 1s ease-in-out infinite" : "pulse 3s ease-in-out infinite",
          }}
        />
        <div className="absolute inset-[-40px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, transparent 40%, rgba(255,215,0,0.04) 50%, transparent 60%)",
            animation: "pulse 4s ease-in-out infinite reverse",
          }}
        />

        {/* Pointer / Ticker at top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
          <div className="relative">
            <svg width="48" height="52" viewBox="0 0 48 52">
              <defs>
                <linearGradient id="pointerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFD700" />
                  <stop offset="40%" stopColor="#FFA500" />
                  <stop offset="100%" stopColor="#FF6B35" />
                </linearGradient>
                <filter id="pointerGlow">
                  <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#FFD700" floodOpacity="0.6" />
                  <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#FF6B35" floodOpacity="0.3" />
                </filter>
              </defs>
              <polygon points="24,48 6,4 42,4" fill="url(#pointerGrad)" filter="url(#pointerGlow)" />
              <polygon points="24,42 12,8 36,8" fill="url(#pointerGrad)" opacity="0.6" />
              {/* Diamond gem at base */}
              <circle cx="24" cy="12" r="5" fill="#FFD700" opacity="0.9" />
              <circle cx="24" cy="12" r="3" fill="#FFF8DC" opacity="0.8" />
            </svg>
          </div>
        </div>

        {/* SVG Wheel */}
        <svg viewBox="0 0 600 600" className="w-full h-full" style={{ filter: "drop-shadow(0 10px 40px rgba(0,0,0,0.5))" }}>
          <defs>
            <radialGradient id="centerGrad3d" cx="50%" cy="40%" r="55%">
              <stop offset="0%" stopColor="#1e3a5f" />
              <stop offset="60%" stopColor="#0f2744" />
              <stop offset="100%" stopColor="#060e1a" />
            </radialGradient>
            <radialGradient id="centerShine" cx="35%" cy="30%" r="60%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
            <linearGradient id="goldRing" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#B8860B" />
              <stop offset="20%" stopColor="#FFD700" />
              <stop offset="40%" stopColor="#DAA520" />
              <stop offset="60%" stopColor="#FFD700" />
              <stop offset="80%" stopColor="#B8860B" />
              <stop offset="100%" stopColor="#DAA520" />
            </linearGradient>
            <linearGradient id="silverRing" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#C0C0C0" />
              <stop offset="30%" stopColor="#F0F0F0" />
              <stop offset="50%" stopColor="#A0A0A0" />
              <stop offset="70%" stopColor="#E8E8E8" />
              <stop offset="100%" stopColor="#B0B0B0" />
            </linearGradient>
            <linearGradient id="segLight" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
            <filter id="wheelShadow3d">
              <feDropShadow dx="0" dy="6" stdDeviation="12" floodColor="#000" floodOpacity="0.5" />
            </filter>
            <filter id="innerGlow">
              <feGaussianBlur in="SourceAlpha" stdDeviation="6" />
              <feOffset dx="0" dy="0" />
              <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" />
              <feFlood floodColor="#00e5ff" floodOpacity="0.3" />
              <feComposite in2="SourceGraphic" operator="in" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* === Outer Decorative Rings === */}
          {/* Gold ring - outermost */}
          <circle cx={CX} cy={CY} r={OUTER_R + 22} fill="none" stroke="url(#goldRing)" strokeWidth="6" opacity="0.9" />
          {/* Silver ring */}
          <circle cx={CX} cy={CY} r={OUTER_R + 14} fill="none" stroke="url(#silverRing)" strokeWidth="3" opacity="0.7" />
          {/* Cyan glow ring */}
          <circle cx={CX} cy={CY} r={OUTER_R + 9} fill="none" stroke="#00e5ff" strokeWidth="1.5" opacity={isSpinning ? "0.8" : "0.4"}>
            <animate attributeName="opacity" values={isSpinning ? "0.4;1;0.4" : "0.3;0.5;0.3"} dur={isSpinning ? "0.5s" : "3s"} repeatCount="indefinite" />
          </circle>

          {/* === LED Dots with glow === */}
          {ledDots.map((dot, i) => {
            const isActive = isSpinning ? i % 2 === 0 : true;
            return (
              <g key={`led-${i}`}>
                {/* Glow halo */}
                <circle cx={dot.x} cy={dot.y} r="8" fill={isActive ? "#00e5ff" : "#004455"} opacity="0.15">
                  {isSpinning && <animate attributeName="opacity" values="0.05;0.25;0.05" dur={`${0.15 + (i % 5) * 0.06}s`} repeatCount="indefinite" />}
                </circle>
                {/* Main dot */}
                <circle cx={dot.x} cy={dot.y} r="4.5" fill={isActive ? "#00e5ff" : "#003344"} opacity={isSpinning ? 0.95 : 0.75}>
                  {isSpinning && <animate attributeName="fill" values="#00e5ff;#FFD700;#00e5ff" dur={`${0.2 + (i % 4) * 0.08}s`} repeatCount="indefinite" />}
                  {!isSpinning && <animate attributeName="opacity" values="0.5;0.85;0.5" dur={`${2 + (i % 3) * 0.5}s`} repeatCount="indefinite" />}
                </circle>
                {/* Bright center */}
                <circle cx={dot.x} cy={dot.y} r="2" fill="#ffffff" opacity={isActive ? 0.6 : 0.1}>
                  {isSpinning && <animate attributeName="opacity" values="0.2;0.8;0.2" dur={`${0.15 + (i % 4) * 0.08}s`} repeatCount="indefinite" />}
                </circle>
              </g>
            );
          })}

          {/* === Spinning Group === */}
          <g
            ref={wheelRef}
            style={{
              transformOrigin: `${CX}px ${CY}px`,
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning ? "transform 4.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
            }}
            filter="url(#wheelShadow3d)"
          >
            {/* Segments */}
            {SEGMENTS.map((seg, i) => {
              const path = getSegmentPath(i);
              const textPos = getTextPosition(i);
              const iconPos = getIconPosition(i);
              const isEven = i % 2 === 0;

              return (
                <g key={seg.id + i}>
                  {/* Base segment with 3D gradient */}
                  <path d={path} fill={isEven ? "#0c1f38" : "#142e4e"} stroke="#1e5a8a" strokeWidth="0.5" />
                  {/* Top highlight for 3D depth */}
                  <path d={path} fill="url(#segLight)" />
                  {/* Rare golden shimmer */}
                  {seg.rare && (
                    <>
                      <path d={path} fill="rgba(255,215,0,0.06)" />
                      <path d={path} fill="rgba(255,215,0,0.03)" style={{ animation: "pulse 2s ease-in-out infinite" }} />
                    </>
                  )}

                  {/* Divider line with glow */}
                  {(() => {
                    const startDeg = i * SEGMENT_ANGLE - 90;
                    const rad = toRad(startDeg);
                    const x1 = CX + INNER_R * Math.cos(rad);
                    const y1 = CY + INNER_R * Math.sin(rad);
                    const x2 = CX + OUTER_R * Math.cos(rad);
                    const y2 = CY + OUTER_R * Math.sin(rad);
                    return (
                      <>
                        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#00bcd4" strokeWidth="2" opacity="0.15" />
                        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#4a90c2" strokeWidth="1" opacity="0.5" />
                      </>
                    );
                  })()}

                  {/* Icon with glow background */}
                  <foreignObject
                    x={iconPos.x - 14}
                    y={iconPos.y - 14}
                    width="28"
                    height="28"
                    style={{ overflow: "visible" }}
                    transform={`rotate(${iconPos.rotation}, ${iconPos.x}, ${iconPos.y})`}
                  >
                    <div className="flex items-center justify-center rounded-full"
                      style={{
                        width: 28, height: 28,
                        color: seg.rare ? "#FFD700" : "rgba(255,255,255,0.9)",
                        filter: seg.rare ? "drop-shadow(0 0 4px rgba(255,215,0,0.5))" : "drop-shadow(0 0 2px rgba(0,229,255,0.3))",
                      }}>
                      {seg.icon}
                    </div>
                  </foreignObject>

                  {/* Text with better styling */}
                  <text
                    x={textPos.x}
                    y={textPos.y}
                    transform={`rotate(${textPos.rotation}, ${textPos.x}, ${textPos.y})`}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={seg.rare ? "#FFD700" : "white"}
                    fontSize="11.5"
                    fontWeight="800"
                    letterSpacing="0.8"
                    style={{
                      textShadow: seg.rare
                        ? "0 0 8px rgba(255,215,0,0.6), 0 2px 4px rgba(0,0,0,0.9)"
                        : "0 2px 4px rgba(0,0,0,0.9)",
                    }}
                  >
                    {seg.shortLabel}
                  </text>
                </g>
              );
            })}

            {/* === Center Hub - 3D Layered === */}
            {/* Outer ring glow */}
            <circle cx={CX} cy={CY} r={INNER_R + 4} fill="none" stroke="#00e5ff" strokeWidth="1" opacity="0.3" />
            {/* Main hub */}
            <circle cx={CX} cy={CY} r={INNER_R} fill="url(#centerGrad3d)" stroke="url(#goldRing)" strokeWidth="3" />
            {/* Inner ring */}
            <circle cx={CX} cy={CY} r={INNER_R - 6} fill="none" stroke="url(#silverRing)" strokeWidth="1.5" opacity="0.4" />
            {/* Shine overlay */}
            <circle cx={CX} cy={CY} r={INNER_R - 2} fill="url(#centerShine)" />
            {/* Innermost glow ring */}
            <circle cx={CX} cy={CY} r={INNER_R - 12} fill="none" stroke="#00e5ff" strokeWidth="0.5" opacity="0.3">
              <animate attributeName="opacity" values="0.2;0.4;0.2" dur="2s" repeatCount="indefinite" />
            </circle>

            {/* Center Text */}
            <text x={CX} y={CY - 18} textAnchor="middle" dominantBaseline="middle" fill="#FFD700" fontSize="15" fontWeight="900" fontStyle="italic" letterSpacing="2"
              style={{ textShadow: "0 0 10px rgba(255,215,0,0.4), 0 2px 4px rgba(0,0,0,0.8)" }}>
              SKYLIFE
            </text>
            <text x={CX} y={CY + 2} textAnchor="middle" dominantBaseline="middle" fill="#E8E8E8" fontSize="11" fontWeight="900" fontStyle="italic" letterSpacing="1.5"
              style={{ textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>
              ROLEPLAY
            </text>
            <text x={CX} y={CY + 20} textAnchor="middle" dominantBaseline="middle" fill="#00e5ff" fontSize="10" fontWeight="700" fontStyle="italic" letterSpacing="3"
              style={{ textShadow: "0 0 8px rgba(0,229,255,0.5)" }}>
              INDIA
            </text>
          </g>
        </svg>
      </div>

      {/* ── Premium 3D SPIN Button ── */}
      <button
        onClick={handleSpin}
        disabled={isSpinning || isCoolingDown || !userId}
        className="relative group disabled:cursor-not-allowed z-10"
        style={{ perspective: "800px" }}
      >
        {/* Button glow backdrop */}
        {!isSpinning && !isCoolingDown && userId && (
          <div className="absolute -inset-4 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at center, rgba(255,107,53,0.3) 0%, transparent 70%)",
              filter: "blur(15px)",
            }}
          />
        )}

        <div
          className="relative overflow-hidden px-20 py-6 text-3xl font-black tracking-[0.4em] uppercase text-white rounded-2xl transition-all duration-200 active:translate-y-1 disabled:opacity-40"
          style={{
            background: isSpinning
              ? "linear-gradient(180deg, #3a3a3a 0%, #222 100%)"
              : "linear-gradient(180deg, #FF8C42 0%, #E63946 35%, #C0392B 70%, #8B1A1A 100%)",
            boxShadow: isSpinning
              ? "0 4px 0 #111, 0 6px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)"
              : [
                  "0 8px 0 #6B0F0F",
                  "0 10px 0 #4a0a0a",
                  "0 12px 40px rgba(230,57,70,0.5)",
                  "0 4px 60px rgba(255,107,53,0.3)",
                  "inset 0 2px 0 rgba(255,255,255,0.25)",
                  "inset 0 -2px 4px rgba(0,0,0,0.2)",
                ].join(", "),
            textShadow: "0 3px 6px rgba(0,0,0,0.6), 0 0 20px rgba(255,107,53,0.3)",
            transform: isSpinning ? "translateY(4px)" : "translateY(-4px)",
            border: isSpinning ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(255,200,150,0.3)",
          }}
        >
          {/* Shine sweep animation */}
          {!isSpinning && (
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
              <div className="absolute -inset-full"
                style={{
                  background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.15) 55%, transparent 60%)",
                  animation: "shimmerSweep 3s ease-in-out infinite",
                }}
              />
            </div>
          )}
          {/* Spinning dots animation */}
          {isSpinning && (
            <span className="inline-flex gap-1 ml-2">
              <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
              <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
              <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
            </span>
          )}
          <span className="relative z-10">{isSpinning ? "SPINNING" : "SPIN"}</span>
        </div>
      </button>

      {!userId && (
        <p className="text-sm text-muted-foreground z-10">Login with Discord to spin the wheel</p>
      )}

      {/* ── Prize Result Dialog ── */}
      <Dialog open={showPrizeDialog} onOpenChange={setShowPrizeDialog}>
        <DialogContent className="sm:max-w-md border-cyan-500/20 bg-gradient-to-b from-[#060e1a] via-[#0c1f38] to-[#132d4a] shadow-[0_0_80px_rgba(0,200,255,0.1)]">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-black text-white">
              {wonPrize?.rare ? (
                <span className="flex items-center justify-center gap-2">
                  <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" style={{ filter: "drop-shadow(0 0 6px rgba(255,215,0,0.6))" }} />
                  <span style={{ color: "#FFD700", textShadow: "0 0 12px rgba(255,215,0,0.4)" }}>RARE PRIZE!</span>
                  <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" style={{ filter: "drop-shadow(0 0 6px rgba(255,215,0,0.6))" }} />
                </span>
              ) : (
                <span style={{ textShadow: "0 0 10px rgba(0,229,255,0.3)" }}>🎉 You Won!</span>
              )}
            </DialogTitle>
            <DialogDescription className="text-center text-lg pt-4">
              <span className="flex flex-col items-center gap-4">
                <span
                  className={`inline-flex items-center gap-3 px-8 py-4 rounded-xl text-xl font-bold ${
                    wonPrize?.rare
                      ? "bg-yellow-500/10 text-yellow-300 border border-yellow-500/30"
                      : "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30"
                  }`}
                  style={{
                    boxShadow: wonPrize?.rare
                      ? "0 0 30px rgba(255,215,0,0.1), inset 0 0 20px rgba(255,215,0,0.05)"
                      : "0 0 30px rgba(0,229,255,0.1), inset 0 0 20px rgba(0,229,255,0.05)",
                  }}
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

      {/* Shimmer keyframes */}
      <style>{`
        @keyframes shimmerSweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};

export default SpinWheel;
