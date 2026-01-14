import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOwnerAuditLog } from "@/hooks/useOwnerAuditLog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Owner2FAVerification } from "@/components/Owner2FAVerification";
import { OwnerAuditLog } from "@/components/OwnerAuditLog";
import { 
  Loader2, 
  Shield, 
  Settings, 
  Users, 
  Briefcase,
  Crown,
  Save,
  Eye,
  Car,
  History,
  Clock,
  MessageSquare,
  Star,
  Check,
  X,
  Pencil,
  Trash2
} from "lucide-react";
import { StaffManagementDialog } from "@/components/StaffManagementDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import headerAdminBg from "@/assets/header-staff.jpg";

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const WARNING_BEFORE_LOGOUT = 2 * 60 * 1000; // 2 minutes warning

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

interface Testimonial {
  id: string;
  player_name: string;
  player_role: string | null;
  testimonial: string;
  rating: number;
  is_featured: boolean;
  created_at: string;
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

const OwnerPanel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logAction } = useOwnerAuditLog();
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [pdmApplications, setPdmApplications] = useState<PDMApplication[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMemberData[]>([]);
  const [editedSettings, setEditedSettings] = useState<Record<string, string>>({});
  const [selectedPdmApp, setSelectedPdmApp] = useState<PDMApplication | null>(null);
  const [pdmAdminNotes, setPdmAdminNotes] = useState("");
  const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMemberData | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<string | null>(null);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  
  const lastActivityRef = useRef<number>(Date.now());
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const logoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Reset activity timer
  const resetActivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowInactivityWarning(false);
    
    // Clear existing timeouts
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    // Set warning timeout (28 minutes)
    warningTimeoutRef.current = setTimeout(() => {
      setShowInactivityWarning(true);
      setRemainingTime(WARNING_BEFORE_LOGOUT / 1000);
      
      // Start countdown
      countdownRef.current = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, INACTIVITY_TIMEOUT - WARNING_BEFORE_LOGOUT);
    
    // Set logout timeout (30 minutes)
    logoutTimeoutRef.current = setTimeout(() => {
      handleInactivityLogout();
    }, INACTIVITY_TIMEOUT);
  }, []);

  // Handle inactivity logout
  const handleInactivityLogout = useCallback(async () => {
    await logAction({
      actionType: 'security_change',
      actionDescription: 'Session ended due to 30 minutes of inactivity'
    });
    
    setIsVerified(false);
    setShowInactivityWarning(false);
    
    toast({
      title: "Session Expired",
      description: "You have been logged out due to 30 minutes of inactivity.",
      variant: "destructive",
    });
  }, [logAction, toast]);

  // Set up activity listeners
  useEffect(() => {
    if (!isVerified) return;
    
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      resetActivityTimer();
    };
    
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity);
    });
    
    // Initial timer setup
    resetActivityTimer();
    
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isVerified, resetActivityTimer]);

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

      setUserEmail(user.email || "");

      // Use server-side is_owner() function for secure verification
      const { data: isOwnerResult, error } = await supabase
        .rpc('is_owner', { _user_id: user.id });

      if (error) {
        console.error("Error checking owner status:", error);
        toast({
          title: "Error",
          description: "Failed to verify owner access.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      if (!isOwnerResult) {
        // Send notification to owner about unauthorized access
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("discord_username")
            .eq("id", user.id)
            .single();

          await supabase.functions.invoke("notify-unauthorized-owner-access", {
            body: {
              attempted_user_id: user.id,
              attempted_user_email: user.email,
              attempted_discord_username: profile?.discord_username,
            },
          });
        } catch (notifyError) {
          console.error("Failed to send unauthorized access notification:", notifyError);
        }

        toast({
          title: "Access Denied",
          description: "Only the server owner can access this panel.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsOwner(true);

      // Check if session is already verified (within 30 minutes)
      const { data: sessionVerified } = await supabase.rpc('is_owner_session_verified');
      
      if (sessionVerified) {
        setIsVerified(true);
        await loadAllData();
      }
    } catch (error) {
      console.error("Error checking owner access:", error);
      toast({
        title: "Error",
        description: "Failed to verify owner access.",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationComplete = async () => {
    setIsVerified(true);
    await loadAllData();
    
    // Log the access
    await logAction({
      actionType: 'security_change',
      actionDescription: 'Owner panel access verified via 2FA'
    });
  };

  const loadAllData = async () => {
    await Promise.all([
      loadSettings(),
      loadUserRoles(),
      loadPdmApplications(),
      loadTestimonials(),
      loadStaffMembers(),
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

  const loadTestimonials = async () => {
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading testimonials:", error);
      return;
    }

    setTestimonials(data || []);
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

  const deleteStaffMember = async (id: string) => {
    const staff = staffMembers.find(s => s.id === id);
    
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

    await logAction({
      actionType: 'staff_delete',
      actionDescription: `Deleted staff member "${staff?.name}"`,
      targetTable: 'staff_members',
      targetId: id,
    });

    toast({
      title: "Success",
      description: "Staff member deleted successfully.",
    });

    setStaffToDelete(null);
    loadStaffMembers();
  };

  const updateTestimonialStatus = async (id: string, isFeatured: boolean) => {
    const testimonial = testimonials.find(t => t.id === id);
    
    const { error } = await supabase
      .from("testimonials")
      .update({ is_featured: isFeatured })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update testimonial.",
        variant: "destructive",
      });
      return;
    }

    await logAction({
      actionType: 'feedback_update',
      actionDescription: `${isFeatured ? 'Approved' : 'Rejected'} feedback from "${testimonial?.player_name}"`,
      targetTable: 'testimonials',
      targetId: id,
      oldValue: { is_featured: testimonial?.is_featured },
      newValue: { is_featured: isFeatured }
    });

    toast({
      title: "Success",
      description: `Feedback ${isFeatured ? 'approved and featured' : 'hidden'} successfully.`,
    });
    loadTestimonials();
  };

  const deleteTestimonial = async (id: string) => {
    const testimonial = testimonials.find(t => t.id === id);
    
    const { error } = await supabase
      .from("testimonials")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete testimonial.",
        variant: "destructive",
      });
      return;
    }

    await logAction({
      actionType: 'feedback_delete',
      actionDescription: `Deleted feedback from "${testimonial?.player_name}"`,
      targetTable: 'testimonials',
      targetId: id,
    });

    toast({
      title: "Success",
      description: "Feedback deleted successfully.",
    });
    loadTestimonials();
  };

  const saveSetting = async (key: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const oldValue = settings.find(s => s.key === key)?.value;
    
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

    // Log the action
    await logAction({
      actionType: 'setting_update',
      actionDescription: `Updated setting "${key}"`,
      targetTable: 'site_settings',
      oldValue: { key, value: oldValue },
      newValue: { key, value: editedSettings[key] }
    });

    toast({
      title: "Success",
      description: "Setting saved successfully.",
    });
    loadSettings();
  };

  const updateUserRole = async (userId: string, newRole: "admin" | "moderator" | "user") => {
    const oldRole = userRoles.find(r => r.user_id === userId)?.role;
    const username = userRoles.find(r => r.user_id === userId)?.discord_username;
    
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

    // Log the action
    await logAction({
      actionType: 'role_update',
      actionDescription: `Changed role for user "${username || userId}" from "${oldRole}" to "${newRole}"`,
      targetTable: 'user_roles',
      targetId: userId,
      oldValue: { role: oldRole },
      newValue: { role: newRole }
    });

    toast({
      title: "Success",
      description: "User role updated successfully.",
    });
    loadUserRoles();
  };

  const updatePdmApplicationStatus = async (appId: string, status: "approved" | "rejected") => {
    const { data: { user } } = await supabase.auth.getUser();
    const app = pdmApplications.find(a => a.id === appId);
    
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

    // Log the action
    await logAction({
      actionType: 'application_update',
      actionDescription: `${status === 'approved' ? 'Approved' : 'Rejected'} PDM application for "${app?.character_name}"`,
      targetTable: 'pdm_applications',
      targetId: appId,
      oldValue: { status: app?.status },
      newValue: { status, admin_notes: pdmAdminNotes }
    });

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

  // Show 2FA verification if not verified
  if (!isVerified) {
    return (
      <Owner2FAVerification 
        userEmail={userEmail} 
        onVerified={handleVerificationComplete} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Inactivity Warning Modal */}
      {showInactivityWarning && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <Card className="w-full max-w-md glass-effect border-destructive/50 animate-pulse">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-xl text-destructive">Session Timeout Warning</CardTitle>
              <CardDescription>
                You will be logged out due to inactivity
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="text-4xl font-mono font-bold text-destructive">
                {Math.floor(remainingTime / 60)}:{(remainingTime % 60).toString().padStart(2, '0')}
              </div>
              <p className="text-sm text-muted-foreground">
                Move your mouse or press any key to stay logged in
              </p>
              <Button 
                onClick={resetActivityTimer} 
                className="w-full"
              >
                I'm Still Here - Keep Me Logged In
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <Navigation />
      <PageHeader 
        title="Owner Panel"
        description="Complete control over your server"
        badge="Owner Access Only"
        backgroundImage={headerAdminBg}
      />
      
      <div className="container mx-auto px-4 py-12">
        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-flex">
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Site Settings</span>
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">User Roles</span>
            </TabsTrigger>
            <TabsTrigger value="staff" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Staff</span>
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Feedback</span>
            </TabsTrigger>
            <TabsTrigger value="pdm" className="flex items-center gap-2">
              <Car className="w-4 h-4" />
              <span className="hidden sm:inline">PDM Applications</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Audit Log</span>
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

                  <div className="space-y-2">
                    <Label>Enabled Staff Positions (comma-separated)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={editedSettings["staff_positions_enabled"] || "administrator,moderator,support_staff,event_coordinator"}
                        onChange={(e) => setEditedSettings({...editedSettings, staff_positions_enabled: e.target.value})}
                        placeholder="administrator,moderator,support_staff"
                      />
                      <Button onClick={() => saveSetting("staff_positions_enabled")}>
                        <Save className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Available: administrator, moderator, developer, support_staff, event_coordinator, content_creator</p>
                  </div>
                </div>

                {/* Server Settings */}
                <div className="space-y-4 pt-6 border-t border-border/20">
                  <h3 className="text-lg font-semibold text-gradient">Server Settings</h3>
                  
                  <div className="space-y-2">
                    <Label>FiveM Server Connect URL</Label>
                    <div className="flex gap-2">
                      <Input
                        value={editedSettings["fivem_server_connect"] || "fivem://connect/cfx.re/join/abc123"}
                        onChange={(e) => setEditedSettings({...editedSettings, fivem_server_connect: e.target.value})}
                        placeholder="fivem://connect/cfx.re/join/YOUR_CODE"
                      />
                      <Button onClick={() => saveSetting("fivem_server_connect")}>
                        <Save className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Direct connect URL for the "Join Server" button</p>
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

          {/* Staff Management Tab */}
          <TabsContent value="staff">
            <Card className="glass-effect border-border/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
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
          </TabsContent>

          {/* Community Feedback Tab */}
          <TabsContent value="feedback">
            <Card className="glass-effect border-border/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <CardTitle className="text-gradient">Community Feedback</CardTitle>
                </div>
                <CardDescription>Review and manage community testimonials and feedback submissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Pending Feedback */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Badge variant="secondary">{testimonials.filter(t => !t.is_featured).length}</Badge>
                    Pending Review
                  </h3>
                  {testimonials.filter(t => !t.is_featured).length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No pending feedback</p>
                  ) : (
                    testimonials.filter(t => !t.is_featured).map((feedback) => (
                      <Card key={feedback.id} className="border-border/20 bg-background/30">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold">{feedback.player_name}</span>
                                {feedback.player_role && (
                                  <Badge variant="outline" className="text-xs">{feedback.player_role}</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1 mb-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-4 h-4 ${star <= feedback.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}`}
                                  />
                                ))}
                              </div>
                              <p className="text-sm text-muted-foreground italic">"{feedback.testimonial}"</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                Submitted: {new Date(feedback.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => updateTestimonialStatus(feedback.id, true)}
                                className="bg-primary hover:bg-primary/90"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteTestimonial(feedback.id)}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>

                {/* Approved/Featured Feedback */}
                <div className="space-y-4 pt-6 border-t border-border/20">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Badge>{testimonials.filter(t => t.is_featured).length}</Badge>
                    Featured Feedback
                  </h3>
                  {testimonials.filter(t => t.is_featured).length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No featured feedback yet</p>
                  ) : (
                    testimonials.filter(t => t.is_featured).map((feedback) => (
                      <Card key={feedback.id} className="border-border/20 bg-primary/5">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold">{feedback.player_name}</span>
                                {feedback.player_role && (
                                  <Badge variant="outline" className="text-xs">{feedback.player_role}</Badge>
                                )}
                                <Badge className="text-xs bg-primary/20 text-primary">Featured</Badge>
                              </div>
                              <div className="flex items-center gap-1 mb-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-4 h-4 ${star <= feedback.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}`}
                                  />
                                ))}
                              </div>
                              <p className="text-sm text-muted-foreground italic">"{feedback.testimonial}"</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateTestimonialStatus(feedback.id, false)}
                              >
                                Hide
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteTestimonial(feedback.id)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
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

          {/* Audit Log Tab */}
          <TabsContent value="audit">
            <OwnerAuditLog />
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

export default OwnerPanel;