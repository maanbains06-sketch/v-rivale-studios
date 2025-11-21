import { MessageCircle, FileText, Users, HelpCircle, AlertCircle, CheckCircle, Ban } from "lucide-react";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import headerSupport from "@/assets/header-support.jpg";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Clock, Shield, Zap } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useNavigate } from "react-router-dom";

const Support = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <PageHeader 
        title="Support Center"
        description="Get help, find answers, and connect with our dedicated support team. We're here to ensure your SLRP experience is exceptional."
        backgroundImage={headerSupport}
      />
      
      <main className="container mx-auto px-4 pb-12">
        <div className="flex flex-col items-center gap-6 mb-16">
          <div className="flex flex-wrap gap-6 justify-center text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-muted-foreground">24/7 Support Available</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-muted-foreground">Active Community</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <span className="text-muted-foreground">Fast Response Time</span>
            </div>
          </div>
          
          <Button 
            size="lg"
            variant="outline"
            className="border-primary text-primary hover:bg-primary/10"
            onClick={() => navigate("/ban-appeal")}
          >
            <Ban className="w-5 h-5 mr-2" />
            Submit Ban Appeal
          </Button>
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
                <Button className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Join Discord
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
                  <a href="mailto:support@skylifeindia.com">
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
                <Button variant="outline" className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  Create Ticket
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
                <Button variant="outline" className="w-full">
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
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-foreground">Frequently Asked Questions</h2>
          <Card className="glass-effect border-border/20">
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-left">How do I join the SLRP server?</AccordionTrigger>
                  <AccordionContent>
                    To join SLRP, you need to: 1) Apply for whitelist on our website, 2) Wait for approval (usually 24-48 hours), 3) Join our Discord for setup instructions, 4) Install FiveM and connect using our server IP: connect.skylifeindia.com:30120
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-left">What are the server requirements?</AccordionTrigger>
                  <AccordionContent>
                    You need: GTA V (legal copy), FiveM installed, a working microphone, Discord account, age 18+, and ability to roleplay in English. Basic PC specs: Intel i5/Ryzen 5, 8GB RAM, GTX 1060 or equivalent.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-left">How long does whitelist approval take?</AccordionTrigger>
                  <AccordionContent>
                    Whitelist applications are typically reviewed within 24-48 hours. During peak times, it may take up to 72 hours. You'll receive a notification on Discord once your application is reviewed. Make sure to check your Discord DMs!
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-left">What happens if I break server rules?</AccordionTrigger>
                  <AccordionContent>
                    Rule violations result in warnings, temporary bans, or permanent bans depending on severity. Minor offenses get warnings, while serious violations (RDM, VDM, metagaming) may result in immediate bans. All punishments can be appealed through our ticket system.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger className="text-left">Can I play without a microphone?</AccordionTrigger>
                  <AccordionContent>
                    No, a working microphone is mandatory for SLRP. Roleplay requires voice communication for immersion. Text-only roleplay is not permitted except for characters approved as mute, which requires special staff approval before joining.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6">
                  <AccordionTrigger className="text-left">How do I report a player?</AccordionTrigger>
                  <AccordionContent>
                    To report a player: 1) Use /report in-game for immediate issues, 2) Create a ticket in Discord with evidence (video/screenshots), 3) Include player names, timestamps, and detailed description. Never take matters into your own hands - let staff handle it.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7">
                  <AccordionTrigger className="text-left">What jobs can I do on the server?</AccordionTrigger>
                  <AccordionContent>
                    SLRP offers 30+ jobs including: Police, EMS, Mechanics, Real Estate, Taxi drivers, Lawyers, Miners, Fishermen, and various business opportunities. Criminal activities include gang operations, drug dealing, and heists. Check our Guides page for detailed job information.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-8">
                  <AccordionTrigger className="text-left">Is there a character limit?</AccordionTrigger>
                  <AccordionContent>
                    Yes, you can create up to 3 characters per account. Each character has separate inventory, money, and storyline. You cannot transfer items or money between your own characters as this violates metagaming rules.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
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
    </div>
  );
};

export default Support;
