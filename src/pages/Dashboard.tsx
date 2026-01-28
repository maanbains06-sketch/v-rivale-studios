import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, FileText, Briefcase, Ban, Clock, Radio, Users, Image, Video, RefreshCw, Upload, X, GraduationCap, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import headerCommunity from "@/assets/header-community.jpg";

interface WhitelistApplication {
  id: string;
  status: string;
  created_at: string;
  admin_notes?: string;
}

interface JobApplication {
  id: string;
  job_type: string;
  status: string;
  created_at: string;
  admin_notes?: string;
}

interface BanAppeal {
  id: string;
  status: string;
  created_at: string;
  ban_reason: string;
  admin_notes?: string;
}

interface StaffApplication {
  id: string;
  position: string;
  status: string;
  created_at: string;
  admin_notes?: string;
}

interface GallerySubmission {
  id: string;
  title: string;
  category: string;
  status: string;
  created_at: string;
  rejection_reason?: string;
  description?: string;
  file_type: string;
  file_path: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [whitelistApps, setWhitelistApps] = useState<WhitelistApplication[]>([]);
  const [jobApps, setJobApps] = useState<JobApplication[]>([]);
  const [banAppeals, setBanAppeals] = useState<BanAppeal[]>([]);
  const [staffApps, setStaffApps] = useState<StaffApplication[]>([]);
  const [gallerySubmissions, setGallerySubmissions] = useState<GallerySubmission[]>([]);
  const [resubmitDialogOpen, setResubmitDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<GallerySubmission | null>(null);
  const [resubmitFile, setResubmitFile] = useState<File | null>(null);
  const [resubmitPreview, setResubmitPreview] = useState<string | null>(null);
  const [resubmitDescription, setResubmitDescription] = useState("");
  const [resubmitting, setResubmitting] = useState(false);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  useEffect(() => {
    // Set up realtime subscriptions ONLY after we know the current user.
    // This prevents subscribing to *all rows* (which can be very noisy and cause UI jank).
    if (!userId) return;

    const channel = supabase
      .channel("dashboard-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "whitelist_applications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => handleWhitelistChange(payload)
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "job_applications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => handleJobChange(payload)
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ban_appeals",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => handleBanAppealChange(payload)
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "staff_applications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => handleStaffAppChange(payload)
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "gallery_submissions",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => handleGalleryChange(payload)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleWhitelistChange = (payload: any) => {
    // Only update if the change is for the current user
    if (payload.new?.user_id !== userId && payload.old?.user_id !== userId) {
      return;
    }

    if (payload.eventType === 'INSERT') {
      setWhitelistApps(prev => [payload.new, ...prev]);
    } else if (payload.eventType === 'UPDATE') {
      setWhitelistApps(prev => 
        prev.map(app => app.id === payload.new.id ? payload.new : app)
      );
      // Show notification for status changes
      if (payload.old?.status !== payload.new?.status) {
        toast({
          title: "Whitelist Application Updated",
          description: `Your whitelist application has been ${payload.new.status}.`,
          variant: payload.new.status === "approved" ? "default" : "destructive",
        });
      }
    } else if (payload.eventType === 'DELETE') {
      setWhitelistApps(prev => prev.filter(app => app.id !== payload.old.id));
    }
  };

  const handleJobChange = (payload: any) => {
    // Only update if the change is for the current user
    if (payload.new?.user_id !== userId && payload.old?.user_id !== userId) {
      return;
    }

    if (payload.eventType === 'INSERT') {
      setJobApps(prev => [payload.new, ...prev]);
    } else if (payload.eventType === 'UPDATE') {
      setJobApps(prev => 
        prev.map(app => app.id === payload.new.id ? payload.new : app)
      );
      // Show notification for status changes
      if (payload.old?.status !== payload.new?.status) {
        toast({
          title: "Job Application Updated",
          description: `Your ${payload.new.job_type} application has been ${payload.new.status}.`,
          variant: payload.new.status === "approved" ? "default" : "destructive",
        });
      }
    } else if (payload.eventType === 'DELETE') {
      setJobApps(prev => prev.filter(app => app.id !== payload.old.id));
    }
  };

  const handleBanAppealChange = (payload: any) => {
    // Only update if the change is for the current user
    if (payload.new?.user_id !== userId && payload.old?.user_id !== userId) {
      return;
    }

    if (payload.eventType === 'INSERT') {
      setBanAppeals(prev => [payload.new, ...prev]);
    } else if (payload.eventType === 'UPDATE') {
      setBanAppeals(prev => 
        prev.map(appeal => appeal.id === payload.new.id ? payload.new : appeal)
      );
      // Show notification for status changes
      if (payload.old?.status !== payload.new?.status) {
        toast({
          title: "Ban Appeal Updated",
          description: `Your ban appeal has been ${payload.new.status}.`,
          variant: payload.new.status === "approved" ? "default" : "destructive",
        });
      }
    } else if (payload.eventType === 'DELETE') {
      setBanAppeals(prev => prev.filter(appeal => appeal.id !== payload.old.id));
    }
  };

  const handleStaffAppChange = (payload: any) => {
    // Only update if the change is for the current user
    if (payload.new?.user_id !== userId && payload.old?.user_id !== userId) {
      return;
    }

    if (payload.eventType === 'INSERT') {
      setStaffApps(prev => [payload.new, ...prev]);
    } else if (payload.eventType === 'UPDATE') {
      setStaffApps(prev => 
        prev.map(app => app.id === payload.new.id ? payload.new : app)
      );
      // Show notification for status changes
      if (payload.old?.status !== payload.new?.status) {
        toast({
          title: "Staff Application Updated",
          description: `Your ${payload.new.position} application has been ${payload.new.status}.`,
          variant: payload.new.status === "approved" ? "default" : "destructive",
        });
      }
    } else if (payload.eventType === 'DELETE') {
      setStaffApps(prev => prev.filter(app => app.id !== payload.old.id));
    }
  };

  const handleGalleryChange = (payload: any) => {
    // Only update if the change is for the current user
    if (payload.new?.user_id !== userId && payload.old?.user_id !== userId) {
      return;
    }

    if (payload.eventType === 'INSERT') {
      setGallerySubmissions(prev => [payload.new, ...prev]);
    } else if (payload.eventType === 'UPDATE') {
      setGallerySubmissions(prev => 
        prev.map(sub => sub.id === payload.new.id ? payload.new : sub)
      );
      // Show notification for status changes
      if (payload.old?.status !== payload.new?.status) {
        toast({
          title: "Gallery Submission Updated",
          description: `Your submission "${payload.new.title}" has been ${payload.new.status}.`,
          variant: payload.new.status === "approved" ? "default" : "destructive",
        });
      }
    } else if (payload.eventType === 'DELETE') {
      setGallerySubmissions(prev => prev.filter(sub => sub.id !== payload.old.id));
    }
  };

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      setUserId(user.id);
      await loadAllApplications(user.id);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllApplications = async (userId: string) => {
    // Load whitelist applications
    const { data: whitelistData } = await supabase
      .from("whitelist_applications")
      .select("id, status, created_at, admin_notes")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (whitelistData) setWhitelistApps(whitelistData);

    // Load job applications
    const { data: jobData } = await supabase
      .from("job_applications")
      .select("id, job_type, status, created_at, admin_notes")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (jobData) setJobApps(jobData);

    // Load ban appeals
    const { data: banData } = await supabase
      .from("ban_appeals")
      .select("id, status, created_at, ban_reason, admin_notes")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (banData) setBanAppeals(banData);

    // Load staff applications
    const { data: staffData } = await supabase
      .from("staff_applications")
      .select("id, position, status, created_at, admin_notes")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (staffData) setStaffApps(staffData);

    // Load gallery submissions
    const { data: galleryData } = await supabase
      .from("gallery_submissions")
      .select("id, title, category, status, created_at, rejection_reason, description, file_type, file_path")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (galleryData) setGallerySubmissions(galleryData);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const handleResubmitClick = (submission: GallerySubmission) => {
    setSelectedSubmission(submission);
    setResubmitDescription(submission.description || "");
    setResubmitDialogOpen(true);
  };

  const handleResubmitFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 20 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 20MB.",
        variant: "destructive",
      });
      return;
    }

    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/webm', 'video/quicktime'
    ];
    
    if (!allowedTypes.includes(selectedFile.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image or video file.",
        variant: "destructive",
      });
      return;
    }

    setResubmitFile(selectedFile);

    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setResubmitPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setResubmitPreview(null);
    }
  };

  const handleResubmit = async () => {
    if (!selectedSubmission || !resubmitFile) {
      toast({
        title: "File Required",
        description: "Please select a new file to resubmit.",
        variant: "destructive",
      });
      return;
    }

    setResubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Delete old file from storage
      await supabase.storage.from('gallery').remove([selectedSubmission.file_path]);

      // Upload new file
      const fileExt = resubmitFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(fileName, resubmitFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Update submission record
      const { error: updateError } = await supabase
        .from('gallery_submissions')
        .update({
          file_path: fileName,
          file_type: resubmitFile.type,
          file_size: resubmitFile.size,
          description: resubmitDescription.trim() || null,
          status: 'pending',
          rejection_reason: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedSubmission.id);

      if (updateError) {
        await supabase.storage.from('gallery').remove([fileName]);
        throw updateError;
      }

      toast({
        title: "Resubmission Successful!",
        description: "Your content has been resubmitted and is pending approval.",
      });

      setResubmitDialogOpen(false);
      setSelectedSubmission(null);
      setResubmitFile(null);
      setResubmitPreview(null);
      setResubmitDescription("");
    } catch (error: any) {
      console.error("Resubmit error:", error);
      toast({
        title: "Resubmission Failed",
        description: error.message || "There was an error resubmitting your content.",
        variant: "destructive",
      });
    } finally {
      setResubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <PageHeader 
          title="My Dashboard"
          description="Track all your applications in one place"
          badge="Applications"
          backgroundImage={headerCommunity}
          pageKey="community"
        />
        <div className="container mx-auto px-4 pb-16 flex justify-center items-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <PageHeader 
        title="My Dashboard"
        description="Track all your applications in one place"
        badge="Applications"
        backgroundImage={headerCommunity}
        pageKey="community"
      />
      
      <main className="container mx-auto px-4 pb-16">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Live Update Indicator */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Radio className="w-4 h-4 text-primary animate-pulse" />
            <span>Live updates active - changes will appear automatically</span>
          </div>

          {/* Whitelist Applications */}
          <Card className="glass-effect border-border/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <CardTitle className="text-gradient">Whitelist Applications</CardTitle>
              </div>
              <CardDescription>Your server whitelist application status</CardDescription>
            </CardHeader>
            <CardContent>
              {whitelistApps.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No whitelist applications found
                </p>
              ) : (
                <div className="space-y-4">
                  {whitelistApps.map((app) => (
                    <Card key={app.id} className="border-border/20">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">
                                Submitted on {format(new Date(app.created_at), "PPP")}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(app.created_at), "p")}
                              </p>
                            </div>
                          </div>
                          <Badge variant={getStatusBadgeVariant(app.status)}>
                            {app.status.toUpperCase()}
                          </Badge>
                        </div>
                        {app.admin_notes && (
                          <div className="mt-4 p-3 rounded-md bg-muted/50">
                            <p className="text-sm font-medium mb-1">Admin Notes:</p>
                            <p className="text-sm text-muted-foreground">{app.admin_notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Job Applications */}
          <Card className="glass-effect border-border/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                <CardTitle className="text-gradient">Job Applications</CardTitle>
              </div>
              <CardDescription>Your job application statuses</CardDescription>
            </CardHeader>
            <CardContent>
              {jobApps.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No job applications found
                </p>
              ) : (
                <div className="space-y-4">
                  {jobApps.map((app) => (
                    <Card key={app.id} className="border-border/20">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="font-semibold text-lg mb-2">{app.job_type}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              <span>Submitted on {format(new Date(app.created_at), "PPP")}</span>
                            </div>
                          </div>
                          <Badge variant={getStatusBadgeVariant(app.status)}>
                            {app.status.toUpperCase()}
                          </Badge>
                        </div>
                        {app.admin_notes && (
                          <div className="mt-4 p-3 rounded-md bg-muted/50">
                            <p className="text-sm font-medium mb-1">Admin Notes:</p>
                            <p className="text-sm text-muted-foreground">{app.admin_notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ban Appeals */}
          {banAppeals.length > 0 && (
            <Card className="glass-effect border-border/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Ban className="w-5 h-5 text-primary" />
                  <CardTitle className="text-gradient">Ban Appeals</CardTitle>
                </div>
                <CardDescription>Your ban appeal statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {banAppeals.map((appeal) => (
                    <Card key={appeal.id} className="border-border/20">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="text-sm font-medium mb-2">
                              Ban Reason: {appeal.ban_reason}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              <span>Submitted on {format(new Date(appeal.created_at), "PPP")}</span>
                            </div>
                          </div>
                          <Badge variant={getStatusBadgeVariant(appeal.status)}>
                            {appeal.status.toUpperCase()}
                          </Badge>
                        </div>
                        {appeal.admin_notes && (
                          <div className="mt-4 p-3 rounded-md bg-muted/50">
                            <p className="text-sm font-medium mb-1">Admin Response:</p>
                            <p className="text-sm text-muted-foreground">{appeal.admin_notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Staff Applications */}
          <Card className="glass-effect border-border/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <CardTitle className="text-gradient">Staff Applications</CardTitle>
              </div>
              <CardDescription>Your staff position application statuses</CardDescription>
            </CardHeader>
            <CardContent>
              {staffApps.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No staff applications found
                </p>
              ) : (
                <div className="space-y-4">
                  {staffApps.map((app) => (
                    <Card key={app.id} className="border-border/20">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="font-semibold text-lg mb-2 capitalize">
                              {app.position}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              <span>Submitted on {format(new Date(app.created_at), "PPP")}</span>
                            </div>
                          </div>
                          <Badge variant={getStatusBadgeVariant(app.status)}>
                            {app.status.toUpperCase()}
                          </Badge>
                        </div>
                        {app.admin_notes && (
                          <div className="mt-4 p-3 rounded-md bg-muted/50">
                            <p className="text-sm font-medium mb-1">Admin Notes:</p>
                            <p className="text-sm text-muted-foreground">{app.admin_notes}</p>
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-4"
                          onClick={() => navigate('/application-status')}
                        >
                          View Detailed Status <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Staff Onboarding - Show only if staff application is approved */}
          {staffApps.some(app => app.status === 'approved') && (
            <Card className="glass-effect border-border/20 border-green-500/50 bg-green-50/5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-green-500" />
                  <CardTitle className="text-gradient">Staff Onboarding</CardTitle>
                </div>
                <CardDescription>Complete your training and onboarding checklist</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Congratulations on joining the team! Complete your training modules and onboarding tasks to get started.
                </p>
                <Button
                  className="w-full"
                  onClick={() => navigate('/staff-onboarding')}
                >
                  Start Onboarding <GraduationCap className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Gallery Submissions */}
          <Card className="glass-effect border-border/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <CardTitle className="text-gradient">Gallery Submissions</CardTitle>
              </div>
              <CardDescription>Your community gallery submissions</CardDescription>
            </CardHeader>
            <CardContent>
              {gallerySubmissions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No gallery submissions found
                </p>
              ) : (
                <div className="space-y-4">
                  {gallerySubmissions.map((submission) => (
                    <Card key={submission.id} className="border-border/20">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {submission.file_type.startsWith('image/') ? (
                                <Image className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <Video className="w-4 h-4 text-muted-foreground" />
                              )}
                              <p className="font-semibold text-lg">{submission.title}</p>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              Category: {submission.category}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              <span>Submitted on {format(new Date(submission.created_at), "PPP")}</span>
                            </div>
                          </div>
                          <Badge variant={getStatusBadgeVariant(submission.status)}>
                            {submission.status.toUpperCase()}
                          </Badge>
                        </div>
                        {submission.rejection_reason && (
                          <>
                            <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                              <p className="text-sm font-medium mb-1 text-destructive">Rejection Reason:</p>
                              <p className="text-sm text-muted-foreground">{submission.rejection_reason}</p>
                            </div>
                            <div className="mt-4">
                              <Dialog open={resubmitDialogOpen && selectedSubmission?.id === submission.id} onOpenChange={(open) => {
                                setResubmitDialogOpen(open);
                                if (!open) {
                                  setSelectedSubmission(null);
                                  setResubmitFile(null);
                                  setResubmitPreview(null);
                                }
                              }}>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleResubmitClick(submission)}
                                    className="w-full"
                                  >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Resubmit with Improvements
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Resubmit Gallery Content</DialogTitle>
                                    <DialogDescription>
                                      Upload an improved version based on the admin's feedback
                                    </DialogDescription>
                                  </DialogHeader>
                                  
                                  <div className="space-y-4 py-4">
                                    <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                                      <p className="text-sm font-medium mb-1 text-destructive">Admin Feedback:</p>
                                      <p className="text-sm text-muted-foreground">{submission.rejection_reason}</p>
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor="resubmit-description">Description (Optional)</Label>
                                      <Textarea
                                        id="resubmit-description"
                                        placeholder="Update your description..."
                                        value={resubmitDescription}
                                        onChange={(e) => setResubmitDescription(e.target.value)}
                                        maxLength={500}
                                        className="min-h-[100px] resize-none"
                                      />
                                      <p className="text-xs text-muted-foreground">{resubmitDescription.length}/500 characters</p>
                                    </div>

                                    <div className="space-y-2">
                                      <Label htmlFor="resubmit-file">New File *</Label>
                                      {!resubmitFile ? (
                                        <div className="border-2 border-dashed border-border/40 rounded-lg p-8 text-center hover:border-primary/40 transition-colors">
                                          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                          <p className="text-sm text-foreground mb-2">
                                            Upload improved version
                                          </p>
                                          <p className="text-xs text-muted-foreground mb-4">
                                            Images or Videos (max 20MB)
                                          </p>
                                          <Input
                                            id="resubmit-file"
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                                            onChange={handleResubmitFileChange}
                                            className="hidden"
                                          />
                                          <Label
                                            htmlFor="resubmit-file"
                                            className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                                          >
                                            Choose File
                                          </Label>
                                        </div>
                                      ) : (
                                        <div className="relative border border-border/20 rounded-lg p-4 bg-background/50">
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute top-2 right-2 h-8 w-8 p-0"
                                            onClick={() => {
                                              setResubmitFile(null);
                                              setResubmitPreview(null);
                                            }}
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                          
                                          {resubmitPreview && (
                                            <div className="mb-4">
                                              <img
                                                src={resubmitPreview}
                                                alt="Preview"
                                                className="max-h-64 mx-auto rounded-lg object-contain"
                                              />
                                            </div>
                                          )}
                                          
                                          <div className="text-sm">
                                            <p className="font-medium truncate">{resubmitFile.name}</p>
                                            <p className="text-muted-foreground">
                                              {(resubmitFile.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    <Button
                                      onClick={handleResubmit}
                                      disabled={!resubmitFile || resubmitting}
                                      className="w-full"
                                    >
                                      {resubmitting ? (
                                        <>
                                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                          Resubmitting...
                                        </>
                                      ) : (
                                        <>
                                          <RefreshCw className="w-4 h-4 mr-2" />
                                          Resubmit for Review
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
