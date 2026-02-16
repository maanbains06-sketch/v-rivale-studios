import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Star, Vote, Plus, ThumbsUp, Award, Users, Building2, Film, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";
import { motion } from "framer-motion";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "best-gang": <Crosshair className="w-6 h-6" />,
  "best-officer": <Award className="w-6 h-6" />,
  "best-business": <Building2 className="w-6 h-6" />,
  "best-rp-moment": <Film className="w-6 h-6" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  "best-gang": "from-red-500/20 to-red-900/10 border-red-500/30",
  "best-officer": "from-blue-500/20 to-blue-900/10 border-blue-500/30",
  "best-business": "from-green-500/20 to-green-900/10 border-green-500/30",
  "best-rp-moment": "from-purple-500/20 to-purple-900/10 border-purple-500/30",
};

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  display_order: number;
}

interface Nomination {
  id: string;
  category_id: string;
  nominee_name: string;
  nominated_by: string;
  reason: string | null;
  status: string;
  created_at: string;
  vote_count: number;
  has_voted: boolean;
}

const Awards = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [nominations, setNominations] = useState<Record<string, Nomination[]>>({});
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [nominating, setNominating] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [nominateDialog, setNominateDialog] = useState<string | null>(null);
  const [nomineeForm, setNomineeForm] = useState({ name: "", reason: "" });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    const { data: cats } = await supabase
      .from("award_categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order");

    if (cats) setCategories(cats);

    // Load approved nominations with vote counts
    const { data: noms } = await supabase
      .from("award_nominations")
      .select("*")
      .eq("status", "approved");

    if (noms && cats) {
      // Get all votes
      const { data: votes } = await supabase
        .from("award_votes")
        .select("nomination_id, user_id");

      const nomMap: Record<string, Nomination[]> = {};
      for (const cat of cats) {
        const catNoms = noms
          .filter((n) => n.category_id === cat.id)
          .map((n) => ({
            ...n,
            vote_count: votes?.filter((v) => v.nomination_id === n.id).length || 0,
            has_voted: user ? votes?.some((v) => v.nomination_id === n.id && v.user_id === user.id) || false : false,
          }))
          .sort((a, b) => b.vote_count - a.vote_count);
        nomMap[cat.id] = catNoms;
      }
      setNominations(nomMap);
    }
    setLoading(false);
  };

  const handleNominate = async () => {
    if (!user) {
      toast({ title: "Login Required", description: "Please login with Discord to nominate.", variant: "destructive" });
      return;
    }
    if (!nomineeForm.name.trim()) {
      toast({ title: "Name required", description: "Enter a nominee name.", variant: "destructive" });
      return;
    }
    setNominating(true);

    // Check if user already nominated in this category
    const { data: existing } = await supabase
      .from("award_nominations")
      .select("id")
      .eq("category_id", nominateDialog!)
      .eq("nominated_by", user.id);

    if (existing && existing.length >= 3) {
      toast({ title: "Limit reached", description: "You can only nominate up to 3 per category.", variant: "destructive" });
      setNominating(false);
      return;
    }

    const { error } = await supabase.from("award_nominations").insert({
      category_id: nominateDialog!,
      nominee_name: nomineeForm.name.trim(),
      nominated_by: user.id,
      reason: nomineeForm.reason.trim() || null,
      status: "approved", // Auto-approve for now
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "🏆 Nominated!", description: `${nomineeForm.name} has been nominated!` });
      setNominateDialog(null);
      setNomineeForm({ name: "", reason: "" });
      loadData();
    }
    setNominating(false);
  };

  const handleVote = async (nominationId: string, hasVoted: boolean) => {
    if (!user) {
      toast({ title: "Login Required", description: "Please login with Discord to vote.", variant: "destructive" });
      return;
    }
    setVotingId(nominationId);

    if (hasVoted) {
      await supabase.from("award_votes").delete().eq("nomination_id", nominationId).eq("user_id", user.id);
      toast({ title: "Vote removed" });
    } else {
      const { error } = await supabase.from("award_votes").insert({ nomination_id: nominationId, user_id: user.id });
      if (error) {
        if (error.code === "23505") {
          toast({ title: "Already voted", variant: "destructive" });
        } else {
          toast({ title: "Error", description: error.message, variant: "destructive" });
        }
      } else {
        toast({ title: "🎉 Vote cast!", description: "Your vote has been recorded!" });
      }
    }
    setVotingId(null);
    loadData();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Trophy className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">Annual Awards</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
            🏆 City Awards Night
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Skylife Roleplay India presents the annual City Awards Night! Nominate and vote for the best of the best in our community.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <Tabs defaultValue={categories[0]?.slug} className="w-full">
            <TabsList className="w-full flex flex-wrap h-auto gap-2 bg-transparent p-0 mb-8 justify-center">
              {categories.map((cat) => (
                <TabsTrigger
                  key={cat.slug}
                  value={cat.slug}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2.5 rounded-lg border border-border/30 data-[state=active]:border-primary/50 gap-2 text-sm"
                >
                  {CATEGORY_ICONS[cat.slug] || <Star className="w-4 h-4" />}
                  {cat.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((cat) => (
              <TabsContent key={cat.slug} value={cat.slug}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className={`mb-6 bg-gradient-to-br ${CATEGORY_COLORS[cat.slug] || "from-primary/10 to-primary/5 border-primary/20"}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{cat.icon}</span>
                          <div>
                            <CardTitle className="text-xl">{cat.name}</CardTitle>
                            <CardDescription className="mt-1">{cat.description}</CardDescription>
                          </div>
                        </div>
                        <Dialog open={nominateDialog === cat.id} onOpenChange={(open) => {
                          if (open) setNominateDialog(cat.id);
                          else { setNominateDialog(null); setNomineeForm({ name: "", reason: "" }); }
                        }}>
                          <DialogTrigger asChild>
                            <Button className="gap-2">
                              <Plus className="w-4 h-4" />
                              Nominate
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-background border-border/30">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <span className="text-2xl">{cat.icon}</span>
                                Nominate for {cat.name}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                              <div>
                                <Label>Nominee Name *</Label>
                                <Input
                                  placeholder={cat.slug === "best-rp-moment" ? "Title of the RP moment..." : "Enter name..."}
                                  value={nomineeForm.name}
                                  onChange={(e) => setNomineeForm((f) => ({ ...f, name: e.target.value }))}
                                  maxLength={100}
                                />
                              </div>
                              <div>
                                <Label>Reason (Optional)</Label>
                                <Textarea
                                  placeholder="Why do you think they deserve this award?"
                                  value={nomineeForm.reason}
                                  onChange={(e) => setNomineeForm((f) => ({ ...f, reason: e.target.value }))}
                                  maxLength={500}
                                  rows={3}
                                />
                              </div>
                              <Button onClick={handleNominate} disabled={nominating} className="w-full gap-2">
                                {nominating ? (
                                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Trophy className="w-4 h-4" />
                                )}
                                Submit Nomination
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Nominations List */}
                  {(!nominations[cat.id] || nominations[cat.id].length === 0) ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <Vote className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-lg font-medium">No nominations yet</p>
                      <p className="text-sm">Be the first to nominate someone!</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {nominations[cat.id].map((nom, idx) => (
                        <motion.div
                          key={nom.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          <Card className={`transition-all hover:border-primary/30 ${idx === 0 && nom.vote_count > 0 ? "border-primary/40 bg-primary/5" : ""}`}>
                            <CardContent className="flex items-center justify-between p-4 gap-4">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${idx === 0 && nom.vote_count > 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                                  {idx + 1}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-foreground truncate flex items-center gap-2">
                                    {nom.nominee_name}
                                    {idx === 0 && nom.vote_count > 0 && (
                                      <Badge variant="default" className="text-[10px] px-1.5 py-0">
                                        Leading
                                      </Badge>
                                    )}
                                  </p>
                                  {nom.reason && (
                                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">"{nom.reason}"</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-sm font-medium text-muted-foreground">
                                  {nom.vote_count} {nom.vote_count === 1 ? "vote" : "votes"}
                                </span>
                                <Button
                                  size="sm"
                                  variant={nom.has_voted ? "default" : "outline"}
                                  onClick={() => handleVote(nom.id, nom.has_voted)}
                                  disabled={votingId === nom.id}
                                  className="gap-1.5"
                                >
                                  {votingId === nom.id ? (
                                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <ThumbsUp className={`w-3.5 h-3.5 ${nom.has_voted ? "fill-current" : ""}`} />
                                  )}
                                  {nom.has_voted ? "Voted" : "Vote"}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </main>
      
    </div>
  );
};

export default Awards;
