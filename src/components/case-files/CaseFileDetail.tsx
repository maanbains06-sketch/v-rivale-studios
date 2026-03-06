import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft, Clock, Shield, FileVideo, MessageSquare, Vote,
  Lock, AlertTriangle, Upload, Plus, Send, Eye,
  History, Flag, Users, Gavel, Copy, RefreshCw, Snowflake,
  Trash2, UserCheck, Search, Download
} from "lucide-react";
import { EvidenceUploader } from "./EvidenceUploader";
import { formatDistanceToNow, format } from "date-fns";

interface CaseFileDetailProps {
  caseId: string;
  onBack: () => void;
  userDiscordId: string | null;
  userId: string | null;
  discordUsername: string | null;
  discordAvatar: string | null;
  isOwner: boolean;
  staffRoleType: string | null;
  voteWeight: number;
  onRefresh: () => void;
}

const BEHAVIORAL_TAGS = ["Aggressive", "Cooperative", "Rule Lawyer", "Troll", "Evasive", "Remorseful", "Repeat Offender", "New Player"];
const RULES = [
  "RDM", "VDM", "Fail RP", "Combat Logging", "Meta Gaming", "Power Gaming",
  "Exploiting", "Hacking", "Staff Disrespect", "OOC Toxicity", "NLR Violation",
  "Fear RP", "Cop Baiting", "Bug Abuse", "ERP", "Stream Sniping", "Deathmatching",
  "Money Glitching", "Car Surfing", "Unrealistic Driving", "Third Party Comms",
  "Breaking Character", "Spam", "Advertising", "Impersonation", "Griefing",
  "FailDrive", "Gang Rule Violation", "Corruption Abuse", "Job Abuse"
];

const PENAL_CODE: Record<string, string> = {
  "RDM": "3-Day Ban", "VDM": "3-Day Ban", "Fail RP": "Warning + 1-Day Ban",
  "Combat Logging": "2-Day Ban", "Meta Gaming": "Warning + 2-Day Ban",
  "Power Gaming": "Warning + 1-Day Ban", "Exploiting": "7-Day Ban + Inventory Wipe",
  "Hacking": "Permanent Ban", "Staff Disrespect": "7-Day Ban",
  "OOC Toxicity": "Warning + Mute", "NLR Violation": "Warning", "Fear RP": "Warning",
  "Cop Baiting": "Warning + 1-Day Ban", "Bug Abuse": "3-Day Ban + Inventory Wipe",
  "ERP": "Permanent Ban", "Stream Sniping": "3-Day Ban", "Deathmatching": "3-Day Ban",
  "Money Glitching": "7-Day Ban + Wipe", "Car Surfing": "Warning",
  "Unrealistic Driving": "Warning", "Third Party Comms": "Warning + 1-Day Ban",
  "Breaking Character": "Warning", "Spam": "Mute + Warning", "Advertising": "Permanent Ban",
  "Impersonation": "3-Day Ban", "Griefing": "3-Day Ban", "FailDrive": "Warning",
  "Gang Rule Violation": "2-Day Ban", "Corruption Abuse": "3-Day Ban", "Job Abuse": "1-Day Ban"
};

export const CaseFileDetail = ({
  caseId, onBack, userDiscordId, userId, discordUsername, discordAvatar,
  isOwner, staffRoleType, voteWeight, onRefresh
}: CaseFileDetailProps) => {
  const { toast } = useToast();
  const [caseData, setCaseData] = useState<any>(null);
  const [evidence, setEvidence] = useState<any[]>([]);
  const [suspectEvidence, setSuspectEvidence] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [witnesses, setWitnesses] = useState<any[]>([]);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [statements, setStatements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [newEvidenceUrl, setNewEvidenceUrl] = useState("");
  const [newEvidenceDesc, setNewEvidenceDesc] = useState("");
  const [newEvidenceType, setNewEvidenceType] = useState("screenshot");
  const [previousCases, setPreviousCases] = useState<any[]>([]);
  const [voteChoice, setVoteChoice] = useState("");
  const [newWitnessDiscordId, setNewWitnessDiscordId] = useState("");
  const [newWitnessName, setNewWitnessName] = useState("");
  const [fetchingWitness, setFetchingWitness] = useState(false);
  const [newStatementText, setNewStatementText] = useState("");
  const [newStatementGivenTo, setNewStatementGivenTo] = useState("");
  const [suspectProfile, setSuspectProfile] = useState<any>(null);
  const [newSuspectEvidenceUrl, setNewSuspectEvidenceUrl] = useState("");
  const [newSuspectEvidenceDesc, setNewSuspectEvidenceDesc] = useState("");
  const [newSuspectEvidenceType, setNewSuspectEvidenceType] = useState("screenshot");
  const notesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel(`case-notes-${caseId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "case_file_notes", filter: `case_id=eq.${caseId}` }, (payload) => {
        setNotes(prev => [...prev, payload.new]);
        setTimeout(() => notesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [caseId]);

  const fetchAll = async () => {
    setLoading(true);
    const [caseRes, evidRes, notesRes, votesRes, witRes, auditRes, stmtRes, suspEvidRes] = await Promise.all([
      supabase.from("case_files").select("*").eq("id", caseId).single(),
      supabase.from("case_file_evidence").select("*").eq("case_id", caseId).order("created_at"),
      supabase.from("case_file_notes").select("*").eq("case_id", caseId).order("created_at"),
      supabase.from("case_file_votes").select("*").eq("case_id", caseId),
      supabase.from("case_file_witnesses").select("*").eq("case_id", caseId),
      supabase.from("case_file_audit_log").select("*").eq("case_id", caseId).order("created_at", { ascending: false }),
      supabase.from("case_file_statements").select("*").eq("case_id", caseId).order("created_at"),
      supabase.from("case_file_suspect_evidence" as any).select("*").eq("case_id", caseId).order("created_at"),
    ]);
    if (caseRes.data) {
      setCaseData(caseRes.data);
      // Fetch suspect profile
      if (caseRes.data.suspect_discord_id) {
        fetchSuspectProfile(caseRes.data.suspect_discord_id);
        const { data: prev } = await supabase
          .from("case_files")
          .select("id, case_ref, severity, rules_violated, status, created_at")
          .eq("suspect_discord_id", caseRes.data.suspect_discord_id)
          .neq("id", caseId)
          .order("created_at", { ascending: false });
        setPreviousCases(prev || []);
      }
    }
    setEvidence(evidRes.data || []);
    setNotes(notesRes.data || []);
    setVotes(votesRes.data || []);
    setWitnesses(witRes.data || []);
    setAuditLog(auditRes.data || []);
    setStatements(stmtRes.data || []);
    setSuspectEvidence((suspEvidRes as any).data || []);
    setLoading(false);
  };

  const fetchSuspectProfile = async (discordId: string) => {
    if (!discordId || !/^\d{17,19}$/.test(discordId)) return;
    try {
      const { data } = await supabase.functions.invoke('fetch-discord-user', { body: { discordId } });
      if (data) setSuspectProfile(data);
    } catch { /* ignore */ }
  };

  const fetchWitnessProfile = async () => {
    if (!newWitnessDiscordId || !/^\d{17,19}$/.test(newWitnessDiscordId)) {
      toast({ title: "Enter a valid Discord ID", variant: "destructive" });
      return;
    }
    setFetchingWitness(true);
    try {
      const { data } = await supabase.functions.invoke('fetch-discord-user', { body: { discordId: newWitnessDiscordId } });
      if (data?.username) {
        setNewWitnessName(data.displayName || data.username);
      } else {
        toast({ title: "Could not find Discord user", variant: "destructive" });
      }
    } catch { toast({ title: "Failed to fetch", variant: "destructive" }); }
    setFetchingWitness(false);
  };

  const logAudit = async (actionType: string, desc: string, oldVal?: any, newVal?: any) => {
    await supabase.from("case_file_audit_log").insert({
      case_id: caseId, action_type: actionType, action_description: desc,
      performed_by: userDiscordId || "unknown", performed_by_user_id: userId || undefined,
      old_value: oldVal, new_value: newVal,
    });
  };

  const updateCase = async (updates: any) => {
    const old = { ...caseData };
    const { error } = await supabase.from("case_files").update(updates).eq("id", caseId);
    if (error) { toast({ title: "Update failed", variant: "destructive" }); return; }
    await logAudit("updated", `Case updated by ${discordUsername}`, old, updates);
    setCaseData((p: any) => ({ ...p, ...updates }));
    toast({ title: "Case updated" });
  };

  const sendNote = async () => {
    if (!newNote.trim()) return;
    const { error } = await supabase.from("case_file_notes").insert({
      case_id: caseId, author_discord_id: userDiscordId || "unknown",
      author_name: discordUsername, author_avatar: discordAvatar,
      message: newNote.trim(), note_type: "discussion",
    });
    if (error) toast({ title: "Failed to send", variant: "destructive" });
    else setNewNote("");
  };

  const addEvidence = async () => {
    if (!newEvidenceUrl.trim()) return;
    const { error } = await supabase.from("case_file_evidence").insert({
      case_id: caseId, evidence_type: newEvidenceType, file_url: newEvidenceUrl.trim(),
      description: newEvidenceDesc || null, uploaded_by: userDiscordId || "unknown",
      uploaded_by_user_id: userId || undefined,
    });
    if (error) toast({ title: "Failed to add evidence", variant: "destructive" });
    else {
      await logAudit("evidence_added", `Evidence added by ${discordUsername}`);
      setNewEvidenceUrl(""); setNewEvidenceDesc(""); fetchAll();
    }
  };

  const addSuspectEvidence = async () => {
    if (!newSuspectEvidenceUrl.trim()) return;
    const { error } = await supabase.from("case_file_suspect_evidence" as any).insert({
      case_id: caseId, evidence_type: newSuspectEvidenceType, file_url: newSuspectEvidenceUrl.trim(),
      description: newSuspectEvidenceDesc || null, uploaded_by: userDiscordId || "unknown",
      uploaded_by_user_id: userId || undefined,
    });
    if (error) toast({ title: "Failed to add suspect evidence", variant: "destructive" });
    else {
      await logAudit("suspect_evidence_added", `Suspect evidence added by ${discordUsername}`);
      setNewSuspectEvidenceUrl(""); setNewSuspectEvidenceDesc(""); fetchAll();
    }
  };

  const castVote = async () => {
    if (!voteChoice) return;
    const existingVote = votes.find(v => v.voter_discord_id === userDiscordId);
    if (existingVote) { toast({ title: "You already voted", variant: "destructive" }); return; }
    const { error } = await supabase.from("case_file_votes").insert({
      case_id: caseId, voter_discord_id: userDiscordId || "unknown",
      voter_name: discordUsername, voter_role_type: staffRoleType || "moderator",
      vote: voteChoice, vote_weight: voteWeight, is_veto: isOwner && voteChoice === "veto",
    });
    if (error) toast({ title: "Vote failed", variant: "destructive" });
    else { await logAudit("vote_cast", `${discordUsername} voted: ${voteChoice} (weight: ${voteWeight})`); setVoteChoice(""); fetchAll(); }
  };

  const addWitness = async () => {
    if (!newWitnessName.trim()) return;
    const { data, error } = await supabase.from("case_file_witnesses").insert({
      case_id: caseId, witness_name: newWitnessName.trim(),
      witness_discord_id: newWitnessDiscordId || null,
      witness_discord_username: newWitnessName.trim(),
      created_by: userDiscordId || "unknown",
    } as any).select().single();
    if (error) toast({ title: "Failed", variant: "destructive" });
    else {
      toast({ title: `Witness added. Access Code: ${data.access_code}` });
      setNewWitnessName(""); setNewWitnessDiscordId(""); fetchAll();
    }
  };

  const addStatement = async () => {
    if (!newStatementText.trim() || !caseData?.suspect_discord_id) return;
    const { error } = await supabase.from("case_file_statements").insert({
      case_id: caseId, suspect_discord_id: caseData.suspect_discord_id,
      statement: newStatementText.trim(), given_to: userDiscordId || "unknown",
      given_to_name: discordUsername,
    });
    if (error) toast({ title: "Failed", variant: "destructive" });
    else { setNewStatementText(""); fetchAll(); }
  };

  const lockEvidence = async (evidenceId: string) => {
    if (!isOwner) { toast({ title: "Only owner can lock evidence", variant: "destructive" }); return; }
    await supabase.from("case_file_evidence").update({ locked: true, locked_at: new Date().toISOString(), locked_by: userDiscordId }).eq("id", evidenceId);
    await logAudit("evidence_locked", `Evidence locked by ${discordUsername}`);
    fetchAll();
  };

  const deleteEvidence = async (evidenceId: string) => {
    if (!isOwner) { toast({ title: "Only owner can delete evidence", variant: "destructive" }); return; }
    await supabase.from("case_file_evidence").delete().eq("id", evidenceId);
    await logAudit("evidence_deleted", `Evidence deleted by ${discordUsername}`);
    fetchAll();
  };

  const toggleAssetFreeze = async () => { await updateCase({ asset_freeze: !caseData.asset_freeze }); };

  const getSuggestedPunishment = () => {
    if (!caseData?.rules_violated?.length) return null;
    const punishments = caseData.rules_violated.map((r: string) => PENAL_CODE[r]).filter(Boolean);
    return punishments.length ? [...new Set(punishments)].join(" + ") : null;
  };

  // Live timer
  const [elapsed, setElapsed] = useState("");
  useEffect(() => {
    if (!caseData?.created_at || caseData.status === "resolved" || caseData.status === "archived") return;
    const interval = setInterval(() => {
      const diff = Date.now() - new Date(caseData.created_at).getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [caseData?.created_at, caseData?.status]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }
  if (!caseData) return <p className="text-muted-foreground">Case not found.</p>;

  const voteTotal = votes.reduce((sum, v) => sum + (v.vote === "ban" ? v.vote_weight : v.vote === "no_ban" ? -v.vote_weight : 0), 0);
  const hasVeto = votes.some(v => v.is_veto);
  const alreadyVoted = votes.some(v => v.voter_discord_id === userDiscordId);

  // Statement inconsistency detection
  const detectInconsistencies = () => {
    if (statements.length < 2) return [];
    const keywords = ["crash", "internet", "disconnect", "lag", "freeze", "accident", "self defense", "didn't", "never"];
    const issues: string[] = [];
    for (let i = 0; i < statements.length; i++) {
      for (let j = i + 1; j < statements.length; j++) {
        const s1Words = statements[i].statement.toLowerCase().split(/\s+/);
        const s2Words = statements[j].statement.toLowerCase().split(/\s+/);
        const contradictions = keywords.filter(k => 
          (s1Words.some((w: string) => w.includes(k)) && !s2Words.some((w: string) => w.includes(k))) ||
          (!s1Words.some((w: string) => w.includes(k)) && s2Words.some((w: string) => w.includes(k)))
        );
        if (contradictions.length > 0) {
          issues.push(`Statements #${i+1} and #${j+1} differ on: ${contradictions.join(", ")}`);
        }
      }
    }
    return issues;
  };

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-mono font-bold text-primary">{caseData.case_ref}</h2>
            <Badge variant="outline" className={
              caseData.severity === "critical" ? "bg-red-500/20 text-red-400 border-red-500/30" :
              caseData.severity === "serious" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
              "bg-green-500/20 text-green-400 border-green-500/30"
            }>
              {caseData.severity === "minor" ? "🟢" : caseData.severity === "serious" ? "🟡" : "🔴"} {caseData.severity}
            </Badge>
            <Badge variant="outline" className="capitalize">{caseData.status?.replace("_", " ")}</Badge>
            {elapsed && caseData.status !== "resolved" && caseData.status !== "archived" && (
              <Badge variant="outline" className="font-mono bg-orange-500/10 text-orange-400 border-orange-500/30">
                <Clock className="w-3 h-3 mr-1" /> {elapsed}
              </Badge>
            )}
            {caseData.asset_freeze && (
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30"><Snowflake className="w-3 h-3 mr-1" /> Asset Freeze</Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={caseData.status} onValueChange={v => updateCase({ status: v, ...(v === "resolved" ? { resolved_at: new Date().toISOString(), resolved_by: userDiscordId } : {}) })}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="under_investigation">Investigating</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={toggleAssetFreeze}>
            <Snowflake className="w-4 h-4 mr-1" /> {caseData.asset_freeze ? "Unfreeze" : "Freeze"}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchAll}><RefreshCw className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Pattern Recognition Warning */}
      {previousCases.length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-orange-400 font-semibold mb-2">
            <Flag className="w-5 h-5 animate-pulse" />
            🚩 {previousCases.length} previous case{previousCases.length > 1 ? "s" : ""} found — REPEAT OFFENDER
          </div>
          <div className="space-y-1">
            {previousCases.slice(0, 5).map(pc => (
              <p key={pc.id} className="text-sm text-orange-300/80">
                <span className="font-mono">{pc.case_ref}</span> — {pc.rules_violated?.join(", ") || "N/A"} — <span className="capitalize">{pc.status}</span> — {formatDistanceToNow(new Date(pc.created_at), { addSuffix: true })}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Punishment */}
      {getSuggestedPunishment() && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-2 text-primary font-semibold mb-1"><Gavel className="w-4 h-4" /> Automated Sentencing Suggestion</div>
          <p className="text-sm text-foreground/80">Based on {caseData.rules_violated?.join(" + ")}: <strong>{getSuggestedPunishment()}</strong></p>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="suspect" className="space-y-4">
        <TabsList className="grid grid-cols-3 md:grid-cols-7 w-full">
          <TabsTrigger value="suspect" className="text-xs gap-1"><Shield className="w-3 h-3" /> Suspect</TabsTrigger>
          <TabsTrigger value="evidence" className="text-xs gap-1"><FileVideo className="w-3 h-3" /> Evidence</TabsTrigger>
          <TabsTrigger value="suspect-evidence" className="text-xs gap-1"><UserCheck className="w-3 h-3" /> Suspect Evidence</TabsTrigger>
          <TabsTrigger value="deliberation" className="text-xs gap-1"><MessageSquare className="w-3 h-3" /> Discussion</TabsTrigger>
          <TabsTrigger value="voting" className="text-xs gap-1"><Vote className="w-3 h-3" /> Voting</TabsTrigger>
          <TabsTrigger value="statements" className="text-xs gap-1"><Users className="w-3 h-3" /> Statements</TabsTrigger>
          <TabsTrigger value="audit" className="text-xs gap-1"><History className="w-3 h-3" /> Audit</TabsTrigger>
        </TabsList>

        {/* Suspect Profile */}
        <TabsContent value="suspect" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-border/50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> Discord Profile (OOC)</h3>
              {suspectProfile && (
                <div className="flex items-center gap-3 bg-primary/5 rounded-lg p-3 border border-primary/20">
                  {suspectProfile.avatar && <img src={suspectProfile.avatar} alt="" className="w-12 h-12 rounded-full border-2 border-primary/30" />}
                  <div>
                    <p className="font-semibold">{suspectProfile.displayName || suspectProfile.username}</p>
                    <p className="text-xs text-muted-foreground">@{suspectProfile.username}</p>
                  </div>
                </div>
              )}
              <div className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Discord Username:</span> {suspectProfile?.username || caseData.suspect_name || "Unknown"}</p>
                <p><span className="text-muted-foreground">Discord ID:</span> <span className="font-mono">{caseData.suspect_discord_id || "N/A"}</span></p>
                <p><span className="text-muted-foreground">In-Game Name:</span> {(caseData as any).suspect_in_game_name || caseData.suspect_name || "N/A"}</p>
                <p><span className="text-muted-foreground">Steam ID:</span> {caseData.suspect_steam_id || "N/A"}</p>
                <p><span className="text-muted-foreground">FiveM ID:</span> {(caseData as any).suspect_fivem_id || caseData.suspect_hex_id || "N/A"}</p>
                <p><span className="text-muted-foreground">Case Origin:</span> {caseData.case_origin?.replace(/_/g, " ")}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-card border border-border/50 rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-3">Priority Matrix</h3>
                <div className="grid grid-cols-3 gap-1">
                  {["low", "medium", "high"].map(urgency =>
                    ["low", "medium", "high"].map(impact => (
                      <div key={`${urgency}-${impact}`} className={`p-2 text-xs text-center rounded border ${
                        caseData.priority_impact === impact && caseData.priority_urgency === urgency
                          ? "bg-primary/30 border-primary text-primary font-bold" : "bg-muted/20 border-border/30 text-muted-foreground"
                      }`}>{impact[0].toUpperCase()}/{urgency[0].toUpperCase()}</div>
                    ))
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Impact: {caseData.priority_impact} / Urgency: {caseData.priority_urgency}</p>
              </div>
            </div>
          </div>

          {/* Behavioral Tags */}
          <div className="bg-card border border-border/50 rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-3">Behavioral Tags</h3>
            <div className="flex flex-wrap gap-2">
              {BEHAVIORAL_TAGS.map(tag => (
                <button key={tag} onClick={() => {
                  const tags = caseData.behavioral_tags || [];
                  updateCase({ behavioral_tags: tags.includes(tag) ? tags.filter((t: string) => t !== tag) : [...tags, tag] });
                }} className={`px-3 py-1 text-xs rounded-full border transition-all ${
                  (caseData.behavioral_tags || []).includes(tag) ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50"
                }`}>{tag}</button>
              ))}
            </div>
          </div>

          {/* Rules Violated */}
          <div className="bg-card border border-border/50 rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-3">Rules Violated</h3>
            <div className="flex flex-wrap gap-2">
              {RULES.map(rule => (
                <button key={rule} onClick={() => {
                  const rules = caseData.rules_violated || [];
                  updateCase({ rules_violated: rules.includes(rule) ? rules.filter((r: string) => r !== rule) : [...rules, rule] });
                }} className={`px-3 py-1 text-xs rounded-full border transition-all ${
                  (caseData.rules_violated || []).includes(rule) ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-muted/50 text-muted-foreground border-border hover:border-red-500/30"
                }`}>{rule}</button>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Evidence Locker */}
        <TabsContent value="evidence" className="space-y-4">
          <div className="bg-card border border-border/50 rounded-lg p-4 space-y-3">
            <EvidenceUploader
              label="Add Evidence (Link or Upload)"
              onEvidenceAdded={async (ev) => {
                const { error } = await supabase.from("case_file_evidence").insert({
                  case_id: caseId, evidence_type: ev.type, file_url: ev.url,
                  description: ev.description || null, uploaded_by: userDiscordId || "unknown",
                  uploaded_by_user_id: userId || undefined,
                  file_name: ev.fileName || null, file_size: ev.fileSize || null,
                });
                if (error) toast({ title: "Failed to add evidence", variant: "destructive" });
                else {
                  await logAudit("evidence_added", `Evidence added by ${discordUsername} (${ev.type})`);
                  fetchAll();
                }
              }}
            />
          </div>

          {evidence.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No evidence uploaded yet</p>
          ) : (
            <div className="space-y-3">
              {evidence.map(ev => (
                <div key={ev.id} className="bg-card border border-border/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">{ev.evidence_type}</Badge>
                      {ev.locked && <Badge variant="outline" className="bg-red-500/20 text-red-400"><Lock className="w-3 h-3 mr-1" /> Locked</Badge>}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>by {ev.uploaded_by}</span>
                      <span>{format(new Date(ev.created_at), "PPp")}</span>
                      {!ev.locked && isOwner && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => lockEvidence(ev.id)}><Lock className="w-3 h-3" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteEvidence(ev.id)} className="text-destructive"><Trash2 className="w-3 h-3" /></Button>
                        </>
                      )}
                    </div>
                  </div>
                  {ev.description && <p className="text-sm text-foreground/80 mb-2">{ev.description}</p>}
                  {ev.file_name && ev.file_size && (
                    <p className="text-xs text-muted-foreground mb-1">📎 {ev.file_name} ({(ev.file_size / (1024 * 1024)).toFixed(1)} MB)</p>
                  )}
                  {ev.file_url && (
                    ev.evidence_type === "video" && (ev.file_url.includes("youtube") || ev.file_url.includes("youtu.be")) ? (
                      <div className="aspect-video rounded overflow-hidden bg-black">
                        <iframe src={ev.file_url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")} className="w-full h-full" allowFullScreen />
                      </div>
                    ) : ev.evidence_type === "video" ? (
                      <div className="space-y-2">
                        <video controls className="max-h-64 rounded border border-border/30 w-full">
                          <source src={ev.file_url} />
                        </video>
                        <a href={ev.file_url} target="_blank" rel="noopener noreferrer" className="text-primary underline text-xs flex items-center gap-1"><Download className="w-3 h-3" /> Download</a>
                      </div>
                    ) : ev.evidence_type === "screenshot" ? (
                      <img src={ev.file_url} alt="Evidence" className="max-h-64 rounded border border-border/30" />
                    ) : ev.evidence_type === "audio" ? (
                      <audio controls className="w-full"><source src={ev.file_url} /></audio>
                    ) : (
                      <a href={ev.file_url} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm flex items-center gap-1"><Download className="w-3 h-3" /> {ev.file_url}</a>
                    )
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Witnesses */}
          <div className="bg-card border border-border/50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2"><Users className="w-4 h-4" /> Witness Depositions</h3>
            <div className="flex gap-2 flex-wrap">
              <Input placeholder="Witness Discord ID" value={newWitnessDiscordId} onChange={e => setNewWitnessDiscordId(e.target.value)} className="w-48" />
              <Button size="sm" variant="outline" onClick={fetchWitnessProfile} disabled={fetchingWitness}>
                <Search className="w-3 h-3 mr-1" /> {fetchingWitness ? "..." : "Fetch"}
              </Button>
              <Input placeholder="Witness name (auto-filled)" value={newWitnessName} onChange={e => setNewWitnessName(e.target.value)} className="flex-1" />
              <Button size="sm" onClick={addWitness} disabled={!newWitnessName.trim()}>Add Witness</Button>
            </div>
            {witnesses.map(w => (
              <div key={w.id} className="bg-muted/30 rounded p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{w.witness_name}</span>
                    {w.witness_discord_id && <span className="text-xs text-muted-foreground ml-2">({w.witness_discord_id})</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">{w.access_code}</Badge>
                    <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(w.access_code); toast({ title: "Copied!" }); }}><Copy className="w-3 h-3" /></Button>
                  </div>
                </div>
                {w.deposition ? <p className="mt-2 text-foreground/80 italic">"{w.deposition}"</p> : <p className="mt-1 text-muted-foreground text-xs">Awaiting deposition...</p>}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Suspect Evidence */}
        <TabsContent value="suspect-evidence" className="space-y-4">
          <div className="bg-card border border-border/50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2"><UserCheck className="w-4 h-4" /> Suspect Evidence (evidence provided by/about the suspect)</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Select value={newSuspectEvidenceType} onValueChange={setNewSuspectEvidenceType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="screenshot">📸 Screenshot</SelectItem>
                  <SelectItem value="video">🎥 Video</SelectItem>
                  <SelectItem value="chat_log">💬 Chat Log</SelectItem>
                  <SelectItem value="confession">📝 Confession</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="URL" value={newSuspectEvidenceUrl} onChange={e => setNewSuspectEvidenceUrl(e.target.value)} className="md:col-span-2" />
              <Input placeholder="Description" value={newSuspectEvidenceDesc} onChange={e => setNewSuspectEvidenceDesc(e.target.value)} />
            </div>
            <Button size="sm" onClick={addSuspectEvidence} disabled={!newSuspectEvidenceUrl.trim()}><Plus className="w-4 h-4 mr-1" /> Add Suspect Evidence</Button>
          </div>

          {suspectEvidence.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No suspect evidence added yet</p>
          ) : (
            <div className="space-y-3">
              {suspectEvidence.map((ev: any) => (
                <div key={ev.id} className="bg-card border border-border/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="capitalize">{ev.evidence_type}</Badge>
                    <span className="text-xs text-muted-foreground">{format(new Date(ev.created_at), "PPp")}</span>
                  </div>
                  {ev.description && <p className="text-sm text-foreground/80 mb-2">{ev.description}</p>}
                  {ev.file_url && (
                    ev.evidence_type === "video" && (ev.file_url.includes("youtube") || ev.file_url.includes("youtu.be")) ? (
                      <div className="aspect-video rounded overflow-hidden bg-black">
                        <iframe src={ev.file_url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")} className="w-full h-full" allowFullScreen />
                      </div>
                    ) : ev.evidence_type === "screenshot" ? (
                      <img src={ev.file_url} alt="Suspect Evidence" className="max-h-64 rounded border border-border/30" />
                    ) : (
                      <a href={ev.file_url} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">{ev.file_url}</a>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Staff Deliberation */}
        <TabsContent value="deliberation" className="space-y-4">
          <div className="bg-card border border-border/50 rounded-lg overflow-hidden">
            <div className="p-3 border-b border-border/30 bg-muted/20">
              <h3 className="font-semibold flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Judicial Chat (Staff Only)</h3>
            </div>
            <ScrollArea className="h-[400px] p-4">
              <div className="space-y-3">
                {notes.map(n => (
                  <div key={n.id} className={`flex gap-3 ${n.author_discord_id === userDiscordId ? "flex-row-reverse" : ""}`}>
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {n.author_avatar ? <img src={n.author_avatar} alt="" className="w-8 h-8 rounded-full" /> : (n.author_name || "?")[0]}
                    </div>
                    <div className={`max-w-[70%] rounded-lg p-3 text-sm ${
                      n.author_discord_id === userDiscordId ? "bg-primary/20 text-foreground" : "bg-muted/40 text-foreground"
                    }`}>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">{n.author_name || n.author_discord_id}</p>
                      <p>{n.message}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">{format(new Date(n.created_at), "p")}</p>
                    </div>
                  </div>
                ))}
                <div ref={notesEndRef} />
              </div>
            </ScrollArea>
            <div className="p-3 border-t border-border/30 flex gap-2">
              <Input placeholder="Type your message..." value={newNote} onChange={e => setNewNote(e.target.value)} onKeyDown={e => e.key === "Enter" && sendNote()} />
              <Button size="icon" onClick={sendNote}><Send className="w-4 h-4" /></Button>
            </div>
          </div>
        </TabsContent>

        {/* Voting */}
        <TabsContent value="voting" className="space-y-4">
          <div className="bg-card border border-border/50 rounded-lg p-4 space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><Vote className="w-4 h-4" /> Weighted Voting System</h3>
            <p className="text-xs text-muted-foreground">Moderator: 1pt • Admin: 3pts • Owner: 5pts (Veto Power)</p>
            <div className="flex items-center gap-4 justify-center py-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-400">{votes.filter(v => v.vote === "no_ban").reduce((s: number, v: any) => s + v.vote_weight, 0)}</p>
                <p className="text-xs text-muted-foreground">No Ban</p>
              </div>
              <div className="text-center px-6 border-x border-border/30">
                <p className={`text-4xl font-bold ${voteTotal > 0 ? "text-red-400" : voteTotal < 0 ? "text-green-400" : "text-muted-foreground"}`}>{voteTotal > 0 ? `+${voteTotal}` : voteTotal}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-400">{votes.filter(v => v.vote === "ban").reduce((s: number, v: any) => s + v.vote_weight, 0)}</p>
                <p className="text-xs text-muted-foreground">Ban</p>
              </div>
            </div>
            {hasVeto && (
              <div className="bg-red-500/10 border border-red-500/30 rounded p-3 text-center">
                <p className="text-red-400 font-semibold">⚠️ OWNER VETO ACTIVE</p>
              </div>
            )}
            {!alreadyVoted ? (
              <div className="flex items-center gap-3 justify-center">
                <Select value={voteChoice} onValueChange={setVoteChoice}>
                  <SelectTrigger className="w-[200px]"><SelectValue placeholder="Cast your vote" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ban">🔴 Ban</SelectItem>
                    <SelectItem value="no_ban">🟢 No Ban</SelectItem>
                    <SelectItem value="warn">🟡 Warning Only</SelectItem>
                    <SelectItem value="7day">7-Day Ban</SelectItem>
                    <SelectItem value="30day">30-Day Ban</SelectItem>
                    <SelectItem value="permanent">Permanent Ban</SelectItem>
                    {isOwner && <SelectItem value="veto">⚡ Veto (Owner)</SelectItem>}
                  </SelectContent>
                </Select>
                <Button onClick={castVote} disabled={!voteChoice}>Vote ({voteWeight}pt)</Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center">You have already voted on this case.</p>
            )}
            <div className="space-y-2 mt-4">
              {votes.map((v: any, i: number) => (
                <div key={v.id} className="flex items-center justify-between text-sm bg-muted/20 rounded p-2">
                  <span>{isOwner ? v.voter_name : `Staff #${i + 1}`}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">{v.vote.replace("_", " ")}</Badge>
                    <span className="text-xs text-muted-foreground">{v.vote_weight}pt ({v.voter_role_type})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Statements */}
        <TabsContent value="statements" className="space-y-4">
          <div className="bg-card border border-border/50 rounded-lg p-4 space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><Eye className="w-4 h-4" /> Statement Cross-Linker & Inconsistency Detector</h3>
            <p className="text-xs text-muted-foreground">Record suspect statements given to different staff. The AI flags inconsistencies automatically.</p>
            
            <div className="space-y-3">
              <Textarea placeholder="Record suspect's statement..." value={newStatementText} onChange={e => setNewStatementText(e.target.value)} className="min-h-[100px]" />
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground shrink-0">Given to:</Label>
                <Input placeholder="Staff who received statement" value={newStatementGivenTo} onChange={e => setNewStatementGivenTo(e.target.value)} className="flex-1" />
                <Button size="sm" onClick={addStatement} disabled={!newStatementText.trim()}><Plus className="w-4 h-4 mr-1" /> Record</Button>
              </div>
            </div>

            {/* Inconsistency Detection */}
            {detectInconsistencies().length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-400 font-semibold mb-2">
                  <AlertTriangle className="w-5 h-5" /> ⚠️ STATEMENT INCONSISTENCIES DETECTED
                </div>
                {detectInconsistencies().map((issue, i) => (
                  <p key={i} className="text-sm text-red-300/80">• {issue}</p>
                ))}
              </div>
            )}

            {/* Side-by-side comparison */}
            {statements.length >= 2 && (
              <div className="border border-orange-500/20 rounded-lg p-4 bg-orange-500/5">
                <h4 className="text-sm font-semibold text-orange-400 mb-3">📊 Statement Comparison View</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {statements.map((st: any, i: number) => (
                    <div key={st.id} className="bg-background/60 rounded-lg p-3 border border-border/30">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                        <Badge variant="outline" className="text-[10px]">Statement #{i + 1}</Badge>
                        <span>To: {st.given_to_name || st.given_to}</span>
                      </div>
                      <p className="text-sm text-foreground/90 italic">"{st.statement}"</p>
                      <p className="text-xs text-muted-foreground/60 mt-2">{format(new Date(st.created_at), "PPp")}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Individual statements list */}
            <div className="space-y-2">
              {statements.map((st: any) => (
                <div key={st.id} className="bg-muted/20 rounded p-3 text-sm border-l-2 border-primary/30">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Given to: <span className="text-foreground">{st.given_to_name || st.given_to}</span></span>
                    <span>{format(new Date(st.created_at), "PPp")}</span>
                  </div>
                  <p className="text-foreground/90">"{st.statement}"</p>
                  {st.flagged_inconsistency && (
                    <Badge className="mt-2 bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">⚠️ Flagged</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Audit Log */}
        <TabsContent value="audit" className="space-y-4">
          <div className="bg-card border border-border/50 rounded-lg p-4">
            <h3 className="font-semibold flex items-center gap-2 mb-4"><History className="w-4 h-4" /> Chain of Custody</h3>
            {auditLog.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No audit entries yet</p>
            ) : (
              <div className="space-y-2">
                {auditLog.map((a: any) => (
                  <div key={a.id} className="flex items-start gap-3 text-sm border-l-2 border-primary/20 pl-3 py-1">
                    <div className="flex-1">
                      <p className="text-foreground">{a.action_description}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(a.created_at), "PPp")} • by {a.performed_by}</p>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">{a.action_type.replace(/_/g, " ")}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
