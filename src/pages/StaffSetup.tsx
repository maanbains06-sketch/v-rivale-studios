import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, Users, Shield, CheckCircle, AlertCircle } from "lucide-react";

interface StaffMember {
  id: string;
  name: string;
  discord_username: string;
  role_type: string;
  user_id: string | null;
  email: string | null;
}

const StaffSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);

    const hasAccess = roles?.some((r) => r.role === "admin");

    if (!hasAccess) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    setIsAdmin(true);
    fetchStaffMembers();
  };

  const fetchStaffMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("staff_members")
      .select("id, name, discord_username, role_type, user_id, email")
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error("Error fetching staff members:", error);
      toast({
        title: "Error",
        description: "Failed to fetch staff members.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setStaffMembers(data || []);
    setLoading(false);
  };

  const linkStaffMembers = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc("manual_link_staff_members");

      if (error) {
        throw error;
      }

      toast({
        title: "Staff Members Linked",
        description: `Successfully linked ${data?.length || 0} staff members to their accounts.`,
      });

      fetchStaffMembers();
    } catch (error) {
      console.error("Error linking staff members:", error);
      toast({
        title: "Error",
        description: "Failed to link staff members.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  const linkedCount = staffMembers.filter((s) => s.user_id).length;
  const unlinkedCount = staffMembers.filter((s) => !s.user_id).length;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Staff Setup</h1>
            <p className="text-muted-foreground">
              Connect staff members to their user accounts for support chat access
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="glass-effect border-border/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{staffMembers.length}</p>
                    <p className="text-xs text-muted-foreground">Total Staff</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-border/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{linkedCount}</p>
                    <p className="text-xs text-muted-foreground">Linked</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-border/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{unlinkedCount}</p>
                    <p className="text-xs text-muted-foreground">Unlinked</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-effect border-primary/20 mb-8 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                How Staff Account Linking Works
              </CardTitle>
              <CardDescription>Automatic and manual linking options for staff members</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Automatic Linking (New Signups)</h3>
                <p className="text-sm text-muted-foreground">
                  When a staff member signs up with a Discord username that matches their staff record, they are
                  automatically:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  <li>Linked to their staff member profile</li>
                  <li>Assigned appropriate role (Admin/Moderator based on role_type)</li>
                  <li>Given staff availability settings</li>
                  <li>Enabled for support chat notifications</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Manual Linking (Existing Users)</h3>
                <p className="text-sm text-muted-foreground">
                  Click the button below to link all existing users whose Discord username matches a staff member.
                </p>
                <Button onClick={linkStaffMembers} disabled={loading || unlinkedCount === 0} className="mt-3">
                  <UserCheck className="w-4 h-4 mr-2" />
                  Link Staff Members
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border/20">
            <CardHeader>
              <CardTitle>Staff Members</CardTitle>
              <CardDescription>Connection status for all active staff members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {staffMembers.map((staff) => (
                  <div
                    key={staff.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          staff.user_id ? "bg-green-500/20 text-green-500" : "bg-orange-500/20 text-orange-500"
                        }`}
                      >
                        {staff.user_id ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-medium">{staff.name}</p>
                        <p className="text-sm text-muted-foreground">{staff.discord_username}</p>
                        {staff.email && <p className="text-xs text-muted-foreground">{staff.email}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={staff.role_type === "owner" || staff.role_type === "admin" ? "default" : "outline"}
                      >
                        {staff.role_type}
                      </Badge>
                      <Badge variant={staff.user_id ? "default" : "secondary"}>
                        {staff.user_id ? "Linked" : "Not Linked"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StaffSetup;
