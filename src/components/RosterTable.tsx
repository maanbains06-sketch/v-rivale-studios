import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2, Plus, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
};

const RosterTable = ({ entries, department, sections, canEdit, onRefresh }: RosterTableProps) => {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<RosterEntry>>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addForm, setAddForm] = useState<Partial<RosterEntry>>({
    department,
    section: sections[0] || "General",
    status: "Active",
    department_logs: "0 Misconducts",
  });

  const startEdit = (entry: RosterEntry) => {
    setEditingId(entry.id);
    setEditForm(entry);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editingId) return;

    try {
      const { error } = await supabase
        .from("department_rosters")
        .update({
          callsign: editForm.callsign,
          name: editForm.name,
          rank: editForm.rank,
          status: editForm.status,
          department_logs: editForm.department_logs,
          discord_id: editForm.discord_id,
          sub_department: editForm.sub_department,
          section: editForm.section,
        })
        .eq("id", editingId);

      if (error) throw error;

      toast({ title: "Entry updated successfully" });
      setEditingId(null);
      setEditForm({});
      onRefresh();
    } catch (error: any) {
      toast({ title: "Error updating entry", description: error.message, variant: "destructive" });
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

  return (
    <div className="space-y-6">
      {canEdit && (
        <div className="flex justify-end">
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
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                        <SelectItem value="LOA">LOA</SelectItem>
                        <SelectItem value="In Training">In Training</SelectItem>
                        <SelectItem value="Reserved Unit">Reserved Unit</SelectItem>
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
                    <TableHead className="w-32">Status</TableHead>
                    <TableHead>Dept. Logs</TableHead>
                    <TableHead>Discord ID</TableHead>
                    <TableHead>Sub-Dept</TableHead>
                    {canEdit && <TableHead className="w-24">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sectionEntries.map((entry) => (
                    <TableRow key={entry.id} className="border-border/20 hover:bg-muted/30">
                      {editingId === entry.id ? (
                        <>
                          <TableCell>
                            <Input
                              value={editForm.callsign || ""}
                              onChange={(e) => setEditForm({ ...editForm, callsign: e.target.value })}
                              className="h-8 w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={editForm.name || ""}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={editForm.rank || ""}
                              onChange={(e) => setEditForm({ ...editForm, rank: e.target.value })}
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={editForm.status}
                              onValueChange={(v) => setEditForm({ ...editForm, status: v })}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Inactive">Inactive</SelectItem>
                                <SelectItem value="LOA">LOA</SelectItem>
                                <SelectItem value="In Training">In Training</SelectItem>
                                <SelectItem value="Reserved Unit">Reserved Unit</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={editForm.department_logs || ""}
                              onChange={(e) => setEditForm({ ...editForm, department_logs: e.target.value })}
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={editForm.discord_id || ""}
                              onChange={(e) => setEditForm({ ...editForm, discord_id: e.target.value })}
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={editForm.sub_department || ""}
                              onChange={(e) => setEditForm({ ...editForm, sub_department: e.target.value })}
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveEdit}>
                                <Save className="w-3.5 h-3.5 text-green-400" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEdit}>
                                <X className="w-3.5 h-3.5 text-red-400" />
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="font-mono text-muted-foreground">
                            {entry.callsign || "-"}
                          </TableCell>
                          <TableCell className="font-medium">{entry.name}</TableCell>
                          <TableCell>{entry.rank}</TableCell>
                          <TableCell>
                            <Badge className={`${statusColors[entry.status] || statusColors["No Data"]} border`}>
                              {entry.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {entry.department_logs || "0 Misconducts"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm font-mono">
                            {entry.discord_id || "-"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {entry.sub_department || "None"}
                          </TableCell>
                          {canEdit && (
                            <TableCell>
                              <div className="flex gap-1">
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(entry)}>
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteEntry(entry.id)}>
                                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </>
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
