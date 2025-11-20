import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";

const Store = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
            APEX RP Store
          </h1>
          <p className="text-muted-foreground text-lg">
            Get exclusive merchandise and support the server
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="glass-effect border-border/20 hover:border-primary/50 transition-all">
            <CardHeader>
              <CardTitle className="text-primary">Coming Soon</CardTitle>
              <CardDescription>Exclusive merchandise is on the way</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-square bg-muted/20 rounded-lg mb-4 flex items-center justify-center">
                <ShoppingCart className="w-16 h-16 text-muted-foreground" />
              </div>
              <Button className="w-full" disabled>
                Notify Me
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Store;
