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
import { Loader2, Shield, FileText, Image } from "lucide-react";
import headerAdminBg from "@/assets/header-staff.jpg";

interface UserRole {
  id: string;
  user_id: string;
  role: "admin" | "moderator" | "user";
  discord_username?: string;
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

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [applications, setApplications] = useState<WhitelistApplication[]>([]);
  const [submissions, setSubmissions] = useState<GallerySubmission[]>([]);
  
  const [selectedApp, setSelectedApp] = useState<WhitelistApplication | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  
  const [selectedSubmission, setSelectedSubmission] = useState<GallerySubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

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

      // Check if user has admin role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (roleError || !roleData) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page.",
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
    ]);
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

    toast({
      title: "Success",
      description: `Application ${status} successfully.`,
    });

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
      </div>
    </div>
  );
};

export default Admin;
