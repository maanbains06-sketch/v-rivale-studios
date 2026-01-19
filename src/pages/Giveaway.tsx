import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Gift, 
  Trophy, 
  Clock, 
  Sparkles, 
  CheckCircle2,
  XCircle,
  Ticket,
  CalendarDays,
  Crown,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, differenceInSeconds, differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";
import headerGiveaway from "@/assets/header-giveaway.jpg";

interface Giveaway {
  id: string;
  title: string;
  description: string | null;
  prize: string;
  prize_image_url: string | null;
  start_date: string;
  end_date: string;
  status: string;
  category: string;
  winner_count: number;
  max_entries: number | null;
}

interface GiveawayEntry {
  id: string;
  giveaway_id: string;
  user_id: string;
  entry_count: number;
  is_winner: boolean;
  discord_username: string | null;
}

interface GiveawayStats {
  totalGiveaways: number;
  activeGiveaways: number;
  totalEntries: number;
  totalWinners: number;
}

const Giveaway = () => {
  const { toast } = useToast();
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [userEntries, setUserEntries] = useState<GiveawayEntry[]>([]);
  const [stats, setStats] = useState<GiveawayStats>({
    totalGiveaways: 0,
    activeGiveaways: 0,
    totalEntries: 0,
    totalWinners: 0
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [enteringId, setEnteringId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("active");

  useEffect(() => {
    fetchData();
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      fetchUserEntries(user.id);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: giveawaysData, error } = await supabase
        .from("giveaways")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGiveaways(giveawaysData || []);

      const active = giveawaysData?.filter(g => g.status === "active") || [];

      const { count: entriesCount } = await supabase
        .from("giveaway_entries")
        .select("*", { count: "exact", head: true });

      const { count: winnersCount } = await supabase
        .from("giveaway_winners")
        .select("*", { count: "exact", head: true });

      setStats({
        totalGiveaways: giveawaysData?.length || 0,
        activeGiveaways: active.length,
        totalEntries: entriesCount || 0,
        totalWinners: winnersCount || 0
      });
    } catch (error) {
      console.error("Error fetching giveaways:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserEntries = async (userId: string) => {
    const { data, error } = await supabase
      .from("giveaway_entries")
      .select("*")
      .eq("user_id", userId);

    if (!error && data) {
      setUserEntries(data);
    }
  };

  const enterGiveaway = async (giveawayId: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to enter the giveaway.",
        variant: "destructive",
      });
      return;
    }

    setEnteringId(giveawayId);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("discord_username, discord_id")
        .eq("id", user.id)
        .single();

      const { error } = await supabase.from("giveaway_entries").insert({
        giveaway_id: giveawayId,
        user_id: user.id,
        discord_username: profile?.discord_username || null,
        discord_id: profile?.discord_id || null,
        entry_count: 1,
      });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already Entered",
            description: "You have already entered this giveaway!",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Entry Successful! 🎉",
          description: "You've been entered into the giveaway. Good luck!",
        });
        fetchUserEntries(user.id);
        fetchData();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to enter giveaway.",
        variant: "destructive",
      });
    } finally {
      setEnteringId(null);
    }
  };

  const hasEntered = (giveawayId: string) => {
    return userEntries.some(e => e.giveaway_id === giveawayId);
  };

  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = differenceInSeconds(end, now);

    if (diff <= 0) return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };

    return {
      expired: false,
      days: differenceInDays(end, now),
      hours: differenceInHours(end, now) % 24,
      minutes: differenceInMinutes(end, now) % 60,
      seconds: diff % 60
    };
  };

  const activeGiveaways = giveaways.filter(g => g.status === "active");
  const upcomingGiveaways = giveaways.filter(g => g.status === "scheduled" || new Date(g.start_date) > new Date());
  const pastGiveaways = giveaways.filter(g => g.status === "ended" || g.status === "completed");

  const GiveawayCard = ({ giveaway, showCountdown = true }: { giveaway: Giveaway; showCountdown?: boolean }) => {
    const [timeLeft, setTimeLeft] = useState(getTimeRemaining(giveaway.end_date));
    const entered = hasEntered(giveaway.id);

    useEffect(() => {
      if (!showCountdown || giveaway.status !== "active") return;
      const timer = setInterval(() => {
        setTimeLeft(getTimeRemaining(giveaway.end_date));
      }, 1000);
      return () => clearInterval(timer);
    }, [giveaway.end_date, giveaway.status, showCountdown]);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ scale: 1.02 }}
        className="group"
      >
        <Card className="glass-effect border-border/30 overflow-hidden hover:border-primary/50 transition-all duration-300">
          {giveaway.prize_image_url && (
            <div className="relative h-48 overflow-hidden">
              <img
                src={giveaway.prize_image_url}
                alt={giveaway.prize}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
              <Badge 
                className={`absolute top-3 right-3 ${
                  giveaway.status === "active" ? "bg-green-500" : 
                  giveaway.status === "ended" ? "bg-red-500" : "bg-amber-500"
                }`}
              >
                {giveaway.status === "active" ? "🔴 LIVE" : giveaway.status}
              </Badge>
            </div>
          )}
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gift className="w-5 h-5 text-primary" />
              {giveaway.title}
            </CardTitle>
            <CardDescription className="line-clamp-2">{giveaway.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">Prize</p>
              <p className="font-semibold text-primary">{giveaway.prize}</p>
            </div>

            {showCountdown && giveaway.status === "active" && !timeLeft.expired && (
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { value: timeLeft.days, label: "Days" },
                  { value: timeLeft.hours, label: "Hrs" },
                  { value: timeLeft.minutes, label: "Min" },
                  { value: timeLeft.seconds, label: "Sec" }
                ].map((item, i) => (
                  <div key={i} className="p-2 rounded-lg bg-muted/50 border border-border/30">
                    <div className="text-xl font-mono font-bold text-primary">
                      {String(item.value).padStart(2, '0')}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase">{item.label}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Trophy className="w-4 h-4" />
                <span>{giveaway.winner_count} Winner{giveaway.winner_count > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <CalendarDays className="w-4 h-4" />
                <span>{format(new Date(giveaway.end_date), "MMM d, yyyy")}</span>
              </div>
            </div>

            {giveaway.status === "active" && (
              <Button
                onClick={() => enterGiveaway(giveaway.id)}
                disabled={entered || enteringId === giveaway.id}
                className={`w-full ${entered ? "bg-green-600 hover:bg-green-700" : ""}`}
              >
                {enteringId === giveaway.id ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : entered ? (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                ) : (
                  <Ticket className="w-4 h-4 mr-2" />
                )}
                {entered ? "Entered!" : "Enter Giveaway"}
              </Button>
            )}

            {giveaway.status === "ended" && (
              <Button variant="outline" disabled className="w-full">
                <XCircle className="w-4 h-4 mr-2" />
                Giveaway Ended
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <PageHeader
        title="Exclusive Giveaways"
        description="Win epic prizes, in-game items, and exclusive rewards! Enter our active giveaways for your chance to win."
        backgroundImage={headerGiveaway}
      />

      <main className="pb-16">
        <div className="container mx-auto px-4">
          {/* Stats Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 -mt-8 relative z-10"
          >
            {[
              { icon: Gift, label: "Total Giveaways", value: stats.totalGiveaways, color: "text-primary" },
              { icon: Sparkles, label: "Running Now", value: stats.activeGiveaways, color: "text-green-400" },
              { icon: Ticket, label: "Total Entries", value: stats.totalEntries, color: "text-amber-400" },
              { icon: Crown, label: "Winners", value: stats.totalWinners, color: "text-purple-400" }
            ].map((stat, i) => (
              <Card key={i} className="glass-effect border-border/30 overflow-hidden">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-3 rounded-lg bg-muted/50 ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          {/* Filter Tabs */}
          <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-grid gap-1">
              <TabsTrigger value="active" className="gap-2">
                <Sparkles className="w-4 h-4" />
                <span className="hidden md:inline">Running</span>
                <Badge variant="secondary" className="ml-1">{activeGiveaways.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="gap-2">
                <Clock className="w-4 h-4" />
                <span className="hidden md:inline">Upcoming</span>
                <Badge variant="secondary" className="ml-1">{upcomingGiveaways.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="past" className="gap-2">
                <Trophy className="w-4 h-4" />
                <span className="hidden md:inline">Past</span>
                <Badge variant="secondary" className="ml-1">{pastGiveaways.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-6">
              {activeGiveaways.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {activeGiveaways.map((giveaway) => (
                      <GiveawayCard key={giveaway.id} giveaway={giveaway} />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <Card className="glass-effect border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <Gift className="w-16 h-16 text-muted-foreground/30 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Active Giveaways</h3>
                    <p className="text-muted-foreground max-w-md">
                      Check back soon! We regularly host new giveaways with amazing prizes.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="upcoming" className="mt-6">
              {upcomingGiveaways.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {upcomingGiveaways.map((giveaway) => (
                      <GiveawayCard key={giveaway.id} giveaway={giveaway} showCountdown={false} />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <Card className="glass-effect border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <Clock className="w-16 h-16 text-muted-foreground/30 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Upcoming Giveaways</h3>
                    <p className="text-muted-foreground max-w-md">
                      Stay tuned for announcements about upcoming giveaways!
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="past" className="mt-6">
              {pastGiveaways.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {pastGiveaways.map((giveaway) => (
                      <GiveawayCard key={giveaway.id} giveaway={giveaway} showCountdown={false} />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <Card className="glass-effect border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <Trophy className="w-16 h-16 text-muted-foreground/30 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Past Giveaways</h3>
                    <p className="text-muted-foreground max-w-md">
                      Previous giveaway results will appear here.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* User's Entries Section */}
          {user && userEntries.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12"
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Ticket className="w-6 h-6 text-primary" />
                Your Entries
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userEntries.map((entry) => {
                  const giveaway = giveaways.find(g => g.id === entry.giveaway_id);
                  if (!giveaway) return null;
                  return (
                    <Card key={entry.id} className="glass-effect border-border/30">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{giveaway.title}</p>
                            <p className="text-sm text-muted-foreground">
                              Entries: {entry.entry_count}
                            </p>
                          </div>
                          {entry.is_winner ? (
                            <Badge className="bg-amber-500">
                              <Crown className="w-3 h-3 mr-1" />
                              Winner!
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Entered
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Giveaway;
