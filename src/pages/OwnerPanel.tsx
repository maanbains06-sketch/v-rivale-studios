import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOwnerAuditLog } from "@/hooks/useOwnerAuditLog";
import { useRealtimeApplications } from "@/hooks/useRealtimeApplications";
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
import { MaintenanceCountdownControl } from "@/components/MaintenanceCountdownControl";
import { PageMaintenanceControls } from "@/components/PageMaintenanceControls";
import { FeaturedStreamersManager } from "@/components/FeaturedStreamersManager";
import { FeaturedPositionsManager } from "@/components/FeaturedPositionsManager";
import { PromoCodeManager } from "@/components/PromoCodeManager";
import { UnifiedApplicationsTable, ApplicationType } from "@/components/UnifiedApplicationsTable";
import GiveawayManagement from "@/components/GiveawayManagement";
import { combineAllApplications, filterApplicationsByType } from "@/lib/applicationTransformer";
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
  Ticket,
  Radio,
  Wrench,
  Youtube,
  Gift
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
  discord_id?: string;
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
  discord_id?: string;
  status: string;
  created_at: string;
  admin_notes?: string;
}

interface StaffApplication {
  id: string;
  user_id: string;
  full_name: string;
  discord_username: string;
  discord_id?: string;
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
  discord_id?: string;
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
  discord_id?: string;
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
  discord_id?: string;
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
  const [isVerified, setIsVerified] = useState(() => {
    // Check sessionStorage for existing verified session (persists until browser/tab close or logout)
    const stored = sessionStorage.getItem('owner_2fa_verified');
    if (stored) {
      const { verified, userId } = JSON.parse(stored);
      if (verified && userId) {
        return true;
      }
      sessionStorage.removeItem('owner_2fa_verified');
    }
    return false;
  });
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
  const [isRefreshingApps, setIsRefreshingApps] = useState(false);
  
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
    
    // Clear the stored 2FA session
    sessionStorage.removeItem('owner_2fa_verified');
    setIsVerified(false);
    setShowInactivityWarning(false);
    
    toast({
      title: "Session Expired",
      description: "You have been logged out due to 30 minutes of inactivity.",
      variant: "destructive",
    });
  }, [logAction, toast]);

  // Handle manual logout - clear 2FA session
  const handleOwnerLogout = useCallback(() => {
    sessionStorage.removeItem('owner_2fa_verified');
    setIsVerified(false);
  }, []);

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
    // IMPORTANT: Don't let one failed query prevent other sections from loading.
    // This was causing "sometimes past applications are not visible" when one request errored.
    const results = await Promise.allSettled([
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

    const rejected = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
    if (rejected.length > 0) {
      console.error('OwnerPanel: one or more sections failed to load', rejected.map(r => r.reason));
      toast({
        title: 'Partial Load',
        description: 'Some sections failed to load. You can refresh the page to retry.',
        variant: 'destructive',
      });
    }
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

  // Real-time subscriptions for applications - only active when verified
  useRealtimeApplications({
    onWhitelistChange: isVerified ? loadWhitelistApplications : undefined,
    onJobChange: isVerified ? loadJobApplications : undefined,
    onBanAppealChange: isVerified ? loadBanAppeals : undefined,
    onStaffChange: isVerified ? loadStaffApplications : undefined,
    onCreatorChange: isVerified ? loadCreatorApplications : undefined,
    onFirefighterChange: isVerified ? loadFirefighterApplications : undefined,
    onWeazelChange: isVerified ? loadWeazelNewsApplications : undefined,
    onPdmChange: isVerified ? loadPdmApplications : undefined,
    showNotifications: isVerified,
  });

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
        reviewed_by: user?.id || null,
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
    table: "whitelist_applications" | "job_applications" | "staff_applications" | "ban_appeals" | "creator_applications" | "firefighter_applications" | "weazel_news_applications" | "pdm_applications",
    appId: string,
    status: "approved" | "rejected" | "on_hold" | "closed" | "pending",
    appName: string,
    loadFunction: () => Promise<void>,
    applicantDiscord?: string,
    applicantDiscordId?: string,
    directNotes?: string
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    // Use directly passed notes first, then fall back to state
    let notes = directNotes !== undefined ? directNotes : (adminNotes[appId] || null);
    
    // For on_hold, notes are recommended but not required
    // (the requirement was blocking the button from working)
    
    // Build update payload - only include admin_notes for actions that need them
    const updatePayload: Record<string, any> = {
      status,
      reviewed_by: user?.id || null,
      reviewed_at: new Date().toISOString(),
    };
    
    // Only update admin_notes for approved/rejected/on_hold - preserve existing notes for close/open
    if (status !== 'closed' && status !== 'pending') {
      updatePayload.admin_notes = notes;
    }
    
    const { data: updatedRows, error } = await supabase
      .from(table as any)
      .update(updatePayload)
      .eq("id", appId)
      .select('id');

    if (error) {
      console.error('Application update error:', { table, appId, status, error });
      toast({
        title: "Error",
        description: `Failed to update application: ${error.message}`,
        variant: "destructive",
      });
      return;
    }

    // PostgREST can return success with 0 rows if RLS blocks the update.
    if (!updatedRows || updatedRows.length === 0) {
      console.error('Application update blocked (0 rows updated):', { table, appId, status });
      toast({
        title: "Not Updated",
        description: "Update was blocked by permissions (0 rows updated).",
        variant: "destructive",
      });
      return;
    }

    // Send Discord notification for all application types (approved/rejected only)
    if ((status === 'approved' || status === 'rejected') && applicantDiscord) {
      try {
        // Get moderator info
        const userDiscordId = user?.user_metadata?.provider_id || user?.user_metadata?.discord_id;
        console.log("Looking up moderator Discord info. User Discord ID:", userDiscordId);
        
        let staffData = null;
        if (userDiscordId) {
          const { data } = await supabase
            .from("staff_members")
            .select("name, discord_id")
            .eq("discord_id", userDiscordId)
            .single();
          staffData = data;
        }
        
        if (!staffData && user?.id) {
          const { data } = await supabase
            .from("staff_members")
            .select("name, discord_id")
            .eq("user_id", user.id)
            .single();
          staffData = data;
        }
        
        console.log("Staff data found:", staffData);

        // Map table to application type for notifications (must match edge function config)
        const tableToAppType: Record<string, string> = {
          'whitelist_applications': 'whitelist',
          'job_applications': 'job', // Will be refined below
          'staff_applications': 'Staff',
          'ban_appeals': 'ban_appeal',
          'creator_applications': 'Creator',
          'firefighter_applications': 'Firefighter',
          'weazel_news_applications': 'Weazel News',
          'pdm_applications': 'PDM',
        };
        
        let applicationType = tableToAppType[table] || 'whitelist';
        
        // For job applications, determine specific type based on appName
        if (table === 'job_applications') {
          const appNameLower = appName.toLowerCase();
          if (appNameLower.includes('police') || appNameLower.includes('pd')) applicationType = 'Police Department';
          else if (appNameLower.includes('ems')) applicationType = 'EMS';
          else if (appNameLower.includes('mechanic')) applicationType = 'Mechanic';
          else if (appNameLower.includes('judge')) applicationType = 'DOJ - Judge';
          else if (appNameLower.includes('attorney')) applicationType = 'DOJ - Attorney';
          else if (appNameLower.includes('state')) applicationType = 'State Department';
          else if (appNameLower.includes('gang')) applicationType = 'Gang RP';
          else applicationType = 'Police Department'; // Default to police for job apps
        }

        // Use whitelist notification for whitelist, send-application-notification for others
        if (table === "whitelist_applications") {
          const notificationPayload = {
            applicantDiscord,
            applicantDiscordId,
            status,
            moderatorName: staffData?.name || user?.email || "Staff",
            moderatorDiscordId: staffData?.discord_id || userDiscordId,
            adminNotes: notes
          };
          
          console.log("Sending whitelist Discord notification:", notificationPayload);
          const { data: notifyResult, error: notifyError } = await supabase.functions.invoke("send-whitelist-notification", {
            body: notificationPayload
          });
          
          if (notifyError) console.error("Failed to send Discord notification:", notifyError);
          else console.log("Discord notification sent:", notifyResult);
        } else {
          // Use generic application notification for all other types
          const notificationPayload = {
            applicantName: applicantDiscord, // Edge function expects applicantName
            applicantDiscordId,
            status,
            applicationType,
            moderatorName: staffData?.name || user?.email || "Staff",
            moderatorDiscordId: staffData?.discord_id || userDiscordId,
            adminNotes: notes
          };
          
          console.log("Sending application Discord notification:", notificationPayload);
          const { data: notifyResult, error: notifyError } = await supabase.functions.invoke("send-application-notification", {
            body: notificationPayload
          });
          
          if (notifyError) console.error("Failed to send Discord notification:", notifyError);
          else console.log("Discord notification sent:", notifyResult);
        }
      } catch (notifyError) {
        console.error("Failed to send Discord notification:", notifyError);
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

  // Transform all applications into unified format
  const getUnifiedApplications = () => {
    const unified: any[] = [];
    
    whitelistApplications.forEach(app => unified.push({
      id: app.id,
      applicantName: app.discord,
      organization: 'Whitelist',
      contactNumber: app.discord_id?.slice(-6),
      status: app.status,
      handledBy: app.admin_notes ? 'Reviewed' : undefined,
      applicationType: 'whitelist' as ApplicationType,
      fields: [
        { label: 'Age', value: app.age },
        { label: 'Experience', value: app.experience },
        { label: 'Backstory', value: app.backstory },
      ],
      adminNotes: app.admin_notes,
      createdAt: app.created_at,
    }));

    jobApplications.forEach(app => unified.push({
      id: app.id,
      applicantName: app.character_name,
      organization: app.job_type,
      contactNumber: app.phone_number,
      status: app.status,
      applicationType: (app.job_type?.toLowerCase().includes('police') ? 'police' : 
                       app.job_type?.toLowerCase().includes('ems') ? 'ems' : 
                       app.job_type?.toLowerCase().includes('mechanic') ? 'mechanic' : 'police') as ApplicationType,
      fields: [
        { label: 'Age', value: app.age },
        { label: 'Previous Experience', value: app.previous_experience },
        { label: 'Why Join', value: app.why_join },
        { label: 'Character Background', value: app.character_background },
        { label: 'Availability', value: app.availability },
      ],
      adminNotes: app.admin_notes,
      createdAt: app.created_at,
    }));

    staffApplications.forEach(app => unified.push({
      id: app.id,
      applicantName: app.full_name,
      organization: app.position,
      contactNumber: app.discord_username,
      status: app.status,
      applicationType: 'staff' as ApplicationType,
      fields: [
        { label: 'Age', value: app.age },
        { label: 'Discord', value: app.discord_username },
        { label: 'Experience', value: app.experience },
        { label: 'Why Join', value: app.why_join },
        { label: 'Availability', value: app.availability },
      ],
      adminNotes: app.admin_notes,
      createdAt: app.created_at,
    }));

    banAppeals.forEach(app => unified.push({
      id: app.id,
      applicantName: app.discord_username,
      organization: 'Ban Appeal',
      contactNumber: app.steam_id,
      status: app.status,
      applicationType: 'ban_appeal' as ApplicationType,
      fields: [
        { label: 'Steam ID', value: app.steam_id },
        { label: 'Ban Reason', value: app.ban_reason },
        { label: 'Appeal Reason', value: app.appeal_reason },
        { label: 'Additional Info', value: app.additional_info },
      ],
      adminNotes: app.admin_notes,
      createdAt: app.created_at,
    }));

    creatorApplications.forEach(app => unified.push({
      id: app.id,
      applicantName: app.full_name,
      organization: app.platform,
      contactNumber: app.channel_url,
      status: app.status,
      applicationType: 'creator' as ApplicationType,
      fields: [
        { label: 'Discord', value: app.discord_username },
        { label: 'Platform', value: app.platform },
        { label: 'Channel URL', value: app.channel_url },
        { label: 'Average Viewers', value: app.average_viewers },
        { label: 'Content Style', value: app.content_style },
        { label: 'Why Join', value: app.why_join },
      ],
      adminNotes: app.admin_notes,
      createdAt: app.created_at,
    }));

    return unified.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

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
          <div className="relative">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent pb-2">
              <TabsList className="inline-flex w-max gap-1 p-1 min-w-full">
                <TabsTrigger value="settings" className="flex items-center gap-2 whitespace-nowrap">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Settings</span>
                </TabsTrigger>
                <TabsTrigger value="applications" className="flex items-center gap-2 whitespace-nowrap">
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Applications</span>
                  {totalPending > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {totalPending}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="roles" className="flex items-center gap-2 whitespace-nowrap">
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">User Roles</span>
                </TabsTrigger>
                <TabsTrigger value="members" className="flex items-center gap-2 whitespace-nowrap">
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Member Joins</span>
                </TabsTrigger>
                <TabsTrigger value="staff" className="flex items-center gap-2 whitespace-nowrap">
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Staff</span>
                </TabsTrigger>
                <TabsTrigger value="feedback" className="flex items-center gap-2 whitespace-nowrap">
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Feedback</span>
                </TabsTrigger>
                <TabsTrigger value="audit" className="flex items-center gap-2 whitespace-nowrap">
                  <History className="w-4 h-4" />
                  <span className="hidden sm:inline">Audit Log</span>
                </TabsTrigger>
                <TabsTrigger value="permissions" className="flex items-center gap-2 whitespace-nowrap">
                  <Crown className="w-4 h-4" />
                  <span className="hidden sm:inline">Permissions</span>
                </TabsTrigger>
                <TabsTrigger value="maintenance" className="flex items-center gap-2 whitespace-nowrap">
                  <Wrench className="w-4 h-4" />
                  <span className="hidden sm:inline">Maintenance</span>
                </TabsTrigger>
                <TabsTrigger value="promo" className="flex items-center gap-2 whitespace-nowrap">
                  <Ticket className="w-4 h-4" />
                  <span className="hidden sm:inline">Promo Codes</span>
                </TabsTrigger>
                <TabsTrigger value="streamers" className="flex items-center gap-2 whitespace-nowrap">
                  <Radio className="w-4 h-4" />
                  <span className="hidden sm:inline">Streamers</span>
                </TabsTrigger>
                <TabsTrigger value="giveaways" className="flex items-center gap-2 whitespace-nowrap">
                  <Gift className="w-4 h-4" />
                  <span className="hidden sm:inline">Giveaways</span>
                </TabsTrigger>
                <TabsTrigger value="featured-positions" className="flex items-center gap-2 whitespace-nowrap">
                  <Flame className="w-4 h-4" />
                  <span className="hidden sm:inline">Featured Jobs</span>
                </TabsTrigger>
                <TabsTrigger value="business" className="flex items-center gap-2 whitespace-nowrap" onClick={() => navigate('/admin/business-proposals')}>
                  <Briefcase className="w-4 h-4" />
                  <span className="hidden sm:inline">Business</span>
                </TabsTrigger>
              </TabsList>
            </div>
            {/* Fade indicators for scroll hint */}
            <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
            <div className="absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none" />
          </div>

          {/* Site Settings Tab */}
          <TabsContent value="settings">
            <EnhancedSiteSettings settings={settings} onSettingsChange={loadSettings} />
          </TabsContent>

          {/* Maintenance Control Tab */}
          <TabsContent value="maintenance">
            <div className="space-y-6">
              <MaintenanceCountdownControl />
              <PageMaintenanceControls />
            </div>
          </TabsContent>

          {/* Promo Codes Tab */}
          <TabsContent value="promo">
            <PromoCodeManager />
          </TabsContent>

          {/* Featured Streamers Tab */}
          <TabsContent value="streamers">
            <FeaturedStreamersManager />
          </TabsContent>

          {/* Giveaway Management Tab */}
          <TabsContent value="giveaways">
            <GiveawayManagement />
          </TabsContent>

          {/* Featured Positions Tab */}
          <TabsContent value="featured-positions">
            <FeaturedPositionsManager />
          </TabsContent>

          {/* All Applications Tab */}
          <TabsContent value="applications">
            <Card className="glass-effect border-border/20 overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      <CardTitle className="text-gradient">All Applications</CardTitle>
                    </div>
                    <CardDescription>Review and manage all application types in one place</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isRefreshingApps}
                      onClick={async () => {
                        setIsRefreshingApps(true);
                        try {
                          await loadAllData();
                          toast({ title: "Refreshed", description: "All applications have been reloaded successfully." });
                        } catch (error) {
                          toast({ title: "Error", description: "Failed to refresh applications.", variant: "destructive" });
                        } finally {
                          setIsRefreshingApps(false);
                        }
                      }}
                      className="gap-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${isRefreshingApps ? 'animate-spin' : ''}`} />
                      {isRefreshingApps ? 'Loading...' : 'Refresh'}
                    </Button>
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
              <CardContent className="p-0">
                <UnifiedApplicationsTable
                  applications={filterApplicationsByType(
                    combineAllApplications(
                      whitelistApplications,
                      staffApplications,
                      jobApplications,
                      banAppeals,
                      creatorApplications,
                      firefighterApplications,
                      weazelNewsApplications,
                      pdmApplications,
                      gangApplications
                    ),
                    selectedAppType
                  )}
                  title="Organization Applications"
                  onApprove={async (id, notes, type, applicantName, discordId) => {
                    const tableMap: Record<string, { table: string; loader: () => Promise<void>; nameField?: string }> = {
                      whitelist: { table: 'whitelist_applications', loader: loadWhitelistApplications },
                      staff: { table: 'staff_applications', loader: loadStaffApplications },
                      police: { table: 'job_applications', loader: loadJobApplications },
                      ems: { table: 'job_applications', loader: loadJobApplications },
                      mechanic: { table: 'job_applications', loader: loadJobApplications },
                      judge: { table: 'job_applications', loader: loadJobApplications },
                      attorney: { table: 'job_applications', loader: loadJobApplications },
                      state: { table: 'job_applications', loader: loadJobApplications },
                      gang: { table: 'job_applications', loader: loadGangApplications },
                      ban_appeal: { table: 'ban_appeals', loader: loadBanAppeals },
                      creator: { table: 'creator_applications', loader: loadCreatorApplications },
                      firefighter: { table: 'firefighter_applications', loader: loadFirefighterApplications },
                      weazel_news: { table: 'weazel_news_applications', loader: loadWeazelNewsApplications },
                      pdm: { table: 'pdm_applications', loader: loadPdmApplications },
                    };
                    
                    const config = tableMap[type];
                    if (config) {
                      // Pass notes directly to updateApplicationStatus (don't rely on state)
                      await updateApplicationStatus(
                        config.table as any,
                        id,
                        'approved',
                        `${type} application approved`,
                        config.loader,
                        applicantName,
                        discordId,
                        notes // directNotes
                      );
                    }
                  }}
                  onReject={async (id, notes, type, applicantName, discordId) => {
                    const tableMap: Record<string, { table: string; loader: () => Promise<void> }> = {
                      whitelist: { table: 'whitelist_applications', loader: loadWhitelistApplications },
                      staff: { table: 'staff_applications', loader: loadStaffApplications },
                      police: { table: 'job_applications', loader: loadJobApplications },
                      ems: { table: 'job_applications', loader: loadJobApplications },
                      mechanic: { table: 'job_applications', loader: loadJobApplications },
                      judge: { table: 'job_applications', loader: loadJobApplications },
                      attorney: { table: 'job_applications', loader: loadJobApplications },
                      state: { table: 'job_applications', loader: loadJobApplications },
                      gang: { table: 'job_applications', loader: loadGangApplications },
                      ban_appeal: { table: 'ban_appeals', loader: loadBanAppeals },
                      creator: { table: 'creator_applications', loader: loadCreatorApplications },
                      firefighter: { table: 'firefighter_applications', loader: loadFirefighterApplications },
                      weazel_news: { table: 'weazel_news_applications', loader: loadWeazelNewsApplications },
                      pdm: { table: 'pdm_applications', loader: loadPdmApplications },
                    };
                    
                    const config = tableMap[type];
                    if (config) {
                      // Pass notes directly to updateApplicationStatus (don't rely on state)
                      await updateApplicationStatus(
                        config.table as any,
                        id,
                        'rejected',
                        `${type} application rejected`,
                        config.loader,
                        applicantName,
                        discordId,
                        notes // directNotes
                      );
                    }
                  }}
                  onHold={async (id, notes, type) => {
                    const tableMap: Record<string, { table: string; loader: () => Promise<void> }> = {
                      whitelist: { table: 'whitelist_applications', loader: loadWhitelistApplications },
                      staff: { table: 'staff_applications', loader: loadStaffApplications },
                      police: { table: 'job_applications', loader: loadJobApplications },
                      ems: { table: 'job_applications', loader: loadJobApplications },
                      mechanic: { table: 'job_applications', loader: loadJobApplications },
                      judge: { table: 'job_applications', loader: loadJobApplications },
                      attorney: { table: 'job_applications', loader: loadJobApplications },
                      state: { table: 'job_applications', loader: loadJobApplications },
                      gang: { table: 'job_applications', loader: loadGangApplications },
                      ban_appeal: { table: 'ban_appeals', loader: loadBanAppeals },
                      creator: { table: 'creator_applications', loader: loadCreatorApplications },
                      firefighter: { table: 'firefighter_applications', loader: loadFirefighterApplications },
                      weazel_news: { table: 'weazel_news_applications', loader: loadWeazelNewsApplications },
                      pdm: { table: 'pdm_applications', loader: loadPdmApplications },
                    };
                    
                    const config = tableMap[type];
                    if (config) {
                      // Pass notes directly to updateApplicationStatus (don't rely on state)
                      await updateApplicationStatus(
                        config.table as any,
                        id,
                        'on_hold',
                        `Application put on hold`,
                        config.loader,
                        undefined, // applicantDiscord
                        undefined, // applicantDiscordId
                        notes // directNotes
                      );
                    }
                  }}
                  onClose={async (id, type) => {
                    console.log('[OwnerPanel] onClose called:', { id, type });
                    
                    type TableName = 'whitelist_applications' | 'staff_applications' | 'job_applications' | 'ban_appeals' | 'creator_applications' | 'firefighter_applications' | 'weazel_news_applications' | 'pdm_applications';
                    
                    const tableMap: Record<string, { table: TableName; loader: () => Promise<void> }> = {
                      whitelist: { table: 'whitelist_applications', loader: loadWhitelistApplications },
                      staff: { table: 'staff_applications', loader: loadStaffApplications },
                      police: { table: 'job_applications', loader: loadJobApplications },
                      ems: { table: 'job_applications', loader: loadJobApplications },
                      mechanic: { table: 'job_applications', loader: loadJobApplications },
                      judge: { table: 'job_applications', loader: loadJobApplications },
                      attorney: { table: 'job_applications', loader: loadJobApplications },
                      state: { table: 'job_applications', loader: loadJobApplications },
                      gang: { table: 'job_applications', loader: loadGangApplications },
                      ban_appeal: { table: 'ban_appeals', loader: loadBanAppeals },
                      creator: { table: 'creator_applications', loader: loadCreatorApplications },
                      firefighter: { table: 'firefighter_applications', loader: loadFirefighterApplications },
                      weazel_news: { table: 'weazel_news_applications', loader: loadWeazelNewsApplications },
                      pdm: { table: 'pdm_applications', loader: loadPdmApplications },
                    };
                    
                    const config = tableMap[type];
                    console.log('[OwnerPanel] onClose config:', config, 'for type:', type);
                    
                    if (!config) {
                      console.error('[OwnerPanel] Unknown application type:', type);
                      toast({ title: "Error", description: `Unknown application type: ${type}`, variant: "destructive" });
                      return;
                    }
                    
                    try {
                      const { data: { user } } = await supabase.auth.getUser();
                      console.log('[OwnerPanel] Updating', config.table, 'id:', id, 'user:', user?.id);
                      
                      const { data: updatedRows, error } = await supabase
                        .from(config.table)
                        .update({
                          status: 'closed',
                          reviewed_by: user?.id || null,
                          reviewed_at: new Date().toISOString(),
                        })
                        .eq('id', id)
                        .select('id');
                      
                      console.log('[OwnerPanel] Update result:', { updatedRows, error });
                      
                      if (error) {
                        console.error('[OwnerPanel] Error closing application:', { type, table: config.table, id, error });
                        toast({ title: "Error", description: `Failed to close: ${error.message}`, variant: "destructive" });
                      } else if (!updatedRows || updatedRows.length === 0) {
                        console.error('[OwnerPanel] Close blocked (0 rows updated):', { type, table: config.table, id });
                        toast({ title: "Not Updated", description: "Close was blocked by permissions (0 rows updated).", variant: "destructive" });
                      } else {
                        console.log('[OwnerPanel] Application closed successfully:', { id, type });
                        toast({ title: "Success", description: "Application marked as closed." });
                        config.loader();
                      }
                    } catch (err) {
                      console.error('[OwnerPanel] Unexpected error closing application:', err);
                      toast({ title: "Error", description: `Unexpected error: ${String(err)}`, variant: "destructive" });
                    }
                  }}
                  onMarkOpen={async (id, type) => {
                    console.log('[OwnerPanel] onMarkOpen called:', { id, type });
                    
                    type TableName = 'whitelist_applications' | 'staff_applications' | 'job_applications' | 'ban_appeals' | 'creator_applications' | 'firefighter_applications' | 'weazel_news_applications' | 'pdm_applications';
                    
                    const tableMap: Record<string, { table: TableName; loader: () => Promise<void> }> = {
                      whitelist: { table: 'whitelist_applications', loader: loadWhitelistApplications },
                      staff: { table: 'staff_applications', loader: loadStaffApplications },
                      police: { table: 'job_applications', loader: loadJobApplications },
                      ems: { table: 'job_applications', loader: loadJobApplications },
                      mechanic: { table: 'job_applications', loader: loadJobApplications },
                      judge: { table: 'job_applications', loader: loadJobApplications },
                      attorney: { table: 'job_applications', loader: loadJobApplications },
                      state: { table: 'job_applications', loader: loadJobApplications },
                      gang: { table: 'job_applications', loader: loadGangApplications },
                      ban_appeal: { table: 'ban_appeals', loader: loadBanAppeals },
                      creator: { table: 'creator_applications', loader: loadCreatorApplications },
                      firefighter: { table: 'firefighter_applications', loader: loadFirefighterApplications },
                      weazel_news: { table: 'weazel_news_applications', loader: loadWeazelNewsApplications },
                      pdm: { table: 'pdm_applications', loader: loadPdmApplications },
                    };
                    
                    const config = tableMap[type];
                    console.log('[OwnerPanel] onMarkOpen config:', config, 'for type:', type);
                    
                    if (!config) {
                      console.error('[OwnerPanel] Unknown application type:', type);
                      toast({ title: "Error", description: `Unknown application type: ${type}`, variant: "destructive" });
                      return;
                    }
                    
                    try {
                      const { data: { user } } = await supabase.auth.getUser();
                      console.log('[OwnerPanel] Updating', config.table, 'id:', id, 'to pending, user:', user?.id);
                      
                      const { data: updatedRows, error } = await supabase
                        .from(config.table)
                        .update({
                          status: 'pending',
                          reviewed_by: user?.id || null,
                          reviewed_at: new Date().toISOString(),
                        })
                        .eq('id', id)
                        .select('id');
                      
                      console.log('[OwnerPanel] Update result:', { updatedRows, error });
                      
                      if (error) {
                        console.error('[OwnerPanel] Error reopening application:', { type, table: config.table, id, error });
                        toast({ title: "Error", description: `Failed to reopen: ${error.message}`, variant: "destructive" });
                      } else if (!updatedRows || updatedRows.length === 0) {
                        console.error('[OwnerPanel] Reopen blocked (0 rows updated):', { type, table: config.table, id });
                        toast({ title: "Not Updated", description: "Reopen was blocked by permissions (0 rows updated).", variant: "destructive" });
                      } else {
                        console.log('[OwnerPanel] Application reopened successfully:', { id, type });
                        toast({ title: "Success", description: "Application marked as open." });
                        config.loader();
                      }
                    } catch (err) {
                      console.error('[OwnerPanel] Unexpected error reopening application:', err);
                      toast({ title: "Error", description: `Unexpected error: ${String(err)}`, variant: "destructive" });
                    }
                  }}
                />
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
