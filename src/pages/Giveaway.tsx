import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Gift, 
  Trophy, 
  Clock, 
  Sparkles, 
  CheckCircle2,
  XCircle,
  Ticket,
  CalendarDays,
  Crown,
  Loader2,
  Plus,
  Users,
  Image,
  Send,
  Eye,
  Pencil
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, differenceInSeconds, differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";
import headerGiveaway from "@/assets/header-giveaway.jpg";

interface Giveaway {
  id: string;
  title: string;
  description: string | null;
  prize: string;
  prize_image_url: string | null;
  start_date: string;
  end_date: string;
  status: string;
  category: string;
  winner_count: number;
  max_entries: number | null;
}

interface GiveawayEntry {
  id: string;
  giveaway_id: string;
  user_id: string;
  entry_count: number;
  is_winner: boolean;
  discord_username: string | null;
  discord_id: string | null;
  created_at: string;
}

interface GiveawayWinner {
  id: string;
  giveaway_id: string;
  user_id: string;
  discord_username: string | null;
  prize_claimed: boolean;
  created_at: string;
}

interface GiveawayStats {
  totalGiveaways: number;
  activeGiveaways: number;
  upcomingGiveaways: number;
  totalEntries: number;
  totalWinners: number;
}

// Helper to determine giveaway status based on dates
const getGiveawayStatus = (giveaway: Giveaway): 'upcoming' | 'active' | 'ended' => {
  const now = new Date();
  const startDate = new Date(giveaway.start_date);
  const endDate = new Date(giveaway.end_date);
  
  if (giveaway.status === 'ended' || giveaway.status === 'completed') {
    return 'ended';
  }
  
  if (now < startDate) {
    return 'upcoming';
  }
  
  if (now >= startDate && now <= endDate) {
    return 'active';
  }
  
  return 'ended';
};

const Giveaway = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [userEntries, setUserEntries] = useState<GiveawayEntry[]>([]);
  const [stats, setStats] = useState<GiveawayStats>({
    totalGiveaways: 0,
    activeGiveaways: 0,
    upcomingGiveaways: 0,
    totalEntries: 0,
    totalWinners: 0
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [enteringId, setEnteringId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("active");
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showEntriesDialog, setShowEntriesDialog] = useState(false);
  const [showWinnersDialog, setShowWinnersDialog] = useState(false);
  const [showAllEntriesDialog, setShowAllEntriesDialog] = useState(false);
  const [showAllWinnersDialog, setShowAllWinnersDialog] = useState(false);
  const [showSelectWinnersDialog, setShowSelectWinnersDialog] = useState(false);
  
  // Data states
  const [allEntries, setAllEntries] = useState<(GiveawayEntry & { giveaway_title?: string })[]>([]);
  const [allWinners, setAllWinners] = useState<(GiveawayWinner & { giveaway_title?: string })[]>([]);
  const [selectedGiveawayEntries, setSelectedGiveawayEntries] = useState<GiveawayEntry[]>([]);
  const [selectedGiveawayWinners, setSelectedGiveawayWinners] = useState<GiveawayWinner[]>([]);
  const [selectedGiveaway, setSelectedGiveaway] = useState<Giveaway | null>(null);
  
  // Form states
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [selectingWinners, setSelectingWinners] = useState(false);
  const [newGiveaway, setNewGiveaway] = useState({
    title: '',
    description: '',
    prize: '',
    prize_image_url: '',
    start_date: '',
    end_date: '',
    winner_count: 1,
    category: 'all',
    startNow: true
  });
  const [editGiveaway, setEditGiveaway] = useState<{
    id: string;
    title: string;
    description: string;
    prize: string;
    prize_image_url: string;
    start_date: string;
    end_date: string;
    winner_count: number;
    category: string;
    status: string;
  } | null>(null);

  useEffect(() => {
    fetchData();
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      fetchUserEntries(user.id);
      
      // Check if user can manage giveaways (owner, admin in staff_members OR admin/moderator in user_roles)
      const [staffResult, rolesResult] = await Promise.all([
        supabase
          .from("staff_members")
          .select("role_type")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .maybeSingle(),
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .in("role", ["admin", "moderator"])
      ]);
      
      const isOwnerOrAdmin = staffResult.data?.role_type === "owner" || 
                              staffResult.data?.role_type === "admin";
      const hasAdminRole = rolesResult.data && rolesResult.data.length > 0;
      
      setIsOwner(isOwnerOrAdmin || hasAdminRole);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: giveawaysData, error } = await supabase
        .from("giveaways")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGiveaways(giveawaysData || []);

      // Calculate stats using proper status detection
      const now = new Date();
      const activeCount = giveawaysData?.filter(g => {
        const status = getGiveawayStatus(g as Giveaway);
        return status === 'active';
      }).length || 0;
      
      const upcomingCount = giveawaysData?.filter(g => {
        const status = getGiveawayStatus(g as Giveaway);
        return status === 'upcoming';
      }).length || 0;

      const { count: entriesCount } = await supabase
        .from("giveaway_entries")
        .select("*", { count: "exact", head: true });

      const { count: winnersCount } = await supabase
        .from("giveaway_winners")
        .select("*", { count: "exact", head: true });

      setStats({
        totalGiveaways: giveawaysData?.length || 0,
        activeGiveaways: activeCount,
        upcomingGiveaways: upcomingCount,
        totalEntries: entriesCount || 0,
        totalWinners: winnersCount || 0
      });
    } catch (error) {
      console.error("Error fetching giveaways:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserEntries = async (userId: string) => {
    const { data, error } = await supabase
      .from("giveaway_entries")
      .select("*")
      .eq("user_id", userId);

    if (!error && data) {
      setUserEntries(data as GiveawayEntry[]);
    }
  };

  const fetchAllEntries = async () => {
    const { data, error } = await supabase
      .from("giveaway_entries")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      const entriesWithTitles = data.map((entry: any) => {
        const giveaway = giveaways.find(g => g.id === entry.giveaway_id);
        return { ...entry, giveaway_title: giveaway?.title || 'Unknown Giveaway' };
      });
      setAllEntries(entriesWithTitles);
    }
  };

  const fetchAllWinners = async () => {
    const { data, error } = await supabase
      .from("giveaway_winners")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      const winnersWithTitles = data.map((winner: any) => {
        const giveaway = giveaways.find(g => g.id === winner.giveaway_id);
        return { ...winner, giveaway_title: giveaway?.title || 'Unknown Giveaway' };
      });
      setAllWinners(winnersWithTitles);
    }
  };

  const handleShowAllEntries = async () => {
    await fetchAllEntries();
    setShowAllEntriesDialog(true);
  };

  const handleShowAllWinners = async () => {
    await fetchAllWinners();
    setShowAllWinnersDialog(true);
  };

  const enterGiveaway = async (giveawayId: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to enter the giveaway.",
        variant: "destructive",
      });
      return;
    }

    setEnteringId(giveawayId);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("discord_username, discord_id")
        .eq("id", user.id)
        .single();

      const { error } = await supabase.from("giveaway_entries").insert({
        giveaway_id: giveawayId,
        user_id: user.id,
        discord_username: profile?.discord_username || null,
        discord_id: profile?.discord_id || null,
        entry_count: 1,
      });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already Entered",
            description: "You have already entered this giveaway!",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Entry Successful! 🎉",
          description: "You've been entered into the giveaway. Good luck!",
        });
        fetchUserEntries(user.id);
        fetchData();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to enter giveaway.",
        variant: "destructive",
      });
    } finally {
      setEnteringId(null);
    }
  };

  const createGiveaway = async () => {
    if (!newGiveaway.title || !newGiveaway.prize || !newGiveaway.end_date) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Validate scheduled start date if not starting now
    if (!newGiveaway.startNow && !newGiveaway.start_date) {
      toast({
        title: "Missing Start Date",
        description: "Please set a start date for scheduled giveaways.",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const startDate = newGiveaway.startNow 
        ? new Date().toISOString() 
        : new Date(newGiveaway.start_date).toISOString();
      
      const status = newGiveaway.startNow ? 'active' : 'upcoming';

      const { data, error } = await supabase.from("giveaways").insert({
        title: newGiveaway.title,
        description: newGiveaway.description || null,
        prize: newGiveaway.prize,
        prize_image_url: newGiveaway.prize_image_url || null,
        end_date: new Date(newGiveaway.end_date).toISOString(),
        start_date: startDate,
        winner_count: newGiveaway.winner_count,
        category: newGiveaway.category,
        status: status,
        created_by: user?.id
      }).select().single();

      if (error) throw error;

      // Send Discord notification only for active giveaways
      if (status === 'active') {
        await supabase.functions.invoke('send-giveaway-discord', {
          body: {
            type: 'new_giveaway',
            giveaway: {
              title: newGiveaway.title,
              description: newGiveaway.description,
              prize: newGiveaway.prize,
              end_date: newGiveaway.end_date,
              winner_count: newGiveaway.winner_count,
              prize_image_url: newGiveaway.prize_image_url || null
            }
          }
        });
      }

      toast({
        title: status === 'active' ? "Giveaway Created! 🎉" : "Giveaway Scheduled! 📅",
        description: status === 'active' 
          ? "The giveaway is now live and announced on Discord!" 
          : "The giveaway has been scheduled and will start automatically.",
      });

      setShowCreateDialog(false);
      setNewGiveaway({
        title: '',
        description: '',
        prize: '',
        prize_image_url: '',
        start_date: '',
        end_date: '',
        winner_count: 1,
        category: 'general',
        startNow: true
      });
      fetchData();
    } catch (error: any) {
      console.error("Giveaway creation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create giveaway.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const openEditDialog = (giveaway: Giveaway) => {
    // Format dates for datetime-local input
    const formatDateForInput = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toISOString().slice(0, 16);
    };

    setEditGiveaway({
      id: giveaway.id,
      title: giveaway.title,
      description: giveaway.description || '',
      prize: giveaway.prize,
      prize_image_url: giveaway.prize_image_url || '',
      start_date: formatDateForInput(giveaway.start_date),
      end_date: formatDateForInput(giveaway.end_date),
      winner_count: giveaway.winner_count,
      category: giveaway.category,
      status: giveaway.status
    });
    setShowEditDialog(true);
  };

  const updateGiveaway = async () => {
    if (!editGiveaway) return;

    if (!editGiveaway.title || !editGiveaway.prize || !editGiveaway.end_date) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase
        .from("giveaways")
        .update({
          title: editGiveaway.title,
          description: editGiveaway.description || null,
          prize: editGiveaway.prize,
          prize_image_url: editGiveaway.prize_image_url || null,
          start_date: new Date(editGiveaway.start_date).toISOString(),
          end_date: new Date(editGiveaway.end_date).toISOString(),
          winner_count: editGiveaway.winner_count,
          category: editGiveaway.category
        })
        .eq("id", editGiveaway.id);

      if (error) throw error;

      toast({
        title: "Giveaway Updated! ✅",
        description: "The giveaway has been successfully updated.",
      });

      setShowEditDialog(false);
      setEditGiveaway(null);
      fetchData();
    } catch (error: any) {
      console.error("Giveaway update error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update giveaway.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const selectWinners = async (giveaway: Giveaway) => {
    setSelectedGiveaway(giveaway);
    
    // Fetch entries for this giveaway
    const { data: entries } = await supabase
      .from("giveaway_entries")
      .select("*")
      .eq("giveaway_id", giveaway.id);

    if (!entries || entries.length === 0) {
      toast({
        title: "No Entries",
        description: "This giveaway has no entries yet.",
        variant: "destructive",
      });
      return;
    }

    setSelectedGiveawayEntries(entries as GiveawayEntry[]);
    setShowSelectWinnersDialog(true);
  };

  const confirmSelectWinners = async () => {
    if (!selectedGiveaway || selectedGiveawayEntries.length === 0) return;

    setSelectingWinners(true);
    try {
      // Randomly select winners
      const shuffled = [...selectedGiveawayEntries].sort(() => Math.random() - 0.5);
      const winners = shuffled.slice(0, Math.min(selectedGiveaway.winner_count, shuffled.length));

      // Get Discord info for winners
      const winnerData = await Promise.all(
        winners.map(async (winner) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("discord_username, discord_id")
            .eq("id", winner.user_id)
            .single();
          
          return {
            giveaway_id: selectedGiveaway.id,
            user_id: winner.user_id,
            discord_username: profile?.discord_username || winner.discord_username || 'Unknown',
            announced_at: new Date().toISOString()
          };
        })
      );

      // Insert winners
      const { error: winnerError } = await supabase
        .from("giveaway_winners")
        .insert(winnerData);

      if (winnerError) throw winnerError;

      // Update entry records to mark winners
      for (const winner of winners) {
        await supabase
          .from("giveaway_entries")
          .update({ is_winner: true })
          .eq("id", winner.id);
      }

      // Update giveaway status
      await supabase
        .from("giveaways")
        .update({ status: 'ended' })
        .eq("id", selectedGiveaway.id);

      // Prepare winners for Discord notification
      const discordWinners = await Promise.all(
        winners.map(async (winner) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("discord_username, discord_id")
            .eq("id", winner.user_id)
            .single();
          
          return {
            discord_username: profile?.discord_username || winner.discord_username || 'Unknown',
            discord_id: profile?.discord_id || winner.discord_id || null,
            user_id: winner.user_id
          };
        })
      );

      // Send Discord winner notification
      await supabase.functions.invoke('send-giveaway-discord', {
        body: {
          type: 'winner_selected',
          giveaway: {
            title: selectedGiveaway.title,
            description: selectedGiveaway.description,
            prize: selectedGiveaway.prize,
            end_date: selectedGiveaway.end_date,
            winner_count: selectedGiveaway.winner_count,
            prize_image_url: selectedGiveaway.prize_image_url
          },
          winners: discordWinners
        }
      });

      toast({
        title: "Winners Selected! 🏆",
        description: `${winners.length} winner(s) have been selected and announced on Discord!`,
      });

      setShowSelectWinnersDialog(false);
      setSelectedGiveaway(null);
      setSelectedGiveawayEntries([]);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to select winners.",
        variant: "destructive",
      });
    } finally {
      setSelectingWinners(false);
    }
  };

  const hasEntered = (giveawayId: string) => {
    return userEntries.some(e => e.giveaway_id === giveawayId);
  };

  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = differenceInSeconds(end, now);

    if (diff <= 0) return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };

    return {
      expired: false,
      days: differenceInDays(end, now),
      hours: differenceInHours(end, now) % 24,
      minutes: differenceInMinutes(end, now) % 60,
      seconds: diff % 60
    };
  };

  // Categorize giveaways using proper status detection
  const activeGiveaways = giveaways.filter(g => getGiveawayStatus(g) === 'active');
  const upcomingGiveaways = giveaways.filter(g => getGiveawayStatus(g) === 'upcoming');
  const pastGiveaways = giveaways.filter(g => getGiveawayStatus(g) === 'ended');

  const GiveawayCard = ({ giveaway, showCountdown = true }: { giveaway: Giveaway; showCountdown?: boolean }) => {
    const [timeLeft, setTimeLeft] = useState(getTimeRemaining(giveaway.end_date));
    const [startTimeLeft, setStartTimeLeft] = useState(getTimeRemaining(giveaway.start_date));
    const entered = hasEntered(giveaway.id);
    const currentStatus = getGiveawayStatus(giveaway);

    useEffect(() => {
      if (!showCountdown) return;
      const timer = setInterval(() => {
        if (currentStatus === 'active') {
          setTimeLeft(getTimeRemaining(giveaway.end_date));
        } else if (currentStatus === 'upcoming') {
          setStartTimeLeft(getTimeRemaining(giveaway.start_date));
        }
      }, 1000);
      return () => clearInterval(timer);
    }, [giveaway.end_date, giveaway.start_date, currentStatus, showCountdown]);

    const getStatusBadge = () => {
      switch (currentStatus) {
        case 'active':
          return { text: '🔴 LIVE', color: 'bg-green-500' };
        case 'upcoming':
          return { text: '📅 Scheduled', color: 'bg-amber-500' };
        case 'ended':
          return { text: '✅ Ended', color: 'bg-muted' };
      }
    };

    const statusBadge = getStatusBadge();

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ scale: 1.02 }}
        className="group"
      >
        <Card className={`glass-effect overflow-hidden transition-all duration-300 ${
          currentStatus === 'active' 
            ? 'border-green-500/50 hover:border-green-400' 
            : currentStatus === 'upcoming'
            ? 'border-amber-500/30 hover:border-amber-400'
            : 'border-border/30 hover:border-primary/50'
        }`}>
          {giveaway.prize_image_url && (
            <div className="relative h-48 overflow-hidden">
              <img
                src={giveaway.prize_image_url}
                alt={giveaway.prize}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
              <Badge className={`absolute top-3 right-3 ${statusBadge.color}`}>
                {statusBadge.text}
              </Badge>
            </div>
          )}
          
          {!giveaway.prize_image_url && (
            <div className="relative h-32 bg-gradient-to-br from-primary/20 to-amber-500/20 flex items-center justify-center">
              <Gift className="w-12 h-12 text-primary/50" />
              <Badge className={`absolute top-3 right-3 ${statusBadge.color}`}>
                {statusBadge.text}
              </Badge>
            </div>
          )}
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gift className="w-5 h-5 text-primary" />
              {giveaway.title}
            </CardTitle>
            <CardDescription className="line-clamp-2">{giveaway.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">🎁 Prize</p>
              <p className="font-semibold text-primary">{giveaway.prize}</p>
            </div>

            {/* Countdown for Active Giveaways */}
            {showCountdown && currentStatus === "active" && !timeLeft.expired && (
              <div className="space-y-2">
                <p className="text-xs text-center text-muted-foreground">⏰ Ends in</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { value: timeLeft.days, label: "Days" },
                    { value: timeLeft.hours, label: "Hrs" },
                    { value: timeLeft.minutes, label: "Min" },
                    { value: timeLeft.seconds, label: "Sec" }
                  ].map((item, i) => (
                    <div key={i} className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
                      <div className="text-xl font-mono font-bold text-green-400">
                        {String(item.value).padStart(2, '0')}
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Countdown for Upcoming Giveaways */}
            {showCountdown && currentStatus === "upcoming" && !startTimeLeft.expired && (
              <div className="space-y-2">
                <p className="text-xs text-center text-amber-400">🚀 Starts in</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { value: startTimeLeft.days, label: "Days" },
                    { value: startTimeLeft.hours, label: "Hrs" },
                    { value: startTimeLeft.minutes, label: "Min" },
                    { value: startTimeLeft.seconds, label: "Sec" }
                  ].map((item, i) => (
                    <div key={i} className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <div className="text-xl font-mono font-bold text-amber-400">
                        {String(item.value).padStart(2, '0')}
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Trophy className="w-4 h-4" />
                <span>{giveaway.winner_count} Winner{giveaway.winner_count > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <CalendarDays className="w-4 h-4" />
                <span>{format(new Date(giveaway.end_date), "MMM d, yyyy")}</span>
              </div>
            </div>

            {/* Active giveaway buttons */}
            {currentStatus === "active" && (
              <div className="space-y-2">
                <Button
                  onClick={() => enterGiveaway(giveaway.id)}
                  disabled={entered || enteringId === giveaway.id}
                  className={`w-full ${entered ? "bg-green-600 hover:bg-green-700" : "bg-gradient-to-r from-primary to-green-500 hover:from-primary/90 hover:to-green-500/90"}`}
                >
                  {enteringId === giveaway.id ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : entered ? (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  ) : (
                    <Ticket className="w-4 h-4 mr-2" />
                  )}
                  {entered ? "You're Entered! 🎉" : "Enter Giveaway"}
                </Button>
                
                {isOwner && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => openEditDialog(giveaway)}
                      className="flex-1 border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => selectWinners(giveaway)}
                      className="flex-1 border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Select Winners
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Upcoming giveaway info */}
            {currentStatus === "upcoming" && (
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center">
                  <p className="text-sm text-amber-400">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Giveaway starts on {format(new Date(giveaway.start_date), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
                {isOwner && (
                  <Button
                    variant="outline"
                    onClick={() => openEditDialog(giveaway)}
                    className="w-full border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Giveaway
                  </Button>
                )}
              </div>
            )}

            {/* Ended giveaway */}
            {currentStatus === "ended" && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border/30 text-center">
                <p className="text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 inline mr-1" />
                  This giveaway has ended
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <PageHeader
        title="Exclusive Giveaways"
        description="Win epic prizes, in-game items, and exclusive rewards! Enter our active giveaways for your chance to win."
        backgroundImage={headerGiveaway}
        pageKey="giveaway"
      />

      <main className="pb-16">
        <div className="container mx-auto px-4">
          {/* Stats Section - Clickable */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 -mt-8 relative z-10"
          >
            <Card className="glass-effect border-border/30 overflow-hidden">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 rounded-lg bg-muted/50 text-primary">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalGiveaways}</p>
                  <p className="text-xs text-muted-foreground">Total Giveaways</p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-border/30 overflow-hidden">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 rounded-lg bg-muted/50 text-green-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeGiveaways}</p>
                  <p className="text-xs text-muted-foreground">Running Now</p>
                </div>
              </CardContent>
            </Card>

            {/* Clickable Total Entries */}
            <Card 
              className="glass-effect border-border/30 overflow-hidden cursor-pointer hover:border-amber-400/50 transition-all"
              onClick={handleShowAllEntries}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 rounded-lg bg-muted/50 text-amber-400">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalEntries}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    Total Entries <Eye className="w-3 h-3" />
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Clickable Winners */}
            <Card 
              className="glass-effect border-border/30 overflow-hidden cursor-pointer hover:border-purple-400/50 transition-all"
              onClick={handleShowAllWinners}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 rounded-lg bg-muted/50 text-purple-400">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalWinners}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    Winners <Eye className="w-3 h-3" />
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Owner Create Button */}
          {isOwner && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-500/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Giveaway
              </Button>
            </motion.div>
          )}

          {/* Filter Tabs */}
          <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-grid gap-1">
              <TabsTrigger value="active" className="gap-2">
                <Sparkles className="w-4 h-4" />
                <span className="hidden md:inline">Running</span>
                <Badge variant="secondary" className="ml-1">{activeGiveaways.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="gap-2">
                <Clock className="w-4 h-4" />
                <span className="hidden md:inline">Upcoming</span>
                <Badge variant="secondary" className="ml-1">{upcomingGiveaways.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="past" className="gap-2">
                <Trophy className="w-4 h-4" />
                <span className="hidden md:inline">Past</span>
                <Badge variant="secondary" className="ml-1">{pastGiveaways.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-6">
              {activeGiveaways.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {activeGiveaways.map((giveaway) => (
                      <GiveawayCard key={giveaway.id} giveaway={giveaway} />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <Card className="glass-effect border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <Gift className="w-16 h-16 text-muted-foreground/30 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Active Giveaways</h3>
                    <p className="text-muted-foreground max-w-md">
                      Check back soon! We regularly host new giveaways with amazing prizes.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="upcoming" className="mt-6">
              {upcomingGiveaways.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {upcomingGiveaways.map((giveaway) => (
                      <GiveawayCard key={giveaway.id} giveaway={giveaway} showCountdown={false} />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <Card className="glass-effect border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <Clock className="w-16 h-16 text-muted-foreground/30 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Upcoming Giveaways</h3>
                    <p className="text-muted-foreground max-w-md">
                      Stay tuned for announcements about upcoming giveaways!
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="past" className="mt-6">
              {pastGiveaways.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {pastGiveaways.map((giveaway) => (
                      <GiveawayCard key={giveaway.id} giveaway={giveaway} showCountdown={false} />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <Card className="glass-effect border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <Trophy className="w-16 h-16 text-muted-foreground/30 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Past Giveaways</h3>
                    <p className="text-muted-foreground max-w-md">
                      Previous giveaway results will appear here.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* User's Entries Section */}
          {user && userEntries.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12"
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Ticket className="w-6 h-6 text-primary" />
                Your Entries
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userEntries.map((entry) => {
                  const giveaway = giveaways.find(g => g.id === entry.giveaway_id);
                  if (!giveaway) return null;
                  return (
                    <Card key={entry.id} className="glass-effect border-border/30">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{giveaway.title}</p>
                            <p className="text-sm text-muted-foreground">
                              Entries: {entry.entry_count}
                            </p>
                          </div>
                          {entry.is_winner ? (
                            <Badge className="bg-amber-500">
                              <Crown className="w-3 h-3 mr-1" />
                              Winner!
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Entered
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Create Giveaway Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-amber-500/20">
                <Gift className="w-5 h-5 text-primary" />
              </div>
              Create New Giveaway
            </DialogTitle>
            <DialogDescription>
              Create a new giveaway that will be announced on Discord
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center gap-1">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Epic VIP Giveaway"
                value={newGiveaway.title}
                onChange={(e) => setNewGiveaway({ ...newGiveaway, title: e.target.value })}
                className="h-11"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter to win amazing prizes..."
                value={newGiveaway.description}
                onChange={(e) => setNewGiveaway({ ...newGiveaway, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Prize */}
            <div className="space-y-2">
              <Label htmlFor="prize" className="flex items-center gap-1">
                🎁 Prize <span className="text-destructive">*</span>
              </Label>
              <Input
                id="prize"
                placeholder="VIP Package + $50 Store Credit"
                value={newGiveaway.prize}
                onChange={(e) => setNewGiveaway({ ...newGiveaway, prize: e.target.value })}
                className="h-11"
              />
            </div>

            {/* Prize Image */}
            <div className="space-y-2">
              <Label htmlFor="prize_image_url">Prize Image URL</Label>
              <Input
                id="prize_image_url"
                placeholder="https://example.com/prize.jpg"
                value={newGiveaway.prize_image_url}
                onChange={(e) => setNewGiveaway({ ...newGiveaway, prize_image_url: e.target.value })}
              />
            </div>

            {/* Start Time Toggle */}
            <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Start Immediately</Label>
                  <p className="text-xs text-muted-foreground">Toggle off to schedule for later</p>
                </div>
                <Button
                  type="button"
                  variant={newGiveaway.startNow ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNewGiveaway({ ...newGiveaway, startNow: !newGiveaway.startNow })}
                  className={newGiveaway.startNow ? "bg-green-500 hover:bg-green-600" : ""}
                >
                  {newGiveaway.startNow ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-1" />
                      Start Now
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 mr-1" />
                      Schedule
                    </>
                  )}
                </Button>
              </div>

              {/* Scheduled Start Date */}
              {!newGiveaway.startNow && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label htmlFor="start_date" className="flex items-center gap-1">
                    📅 Start Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={newGiveaway.start_date}
                    onChange={(e) => setNewGiveaway({ ...newGiveaway, start_date: e.target.value })}
                    className="h-11"
                  />
                </motion.div>
              )}
            </div>

            {/* End Date & Winners */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="end_date" className="flex items-center gap-1">
                  ⏰ End Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={newGiveaway.end_date}
                  onChange={(e) => setNewGiveaway({ ...newGiveaway, end_date: e.target.value })}
                  className="h-11"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="winner_count">🏆 Number of Winners</Label>
                <Input
                  id="winner_count"
                  type="number"
                  min="1"
                  max="10"
                  value={newGiveaway.winner_count}
                  onChange={(e) => setNewGiveaway({ ...newGiveaway, winner_count: parseInt(e.target.value) || 1 })}
                  className="h-11"
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={newGiveaway.category}
                onValueChange={(value) => setNewGiveaway({ ...newGiveaway, category: value })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">🎯 All Members</SelectItem>
                  <SelectItem value="whitelisted">⭐ Whitelisted Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={createGiveaway} 
              disabled={creating}
              className={newGiveaway.startNow 
                ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700" 
                : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
              }
            >
              {creating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : newGiveaway.startNow ? (
                <Send className="w-4 h-4 mr-2" />
              ) : (
                <CalendarDays className="w-4 h-4 mr-2" />
              )}
              {newGiveaway.startNow ? "Create & Start Now" : "Schedule Giveaway"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Giveaway Dialog */}
      <Dialog open={showEditDialog} onOpenChange={(open) => {
        setShowEditDialog(open);
        if (!open) setEditGiveaway(null);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-blue-400" />
              Edit Giveaway
            </DialogTitle>
            <DialogDescription>
              Update the giveaway details below
            </DialogDescription>
          </DialogHeader>
          
          {editGiveaway && (
            <div className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="edit_title" className="flex items-center gap-1">
                  🎁 Giveaway Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit_title"
                  value={editGiveaway.title}
                  onChange={(e) => setEditGiveaway({ ...editGiveaway, title: e.target.value })}
                  placeholder="Enter giveaway title"
                  className="h-11"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="edit_description">📝 Description</Label>
                <Textarea
                  id="edit_description"
                  value={editGiveaway.description}
                  onChange={(e) => setEditGiveaway({ ...editGiveaway, description: e.target.value })}
                  placeholder="Describe your giveaway..."
                  rows={3}
                />
              </div>

              {/* Prize */}
              <div className="space-y-2">
                <Label htmlFor="edit_prize" className="flex items-center gap-1">
                  🏆 Prize <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit_prize"
                  value={editGiveaway.prize}
                  onChange={(e) => setEditGiveaway({ ...editGiveaway, prize: e.target.value })}
                  placeholder="What's the prize?"
                  className="h-11"
                />
              </div>

              {/* Prize Image URL */}
              <div className="space-y-2">
                <Label htmlFor="edit_prize_image" className="flex items-center gap-1">
                  <Image className="w-4 h-4" /> Prize Image URL
                </Label>
                <Input
                  id="edit_prize_image"
                  value={editGiveaway.prize_image_url}
                  onChange={(e) => setEditGiveaway({ ...editGiveaway, prize_image_url: e.target.value })}
                  placeholder="https://example.com/image.png"
                  className="h-11"
                />
              </div>

              {/* Start & End Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_start_date" className="flex items-center gap-1">
                    📅 Start Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit_start_date"
                    type="datetime-local"
                    value={editGiveaway.start_date}
                    onChange={(e) => setEditGiveaway({ ...editGiveaway, start_date: e.target.value })}
                    className="h-11"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_end_date" className="flex items-center gap-1">
                    ⏰ End Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit_end_date"
                    type="datetime-local"
                    value={editGiveaway.end_date}
                    onChange={(e) => setEditGiveaway({ ...editGiveaway, end_date: e.target.value })}
                    className="h-11"
                  />
                </div>
              </div>

              {/* Winner Count & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_winner_count">🏆 Number of Winners</Label>
                  <Input
                    id="edit_winner_count"
                    type="number"
                    min="1"
                    max="10"
                    value={editGiveaway.winner_count}
                    onChange={(e) => setEditGiveaway({ ...editGiveaway, winner_count: parseInt(e.target.value) || 1 })}
                    className="h-11"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={editGiveaway.category}
                    onValueChange={(value) => setEditGiveaway({ ...editGiveaway, category: value })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">🎯 All Members</SelectItem>
                      <SelectItem value="whitelisted">⭐ Whitelisted Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => {
              setShowEditDialog(false);
              setEditGiveaway(null);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={updateGiveaway} 
              disabled={updating}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              {updating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* All Entries Dialog */}
      <Dialog open={showAllEntriesDialog} onOpenChange={setShowAllEntriesDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-amber-400" />
              All Giveaway Entries ({allEntries.length})
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-[60vh]">
            <div className="space-y-2">
              {allEntries.map((entry) => (
                <Card key={entry.id} className="border-border/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-primary/20">
                            {(entry.discord_username || 'U')[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{entry.discord_username || 'Unknown User'}</p>
                          <p className="text-sm text-muted-foreground">{entry.giveaway_title}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={entry.is_winner ? "default" : "secondary"}>
                          {entry.is_winner ? (
                            <>
                              <Crown className="w-3 h-3 mr-1" />
                              Winner
                            </>
                          ) : (
                            'Entered'
                          )}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(entry.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {allEntries.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No entries found
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* All Winners Dialog */}
      <Dialog open={showAllWinnersDialog} onOpenChange={setShowAllWinnersDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-purple-400" />
              Giveaway Winners ({allWinners.length})
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-[60vh]">
            <div className="space-y-2">
              {allWinners.map((winner) => (
                <Card key={winner.id} className="border-border/30 bg-gradient-to-r from-amber-500/10 to-transparent">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-amber-500/20">
                          <Trophy className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <p className="font-medium">{winner.discord_username || 'Unknown Winner'}</p>
                          <p className="text-sm text-muted-foreground">{winner.giveaway_title}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={winner.prize_claimed ? "bg-green-500" : "bg-amber-500"}>
                          {winner.prize_claimed ? 'Claimed' : 'Pending'}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(winner.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {allWinners.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No winners yet
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Select Winners Dialog */}
      <Dialog open={showSelectWinnersDialog} onOpenChange={setShowSelectWinnersDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              Select Winners
            </DialogTitle>
            <DialogDescription>
              {selectedGiveaway?.title} - {selectedGiveawayEntries.length} entries
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 border border-border/30">
              <p className="text-sm text-muted-foreground mb-2">Selected Giveaway</p>
              <p className="font-semibold">{selectedGiveaway?.title}</p>
              <p className="text-sm text-primary">{selectedGiveaway?.prize}</p>
            </div>

            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center gap-2 text-amber-400 mb-2">
                <Users className="w-4 h-4" />
                <span className="font-medium">Entry Summary</span>
              </div>
              <p className="text-sm">
                <strong>{selectedGiveawayEntries.length}</strong> total entries
              </p>
              <p className="text-sm">
                <strong>{selectedGiveaway?.winner_count}</strong> winner(s) will be selected randomly
              </p>
            </div>

            <p className="text-sm text-muted-foreground">
              Winners will be randomly selected and announced on Discord with proper @mentions.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSelectWinnersDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmSelectWinners} 
              disabled={selectingWinners}
              className="bg-gradient-to-r from-amber-500 to-amber-600"
            >
              {selectingWinners ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trophy className="w-4 h-4 mr-2" />
              )}
              Select & Announce Winners
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Giveaway;
