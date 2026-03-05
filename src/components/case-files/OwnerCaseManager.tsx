import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Trash2, Eye, FolderOpen, Clock, FileVideo, MessageSquare, Users } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

export const OwnerCaseManager = () => {
  const { toast } = useToast();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const [caseEvidence, setCaseEvidence] = useState<any[]>([]);
  const [caseNotes, setCaseNotes] = useState<any[]>([]);

  useEffect(() => { fetchCases(); }, []);

  const fetchCases = async () => {
    setLoading(true);
    const { data } = await supabase.from("case_files").select("*").order("created_at", { ascending: false });
    setCases(data || []);
    setLoading(false);
  };

  const deleteCase = async (caseId: string) => {
    // Delete all related data first
    await Promise.all([
      supabase.from("case_file_evidence").delete().eq("case_id", caseId),
      supabase.from("case_file_notes").delete().eq("case_id", caseId),
      supabase.from("case_file_votes").delete().eq("case_id", caseId),
      supabase.from("case_file_witnesses").delete().eq("case_id", caseId),
      supabase.from("case_file_statements").delete().eq("case_id", caseId),
      supabase.from("case_file_audit_log").delete().eq("case_id", caseId),
      supabase.from("case_file_suspect_evidence" as any).delete().eq("case_id", caseId),
    ]);
    const { error } = await supabase.from("case_files").delete().eq("id", caseId);
    if (error) toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
    else { toast({ title: "Case deleted successfully" }); fetchCases(); }
  };

  const viewCaseDetails = async (caseId: string) => {
    if (expandedCase === caseId) { setExpandedCase(null); return; }
    setExpandedCase(caseId);
    const [evidRes, notesRes] = await Promise.all([
      supabase.from("case_file_evidence").select("*").eq("case_id", caseId).order("created_at"),
      supabase.from("case_file_notes").select("*").eq("case_id", caseId).order("created_at", { ascending: false }).limit(10),
    ]);
    setCaseEvidence(evidRes.data || []);
    setCaseNotes(notesRes.data || []);
  };

  const filtered = cases.filter(c => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return c.case_ref?.toLowerCase().includes(s) || c.suspect_name?.toLowerCase().includes(s) || c.suspect_discord_id?.includes(s);
    }
    return true;
  });

  const severityColors: Record<string, string> = {
    minor: "bg-green-500/20 text-green-400 border-green-500/30",
    serious: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-card border border-border/50 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-foreground">{cases.length}</p>
          <p className="text-xs text-muted-foreground">Total Cases</p>
        </div>
        <div className="bg-card border border-yellow-500/20 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-yellow-400">{cases.filter(c => c.status === "open").length}</p>
          <p className="text-xs text-muted-foreground">Open</p>
        </div>
        <div className="bg-card border border-blue-500/20 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-blue-400">{cases.filter(c => c.status === "under_investigation").length}</p>
          <p className="text-xs text-muted-foreground">Investigating</p>
        </div>
        <div className="bg-card border border-green-500/20 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-green-400">{cases.filter(c => c.status === "resolved").length}</p>
          <p className="text-xs text-muted-foreground">Resolved</p>
        </div>
        <div className="bg-card border border-red-500/20 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-red-400">{cases.filter(c => c.severity === "critical").length}</p>
          <p className="text-xs text-muted-foreground">Critical</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search cases..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="under_investigation">Investigating</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cases */}
      <div className="space-y-2">
        {filtered.map(c => (
          <div key={c.id} className="bg-card border border-border/50 rounded-lg overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <FolderOpen className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary">{c.case_ref}</span>
                    <Badge variant="outline" className={severityColors[c.severity] || ""}>
                      {c.severity === "minor" ? "🟢" : c.severity === "serious" ? "🟡" : "🔴"} {c.severity}
                    </Badge>
                    <Badge variant="outline" className="capitalize text-xs">{c.status?.replace("_", " ")}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {c.suspect_name || "Unknown"} • {c.case_origin?.replace(/_/g, " ")} • {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => viewCaseDetails(c.id)}>
                  <Eye className="w-4 h-4 mr-1" /> {expandedCase === c.id ? "Hide" : "View"}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm"><Trash2 className="w-4 h-4" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Case {c.case_ref}?</AlertDialogTitle>
                      <AlertDialogDescription>This will permanently delete the case and ALL related evidence, notes, votes, and audit logs.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteCase(c.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedCase === c.id && (
              <div className="border-t border-border/30 p-4 bg-muted/5 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Discord ID:</span> <span className="font-mono">{c.suspect_discord_id || "N/A"}</span></div>
                  <div><span className="text-muted-foreground">Steam ID:</span> {c.suspect_steam_id || "N/A"}</div>
                  <div><span className="text-muted-foreground">Priority:</span> {c.priority_impact}/{c.priority_urgency}</div>
                  <div><span className="text-muted-foreground">Rules:</span> {c.rules_violated?.join(", ") || "None"}</div>
                </div>

                {/* Evidence */}
                {caseEvidence.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-2"><FileVideo className="w-4 h-4" /> Evidence ({caseEvidence.length})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {caseEvidence.map(ev => (
                        <div key={ev.id} className="bg-background/50 border border-border/30 rounded p-2 text-xs">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] capitalize">{ev.evidence_type}</Badge>
                            {ev.locked && <Badge className="bg-red-500/20 text-red-400 text-[10px]">Locked</Badge>}
                          </div>
                          {ev.description && <p className="text-muted-foreground mt-1">{ev.description}</p>}
                          {ev.file_url && <a href={ev.file_url} target="_blank" rel="noopener noreferrer" className="text-primary underline block mt-1 truncate">{ev.file_url}</a>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Notes */}
                {caseNotes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-2"><MessageSquare className="w-4 h-4" /> Recent Notes ({caseNotes.length})</h4>
                    <div className="space-y-1">
                      {caseNotes.slice(0, 5).map(n => (
                        <div key={n.id} className="bg-background/50 border border-border/30 rounded p-2 text-xs">
                          <span className="font-semibold">{n.author_name || n.author_discord_id}:</span> {n.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
