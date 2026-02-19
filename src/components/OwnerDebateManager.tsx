import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOwnerAuditLog } from "@/hooks/useOwnerAuditLog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Radio, Loader2, Send, Eye, Play, Square } from "lucide-react";
import { format } from "date-fns";

interface DebateData {
  id: string;
  title: string;
  description: string | null;
  topic: string;
  image_url: string | null;
  status: string;
  starts_at: string;
  ends_at: string;
  max_participants: number | null;
  created_at: string;
}

const OwnerDebateManager = () => {
  const { toast } = useToast();
  const { logAction } = useOwnerAuditLog();
  const [debates, setDebates] = useState<DebateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleteDebateId, setDeleteDebateId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topic, setTopic] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("100");

  const loadDebates = useCallback(async () => {
    const { data } = await supabase
      .from("debates")
      .select("*")
      .order("created_at", { ascending: false });
    setDebates(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadDebates(); }, [loadDebates]);

  const createDebate = async () => {
    if (!title.trim() || !topic.trim() || !startsAt || !endsAt) {
      toast({ title: "Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    setCreating(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase.from("debates").insert({
      title: title.trim(),
      description: description.trim() || null,
      topic: topic.trim(),
      image_url: imageUrl.trim() || null,
      status: "upcoming",
      starts_at: new Date(startsAt).toISOString(),
      ends_at: new Date(endsAt).toISOString(),
      max_participants: parseInt(maxParticipants) || 100,
      created_by: user?.id,
    }).select().single();

    if (error) {
      toast({ title: "Error", description: "Failed to create debate.", variant: "destructive" });
      setCreating(false);
      return;
    }

    // Send Discord notification
    try {
      await supabase.functions.invoke("send-debate-notification", {
        body: {
          debateId: data.id,
          title: title.trim(),
          description: description.trim(),
          topic: topic.trim(),
          startsAt: new Date(startsAt).toISOString(),
          imageUrl: imageUrl.trim() || null,
        },
      });
    } catch (err) {
      console.error("Failed to send Discord notification:", err);
    }

    await logAction({
      actionType: "debate_created",
      actionDescription: `Created debate: "${title}"`,
      targetTable: "debates",
      targetId: data.id,
    });

    toast({ title: "Debate Created!", description: "Debate has been created and Discord notification sent." });
    
    // Reset form
    setTitle(""); setDescription(""); setTopic(""); setImageUrl("");
    setStartsAt(""); setEndsAt(""); setMaxParticipants("100");
    setCreating(false);
    loadDebates();
  };

  const updateDebateStatus = async (debateId: string, status: string) => {
    const { error } = await supabase
      .from("debates")
      .update({ status })
      .eq("id", debateId);

    if (error) {
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
      return;
    }

    await logAction({
      actionType: "debate_status_change",
      actionDescription: `Changed debate status to "${status}"`,
      targetTable: "debates",
      targetId: debateId,
    });

    toast({ title: "Updated", description: `Debate is now ${status}.` });
    loadDebates();
  };

  const deleteDebate = async (debateId: string) => {
    const { error } = await supabase.from("debates").delete().eq("id", debateId);
    if (error) {
      toast({ title: "Error", description: "Failed to delete debate.", variant: "destructive" });
      return;
    }

    await logAction({
      actionType: "debate_deleted",
      actionDescription: "Deleted a debate",
      targetTable: "debates",
      targetId: debateId,
    });

    toast({ title: "Deleted", description: "Debate has been deleted." });
    setDeleteDebateId(null);
    loadDebates();
  };

  const deleteAllDebates = async () => {
    const { error: msgErr } = await supabase.from("debate_messages").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    const { error: partErr } = await supabase.from("debate_participants").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    const { error } = await supabase.from("debates").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) {
      toast({ title: "Error", description: "Failed to delete all debates.", variant: "destructive" });
      return;
    }

    await logAction({
      actionType: "debate_purge",
      actionDescription: "Purged all debate data",
    });

    toast({ title: "Purged", description: "All debate data has been deleted." });
    loadDebates();
  };

  return (
    <div className="space-y-6">
      {/* Create New Debate */}
      <Card className="glass-effect border-border/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Create New Debate</CardTitle>
          </div>
          <CardDescription>Set up a new debate topic for the community</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Mayor vs Chief Debate" />
            </div>
            <div className="space-y-2">
              <Label>Topic *</Label>
              <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., City Budget Allocation" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the debate..." />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Start Time *</Label>
              <Input type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Time *</Label>
              <Input type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Max Participants</Label>
              <Input type="number" value={maxParticipants} onChange={e => setMaxParticipants(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Image URL (optional)</Label>
            <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." />
            {imageUrl && (
              <img src={imageUrl} alt="Preview" className="w-32 h-20 object-cover rounded-lg border border-border/20" />
            )}
          </div>
          <Button onClick={createDebate} disabled={creating} className="w-full">
            {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Create Debate & Notify Discord
          </Button>
        </CardContent>
      </Card>

      {/* Manage Existing Debates */}
      <Card className="glass-effect border-border/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Manage Debates ({debates.length})</CardTitle>
            </div>
            {debates.length > 0 && (
              <Button variant="destructive" size="sm" onClick={deleteAllDebates}>
                <Trash2 className="w-4 h-4 mr-1" /> Purge All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : debates.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No debates created yet.</p>
          ) : (
            <div className="space-y-4">
              {debates.map(debate => (
                <div key={debate.id} className="p-4 rounded-lg border border-border/20 bg-muted/10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {debate.image_url && (
                        <img src={debate.image_url} alt="" className="w-16 h-16 rounded-lg object-cover" />
                      )}
                      <div>
                        <h4 className="font-bold">{debate.title}</h4>
                        <p className="text-sm text-muted-foreground">{debate.topic}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(debate.starts_at), "PPp")} → {format(new Date(debate.ends_at), "PPp")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        debate.status === "live" ? "default" :
                        debate.status === "upcoming" ? "secondary" : "outline"
                      }>
                        {debate.status}
                      </Badge>
                      {debate.status === "upcoming" && (
                        <Button size="sm" variant="outline" onClick={() => updateDebateStatus(debate.id, "live")}>
                          <Play className="w-3 h-3 mr-1" /> Go Live
                        </Button>
                      )}
                      {debate.status === "live" && (
                        <Button size="sm" variant="outline" onClick={() => updateDebateStatus(debate.id, "ended")}>
                          <Square className="w-3 h-3 mr-1" /> End
                        </Button>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => setDeleteDebateId(debate.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDebateId} onOpenChange={() => setDeleteDebateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Debate?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this debate and all its messages and participants.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteDebateId && deleteDebate(deleteDebateId)} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OwnerDebateManager;
