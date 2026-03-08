import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Lightbulb, Send, Sparkles, Server, Globe, Gamepad2, Bug, Clock, CheckCircle2, XCircle, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = [
  { value: "server", label: "Server Improvement", icon: Server, color: "text-blue-400" },
  { value: "website", label: "Website Feature", icon: Globe, color: "text-emerald-400" },
  { value: "gameplay", label: "Gameplay Idea", icon: Gamepad2, color: "text-purple-400" },
  { value: "bug-fix", label: "Bug Fix Request", icon: Bug, color: "text-red-400" },
  { value: "general", label: "General", icon: Lightbulb, color: "text-amber-400" },
];

const PRIORITIES = [
  { value: "low", label: "Low", color: "bg-muted text-muted-foreground" },
  { value: "medium", label: "Medium", color: "bg-amber-500/20 text-amber-400" },
  { value: "high", label: "High", color: "bg-red-500/20 text-red-400" },
];

const STATUS_MAP: Record<string, { label: string; icon: any; color: string }> = {
  pending: { label: "Under Review", icon: Clock, color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  approved: { label: "Approved", icon: CheckCircle2, color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  rejected: { label: "Rejected", icon: XCircle, color: "bg-red-500/20 text-red-400 border-red-500/30" },
  implemented: { label: "Implemented", icon: Sparkles, color: "bg-primary/20 text-primary border-primary/30" },
};

const SuggestionBox = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [mySuggestions, setMySuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("medium");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) fetchMySuggestions(user.id);
    };
    getUser();
  }, []);

  const fetchMySuggestions = async (userId: string) => {
    setLoadingSuggestions(true);
    const { data } = await supabase
      .from("suggestions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setMySuggestions(data || []);
    setLoadingSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim() || !description.trim()) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const meta = user.user_metadata || {};
    const { error } = await supabase.from("suggestions").insert({
      user_id: user.id,
      discord_username: meta.discord_username || meta.full_name || "Unknown",
      discord_id: meta.discord_id || meta.provider_id || meta.sub || null,
      discord_avatar: meta.discord_avatar || meta.avatar_url || null,
      category,
      title: title.trim(),
      description: description.trim(),
      priority,
    });

    setLoading(false);
    if (error) {
      toast({ title: "Error", description: "Failed to submit suggestion.", variant: "destructive" });
      return;
    }

    toast({ title: "🎉 Suggestion Submitted!", description: "Thank you! Your idea has been sent to our team." });
    setTitle("");
    setDescription("");
    setCategory("general");
    setPriority("medium");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    fetchMySuggestions(user.id);
  };

  const catInfo = CATEGORIES.find(c => c.value === category);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader title="Suggestion Box" subtitle="Share your ideas to make SLRP even better" />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-8 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 p-8"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Lightbulb className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Got an Idea?</h2>
              <p className="text-muted-foreground">Every great feature starts with a suggestion. Submit yours below!</p>
            </div>
          </div>
        </motion.div>

        {/* Submit Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-effect border-border/20 mb-8 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" />
                Submit a Suggestion
              </CardTitle>
              <CardDescription>Describe your idea in detail. Our team reviews every submission!</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="bg-background/50 border-border/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            <span className="flex items-center gap-2">
                              <cat.icon className={`w-4 h-4 ${cat.color}`} />
                              {cat.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger className="bg-background/50 border-border/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map(p => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Give your idea a short, catchy title..."
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    maxLength={150}
                    className="bg-background/50 border-border/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Explain your idea in detail. What problem does it solve? How would it work?"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    maxLength={2000}
                    rows={5}
                    className="bg-background/50 border-border/30 resize-none"
                  />
                  <p className="text-xs text-muted-foreground text-right">{description.length}/2000</p>
                </div>

                <AnimatePresence>
                  {submitted && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">Suggestion submitted successfully!</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button type="submit" disabled={loading || !title.trim() || !description.trim()} className="w-full">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {loading ? "Submitting..." : "Submit Suggestion"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* My Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            My Suggestions
            {mySuggestions.length > 0 && (
              <Badge variant="secondary" className="ml-1">{mySuggestions.length}</Badge>
            )}
          </h3>

          {loadingSuggestions ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : mySuggestions.length === 0 ? (
            <Card className="glass-effect border-border/20">
              <CardContent className="py-12 text-center">
                <Lightbulb className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">You haven't submitted any suggestions yet.</p>
                <p className="text-sm text-muted-foreground/60">Be the first to share your brilliant idea!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {mySuggestions.map((s, idx) => {
                const status = STATUS_MAP[s.status] || STATUS_MAP.pending;
                const StatusIcon = status.icon;
                const catItem = CATEGORIES.find(c => c.value === s.category);
                const CatIcon = catItem?.icon || Lightbulb;

                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="glass-effect border-border/20 hover:border-primary/20 transition-colors">
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className={`p-2 rounded-lg bg-background/50 border border-border/20 shrink-0 mt-0.5`}>
                              <CatIcon className={`w-4 h-4 ${catItem?.color || "text-muted-foreground"}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-foreground truncate">{s.title}</h4>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{s.description}</p>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span className="text-xs text-muted-foreground/60">
                                  {new Date(s.created_at).toLocaleDateString()}
                                </span>
                                {s.admin_notes && (
                                  <span className="text-xs text-primary/80 italic">• Admin: {s.admin_notes}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Badge className={`shrink-0 ${status.color} border`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default SuggestionBox;
