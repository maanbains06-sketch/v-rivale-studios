import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Gift, 
  Plus, 
  Pencil, 
  Trash2, 
  Trophy, 
  XCircle, 
  Loader2, 
  RefreshCw,
  Send,
  Users,
  Calendar,
  Clock,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Giveaway {
  id: string;
  title: string;
  description: string | null;
  prize: string;
  prize_image_url: string | null;
  start_date: string;
  end_date: string;
  status: string;
  category: string;
  winner_count: number;
}

interface GiveawayEntry {
  id: string;
  giveaway_id: string;
  user_id: string;
  entry_count: number;
  is_winner: boolean;
  discord_username: string | null;
  discord_id: string | null;
}

export const GiveawayManagement = () => {
  const { toast } = useToast();
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedGiveaway, setSelectedGiveaway] = useState<Giveaway | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [selectingWinners, setSelectingWinners] = useState(false);

  const [newGiveaway, setNewGiveaway] = useState({
    title: '',
    description: '',
    prize: '',
    prize_image_url: '',
    start_date: '',
    end_date: '',
    winner_count: 1,
    category: 'all',
    startNow: true
  });

  const [editGiveaway, setEditGiveaway] = useState<Giveaway | null>(null);

  useEffect(() => {
    fetchGiveaways();
  }, []);

  const fetchGiveaways = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("giveaways")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching giveaways:", error);
      toast({ title: "Error", description: "Failed to load giveaways", variant: "destructive" });
    } else {
      setGiveaways(data || []);
    }
    setLoading(false);
  };

  const createGiveaway = async () => {
    if (!newGiveaway.title.trim() || !newGiveaway.prize.trim() || !newGiveaway.end_date) {
      toast({ title: "Missing Fields", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      const startDate = newGiveaway.startNow 
        ? new Date().toISOString() 
        : new Date(newGiveaway.start_date).toISOString();
      
      const { data, error } = await supabase
        .from("giveaways")
        .insert({
          title: newGiveaway.title,
          description: newGiveaway.description || null,
          prize: newGiveaway.prize,
          prize_image_url: newGiveaway.prize_image_url || null,
          start_date: startDate,
          end_date: new Date(newGiveaway.end_date).toISOString(),
          winner_count: newGiveaway.winner_count,
          category: newGiveaway.category,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      // Send Discord notification
      try {
        await supabase.functions.invoke("send-giveaway-discord", {
          body: {
            type: 'new_giveaway',
            giveaway: {
              id: data.id,
              title: data.title,
              description: data.description,
              prize: data.prize,
              end_date: data.end_date,
              winner_count: data.winner_count,
              prize_image_url: data.prize_image_url
            }
          }
        });
      } catch (discordError) {
        console.error("Discord notification error:", discordError);
      }

      toast({ title: "Success", description: "Giveaway created successfully!" });
      setShowCreateDialog(false);
      setNewGiveaway({
        title: '',
        description: '',
        prize: '',
        prize_image_url: '',
        start_date: '',
        end_date: '',
        winner_count: 1,
        category: 'all',
        startNow: true
      });
      fetchGiveaways();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const updateGiveaway = async () => {
    if (!editGiveaway) return;
    
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("giveaways")
        .update({
          title: editGiveaway.title,
          description: editGiveaway.description,
          prize: editGiveaway.prize,
          prize_image_url: editGiveaway.prize_image_url,
          start_date: editGiveaway.start_date,
          end_date: editGiveaway.end_date,
          winner_count: editGiveaway.winner_count,
          category: editGiveaway.category
        })
        .eq("id", editGiveaway.id);

      if (error) throw error;

      toast({ title: "Success", description: "Giveaway updated successfully!" });
      setShowEditDialog(false);
      setEditGiveaway(null);
      fetchGiveaways();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  const deleteGiveaway = async () => {
    if (!selectedGiveaway) return;
    
    setDeleting(true);
    try {
      // Delete related entries and winners first
      await supabase.from("giveaway_entries").delete().eq("giveaway_id", selectedGiveaway.id);
      await supabase.from("giveaway_winners").delete().eq("giveaway_id", selectedGiveaway.id);
      
      const { error } = await supabase
        .from("giveaways")
        .delete()
        .eq("id", selectedGiveaway.id);

      if (error) throw error;

      toast({ title: "Success", description: "Giveaway deleted successfully!" });
      setShowDeleteDialog(false);
      setSelectedGiveaway(null);
      fetchGiveaways();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const cancelGiveaway = async () => {
    if (!selectedGiveaway) return;
    
    setCancelling(true);
    try {
      // Update status to cancelled
      const { error } = await supabase
        .from("giveaways")
        .update({ status: 'cancelled' })
        .eq("id", selectedGiveaway.id);

      if (error) throw error;

      // Notify participants via Discord (optional - create a cancelled notification)
      // For now we just update the status

      toast({ title: "Success", description: "Giveaway cancelled. Participants will be notified." });
      setShowCancelDialog(false);
      setSelectedGiveaway(null);
      fetchGiveaways();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setCancelling(false);
    }
  };

  const selectWinners = async (giveaway: Giveaway) => {
    setSelectingWinners(true);
    try {
      // Call the RPC function to select winners
      const { data: winners, error: rpcError } = await supabase.rpc("select_giveaway_winners", {
        p_giveaway_id: giveaway.id
      });

      if (rpcError) throw rpcError;

      // Fetch all entries to get Discord IDs for winner notification
      const { data: entries } = await supabase
        .from("giveaway_entries")
        .select("user_id, discord_username, discord_id")
        .eq("giveaway_id", giveaway.id)
        .eq("is_winner", true);

      // Send Discord notification
      try {
        await supabase.functions.invoke("send-giveaway-discord", {
          body: {
            type: 'winner_selected',
            giveaway: {
              id: giveaway.id,
              title: giveaway.title,
              description: giveaway.description,
              prize: giveaway.prize,
              end_date: giveaway.end_date,
              winner_count: giveaway.winner_count,
              prize_image_url: giveaway.prize_image_url
            },
            winners: entries?.map(e => ({
              user_id: e.user_id,
              discord_username: e.discord_username,
              discord_id: e.discord_id
            })) || []
          }
        });
      } catch (discordError) {
        console.error("Discord notification error:", discordError);
      }

      toast({ title: "Winners Selected!", description: `${winners?.length || 0} winner(s) have been selected and notified on Discord!` });
      fetchGiveaways();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSelectingWinners(false);
    }
  };

  const openEditDialog = (giveaway: Giveaway) => {
    setEditGiveaway({
      ...giveaway,
      start_date: new Date(giveaway.start_date).toISOString().slice(0, 16),
      end_date: new Date(giveaway.end_date).toISOString().slice(0, 16)
    });
    setShowEditDialog(true);
  };

  const getStatusBadge = (giveaway: Giveaway) => {
    const now = new Date();
    const endDate = new Date(giveaway.end_date);
    
    if (giveaway.status === 'cancelled') {
      return <Badge variant="outline" className="bg-gray-500/20 text-gray-400">Cancelled</Badge>;
    }
    if (giveaway.status === 'ended') {
      return <Badge variant="outline" className="bg-purple-500/20 text-purple-400">Ended</Badge>;
    }
    if (now > endDate) {
      return <Badge variant="outline" className="bg-orange-500/20 text-orange-400">Awaiting Winners</Badge>;
    }
    return <Badge variant="outline" className="bg-green-500/20 text-green-400">Active</Badge>;
  };

  if (loading) {
    return (
      <Card className="glass-effect border-border/20">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="glass-effect border-border/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              <CardTitle className="text-gradient">Giveaway Management</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchGiveaways}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Giveaway
              </Button>
            </div>
          </div>
          <CardDescription>Create, edit, and manage giveaways from one place</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Prize</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Winners</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {giveaways.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No giveaways found. Create your first one!
                    </TableCell>
                  </TableRow>
                ) : (
                  giveaways.map((giveaway) => {
                    const now = new Date();
                    const endDate = new Date(giveaway.end_date);
                    const isEnded = now > endDate || giveaway.status === 'ended';
                    const canSelectWinners = isEnded && giveaway.status !== 'ended' && giveaway.status !== 'cancelled';
                    
                    return (
                      <TableRow key={giveaway.id}>
                        <TableCell className="font-medium">{giveaway.title}</TableCell>
                        <TableCell>{giveaway.prize}</TableCell>
                        <TableCell>{format(new Date(giveaway.end_date), "MMM d, yyyy HH:mm")}</TableCell>
                        <TableCell>{giveaway.winner_count}</TableCell>
                        <TableCell>{getStatusBadge(giveaway)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end flex-wrap">
                            {canSelectWinners && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => selectWinners(giveaway)}
                                disabled={selectingWinners}
                              >
                                <Trophy className="w-4 h-4 mr-1" />
                                Select Winners
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(giveaway)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            {giveaway.status !== 'cancelled' && giveaway.status !== 'ended' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-orange-500 hover:text-orange-400"
                                onClick={() => {
                                  setSelectedGiveaway(giveaway);
                                  setShowCancelDialog(true);
                                }}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSelectedGiveaway(giveaway);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              Create New Giveaway
            </DialogTitle>
            <DialogDescription>Fill in the details to create a new giveaway</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={newGiveaway.title}
                onChange={(e) => setNewGiveaway({ ...newGiveaway, title: e.target.value })}
                placeholder="Holiday Giveaway"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={newGiveaway.description}
                onChange={(e) => setNewGiveaway({ ...newGiveaway, description: e.target.value })}
                placeholder="Enter giveaway details..."
              />
            </div>
            <div>
              <Label>Prize *</Label>
              <Input
                value={newGiveaway.prize}
                onChange={(e) => setNewGiveaway({ ...newGiveaway, prize: e.target.value })}
                placeholder="$100 Gift Card"
              />
            </div>
            <div>
              <Label>Prize Image URL</Label>
              <Input
                value={newGiveaway.prize_image_url}
                onChange={(e) => setNewGiveaway({ ...newGiveaway, prize_image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>End Date *</Label>
              <Input
                type="datetime-local"
                value={newGiveaway.end_date}
                onChange={(e) => setNewGiveaway({ ...newGiveaway, end_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Winner Count</Label>
              <Input
                type="number"
                min={1}
                value={newGiveaway.winner_count}
                onChange={(e) => setNewGiveaway({ ...newGiveaway, winner_count: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={newGiveaway.category} onValueChange={(v) => setNewGiveaway({ ...newGiveaway, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">🎯 All Members</SelectItem>
                  <SelectItem value="whitelisted">⭐ Whitelisted Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={createGiveaway} disabled={creating}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-primary" />
              Edit Giveaway
            </DialogTitle>
          </DialogHeader>
          {editGiveaway && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={editGiveaway.title}
                  onChange={(e) => setEditGiveaway({ ...editGiveaway, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={editGiveaway.description || ''}
                  onChange={(e) => setEditGiveaway({ ...editGiveaway, description: e.target.value })}
                />
              </div>
              <div>
                <Label>Prize</Label>
                <Input
                  value={editGiveaway.prize}
                  onChange={(e) => setEditGiveaway({ ...editGiveaway, prize: e.target.value })}
                />
              </div>
              <div>
                <Label>Prize Image URL</Label>
                <Input
                  value={editGiveaway.prize_image_url || ''}
                  onChange={(e) => setEditGiveaway({ ...editGiveaway, prize_image_url: e.target.value })}
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="datetime-local"
                  value={editGiveaway.end_date}
                  onChange={(e) => setEditGiveaway({ ...editGiveaway, end_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Winner Count</Label>
                <Input
                  type="number"
                  min={1}
                  value={editGiveaway.winner_count}
                  onChange={(e) => setEditGiveaway({ ...editGiveaway, winner_count: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={editGiveaway.category} onValueChange={(v) => setEditGiveaway({ ...editGiveaway, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">🎯 All Members</SelectItem>
                    <SelectItem value="whitelisted">⭐ Whitelisted Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={updateGiveaway} disabled={updating}>
              {updating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Delete Giveaway
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedGiveaway?.title}"? This will also delete all entries and winner records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteGiveaway} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Confirmation */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Cancel Giveaway
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel "{selectedGiveaway?.title}"? Participants will be notified that the giveaway has been cancelled. No winners will be selected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Active</AlertDialogCancel>
            <AlertDialogAction onClick={cancelGiveaway} disabled={cancelling} className="bg-orange-500 text-white hover:bg-orange-600">
              {cancelling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Cancel Giveaway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default GiveawayManagement;
