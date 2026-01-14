import { MessageCircle, FileText, Users, HelpCircle, AlertCircle, CheckCircle, Ban, Search, TrendingUp, Activity, UserCheck } from "lucide-react";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import headerSupport from "@/assets/header-support.jpg";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Clock, Shield, Zap } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useStaffOnlineStatus } from "@/hooks/useStaffOnlineStatus";

interface BanAppeal {
  id: string;
  status: string;
  discord_username: string;
  steam_id: string;
  ban_reason: string;
  appeal_reason: string;
  additional_info: string | null;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

const Support = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [banAppeals, setBanAppeals] = useState<BanAppeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { onlineStatus, onlineCount } = useStaffOnlineStatus();
  
  const [supportStats, setSupportStats] = useState({
    activeChats: 0,
    avgResponseTime: "< 5 min",
    staffOnline: 0,
    resolvedToday: 0
  });

  useEffect(() => {
    fetchSupportStats();
    // Removed heavy realtime subscription - stats refresh on page load is sufficient
    // The support chat page itself has proper realtime for individual chats
  }, []);

  useEffect(() => {
    setSupportStats(prev => ({
      ...prev,
      staffOnline: onlineCount
    }));
  }, [onlineCount]);

  const fetchSupportStats = async () => {
    try {
      // Fetch active chats count (open and in_progress)
      const { count: activeChatsCount } = await supabase
        .from("support_chats")
        .select("*", { count: "exact", head: true })
        .in("status", ["open", "in_progress"]);

      // Fetch resolved chats today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { count: resolvedCount } = await supabase
        .from("support_chats")
        .select("*", { count: "exact", head: true })
        .eq("status", "closed")
        .gte("resolved_at", todayStart.toISOString());

      setSupportStats(prev => ({
        ...prev,
        activeChats: activeChatsCount || 0,
        resolvedToday: resolvedCount || 0
      }));
    } catch (error) {
      console.error("Error fetching support stats:", error);
    }
  };

  const fetchBanAppeals = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to view your ban appeals.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("ban_appeals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setBanAppeals(data || []);
      setShowResultsDialog(true);
    } catch (error) {
      console.error("Error fetching ban appeals:", error);
      toast({
        title: "Error",
        description: "Failed to fetch ban appeals. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/50">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/50">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50">Pending</Badge>;
    }
  };

  const [activeCategory, setActiveCategory] = useState("all");

  const faqCategories = {
    general: {
      label: "General",
      icon: HelpCircle,
      items: [
        {
          id: "general-1",
          question: "How do I join the SLRP server?",
          answer: "To join SLRP, you need to: 1) Apply for whitelist on our website, 2) Wait for approval (usually 24-48 hours), 3) Join our Discord for setup instructions, 4) Install FiveM and connect using our server IP: connect.skylifeindia.com:30120"
        },
        {
          id: "general-2",
          question: "What are the server requirements?",
          answer: "You need: GTA V (legal copy), FiveM installed, a working microphone, Discord account, age 16+, and ability to roleplay in English/Hindi. Basic PC specs: Intel i5/Ryzen 5, 8GB RAM, GTX 1060 or equivalent."
        },
        {
          id: "general-3",
          question: "How long does whitelist approval take?",
          answer: "Whitelist applications are typically reviewed within 24-48 hours. During peak times, it may take up to 72 hours. You'll receive a notification on Discord once your application is reviewed."
        },
        {
          id: "general-4",
          question: "Can I play without a microphone?",
          answer: "No, a working microphone is mandatory for SLRP. Roleplay requires voice communication for immersion. Text-only roleplay is not permitted except for characters approved as mute."
        },
        {
          id: "general-5",
          question: "How many characters can I create?",
          answer: "You can create up to 3 characters per account. Each character has separate inventory, money, and storyline. You cannot transfer items or money between your own characters."
        },
        {
          id: "general-6",
          question: "How do I report a player?",
          answer: "To report a player: 1) Use /report in-game for immediate issues, 2) Create a ticket in Discord with evidence (video/screenshots), 3) Include player names, timestamps, and detailed description."
        }
      ]
    },
    rules: {
      label: "Rules",
      icon: Shield,
      items: [
        {
          id: "rules-1",
          question: "What is RDM and VDM?",
          answer: "RDM (Random Deathmatch) is killing players without any roleplay reason or interaction. VDM (Vehicle Deathmatch) is using your vehicle as a weapon to kill or injure players. Both are strictly prohibited and result in bans."
        },
        {
          id: "rules-2",
          question: "What is metagaming and powergaming?",
          answer: "Metagaming is using out-of-character information (like Discord, streams, or OOC chat) in roleplay. Powergaming is forcing actions on others without giving them a chance to respond."
        },
        {
          id: "rules-3",
          question: "What is NLR (New Life Rule)?",
          answer: "NLR means after your character dies, you forget everything that happened leading to your death. You cannot return to the location of your death for 15 minutes or seek revenge."
        },
        {
          id: "rules-4",
          question: "What is Fear RP?",
          answer: "Fear RP means your character must realistically fear for their life when threatened. If someone points a gun at you, you must comply with their demands. You cannot pull out weapons at gunpoint."
        },
        {
          id: "rules-5",
          question: "What is FailRP?",
          answer: "FailRP is any action that breaks the immersion of roleplay or is unrealistic. Examples: talking about game mechanics in-character, not valuing your life, unrealistic actions, or breaking character."
        }
      ]
    },
    jobs: {
      label: "Jobs",
      icon: Users,
      items: [
        {
          id: "jobs-1",
          question: "What jobs can I do on the server?",
          answer: "SLRP offers many legal jobs: Police, EMS, Mechanics, Taxi, Trucking, Fishing, Mining, Real Estate, and more. Illegal activities include gang operations, drug dealing, and heists."
        },
        {
          id: "jobs-2",
          question: "How do I earn money in-game?",
          answer: "You can earn money through legal jobs (police, EMS, mechanic, taxi, trucking), businesses, or illegal activities (with proper RP). Starting players get a small amount and can work their way up."
        },
        {
          id: "jobs-3",
          question: "How do I join a gang or organization?",
          answer: "Gangs and organizations recruit through in-character interactions. Build relationships, prove yourself through RP, and you may get invited. Some gangs have application processes."
        },
        {
          id: "jobs-4",
          question: "How do I apply for government jobs?",
          answer: "Government jobs like Police, EMS, and DOJ require applications on our website. Go to the Jobs page, select the department, and fill out the application form. Applications are reviewed within 48-72 hours."
        },
        {
          id: "jobs-5",
          question: "Can I own a business?",
          answer: "Yes! You can purchase or rent businesses in-game. Business types include restaurants, car dealerships, nightclubs, and more. Contact staff for business availability and pricing."
        }
      ]
    },
    bans: {
      label: "Bans",
      icon: Ban,
      items: [
        {
          id: "bans-1",
          question: "What happens if I break server rules?",
          answer: "Rule violations result in warnings, kicks, temporary bans, or permanent bans depending on severity. Minor offenses get warnings, serious violations (RDM, VDM, hacking) result in immediate bans."
        },
        {
          id: "bans-2",
          question: "How do I appeal a ban?",
          answer: "Visit our Support page and click 'Submit Ban Appeal'. Provide your Steam ID, Discord username, reason for ban, and why you should be unbanned. Appeals are reviewed within 48-72 hours."
        },
        {
          id: "bans-3",
          question: "How long do bans last?",
          answer: "Ban duration depends on the offense: Minor violations (1-3 days), Moderate violations (7-14 days), Major violations (30 days to permanent). Repeat offenders face longer bans."
        },
        {
          id: "bans-4",
          question: "Can I create a new account if banned?",
          answer: "No, ban evasion is strictly prohibited. Creating new accounts to bypass a ban will result in a permanent ban on all accounts and may prevent any future appeals."
        },
        {
          id: "bans-5",
          question: "What evidence do I need for a ban appeal?",
          answer: "For successful appeals, provide: any video evidence, screenshots, witness names, your side of the story, and a sincere apology if you violated rules. Honest appeals are more likely to succeed."
        }
      ]
    }
  };

  const getAllFaqItems = () => {
    return Object.values(faqCategories).flatMap(category => category.items);
  };

  const getFaqItemsByCategory = (category: string) => {
    if (category === "all") return getAllFaqItems();
    return faqCategories[category as keyof typeof faqCategories]?.items || [];
  };

  const currentFaqs = getFaqItemsByCategory(activeCategory);
  const filteredFaqs = currentFaqs.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <PageHeader 
        title="Support Center"
        description="Get help, find answers, and connect with our dedicated support team. We're here to ensure your SLRP experience is exceptional."
        backgroundImage={headerSupport}
      />
      
      <main className="container mx-auto px-4 pb-12">
        {/* Support Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12 max-w-5xl mx-auto -mt-16 relative z-10">
          <Card className="glass-effect border-primary/20 hover:border-primary/50 transition-all animate-fade-in">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{supportStats.activeChats}</p>
                  <p className="text-xs text-muted-foreground">Active Chats</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-primary/20 hover:border-primary/50 transition-all animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{supportStats.avgResponseTime}</p>
                  <p className="text-xs text-muted-foreground">Avg Response</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-primary/20 hover:border-primary/50 transition-all animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center relative">
                  <UserCheck className="w-6 h-6 text-primary" />
                  {supportStats.staffOnline > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-card animate-pulse" />
                  )}
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{supportStats.staffOnline}</p>
                  <p className="text-xs text-muted-foreground">Staff Online</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-primary/20 hover:border-primary/50 transition-all animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{supportStats.resolvedToday}</p>
                  <p className="text-xs text-muted-foreground">Resolved Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How It Works Info */}
        <div className="max-w-3xl mx-auto mb-12">
          <Card className="glass-effect border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">How Chat Support Works</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>✓ Click "Live Chat Support" to start a conversation</li>
                    <li>✓ All {supportStats.staffOnline} online staff members are automatically notified</li>
                    <li>✓ Average response time: {supportStats.avgResponseTime}</li>
                    <li>✓ Chat history is saved - you can continue the conversation anytime</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col items-center gap-6 mb-16">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-foreground mb-2">Need Help?</h2>
            <p className="text-muted-foreground">Our staff team is ready to assist you</p>
          </div>
          
          <div className="flex flex-wrap gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25"
              asChild
            >
              <Link to="/support-chat">
                <MessageCircle className="w-5 h-5 mr-2" />
                Live Chat Support
              </Link>
            </Button>
            
            
            <Button 
              size="lg"
              variant="outline"
              className="border-primary text-primary hover:bg-primary/10"
              asChild
            >
              <Link to="/ban-appeal">
                <Ban className="w-5 h-5 mr-2" />
                Submit Ban Appeal
              </Link>
            </Button>
            
            <Button 
              size="lg"
              variant="outline"
              className="border-primary text-primary hover:bg-primary/10"
              onClick={fetchBanAppeals}
              disabled={loading}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              {loading ? "Loading..." : "Ban Appeal Results"}
            </Button>
          </div>
          
          <div className="mt-2 text-center">
            <p className="text-sm text-muted-foreground">
              💬 Staff notifications: {supportStats.staffOnline} team members online and ready to help
            </p>
          </div>
        </div>

        {/* Contact Methods */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-foreground">Get In Touch</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card className="glass-effect border-border/20 hover:border-primary/50 transition-all hover:scale-105">
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4">
                  <MessageCircle className="w-7 h-7 text-primary" />
                </div>
                <CardTitle className="text-xl">Discord Support</CardTitle>
                <CardDescription>
                  Join our Discord for instant help from staff and community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white" asChild>
                  <a href="https://discord.gg/W2nU97maBh" target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Join Discord
                  </a>
                </Button>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Average response: &lt; 5 minutes
                </p>
              </CardContent>
            </Card>

            <Card className="glass-effect border-border/20 hover:border-primary/50 transition-all hover:scale-105">
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4">
                  <Mail className="w-7 h-7 text-primary" />
                </div>
                <CardTitle className="text-xl">Email Support</CardTitle>
                <CardDescription>
                  Send detailed inquiries and get professional responses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <a href="mailto:skyliferoleplay0@gmail.com">
                    <Mail className="w-4 h-4 mr-2" />
                    Email Us
                  </a>
                </Button>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Response within 24 hours
                </p>
              </CardContent>
            </Card>

            <Card className="glass-effect border-border/20 hover:border-primary/50 transition-all hover:scale-105">
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4">
                  <FileText className="w-7 h-7 text-primary" />
                </div>
                <CardTitle className="text-xl">Support Ticket</CardTitle>
                <CardDescription>
                  Create a ticket for technical issues or account help
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" asChild>
                  <a href="https://discord.com/channels/1160302312175194164/1277506857166049300" target="_blank" rel="noopener noreferrer">
                    <FileText className="w-4 h-4 mr-2" />
                    Create Ticket
                  </a>
                </Button>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Tracked until resolved
                </p>
              </CardContent>
            </Card>

            <Card className="glass-effect border-border/20 hover:border-primary/50 transition-all hover:scale-105">
              <CardHeader>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4">
                  <HelpCircle className="w-7 h-7 text-primary" />
                </div>
                <CardTitle className="text-xl">Browse FAQ</CardTitle>
                <CardDescription>
                  Find instant answers to common questions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  View FAQ
                </Button>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  100+ answered questions
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div id="faq-section" className="max-w-4xl mx-auto mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4 text-foreground">Frequently Asked Questions</h2>
            <p className="text-muted-foreground mb-6">Search through our knowledge base to find instant answers</p>
            
            <div className="relative max-w-xl mx-auto mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 bg-card/50 border-border/50 focus:border-primary/50 transition-colors"
              />
            </div>

            {/* Category Tabs */}
            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-6 h-auto p-1">
                <TabsTrigger 
                  value="all" 
                  className="flex items-center gap-2 py-2.5 text-xs sm:text-sm"
                >
                  <HelpCircle className="w-4 h-4 hidden sm:block" />
                  All
                </TabsTrigger>
                {Object.entries(faqCategories).map(([key, category]) => {
                  const Icon = category.icon;
                  return (
                    <TabsTrigger 
                      key={key} 
                      value={key}
                      className="flex items-center gap-2 py-2.5 text-xs sm:text-sm"
                    >
                      <Icon className="w-4 h-4 hidden sm:block" />
                      {category.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          </div>

          <Card className="glass-effect border-border/20">
            <CardContent className="pt-6">
              {filteredFaqs.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-lg text-muted-foreground">No FAQs match your search</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Try different keywords or browse all questions
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery("");
                      setActiveCategory("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {filteredFaqs.map((item) => (
                    <AccordionItem key={item.id} value={item.id}>
                      <AccordionTrigger className="text-left hover:text-primary transition-colors">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>

          {filteredFaqs.length > 0 && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              Showing {filteredFaqs.length} of {getAllFaqItems().length} questions
              {activeCategory !== "all" && ` in ${faqCategories[activeCategory as keyof typeof faqCategories]?.label}`}
            </p>
          )}
        </div>

        {/* Support Guidelines */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-foreground">Support Guidelines</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="glass-effect border-border/20">
              <CardHeader>
                <Shield className="w-10 h-10 text-primary mb-3" />
                <CardTitle>Be Respectful</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Treat support staff with respect. Harassment, spam, or abusive behavior will not be tolerated and may result in support privileges being revoked.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-effect border-border/20">
              <CardHeader>
                <FileText className="w-10 h-10 text-primary mb-3" />
                <CardTitle>Provide Details</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Include all relevant information: error messages, screenshots, player names, timestamps. The more details you provide, the faster we can help.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-effect border-border/20">
              <CardHeader>
                <Clock className="w-10 h-10 text-primary mb-3" />
                <CardTitle>Be Patient</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Our staff are volunteers handling multiple requests. We aim to respond quickly but appreciate your patience during busy periods.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Ban className="w-6 h-6 text-primary" />
              Your Ban Appeal Results
            </DialogTitle>
            <DialogDescription>
              View the status and details of all your ban appeals
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {banAppeals.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">No ban appeals found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  You haven't submitted any ban appeals yet.
                </p>
              </div>
            ) : (
              banAppeals.map((appeal) => (
                <Card key={appeal.id} className="glass-effect border-border/20">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">Appeal Status</CardTitle>
                        <CardDescription>
                          Submitted on {format(new Date(appeal.created_at), "PPP 'at' p")}
                        </CardDescription>
                      </div>
                      {getStatusBadge(appeal.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Discord Username</p>
                        <p className="text-sm">{appeal.discord_username}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Steam ID</p>
                        <p className="text-sm">{appeal.steam_id}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Ban Reason</p>
                      <p className="text-sm">{appeal.ban_reason}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Your Appeal</p>
                      <p className="text-sm">{appeal.appeal_reason}</p>
                    </div>
                    
                    {appeal.additional_info && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Additional Information</p>
                        <p className="text-sm">{appeal.additional_info}</p>
                      </div>
                    )}
                    
                    {appeal.admin_notes && (
                      <div className="space-y-1 bg-muted/50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-primary">Admin Response</p>
                        <p className="text-sm">{appeal.admin_notes}</p>
                      </div>
                    )}
                    
                    {appeal.reviewed_at && (
                      <div className="text-sm text-muted-foreground pt-2 border-t border-border/20">
                        Reviewed on {format(new Date(appeal.reviewed_at), "PPP 'at' p")}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Support;
