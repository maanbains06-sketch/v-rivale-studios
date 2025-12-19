import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, Plus, Save, X, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ROSTER_STATUS_OPTIONS, RosterPermission } from "@/hooks/useRoster";

interface RosterEntry {
  id: string;
  department: string;
  section: string;
  callsign: string | null;
  name: string;
  rank: string;
  status: string;
  department_logs: string | null;
  discord_id: string | null;
  sub_department: string | null;
  display_order: number;
}

interface RosterTableProps {
  entries: RosterEntry[];
  department: string;
  sections: string[];
  canEdit: boolean;
  permissions: RosterPermission[];
  onRefresh: () => void;
}

const statusColors: Record<string, string> = {
  "Active": "bg-green-500/20 text-green-400 border-green-500/30",
  "Inactive": "bg-red-500/20 text-red-400 border-red-500/30",
  "LOA": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "In Training": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Reserved Unit": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "No Data": "bg-muted/50 text-muted-foreground border-muted",
};

const sectionColors: Record<string, string> = {
  "High Command": "from-amber-900/60 to-amber-800/40 border-amber-500/30",
  "Command Staff": "from-orange-900/60 to-orange-800/40 border-orange-500/30",
  "Management": "from-violet-900/60 to-violet-800/40 border-violet-500/30",
  "Supervisors": "from-blue-900/60 to-blue-800/40 border-blue-500/30",
  "Senior Sector": "from-emerald-900/60 to-emerald-800/40 border-emerald-500/30",
  "Judges": "from-amber-900/60 to-amber-800/40 border-amber-500/30",
  "Attorneys": "from-emerald-900/60 to-emerald-800/40 border-emerald-500/30",
  "Captains": "from-orange-900/60 to-orange-800/40 border-orange-500/30",
  "Senior Mechanics": "from-cyan-900/60 to-cyan-800/40 border-cyan-500/30",
  "Sales Team": "from-pink-900/60 to-pink-800/40 border-pink-500/30",
  "Officers": "from-slate-800/60 to-slate-700/40 border-slate-500/30",
  "Paramedics": "from-teal-900/60 to-teal-800/40 border-teal-500/30",
  "EMTs": "from-cyan-900/60 to-cyan-800/40 border-cyan-500/30",
  "Firefighters": "from-red-900/60 to-red-800/40 border-red-500/30",
  "Mechanics": "from-gray-800/60 to-gray-700/40 border-gray-500/30",
};

const RosterTable = ({ entries, department, sections, canEdit, permissions, onRefresh }: RosterTableProps) => {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<RosterEntry>>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [addForm, setAddForm] = useState<Partial<RosterEntry>>({
    department,
    section: sections[0] || "General",
    status: "Active",
    department_logs: "0 Misconducts",
  });

  const startFieldEdit = (entry: RosterEntry, field: string) => {
    setEditingId(entry.id);
    setEditingField(field);
    setEditForm(entry);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingField(null);
    setEditForm({});
  };

  const saveFieldEdit = async (field: string, value: string) => {
    if (!editingId) return;

    try {
      const { error } = await supabase
        .from("department_rosters")
        .update({ [field]: value })
        .eq("id", editingId);

      if (error) throw error;

      toast({ title: "Updated successfully" });
      cancelEdit();
      onRefresh();
    } catch (error: any) {
      toast({ title: "Error updating", description: error.message, variant: "destructive" });
    }
  };

  const deleteEntry = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    try {
      const { error } = await supabase.from("department_rosters").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Entry deleted successfully" });
      onRefresh();
    } catch (error: any) {
      toast({ title: "Error deleting entry", description: error.message, variant: "destructive" });
    }
  };

  const addEntry = async () => {
    try {
      const { error } = await supabase.from("department_rosters").insert({
        department: addForm.department || department,
        section: addForm.section || "General",
        callsign: addForm.callsign,
        name: addForm.name,
        rank: addForm.rank,
        status: addForm.status || "Active",
        department_logs: addForm.department_logs || "0 Misconducts",
        discord_id: addForm.discord_id,
        sub_department: addForm.sub_department,
        display_order: entries.length + 1,
      });

      if (error) throw error;

      toast({ title: "Entry added successfully" });
      setIsAddDialogOpen(false);
      setAddForm({
        department,
        section: sections[0] || "General",
        status: "Active",
        department_logs: "0 Misconducts",
      });
      onRefresh();
    } catch (error: any) {
      toast({ title: "Error adding entry", description: error.message, variant: "destructive" });
    }
  };

  const groupedEntries = sections.map(section => ({
    section,
    entries: entries.filter(e => e.section === section),
  }));

  const EditableCell = ({ entry, field, value, type = "text" }: { entry: RosterEntry; field: string; value: string | null; type?: "text" | "status" | "section" }) => {
    const isEditing = editingId === entry.id && editingField === field;

    if (!canEdit) {
      if (type === "status") {
        return (
          <Badge className={`${statusColors[value || ""] || statusColors["No Data"]} border`}>
            {value || "N/A"}
          </Badge>
        );
      }
      return <span className={field === "callsign" || field === "discord_id" ? "font-mono text-muted-foreground" : ""}>{value || "-"}</span>;
    }

    if (isEditing) {
      if (type === "status") {
        return (
          <Select
            value={editForm[field as keyof RosterEntry] as string || ""}
            onValueChange={(v) => saveFieldEdit(field, v)}
          >
            <SelectTrigger className="h-8 w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROSTER_STATUS_OPTIONS.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }
      
      if (type === "section") {
        return (
          <Select
            value={editForm[field as keyof RosterEntry] as string || ""}
            onValueChange={(v) => saveFieldEdit(field, v)}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sections.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }

      return (
        <div className="flex gap-1 items-center">
          <Input
            value={editForm[field as keyof RosterEntry] as string || ""}
            onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })}
            className="h-7 w-full min-w-[60px]"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                saveFieldEdit(field, editForm[field as keyof RosterEntry] as string || "");
              } else if (e.key === "Escape") {
                cancelEdit();
              }
            }}
          />
          <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => saveFieldEdit(field, editForm[field as keyof RosterEntry] as string || "")}>
            <Save className="w-3 h-3 text-green-400" />
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={cancelEdit}>
            <X className="w-3 h-3 text-red-400" />
          </Button>
        </div>
      );
    }

    if (type === "status") {
      return (
        <div className="flex items-center gap-2 group">
          <Badge className={`${statusColors[value || ""] || statusColors["No Data"]} border`}>
            {value || "N/A"}
          </Badge>
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" 
            onClick={() => startFieldEdit(entry, field)}
          >
            <Pencil className="w-3 h-3" />
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 group">
        <span className={field === "callsign" || field === "discord_id" ? "font-mono text-muted-foreground text-sm" : field === "name" ? "font-medium" : ""}>
          {value || "-"}
        </span>
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" 
          onClick={() => startFieldEdit(entry, field)}
        >
          <Pencil className="w-3 h-3" />
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {canEdit && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {permissions.length > 0 && (
              <span>Editable by: {permissions.map(p => p.discord_role_name).join(", ")}</span>
            )}
          </div>
          <div className="flex gap-2">
            <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="w-4 h-4" />
                  Permissions
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Discord Role Permissions</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-sm text-muted-foreground">
                    These Discord roles can edit the {department.charAt(0).toUpperCase() + department.slice(1)} roster:
                  </p>
                  {permissions.length > 0 ? (
                    <ul className="space-y-2">
                      {permissions.map((perm) => (
                        <li key={perm.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                          <span>{perm.discord_role_name}</span>
                          <code className="text-xs text-muted-foreground">{perm.discord_role_id}</code>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No specific roles configured. Only admins can edit.</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Contact an administrator to manage Discord role permissions.
                  </p>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Roster Member</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Callsign</Label>
                      <Input
                        value={addForm.callsign || ""}
                        onChange={(e) => setAddForm({ ...addForm, callsign: e.target.value })}
                        placeholder="e.g., PD-101"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Section</Label>
                      <Select
                        value={addForm.section}
                        onValueChange={(v) => setAddForm({ ...addForm, section: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {sections.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={addForm.name || ""}
                      onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                      placeholder="Full Name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rank *</Label>
                    <Input
                      value={addForm.rank || ""}
                      onChange={(e) => setAddForm({ ...addForm, rank: e.target.value })}
                      placeholder="e.g., Officer, Sergeant"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={addForm.status}
                        onValueChange={(v) => setAddForm({ ...addForm, status: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROSTER_STATUS_OPTIONS.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Sub-Department</Label>
                      <Input
                        value={addForm.sub_department || ""}
                        onChange={(e) => setAddForm({ ...addForm, sub_department: e.target.value })}
                        placeholder="e.g., SWAT, K9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Discord ID</Label>
                    <Input
                      value={addForm.discord_id || ""}
                      onChange={(e) => setAddForm({ ...addForm, discord_id: e.target.value })}
                      placeholder="Discord ID"
                    />
                  </div>
                  <Button onClick={addEntry} className="w-full" disabled={!addForm.name || !addForm.rank}>
                    Add Member
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}

      {groupedEntries.map(({ section, entries: sectionEntries }) => (
        sectionEntries.length > 0 && (
          <div key={section} className="space-y-2">
            <div className={`px-4 py-2 rounded-t-lg bg-gradient-to-r ${sectionColors[section] || "from-muted/60 to-muted/40 border-border/30"} border-b`}>
              <h3 className="font-semibold text-foreground">{section}</h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30 hover:bg-transparent">
                    <TableHead className="w-24">Callsign</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Rank</TableHead>
                    <TableHead className="w-36">Status</TableHead>
                    <TableHead>Dept. Logs</TableHead>
                    <TableHead>Discord ID</TableHead>
                    <TableHead>Sub-Dept</TableHead>
                    {canEdit && <TableHead className="w-16">Delete</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sectionEntries.map((entry) => (
                    <TableRow key={entry.id} className="border-border/20 hover:bg-muted/30">
                      <TableCell>
                        <EditableCell entry={entry} field="callsign" value={entry.callsign} />
                      </TableCell>
                      <TableCell>
                        <EditableCell entry={entry} field="name" value={entry.name} />
                      </TableCell>
                      <TableCell>
                        <EditableCell entry={entry} field="rank" value={entry.rank} />
                      </TableCell>
                      <TableCell>
                        <EditableCell entry={entry} field="status" value={entry.status} type="status" />
                      </TableCell>
                      <TableCell>
                        <EditableCell entry={entry} field="department_logs" value={entry.department_logs} />
                      </TableCell>
                      <TableCell>
                        <EditableCell entry={entry} field="discord_id" value={entry.discord_id} />
                      </TableCell>
                      <TableCell>
                        <EditableCell entry={entry} field="sub_department" value={entry.sub_department} />
                      </TableCell>
                      {canEdit && (
                        <TableCell>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteEntry(entry.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )
      ))}

      {entries.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No roster entries for this department yet.</p>
          {canEdit && <p className="text-sm mt-2">Click "Add Member" to add the first entry.</p>}
        </div>
      )}
    </div>
  );
};

export default RosterTable;
