import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Clock, Users, Trophy, Sparkles, Calendar, ChevronRight, Star, Crown, Ticket, Check, Timer, Award, PartyPopper, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import headerImage from "@/assets/header-store.jpg";

// Replace with your Discord ID for admin access
const ADMIN_DISCORD_ID = "523855030329065474";

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
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const CountdownTimer = ({ endDate }: { endDate: string }) => {
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

  return (
    <div className="flex gap-2 justify-center">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="flex flex-col items-center">
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-lg px-3 py-2 min-w-[50px]">
            <span className="text-xl font-bold text-primary">{value.toString().padStart(2, '0')}</span>
          </div>
          <span className="text-xs text-muted-foreground mt-1 capitalize">{unit}</span>
        </div>
      ))}
    </div>
  );
};

const GiveawayCard = ({ 
  giveaway, 
  userEntry,
  entryCount,
  onEnter, 
  isEntering 
}: { 
  giveaway: Giveaway;
  userEntry: GiveawayEntry | null;
  entryCount: number;
  onEnter: (id: string) => void;
  isEntering: boolean;
}) => {
  const isActive = giveaway.status === 'active';
  const isUpcoming = giveaway.status === 'upcoming';
  const isEnded = giveaway.status === 'ended';
  const hasEntered = !!userEntry;
  const progress = giveaway.max_entries ? (entryCount / giveaway.max_entries) * 100 : 0;

  const getStatusBadge = () => {
    if (isActive) return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 animate-pulse">LIVE NOW</Badge>;
    if (isUpcoming) return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">COMING SOON</Badge>;
    if (isEnded) return <Badge className="bg-muted text-muted-foreground border-muted">ENDED</Badge>;
    return null;
  };

  return (
    <motion.div variants={itemVariants}>
      <Card className="glass-effect overflow-hidden group hover:border-primary/40 transition-all duration-300 relative">
        {/* Glow effect for active giveaways */}
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 animate-pulse" />
        )}
        
        {/* Prize Image */}
        {giveaway.prize_image_url && (
          <div className="relative h-48 overflow-hidden">
            <img 
              src={giveaway.prize_image_url} 
              alt={giveaway.prize}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            <div className="absolute top-3 right-3">
              {getStatusBadge()}
            </div>
          </div>
        )}
        
        {!giveaway.prize_image_url && (
          <div className="relative h-48 bg-gradient-to-br from-primary/20 via-primary/10 to-background flex items-center justify-center">
            <Gift className="w-20 h-20 text-primary/40" />
            <div className="absolute top-3 right-3">
              {getStatusBadge()}
            </div>
          </div>
        )}

        <CardContent className="p-6 relative">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-bold text-headline line-clamp-2">{giveaway.title}</h3>
          </div>
          
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
            {giveaway.description || "Enter for a chance to win amazing prizes!"}
          </p>

          {/* Prize Display */}
          <div className="flex items-center gap-2 mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className="font-semibold text-foreground">{giveaway.prize}</span>
          </div>

          {/* Countdown Timer */}
          {(isActive || isUpcoming) && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                <Timer className="w-4 h-4" />
                <span>{isUpcoming ? "Starts in" : "Ends in"}</span>
              </div>
              <CountdownTimer endDate={isUpcoming ? giveaway.start_date : giveaway.end_date} />
            </div>
          )}

          {/* Entry Progress */}
          {giveaway.max_entries && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Entries</span>
                <span className="text-foreground">{entryCount} / {giveaway.max_entries}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Entry Stats */}
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{entryCount} entries</span>
            </div>
            <div className="flex items-center gap-1">
              <Award className="w-4 h-4" />
              <span>{giveaway.winner_count} winner{giveaway.winner_count > 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Action Button */}
          {isActive && !hasEntered && (
            <Button 
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
              onClick={() => onEnter(giveaway.id)}
              disabled={isEntering}
            >
              <Ticket className="w-4 h-4 mr-2" />
              {isEntering ? "Entering..." : "Enter Giveaway"}
            </Button>
          )}

          {isActive && hasEntered && (
            <Button className="w-full" variant="outline" disabled>
              <Check className="w-4 h-4 mr-2 text-green-500" />
              You're Entered!
            </Button>
          )}

          {isUpcoming && (
            <Button className="w-full" variant="outline" disabled>
              <Clock className="w-4 h-4 mr-2" />
              Coming Soon
            </Button>
          )}

          {isEnded && (
            <Button className="w-full" variant="outline" disabled>
              <Trophy className="w-4 h-4 mr-2" />
              Giveaway Ended
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const WinnerCard = ({ winner, giveawayTitle }: { winner: GiveawayWinner; giveawayTitle: string }) => (
  <motion.div variants={itemVariants}>
    <Card className="glass-effect border-yellow-500/30 overflow-hidden">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center">
          <Crown className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-foreground">{winner.discord_username || "Anonymous Winner"}</p>
          <p className="text-sm text-muted-foreground">{giveawayTitle}</p>
        </div>
        <Badge className={winner.prize_claimed ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}>
          {winner.prize_claimed ? "Claimed" : "Pending"}
        </Badge>
      </CardContent>
    </Card>
  </motion.div>
);

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
  const [isAdmin, setIsAdmin] = useState(false);

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
    
    const discordUsername = user.user_metadata?.full_name || 
                           user.user_metadata?.name || 
                           user.user_metadata?.user_name || 
                           null;

    const { error } = await supabase
      .from('giveaway_entries')
      .insert({
        giveaway_id: giveawayId,
        user_id: user.id,
        discord_username: discordUsername,
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <PageHeader
        title="Giveaways"
        description="Win exclusive prizes, in-game items, and more!"
        badge="WIN BIG"
        backgroundImage={headerImage}
      />

      <div className="container mx-auto px-4 pb-16">
        {/* Hero Stats */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <Card className="glass-effect text-center p-4 hover:border-green-500/30 transition-colors cursor-pointer" onClick={() => setActiveTab("active")}>
              <Gift className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold text-foreground">{activeGiveaways.length}</p>
              <p className="text-sm text-muted-foreground">Active Giveaways</p>
              {activeGiveaways.length > 0 && (
                <Badge className="mt-2 bg-green-500/20 text-green-400 border-green-500/30 animate-pulse">LIVE</Badge>
              )}
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="glass-effect text-center p-4 hover:border-yellow-500/30 transition-colors cursor-pointer" onClick={() => setActiveTab("upcoming")}>
              <Calendar className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold text-foreground">{upcomingGiveaways.length}</p>
              <p className="text-sm text-muted-foreground">Coming Soon</p>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="glass-effect text-center p-4 hover:border-primary/30 transition-colors">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-foreground">{totalWinnersCount}</p>
              <p className="text-sm text-muted-foreground">Total Winners</p>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card 
              className="glass-effect text-center p-4 hover:border-accent/30 transition-colors cursor-pointer" 
              onClick={() => user ? setShowEntriesDialog(true) : toast({ title: "Login Required", description: "Please log in to view your entries.", variant: "destructive" })}
            >
              <Ticket className="w-8 h-8 mx-auto mb-2 text-accent" />
              <p className="text-2xl font-bold text-foreground">{userActiveUpcomingEntries.length}</p>
              <p className="text-sm text-muted-foreground">Your Entries</p>
              {user && userActiveUpcomingEntries.length > 0 && (
                <Badge className="mt-2 bg-accent/20 text-accent border-accent/30">Click to view</Badge>
              )}
            </Card>
          </motion.div>

          {isAdmin && (
            <motion.div variants={itemVariants}>
              <Card 
                className="glass-effect text-center p-4 hover:border-primary/50 transition-colors cursor-pointer bg-gradient-to-br from-primary/10 to-accent/10" 
                onClick={() => window.location.href = '/admin'}
              >
                <Plus className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-lg font-bold text-foreground">Add</p>
                <p className="text-sm text-muted-foreground">Giveaway</p>
                <Badge className="mt-2 bg-primary/20 text-primary border-primary/30">Admin</Badge>
              </Card>
            </motion.div>
          )}
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
                  <GiveawayCard
                    key={giveaway.id}
                    giveaway={giveaway}
                    userEntry={getUserEntry(giveaway.id)}
                    entryCount={entryCounts[giveaway.id] || 0}
                    onEnter={handleEnterGiveaway}
                    isEntering={isEntering}
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
