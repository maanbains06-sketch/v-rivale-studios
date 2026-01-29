import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Image, 
  Video, 
  Trash2, 
  Search, 
  Loader2, 
  Calendar,
  Eye,
  RefreshCw,
  AlertTriangle
} from "lucide-react";

interface GallerySubmission {
  id: string;
  title: string;
  description: string | null;
  category: string;
  file_path: string;
  file_type: string;
  file_size: number;
  status: string;
  created_at: string;
  user_id: string;
}

export const OwnerGalleryManager = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<GallerySubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<GallerySubmission[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("approved");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<GallerySubmission | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, []);

  useEffect(() => {
    filterSubmissions();
  }, [searchQuery, submissions, activeTab]);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("gallery_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error: any) {
      toast({
        title: "Error Loading Gallery",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterSubmissions = () => {
    let filtered = submissions.filter(sub => sub.status === activeTab);
    
    if (searchQuery) {
      filtered = filtered.filter(sub =>
        sub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredSubmissions(filtered);
  };

  const getFileUrl = (filePath: string) => {
    const { data } = supabase.storage.from('gallery').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleDelete = async (submission: GallerySubmission) => {
    setDeletingId(submission.id);
    try {
      // Delete associated reactions
      await supabase
        .from("gallery_reactions")
        .delete()
        .eq("submission_id", submission.id);

      // Delete associated likes
      await supabase
        .from("gallery_likes")
        .delete()
        .eq("submission_id", submission.id);

      // Delete associated comments
      await supabase
        .from("gallery_comments")
        .delete()
        .eq("submission_id", submission.id);

      // Delete the file from storage
      const { error: storageError } = await supabase.storage
        .from('gallery')
        .remove([submission.file_path]);

      if (storageError) {
        console.error("Error deleting file from storage:", storageError);
      }

      // Delete the submission record
      const { error } = await supabase
        .from("gallery_submissions")
        .delete()
        .eq("id", submission.id);

      if (error) throw error;

      // Update local state
      setSubmissions(prev => prev.filter(s => s.id !== submission.id));

      toast({
        title: "Content Deleted",
        description: `"${submission.title}" has been permanently deleted.`,
      });

      setShowDeleteConfirm(false);
      setSelectedSubmission(null);
      setPreviewOpen(false);
    } catch (error: any) {
      toast({
        title: "Error Deleting Content",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      // Get all submission IDs and file paths
      const allIds = submissions.map(s => s.id);
      const allFilePaths = submissions.map(s => s.file_path);

      // Delete all reactions
      await supabase
        .from("gallery_reactions")
        .delete()
        .in("submission_id", allIds);

      // Delete all likes
      await supabase
        .from("gallery_likes")
        .delete()
        .in("submission_id", allIds);

      // Delete all comments
      await supabase
        .from("gallery_comments")
        .delete()
        .in("submission_id", allIds);

      // Delete all files from storage
      if (allFilePaths.length > 0) {
        await supabase.storage
          .from('gallery')
          .remove(allFilePaths);
      }

      // Delete all submissions
      const { error } = await supabase
        .from("gallery_submissions")
        .delete()
        .in("id", allIds);

      if (error) throw error;

      setSubmissions([]);

      toast({
        title: "All Content Deleted",
        description: `Successfully deleted ${allIds.length} gallery items.`,
      });

      setShowDeleteAllConfirm(false);
    } catch (error: any) {
      toast({
        title: "Error Deleting Content",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeletingAll(false);
    }
  };

  const getStats = () => {
    return {
      total: submissions.length,
      pending: submissions.filter(s => s.status === "pending").length,
      approved: submissions.filter(s => s.status === "approved").length,
      rejected: submissions.filter(s => s.status === "rejected").length,
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <Card className="glass-effect border-border/20">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect border-border/20">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Image className="w-5 h-5 text-primary" />
              <CardTitle className="text-gradient">Gallery Management</CardTitle>
            </div>
            <CardDescription>Delete screenshots and videos from the gallery</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadSubmissions}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteAllConfirm(true)}
              disabled={submissions.length === 0}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete All ({submissions.length})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
            <p className="text-sm text-muted-foreground mb-1">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-center">
            <p className="text-sm text-muted-foreground mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
          </div>
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
            <p className="text-sm text-muted-foreground mb-1">Approved</p>
            <p className="text-2xl font-bold text-green-500">{stats.approved}</p>
          </div>
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
            <p className="text-sm text-muted-foreground mb-1">Rejected</p>
            <p className="text-2xl font-bold text-red-500">{stats.rejected}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <ScrollArea className="h-[500px]">
              {filteredSubmissions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Image className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No {activeTab} submissions found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSubmissions.map((submission) => (
                    <Card key={submission.id} className="overflow-hidden border-border/40 hover:border-destructive/40 transition-all group">
                      <div className="aspect-video bg-muted/30 relative overflow-hidden">
                        {submission.file_type.startsWith('image/') ? (
                          <img
                            src={getFileUrl(submission.file_path)}
                            alt={submission.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Video className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <Badge className="absolute top-2 left-2">
                          {submission.category}
                        </Badge>
                        <div className="absolute top-2 right-2 flex gap-1">
                          <Badge variant={submission.file_type.startsWith('video/') ? 'secondary' : 'outline'}>
                            {submission.file_type.startsWith('video/') ? <Video className="w-3 h-3" /> : <Image className="w-3 h-3" />}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2 truncate">{submission.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                          <Calendar className="h-3 w-3" />
                          {new Date(submission.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setPreviewOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setShowDeleteConfirm(true);
                            }}
                            disabled={deletingId === submission.id}
                          >
                            {deletingId === submission.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Preview Dialog */}
      {previewOpen && selectedSubmission && (
        <AlertDialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <AlertDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <AlertDialogHeader>
              <AlertDialogTitle>{selectedSubmission.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {selectedSubmission.category} • {new Date(selectedSubmission.created_at).toLocaleString()}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="aspect-video bg-muted/30 rounded-lg overflow-hidden">
              {selectedSubmission.file_type.startsWith('image/') ? (
                <img
                  src={getFileUrl(selectedSubmission.file_path)}
                  alt={selectedSubmission.title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <video
                  src={getFileUrl(selectedSubmission.file_path)}
                  controls
                  className="w-full h-full"
                />
              )}
            </div>
            {selectedSubmission.description && (
              <p className="text-sm text-muted-foreground">{selectedSubmission.description}</p>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setPreviewOpen(false);
                  setShowDeleteConfirm(true);
                }}
                className="bg-destructive hover:bg-destructive/90"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Delete Single Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Gallery Content?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{selectedSubmission?.title}" including all reactions, likes, and comments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedSubmission && handleDelete(selectedSubmission)}
              disabled={deletingId !== null}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deletingId ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Confirmation */}
      <AlertDialog open={showDeleteAllConfirm} onOpenChange={setShowDeleteAllConfirm}>
        <AlertDialogContent className="border-destructive/50">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <AlertDialogTitle className="text-xl">Delete ALL Gallery Content?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-3">
              <p className="text-destructive font-medium">
                ⚠️ This action is IRREVERSIBLE and will permanently delete:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                <li>{stats.approved} approved submissions</li>
                <li>{stats.pending} pending submissions</li>
                <li>{stats.rejected} rejected submissions</li>
                <li>All associated reactions, likes, and comments</li>
                <li>All files from storage</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingAll}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              disabled={isDeletingAll}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeletingAll ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete All Content
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
