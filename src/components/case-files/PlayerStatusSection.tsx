import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, AlertTriangle, Shield, UserCheck, RefreshCw } from "lucide-react";

interface PlayerRecord {
  discord_id: string;
  discord_username: string | null;
  discord_avatar: string | null;
  total_cases: number;
  total_bans: number;
  total_warnings: number;
  risk_level: string;
  last_case_date: string | null;
}

export const PlayerStatusSection = () => {
  const { toast } = useToast();
  const [players, setPlayers] = useState<PlayerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);

  useEffect(() => { fetchPlayers(); }, []);

  const fetchPlayers = async () => {
    setLoading(true);
    // Aggregate from case_files
    const { data: cases } = await supabase
      .from("case_files")
      .select("suspect_discord_id, suspect_name, severity, status, rules_violated, created_at")
      .not("suspect_discord_id", "is", null);

    if (cases) {
      const playerMap: Record<string, PlayerRecord> = {};
      
      for (const c of cases) {
        const did = c.suspect_discord_id;
        if (!did) continue;
        if (!playerMap[did]) {
          playerMap[did] = {
            discord_id: did,
            discord_username: c.suspect_name || null,
            discord_avatar: null,
            total_cases: 0,
            total_bans: 0,
            total_warnings: 0,
            risk_level: "low",
            last_case_date: null,
          };
        }
        playerMap[did].total_cases++;
        if (c.severity === "critical" || c.status === "resolved") playerMap[did].total_bans++;
        if (c.severity === "minor") playerMap[did].total_warnings++;
        if (!playerMap[did].last_case_date || c.created_at > playerMap[did].last_case_date!) {
          playerMap[did].last_case_date = c.created_at;
        }
      }

      // Calculate risk levels
      Object.values(playerMap).forEach(p => {
        if (p.total_cases >= 5 || p.total_bans >= 3) p.risk_level = "critical";
        else if (p.total_cases >= 3 || p.total_bans >= 2) p.risk_level = "high";
        else if (p.total_cases >= 2) p.risk_level = "medium";
        else p.risk_level = "low";
      });

      const playerList = Object.values(playerMap).sort((a, b) => b.total_cases - a.total_cases);
      setPlayers(playerList);

      // Fetch Discord profiles for all players
      syncDiscordProfiles(playerList);
    }
    setLoading(false);
  };

  const syncDiscordProfiles = async (playerList: PlayerRecord[]) => {
    setSyncing(true);
    const updated = [...playerList];
    for (const player of updated) {
      if (player.discord_id && /^\d{17,19}$/.test(player.discord_id)) {
        try {
          const { data } = await supabase.functions.invoke('fetch-discord-user', {
            body: { discordId: player.discord_id }
          });
          if (data) {
            player.discord_username = data.displayName || data.username || player.discord_username;
            player.discord_avatar = data.avatar || null;
          }
        } catch { /* ignore */ }
      }
    }
    setPlayers([...updated]);
    setSyncing(false);
  };

  const filtered = players.filter(p => {
    if (!search) return true;
    const s = search.toLowerCase();
    return p.discord_id.includes(s) || p.discord_username?.toLowerCase().includes(s);
  });

  const riskColors: Record<string, string> = {
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
    high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    low: "bg-green-500/20 text-green-400 border-green-500/30",
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-primary" /> Player Status Tracker
        </h2>
        <Button variant="outline" size="sm" onClick={fetchPlayers} disabled={syncing}>
          <RefreshCw className={`w-4 h-4 mr-1 ${syncing ? "animate-spin" : ""}`} /> {syncing ? "Syncing..." : "Refresh"}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by Discord ID or username..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border/50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{players.length}</p>
          <p className="text-xs text-muted-foreground">Total Players</p>
        </div>
        <div className="bg-card border border-red-500/20 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{players.filter(p => p.risk_level === "critical").length}</p>
          <p className="text-xs text-muted-foreground">Critical Risk</p>
        </div>
        <div className="bg-card border border-orange-500/20 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-orange-400">{players.filter(p => p.risk_level === "high").length}</p>
          <p className="text-xs text-muted-foreground">High Risk</p>
        </div>
        <div className="bg-card border border-green-500/20 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{players.filter(p => p.risk_level === "low").length}</p>
          <p className="text-xs text-muted-foreground">Low Risk</p>
        </div>
      </div>

      {/* Player List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No players found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <div key={p.discord_id} className="bg-card border border-border/50 rounded-lg p-4 flex items-center gap-4 hover:border-primary/30 transition-all">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center shrink-0 overflow-hidden">
                {p.discord_avatar ? (
                  <img src={p.discord_avatar} alt="" className="w-12 h-12 rounded-full" />
                ) : (
                  <span className="text-lg font-bold text-muted-foreground">{(p.discord_username || "?")[0]}</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{p.discord_username || "Unknown"}</span>
                  <Badge variant="outline" className={riskColors[p.risk_level] || ""}>
                    {p.risk_level === "critical" ? "🔴" : p.risk_level === "high" ? "🟠" : p.risk_level === "medium" ? "🟡" : "🟢"} {p.risk_level}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-mono">{p.discord_id}</p>
              </div>

              {/* Stats */}
              <div className="flex gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-foreground">{p.total_cases}</p>
                  <p className="text-[10px] text-muted-foreground">Cases</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-red-400">{p.total_bans}</p>
                  <p className="text-[10px] text-muted-foreground">Bans</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-yellow-400">{p.total_warnings}</p>
                  <p className="text-[10px] text-muted-foreground">Warnings</p>
                </div>
              </div>

              {p.risk_level === "critical" && (
                <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
