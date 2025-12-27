import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Clock, Users, Trophy, Sparkles, Calendar, ChevronRight, Star, Crown, Ticket, Check, Timer, Award, PartyPopper, Plus, X, Image, Hash, CalendarDays, Target, Loader2, Pencil, Trash2, AlertTriangle, Lock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import headerImage from "@/assets/header-giveaway.jpg";

// Replace with your Discord ID for admin access
const ADMIN_DISCORD_ID = "833680146510381097";

interface Giveaway {
  id: string;
  title: string;
  description: string | null;
  prize: string;
  prize_image_url: string | null;
  start_date: string;
  end_date: string;
  max_entries: number | null;
  winner_count: number;
  status: string;
  requirements: unknown;
  created_at: string;
  category: string;
}

interface GiveawayEntry {
  id: string;
  giveaway_id: string;
  user_id: string;
  discord_username: string | null;
  entry_count: number;
  is_winner: boolean;
  created_at: string;
}

interface GiveawayWinner {
  id: string;
  giveaway_id: string;
  user_id: string;
  discord_username: string | null;
  prize_claimed: boolean;
  announced_at: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.5 } 
  },
};

const CountdownTimer = ({ endDate, variant = "default" }: { endDate: string; variant?: "default" | "compact" | "hero" }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endDate).getTime() - new Date().getTime();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  if (variant === "hero") {
    return (
      <div className="flex gap-3 justify-center">
        {Object.entries(timeLeft).map(([unit, value]) => (
          <motion.div 
            key={unit} 
            className="flex flex-col items-center"
            whileHover={{ scale: 1.1, y: -5 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 to-amber-600/30 rounded-xl blur-lg" />
              <div className="relative bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border-2 border-yellow-500/40 rounded-xl px-4 py-3 min-w-[70px] backdrop-blur-sm">
                <motion.span 
                  key={value}
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-amber-500"
                >
                  {value.toString().padStart(2, '0')}
                </motion.span>
              </div>
            </div>
            <span className="text-xs font-semibold text-yellow-500/80 mt-2 uppercase tracking-wider">{unit}</span>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2 justify-center">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <motion.div 
          key={unit} 
          className="flex flex-col items-center"
          whileHover={{ scale: 1.05 }}
        >
          <div className="relative overflow-hidden bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/30 rounded-xl px-3 py-2 min-w-[50px]">
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <motion.span 
              key={value}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="relative text-xl font-bold text-primary"
            >
              {value.toString().padStart(2, '0')}
            </motion.span>
          </div>
          <span className="text-xs text-muted-foreground mt-1 capitalize font-medium">{unit}</span>
        </motion.div>
      ))}
    </div>
  );
};

const GiveawayCard = ({ 
  giveaway, 
  userEntry,
  entryCount,
  onEnter, 
  isEntering,
  isAdmin,
  onEdit,
  onDelete
}: { 
  giveaway: Giveaway;
  userEntry: GiveawayEntry | null;
  entryCount: number;
  onEnter: (id: string) => void;
  isEntering: boolean;
  isAdmin?: boolean;
  onEdit?: (giveaway: Giveaway) => void;
  onDelete?: (giveaway: Giveaway) => void;
}) => {
  const isActive = giveaway.status === 'active';
  const isUpcoming = giveaway.status === 'upcoming';
  const isEnded = giveaway.status === 'ended';
  const hasEntered = !!userEntry;
  const progress = giveaway.max_entries ? (entryCount / giveaway.max_entries) * 100 : 0;

  const getStatusBadge = () => {
    if (isActive) return (
      <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg shadow-green-500/30">
        <span className="w-2 h-2 rounded-full bg-white animate-pulse mr-2" />
        LIVE NOW
      </Badge>
    );
    if (isUpcoming) return (
      <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0 shadow-lg shadow-yellow-500/30">
        <Calendar className="w-3 h-3 mr-1" />
        COMING SOON
      </Badge>
    );
    if (isEnded) return <Badge className="bg-muted/80 text-muted-foreground border-0">ENDED</Badge>;
    return null;
  };

  const getCategoryBadge = () => {
    if (giveaway.category === 'whitelisted') {
      return (
        <Badge className="bg-gradient-to-r from-purple-500 to-violet-500 text-white border-0 shadow-lg shadow-purple-500/30">
          <Lock className="w-3 h-3 mr-1" />
          WHITELIST
        </Badge>
      );
    }
    return null;
  };

  return (
    <motion.div 
      variants={itemVariants}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card className="relative overflow-hidden group border-2 border-transparent hover:border-primary/30 transition-all duration-500 bg-gradient-to-b from-card to-card/80 backdrop-blur-xl">
        {/* Animated gradient border effect for active */}
        {isActive && (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-transparent to-green-500/10 animate-pulse" />
            <div className="absolute -inset-[1px] bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 rounded-xl opacity-30 blur-sm animate-pulse" />
          </>
        )}
        
        {/* Admin Controls */}
        {isAdmin && (
          <div className="absolute top-4 left-4 z-20 flex gap-2">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="icon"
                variant="secondary"
                className="w-9 h-9 bg-background/90 backdrop-blur-md border border-border/50 hover:bg-primary/20 shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(giveaway);
                }}
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="icon"
                variant="secondary"
                className="w-9 h-9 bg-background/90 backdrop-blur-md border border-border/50 hover:bg-destructive/20 hover:text-destructive shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(giveaway);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </motion.div>
          </div>
        )}

        {/* Prize Image with enhanced overlay */}
        <div className="relative h-56 overflow-hidden">
          {giveaway.prize_image_url ? (
            <img 
              src={giveaway.prize_image_url} 
              alt={giveaway.prize}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 via-accent/20 to-primary/10 flex items-center justify-center">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Gift className="w-24 h-24 text-primary/50" />
              </motion.div>
            </div>
          )}
          
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Status badges */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
            {getStatusBadge()}
            {getCategoryBadge()}
          </div>
          
          {/* Prize pill */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 p-3 bg-background/90 backdrop-blur-md rounded-xl border border-primary/20 shadow-xl">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-foreground flex-1 line-clamp-1">{giveaway.prize}</span>
            </div>
          </div>
        </div>

        <CardContent className="p-6 relative">
          {/* Title */}
          <h3 className="text-xl font-bold text-headline mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {giveaway.title}
          </h3>
          
          <p className="text-muted-foreground text-sm mb-5 line-clamp-2">
            {giveaway.description || "Enter for a chance to win amazing prizes!"}
          </p>

          {/* Countdown Timer */}
          {(isActive || isUpcoming) && (
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                <Timer className="w-4 h-4 text-primary" />
                <span className="font-medium">{isUpcoming ? "Starts in" : "Ends in"}</span>
              </div>
              <CountdownTimer endDate={isUpcoming ? giveaway.start_date : giveaway.end_date} />
            </div>
          )}

          {/* Entry Progress - Enhanced */}
          {giveaway.max_entries && (
            <div className="mb-5">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground font-medium">Entry Progress</span>
                <span className="text-foreground font-bold">{entryCount} / {giveaway.max_entries}</span>
              </div>
              <div className="relative h-3 bg-muted/50 rounded-full overflow-hidden">
                <motion.div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
            </div>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-4 mb-5 p-3 bg-muted/30 rounded-xl">
            <div className="flex items-center gap-2 flex-1">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Entries</p>
                <p className="font-bold text-foreground">{entryCount}</p>
              </div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="flex items-center gap-2 flex-1">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Crown className="w-4 h-4 text-yellow-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Winners</p>
                <p className="font-bold text-foreground">{giveaway.winner_count}</p>
              </div>
            </div>
          </div>

          {/* Action Button - Enhanced */}
          {isActive && !hasEntered && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                className="w-full h-12 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] hover:bg-right transition-all duration-500 shadow-lg shadow-primary/30 font-bold text-lg"
                onClick={() => onEnter(giveaway.id)}
                disabled={isEntering}
              >
                {isEntering ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Ticket className="w-5 h-5 mr-2" />
                    Enter Giveaway
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {isActive && hasEntered && (
            <Button className="w-full h-12 bg-green-500/10 border-2 border-green-500/30 text-green-500 font-bold" disabled>
              <Check className="w-5 h-5 mr-2" />
              You're Entered!
            </Button>
          )}

          {isUpcoming && (
            <Button className="w-full h-12 bg-yellow-500/10 border-2 border-yellow-500/30 text-yellow-500 font-bold" disabled>
              <Clock className="w-5 h-5 mr-2" />
              Coming Soon
            </Button>
          )}

          {isEnded && (
            <Button className="w-full h-12 bg-muted/50 text-muted-foreground font-bold" disabled>
              <Trophy className="w-5 h-5 mr-2" />
              Giveaway Ended
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const WinnerCard = ({ winner, giveawayTitle }: { winner: GiveawayWinner; giveawayTitle: string }) => (
  <motion.div 
    variants={itemVariants}
    whileHover={{ scale: 1.02, x: 5 }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <Card className="relative overflow-hidden border-2 border-yellow-500/20 bg-gradient-to-r from-yellow-500/5 to-amber-500/5 hover:border-yellow-500/40 transition-all duration-300">
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      
      <CardContent className="p-5 flex items-center gap-4 relative">
        {/* Winner avatar with crown */}
        <div className="relative">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
            <Crown className="w-7 h-7 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground text-lg truncate">{winner.discord_username || "Anonymous Winner"}</p>
          <p className="text-sm text-muted-foreground truncate">{giveawayTitle}</p>
        </div>
        
        <Badge className={`px-3 py-1 ${winner.prize_claimed 
          ? "bg-green-500/20 text-green-400 border-green-500/30" 
          : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 animate-pulse"}`}>
          {winner.prize_claimed ? (
            <>
              <Check className="w-3 h-3 mr-1" />
              Claimed
            </>
          ) : (
            <>
              <Clock className="w-3 h-3 mr-1" />
              Pending
            </>
          )}
        </Badge>
      </CardContent>
    </Card>
  </motion.div>
);

// Enhanced Ended Giveaway Card with Winners
const EndedGiveawayCard = ({ 
  giveaway, 
  entryCount,
  winners,
  isAdmin,
  onEdit,
  onDelete
}: { 
  giveaway: Giveaway;
  entryCount: number;
  winners: GiveawayWinner[];
  isAdmin?: boolean;
  onEdit?: (giveaway: Giveaway) => void;
  onDelete?: (giveaway: Giveaway) => void;
}) => {
  return (
    <motion.div 
      variants={itemVariants}
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card className="relative overflow-hidden group border-2 border-muted/30 hover:border-yellow-500/30 transition-all duration-500 bg-gradient-to-b from-card to-card/80 backdrop-blur-xl">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Admin Controls */}
        {isAdmin && (
          <div className="absolute top-4 left-4 z-20 flex gap-2">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="icon"
                variant="secondary"
                className="w-9 h-9 bg-background/90 backdrop-blur-md border border-border/50 hover:bg-primary/20 shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(giveaway);
                }}
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="icon"
                variant="secondary"
                className="w-9 h-9 bg-background/90 backdrop-blur-md border border-border/50 hover:bg-destructive/20 hover:text-destructive shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(giveaway);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </motion.div>
          </div>
        )}

        {/* Prize Image */}
        <div className="relative h-40 overflow-hidden">
          {giveaway.prize_image_url ? (
            <img 
              src={giveaway.prize_image_url} 
              alt={giveaway.prize}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out grayscale-[30%] group-hover:grayscale-0"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted/50 via-muted/30 to-muted/10 flex items-center justify-center">
              <Gift className="w-16 h-16 text-muted-foreground/50" />
            </div>
          )}
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
          
          {/* Ended badge */}
          <div className="absolute top-4 right-4">
            <Badge className="bg-muted/90 text-muted-foreground border-0 backdrop-blur-sm">
              <Trophy className="w-3 h-3 mr-1" />
              ENDED
            </Badge>
          </div>
          
          {/* Prize info */}
          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex items-center gap-2 p-2 bg-background/80 backdrop-blur-md rounded-lg border border-border/30">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="font-semibold text-sm text-foreground truncate">{giveaway.prize}</span>
            </div>
          </div>
        </div>

        <CardContent className="p-5 relative">
          {/* Title */}
          <h3 className="text-lg font-bold text-headline mb-2 line-clamp-1 group-hover:text-yellow-500 transition-colors">
            {giveaway.title}
          </h3>
          
          {/* Stats */}
          <div className="flex items-center gap-3 mb-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>{entryCount} entries</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
            <div className="flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-yellow-500" />
              <span>{winners.length} winner{winners.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
          
          {/* Winners Section */}
          {winners.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-yellow-500 mb-2">
                <Award className="w-4 h-4" />
                <span>Winners</span>
              </div>
              <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                {winners.map((winner, index) => (
                  <motion.div
                    key={winner.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 p-2 rounded-lg bg-gradient-to-r from-yellow-500/10 to-amber-500/5 border border-yellow-500/20"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/20">
                      <Crown className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {winner.discord_username || "Anonymous"}
                      </p>
                    </div>
                    {winner.prize_claimed && (
                      <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-green-500" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-muted/30 border border-dashed border-muted text-center">
              <p className="text-sm text-muted-foreground">No winners announced yet</p>
            </div>
          )}
          
          {/* End date */}
          <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Ended {new Date(giveaway.end_date).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const Giveaway = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [userEntries, setUserEntries] = useState<GiveawayEntry[]>([]);
  const [entryCounts, setEntryCounts] = useState<Record<string, number>>({});
  const [winners, setWinners] = useState<GiveawayWinner[]>([]);
  const [totalWinnersCount, setTotalWinnersCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isEntering, setIsEntering] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const [showEntriesDialog, setShowEntriesDialog] = useState(false);
  const [showAddGiveawayDialog, setShowAddGiveawayDialog] = useState(false);
  const [showEditGiveawayDialog, setShowEditGiveawayDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedGiveaway, setSelectedGiveaway] = useState<Giveaway | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreatingGiveaway, setIsCreatingGiveaway] = useState(false);
  const [isUpdatingGiveaway, setIsUpdatingGiveaway] = useState(false);
  const [isDeletingGiveaway, setIsDeletingGiveaway] = useState(false);
  
  // Giveaway form state
  const [giveawayForm, setGiveawayForm] = useState({
    title: "",
    description: "",
    prize: "",
    prize_image_url: "",
    start_date: "",
    end_date: "",
    max_entries: "",
    winner_count: "1",
    status: "upcoming",
    category: "all"
  });

  useEffect(() => {
    fetchUser();
    fetchGiveaways();
    fetchWinners();
    fetchTotalWinnersCount();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserEntries();
    }
  }, [user]);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    
    // Check if user is admin based on Discord ID
    if (user) {
      const discordId = user.user_metadata?.provider_id || user.user_metadata?.sub;
      setIsAdmin(discordId === ADMIN_DISCORD_ID);
    }
  };

  const fetchGiveaways = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('giveaways')
      .select('*')
      .in('status', ['upcoming', 'active', 'ended'])
      .order('created_at', { ascending: false });

    if (!error && data) {
      setGiveaways(data);
      // Fetch entry counts for each giveaway
      const counts: Record<string, number> = {};
      for (const g of data) {
        const { count } = await supabase
          .from('giveaway_entries')
          .select('*', { count: 'exact', head: true })
          .eq('giveaway_id', g.id);
        counts[g.id] = count || 0;
      }
      setEntryCounts(counts);
    }
    setIsLoading(false);
  };

  const fetchUserEntries = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('giveaway_entries')
      .select('*')
      .eq('user_id', user.id);

    if (!error && data) {
      setUserEntries(data);
    }
  };

  const fetchWinners = async () => {
    const { data, error } = await supabase
      .from('giveaway_winners')
      .select('*')
      .order('announced_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setWinners(data);
    }
  };

  const fetchTotalWinnersCount = async () => {
    const { count, error } = await supabase
      .from('giveaway_winners')
      .select('*', { count: 'exact', head: true });

    if (!error) {
      setTotalWinnersCount(count || 0);
    }
  };

  const handleCreateGiveaway = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!giveawayForm.title || !giveawayForm.prize || !giveawayForm.start_date || !giveawayForm.end_date) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingGiveaway(true);

    const { data: insertedData, error } = await supabase
      .from('giveaways')
      .insert({
        title: giveawayForm.title,
        description: giveawayForm.description || null,
        prize: giveawayForm.prize,
        prize_image_url: giveawayForm.prize_image_url || null,
        start_date: new Date(giveawayForm.start_date).toISOString(),
        end_date: new Date(giveawayForm.end_date).toISOString(),
        max_entries: giveawayForm.max_entries ? parseInt(giveawayForm.max_entries) : null,
        winner_count: parseInt(giveawayForm.winner_count) || 1,
        status: giveawayForm.status,
        category: giveawayForm.category,
        created_by: user?.id || null,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create giveaway. Please try again.",
        variant: "destructive",
      });
    } else {
      // Send notification to Discord
      try {
        const websiteUrl = `${window.location.origin}/giveaway`;
        await supabase.functions.invoke('send-giveaway-notification', {
          body: {
            title: giveawayForm.title,
            description: giveawayForm.description || null,
            prize: giveawayForm.prize,
            prize_image_url: giveawayForm.prize_image_url || null,
            start_date: new Date(giveawayForm.start_date).toISOString(),
            end_date: new Date(giveawayForm.end_date).toISOString(),
            status: giveawayForm.status,
            winner_count: parseInt(giveawayForm.winner_count) || 1,
            giveaway_id: insertedData?.id || '',
            website_url: websiteUrl,
          }
        });
        console.log('Discord notification sent successfully');
      } catch (notifyError) {
        console.error('Failed to send Discord notification:', notifyError);
        // Don't show error toast - giveaway was created successfully
      }

      toast({
        title: "Giveaway Created!",
        description: "Your giveaway has been created and notification sent to Discord.",
      });
      setShowAddGiveawayDialog(false);
      setGiveawayForm({
        title: "",
        description: "",
        prize: "",
        prize_image_url: "",
        start_date: "",
        end_date: "",
        max_entries: "",
        winner_count: "1",
        status: "upcoming",
        category: "all"
      });
      fetchGiveaways();
    }

    setIsCreatingGiveaway(false);
  };

  const resetGiveawayForm = () => {
    setGiveawayForm({
      title: "",
      description: "",
      prize: "",
      prize_image_url: "",
      start_date: "",
      end_date: "",
      max_entries: "",
      winner_count: "1",
      status: "upcoming",
      category: "all"
    });
  };

  const handleEditGiveaway = (giveaway: Giveaway) => {
    setSelectedGiveaway(giveaway);
    setGiveawayForm({
      title: giveaway.title,
      description: giveaway.description || "",
      prize: giveaway.prize,
      prize_image_url: giveaway.prize_image_url || "",
      start_date: new Date(giveaway.start_date).toISOString().slice(0, 16),
      end_date: new Date(giveaway.end_date).toISOString().slice(0, 16),
      max_entries: giveaway.max_entries?.toString() || "",
      winner_count: giveaway.winner_count.toString(),
      status: giveaway.status,
      category: giveaway.category || "all"
    });
    setShowEditGiveawayDialog(true);
  };

  const handleUpdateGiveaway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGiveaway) return;
    
    setIsUpdatingGiveaway(true);

    const { error } = await supabase
      .from('giveaways')
      .update({
        title: giveawayForm.title,
        description: giveawayForm.description || null,
        prize: giveawayForm.prize,
        prize_image_url: giveawayForm.prize_image_url || null,
        start_date: new Date(giveawayForm.start_date).toISOString(),
        end_date: new Date(giveawayForm.end_date).toISOString(),
        max_entries: giveawayForm.max_entries ? parseInt(giveawayForm.max_entries) : null,
        winner_count: parseInt(giveawayForm.winner_count) || 1,
        status: giveawayForm.status,
        category: giveawayForm.category,
      })
      .eq('id', selectedGiveaway.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update giveaway. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Giveaway Updated!",
        description: "Your giveaway has been updated successfully.",
      });
      setShowEditGiveawayDialog(false);
      setSelectedGiveaway(null);
      resetGiveawayForm();
      fetchGiveaways();
    }

    setIsUpdatingGiveaway(false);
  };

  const handleDeleteClick = (giveaway: Giveaway) => {
    setSelectedGiveaway(giveaway);
    setShowDeleteConfirm(true);
  };

  const handleDeleteGiveaway = async () => {
    if (!selectedGiveaway) return;
    
    setIsDeletingGiveaway(true);

    // First delete related entries and winners
    await supabase.from('giveaway_entries').delete().eq('giveaway_id', selectedGiveaway.id);
    await supabase.from('giveaway_winners').delete().eq('giveaway_id', selectedGiveaway.id);

    const { error } = await supabase
      .from('giveaways')
      .delete()
      .eq('id', selectedGiveaway.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete giveaway. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Giveaway Deleted",
        description: "The giveaway has been deleted successfully.",
      });
      setShowDeleteConfirm(false);
      setSelectedGiveaway(null);
      fetchGiveaways();
      fetchTotalWinnersCount();
    }

    setIsDeletingGiveaway(false);
  };

  const handleEnterGiveaway = async (giveawayId: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in with Discord to enter giveaways.",
        variant: "destructive",
      });
      return;
    }

    setIsEntering(true);
    
    const discordId = user.user_metadata?.provider_id || user.user_metadata?.sub;
    const discordUsername = user.user_metadata?.full_name || 
                           user.user_metadata?.name || 
                           user.user_metadata?.user_name || 
                           null;

    // Get the giveaway to check its category
    const giveaway = giveaways.find(g => g.id === giveawayId);
    
    if (!giveaway) {
      toast({
        title: "Error",
        description: "Giveaway not found.",
        variant: "destructive",
      });
      setIsEntering(false);
      return;
    }

    // Verify Discord requirements
    try {
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-discord-requirements', {
        body: { discordId }
      });

      if (verifyError) {
        console.error('Error verifying Discord requirements:', verifyError);
        toast({
          title: "Verification Error",
          description: "Could not verify Discord membership. Please try again.",
          variant: "destructive",
        });
        setIsEntering(false);
        return;
      }

      // Check if user is in Discord server
      if (!verifyData?.isInServer) {
        toast({
          title: "Discord Membership Required",
          description: "You must join our Discord server to enter giveaways.",
          variant: "destructive",
        });
        setIsEntering(false);
        return;
      }

      // Check whitelist requirement for whitelisted giveaways
      if (giveaway.category === 'whitelisted' && !verifyData?.hasWhitelistRole) {
        toast({
          title: "Whitelist Required",
          description: "This giveaway is only for whitelisted members. You must have the whitelist role on Discord to enter.",
          variant: "destructive",
        });
        setIsEntering(false);
        return;
      }
    } catch (error) {
      console.error('Error calling verify-discord-requirements:', error);
      toast({
        title: "Verification Error",
        description: "Could not verify Discord membership. Please try again.",
        variant: "destructive",
      });
      setIsEntering(false);
      return;
    }

    const { error } = await supabase
      .from('giveaway_entries')
      .insert({
        giveaway_id: giveawayId,
        user_id: user.id,
        discord_username: discordUsername,
        discord_id: discordId,
      });

    if (error) {
      if (error.code === '23505') {
        toast({
          title: "Already Entered",
          description: "You've already entered this giveaway!",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to enter giveaway. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Entry Successful!",
        description: "You've been entered into the giveaway. Good luck!",
      });
      fetchUserEntries();
      fetchGiveaways();
    }

    setIsEntering(false);
  };

  const activeGiveaways = giveaways.filter(g => g.status === 'active');
  const upcomingGiveaways = giveaways.filter(g => g.status === 'upcoming');
  const endedGiveaways = giveaways.filter(g => g.status === 'ended');

  // Get user entries for active and upcoming giveaways only (not past)
  const activeAndUpcomingGiveawayIds = [...activeGiveaways, ...upcomingGiveaways].map(g => g.id);
  const userActiveUpcomingEntries = userEntries.filter(e => 
    activeAndUpcomingGiveawayIds.includes(e.giveaway_id)
  );

  const getUserEntry = (giveawayId: string) => 
    userEntries.find(e => e.giveaway_id === giveawayId) || null;

  const getGiveawayTitle = (giveawayId: string) => 
    giveaways.find(g => g.id === giveawayId)?.title || "Unknown Giveaway";

  const getGiveawayStatus = (giveawayId: string) => 
    giveaways.find(g => g.id === giveawayId)?.status || "unknown";

  // Get winners for ended giveaways grouped by giveaway
  const getWinnersForGiveaway = (giveawayId: string) => 
    winners.filter(w => w.giveaway_id === giveawayId);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Full-page background image */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${headerImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        {/* Lighter gradient overlay for better background visibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/50 to-background/50" />
        {/* Animated accent overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-yellow-500/5 animate-pulse" style={{ animationDuration: '8s' }} />
      </div>
      
      {/* Floating elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        {/* Floating gift icons */}
        <div className="absolute top-1/4 left-[15%] text-primary/20 animate-bounce" style={{ animationDuration: '3s' }}>
          <Gift className="w-12 h-12" />
        </div>
        <div className="absolute top-1/2 right-[10%] text-yellow-500/20 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
          <Trophy className="w-16 h-16" />
        </div>
        <div className="absolute bottom-1/3 left-[8%] text-accent/20 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>
          <Star className="w-10 h-10" />
        </div>
        <div className="absolute top-[60%] right-[20%] text-green-500/20 animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '1.5s' }}>
          <PartyPopper className="w-14 h-14" />
        </div>
      </div>

      <Navigation />
      
      <PageHeader
        title="Giveaways"
        description="Win exclusive prizes, in-game items, and more!"
        badge="WIN BIG"
        backgroundImage={headerImage}
      />

      <div className="container mx-auto px-4 pb-16 relative z-10">
        {/* Hero Stats - Enhanced */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Active Giveaways Card */}
          <motion.div variants={itemVariants} whileHover={{ y: -5, scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
            <Card 
              className="relative overflow-hidden text-center p-8 cursor-pointer border-2 border-transparent hover:border-green-500/30 transition-all duration-300 bg-gradient-to-br from-green-500/5 to-transparent" 
              onClick={() => setActiveTab("active")}
            >
              {/* Glow effect */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-green-500/20 rounded-full blur-3xl" />
              
              <div className="relative">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                  <Gift className="w-8 h-8 text-white" />
                </div>
                <motion.p 
                  className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-green-400 to-emerald-500 mb-2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                >
                  {activeGiveaways.length}
                </motion.p>
                <p className="text-base font-medium text-muted-foreground">Active Giveaways</p>
                {activeGiveaways.length > 0 && (
                  <Badge className="mt-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg shadow-green-500/30">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse mr-2" />
                    LIVE
                  </Badge>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Upcoming Card */}
          <motion.div variants={itemVariants} whileHover={{ y: -5, scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
            <Card 
              className="relative overflow-hidden text-center p-8 cursor-pointer border-2 border-transparent hover:border-yellow-500/30 transition-all duration-300 bg-gradient-to-br from-yellow-500/5 to-transparent" 
              onClick={() => setActiveTab("upcoming")}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-yellow-500/20 rounded-full blur-3xl" />
              
              <div className="relative">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <motion.p 
                  className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-amber-500 mb-2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                >
                  {upcomingGiveaways.length}
                </motion.p>
                <p className="text-base font-medium text-muted-foreground">Coming Soon</p>
              </div>
            </Card>
          </motion.div>

          {/* Total Winners Card */}
          <motion.div variants={itemVariants} whileHover={{ y: -5, scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
            <Card className="relative overflow-hidden text-center p-8 border-2 border-transparent hover:border-primary/30 transition-all duration-300 bg-gradient-to-br from-primary/5 to-transparent">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
              
              <div className="relative">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <motion.p 
                  className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary to-accent mb-2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.4 }}
                >
                  {totalWinnersCount}
                </motion.p>
                <p className="text-base font-medium text-muted-foreground">Total Winners</p>
              </div>
            </Card>
          </motion.div>

          {/* Your Entries + Admin Card */}
          <motion.div variants={itemVariants} className="flex flex-col gap-4">
            <motion.div 
              whileHover={{ y: -3, scale: 1.02 }} 
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card 
                className="group relative overflow-hidden p-6 cursor-pointer border-2 border-accent/30 hover:border-accent transition-all duration-300 bg-gradient-to-br from-accent/10 via-accent/5 to-transparent hover:shadow-lg hover:shadow-accent/20" 
                onClick={() => user ? setShowEntriesDialog(true) : toast({ title: "Login Required", description: "Please log in to view your entries.", variant: "destructive" })}
              >
                {/* Animated background shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                {/* Glow effect */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-accent/30 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent via-primary to-accent bg-[length:200%_200%] animate-gradient flex items-center justify-center shadow-lg shadow-accent/40 group-hover:shadow-accent/60 transition-shadow">
                    <Ticket className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-accent to-primary">{userActiveUpcomingEntries.length}</p>
                    <p className="text-sm font-bold text-accent/80 group-hover:text-accent transition-colors">Your Entries</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {user && userActiveUpcomingEntries.length > 0 && (
                      <Badge className="bg-accent/20 text-accent border-accent/30 group-hover:bg-accent group-hover:text-white transition-colors">
                        View All
                      </Badge>
                    )}
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
                      <ChevronRight className="w-5 h-5 text-accent group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
            
            {isAdmin && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card 
                  className="relative overflow-hidden p-4 cursor-pointer border-2 border-dashed border-primary/30 hover:border-primary/50 transition-all duration-300 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5" 
                  onClick={() => setShowAddGiveawayDialog(true)}
                >
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <Plus className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-bold text-foreground">Create Giveaway</p>
                      <p className="text-xs text-muted-foreground">Admin Only</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </motion.div>
        </motion.div>

        {/* Your Entries Dialog */}
        <Dialog open={showEntriesDialog} onOpenChange={setShowEntriesDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-accent" />
                Your Active Entries
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {userActiveUpcomingEntries.length > 0 ? (
                userActiveUpcomingEntries.map(entry => {
                  const giveawayTitle = getGiveawayTitle(entry.giveaway_id);
                  const status = getGiveawayStatus(entry.giveaway_id);
                  return (
                    <Card key={entry.id} className="p-4 border-border/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-foreground">{giveawayTitle}</p>
                          <p className="text-xs text-muted-foreground">
                            Entered: {new Date(entry.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={status === 'active' ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"}>
                          {status === 'active' ? 'LIVE' : 'UPCOMING'}
                        </Badge>
                      </div>
                    </Card>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Ticket className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No active entries yet</p>
                  <p className="text-sm text-muted-foreground">Enter a giveaway to see your entries here!</p>
                </div>
              )}
            </div>
            {userActiveUpcomingEntries.length > 0 && (
              <div className="pt-4 border-t border-border">
                <p className="text-center text-sm text-muted-foreground">
                  Total entries in active/upcoming giveaways: <span className="font-bold text-foreground">{userActiveUpcomingEntries.length}</span>
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Giveaway Dialog */}
        <Dialog open={showAddGiveawayDialog} onOpenChange={(open) => {
          setShowAddGiveawayDialog(open);
          if (!open) resetGiveawayForm();
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-2xl">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                Create New Giveaway
              </DialogTitle>
              <DialogDescription>
                Fill in the details below to create an exciting giveaway for your community.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateGiveaway} className="space-y-6 mt-4">
              {/* Title & Prize Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Giveaway Title *
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., Weekly Cash Giveaway"
                    value={giveawayForm.title}
                    onChange={(e) => setGiveawayForm({ ...giveawayForm, title: e.target.value })}
                    className="bg-background/50"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="prize" className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-primary" />
                    Prize *
                  </Label>
                  <Input
                    id="prize"
                    placeholder="e.g., $1,000,000 In-Game Cash"
                    value={giveawayForm.prize}
                    onChange={(e) => setGiveawayForm({ ...giveawayForm, prize: e.target.value })}
                    className="bg-background/50"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe your giveaway, rules, and what participants can win..."
                  value={giveawayForm.description}
                  onChange={(e) => setGiveawayForm({ ...giveawayForm, description: e.target.value })}
                  className="bg-background/50 min-h-[100px]"
                />
              </div>

              {/* Prize Image URL */}
              <div className="space-y-2">
                <Label htmlFor="prize_image_url" className="flex items-center gap-2">
                  <Image className="w-4 h-4 text-green-500" />
                  Prize Image URL
                </Label>
                <Input
                  id="prize_image_url"
                  type="url"
                  placeholder="https://example.com/prize-image.jpg"
                  value={giveawayForm.prize_image_url}
                  onChange={(e) => setGiveawayForm({ ...giveawayForm, prize_image_url: e.target.value })}
                  className="bg-background/50"
                />
                {giveawayForm.prize_image_url && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-border/50 max-h-32">
                    <img 
                      src={giveawayForm.prize_image_url} 
                      alt="Prize preview" 
                      className="w-full h-32 object-cover"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                )}
              </div>

              {/* Dates Section */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20">
                <h4 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                  <CalendarDays className="w-5 h-5 text-primary" />
                  Schedule
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date & Time *</Label>
                    <Input
                      id="start_date"
                      type="datetime-local"
                      value={giveawayForm.start_date}
                      onChange={(e) => setGiveawayForm({ ...giveawayForm, start_date: e.target.value })}
                      className="bg-background/50"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date & Time *</Label>
                    <Input
                      id="end_date"
                      type="datetime-local"
                      value={giveawayForm.end_date}
                      onChange={(e) => setGiveawayForm({ ...giveawayForm, end_date: e.target.value })}
                      className="bg-background/50"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Settings Section */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-accent/5 to-primary/5 border border-accent/20">
                <h4 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-accent" />
                  Settings
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max_entries" className="flex items-center gap-2">
                      <Hash className="w-4 h-4" />
                      Max Entries
                    </Label>
                    <Input
                      id="max_entries"
                      type="number"
                      min="1"
                      placeholder="Unlimited"
                      value={giveawayForm.max_entries}
                      onChange={(e) => setGiveawayForm({ ...giveawayForm, max_entries: e.target.value })}
                      className="bg-background/50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="winner_count" className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-500" />
                      Winner Count
                    </Label>
                    <Input
                      id="winner_count"
                      type="number"
                      min="1"
                      value={giveawayForm.winner_count}
                      onChange={(e) => setGiveawayForm({ ...giveawayForm, winner_count: e.target.value })}
                      className="bg-background/50"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">Initial Status</Label>
                    <Select 
                      value={giveawayForm.status} 
                      onValueChange={(value) => setGiveawayForm({ ...giveawayForm, status: value })}
                    >
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upcoming">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-yellow-500" />
                            Upcoming
                          </div>
                        </SelectItem>
                        <SelectItem value="active">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-green-500" />
                            Active (Live)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      Category
                    </Label>
                    <Select 
                      value={giveawayForm.category} 
                      onValueChange={(value) => setGiveawayForm({ ...giveawayForm, category: value })}
                    >
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-green-500" />
                            All Members
                          </div>
                        </SelectItem>
                        <SelectItem value="whitelisted">
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-yellow-500" />
                            Whitelisted Only
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowAddGiveawayDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  disabled={isCreatingGiveaway}
                >
                  {isCreatingGiveaway ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4 mr-2" />
                      Create Giveaway
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Giveaway Dialog */}
        <Dialog open={showEditGiveawayDialog} onOpenChange={(open) => {
          setShowEditGiveawayDialog(open);
          if (!open) {
            setSelectedGiveaway(null);
            resetGiveawayForm();
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-2xl">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center">
                  <Pencil className="w-6 h-6 text-white" />
                </div>
                Edit Giveaway
              </DialogTitle>
              <DialogDescription>
                Update the giveaway details below.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleUpdateGiveaway} className="space-y-6 mt-4">
              {/* Title & Prize Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title" className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Giveaway Title *
                  </Label>
                  <Input
                    id="edit-title"
                    placeholder="e.g., Weekly Cash Giveaway"
                    value={giveawayForm.title}
                    onChange={(e) => setGiveawayForm({ ...giveawayForm, title: e.target.value })}
                    className="bg-background/50"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-prize" className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-primary" />
                    Prize *
                  </Label>
                  <Input
                    id="edit-prize"
                    placeholder="e.g., $1,000,000 In-Game Cash"
                    value={giveawayForm.prize}
                    onChange={(e) => setGiveawayForm({ ...giveawayForm, prize: e.target.value })}
                    className="bg-background/50"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="edit-description" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  Description
                </Label>
                <Textarea
                  id="edit-description"
                  placeholder="Describe your giveaway..."
                  value={giveawayForm.description}
                  onChange={(e) => setGiveawayForm({ ...giveawayForm, description: e.target.value })}
                  className="bg-background/50 min-h-[80px]"
                />
              </div>

              {/* Prize Image URL */}
              <div className="space-y-2">
                <Label htmlFor="edit-prize_image_url" className="flex items-center gap-2">
                  <Image className="w-4 h-4 text-green-500" />
                  Prize Image URL
                </Label>
                <Input
                  id="edit-prize_image_url"
                  type="url"
                  placeholder="https://example.com/prize-image.jpg"
                  value={giveawayForm.prize_image_url}
                  onChange={(e) => setGiveawayForm({ ...giveawayForm, prize_image_url: e.target.value })}
                  className="bg-background/50"
                />
              </div>

              {/* Dates Section */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20">
                <h4 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                  <CalendarDays className="w-5 h-5 text-primary" />
                  Schedule
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-start_date">Start Date & Time *</Label>
                    <Input
                      id="edit-start_date"
                      type="datetime-local"
                      value={giveawayForm.start_date}
                      onChange={(e) => setGiveawayForm({ ...giveawayForm, start_date: e.target.value })}
                      className="bg-background/50"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-end_date">End Date & Time *</Label>
                    <Input
                      id="edit-end_date"
                      type="datetime-local"
                      value={giveawayForm.end_date}
                      onChange={(e) => setGiveawayForm({ ...giveawayForm, end_date: e.target.value })}
                      className="bg-background/50"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Settings Section */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-accent/5 to-primary/5 border border-accent/20">
                <h4 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-accent" />
                  Settings
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-max_entries">Max Entries</Label>
                    <Input
                      id="edit-max_entries"
                      type="number"
                      min="1"
                      placeholder="Unlimited"
                      value={giveawayForm.max_entries}
                      onChange={(e) => setGiveawayForm({ ...giveawayForm, max_entries: e.target.value })}
                      className="bg-background/50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-winner_count">Winner Count</Label>
                    <Input
                      id="edit-winner_count"
                      type="number"
                      min="1"
                      value={giveawayForm.winner_count}
                      onChange={(e) => setGiveawayForm({ ...giveawayForm, winner_count: e.target.value })}
                      className="bg-background/50"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select 
                      value={giveawayForm.status} 
                      onValueChange={(value) => setGiveawayForm({ ...giveawayForm, status: value })}
                    >
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upcoming">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-yellow-500" />
                            Upcoming
                          </div>
                        </SelectItem>
                        <SelectItem value="active">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-green-500" />
                            Active (Live)
                          </div>
                        </SelectItem>
                        <SelectItem value="ended">
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-muted-foreground" />
                            Ended
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-category">Category</Label>
                    <Select 
                      value={giveawayForm.category} 
                      onValueChange={(value) => setGiveawayForm({ ...giveawayForm, category: value })}
                    >
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-green-500" />
                            All Members
                          </div>
                        </SelectItem>
                        <SelectItem value="whitelisted">
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-yellow-500" />
                            Whitelisted Only
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowEditGiveawayDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-600 hover:opacity-90"
                  disabled={isUpdatingGiveaway}
                >
                  {isUpdatingGiveaway ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Update Giveaway
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                Delete Giveaway
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "<span className="font-semibold text-foreground">{selectedGiveaway?.title}</span>"? 
                This will also delete all entries and winner records. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingGiveaway}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteGiveaway}
                className="bg-destructive hover:bg-destructive/90"
                disabled={isDeletingGiveaway}
              >
                {isDeletingGiveaway ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Giveaway
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Giveaway Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Active
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="ended" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Ended
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {isLoading ? (
              <div className="text-center py-12">
                <Gift className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
                <p className="text-muted-foreground">Loading giveaways...</p>
              </div>
            ) : activeGiveaways.length > 0 ? (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {activeGiveaways.map(giveaway => (
                  <GiveawayCard
                    key={giveaway.id}
                    giveaway={giveaway}
                    userEntry={getUserEntry(giveaway.id)}
                    entryCount={entryCounts[giveaway.id] || 0}
                    onEnter={handleEnterGiveaway}
                    isEntering={isEntering}
                    isAdmin={isAdmin}
                    onEdit={handleEditGiveaway}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-12">
                <PartyPopper className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold mb-2">No Active Giveaways</h3>
                <p className="text-muted-foreground">Check back soon for exciting giveaways!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming">
            {upcomingGiveaways.length > 0 ? (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {upcomingGiveaways.map(giveaway => (
                  <GiveawayCard
                    key={giveaway.id}
                    giveaway={giveaway}
                    userEntry={getUserEntry(giveaway.id)}
                    entryCount={entryCounts[giveaway.id] || 0}
                    onEnter={handleEnterGiveaway}
                    isEntering={isEntering}
                    isAdmin={isAdmin}
                    onEdit={handleEditGiveaway}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold mb-2">No Upcoming Giveaways</h3>
                <p className="text-muted-foreground">Stay tuned for future giveaways!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="ended">
            {endedGiveaways.length > 0 ? (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {endedGiveaways.map(giveaway => (
                  <EndedGiveawayCard
                    key={giveaway.id}
                    giveaway={giveaway}
                    entryCount={entryCounts[giveaway.id] || 0}
                    winners={getWinnersForGiveaway(giveaway.id)}
                    isAdmin={isAdmin}
                    onEdit={handleEditGiveaway}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold mb-2">No Past Giveaways</h3>
                <p className="text-muted-foreground">Past giveaways will appear here.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Recent Winners Section */}
        {winners.length > 0 && (
          <motion.div 
            className="mt-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Crown className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl font-bold">Recent Winners</h2>
            </div>
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {winners.map(winner => (
                <WinnerCard 
                  key={winner.id} 
                  winner={winner} 
                  giveawayTitle={getGiveawayTitle(winner.giveaway_id)} 
                />
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* CTA Section */}
        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="glass-effect p-8 max-w-2xl mx-auto border-primary/30">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Gift className="w-8 h-8 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-2">Want More Giveaways?</h3>
            <p className="text-muted-foreground mb-6">
              Join our Discord community to stay updated on all giveaways and exclusive events!
            </p>
            <Button 
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white"
              onClick={() => window.open("https://discord.gg/W2nU97maBh", "_blank")}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Join Discord
            </Button>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Giveaway;
