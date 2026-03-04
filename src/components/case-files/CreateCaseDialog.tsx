import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

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
  "Bug Abuse", "ERP", "Stream Sniping"
];

export const CreateCaseDialog = ({ open, onOpenChange, userDiscordId, userId, discordUsername, onCreated }: CreateCaseDialogProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    case_origin: "staff_observation",
    priority_impact: "medium",
    priority_urgency: "medium",
    severity: "minor",
    suspect_name: "",
    suspect_discord_id: "",
    suspect_steam_id: "",
    suspect_hex_id: "",
    rules_violated: [] as string[],
    resolution_notes: "",
  });

  const handleSubmit = async () => {
    if (!form.suspect_name && !form.suspect_discord_id) {
      toast({ title: "Please provide suspect name or Discord ID", variant: "destructive" });
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
        suspect_discord_id: form.suspect_discord_id || null,
        suspect_steam_id: form.suspect_steam_id || null,
        suspect_hex_id: form.suspect_hex_id || null,
        rules_violated: form.rules_violated,
        created_by: userDiscordId || "unknown",
        created_by_user_id: userId || undefined,
      }).select().single();

      if (error) throw error;

      // Log audit
      await supabase.from("case_file_audit_log").insert({
        case_id: data.id,
        action_type: "created",
        action_description: `Case ${data.case_ref} created by ${discordUsername || userDiscordId}`,
        performed_by: userDiscordId || "unknown",
        performed_by_user_id: userId || undefined,
      });

      toast({ title: `Case ${data.case_ref} created successfully` });
      setForm({
        case_origin: "staff_observation",
        priority_impact: "medium",
        priority_urgency: "medium",
        severity: "minor",
        suspect_name: "",
        suspect_discord_id: "",
        suspect_steam_id: "",
        suspect_hex_id: "",
        rules_violated: [],
        resolution_notes: "",
      });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Case File</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Origin & Severity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Case Origin</Label>
              <Select value={form.case_origin} onValueChange={v => setForm(p => ({ ...p, case_origin: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_game_report">In-game /report</SelectItem>
                  <SelectItem value="discord_ticket">Discord Ticket</SelectItem>
                  <SelectItem value="staff_observation">Staff Observation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Severity</Label>
              <Select value={form.severity} onValueChange={v => setForm(p => ({ ...p, severity: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="minor">🟢 Minor</SelectItem>
                  <SelectItem value="serious">🟡 Serious</SelectItem>
                  <SelectItem value="critical">🔴 Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Priority Matrix */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Impact Level</Label>
              <Select value={form.priority_impact} onValueChange={v => setForm(p => ({ ...p, priority_impact: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Impact</SelectItem>
                  <SelectItem value="medium">Medium Impact</SelectItem>
                  <SelectItem value="high">High Impact</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Urgency Level</Label>
              <Select value={form.priority_urgency} onValueChange={v => setForm(p => ({ ...p, priority_urgency: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Urgency</SelectItem>
                  <SelectItem value="medium">Medium Urgency</SelectItem>
                  <SelectItem value="high">High Urgency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Suspect Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Suspect Name (IC/OOC)</Label>
              <Input value={form.suspect_name} onChange={e => setForm(p => ({ ...p, suspect_name: e.target.value }))} placeholder="Player name" />
            </div>
            <div>
              <Label>Suspect Discord ID</Label>
              <Input value={form.suspect_discord_id} onChange={e => setForm(p => ({ ...p, suspect_discord_id: e.target.value }))} placeholder="e.g. 123456789012345678" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Steam ID</Label>
              <Input value={form.suspect_steam_id} onChange={e => setForm(p => ({ ...p, suspect_steam_id: e.target.value }))} placeholder="Steam ID" />
            </div>
            <div>
              <Label>Hex ID</Label>
              <Input value={form.suspect_hex_id} onChange={e => setForm(p => ({ ...p, suspect_hex_id: e.target.value }))} placeholder="Hex ID" />
            </div>
          </div>

          {/* Rules Violated */}
          <div>
            <Label>Rules Violated</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {RULES.map(rule => (
                <button
                  key={rule}
                  type="button"
                  onClick={() => toggleRule(rule)}
                  className={`px-3 py-1 text-xs rounded-full border transition-all ${
                    form.rules_violated.includes(rule)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {rule}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={saving} className="w-full">
            {saving ? "Creating..." : "Create Case File"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
