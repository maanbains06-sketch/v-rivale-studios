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
import { LiveMemberJoins } from "@/components/LiveMemberJoins";
import { EnhancedSiteSettings } from "@/components/EnhancedSiteSettings";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Trash2,
  RefreshCw,
  UserCircle,
  UserPlus,
  FileText,
  AlertTriangle,
  Flame,
  Tv,
  Gavel,
  Scale,
  Siren,
  Ambulance,
  Wrench,
  Youtube
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  discord_id?: string;
  discord_avatar?: string;
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

interface WhitelistApplication {
  id: string;
  user_id: string;
  discord: string;
  discord_id?: string;
  age: number;
  experience: string;
  backstory: string;
  status: string;
  created_at: string;
  admin_notes?: string;
}

interface JobApplication {
  id: string;
  user_id: string;
  job_type: string;
  character_name: string;
  age: number;
  phone_number: string;
  previous_experience: string;
  why_join: string;
  character_background: string;
  availability: string;
  status: string;
  created_at: string;
  admin_notes?: string;
}

interface StaffApplication {
  id: string;
  user_id: string;
  full_name: string;
  discord_username: string;
  age: number;
  position: string;
  experience: string;
  why_join: string;
  availability: string;
  status: string;
  created_at: string;
  admin_notes?: string;
}

interface BanAppeal {
  id: string;
  user_id: string;
  discord_username: string;
  steam_id: string;
  ban_reason: string;
  appeal_reason: string;
  additional_info?: string;
  status: string;
  created_at: string;
  admin_notes?: string;
}

interface CreatorApplication {
  id: string;
  user_id: string;
  full_name: string;
  discord_username: string;
  platform: string;
  channel_url: string;
  average_viewers: string;
  content_style: string;
  content_frequency: string;
  rp_experience: string;
  why_join: string;
  status: string;
  created_at: string;
  admin_notes?: string;
}

interface GangApplication {
  id: string;
  user_id: string;
  gang_name: string;
  leader_name: string;
  member_count: number;
  gang_backstory: string;
  territory_plans: string;
  activity_level: string;
  status: string;
  created_at: string;
  admin_notes?: string;
}

interface FirefighterApplication {
  id: string;
  user_id: string;
  real_name: string;
  discord_id: string;
  in_game_name: string;
  steam_id: string;
  weekly_availability: string;
  status: string;
  created_at: string;
  admin_notes?: string;
}

interface WeazelNewsApplication {
  id: string;
  user_id: string;
  character_name: string;
  age: number;
  phone_number: string;
  journalism_experience: string;
  writing_sample: string;
  camera_skills: string;
  interview_scenario: string;
  why_join: string;
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
  const [whitelistApplications, setWhitelistApplications] = useState<WhitelistApplication[]>([]);
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [staffApplications, setStaffApplications] = useState<StaffApplication[]>([]);
  const [banAppeals, setBanAppeals] = useState<BanAppeal[]>([]);
  const [creatorApplications, setCreatorApplications] = useState<CreatorApplication[]>([]);
  const [gangApplications, setGangApplications] = useState<GangApplication[]>([]);
  const [firefighterApplications, setFirefighterApplications] = useState<FirefighterApplication[]>([]);
  const [weazelNewsApplications, setWeazelNewsApplications] = useState<WeazelNewsApplication[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMemberData[]>([]);
  const [editedSettings, setEditedSettings] = useState<Record<string, string>>({});
  const [selectedPdmApp, setSelectedPdmApp] = useState<PDMApplication | null>(null);
  const [pdmAdminNotes, setPdmAdminNotes] = useState("");
  const [selectedAppType, setSelectedAppType] = useState<string>("all");
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
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
      loadWhitelistApplications(),
      loadJobApplications(),
      loadStaffApplications(),
      loadBanAppeals(),
      loadCreatorApplications(),
      loadGangApplications(),
      loadFirefighterApplications(),
      loadWeazelNewsApplications(),
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
    // Use the new function to get all users with their Discord info
    const { data: usersData, error: usersError } = await supabase
      .rpc('get_all_users_for_owner');

    if (usersError) {
      console.error("Error loading users via RPC:", usersError);
      // Fallback to old method
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
        .select("id, discord_username, discord_id, discord_avatar")
        .in("id", rolesData.map(r => r.user_id));

      const rolesWithProfiles = rolesData.map(role => ({
        ...role,
        discord_username: profilesData?.find(p => p.id === role.user_id)?.discord_username,
        discord_id: profilesData?.find(p => p.id === role.user_id)?.discord_id,
        discord_avatar: profilesData?.find(p => p.id === role.user_id)?.discord_avatar,
      }));

      setUserRoles(rolesWithProfiles);
      return;
    }

    // Map the RPC results to our UserRole interface
    const mappedRoles = (usersData || []).map((user: any, index: number) => ({
      id: `user-${index}`,
      user_id: user.out_user_id,
      role: user.out_role as "admin" | "moderator" | "user",
      discord_username: user.out_discord_username,
      discord_id: user.out_discord_id,
      discord_avatar: user.out_discord_avatar,
    }));

    setUserRoles(mappedRoles);
  };

  const syncDiscordNames = async () => {
    toast({
      title: "Syncing Discord Names",
      description: "Fetching latest Discord info for all users...",
    });

    let successCount = 0;
    let errorCount = 0;

    for (const user of userRoles) {
      if (!user.discord_id) continue;

      try {
        const { data: discordData, error: fetchError } = await supabase.functions.invoke('fetch-discord-user', {
          body: { discordId: user.discord_id }
        });

        if (fetchError || !discordData) {
          errorCount++;
          continue;
        }

        // Update the profile with synced Discord info
        const { error: updateError } = await supabase.rpc('sync_user_discord_info', {
          p_user_id: user.user_id,
          p_discord_username: discordData.displayName || discordData.globalName || discordData.username,
          p_discord_avatar: discordData.avatar,
          p_discord_banner: discordData.banner,
        });

        if (updateError) {
          console.error("Error syncing user:", user.user_id, updateError);
          errorCount++;
        } else {
          successCount++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (err) {
        console.error("Error fetching Discord user:", err);
        errorCount++;
      }
    }

    await logAction({
      actionType: 'sync_action',
      actionDescription: `Synced Discord names for ${successCount} users (${errorCount} errors)`,
    });

    toast({
      title: "Sync Complete",
      description: `Successfully synced ${successCount} users. ${errorCount > 0 ? `${errorCount} errors.` : ''}`,
    });

    loadUserRoles();
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

  const loadWhitelistApplications = async () => {
    const { data, error } = await supabase
      .from("whitelist_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading whitelist applications:", error);
      return;
    }

    // Enrich with discord_id from profiles
    if (data && data.length > 0) {
      const userIds = data.map(app => app.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, discord_id")
        .in("id", userIds);

      const enrichedData = data.map(app => ({
        ...app,
        discord_id: profiles?.find(p => p.id === app.user_id)?.discord_id || undefined
      }));
      setWhitelistApplications(enrichedData);
    } else {
      setWhitelistApplications([]);
    }
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

  const loadStaffApplications = async () => {
    const { data, error } = await supabase
      .from("staff_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading staff applications:", error);
      return;
    }

    setStaffApplications(data || []);
  };

  const loadBanAppeals = async () => {
    const { data, error } = await supabase
      .from("ban_appeals")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading ban appeals:", error);
      return;
    }

    setBanAppeals(data || []);
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

  const loadGangApplications = async () => {
    // Gang applications might be stored in job_applications with job_type = 'gang'
    const { data, error } = await supabase
      .from("job_applications")
      .select("*")
      .eq("job_type", "gang")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading gang applications:", error);
      return;
    }

    // Map to gang application format
    setGangApplications((data || []).map((app: any) => ({
      id: app.id,
      user_id: app.user_id,
      gang_name: app.character_name,
      leader_name: app.character_name,
      member_count: 1,
      gang_backstory: app.character_background,
      territory_plans: app.why_join,
      activity_level: app.availability,
      status: app.status,
      created_at: app.created_at,
      admin_notes: app.admin_notes,
    })));
  };

  const loadFirefighterApplications = async () => {
    const { data, error } = await supabase
      .from("firefighter_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading firefighter applications:", error);
      return;
    }

    setFirefighterApplications(data || []);
  };

  const loadWeazelNewsApplications = async () => {
    const { data, error } = await supabase
      .from("weazel_news_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading Weazel News applications:", error);
      return;
    }

    setWeazelNewsApplications(data || []);
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
    
    // First, try to delete any existing roles for this user (to handle unique constraint)
    await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId);
    
    // Then insert the new role
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: newRole });

    if (error) {
      console.error("Error updating user role:", error);
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
      actionDescription: `Changed role for user "${username || userId}" from "${oldRole || 'none'}" to "${newRole}"`,
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

  // Generic application status update function
  const updateApplicationStatus = async (
    table: "whitelist_applications" | "job_applications" | "staff_applications" | "ban_appeals" | "creator_applications" | "firefighter_applications" | "weazel_news_applications",
    appId: string,
    status: "approved" | "rejected" | "on_hold",
    appName: string,
    loadFunction: () => Promise<void>,
    applicantDiscord?: string,
    applicantDiscordId?: string,
    holdReason?: string
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    let notes = adminNotes[appId] || null;
    
    // If placing on hold, require a reason
    if (status === "on_hold" && holdReason) {
      notes = holdReason;
    } else if (status === "on_hold" && !notes) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for placing this application on hold in the notes field.",
        variant: "destructive",
      });
      return;
    }
    
    const { error } = await supabase
      .from(table)
      .update({
        status,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: notes,
      } as any)
      .eq("id", appId);

    if (error) {
      toast({
        title: "Error",
        description: `Failed to update application.`,
        variant: "destructive",
      });
      return;
    }

    // Send Discord notification for whitelist applications
    if (table === "whitelist_applications" && applicantDiscord) {
      try {
        // Get moderator info - try multiple ways to find Discord ID
        const userDiscordId = user?.user_metadata?.provider_id || user?.user_metadata?.discord_id;
        console.log("Looking up moderator Discord info. User Discord ID:", userDiscordId);
        
        // First try to find by Discord ID in user metadata
        let staffData = null;
        if (userDiscordId) {
          const { data } = await supabase
            .from("staff_members")
            .select("name, discord_id")
            .eq("discord_id", userDiscordId)
            .single();
          staffData = data;
        }
        
        // If not found, try to find by user_id
        if (!staffData && user?.id) {
          const { data } = await supabase
            .from("staff_members")
            .select("name, discord_id")
            .eq("user_id", user.id)
            .single();
          staffData = data;
        }
        
        console.log("Staff data found:", staffData);

        const notificationPayload = {
          applicantDiscord,
          applicantDiscordId,
          status,
          moderatorName: staffData?.name || user?.email || "Staff",
          moderatorDiscordId: staffData?.discord_id || userDiscordId,
          adminNotes: notes
        };
        
        console.log("Sending Discord notification with payload:", notificationPayload);

        const { data: notifyResult, error: notifyError } = await supabase.functions.invoke("send-whitelist-notification", {
          body: notificationPayload
        });
        
        if (notifyError) {
          console.error("Failed to send Discord notification:", notifyError);
        } else {
          console.log("Discord notification sent successfully:", notifyResult);
        }
      } catch (notifyError) {
        console.error("Failed to send Discord notification:", notifyError);
        // Don't fail the whole operation if notification fails
      }
    }

    await logAction({
      actionType: 'application_update',
      actionDescription: `${status === 'approved' ? 'Approved' : 'Rejected'} ${appName}`,
      targetTable: table,
      targetId: appId,
      newValue: { status, admin_notes: notes }
    });

    toast({
      title: "Success",
      description: `Application ${status} successfully.`,
    });

    setAdminNotes(prev => ({ ...prev, [appId]: "" }));
    await loadFunction();
  };

  // Calculate application counts - include on_hold
  const getApplicationCounts = () => {
    const pending = {
      whitelist: whitelistApplications.filter(a => a.status === "pending" || a.status === "on_hold").length,
      job: jobApplications.filter(a => a.status === "pending" || a.status === "on_hold").length,
      staff: staffApplications.filter(a => a.status === "pending" || a.status === "on_hold").length,
      ban: banAppeals.filter(a => a.status === "pending" || a.status === "on_hold").length,
      creator: creatorApplications.filter(a => a.status === "pending" || a.status === "on_hold").length,
      gang: gangApplications.filter(a => a.status === "pending" || a.status === "on_hold").length,
      firefighter: firefighterApplications.filter(a => a.status === "pending" || a.status === "on_hold").length,
      weazel: weazelNewsApplications.filter(a => a.status === "pending" || a.status === "on_hold").length,
      pdm: pdmApplications.filter(a => a.status === "pending" || a.status === "on_hold").length,
    };
    return pending;
  };

  const counts = getApplicationCounts();
  const totalPending = Object.values(counts).reduce((a, b) => a + b, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/20 text-green-400">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "on_hold":
        return <Badge className="bg-amber-500/20 text-amber-400">On Hold</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
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
          <ScrollArea className="w-full">
            <TabsList className="inline-flex w-auto gap-1 p-1">
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
              <TabsTrigger value="applications" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Applications</span>
                {totalPending > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {totalPending}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="roles" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">User Roles</span>
              </TabsTrigger>
              <TabsTrigger value="members" className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Member Joins</span>
              </TabsTrigger>
              <TabsTrigger value="staff" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Staff</span>
              </TabsTrigger>
              <TabsTrigger value="feedback" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Feedback</span>
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
          </ScrollArea>

          {/* Site Settings Tab */}
          <TabsContent value="settings">
            <EnhancedSiteSettings settings={settings} onSettingsChange={loadSettings} />
          </TabsContent>

          {/* All Applications Tab */}
          <TabsContent value="applications">
            <Card className="glass-effect border-border/20">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      <CardTitle className="text-gradient">All Applications</CardTitle>
                    </div>
                    <CardDescription>Review and manage all application types</CardDescription>
                  </div>
                  <Select value={selectedAppType} onValueChange={setSelectedAppType}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Applications</SelectItem>
                      <SelectItem value="whitelist">Whitelist ({counts.whitelist} pending)</SelectItem>
                      <SelectItem value="job">Job ({counts.job} pending)</SelectItem>
                      <SelectItem value="staff">Staff ({counts.staff} pending)</SelectItem>
                      <SelectItem value="ban">Ban Appeals ({counts.ban} pending)</SelectItem>
                      <SelectItem value="creator">Creator ({counts.creator} pending)</SelectItem>
                      <SelectItem value="firefighter">Firefighter ({counts.firefighter} pending)</SelectItem>
                      <SelectItem value="weazel">Weazel News ({counts.weazel} pending)</SelectItem>
                      <SelectItem value="pdm">PDM ({counts.pdm} pending)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-4">
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-center gap-2 text-sm text-blue-400">
                      <Shield className="w-4 h-4" />
                      Whitelist
                    </div>
                    <div className="text-2xl font-bold">{counts.whitelist}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2 text-sm text-green-400">
                      <Briefcase className="w-4 h-4" />
                      Jobs
                    </div>
                    <div className="text-2xl font-bold">{counts.job}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <div className="flex items-center gap-2 text-sm text-purple-400">
                      <Users className="w-4 h-4" />
                      Staff
                    </div>
                    <div className="text-2xl font-bold">{counts.staff}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center gap-2 text-sm text-red-400">
                      <AlertTriangle className="w-4 h-4" />
                      Ban Appeals
                    </div>
                    <div className="text-2xl font-bold">{counts.ban}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <div className="flex items-center gap-2 text-sm text-orange-400">
                      <Youtube className="w-4 h-4" />
                      Creator
                    </div>
                    <div className="text-2xl font-bold">{counts.creator}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Whitelist Applications */}
                {(selectedAppType === "all" || selectedAppType === "whitelist") && whitelistApplications.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-400" />
                      Whitelist Applications
                      <Badge variant="secondary">{whitelistApplications.length}</Badge>
                    </h3>
                    {whitelistApplications.slice(0, selectedAppType === "whitelist" ? undefined : 5).map(app => (
                      <Card key={app.id} className="border-border/20">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">{app.discord}</CardTitle>
                              <CardDescription>Age: {app.age} | {new Date(app.created_at).toLocaleDateString()}</CardDescription>
                            </div>
                            {getStatusBadge(app.status)}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">Experience</Label>
                            <p className="text-sm">{app.experience}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Backstory</Label>
                            <p className="text-sm line-clamp-3">{app.backstory}</p>
                          </div>
                          {(app.status === "pending" || app.status === "on_hold") && (
                            <>
                              <Textarea
                                placeholder="Admin notes (required for On Hold)..."
                                value={adminNotes[app.id] || ""}
                                onChange={(e) => setAdminNotes(prev => ({ ...prev, [app.id]: e.target.value }))}
                                className="h-20"
                              />
                              {app.status === "on_hold" && app.admin_notes && (
                                <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                                  <strong>Hold Reason:</strong> {app.admin_notes}
                                </div>
                              )}
                              <div className="flex gap-2 flex-wrap">
                                <Button size="sm" onClick={() => updateApplicationStatus("whitelist_applications", app.id, "approved", `Whitelist for ${app.discord}`, loadWhitelistApplications, app.discord, app.discord_id)}>
                                  <Check className="w-4 h-4 mr-1" /> Approve
                                </Button>
                                <Button size="sm" variant="outline" className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10" onClick={() => updateApplicationStatus("whitelist_applications", app.id, "on_hold", `Whitelist for ${app.discord}`, loadWhitelistApplications, app.discord, app.discord_id)}>
                                  <Clock className="w-4 h-4 mr-1" /> {app.status === "on_hold" ? "Update Hold" : "On Hold"}
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => updateApplicationStatus("whitelist_applications", app.id, "rejected", `Whitelist for ${app.discord}`, loadWhitelistApplications, app.discord, app.discord_id)}>
                                  <X className="w-4 h-4 mr-1" /> Reject
                                </Button>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Job Applications */}
                {(selectedAppType === "all" || selectedAppType === "job") && jobApplications.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-green-400" />
                      Job Applications
                      <Badge variant="secondary">{jobApplications.length}</Badge>
                    </h3>
                    {jobApplications.slice(0, selectedAppType === "job" ? undefined : 5).map(app => (
                      <Card key={app.id} className="border-border/20">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">{app.character_name}</CardTitle>
                              <CardDescription>
                                <Badge variant="outline" className="mr-2">{app.job_type}</Badge>
                                Age: {app.age} | {new Date(app.created_at).toLocaleDateString()}
                              </CardDescription>
                            </div>
                            {getStatusBadge(app.status)}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs text-muted-foreground">Previous Experience</Label>
                              <p className="text-sm">{app.previous_experience}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Availability</Label>
                              <p className="text-sm">{app.availability}</p>
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Why Join</Label>
                            <p className="text-sm line-clamp-2">{app.why_join}</p>
                          </div>
                          {(app.status === "pending" || app.status === "on_hold") && (
                            <>
                              <Textarea
                                placeholder="Admin notes (required for On Hold)..."
                                value={adminNotes[app.id] || ""}
                                onChange={(e) => setAdminNotes(prev => ({ ...prev, [app.id]: e.target.value }))}
                                className="h-20"
                              />
                              {app.status === "on_hold" && app.admin_notes && (
                                <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                                  <strong>Hold Reason:</strong> {app.admin_notes}
                                </div>
                              )}
                              <div className="flex gap-2 flex-wrap">
                                <Button size="sm" onClick={() => updateApplicationStatus("job_applications", app.id, "approved", `Job application for ${app.character_name}`, loadJobApplications)}>
                                  <Check className="w-4 h-4 mr-1" /> Approve
                                </Button>
                                <Button size="sm" variant="outline" className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10" onClick={() => updateApplicationStatus("job_applications", app.id, "on_hold", `Job application for ${app.character_name}`, loadJobApplications)}>
                                  <Clock className="w-4 h-4 mr-1" /> {app.status === "on_hold" ? "Update Hold" : "On Hold"}
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => updateApplicationStatus("job_applications", app.id, "rejected", `Job application for ${app.character_name}`, loadJobApplications)}>
                                  <X className="w-4 h-4 mr-1" /> Reject
                                </Button>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Staff Applications */}
                {(selectedAppType === "all" || selectedAppType === "staff") && staffApplications.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-400" />
                      Staff Applications
                      <Badge variant="secondary">{staffApplications.length}</Badge>
                    </h3>
                    {staffApplications.slice(0, selectedAppType === "staff" ? undefined : 5).map(app => (
                      <Card key={app.id} className="border-border/20">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">{app.full_name}</CardTitle>
                              <CardDescription>
                                <Badge variant="outline" className="mr-2">{app.position}</Badge>
                                @{app.discord_username} | Age: {app.age}
                              </CardDescription>
                            </div>
                            {getStatusBadge(app.status)}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">Experience</Label>
                            <p className="text-sm">{app.experience}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Why Join</Label>
                            <p className="text-sm line-clamp-2">{app.why_join}</p>
                          </div>
                          {(app.status === "pending" || app.status === "on_hold") && (
                            <>
                              <Textarea
                                placeholder="Admin notes (required for On Hold)..."
                                value={adminNotes[app.id] || ""}
                                onChange={(e) => setAdminNotes(prev => ({ ...prev, [app.id]: e.target.value }))}
                                className="h-20"
                              />
                              {app.status === "on_hold" && app.admin_notes && (
                                <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                                  <strong>Hold Reason:</strong> {app.admin_notes}
                                </div>
                              )}
                              <div className="flex gap-2 flex-wrap">
                                <Button size="sm" onClick={() => updateApplicationStatus("staff_applications", app.id, "approved", `Staff application for ${app.full_name}`, loadStaffApplications)}>
                                  <Check className="w-4 h-4 mr-1" /> Approve
                                </Button>
                                <Button size="sm" variant="outline" className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10" onClick={() => updateApplicationStatus("staff_applications", app.id, "on_hold", `Staff application for ${app.full_name}`, loadStaffApplications)}>
                                  <Clock className="w-4 h-4 mr-1" /> {app.status === "on_hold" ? "Update Hold" : "On Hold"}
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => updateApplicationStatus("staff_applications", app.id, "rejected", `Staff application for ${app.full_name}`, loadStaffApplications)}>
                                  <X className="w-4 h-4 mr-1" /> Reject
                                </Button>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Ban Appeals */}
                {(selectedAppType === "all" || selectedAppType === "ban") && banAppeals.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      Ban Appeals
                      <Badge variant="secondary">{banAppeals.length}</Badge>
                    </h3>
                    {banAppeals.slice(0, selectedAppType === "ban" ? undefined : 5).map(app => (
                      <Card key={app.id} className="border-border/20 border-red-500/20">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">{app.discord_username}</CardTitle>
                              <CardDescription>Steam: {app.steam_id} | {new Date(app.created_at).toLocaleDateString()}</CardDescription>
                            </div>
                            {getStatusBadge(app.status)}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">Ban Reason</Label>
                            <p className="text-sm text-red-400">{app.ban_reason}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Appeal Reason</Label>
                            <p className="text-sm">{app.appeal_reason}</p>
                          </div>
                          {(app.status === "pending" || app.status === "on_hold") && (
                            <>
                              <Textarea
                                placeholder="Admin notes (required for On Hold)..."
                                value={adminNotes[app.id] || ""}
                                onChange={(e) => setAdminNotes(prev => ({ ...prev, [app.id]: e.target.value }))}
                                className="h-20"
                              />
                              {app.status === "on_hold" && app.admin_notes && (
                                <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                                  <strong>Hold Reason:</strong> {app.admin_notes}
                                </div>
                              )}
                              <div className="flex gap-2 flex-wrap">
                                <Button size="sm" onClick={() => updateApplicationStatus("ban_appeals", app.id, "approved", `Ban appeal for ${app.discord_username}`, loadBanAppeals)}>
                                  <Check className="w-4 h-4 mr-1" /> Approve
                                </Button>
                                <Button size="sm" variant="outline" className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10" onClick={() => updateApplicationStatus("ban_appeals", app.id, "on_hold", `Ban appeal for ${app.discord_username}`, loadBanAppeals)}>
                                  <Clock className="w-4 h-4 mr-1" /> {app.status === "on_hold" ? "Update Hold" : "On Hold"}
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => updateApplicationStatus("ban_appeals", app.id, "rejected", `Ban appeal for ${app.discord_username}`, loadBanAppeals)}>
                                  <X className="w-4 h-4 mr-1" /> Reject
                                </Button>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Creator Applications */}
                {(selectedAppType === "all" || selectedAppType === "creator") && creatorApplications.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Youtube className="w-5 h-5 text-orange-400" />
                      Creator Applications
                      <Badge variant="secondary">{creatorApplications.length}</Badge>
                    </h3>
                    {creatorApplications.slice(0, selectedAppType === "creator" ? undefined : 5).map(app => (
                      <Card key={app.id} className="border-border/20">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">{app.full_name}</CardTitle>
                              <CardDescription>
                                <Badge variant="outline" className="mr-2">{app.platform}</Badge>
                                @{app.discord_username} | {app.average_viewers} avg viewers
                              </CardDescription>
                            </div>
                            {getStatusBadge(app.status)}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">Channel</Label>
                            <a href={app.channel_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                              {app.channel_url}
                            </a>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Content Style</Label>
                            <p className="text-sm">{app.content_style}</p>
                          </div>
                          {(app.status === "pending" || app.status === "on_hold") && (
                            <>
                              <Textarea
                                placeholder="Admin notes (required for On Hold)..."
                                value={adminNotes[app.id] || ""}
                                onChange={(e) => setAdminNotes(prev => ({ ...prev, [app.id]: e.target.value }))}
                                className="h-20"
                              />
                              {app.status === "on_hold" && app.admin_notes && (
                                <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                                  <strong>Hold Reason:</strong> {app.admin_notes}
                                </div>
                              )}
                              <div className="flex gap-2 flex-wrap">
                                <Button size="sm" onClick={() => updateApplicationStatus("creator_applications", app.id, "approved", `Creator application for ${app.full_name}`, loadCreatorApplications)}>
                                  <Check className="w-4 h-4 mr-1" /> Approve
                                </Button>
                                <Button size="sm" variant="outline" className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10" onClick={() => updateApplicationStatus("creator_applications", app.id, "on_hold", `Creator application for ${app.full_name}`, loadCreatorApplications)}>
                                  <Clock className="w-4 h-4 mr-1" /> {app.status === "on_hold" ? "Update Hold" : "On Hold"}
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => updateApplicationStatus("creator_applications", app.id, "rejected", `Creator application for ${app.full_name}`, loadCreatorApplications)}>
                                  <X className="w-4 h-4 mr-1" /> Reject
                                </Button>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Firefighter Applications */}
                {(selectedAppType === "all" || selectedAppType === "firefighter") && firefighterApplications.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Flame className="w-5 h-5 text-orange-500" />
                      Firefighter Applications
                      <Badge variant="secondary">{firefighterApplications.length}</Badge>
                    </h3>
                    {firefighterApplications.slice(0, selectedAppType === "firefighter" ? undefined : 5).map(app => (
                      <Card key={app.id} className="border-border/20">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">{app.real_name}</CardTitle>
                              <CardDescription>
                                In-Game: {app.in_game_name} | Steam: {app.steam_id}
                              </CardDescription>
                            </div>
                            {getStatusBadge(app.status)}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">Weekly Availability</Label>
                            <p className="text-sm">{app.weekly_availability}</p>
                          </div>
                          {app.status === "pending" && (
                            <>
                              <Textarea
                                placeholder="Admin notes..."
                                value={adminNotes[app.id] || ""}
                                onChange={(e) => setAdminNotes(prev => ({ ...prev, [app.id]: e.target.value }))}
                                className="h-20"
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => updateApplicationStatus("firefighter_applications", app.id, "approved", `Firefighter application for ${app.real_name}`, loadFirefighterApplications)}>
                                  <Check className="w-4 h-4 mr-1" /> Approve
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => updateApplicationStatus("firefighter_applications", app.id, "rejected", `Firefighter application for ${app.real_name}`, loadFirefighterApplications)}>
                                  <X className="w-4 h-4 mr-1" /> Reject
                                </Button>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Weazel News Applications */}
                {(selectedAppType === "all" || selectedAppType === "weazel") && weazelNewsApplications.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Tv className="w-5 h-5 text-cyan-400" />
                      Weazel News Applications
                      <Badge variant="secondary">{weazelNewsApplications.length}</Badge>
                    </h3>
                    {weazelNewsApplications.slice(0, selectedAppType === "weazel" ? undefined : 5).map(app => (
                      <Card key={app.id} className="border-border/20">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">{app.character_name}</CardTitle>
                              <CardDescription>Age: {app.age} | {new Date(app.created_at).toLocaleDateString()}</CardDescription>
                            </div>
                            {getStatusBadge(app.status)}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">Journalism Experience</Label>
                            <p className="text-sm">{app.journalism_experience}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Writing Sample</Label>
                            <p className="text-sm line-clamp-2">{app.writing_sample}</p>
                          </div>
                          {app.status === "pending" && (
                            <>
                              <Textarea
                                placeholder="Admin notes..."
                                value={adminNotes[app.id] || ""}
                                onChange={(e) => setAdminNotes(prev => ({ ...prev, [app.id]: e.target.value }))}
                                className="h-20"
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => updateApplicationStatus("weazel_news_applications", app.id, "approved", `Weazel News application for ${app.character_name}`, loadWeazelNewsApplications)}>
                                  <Check className="w-4 h-4 mr-1" /> Approve
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => updateApplicationStatus("weazel_news_applications", app.id, "rejected", `Weazel News application for ${app.character_name}`, loadWeazelNewsApplications)}>
                                  <X className="w-4 h-4 mr-1" /> Reject
                                </Button>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* PDM Applications */}
                {(selectedAppType === "all" || selectedAppType === "pdm") && pdmApplications.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Car className="w-5 h-5 text-yellow-400" />
                      PDM Applications
                      <Badge variant="secondary">{pdmApplications.length}</Badge>
                    </h3>
                    {pdmApplications.slice(0, selectedAppType === "pdm" ? undefined : 5).map((app) => (
                      <Card key={app.id} className="border-border/20">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">{app.character_name}</CardTitle>
                              <CardDescription>Age: {app.age} | Phone: {app.phone_number}</CardDescription>
                            </div>
                            {getStatusBadge(app.status)}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="grid md:grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs text-muted-foreground">Sales Experience</Label>
                              <p className="text-sm">{app.sales_experience}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Vehicle Knowledge</Label>
                              <p className="text-sm">{app.vehicle_knowledge}</p>
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Customer Scenario</Label>
                            <p className="text-sm line-clamp-2">{app.customer_scenario}</p>
                          </div>
                          {app.status === "pending" && (
                            <div className="space-y-2 pt-2">
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
                                  size="sm"
                                  onClick={() => updatePdmApplicationStatus(app.id, "approved")}
                                >
                                  <Check className="w-4 h-4 mr-1" /> Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => updatePdmApplicationStatus(app.id, "rejected")}
                                >
                                  <X className="w-4 h-4 mr-1" /> Reject
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {whitelistApplications.length === 0 && 
                 jobApplications.length === 0 && 
                 staffApplications.length === 0 && 
                 banAppeals.length === 0 && 
                 creatorApplications.length === 0 && 
                 firefighterApplications.length === 0 && 
                 weazelNewsApplications.length === 0 && 
                 pdmApplications.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">No applications found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Live Member Joins Tab */}
          <TabsContent value="members">
            <LiveMemberJoins />
          </TabsContent>

          {/* User Roles Tab */}
          <TabsContent value="roles">
            <Card className="glass-effect border-border/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    <CardTitle className="text-gradient">User Roles Management</CardTitle>
                  </div>
                  <Button 
                    onClick={syncDiscordNames} 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Sync Discord Names
                  </Button>
                </div>
                <CardDescription>
                  Manage admin and moderator access for all {userRoles.length} registered users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">User</TableHead>
                        <TableHead>Discord ID</TableHead>
                        <TableHead>Current Role</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userRoles.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            <UserCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            No registered users found
                          </TableCell>
                        </TableRow>
                      ) : (
                        userRoles.map((userRole) => (
                          <TableRow key={userRole.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={userRole.discord_avatar || ''} alt={userRole.discord_username || 'User'} />
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                    {(userRole.discord_username || 'U').charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {userRole.discord_username || "Unknown User"}
                                  </span>
                                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                    {userRole.user_id.slice(0, 8)}...
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {userRole.discord_id || "Not linked"}
                              </code>
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
                                <SelectTrigger className="w-[130px]">
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
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
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
                          <Badge variant="secondary">{staff.role}</Badge>
                        </TableCell>
                        <TableCell>{staff.department}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {staff.discord_id}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant={staff.is_active ? "default" : "outline"}>
                            {staff.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedStaff(staff);
                                setIsStaffDialogOpen(true);
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
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
                    <Badge>Verified by Discord ID: {settings.find(s => s.key === "owner_discord_id")?.value || "Not Set"}</Badge>
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
