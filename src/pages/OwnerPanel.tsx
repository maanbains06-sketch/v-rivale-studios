import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  Shield, 
  Settings, 
  Users, 
  Briefcase,
  Crown,
  Save,
  Eye,
  Car
} from "lucide-react";
import headerAdminBg from "@/assets/header-staff.jpg";

interface SiteSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
}

interface UserRole {
  id: string;
  user_id: string;
  role: "admin" | "moderator" | "user";
  discord_username?: string;
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

const OwnerPanel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [pdmApplications, setPdmApplications] = useState<PDMApplication[]>([]);
  const [editedSettings, setEditedSettings] = useState<Record<string, string>>({});
  const [selectedPdmApp, setSelectedPdmApp] = useState<PDMApplication | null>(null);
  const [pdmAdminNotes, setPdmAdminNotes] = useState("");

  useEffect(() => {
    checkOwnerAccess();
  }, []);

  const checkOwnerAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Get owner discord ID from settings
      const { data: ownerSetting } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "owner_discord_id")
        .single();

      // Get user's profile to check discord ID
      const { data: profile } = await supabase
        .from("profiles")
        .select("discord_username")
        .eq("id", user.id)
        .single();

      // Also check staff_members for discord_id match
      const { data: staffMember } = await supabase
        .from("staff_members")
        .select("discord_id, role_type")
        .eq("user_id", user.id)
        .single();

      const ownerDiscordId = ownerSetting?.value;
      const userDiscordId = staffMember?.discord_id;
      const isOwnerRole = staffMember?.role_type === "owner";

      // Check if user is the owner (by discord ID or by role_type)
      if (!ownerDiscordId || ownerDiscordId === "") {
        // If no owner ID set, allow admins to set it up initially
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (!roleData) {
          toast({
            title: "Access Denied",
            description: "Owner Panel is not yet configured. Contact the server owner.",
            variant: "destructive",
          });
          navigate("/");
          return;
        }
      } else if (userDiscordId !== ownerDiscordId && !isOwnerRole) {
        toast({
          title: "Access Denied",
          description: "Only the server owner can access this panel.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsOwner(true);
      await loadAllData();
    } catch (error) {
      console.error("Error checking owner access:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadAllData = async () => {
    await Promise.all([
      loadSettings(),
      loadUserRoles(),
      loadPdmApplications(),
    ]);
  };

  const loadSettings = async () => {
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .order("key");

    if (error) {
      console.error("Error loading settings:", error);
      return;
    }

    setSettings(data || []);
    const settingsMap: Record<string, string> = {};
    data?.forEach(s => settingsMap[s.key] = s.value);
    setEditedSettings(settingsMap);
  };

  const loadUserRoles = async () => {
    const { data: rolesData, error } = await supabase
      .from("user_roles")
      .select("id, user_id, role")
      .order("role");

    if (error) {
      console.error("Error loading user roles:", error);
      return;
    }

    if (!rolesData) {
      setUserRoles([]);
      return;
    }

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

  const saveSetting = async (key: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from("site_settings")
      .update({
        value: editedSettings[key],
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq("key", key);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save setting.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Setting saved successfully.",
    });
    loadSettings();
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

  const updatePdmApplicationStatus = async (appId: string, status: "approved" | "rejected") => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from("pdm_applications")
      .update({
        status,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: pdmAdminNotes || null,
      })
      .eq("id", appId);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isOwner) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader 
        title="Owner Panel"
        description="Complete control over your server"
        badge="Owner Access Only"
        backgroundImage={headerAdminBg}
      />
      
      <div className="container mx-auto px-4 py-12">
        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Site Settings</span>
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">User Roles</span>
            </TabsTrigger>
            <TabsTrigger value="pdm" className="flex items-center gap-2">
              <Car className="w-4 h-4" />
              <span className="hidden sm:inline">PDM Applications</span>
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              <span className="hidden sm:inline">Permissions</span>
            </TabsTrigger>
          </TabsList>

          {/* Site Settings Tab */}
          <TabsContent value="settings">
            <Card className="glass-effect border-border/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  <CardTitle className="text-gradient">Site Settings</CardTitle>
                </div>
                <CardDescription>Configure global site settings including Discord integration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Discord Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gradient">Discord Configuration</h3>
                  
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>Discord Server ID</Label>
                      <div className="flex gap-2">
                        <Input
                          value={editedSettings["discord_server_id"] || ""}
                          onChange={(e) => setEditedSettings({...editedSettings, discord_server_id: e.target.value})}
                          placeholder="Enter your Discord server ID"
                        />
                        <Button onClick={() => saveSetting("discord_server_id")}>
                          <Save className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Used for Discord role assignment</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Whitelist Role ID</Label>
                      <div className="flex gap-2">
                        <Input
                          value={editedSettings["whitelist_discord_role_id"] || ""}
                          onChange={(e) => setEditedSettings({...editedSettings, whitelist_discord_role_id: e.target.value})}
                          placeholder="Enter the whitelist role ID"
                        />
                        <Button onClick={() => saveSetting("whitelist_discord_role_id")}>
                          <Save className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Role assigned when whitelist is approved</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Staff Role ID</Label>
                      <div className="flex gap-2">
                        <Input
                          value={editedSettings["staff_discord_role_id"] || ""}
                          onChange={(e) => setEditedSettings({...editedSettings, staff_discord_role_id: e.target.value})}
                          placeholder="Enter the staff role ID"
                        />
                        <Button onClick={() => saveSetting("staff_discord_role_id")}>
                          <Save className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Role required for staff panel access</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Owner Discord ID</Label>
                      <div className="flex gap-2">
                        <Input
                          value={editedSettings["owner_discord_id"] || ""}
                          onChange={(e) => setEditedSettings({...editedSettings, owner_discord_id: e.target.value})}
                          placeholder="Enter your Discord user ID"
                        />
                        <Button onClick={() => saveSetting("owner_discord_id")}>
                          <Save className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Your Discord ID for Owner Panel access verification</p>
                    </div>
                  </div>
                </div>

                {/* Staff Page Settings */}
                <div className="space-y-4 pt-6 border-t border-border/20">
                  <h3 className="text-lg font-semibold text-gradient">Staff Page Settings</h3>
                  
                  <div className="space-y-2">
                    <Label>Open Positions</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={editedSettings["open_positions"] || "7"}
                        onChange={(e) => setEditedSettings({...editedSettings, open_positions: e.target.value})}
                        placeholder="Number of open positions"
                      />
                      <Button onClick={() => saveSetting("open_positions")}>
                        <Save className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Number displayed on the staff page</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Roles Tab */}
          <TabsContent value="roles">
            <Card className="glass-effect border-border/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <CardTitle className="text-gradient">User Roles Management</CardTitle>
                </div>
                <CardDescription>Manage admin and moderator access for all users</CardDescription>
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
                        <TableCell>{userRole.discord_username || "Unknown User"}</TableCell>
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
          </TabsContent>

          {/* PDM Applications Tab */}
          <TabsContent value="pdm">
            <Card className="glass-effect border-border/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-primary" />
                  <CardTitle className="text-gradient">PDM Applications</CardTitle>
                </div>
                <CardDescription>Review Premium Deluxe Motorsport job applications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pdmApplications.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No PDM applications yet</p>
                ) : (
                  pdmApplications.map((app) => (
                    <Card key={app.id} className="border-border/20">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{app.character_name}</CardTitle>
                            <CardDescription>
                              Age: {app.age} | Phone: {app.phone_number}
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
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold text-sm mb-1">Sales Experience</h4>
                            <p className="text-sm text-muted-foreground">{app.sales_experience}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm mb-1">Vehicle Knowledge</h4>
                            <p className="text-sm text-muted-foreground">{app.vehicle_knowledge}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Customer Scenario</h4>
                          <p className="text-sm text-muted-foreground">{app.customer_scenario}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Character Background</h4>
                          <p className="text-sm text-muted-foreground">{app.character_background}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Why Join PDM?</h4>
                          <p className="text-sm text-muted-foreground">{app.why_join}</p>
                        </div>
                        
                        {app.status === "pending" && (
                          <div className="space-y-3 pt-4 border-t">
                            <Textarea
                              placeholder="Admin notes (optional)"
                              value={selectedPdmApp?.id === app.id ? pdmAdminNotes : ""}
                              onChange={(e) => {
                                setSelectedPdmApp(app);
                                setPdmAdminNotes(e.target.value);
                              }}
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={() => updatePdmApplicationStatus(app.id, "approved")}
                                className="bg-primary hover:bg-primary/90"
                              >
                                Approve
                              </Button>
                              <Button
                                onClick={() => updatePdmApplicationStatus(app.id, "rejected")}
                                variant="destructive"
                              >
                                Reject
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions">
            <Card className="glass-effect border-border/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-primary" />
                  <CardTitle className="text-gradient">Panel Access Permissions</CardTitle>
                </div>
                <CardDescription>Overview of panel access levels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <h3 className="font-semibold flex items-center gap-2 mb-2">
                      <Crown className="w-4 h-4 text-primary" />
                      Owner Panel (This Panel)
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Full control over all settings, user roles, and applications.
                    </p>
                    <Badge>Verified by Discord ID: {editedSettings["owner_discord_id"] || "Not Set"}</Badge>
                  </div>

                  <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                    <h3 className="font-semibold flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-secondary" />
                      Admin Panel (/admin)
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Whitelist applications, ban appeals, gallery, staff management, job applications.
                    </p>
                    <Badge variant="secondary">Requires: Admin or Moderator role</Badge>
                  </div>

                  <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                    <h3 className="font-semibold flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-accent" />
                      Support Chat Panel (/admin/support-chat)
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Handle support tickets and user inquiries.
                    </p>
                    <Badge variant="outline">Requires: Staff member with active status</Badge>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50 border border-border/20">
                    <h3 className="font-semibold flex items-center gap-2 mb-2">
                      <Briefcase className="w-4 h-4" />
                      Staff Applications Panel (/admin-staff-applications)
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Review staff recruitment applications.
                    </p>
                    <Badge variant="outline">Requires: Admin or Moderator role</Badge>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/20">
                  <h4 className="font-semibold mb-3">Quick Links</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>
                      <Eye className="w-4 h-4 mr-2" />
                      Admin Panel
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate("/admin/support-chat")}>
                      <Eye className="w-4 h-4 mr-2" />
                      Support Chat
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate("/admin-staff-applications")}>
                      <Eye className="w-4 h-4 mr-2" />
                      Staff Applications
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OwnerPanel;