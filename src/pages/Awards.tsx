import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Star, Crown, Gift, Clock, Users, Sparkles, Medal, History, Zap, ChevronUp, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  discord_id: string | null;
  discord_username: string | null;
  server_name: string | null;
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
  winner_discord_id: string | null;
  winner_server_name: string | null;
  prize: string | null;
  vote_count: number;
  total_votes: number;
  week_label: string | null;
  created_at: string;
}

// ─── Countdown Timer ───────────────────────────────────────────────────────────
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
    <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-destructive/10 border border-destructive/30 w-fit mx-auto">
      <Clock className="w-4 h-4 text-destructive" />
      <span className="text-sm font-semibold text-destructive">Voting Ended</span>
    </div>
  );

  const blocks = [
    { label: "DAYS", value: timeLeft.days },
    { label: "HRS", value: timeLeft.hours },
    { label: "MIN", value: timeLeft.minutes },
    { label: "SEC", value: timeLeft.seconds },
  ];

  return (
    <div className="flex items-center justify-center gap-2 md:gap-4">
      {blocks.map((b, i) => (
        <div key={b.label} className="flex items-center gap-2 md:gap-4">
          <motion.div
            key={b.value}
            initial={{ rotateX: -90, opacity: 0 }}
            animate={{ rotateX: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            {/* Flip card effect */}
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-card border border-primary/20 shadow-lg shadow-primary/10 flex flex-col items-center justify-center relative overflow-hidden">
              {/* Top gradient */}
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-primary/10 to-transparent" />
              {/* Middle line */}
              <div className="absolute inset-x-0 top-1/2 h-px bg-border/60" />
              <span className="text-2xl md:text-3xl font-black text-foreground tabular-nums z-10 leading-none">
                {String(b.value).padStart(2, "0")}
              </span>
              <span className="text-[9px] font-bold text-primary tracking-[0.15em] z-10 mt-0.5">
                {b.label}
              </span>
            </div>
          </motion.div>
          {i < 3 && (
            <span className="text-2xl font-black text-primary/40 -mt-4 hidden md:block">:</span>
          )}
        </div>
      ))}
    </div>
  );
};

// ─── Nominee Card (Unique Profile Card Design) ──────────────────────────────
const NomineeCard = ({
  nom,
  idx,
  totalVotes,
  isVoted,
  isActive,
  isLeading,
  voting,
  onVote,
}: {
  nom: PollNominee;
  idx: number;
  totalVotes: number;
  isVoted: boolean;
  isActive: boolean;
  isLeading: boolean;
  voting: boolean;
  onVote: () => void;
}) => {
  const pct = totalVotes > 0 ? Math.round((nom.vote_count / totalVotes) * 100) : 0;
  const rankColors = ["from-yellow-500 to-amber-600", "from-slate-400 to-slate-500", "from-amber-600 to-amber-700"];
  const rankIcons = ["👑", "🥈", "🥉"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.1 }}
      className="group relative"
    >
      {/* Glow effect for voted / leading */}
      {(isVoted || isLeading) && (
        <div className={`absolute inset-0 rounded-2xl blur-xl opacity-30 -z-10 ${
          isLeading ? "bg-yellow-500" : "bg-primary"
        }`} />
      )}

      <div
        onClick={isActive ? onVote : undefined}
        className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${
          isActive ? "cursor-pointer" : "cursor-default"
        } ${
          isVoted
            ? "ring-2 ring-primary shadow-lg shadow-primary/20"
            : isLeading
            ? "ring-2 ring-yellow-500/60 shadow-lg shadow-yellow-500/10"
            : "ring-1 ring-border/30"
        } ${isActive ? "hover:scale-[1.02] hover:shadow-xl" : ""}`}
      >
        {/* Background with image or gradient */}
        <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-muted to-muted/50">
          {nom.nominee_image_url ? (
            <>
              <img
                src={nom.nominee_image_url}
                alt={nom.nominee_name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {/* Image overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${rankColors[idx] || "from-primary/30 to-primary/10"} flex items-center justify-center`}>
                <span className="text-4xl">{rankIcons[idx] || "⭐"}</span>
              </div>
            </div>
          )}

          {/* Rank badge */}
          <div className={`absolute top-3 left-3 w-9 h-9 rounded-full bg-gradient-to-br ${rankColors[idx] || "from-primary to-primary/70"} flex items-center justify-center shadow-lg`}>
            {idx < 3 ? (
              <span className="text-base">{rankIcons[idx]}</span>
            ) : (
              <span className="text-sm font-black text-white">#{idx + 1}</span>
            )}
          </div>

          {/* Status badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-1">
            {isLeading && (
              <Badge className="bg-yellow-500 text-yellow-950 border-0 text-[10px] font-bold px-2 shadow-lg">
                ⚡ LEADING
              </Badge>
            )}
            {isVoted && (
              <Badge className="bg-primary text-primary-foreground border-0 text-[10px] font-bold px-2 shadow-lg">
                ✓ YOUR VOTE
              </Badge>
            )}
          </div>
        </div>

        {/* Bottom content */}
        <div className="bg-card p-4">
          {/* Name & Discord tag */}
          <div className="mb-3">
            <h3 className="font-bold text-lg text-foreground leading-tight">{nom.nominee_name}</h3>
            {(nom.discord_username || nom.discord_id || nom.server_name) && (
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                {nom.discord_id
                  ? `<@${nom.discord_id}>`
                  : nom.discord_username
                  ? `@${nom.discord_username}`
                  : ""}
                {nom.server_name && (
                  <span className="text-primary">/{nom.server_name}</span>
                )}
              </p>
            )}
            {nom.nominee_description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{nom.nominee_description}</p>
            )}
          </div>

          {/* Vote bar */}
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{nom.vote_count} votes</span>
              <span className={`font-bold ${isLeading ? "text-yellow-500" : "text-primary"}`}>{pct}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: idx * 0.1 }}
                className={`h-full rounded-full ${
                  isLeading
                    ? "bg-gradient-to-r from-yellow-500 to-amber-400"
                    : isVoted
                    ? "bg-gradient-to-r from-primary to-primary/70"
                    : "bg-gradient-to-r from-primary/60 to-primary/40"
                }`}
              />
            </div>
          </div>

          {/* Vote button */}
          {isActive && (
            <button
              onClick={onVote}
              disabled={voting}
              className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                isVoted
                  ? "bg-primary/15 text-primary border border-primary/30 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95"
              }`}
            >
              {voting ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isVoted ? (
                <><ChevronUp className="w-4 h-4" /> Remove Vote</>
              ) : (
                <><Zap className="w-4 h-4" /> Vote Now</>
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ─── Winner Celebration ─────────────────────────────────────────────────────
const WinnerCelebration = ({ winner, categoryName }: { winner: PollNominee; categoryName: string }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ type: "spring", damping: 12, stiffness: 100 }}
    className="relative overflow-hidden rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 via-background to-amber-500/5"
  >
    {/* Glow */}
    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent" />

    <div className="relative flex flex-col md:flex-row items-center gap-6 p-6">
      {/* Big winner image */}
      {winner.nominee_image_url ? (
        <div className="relative shrink-0">
          <div className="w-36 h-36 md:w-44 md:h-44 rounded-2xl overflow-hidden border-4 border-yellow-500/50 shadow-2xl shadow-yellow-500/20">
            <img src={winner.nominee_image_url} alt={winner.nominee_name} className="w-full h-full object-cover" />
          </div>
          <div className="absolute -top-3 -right-3 w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-xl">👑</span>
          </div>
        </div>
      ) : (
        <motion.div
          animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, repeatDelay: 2 }}
          className="text-8xl shrink-0"
        >
          🏆
        </motion.div>
      )}

      {/* Details */}
      <div className="text-center md:text-left">
        <p className="text-xs text-yellow-500 font-bold tracking-[0.2em] uppercase mb-1">{categoryName} Winner</p>
        <motion.h3
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl md:text-4xl font-black bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent"
        >
          {winner.nominee_name}
        </motion.h3>

        {(winner.discord_username || winner.discord_id || winner.server_name) && (
          <p className="text-sm text-muted-foreground font-mono mt-1">
            {winner.discord_id ? `<@${winner.discord_id}>` : winner.discord_username ? `@${winner.discord_username}` : ""}
            {winner.server_name && <span className="text-yellow-500">/{winner.server_name}</span>}
          </p>
        )}

        <p className="text-muted-foreground text-sm mt-2">
          🎉 Congratulations! The community has spoken.
        </p>
      </div>
    </div>
  </motion.div>
);

// ─── Main Awards Component ──────────────────────────────────────────────────
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

    const { data: setting } = await supabase.from("site_settings").select("value").eq("key", "awards_hidden").maybeSingle();
    const hidden = setting?.value === "true";
    setAwardsHidden(hidden);

    if (user) {
      const { data: ownerSetting } = await supabase.from("site_settings").select("value").eq("key", "owner_discord_id").maybeSingle();
      const userDiscordId = (user as any).user_metadata?.discord_id || (user as any).user_metadata?.provider_id || (user as any).user_metadata?.sub;
      setIsOwner(ownerSetting?.value === userDiscordId);
    }

    const { data: cats } = await supabase.from("award_categories").select("*").eq("is_active", true).order("display_order");
    if (cats) setCategories(cats);

    const { data: pollsData } = await supabase.from("award_polls").select("*").order("created_at", { ascending: false });

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
          nomMap[poll.id] = noms.map((n: any) => ({
            ...n,
            vote_count: votes?.filter((v: any) => v.poll_nominee_id === n.id).length || 0,
          })).sort((a: any, b: any) => b.vote_count - a.vote_count);
        }

        if (user && votes) {
          const userVote = votes.find((v: any) => v.user_id === user.id);
          if (userVote) votesMap[poll.id] = userVote.poll_nominee_id;
        }
      }

      setNominees(nomMap);
      setUserVotes(votesMap);
    }

    const { data: hof } = await supabase.from("award_hall_of_fame").select("*").order("created_at", { ascending: false }).limit(20);
    if (hof) setHallOfFame(hof as any);

    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Realtime voting
  useEffect(() => {
    const channel = supabase
      .channel("award-votes-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "award_poll_votes" }, () => loadData())
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
      await supabase.from("award_poll_votes").delete().eq("poll_id", pollId).eq("user_id", user.id);
    }

    if (existingVote !== nomineeId) {
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

        {/* ── Hero ──────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          {/* Decorative top tag */}
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/10 border border-primary/25 mb-5">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary tracking-wider uppercase">Weekly Awards</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-foreground mb-4 leading-tight">
            🏆 <span className="bg-gradient-to-r from-yellow-400 via-primary to-yellow-500 bg-clip-text text-transparent">Skylife</span> Awards
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Community votes. Real prizes. New polls every week.
          </p>
          {awardsHidden && isOwner && (
            <Badge variant="destructive" className="mt-4">🔒 Hidden from users — Only you can see this</Badge>
          )}
        </motion.div>

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-24">
            <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading polls...</p>
          </div>
        ) : (
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="flex h-auto gap-2 bg-transparent p-0 mb-10 justify-center flex-wrap">
              {[
                { value: "active", icon: <Zap className="w-4 h-4" />, label: `Active (${activePolls.length})` },
                { value: "ended", icon: <Crown className="w-4 h-4" />, label: `Results (${endedPolls.length})` },
                { value: "hall-of-fame", icon: <Star className="w-4 h-4" />, label: "Hall of Fame" },
              ].map(tab => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 px-5 py-2.5 rounded-xl border border-border/30 gap-2 font-semibold transition-all"
                >
                  {tab.icon}{tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ── Active Polls ───────────────────────── */}
            <TabsContent value="active">
              {activePolls.length === 0 ? (
                <div className="text-center py-24">
                  <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-10 h-10 text-muted-foreground/40" />
                  </div>
                  <p className="text-lg font-semibold text-muted-foreground">No active polls right now</p>
                  <p className="text-sm text-muted-foreground/60 mt-1">Check back soon for the next weekly awards!</p>
                </div>
              ) : (
                <div className="space-y-12">
                  {activePolls.map(poll => {
                    const cat = categories.find(c => c.id === poll.category_id);
                    const pollNominees = nominees[poll.id] || [];
                    const totalVotes = pollNominees.reduce((s, n) => s + n.vote_count, 0);

                    return (
                      <motion.div key={poll.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        {/* Poll header with countdown */}
                        <div className="text-center mb-8">
                          {/* Category chip */}
                          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted/50 border border-border/30 mb-4">
                            <span className="text-xl">{cat?.icon || "🏆"}</span>
                            <span className="text-sm font-semibold text-muted-foreground">{cat?.name || "Award"}</span>
                          </div>

                          <h2 className="text-2xl md:text-3xl font-black text-foreground mb-2">{poll.title}</h2>
                          {poll.description && (
                            <p className="text-muted-foreground text-sm mb-4 max-w-lg mx-auto">{poll.description}</p>
                          )}

                          {/* Prize */}
                          {poll.prize && (
                            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/25 mb-6">
                              <Gift className="w-4 h-4 text-yellow-500" />
                              <span className="text-sm font-bold text-yellow-400">{poll.prize}</span>
                            </div>
                          )}

                          {/* Countdown */}
                          <div className="mb-2">
                            <p className="text-[11px] text-muted-foreground/60 uppercase tracking-[0.2em] font-semibold mb-3">Voting ends in</p>
                            <CountdownTimer endDate={poll.ends_at} />
                          </div>

                          {/* Vote count */}
                          <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-muted-foreground">
                            <Users className="w-3.5 h-3.5" />
                            <span>{totalVotes} total votes cast</span>
                          </div>
                        </div>

                        {/* Nominee cards grid */}
                        <div className={`grid gap-4 ${
                          pollNominees.length === 2 ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto" :
                          pollNominees.length === 3 ? "grid-cols-1 sm:grid-cols-3 max-w-3xl mx-auto" :
                          "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                        }`}>
                          {pollNominees.map((nom, idx) => (
                            <NomineeCard
                              key={nom.id}
                              nom={nom}
                              idx={idx}
                              totalVotes={totalVotes}
                              isVoted={userVotes[poll.id] === nom.id}
                              isActive={true}
                              isLeading={idx === 0 && nom.vote_count > 0}
                              voting={votingId === nom.id}
                              onVote={() => handleVote(poll.id, nom.id)}
                            />
                          ))}
                        </div>

                        {/* Login CTA */}
                        {!user && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 text-center py-4 px-6 rounded-2xl bg-primary/5 border border-primary/15 max-w-md mx-auto"
                          >
                            <p className="text-sm text-muted-foreground">
                              <span className="text-primary font-semibold">Login with Discord</span> to cast your vote
                            </p>
                          </motion.div>
                        )}

                        {/* Divider for multiple polls */}
                        <div className="mt-12 border-t border-border/20" />
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* ── Results ────────────────────────────── */}
            <TabsContent value="ended">
              {endedPolls.length === 0 ? (
                <div className="text-center py-24 text-muted-foreground">
                  <Medal className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-lg font-semibold">No completed polls yet</p>
                </div>
              ) : (
                <div className="space-y-10">
                  {endedPolls.map(poll => {
                    const cat = categories.find(c => c.id === poll.category_id);
                    const pollNominees = nominees[poll.id] || [];
                    const totalVotes = pollNominees.reduce((s, n) => s + n.vote_count, 0);
                    const winner = pollNominees[0];

                    return (
                      <div key={poll.id} className="space-y-6">
                        {/* Winner celebration card */}
                        {winner && poll.winner_announced_at && (
                          <WinnerCelebration winner={winner} categoryName={cat?.name || poll.title} />
                        )}

                        {/* All results */}
                        <div className="space-y-2 max-w-xl mx-auto">
                          {pollNominees.map((nom, idx) => {
                            const pct = totalVotes > 0 ? Math.round((nom.vote_count / totalVotes) * 100) : 0;
                            return (
                              <div key={nom.id} className={`flex items-center gap-3 p-3 rounded-xl ${idx === 0 ? "bg-yellow-500/8 border border-yellow-500/20" : "bg-muted/20 border border-transparent"}`}>
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0 ${idx === 0 ? "bg-yellow-500 shadow-md" : "bg-muted"}`}>
                                  {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : <span className="text-sm font-bold text-muted-foreground">#{idx + 1}</span>}
                                </div>
                                {nom.nominee_image_url && (
                                  <img src={nom.nominee_image_url} alt={nom.nominee_name} className="w-8 h-8 rounded-full object-cover border border-border/30 shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm truncate">{nom.nominee_name}</p>
                                  {nom.server_name && (
                                    <p className="text-[10px] text-muted-foreground font-mono">/{nom.server_name}</p>
                                  )}
                                </div>
                                <div className="w-28 h-2 bg-muted rounded-full overflow-hidden shrink-0">
                                  <div
                                    className={`h-full rounded-full ${idx === 0 ? "bg-yellow-500" : "bg-primary/60"}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground w-16 text-right shrink-0">{nom.vote_count} ({pct}%)</span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="border-t border-border/20 mt-8" />
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* ── Hall of Fame ──────────────────────── */}
            <TabsContent value="hall-of-fame">
              {hallOfFame.length === 0 ? (
                <div className="text-center py-24">
                  <Star className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-lg font-semibold text-muted-foreground">Hall of Fame is empty</p>
                  <p className="text-sm text-muted-foreground/60 mt-1">Winners will appear here after announcements</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {hallOfFame.map((entry, idx) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.06 }}
                      className="group relative rounded-2xl overflow-hidden border border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-background hover:border-yellow-500/40 transition-all hover:shadow-lg hover:shadow-yellow-500/10"
                    >
                      {/* Winner image */}
                      {entry.winner_image_url ? (
                        <div className="h-48 overflow-hidden relative">
                          <img
                            src={entry.winner_image_url}
                            alt={entry.winner_name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                        </div>
                      ) : (
                        <div className="h-24 bg-gradient-to-br from-yellow-500/10 to-transparent flex items-center justify-center">
                          <Trophy className="w-10 h-10 text-yellow-500/40" />
                        </div>
                      )}

                      <div className="p-4">
                        {/* Crown + name */}
                        <div className="flex items-start gap-2 mb-2">
                          <div className="w-9 h-9 rounded-xl bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center shrink-0">
                            <Crown className="w-5 h-5 text-yellow-500" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-foreground truncate">{entry.winner_name}</h3>
                            {entry.winner_server_name && (
                              <p className="text-xs text-yellow-500/70 font-mono">/{entry.winner_server_name}</p>
                            )}
                          </div>
                        </div>

                        <Badge variant="secondary" className="text-[10px] mb-2">{entry.category_name}</Badge>

                        {entry.week_label && (
                          <p className="text-xs text-muted-foreground">{entry.week_label}</p>
                        )}
                        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                          <span>🗳️ {entry.vote_count}/{entry.total_votes} votes</span>
                          {entry.prize && (
                            <span className="text-yellow-500/80 flex items-center gap-1">
                              <Gift className="w-3 h-3" /> {entry.prize}
                            </span>
                          )}
                        </div>
                      </div>
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
