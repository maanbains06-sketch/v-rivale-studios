import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Building2, Store, Truck } from "lucide-react";
import headerBg from "@/assets/header-features.jpg";

const Business = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader 
        title="Business"
        description="Start and grow your business empire in Skylife Roleplay"
        badge="Coming Soon"
        backgroundImage={headerBg}
      />
      
      <div className="container mx-auto px-4 py-12">
        <Card className="glass-effect border-border/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <Briefcase className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-3xl text-gradient">Business Applications</CardTitle>
            <CardDescription className="text-lg max-w-2xl mx-auto">
              Business applications and ownership opportunities are coming soon to Skylife Roleplay India.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="p-6 rounded-xl bg-primary/5 border border-primary/20 text-center">
                <Building2 className="w-12 h-12 mx-auto text-primary mb-4" />
                <h3 className="font-bold text-lg mb-2">Real Estate</h3>
                <p className="text-sm text-muted-foreground">
                  Own and manage properties across the city
                </p>
              </div>
              <div className="p-6 rounded-xl bg-secondary/5 border border-secondary/20 text-center">
                <Store className="w-12 h-12 mx-auto text-secondary mb-4" />
                <h3 className="font-bold text-lg mb-2">Retail Shops</h3>
                <p className="text-sm text-muted-foreground">
                  Run your own store and serve customers
                </p>
              </div>
              <div className="p-6 rounded-xl bg-accent/5 border border-accent/20 text-center">
                <Truck className="w-12 h-12 mx-auto text-accent mb-4" />
                <h3 className="font-bold text-lg mb-2">Logistics</h3>
                <p className="text-sm text-muted-foreground">
                  Start a trucking or delivery business
                </p>
              </div>
            </div>
            
            <div className="mt-12 text-center">
              <p className="text-muted-foreground">
                Stay tuned for updates on business ownership opportunities!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Business;
