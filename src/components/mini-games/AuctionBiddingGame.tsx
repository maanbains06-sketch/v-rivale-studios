import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, Gavel, Eye, EyeOff, Package, TrendingUp, TrendingDown, Users, Clock, Sparkles, ArrowUp, Volume2, ChevronRight, Star, Zap, Trophy } from "lucide-react";

// ─── Types ───────────────────────────────────────────────
interface CrateItem {
  name: string;
  emoji: string;
  value: number;
  rarity: "junk" | "common" | "rare" | "epic" | "legendary";
}

interface MysteryCreate {
  id: string;
  name: string;
  emoji: string;
  theme: string;
  description: string;
  peekItems: CrateItem[]; // 1-2 items visible during peek
  hiddenItems: CrateItem[]; // rest revealed after winning
  totalValue: number;
  difficulty: "easy" | "medium" | "hard";
}

interface BotBidder {
  name: string;
  avatar: string;
  personality: string;
  aggression: number;
  maxBudgetPercent: number; // % of crate value they'll go up to
  bluffChance: number; // chance they bid beyond value
  catchphrase: string;
}

interface BidEntry {
  bidder: string;
  amount: number;
  isPlayer: boolean;
  reaction?: string;
}

type GamePhase = "start" | "peek" | "bidding" | "reveal" | "summary";

// ─── Item Pools ──────────────────────────────────────────
const JUNK_ITEMS: CrateItem[] = [
  { name: "Broken TV", emoji: "📺", value: 25, rarity: "junk" },
  { name: "Old Newspapers", emoji: "📰", value: 5, rarity: "junk" },
  { name: "Rusty Toolbox", emoji: "🧰", value: 40, rarity: "junk" },
  { name: "Moth-Eaten Coat", emoji: "🧥", value: 10, rarity: "junk" },
  { name: "Broken Chair", emoji: "🪑", value: 15, rarity: "junk" },
  { name: "Empty Boxes", emoji: "📦", value: 2, rarity: "junk" },
  { name: "Old Shoes", emoji: "👟", value: 8, rarity: "junk" },
  { name: "Cracked Mirror", emoji: "🪞", value: 12, rarity: "junk" },
  { name: "Dead Plant", emoji: "🪴", value: 3, rarity: "junk" },
  { name: "VHS Tapes", emoji: "📼", value: 20, rarity: "junk" },
];

const COMMON_ITEMS: CrateItem[] = [
  { name: "Vintage Radio", emoji: "📻", value: 150, rarity: "common" },
  { name: "Antique Clock", emoji: "🕰️", value: 200, rarity: "common" },
  { name: "Leather Jacket", emoji: "🧥", value: 180, rarity: "common" },
  { name: "Guitar", emoji: "🎸", value: 300, rarity: "common" },
  { name: "Silverware Set", emoji: "🍽️", value: 250, rarity: "common" },
  { name: "Vinyl Records", emoji: "💿", value: 120, rarity: "common" },
  { name: "Desk Lamp", emoji: "💡", value: 90, rarity: "common" },
  { name: "Camping Gear", emoji: "⛺", value: 220, rarity: "common" },
  { name: "Power Tools", emoji: "🔧", value: 350, rarity: "common" },
  { name: "Typewriter", emoji: "⌨️", value: 275, rarity: "common" },
];

const RARE_ITEMS: CrateItem[] = [
  { name: "Signed Baseball", emoji: "⚾", value: 800, rarity: "rare" },
  { name: "Antique Vase", emoji: "🏺", value: 1200, rarity: "rare" },
  { name: "Vintage Camera", emoji: "📷", value: 950, rarity: "rare" },
  { name: "First Edition Book", emoji: "📚", value: 1500, rarity: "rare" },
  { name: "Gold Pocket Watch", emoji: "⌚", value: 1800, rarity: "rare" },
  { name: "Ivory Chess Set", emoji: "♟️", value: 2000, rarity: "rare" },
  { name: "Oil Painting", emoji: "🖼️", value: 2500, rarity: "rare" },
  { name: "Samurai Sword", emoji: "⚔️", value: 3000, rarity: "rare" },
];

const EPIC_ITEMS: CrateItem[] = [
  { name: "Diamond Ring", emoji: "💍", value: 5000, rarity: "epic" },
  { name: "Rolex Watch", emoji: "⌚", value: 8000, rarity: "epic" },
  { name: "Sports Car Keys", emoji: "🔑", value: 15000, rarity: "epic" },
  { name: "Gold Bars (2)", emoji: "🥇", value: 12000, rarity: "epic" },
  { name: "Rare Coin Collection", emoji: "🪙", value: 7000, rarity: "epic" },
  { name: "Fabergé Egg", emoji: "🥚", value: 20000, rarity: "epic" },
];

const LEGENDARY_ITEMS: CrateItem[] = [
  { name: "Picasso Sketch", emoji: "🎨", value: 50000, rarity: "legendary" },
  { name: "Vintage Ferrari Engine", emoji: "🏎️", value: 75000, rarity: "legendary" },
  { name: "1952 Mickey Mantle Card", emoji: "🃏", value: 100000, rarity: "legendary" },
  { name: "Ancient Roman Artifact", emoji: "🏛️", value: 60000, rarity: "legendary" },
  { name: "Elvis' Gold Record", emoji: "🎵", value: 45000, rarity: "legendary" },
];

// ─── Bot Pool ────────────────────────────────────────────
const BOT_POOL: BotBidder[] = [
  { name: "Rico 'The Shark'", avatar: "🦈", personality: "Ruthless veteran buyer", aggression: 0.85, maxBudgetPercent: 1.3, bluffChance: 0.3, catchphrase: "That's mine, pal!" },
  { name: "Mama Rosa", avatar: "👩‍🍳", personality: "Savvy antiques dealer", aggression: 0.5, maxBudgetPercent: 0.9, bluffChance: 0.1, catchphrase: "I know what this is worth..." },
  { name: "Duke", avatar: "🤠", personality: "Reckless cowboy bidder", aggression: 0.9, maxBudgetPercent: 1.5, bluffChance: 0.5, catchphrase: "YEEHAW! Let's go!" },
  { name: "Silent Mike", avatar: "🤫", personality: "Last-second sniper", aggression: 0.3, maxBudgetPercent: 1.1, bluffChance: 0.05, catchphrase: "..." },
  { name: "Flashy Felix", avatar: "✨", personality: "Showoff with deep pockets", aggression: 0.7, maxBudgetPercent: 1.8, bluffChance: 0.4, catchphrase: "Money is no object!" },
  { name: "Professor Oak", avatar: "🧓", personality: "Calculated collector", aggression: 0.4, maxBudgetPercent: 0.85, bluffChance: 0.02, catchphrase: "Hmm, interesting..." },
  { name: "Neon Nikki", avatar: "💅", personality: "Aggressive newcomer", aggression: 0.75, maxBudgetPercent: 1.2, bluffChance: 0.35, catchphrase: "Don't test me!" },
  { name: "Big Tony", avatar: "🏋️", personality: "Intimidating bidder", aggression: 0.65, maxBudgetPercent: 1.4, bluffChance: 0.25, catchphrase: "Step aside, kid." },
];

const RARITY_CONFIG = {
  junk: { color: "from-zinc-500 to-stone-600", text: "text-zinc-400", label: "JUNK", border: "border-zinc-500/30" },
  common: { color: "from-green-500 to-emerald-600", text: "text-green-400", label: "COMMON", border: "border-green-500/30" },
  rare: { color: "from-blue-500 to-cyan-600", text: "text-blue-400", label: "RARE", border: "border-blue-500/30" },
  epic: { color: "from-purple-500 to-fuchsia-600", text: "text-purple-400", label: "EPIC", border: "border-purple-500/30" },
  legendary: { color: "from-amber-400 to-yellow-500", text: "text-amber-400", label: "LEGENDARY", border: "border-amber-500/30" },
};

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
const pick = <T,>(arr: T[], n: number): T[] => shuffle(arr).slice(0, n);
const fmt = (n: number) => "$" + n.toLocaleString();

// ─── Generate Mystery Crates ─────────────────────────────
const CRATE_THEMES = [
  { name: "Abandoned Storage Unit", emoji: "🚪", theme: "storage" },
  { name: "Estate Sale Lot", emoji: "🏚️", theme: "estate" },
  { name: "Warehouse Clearance", emoji: "🏭", theme: "warehouse" },
  { name: "Celebrity Auction Box", emoji: "⭐", theme: "celebrity" },
  { name: "Police Seizure Lot", emoji: "🚔", theme: "police" },
  { name: "Antique Dealer's Vault", emoji: "🗝️", theme: "antique" },
  { name: "Mystery Container", emoji: "📦", theme: "mystery" },
  { name: "Collector's Lockbox", emoji: "🔐", theme: "collector" },
];

function generateCrate(difficulty: "easy" | "medium" | "hard", round: number): MysteryCreate {
  const theme = CRATE_THEMES[Math.floor(Math.random() * CRATE_THEMES.length)];
  let allItems: CrateItem[] = [];

  if (difficulty === "easy") {
    allItems = [...pick(JUNK_ITEMS, 2), ...pick(COMMON_ITEMS, 2), ...pick(RARE_ITEMS, Math.random() > 0.5 ? 1 : 0)];
  } else if (difficulty === "medium") {
    allItems = [...pick(JUNK_ITEMS, 1), ...pick(COMMON_ITEMS, 1), ...pick(RARE_ITEMS, 2), ...pick(EPIC_ITEMS, Math.random() > 0.4 ? 1 : 0)];
  } else {
    allItems = [...pick(COMMON_ITEMS, 1), ...pick(RARE_ITEMS, 1), ...pick(EPIC_ITEMS, 1), ...pick(LEGENDARY_ITEMS, Math.random() > 0.3 ? 1 : 0)];
    if (allItems.length < 4) allItems.push(...pick(RARE_ITEMS, 1));
  }

  allItems = shuffle(allItems);

  // Show 1-2 items during peek (mix of good and bad to create uncertainty)
  const peekCount = Math.random() > 0.5 ? 2 : 1;
  const peekItems = allItems.slice(0, peekCount);
  const hiddenItems = allItems.slice(peekCount);
  const totalValue = allItems.reduce((s, i) => s + i.value, 0);

  return {
    id: `crate_${round}_${Date.now()}`,
    name: `${theme.name} #${round + 1}`,
    emoji: theme.emoji,
    theme: theme.theme,
    description: `${allItems.length} items inside • Difficulty: ${difficulty.toUpperCase()}`,
    peekItems,
    hiddenItems,
    totalValue,
    difficulty,
  };
}

// ─── Component ───────────────────────────────────────────
interface Props {
  onBack: () => void;
  submitScore: (gameType: any, score: number, time?: number) => Promise<void>;
  GameShell: any;
  StartScreen: any;
  EndScreen: any;
  Leaderboard: any;
  game: any;
}

const TOTAL_ROUNDS = 7;
const STARTING_CASH = 50000;
const PEEK_DURATION = 8; // seconds to examine
const BID_DURATION = 25; // seconds for bidding

const AuctionBiddingGame = ({ onBack, submitScore, GameShell, StartScreen, EndScreen, Leaderboard, game }: Props) => {
  const [phase, setPhase] = useState<GamePhase>("start");
  const [crates, setCrates] = useState<MysteryCreate[]>([]);
  const [activeBots, setActiveBots] = useState<BotBidder[]>([]);
  const [round, setRound] = useState(0);
  const [cash, setCash] = useState(STARTING_CASH);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [timer, setTimer] = useState(0);
  const [currentBid, setCurrentBid] = useState(0);
  const [highestBidder, setHighestBidder] = useState("");
  const [isPlayerHighest, setIsPlayerHighest] = useState(false);
  const [bidHistory, setBidHistory] = useState<BidEntry[]>([]);
  const [botReaction, setBotReaction] = useState("");
  const [revealedItems, setRevealedItems] = useState<CrateItem[]>([]);
  const [revealIndex, setRevealIndex] = useState(-1);
  const [roundResults, setRoundResults] = useState<{ crate: MysteryCreate; won: boolean; paidPrice: number; profit: number }[]>([]);
  const [goingCount, setGoingCount] = useState(0);
  const [passed, setPassed] = useState(false);
  const [score, setScore] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const botRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bidRef = useRef<HTMLDivElement>(null);
  const currentBidRef = useRef(0);
  const highestBidderRef = useRef("");
  const isPlayerHighestRef = useRef(false);
  const passedRef = useRef(false);

  // Keep refs in sync
  useEffect(() => { currentBidRef.current = currentBid; }, [currentBid]);
  useEffect(() => { highestBidderRef.current = highestBidder; }, [highestBidder]);
  useEffect(() => { isPlayerHighestRef.current = isPlayerHighest; }, [isPlayerHighest]);
  useEffect(() => { passedRef.current = passed; }, [passed]);

  const clearTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (botRef.current) clearInterval(botRef.current);
  };

  const startGame = useCallback(() => {
    const difficulties: ("easy" | "medium" | "hard")[] = ["easy", "easy", "medium", "medium", "medium", "hard", "hard"];
    const generated = shuffle(difficulties).map((d, i) => generateCrate(d, i));
    setCrates(generated);
    setActiveBots(pick(BOT_POOL, 4));
    setRound(0);
    setCash(STARTING_CASH);
    setTotalProfit(0);
    setTotalSpent(0);
    setTotalEarned(0);
    setRoundResults([]);
    setScore(0);
    startPeek(generated[0]);
  }, []);

  const startPeek = (crate: MysteryCreate) => {
    setPhase("peek");
    setTimer(PEEK_DURATION);
    setBidHistory([]);
    setRevealedItems([]);
    setRevealIndex(-1);
    setGoingCount(0);
    setPassed(false);
    passedRef.current = false;
    setBotReaction("");
    clearTimers();

    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Auto-transition from peek to bidding
  useEffect(() => {
    if (phase === "peek" && timer === 0) {
      startBidding();
    }
  }, [phase, timer]);

  const startBidding = () => {
    if (!crates[round]) return;
    const crate = crates[round];
    const startBid = Math.round(crate.totalValue * (0.15 + Math.random() * 0.15));
    setPhase("bidding");
    setCurrentBid(startBid);
    currentBidRef.current = startBid;
    setHighestBidder("Auctioneer");
    highestBidderRef.current = "Auctioneer";
    setIsPlayerHighest(false);
    isPlayerHighestRef.current = false;
    setTimer(BID_DURATION);
    setGoingCount(0);
    setBidHistory([{ bidder: "🔨 Auctioneer", amount: startBid, isPlayer: false, reaction: "Opening bid!" }]);

    clearTimers();
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Bot bidding loop
    botRef.current = setInterval(() => {
      if (passedRef.current) return;
      
      const cb = currentBidRef.current;
      const crateVal = crate.totalValue;

      const eligible = activeBots.filter(bot => {
        const maxBid = crateVal * bot.maxBudgetPercent;
        const willBid = Math.random() < bot.aggression * 0.25;
        return willBid && maxBid > cb && !isPlayerHighestRef.current;
      });

      // Sometimes bots bid even when player is highest
      const contestEligible = activeBots.filter(bot => {
        const maxBid = crateVal * bot.maxBudgetPercent;
        return Math.random() < bot.aggression * 0.15 && maxBid > cb;
      });

      const candidates = isPlayerHighestRef.current ? contestEligible : eligible;

      if (candidates.length > 0) {
        const bot = candidates[Math.floor(Math.random() * candidates.length)];
        const increment = Math.round(crateVal * (0.03 + Math.random() * 0.07));
        let newBid = cb + increment;
        const maxBid = Math.round(crateVal * bot.maxBudgetPercent);
        
        // Bluff: sometimes bid beyond value
        const isBluff = Math.random() < bot.bluffChance;
        if (!isBluff) newBid = Math.min(newBid, maxBid);
        
        if (newBid > cb) {
          currentBidRef.current = newBid;
          highestBidderRef.current = bot.name;
          isPlayerHighestRef.current = false;
          setCurrentBid(newBid);
          setHighestBidder(bot.name);
          setIsPlayerHighest(false);
          setGoingCount(0);
          setTimer(prev => Math.min(prev + 4, BID_DURATION));

          const reactions = [bot.catchphrase, "💪", "Come on!", "That's nothing!", "Keep up!", "Too rich for you?", "I want this!"];
          const reaction = reactions[Math.floor(Math.random() * reactions.length)];
          setBotReaction(`${bot.avatar} ${bot.name}: "${reaction}"`);
          setBidHistory(prev => [...prev, { bidder: `${bot.avatar} ${bot.name}`, amount: newBid, isPlayer: false, reaction }]);
        }
      }
    }, 1800 + Math.random() * 2500);
  };

  // Going once/twice/sold
  useEffect(() => {
    if (phase !== "bidding") return;
    if (timer === 8 && goingCount === 0) {
      setGoingCount(1);
    } else if (timer === 4 && goingCount <= 1) {
      setGoingCount(2);
    } else if (timer === 0) {
      setGoingCount(3);
      endBidding();
    }
  }, [timer, phase]);

  const playerBid = (multiplier: number) => {
    if (phase !== "bidding" || passed) return;
    const crate = crates[round];
    const increment = Math.round(crate.totalValue * 0.05);
    const amount = currentBid + Math.round(increment * multiplier);
    if (amount > cash) {
      setBotReaction("💸 Not enough cash!");
      return;
    }
    setCurrentBid(amount);
    currentBidRef.current = amount;
    setHighestBidder("You");
    highestBidderRef.current = "You";
    setIsPlayerHighest(true);
    isPlayerHighestRef.current = true;
    setGoingCount(0);
    setTimer(prev => Math.min(prev + 4, BID_DURATION));
    setBidHistory(prev => [...prev, { bidder: "🙋 You", amount, isPlayer: true }]);
    setBotReaction("");
  };

  const handlePass = () => {
    setPassed(true);
    passedRef.current = true;
    setIsPlayerHighest(false);
    isPlayerHighestRef.current = false;
    setBotReaction("Player passed! 👋");
  };

  const endBidding = () => {
    clearTimers();
    const crate = crates[round];
    const won = isPlayerHighestRef.current && !passedRef.current;
    const paidPrice = won ? currentBidRef.current : 0;
    const profit = won ? crate.totalValue - paidPrice : 0;

    if (won) {
      setCash(prev => prev - paidPrice);
      setTotalSpent(prev => prev + paidPrice);
      setTotalEarned(prev => prev + crate.totalValue);
      setTotalProfit(prev => prev + profit);
      const roundScore = Math.max(0, Math.round(profit * (crate.difficulty === "hard" ? 3 : crate.difficulty === "medium" ? 2 : 1) / 10));
      setScore(prev => prev + roundScore);
    }

    setRoundResults(prev => [...prev, { crate, won, paidPrice, profit }]);
    
    // Start reveal
    setPhase("reveal");
    const allItems = [...crate.peekItems, ...crate.hiddenItems];
    setRevealedItems(allItems);
    setRevealIndex(0);
  };

  // Animate reveal one by one
  useEffect(() => {
    if (phase !== "reveal" || revealIndex < 0) return;
    if (revealIndex >= revealedItems.length) return;
    const t = setTimeout(() => {
      setRevealIndex(prev => prev + 1);
    }, 800);
    return () => clearTimeout(t);
  }, [phase, revealIndex, revealedItems.length]);

  const nextRound = () => {
    const next = round + 1;
    if (next >= TOTAL_ROUNDS || cash <= 0) {
      submitScore("auction_bidding" as any, score);
      setPhase("summary");
    } else {
      setRound(next);
      startPeek(crates[next]);
    }
  };

  // Scroll bid feed
  useEffect(() => {
    if (bidRef.current) bidRef.current.scrollTop = bidRef.current.scrollHeight;
  }, [bidHistory]);

  // Cleanup
  useEffect(() => () => clearTimers(), []);

  // ─── START SCREEN ──────────────────────────────────────
  if (phase === "start") {
    return <StartScreen title={game.title} description="Bid on mystery crates! Peek inside, outbid rivals, and flip for profit. Can you spot the hidden treasures?" icon={game.icon} gradient={game.gradient} glow={game.glow} onStart={startGame} onBack={onBack} gameType={"auction_bidding" as any} />;
  }

  const crate = crates[round];
  if (!crate) return null;

  // ─── SUMMARY SCREEN ───────────────────────────────────
  if (phase === "summary") {
    const winsCount = roundResults.filter(r => r.won).length;
    return (
      <GameShell onBack={onBack} title="Bid Wars — Results" icon={game.icon} gradient={game.gradient}>
        <div className="max-w-2xl mx-auto space-y-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-3">
            <div className="text-6xl mb-2">{totalProfit > 0 ? "🏆" : "📉"}</div>
            <h2 className={`text-3xl font-black ${totalProfit > 0 ? "text-green-400" : "text-red-400"}`}>
              {totalProfit > 0 ? "PROFIT!" : "LOSS!"}
            </h2>
            <p className={`text-5xl font-black font-mono ${totalProfit > 0 ? "text-green-400" : "text-red-400"}`}>
              {totalProfit >= 0 ? "+" : ""}{fmt(totalProfit)}
            </p>
          </motion.div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Won", value: `${winsCount}/${TOTAL_ROUNDS}`, icon: Trophy },
              { label: "Spent", value: fmt(totalSpent), icon: DollarSign },
              { label: "Score", value: score.toString(), icon: Star },
            ].map((s, i) => (
              <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                <s.icon className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground uppercase">{s.label}</p>
                <p className="text-lg font-bold font-mono">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Round breakdown */}
          <div className="space-y-2">
            {roundResults.map((r, i) => (
              <motion.div key={i} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}
                className={`flex items-center gap-3 p-3 rounded-xl border ${r.won ? (r.profit > 0 ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5") : "border-white/[0.06] bg-white/[0.02]"}`}>
                <span className="text-2xl">{r.crate.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.crate.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Value: {fmt(r.crate.totalValue)} {r.won && `• Paid: ${fmt(r.paidPrice)}`}
                  </p>
                </div>
                <div className="text-right">
                  {r.won ? (
                    <span className={`font-mono font-bold text-sm ${r.profit > 0 ? "text-green-400" : "text-red-400"}`}>
                      {r.profit >= 0 ? "+" : ""}{fmt(r.profit)}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">PASSED</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button onClick={startGame} className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold">
              Play Again
            </Button>
            <Button variant="outline" onClick={onBack} className="flex-1">Back</Button>
          </div>

          <Leaderboard gameType={"auction_bidding" as any} />
        </div>
      </GameShell>
    );
  }

  // ─── REVEAL SCREEN ─────────────────────────────────────
  if (phase === "reveal") {
    const lastResult = roundResults[roundResults.length - 1];
    const won = lastResult?.won;
    const profit = lastResult?.profit || 0;
    return (
      <GameShell onBack={onBack} title="Bid Wars" icon={game.icon} gradient={game.gradient}>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center">
            <motion.div initial={{ rotateY: 180, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ duration: 0.6 }}>
              <h2 className="text-2xl font-black mb-1">
                {won ? "🎉 YOU WON! Let's see what's inside..." : "📦 Let's see what was inside..."}
              </h2>
              <p className="text-sm text-muted-foreground">{crate.name}</p>
            </motion.div>
          </div>

          {/* Items reveal grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {revealedItems.map((item, i) => {
              const revealed = i < revealIndex;
              const wasPeeked = i < crate.peekItems.length;
              const rc = RARITY_CONFIG[item.rarity];
              return (
                <motion.div key={i}
                  initial={{ rotateY: 180, opacity: 0 }}
                  animate={revealed ? { rotateY: 0, opacity: 1 } : { rotateY: 180, opacity: 0.3 }}
                  transition={{ duration: 0.5 }}
                  className={`relative rounded-xl border p-4 text-center ${revealed ? rc.border : "border-white/[0.06]"} ${revealed ? "bg-white/[0.03]" : "bg-white/[0.01]"}`}
                >
                  {revealed ? (
                    <>
                      <div className="text-3xl mb-2">{item.emoji}</div>
                      <p className="text-xs font-bold truncate">{item.name}</p>
                      <p className={`text-xs font-mono font-bold mt-1 ${rc.text}`}>{fmt(item.value)}</p>
                      <Badge className={`mt-2 text-[9px] bg-gradient-to-r ${rc.color} border-0`}>{rc.label}</Badge>
                      {wasPeeked && <span className="absolute top-1 right-1 text-[10px]">👁️</span>}
                    </>
                  ) : (
                    <div className="py-4">
                      <Package className="w-8 h-8 mx-auto text-muted-foreground animate-pulse" />
                      <p className="text-[10px] text-muted-foreground mt-2">Revealing...</p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Value summary (after all revealed) */}
          {revealIndex >= revealedItems.length && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className={`rounded-xl border p-4 text-center ${won ? (profit > 0 ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5") : "border-white/[0.06] bg-white/[0.02]"}`}>
                <p className="text-sm text-muted-foreground">Total Crate Value</p>
                <p className="text-3xl font-black font-mono text-foreground">{fmt(crate.totalValue)}</p>
                {won && (
                  <div className="mt-2 flex items-center justify-center gap-2">
                    {profit > 0 ? <TrendingUp className="w-5 h-5 text-green-400" /> : <TrendingDown className="w-5 h-5 text-red-400" />}
                    <span className={`text-xl font-black font-mono ${profit > 0 ? "text-green-400" : "text-red-400"}`}>
                      {profit >= 0 ? "+" : ""}{fmt(profit)} PROFIT
                    </span>
                  </div>
                )}
                {!won && <p className="text-sm text-muted-foreground mt-1">You passed on this one</p>}
              </div>

              <Button size="lg" onClick={nextRound} className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold">
                {round + 1 >= TOTAL_ROUNDS || cash <= 0 ? "Final Results" : `Next Crate (${round + 2}/${TOTAL_ROUNDS})`}
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </motion.div>
          )}
        </div>
      </GameShell>
    );
  }

  // ─── PEEK / BIDDING PHASE ──────────────────────────────
  const timerPercent = phase === "peek" ? (timer / PEEK_DURATION) * 100 : (timer / BID_DURATION) * 100;
  const cashPercent = (cash / STARTING_CASH) * 100;
  const increment = Math.round(crate.totalValue * 0.05);

  return (
    <GameShell onBack={onBack} title="Bid Wars" icon={game.icon} gradient={game.gradient}
      badges={
        <div className="flex items-center gap-2">
          <Badge className="bg-green-900/40 text-green-300 border-green-500/30 font-mono">
            <DollarSign className="w-3 h-3 mr-1" /> {fmt(cash)}
          </Badge>
          <Badge className="bg-amber-900/40 text-amber-300 border-amber-500/30 font-mono">
            <Star className="w-3 h-3 mr-1" /> {score}
          </Badge>
          <Badge className="bg-muted/40 border-muted-foreground/20 font-mono">
            {round + 1}/{TOTAL_ROUNDS}
          </Badge>
        </div>
      }>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ─── Left: Crate & Controls ─── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Phase Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {phase === "peek" ? (
                <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 animate-pulse gap-1">
                  <Eye className="w-3 h-3" /> PEEK PHASE
                </Badge>
              ) : (
                <Badge className="bg-red-500/20 text-red-300 border-red-500/30 animate-pulse gap-1">
                  <Gavel className="w-3 h-3" /> BIDDING LIVE
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 ${timer <= 5 ? "text-red-400 animate-pulse" : "text-muted-foreground"}`} />
              <span className={`font-mono font-bold text-lg ${timer <= 5 ? "text-red-400" : "text-foreground"}`}>{timer}s</span>
            </div>
          </div>

          {/* Timer Bar */}
          <div className="h-1.5 rounded-full bg-muted/20 overflow-hidden">
            <motion.div className={`h-full rounded-full transition-all duration-1000 ${
              timer <= 5 ? "bg-gradient-to-r from-red-500 to-red-600" :
              timer <= 10 ? "bg-gradient-to-r from-orange-500 to-amber-500" :
              phase === "peek" ? "bg-gradient-to-r from-cyan-500 to-blue-500" :
              "bg-gradient-to-r from-green-500 to-emerald-500"
            }`} style={{ width: `${timerPercent}%` }} />
          </div>

          {/* Crate Card */}
          <motion.div
            key={crate.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/[0.06] overflow-hidden"
            style={{ background: "linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--background)) 100%)" }}
          >
            <div className="p-5 flex items-center gap-4">
              <motion.div
                animate={{ rotate: [0, -3, 3, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-600/20 border border-amber-500/20 flex items-center justify-center flex-shrink-0"
              >
                <span className="text-4xl">{crate.emoji}</span>
              </motion.div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-black mb-0.5">{crate.name}</h3>
                <p className="text-sm text-muted-foreground">{crate.description}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className={`text-[10px] ${
                    crate.difficulty === "hard" ? "border-red-500/30 text-red-400" :
                    crate.difficulty === "medium" ? "border-yellow-500/30 text-yellow-400" :
                    "border-green-500/30 text-green-400"
                  }`}>
                    {crate.difficulty.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] border-muted-foreground/20">
                    {crate.peekItems.length + crate.hiddenItems.length} items
                  </Badge>
                </div>
              </div>
            </div>

            {/* Peek Items */}
            <div className="px-5 pb-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                <Eye className="w-3 h-3" /> Visible Items
              </p>
              <div className="flex gap-3">
                {crate.peekItems.map((item, i) => {
                  const rc = RARITY_CONFIG[item.rarity];
                  return (
                    <motion.div key={i}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.3 }}
                      className={`flex-1 rounded-xl border ${rc.border} p-3 bg-white/[0.02]`}
                    >
                      <div className="text-2xl mb-1">{item.emoji}</div>
                      <p className="text-xs font-bold truncate">{item.name}</p>
                      <Badge className={`mt-1 text-[8px] bg-gradient-to-r ${rc.color} border-0`}>{rc.label}</Badge>
                    </motion.div>
                  );
                })}
                {/* Hidden slots */}
                {crate.hiddenItems.map((_, i) => (
                  <div key={`h${i}`} className="flex-1 rounded-xl border border-dashed border-white/[0.08] p-3 bg-white/[0.01] flex flex-col items-center justify-center">
                    <EyeOff className="w-5 h-5 text-muted-foreground/50" />
                    <p className="text-[9px] text-muted-foreground/50 mt-1">Hidden</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Bidding Controls (only during bidding phase) */}
          {phase === "bidding" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              {/* Current bid display */}
              <div className={`rounded-xl border p-4 text-center transition-all ${isPlayerHighest ? "border-green-500/20 bg-green-500/5" : "border-amber-500/20 bg-amber-500/5"}`}>
                <p className="text-xs text-muted-foreground uppercase">Current Bid</p>
                <motion.p key={currentBid} initial={{ scale: 1.15 }} animate={{ scale: 1 }}
                  className="text-4xl font-black font-mono">{fmt(currentBid)}</motion.p>
                <p className={`text-sm mt-1 font-semibold ${isPlayerHighest ? "text-green-400" : passed ? "text-muted-foreground" : "text-amber-400"}`}>
                  {passed ? "You passed" : isPlayerHighest ? "🏆 You're winning!" : `Highest: ${highestBidder}`}
                </p>
                {goingCount > 0 && (
                  <motion.p animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 0.6 }}
                    className="text-lg font-black text-orange-400 mt-1">
                    {goingCount === 1 ? "⚡ GOING ONCE!" : goingCount === 2 ? "⚡⚡ GOING TWICE!" : "🔨 SOLD!"}
                  </motion.p>
                )}
              </div>

              {/* Quick bid buttons */}
              {!passed && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { mult: 1, label: `+${fmt(increment)}`, color: "border-green-500/30 text-green-300 hover:bg-green-500/10" },
                    { mult: 2, label: `+${fmt(increment * 2)}`, color: "border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/10" },
                    { mult: 5, label: `+${fmt(increment * 5)}`, color: "border-orange-500/30 text-orange-300 hover:bg-orange-500/10" },
                    { mult: 10, label: `+${fmt(increment * 10)}`, color: "border-red-500/30 text-red-300 hover:bg-red-500/10" },
                  ].map((b, i) => (
                    <Button key={i} variant="outline" onClick={() => playerBid(b.mult)}
                      disabled={currentBid + increment * b.mult > cash}
                      className={`${b.color} font-mono text-xs h-12`}>
                      <ArrowUp className="w-3 h-3 mr-1" /> {b.label}
                    </Button>
                  ))}
                </div>
              )}

              {!passed && (
                <Button variant="outline" onClick={handlePass} className="w-full border-muted-foreground/20 text-muted-foreground hover:text-foreground">
                  Pass on this crate 👋
                </Button>
              )}
            </motion.div>
          )}

          {/* Bot Reaction */}
          <AnimatePresence mode="wait">
            {botReaction && (
              <motion.div key={botReaction} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                <Volume2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <p className="text-sm font-medium text-amber-200">{botReaction}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── Right Panel ─── */}
        <div className="space-y-4">
          {/* Cash meter */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground uppercase">Your Cash</span>
              <span className={`font-mono font-bold text-sm ${cashPercent < 20 ? "text-red-400" : "text-green-400"}`}>{fmt(cash)}</span>
            </div>
            <div className="h-2 rounded-full bg-muted/20 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${cashPercent < 20 ? "bg-red-500" : cashPercent < 50 ? "bg-yellow-500" : "bg-green-500"}`}
                style={{ width: `${cashPercent}%` }} />
            </div>
            {totalProfit !== 0 && (
              <p className={`text-xs font-mono mt-2 ${totalProfit > 0 ? "text-green-400" : "text-red-400"}`}>
                Net: {totalProfit >= 0 ? "+" : ""}{fmt(totalProfit)}
              </p>
            )}
          </div>

          {/* Rival Bidders */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <div className="p-3 border-b border-white/[0.06] flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Rivals</span>
            </div>
            <div className="p-3 space-y-2">
              {activeBots.map((bot, i) => (
                <div key={i} className={`flex items-center gap-2 p-2 rounded-lg text-xs transition-all ${
                  highestBidder === bot.name ? "bg-amber-500/10 border border-amber-500/20" : "bg-white/[0.01] border border-transparent"
                }`}>
                  <span className="text-lg">{bot.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{bot.name}</p>
                    <p className="text-[10px] text-muted-foreground">{bot.personality}</p>
                  </div>
                  {highestBidder === bot.name && (
                    <Zap className="w-3 h-3 text-amber-400 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Live Bid Feed */}
          {phase === "bidding" && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
              <div className="p-3 border-b border-white/[0.06] flex items-center gap-2">
                <Gavel className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider">Bid Feed</span>
                <span className="ml-auto text-[10px] text-red-400 font-mono animate-pulse">● LIVE</span>
              </div>
              <div ref={bidRef} className="max-h-[200px] overflow-y-auto p-2 space-y-1">
                <AnimatePresence>
                  {bidHistory.map((bid, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center gap-2 p-1.5 rounded text-[11px] ${
                        bid.isPlayer ? "bg-green-500/10" : "bg-white/[0.02]"
                      }`}>
                      <span className="truncate flex-1 font-medium">{bid.bidder}</span>
                      <span className={`font-mono font-bold ${bid.isPlayer ? "text-green-400" : "text-amber-400"}`}>{fmt(bid.amount)}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Previous wins */}
          {roundResults.filter(r => r.won).length > 0 && (
            <div className="rounded-xl border border-green-500/15 bg-green-500/5 p-3">
              <p className="text-[10px] text-green-400 uppercase tracking-wider mb-2 font-bold">🏆 Won Crates</p>
              {roundResults.filter(r => r.won).map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-xs py-0.5">
                  <span>{r.crate.emoji}</span>
                  <span className="truncate flex-1">{r.crate.name}</span>
                  <span className={`font-mono ${r.profit > 0 ? "text-green-400" : "text-red-400"}`}>
                    {r.profit >= 0 ? "+" : ""}{fmt(r.profit)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </GameShell>
  );
};

export default AuctionBiddingGame;
