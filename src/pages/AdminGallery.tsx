import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  CheckCircle, 
  XCircle, 
  Eye, 
  Search,
  Loader2,
  Calendar,
  User
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
  rejection_reason: string | null;
}

const AdminGallery = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<GallerySubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<GallerySubmission[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<GallerySubmission | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  useEffect(() => {
    filterSubmissions();
  }, [searchQuery, submissions, activeTab]);

  const checkAdminAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (!roleData || (roleData.role !== "admin" && roleData.role !== "moderator")) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      await loadSubmissions();
    } catch (error) {
      console.error("Error checking admin status:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from("gallery_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error: any) {
      toast({
        title: "Error Loading Submissions",
        description: error.message,
        variant: "destructive",
      });
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

  const handleApprove = async (submission: GallerySubmission) => {
    setProcessingId(submission.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("gallery_submissions")
        .update({
          status: "approved",
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", submission.id);

      if (error) throw error;

      toast({
        title: "Submission Approved",
        description: `"${submission.title}" has been approved and is now visible in the gallery.`,
      });

      await loadSubmissions();
      setPreviewOpen(false);
    } catch (error: any) {
      toast({
        title: "Error Approving Submission",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedSubmission || !rejectionReason.trim()) return;

    setProcessingId(selectedSubmission.id);
    try {
      const { error } = await supabase
        .from("gallery_submissions")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason.trim(),
        })
        .eq("id", selectedSubmission.id);

      if (error) throw error;

      toast({
        title: "Submission Rejected",
        description: `"${selectedSubmission.title}" has been rejected.`,
      });

      await loadSubmissions();
      setRejectDialogOpen(false);
      setPreviewOpen(false);
      setRejectionReason("");
    } catch (error: any) {
      toast({
        title: "Error Rejecting Submission",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const stats = getStats();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gradient mb-2">Gallery Management</h1>
          <p className="text-muted-foreground">Review and manage community submissions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-effect border-border/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Total</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-effect border-border/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Pending</p>
                <p className="text-3xl font-bold text-yellow-500">{stats.pending}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-effect border-border/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Approved</p>
                <p className="text-3xl font-bold text-green-500">{stats.approved}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-effect border-border/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Rejected</p>
                <p className="text-3xl font-bold text-red-500">{stats.rejected}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="glass-effect border-border/20 mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submissions Tabs */}
        <Card className="glass-effect border-border/20">
          <CardHeader>
            <CardTitle>Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
                <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
                <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                <ScrollArea className="h-[600px]">
                  {filteredSubmissions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No {activeTab} submissions found</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredSubmissions.map((submission) => (
                        <Card key={submission.id} className="overflow-hidden border-border/40 hover:border-primary/40 transition-all">
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
                            <Badge className="absolute top-2 right-2">
                              {submission.category}
                            </Badge>
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold mb-2 truncate">{submission.title}</h3>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                              <Calendar className="h-3 w-3" />
                              {new Date(submission.created_at).toLocaleDateString()}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                setSelectedSubmission(submission);
                                setPreviewOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Review
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedSubmission && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedSubmission.title}</DialogTitle>
                <DialogDescription>
                  Submitted on {new Date(selectedSubmission.created_at).toLocaleString()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold mb-1">Category</p>
                    <Badge>{selectedSubmission.category}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-1">File Size</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedSubmission.file_size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                {selectedSubmission.description && (
                  <div>
                    <p className="text-sm font-semibold mb-2">Description</p>
                    <p className="text-sm text-muted-foreground">{selectedSubmission.description}</p>
                  </div>
                )}

                {selectedSubmission.status === "rejected" && selectedSubmission.rejection_reason && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm font-semibold mb-1 text-destructive">Rejection Reason</p>
                    <p className="text-sm text-muted-foreground">{selectedSubmission.rejection_reason}</p>
                  </div>
                )}
              </div>

              {selectedSubmission.status === "pending" && (
                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setRejectDialogOpen(true);
                    }}
                    disabled={processingId === selectedSubmission.id}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleApprove(selectedSubmission)}
                    disabled={processingId === selectedSubmission.id}
                  >
                    {processingId === selectedSubmission.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Approve
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Submission</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this submission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Reason for rejection..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="min-h-[100px]"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRejectionReason("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={!rejectionReason.trim() || processingId !== null}
              className="bg-destructive hover:bg-destructive/90"
            >
              {processingId ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminGallery;