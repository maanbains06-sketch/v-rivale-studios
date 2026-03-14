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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Lightbulb, Send, Sparkles, Server, Globe, Gamepad2, Bug, Clock, CheckCircle2, XCircle, MessageSquare, TrendingUp, Zap, Star, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = [
  { value: "server", label: "Server Improvement", icon: Server, color: "text-neon-blue", bg: "from-blue-500/20 to-blue-600/5", border: "border-blue-500/30" },
  { value: "website", label: "Website Feature", icon: Globe, color: "text-emerald-400", bg: "from-emerald-500/20 to-emerald-600/5", border: "border-emerald-500/30" },
  { value: "gameplay", label: "Gameplay Idea", icon: Gamepad2, color: "text-neon-purple", bg: "from-purple-500/20 to-purple-600/5", border: "border-purple-500/30" },
  { value: "bug-fix", label: "Bug Fix Request", icon: Bug, color: "text-red-400", bg: "from-red-500/20 to-red-600/5", border: "border-red-500/30" },
  { value: "general", label: "General", icon: Lightbulb, color: "text-neon-gold", bg: "from-amber-500/20 to-amber-600/5", border: "border-amber-500/30" },
];

const PRIORITIES = [
  { value: "low", label: "Low", color: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  { value: "medium", label: "Medium", color: "bg-amber-500/20 text-amber-400", dot: "bg-amber-400" },
  { value: "high", label: "High", color: "bg-red-500/20 text-red-400", dot: "bg-red-400" },
];

const STATUS_MAP: Record<string, { label: string; icon: any; color: string; glow: string }> = {
  pending: { label: "Under Review", icon: Clock, color: "bg-amber-500/15 text-amber-400 border-amber-500/30", glow: "shadow-amber-500/10" },
  approved: { label: "Approved", icon: CheckCircle2, color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", glow: "shadow-emerald-500/10" },
  rejected: { label: "Rejected", icon: XCircle, color: "bg-red-500/15 text-red-400 border-red-500/30", glow: "shadow-red-500/10" },
  implemented: { label: "Implemented", icon: Sparkles, color: "bg-primary/15 text-primary border-primary/30", glow: "shadow-primary/10" },
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
  const [activeTab, setActiveTab] = useState("submit");
  const [statusFilter, setStatusFilter] = useState("all");

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
    const discordId = meta.discord_id || meta.provider_id || meta.sub;
    const displayName = meta.display_name || meta.discord_username || meta.full_name || "Unknown";
    let avatarUrl = meta.avatar_url;
    if (discordId && meta.discord_avatar) {
      avatarUrl = `https://cdn.discordapp.com/avatars/${discordId}/${meta.discord_avatar}.png?size=256`;
    }
    const { error } = await supabase.from("suggestions").insert({
      user_id: user.id,
      discord_username: displayName,
      discord_id: discordId || null,
      discord_avatar: avatarUrl || null,
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
    setActiveTab("history");
  };

  const filteredSuggestions = statusFilter === "all" 
    ? mySuggestions 
    : mySuggestions.filter(s => s.status === statusFilter);

  const statusCounts = {
    all: mySuggestions.length,
    pending: mySuggestions.filter(s => s.status === "pending").length,
    approved: mySuggestions.filter(s => s.status === "approved").length,
    implemented: mySuggestions.filter(s => s.status === "implemented").length,
    rejected: mySuggestions.filter(s => s.status === "rejected").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader title="Suggestion Box" description="Share your ideas to make SLRP even better" />
      
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
        >
          {[
            { label: "Total Ideas", value: statusCounts.all, icon: Lightbulb, color: "text-neon-cyan", bg: "from-cyan-500/10 to-transparent", border: "border-cyan-500/20" },
            { label: "Under Review", value: statusCounts.pending, icon: Clock, color: "text-amber-400", bg: "from-amber-500/10 to-transparent", border: "border-amber-500/20" },
            { label: "Approved", value: statusCounts.approved, icon: CheckCircle2, color: "text-emerald-400", bg: "from-emerald-500/10 to-transparent", border: "border-emerald-500/20" },
            { label: "Implemented", value: statusCounts.implemented, icon: Sparkles, color: "text-primary", bg: "from-primary/10 to-transparent", border: "border-primary/20" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`relative overflow-hidden rounded-xl border ${stat.border} bg-gradient-to-br ${stat.bg} p-4`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{stat.label}</p>
                  <p className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color} opacity-30`} />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full bg-card/50 border border-border/30 p-1 h-auto">
            <TabsTrigger value="submit" className="flex-1 gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary py-2.5">
              <Send className="w-4 h-4" /> Submit Idea
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary py-2.5">
              <MessageSquare className="w-4 h-4" /> My Suggestions
              {mySuggestions.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5">{mySuggestions.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Submit Tab */}
          <TabsContent value="submit">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              {/* Hero */}
              <div className="relative mb-6 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-accent/5 p-6 md:p-8">
                <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
                <div className="relative flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 shadow-lg shadow-primary/10">
                    <Zap className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Got a Brilliant Idea?</h2>
                    <p className="text-muted-foreground">Every great feature starts with a suggestion. Your ideas shape SLRP!</p>
                  </div>
                </div>
              </div>

              {/* Category Picker */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
                {CATEGORIES.map(cat => {
                  const isActive = category === cat.value;
                  return (
                    <motion.button
                      key={cat.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setCategory(cat.value)}
                      className={`relative p-3 rounded-xl border text-center transition-all duration-200 ${
                        isActive
                          ? `bg-gradient-to-b ${cat.bg} ${cat.border} shadow-lg`
                          : "bg-card/30 border-border/20 hover:border-border/40"
                      }`}
                    >
                      <cat.icon className={`w-5 h-5 mx-auto mb-1.5 ${isActive ? cat.color : "text-muted-foreground"}`} />
                      <p className={`text-xs font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>{cat.label}</p>
                      {isActive && <div className="absolute -bottom-px left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />}
                    </motion.button>
                  );
                })}
              </div>

              {/* Form Card */}
              <Card className="border-border/20 overflow-hidden bg-card/50 backdrop-blur-sm">
                <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />
                <CardContent className="p-6 space-y-5">
                  <div className="grid md:grid-cols-[1fr_200px] gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-sm font-medium">Title <span className="text-red-400">*</span></Label>
                      <Input
                        id="title"
                        placeholder="Give your idea a short, catchy title..."
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        maxLength={150}
                        className="bg-background/50 border-border/30 h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority" className="text-sm font-medium">Priority</Label>
                      <Select value={priority} onValueChange={setPriority}>
                        <SelectTrigger className="bg-background/50 border-border/30 h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITIES.map(p => (
                            <SelectItem key={p.value} value={p.value}>
                              <span className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${p.dot}`} />
                                {p.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">Description <span className="text-red-400">*</span></Label>
                    <Textarea
                      id="description"
                      placeholder="Explain your idea in detail. What problem does it solve? How would it work?"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      maxLength={2000}
                      rows={6}
                      className="bg-background/50 border-border/30 resize-none"
                    />
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-muted-foreground/50">Be as detailed as possible</p>
                      <p className={`text-xs ${description.length > 1800 ? "text-amber-400" : "text-muted-foreground/50"}`}>{description.length}/2000</p>
                    </div>
                  </div>

                  <AnimatePresence>
                    {submitted && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-3 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4"
                      >
                        <div className="p-1.5 rounded-lg bg-emerald-500/20">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-semibold block">Suggestion submitted!</span>
                          <span className="text-xs text-emerald-400/70">Check the "My Suggestions" tab to track its progress.</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button 
                    type="button" 
                    onClick={handleSubmit}
                    disabled={loading || !title.trim() || !description.trim()} 
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent border-0 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Send className="w-5 h-5 mr-2" />
                    )}
                    {loading ? "Submitting..." : "Submit Suggestion"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Filter Chips */}
              <div className="flex gap-2 flex-wrap">
                {(["all", "pending", "approved", "implemented", "rejected"] as const).map(s => {
                  const isActive = statusFilter === s;
                  const count = statusCounts[s];
                  return (
                    <Button
                      key={s}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter(s)}
                      className={`gap-1.5 text-xs capitalize ${isActive ? "shadow-md" : "border-border/30"}`}
                    >
                      {s === "all" ? "All" : STATUS_MAP[s]?.label || s}
                      <Badge variant="secondary" className="h-4 px-1 text-[10px] min-w-[18px] justify-center">{count}</Badge>
                    </Button>
                  );
                })}
              </div>

              {loadingSuggestions ? (
                <div className="flex justify-center py-16">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredSuggestions.length === 0 ? (
                <Card className="border-border/20 bg-card/30">
                  <CardContent className="py-16 text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-muted/20 flex items-center justify-center">
                      <Lightbulb className="w-10 h-10 text-muted-foreground/20" />
                    </div>
                    <p className="text-muted-foreground font-medium">
                      {statusFilter === "all" ? "No suggestions yet" : `No ${statusFilter} suggestions`}
                    </p>
                    <p className="text-sm text-muted-foreground/50 mt-1">
                      {statusFilter === "all" ? "Submit your first idea to get started!" : "Try a different filter"}
                    </p>
                    {statusFilter === "all" && (
                      <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={() => setActiveTab("submit")}>
                        <Lightbulb className="w-4 h-4" /> Submit an Idea <ArrowRight className="w-3 h-3" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredSuggestions.map((s, idx) => {
                    const status = STATUS_MAP[s.status] || STATUS_MAP.pending;
                    const StatusIcon = status.icon;
                    const catItem = CATEGORIES.find(c => c.value === s.category);
                    const CatIcon = catItem?.icon || Lightbulb;
                    const prioItem = PRIORITIES.find(p => p.value === s.priority);

                    return (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                      >
                        <Card className={`border-border/20 bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-all duration-300 overflow-hidden group ${status.glow} shadow-lg`}>
                          <div className={`h-[2px] bg-gradient-to-r ${catItem?.bg || "from-primary/20 to-transparent"}`} />
                          <CardContent className="p-4 md:p-5">
                            <div className="flex items-start gap-4">
                              {/* Category Icon */}
                              <div className={`p-2.5 rounded-xl bg-gradient-to-b ${catItem?.bg || "from-muted/20 to-transparent"} border ${catItem?.border || "border-border/20"} shrink-0 mt-0.5`}>
                                <CatIcon className={`w-5 h-5 ${catItem?.color || "text-muted-foreground"}`} />
                              </div>

                              {/* Content */}
                              <div className="min-w-0 flex-1 space-y-2">
                                <div className="flex items-start justify-between gap-3">
                                  <h4 className="font-semibold text-foreground leading-tight">{s.title}</h4>
                                  <Badge className={`shrink-0 ${status.color} border text-[11px] font-medium`}>
                                    <StatusIcon className="w-3 h-3 mr-1" />
                                    {status.label}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed">{s.description}</p>
                                
                                <div className="flex items-center gap-3 pt-1 flex-wrap">
                                  <span className="text-[11px] text-muted-foreground/50 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                  </span>
                                  {prioItem && (
                                    <span className="text-[11px] text-muted-foreground/50 flex items-center gap-1">
                                      <span className={`w-1.5 h-1.5 rounded-full ${prioItem.dot}`} />
                                      {prioItem.label} priority
                                    </span>
                                  )}
                                  {s.admin_notes && (
                                    <span className="text-[11px] text-primary/80 flex items-center gap-1 italic">
                                      <Star className="w-3 h-3" /> Staff note: {s.admin_notes}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SuggestionBox;
