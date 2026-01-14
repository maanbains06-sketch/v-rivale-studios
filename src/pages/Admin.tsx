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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Loader2, 
  Shield, 
  FileText, 
  Image, 
  Ban, 
  Briefcase, 
  Video, 
  ExternalLink,
  Users,
  TrendingUp,
  Gift,
  Search,
  Ticket,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  MessageSquare,
  Activity,
  Timer,
  Award,
  User,
  Hash,
  MoreVertical,
  UserX,
  BarChart3
} from "lucide-react";
import headerAdminBg from "@/assets/header-staff.jpg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  discord_id?: string;
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
  job_specific_answer?: string;
  strengths?: string;
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

interface FirefighterApplication {
  id: string;
  user_id: string;
  real_name: string;
  in_game_name: string;
  discord_id: string;
  steam_id: string;
  weekly_availability: string;
  status: string;
  created_at: string;
  admin_notes: string | null;
}

interface WeazelNewsApplication {
  id: string;
  user_id: string;
  character_name: string;
  age: number;
  phone_number: string;
  previous_experience: string;
  why_join: string;
  character_background: string;
  availability: string;
  journalism_experience: string;
  writing_sample: string;
  camera_skills: string;
  interview_scenario: string;
  additional_info: string | null;
  status: string;
  created_at: string;
  admin_notes: string | null;
}

interface ReferralStats {
  totalReferrals: number;
  totalDiscountsGiven: number;
  activeReferrers: number;
  averageReferralsPerUser: number;
}

interface PromoStats {
  totalCodes: number;
  usedCodes: number;
  unusedCodes: number;
  expiredCodes: number;
  totalDiscountGiven: number;
  redemptionRate: number;
}

interface PromoCodeDetail {
  id: string;
  code: string;
  discount_percentage: number;
  is_used: boolean;
  used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

interface StaffStats {
  id: string;
  name: string;
  discord_avatar?: string;
  role: string;
  department: string;
  totalActivities: number;
  ticketsResolved: number;
  ticketsAssigned: number;
  avgResponseTime: number | null;
  lastSeen: string | null;
}

interface Player {
  id: number;
  name: string;
  identifiers?: string[];
  ping?: number;
}

interface SupportAnalyticsData {
  totalChats: number;
  openChats: number;
  closedChats: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  satisfactionScore: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Applications
  const [applications, setApplications] = useState<WhitelistApplication[]>([]);
  const [banAppeals, setBanAppeals] = useState<BanAppeal[]>([]);
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [pdmApplications, setPdmApplications] = useState<PDMApplication[]>([]);
  const [creatorApplications, setCreatorApplications] = useState<CreatorApplication[]>([]);
  const [firefighterApplications, setFirefighterApplications] = useState<FirefighterApplication[]>([]);
  const [weazelNewsApplications, setWeazelNewsApplications] = useState<WeazelNewsApplication[]>([]);
  const [submissions, setSubmissions] = useState<GallerySubmission[]>([]);
  
  // Analytics
  const [referralStats, setReferralStats] = useState<ReferralStats>({ totalReferrals: 0, totalDiscountsGiven: 0, activeReferrers: 0, averageReferralsPerUser: 0 });
  const [promoStats, setPromoStats] = useState<PromoStats>({ totalCodes: 0, usedCodes: 0, unusedCodes: 0, expiredCodes: 0, totalDiscountGiven: 0, redemptionRate: 0 });
  const [promoCodes, setPromoCodes] = useState<PromoCodeDetail[]>([]);
  const [staffStats, setStaffStats] = useState<StaffStats[]>([]);
  const [supportAnalytics, setSupportAnalytics] = useState<SupportAnalyticsData | null>(null);
  
  // Players
  const [players, setPlayers] = useState<Player[]>([]);
  const [serverStatus, setServerStatus] = useState<'online' | 'offline'>('offline');
  const [playersLoading, setPlayersLoading] = useState(false);
  
  // Selection states
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
  const [selectedFirefighterApp, setSelectedFirefighterApp] = useState<FirefighterApplication | null>(null);
  const [firefighterAdminNotes, setFirefighterAdminNotes] = useState("");
  const [selectedWeazelApp, setSelectedWeazelApp] = useState<WeazelNewsApplication | null>(null);
  const [weazelAdminNotes, setWeazelAdminNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Player action dialog
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: 'kick' | 'ban' | null;
    player: Player | null;
  }>({ open: false, type: null, player: null });
  const [actionReason, setActionReason] = useState("");

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

      const discordId = user.user_metadata?.discord_id;
      let hasAccess = false;

      // Check if user is owner (full access)
      const OWNER_DISCORD_ID = "833680146510381097";
      if (discordId === OWNER_DISCORD_ID) {
        hasAccess = true;
      }

      // Check if user is in staff_members table (all staff get admin panel access)
      if (!hasAccess && discordId && /^\d{17,19}$/.test(discordId)) {
        const { data: staffMember } = await supabase
          .from("staff_members")
          .select("id, is_active")
          .eq("discord_id", discordId)
          .eq("is_active", true)
          .maybeSingle();

        if (staffMember) {
          hasAccess = true;
        }
      }

      // Fallback: check user_roles table for admin/moderator
      if (!hasAccess) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .in("role", ["admin", "moderator"])
          .maybeSingle();

        if (roleData) {
          hasAccess = true;
        }
      }

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
      loadApplications(),
      loadSubmissions(),
      loadBanAppeals(),
      loadJobApplications(),
      loadPdmApplications(),
      loadCreatorApplications(),
      loadFirefighterApplications(),
      loadWeazelNewsApplications(),
      loadReferralData(),
      loadPromoData(),
      loadStaffStats(),
      loadSupportAnalytics(),
      fetchPlayers(),
    ]);
  };

  const loadApplications = async () => {
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
      setApplications(enrichedData);
    } else {
      setApplications([]);
    }
  };

  const loadSubmissions = async () => {
    const { data, error } = await supabase
      .from("gallery_submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setSubmissions(data || []);
  };

  const loadBanAppeals = async () => {
    const { data, error } = await supabase
      .from("ban_appeals")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setBanAppeals(data || []);
  };

  const loadJobApplications = async () => {
    const { data, error } = await supabase
      .from("job_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setJobApplications(data || []);
  };

  const loadPdmApplications = async () => {
    const { data, error } = await supabase
      .from("pdm_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setPdmApplications(data || []);
  };

  const loadCreatorApplications = async () => {
    const { data, error } = await supabase
      .from("creator_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setCreatorApplications(data || []);
  };

  const loadFirefighterApplications = async () => {
    const { data, error } = await supabase
      .from("firefighter_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setFirefighterApplications(data || []);
  };

  const loadWeazelNewsApplications = async () => {
    const { data, error } = await supabase
      .from("weazel_news_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setWeazelNewsApplications(data || []);
  };

  const loadReferralData = async () => {
    try {
      const { data: rewardsData } = await supabase
        .from("referral_rewards")
        .select("*");

      if (rewardsData) {
        const totalReferrals = rewardsData.reduce((sum, r) => sum + r.total_referrals, 0);
        const activeReferrers = rewardsData.filter(r => r.total_referrals > 0).length;
        const totalDiscountsGiven = rewardsData.reduce((sum, r) => sum + r.discount_percentage, 0);
        const averageReferrals = activeReferrers > 0 ? totalReferrals / activeReferrers : 0;

        setReferralStats({
          totalReferrals,
          totalDiscountsGiven,
          activeReferrers,
          averageReferralsPerUser: Math.round(averageReferrals * 10) / 10,
        });
      }
    } catch (error) {
      console.error("Error loading referral data:", error);
    }
  };

  const loadPromoData = async () => {
    try {
      const { data: codes } = await supabase
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });

      if (codes) {
        setPromoCodes(codes);
        const now = new Date();
        const used = codes.filter(c => c.is_used).length;
        const expired = codes.filter(c => 
          c.expires_at && new Date(c.expires_at) < now && !c.is_used
        ).length;
        const totalDiscount = codes
          .filter(c => c.is_used)
          .reduce((sum, c) => sum + c.discount_percentage, 0);

        setPromoStats({
          totalCodes: codes.length,
          usedCodes: used,
          unusedCodes: codes.length - used,
          expiredCodes: expired,
          totalDiscountGiven: totalDiscount,
          redemptionRate: codes.length > 0 ? (used / codes.length) * 100 : 0,
        });
      }
    } catch (error) {
      console.error("Error loading promo data:", error);
    }
  };

  const loadStaffStats = async () => {
    try {
      const { data: staffMembers } = await supabase
        .from("staff_members")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (staffMembers) {
        const statsPromises = staffMembers.map(async (staff) => {
          const { count: activityCount } = await supabase
            .from("staff_activity_log")
            .select("*", { count: "exact", head: true })
            .eq("staff_user_id", staff.user_id || "");

          const { count: resolvedCount } = await supabase
            .from("support_chats")
            .select("*", { count: "exact", head: true })
            .eq("assigned_to", staff.user_id || "")
            .eq("status", "closed");

          const { count: assignedCount } = await supabase
            .from("support_chats")
            .select("*", { count: "exact", head: true })
            .eq("assigned_to", staff.user_id || "");

          return {
            id: staff.id,
            name: staff.name,
            discord_avatar: staff.discord_avatar,
            role: staff.role,
            department: staff.department,
            totalActivities: activityCount || 0,
            ticketsResolved: resolvedCount || 0,
            ticketsAssigned: assignedCount || 0,
            avgResponseTime: null,
            lastSeen: staff.last_seen,
          };
        });

        const stats = await Promise.all(statsPromises);
        setStaffStats(stats);
      }
    } catch (error) {
      console.error("Error loading staff stats:", error);
    }
  };

  const loadSupportAnalytics = async () => {
    try {
      const { data: chats } = await supabase.from("support_chats").select("*");
      const { data: ratings } = await supabase.from("support_chat_ratings").select("*");

      if (chats) {
        const totalChats = chats.length;
        const openChats = chats.filter(c => c.status === 'open' || c.status === 'pending').length;
        const closedChats = chats.filter(c => c.status === 'closed').length;
        
        const chatsWithResponse = chats.filter(c => c.first_response_at);
        const avgResponseTime = chatsWithResponse.length > 0
          ? chatsWithResponse.reduce((sum, c) => {
              const diff = new Date(c.first_response_at!).getTime() - new Date(c.created_at).getTime();
              return sum + diff / 60000;
            }, 0) / chatsWithResponse.length
          : 0;

        const closedChatsWithTime = chats.filter(c => c.resolved_at);
        const avgResolutionTime = closedChatsWithTime.length > 0
          ? closedChatsWithTime.reduce((sum, c) => {
              const diff = new Date(c.resolved_at!).getTime() - new Date(c.created_at).getTime();
              return sum + diff / 60000;
            }, 0) / closedChatsWithTime.length
          : 0;

        const satisfactionScore = ratings && ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
          : 0;

        setSupportAnalytics({
          totalChats,
          openChats,
          closedChats,
          avgResponseTime: Math.round(avgResponseTime),
          avgResolutionTime: Math.round(avgResolutionTime),
          satisfactionScore: Math.round(satisfactionScore * 10) / 10,
        });
      }
    } catch (error) {
      console.error("Error loading support analytics:", error);
    }
  };

  const fetchPlayers = async () => {
    setPlayersLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fivem-server-status');
      
      if (!error && data) {
        setServerStatus(data.status);
        if (data.status === 'online' && data.playerList) {
          setPlayers(data.playerList);
        } else {
          setPlayers([]);
        }
      }
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setPlayersLoading(false);
    }
  };

  const handlePlayerAction = async () => {
    if (!actionDialog.player || !actionDialog.type) return;

    try {
      const { error } = await supabase.functions.invoke('admin-player-action', {
        body: {
          playerId: actionDialog.player.id,
          action: actionDialog.type,
          reason: actionReason || 'No reason provided',
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Player ${actionDialog.player.name} has been ${actionDialog.type}ed`,
      });

      setActionDialog({ open: false, type: null, player: null });
      setActionReason("");
      fetchPlayers();
    } catch (error) {
      console.error('Error performing action:', error);
      toast({
        title: "Error",
        description: `Failed to ${actionDialog.type} player`,
        variant: "destructive",
      });
    }
  };

  const updateApplicationStatus = async (appId: string, status: "approved" | "rejected") => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get application details for notification
    const app = applications.find(a => a.id === appId);
    
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
      toast({ title: "Error", description: "Failed to update application.", variant: "destructive" });
      return;
    }

    // Send Discord notification for whitelist applications
    if (app?.discord) {
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
          applicantDiscord: app.discord,
          applicantDiscordId: app.discord_id,
          status,
          moderatorName: staffData?.name || user?.email || "Staff",
          moderatorDiscordId: staffData?.discord_id || userDiscordId,
          adminNotes: adminNotes || null
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

    // If approved, automatically assign Discord whitelist role
    if (status === "approved") {
      try {
        const { data: roleResult, error: roleError } = await supabase.functions.invoke('assign-whitelist-role', {
          body: { applicationId: appId }
        });
        
        if (roleError || !roleResult?.success) {
          console.error("Failed to assign Discord role:", roleError || roleResult?.error);
          toast({ 
            title: "Warning", 
            description: `Application approved but failed to assign Discord role: ${roleResult?.error || 'Unknown error'}. The user may need to be in the Discord server.`, 
            variant: "destructive" 
          });
        } else {
          toast({ 
            title: "Success", 
            description: "Application approved and Discord whitelist role assigned!" 
          });
        }
      } catch (roleErr) {
        console.error("Error assigning Discord role:", roleErr);
        toast({ 
          title: "Warning", 
          description: "Application approved but failed to assign Discord role automatically.", 
          variant: "destructive" 
        });
      }
    } else {
      toast({ title: "Success", description: `Application ${status} successfully.` });
    }

    setSelectedApp(null);
    setAdminNotes("");
    loadApplications();
  };

  const updateSubmissionStatus = async (submissionId: string, status: "approved" | "rejected") => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from("gallery_submissions")
      .update({
        status,
        approved_by: status === "approved" ? user?.id : null,
        approved_at: status === "approved" ? new Date().toISOString() : null,
        rejection_reason: status === "rejected" ? rejectionReason || null : null,
      })
      .eq("id", submissionId);

    if (error) {
      toast({ title: "Error", description: "Failed to update submission.", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: `Submission ${status} successfully.` });
    setSelectedSubmission(null);
    setRejectionReason("");
    loadSubmissions();
  };

  const updateBanAppealStatus = async (appealId: string, status: "approved" | "rejected") => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from("ban_appeals")
      .update({
        status,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: appealAdminNotes || null,
      })
      .eq("id", appealId);

    if (error) {
      toast({ title: "Error", description: "Failed to update ban appeal.", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: `Ban appeal ${status} successfully.` });
    setSelectedAppeal(null);
    setAppealAdminNotes("");
    loadBanAppeals();
  };

  const updateJobApplicationStatus = async (jobAppId: string, status: "approved" | "rejected") => {
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
      toast({ title: "Error", description: "Failed to update job application.", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: `Job application ${status} successfully.` });
    setSelectedJobApp(null);
    setJobAdminNotes("");
    loadJobApplications();
  };

  const updatePdmApplicationStatus = async (pdmAppId: string, status: "approved" | "rejected") => {
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
      toast({ title: "Error", description: "Failed to update PDM application.", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: `PDM application ${status} successfully.` });
    setSelectedPdmApp(null);
    setPdmAdminNotes("");
    loadPdmApplications();
  };

  const updateCreatorApplicationStatus = async (creatorAppId: string, status: "approved" | "rejected") => {
    const { data: { user } } = await supabase.auth.getUser();
    
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
      toast({ title: "Error", description: "Failed to update creator application.", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: `Creator application ${status} successfully.` });
    setSelectedCreatorApp(null);
    setCreatorAdminNotes("");
    loadCreatorApplications();
  };

  const updateFirefighterApplicationStatus = async (appId: string, status: "approved" | "rejected") => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from("firefighter_applications")
      .update({
        status,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: firefighterAdminNotes || null,
      })
      .eq("id", appId);

    if (error) {
      toast({ title: "Error", description: "Failed to update firefighter application.", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: `Firefighter application ${status} successfully.` });
    setSelectedFirefighterApp(null);
    setFirefighterAdminNotes("");
    loadFirefighterApplications();
  };

  const updateWeazelApplicationStatus = async (appId: string, status: "approved" | "rejected") => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from("weazel_news_applications")
      .update({
        status,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: weazelAdminNotes || null,
      })
      .eq("id", appId);

    if (error) {
      toast({ title: "Error", description: "Failed to update Weazel News application.", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: `Weazel News application ${status} successfully.` });
    setSelectedWeazelApp(null);
    setWeazelAdminNotes("");
    loadWeazelNewsApplications();
  };

  const getOwnershipProofUrl = (path: string | null) => {
    if (!path) return null;
    const { data } = supabase.storage.from('creator-proofs').getPublicUrl(path);
    return data.publicUrl;
  };

  const formatLastSeen = (lastSeen: string | null) => {
    if (!lastSeen) return "Never";
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getPromoStatusBadge = (code: PromoCodeDetail) => {
    if (code.is_used) {
      return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Used</Badge>;
    }
    if (code.expires_at && new Date(code.expires_at) < new Date()) {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Expired</Badge>;
    }
    return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Active</Badge>;
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

  const pendingWhitelist = applications.filter(a => a.status === 'pending').length;
  const pendingBanAppeals = banAppeals.filter(a => a.status === 'pending').length;
  const pendingGallery = submissions.filter(s => s.status === 'pending').length;
  const pendingJobs = jobApplications.filter(j => j.status === 'pending').length + 
    pdmApplications.filter(p => p.status === 'pending').length +
    firefighterApplications.filter(f => f.status === 'pending').length +
    weazelNewsApplications.filter(w => w.status === 'pending').length;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader 
        title="Admin Dashboard"
        description="Manage applications, analytics, and server"
        backgroundImage={headerAdminBg}
      />
      
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="whitelist" className="space-y-6">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-muted/50">
            <TabsTrigger value="whitelist" className="flex items-center gap-1 text-xs sm:text-sm">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Whitelist</span>
              {pendingWhitelist > 0 && <Badge variant="destructive" className="ml-1 text-xs">{pendingWhitelist}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="ban-appeals" className="flex items-center gap-1 text-xs sm:text-sm">
              <Ban className="w-4 h-4" />
              <span className="hidden sm:inline">Ban Appeals</span>
              {pendingBanAppeals > 0 && <Badge variant="destructive" className="ml-1 text-xs">{pendingBanAppeals}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-1 text-xs sm:text-sm">
              <Image className="w-4 h-4" />
              <span className="hidden sm:inline">Gallery</span>
              {pendingGallery > 0 && <Badge variant="destructive" className="ml-1 text-xs">{pendingGallery}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex items-center gap-1 text-xs sm:text-sm">
              <Briefcase className="w-4 h-4" />
              <span className="hidden sm:inline">Jobs</span>
              {pendingJobs > 0 && <Badge variant="destructive" className="ml-1 text-xs">{pendingJobs}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="creators" className="flex items-center gap-1 text-xs sm:text-sm">
              <Video className="w-4 h-4" />
              <span className="hidden sm:inline">Creators</span>
            </TabsTrigger>
            <TabsTrigger value="referrals" className="flex items-center gap-1 text-xs sm:text-sm">
              <Gift className="w-4 h-4" />
              <span className="hidden sm:inline">Referrals</span>
            </TabsTrigger>
            <TabsTrigger value="promo" className="flex items-center gap-1 text-xs sm:text-sm">
              <Ticket className="w-4 h-4" />
              <span className="hidden sm:inline">Promo</span>
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center gap-1 text-xs sm:text-sm">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Support</span>
            </TabsTrigger>
            <TabsTrigger value="staff-stats" className="flex items-center gap-1 text-xs sm:text-sm">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Staff Stats</span>
            </TabsTrigger>
            <TabsTrigger value="players" className="flex items-center gap-1 text-xs sm:text-sm">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Players</span>
            </TabsTrigger>
          </TabsList>

          {/* Whitelist Applications Tab */}
          <TabsContent value="whitelist">
            <Card className="glass-effect border-border/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <CardTitle className="text-gradient">Whitelist Applications</CardTitle>
                </div>
                <CardDescription>Review and manage whitelist applications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {applications.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No whitelist applications</p>
                ) : (
                  applications.map((app) => (
                    <Card key={app.id} className="border-border/20">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{app.discord}</CardTitle>
                            <CardDescription>Steam ID: {app.steam_id} | Age: {app.age}</CardDescription>
                          </div>
                          <Badge variant={app.status === "approved" ? "default" : app.status === "rejected" ? "destructive" : "secondary"}>
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
                              onChange={(e) => { setSelectedApp(app); setAdminNotes(e.target.value); }}
                            />
                            <div className="flex gap-2">
                              <Button onClick={() => updateApplicationStatus(app.id, "approved")} className="bg-primary hover:bg-primary/90">Approve</Button>
                              <Button onClick={() => updateApplicationStatus(app.id, "rejected")} variant="destructive">Reject</Button>
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

          {/* Ban Appeals Tab */}
          <TabsContent value="ban-appeals">
            <Card className="glass-effect border-border/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Ban className="w-5 h-5 text-primary" />
                  <CardTitle className="text-gradient">Ban Appeals</CardTitle>
                </div>
                <CardDescription>Review and manage ban appeals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {banAppeals.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No ban appeals</p>
                ) : (
                  banAppeals.map((appeal) => (
                    <Card key={appeal.id} className="border-border/20">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{appeal.discord_username}</CardTitle>
                            <CardDescription>Steam ID: {appeal.steam_id}</CardDescription>
                          </div>
                          <Badge variant={appeal.status === "approved" ? "default" : appeal.status === "rejected" ? "destructive" : "secondary"}>
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
                        
                        {appeal.status === "pending" && (
                          <div className="space-y-3 pt-4 border-t">
                            <Textarea
                              placeholder="Admin notes (optional)"
                              value={selectedAppeal?.id === appeal.id ? appealAdminNotes : ""}
                              onChange={(e) => { setSelectedAppeal(appeal); setAppealAdminNotes(e.target.value); }}
                            />
                            <div className="flex gap-2">
                              <Button onClick={() => updateBanAppealStatus(appeal.id, "approved")} className="bg-primary hover:bg-primary/90">Approve</Button>
                              <Button onClick={() => updateBanAppealStatus(appeal.id, "rejected")} variant="destructive">Reject</Button>
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

          {/* Gallery Tab */}
          <TabsContent value="gallery">
            <Card className="glass-effect border-border/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Image className="w-5 h-5 text-primary" />
                  <CardTitle className="text-gradient">Gallery Submissions</CardTitle>
                </div>
                <CardDescription>Review and manage gallery submissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {submissions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No gallery submissions</p>
                ) : (
                  submissions.map((submission) => (
                    <Card key={submission.id} className="border-border/20">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{submission.title}</CardTitle>
                            <CardDescription>Category: {submission.category}</CardDescription>
                          </div>
                          <Badge variant={submission.status === "approved" ? "default" : submission.status === "rejected" ? "destructive" : "secondary"}>
                            {submission.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <img
                          src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/gallery/${submission.file_path}`}
                          alt={submission.title}
                          className="w-full max-w-md rounded-lg"
                        />
                        
                        {submission.status === "pending" && (
                          <div className="space-y-3 pt-4 border-t">
                            <Textarea
                              placeholder="Rejection reason (optional)"
                              value={selectedSubmission?.id === submission.id ? rejectionReason : ""}
                              onChange={(e) => { setSelectedSubmission(submission); setRejectionReason(e.target.value); }}
                            />
                            <div className="flex gap-2">
                              <Button onClick={() => updateSubmissionStatus(submission.id, "approved")} className="bg-primary hover:bg-primary/90">Approve</Button>
                              <Button onClick={() => updateSubmissionStatus(submission.id, "rejected")} variant="destructive">Reject</Button>
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

          {/* Job Applications Tab */}
          <TabsContent value="jobs">
            <Card className="glass-effect border-border/20">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-primary" />
                    <div>
                      <CardTitle className="text-gradient">All Job Applications</CardTitle>
                      <CardDescription>Review all submitted job applications ({jobApplications.length + pdmApplications.length + firefighterApplications.length + weazelNewsApplications.length} total)</CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      🚔 Police: {jobApplications.filter(j => j.job_type === "Police Department").length}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      🚑 EMS: {jobApplications.filter(j => j.job_type === "EMS").length}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      🔧 Mechanic: {jobApplications.filter(j => j.job_type === "Mechanic").length}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      ⚖️ DOJ: {jobApplications.filter(j => j.job_type.includes("DOJ")).length}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      🔫 Gang: {jobApplications.filter(j => j.job_type === "Gang Roleplay").length}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      🚗 PDM: {pdmApplications.length}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      🚒 Firefighter: {firefighterApplications.length}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      📰 Weazel: {weazelNewsApplications.length}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Police Department Applications */}
                {jobApplications.filter(j => j.job_type === "Police Department").length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      🚔 Police Department Applications 
                      <Badge variant="outline">{jobApplications.filter(j => j.job_type === "Police Department").length}</Badge>
                    </h3>
                    <div className="space-y-4">
                      {jobApplications.filter(j => j.job_type === "Police Department").map((jobApp) => (
                        <Card key={jobApp.id} className="border-blue-500/20">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg">{jobApp.character_name}</CardTitle>
                                <CardDescription>Age: {jobApp.age} | Phone: {jobApp.phone_number}</CardDescription>
                              </div>
                              <Badge variant={jobApp.status === "approved" ? "default" : jobApp.status === "rejected" ? "destructive" : "secondary"}>
                                {jobApp.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              <div>
                                <h4 className="font-semibold text-sm mb-1">Why Join</h4>
                                <p className="text-sm text-muted-foreground">{jobApp.why_join}</p>
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm mb-1">Previous Experience</h4>
                                <p className="text-sm text-muted-foreground">{jobApp.previous_experience}</p>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm mb-1">Character Background</h4>
                              <p className="text-sm text-muted-foreground">{jobApp.character_background}</p>
                            </div>
                            {jobApp.job_specific_answer && (
                              <div>
                                <h4 className="font-semibold text-sm mb-1">Scenario Response</h4>
                                <p className="text-sm text-muted-foreground">{jobApp.job_specific_answer}</p>
                              </div>
                            )}
                            
                            {jobApp.status === "pending" && (
                              <div className="space-y-3 pt-4 border-t">
                                <Textarea
                                  placeholder="Admin notes (optional)"
                                  value={selectedJobApp?.id === jobApp.id ? jobAdminNotes : ""}
                                  onChange={(e) => { setSelectedJobApp(jobApp); setJobAdminNotes(e.target.value); }}
                                />
                                <div className="flex gap-2">
                                  <Button onClick={() => updateJobApplicationStatus(jobApp.id, "approved")} className="bg-blue-600 hover:bg-blue-700">Approve</Button>
                                  <Button onClick={() => updateJobApplicationStatus(jobApp.id, "rejected")} variant="destructive">Reject</Button>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* EMS Applications */}
                {jobApplications.filter(j => j.job_type === "EMS").length > 0 && (
                  <div className="pt-6 border-t">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      🚑 EMS Applications 
                      <Badge variant="outline">{jobApplications.filter(j => j.job_type === "EMS").length}</Badge>
                    </h3>
                    <div className="space-y-4">
                      {jobApplications.filter(j => j.job_type === "EMS").map((jobApp) => (
                        <Card key={jobApp.id} className="border-red-500/20">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg">{jobApp.character_name}</CardTitle>
                                <CardDescription>Age: {jobApp.age} | Phone: {jobApp.phone_number}</CardDescription>
                              </div>
                              <Badge variant={jobApp.status === "approved" ? "default" : jobApp.status === "rejected" ? "destructive" : "secondary"}>
                                {jobApp.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              <div>
                                <h4 className="font-semibold text-sm mb-1">Why Join</h4>
                                <p className="text-sm text-muted-foreground">{jobApp.why_join}</p>
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm mb-1">Previous Experience</h4>
                                <p className="text-sm text-muted-foreground">{jobApp.previous_experience}</p>
                              </div>
                            </div>
                            {jobApp.job_specific_answer && (
                              <div>
                                <h4 className="font-semibold text-sm mb-1">Scenario Response</h4>
                                <p className="text-sm text-muted-foreground">{jobApp.job_specific_answer}</p>
                              </div>
                            )}
                            
                            {jobApp.status === "pending" && (
                              <div className="space-y-3 pt-4 border-t">
                                <Textarea
                                  placeholder="Admin notes (optional)"
                                  value={selectedJobApp?.id === jobApp.id ? jobAdminNotes : ""}
                                  onChange={(e) => { setSelectedJobApp(jobApp); setJobAdminNotes(e.target.value); }}
                                />
                                <div className="flex gap-2">
                                  <Button onClick={() => updateJobApplicationStatus(jobApp.id, "approved")} className="bg-red-600 hover:bg-red-700">Approve</Button>
                                  <Button onClick={() => updateJobApplicationStatus(jobApp.id, "rejected")} variant="destructive">Reject</Button>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mechanic Applications */}
                {jobApplications.filter(j => j.job_type === "Mechanic").length > 0 && (
                  <div className="pt-6 border-t">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      🔧 Mechanic Applications 
                      <Badge variant="outline">{jobApplications.filter(j => j.job_type === "Mechanic").length}</Badge>
                    </h3>
                    <div className="space-y-4">
                      {jobApplications.filter(j => j.job_type === "Mechanic").map((jobApp) => (
                        <Card key={jobApp.id} className="border-yellow-500/20">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg">{jobApp.character_name}</CardTitle>
                                <CardDescription>Age: {jobApp.age} | Phone: {jobApp.phone_number}</CardDescription>
                              </div>
                              <Badge variant={jobApp.status === "approved" ? "default" : jobApp.status === "rejected" ? "destructive" : "secondary"}>
                                {jobApp.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              <div>
                                <h4 className="font-semibold text-sm mb-1">Why Join</h4>
                                <p className="text-sm text-muted-foreground">{jobApp.why_join}</p>
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm mb-1">Previous Experience</h4>
                                <p className="text-sm text-muted-foreground">{jobApp.previous_experience}</p>
                              </div>
                            </div>
                            {jobApp.job_specific_answer && (
                              <div>
                                <h4 className="font-semibold text-sm mb-1">Scenario Response</h4>
                                <p className="text-sm text-muted-foreground">{jobApp.job_specific_answer}</p>
                              </div>
                            )}
                            
                            {jobApp.status === "pending" && (
                              <div className="space-y-3 pt-4 border-t">
                                <Textarea
                                  placeholder="Admin notes (optional)"
                                  value={selectedJobApp?.id === jobApp.id ? jobAdminNotes : ""}
                                  onChange={(e) => { setSelectedJobApp(jobApp); setJobAdminNotes(e.target.value); }}
                                />
                                <div className="flex gap-2">
                                  <Button onClick={() => updateJobApplicationStatus(jobApp.id, "approved")} className="bg-yellow-600 hover:bg-yellow-700">Approve</Button>
                                  <Button onClick={() => updateJobApplicationStatus(jobApp.id, "rejected")} variant="destructive">Reject</Button>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* DOJ Applications (Judge & Attorney) */}
                {jobApplications.filter(j => j.job_type.includes("DOJ")).length > 0 && (
                  <div className="pt-6 border-t">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      ⚖️ DOJ Applications (Judge & Attorney)
                      <Badge variant="outline">{jobApplications.filter(j => j.job_type.includes("DOJ")).length}</Badge>
                    </h3>
                    <div className="space-y-4">
                      {jobApplications.filter(j => j.job_type.includes("DOJ")).map((jobApp) => (
                        <Card key={jobApp.id} className="border-purple-500/20">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg">{jobApp.character_name}</CardTitle>
                                <CardDescription>Position: {jobApp.job_type} | Age: {jobApp.age} | Phone: {jobApp.phone_number}</CardDescription>
                              </div>
                              <div className="flex gap-2">
                                <Badge variant="outline">{jobApp.job_type.replace("DOJ - ", "")}</Badge>
                                <Badge variant={jobApp.status === "approved" ? "default" : jobApp.status === "rejected" ? "destructive" : "secondary"}>
                                  {jobApp.status}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              <div>
                                <h4 className="font-semibold text-sm mb-1">Why Join DOJ</h4>
                                <p className="text-sm text-muted-foreground">{jobApp.why_join}</p>
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm mb-1">Legal Experience</h4>
                                <p className="text-sm text-muted-foreground">{jobApp.previous_experience}</p>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm mb-1">Character Legal Background</h4>
                              <p className="text-sm text-muted-foreground">{jobApp.character_background}</p>
                            </div>
                            {jobApp.job_specific_answer && (
                              <div>
                                <h4 className="font-semibold text-sm mb-1">Law Knowledge & Court Scenario</h4>
                                <p className="text-sm text-muted-foreground whitespace-pre-line">{jobApp.job_specific_answer}</p>
                              </div>
                            )}
                            
                            {jobApp.status === "pending" && (
                              <div className="space-y-3 pt-4 border-t">
                                <Textarea
                                  placeholder="Admin notes (optional)"
                                  value={selectedJobApp?.id === jobApp.id ? jobAdminNotes : ""}
                                  onChange={(e) => { setSelectedJobApp(jobApp); setJobAdminNotes(e.target.value); }}
                                />
                                <div className="flex gap-2">
                                  <Button onClick={() => updateJobApplicationStatus(jobApp.id, "approved")} className="bg-purple-600 hover:bg-purple-700">Approve</Button>
                                  <Button onClick={() => updateJobApplicationStatus(jobApp.id, "rejected")} variant="destructive">Reject</Button>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gang Roleplay Applications */}
                {jobApplications.filter(j => j.job_type === "Gang Roleplay").length > 0 && (
                  <div className="pt-6 border-t">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      🔫 Gang Roleplay Applications 
                      <Badge variant="outline">{jobApplications.filter(j => j.job_type === "Gang Roleplay").length}</Badge>
                    </h3>
                    <div className="space-y-4">
                      {jobApplications.filter(j => j.job_type === "Gang Roleplay").map((jobApp) => {
                        let gangDetails = null;
                        try {
                          gangDetails = jobApp.job_specific_answer ? JSON.parse(jobApp.job_specific_answer) : null;
                        } catch { gangDetails = null; }
                        
                        return (
                          <Card key={jobApp.id} className="border-red-600/20">
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div>
                                  <CardTitle className="text-lg">{jobApp.character_name}</CardTitle>
                                  <CardDescription>
                                    Age: {jobApp.age} | Discord: {jobApp.phone_number}
                                    {gangDetails?.gang_type_preference && ` | Preference: ${gangDetails.gang_type_preference}`}
                                  </CardDescription>
                                </div>
                                <Badge variant={jobApp.status === "approved" ? "default" : jobApp.status === "rejected" ? "destructive" : "secondary"}>
                                  {jobApp.status}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                  <h4 className="font-semibold text-sm mb-1">Why Join Gang RP</h4>
                                  <p className="text-sm text-muted-foreground">{jobApp.why_join}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm mb-1">RP Experience</h4>
                                  <p className="text-sm text-muted-foreground">{jobApp.previous_experience}</p>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm mb-1">Character Backstory</h4>
                                <p className="text-sm text-muted-foreground">{jobApp.character_background}</p>
                              </div>
                              {gangDetails && (
                                <div className="grid gap-4 md:grid-cols-2">
                                  {gangDetails.criminal_rp_experience && (
                                    <div>
                                      <h4 className="font-semibold text-sm mb-1">Criminal RP Experience</h4>
                                      <p className="text-sm text-muted-foreground">{gangDetails.criminal_rp_experience}</p>
                                    </div>
                                  )}
                                  {gangDetails.conflict_scenario && (
                                    <div>
                                      <h4 className="font-semibold text-sm mb-1">Conflict Scenario</h4>
                                      <p className="text-sm text-muted-foreground">{gangDetails.conflict_scenario}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {jobApp.status === "pending" && (
                                <div className="space-y-3 pt-4 border-t">
                                  <Textarea
                                    placeholder="Admin notes (optional)"
                                    value={selectedJobApp?.id === jobApp.id ? jobAdminNotes : ""}
                                    onChange={(e) => { setSelectedJobApp(jobApp); setJobAdminNotes(e.target.value); }}
                                  />
                                  <div className="flex gap-2">
                                    <Button onClick={() => updateJobApplicationStatus(jobApp.id, "approved")} className="bg-red-700 hover:bg-red-800">Approve</Button>
                                    <Button onClick={() => updateJobApplicationStatus(jobApp.id, "rejected")} variant="destructive">Reject</Button>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* PDM Applications */}
                <div className="pt-6 border-t">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    🚗 PDM (Premium Deluxe Motorsport) Applications 
                    <Badge variant="outline">{pdmApplications.length}</Badge>
                  </h3>
                  {pdmApplications.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No PDM applications</p>
                  ) : (
                    <div className="space-y-4">
                      {pdmApplications.map((pdmApp) => (
                        <Card key={pdmApp.id} className="border-green-500/20">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg">{pdmApp.character_name}</CardTitle>
                                <CardDescription>Age: {pdmApp.age} | Phone: {pdmApp.phone_number}</CardDescription>
                              </div>
                              <Badge variant={pdmApp.status === "approved" ? "default" : pdmApp.status === "rejected" ? "destructive" : "secondary"}>
                                {pdmApp.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              <div>
                                <h4 className="font-semibold text-sm mb-1">Sales Experience</h4>
                                <p className="text-sm text-muted-foreground">{pdmApp.sales_experience}</p>
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm mb-1">Vehicle Knowledge</h4>
                                <p className="text-sm text-muted-foreground">{pdmApp.vehicle_knowledge}</p>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm mb-1">Customer Scenario</h4>
                              <p className="text-sm text-muted-foreground">{pdmApp.customer_scenario}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm mb-1">Why Join</h4>
                              <p className="text-sm text-muted-foreground">{pdmApp.why_join}</p>
                            </div>
                            
                            {pdmApp.status === "pending" && (
                              <div className="space-y-3 pt-4 border-t">
                                <Textarea
                                  placeholder="Admin notes (optional)"
                                  value={selectedPdmApp?.id === pdmApp.id ? pdmAdminNotes : ""}
                                  onChange={(e) => { setSelectedPdmApp(pdmApp); setPdmAdminNotes(e.target.value); }}
                                />
                                <div className="flex gap-2">
                                  <Button onClick={() => updatePdmApplicationStatus(pdmApp.id, "approved")} className="bg-green-600 hover:bg-green-700">Approve</Button>
                                  <Button onClick={() => updatePdmApplicationStatus(pdmApp.id, "rejected")} variant="destructive">Reject</Button>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Firefighter Applications */}
                <div className="pt-6 border-t">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    🚒 Firefighter Applications 
                    <Badge variant="outline">{firefighterApplications.length}</Badge>
                  </h3>
                  {firefighterApplications.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No firefighter applications</p>
                  ) : (
                    <div className="space-y-4">
                      {firefighterApplications.map((ffApp) => (
                        <Card key={ffApp.id} className="border-orange-500/20">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg">{ffApp.in_game_name}</CardTitle>
                                <CardDescription>
                                  Real Name: {ffApp.real_name} | Discord: {ffApp.discord_id}
                                </CardDescription>
                              </div>
                              <Badge variant={ffApp.status === "approved" ? "default" : ffApp.status === "rejected" ? "destructive" : "secondary"}>
                                {ffApp.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              <div>
                                <h4 className="font-semibold text-sm mb-1">Steam ID</h4>
                                <p className="text-sm text-muted-foreground">{ffApp.steam_id}</p>
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm mb-1">Weekly Availability</h4>
                                <p className="text-sm text-muted-foreground">{ffApp.weekly_availability}</p>
                              </div>
                            </div>
                            
                            {ffApp.status === "pending" && (
                              <div className="space-y-3 pt-4 border-t">
                                <Textarea
                                  placeholder="Admin notes (optional)"
                                  value={selectedFirefighterApp?.id === ffApp.id ? firefighterAdminNotes : ""}
                                  onChange={(e) => { setSelectedFirefighterApp(ffApp); setFirefighterAdminNotes(e.target.value); }}
                                />
                                <div className="flex gap-2">
                                  <Button onClick={() => updateFirefighterApplicationStatus(ffApp.id, "approved")} className="bg-orange-600 hover:bg-orange-700">Approve</Button>
                                  <Button onClick={() => updateFirefighterApplicationStatus(ffApp.id, "rejected")} variant="destructive">Reject</Button>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Weazel News Applications */}
                <div className="pt-6 border-t">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    📰 Weazel News Applications 
                    <Badge variant="outline">{weazelNewsApplications.length}</Badge>
                  </h3>
                  {weazelNewsApplications.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No Weazel News applications</p>
                  ) : (
                    <div className="space-y-4">
                      {weazelNewsApplications.map((wnApp) => (
                        <Card key={wnApp.id} className="border-cyan-500/20">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg">{wnApp.character_name}</CardTitle>
                                <CardDescription>Age: {wnApp.age} | Phone: {wnApp.phone_number}</CardDescription>
                              </div>
                              <Badge variant={wnApp.status === "approved" ? "default" : wnApp.status === "rejected" ? "destructive" : "secondary"}>
                                {wnApp.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              <div>
                                <h4 className="font-semibold text-sm mb-1">Journalism Experience</h4>
                                <p className="text-sm text-muted-foreground">{wnApp.journalism_experience}</p>
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm mb-1">Camera Skills</h4>
                                <p className="text-sm text-muted-foreground">{wnApp.camera_skills}</p>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm mb-1">Writing Sample</h4>
                              <p className="text-sm text-muted-foreground">{wnApp.writing_sample}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm mb-1">Interview Scenario</h4>
                              <p className="text-sm text-muted-foreground">{wnApp.interview_scenario}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm mb-1">Why Join</h4>
                              <p className="text-sm text-muted-foreground">{wnApp.why_join}</p>
                            </div>
                            
                            {wnApp.status === "pending" && (
                              <div className="space-y-3 pt-4 border-t">
                                <Textarea
                                  placeholder="Admin notes (optional)"
                                  value={selectedWeazelApp?.id === wnApp.id ? weazelAdminNotes : ""}
                                  onChange={(e) => { setSelectedWeazelApp(wnApp); setWeazelAdminNotes(e.target.value); }}
                                />
                                <div className="flex gap-2">
                                  <Button onClick={() => updateWeazelApplicationStatus(wnApp.id, "approved")} className="bg-cyan-600 hover:bg-cyan-700">Approve</Button>
                                  <Button onClick={() => updateWeazelApplicationStatus(wnApp.id, "rejected")} variant="destructive">Reject</Button>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Empty State */}
                {jobApplications.length === 0 && pdmApplications.length === 0 && firefighterApplications.length === 0 && weazelNewsApplications.length === 0 && (
                  <div className="text-center py-12">
                    <Briefcase className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No job applications submitted yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Creators Tab */}
          <TabsContent value="creators">
            <Card className="glass-effect border-border/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-purple-500" />
                  <CardTitle className="text-gradient">Creator Applications</CardTitle>
                </div>
                <CardDescription>Review content creator applications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {creatorApplications.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No creator applications</p>
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
                            <Badge variant={creatorApp.status === "approved" ? "default" : creatorApp.status === "rejected" ? "destructive" : "secondary"}>
                              {creatorApp.status}
                            </Badge>
                            <Badge variant="outline" className="capitalize">{creatorApp.platform}</Badge>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => window.open(creatorApp.channel_url, '_blank')}>
                            <ExternalLink className="w-4 h-4 mr-1" />View Channel
                          </Button>
                        </div>
                        
                        {creatorApp.status === "pending" && (
                          <div className="space-y-3 pt-4 border-t">
                            <Textarea
                              placeholder="Admin notes (optional)"
                              value={selectedCreatorApp?.id === creatorApp.id ? creatorAdminNotes : ""}
                              onChange={(e) => { setSelectedCreatorApp(creatorApp); setCreatorAdminNotes(e.target.value); }}
                            />
                            <div className="flex gap-2">
                              <Button onClick={() => updateCreatorApplicationStatus(creatorApp.id, "approved")} className="bg-green-600 hover:bg-green-700">Approve</Button>
                              <Button onClick={() => updateCreatorApplicationStatus(creatorApp.id, "rejected")} variant="destructive">Reject</Button>
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

          {/* Referral Analytics Tab */}
          <TabsContent value="referrals">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="glass-effect border-primary/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />Total Referrals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">{referralStats.totalReferrals}</div>
                  </CardContent>
                </Card>
                <Card className="glass-effect border-accent/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-accent" />Active Referrers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-accent">{referralStats.activeReferrers}</div>
                  </CardContent>
                </Card>
                <Card className="glass-effect border-secondary/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Gift className="w-4 h-4 text-secondary" />Total Discounts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-secondary">{referralStats.totalDiscountsGiven}%</div>
                  </CardContent>
                </Card>
                <Card className="glass-effect border-primary/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Avg per User</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">{referralStats.averageReferralsPerUser}</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Promo Code Analytics Tab */}
          <TabsContent value="promo">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Ticket className="w-4 h-4" />Total Codes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{promoStats.totalCodes}</div>
                    <p className="text-xs text-muted-foreground">{promoStats.unusedCodes} active</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />Redemption Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{promoStats.redemptionRate.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">{promoStats.usedCodes} redeemed</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />Total Discount Given
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{promoStats.totalDiscountGiven}%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <XCircle className="w-4 h-4" />Expired Codes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{promoStats.expiredCodes}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>All Promo Codes</CardTitle>
                    <Input
                      placeholder="Search codes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-xs"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Expires</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {promoCodes
                        .filter(code => code.code.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((code) => (
                          <TableRow key={code.id}>
                            <TableCell className="font-mono font-semibold">{code.code}</TableCell>
                            <TableCell>{code.discount_percentage}%</TableCell>
                            <TableCell>{getPromoStatusBadge(code)}</TableCell>
                            <TableCell>{new Date(code.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>{code.expires_at ? new Date(code.expires_at).toLocaleDateString() : "Never"}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Support Analytics Tab */}
          <TabsContent value="support">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Support Analytics</h2>
                <Button onClick={() => navigate('/admin/support-chat')} variant="outline">
                  <MessageSquare className="w-4 h-4 mr-2" />Open Support Chat
                </Button>
              </div>
              
              {supportAnalytics && (
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{supportAnalytics.totalChats}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Open</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-500">{supportAnalytics.openChats}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Closed</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-500">{supportAnalytics.closedChats}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{supportAnalytics.avgResponseTime}m</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{supportAnalytics.avgResolutionTime}m</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{supportAnalytics.satisfactionScore}/5</div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Staff Stats Tab */}
          <TabsContent value="staff-stats">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="glass-effect border-border/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />Active Staff
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gradient">{staffStats.length}</div>
                  </CardContent>
                </Card>
                <Card className="glass-effect border-border/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />Tickets Resolved
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gradient">
                      {staffStats.reduce((sum, s) => sum + s.ticketsResolved, 0)}
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-effect border-border/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-500" />Total Activities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gradient">
                      {staffStats.reduce((sum, s) => sum + s.totalActivities, 0)}
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-effect border-border/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Award className="w-4 h-4 text-yellow-500" />Top Performer
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold text-gradient">
                      {staffStats.sort((a, b) => b.ticketsResolved - a.ticketsResolved)[0]?.name || "N/A"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="glass-effect border-border/20">
                <CardHeader>
                  <CardTitle>Staff Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {staffStats.map((staff) => (
                    <div key={staff.id} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                      <Avatar className="w-12 h-12 border-2 border-primary">
                        <AvatarImage src={staff.discord_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${staff.name}`} />
                        <AvatarFallback>{staff.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-semibold">{staff.name}</div>
                        <div className="text-xs text-muted-foreground">{staff.role} • {staff.department}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-500">{staff.ticketsResolved}</div>
                        <div className="text-xs text-muted-foreground">Resolved</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-500">{staff.ticketsAssigned}</div>
                        <div className="text-xs text-muted-foreground">Assigned</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{staff.totalActivities}</div>
                        <div className="text-xs text-muted-foreground">Activities</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">{formatLastSeen(staff.lastSeen)}</div>
                        <div className="text-xs text-muted-foreground">Last Seen</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Players Tab */}
          <TabsContent value="players">
            <Card className="glass-effect border-border/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-primary" />
                    <div>
                      <CardTitle>Connected Players</CardTitle>
                      <CardDescription>Real-time player list from FiveM server</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={serverStatus === 'online' ? 'default' : 'destructive'}>
                      {serverStatus === 'online' ? 'Server Online' : 'Server Offline'}
                    </Badge>
                    <Button onClick={fetchPlayers} disabled={playersLoading} variant="outline" size="sm">
                      <RefreshCw className={`w-4 h-4 mr-2 ${playersLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {playersLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : serverStatus === 'offline' ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg text-muted-foreground">Server is currently offline</p>
                  </div>
                ) : players.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg text-muted-foreground">No players connected</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {players.map((player) => (
                      <Card key={player.id} className="bg-background/50 border-border/40">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <User className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <div className="font-medium">{player.name}</div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Hash className="w-3 h-3" />ID: {player.id}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {player.ping !== undefined && (
                                <Badge variant="outline">{player.ping}ms</Badge>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => setActionDialog({ open: true, type: 'kick', player })}
                                    className="text-orange-600"
                                  >
                                    <UserX className="w-4 h-4 mr-2" />Kick Player
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => setActionDialog({ open: true, type: 'ban', player })}
                                    className="text-destructive"
                                  >
                                    <Ban className="w-4 h-4 mr-2" />Ban Player
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Player Action Dialog */}
      <AlertDialog open={actionDialog.open} onOpenChange={(open) => {
        if (!open) {
          setActionDialog({ open: false, type: null, player: null });
          setActionReason("");
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog.type === 'kick' ? 'Kick Player' : 'Ban Player'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {actionDialog.type} {actionDialog.player?.name}?
              {actionDialog.type === 'ban' && ' This action will permanently ban the player.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              placeholder="Enter reason for this action..."
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePlayerAction}
              className={actionDialog.type === 'ban' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {actionDialog.type === 'kick' ? 'Kick' : 'Ban'} Player
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;
