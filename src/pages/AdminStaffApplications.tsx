import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface StaffApplication {
  id: string;
  full_name: string;
  age: number;
  discord_username: string;
  in_game_name: string;
  position: string;
  playtime: string;
  experience: string;
  why_join: string;
  availability: string;
  previous_experience: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const AdminStaffApplications = () => {
  const [applications, setApplications] = useState<StaffApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedApp, setSelectedApp] = useState<StaffApplication | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  async function checkAdminAccess() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["admin", "moderator"]);

      if (!roles || roles.length === 0) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      fetchApplications();
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/");
    }
  }

  async function fetchApplications() {
    try {
      const { data, error } = await supabase
        .from("staff_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast({
        title: "Error",
        description: "Failed to load applications.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function updateApplication(appId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (newStatus) {
        updateData.status = newStatus;
        updateData.reviewed_at = new Date().toISOString();
        updateData.reviewed_by = user?.id;
      }

      if (adminNotes) {
        updateData.admin_notes = adminNotes;
      }

      const { error } = await supabase
        .from("staff_applications")
        .update(updateData)
        .eq("id", appId);

      if (error) throw error;

      toast({
        title: "Updated Successfully",
        description: "Application has been updated.",
      });

      setSelectedApp(null);
      setAdminNotes("");
      setNewStatus("");
      fetchApplications();
    } catch (error) {
      console.error("Error updating application:", error);
      toast({
        title: "Error",
        description: "Failed to update application.",
        variant: "destructive",
      });
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const filterByStatus = (status: string) => {
    return applications.filter(app => app.status === status);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gradient mb-2">Staff Applications Management</h1>
          <p className="text-muted-foreground">Review and manage staff applications</p>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="pending">Pending ({filterByStatus("pending").length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({filterByStatus("approved").length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({filterByStatus("rejected").length})</TabsTrigger>
          </TabsList>

          {["pending", "approved", "rejected"].map((status) => (
            <TabsContent key={status} value={status} className="space-y-4">
              {filterByStatus(status).length === 0 ? (
                <Card className="glass-effect">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No {status} applications
                  </CardContent>
                </Card>
              ) : (
                filterByStatus(status).map((app) => (
                  <Card key={app.id} className="glass-effect">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">{app.full_name}</CardTitle>
                          <CardDescription>
                            Applied for: <span className="font-semibold">{app.position}</span> • {new Date(app.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        {getStatusBadge(app.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-semibold text-primary">Contact Info</p>
                          <p className="text-sm">Discord: {app.discord_username}</p>
                          <p className="text-sm">In-Game: {app.in_game_name}</p>
                          <p className="text-sm">Age: {app.age}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-primary">Playtime</p>
                          <p className="text-sm">{app.playtime}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-primary mb-1">Experience</p>
                        <p className="text-sm text-muted-foreground">{app.experience}</p>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-primary mb-1">Why Join</p>
                        <p className="text-sm text-muted-foreground">{app.why_join}</p>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-primary mb-1">Availability</p>
                        <p className="text-sm text-muted-foreground">{app.availability}</p>
                      </div>

                      {app.previous_experience && (
                        <div>
                          <p className="text-sm font-semibold text-primary mb-1">Previous Experience</p>
                          <p className="text-sm text-muted-foreground">{app.previous_experience}</p>
                        </div>
                      )}

                      {app.admin_notes && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm font-semibold text-primary mb-1">Admin Notes</p>
                          <p className="text-sm">{app.admin_notes}</p>
                        </div>
                      )}

                      {selectedApp?.id === app.id ? (
                        <div className="space-y-4 pt-4 border-t">
                          <div>
                            <label className="text-sm font-semibold text-primary mb-2 block">Update Status</label>
                            <Select value={newStatus} onValueChange={setNewStatus}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select new status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-sm font-semibold text-primary mb-2 block">Admin Notes</label>
                            <Textarea
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                              placeholder="Add notes about this application..."
                              className="min-h-[100px]"
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button onClick={() => updateApplication(app.id)} className="bg-primary">
                              Save Changes
                            </Button>
                            <Button variant="outline" onClick={() => {
                              setSelectedApp(null);
                              setAdminNotes("");
                              setNewStatus("");
                            }}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button onClick={() => {
                          setSelectedApp(app);
                          setAdminNotes(app.admin_notes || "");
                          setNewStatus(app.status);
                        }}>
                          Review Application
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
};

export default AdminStaffApplications;
