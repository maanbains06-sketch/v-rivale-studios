import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Users, 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Target, 
  Skull, 
  Handshake,
  Car,
  DollarSign,
  MessageSquare,
  MapPin,
  Clock,
  Loader2,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWhitelistAccess } from "@/hooks/useWhitelistAccess";
import GangApplicationForm from "@/components/GangApplicationForm";
import headerGang from "@/assets/header-gang.jpg";

const gangRules = [
  {
    icon: Users,
    title: "1. Gang Registration Required",
    description: "All gangs must be officially registered with server administration before operating. Unregistered gangs are not recognized and may face consequences."
  },
  {
    icon: Target,
    title: "2. Territory Claims",
    description: "Gang territories must be approved by admins. You cannot claim areas already controlled by other gangs without proper RP escalation and admin approval. Territory disputes must follow war rules."
  },
  {
    icon: MessageSquare,
    title: "3. Roleplay Before Violence",
    description: "All gang conflicts must have proper RP buildup. Random drive-by shootings without RP context are strictly forbidden. Initiate verbal RP before any violent action."
  },
  {
    icon: Shield,
    title: "4. Respect Gang Hierarchy",
    description: "Follow your gang's chain of command. Leaders make final decisions on gang activities. Insubordination can result in IC consequences and OOC warnings."
  },
  {
    icon: Handshake,
    title: "5. Alliance & War Protocols",
    description: "Gang alliances and wars must be documented and reported to admins. War declarations require valid RP reasons and must follow the 72-hour cooldown rule after previous conflicts."
  },
  {
    icon: Skull,
    title: "6. No Random Death Match (RDM)",
    description: "Killing players without proper roleplay initiation is RDM and bannable. You must have a valid in-character reason for any violent actions against others."
  },
  {
    icon: Car,
    title: "7. Vehicle Rules",
    description: "Gang vehicles must be registered. Drive-by rules: shooter must be in back seat, driver cannot shoot. Vehicle storage cannot exceed 3 illegal weapons. No armored vehicles without approval."
  },
  {
    icon: DollarSign,
    title: "8. Drug & Weapon Trade",
    description: "All illegal trades must be roleplayed properly. No selling drugs at police stations or hospitals. Weapon sales require background RP. Transaction logs must be maintained."
  },
  {
    icon: MapPin,
    title: "9. Safe Zone Respect",
    description: "No gang activities in safe zones (hospitals, police stations, spawn areas). Green zones are neutral territory. Breaking this rule results in immediate punishment."
  },
  {
    icon: Clock,
    title: "10. Cooldown Periods",
    description: "After gang conflicts: 30-minute cooldown before re-engagement. After major events: 24-hour cooldown. War cooldowns: 72 hours between war declarations with the same gang."
  },
  {
    icon: AlertTriangle,
    title: "11. Fear Roleplay (FearRP)",
    description: "If outnumbered or at gunpoint, you must value your life. No heroics when clearly outmatched. Failure to comply with FearRP results in warnings and potential bans."
  },
  {
    icon: Shield,
    title: "12. Police Interaction Rules",
    description: "During police raids, follow proper surrender protocols. No combat logging during active police encounters. Evidence must be disposed of properly through RP."
  },
  {
    icon: Users,
    title: "13. Recruitment Standards",
    description: "New gang members must undergo RP initiation. Minimum 48-hour probation period. Character must have established backstory explaining gang involvement."
  },
  {
    icon: XCircle,
    title: "14. Prohibited Activities",
    description: "No kidnapping for more than 30 minutes. No torture RP without consent. No sexual assault RP. No targeting players under 18. No real-world threats or harassment."
  },
  {
    icon: CheckCircle2,
    title: "15. Evidence & Documentation",
    description: "Keep screenshots/recordings of major gang events. Report all significant RP to gang leadership. Document all wars, alliances, and territory changes for admin review."
  },
  {
    icon: Handshake,
    title: "16. OOC Communication",
    description: "Keep IC and OOC separate. No metagaming gang information. Discord channels for planning must not share real-time locations. Use in-game radio for live coordination."
  },
  {
    icon: Target,
    title: "17. Robbery Limits",
    description: "Maximum robbery value: $50,000 per victim per 24 hours. Store robberies require minimum 2 gang members. Bank heists require admin presence and 4+ members."
  },
  {
    icon: AlertTriangle,
    title: "18. Consequence System",
    description: "1st offense: Warning. 2nd offense: 24-hour gang suspension. 3rd offense: Character death and gang removal. 4th offense: Server ban. Appeals can be made within 48 hours."
  },
  {
    icon: Shield,
    title: "19. Snitch Rules",
    description: "Informing police about gang activities must be done through proper RP channels. Witness protection is available but requires admin involvement. Snitches face IC consequences only."
  },
  {
    icon: Users,
    title: "20. Gang Size Limits",
    description: "Maximum gang size: 15 official members. Prospects don't count toward limit. Multiple gangs in same alliance: max 25 combined for events. Exceeding limits requires admin approval."
  },
];

const GangRP = () => {
  const navigate = useNavigate();
  const [showApplication, setShowApplication] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // Use Discord whitelist role for access control
  const { hasAccess, isInServer, hasWhitelistRole, loading: accessLoading, refreshAccess } = useWhitelistAccess();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user || null);
    } catch (error) {
      console.error("Error checking user:", error);
    } finally {
      setLoading(false);
    }
  };

  const isPageLoading = loading || accessLoading;

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <PageHeader 
          title="Gang Roleplay"
          description="Rules and applications for criminal roleplay"
          badge="Criminal RP"
          backgroundImage={headerGang}
        />
        <div className="container mx-auto px-4 pb-16 flex justify-center items-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const renderAccessDenied = () => {
    if (!user) {
      return (
        <Alert className="glass-effect border-border/20">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription className="mt-2">
            You must be logged in to submit a gang application.
            <div className="mt-4">
              <Button onClick={() => navigate("/auth")}>
                Login / Sign Up
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    if (!isInServer) {
      return (
        <Alert className="glass-effect border-border/20">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Join Our Discord Server</AlertTitle>
          <AlertDescription className="mt-2">
            You must be a member of our Discord server to apply for gang RP.
            <div className="mt-4 flex gap-3">
              <Button asChild>
                <a href="https://discord.gg/slrp" target="_blank" rel="noopener noreferrer">
                  Join Discord Server
                </a>
              </Button>
              <Button variant="outline" onClick={refreshAccess}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Check Again
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    if (!hasWhitelistRole) {
      return (
        <Alert className="glass-effect border-border/20">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Whitelist Role Required</AlertTitle>
          <AlertDescription className="mt-2">
            You need the whitelist role in our Discord server to apply for gang RP.
            Apply for whitelist or contact server staff if you believe you should have access.
            <div className="mt-4 flex gap-3">
              <Button onClick={() => navigate("/whitelist")}>
                Apply for Whitelist
              </Button>
              <Button variant="outline" onClick={refreshAccess}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Check Again
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <PageHeader 
        title="Gang Roleplay"
        description="Join the criminal underworld of San Andreas - Rules, Guidelines & Applications"
        badge="Criminal RP"
        backgroundImage={headerGang}
        backgroundPosition="center center"
        minHeight="70vh"
      />
      
      <main className="container mx-auto px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          
          {/* Introduction */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gradient mb-4">Welcome to Gang Roleplay</h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              Gang roleplay is one of the most immersive experiences on our server. Before joining, 
              make sure you understand all rules and guidelines below. Quality roleplay is expected at all times.
            </p>
          </div>

          {/* Rules Section */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 mb-4">Important Rules</Badge>
              <h2 className="text-3xl font-bold text-gradient mb-4">Gang RP Rules & Guidelines</h2>
              <p className="text-muted-foreground">Breaking these rules will result in consequences. Read carefully.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {gangRules.map((rule, index) => {
                const Icon = rule.icon;
                return (
                  <Card 
                    key={index} 
                    className="glass-effect border-border/20 hover:border-red-500/30 transition-all duration-300"
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-red-400" />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">{rule.title}</h3>
                          <p className="text-sm text-muted-foreground">{rule.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Apply Section */}
          <div className="mb-8">
            <Card className="glass-effect border-border/20 overflow-hidden">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-orange-500/10 to-red-500/20"></div>
                <CardContent className="relative p-8 md:p-12 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-500/20 border border-red-500/30 mb-6">
                    <Users className="w-10 h-10 text-red-400" />
                  </div>
                  <h2 className="text-3xl font-bold mb-4">Want to Join Gang RP?</h2>
                  <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                    Ready to become part of the criminal underworld? Apply now to join gang roleplay. 
                    Make sure you've read all the rules above and are prepared for serious roleplay.
                  </p>
                  
                  {!showApplication && (
                    <Button 
                      size="lg"
                      onClick={() => setShowApplication(true)}
                      className="bg-red-600 hover:bg-red-700 text-white px-8"
                    >
                      <Users className="w-5 h-5 mr-2" />
                      Apply Now
                    </Button>
                  )}
                </CardContent>
              </div>
            </Card>
          </div>

          {/* Application Form */}
          {showApplication && (
            <div className="space-y-6">
              <Button 
                variant="outline" 
                onClick={() => setShowApplication(false)}
                className="mb-4"
              >
                ← Back to Rules
              </Button>

              {!hasAccess ? (
                renderAccessDenied()
              ) : (
                <GangApplicationForm />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default GangRP;