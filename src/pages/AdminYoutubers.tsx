import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, Youtube, Plus, Pencil, Trash2, Radio, ExternalLink, ArrowUp, ArrowDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import headerBg from "@/assets/header-staff.jpg";

interface FeaturedYoutuber {
  id: string;
  name: string;
  channel_url: string;
  avatar_url: string | null;
  role: string | null;
  is_live: boolean | null;
  live_stream_url: string | null;
  display_order: number | null;
  is_active: boolean | null;
  created_at: string;
}

const AdminYoutubers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [youtubers, setYoutubers] = useState<FeaturedYoutuber[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingYoutuber, setEditingYoutuber] = useState<FeaturedYoutuber | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    channel_url: "",
    avatar_url: "",
    role: "Streamer",
    is_live: false,
    live_stream_url: "",
    is_active: true,
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["admin", "moderator"])
        .maybeSingle();

      if (roleError || !roleData) {
        toast({
          title: "Access Denied",
          description: "Admin or Moderator role required.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      await loadYoutubers();
    } catch (error) {
      console.error("Error:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadYoutubers = async () => {
    const { data, error } = await supabase
      .from("featured_youtubers")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error loading youtubers:", error);
      return;
    }

    setYoutubers(data || []);
  };

  const openAddDialog = () => {
    setEditingYoutuber(null);
    setFormData({
      name: "",
      channel_url: "",
      avatar_url: "",
      role: "Streamer",
      is_live: false,
      live_stream_url: "",
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (youtuber: FeaturedYoutuber) => {
    setEditingYoutuber(youtuber);
    setFormData({
      name: youtuber.name,
      channel_url: youtuber.channel_url,
      avatar_url: youtuber.avatar_url || "",
      role: youtuber.role || "Streamer",
      is_live: youtuber.is_live || false,
      live_stream_url: youtuber.live_stream_url || "",
      is_active: youtuber.is_active ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.channel_url) {
      toast({
        title: "Error",
        description: "Name and Channel URL are required.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      if (editingYoutuber) {
        const { error } = await supabase
          .from("featured_youtubers")
          .update({
            name: formData.name,
            channel_url: formData.channel_url,
            avatar_url: formData.avatar_url || null,
            role: formData.role,
            is_live: formData.is_live,
            live_stream_url: formData.live_stream_url || null,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingYoutuber.id);

        if (error) throw error;

        toast({ title: "Success", description: "YouTuber updated successfully." });
      } else {
        const maxOrder = youtubers.length > 0 
          ? Math.max(...youtubers.map(y => y.display_order || 0)) 
          : 0;

        const { error } = await supabase
          .from("featured_youtubers")
          .insert({
            name: formData.name,
            channel_url: formData.channel_url,
            avatar_url: formData.avatar_url || null,
            role: formData.role,
            is_live: formData.is_live,
            live_stream_url: formData.live_stream_url || null,
            is_active: formData.is_active,
            display_order: maxOrder + 1,
          });

        if (error) throw error;

        toast({ title: "Success", description: "YouTuber added successfully." });
      }

      setIsDialogOpen(false);
      await loadYoutubers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const { error } = await supabase
      .from("featured_youtubers")
      .delete()
      .eq("id", deleteId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete YouTuber.",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Success", description: "YouTuber deleted successfully." });
    setDeleteId(null);
    await loadYoutubers();
  };

  const toggleLiveStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("featured_youtubers")
      .update({ is_live: !currentStatus, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
      return;
    }

    await loadYoutubers();
  };

  const moveOrder = async (id: string, direction: "up" | "down") => {
    const index = youtubers.findIndex(y => y.id === id);
    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === youtubers.length - 1) return;

    const swapIndex = direction === "up" ? index - 1 : index + 1;
    const current = youtubers[index];
    const swap = youtubers[swapIndex];

    await Promise.all([
      supabase.from("featured_youtubers").update({ display_order: swap.display_order }).eq("id", current.id),
      supabase.from("featured_youtubers").update({ display_order: current.display_order }).eq("id", swap.id),
    ]);

    await loadYoutubers();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader
        title="Manage Featured YouTubers"
        description="Add, edit, and manage featured streamers displayed on homepage"
        backgroundImage={headerBg}
      />

      <div className="container mx-auto px-4 py-8">
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Youtube className="w-5 h-5 text-red-500" />
                Featured YouTubers
              </CardTitle>
              <CardDescription>
                Manage streamers shown in the Featured Streamers section
              </CardDescription>
            </div>
            <Button onClick={openAddDialog} className="gap-2">
              <Plus className="w-4 h-4" />
              Add YouTuber
            </Button>
          </CardHeader>
          <CardContent>
            {youtubers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Youtube className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No featured YouTubers yet.</p>
                <p className="text-sm">Click "Add YouTuber" to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Order</TableHead>
                    <TableHead>YouTuber</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-center">Live</TableHead>
                    <TableHead className="text-center">Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {youtubers.map((youtuber, index) => (
                    <TableRow key={youtuber.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveOrder(youtuber.id, "up")}
                            disabled={index === 0}
                          >
                            <ArrowUp className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveOrder(youtuber.id, "down")}
                            disabled={index === youtubers.length - 1}
                          >
                            <ArrowDown className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {youtuber.avatar_url ? (
                            <img
                              src={youtuber.avatar_url}
                              alt={youtuber.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                              <Youtube className="w-5 h-5 text-primary" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{youtuber.name}</p>
                            <a
                              href={youtuber.channel_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                            >
                              Channel <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{youtuber.role}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant={youtuber.is_live ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleLiveStatus(youtuber.id, youtuber.is_live || false)}
                          className={youtuber.is_live ? "bg-red-500 hover:bg-red-600" : ""}
                        >
                          <Radio className={`w-4 h-4 mr-1 ${youtuber.is_live ? "animate-pulse" : ""}`} />
                          {youtuber.is_live ? "LIVE" : "Offline"}
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={youtuber.is_active ? "default" : "secondary"}>
                          {youtuber.is_active ? "Active" : "Hidden"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(youtuber)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteId(youtuber.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingYoutuber ? "Edit YouTuber" : "Add New YouTuber"}
            </DialogTitle>
            <DialogDescription>
              {editingYoutuber ? "Update YouTuber information" : "Add a new featured streamer"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Streamer name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="channel_url">Channel URL *</Label>
              <Input
                id="channel_url"
                value={formData.channel_url}
                onChange={(e) => setFormData({ ...formData, channel_url: e.target.value })}
                placeholder="https://youtube.com/@channel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar_url">Avatar URL</Label>
              <Input
                id="avatar_url"
                value={formData.avatar_url}
                onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="Streamer, Content Creator, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="live_stream_url">Live Stream URL</Label>
              <Input
                id="live_stream_url"
                value={formData.live_stream_url}
                onChange={(e) => setFormData({ ...formData, live_stream_url: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_live"
                  checked={formData.is_live}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_live: checked })}
                />
                <Label htmlFor="is_live">Currently Live</Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Show on Homepage</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingYoutuber ? "Save Changes" : "Add YouTuber"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete YouTuber?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the YouTuber from the featured section. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminYoutubers;
