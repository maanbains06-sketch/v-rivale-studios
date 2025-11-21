import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Crown, Sparkles, Star, ShoppingCart } from "lucide-react";
import headerStore from "@/assets/header-store.jpg";
import { useState, useEffect } from "react";
import { BASE_PRICES, detectUserCurrency, getDisplayPrice } from "@/lib/currency";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import CartDrawer from "@/components/CartDrawer";

const packages = [
  {
    name: "Bronze",
    price: BASE_PRICES.bronze,
    icon: Star,
    gradient: "from-amber-600/20 to-orange-600/20",
    borderColor: "border-amber-600/30",
    iconColor: "text-amber-500",
    features: [
      "Server queue priority",
      "Custom Discord tag",
      "1st floor 1 EDM vehicle"
    ]
  },
  {
    name: "Silver",
    price: BASE_PRICES.silver,
    icon: Star,
    gradient: "from-slate-400/20 to-slate-600/20",
    borderColor: "border-slate-400/30",
    iconColor: "text-slate-400",
    features: [
      "Server queue priority",
      "Custom Discord role",
      "2 EDM vehicles from 1st or 2nd floor",
      "2 custom number plates for vehicles"
    ]
  },
  {
    name: "Gold",
    price: BASE_PRICES.gold,
    icon: Crown,
    gradient: "from-yellow-400/20 to-yellow-600/20",
    borderColor: "border-yellow-500/30",
    iconColor: "text-yellow-500",
    popular: true,
    features: [
      "Custom Discord role",
      "Server queue priority",
      "3 EDM vehicles from all floors",
      "3 custom number plates for vehicles"
    ]
  },
  {
    name: "Highlife",
    price: BASE_PRICES.highlife,
    icon: Crown,
    gradient: "from-purple-500/20 to-pink-600/20",
    borderColor: "border-purple-500/30",
    iconColor: "text-purple-500",
    features: [
      "Custom Discord role",
      "Server queue priority",
      "4 EDM vehicles from all floors",
      "4 custom number plates for vehicles",
      "Custom jewelry",
      "Custom phone number",
      "Any heli as per person choice",
      "Top team support"
    ]
  },
  {
    name: "Skylife",
    price: BASE_PRICES.skylife,
    icon: Sparkles,
    gradient: "from-cyan-400/20 via-blue-500/20 to-purple-600/20",
    borderColor: "border-cyan-400/30",
    iconColor: "text-cyan-400",
    premium: true,
    features: [
      "Custom Discord role",
      "Server queue priority",
      "5 EDM vehicles from all floors",
      "5 custom number plates for vehicles",
      "3 custom jewelry",
      "Custom phone number",
      "Any heli as per person choice",
      "Top notch support from staff",
      "Custom mobile ringtone",
      "Custom names on cars",
      "2 custom number plates for others"
    ]
  }
];

const Store = () => {
  const [currency, setCurrency] = useState<string>('INR');
  const { addItem } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    const detectedCurrency = detectUserCurrency();
    setCurrency(detectedCurrency);
  }, []);

  const handleAddToCart = (packageName: string, price: number, icon: string) => {
    addItem({
      id: packageName.toLowerCase(),
      name: packageName,
      price: price,
      icon: icon
    });
    toast({
      title: "Added to basket",
      description: `${packageName} package has been added to your basket.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <PageHeader 
        title="SLRP Store"
        description="Exclusive server packages and priority access"
        backgroundImage={headerStore}
      />

      <div className="fixed top-24 right-6 z-50">
        <CartDrawer />
      </div>
      
      <main className="pb-16">
        <div className="container mx-auto px-4">
          {/* Main Packages */}
          <section className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Priority Packages</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Choose the perfect package to enhance your roleplay experience
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <Card 
                  key={pkg.name}
                  className={`relative glass-effect hover:scale-105 transition-all duration-300 ${pkg.borderColor} border-2`}
                >
                  {pkg.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                      Popular
                    </Badge>
                  )}
                  {pkg.premium && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white border-0">
                      Premium
                    </Badge>
                  )}
                  
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${pkg.gradient} flex items-center justify-center mb-4`}>
                      <pkg.icon className={`w-6 h-6 ${pkg.iconColor}`} />
                    </div>
                    <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                    <CardDescription className="text-lg font-semibold text-primary">
                      {getDisplayPrice(pkg.price, currency)}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <ul className="space-y-3">
                      {pkg.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className="w-full mt-6" 
                      onClick={() => handleAddToCart(pkg.name, pkg.price, pkg.name.toLowerCase())}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Basket
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Additional Packages */}
          <section className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Additional Options</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Prio 200 */}
              <Card className="glass-effect border-2 border-primary/30 hover:scale-105 transition-all duration-300">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
                    <Star className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Prio 200</CardTitle>
                  <CardDescription className="text-lg font-semibold text-primary">
                    {getDisplayPrice(BASE_PRICES.prio200, currency)}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">Queue priority</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">Fast team response</span>
                    </li>
                  </ul>
                  
                  <Button 
                    className="w-full"
                    onClick={() => handleAddToCart('Prio 200', BASE_PRICES.prio200, 'prio200')}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Basket
                  </Button>
                </CardContent>
              </Card>

              {/* Whitelisted */}
              <Card className="glass-effect border-2 border-secondary/30 hover:scale-105 transition-all duration-300 relative">
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground border-0">
                  Exclusive
                </Badge>
                
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-secondary/20 to-pink-600/20 flex items-center justify-center mb-4">
                    <Sparkles className="w-6 h-6 text-secondary" />
                  </div>
                  <CardTitle className="text-2xl">Whitelisted</CardTitle>
                  <CardDescription className="text-lg font-semibold text-primary">
                    {getDisplayPrice(BASE_PRICES.whitelisted, currency)}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">Instant server entry</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">No need to fill any form</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">One of one vehicle</span>
                    </li>
                  </ul>
                  
                  <Button 
                    className="w-full"
                    onClick={() => handleAddToCart('Whitelisted', BASE_PRICES.whitelisted, 'whitelisted')}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Basket
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* One of One Vehicle Details */}
          <section>
            <Card className="glass-effect border-2 border-secondary/20 max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-secondary" />
                  One of One Vehicle Package
                </CardTitle>
                <CardDescription className="text-lg font-semibold text-primary mt-2">
                  {getDisplayPrice(BASE_PRICES.oneOfOne, currency)}
                </CardDescription>
                <CardDescription>
                  Select a unique vehicle of your choice with this exclusive package
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> You are responsible for the purchase of the vehicle if it's a paid vehicle.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    If you want a custom livery, additional charges may apply.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">Steps to Getting Your One of One Vehicle:</h4>
                  <ol className="space-y-3">
                    {[
                      "Open a one of one vehicle ticket under support in the Discord",
                      "Send a link to the vehicle of your choice so we can make sure it's available",
                      "Wait a minimum of 72 hours for the Car Dev to test and setup the car",
                      "Once the Dev gives you the OK, make your purchase through Tebex for the vehicle",
                      "After purchase, wait 2-10 minutes and use this command in-game to redeem coins: /redeem (tebex transaction id)",
                      "Meet up with the Dev in the Server to claim your Vehicle"
                    ].map((step, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary/20 text-secondary text-sm font-semibold shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-sm text-muted-foreground">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="bg-accent/10 rounded-lg p-4 border border-accent/20">
                  <p className="text-sm font-mono text-accent">
                    Example: /redeem tbx-8832421277453-etd002
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Store;
