import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Lightbulb, Search, CheckCircle2, XCircle, Clock, Sparkles, Server, Globe, Gamepad2, Bug, Trash2, Filter, MessageSquare, ArrowUpDown } from "lucide-react";
import { motion } from "framer-motion";

const CATEGORIES: Record<string, { label: string; icon: any; color: string }> = {
  server: { label: "Server", icon: Server, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  website: { label: "Website", icon: Globe, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  gameplay: { label: "Gameplay", icon: Gamepad2, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  "bug-fix": { label: "Bug Fix", icon: Bug, color: "text-red-400 bg-red-500/10 border-red-500/20" },
  general: { label: "General", icon: Lightbulb, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
};

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", icon: Clock, color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { value: "approved", label: "Approved", icon: CheckCircle2, color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { value: "rejected", label: "Rejected", icon: XCircle, color: "bg-red-500/20 text-red-400 border-red-500/30" },
  { value: "implemented", label: "Implemented", icon: Sparkles, color: "bg-primary/20 text-primary border-primary/30" },
];

const AdminSuggestionsTab = () => {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    fetchSuggestions();
    const channel = supabase
      .channel("admin-suggestions")
      .on("postgres_changes", { event: "*", schema: "public", table: "suggestions" }, () => fetchSuggestions())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchSuggestions = async () => {
    const { data } = await supabase.from("suggestions").select("*").order("created_at", { ascending: false });
    setSuggestions(data || []);
    setLoading(false);
  };

  const handleUpdate = async () => {
    if (!selectedSuggestion) return;
    const { error } = await supabase.from("suggestions").update({
      status: newStatus,
      admin_notes: adminNotes,
      reviewed_at: new Date().toISOString(),
    }).eq("id", selectedSuggestion.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update.", variant: "destructive" });
      return;
    }
    toast({ title: "Updated", description: "Suggestion status updated." });
    setSelectedSuggestion(null);
    fetchSuggestions();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("suggestions").delete().eq("id", id);
    if (!error) {
      toast({ title: "Deleted", description: "Suggestion removed." });
      fetchSuggestions();
    }
  };

  const filtered = suggestions
    .filter(s => {
      if (filterStatus !== "all" && s.status !== filterStatus) return false;
      if (filterCategory !== "all" && s.category !== filterCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        return s.title?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q) || s.discord_username?.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => sortBy === "newest" ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime() : new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const counts = {
    total: suggestions.length,
    pending: suggestions.filter(s => s.status === "pending").length,
    approved: suggestions.filter(s => s.status === "approved").length,
    implemented: suggestions.filter(s => s.status === "implemented").length,
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: counts.total, icon: MessageSquare, color: "border-primary/30" },
          { label: "Pending", value: counts.pending, icon: Clock, color: "border-amber-500/30" },
          { label: "Approved", value: counts.approved, icon: CheckCircle2, color: "border-emerald-500/30" },
          { label: "Implemented", value: counts.implemented, icon: Sparkles, color: "border-purple-500/30" },
        ].map(stat => (
          <Card key={stat.label} className={`glass-effect ${stat.color}`}>
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <stat.icon className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="glass-effect border-border/20">
        <CardContent className="py-3 px-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search suggestions..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-background/50 border-border/30" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[130px] bg-background/50 border-border/30">
                <Filter className="w-3 h-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[130px] bg-background/50 border-border/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(CATEGORIES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => setSortBy(s => s === "newest" ? "oldest" : "newest")} className="border-border/30">
              <ArrowUpDown className="w-3 h-3 mr-1" />
              {sortBy === "newest" ? "Newest" : "Oldest"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Suggestions List */}
      {filtered.length === 0 ? (
        <Card className="glass-effect border-border/20">
          <CardContent className="py-12 text-center">
            <Lightbulb className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No suggestions found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((s, idx) => {
            const cat = CATEGORIES[s.category] || CATEGORIES.general;
            const CatIcon = cat.icon;
            const statusOpt = STATUS_OPTIONS.find(st => st.value === s.status) || STATUS_OPTIONS[0];
            const StatusIcon = statusOpt.icon;

            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Card className="glass-effect border-border/20 hover:border-primary/20 transition-all group">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <Avatar className="w-10 h-10 shrink-0 border border-border/30">
                        {s.discord_avatar ? (
                          <AvatarImage src={`https://cdn.discordapp.com/avatars/${s.discord_id}/${s.discord_avatar}.png`} />
                        ) : null}
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {(s.discord_username || "?")[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="font-semibold text-foreground">{s.title}</h4>
                          <Badge className={`text-xs ${cat.color} border`}>
                            <CatIcon className="w-3 h-3 mr-1" />
                            {cat.label}
                          </Badge>
                          <Badge className={`text-xs ${statusOpt.color} border`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusOpt.label}
                          </Badge>
                          {s.priority === "high" && <Badge variant="destructive" className="text-xs">High</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{s.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground/60">
                          <span>by <span className="text-foreground/70">{s.discord_username || "Unknown"}</span></span>
                          <span>•</span>
                          <span>{new Date(s.created_at).toLocaleDateString()}</span>
                          {s.admin_notes && (
                            <>
                              <span>•</span>
                              <span className="text-primary/60 italic">Note: {s.admin_notes}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-border/30"
                          onClick={() => {
                            setSelectedSuggestion(s);
                            setAdminNotes(s.admin_notes || "");
                            setNewStatus(s.status);
                          }}
                        >
                          Review
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(s.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={!!selectedSuggestion} onOpenChange={(open) => { if (!open) setSelectedSuggestion(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              Review Suggestion
            </DialogTitle>
          </DialogHeader>
          {selectedSuggestion && (
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-4 border border-border/20">
                <h4 className="font-semibold mb-1">{selectedSuggestion.title}</h4>
                <p className="text-sm text-muted-foreground">{selectedSuggestion.description}</p>
                <p className="text-xs text-muted-foreground/60 mt-2">
                  By {selectedSuggestion.discord_username} • {new Date(selectedSuggestion.created_at).toLocaleString()}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Admin Notes</Label>
                <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Add notes about this suggestion..." rows={3} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSuggestion(null)}>Cancel</Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSuggestionsTab;
