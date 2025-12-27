import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Gift, Trophy, Ticket, Check, Loader2, Sparkles, 
  Crown, Users, Clock, Star, PartyPopper, Shield, 
  AlertCircle, Lock, Globe, Zap, Share2, UserPlus,
  Twitter, Facebook, Copy, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

interface GiveawayEntryDialogProps {
  giveaway: Giveaway | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmEntry: (giveawayId: string) => Promise<void>;
  isEntering: boolean;
  entryCount: number;
  user: any;
  hasEntered: boolean;
  userEntry?: {
    social_share_bonus?: boolean;
    referral_bonus?: boolean;
    entry_count?: number;
  } | null;
  onBonusEntryClaimed?: () => void;
}

const ConfettiPiece = ({ delay }: { delay: number }) => (
  <motion.div
    className="absolute w-3 h-3"
    initial={{ 
      x: 0, 
      y: 0, 
      rotate: 0, 
      scale: 0,
      opacity: 1 
    }}
    animate={{ 
      x: (Math.random() - 0.5) * 300, 
      y: Math.random() * 200 + 50, 
      rotate: Math.random() * 720 - 360,
      scale: [0, 1, 1, 0.5],
      opacity: [0, 1, 1, 0]
    }}
    transition={{ 
      duration: 1.5, 
      delay,
      ease: "easeOut"
    }}
  >
    <div 
      className="w-full h-full rounded-sm"
      style={{ 
        backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#A855F7', '#3B82F6', '#10B981'][Math.floor(Math.random() * 6)]
      }}
    />
  </motion.div>
);

const GiveawayEntryDialog = ({
  giveaway,
  isOpen,
  onClose,
  onConfirmEntry,
  isEntering,
  entryCount,
  user,
  hasEntered,
  userEntry,
  onBonusEntryClaimed
}: GiveawayEntryDialogProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState<"confirm" | "entering" | "success">("confirm");
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [claimingBonus, setClaimingBonus] = useState<string | null>(null);
  const [localBonusState, setLocalBonusState] = useState({
    social_share_bonus: false,
    referral_bonus: false
  });

  // Sync local bonus state with userEntry prop
  useEffect(() => {
    if (userEntry) {
      setLocalBonusState({
        social_share_bonus: userEntry.social_share_bonus || false,
        referral_bonus: userEntry.referral_bonus || false
      });
    }
  }, [userEntry]);

  // Live countdown timer
  useEffect(() => {
    if (!giveaway) return;
    
    const calculateTimeLeft = () => {
      const difference = new Date(giveaway.end_date).getTime() - Date.now();
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
  }, [giveaway]);

  useEffect(() => {
    if (isOpen) {
      setStep("confirm");
      setAcceptedRules(false);
      setShowConfetti(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (hasEntered && step === "entering") {
      setStep("success");
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }
  }, [hasEntered, step]);

  if (!giveaway) return null;

  const discordUsername = user?.user_metadata?.full_name || 
                          user?.user_metadata?.name || 
                          user?.user_metadata?.user_name || 
                          "Unknown User";

  const discordAvatar = user?.user_metadata?.avatar_url;

  const handleConfirmEntry = async () => {
    if (!acceptedRules) return;
    setStep("entering");
    await onConfirmEntry(giveaway.id);
  };

  const progress = giveaway.max_entries ? (entryCount / giveaway.max_entries) * 100 : 0;
  const isWhitelisted = giveaway.category === 'whitelisted';

  const totalBonusEntries = (localBonusState.social_share_bonus ? 1 : 0) + (localBonusState.referral_bonus ? 1 : 0);
  const currentEntryCount = userEntry?.entry_count || 1;

  const handleClaimBonusEntry = async (bonusType: 'social_share' | 'referral') => {
    if (!giveaway || !user) return;
    
    setClaimingBonus(bonusType);
    
    try {
      const { data, error } = await supabase.rpc('add_bonus_entry', {
        p_giveaway_id: giveaway.id,
        p_user_id: user.id,
        p_bonus_type: bonusType === 'social_share' ? 'social_share' : 'referral'
      });

      if (error) throw error;

      if (data) {
        setLocalBonusState(prev => ({
          ...prev,
          [bonusType === 'social_share' ? 'social_share_bonus' : 'referral_bonus']: true
        }));
        
        toast({
          title: "Bonus Entry Earned!",
          description: `You earned +1 bonus entry. Your chances just increased!`,
        });
        
        onBonusEntryClaimed?.();
      } else {
        toast({
          title: "Already Claimed",
          description: "You've already claimed this bonus entry.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error claiming bonus entry:', error);
      toast({
        title: "Error",
        description: "Failed to claim bonus entry. Please try again.",
        variant: "destructive"
      });
    } finally {
      setClaimingBonus(null);
    }
  };

  const handleSocialShare = (platform: 'twitter' | 'facebook' | 'copy') => {
    const shareUrl = `${window.location.origin}/giveaway`;
    const shareText = `🎁 I just entered the "${giveaway.title}" giveaway! Prize: ${giveaway.prize}. Join now for a chance to win!`;
    
    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
      handleClaimBonusEntry('social_share');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`, '_blank');
      handleClaimBonusEntry('social_share');
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      toast({
        title: "Link Copied!",
        description: "Share it with your friends to earn a referral bonus.",
      });
    }
  };

  const handleInviteFriend = () => {
    const inviteUrl = `${window.location.origin}/giveaway?ref=${user?.id?.slice(0, 8)}`;
    navigator.clipboard.writeText(inviteUrl);
    toast({
      title: "Invite Link Copied!",
      description: "Share this link with a friend. When they enter, you'll get a bonus entry!",
    });
    // Simulate referral for demo - in production this would be tracked when friend signs up
    handleClaimBonusEntry('referral');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg overflow-hidden p-0 bg-gradient-to-b from-card to-card/95 border-2 border-primary/20">
        <AnimatePresence mode="wait">
          {step === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              {/* Prize Header */}
              <div className="relative h-48 overflow-hidden">
                {giveaway.prize_image_url ? (
                  <img 
                    src={giveaway.prize_image_url} 
                    alt={giveaway.prize}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/30 via-accent/20 to-primary/10 flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <Gift className="w-20 h-20 text-primary/50" />
                    </motion.div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
                
                {/* Prize Badge */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-3 p-3 bg-background/95 backdrop-blur-md rounded-xl border border-primary/30 shadow-2xl">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/40">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Prize</p>
                      <p className="font-bold text-foreground text-lg">{giveaway.prize}</p>
                    </div>
                  </div>
                </div>

                {/* Category Badge */}
                <div className="absolute top-4 right-4">
                  {isWhitelisted ? (
                    <Badge className="bg-gradient-to-r from-purple-500 to-violet-500 text-white border-0 shadow-lg">
                      <Lock className="w-3 h-3 mr-1" />
                      WHITELIST ONLY
                    </Badge>
                  ) : (
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg">
                      <Globe className="w-3 h-3 mr-1" />
                      OPEN TO ALL
                    </Badge>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-6">
                <DialogHeader className="text-left p-0">
                  <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-primary" />
                    {giveaway.title}
                  </DialogTitle>
                  <DialogDescription className="text-base mt-2">
                    {giveaway.description || "Enter for your chance to win this amazing prize!"}
                  </DialogDescription>
                </DialogHeader>

                {/* User Info Card */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border border-primary/20">
                  <div className="flex items-center gap-4">
                    {discordAvatar ? (
                      <img 
                        src={discordAvatar} 
                        alt={discordUsername}
                        className="w-14 h-14 rounded-xl border-2 border-primary/30 shadow-lg"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                        <Users className="w-7 h-7 text-white" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Entering as</p>
                      <p className="font-bold text-foreground text-lg">{discordUsername}</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-lg border border-green-500/30">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-sm font-medium text-green-500">Connected</span>
                    </div>
                  </div>
                </div>

                {/* Live Countdown Timer */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border border-primary/20">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground uppercase tracking-wider">Time Remaining</span>
                  </div>
                  <div className="flex justify-center gap-2">
                    {[
                      { value: timeLeft.days, label: 'Days' },
                      { value: timeLeft.hours, label: 'Hrs' },
                      { value: timeLeft.minutes, label: 'Min' },
                      { value: timeLeft.seconds, label: 'Sec' }
                    ].map((item, index) => (
                      <motion.div
                        key={item.label}
                        className="flex flex-col items-center"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 rounded-lg blur-md" />
                          <div className="relative bg-gradient-to-br from-card to-card/80 border-2 border-primary/40 rounded-lg px-3 py-2 min-w-[52px] backdrop-blur-sm shadow-lg">
                            <motion.span
                              key={item.value}
                              initial={{ y: -5, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              className="block text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary to-accent text-center"
                            >
                              {item.value.toString().padStart(2, '0')}
                            </motion.span>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-muted-foreground mt-1.5 uppercase tracking-wider">{item.label}</span>
                      </motion.div>
                    ))}
                  </div>
                  {timeLeft.days === 0 && timeLeft.hours < 24 && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-center gap-2 mt-3 text-yellow-500"
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-xs font-semibold">Ending soon! Don't miss out!</span>
                    </motion.div>
                  )}
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-muted/30 text-center">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-lg font-bold text-foreground">{entryCount}</p>
                    <p className="text-xs text-muted-foreground">Entries</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30 text-center">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                      <Crown className="w-5 h-5 text-yellow-500" />
                    </div>
                    <p className="text-lg font-bold text-foreground">{giveaway.winner_count}</p>
                    <p className="text-xs text-muted-foreground">Winners</p>
                  </div>
                </div>

                {/* Entry Progress */}
                {giveaway.max_entries && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Entry Capacity</span>
                      <span className="font-semibold text-foreground">{entryCount} / {giveaway.max_entries}</span>
                    </div>
                    <div className="relative h-3 bg-muted/50 rounded-full overflow-hidden">
                      <motion.div 
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                    {progress > 80 && (
                      <p className="text-xs text-yellow-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Filling up fast! Only {giveaway.max_entries - entryCount} spots left.
                      </p>
                    )}
                  </div>
                )}

                {/* Rules Agreement */}
                <div className="p-4 rounded-xl bg-muted/20 border border-border/50">
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      id="accept-rules" 
                      checked={acceptedRules}
                      onCheckedChange={(checked) => setAcceptedRules(checked as boolean)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <Label htmlFor="accept-rules" className="text-sm font-medium cursor-pointer">
                        I agree to the giveaway rules
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        By entering, I confirm I'm a Discord member and understand only one entry per person is allowed.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button 
                    className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] hover:bg-right transition-all duration-500 shadow-lg shadow-primary/30 disabled:opacity-50"
                    onClick={handleConfirmEntry}
                    disabled={!acceptedRules}
                  >
                    <Ticket className="w-6 h-6 mr-2" />
                    Confirm Entry
                    <Zap className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>

                <p className="text-xs text-center text-muted-foreground">
                  Winners will be announced via Discord after the giveaway ends
                </p>
              </div>
            </motion.div>
          )}

          {step === "entering" && (
            <motion.div
              key="entering"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="p-12 text-center"
            >
              <div className="relative mx-auto w-24 h-24 mb-6">
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-accent opacity-30"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <div className="relative w-full h-full rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Loader2 className="w-12 h-12 text-white animate-spin" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Submitting Your Entry...</h3>
              <p className="text-muted-foreground">Please wait while we process your entry</p>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="p-8 text-center relative overflow-hidden"
            >
              {/* Confetti */}
              {showConfetti && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {[...Array(20)].map((_, i) => (
                    <ConfettiPiece key={i} delay={i * 0.05} />
                  ))}
                </div>
              )}

              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                className="relative mx-auto w-28 h-28 mb-6"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 opacity-30 blur-xl" />
                <div className="relative w-full h-full rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-xl shadow-green-500/40">
                  <Check className="w-14 h-14 text-white" strokeWidth={3} />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center justify-center gap-2 mb-3">
                  <PartyPopper className="w-7 h-7 text-yellow-500" />
                  <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                    You're In!
                  </h3>
                  <PartyPopper className="w-7 h-7 text-yellow-500 transform scale-x-[-1]" />
                </div>
                
                <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                  Your entry for <span className="font-semibold text-foreground">{giveaway.title}</span> has been confirmed. Good luck!
                </p>

                {/* Entry Status */}
                <div className="p-3 rounded-xl bg-gradient-to-r from-green-500/10 via-emerald-500/5 to-green-500/10 border border-green-500/20 mb-4">
                  <div className="flex items-center justify-center gap-3">
                    <div className="flex items-center gap-2">
                      <Ticket className="w-5 h-5 text-green-500" />
                      <span className="text-sm font-semibold text-foreground">
                        {currentEntryCount + totalBonusEntries} {currentEntryCount + totalBonusEntries === 1 ? 'Entry' : 'Entries'}
                      </span>
                    </div>
                    {totalBonusEntries > 0 && (
                      <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                        +{totalBonusEntries} Bonus
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Bonus Entry Section */}
                {totalBonusEntries < 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mb-6"
                  >
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-semibold text-foreground">Earn Bonus Entries</span>
                      <Badge variant="outline" className="text-xs">Max 2</Badge>
                    </div>
                    
                    <div className="space-y-2">
                      {/* Social Share Bonus */}
                      {!localBonusState.social_share_bonus && (
                        <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <Share2 className="w-4 h-4 text-blue-500" />
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-medium text-foreground">Share on Social</p>
                                <p className="text-xs text-muted-foreground">+1 bonus entry</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 h-9"
                              onClick={() => handleSocialShare('twitter')}
                              disabled={claimingBonus === 'social_share'}
                            >
                              {claimingBonus === 'social_share' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Twitter className="w-4 h-4 mr-1" />
                                  Twitter
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 h-9"
                              onClick={() => handleSocialShare('facebook')}
                              disabled={claimingBonus === 'social_share'}
                            >
                              <Facebook className="w-4 h-4 mr-1" />
                              Facebook
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Referral Bonus */}
                      {!localBonusState.referral_bonus && (
                        <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                <UserPlus className="w-4 h-4 text-purple-500" />
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-medium text-foreground">Invite a Friend</p>
                                <p className="text-xs text-muted-foreground">+1 bonus entry</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={handleInviteFriend}
                              disabled={claimingBonus === 'referral'}
                              className="bg-purple-500/20 text-purple-500 hover:bg-purple-500/30 border-purple-500/30"
                            >
                              {claimingBonus === 'referral' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Copy className="w-4 h-4 mr-1" />
                                  Copy Link
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* All bonuses claimed */}
                      {localBonusState.social_share_bonus && localBonusState.referral_bonus && (
                        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Check className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium text-green-500">All bonus entries claimed!</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Prize Info */}
                <div className="p-3 rounded-xl bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border border-primary/20 mb-4">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg">
                      <Trophy className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground">Prize</p>
                      <p className="font-bold text-foreground text-sm">{giveaway.prize}</p>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={onClose}
                  className="px-8 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Done
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default GiveawayEntryDialog;
