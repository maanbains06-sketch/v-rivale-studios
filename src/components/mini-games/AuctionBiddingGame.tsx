import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, Gavel, Eye, EyeOff, Package, TrendingUp, TrendingDown,
  Users, Clock, Sparkles, ArrowUp, Volume2, ChevronRight, Star, Zap,
  Trophy, MapPin, Shield, Flame, SkipForward, AlertTriangle, Crown,
  Heart, ThumbsDown, Lock, Unlock, Lightbulb, Target, X
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

// ─── Item Images ─────────────────────────────────────────
import picassoImg from "@/assets/bidwars/picasso-sketch.png";
import ferrariImg from "@/assets/bidwars/ferrari-engine.png";
import mantleImg from "@/assets/bidwars/mantle-card.png";
import romanImg from "@/assets/bidwars/roman-artifact.png";
import elvisImg from "@/assets/bidwars/elvis-record.png";
import moonImg from "@/assets/bidwars/moon-rock.png";
import diamondImg from "@/assets/bidwars/diamond-ring.png";
import rolexImg from "@/assets/bidwars/rolex-watch.png";
import goldImg from "@/assets/bidwars/gold-bars.png";
import fabergeImg from "@/assets/bidwars/faberge-egg.png";
import motorcycleImg from "@/assets/bidwars/vintage-motorcycle.png";
import carKeysImg from "@/assets/bidwars/car-keys.png";
import coinImg from "@/assets/bidwars/coin-collection.png";
import samuraiImg from "@/assets/bidwars/samurai-sword.png";
import paintingImg from "@/assets/bidwars/oil-painting.png";
import pocketWatchImg from "@/assets/bidwars/pocket-watch.png";
import baseballImg from "@/assets/bidwars/signed-baseball.png";
import cameraImg from "@/assets/bidwars/vintage-camera.png";
import wineImg from "@/assets/bidwars/vintage-wine.png";
import bookImg from "@/assets/bidwars/first-edition-book.png";
import radioImg from "@/assets/bidwars/vintage-radio.png";
import clockImg from "@/assets/bidwars/antique-clock.png";
import guitarImg from "@/assets/bidwars/guitar.png";
import toolsImg from "@/assets/bidwars/power-tools.png";
import telescopeImg from "@/assets/bidwars/telescope.png";
import vaseImg from "@/assets/bidwars/antique-vase.png";
import chessImg from "@/assets/bidwars/chess-set.png";
import brokenTvImg from "@/assets/bidwars/broken-tv.png";
import toolboxImg from "@/assets/bidwars/rusty-toolbox.png";
import vhsImg from "@/assets/bidwars/vhs-tapes.png";
import silverwareImg from "@/assets/bidwars/silverware.png";
import jacketImg from "@/assets/bidwars/leather-jacket.png";
import vinylImg from "@/assets/bidwars/vinyl-records.png";
import typewriterImg from "@/assets/bidwars/typewriter.png";
import campingImg from "@/assets/bidwars/camping-gear.png";

// Map item names to images
const ITEM_IMAGES: Record<string, string> = {
  "Picasso Sketch": picassoImg,
  "Vintage Ferrari Engine": ferrariImg,
  "Mickey Mantle Card": mantleImg,
  "Ancient Roman Artifact": romanImg,
  "Elvis' Gold Record": elvisImg,
  "NASA Moon Rock": moonImg,
  "Diamond Ring": diamondImg,
  "Rolex Watch": rolexImg,
  "Gold Bars (2)": goldImg,
  "Fabergé Egg": fabergeImg,
  "Vintage Motorcycle": motorcycleImg,
  "Sports Car Keys": carKeysImg,
  "Rare Coin Collection": coinImg,
  "Samurai Sword": samuraiImg,
  "Oil Painting": paintingImg,
  "Gold Pocket Watch": pocketWatchImg,
  "Signed Baseball": baseballImg,
  "Vintage Camera": cameraImg,
  "Vintage Wine Case": wineImg,
  "First Edition Book": bookImg,
  "Vintage Radio": radioImg,
  "Antique Clock": clockImg,
  "Guitar": guitarImg,
  "Power Tools": toolsImg,
  "Brass Telescope": telescopeImg,
  "Antique Vase": vaseImg,
  "Ivory Chess Set": chessImg,
  "Broken TV": brokenTvImg,
  "Rusty Toolbox": toolboxImg,
  "VHS Tapes": vhsImg,
  "Silverware Set": silverwareImg,
  "Leather Jacket": jacketImg,
  "Vinyl Records": vinylImg,
  "Typewriter": typewriterImg,
  "Camping Gear": campingImg,
};

const getItemImage = (name: string): string | null => ITEM_IMAGES[name] || null;

// ─── Types ───────────────────────────────────────────────
interface CrateItem {
  name: string;
  emoji: string;
  value: number;
  rarity: "junk" | "common" | "rare" | "epic" | "legendary";
  appraisalNote?: string;
}

interface StorageUnit {
  id: string;
  name: string;
  emoji: string;
  location: string;
  locationEmoji: string;
  backstory: string;
  peekItems: CrateItem[];
  hiddenItems: CrateItem[];
  totalValue: number;
  difficulty: "easy" | "medium" | "hard";
  hasBoobytrap: boolean; // chance of a "penalty" item
  lockCount: number; // visual lock count for drama
}

interface BotBidder {
  name: string;
  avatar: string;
  personality: string;
  aggression: number;
  maxBudgetPercent: number;
  bluffChance: number;
  catchphrase: string;
  taunt: string;
  budget: number;
  spent: number;
  wins: number;
  rivalry: number; // 0-1, how much they target the player
  style: "aggressive" | "sniper" | "calculated" | "wildcard";
}

interface BidEntry {
  bidder: string;
  avatar: string;
  amount: number;
  isPlayer: boolean;
  reaction?: string;
  timestamp: number;
}

interface PowerUp {
  id: string;
  name: string;
  emoji: string;
  description: string;
  cost: number;
  used: boolean;
}

type GamePhase = "start" | "travel" | "peek" | "bidding" | "going" | "reveal" | "appraisal" | "summary";

// ─── Item Pools ──────────────────────────────────────────
const JUNK_ITEMS: CrateItem[] = [
  { name: "Broken TV", emoji: "📺", value: 25, rarity: "junk", appraisalNote: "Not even worth the trip" },
  { name: "Old Newspapers", emoji: "📰", value: 5, rarity: "junk", appraisalNote: "Recycling at best" },
  { name: "Rusty Toolbox", emoji: "🧰", value: 40, rarity: "junk", appraisalNote: "Could clean up for $40" },
  { name: "Moth-Eaten Coat", emoji: "🧥", value: 10, rarity: "junk", appraisalNote: "Vintage? Nah, just old" },
  { name: "Broken Chair", emoji: "🪑", value: 15, rarity: "junk", appraisalNote: "Three legs, no thanks" },
  { name: "Empty Boxes", emoji: "📦", value: 2, rarity: "junk", appraisalNote: "Literally nothing" },
  { name: "Old Shoes", emoji: "👟", value: 8, rarity: "junk", appraisalNote: "Seen better days..." },
  { name: "Cracked Mirror", emoji: "🪞", value: 12, rarity: "junk", appraisalNote: "7 years bad luck" },
  { name: "Dead Plant", emoji: "🪴", value: 3, rarity: "junk", appraisalNote: "Beyond saving" },
  { name: "VHS Tapes", emoji: "📼", value: 20, rarity: "junk", appraisalNote: "Nostalgic but worthless" },
  { name: "Stained Mattress", emoji: "🛏️", value: 0, rarity: "junk", appraisalNote: "Pay someone to take it away" },
  { name: "Broken Umbrella", emoji: "☂️", value: 1, rarity: "junk", appraisalNote: "Won't stop any rain" },
];

const COMMON_ITEMS: CrateItem[] = [
  { name: "Vintage Radio", emoji: "📻", value: 150, rarity: "common", appraisalNote: "Nice piece, works too" },
  { name: "Antique Clock", emoji: "🕰️", value: 200, rarity: "common", appraisalNote: "Keeps good time" },
  { name: "Leather Jacket", emoji: "🧥", value: 180, rarity: "common", appraisalNote: "Real leather, good condition" },
  { name: "Guitar", emoji: "🎸", value: 300, rarity: "common", appraisalNote: "Decent acoustic" },
  { name: "Silverware Set", emoji: "🍽️", value: 250, rarity: "common", appraisalNote: "Sterling silver, 24 pieces" },
  { name: "Vinyl Records", emoji: "💿", value: 120, rarity: "common", appraisalNote: "Some good albums in here" },
  { name: "Camping Gear", emoji: "⛺", value: 220, rarity: "common", appraisalNote: "Barely used" },
  { name: "Power Tools", emoji: "🔧", value: 350, rarity: "common", appraisalNote: "DeWalt set, nice" },
  { name: "Typewriter", emoji: "⌨️", value: 275, rarity: "common", appraisalNote: "1940s Remington" },
  { name: "Brass Telescope", emoji: "🔭", value: 400, rarity: "common", appraisalNote: "Beautiful craftsmanship" },
];

const RARE_ITEMS: CrateItem[] = [
  { name: "Signed Baseball", emoji: "⚾", value: 800, rarity: "rare", appraisalNote: "Babe Ruth autograph!" },
  { name: "Antique Vase", emoji: "🏺", value: 1200, rarity: "rare", appraisalNote: "Ming Dynasty replica, but valuable" },
  { name: "Vintage Camera", emoji: "📷", value: 950, rarity: "rare", appraisalNote: "1950s Leica, collectors love these" },
  { name: "First Edition Book", emoji: "📚", value: 1500, rarity: "rare", appraisalNote: "Hemingway first print!" },
  { name: "Gold Pocket Watch", emoji: "⌚", value: 1800, rarity: "rare", appraisalNote: "14K gold, Swiss movement" },
  { name: "Ivory Chess Set", emoji: "♟️", value: 2000, rarity: "rare", appraisalNote: "Hand-carved, museum quality" },
  { name: "Oil Painting", emoji: "🖼️", value: 2500, rarity: "rare", appraisalNote: "Unknown artist but stunning" },
  { name: "Samurai Sword", emoji: "⚔️", value: 3000, rarity: "rare", appraisalNote: "Edo period katana!" },
  { name: "Vintage Wine Case", emoji: "🍷", value: 2200, rarity: "rare", appraisalNote: "1982 Bordeaux, 6 bottles" },
];

const EPIC_ITEMS: CrateItem[] = [
  { name: "Diamond Ring", emoji: "💍", value: 5000, rarity: "epic", appraisalNote: "2 carat, VS1 clarity" },
  { name: "Rolex Watch", emoji: "⌚", value: 8000, rarity: "epic", appraisalNote: "Submariner, all original" },
  { name: "Sports Car Keys", emoji: "🔑", value: 15000, rarity: "epic", appraisalNote: "Porsche 911 key fob!" },
  { name: "Gold Bars (2)", emoji: "🥇", value: 12000, rarity: "epic", appraisalNote: "Pure 24K gold" },
  { name: "Rare Coin Collection", emoji: "🪙", value: 7000, rarity: "epic", appraisalNote: "Double eagles and silver dollars" },
  { name: "Fabergé Egg", emoji: "🥚", value: 20000, rarity: "epic", appraisalNote: "Could be authentic..." },
  { name: "Vintage Motorcycle", emoji: "🏍️", value: 18000, rarity: "epic", appraisalNote: "1965 Triumph Bonneville" },
];

const LEGENDARY_ITEMS: CrateItem[] = [
  { name: "Picasso Sketch", emoji: "🎨", value: 50000, rarity: "legendary", appraisalNote: "AUTHENTICATED! Incredible find!" },
  { name: "Vintage Ferrari Engine", emoji: "🏎️", value: 75000, rarity: "legendary", appraisalNote: "250 GTO engine block!" },
  { name: "Mickey Mantle Card", emoji: "🃏", value: 100000, rarity: "legendary", appraisalNote: "1952 Topps, PSA 8!" },
  { name: "Ancient Roman Artifact", emoji: "🏛️", value: 60000, rarity: "legendary", appraisalNote: "2000 years old, museum wants it!" },
  { name: "Elvis' Gold Record", emoji: "🎵", value: 45000, rarity: "legendary", appraisalNote: "Provenance confirmed!" },
  { name: "NASA Moon Rock", emoji: "🌙", value: 120000, rarity: "legendary", appraisalNote: "From the Apollo missions!" },
];

// ─── Locations ───────────────────────────────────────────
const LOCATIONS = [
  { name: "Downtown LA", emoji: "🌴", vibe: "Sun-baked warehouses of Hollywood storage" },
  { name: "Brooklyn, NY", emoji: "🗽", vibe: "Old tenement basement units" },
  { name: "Miami Beach", emoji: "🏖️", vibe: "Beach millionaire's forgotten locker" },
  { name: "Las Vegas Strip", emoji: "🎰", vibe: "Casino mogul's abandoned vault" },
  { name: "Chicago Southside", emoji: "🏙️", vibe: "Industrial warehouse district" },
  { name: "Nashville", emoji: "🎵", vibe: "Country star's storage overflow" },
  { name: "San Francisco", emoji: "🌉", vibe: "Tech mogul's old garage unit" },
  { name: "New Orleans", emoji: "🎭", vibe: "Antique district storage" },
  { name: "Dallas, TX", emoji: "🤠", vibe: "Oil baron's estate clearance" },
  { name: "Detroit", emoji: "🏭", vibe: "Automotive museum overflow" },
];

const UNIT_NAMES = [
  "Unit A-7", "Unit B-12", "Locker #44", "Unit C-3", "Vault 19",
  "Unit D-8", "Bay 22", "Unit F-1", "Storage 66", "Container X",
  "Locker #99", "Unit G-5", "Bay 31", "Vault 7", "Unit H-14",
];

const BACKSTORIES = [
  "Owner disappeared 3 years ago. Nobody's opened this since.",
  "Estate of a retired collector. Family wants it gone.",
  "Seized by police in a fraud investigation.",
  "Celebrity moved overseas. Agent never picked it up.",
  "Owner stopped paying rent 18 months ago.",
  "Inherited from a great-uncle nobody knew about.",
  "Bankruptcy auction — everything must go.",
  "Foreclosure cleanout from a mansion.",
  "Antique dealer closed shop suddenly.",
  "Moving company's unclaimed shipment.",
];

// ─── Bot Pool ────────────────────────────────────────────
const BOT_POOL: BotBidder[] = [
  { name: "Rico 'The Shark'", avatar: "🦈", personality: "Ruthless veteran", aggression: 0.85, maxBudgetPercent: 1.3, bluffChance: 0.3, catchphrase: "That's mine, pal!", taunt: "You're outta your league, kid!", budget: 60000, spent: 0, wins: 0, rivalry: 0.6, style: "aggressive" },
  { name: "Mama Rosa", avatar: "👩‍🍳", personality: "Savvy dealer", aggression: 0.5, maxBudgetPercent: 0.9, bluffChance: 0.1, catchphrase: "I know value when I see it", taunt: "Honey, don't waste your money", budget: 40000, spent: 0, wins: 0, rivalry: 0.2, style: "calculated" },
  { name: "Duke", avatar: "🤠", personality: "Reckless cowboy", aggression: 0.92, maxBudgetPercent: 1.6, bluffChance: 0.5, catchphrase: "YEEHAW! All in!", taunt: "Ride or die, partner!", budget: 45000, spent: 0, wins: 0, rivalry: 0.4, style: "wildcard" },
  { name: "Silent Mike", avatar: "🤫", personality: "Last-second sniper", aggression: 0.3, maxBudgetPercent: 1.1, bluffChance: 0.05, catchphrase: "...", taunt: "*stares intensely*", budget: 55000, spent: 0, wins: 0, rivalry: 0.3, style: "sniper" },
  { name: "Flashy Felix", avatar: "✨", personality: "Deep pockets", aggression: 0.7, maxBudgetPercent: 1.8, bluffChance: 0.4, catchphrase: "Money talks!", taunt: "I'll buy ten of these!", budget: 80000, spent: 0, wins: 0, rivalry: 0.5, style: "aggressive" },
  { name: "Professor Oak", avatar: "🧓", personality: "Collector", aggression: 0.4, maxBudgetPercent: 0.85, bluffChance: 0.02, catchphrase: "Hmm, intriguing...", taunt: "You don't know what you're bidding on", budget: 50000, spent: 0, wins: 0, rivalry: 0.1, style: "calculated" },
  { name: "Neon Nikki", avatar: "💅", personality: "Fierce newcomer", aggression: 0.78, maxBudgetPercent: 1.2, bluffChance: 0.35, catchphrase: "Don't test me!", taunt: "I WILL outbid you!", budget: 35000, spent: 0, wins: 0, rivalry: 0.7, style: "aggressive" },
  { name: "Big Tony", avatar: "🏋️", personality: "Intimidator", aggression: 0.65, maxBudgetPercent: 1.4, bluffChance: 0.25, catchphrase: "Step aside.", taunt: "*cracks knuckles*", budget: 70000, spent: 0, wins: 0, rivalry: 0.5, style: "aggressive" },
  { name: "Lucky Lucy", avatar: "🍀", personality: "Gut-feeling bidder", aggression: 0.6, maxBudgetPercent: 1.0, bluffChance: 0.15, catchphrase: "I've got a feeling!", taunt: "My luck's better than yours!", budget: 42000, spent: 0, wins: 0, rivalry: 0.3, style: "wildcard" },
  { name: "The Twins", avatar: "👯", personality: "Tag-team duo", aggression: 0.55, maxBudgetPercent: 1.1, bluffChance: 0.2, catchphrase: "We're in!", taunt: "Two against one, sorry!", budget: 50000, spent: 0, wins: 0, rivalry: 0.4, style: "calculated" },
];

const RARITY_CONFIG = {
  junk: { color: "from-zinc-500 to-stone-600", text: "text-zinc-400", glow: "", label: "JUNK", bg: "bg-zinc-900/30" },
  common: { color: "from-green-500 to-emerald-600", text: "text-green-400", glow: "", label: "COMMON", bg: "bg-green-900/20" },
  rare: { color: "from-blue-500 to-cyan-600", text: "text-blue-400", glow: "shadow-blue-500/20 shadow-lg", label: "RARE", bg: "bg-blue-900/20" },
  epic: { color: "from-purple-500 to-fuchsia-600", text: "text-purple-400", glow: "shadow-purple-500/30 shadow-xl", label: "EPIC", bg: "bg-purple-900/20" },
  legendary: { color: "from-amber-400 to-yellow-500", text: "text-amber-400", glow: "shadow-amber-500/40 shadow-2xl", label: "★ LEGENDARY", bg: "bg-amber-900/20" },
};

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
const pick = <T,>(arr: T[], n: number): T[] => shuffle(arr).slice(0, n);
const fmt = (n: number) => "$" + n.toLocaleString();

// ─── Auctioneer Lines ────────────────────────────────────
const AUCTIONEER_OPEN = [
  "Alright folks, let's see what we've got!",
  "Step right up! This one's a beauty!",
  "Listen up, big money could be inside!",
  "This unit hasn't been opened in YEARS!",
  "I've got a good feeling about this one!",
];
const AUCTIONEER_HYPE = [
  "Things are HEATING UP!",
  "Now THAT'S what I call a bid war!",
  "The tension is ELECTRIC!",
  "This is getting SPICY!",
  "Oh boy, here we go!",
];
const AUCTIONEER_GOING = [
  "Going once... anybody?",
  "GOING ONCE! Last chance!",
  "Going TWICE! Final call!",
  "GOING TWICE! Speak now!",
  "SOLD! And SOLD to...",
];

// ─── Generate Storage Unit ───────────────────────────────
function generateUnit(difficulty: "easy" | "medium" | "hard", round: number): StorageUnit {
  const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
  const unitName = UNIT_NAMES[Math.floor(Math.random() * UNIT_NAMES.length)];
  const backstory = BACKSTORIES[Math.floor(Math.random() * BACKSTORIES.length)];
  let allItems: CrateItem[] = [];

  if (difficulty === "easy") {
    allItems = [...pick(JUNK_ITEMS, 3), ...pick(COMMON_ITEMS, 2), ...pick(RARE_ITEMS, Math.random() > 0.6 ? 1 : 0)];
  } else if (difficulty === "medium") {
    allItems = [...pick(JUNK_ITEMS, 1), ...pick(COMMON_ITEMS, 2), ...pick(RARE_ITEMS, 2), ...pick(EPIC_ITEMS, Math.random() > 0.5 ? 1 : 0)];
  } else {
    allItems = [...pick(COMMON_ITEMS, 1), ...pick(RARE_ITEMS, 2), ...pick(EPIC_ITEMS, 1), ...pick(LEGENDARY_ITEMS, Math.random() > 0.35 ? 1 : 0)];
    if (allItems.length < 5) allItems.push(...pick(RARE_ITEMS, 1));
  }

  allItems = shuffle(allItems);
  const peekCount = Math.random() > 0.4 ? 2 : 1;
  const peekItems = allItems.slice(0, peekCount);
  const hiddenItems = allItems.slice(peekCount);
  const totalValue = allItems.reduce((s, i) => s + i.value, 0);
  const hasBoobytrap = Math.random() < 0.15;

  return {
    id: `unit_${round}_${Date.now()}`,
    name: `${unitName} — ${location.name}`,
    emoji: "🚪",
    location: location.name,
    locationEmoji: location.emoji,
    backstory,
    peekItems,
    hiddenItems,
    totalValue: hasBoobytrap ? Math.round(totalValue * 0.7) : totalValue,
    difficulty,
    hasBoobytrap,
    lockCount: Math.floor(Math.random() * 3) + 1,
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

const TOTAL_ROUNDS = 8;
const STARTING_CASH = 75000;
const PEEK_DURATION = 10;
const BID_DURATION = 30;

const AuctionBiddingGame = ({ onBack, submitScore, GameShell, StartScreen, EndScreen, Leaderboard, game }: Props) => {
  const [phase, setPhase] = useState<GamePhase>("start");
  const [units, setUnits] = useState<StorageUnit[]>([]);
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
  const [auctioneerLine, setAuctioneerLine] = useState("");
  const [revealedItems, setRevealedItems] = useState<CrateItem[]>([]);
  const [revealIndex, setRevealIndex] = useState(-1);
  const [roundResults, setRoundResults] = useState<{ unit: StorageUnit; won: boolean; paidPrice: number; profit: number; wonBy: string }[]>([]);
  const [goingCount, setGoingCount] = useState(0);
  const [passed, setPassed] = useState(false);
  const [score, setScore] = useState(0);
  const [crowdEnergy, setCrowdEnergy] = useState(50);
  const [streak, setStreak] = useState(0); // consecutive wins
  const [showAppraisal, setShowAppraisal] = useState(false);
  const [appraisalItem, setAppraisalItem] = useState<CrateItem | null>(null);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([
    { id: "xray", name: "X-Ray Vision", emoji: "🔍", description: "Reveal one hidden item", cost: 3000, used: false },
    { id: "intimidate", name: "Intimidate", emoji: "😤", description: "Scare off one rival for this round", cost: 2000, used: false },
    { id: "snipe", name: "Last Second", emoji: "🎯", description: "Auto-bid to win at the last second", cost: 5000, used: false },
  ]);
  const [xrayRevealed, setXrayRevealed] = useState<number>(-1);
  const [intimidatedBot, setIntimidatedBot] = useState<string>("");
  const [travelProgress, setTravelProgress] = useState(0);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [bidWarActive, setBidWarActive] = useState(false);
  const [rapidBidCount, setRapidBidCount] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const botRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bidRef = useRef<HTMLDivElement>(null);
  const currentBidRef = useRef(0);
  const highestBidderRef = useRef("");
  const isPlayerHighestRef = useRef(false);
  const passedRef = useRef(false);

  useEffect(() => { currentBidRef.current = currentBid; }, [currentBid]);
  useEffect(() => { highestBidderRef.current = highestBidder; }, [highestBidder]);
  useEffect(() => { isPlayerHighestRef.current = isPlayerHighest; }, [isPlayerHighest]);
  useEffect(() => { passedRef.current = passed; }, [passed]);

  const clearTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (botRef.current) clearInterval(botRef.current);
  };

  // ─── Start Game ────────────────────────────────────────
  const startGame = useCallback(() => {
    const difficulties: ("easy" | "medium" | "hard")[] = ["easy", "easy", "medium", "medium", "medium", "hard", "hard", "hard"];
    const generated = shuffle(difficulties).map((d, i) => generateUnit(d, i));
    setUnits(generated);
    const bots = pick(BOT_POOL, 5).map(b => ({ ...b, budget: b.budget, spent: 0, wins: 0 }));
    setActiveBots(bots);
    setRound(0);
    setCash(STARTING_CASH);
    setTotalProfit(0);
    setTotalSpent(0);
    setTotalEarned(0);
    setRoundResults([]);
    setScore(0);
    setStreak(0);
    setComboMultiplier(1);
    setPowerUps(prev => prev.map(p => ({ ...p, used: false })));
    startTravel(generated[0]);
  }, []);

  // ─── Travel Phase ──────────────────────────────────────
  const startTravel = (unit: StorageUnit) => {
    setPhase("travel");
    setTravelProgress(0);
    setBotReaction("");
    setAuctioneerLine("");
    setXrayRevealed(-1);
    setIntimidatedBot("");
    setBidWarActive(false);
    setRapidBidCount(0);

    let prog = 0;
    const travelTimer = setInterval(() => {
      prog += Math.random() * 20 + 10;
      if (prog >= 100) {
        prog = 100;
        clearInterval(travelTimer);
        setTimeout(() => startPeek(unit), 400);
      }
      setTravelProgress(Math.min(prog, 100));
    }, 300);
  };

  // ─── Peek Phase ────────────────────────────────────────
  const startPeek = (unit: StorageUnit) => {
    setPhase("peek");
    setTimer(PEEK_DURATION);
    setBidHistory([]);
    setRevealedItems([]);
    setRevealIndex(-1);
    setGoingCount(0);
    setPassed(false);
    passedRef.current = false;
    setShowAppraisal(false);
    setAppraisalItem(null);
    setAuctioneerLine(AUCTIONEER_OPEN[Math.floor(Math.random() * AUCTIONEER_OPEN.length)]);
    clearTimers();

    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (phase === "peek" && timer === 0) startBidding();
  }, [phase, timer]);

  // ─── Bidding Phase ─────────────────────────────────────
  const startBidding = () => {
    const unit = units[round];
    if (!unit) return;
    const startBid = Math.round(unit.totalValue * (0.12 + Math.random() * 0.13));
    setPhase("bidding");
    setCurrentBid(startBid);
    currentBidRef.current = startBid;
    setHighestBidder("Auctioneer");
    highestBidderRef.current = "Auctioneer";
    setIsPlayerHighest(false);
    isPlayerHighestRef.current = false;
    setTimer(BID_DURATION);
    setGoingCount(0);
    setCrowdEnergy(40);
    setBidHistory([{ bidder: "🔨 Auctioneer", avatar: "🔨", amount: startBid, isPlayer: false, reaction: "Opening bid!", timestamp: Date.now() }]);
    setAuctioneerLine(`Opening at ${fmt(startBid)}! Who wants it?`);

    clearTimers();
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);

    // Bot bidding loop
    botRef.current = setInterval(() => {
      if (passedRef.current) return;
      const cb = currentBidRef.current;
      const crateVal = unit.totalValue;

      const eligible = activeBots.filter(bot => {
        if (bot.name === intimidatedBot) return false;
        const maxBid = crateVal * bot.maxBudgetPercent;
        const budgetLeft = bot.budget - bot.spent;
        const rivalryFactor = isPlayerHighestRef.current ? bot.rivalry : 0.5;
        const willBid = Math.random() < bot.aggression * 0.22 * (1 + rivalryFactor);
        return willBid && maxBid > cb && budgetLeft > cb;
      });

      // Sniper bots wait until timer is low
      const snipers = eligible.filter(b => b.style === "sniper");

      if (eligible.length > 0) {
        // Choose sniper if timer <= 6, otherwise random
        let bot: BotBidder;
        if (snipers.length > 0 && Math.random() < 0.5) {
          bot = snipers[Math.floor(Math.random() * snipers.length)];
        } else {
          bot = eligible[Math.floor(Math.random() * eligible.length)];
        }

        const baseIncrement = Math.round(crateVal * (0.03 + Math.random() * 0.06));
        let newBid = cb + baseIncrement;
        const maxBid = Math.round(crateVal * bot.maxBudgetPercent);
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
          setTimer(prev => Math.min(prev + 3, BID_DURATION));
          setRapidBidCount(prev => {
            const next = prev + 1;
            if (next >= 4) setBidWarActive(true);
            return next;
          });

          const reactions = [bot.catchphrase, bot.taunt, "💪", "Higher!", "Come on!", "Not backing down!", "I NEED this!"];
          const reaction = reactions[Math.floor(Math.random() * reactions.length)];
          setBotReaction(`${bot.avatar} ${bot.name}: "${reaction}"`);
          setBidHistory(prev => [...prev, { bidder: bot.name, avatar: bot.avatar, amount: newBid, isPlayer: false, reaction, timestamp: Date.now() }]);
          setCrowdEnergy(prev => Math.min(prev + 8, 100));

          if (Math.random() < 0.3) {
            setAuctioneerLine(AUCTIONEER_HYPE[Math.floor(Math.random() * AUCTIONEER_HYPE.length)]);
          }
        }
      }
    }, 1600 + Math.random() * 2200);
  };

  // Going once/twice/sold
  useEffect(() => {
    if (phase !== "bidding") return;
    if (timer === 10 && goingCount === 0) setGoingCount(1);
    else if (timer === 5 && goingCount <= 1) setGoingCount(2);
    else if (timer === 0) { setGoingCount(3); endBidding(); }
  }, [timer, phase]);

  // ─── Player Bid ────────────────────────────────────────
  const playerBid = (multiplier: number) => {
    if (phase !== "bidding" || passed) return;
    const unit = units[round];
    const increment = Math.round(unit.totalValue * 0.04);
    const amount = currentBid + Math.round(increment * multiplier);
    if (amount > cash) {
      setBotReaction("💸 You can't afford that!");
      return;
    }
    setCurrentBid(amount);
    currentBidRef.current = amount;
    setHighestBidder("You");
    highestBidderRef.current = "You";
    setIsPlayerHighest(true);
    isPlayerHighestRef.current = true;
    setGoingCount(0);
    setTimer(prev => Math.min(prev + 3, BID_DURATION));
    setBidHistory(prev => [...prev, { bidder: "You", avatar: "🙋", amount, isPlayer: true, timestamp: Date.now() }]);
    setBotReaction("");
    setCrowdEnergy(prev => Math.min(prev + 12, 100));
    setRapidBidCount(prev => {
      const next = prev + 1;
      if (next >= 4) setBidWarActive(true);
      return next;
    });
    setAuctioneerLine(`${fmt(amount)} from the player! Who's next?`);
  };

  const handlePass = () => {
    setPassed(true);
    passedRef.current = true;
    setIsPlayerHighest(false);
    isPlayerHighestRef.current = false;
    setBotReaction("Player steps back! 👋");
    setCrowdEnergy(prev => Math.max(prev - 15, 0));
  };

  // ─── Power-ups ─────────────────────────────────────────
  const usePowerUp = (id: string) => {
    const pu = powerUps.find(p => p.id === id);
    if (!pu || pu.used || cash < pu.cost) return;
    setCash(prev => prev - pu.cost);
    setPowerUps(prev => prev.map(p => p.id === id ? { ...p, used: true } : p));

    if (id === "xray") {
      const unit = units[round];
      if (unit.hiddenItems.length > 0) {
        const idx = Math.floor(Math.random() * unit.hiddenItems.length);
        setXrayRevealed(idx);
        setAuctioneerLine("👀 X-Ray reveals a hidden item!");
      }
    } else if (id === "intimidate") {
      const weakest = [...activeBots].sort((a, b) => a.aggression - b.aggression)[0];
      if (weakest) {
        setIntimidatedBot(weakest.name);
        setBotReaction(`${weakest.avatar} ${weakest.name} backs off! "Fine, take it..."`);
        setAuctioneerLine(`${weakest.name} has been scared off!`);
      }
    } else if (id === "snipe") {
      // Auto-win at the end — set bid slightly above current
      const unit = units[round];
      const amount = currentBid + Math.round(unit.totalValue * 0.08);
      if (amount <= cash) {
        playerBid(2);
        setAuctioneerLine("🎯 SNIPE BID! Last second play!");
      }
    }
  };

  // ─── End Bidding ───────────────────────────────────────
  const endBidding = () => {
    clearTimers();
    const unit = units[round];
    const won = isPlayerHighestRef.current && !passedRef.current;
    const paidPrice = won ? currentBidRef.current : 0;
    const profit = won ? unit.totalValue - paidPrice : 0;
    const wonBy = won ? "You" : highestBidderRef.current;

    if (won) {
      setCash(prev => prev - paidPrice);
      setTotalSpent(prev => prev + paidPrice);
      setTotalEarned(prev => prev + unit.totalValue);
      setTotalProfit(prev => prev + profit);
      const newStreak = streak + 1;
      setStreak(newStreak);
      const mult = Math.min(1 + (newStreak - 1) * 0.5, 3);
      setComboMultiplier(mult);
      const roundScore = Math.max(0, Math.round(profit * (unit.difficulty === "hard" ? 3 : unit.difficulty === "medium" ? 2 : 1) * mult / 10));
      setScore(prev => prev + roundScore);

      // Update bot who lost
      if (highestBidderRef.current !== "You") {
        setActiveBots(prev => prev.map(b => b.name === highestBidderRef.current ? { ...b, rivalry: Math.min(b.rivalry + 0.15, 1) } : b));
      }
    } else {
      setStreak(0);
      setComboMultiplier(1);
      // Update winning bot
      setActiveBots(prev => prev.map(b => b.name === wonBy ? { ...b, spent: b.spent + currentBidRef.current, wins: b.wins + 1 } : b));
    }

    setRoundResults(prev => [...prev, { unit, won, paidPrice, profit, wonBy }]);
    setPhase("reveal");
    const allItems = [...unit.peekItems, ...unit.hiddenItems];
    setRevealedItems(allItems);
    setRevealIndex(0);
  };

  // Animate reveal
  useEffect(() => {
    if (phase !== "reveal" || revealIndex < 0) return;
    if (revealIndex >= revealedItems.length) return;
    const t = setTimeout(() => setRevealIndex(prev => prev + 1), 1000);
    return () => clearTimeout(t);
  }, [phase, revealIndex, revealedItems.length]);

  // Show appraisal popup for rare+ items
  useEffect(() => {
    if (phase !== "reveal") return;
    if (revealIndex > 0 && revealIndex <= revealedItems.length) {
      const item = revealedItems[revealIndex - 1];
      if (item.rarity === "rare" || item.rarity === "epic" || item.rarity === "legendary") {
        setAppraisalItem(item);
        setShowAppraisal(true);
        setTimeout(() => setShowAppraisal(false), 2500);
      }
    }
  }, [revealIndex, phase]);

  const nextRound = () => {
    const next = round + 1;
    if (next >= TOTAL_ROUNDS || cash <= 0) {
      submitScore("auction_bidding" as any, score);
      setPhase("summary");
    } else {
      setRound(next);
      startTravel(units[next]);
    }
  };

  useEffect(() => {
    if (bidRef.current) bidRef.current.scrollTop = bidRef.current.scrollHeight;
  }, [bidHistory]);

  useEffect(() => () => clearTimers(), []);

  // ═══════════════════════════════════════════════════════
  // ─── START SCREEN ─────────────────────────────────────
  // ═══════════════════════════════════════════════════════
  if (phase === "start") {
    return (
      <StartScreen
        title="BID WARS"
        description={`Travel across America bidding on abandoned storage units! Outbid ruthless rivals, discover hidden treasures, and flip for massive profit. You start with ${fmt(STARTING_CASH)}. Use power-ups wisely!`}
        icon={game.icon}
        gradient={game.gradient}
        glow={game.glow}
        onStart={startGame}
        onBack={onBack}
        gameType={"auction_bidding" as any}
      />
    );
  }

  const unit = units[round];
  if (!unit) return null;

  // ═══════════════════════════════════════════════════════
  // ─── TRAVEL PHASE ─────────────────────────────────────
  // ═══════════════════════════════════════════════════════
  if (phase === "travel") {
    return (
      <GameShell onBack={onBack} title="Bid Wars" icon={game.icon} gradient={game.gradient}>
        <div className="max-w-lg mx-auto text-center space-y-6 py-12">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-4">
            <div className="text-6xl mb-4">{unit.locationEmoji}</div>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="text-sm uppercase tracking-wider">Traveling to</span>
            </div>
            <h2 className="text-3xl font-black">{unit.location}</h2>
            <p className="text-sm text-muted-foreground italic">{unit.backstory}</p>

            <div className="space-y-2 pt-4">
              <Progress value={travelProgress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>🚗 En route...</span>
                <span>Round {round + 1}/{TOTAL_ROUNDS}</span>
              </div>
            </div>

            {/* Bot convoy */}
            <div className="flex justify-center gap-3 pt-6">
              {activeBots.slice(0, 4).map((bot, i) => (
                <motion.div key={i}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
                  className="text-center"
                >
                  <div className="text-2xl">{bot.avatar}</div>
                  <p className="text-[9px] text-muted-foreground mt-1">{bot.name.split(" ")[0]}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </GameShell>
    );
  }

  // ═══════════════════════════════════════════════════════
  // ─── SUMMARY SCREEN ───────────────────────────────────
  // ═══════════════════════════════════════════════════════
  if (phase === "summary") {
    const winsCount = roundResults.filter(r => r.won).length;
    const bestDeal = roundResults.filter(r => r.won).sort((a, b) => b.profit - a.profit)[0];
    const worstDeal = roundResults.filter(r => r.won).sort((a, b) => a.profit - b.profit)[0];
    const botLeader = [...activeBots].sort((a, b) => b.wins - a.wins)[0];

    return (
      <GameShell onBack={onBack} title="Bid Wars — Final Results" icon={game.icon} gradient={game.gradient}>
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Hero result */}
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="relative overflow-hidden rounded-2xl border border-white/[0.06] p-8 text-center"
            style={{ background: totalProfit > 0 ? "linear-gradient(180deg, rgba(34,197,94,0.08) 0%, transparent 100%)" : "linear-gradient(180deg, rgba(239,68,68,0.08) 0%, transparent 100%)" }}
          >
            <motion.div animate={{ rotate: [0, -5, 5, 0] }} transition={{ duration: 2, repeat: 2 }} className="text-7xl mb-4">
              {totalProfit > 0 ? "🏆" : totalProfit === 0 ? "🤝" : "📉"}
            </motion.div>
            <h2 className={`text-4xl font-black mb-2 ${totalProfit > 0 ? "text-green-400" : totalProfit === 0 ? "text-foreground" : "text-red-400"}`}>
              {totalProfit > 10000 ? "STORAGE KING!" : totalProfit > 0 ? "PROFIT!" : totalProfit === 0 ? "BROKE EVEN" : "TOUGH DAY..."}
            </h2>
            <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }}
              className={`text-6xl font-black font-mono ${totalProfit > 0 ? "text-green-400" : "text-red-400"}`}>
              {totalProfit >= 0 ? "+" : ""}{fmt(totalProfit)}
            </motion.p>
            <p className="text-sm text-muted-foreground mt-2">Final Score: <span className="font-bold text-foreground">{score.toLocaleString()} pts</span></p>
          </motion.div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Units Won", value: `${winsCount}/${TOTAL_ROUNDS}`, icon: Trophy, color: "text-amber-400" },
              { label: "Total Spent", value: fmt(totalSpent), icon: DollarSign, color: "text-red-400" },
              { label: "Total Earned", value: fmt(totalEarned), icon: TrendingUp, color: "text-green-400" },
              { label: "Cash Left", value: fmt(cash), icon: DollarSign, color: "text-foreground" },
            ].map((s, i) => (
              <motion.div key={i} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 * i }}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
                <p className="text-[10px] text-muted-foreground uppercase">{s.label}</p>
                <p className="text-sm font-bold font-mono">{s.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Best/Worst deal */}
          {bestDeal && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-3">
                <p className="text-[10px] text-green-400 uppercase font-bold mb-1">🔥 Best Deal</p>
                <p className="text-sm font-bold truncate">{bestDeal.unit.name}</p>
                <p className="text-lg font-black font-mono text-green-400">+{fmt(bestDeal.profit)}</p>
              </div>
              {worstDeal && worstDeal.profit < bestDeal.profit && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                  <p className="text-[10px] text-red-400 uppercase font-bold mb-1">💀 Worst Deal</p>
                  <p className="text-sm font-bold truncate">{worstDeal.unit.name}</p>
                  <p className="text-lg font-black font-mono text-red-400">{worstDeal.profit >= 0 ? "+" : ""}{fmt(worstDeal.profit)}</p>
                </div>
              )}
            </div>
          )}

          {/* Rival standings */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" /> Rival Standings
            </p>
            <div className="space-y-2">
              {[{ name: "You", avatar: "🙋", wins: winsCount, spent: totalSpent }, ...activeBots.map(b => ({ name: b.name, avatar: b.avatar, wins: b.wins, spent: b.spent }))]
                .sort((a, b) => b.wins - a.wins)
                .map((p, i) => (
                  <div key={i} className={`flex items-center gap-3 p-2 rounded-lg text-sm ${p.name === "You" ? "bg-primary/10 border border-primary/20" : "bg-white/[0.01]"}`}>
                    <span className="font-mono text-muted-foreground w-5 text-center">{i === 0 ? "👑" : `#${i + 1}`}</span>
                    <span className="text-lg">{p.avatar}</span>
                    <span className="flex-1 font-bold">{p.name}</span>
                    <span className="text-xs text-muted-foreground">{p.wins}W</span>
                    <span className="text-xs font-mono text-muted-foreground">{fmt(p.spent)}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Round breakdown */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider">Round Breakdown</p>
            {roundResults.map((r, i) => (
              <motion.div key={i} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-3 p-3 rounded-xl border ${r.won ? (r.profit > 0 ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5") : "border-white/[0.06] bg-white/[0.02]"}`}>
                <span className="text-2xl">{r.unit.locationEmoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{r.unit.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Value: {fmt(r.unit.totalValue)} {r.won ? `• Paid: ${fmt(r.paidPrice)}` : `• Won by: ${r.wonBy}`}
                  </p>
                </div>
                <div className="text-right">
                  {r.won ? (
                    <span className={`font-mono font-bold text-sm ${r.profit > 0 ? "text-green-400" : "text-red-400"}`}>
                      {r.profit >= 0 ? "+" : ""}{fmt(r.profit)}
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">LOST</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button onClick={startGame} size="lg" className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold text-base">
              🔥 Play Again
            </Button>
            <Button variant="outline" size="lg" onClick={onBack} className="flex-1">Back</Button>
          </div>

          <Leaderboard gameType={"auction_bidding" as any} />
        </div>
      </GameShell>
    );
  }

  // ═══════════════════════════════════════════════════════
  // ─── REVEAL / APPRAISAL ───────────────────────────────
  // ═══════════════════════════════════════════════════════
  if (phase === "reveal") {
    const lastResult = roundResults[roundResults.length - 1];
    const won = lastResult?.won;
    const profit = lastResult?.profit || 0;
    const allDone = revealIndex >= revealedItems.length;

    return (
      <GameShell onBack={onBack} title="Bid Wars" icon={game.icon} gradient={game.gradient}>
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center">
            <h2 className="text-2xl font-black">
              {won ? "🎉 YOU WON! Opening the unit..." : `📦 ${lastResult?.wonBy || "Rival"} won. Let's see what's inside...`}
            </h2>
            <p className="text-sm text-muted-foreground">{unit.name}</p>
          </motion.div>

          {/* Lock breaking animation if won */}
          {won && revealIndex === 0 && (
            <motion.div initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: 0.8, duration: 0.3 }}
              className="flex justify-center gap-2">
              {Array.from({ length: unit.lockCount }).map((_, i) => (
                <motion.div key={i} initial={{ scale: 1 }} animate={{ scale: 0, rotate: 45 }} transition={{ delay: i * 0.3, duration: 0.4 }}>
                  <Lock className="w-8 h-8 text-amber-400" />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Items reveal */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {revealedItems.map((item, i) => {
              const revealed = i < revealIndex;
              const rc = RARITY_CONFIG[item.rarity];
              return (
                <motion.div key={i}
                  initial={{ rotateY: 180, scale: 0.8 }}
                  animate={revealed ? { rotateY: 0, scale: 1 } : { rotateY: 180, scale: 0.9 }}
                  transition={{ duration: 0.6, type: "spring" }}
                  className={`relative rounded-xl border p-4 text-center transition-shadow ${
                    revealed ? `border-white/[0.08] ${rc.bg} ${rc.glow}` : "border-white/[0.04] bg-white/[0.01]"
                  }`}
                >
                  {revealed ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                      {getItemImage(item.name) ? (
                        <img src={getItemImage(item.name)!} alt={item.name} className="w-16 h-16 mx-auto object-contain mb-2 rounded-lg" />
                      ) : (
                        <div className="text-3xl mb-2">{item.emoji}</div>
                      )}
                      <p className="text-xs font-bold truncate">{item.name}</p>
                      <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: "spring" }}
                        className={`text-sm font-mono font-black mt-1 ${rc.text}`}>{fmt(item.value)}</motion.p>
                      <Badge className={`mt-2 text-[8px] bg-gradient-to-r ${rc.color} border-0 text-white`}>{rc.label}</Badge>
                    </motion.div>
                  ) : (
                    <div className="py-4">
                      <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                        <Package className="w-8 h-8 mx-auto text-muted-foreground/40" />
                      </motion.div>
                      <p className="text-[10px] text-muted-foreground/40 mt-2">???</p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Appraisal popup */}
          <AnimatePresence>
            {showAppraisal && appraisalItem && (
              <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }}
                className={`rounded-xl border p-4 flex items-center gap-3 ${RARITY_CONFIG[appraisalItem.rarity].bg} border-white/[0.1]`}>
                <Lightbulb className={`w-6 h-6 flex-shrink-0 ${RARITY_CONFIG[appraisalItem.rarity].text}`} />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Expert Appraisal</p>
                  <p className="text-sm font-medium">"{appraisalItem.appraisalNote}"</p>
                  <p className={`text-lg font-black font-mono ${RARITY_CONFIG[appraisalItem.rarity].text}`}>{fmt(appraisalItem.value)}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Value summary */}
          {allDone && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className={`rounded-2xl border p-6 text-center ${won ? (profit > 0 ? "border-green-500/20 bg-green-900/10" : "border-red-500/20 bg-red-900/10") : "border-white/[0.06] bg-white/[0.02]"}`}>
                <p className="text-sm text-muted-foreground mb-1">Total Unit Value</p>
                <p className="text-4xl font-black font-mono">{fmt(unit.totalValue)}</p>
                {won && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
                    className="mt-3 flex items-center justify-center gap-2">
                    {profit > 0 ? <TrendingUp className="w-6 h-6 text-green-400" /> : <TrendingDown className="w-6 h-6 text-red-400" />}
                    <span className={`text-3xl font-black font-mono ${profit > 0 ? "text-green-400" : "text-red-400"}`}>
                      {profit >= 0 ? "+" : ""}{fmt(profit)}
                    </span>
                  </motion.div>
                )}
                {won && profit > 0 && comboMultiplier > 1 && (
                  <p className="text-xs text-amber-400 mt-2 font-bold">🔥 {streak} Win Streak! {comboMultiplier}x Score Multiplier!</p>
                )}
                {!won && <p className="text-sm text-muted-foreground mt-2">You didn't win this one. {lastResult?.wonBy} took it.</p>}
                {unit.hasBoobytrap && won && (
                  <p className="text-xs text-red-400 mt-2">⚠️ Booby trap! Some items were damaged, reducing value.</p>
                )}
              </div>

              <Button size="lg" onClick={nextRound}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold text-base h-14">
                {round + 1 >= TOTAL_ROUNDS || cash <= 0 ? "🏆 Final Results" : `Next Location (${round + 2}/${TOTAL_ROUNDS})`}
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </motion.div>
          )}
        </div>
      </GameShell>
    );
  }

  // ═══════════════════════════════════════════════════════
  // ─── PEEK / BIDDING PHASE ─────────────────────────────
  // ═══════════════════════════════════════════════════════
  const timerPercent = phase === "peek" ? (timer / PEEK_DURATION) * 100 : (timer / BID_DURATION) * 100;
  const cashPercent = (cash / STARTING_CASH) * 100;
  const increment = Math.round(unit.totalValue * 0.04);

  return (
    <GameShell onBack={onBack} title="Bid Wars" icon={game.icon} gradient={game.gradient}
      badges={
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="bg-green-900/40 text-green-300 border-green-500/30 font-mono text-xs">
            <DollarSign className="w-3 h-3 mr-0.5" /> {fmt(cash)}
          </Badge>
          {streak > 1 && (
            <Badge className="bg-orange-900/40 text-orange-300 border-orange-500/30 font-mono text-xs">
              <Flame className="w-3 h-3 mr-0.5" /> {streak}x Streak
            </Badge>
          )}
          <Badge className="bg-amber-900/40 text-amber-300 border-amber-500/30 font-mono text-xs">
            <Star className="w-3 h-3 mr-0.5" /> {score}
          </Badge>
          <Badge className="bg-muted/40 border-muted-foreground/20 font-mono text-xs">
            {round + 1}/{TOTAL_ROUNDS}
          </Badge>
        </div>
      }>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ─── Left: Main Area (8 cols) ─── */}
        <div className="lg:col-span-8 space-y-4">
          {/* Phase Header + Timer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className="text-[10px] border-muted-foreground/20">
                <MapPin className="w-3 h-3 mr-1" /> {unit.location}
              </Badge>
              {phase === "peek" ? (
                <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 animate-pulse gap-1 text-xs">
                  <Eye className="w-3 h-3" /> PEEK PHASE
                </Badge>
              ) : (
                <Badge className={`gap-1 text-xs ${bidWarActive ? "bg-red-600/30 text-red-200 border-red-500/40" : "bg-red-500/20 text-red-300 border-red-500/30"} animate-pulse`}>
                  <Gavel className="w-3 h-3" /> {bidWarActive ? "🔥 BID WAR!" : "BIDDING LIVE"}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 ${timer <= 5 ? "text-red-400 animate-pulse" : "text-muted-foreground"}`} />
              <span className={`font-mono font-bold text-xl ${timer <= 5 ? "text-red-400" : timer <= 10 ? "text-orange-400" : "text-foreground"}`}>{timer}s</span>
            </div>
          </div>

          {/* Timer Bar */}
          <div className="h-2 rounded-full bg-muted/20 overflow-hidden">
            <motion.div className={`h-full rounded-full ${
              timer <= 5 ? "bg-gradient-to-r from-red-500 to-red-600" :
              timer <= 10 ? "bg-gradient-to-r from-orange-500 to-amber-500" :
              phase === "peek" ? "bg-gradient-to-r from-cyan-500 to-blue-500" :
              "bg-gradient-to-r from-green-500 to-emerald-500"
            }`} style={{ width: `${timerPercent}%`, transition: "width 1s linear" }} />
          </div>

          {/* Crowd Energy */}
          {phase === "bidding" && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground uppercase">Crowd</span>
              <div className="flex-1 h-1.5 rounded-full bg-muted/20 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${
                  crowdEnergy > 75 ? "bg-gradient-to-r from-red-500 to-orange-500" :
                  crowdEnergy > 50 ? "bg-gradient-to-r from-amber-500 to-yellow-500" :
                  "bg-gradient-to-r from-blue-500 to-cyan-500"
                }`} style={{ width: `${crowdEnergy}%` }} />
              </div>
              <span className="text-[10px]">
                {crowdEnergy > 75 ? "🔥" : crowdEnergy > 50 ? "👏" : "😐"}
              </span>
            </div>
          )}

          {/* Auctioneer Banner */}
          <AnimatePresence mode="wait">
            {auctioneerLine && (
              <motion.div key={auctioneerLine} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20">
                <span className="text-2xl">🎩</span>
                <div>
                  <p className="text-[10px] text-amber-400 uppercase font-bold">Auctioneer</p>
                  <p className="text-sm font-semibold">{auctioneerLine}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Storage Unit Card */}
          <motion.div key={unit.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/[0.06] overflow-hidden"
            style={{ background: "linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--background)) 100%)" }}>
            {/* Unit header */}
            <div className="p-5 flex items-center gap-4">
              <motion.div animate={phase === "peek" ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                className={`w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 border ${
                  unit.difficulty === "hard" ? "bg-gradient-to-br from-red-500/20 to-orange-600/20 border-red-500/20" :
                  unit.difficulty === "medium" ? "bg-gradient-to-br from-amber-500/20 to-yellow-600/20 border-amber-500/20" :
                  "bg-gradient-to-br from-green-500/20 to-emerald-600/20 border-green-500/20"
                }`}>
                <span className="text-4xl">{unit.locationEmoji}</span>
              </motion.div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-black">{unit.name}</h3>
                <p className="text-xs text-muted-foreground italic mt-0.5">"{unit.backstory}"</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className={`text-[10px] ${
                    unit.difficulty === "hard" ? "border-red-500/30 text-red-400" :
                    unit.difficulty === "medium" ? "border-yellow-500/30 text-yellow-400" :
                    "border-green-500/30 text-green-400"
                  }`}>
                    {unit.difficulty === "hard" ? "🔴 HARD" : unit.difficulty === "medium" ? "🟡 MEDIUM" : "🟢 EASY"}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] border-muted-foreground/20">
                    {unit.peekItems.length + unit.hiddenItems.length} items
                  </Badge>
                  <Badge variant="outline" className="text-[10px] border-muted-foreground/20">
                    {Array.from({ length: unit.lockCount }).map(() => "🔒").join("")}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Visible + Hidden Items */}
            <div className="px-5 pb-5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1">
                <Eye className="w-3 h-3" /> What you can see
              </p>
              <div className="flex gap-3 flex-wrap">
                {unit.peekItems.map((item, i) => {
                  const rc = RARITY_CONFIG[item.rarity];
                  return (
                    <motion.div key={i} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.3 }}
                      className={`flex-1 min-w-[100px] rounded-xl border p-3 ${rc.bg} border-white/[0.06]`}>
                      {getItemImage(item.name) ? (
                        <img src={getItemImage(item.name)!} alt={item.name} className="w-12 h-12 mx-auto object-contain mb-1 rounded-lg" />
                      ) : (
                        <div className="text-2xl mb-1">{item.emoji}</div>
                      )}
                      <p className="text-xs font-bold truncate">{item.name}</p>
                      <Badge className={`mt-1 text-[7px] bg-gradient-to-r ${rc.color} border-0 text-white`}>{rc.label}</Badge>
                    </motion.div>
                  );
                })}
                {/* Hidden slots */}
                {unit.hiddenItems.map((item, i) => (
                  <div key={`h${i}`} className={`flex-1 min-w-[100px] rounded-xl border border-dashed p-3 flex flex-col items-center justify-center ${
                    xrayRevealed === i ? `${RARITY_CONFIG[item.rarity].bg} border-white/[0.1]` : "border-white/[0.06] bg-white/[0.01]"
                  }`}>
                    {xrayRevealed === i ? (
                      <>
                        <div className="text-2xl mb-1">{item.emoji}</div>
                        <p className="text-xs font-bold truncate">{item.name}</p>
                        <Badge className="mt-1 text-[7px] bg-primary/20 border-primary/30 text-primary">X-RAY</Badge>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-5 h-5 text-muted-foreground/30" />
                        <p className="text-[9px] text-muted-foreground/30 mt-1">Hidden</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Going Once Animation */}
          <AnimatePresence>
            {goingCount > 0 && phase === "bidding" && (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
                className={`rounded-xl border-2 p-4 text-center font-black text-xl ${
                  goingCount === 1 ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-300" :
                  goingCount === 2 ? "border-orange-500/40 bg-orange-500/10 text-orange-300" :
                  "border-red-500/40 bg-red-500/10 text-red-300"
                }`}>
                <motion.span animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 0.5 }}>
                  {goingCount === 1 ? "⚡ GOING ONCE!" : goingCount === 2 ? "⚡⚡ GOING TWICE!" : "🔨 SOLD!!!"}
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bidding Controls */}
          {phase === "bidding" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              {/* Current bid */}
              <div className={`rounded-2xl border-2 p-5 text-center transition-all ${
                isPlayerHighest ? "border-green-500/30 bg-green-900/10" :
                passed ? "border-muted-foreground/10 bg-muted/5" :
                "border-amber-500/30 bg-amber-900/10"
              }`}>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Current Bid</p>
                <motion.p key={currentBid} initial={{ scale: 1.2 }} animate={{ scale: 1 }}
                  className="text-5xl font-black font-mono">{fmt(currentBid)}</motion.p>
                <p className={`text-sm mt-2 font-semibold ${
                  isPlayerHighest ? "text-green-400" : passed ? "text-muted-foreground" : "text-amber-400"
                }`}>
                  {passed ? "You passed 👋" : isPlayerHighest ? "🏆 You're the highest bidder!" : `📢 ${highestBidder} is leading`}
                </p>
              </div>

              {/* Bid buttons */}
              {!passed && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { mult: 1, label: `+${fmt(increment)}`, emoji: "💵", color: "border-green-500/30 text-green-300 hover:bg-green-500/10" },
                    { mult: 2, label: `+${fmt(increment * 2)}`, emoji: "💰", color: "border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/10" },
                    { mult: 5, label: `+${fmt(increment * 5)}`, emoji: "🤑", color: "border-orange-500/30 text-orange-300 hover:bg-orange-500/10" },
                    { mult: 10, label: `+${fmt(increment * 10)}`, emoji: "🔥", color: "border-red-500/30 text-red-300 hover:bg-red-500/10" },
                  ].map((b, i) => (
                    <Button key={i} variant="outline" onClick={() => playerBid(b.mult)}
                      disabled={currentBid + increment * b.mult > cash}
                      className={`${b.color} font-mono text-xs h-14 flex flex-col gap-0.5`}>
                      <span className="text-lg">{b.emoji}</span>
                      <span>{b.label}</span>
                    </Button>
                  ))}
                </div>
              )}

              {!passed && (
                <Button variant="outline" size="lg" onClick={handlePass}
                  className="w-full border-muted-foreground/20 text-muted-foreground hover:text-foreground h-12">
                  <X className="w-4 h-4 mr-2" /> Pass on this unit
                </Button>
              )}
            </motion.div>
          )}

          {/* Bot Reaction */}
          <AnimatePresence mode="wait">
            {botReaction && (
              <motion.div key={botReaction} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                <Volume2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <p className="text-sm font-medium text-amber-200 italic">{botReaction}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── Right Panel (4 cols) ─── */}
        <div className="lg:col-span-4 space-y-4">
          {/* Power-Ups */}
          {(phase === "peek" || phase === "bidding") && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
              <div className="p-3 border-b border-white/[0.06] flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-bold uppercase tracking-wider">Power-Ups</span>
              </div>
              <div className="p-2 space-y-1.5">
                {powerUps.map((pu) => (
                  <button key={pu.id} onClick={() => usePowerUp(pu.id)}
                    disabled={pu.used || cash < pu.cost || (pu.id === "xray" && phase !== "peek") || (pu.id === "intimidate" && phase !== "bidding") || (pu.id === "snipe" && phase !== "bidding")}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-xs transition-all ${
                      pu.used ? "opacity-30 cursor-not-allowed" : "hover:bg-white/[0.04] cursor-pointer"
                    }`}>
                    <span className="text-lg">{pu.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold">{pu.name}</p>
                      <p className="text-[10px] text-muted-foreground">{pu.description}</p>
                    </div>
                    <Badge variant="outline" className="text-[9px] font-mono border-muted-foreground/20 flex-shrink-0">
                      {pu.used ? "USED" : fmt(pu.cost)}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cash Meter */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground uppercase">Budget</span>
              <span className={`font-mono font-bold text-sm ${cashPercent < 20 ? "text-red-400" : "text-green-400"}`}>{fmt(cash)}</span>
            </div>
            <div className="h-2.5 rounded-full bg-muted/20 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${
                cashPercent < 20 ? "bg-red-500" : cashPercent < 50 ? "bg-yellow-500" : "bg-green-500"
              }`} style={{ width: `${cashPercent}%` }} />
            </div>
            {totalProfit !== 0 && (
              <p className={`text-xs font-mono mt-2 ${totalProfit > 0 ? "text-green-400" : "text-red-400"}`}>
                P/L: {totalProfit >= 0 ? "+" : ""}{fmt(totalProfit)}
              </p>
            )}
          </div>

          {/* Rival Bidders */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <div className="p-3 border-b border-white/[0.06] flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Rivals</span>
            </div>
            <div className="p-2 space-y-1">
              {activeBots.map((bot, i) => {
                const isLeading = highestBidder === bot.name;
                const isScared = intimidatedBot === bot.name;
                return (
                  <motion.div key={i} animate={isLeading ? { x: [0, 2, -2, 0] } : {}} transition={{ duration: 0.3 }}
                    className={`flex items-center gap-2 p-2 rounded-lg text-xs transition-all ${
                      isScared ? "opacity-30 bg-red-500/5 border border-red-500/10" :
                      isLeading ? "bg-amber-500/10 border border-amber-500/20" :
                      "bg-white/[0.01] border border-transparent"
                    }`}>
                    <span className="text-lg">{bot.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{bot.name}</p>
                      <p className="text-[9px] text-muted-foreground">
                        {isScared ? "Intimidated! 😰" : bot.personality} • {bot.wins}W
                      </p>
                    </div>
                    {isLeading && <Crown className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                    {bot.rivalry > 0.5 && !isScared && (
                      <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Live Bid Feed */}
          {phase === "bidding" && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
              <div className="p-3 border-b border-white/[0.06] flex items-center gap-2">
                <Gavel className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider">Live Feed</span>
                <span className="ml-auto text-[10px] text-red-400 font-mono animate-pulse">● LIVE</span>
              </div>
              <div ref={bidRef} className="max-h-[180px] overflow-y-auto p-2 space-y-1">
                <AnimatePresence>
                  {bidHistory.map((bid, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center gap-2 p-1.5 rounded text-[11px] ${
                        bid.isPlayer ? "bg-green-500/10 border border-green-500/10" : "bg-white/[0.02]"
                      }`}>
                      <span className="text-sm">{bid.avatar}</span>
                      <span className="truncate flex-1 font-medium">{bid.bidder}</span>
                      <span className={`font-mono font-bold ${bid.isPlayer ? "text-green-400" : "text-amber-400"}`}>{fmt(bid.amount)}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Won Units */}
          {roundResults.filter(r => r.won).length > 0 && (
            <div className="rounded-xl border border-green-500/15 bg-green-500/5 p-3">
              <p className="text-[10px] text-green-400 uppercase tracking-wider mb-2 font-bold">🏆 Your Wins</p>
              {roundResults.filter(r => r.won).map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-xs py-0.5">
                  <span>{r.unit.locationEmoji}</span>
                  <span className="truncate flex-1">{r.unit.name}</span>
                  <span className={`font-mono font-bold ${r.profit > 0 ? "text-green-400" : "text-red-400"}`}>
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
