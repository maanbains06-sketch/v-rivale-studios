import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Star, ThumbsUp, Crown, Gift, Clock, Users, Sparkles, Medal, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import Navigation from "@/components/Navigation";
import { motion, AnimatePresence } from "framer-motion";

interface Poll {
  id: string;
  category_id: string;
  title: string;
  description: string | null;
  prize: string | null;
  starts_at: string;
  ends_at: string;
  status: string;
  winner_announced_at: string | null;
}

interface PollNominee {
  id: string;
  poll_id: string;
  nominee_name: string;
  nominee_image_url: string | null;
  nominee_description: string | null;
  vote_count: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

interface HallOfFameEntry {
  id: string;
  category_name: string;
  winner_name: string;
  winner_image_url: string | null;
  prize: string | null;
  vote_count: number;
  total_votes: number;
  week_label: string | null;
  created_at: string;
}

// Countdown Timer Component
const CountdownTimer = ({ endDate }: { endDate: string }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const update = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) { setExpired(true); return; }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  if (expired) return (
    <div className="text-center">
      <Badge variant="secondary" className="text-sm px-4 py-1.5 animate-pulse">
        <Clock className="w-4 h-4 mr-1" /> Voting Ended
      </Badge>
    </div>
  );

  const blocks = [
    { label: "DAYS", value: timeLeft.days },
    { label: "HRS", value: timeLeft.hours },
    { label: "MIN", value: timeLeft.minutes },
    { label: "SEC", value: timeLeft.seconds },
  ];

  return (
    <div className="flex items-center justify-center gap-2 md:gap-3">
      {blocks.map((b, i) => (
        <div key={b.label} className="flex items-center gap-2 md:gap-3">
          <motion.div
            key={b.value}
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex flex-col items-center justify-center backdrop-blur-sm shadow-lg shadow-primary/5">
              <span className="text-2xl md:text-3xl font-bold text-foreground tabular-nums">
                {String(b.value).padStart(2, "0")}
              </span>
              <span className="text-[9px] md:text-[10px] font-semibold text-primary/70 tracking-widest">
                {b.label}
              </span>
            </div>
          </motion.div>
          {i < 3 && <span className="text-xl md:text-2xl font-bold text-primary/40 -mt-2">:</span>}
        </div>
      ))}
    </div>
  );
};

// Winner Celebration Component
const WinnerCelebration = ({ winnerName, categoryName }: { winnerName: string; categoryName: string }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ type: "spring", damping: 10, stiffness: 100 }}
    className="text-center py-6"
  >
    <motion.div
      animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
      transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
      className="text-6xl mb-3"
    >
      🏆
    </motion.div>
    <motion.h3
      initial={{ y: 20 }}
      animate={{ y: 0 }}
      className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-primary to-yellow-400 bg-clip-text text-transparent"
    >
      {winnerName}
    </motion.h3>
    <p className="text-sm text-muted-foreground mt-1">Winner — {categoryName}</p>
  </motion.div>
);

const Awards = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [nominees, setNominees] = useState<Record<string, PollNominee[]>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [hallOfFame, setHallOfFame] = useState<HallOfFameEntry[]>([]);
  const [user, setUser] = useState<any>(null);
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [awardsHidden, setAwardsHidden] = useState(false);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    // Check visibility
    const { data: setting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "awards_hidden")
      .maybeSingle();

    const hidden = setting?.value === "true";
    setAwardsHidden(hidden);

    // Check if owner
    if (user) {
      const { data: ownerSetting } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "owner_discord_id")
        .maybeSingle();

      const userDiscordId = (user as any).user_metadata?.discord_id ||
        (user as any).user_metadata?.provider_id ||
        (user as any).user_metadata?.sub;

      setIsOwner(ownerSetting?.value === userDiscordId);
    }

    // Load categories
    const { data: cats } = await supabase.from("award_categories").select("*").eq("is_active", true).order("display_order");
    if (cats) setCategories(cats);

    // Load active polls
    const { data: pollsData } = await supabase
      .from("award_polls")
      .select("*")
      .order("created_at", { ascending: false });

    if (pollsData) {
      setPolls(pollsData);

      const nomMap: Record<string, PollNominee[]> = {};
      const votesMap: Record<string, string> = {};

      for (const poll of pollsData) {
        const { data: noms } = await supabase
          .from("award_poll_nominees")
          .select("*")
          .eq("poll_id", poll.id)
          .order("display_order");

        const { data: votes } = await supabase
          .from("award_poll_votes")
          .select("poll_nominee_id, user_id")
          .eq("poll_id", poll.id);

        if (noms) {
          nomMap[poll.id] = noms.map(n => ({
            ...n,
            vote_count: votes?.filter(v => v.poll_nominee_id === n.id).length || 0,
          })).sort((a, b) => b.vote_count - a.vote_count);
        }

        if (user && votes) {
          const userVote = votes.find(v => v.user_id === user.id);
          if (userVote) votesMap[poll.id] = userVote.poll_nominee_id;
        }
      }

      setNominees(nomMap);
      setUserVotes(votesMap);
    }

    // Load Hall of Fame
    const { data: hof } = await supabase
      .from("award_hall_of_fame")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (hof) setHallOfFame(hof);

    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Realtime voting updates
  useEffect(() => {
    const channel = supabase
      .channel("award-votes-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "award_poll_votes" }, () => {
        loadData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  const handleVote = async (pollId: string, nomineeId: string) => {
    if (!user) {
      toast({ title: "Login Required", description: "Please login with Discord to vote.", variant: "destructive" });
      return;
    }

    setVotingId(nomineeId);
    const existingVote = userVotes[pollId];

    if (existingVote) {
      // Remove existing vote
      await supabase.from("award_poll_votes").delete().eq("poll_id", pollId).eq("user_id", user.id);
    }

    if (existingVote !== nomineeId) {
      // Cast new vote
      const { error } = await supabase.from("award_poll_votes").insert({
        poll_id: pollId,
        poll_nominee_id: nomineeId,
        user_id: user.id,
      });
      if (error && error.code === "23505") {
        toast({ title: "Already voted", variant: "destructive" });
      } else if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "🎉 Vote cast!" });
      }
    } else {
      toast({ title: "Vote removed" });
    }

    setVotingId(null);
    loadData();
  };

  // If hidden and not owner, show nothing
  if (!loading && awardsHidden && !isOwner) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 pt-24 pb-16 text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
          <h1 className="text-2xl font-bold text-muted-foreground">Awards Coming Soon</h1>
          <p className="text-muted-foreground mt-2">Weekly awards will be available soon. Stay tuned!</p>
        </main>
      </div>
    );
  }

  const activePolls = polls.filter(p => p.status === "active" && new Date(p.ends_at) > new Date());
  const endedPolls = polls.filter(p => p.status === "ended" || (p.status === "active" && new Date(p.ends_at) <= new Date()));

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Weekly Awards</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
            🏆 Skylife Weekly Awards
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Vote for the best of the best in Skylife Roleplay India! New polls every week with exciting prizes.
          </p>
          {awardsHidden && isOwner && (
            <Badge variant="destructive" className="mt-3">🔒 Hidden from users — Only you can see this</Badge>
          )}
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="w-full flex h-auto gap-2 bg-transparent p-0 mb-8 justify-center">
              <TabsTrigger value="active" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-5 py-2.5 rounded-lg border border-border/30 gap-2">
                <Trophy className="w-4 h-4" /> Active Polls ({activePolls.length})
              </TabsTrigger>
              <TabsTrigger value="ended" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-5 py-2.5 rounded-lg border border-border/30 gap-2">
                <Crown className="w-4 h-4" /> Results ({endedPolls.length})
              </TabsTrigger>
              <TabsTrigger value="hall-of-fame" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-5 py-2.5 rounded-lg border border-border/30 gap-2">
                <History className="w-4 h-4" /> Hall of Fame
              </TabsTrigger>
            </TabsList>

            {/* Active Polls */}
            <TabsContent value="active">
              {activePolls.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-lg font-medium">No active polls right now</p>
                  <p className="text-sm">Check back soon for the next weekly awards!</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {activePolls.map(poll => {
                    const cat = categories.find(c => c.id === poll.category_id);
                    const pollNominees = nominees[poll.id] || [];
                    const totalVotes = pollNominees.reduce((s, n) => s + n.vote_count, 0);

                    return (
                      <motion.div key={poll.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        {/* Countdown */}
                        <div className="mb-6">
                          <p className="text-center text-xs text-muted-foreground mb-3 uppercase tracking-widest">Voting ends in</p>
                          <CountdownTimer endDate={poll.ends_at} />
                        </div>

                        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-background">
                          <CardHeader className="text-center pb-4">
                            <span className="text-4xl mb-2">{cat?.icon || "🏆"}</span>
                            <CardTitle className="text-2xl">{poll.title}</CardTitle>
                            {poll.description && <CardDescription className="text-base">{poll.description}</CardDescription>}
                            {poll.prize && (
                              <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/30 mx-auto">
                                <Gift className="w-4 h-4 text-yellow-500" />
                                <span className="text-sm font-medium text-yellow-400">{poll.prize}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
                              <Users className="w-4 h-4" />
                              <span>{totalVotes} total votes</span>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid gap-3 max-w-2xl mx-auto">
                              {pollNominees.map((nom, idx) => {
                                const pct = totalVotes > 0 ? Math.round((nom.vote_count / totalVotes) * 100) : 0;
                                const isVoted = userVotes[poll.id] === nom.id;
                                const isLeading = idx === 0 && nom.vote_count > 0;

                                return (
                                  <motion.div
                                    key={nom.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.08 }}
                                    whileHover={{ scale: 1.01 }}
                                    onClick={() => handleVote(poll.id, nom.id)}
                                    className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all ${
                                      isVoted
                                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                                        : "border-border/30 hover:border-primary/40 bg-card"
                                    }`}
                                  >
                                    <div className="flex items-center gap-4">
                                      {/* Avatar / Rank */}
                                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 ${
                                        isLeading
                                          ? "bg-gradient-to-br from-yellow-500 to-yellow-600 text-yellow-950"
                                          : isVoted
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-muted-foreground"
                                      }`}>
                                        {nom.nominee_image_url ? (
                                          <img src={nom.nominee_image_url} alt={nom.nominee_name} className="w-full h-full rounded-xl object-cover" />
                                        ) : (
                                          idx + 1
                                        )}
                                      </div>

                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <p className="font-semibold text-foreground truncate">{nom.nominee_name}</p>
                                          {isLeading && (
                                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px] px-1.5">
                                              <Crown className="w-3 h-3 mr-0.5" /> Leading
                                            </Badge>
                                          )}
                                          {isVoted && (
                                            <Badge variant="default" className="text-[10px] px-1.5">
                                              Your Vote
                                            </Badge>
                                          )}
                                        </div>
                                        {nom.nominee_description && (
                                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{nom.nominee_description}</p>
                                        )}
                                        {/* Vote bar */}
                                        <div className="mt-2 flex items-center gap-3">
                                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                            <motion.div
                                              initial={{ width: 0 }}
                                              animate={{ width: `${pct}%` }}
                                              transition={{ duration: 0.8, ease: "easeOut" }}
                                              className={`h-full rounded-full ${isLeading ? "bg-gradient-to-r from-yellow-500 to-yellow-400" : "bg-primary"}`}
                                            />
                                          </div>
                                          <span className="text-xs font-medium text-muted-foreground w-20 text-right">
                                            {nom.vote_count} ({pct}%)
                                          </span>
                                        </div>
                                      </div>

                                      {/* Vote indicator */}
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                        isVoted ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground"
                                      }`}>
                                        {votingId === nom.id ? (
                                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                          <ThumbsUp className={`w-4 h-4 ${isVoted ? "fill-current" : ""}`} />
                                        )}
                                      </div>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Results */}
            <TabsContent value="ended">
              {endedPolls.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <Medal className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-lg font-medium">No completed polls yet</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {endedPolls.map(poll => {
                    const cat = categories.find(c => c.id === poll.category_id);
                    const pollNominees = nominees[poll.id] || [];
                    const totalVotes = pollNominees.reduce((s, n) => s + n.vote_count, 0);
                    const winner = pollNominees[0];

                    return (
                      <Card key={poll.id} className="overflow-hidden">
                        <CardHeader className="text-center">
                          {winner && poll.winner_announced_at && (
                            <WinnerCelebration winnerName={winner.nominee_name} categoryName={cat?.name || poll.title} />
                          )}
                          <CardTitle className="text-lg">{poll.title}</CardTitle>
                          {poll.prize && (
                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                              <Gift className="w-4 h-4" /> {poll.prize}
                            </div>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 max-w-xl mx-auto">
                            {pollNominees.map((nom, idx) => {
                              const pct = totalVotes > 0 ? Math.round((nom.vote_count / totalVotes) * 100) : 0;
                              return (
                                <div key={nom.id} className={`flex items-center gap-3 p-3 rounded-lg ${idx === 0 ? "bg-yellow-500/10 border border-yellow-500/20" : "bg-muted/20"}`}>
                                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${idx === 0 ? "bg-yellow-500 text-yellow-950" : "bg-muted text-muted-foreground"}`}>
                                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                                  </span>
                                  <span className="flex-1 font-medium text-sm">{nom.nominee_name}</span>
                                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${idx === 0 ? "bg-yellow-500" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className="text-xs text-muted-foreground w-16 text-right">{nom.vote_count} ({pct}%)</span>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Hall of Fame */}
            <TabsContent value="hall-of-fame">
              {hallOfFame.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-lg font-medium">Hall of Fame is empty</p>
                  <p className="text-sm">Winners will appear here after announcements</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {hallOfFame.map((entry, idx) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Card className="overflow-hidden bg-gradient-to-br from-yellow-500/5 to-background border-yellow-500/20 hover:border-yellow-500/40 transition-all">
                        {entry.winner_image_url && (
                          <div className="w-full h-32 overflow-hidden">
                            <img src={entry.winner_image_url} alt={entry.winner_name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <CardContent className="p-4 text-center">
                          <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                          <h3 className="font-bold text-lg text-foreground">{entry.winner_name}</h3>
                          <Badge variant="secondary" className="mt-1 text-xs">{entry.category_name}</Badge>
                          {entry.week_label && (
                            <p className="text-xs text-muted-foreground mt-2">{entry.week_label}</p>
                          )}
                          <div className="flex items-center justify-center gap-2 mt-2 text-xs text-muted-foreground">
                            <ThumbsUp className="w-3 h-3" /> {entry.vote_count}/{entry.total_votes} votes
                          </div>
                          {entry.prize && (
                            <div className="flex items-center justify-center gap-1 mt-1 text-xs text-yellow-400">
                              <Gift className="w-3 h-3" /> {entry.prize}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default Awards;
