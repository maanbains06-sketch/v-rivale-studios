import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, MessageCircle, FileText, HelpCircle } from "lucide-react";

const Support = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
            Support Center
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Need help? We're here to assist you with any questions or issues.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card className="glass-effect border-border/20">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Discord Support</CardTitle>
              <CardDescription>
                Join our Discord server for real-time support and community interaction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-primary hover:bg-primary/90">
                Join Discord
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border/20">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Email Support</CardTitle>
              <CardDescription>
                Send us an email and we'll get back to you within 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                support@skylifeindia.com
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border/20">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Submit a Ticket</CardTitle>
              <CardDescription>
                Create a support ticket for technical issues or account problems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Create Ticket
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border/20">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <HelpCircle className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>FAQ</CardTitle>
              <CardDescription>
                Browse our frequently asked questions for quick answers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                View FAQ
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Support;
