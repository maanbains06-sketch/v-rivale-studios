import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Car, Shirt, Gift, Tag, Ticket, IdCard, SkipForward, X, DollarSign, Package, Clock, Star, Dumbbell
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import proteinShakeImg from "@/assets/spin-protein-shake.png";

// ── Prize Segments ──────────────────────────────────────────────
interface Segment {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  rare: boolean;
  weight: number;
  /** Shown only in the win dialog, NOT sent to Discord */
  winDescription?: string;
  /** Image for prize dialog */
  prizeImage?: string;
}

const SEGMENTS: Segment[] = [
  { id: "free_queue", label: "1 Time Free Queue Entry", shortLabel: "Free Queue", icon: <Ticket size={18} />, rare: true, weight: 0.8, winDescription: "Skip the line and jump straight into the city! This entry is automatically applied on your next login." },
  { id: "cash_10k", label: "$10,000 Cash", shortLabel: "$10,000", icon: <DollarSign size={18} />, rare: false, weight: 16, winDescription: "💰 In-game money — $10,000 will be credited directly to your in-game bank account automatically!" },
  { id: "better_luck_1", label: "Better Luck Next Time", shortLabel: "Better Luck!", icon: <X size={18} />, rare: false, weight: 16, winDescription: "Luck wasn't on your side this time... Come back after the cooldown for another shot!" },
  { id: "cash_20k", label: "$20,000 Cash", shortLabel: "$20,000", icon: <DollarSign size={18} />, rare: true, weight: 0.8, winDescription: "💰 In-game money — A massive $20,000 jackpot will be credited to your in-game bank account automatically!" },
  { id: "mission_skip", label: "1 Daily Mission Skip", shortLabel: "Mission Skip", icon: <SkipForward size={18} />, rare: false, weight: 14, winDescription: "Skip the grind, keep the rewards! Your next daily mission will be auto-completed. Applied automatically." },
  { id: "vehicle", label: "Random Vehicle", shortLabel: "Vehicle", icon: <Car size={18} />, rare: true, weight: 0.8, winDescription: "🚗 Random vehicle in-game — depends on luck! You could get anything from a sedan to a supercar. Contact staff to claim your ride!" },
  { id: "cash_5k", label: "$5,000 Cash", shortLabel: "$5,000", icon: <DollarSign size={18} />, rare: false, weight: 16, winDescription: "💰 In-game money — $5,000 will be credited directly to your in-game bank account automatically!" },
  { id: "mystery_box", label: "Mystery Box", shortLabel: "Mystery Box", icon: <Package size={18} />, rare: true, weight: 0.8, winDescription: "📦 What's inside? Only fate knows! Could contain rare items, exclusive clothing, or big cash. Contact staff to reveal your mystery prize!" },
  { id: "protein_shake", label: "Protein Shake", shortLabel: "Protein", icon: <Dumbbell size={18} />, rare: true, weight: 1.5, winDescription: "🥤 Protein Shake — After drinking this shake, you will get 2x XP in gym for 24 hours! Get swole faster and dominate the gym!", prizeImage: proteinShakeImg },
  { id: "clothing_1", label: "Clothing Reward", shortLabel: "Clothing", icon: <Shirt size={18} />, rare: true, weight: 0.8, winDescription: "👕 Fresh drip incoming! A random exclusive clothing item will be delivered to your in-game wardrobe automatically!" },
  { id: "discount", label: "Discount Coupon", shortLabel: "Discount", icon: <Tag size={18} />, rare: true, weight: 0.8, winDescription: "🏷️ Save big on your next store purchase! A staff member will deliver your coupon manually. Contact support to claim." },
  { id: "better_luck_2", label: "Better Luck Next Time", shortLabel: "Better Luck!", icon: <X size={18} />, rare: false, weight: 16, winDescription: "The wheel said no... but the next spin could be the big one! Try again after cooldown." },
  { id: "name_change", label: "Free Name Change Approval", shortLabel: "Name Change", icon: <IdCard size={18} />, rare: true, weight: 0.8, winDescription: "🪪 Time for a fresh identity! Contact a staff member to apply your free name change." },
];

const TOTAL_SEGMENTS = SEGMENTS.length;
const SEGMENT_ANGLE = 360 / TOTAL_SEGMENTS;
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

// ── SVG Helpers ─────────────────────────────────────────────────
const CX = 300, CY = 300, OUTER_R = 260, INNER_R = 80;

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
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad), rotation: midDeg + 90 };
};

const getIconPosition = (index: number) => {
  const midDeg = index * SEGMENT_ANGLE + SEGMENT_ANGLE / 2 - 90;
  const r = INNER_R + 35;
  const rad = toRad(midDeg);
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad), rotation: midDeg + 90 };
};

// ── Ultra-rare prize IDs (vehicle & clothing) ──────────────────
const ULTRA_RARE_IDS = new Set(["vehicle", "clothing_1"]);
const ULTRA_RARE_SPIN_THRESHOLD = 60; // Available once every 60-70 spins

// ── Weighted Random ─────────────────────────────────────────────
const selectPrize = (spinsSinceLastUltraRare: number): number => {
  // Only allow vehicle/clothing if user has done 60+ spins since last winning one
  const isUltraRareEligible = spinsSinceLastUltraRare >= ULTRA_RARE_SPIN_THRESHOLD;
  
  const adjustedSegments = SEGMENTS.map((seg) => ({
    ...seg,
    weight: ULTRA_RARE_IDS.has(seg.id) && !isUltraRareEligible ? 0 : seg.weight,
  }));

  const totalWeight = adjustedSegments.reduce((s, seg) => s + seg.weight, 0);
  let rand = Math.random() * totalWeight;
  for (let i = 0; i < adjustedSegments.length; i++) {
    rand -= adjustedSegments[i].weight;
    if (rand <= 0) return i;
  }
  return SEGMENTS.length - 1;
};

interface CountdownParts {
  hours: string;
  mins: string;
  secs: string;
}

const formatCountdown = (ms: number): CountdownParts | null => {
  if (ms <= 0) return null;
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  return {
    hours: String(hours).padStart(2, "0"),
    mins: String(mins).padStart(2, "0"),
    secs: String(secs).padStart(2, "0"),
  };
};

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
        body: JSON.stringify({ prize_key: prizeKey, discord_id: discordId, discord_username: discordUsername }),
      }
    );
    if (!response.ok) console.error("Failed to send spin notification:", await response.text());
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
  const [cooldownText, setCooldownText] = useState<CountdownParts | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [discordId, setDiscordId] = useState<string | null>(null);
  const [discordUsername, setDiscordUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightsFlashing, setLightsFlashing] = useState(false);
  const [spinsSinceUltraRare, setSpinsSinceUltraRare] = useState(0);
  const wheelRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);
      setDiscordId(user.user_metadata?.discord_id || user.user_metadata?.provider_id || null);
      setDiscordUsername(user.user_metadata?.display_name || user.user_metadata?.username || user.user_metadata?.discord_username || null);
      // Fetch spin count since last ultra-rare win
      const { data: allSpins } = await supabase
        .from("spin_results").select("prize_key, created_at").eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (allSpins && allSpins.length > 0) {
        // Cooldown from last spin
        const endTime = new Date(allSpins[0].created_at).getTime() + COOLDOWN_MS;
        if (endTime > Date.now()) setCooldownEnd(endTime);
        
        // Count spins since last vehicle/clothing win
        let count = 0;
        for (const spin of allSpins) {
          if (ULTRA_RARE_IDS.has(spin.prize_key)) break;
          count++;
        }
        setSpinsSinceUltraRare(count);
      }
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (!cooldownEnd) { setCooldownText(null); return; }
    const tick = () => {
      const remaining = cooldownEnd - Date.now();
      if (remaining <= 0) { setCooldownEnd(null); setCooldownText(null); }
      else setCooldownText(formatCountdown(remaining));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [cooldownEnd]);

  const handleSpin = useCallback(async () => {
    if (isSpinning || cooldownEnd || !userId) return;
    const prizeIndex = selectPrize(spinsSinceUltraRare);
    const prize = SEGMENTS[prizeIndex];
    const segCenter = prizeIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
    const targetAngle = 360 - segCenter; // Align winning segment with top pointer
    const minNewRotation = rotation + 360 * 5;
    const remainder = minNewRotation % 360;
    let targetRotation = minNewRotation + (targetAngle - remainder);
    if (targetRotation < minNewRotation) targetRotation += 360;
    targetRotation += (Math.random() - 0.5) * SEGMENT_ANGLE * 0.6;
    setIsSpinning(true);
    setRotation(targetRotation);
    setTimeout(async () => {
      setWonPrize(prize);
      setShowPrizeDialog(true);
      setIsSpinning(false);
      setLightsFlashing(true);
      setTimeout(() => setLightsFlashing(false), 5000);
      const { error } = await supabase.from("spin_results").insert({
        user_id: userId, prize_key: prize.id, prize_label: prize.label, is_rare: prize.rare,
      });
      if (error) console.error("Failed to save spin result:", error);
      sendSpinNotification(prize.id, discordId, discordUsername);
      setCooldownEnd(Date.now() + COOLDOWN_MS);
      // Update ultra-rare spin counter
      if (ULTRA_RARE_IDS.has(prize.id)) {
        setSpinsSinceUltraRare(0);
      } else {
        setSpinsSinceUltraRare(prev => prev + 1);
      }
    }, 4500);
  }, [isSpinning, cooldownEnd, userId, rotation, discordId, discordUsername, spinsSinceUltraRare]);

  const isCoolingDown = !!cooldownEnd;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Peg positions at segment boundaries on the outer rim
  const pegs = Array.from({ length: TOTAL_SEGMENTS }, (_, i) => {
    const deg = i * SEGMENT_ANGLE - 90;
    const rad = toRad(deg);
    const r = OUTER_R + 2;
    return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
  });

  // LED dots between pegs
  const ledCount = TOTAL_SEGMENTS * 2;
  const ledDots = Array.from({ length: ledCount }, (_, i) => {
    const deg = (i * 360) / ledCount - 90;
    const rad = toRad(deg);
    const r = OUTER_R + 18;
    return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
  });

  return (
    <div className="flex flex-col items-center gap-10 py-8 px-4">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full opacity-25"
          style={{ background: "radial-gradient(circle, rgba(100,160,255,0.12) 0%, rgba(40,80,160,0.05) 40%, transparent 65%)" }}
        />
      </div>

      {/* 3D Cooldown Timer */}
      {isCoolingDown && cooldownText && (
        <div className="relative w-full max-w-xl z-10">
          <div className="relative overflow-hidden rounded-2xl"
            style={{
              background: "linear-gradient(180deg, #0c1a2e 0%, #081428 40%, #060e1c 100%)",
              boxShadow: "0 8px 0 #040a14, 0 10px 0 #020610, 0 12px 40px rgba(0,30,80,0.5), inset 0 1px 0 rgba(150,200,255,0.08), inset 0 -2px 6px rgba(0,0,0,0.4)",
              border: "1px solid rgba(80,130,200,0.15)",
            }}>
            <div className="h-[3px]" style={{ background: "linear-gradient(90deg, transparent 5%, rgba(120,170,230,0.3) 20%, rgba(200,220,255,0.5) 50%, rgba(120,170,230,0.3) 80%, transparent 95%)" }} />
            
            <div className="px-6 py-5 sm:px-10 sm:py-6">
              <div className="flex items-center justify-center gap-2.5 mb-5">
                <Clock className="w-5 h-5 text-cyan-400" style={{ filter: "drop-shadow(0 0 6px rgba(0,200,255,0.4))" }} />
                <span className="text-xs uppercase tracking-[0.3em] font-bold"
                  style={{ color: "#6aafdc", textShadow: "0 0 8px rgba(80,180,255,0.3)" }}>
                  Next Spin Available In
                </span>
              </div>

              <div className="flex items-center justify-center gap-3 sm:gap-5">
                {/* Hours */}
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex gap-1.5">
                    {cooldownText.hours.split("").map((d, i) => (
                      <div key={`h-${i}`} className="relative" style={{
                        width: 48, height: 64,
                        background: "linear-gradient(180deg, #14253a 0%, #0c1a2c 45%, #0a1524 55%, #081220 100%)",
                        borderRadius: 10,
                        boxShadow: "0 4px 0 #050c18, 0 5px 0 #030810, 0 6px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(140,190,240,0.1), inset 0 -1px 0 rgba(0,0,0,0.3)",
                        border: "1px solid rgba(60,110,180,0.15)",
                      }}>
                        <div className="absolute top-1/2 left-0 right-0 h-[1px] -translate-y-[0.5px]"
                          style={{ background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.5) 20%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.5) 80%, transparent)" }} />
                        <div className="absolute top-1/2 left-0 right-0 h-[1px] translate-y-[0.5px]"
                          style={{ background: "linear-gradient(90deg, transparent, rgba(100,160,230,0.06) 30%, rgba(100,160,230,0.08) 50%, rgba(100,160,230,0.06) 70%, transparent)" }} />
                        <span className="absolute inset-0 flex items-center justify-center text-3xl font-black font-mono"
                          style={{ color: "#c8ddf0", textShadow: "0 0 10px rgba(100,180,255,0.4), 0 2px 4px rgba(0,0,0,0.8)" }}>
                          {d}
                        </span>
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-semibold" style={{ color: "#4a7aa0" }}>Hours</span>
                </div>

                <div className="flex flex-col gap-2.5 pb-5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#4a8ac0", boxShadow: "0 0 8px rgba(60,140,220,0.5), 0 2px 3px rgba(0,0,0,0.5)" }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#4a8ac0", boxShadow: "0 0 8px rgba(60,140,220,0.5), 0 2px 3px rgba(0,0,0,0.5)" }} />
                </div>

                {/* Minutes */}
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex gap-1.5">
                    {cooldownText.mins.split("").map((d, i) => (
                      <div key={`m-${i}`} className="relative" style={{
                        width: 48, height: 64,
                        background: "linear-gradient(180deg, #14253a 0%, #0c1a2c 45%, #0a1524 55%, #081220 100%)",
                        borderRadius: 10,
                        boxShadow: "0 4px 0 #050c18, 0 5px 0 #030810, 0 6px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(140,190,240,0.1), inset 0 -1px 0 rgba(0,0,0,0.3)",
                        border: "1px solid rgba(60,110,180,0.15)",
                      }}>
                        <div className="absolute top-1/2 left-0 right-0 h-[1px] -translate-y-[0.5px]"
                          style={{ background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.5) 20%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.5) 80%, transparent)" }} />
                        <div className="absolute top-1/2 left-0 right-0 h-[1px] translate-y-[0.5px]"
                          style={{ background: "linear-gradient(90deg, transparent, rgba(100,160,230,0.06) 30%, rgba(100,160,230,0.08) 50%, rgba(100,160,230,0.06) 70%, transparent)" }} />
                        <span className="absolute inset-0 flex items-center justify-center text-3xl font-black font-mono"
                          style={{ color: "#c8ddf0", textShadow: "0 0 10px rgba(100,180,255,0.4), 0 2px 4px rgba(0,0,0,0.8)" }}>
                          {d}
                        </span>
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-semibold" style={{ color: "#4a7aa0" }}>Minutes</span>
                </div>

                <div className="flex flex-col gap-2.5 pb-5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#4a8ac0", boxShadow: "0 0 8px rgba(60,140,220,0.5), 0 2px 3px rgba(0,0,0,0.5)" }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#4a8ac0", boxShadow: "0 0 8px rgba(60,140,220,0.5), 0 2px 3px rgba(0,0,0,0.5)" }} />
                </div>

                {/* Seconds */}
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex gap-1.5">
                    {cooldownText.secs.split("").map((d, i) => (
                      <div key={`s-${i}`} className="relative" style={{
                        width: 48, height: 64,
                        background: "linear-gradient(180deg, #14253a 0%, #0c1a2c 45%, #0a1524 55%, #081220 100%)",
                        borderRadius: 10,
                        boxShadow: "0 4px 0 #050c18, 0 5px 0 #030810, 0 6px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(140,190,240,0.1), inset 0 -1px 0 rgba(0,0,0,0.3)",
                        border: "1px solid rgba(60,110,180,0.15)",
                      }}>
                        <div className="absolute top-1/2 left-0 right-0 h-[1px] -translate-y-[0.5px]"
                          style={{ background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.5) 20%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.5) 80%, transparent)" }} />
                        <div className="absolute top-1/2 left-0 right-0 h-[1px] translate-y-[0.5px]"
                          style={{ background: "linear-gradient(90deg, transparent, rgba(100,160,230,0.06) 30%, rgba(100,160,230,0.08) 50%, rgba(100,160,230,0.06) 70%, transparent)" }} />
                        <span className="absolute inset-0 flex items-center justify-center text-3xl font-black font-mono"
                          style={{ color: "#c8ddf0", textShadow: "0 0 10px rgba(100,180,255,0.4), 0 2px 4px rgba(0,0,0,0.8)" }}>
                          {d}
                        </span>
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-semibold" style={{ color: "#4a7aa0" }}>Seconds</span>
                </div>
              </div>
            </div>

            <div className="h-[2px]" style={{ background: "linear-gradient(90deg, transparent 10%, rgba(80,130,200,0.12) 30%, rgba(100,160,230,0.2) 50%, rgba(80,130,200,0.12) 70%, transparent 90%)" }} />
          </div>
        </div>
      )}

      {/* ── Wheel Container ── */}
      <div className="relative select-none z-10" style={{ width: "min(94vw, 740px)", height: "min(94vw, 740px)" }}>

        {/* Realistic floor shadow */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[85%] h-16 rounded-[50%] pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 40%, transparent 70%)", filter: "blur(8px)" }}
        />

        {/* Top-down light cone */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[120%] h-[60%] pointer-events-none"
          style={{
            background: "conic-gradient(from 0deg at 50% 0%, transparent 30%, rgba(180,210,255,0.04) 45%, rgba(200,220,255,0.07) 50%, rgba(180,210,255,0.04) 55%, transparent 70%)",
          }}
        />

        {/* Pointer / Ticker */}
        <div className="absolute top-[-18px] left-1/2 -translate-x-1/2 z-30">
          <svg width="44" height="56" viewBox="0 0 44 56">
            <defs>
              <linearGradient id="tickerChrome" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e0e8f0" />
                <stop offset="30%" stopColor="#b0c0d0" />
                <stop offset="50%" stopColor="#f0f4f8" />
                <stop offset="70%" stopColor="#8898a8" />
                <stop offset="100%" stopColor="#c0ccd8" />
              </linearGradient>
              <filter id="tickerShadow">
                <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000" floodOpacity="0.6" />
              </filter>
            </defs>
            <polygon points="22,52 4,6 40,6" fill="url(#tickerChrome)" filter="url(#tickerShadow)" stroke="#6080a0" strokeWidth="1" />
            <polygon points="22,48 10,10 22,6" fill="rgba(255,255,255,0.2)" />
            <circle cx="22" cy="10" r="5" fill="#4488cc" stroke="#a0c0e0" strokeWidth="1.5" />
            <circle cx="22" cy="10" r="2.5" fill="#88bbee" opacity="0.8" />
            <circle cx="20.5" cy="8.5" r="1" fill="rgba(255,255,255,0.7)" />
          </svg>
        </div>

        {/* SVG Wheel */}
        <svg viewBox="0 0 600 600" className="w-full h-full">
          <defs>
            <linearGradient id="chromeRim" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7a8ea0" />
              <stop offset="15%" stopColor="#d0dce8" />
              <stop offset="30%" stopColor="#f0f4f8" />
              <stop offset="45%" stopColor="#8898a8" />
              <stop offset="60%" stopColor="#c8d4e0" />
              <stop offset="75%" stopColor="#f0f4f8" />
              <stop offset="90%" stopColor="#8898a8" />
              <stop offset="100%" stopColor="#b0c0d0" />
            </linearGradient>
            <linearGradient id="chromeRim2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#b0c0d0" />
              <stop offset="25%" stopColor="#e8eff4" />
              <stop offset="50%" stopColor="#90a0b0" />
              <stop offset="75%" stopColor="#d0dce8" />
              <stop offset="100%" stopColor="#a0b0c0" />
            </linearGradient>
            <radialGradient id="hubGrad" cx="45%" cy="40%" r="55%">
              <stop offset="0%" stopColor="#1a2a40" />
              <stop offset="60%" stopColor="#0d1828" />
              <stop offset="100%" stopColor="#060c16" />
            </radialGradient>
            <radialGradient id="hubShine" cx="35%" cy="30%" r="50%">
              <stop offset="0%" stopColor="rgba(180,210,255,0.12)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
            <linearGradient id="segTopLight" x1="30%" y1="0%" x2="70%" y2="100%">
              <stop offset="0%" stopColor="rgba(160,200,255,0.1)" />
              <stop offset="50%" stopColor="rgba(100,150,220,0.03)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.08)" />
            </linearGradient>
            <radialGradient id="pegGrad" cx="35%" cy="30%" r="60%">
              <stop offset="0%" stopColor="#e8f0f8" />
              <stop offset="40%" stopColor="#b0c0d0" />
              <stop offset="100%" stopColor="#607080" />
            </radialGradient>
            <filter id="wheelDrop">
              <feDropShadow dx="4" dy="8" stdDeviation="16" floodColor="#000" floodOpacity="0.55" />
            </filter>
            <filter id="innerDepth">
              <feGaussianBlur in="SourceAlpha" stdDeviation="8" />
              <feOffset dx="0" dy="0" />
              <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" />
              <feFlood floodColor="#000020" floodOpacity="0.4" />
              <feComposite in2="SourceGraphic" operator="in" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="segBevel">
              <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur" />
              <feSpecularLighting in="blur" surfaceScale="3" specularConstant="0.5" specularExponent="20" result="spec">
                <fePointLight x="200" y="100" z="200" />
              </feSpecularLighting>
              <feComposite in="spec" in2="SourceAlpha" operator="in" result="specOut" />
              <feMerge>
                <feMergeNode in="SourceGraphic" />
                <feMergeNode in="specOut" />
              </feMerge>
            </filter>
          </defs>

          {/* === Outer Chrome Frame (non-rotating) === */}
          <circle cx={CX} cy={CY} r={OUTER_R + 28} fill="none" stroke="url(#chromeRim)" strokeWidth="14" filter="url(#wheelDrop)" />
          <circle cx={CX} cy={CY} r={OUTER_R + 20} fill="none" stroke="url(#chromeRim2)" strokeWidth="5" opacity="0.8" />
          <circle cx={CX} cy={CY} r={OUTER_R + 13} fill="none" stroke="#4a6070" strokeWidth="1" opacity="0.6" />
          <circle cx={CX} cy={CY} r={OUTER_R + 35} fill="none" stroke="rgba(180,210,255,0.08)" strokeWidth="1" />

          {/* === LED Dots on chrome frame === */}
          {ledDots.map((dot, i) => {
            const groupA = i % 2 === 0;
            const idleDelay = groupA ? "0s" : "0.7s";
            return (
              <g key={`led-${i}`}>
                <circle cx={dot.x} cy={dot.y} r={isSpinning || lightsFlashing ? "10" : "8"} fill={lightsFlashing ? "#ffaa00" : "#3070cc"} opacity="0.05">
                  {isSpinning && (
                    <animate attributeName="opacity" values="0.02;0.25;0.02" dur={`${0.1 + (i % 5) * 0.04}s`} repeatCount="indefinite" />
                  )}
                  {lightsFlashing && (
                    <animate attributeName="opacity" values="0;0.35;0" dur="0.6s" repeatCount="indefinite" begin={`${(i % 4) * 0.15}s`} />
                  )}
                  {!isSpinning && !lightsFlashing && (
                    <animate attributeName="opacity" values="0.02;0.2;0.02" dur="1.4s" repeatCount="indefinite" begin={idleDelay} />
                  )}
                </circle>
                <circle cx={dot.x} cy={dot.y} r="2.8"
                  fill={isSpinning ? (groupA ? "#4488dd" : "#3366aa") : lightsFlashing ? "#ffcc33" : (groupA ? "#4488dd" : "#3366aa")}
                  opacity="0.85"
                >
                  {isSpinning && (
                    <animate attributeName="fill" values="#2255aa;#66ccff;#ffffff;#66ccff;#2255aa" dur={`${0.12 + (i % 6) * 0.03}s`} repeatCount="indefinite" />
                  )}
                  {lightsFlashing && (
                    <animate attributeName="opacity" values="0.15;1;0.15" dur="0.6s" repeatCount="indefinite" begin={`${(i % 4) * 0.15}s`} />
                  )}
                  {!isSpinning && !lightsFlashing && (
                    <animate attributeName="opacity" values="0.15;1;0.15" dur="1.4s" repeatCount="indefinite" begin={idleDelay} />
                  )}
                </circle>
                <circle cx={dot.x} cy={dot.y} r="1.2" fill={lightsFlashing ? "#ffffff" : "#aaccff"} opacity="0.5">
                  {isSpinning && (
                    <animate attributeName="opacity" values="0.2;1;0.2" dur={`${0.1 + (i % 4) * 0.04}s`} repeatCount="indefinite" />
                  )}
                  {lightsFlashing && (
                    <animate attributeName="opacity" values="0;1;0" dur="0.6s" repeatCount="indefinite" begin={`${(i % 4) * 0.15}s`} />
                  )}
                  {!isSpinning && !lightsFlashing && (
                    <animate attributeName="opacity" values="0;0.8;0" dur="1.4s" repeatCount="indefinite" begin={idleDelay} />
                  )}
                </circle>
              </g>
            );
          })}

          {/* === Spinning Wheel Group === */}
          <g
            ref={wheelRef}
            style={{
              transformOrigin: `${CX}px ${CY}px`,
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning ? "transform 4.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
            }}
          >
            <circle cx={CX} cy={CY} r={OUTER_R + 2} fill="#0a1525" />

            {/* Segments */}
            {SEGMENTS.map((seg, i) => {
              const path = getSegmentPath(i);
              const textPos = getTextPosition(i);
              const iconPos = getIconPosition(i);
              const isEven = i % 2 === 0;
              const baseFill = isEven ? "#0e2040" : "#132a4a";
              const hoverFill = seg.rare ? "rgba(255,215,0,0.04)" : "transparent";

              return (
                <g key={seg.id + i}>
                  <path d={path} fill={baseFill} />
                  <path d={path} fill="url(#segTopLight)" />
                  {seg.rare && <path d={path} fill={hoverFill} />}

                  {(() => {
                    const startDeg = i * SEGMENT_ANGLE - 90;
                    const rad = toRad(startDeg);
                    const x1 = CX + INNER_R * Math.cos(rad);
                    const y1 = CY + INNER_R * Math.sin(rad);
                    const x2 = CX + OUTER_R * Math.cos(rad);
                    const y2 = CY + OUTER_R * Math.sin(rad);
                    return (
                      <>
                        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(0,0,0,0.5)" strokeWidth="2.5" />
                        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#5a7a98" strokeWidth="1.5" opacity="0.7" />
                        <line x1={x1 + 0.5} y1={y1 + 0.5} x2={x2 + 0.5} y2={y2 + 0.5} stroke="rgba(180,210,255,0.15)" strokeWidth="0.5" />
                      </>
                    );
                  })()}

                  <foreignObject
                    x={iconPos.x - 14} y={iconPos.y - 14} width="28" height="28"
                    style={{ overflow: "visible" }}
                    transform={`rotate(${iconPos.rotation}, ${iconPos.x}, ${iconPos.y})`}
                  >
                    <div className="flex items-center justify-center" style={{
                      width: 28, height: 28,
                      color: seg.rare ? "#FFD700" : "rgba(255,255,255,0.92)",
                      filter: seg.rare
                        ? "drop-shadow(0 0 4px rgba(255,215,0,0.4)) drop-shadow(0 1px 2px rgba(0,0,0,0.8))"
                        : "drop-shadow(0 0 3px rgba(100,180,255,0.25)) drop-shadow(0 1px 2px rgba(0,0,0,0.8))",
                    }}>
                      {seg.icon}
                    </div>
                  </foreignObject>

                  <text
                    x={textPos.x} y={textPos.y}
                    transform={`rotate(${textPos.rotation}, ${textPos.x}, ${textPos.y})`}
                    textAnchor="middle" dominantBaseline="middle"
                    fill={seg.rare ? "#FFD700" : "#e0e8f0"}
                    fontSize="10" fontWeight="800" letterSpacing="0.5"
                    style={{ textShadow: seg.rare
                      ? "0 0 6px rgba(255,215,0,0.4), 0 1px 3px rgba(0,0,0,0.9)"
                      : "0 1px 3px rgba(0,0,0,0.9), 0 0 4px rgba(100,160,255,0.15)" }}
                  >
                    {seg.shortLabel}
                  </text>
                </g>
              );
            })}

            {/* Metallic pegs */}
            {pegs.map((peg, i) => (
              <g key={`peg-${i}`}>
                <circle cx={peg.x + 1} cy={peg.y + 1.5} r="5" fill="rgba(0,0,0,0.5)" />
                <circle cx={peg.x} cy={peg.y} r="4.5" fill="url(#pegGrad)" stroke="#506878" strokeWidth="0.5" />
                <circle cx={peg.x - 1} cy={peg.y - 1.5} r="1.8" fill="rgba(255,255,255,0.35)" />
              </g>
            ))}

            {/* === Center Hub === */}
            <circle cx={CX} cy={CY} r={INNER_R + 6} fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="8" />
            <circle cx={CX} cy={CY} r={INNER_R + 2} fill="none" stroke="url(#chromeRim)" strokeWidth="5" />
            <circle cx={CX} cy={CY} r={INNER_R} fill="url(#hubGrad)" />
            <circle cx={CX} cy={CY} r={INNER_R - 3} fill="none" stroke="url(#chromeRim2)" strokeWidth="1.5" opacity="0.4" />
            <circle cx={CX} cy={CY} r={INNER_R - 1} fill="url(#hubShine)" />

            <text x={CX} y={CY - 20} textAnchor="middle" dominantBaseline="middle"
              fill="#c0c8d0" fontSize="11" fontWeight="400" letterSpacing="3" fontFamily="serif"
              style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
              THE
            </text>
            <text x={CX} y={CY + 2} textAnchor="middle" dominantBaseline="middle"
              fill="#e8eff4" fontSize="18" fontWeight="700" fontStyle="italic" letterSpacing="1.5" fontFamily="serif"
              style={{ textShadow: "0 0 8px rgba(100,160,255,0.2), 0 2px 4px rgba(0,0,0,0.9)" }}>
              Skylife
            </text>
            <text x={CX} y={CY + 22} textAnchor="middle" dominantBaseline="middle"
              fill="#8098b0" fontSize="8" fontWeight="600" letterSpacing="4" textDecoration="none"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
              ROLEPLAY INDIA
            </text>
          </g>

          <ellipse cx={CX - 40} cy={CY - 60} rx="160" ry="120" fill="rgba(180,210,255,0.025)"
            style={{ pointerEvents: "none" }} />
        </svg>
      </div>

      {/* ── Premium 3D SPIN Button ── */}
      <button
        onClick={handleSpin}
        disabled={isSpinning || isCoolingDown || !userId}
        className="relative group disabled:cursor-not-allowed z-10"
        style={{ perspective: "800px" }}
      >
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[80%] h-4 rounded-[50%] pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)", filter: "blur(4px)" }}
        />

        {!isSpinning && !isCoolingDown && userId && (
          <div className="absolute -inset-6 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{ background: "radial-gradient(ellipse, rgba(100,160,255,0.15) 0%, transparent 70%)", filter: "blur(12px)" }}
          />
        )}

        <div
          className="relative overflow-hidden px-20 py-6 text-3xl font-black tracking-[0.4em] uppercase rounded-2xl transition-all duration-150 active:translate-y-1 disabled:opacity-40"
          style={{
            color: isSpinning ? "#556" : "#e8eff4",
            background: isSpinning
              ? "linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)"
              : "linear-gradient(180deg, #3a5a7a 0%, #1e3a5a 30%, #0f2540 70%, #081828 100%)",
            boxShadow: isSpinning
              ? "0 3px 0 #111, 0 5px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)"
              : [
                  "0 6px 0 #0a1a28",
                  "0 8px 0 #050e18",
                  "0 10px 30px rgba(0,30,60,0.6)",
                  "0 2px 40px rgba(60,120,200,0.12)",
                  "inset 0 2px 0 rgba(200,220,255,0.15)",
                  "inset 0 -2px 4px rgba(0,0,0,0.3)",
                ].join(", "),
            textShadow: isSpinning ? "none" : "0 2px 4px rgba(0,0,0,0.6), 0 0 12px rgba(100,160,255,0.2)",
            transform: isSpinning ? "translateY(3px)" : "translateY(-3px)",
            border: isSpinning ? "1px solid rgba(255,255,255,0.03)" : "1px solid rgba(150,190,230,0.2)",
          }}
        >
          {!isSpinning && (
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
              <div className="absolute -inset-full"
                style={{
                  background: "linear-gradient(105deg, transparent 40%, rgba(180,210,255,0.1) 45%, rgba(220,240,255,0.18) 50%, rgba(180,210,255,0.1) 55%, transparent 60%)",
                  animation: "shimmerSweep 3s ease-in-out infinite",
                }}
              />
            </div>
          )}
          {isSpinning && (
            <span className="inline-flex gap-1 mr-2">
              <span className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
              <span className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
              <span className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
            </span>
          )}
          <span className="relative z-10">{isSpinning ? "SPINNING" : "SPIN"}</span>
        </div>
      </button>

      {!userId && (
        <p className="text-sm text-muted-foreground z-10">Login with Discord to spin the wheel</p>
      )}

      {/* Prize Dialog with detailed descriptions */}
      <Dialog open={showPrizeDialog} onOpenChange={setShowPrizeDialog}>
        <DialogContent className="sm:max-w-md border-cyan-500/20"
          style={{
            background: "linear-gradient(135deg, #060e1a 0%, #0c1f38 50%, #132d4a 100%)",
            boxShadow: "0 0 80px rgba(0,100,200,0.1)",
          }}>
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-black text-white">
              {wonPrize?.rare ? (
                <span className="flex items-center justify-center gap-2">
                  <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" style={{ filter: "drop-shadow(0 0 6px rgba(255,215,0,0.6))" }} />
                  <span style={{ color: "#FFD700", textShadow: "0 0 12px rgba(255,215,0,0.4)" }}>RARE PRIZE!</span>
                  <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" style={{ filter: "drop-shadow(0 0 6px rgba(255,215,0,0.6))" }} />
                </span>
              ) : (
                <span style={{ textShadow: "0 0 10px rgba(100,160,255,0.3)" }}>🎉 You Won!</span>
              )}
            </DialogTitle>
            <DialogDescription className="text-center text-lg pt-4">
              <span className="flex flex-col items-center gap-4">
                {/* Prize image if available */}
                {wonPrize?.prizeImage && (
                  <img 
                    src={wonPrize.prizeImage} 
                    alt={wonPrize.label}
                    className="w-24 h-24 sm:w-32 sm:h-32 object-contain rounded-xl"
                    style={{ filter: "drop-shadow(0 0 16px rgba(100,255,100,0.3))" }}
                  />
                )}
                <span
                  className={`inline-flex items-center gap-3 px-6 sm:px-8 py-4 rounded-xl text-lg sm:text-xl font-bold ${
                    wonPrize?.rare
                      ? "bg-yellow-500/10 text-yellow-300 border border-yellow-500/30"
                      : "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30"
                  }`}
                  style={{
                    boxShadow: wonPrize?.rare
                      ? "0 0 30px rgba(255,215,0,0.1), inset 0 0 20px rgba(255,215,0,0.05)"
                      : "0 0 30px rgba(0,150,255,0.1), inset 0 0 20px rgba(0,150,255,0.05)",
                  }}
                >
                  {wonPrize?.icon}
                  {wonPrize?.label}
                </span>
                {/* Detailed prize description - only shown in dialog, not Discord */}
                {wonPrize?.winDescription && (
                  <span className="text-sm text-muted-foreground leading-relaxed max-w-sm px-2">
                    {wonPrize.winDescription}
                  </span>
                )}
              </span>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

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
