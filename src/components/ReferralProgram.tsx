import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Gift, Users, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ReferralProgram = () => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  // Generate a unique referral code (in production, this would come from the backend)
  const referralCode = "SLRP-" + Math.random().toString(36).substring(2, 8).toUpperCase();
  const referralLink = `${window.location.origin}?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

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
                <p className="text-2xl font-bold text-accent mt-1">0</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Earned Rewards:</p>
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/30">
              <span className="text-muted-foreground">Available Discount</span>
              <span className="text-xl font-bold text-primary">0%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralProgram;
