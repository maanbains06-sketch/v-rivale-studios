import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Shield, FileText, Image, Ban, Users as UsersIcon, Pencil, Trash2, Briefcase, Car, Video, ExternalLink } from "lucide-react";
import { StaffManagementDialog } from "@/components/StaffManagementDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import headerAdminBg from "@/assets/header-staff.jpg";

interface UserRole {
  id: string;
  user_id: string;
  role: "admin" | "moderator" | "user";
  discord_username?: string;
}

interface BanAppeal {
  id: string;
  user_id: string;
  steam_id: string;
  discord_username: string;
  ban_reason: string;
  appeal_reason: string;
  additional_info?: string;
  status: string;
  created_at: string;
  admin_notes?: string;
}

interface WhitelistApplication {
  id: string;
  user_id: string;
  steam_id: string;
  discord: string;
  age: number;
  experience: string;
  backstory: string;
  status: string;
  created_at: string;
  admin_notes?: string;
}

interface GallerySubmission {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: string;
  file_path: string;
  file_type: string;
  status: string;
  created_at: string;
  rejection_reason?: string;
}

interface StaffMemberData {
  id: string;
  name: string;
  discord_id: string;
  discord_username?: string;
  discord_avatar?: string;
  email?: string;
  steam_id?: string;
  role: string;
  role_type: string;
  department: string;
  bio?: string;
  responsibilities: string[];
  is_active: boolean;
  display_order: number;
}

interface JobApplication {
  id: string;
  user_id: string;
  character_name: string;
  age: number;
  job_type: string;
  phone_number: string;
  previous_experience: string;
  why_join: string;
  character_background: string;
  availability: string;
  additional_info?: string;
  status: string;
  created_at: string;
  admin_notes?: string;
}

interface PDMApplication {
  id: string;
  user_id: string;
  character_name: string;
  age: number;
  phone_number: string;
  previous_experience: string;
  why_join: string;
  character_background: string;
  availability: string;
  sales_experience: string;
  vehicle_knowledge: string;
  customer_scenario: string;
  additional_info?: string;
  status: string;
  created_at: string;
  admin_notes?: string;
}

interface CreatorApplication {
  id: string;
  user_id: string | null;
  full_name: string;
  discord_username: string;
  steam_id: string;
  channel_url: string;
  platform: string;
  average_viewers: string;
  content_frequency: string;
  rp_experience: string;
  content_style: string;
  why_join: string;
  social_links: string | null;
  ownership_proof_url: string | null;
  status: string;
  created_at: string;
  admin_notes: string | null;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [applications, setApplications] = useState<WhitelistApplication[]>([]);
  const [submissions, setSubmissions] = useState<GallerySubmission[]>([]);
  const [banAppeals, setBanAppeals] = useState<BanAppeal[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMemberData[]>([]);
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [pdmApplications, setPdmApplications] = useState<PDMApplication[]>([]);
  const [creatorApplications, setCreatorApplications] = useState<CreatorApplication[]>([]);
  
  const [selectedApp, setSelectedApp] = useState<WhitelistApplication | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  
  const [selectedSubmission, setSelectedSubmission] = useState<GallerySubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  
  const [selectedAppeal, setSelectedAppeal] = useState<BanAppeal | null>(null);
  const [appealAdminNotes, setAppealAdminNotes] = useState("");
  
  const [selectedJobApp, setSelectedJobApp] = useState<JobApplication | null>(null);
  const [jobAdminNotes, setJobAdminNotes] = useState("");
  
  const [selectedPdmApp, setSelectedPdmApp] = useState<PDMApplication | null>(null);
  const [pdmAdminNotes, setPdmAdminNotes] = useState("");
  
  const [selectedCreatorApp, setSelectedCreatorApp] = useState<CreatorApplication | null>(null);
  const [creatorAdminNotes, setCreatorAdminNotes] = useState("");
  
  const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMemberData | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<string | null>(null);

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

      // Check if user has admin or moderator role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["admin", "moderator"])
        .maybeSingle();

      if (roleError || !roleData) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page. Admin or Moderator role required.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      await loadAllData();
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadAllData = async () => {
    await Promise.all([
      loadUserRoles(),
      loadApplications(),
      loadSubmissions(),
      loadBanAppeals(),
      loadStaffMembers(),
      loadJobApplications(),
      loadPdmApplications(),
      loadCreatorApplications(),
    ]);
  };

  const loadCreatorApplications = async () => {
    const { data, error } = await supabase
      .from("creator_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading creator applications:", error);
      return;
    }

    setCreatorApplications(data || []);
  };

  const loadPdmApplications = async () => {
    const { data, error } = await supabase
      .from("pdm_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading PDM applications:", error);
      return;
    }

    setPdmApplications(data || []);
  };

  const loadUserRoles = async () => {
    const { data: rolesData, error: rolesError } = await supabase
      .from("user_roles")
      .select("id, user_id, role")
      .order("role", { ascending: true });

    if (rolesError) {
      console.error("Error loading user roles:", rolesError);
      return;
    }

    if (!rolesData) {
      setUserRoles([]);
      return;
    }

    // Fetch profiles for each user
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, discord_username")
      .in("id", rolesData.map(r => r.user_id));

    const rolesWithProfiles = rolesData.map(role => ({
      ...role,
      discord_username: profilesData?.find(p => p.id === role.user_id)?.discord_username,
    }));

    setUserRoles(rolesWithProfiles);
  };

  const loadApplications = async () => {
    const { data, error } = await supabase
      .from("whitelist_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading applications:", error);
      return;
    }

    setApplications(data || []);
  };

  const loadSubmissions = async () => {
    const { data, error } = await supabase
      .from("gallery_submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading submissions:", error);
      return;
    }

    setSubmissions(data || []);
  };

  const loadBanAppeals = async () => {
    const { data, error } = await supabase
      .from("ban_appeals")
      .select("*")
      .order("created_at", { ascending: false});

    if (error) {
      console.error("Error loading ban appeals:", error);
      return;
    }

    setBanAppeals(data || []);
  };

  const loadStaffMembers = async () => {
    const { data, error } = await supabase
      .from("staff_members")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error loading staff members:", error);
      return;
    }

    setStaffMembers(data || []);
  };

  const loadJobApplications = async () => {
    const { data, error } = await supabase
      .from("job_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading job applications:", error);
      return;
    }

    setJobApplications(data || []);
  };

  const deleteStaffMember = async (id: string) => {
    const { error } = await supabase
      .from("staff_members")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete staff member.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Staff member deleted successfully.",
    });

    setStaffToDelete(null);
    loadStaffMembers();
  };

  const updateUserRole = async (userId: string, newRole: "admin" | "moderator" | "user") => {
    const { error } = await supabase
      .from("user_roles")
      .update({ role: newRole })
      .eq("user_id", userId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update user role.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "User role updated successfully.",
    });

    loadUserRoles();
  };

  const updateApplicationStatus = async (
    appId: string,
    status: "approved" | "rejected"
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get the application details for Discord role assignment
    const application = applications.find(a => a.id === appId);
    
    const { error } = await supabase
      .from("whitelist_applications")
      .update({
        status,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: adminNotes || null,
      })
      .eq("id", appId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update application.",
        variant: "destructive",
      });
      return;
    }

    // If approved, try to assign Discord role
    if (status === "approved" && application) {
      try {
        // Extract Discord ID from the discord field (could be username or ID)
        const discordValue = application.discord;
        
        // Try to assign the Discord role
        const { error: roleError } = await supabase.functions.invoke('assign-discord-role', {
          body: {
            userId: application.user_id,
            discordUserId: discordValue,
            action: 'add'
          }
        });

        if (roleError) {
          console.error("Error assigning Discord role:", roleError);
          toast({
            title: "Partial Success",
            description: "Application approved, but Discord role assignment failed. Please assign the role manually.",
            variant: "default",
          });
        } else {
          toast({
            title: "Success",
            description: "Application approved and Discord role assigned successfully.",
          });
        }
      } catch (roleError) {
        console.error("Error invoking Discord role function:", roleError);
        toast({
          title: "Partial Success",
          description: "Application approved, but Discord role assignment failed.",
          variant: "default",
        });
      }
    } else {
      toast({
        title: "Success",
        description: `Application ${status} successfully.`,
      });
    }

    setSelectedApp(null);
    setAdminNotes("");
    loadApplications();
  };

  const updateSubmissionStatus = async (
    submissionId: string,
    status: "approved" | "rejected"
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const updateData: any = {
      status,
      approved_by: status === "approved" ? user?.id : null,
      approved_at: status === "approved" ? new Date().toISOString() : null,
    };

    if (status === "rejected") {
      updateData.rejection_reason = rejectionReason || null;
    }

    const { error } = await supabase
      .from("gallery_submissions")
      .update(updateData)
      .eq("id", submissionId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update submission.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: `Submission ${status} successfully.`,
    });

    setSelectedSubmission(null);
    setRejectionReason("");
    loadSubmissions();
  };

  const updateBanAppealStatus = async (
    appealId: string,
    status: "approved" | "rejected"
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const appeal = banAppeals.find(a => a.id === appealId);
    if (!appeal) return;

    const { error: updateError } = await supabase
      .from("ban_appeals")
      .update({
        status,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: appealAdminNotes || null,
      })
      .eq("id", appealId);

    if (updateError) {
      toast({
        title: "Error",
        description: "Failed to update ban appeal.",
        variant: "destructive",
      });
      return;
    }

    // Send email notification
    try {
      const { error: emailError } = await supabase.functions.invoke('send-ban-appeal-notification', {
        body: {
          userId: appeal.user_id,
          discordUsername: appeal.discord_username,
          status,
          adminNotes: appealAdminNotes || undefined,
        }
      });

      if (emailError) {
        console.error("Error sending email notification:", emailError);
        toast({
          title: "Warning",
          description: "Ban appeal updated but email notification failed.",
          variant: "default",
        });
      } else {
        toast({
          title: "Success",
          description: `Ban appeal ${status} and notification sent.`,
        });
      }
    } catch (error) {
      console.error("Error invoking notification function:", error);
      toast({
        title: "Success",
        description: `Ban appeal ${status} (email notification pending).`,
      });
    }

    setSelectedAppeal(null);
    setAppealAdminNotes("");
    loadBanAppeals();
  };

  const updateJobApplicationStatus = async (
    jobAppId: string,
    status: "approved" | "rejected"
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from("job_applications")
      .update({
        status,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: jobAdminNotes || null,
      })
      .eq("id", jobAppId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update job application.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: `Job application ${status} successfully.`,
    });

    setSelectedJobApp(null);
    setJobAdminNotes("");
    loadJobApplications();
  };

  const updatePdmApplicationStatus = async (
    pdmAppId: string,
    status: "approved" | "rejected"
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from("pdm_applications")
      .update({
        status,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: pdmAdminNotes || null,
      })
      .eq("id", pdmAppId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update PDM application.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: `PDM application ${status} successfully.`,
    });

    setSelectedPdmApp(null);
    setPdmAdminNotes("");
    loadPdmApplications();
  };

  const updateCreatorApplicationStatus = async (
    creatorAppId: string,
    status: "approved" | "rejected"
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Find the application to get details for email
    const application = creatorApplications.find(a => a.id === creatorAppId);
    
    const { error } = await supabase
      .from("creator_applications")
      .update({
        status,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: creatorAdminNotes || null,
      })
      .eq("id", creatorAppId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update creator application.",
        variant: "destructive",
      });
      return;
    }

    // Send email notification
    if (application) {
      try {
        // Try to get email from user profile if user_id exists
        let applicantEmail: string | undefined;
        if (application.user_id) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("discord_username")
            .eq("id", application.user_id)
            .single();
          
          // Get email from auth.users via edge function would be ideal,
          // but for now we'll rely on discord username notification
        }

        const { error: notifyError } = await supabase.functions.invoke('send-creator-notification', {
          body: {
            applicantName: application.full_name,
            discordUsername: application.discord_username,
            status: status,
            adminNotes: creatorAdminNotes || undefined,
            channelUrl: application.channel_url,
            platform: application.platform,
          }
        });

        if (notifyError) {
          console.error("Error sending creator notification:", notifyError);
          toast({
            title: "Partial Success",
            description: `Application ${status}, but email notification failed.`,
            variant: "default",
          });
        } else {
          toast({
            title: "Success",
            description: `Creator application ${status} and notification sent.`,
          });
        }
      } catch (notifyError) {
        console.error("Error invoking notification function:", notifyError);
        toast({
          title: "Partial Success",
          description: `Application ${status}, but notification failed.`,
          variant: "default",
        });
      }
    } else {
      toast({
        title: "Success",
        description: `Creator application ${status} successfully.`,
      });
    }

    setSelectedCreatorApp(null);
    setCreatorAdminNotes("");
    loadCreatorApplications();
  };

  const getOwnershipProofUrl = (path: string | null) => {
    if (!path) return null;
    const { data } = supabase.storage.from('creator-proofs').getPublicUrl(path);
    return data.publicUrl;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader 
        title="Admin Dashboard"
        description="Manage users, applications, and content"
        backgroundImage={headerAdminBg}
      />
      
      <div className="container mx-auto px-4 py-12 space-y-8">
        {/* User Roles Section */}
        <Card className="glass-effect border-border/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle className="text-gradient">User Roles Management</CardTitle>
            </div>
            <CardDescription>View and manage user roles</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userRoles.map((userRole) => (
                  <TableRow key={userRole.id}>
                    <TableCell>
                      {userRole.discord_username || "Unknown User"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        userRole.role === "admin" ? "default" :
                        userRole.role === "moderator" ? "secondary" :
                        "outline"
                      }>
                        {userRole.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={userRole.role}
                        onValueChange={(value) => updateUserRole(userRole.user_id, value as "admin" | "moderator" | "user")}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Whitelist Applications Section */}
        <Card className="glass-effect border-border/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <CardTitle className="text-gradient">Whitelist Applications</CardTitle>
            </div>
            <CardDescription>Review and manage whitelist applications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {applications.map((app) => (
              <Card key={app.id} className="border-border/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{app.discord}</CardTitle>
                      <CardDescription>
                        Steam ID: {app.steam_id} | Age: {app.age}
                      </CardDescription>
                    </div>
                    <Badge variant={
                      app.status === "approved" ? "default" :
                      app.status === "rejected" ? "destructive" :
                      "secondary"
                    }>
                      {app.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Experience</h4>
                    <p className="text-sm text-muted-foreground">{app.experience}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Backstory</h4>
                    <p className="text-sm text-muted-foreground">{app.backstory}</p>
                  </div>
                  
                  {app.status === "pending" && (
                    <div className="space-y-3 pt-4 border-t">
                      <Textarea
                        placeholder="Admin notes (optional)"
                        value={selectedApp?.id === app.id ? adminNotes : ""}
                        onChange={(e) => {
                          setSelectedApp(app);
                          setAdminNotes(e.target.value);
                        }}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => updateApplicationStatus(app.id, "approved")}
                          className="bg-primary hover:bg-primary/90"
                        >
                          Approve
                        </Button>
                        <Button
                          onClick={() => updateApplicationStatus(app.id, "rejected")}
                          variant="destructive"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Gallery Submissions Section */}
        <Card className="glass-effect border-border/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Image className="w-5 h-5 text-primary" />
              <CardTitle className="text-gradient">Gallery Submissions</CardTitle>
            </div>
            <CardDescription>Review and manage gallery submissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {submissions.map((submission) => (
              <Card key={submission.id} className="border-border/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{submission.title}</CardTitle>
                      <CardDescription>
                        Category: {submission.category} | Type: {submission.file_type}
                      </CardDescription>
                    </div>
                    <Badge variant={
                      submission.status === "approved" ? "default" :
                      submission.status === "rejected" ? "destructive" :
                      "secondary"
                    }>
                      {submission.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {submission.description && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Description</h4>
                      <p className="text-sm text-muted-foreground">{submission.description}</p>
                    </div>
                  )}
                  
                  <div>
                    <img
                      src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/gallery/${submission.file_path}`}
                      alt={submission.title}
                      className="w-full max-w-md rounded-lg"
                    />
                  </div>
                  
                  {submission.status === "pending" && (
                    <div className="space-y-3 pt-4 border-t">
                      <Textarea
                        placeholder="Rejection reason (optional)"
                        value={selectedSubmission?.id === submission.id ? rejectionReason : ""}
                        onChange={(e) => {
                          setSelectedSubmission(submission);
                          setRejectionReason(e.target.value);
                        }}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => updateSubmissionStatus(submission.id, "approved")}
                          className="bg-primary hover:bg-primary/90"
                        >
                          Approve
                        </Button>
                        <Button
                          onClick={() => updateSubmissionStatus(submission.id, "rejected")}
                          variant="destructive"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Ban Appeals Section */}
        <Card className="glass-effect border-border/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Ban className="w-5 h-5 text-primary" />
              <CardTitle className="text-gradient">Ban Appeals</CardTitle>
            </div>
            <CardDescription>Review and manage ban appeals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {banAppeals.map((appeal) => (
              <Card key={appeal.id} className="border-border/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{appeal.discord_username}</CardTitle>
                      <CardDescription>
                        Steam ID: {appeal.steam_id} | Submitted: {new Date(appeal.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge variant={
                      appeal.status === "approved" ? "default" :
                      appeal.status === "rejected" ? "destructive" :
                      "secondary"
                    }>
                      {appeal.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Ban Reason</h4>
                    <p className="text-sm text-muted-foreground">{appeal.ban_reason}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Appeal Reason</h4>
                    <p className="text-sm text-muted-foreground">{appeal.appeal_reason}</p>
                  </div>
                  {appeal.additional_info && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Additional Information</h4>
                      <p className="text-sm text-muted-foreground">{appeal.additional_info}</p>
                    </div>
                  )}
                  
                  {appeal.status === "pending" && (
                    <div className="space-y-3 pt-4 border-t">
                      <Textarea
                        placeholder="Admin notes (optional)"
                        value={selectedAppeal?.id === appeal.id ? appealAdminNotes : ""}
                        onChange={(e) => {
                          setSelectedAppeal(appeal);
                          setAppealAdminNotes(e.target.value);
                        }}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => updateBanAppealStatus(appeal.id, "approved")}
                          className="bg-primary hover:bg-primary/90"
                        >
                          Approve
                        </Button>
                        <Button
                          onClick={() => updateBanAppealStatus(appeal.id, "rejected")}
                          variant="destructive"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {appeal.admin_notes && (
                    <div className="pt-4 border-t">
                      <h4 className="font-semibold text-sm mb-1">Admin Notes</h4>
                      <p className="text-sm text-muted-foreground">{appeal.admin_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Job Applications Section */}
        <Card className="glass-effect border-border/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              <CardTitle className="text-gradient">Job Applications</CardTitle>
            </div>
            <CardDescription>Review and manage job applications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {jobApplications.map((jobApp) => (
              <Card key={jobApp.id} className="border-border/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{jobApp.character_name}</CardTitle>
                      <CardDescription>
                        Position: {jobApp.job_type} | Age: {jobApp.age} | Phone: {jobApp.phone_number}
                      </CardDescription>
                    </div>
                    <Badge variant={
                      jobApp.status === "approved" ? "default" :
                      jobApp.status === "rejected" ? "destructive" :
                      "secondary"
                    }>
                      {jobApp.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Why Join</h4>
                    <p className="text-sm text-muted-foreground">{jobApp.why_join}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Previous Experience</h4>
                    <p className="text-sm text-muted-foreground">{jobApp.previous_experience}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Character Background</h4>
                    <p className="text-sm text-muted-foreground">{jobApp.character_background}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Availability</h4>
                    <p className="text-sm text-muted-foreground">{jobApp.availability}</p>
                  </div>
                  {jobApp.additional_info && (
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Additional Info</h4>
                      <p className="text-sm text-muted-foreground">{jobApp.additional_info}</p>
                    </div>
                  )}
                  
                  {jobApp.status === "pending" && (
                    <div className="space-y-3 pt-4 border-t">
                      <Textarea
                        placeholder="Admin notes (optional)"
                        value={selectedJobApp?.id === jobApp.id ? jobAdminNotes : ""}
                        onChange={(e) => {
                          setSelectedJobApp(jobApp);
                          setJobAdminNotes(e.target.value);
                        }}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => updateJobApplicationStatus(jobApp.id, "approved")}
                          className="bg-primary hover:bg-primary/90"
                        >
                          Approve
                        </Button>
                        <Button
                          onClick={() => updateJobApplicationStatus(jobApp.id, "rejected")}
                          variant="destructive"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {jobApp.admin_notes && (
                    <div className="pt-4 border-t">
                      <h4 className="font-semibold text-sm mb-1">Admin Notes</h4>
                      <p className="text-sm text-muted-foreground">{jobApp.admin_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Creator Program Applications Section */}
        <Card className="glass-effect border-border/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-purple-500" />
              <CardTitle className="text-gradient">Creator Program Applications</CardTitle>
            </div>
            <CardDescription>Review streamer and content creator applications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {creatorApplications.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No creator applications yet</p>
            ) : (
              creatorApplications.map((creatorApp) => (
                <Card key={creatorApp.id} className="border-purple-500/20">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{creatorApp.full_name}</h3>
                        <p className="text-sm text-muted-foreground">Discord: {creatorApp.discord_username}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          creatorApp.status === "approved" ? "default" :
                          creatorApp.status === "rejected" ? "destructive" :
                          "secondary"
                        }>
                          {creatorApp.status}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {creatorApp.platform}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Steam ID:</span>
                        <p className="font-medium">{creatorApp.steam_id}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Avg Viewers:</span>
                        <p className="font-medium">{creatorApp.average_viewers}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Frequency:</span>
                        <p className="font-medium capitalize">{creatorApp.content_frequency.replace(/-/g, ' ')}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Applied:</span>
                        <p className="font-medium">{new Date(creatorApp.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(creatorApp.channel_url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View Channel
                      </Button>
                      {creatorApp.ownership_proof_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const url = getOwnershipProofUrl(creatorApp.ownership_proof_url);
                            if (url) window.open(url, '_blank');
                          }}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          View Proof
                        </Button>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-sm mb-1">RP Experience</h4>
                      <p className="text-sm text-muted-foreground">{creatorApp.rp_experience}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Content Style</h4>
                      <p className="text-sm text-muted-foreground">{creatorApp.content_style}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Why Join SLRP?</h4>
                      <p className="text-sm text-muted-foreground">{creatorApp.why_join}</p>
                    </div>

                    {creatorApp.social_links && (
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Other Socials</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">{creatorApp.social_links}</p>
                      </div>
                    )}
                    
                    {creatorApp.status === "pending" && (
                      <div className="space-y-3 pt-4 border-t">
                        <Textarea
                          placeholder="Admin notes (optional)"
                          value={selectedCreatorApp?.id === creatorApp.id ? creatorAdminNotes : ""}
                          onChange={(e) => {
                            setSelectedCreatorApp(creatorApp);
                            setCreatorAdminNotes(e.target.value);
                          }}
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              setSelectedCreatorApp(creatorApp);
                              updateCreatorApplicationStatus(creatorApp.id, "approved");
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => {
                              setSelectedCreatorApp(creatorApp);
                              updateCreatorApplicationStatus(creatorApp.id, "rejected");
                            }}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {creatorApp.admin_notes && (
                      <div className="pt-4 border-t">
                        <h4 className="font-semibold text-sm mb-1">Admin Notes</h4>
                        <p className="text-sm text-muted-foreground">{creatorApp.admin_notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        {/* Staff Management Section */}
        <Card className="glass-effect border-border/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <UsersIcon className="w-5 h-5 text-primary" />
                  <CardTitle className="text-gradient">Staff Management</CardTitle>
                </div>
                <CardDescription>Manage staff members and their information</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate("/staff-setup")}
                  className="border-primary/50 text-primary hover:bg-primary/10"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Staff Setup
                </Button>
                <Button onClick={() => {
                  setSelectedStaff(null);
                  setIsStaffDialogOpen(true);
                }}>
                  Add Staff Member
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Discord</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffMembers.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell className="flex items-center gap-2">
                      {staff.discord_avatar && (
                        <img 
                          src={staff.discord_avatar} 
                          alt={staff.name}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <span className="font-medium">{staff.name}</span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{staff.role}</div>
                        <div className="text-xs text-muted-foreground capitalize">{staff.role_type}</div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{staff.department.replace("_", " ")}</TableCell>
                    <TableCell>{staff.discord_username || staff.discord_id}</TableCell>
                    <TableCell>
                      <Badge variant={staff.is_active ? "default" : "secondary"}>
                        {staff.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedStaff(staff);
                            setIsStaffDialogOpen(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setStaffToDelete(staff.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <StaffManagementDialog
        open={isStaffDialogOpen}
        onOpenChange={setIsStaffDialogOpen}
        staffMember={selectedStaff}
        onSuccess={loadStaffMembers}
      />

      <AlertDialog open={!!staffToDelete} onOpenChange={() => setStaffToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this staff member. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => staffToDelete && deleteStaffMember(staffToDelete)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;
