import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, Plus, X, Shield, Gavel, FileVideo, Users, AlertTriangle } from "lucide-react";
import { EvidenceUploader } from "./EvidenceUploader";

interface CreateCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userDiscordId: string | null;
  userId: string | null;
  discordUsername: string | null;
  onCreated: () => void;
}

const RULES = [
  "RDM", "VDM", "Fail RP", "Combat Logging", "Meta Gaming",
  "Power Gaming", "Exploiting", "Hacking", "Staff Disrespect",
  "OOC Toxicity", "NLR Violation", "Fear RP", "Cop Baiting",
  "Bug Abuse", "ERP", "Stream Sniping", "Deathmatching",
  "Money Glitching", "Car Surfing", "Unrealistic Driving",
  "Third Party Comms", "Breaking Character", "Spam", "Advertising",
  "Impersonation", "Griefing", "FailDrive", "Gang Rule Violation",
  "Corruption Abuse", "Job Abuse"
];

const BEHAVIORAL_TAGS = ["Aggressive", "Cooperative", "Rule Lawyer", "Troll", "Evasive", "Remorseful", "Repeat Offender", "New Player"];

interface EvidenceItem {
  type: string;
  url: string;
  description: string;
}

export const CreateCaseDialog = ({ open, onOpenChange, userDiscordId, userId, discordUsername, onCreated }: CreateCaseDialogProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState(1);
  const [form, setForm] = useState({
    case_origin: "staff_observation",
    priority_impact: "medium",
    priority_urgency: "medium",
    severity: "minor",
    suspect_name: "",
    suspect_in_game_name: "",
    suspect_discord_id: "",
    suspect_steam_id: "",
    suspect_fivem_id: "",
    rules_violated: [] as string[],
    behavioral_tags: [] as string[],
    resolution_notes: "",
    narrative_summary: "",
  });
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [newEvidence, setNewEvidence] = useState<EvidenceItem>({ type: "screenshot", url: "", description: "" });
  const [suspectDiscordProfile, setSuspectDiscordProfile] = useState<any>(null);
  const [fetchingProfile, setFetchingProfile] = useState(false);

  const fetchSuspectProfile = async (discordId: string) => {
    if (!discordId || !/^\d{17,19}$/.test(discordId)) return;
    setFetchingProfile(true);
    try {
      const { data } = await supabase.functions.invoke('fetch-discord-user', {
        body: { discordId }
      });
      if (data) {
        setSuspectDiscordProfile(data);
        if (data.username && !form.suspect_name) {
          setForm(p => ({ ...p, suspect_name: data.username }));
        }
      }
    } catch { /* ignore */ }
    setFetchingProfile(false);
  };

  const addEvidence = () => {
    if (!newEvidence.url.trim()) return;
    setEvidenceList(prev => [...prev, { ...newEvidence }]);
    setNewEvidence({ type: "screenshot", url: "", description: "" });
  };

  const removeEvidence = (idx: number) => {
    setEvidenceList(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!form.suspect_name && !form.suspect_discord_id && !form.suspect_in_game_name) {
      toast({ title: "Please provide suspect name, in-game name, or Discord ID", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase.from("case_files").insert({
        case_ref: "",
        case_origin: form.case_origin,
        priority_impact: form.priority_impact,
        priority_urgency: form.priority_urgency,
        severity: form.severity,
        suspect_name: form.suspect_name || null,
        suspect_in_game_name: form.suspect_in_game_name || null,
        suspect_discord_id: form.suspect_discord_id || null,
        suspect_steam_id: form.suspect_steam_id || null,
        suspect_fivem_id: form.suspect_fivem_id || null,
        suspect_hex_id: null,
        rules_violated: form.rules_violated,
        behavioral_tags: form.behavioral_tags,
        created_by: userDiscordId || "unknown",
        created_by_user_id: userId || undefined,
        resolution_notes: form.narrative_summary || null,
      } as any).select().single();

      if (error) throw error;

      // Add evidence items
      if (evidenceList.length > 0) {
        const evidenceInserts = evidenceList.map(ev => ({
          case_id: data.id,
          evidence_type: ev.type,
          file_url: ev.url,
          description: ev.description || null,
          uploaded_by: userDiscordId || "unknown",
          uploaded_by_user_id: userId || undefined,
        }));
        await supabase.from("case_file_evidence").insert(evidenceInserts);
      }

      // Log audit
      await supabase.from("case_file_audit_log").insert({
        case_id: data.id,
        action_type: "created",
        action_description: `Case ${data.case_ref} created by ${discordUsername || userDiscordId} with ${evidenceList.length} evidence items`,
        performed_by: userDiscordId || "unknown",
        performed_by_user_id: userId || undefined,
      });

      // Update player_status_records
      if (form.suspect_discord_id && /^\d{17,19}$/.test(form.suspect_discord_id)) {
        await supabase.from("player_status_records" as any).upsert({
          discord_id: form.suspect_discord_id,
          discord_username: suspectDiscordProfile?.username || form.suspect_name || null,
          discord_avatar: suspectDiscordProfile?.avatar || null,
          total_cases: 1,
          last_case_date: new Date().toISOString(),
        }, { onConflict: 'discord_id' });
      }

      toast({ title: `Case ${data.case_ref} created successfully with ${evidenceList.length} evidence items` });
      // Reset
      setForm({
        case_origin: "staff_observation",
        priority_impact: "medium",
        priority_urgency: "medium",
        severity: "minor",
        suspect_name: "",
        suspect_in_game_name: "",
        suspect_discord_id: "",
        suspect_steam_id: "",
        suspect_fivem_id: "",
        rules_violated: [],
        behavioral_tags: [],
        resolution_notes: "",
        narrative_summary: "",
      });
      setEvidenceList([]);
      setSuspectDiscordProfile(null);
      setActiveSection(1);
      onCreated();
    } catch (err: any) {
      toast({ title: "Failed to create case", description: err?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleRule = (rule: string) => {
    setForm(prev => ({
      ...prev,
      rules_violated: prev.rules_violated.includes(rule)
        ? prev.rules_violated.filter(r => r !== rule)
        : [...prev.rules_violated, rule]
    }));
  };

  const toggleTag = (tag: string) => {
    setForm(prev => ({
      ...prev,
      behavioral_tags: prev.behavioral_tags.includes(tag)
        ? prev.behavioral_tags.filter(t => t !== tag)
        : [...prev.behavioral_tags, tag]
    }));
  };

  const priorityLabel = `${form.priority_impact}/${form.priority_urgency}`;

  const sections = [
    { num: 1, label: "Case Classification", icon: Shield },
    { num: 2, label: "Suspect Profile", icon: Users },
    { num: 3, label: "Evidence & Incident", icon: FileVideo },
    { num: 4, label: "Rules & Verdict", icon: Gavel },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden p-0 bg-background/95 backdrop-blur-xl border-primary/20">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border-b border-primary/20 p-6">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ccircle%20cx%3D%221%22%20cy%3D%221%22%20r%3D%220.5%22%20fill%3D%22rgba(255%2C255%2C255%2C0.05)%22%2F%3E%3C%2Fsvg%3E')] opacity-50" />
          <div className="relative">
            <p className="text-xs text-primary/60 uppercase tracking-widest mb-1">Create New Staff Case File</p>
            <h2 className="text-2xl font-bold text-foreground">CREATE NEW CASE FILE</h2>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="flex border-b border-border/30 bg-muted/10">
          {sections.map(s => (
            <button
              key={s.num}
              onClick={() => setActiveSection(s.num)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-all border-b-2 ${
                activeSection === s.num
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20"
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                activeSection === s.num ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {s.num}
              </div>
              <span className="hidden md:inline">{s.label}</span>
            </button>
          ))}
        </div>

        <div className="overflow-y-auto max-h-[calc(95vh-200px)] p-6">
          {/* Section 1: Case Classification */}
          {activeSection === 1 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Case Origin</Label>
                  <Select value={form.case_origin} onValueChange={v => setForm(p => ({ ...p, case_origin: v }))}>
                    <SelectTrigger className="bg-muted/30 border-border/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_game_report">🎮 In-Game Report</SelectItem>
                      <SelectItem value="discord_ticket">💬 Discord Ticket</SelectItem>
                      <SelectItem value="staff_observation">👁️ Staff Observation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Severity Level</Label>
                  <Select value={form.severity} onValueChange={v => setForm(p => ({ ...p, severity: v }))}>
                    <SelectTrigger className="bg-muted/30 border-border/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minor">🟢 Minor (Warning Level)</SelectItem>
                      <SelectItem value="serious">🟡 Serious (Ban Consideration)</SelectItem>
                      <SelectItem value="critical">🔴 Critical (Immediate Action)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Priority Matrix */}
              <div className="space-y-3">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Priority Matrix</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Impact Level</p>
                    <div className="flex gap-2">
                      {["low", "medium", "high"].map(v => (
                        <button
                          key={v}
                          onClick={() => setForm(p => ({ ...p, priority_impact: v }))}
                          className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                            form.priority_impact === v
                              ? v === "high" ? "bg-red-500/20 text-red-400 border-red-500/40" 
                                : v === "medium" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/40"
                                : "bg-green-500/20 text-green-400 border-green-500/40"
                              : "bg-muted/20 text-muted-foreground border-border/30 hover:border-primary/30"
                          }`}
                        >
                          {v.charAt(0).toUpperCase() + v.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Urgency Level</p>
                    <div className="flex gap-2">
                      {["low", "medium", "high"].map(v => (
                        <button
                          key={v}
                          onClick={() => setForm(p => ({ ...p, priority_urgency: v }))}
                          className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                            form.priority_urgency === v
                              ? v === "high" ? "bg-red-500/20 text-red-400 border-red-500/40" 
                                : v === "medium" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/40"
                                : "bg-green-500/20 text-green-400 border-green-500/40"
                              : "bg-muted/20 text-muted-foreground border-border/30 hover:border-primary/30"
                          }`}
                        >
                          {v.charAt(0).toUpperCase() + v.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 font-mono">
                    Priority: {priorityLabel.charAt(0).toUpperCase() + priorityLabel.slice(1)}
                  </Badge>
                </div>
              </div>

              {/* Narrative Summary */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Narrative Summary</Label>
                <Textarea 
                  value={form.narrative_summary} 
                  onChange={e => setForm(p => ({ ...p, narrative_summary: e.target.value }))} 
                  placeholder="Describe the incident in detail..." 
                  className="min-h-[100px] bg-muted/30 border-border/50"
                />
              </div>
            </div>
          )}

          {/* Section 2: Suspect & Offender Profile */}
          {activeSection === 2 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Discord Profile */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-primary flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Discord Identity
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Discord ID</Label>
                      <div className="flex gap-2">
                        <Input 
                          value={form.suspect_discord_id} 
                          onChange={e => setForm(p => ({ ...p, suspect_discord_id: e.target.value }))} 
                          placeholder="e.g. 123456789012345678"
                          className="bg-muted/30 border-border/50"
                          onBlur={() => fetchSuspectProfile(form.suspect_discord_id)}
                        />
                        <Button 
                          variant="outline" size="sm" 
                          onClick={() => fetchSuspectProfile(form.suspect_discord_id)}
                          disabled={fetchingProfile}
                          className="shrink-0"
                        >
                          {fetchingProfile ? "..." : "Fetch"}
                        </Button>
                      </div>
                    </div>

                    {/* Fetched Profile Card */}
                    {suspectDiscordProfile && (
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center gap-3">
                        {suspectDiscordProfile.avatar && (
                          <img src={suspectDiscordProfile.avatar} alt="" className="w-10 h-10 rounded-full border border-primary/30" />
                        )}
                        <div>
                          <p className="font-semibold text-sm text-foreground">{suspectDiscordProfile.displayName || suspectDiscordProfile.username}</p>
                          <p className="text-xs text-muted-foreground">@{suspectDiscordProfile.username}</p>
                        </div>
                        <Badge className="ml-auto bg-green-500/20 text-green-400 border-green-500/30 text-xs">Verified</Badge>
                      </div>
                    )}

                    <div>
                      <Label className="text-xs text-muted-foreground">Discord Username (Auto-filled)</Label>
                      <Input 
                        value={form.suspect_name} 
                        onChange={e => setForm(p => ({ ...p, suspect_name: e.target.value }))} 
                        placeholder="Discord username"
                        className="bg-muted/30 border-border/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Game Identity */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-primary flex items-center gap-2">
                    <Users className="w-4 h-4" /> In-Game Identity
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">In-Game Name (IC)</Label>
                      <Input 
                        value={form.suspect_in_game_name} 
                        onChange={e => setForm(p => ({ ...p, suspect_in_game_name: e.target.value }))} 
                        placeholder="Character name in-game"
                        className="bg-muted/30 border-border/50"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Steam ID</Label>
                      <Input 
                        value={form.suspect_steam_id} 
                        onChange={e => setForm(p => ({ ...p, suspect_steam_id: e.target.value }))} 
                        placeholder="Steam ID"
                        className="bg-muted/30 border-border/50"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">FiveM ID</Label>
                      <Input 
                        value={form.suspect_fivem_id} 
                        onChange={e => setForm(p => ({ ...p, suspect_fivem_id: e.target.value }))} 
                        placeholder="FiveM Identifier"
                        className="bg-muted/30 border-border/50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Behavioral Tags */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Behavioral Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {BEHAVIORAL_TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                        form.behavioral_tags.includes(tag)
                          ? "bg-accent text-accent-foreground border-accent"
                          : "bg-muted/30 text-muted-foreground border-border/50 hover:border-accent/50"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Evidence & Incident */}
          {activeSection === 3 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-primary flex items-center gap-2">
                <FileVideo className="w-4 h-4" /> Evidence Upload
              </h3>

              {/* Add Evidence Form */}
              <div className="bg-muted/10 border border-border/30 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Select value={newEvidence.type} onValueChange={v => setNewEvidence(p => ({ ...p, type: v }))}>
                    <SelectTrigger className="bg-muted/30"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="screenshot">📸 Screenshot</SelectItem>
                      <SelectItem value="video">🎥 Video</SelectItem>
                      <SelectItem value="document">📄 Document</SelectItem>
                      <SelectItem value="log">📋 Server Log</SelectItem>
                      <SelectItem value="audio">🔊 Audio</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input 
                    placeholder="URL (YouTube, Imgur, etc.)" 
                    value={newEvidence.url} 
                    onChange={e => setNewEvidence(p => ({ ...p, url: e.target.value }))}
                    className="md:col-span-2 bg-muted/30"
                  />
                  <Input 
                    placeholder="Description" 
                    value={newEvidence.description} 
                    onChange={e => setNewEvidence(p => ({ ...p, description: e.target.value }))}
                    className="bg-muted/30"
                  />
                </div>
                <Button size="sm" onClick={addEvidence} disabled={!newEvidence.url.trim()} variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" /> Add Evidence
                </Button>
              </div>

              {/* Evidence List */}
              {evidenceList.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {evidenceList.map((ev, idx) => (
                    <div key={idx} className="bg-card border border-border/40 rounded-lg p-3 flex items-start gap-3 group">
                      <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                        {ev.type === "video" ? "🎥" : ev.type === "screenshot" ? "📸" : ev.type === "audio" ? "🔊" : "📄"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{ev.url}</p>
                        {ev.description && <p className="text-xs text-muted-foreground">{ev.description}</p>}
                        <Badge variant="outline" className="text-[10px] mt-1 capitalize">{ev.type}</Badge>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeEvidence(idx)} className="opacity-0 group-hover:opacity-100">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {evidenceList.length === 0 && (
                <div className="text-center py-12 text-muted-foreground border border-dashed border-border/40 rounded-lg">
                  <Upload className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No evidence added yet</p>
                  <p className="text-xs mt-1">Add URLs to screenshots, videos, or documents</p>
                </div>
              )}
            </div>
          )}

          {/* Section 4: Rules & Final */}
          {activeSection === 4 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="space-y-3">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Rules Violated (Select All That Apply)</Label>
                <div className="flex flex-wrap gap-2">
                  {RULES.map(rule => (
                    <button
                      key={rule}
                      type="button"
                      onClick={() => toggleRule(rule)}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                        form.rules_violated.includes(rule)
                          ? "bg-destructive/20 text-destructive border-destructive/40 shadow-sm shadow-destructive/20"
                          : "bg-muted/30 text-muted-foreground border-border/50 hover:border-destructive/30"
                      }`}
                    >
                      {rule}
                    </button>
                  ))}
                </div>
                {form.rules_violated.length > 0 && (
                  <p className="text-xs text-muted-foreground">{form.rules_violated.length} rule(s) selected</p>
                )}
              </div>

              {/* Summary Preview */}
              <div className="bg-muted/10 border border-border/30 rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Case Summary Preview</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><span className="text-muted-foreground">Origin:</span> {form.case_origin.replace(/_/g, ' ')}</div>
                  <div><span className="text-muted-foreground">Severity:</span> {form.severity}</div>
                  <div><span className="text-muted-foreground">Priority:</span> {priorityLabel}</div>
                  <div><span className="text-muted-foreground">Evidence:</span> {evidenceList.length} item(s)</div>
                  <div><span className="text-muted-foreground">Suspect:</span> {form.suspect_name || form.suspect_in_game_name || 'N/A'}</div>
                  <div><span className="text-muted-foreground">Rules:</span> {form.rules_violated.length} violation(s)</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/30 p-4 flex items-center justify-between bg-muted/5">
          <div className="flex gap-2">
            {activeSection > 1 && (
              <Button variant="outline" onClick={() => setActiveSection(p => p - 1)}>← Previous</Button>
            )}
          </div>
          <div className="flex gap-2">
            {activeSection < 4 ? (
              <Button onClick={() => setActiveSection(p => p + 1)} className="gap-2">
                Next →
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={saving} className="gap-2 bg-primary hover:bg-primary/90 min-w-[180px]">
                {saving ? "Creating..." : "✍️ Create Case File"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
