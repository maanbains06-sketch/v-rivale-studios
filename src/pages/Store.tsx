import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import ReferralProgram from "@/components/ReferralProgram";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Crown, Sparkles, Star, ShoppingCart } from "lucide-react";
import headerStore from "@/assets/header-store.jpg";
import { useState, useEffect, useRef } from "react";
import { BASE_PRICES, detectUserCurrency, getDisplayPrice } from "@/lib/currency";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import CartDrawer from "@/components/CartDrawer";
import tierBronze from "@/assets/tier-bronze.jpg";
import tierSilver from "@/assets/tier-silver.jpg";
import tierGold from "@/assets/tier-gold.jpg";
import tierHighlife from "@/assets/tier-highlife.jpg";
import tierSkylife from "@/assets/tier-skylife.jpg";
import tierPrio from "@/assets/tier-prio.jpg";
import tierWhitelist from "@/assets/tier-whitelist.jpg";
import tierOneOfOne from "@/assets/tier-oneofone.jpg";
import tierJewelry from "@/assets/tier-jewelry.jpg";

const packages = [
  {
    name: "Bronze",
    price: BASE_PRICES.bronze,
    image: tierBronze,
    icon: Star,
    gradient: "from-amber-600/20 to-orange-600/20",
    borderColor: "border-amber-600/30",
    iconColor: "text-amber-500",
    glowColor: "shadow-amber-500/20",
    features: [
      "Server queue priority",
      "Custom Discord tag",
      "1st floor 1 EDM vehicle"
    ]
  },
  {
    name: "Silver",
    price: BASE_PRICES.silver,
    image: tierSilver,
    icon: Star,
    gradient: "from-slate-400/20 to-slate-600/20",
    borderColor: "border-slate-400/30",
    iconColor: "text-slate-400",
    glowColor: "shadow-slate-400/20",
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
    image: tierGold,
    icon: Crown,
    gradient: "from-yellow-400/20 to-yellow-600/20",
    borderColor: "border-yellow-500/30",
    iconColor: "text-yellow-500",
    glowColor: "shadow-yellow-500/30",
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
    image: tierHighlife,
    icon: Crown,
    gradient: "from-purple-500/20 to-pink-600/20",
    borderColor: "border-purple-500/30",
    iconColor: "text-purple-500",
    glowColor: "shadow-purple-500/30",
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
    image: tierSkylife,
    icon: Sparkles,
    gradient: "from-cyan-400/20 via-blue-500/20 to-purple-600/20",
    borderColor: "border-cyan-400/30",
    iconColor: "text-cyan-400",
    glowColor: "shadow-cyan-400/40",
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
  },
  {
    name: "Custom Jewelry (Solo)",
    price: BASE_PRICES.jewelrySolo,
    image: tierJewelry,
    icon: Sparkles,
    gradient: "from-amber-400/20 via-yellow-500/20 to-orange-600/20",
    borderColor: "border-amber-500/30",
    iconColor: "text-amber-400",
    glowColor: "shadow-amber-400/30",
    features: [
      "One custom jewelry piece",
      "Unique design for your character",
      "Premium customization"
    ]
  },
  {
    name: "Custom Jewelry (Gang)",
    price: BASE_PRICES.jewelryGang,
    image: tierJewelry,
    icon: Crown,
    gradient: "from-amber-400/20 via-yellow-500/20 to-orange-600/20",
    borderColor: "border-amber-500/30",
    iconColor: "text-amber-400",
    glowColor: "shadow-amber-400/40",
    premium: true,
    features: [
      "Custom jewelry for entire gang",
      "Matching designs for all members",
      "Premium group customization",
      "Exclusive gang identity"
    ]
  }
];

const Store = () => {
  const [currency, setCurrency] = useState<string>('INR');
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [flyingItem, setFlyingItem] = useState<{ id: string; startX: number; startY: number; endX: number; endY: number; image: string } | null>(null);
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const { addItem } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    const detectedCurrency = detectUserCurrency();
    setCurrency(detectedCurrency);
  }, []);

  const handleAddToCart = (packageName: string, price: number, icon: string, image: string) => {
    const cardElement = cardRefs.current[packageName.toLowerCase()];
    if (!cardElement) return;
    
    // Get card position
    const cardRect = cardElement.getBoundingClientRect();
    const cardCenterX = cardRect.left + cardRect.width / 2;
    const cardCenterY = cardRect.top + cardRect.height / 2;
    
    // Get cart button position (fixed top-right)
    const cartButton = document.querySelector('[data-cart-button]');
    const cartRect = cartButton?.getBoundingClientRect();
    const cartX = cartRect ? cartRect.left + cartRect.width / 2 : window.innerWidth - 100;
    const cartY = cartRect ? cartRect.top + cartRect.height / 2 : 100;
    
    setFlyingItem({ 
      id: packageName, 
      startX: cardCenterX,
      startY: cardCenterY,
      endX: cartX,
      endY: cartY,
      image 
    });
    
    setAddingToCart(packageName.toLowerCase());
    
    setTimeout(() => {
      addItem({
        id: packageName.toLowerCase(),
        name: packageName,
        price: price,
        icon: icon
      });
      
      toast({
        title: "Added to basket! 🛒",
        description: `${packageName} has been added to your basket.`,
      });

      setAddingToCart(null);
      setTimeout(() => setFlyingItem(null), 1000);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <PageHeader 
        title="SLRP Store"
        description="Exclusive server packages and priority access"
        backgroundImage={headerStore}
      />

      <div className="fixed top-24 right-6 z-50" data-cart-button>
        <CartDrawer />
      </div>
      
      {/* Flying animation element */}
      {flyingItem && (
        <>
          <div
            className="fixed pointer-events-none z-[100] w-32 h-32"
            style={{
              left: `${flyingItem.startX - 64}px`,
              top: `${flyingItem.startY - 64}px`,
              animation: 'flyToCart 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
              '--start-x': `${flyingItem.startX}px`,
              '--start-y': `${flyingItem.startY}px`,
              '--end-x': `${flyingItem.endX}px`,
              '--end-y': `${flyingItem.endY}px`,
            } as React.CSSProperties}
          >
            <div className="relative w-full h-full">
              <img 
                src={flyingItem.image} 
                alt="Flying item" 
                className="w-full h-full object-cover rounded-xl shadow-2xl border-4 border-primary/50"
                style={{
                  animation: 'spinAndShrink 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                }}
              />
              <div 
                className="absolute inset-0 rounded-xl"
                style={{
                  background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
                  animation: 'glowPulse 0.9s ease-out forwards',
                }}
              />
            </div>
          </div>
          
          {/* Particle effects */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="fixed pointer-events-none z-[99] w-2 h-2 bg-primary rounded-full"
              style={{
                left: `${flyingItem.startX}px`,
                top: `${flyingItem.startY}px`,
                animation: `particle${i} 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
              }}
            />
          ))}
        </>
      )}
      
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
                  ref={(el) => (cardRefs.current[pkg.name.toLowerCase()] = el)}
                  className={`relative glass-effect hover:scale-105 transition-all duration-300 ${pkg.borderColor} border-2 overflow-hidden group ${pkg.glowColor} hover:shadow-2xl`}
                >
                  {pkg.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground z-10 animate-pulse">
                      Popular
                    </Badge>
                  )}
                  {pkg.premium && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white border-0 z-10 animate-pulse">
                      Premium
                    </Badge>
                  )}
                  
                  {/* Image Header */}
                  <div className="relative h-40 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
                    <img 
                      src={pkg.image} 
                      alt={pkg.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className={`absolute top-4 right-4 w-12 h-12 rounded-lg bg-gradient-to-br ${pkg.gradient} flex items-center justify-center z-20 backdrop-blur-sm`}>
                      <pkg.icon className={`w-6 h-6 ${pkg.iconColor}`} />
                    </div>
                  </div>
                  
                  <CardHeader>
                    <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                    <CardDescription className="text-lg font-semibold text-primary">
                      {getDisplayPrice(pkg.price, currency)}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <ul className="space-y-3">
                      {pkg.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                          <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className={`w-full mt-6 relative overflow-hidden group ${
                        addingToCart === pkg.name.toLowerCase() ? 'animate-pulse' : ''
                      }`}
                      onClick={() => handleAddToCart(pkg.name, pkg.price, pkg.name.toLowerCase(), pkg.image)}
                      disabled={addingToCart === pkg.name.toLowerCase()}
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary-foreground/20 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                      <ShoppingCart className={`w-4 h-4 mr-2 ${
                        addingToCart === pkg.name.toLowerCase() ? 'animate-bounce' : ''
                      }`} />
                      {addingToCart === pkg.name.toLowerCase() ? 'Adding...' : 'Add to Basket'}
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
              <Card 
                ref={(el) => (cardRefs.current['prio200'] = el)}
                className="glass-effect border-2 border-primary/30 hover:scale-105 transition-all duration-300 shadow-primary/20 hover:shadow-2xl overflow-hidden group"
              >
                <div className="relative h-40 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
                  <img 
                    src={tierPrio} 
                    alt="Prio 200"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center z-20 backdrop-blur-sm">
                    <Star className="w-6 h-6 text-primary" />
                  </div>
                </div>
                
                <CardHeader>
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
                    className={`w-full relative overflow-hidden group ${
                      addingToCart === 'prio200' ? 'animate-pulse' : ''
                    }`}
                    onClick={() => handleAddToCart('Prio 200', BASE_PRICES.prio200, 'prio200', tierPrio)}
                    disabled={addingToCart === 'prio200'}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary-foreground/20 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    <ShoppingCart className={`w-4 h-4 mr-2 ${
                      addingToCart === 'prio200' ? 'animate-bounce' : ''
                    }`} />
                    {addingToCart === 'prio200' ? 'Adding...' : 'Add to Basket'}
                  </Button>
                </CardContent>
              </Card>

              {/* Whitelisted */}
              <Card 
                ref={(el) => (cardRefs.current['whitelisted'] = el)}
                className="glass-effect border-2 border-secondary/30 hover:scale-105 transition-all duration-300 relative shadow-secondary/20 hover:shadow-2xl overflow-hidden group"
              >
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground border-0 z-10 animate-pulse">
                  Exclusive
                </Badge>
                
                <div className="relative h-40 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
                  <img 
                    src={tierWhitelist} 
                    alt="Whitelisted"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 w-12 h-12 rounded-lg bg-gradient-to-br from-secondary/20 to-pink-600/20 flex items-center justify-center z-20 backdrop-blur-sm">
                    <Sparkles className="w-6 h-6 text-secondary" />
                  </div>
                </div>
                
                <CardHeader>
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
                    className={`w-full relative overflow-hidden group ${
                      addingToCart === 'whitelisted' ? 'animate-pulse' : ''
                    }`}
                    onClick={() => handleAddToCart('Whitelisted', BASE_PRICES.whitelisted, 'whitelisted', tierWhitelist)}
                    disabled={addingToCart === 'whitelisted'}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary-foreground/20 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    <ShoppingCart className={`w-4 h-4 mr-2 ${
                      addingToCart === 'whitelisted' ? 'animate-bounce' : ''
                    }`} />
                    {addingToCart === 'whitelisted' ? 'Adding...' : 'Add to Basket'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* One of One Vehicle Details */}
          <section>
            <Card className="glass-effect border-2 border-secondary/20 max-w-4xl mx-auto overflow-hidden group hover:shadow-2xl transition-all duration-300">
              <div className="relative h-48 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent z-10" />
                <img 
                  src={tierOneOfOne} 
                  alt="One of One Vehicle"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              
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

                <Button 
                  className={`w-full mt-6 relative overflow-hidden group ${
                    addingToCart === 'oneofone' ? 'animate-pulse' : ''
                  }`}
                  size="lg"
                  onClick={() => handleAddToCart('One of One Vehicle', BASE_PRICES.oneOfOne, 'oneofone', tierOneOfOne)}
                  disabled={addingToCart === 'oneofone'}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-secondary/0 via-secondary-foreground/20 to-secondary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <ShoppingCart className={`w-4 h-4 mr-2 ${
                    addingToCart === 'oneofone' ? 'animate-bounce' : ''
                  }`} />
                  {addingToCart === 'oneofone' ? 'Adding...' : 'Add to Basket'}
                </Button>
              </CardContent>
            </Card>
          </section>
          
          <ReferralProgram />
        </div>
      </main>
      
      <style>{`
        @keyframes flyToCart {
          0% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 1;
          }
          20% {
            transform: translate(0, -30px) scale(1.1) rotate(5deg);
            opacity: 1;
          }
          100% {
            transform: translate(
              calc(var(--end-x) - var(--start-x) + 64px),
              calc(var(--end-y) - var(--start-y) + 64px)
            ) scale(0.15) rotate(720deg);
            opacity: 0;
          }
        }
        
        @keyframes spinAndShrink {
          0% {
            transform: scale(1) rotate(0deg);
            filter: brightness(1) drop-shadow(0 0 10px rgba(139, 92, 246, 0.5));
          }
          30% {
            transform: scale(1.15) rotate(180deg);
            filter: brightness(1.3) drop-shadow(0 0 20px rgba(139, 92, 246, 0.8));
          }
          100% {
            transform: scale(0.2) rotate(720deg);
            filter: brightness(2) drop-shadow(0 0 30px rgba(139, 92, 246, 1));
          }
        }
        
        @keyframes glowPulse {
          0%, 100% {
            opacity: 0.8;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
        
        @keyframes particle0 {
          to { transform: translate(80px, 0) scale(0); opacity: 0; }
        }
        @keyframes particle1 {
          to { transform: translate(56px, 56px) scale(0); opacity: 0; }
        }
        @keyframes particle2 {
          to { transform: translate(0, 80px) scale(0); opacity: 0; }
        }
        @keyframes particle3 {
          to { transform: translate(-56px, 56px) scale(0); opacity: 0; }
        }
        @keyframes particle4 {
          to { transform: translate(-80px, 0) scale(0); opacity: 0; }
        }
        @keyframes particle5 {
          to { transform: translate(-56px, -56px) scale(0); opacity: 0; }
        }
        @keyframes particle6 {
          to { transform: translate(0, -80px) scale(0); opacity: 0; }
        }
        @keyframes particle7 {
          to { transform: translate(56px, -56px) scale(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Store;
