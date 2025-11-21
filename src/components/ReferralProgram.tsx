import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Gift, Users, Check, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const ReferralProgram = () => {
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [referralCode, setReferralCode] = useState<string>("");
  const [totalReferrals, setTotalReferrals] = useState<number>(0);
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const referralLink = referralCode ? `${window.location.origin}?ref=${referralCode}` : "";

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        await fetchReferralData(user.id);
      }
    } catch (error) {
      console.error("Error checking user:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferralData = async (userId: string) => {
    try {
      // Fetch referral code
      const { data: codeData, error: codeError } = await supabase
        .from("referral_codes")
        .select("referral_code")
        .eq("user_id", userId)
        .single();

      if (codeError) throw codeError;
      setReferralCode(codeData.referral_code);

      // Fetch referral rewards
      const { data: rewardsData, error: rewardsError } = await supabase
        .from("referral_rewards")
        .select("total_referrals, discount_percentage")
        .eq("user_id", userId)
        .single();

      if (rewardsError) throw rewardsError;
      setTotalReferrals(rewardsData.total_referrals);
      setDiscountPercentage(rewardsData.discount_percentage);
    } catch (error) {
      console.error("Error fetching referral data:", error);
      toast({
        title: "Error",
        description: "Failed to load referral data",
        variant: "destructive",
      });
    }
  };

  const handleCopy = () => {
    if (!referralLink) return;
    
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="mt-16 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="mt-4 text-muted-foreground">Loading referral data...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mt-16 space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 mb-4 animate-scale-in">
            <Gift className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-gradient">Referral Program</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Invite your friends to SLRP and earn rewards! Get 10% discount for every successful referral.
          </p>
        </div>

        <Card className="glass-effect border-primary/30 max-w-2xl mx-auto animate-fade-in">
          <CardContent className="pt-6 text-center space-y-4">
            <LogIn className="w-12 h-12 mx-auto text-primary" />
            <h3 className="text-xl font-semibold">Login Required</h3>
            <p className="text-muted-foreground">
              Please log in to access your unique referral link and start earning rewards.
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="mt-4"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Login to Get Your Link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-16 space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 mb-4 animate-scale-in">
          <Gift className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl font-bold text-gradient">Referral Program</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Invite your friends to SLRP and earn rewards! Get 10% discount for every successful referral.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
        <Card className="glass-effect border-primary/30 hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Share Your Link</CardTitle>
            <CardDescription>
              Share your unique referral link with friends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Send your personal referral link to friends who want to join SLRP
            </p>
          </CardContent>
        </Card>

        <Card className="glass-effect border-primary/30 hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mb-4">
              <Gift className="w-6 h-6 text-accent" />
            </div>
            <CardTitle>They Get 5% Off</CardTitle>
            <CardDescription>
              Your friends save money on their first purchase
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              First-time users get 5% discount using your referral link
            </p>
          </CardContent>
        </Card>

        <Card className="glass-effect border-primary/30 hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
              <Check className="w-6 h-6 text-green-500" />
            </div>
            <CardTitle>You Get 10% Off</CardTitle>
            <CardDescription>
              Earn rewards for every successful referral
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Get 10% discount credit for each friend who makes a purchase
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-effect border-primary/30 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
          <CardDescription>Share this link with your friends</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input 
              value={referralLink} 
              readOnly 
              className="font-mono text-sm bg-muted/50"
            />
            <Button 
              onClick={handleCopy}
              className="min-w-[100px] relative overflow-hidden group"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2 animate-scale-in" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>
          
          <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Your Referral Code</p>
                <p className="text-2xl font-bold text-primary mt-1">{referralCode}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Referrals</p>
                <p className="text-2xl font-bold text-accent mt-1">{totalReferrals}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Earned Rewards:</p>
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/30">
              <span className="text-muted-foreground">Available Discount</span>
              <span className="text-xl font-bold text-primary">{discountPercentage}%</span>
            </div>
            {discountPercentage > 0 && (
              <p className="text-xs text-muted-foreground">
                💰 You can use this discount on your next purchase!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralProgram;
