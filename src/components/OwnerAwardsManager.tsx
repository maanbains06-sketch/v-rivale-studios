import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trophy, Plus, Trash2, Eye, EyeOff, Crown, Send, Loader2, Calendar, Gift, Users, Award } from "lucide-react";

interface Poll {
  id: string;
  category_id: string;
  title: string;
  description: string | null;
  prize: string | null;
  starts_at: string;
  ends_at: string;
  status: string;
  winner_nomination_id: string | null;
  winner_announced_at: string | null;
  created_at: string;
  category?: { name: string; slug: string; icon: string };
}

interface PollNominee {
  id: string;
  poll_id: string;
  nominee_name: string;
  nominee_image_url: string | null;
  nominee_description: string | null;
  vote_count?: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  is_active: boolean;
}

const OwnerAwardsManager = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [awardsHidden, setAwardsHidden] = useState(false);
  const [togglingVisibility, setTogglingVisibility] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [announcing, setAnnouncing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [purging, setPurging] = useState(false);

  // Create poll form
  const [form, setForm] = useState({
    category_id: "",
    title: "",
    description: "",
    prize: "",
    ends_at: "",
    nominees: [{ name: "", image_url: "", description: "" }],
  });

  const loadData = useCallback(async () => {
    setLoading(true);

    const [catsRes, pollsRes, settingRes] = await Promise.all([
      supabase.from("award_categories").select("*").order("display_order"),
      supabase.from("award_polls").select("*").order("created_at", { ascending: false }),
      supabase.from("site_settings").select("*").eq("key", "awards_hidden").maybeSingle(),
    ]);

    if (catsRes.data) setCategories(catsRes.data);
    if (settingRes.data) setAwardsHidden(settingRes.data.value === "true");

    if (pollsRes.data && catsRes.data) {
      // Enrich polls with category info
      const enriched = pollsRes.data.map((p: any) => ({
        ...p,
        category: catsRes.data?.find((c: any) => c.id === p.category_id),
      }));

      // Get vote counts for each poll
      for (const poll of enriched) {
        const { data: nominees } = await supabase
          .from("award_poll_nominees")
          .select("id, nominee_name")
          .eq("poll_id", poll.id);

        if (nominees) {
          const { data: votes } = await supabase
            .from("award_poll_votes")
            .select("poll_nominee_id")
            .eq("poll_id", poll.id);

          (poll as any).nominees = nominees.map((n: any) => ({
            ...n,
            vote_count: votes?.filter((v: any) => v.poll_nominee_id === n.id).length || 0,
          }));
          (poll as any).total_votes = votes?.length || 0;
        }
      }

      setPolls(enriched);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleVisibility = async () => {
    setTogglingVisibility(true);
    const newVal = !awardsHidden;
    await supabase
      .from("site_settings")
      .update({ value: String(newVal) })
      .eq("key", "awards_hidden");
    setAwardsHidden(newVal);
    toast({ title: newVal ? "Awards Hidden" : "Awards Visible", description: newVal ? "Awards are now hidden from users" : "Awards are now visible to everyone" });
    setTogglingVisibility(false);
  };

  const createPoll = async () => {
    if (!form.category_id || !form.title || !form.ends_at || form.nominees.filter(n => n.name.trim()).length < 2) {
      toast({ title: "Fill required fields", description: "Need category, title, end date, and at least 2 nominees", variant: "destructive" });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { data: poll, error } = await supabase.from("award_polls").insert({
      category_id: form.category_id,
      title: form.title,
      description: form.description || null,
      prize: form.prize || null,
      ends_at: new Date(form.ends_at).toISOString(),
      created_by: user?.id,
    }).select().single();

    if (error || !poll) {
      toast({ title: "Error", description: error?.message || "Failed to create poll", variant: "destructive" });
      return;
    }

    // Add nominees
    const nomineesData = form.nominees
      .filter(n => n.name.trim())
      .map((n, i) => ({
        poll_id: poll.id,
        nominee_name: n.name.trim(),
        nominee_image_url: n.image_url.trim() || null,
        nominee_description: n.description.trim() || null,
        display_order: i,
      }));

    await supabase.from("award_poll_nominees").insert(nomineesData);

    toast({ title: "🏆 Poll Created!", description: `"${form.title}" is now live!` });
    setCreateDialog(false);
    setForm({ category_id: "", title: "", description: "", prize: "", ends_at: "", nominees: [{ name: "", image_url: "", description: "" }] });
    loadData();
  };

  const announceWinner = async (poll: Poll) => {
    setAnnouncing(poll.id);
    try {
      // Get nominees with votes
      const { data: nominees } = await supabase
        .from("award_poll_nominees")
        .select("*")
        .eq("poll_id", poll.id);

      const { data: votes } = await supabase
        .from("award_poll_votes")
        .select("poll_nominee_id")
        .eq("poll_id", poll.id);

      if (!nominees || nominees.length === 0) {
        toast({ title: "No nominees", variant: "destructive" });
        setAnnouncing(null);
        return;
      }

      const nomineesWithVotes = nominees.map(n => ({
        ...n,
        vote_count: votes?.filter(v => v.poll_nominee_id === n.id).length || 0,
      }));

      const winner = nomineesWithVotes.sort((a, b) => b.vote_count - a.vote_count)[0];
      const totalVotes = votes?.length || 0;

      // Update poll
      await supabase.from("award_polls").update({
        status: "ended",
        winner_nomination_id: winner.nomination_id,
        winner_announced_at: new Date().toISOString(),
      }).eq("id", poll.id);

      // Add to Hall of Fame
      await supabase.from("award_hall_of_fame").insert({
        poll_id: poll.id,
        category_name: poll.category?.name || "Unknown",
        winner_name: winner.nominee_name,
        winner_image_url: winner.nominee_image_url,
        prize: poll.prize,
        vote_count: winner.vote_count,
        total_votes: totalVotes,
        week_label: `Week of ${new Date(poll.starts_at).toLocaleDateString()}`,
      });

      // Send Discord announcement
      await supabase.functions.invoke("send-award-winner", {
        body: {
          winnerName: winner.nominee_name,
          categoryName: poll.category?.name || poll.title,
          prize: poll.prize,
          voteCount: winner.vote_count,
          totalVotes,
          pollTitle: poll.title,
        },
      });

      toast({ title: "🎉 Winner Announced!", description: `${winner.nominee_name} has been declared the winner!` });
      loadData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setAnnouncing(null);
  };

  const deletePoll = async (pollId: string) => {
    setDeleting(pollId);
    await supabase.from("award_poll_votes").delete().eq("poll_id", pollId);
    await supabase.from("award_poll_nominees").delete().eq("poll_id", pollId);
    await supabase.from("award_polls").delete().eq("id", pollId);
    toast({ title: "Poll deleted" });
    setDeleting(null);
    loadData();
  };

  const purgeAllAwards = async () => {
    setPurging(true);
    await supabase.from("award_poll_votes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("award_poll_nominees").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("award_votes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("award_nominations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("award_hall_of_fame").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("award_polls").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    toast({ title: "🗑️ All award data purged" });
    setPurging(false);
    loadData();
  };

  const addNomineeField = () => {
    setForm(f => ({ ...f, nominees: [...f.nominees, { name: "", image_url: "", description: "" }] }));
  };

  const updateNominee = (idx: number, field: string, value: string) => {
    setForm(f => {
      const nominees = [...f.nominees];
      (nominees[idx] as any)[field] = value;
      return { ...f, nominees };
    });
  };

  const removeNominee = (idx: number) => {
    setForm(f => ({ ...f, nominees: f.nominees.filter((_, i) => i !== idx) }));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-primary" />
            Weekly Awards Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Create polls, manage nominees, announce winners</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Visibility Toggle */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border/30 bg-card">
            {awardsHidden ? <EyeOff className="w-4 h-4 text-destructive" /> : <Eye className="w-4 h-4 text-green-500" />}
            <Label className="text-sm cursor-pointer">
              {awardsHidden ? "Hidden" : "Visible"}
            </Label>
            <Switch
              checked={!awardsHidden}
              onCheckedChange={toggleVisibility}
              disabled={togglingVisibility}
            />
          </div>

          {/* Create Poll */}
          <Dialog open={createDialog} onOpenChange={setCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Poll
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  Create Weekly Award Poll
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category *</Label>
                    <Select value={form.category_id} onValueChange={v => setForm(f => ({ ...f, category_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {categories.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.icon} {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>End Date *</Label>
                    <Input type="datetime-local" value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label>Poll Title *</Label>
                  <Input placeholder="e.g. Best Officer of the Week" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea placeholder="Describe the award..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
                </div>
                <div>
                  <Label className="flex items-center gap-2"><Gift className="w-4 h-4" /> Prize</Label>
                  <Input placeholder="e.g. ₹50,000 in-game cash + Custom Vehicle" value={form.prize} onChange={e => setForm(f => ({ ...f, prize: e.target.value }))} />
                </div>

                {/* Nominees */}
                <div>
                  <Label className="flex items-center gap-2 mb-3"><Users className="w-4 h-4" /> Nominees * (min 2)</Label>
                  <div className="space-y-3">
                    {form.nominees.map((nom, idx) => (
                      <Card key={idx} className="p-3">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 space-y-2">
                            <Input placeholder={`Nominee ${idx + 1} name *`} value={nom.name} onChange={e => updateNominee(idx, "name", e.target.value)} />
                            <Input placeholder="Image URL (optional)" value={nom.image_url} onChange={e => updateNominee(idx, "image_url", e.target.value)} />
                            <Input placeholder="Short description (optional)" value={nom.description} onChange={e => updateNominee(idx, "description", e.target.value)} />
                          </div>
                          {form.nominees.length > 1 && (
                            <Button variant="ghost" size="icon" onClick={() => removeNominee(idx)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                    <Button variant="outline" onClick={addNomineeField} className="w-full gap-2">
                      <Plus className="w-4 h-4" /> Add Nominee
                    </Button>
                  </div>
                </div>

                <Button onClick={createPoll} className="w-full gap-2">
                  <Trophy className="w-4 h-4" /> Create Poll
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Purge All */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-2">
                <Trash2 className="w-4 h-4" /> Purge All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete ALL Award Data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all polls, nominations, votes, and hall of fame entries. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={purgeAllAwards} disabled={purging} className="bg-destructive text-destructive-foreground">
                  {purging ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</> : "Delete Everything"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Polls List */}
      {polls.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <Trophy className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-lg font-medium text-muted-foreground">No polls created yet</p>
            <p className="text-sm text-muted-foreground">Create your first weekly award poll</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {polls.map(poll => {
            const isActive = poll.status === "active" && new Date(poll.ends_at) > new Date();
            const isEnded = poll.status === "ended" || new Date(poll.ends_at) <= new Date();
            const nominees = (poll as any).nominees || [];
            const totalVotes = (poll as any).total_votes || 0;

            return (
              <Card key={poll.id} className={`border-l-4 ${isActive ? "border-l-green-500" : isEnded ? "border-l-muted-foreground" : "border-l-primary"}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{poll.category?.icon || "🏆"}</span>
                        <CardTitle className="text-lg">{poll.title}</CardTitle>
                        <Badge variant={isActive ? "default" : "secondary"}>
                          {isActive ? "Active" : "Ended"}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-4">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Ends: {new Date(poll.ends_at).toLocaleString()}</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {totalVotes} votes</span>
                        {poll.prize && <span className="flex items-center gap-1"><Gift className="w-3 h-3" /> {poll.prize}</span>}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {isEnded && !poll.winner_announced_at && (
                        <Button size="sm" onClick={() => announceWinner(poll)} disabled={announcing === poll.id} className="gap-1.5">
                          {announcing === poll.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Crown className="w-3 h-3" />}
                          Announce Winner
                        </Button>
                      )}
                      {poll.winner_announced_at && (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          <Crown className="w-3 h-3 mr-1" /> Winner Announced
                        </Badge>
                      )}
                      <Button variant="destructive" size="sm" onClick={() => deletePoll(poll.id)} disabled={deleting === poll.id}>
                        {deleting === poll.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    {nominees.map((nom: any, idx: number) => {
                      const pct = totalVotes > 0 ? Math.round((nom.vote_count / totalVotes) * 100) : 0;
                      const isLeading = idx === 0 && nom.vote_count > 0 && nominees.length > 1;
                      return (
                        <div key={nom.id} className={`flex items-center gap-3 p-2 rounded-lg ${isLeading ? "bg-primary/10 border border-primary/20" : "bg-muted/30"}`}>
                          <span className="w-6 text-center font-bold text-sm text-muted-foreground">{idx + 1}</span>
                          <span className="flex-1 font-medium text-sm">{nom.nominee_name}</span>
                          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
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

      {/* Categories Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="w-5 h-5" /> Award Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/20">
                <span className="text-xl">{cat.icon}</span>
                <div>
                  <p className="text-sm font-medium">{cat.name}</p>
                  <Badge variant={cat.is_active ? "default" : "secondary"} className="text-[10px]">
                    {cat.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerAwardsManager;
