import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Clock, Users, Trophy, Sparkles, Calendar, ChevronRight, Star, Crown, Ticket, Check, Timer, Award, PartyPopper, Plus, X, Image, Hash, CalendarDays, Target, Loader2, Pencil, Trash2, AlertTriangle, Lock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import headerImage from "@/assets/header-giveaway.jpg";

// Replace with your Discord ID for admin access
const ADMIN_DISCORD_ID = "833680146510381097";

interface Giveaway {
  id: string;
  title: string;
  description: string | null;
  prize: string;
  prize_image_url: string | null;
  start_date: string;
  end_date: string;
  max_entries: number | null;
  winner_count: number;
  status: string;
  requirements: unknown;
  created_at: string;
  category: string;
}

interface GiveawayEntry {
  id: string;
  giveaway_id: string;
  user_id: string;
  discord_username: string | null;
  entry_count: number;
  is_winner: boolean;
  created_at: string;
}

interface GiveawayWinner {
  id: string;
  giveaway_id: string;
  user_id: string;
  discord_username: string | null;
  prize_claimed: boolean;
  announced_at: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const CountdownTimer = ({ endDate }: { endDate: string }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endDate).getTime() - new Date().getTime();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  return (
    <div className="flex gap-2 justify-center">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="flex flex-col items-center">
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-lg px-3 py-2 min-w-[50px]">
            <span className="text-xl font-bold text-primary">{value.toString().padStart(2, '0')}</span>
          </div>
          <span className="text-xs text-muted-foreground mt-1 capitalize">{unit}</span>
        </div>
      ))}
    </div>
  );
};

const GiveawayCard = ({ 
  giveaway, 
  userEntry,
  entryCount,
  onEnter, 
  isEntering,
  isAdmin,
  onEdit,
  onDelete
}: { 
  giveaway: Giveaway;
  userEntry: GiveawayEntry | null;
  entryCount: number;
  onEnter: (id: string) => void;
  isEntering: boolean;
  isAdmin?: boolean;
  onEdit?: (giveaway: Giveaway) => void;
  onDelete?: (giveaway: Giveaway) => void;
}) => {
  const isActive = giveaway.status === 'active';
  const isUpcoming = giveaway.status === 'upcoming';
  const isEnded = giveaway.status === 'ended';
  const hasEntered = !!userEntry;
  const progress = giveaway.max_entries ? (entryCount / giveaway.max_entries) * 100 : 0;

  const getStatusBadge = () => {
    if (isActive) return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 animate-pulse">LIVE NOW</Badge>;
    if (isUpcoming) return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">COMING SOON</Badge>;
    if (isEnded) return <Badge className="bg-muted text-muted-foreground border-muted">ENDED</Badge>;
    return null;
  };

  const getCategoryBadge = () => {
    if (giveaway.category === 'whitelisted') {
      return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30"><Lock className="w-3 h-3 mr-1" />WHITELIST</Badge>;
    }
    return null;
  };

  return (
    <motion.div variants={itemVariants}>
      <Card className="glass-effect overflow-hidden group hover:border-primary/40 transition-all duration-300 relative">
        {/* Admin Controls */}
        {isAdmin && (
          <div className="absolute top-3 left-3 z-10 flex gap-2">
            <Button
              size="icon"
              variant="secondary"
              className="w-8 h-8 bg-background/80 backdrop-blur-sm hover:bg-primary/20"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(giveaway);
              }}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="w-8 h-8 bg-background/80 backdrop-blur-sm hover:bg-destructive/20 hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(giveaway);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Glow effect for active giveaways */}
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 animate-pulse" />
        )}
        
        {/* Prize Image */}
        {giveaway.prize_image_url && (
          <div className="relative h-48 overflow-hidden">
            <img 
              src={giveaway.prize_image_url} 
              alt={giveaway.prize}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            <div className="absolute top-3 right-3 flex gap-2">
              {getCategoryBadge()}
              {getStatusBadge()}
            </div>
          </div>
        )}
        
        {!giveaway.prize_image_url && (
          <div className="relative h-48 bg-gradient-to-br from-primary/20 via-primary/10 to-background flex items-center justify-center">
            <Gift className="w-20 h-20 text-primary/40" />
            <div className="absolute top-3 right-3 flex gap-2">
              {getCategoryBadge()}
              {getStatusBadge()}
            </div>
          </div>
        )}

        <CardContent className="p-6 relative">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-bold text-headline line-clamp-2">{giveaway.title}</h3>
          </div>
          
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
            {giveaway.description || "Enter for a chance to win amazing prizes!"}
          </p>

          {/* Prize Display */}
          <div className="flex items-center gap-2 mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className="font-semibold text-foreground">{giveaway.prize}</span>
          </div>

          {/* Countdown Timer */}
          {(isActive || isUpcoming) && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                <Timer className="w-4 h-4" />
                <span>{isUpcoming ? "Starts in" : "Ends in"}</span>
              </div>
              <CountdownTimer endDate={isUpcoming ? giveaway.start_date : giveaway.end_date} />
            </div>
          )}

          {/* Entry Progress */}
          {giveaway.max_entries && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Entries</span>
                <span className="text-foreground">{entryCount} / {giveaway.max_entries}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Entry Stats */}
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{entryCount} entries</span>
            </div>
            <div className="flex items-center gap-1">
              <Award className="w-4 h-4" />
              <span>{giveaway.winner_count} winner{giveaway.winner_count > 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Action Button */}
          {isActive && !hasEntered && (
            <Button 
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
              onClick={() => onEnter(giveaway.id)}
              disabled={isEntering}
            >
              <Ticket className="w-4 h-4 mr-2" />
              {isEntering ? "Entering..." : "Enter Giveaway"}
            </Button>
          )}

          {isActive && hasEntered && (
            <Button className="w-full" variant="outline" disabled>
              <Check className="w-4 h-4 mr-2 text-green-500" />
              You're Entered!
            </Button>
          )}

          {isUpcoming && (
            <Button className="w-full" variant="outline" disabled>
              <Clock className="w-4 h-4 mr-2" />
              Coming Soon
            </Button>
          )}

          {isEnded && (
            <Button className="w-full" variant="outline" disabled>
              <Trophy className="w-4 h-4 mr-2" />
              Giveaway Ended
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const WinnerCard = ({ winner, giveawayTitle }: { winner: GiveawayWinner; giveawayTitle: string }) => (
  <motion.div variants={itemVariants}>
    <Card className="glass-effect border-yellow-500/30 overflow-hidden">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center">
          <Crown className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-foreground">{winner.discord_username || "Anonymous Winner"}</p>
          <p className="text-sm text-muted-foreground">{giveawayTitle}</p>
        </div>
        <Badge className={winner.prize_claimed ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}>
          {winner.prize_claimed ? "Claimed" : "Pending"}
        </Badge>
      </CardContent>
    </Card>
  </motion.div>
);

const Giveaway = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [userEntries, setUserEntries] = useState<GiveawayEntry[]>([]);
  const [entryCounts, setEntryCounts] = useState<Record<string, number>>({});
  const [winners, setWinners] = useState<GiveawayWinner[]>([]);
  const [totalWinnersCount, setTotalWinnersCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isEntering, setIsEntering] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const [showEntriesDialog, setShowEntriesDialog] = useState(false);
  const [showAddGiveawayDialog, setShowAddGiveawayDialog] = useState(false);
  const [showEditGiveawayDialog, setShowEditGiveawayDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedGiveaway, setSelectedGiveaway] = useState<Giveaway | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreatingGiveaway, setIsCreatingGiveaway] = useState(false);
  const [isUpdatingGiveaway, setIsUpdatingGiveaway] = useState(false);
  const [isDeletingGiveaway, setIsDeletingGiveaway] = useState(false);
  
  // Giveaway form state
  const [giveawayForm, setGiveawayForm] = useState({
    title: "",
    description: "",
    prize: "",
    prize_image_url: "",
    start_date: "",
    end_date: "",
    max_entries: "",
    winner_count: "1",
    status: "upcoming",
    category: "all"
  });

  useEffect(() => {
    fetchUser();
    fetchGiveaways();
    fetchWinners();
    fetchTotalWinnersCount();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserEntries();
    }
  }, [user]);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    
    // Check if user is admin based on Discord ID
    if (user) {
      const discordId = user.user_metadata?.provider_id || user.user_metadata?.sub;
      setIsAdmin(discordId === ADMIN_DISCORD_ID);
    }
  };

  const fetchGiveaways = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('giveaways')
      .select('*')
      .in('status', ['upcoming', 'active', 'ended'])
      .order('created_at', { ascending: false });

    if (!error && data) {
      setGiveaways(data);
      // Fetch entry counts for each giveaway
      const counts: Record<string, number> = {};
      for (const g of data) {
        const { count } = await supabase
          .from('giveaway_entries')
          .select('*', { count: 'exact', head: true })
          .eq('giveaway_id', g.id);
        counts[g.id] = count || 0;
      }
      setEntryCounts(counts);
    }
    setIsLoading(false);
  };

  const fetchUserEntries = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('giveaway_entries')
      .select('*')
      .eq('user_id', user.id);

    if (!error && data) {
      setUserEntries(data);
    }
  };

  const fetchWinners = async () => {
    const { data, error } = await supabase
      .from('giveaway_winners')
      .select('*')
      .order('announced_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setWinners(data);
    }
  };

  const fetchTotalWinnersCount = async () => {
    const { count, error } = await supabase
      .from('giveaway_winners')
      .select('*', { count: 'exact', head: true });

    if (!error) {
      setTotalWinnersCount(count || 0);
    }
  };

  const handleCreateGiveaway = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!giveawayForm.title || !giveawayForm.prize || !giveawayForm.start_date || !giveawayForm.end_date) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingGiveaway(true);

    const { data: insertedData, error } = await supabase
      .from('giveaways')
      .insert({
        title: giveawayForm.title,
        description: giveawayForm.description || null,
        prize: giveawayForm.prize,
        prize_image_url: giveawayForm.prize_image_url || null,
        start_date: new Date(giveawayForm.start_date).toISOString(),
        end_date: new Date(giveawayForm.end_date).toISOString(),
        max_entries: giveawayForm.max_entries ? parseInt(giveawayForm.max_entries) : null,
        winner_count: parseInt(giveawayForm.winner_count) || 1,
        status: giveawayForm.status,
        category: giveawayForm.category,
        created_by: user?.id || null,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create giveaway. Please try again.",
        variant: "destructive",
      });
    } else {
      // Send notification to Discord
      try {
        const websiteUrl = `${window.location.origin}/giveaway`;
        await supabase.functions.invoke('send-giveaway-notification', {
          body: {
            title: giveawayForm.title,
            description: giveawayForm.description || null,
            prize: giveawayForm.prize,
            prize_image_url: giveawayForm.prize_image_url || null,
            start_date: new Date(giveawayForm.start_date).toISOString(),
            end_date: new Date(giveawayForm.end_date).toISOString(),
            status: giveawayForm.status,
            winner_count: parseInt(giveawayForm.winner_count) || 1,
            giveaway_id: insertedData?.id || '',
            website_url: websiteUrl,
          }
        });
        console.log('Discord notification sent successfully');
      } catch (notifyError) {
        console.error('Failed to send Discord notification:', notifyError);
        // Don't show error toast - giveaway was created successfully
      }

      toast({
        title: "Giveaway Created!",
        description: "Your giveaway has been created and notification sent to Discord.",
      });
      setShowAddGiveawayDialog(false);
      setGiveawayForm({
        title: "",
        description: "",
        prize: "",
        prize_image_url: "",
        start_date: "",
        end_date: "",
        max_entries: "",
        winner_count: "1",
        status: "upcoming",
        category: "all"
      });
      fetchGiveaways();
    }

    setIsCreatingGiveaway(false);
  };

  const resetGiveawayForm = () => {
    setGiveawayForm({
      title: "",
      description: "",
      prize: "",
      prize_image_url: "",
      start_date: "",
      end_date: "",
      max_entries: "",
      winner_count: "1",
      status: "upcoming",
      category: "all"
    });
  };

  const handleEditGiveaway = (giveaway: Giveaway) => {
    setSelectedGiveaway(giveaway);
    setGiveawayForm({
      title: giveaway.title,
      description: giveaway.description || "",
      prize: giveaway.prize,
      prize_image_url: giveaway.prize_image_url || "",
      start_date: new Date(giveaway.start_date).toISOString().slice(0, 16),
      end_date: new Date(giveaway.end_date).toISOString().slice(0, 16),
      max_entries: giveaway.max_entries?.toString() || "",
      winner_count: giveaway.winner_count.toString(),
      status: giveaway.status,
      category: giveaway.category || "all"
    });
    setShowEditGiveawayDialog(true);
  };

  const handleUpdateGiveaway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGiveaway) return;
    
    setIsUpdatingGiveaway(true);

    const { error } = await supabase
      .from('giveaways')
      .update({
        title: giveawayForm.title,
        description: giveawayForm.description || null,
        prize: giveawayForm.prize,
        prize_image_url: giveawayForm.prize_image_url || null,
        start_date: new Date(giveawayForm.start_date).toISOString(),
        end_date: new Date(giveawayForm.end_date).toISOString(),
        max_entries: giveawayForm.max_entries ? parseInt(giveawayForm.max_entries) : null,
        winner_count: parseInt(giveawayForm.winner_count) || 1,
        status: giveawayForm.status,
        category: giveawayForm.category,
      })
      .eq('id', selectedGiveaway.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update giveaway. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Giveaway Updated!",
        description: "Your giveaway has been updated successfully.",
      });
      setShowEditGiveawayDialog(false);
      setSelectedGiveaway(null);
      resetGiveawayForm();
      fetchGiveaways();
    }

    setIsUpdatingGiveaway(false);
  };

  const handleDeleteClick = (giveaway: Giveaway) => {
    setSelectedGiveaway(giveaway);
    setShowDeleteConfirm(true);
  };

  const handleDeleteGiveaway = async () => {
    if (!selectedGiveaway) return;
    
    setIsDeletingGiveaway(true);

    // First delete related entries and winners
    await supabase.from('giveaway_entries').delete().eq('giveaway_id', selectedGiveaway.id);
    await supabase.from('giveaway_winners').delete().eq('giveaway_id', selectedGiveaway.id);

    const { error } = await supabase
      .from('giveaways')
      .delete()
      .eq('id', selectedGiveaway.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete giveaway. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Giveaway Deleted",
        description: "The giveaway has been deleted successfully.",
      });
      setShowDeleteConfirm(false);
      setSelectedGiveaway(null);
      fetchGiveaways();
      fetchTotalWinnersCount();
    }

    setIsDeletingGiveaway(false);
  };

  const handleEnterGiveaway = async (giveawayId: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in with Discord to enter giveaways.",
        variant: "destructive",
      });
      return;
    }

    setIsEntering(true);
    
    const discordId = user.user_metadata?.provider_id || user.user_metadata?.sub;
    const discordUsername = user.user_metadata?.full_name || 
                           user.user_metadata?.name || 
                           user.user_metadata?.user_name || 
                           null;

    // Get the giveaway to check its category
    const giveaway = giveaways.find(g => g.id === giveawayId);
    
    if (!giveaway) {
      toast({
        title: "Error",
        description: "Giveaway not found.",
        variant: "destructive",
      });
      setIsEntering(false);
      return;
    }

    // Verify Discord requirements
    try {
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-discord-requirements', {
        body: { discordId }
      });

      if (verifyError) {
        console.error('Error verifying Discord requirements:', verifyError);
        toast({
          title: "Verification Error",
          description: "Could not verify Discord membership. Please try again.",
          variant: "destructive",
        });
        setIsEntering(false);
        return;
      }

      // Check if user is in Discord server
      if (!verifyData?.isInServer) {
        toast({
          title: "Discord Membership Required",
          description: "You must join our Discord server to enter giveaways.",
          variant: "destructive",
        });
        setIsEntering(false);
        return;
      }

      // Check whitelist requirement for whitelisted giveaways
      if (giveaway.category === 'whitelisted' && !verifyData?.hasWhitelistRole) {
        toast({
          title: "Whitelist Required",
          description: "This giveaway is only for whitelisted members. You must have the whitelist role on Discord to enter.",
          variant: "destructive",
        });
        setIsEntering(false);
        return;
      }
    } catch (error) {
      console.error('Error calling verify-discord-requirements:', error);
      toast({
        title: "Verification Error",
        description: "Could not verify Discord membership. Please try again.",
        variant: "destructive",
      });
      setIsEntering(false);
      return;
    }

    const { error } = await supabase
      .from('giveaway_entries')
      .insert({
        giveaway_id: giveawayId,
        user_id: user.id,
        discord_username: discordUsername,
        discord_id: discordId,
      });

    if (error) {
      if (error.code === '23505') {
        toast({
          title: "Already Entered",
          description: "You've already entered this giveaway!",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to enter giveaway. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Entry Successful!",
        description: "You've been entered into the giveaway. Good luck!",
      });
      fetchUserEntries();
      fetchGiveaways();
    }

    setIsEntering(false);
  };

  const activeGiveaways = giveaways.filter(g => g.status === 'active');
  const upcomingGiveaways = giveaways.filter(g => g.status === 'upcoming');
  const endedGiveaways = giveaways.filter(g => g.status === 'ended');

  // Get user entries for active and upcoming giveaways only (not past)
  const activeAndUpcomingGiveawayIds = [...activeGiveaways, ...upcomingGiveaways].map(g => g.id);
  const userActiveUpcomingEntries = userEntries.filter(e => 
    activeAndUpcomingGiveawayIds.includes(e.giveaway_id)
  );

  const getUserEntry = (giveawayId: string) => 
    userEntries.find(e => e.giveaway_id === giveawayId) || null;

  const getGiveawayTitle = (giveawayId: string) => 
    giveaways.find(g => g.id === giveawayId)?.title || "Unknown Giveaway";

  const getGiveawayStatus = (giveawayId: string) => 
    giveaways.find(g => g.id === giveawayId)?.status || "unknown";

  return (
    <div className="min-h-screen bg-background relative">
      {/* Giveaway-themed background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-20 right-1/3 w-72 h-72 bg-green-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
        {/* Floating gift icons */}
        <div className="absolute top-1/4 left-[15%] text-primary/10 animate-bounce" style={{ animationDuration: '3s' }}>
          <Gift className="w-12 h-12" />
        </div>
        <div className="absolute top-1/2 right-[10%] text-yellow-500/10 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
          <Trophy className="w-16 h-16" />
        </div>
        <div className="absolute bottom-1/3 left-[8%] text-accent/10 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>
          <Star className="w-10 h-10" />
        </div>
        <div className="absolute top-[60%] right-[20%] text-green-500/10 animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '1.5s' }}>
          <PartyPopper className="w-14 h-14" />
        </div>
      </div>

      <Navigation />
      
      <PageHeader
        title="Giveaways"
        description="Win exclusive prizes, in-game items, and more!"
        badge="WIN BIG"
        backgroundImage={headerImage}
      />

      <div className="container mx-auto px-4 pb-16 relative z-10">
        {/* Hero Stats */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <Card className="glass-effect text-center p-6 hover:border-green-500/30 transition-colors cursor-pointer h-full" onClick={() => setActiveTab("active")}>
              <Gift className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <p className="text-4xl font-bold text-foreground mb-1">{activeGiveaways.length}</p>
              <p className="text-base text-muted-foreground">Active Giveaways</p>
              {activeGiveaways.length > 0 && (
                <Badge className="mt-3 bg-green-500/20 text-green-400 border-green-500/30 animate-pulse">LIVE</Badge>
              )}
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="glass-effect text-center p-6 hover:border-yellow-500/30 transition-colors cursor-pointer h-full" onClick={() => setActiveTab("upcoming")}>
              <Calendar className="w-12 h-12 mx-auto mb-3 text-yellow-500" />
              <p className="text-4xl font-bold text-foreground mb-1">{upcomingGiveaways.length}</p>
              <p className="text-base text-muted-foreground">Coming Soon</p>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="glass-effect text-center p-6 hover:border-primary/30 transition-colors h-full">
              <Trophy className="w-12 h-12 mx-auto mb-3 text-primary" />
              <p className="text-4xl font-bold text-foreground mb-1">{totalWinnersCount}</p>
              <p className="text-base text-muted-foreground">Total Winners</p>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-col gap-4">
            <Card 
              className="glass-effect text-center p-6 hover:border-accent/30 transition-colors cursor-pointer flex-1" 
              onClick={() => user ? setShowEntriesDialog(true) : toast({ title: "Login Required", description: "Please log in to view your entries.", variant: "destructive" })}
            >
              <Ticket className="w-12 h-12 mx-auto mb-3 text-accent" />
              <p className="text-4xl font-bold text-foreground mb-1">{userActiveUpcomingEntries.length}</p>
              <p className="text-base text-muted-foreground">Your Entries</p>
              {user && userActiveUpcomingEntries.length > 0 && (
                <Badge className="mt-3 bg-accent/20 text-accent border-accent/30">Click to view</Badge>
              )}
            </Card>
            
            {isAdmin && (
              <Card 
                className="glass-effect text-center p-4 hover:border-primary/50 transition-colors cursor-pointer bg-gradient-to-br from-primary/10 to-accent/10" 
                onClick={() => setShowAddGiveawayDialog(true)}
              >
                <div className="flex items-center justify-center gap-3">
                  <Plus className="w-6 h-6 text-primary" />
                  <div className="text-left">
                    <p className="text-lg font-bold text-foreground">Add Giveaway</p>
                    <p className="text-xs text-muted-foreground">Admin Only</p>
                  </div>
                </div>
              </Card>
            )}
          </motion.div>
        </motion.div>

        {/* Your Entries Dialog */}
        <Dialog open={showEntriesDialog} onOpenChange={setShowEntriesDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-accent" />
                Your Active Entries
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {userActiveUpcomingEntries.length > 0 ? (
                userActiveUpcomingEntries.map(entry => {
                  const giveawayTitle = getGiveawayTitle(entry.giveaway_id);
                  const status = getGiveawayStatus(entry.giveaway_id);
                  return (
                    <Card key={entry.id} className="p-4 border-border/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-foreground">{giveawayTitle}</p>
                          <p className="text-xs text-muted-foreground">
                            Entered: {new Date(entry.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={status === 'active' ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"}>
                          {status === 'active' ? 'LIVE' : 'UPCOMING'}
                        </Badge>
                      </div>
                    </Card>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Ticket className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No active entries yet</p>
                  <p className="text-sm text-muted-foreground">Enter a giveaway to see your entries here!</p>
                </div>
              )}
            </div>
            {userActiveUpcomingEntries.length > 0 && (
              <div className="pt-4 border-t border-border">
                <p className="text-center text-sm text-muted-foreground">
                  Total entries in active/upcoming giveaways: <span className="font-bold text-foreground">{userActiveUpcomingEntries.length}</span>
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Giveaway Dialog */}
        <Dialog open={showAddGiveawayDialog} onOpenChange={(open) => {
          setShowAddGiveawayDialog(open);
          if (!open) resetGiveawayForm();
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-2xl">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                Create New Giveaway
              </DialogTitle>
              <DialogDescription>
                Fill in the details below to create an exciting giveaway for your community.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateGiveaway} className="space-y-6 mt-4">
              {/* Title & Prize Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Giveaway Title *
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., Weekly Cash Giveaway"
                    value={giveawayForm.title}
                    onChange={(e) => setGiveawayForm({ ...giveawayForm, title: e.target.value })}
                    className="bg-background/50"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="prize" className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-primary" />
                    Prize *
                  </Label>
                  <Input
                    id="prize"
                    placeholder="e.g., $1,000,000 In-Game Cash"
                    value={giveawayForm.prize}
                    onChange={(e) => setGiveawayForm({ ...giveawayForm, prize: e.target.value })}
                    className="bg-background/50"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe your giveaway, rules, and what participants can win..."
                  value={giveawayForm.description}
                  onChange={(e) => setGiveawayForm({ ...giveawayForm, description: e.target.value })}
                  className="bg-background/50 min-h-[100px]"
                />
              </div>

              {/* Prize Image URL */}
              <div className="space-y-2">
                <Label htmlFor="prize_image_url" className="flex items-center gap-2">
                  <Image className="w-4 h-4 text-green-500" />
                  Prize Image URL
                </Label>
                <Input
                  id="prize_image_url"
                  type="url"
                  placeholder="https://example.com/prize-image.jpg"
                  value={giveawayForm.prize_image_url}
                  onChange={(e) => setGiveawayForm({ ...giveawayForm, prize_image_url: e.target.value })}
                  className="bg-background/50"
                />
                {giveawayForm.prize_image_url && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-border/50 max-h-32">
                    <img 
                      src={giveawayForm.prize_image_url} 
                      alt="Prize preview" 
                      className="w-full h-32 object-cover"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                )}
              </div>

              {/* Dates Section */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20">
                <h4 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                  <CalendarDays className="w-5 h-5 text-primary" />
                  Schedule
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date & Time *</Label>
                    <Input
                      id="start_date"
                      type="datetime-local"
                      value={giveawayForm.start_date}
                      onChange={(e) => setGiveawayForm({ ...giveawayForm, start_date: e.target.value })}
                      className="bg-background/50"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date & Time *</Label>
                    <Input
                      id="end_date"
                      type="datetime-local"
                      value={giveawayForm.end_date}
                      onChange={(e) => setGiveawayForm({ ...giveawayForm, end_date: e.target.value })}
                      className="bg-background/50"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Settings Section */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-accent/5 to-primary/5 border border-accent/20">
                <h4 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-accent" />
                  Settings
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max_entries" className="flex items-center gap-2">
                      <Hash className="w-4 h-4" />
                      Max Entries
                    </Label>
                    <Input
                      id="max_entries"
                      type="number"
                      min="1"
                      placeholder="Unlimited"
                      value={giveawayForm.max_entries}
                      onChange={(e) => setGiveawayForm({ ...giveawayForm, max_entries: e.target.value })}
                      className="bg-background/50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="winner_count" className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-500" />
                      Winner Count
                    </Label>
                    <Input
                      id="winner_count"
                      type="number"
                      min="1"
                      value={giveawayForm.winner_count}
                      onChange={(e) => setGiveawayForm({ ...giveawayForm, winner_count: e.target.value })}
                      className="bg-background/50"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">Initial Status</Label>
                    <Select 
                      value={giveawayForm.status} 
                      onValueChange={(value) => setGiveawayForm({ ...giveawayForm, status: value })}
                    >
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upcoming">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-yellow-500" />
                            Upcoming
                          </div>
                        </SelectItem>
                        <SelectItem value="active">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-green-500" />
                            Active (Live)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      Category
                    </Label>
                    <Select 
                      value={giveawayForm.category} 
                      onValueChange={(value) => setGiveawayForm({ ...giveawayForm, category: value })}
                    >
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-green-500" />
                            All Members
                          </div>
                        </SelectItem>
                        <SelectItem value="whitelisted">
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-yellow-500" />
                            Whitelisted Only
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowAddGiveawayDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  disabled={isCreatingGiveaway}
                >
                  {isCreatingGiveaway ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4 mr-2" />
                      Create Giveaway
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Giveaway Dialog */}
        <Dialog open={showEditGiveawayDialog} onOpenChange={(open) => {
          setShowEditGiveawayDialog(open);
          if (!open) {
            setSelectedGiveaway(null);
            resetGiveawayForm();
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-2xl">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center">
                  <Pencil className="w-6 h-6 text-white" />
                </div>
                Edit Giveaway
              </DialogTitle>
              <DialogDescription>
                Update the giveaway details below.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleUpdateGiveaway} className="space-y-6 mt-4">
              {/* Title & Prize Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title" className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Giveaway Title *
                  </Label>
                  <Input
                    id="edit-title"
                    placeholder="e.g., Weekly Cash Giveaway"
                    value={giveawayForm.title}
                    onChange={(e) => setGiveawayForm({ ...giveawayForm, title: e.target.value })}
                    className="bg-background/50"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-prize" className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-primary" />
                    Prize *
                  </Label>
                  <Input
                    id="edit-prize"
                    placeholder="e.g., $1,000,000 In-Game Cash"
                    value={giveawayForm.prize}
                    onChange={(e) => setGiveawayForm({ ...giveawayForm, prize: e.target.value })}
                    className="bg-background/50"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="edit-description" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  Description
                </Label>
                <Textarea
                  id="edit-description"
                  placeholder="Describe your giveaway..."
                  value={giveawayForm.description}
                  onChange={(e) => setGiveawayForm({ ...giveawayForm, description: e.target.value })}
                  className="bg-background/50 min-h-[80px]"
                />
              </div>

              {/* Prize Image URL */}
              <div className="space-y-2">
                <Label htmlFor="edit-prize_image_url" className="flex items-center gap-2">
                  <Image className="w-4 h-4 text-green-500" />
                  Prize Image URL
                </Label>
                <Input
                  id="edit-prize_image_url"
                  type="url"
                  placeholder="https://example.com/prize-image.jpg"
                  value={giveawayForm.prize_image_url}
                  onChange={(e) => setGiveawayForm({ ...giveawayForm, prize_image_url: e.target.value })}
                  className="bg-background/50"
                />
              </div>

              {/* Dates Section */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20">
                <h4 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                  <CalendarDays className="w-5 h-5 text-primary" />
                  Schedule
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-start_date">Start Date & Time *</Label>
                    <Input
                      id="edit-start_date"
                      type="datetime-local"
                      value={giveawayForm.start_date}
                      onChange={(e) => setGiveawayForm({ ...giveawayForm, start_date: e.target.value })}
                      className="bg-background/50"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-end_date">End Date & Time *</Label>
                    <Input
                      id="edit-end_date"
                      type="datetime-local"
                      value={giveawayForm.end_date}
                      onChange={(e) => setGiveawayForm({ ...giveawayForm, end_date: e.target.value })}
                      className="bg-background/50"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Settings Section */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-accent/5 to-primary/5 border border-accent/20">
                <h4 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-accent" />
                  Settings
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-max_entries">Max Entries</Label>
                    <Input
                      id="edit-max_entries"
                      type="number"
                      min="1"
                      placeholder="Unlimited"
                      value={giveawayForm.max_entries}
                      onChange={(e) => setGiveawayForm({ ...giveawayForm, max_entries: e.target.value })}
                      className="bg-background/50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-winner_count">Winner Count</Label>
                    <Input
                      id="edit-winner_count"
                      type="number"
                      min="1"
                      value={giveawayForm.winner_count}
                      onChange={(e) => setGiveawayForm({ ...giveawayForm, winner_count: e.target.value })}
                      className="bg-background/50"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select 
                      value={giveawayForm.status} 
                      onValueChange={(value) => setGiveawayForm({ ...giveawayForm, status: value })}
                    >
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upcoming">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-yellow-500" />
                            Upcoming
                          </div>
                        </SelectItem>
                        <SelectItem value="active">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-green-500" />
                            Active (Live)
                          </div>
                        </SelectItem>
                        <SelectItem value="ended">
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-muted-foreground" />
                            Ended
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-category">Category</Label>
                    <Select 
                      value={giveawayForm.category} 
                      onValueChange={(value) => setGiveawayForm({ ...giveawayForm, category: value })}
                    >
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-green-500" />
                            All Members
                          </div>
                        </SelectItem>
                        <SelectItem value="whitelisted">
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-yellow-500" />
                            Whitelisted Only
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowEditGiveawayDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-600 hover:opacity-90"
                  disabled={isUpdatingGiveaway}
                >
                  {isUpdatingGiveaway ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Update Giveaway
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                Delete Giveaway
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "<span className="font-semibold text-foreground">{selectedGiveaway?.title}</span>"? 
                This will also delete all entries and winner records. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingGiveaway}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteGiveaway}
                className="bg-destructive hover:bg-destructive/90"
                disabled={isDeletingGiveaway}
              >
                {isDeletingGiveaway ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Giveaway
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Giveaway Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Active
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="ended" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Ended
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {isLoading ? (
              <div className="text-center py-12">
                <Gift className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
                <p className="text-muted-foreground">Loading giveaways...</p>
              </div>
            ) : activeGiveaways.length > 0 ? (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {activeGiveaways.map(giveaway => (
                  <GiveawayCard
                    key={giveaway.id}
                    giveaway={giveaway}
                    userEntry={getUserEntry(giveaway.id)}
                    entryCount={entryCounts[giveaway.id] || 0}
                    onEnter={handleEnterGiveaway}
                    isEntering={isEntering}
                    isAdmin={isAdmin}
                    onEdit={handleEditGiveaway}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-12">
                <PartyPopper className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold mb-2">No Active Giveaways</h3>
                <p className="text-muted-foreground">Check back soon for exciting giveaways!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming">
            {upcomingGiveaways.length > 0 ? (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {upcomingGiveaways.map(giveaway => (
                  <GiveawayCard
                    key={giveaway.id}
                    giveaway={giveaway}
                    userEntry={getUserEntry(giveaway.id)}
                    entryCount={entryCounts[giveaway.id] || 0}
                    onEnter={handleEnterGiveaway}
                    isEntering={isEntering}
                    isAdmin={isAdmin}
                    onEdit={handleEditGiveaway}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold mb-2">No Upcoming Giveaways</h3>
                <p className="text-muted-foreground">Stay tuned for future giveaways!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="ended">
            {endedGiveaways.length > 0 ? (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {endedGiveaways.map(giveaway => (
                  <GiveawayCard
                    key={giveaway.id}
                    giveaway={giveaway}
                    userEntry={getUserEntry(giveaway.id)}
                    entryCount={entryCounts[giveaway.id] || 0}
                    onEnter={handleEnterGiveaway}
                    isEntering={isEntering}
                    isAdmin={isAdmin}
                    onEdit={handleEditGiveaway}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold mb-2">No Past Giveaways</h3>
                <p className="text-muted-foreground">Past giveaways will appear here.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Recent Winners Section */}
        {winners.length > 0 && (
          <motion.div 
            className="mt-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Crown className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl font-bold">Recent Winners</h2>
            </div>
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {winners.map(winner => (
                <WinnerCard 
                  key={winner.id} 
                  winner={winner} 
                  giveawayTitle={getGiveawayTitle(winner.giveaway_id)} 
                />
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* CTA Section */}
        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="glass-effect p-8 max-w-2xl mx-auto border-primary/30">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Gift className="w-8 h-8 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-2">Want More Giveaways?</h3>
            <p className="text-muted-foreground mb-6">
              Join our Discord community to stay updated on all giveaways and exclusive events!
            </p>
            <Button 
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white"
              onClick={() => window.open("https://discord.gg/W2nU97maBh", "_blank")}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Join Discord
            </Button>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Giveaway;
