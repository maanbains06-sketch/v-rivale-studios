import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Clock, AlertTriangle, CheckCircle, Archive, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CaseFilesListProps {
  onSelectCase: (id: string) => void;
  refreshTrigger: number;
}

const severityColors: Record<string, string> = {
  minor: "bg-green-500/20 text-green-400 border-green-500/30",
  serious: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
};

const statusIcons: Record<string, any> = {
  open: Clock,
  under_investigation: Eye,
  resolved: CheckCircle,
  archived: Archive,
};

export const CaseFilesList = ({ onSelectCase, refreshTrigger }: CaseFilesListProps) => {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  useEffect(() => {
    fetchCases();
  }, [refreshTrigger]);

  const fetchCases = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("case_files")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setCases(data);
    setLoading(false);
  };

  const filtered = cases.filter(c => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (severityFilter !== "all" && c.severity !== severityFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        c.case_ref?.toLowerCase().includes(s) ||
        c.suspect_name?.toLowerCase().includes(s) ||
        c.suspect_discord_id?.includes(s) ||
        c.rules_violated?.some((r: string) => r.toLowerCase().includes(s))
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by ID, name, or rule..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="under_investigation">Investigating</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Severity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="minor">🟢 Minor</SelectItem>
            <SelectItem value="serious">🟡 Serious</SelectItem>
            <SelectItem value="critical">🔴 Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Open", count: cases.filter(c => c.status === "open").length, color: "text-yellow-400" },
          { label: "Investigating", count: cases.filter(c => c.status === "under_investigation").length, color: "text-blue-400" },
          { label: "Resolved", count: cases.filter(c => c.status === "resolved").length, color: "text-green-400" },
          { label: "Total", count: cases.length, color: "text-primary" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border/50 rounded-lg p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Case list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No case files found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => {
            const StatusIcon = statusIcons[c.status] || Clock;
            return (
              <div
                key={c.id}
                onClick={() => onSelectCase(c.id)}
                className="bg-card border border-border/50 rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-all hover:bg-card/80"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusIcon className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary">{c.case_ref}</span>
                        <Badge variant="outline" className={severityColors[c.severity] || ""}>
                          {c.severity === "minor" ? "🟢" : c.severity === "serious" ? "🟡" : "🔴"} {c.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {c.suspect_name || "Unknown suspect"} • {c.case_origin?.replace("_", " ")}
                        {c.rules_violated?.length > 0 && ` • ${c.rules_violated.join(", ")}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</p>
                    <p className="capitalize">{c.status?.replace("_", " ")}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
