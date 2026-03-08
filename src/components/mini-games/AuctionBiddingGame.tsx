import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, Gavel, TrendingUp, Users, Clock, Sparkles, AlertTriangle, ArrowUp } from "lucide-react";

// ─── Types ───────────────────────────────────────────────
interface AuctionItem {
  id: string;
  name: string;
  emoji: string;
  description: string;
  basePrice: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  category: string;
}

interface BotBidder {
  name: string;
  avatar: string;
  aggression: number; // 0-1 how likely to bid
  maxMultiplier: number; // how high above base they'll go
  style: "sniper" | "aggressive" | "conservative" | "random";
}

interface BidEntry {
  bidder: string;
  amount: number;
  isPlayer: boolean;
  timestamp: number;
}

type GamePhase = "start" | "auction" | "result" | "summary";

// ─── Auction Items Pool ──────────────────────────────────
const ITEM_POOL: AuctionItem[] = [
  { id: "supercar_1", name: "Zentorno X", emoji: "🏎️", description: "Ultra-rare import supercar with nitro boost", basePrice: 450000, rarity: "legendary", category: "Vehicles" },
  { id: "supercar_2", name: "Turismo Classic", emoji: "🚗", description: "Vintage Italian sports car, mint condition", basePrice: 320000, rarity: "epic", category: "Vehicles" },
  { id: "mansion_1", name: "Vinewood Hills Mansion", emoji: "🏰", description: "5-bedroom estate with ocean view & pool", basePrice: 1200000, rarity: "legendary", category: "Property" },
  { id: "penthouse_1", name: "Eclipse Towers Penthouse", emoji: "🏢", description: "Top floor luxury penthouse, fully furnished", basePrice: 800000, rarity: "epic", category: "Property" },
  { id: "weapon_1", name: "Gold-Plated Desert Eagle", emoji: "🔫", description: "One-of-a-kind custom engraved sidearm", basePrice: 75000, rarity: "epic", category: "Weapons" },
  { id: "weapon_2", name: "Diamond-Encrusted Katana", emoji: "⚔️", description: "Forged by a legendary blacksmith", basePrice: 150000, rarity: "legendary", category: "Weapons" },
  { id: "business_1", name: "Nightclub 'Eclipse'", emoji: "🎵", description: "Downtown nightclub generating $50K/week", basePrice: 950000, rarity: "legendary", category: "Business" },
  { id: "business_2", name: "Los Santos Customs Franchise", emoji: "🔧", description: "Licensed auto shop with exclusive mods", basePrice: 600000, rarity: "epic", category: "Business" },
  { id: "jewelry_1", name: "Rolex Daytona (24K)", emoji: "⌚", description: "Solid gold, diamond bezel, 1 of 50 made", basePrice: 250000, rarity: "epic", category: "Luxury" },
  { id: "jewelry_2", name: "The Blue Hope Diamond", emoji: "💎", description: "45-carat cursed blue diamond necklace", basePrice: 2000000, rarity: "legendary", category: "Luxury" },
  { id: "vehicle_3", name: "Armored Kuruma", emoji: "🚙", description: "Bulletproof sedan, perfect for heists", basePrice: 180000, rarity: "rare", category: "Vehicles" },
  { id: "vehicle_4", name: "Oppressor Mk II", emoji: "🏍️", description: "Flying motorcycle with missile lock-on", basePrice: 500000, rarity: "legendary", category: "Vehicles" },
  { id: "art_1", name: "Banksy Original 'RP Life'", emoji: "🖼️", description: "Authenticated street art canvas", basePrice: 350000, rarity: "epic", category: "Art" },
  { id: "pet_1", name: "White Bengal Tiger Cub", emoji: "🐯", description: "Exotic pet with custom collar", basePrice: 400000, rarity: "legendary", category: "Exotic" },
  { id: "yacht_1", name: "Galaxy Super Yacht", emoji: "🛥️", description: "200ft mega yacht with helipad", basePrice: 3000000, rarity: "legendary", category: "Vehicles" },
  { id: "plane_1", name: "Luxor Deluxe Gold Jet", emoji: "✈️", description: "Gold-plated private jet, champagne bar", basePrice: 1500000, rarity: "legendary", category: "Vehicles" },
  { id: "cloth_1", name: "Supreme x Gucci Collab Set", emoji: "👔", description: "Limited edition full outfit, 1 of 10", basePrice: 90000, rarity: "rare", category: "Fashion" },
  { id: "tech_1", name: "Military Drone System", emoji: "🤖", description: "Surveillance drone with night vision", basePrice: 280000, rarity: "epic", category: "Tech" },
];

// ─── Bot Bidders ─────────────────────────────────────────
const BOT_POOL: BotBidder[] = [
  { name: "ShadowKing", avatar: "👤", aggression: 0.7, maxMultiplier: 2.2, style: "aggressive" },
  { name: "VinewoodVIP", avatar: "🎩", aggression: 0.5, maxMultiplier: 2.8, style: "sniper" },
  { name: "GangsterElite", avatar: "😎", aggression: 0.8, maxMultiplier: 1.8, style: "aggressive" },
  { name: "LuxuryLord", avatar: "💰", aggression: 0.4, maxMultiplier: 3.5, style: "conservative" },
  { name: "StreetRacer99", avatar: "🏁", aggression: 0.6, maxMultiplier: 2.0, style: "random" },
  { name: "DiamondHands", avatar: "💎", aggression: 0.3, maxMultiplier: 4.0, style: "sniper" },
  { name: "NightOwl", avatar: "🦉", aggression: 0.65, maxMultiplier: 2.5, style: "random" },
  { name: "BigSpender", avatar: "🤑", aggression: 0.9, maxMultiplier: 1.6, style: "aggressive" },
  { name: "SilentBidder", avatar: "🤫", aggression: 0.35, maxMultiplier: 3.0, style: "sniper" },
  { name: "TheCollector", avatar: "🏆", aggression: 0.55, maxMultiplier: 2.3, style: "conservative" },
];

const RARITY_COLORS = {
  common: { bg: "from-gray-500 to-slate-600", text: "text-gray-300", border: "border-gray-500/30", glow: "" },
  rare: { bg: "from-blue-500 to-indigo-600", text: "text-blue-300", border: "border-blue-500/30", glow: "shadow-blue-500/20" },
  epic: { bg: "from-purple-500 to-fuchsia-600", text: "text-purple-300", border: "border-purple-500/30", glow: "shadow-purple-500/20" },
  legendary: { bg: "from-yellow-500 to-amber-600", text: "text-yellow-300", border: "border-yellow-500/30", glow: "shadow-yellow-500/30" },
};

const formatCurrency = (n: number) => "$" + n.toLocaleString();

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

// ─── Main Component ──────────────────────────────────────
interface Props {
  onBack: () => void;
  submitScore: (gameType: any, score: number, time?: number) => Promise<void>;
  GameShell: any;
  StartScreen: any;
  EndScreen: any;
  Leaderboard: any;
  game: any;
}

const AuctionBiddingGame = ({ onBack, submitScore, GameShell, StartScreen, EndScreen, Leaderboard, game }: Props) => {
  const [phase, setPhase] = useState<GamePhase>("start");
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [bots, setBots] = useState<BotBidder[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [budget, setBudget] = useState(5000000);
  const [initialBudget] = useState(5000000);
  const [currentBid, setCurrentBid] = useState(0);
  const [playerBid, setPlayerBid] = useState("");
  const [bidHistory, setBidHistory] = useState<BidEntry[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [highestBidder, setHighestBidder] = useState<string>("None");
  const [wonItems, setWonItems] = useState<{ item: AuctionItem; price: number }[]>([]);
  const [lostItems, setLostItems] = useState<AuctionItem[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [score, setScore] = useState(0);
  const [showBidFlash, setShowBidFlash] = useState(false);
  const [bidIncrement, setBidIncrement] = useState(0);
  const [isPlayerHighest, setIsPlayerHighest] = useState(false);
  const [auctioneerMessage, setAuctioneerMessage] = useState("Welcome to the auction!");
  const [goingCount, setGoingCount] = useState(0); // 0, 1 (going once), 2 (going twice), 3 (sold)
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const botTimerRef = useRef<NodeJS.Timeout | null>(null);
  const bidHistoryRef = useRef<HTMLDivElement>(null);

  const TOTAL_ROUNDS = 5;

  const startGame = useCallback(() => {
    const selectedItems = shuffle(ITEM_POOL).slice(0, TOTAL_ROUNDS);
    const selectedBots = shuffle(BOT_POOL).slice(0, 5);
    setItems(selectedItems);
    setBots(selectedBots);
    setCurrentRound(0);
    setBudget(5000000);
    setWonItems([]);
    setLostItems([]);
    setTotalSpent(0);
    setScore(0);
    setPhase("auction");
    startRound(selectedItems[0], selectedBots);
  }, []);

  const startRound = (item: AuctionItem, activeBots: BotBidder[]) => {
    const startBid = Math.round(item.basePrice * 0.5);
    setCurrentBid(startBid);
    setPlayerBid("");
    setBidHistory([{ bidder: "Auctioneer", amount: startBid, isPlayer: false, timestamp: Date.now() }]);
    setTimeLeft(30);
    setHighestBidder("Auctioneer");
    setIsPlayerHighest(false);
    setGoingCount(0);
    setBidIncrement(Math.round(item.basePrice * 0.05));
    setAuctioneerMessage(`Starting bid for ${item.name}: ${formatCurrency(startBid)}!`);
  };

  // Timer countdown
  useEffect(() => {
    if (phase !== "auction") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, currentRound]);

  // Going once/twice/sold logic
  useEffect(() => {
    if (phase !== "auction") return;
    if (timeLeft === 10 && goingCount === 0) {
      setGoingCount(1);
      setAuctioneerMessage(`Going once! Current bid: ${formatCurrency(currentBid)}`);
    } else if (timeLeft === 5 && goingCount <= 1) {
      setGoingCount(2);
      setAuctioneerMessage(`Going TWICE! Last chance!`);
    } else if (timeLeft === 0) {
      setGoingCount(3);
      handleRoundEnd();
    }
  }, [timeLeft, phase]);

  // Bot bidding AI
  useEffect(() => {
    if (phase !== "auction" || !items[currentRound]) return;
    const item = items[currentRound];

    botTimerRef.current = setInterval(() => {
      if (timeLeft <= 2) return;

      setBots(currentBots => {
        const eligibleBots = currentBots.filter(bot => {
          const maxBid = item.basePrice * bot.maxMultiplier;
          return maxBid > currentBid && Math.random() < bot.aggression * 0.3;
        });

        if (eligibleBots.length > 0) {
          const bot = eligibleBots[Math.floor(Math.random() * eligibleBots.length)];
          let newBid: number;
          const increment = Math.round(item.basePrice * 0.05);

          switch (bot.style) {
            case "aggressive":
              newBid = currentBid + increment * (2 + Math.floor(Math.random() * 3));
              break;
            case "sniper":
              newBid = currentBid + increment;
              break;
            case "conservative":
              newBid = currentBid + increment;
              break;
            default:
              newBid = currentBid + increment * (1 + Math.floor(Math.random() * 4));
          }

          const maxBid = Math.round(item.basePrice * bot.maxMultiplier);
          newBid = Math.min(newBid, maxBid);

          if (newBid > currentBid) {
            setCurrentBid(newBid);
            setHighestBidder(bot.name);
            setIsPlayerHighest(false);
            setGoingCount(0);
            setTimeLeft(prev => Math.min(prev + 5, 30));
            setBidHistory(prev => [...prev, { bidder: `${bot.avatar} ${bot.name}`, amount: newBid, isPlayer: false, timestamp: Date.now() }]);
            setAuctioneerMessage(`${bot.name} bids ${formatCurrency(newBid)}!`);
            setShowBidFlash(true);
            setTimeout(() => setShowBidFlash(false), 300);
          }
        }

        return currentBots;
      });
    }, 2000 + Math.random() * 3000);

    return () => { if (botTimerRef.current) clearInterval(botTimerRef.current); };
  }, [phase, currentRound, currentBid, timeLeft, items]);

  // Scroll bid history
  useEffect(() => {
    if (bidHistoryRef.current) {
      bidHistoryRef.current.scrollTop = bidHistoryRef.current.scrollHeight;
    }
  }, [bidHistory]);

  const handlePlayerBid = () => {
    const amount = parseInt(playerBid.replace(/,/g, ""));
    if (isNaN(amount) || amount <= currentBid) {
      setAuctioneerMessage(`Bid must be higher than ${formatCurrency(currentBid)}!`);
      return;
    }
    if (amount > budget) {
      setAuctioneerMessage("You don't have enough budget!");
      return;
    }
    const minBid = currentBid + bidIncrement;
    if (amount < minBid) {
      setAuctioneerMessage(`Minimum bid increment is ${formatCurrency(bidIncrement)}`);
      return;
    }

    setCurrentBid(amount);
    setHighestBidder("You");
    setIsPlayerHighest(true);
    setGoingCount(0);
    setTimeLeft(prev => Math.min(prev + 5, 30));
    setBidHistory(prev => [...prev, { bidder: "🙋 You", amount, isPlayer: true, timestamp: Date.now() }]);
    setAuctioneerMessage(`Player bids ${formatCurrency(amount)}! Do I hear more?`);
    setPlayerBid("");
    setShowBidFlash(true);
    setTimeout(() => setShowBidFlash(false), 300);
  };

  const handleQuickBid = (multiplier: number) => {
    const amount = currentBid + Math.round(bidIncrement * multiplier);
    if (amount > budget) {
      setAuctioneerMessage("You don't have enough budget!");
      return;
    }
    setCurrentBid(amount);
    setHighestBidder("You");
    setIsPlayerHighest(true);
    setGoingCount(0);
    setTimeLeft(prev => Math.min(prev + 5, 30));
    setBidHistory(prev => [...prev, { bidder: "🙋 You", amount, isPlayer: true, timestamp: Date.now() }]);
    setAuctioneerMessage(`Player bids ${formatCurrency(amount)}!`);
    setPlayerBid("");
    setShowBidFlash(true);
    setTimeout(() => setShowBidFlash(false), 300);
  };

  const handleRoundEnd = () => {
    if (botTimerRef.current) clearInterval(botTimerRef.current);
    const item = items[currentRound];

    if (isPlayerHighest) {
      const price = currentBid;
      setBudget(prev => prev - price);
      setTotalSpent(prev => prev + price);
      setWonItems(prev => [...prev, { item, price }]);
      // Score: more points for getting good deals (lower % of base price = better)
      const dealQuality = Math.max(0, (item.basePrice * 2 - price) / item.basePrice);
      const rarityMultiplier = item.rarity === "legendary" ? 4 : item.rarity === "epic" ? 3 : item.rarity === "rare" ? 2 : 1;
      const roundScore = Math.round(dealQuality * 1000 * rarityMultiplier);
      setScore(prev => prev + roundScore);
      setAuctioneerMessage(`SOLD to the player for ${formatCurrency(price)}! 🎉`);
    } else {
      setLostItems(prev => [...prev, item]);
      setAuctioneerMessage(`SOLD to ${highestBidder} for ${formatCurrency(currentBid)}!`);
    }

    setPhase("result");
  };

  const nextRound = () => {
    const next = currentRound + 1;
    if (next >= TOTAL_ROUNDS) {
      // Submit final score
      submitScore("auction_bidding" as any, score);
      setPhase("summary");
    } else {
      setCurrentRound(next);
      setPhase("auction");
      startRound(items[next], bots);
    }
  };

  // ─── Render: Start ─────────────────────────────────────
  if (phase === "start") {
    return <StartScreen title={game.title} description={game.description} icon={game.icon} gradient={game.gradient} glow={game.glow} onStart={startGame} onBack={onBack} gameType={"auction_bidding" as any} />;
  }

  const currentItem = items[currentRound];
  const rarityStyle = currentItem ? RARITY_COLORS[currentItem.rarity] : RARITY_COLORS.common;
  const timerPercent = (timeLeft / 30) * 100;
  const budgetPercent = (budget / initialBudget) * 100;

  // ─── Render: Result ────────────────────────────────────
  if (phase === "result" && currentItem) {
    return (
      <GameShell onBack={onBack} title={game.title} icon={game.icon} gradient={game.gradient}>
        <div className="max-w-2xl mx-auto space-y-6">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-4">
            <div className="text-6xl mb-2">{currentItem.emoji}</div>
            {isPlayerHighest ? (
              <>
                <h2 className="text-3xl font-bold text-green-400">You Won! 🎉</h2>
                <p className="text-muted-foreground text-lg">
                  {currentItem.name} for {formatCurrency(currentBid)}
                </p>
                <Badge className={`bg-gradient-to-r ${rarityStyle.bg} border-0 text-sm px-4 py-1`}>
                  {currentItem.rarity.toUpperCase()}
                </Badge>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-bold text-red-400">Outbid! 😤</h2>
                <p className="text-muted-foreground text-lg">
                  {highestBidder} won {currentItem.name} for {formatCurrency(currentBid)}
                </p>
              </>
            )}

            <div className="flex justify-center gap-4 mt-6">
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase">Budget Left</p>
                <p className="text-xl font-bold text-green-400">{formatCurrency(budget)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase">Score</p>
                <p className="text-xl font-bold text-yellow-400">{score}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase">Round</p>
                <p className="text-xl font-bold">{currentRound + 1}/{TOTAL_ROUNDS}</p>
              </div>
            </div>

            <Button size="lg" onClick={nextRound} className="bg-gradient-to-r from-amber-500 to-yellow-500 border-0 text-black font-bold mt-4">
              {currentRound + 1 >= TOTAL_ROUNDS ? "View Results" : "Next Item →"}
            </Button>
          </motion.div>
        </div>
      </GameShell>
    );
  }

  // ─── Render: Summary ───────────────────────────────────
  if (phase === "summary") {
    const totalValue = wonItems.reduce((sum, w) => sum + w.item.basePrice, 0);
    const savings = totalValue - totalSpent;
    return (
      <EndScreen
        won={wonItems.length > 0}
        title={wonItems.length > 0 ? `Won ${wonItems.length} Items!` : "Better Luck Next Time!"}
        subtitle={`Spent ${formatCurrency(totalSpent)} on ${wonItems.length} items worth ${formatCurrency(totalValue)}. ${savings > 0 ? `Saved ${formatCurrency(savings)}!` : ""} Score: ${score}`}
        onReplay={startGame}
        onBack={onBack}
        gameType={"auction_bidding" as any}
      />
    );
  }

  // ─── Render: Auction ───────────────────────────────────
  if (!currentItem) return null;

  return (
    <GameShell onBack={onBack} title={game.title} icon={game.icon} gradient={game.gradient}
      badges={
        <div className="flex items-center gap-2">
          <Badge className="bg-green-900/40 text-green-300 border-green-500/30 font-mono">
            <DollarSign className="w-3 h-3 mr-1" /> {formatCurrency(budget)}
          </Badge>
          <Badge className="bg-yellow-900/40 text-yellow-300 border-yellow-500/30 font-mono">
            <Sparkles className="w-3 h-3 mr-1" /> {score} pts
          </Badge>
          <Badge className="bg-muted/40 border-muted-foreground/20 font-mono">
            Round {currentRound + 1}/{TOTAL_ROUNDS}
          </Badge>
        </div>
      }>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Item Display */}
        <div className="lg:col-span-2 space-y-4">
          {/* Item Card */}
          <motion.div
            key={currentItem.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative rounded-2xl border ${rarityStyle.border} overflow-hidden ${rarityStyle.glow} shadow-2xl`}
            style={{ background: "linear-gradient(180deg, hsl(220 20% 10%) 0%, hsl(220 25% 5%) 100%)" }}
          >
            {/* Rarity glow */}
            <div className={`absolute inset-0 bg-gradient-to-br ${rarityStyle.bg} opacity-[0.06] pointer-events-none`} />
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${rarityStyle.bg}`} />

            <div className="p-6">
              <div className="flex items-start gap-6">
                {/* Item image/emoji */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className={`w-28 h-28 rounded-2xl bg-gradient-to-br ${rarityStyle.bg} flex items-center justify-center shadow-xl ${rarityStyle.glow} flex-shrink-0`}
                >
                  <span className="text-5xl">{currentItem.emoji}</span>
                </motion.div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={`bg-gradient-to-r ${rarityStyle.bg} border-0 text-xs uppercase tracking-wider`}>
                      {currentItem.rarity}
                    </Badge>
                    <Badge variant="outline" className="text-xs border-muted-foreground/20">{currentItem.category}</Badge>
                  </div>
                  <h3 className="text-2xl font-bold mb-1">{currentItem.name}</h3>
                  <p className="text-muted-foreground text-sm">{currentItem.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Estimated Value: <span className="text-foreground font-mono">{formatCurrency(currentItem.basePrice)}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Timer bar */}
            <div className="px-6 pb-4">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Clock className={`w-4 h-4 ${timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-cyan-400"}`} />
                  <span className={`font-mono text-sm font-bold ${timeLeft <= 10 ? "text-red-400" : "text-cyan-400"}`}>
                    {timeLeft}s
                  </span>
                </div>
                {goingCount > 0 && (
                  <motion.span
                    initial={{ scale: 0.8 }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="text-sm font-bold text-orange-400"
                  >
                    {goingCount === 1 ? "⚡ GOING ONCE!" : goingCount === 2 ? "⚡⚡ GOING TWICE!" : "🔨 SOLD!"}
                  </motion.span>
                )}
              </div>
              <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    timeLeft <= 5 ? "bg-gradient-to-r from-red-500 to-red-600" :
                    timeLeft <= 10 ? "bg-gradient-to-r from-orange-500 to-amber-500" :
                    "bg-gradient-to-r from-cyan-500 to-blue-500"
                  }`}
                  style={{ width: `${timerPercent}%` }}
                />
              </div>
            </div>
          </motion.div>

          {/* Current Bid Display */}
          <div className={`rounded-xl border p-4 text-center transition-all ${
            showBidFlash ? "border-yellow-500/50 bg-yellow-500/5" : "border-white/[0.06] bg-white/[0.02]"
          }`}>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Current Highest Bid</p>
            <motion.p
              key={currentBid}
              initial={{ scale: 1.2, color: "#facc15" }}
              animate={{ scale: 1, color: "#ffffff" }}
              className="text-4xl md:text-5xl font-black font-mono"
              style={{ textShadow: "0 0 20px hsl(50 90% 55% / 0.3)" }}
            >
              {formatCurrency(currentBid)}
            </motion.p>
            <p className={`text-sm mt-1 font-medium ${isPlayerHighest ? "text-green-400" : "text-red-400"}`}>
              {isPlayerHighest ? "🏆 You're the highest bidder!" : `Highest: ${highestBidder}`}
            </p>
          </div>

          {/* Auctioneer Message */}
          <AnimatePresence mode="wait">
            <motion.div
              key={auctioneerMessage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20"
            >
              <Gavel className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <p className="text-sm font-medium text-amber-200">{auctioneerMessage}</p>
            </motion.div>
          </AnimatePresence>

          {/* Bidding Controls */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder={`Min bid: ${formatCurrency(currentBid + bidIncrement)}`}
                value={playerBid}
                onChange={e => setPlayerBid(e.target.value.replace(/[^0-9]/g, ""))}
                onKeyDown={e => e.key === "Enter" && handlePlayerBid()}
                className="font-mono text-lg bg-background/50"
              />
              <Button onClick={handlePlayerBid} disabled={timeLeft === 0} className="bg-gradient-to-r from-green-600 to-emerald-600 border-0 px-6 font-bold">
                <Gavel className="w-4 h-4 mr-2" /> BID
              </Button>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => handleQuickBid(1)} disabled={timeLeft === 0 || currentBid + bidIncrement > budget}
                className="border-green-500/30 text-green-300 hover:bg-green-500/10 font-mono text-xs">
                <ArrowUp className="w-3 h-3 mr-1" /> +{formatCurrency(bidIncrement)}
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleQuickBid(2)} disabled={timeLeft === 0 || currentBid + bidIncrement * 2 > budget}
                className="border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/10 font-mono text-xs">
                <ArrowUp className="w-3 h-3 mr-1" /> +{formatCurrency(bidIncrement * 2)}
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleQuickBid(5)} disabled={timeLeft === 0 || currentBid + bidIncrement * 5 > budget}
                className="border-orange-500/30 text-orange-300 hover:bg-orange-500/10 font-mono text-xs">
                <ArrowUp className="w-3 h-3 mr-1" /> +{formatCurrency(bidIncrement * 5)}
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleQuickBid(10)} disabled={timeLeft === 0 || currentBid + bidIncrement * 10 > budget}
                className="border-red-500/30 text-red-300 hover:bg-red-500/10 font-mono text-xs">
                <TrendingUp className="w-3 h-3 mr-1" /> +{formatCurrency(bidIncrement * 10)}
              </Button>
            </div>
          </div>
        </div>

        {/* Right: Bid History & Budget */}
        <div className="space-y-4">
          {/* Budget */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Budget</span>
              <span className={`font-mono font-bold text-sm ${budgetPercent < 20 ? "text-red-400" : "text-green-400"}`}>
                {formatCurrency(budget)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${budgetPercent < 20 ? "bg-red-500" : budgetPercent < 50 ? "bg-yellow-500" : "bg-green-500"}`}
                style={{ width: `${budgetPercent}%` }} />
            </div>
          </div>

          {/* Live Bid Feed */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <div className="p-3 border-b border-white/[0.06] flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-bold uppercase tracking-wider text-cyan-400">Live Bids</span>
              <span className="ml-auto text-[10px] text-red-400 font-mono animate-pulse">● LIVE</span>
            </div>
            <div ref={bidHistoryRef} className="max-h-[350px] overflow-y-auto p-3 space-y-1.5">
              <AnimatePresence>
                {bidHistory.map((bid, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                      bid.isPlayer
                        ? "bg-green-500/10 border border-green-500/20"
                        : "bg-white/[0.02] border border-white/[0.03]"
                    }`}
                  >
                    <span className="font-medium truncate flex-1">{bid.bidder}</span>
                    <span className={`font-mono font-bold ${bid.isPlayer ? "text-green-400" : "text-yellow-400"}`}>
                      {formatCurrency(bid.amount)}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Won Items */}
          {wonItems.length > 0 && (
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-3">
              <p className="text-xs text-green-400 uppercase tracking-wider mb-2 font-bold">🏆 Won Items</p>
              {wonItems.map((w, i) => (
                <div key={i} className="flex items-center gap-2 text-xs py-1">
                  <span>{w.item.emoji}</span>
                  <span className="truncate flex-1">{w.item.name}</span>
                  <span className="font-mono text-green-400">{formatCurrency(w.price)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Leaderboard gameType={"auction_bidding" as any} />
    </GameShell>
  );
};

export default AuctionBiddingGame;
