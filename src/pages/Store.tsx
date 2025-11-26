import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import ReferralProgram from "@/components/ReferralProgram";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Crown, Sparkles, Star, ShoppingCart, ArrowUpDown } from "lucide-react";
import headerStore from "@/assets/header-store.jpg";
import { useState, useEffect, useRef, useMemo } from "react";
import { BASE_PRICES, detectUserCurrency, getDisplayPrice } from "@/lib/currency";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import CartDrawer from "@/components/CartDrawer";
import { Link } from "react-router-dom";
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
  const [giftCardNumber, setGiftCardNumber] = useState("");
  const [sortBy, setSortBy] = useState<string>("default");
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const { addItem } = useCart();
  const { toast } = useToast();

  // Sort packages based on selected option
  const sortedPackages = useMemo(() => {
    const pkgCopy = [...packages];
    switch (sortBy) {
      case "price-low":
        return pkgCopy.sort((a, b) => a.price - b.price);
      case "price-high":
        return pkgCopy.sort((a, b) => b.price - a.price);
      case "features":
        return pkgCopy.sort((a, b) => b.features.length - a.features.length);
      default:
        return pkgCopy;
    }
  }, [sortBy]);

  useEffect(() => {
    const detectedCurrency = detectUserCurrency();
    setCurrency(detectedCurrency);
  }, []);

  const handleCheckGiftCard = () => {
    if (giftCardNumber.trim()) {
      toast({
        title: "Gift card check",
        description: "Gift card validation coming soon!",
      });
    } else {
      toast({
        title: "Error",
        description: "Please enter a gift card number",
        variant: "destructive",
      });
    }
  };

  const handleAddToCart = (packageName: string, price: number, icon: string, image: string, refKey: string) => {
    const cardElement = cardRefs.current[refKey];
    if (!cardElement) {
      console.error(`Card ref not found for key: ${refKey}`);
      return;
    }
    
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
    
    setAddingToCart(refKey);
    
    setTimeout(() => {
      addItem({
        id: packageName.toLowerCase().replace(/\s+/g, ''),
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
          <div className="flex gap-6">
            {/* Left Sidebar */}
            <div className="w-64 flex-shrink-0 space-y-6">
              {/* Navigation */}
              <Card className="bg-card/60 backdrop-blur-sm border-border/50">
                <CardContent className="p-6 space-y-4">
                  <Link to="/" className="block text-foreground hover:text-primary transition-colors">
                    Home
                  </Link>
                  <div className="text-primary font-semibold">
                    Passes
                  </div>
                  <Link to="/about" className="block text-foreground hover:text-primary transition-colors">
                    About
                  </Link>
                </CardContent>
              </Card>

              {/* Top Customer */}
              <div>
                <h2 className="text-2xl font-bold mb-4">Top Customer</h2>
                <Card className="bg-card/60 backdrop-blur-sm border-border/50">
                  <CardContent className="p-6">
                    <p className="text-muted-foreground">No recent top purchaser to display.</p>
                  </CardContent>
                </Card>
              </div>

              {/* Giftcard Balance */}
              <div>
                <h2 className="text-2xl font-bold mb-4">Giftcard Balance</h2>
                <Card className="bg-card/60 backdrop-blur-sm border-border/50">
                  <CardContent className="p-6 space-y-4">
                    <Input
                      placeholder="Enter gift card number"
                      value={giftCardNumber}
                      onChange={(e) => setGiftCardNumber(e.target.value)}
                      className="bg-background/50 border-border"
                    />
                    <Button 
                      onClick={handleCheckGiftCard}
                      className="w-full bg-muted hover:bg-muted/80 text-foreground"
                    >
                      Check
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Support */}
              <div>
                <h2 className="text-2xl font-bold mb-4">Support</h2>
                <Card className="bg-card/60 backdrop-blur-sm border-border/50">
                  <CardContent className="p-6">
                    <p className="text-foreground">
                      Join Discord and DM Hydra RP Support Bot in case you need support about payments
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Main Content - Store Packages */}
            <div className="flex-1">
              {/* Filter Bar */}
              <div className="mb-6 flex items-center justify-between bg-card/40 backdrop-blur-sm border border-border/50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Sort by:</span>
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[200px] bg-background/50 border-border">
                    <SelectValue placeholder="Default order" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border z-50">
                    <SelectItem value="default">Default order</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="features">Most Features</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Main Packages */}
              <section className="mb-12">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedPackages.map((pkg) => (
                    <Card 
                      key={pkg.name}
                      ref={(el) => (cardRefs.current[pkg.name.toLowerCase()] = el)}
                      className="relative bg-card/70 backdrop-blur-sm border-2 border-border/50 hover:border-primary/70 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 overflow-hidden group"
                    >
                      {pkg.popular && (
                        <Badge className="absolute top-2 right-2 z-10 bg-primary/90 text-primary-foreground text-[10px] px-2 py-0.5">
                          <Star className="w-2.5 h-2.5 mr-1" />
                          Popular
                        </Badge>
                      )}
                      {pkg.premium && (
                        <Badge className="absolute top-2 right-2 z-10 bg-purple-500/90 text-white text-[10px] px-2 py-0.5">
                          <Star className="w-2.5 h-2.5 mr-1" />
                          Premium
                        </Badge>
                      )}
                      
                      {/* Image Container with Dark Background */}
                      <div className="relative w-full aspect-square bg-gradient-to-br from-background/95 to-background/80 flex items-center justify-center p-6 border-b-2 border-border/40">
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <img
                          src={pkg.image}
                          alt={pkg.name}
                          className="w-full h-full object-contain drop-shadow-[0_0_25px_rgba(255,255,255,0.25)] group-hover:scale-110 group-hover:drop-shadow-[0_0_35px_rgba(255,255,255,0.4)] transition-all duration-500 relative z-10"
                        />
                      </div>
                      
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-foreground">{pkg.name}</h3>
                            <div className="text-xl font-bold text-primary">
                              {getDisplayPrice(pkg.price, currency)}
                            </div>
                          </div>

                          <Button
                            onClick={() => handleAddToCart(pkg.name, pkg.price, pkg.name.toLowerCase(), pkg.image, pkg.name.toLowerCase())}
                            disabled={addingToCart === pkg.name.toLowerCase()}
                            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-5"
                          >
                            <ShoppingCart className={`w-4 h-4 mr-2 ${
                              addingToCart === pkg.name.toLowerCase() ? 'animate-bounce' : ''
                            }`} />
                            {addingToCart === pkg.name.toLowerCase() ? 'Adding...' : 'Add to Basket'}
                          </Button>

                          {pkg.features.length > 0 && (
                            <div className="pt-2 border-t border-border/30">
                              <ul className="space-y-1.5">
                                {pkg.features.slice(0, 3).map((feature, index) => (
                                  <li key={index} className="flex items-start gap-2 text-xs text-muted-foreground">
                                    <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                                    <span className="leading-tight">{feature}</span>
                                  </li>
                                ))}
                                {pkg.features.length > 3 && (
                                  <li className="text-xs text-muted-foreground/60 italic pl-5">
                                    +{pkg.features.length - 3} more features
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              {/* Additional Packages */}
              <section className="mb-12">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Prio 200 */}
                  <Card 
                    ref={(el) => (cardRefs.current['prio200'] = el)}
                    className="relative bg-card/70 backdrop-blur-sm border-2 border-border/50 hover:border-primary/70 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 overflow-hidden group"
                  >
                    <div className="relative w-full aspect-square bg-gradient-to-br from-background/95 to-background/80 flex items-center justify-center p-6 border-b-2 border-border/40">
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <img
                        src={tierPrio}
                        alt="Prio 200"
                        className="w-full h-full object-contain drop-shadow-[0_0_25px_rgba(255,255,255,0.25)] group-hover:scale-110 group-hover:drop-shadow-[0_0_35px_rgba(255,255,255,0.4)] transition-all duration-500 relative z-10"
                      />
                    </div>
                    
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-foreground">Prio 200</h3>
                          <div className="text-xl font-bold text-primary">
                            {getDisplayPrice(BASE_PRICES.prio200, currency)}
                          </div>
                        </div>

                        <Button
                          onClick={() => handleAddToCart('Prio 200', BASE_PRICES.prio200, 'prio200', tierPrio, 'prio200')}
                          disabled={addingToCart === 'prio200'}
                          className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-5"
                        >
                          <ShoppingCart className={`w-4 h-4 mr-2 ${
                            addingToCart === 'prio200' ? 'animate-bounce' : ''
                          }`} />
                          {addingToCart === 'prio200' ? 'Adding...' : 'Add to Basket'}
                        </Button>

                        <div className="pt-2 border-t border-border/30">
                          <ul className="space-y-1.5">
                            <li className="flex items-start gap-2 text-xs text-muted-foreground">
                              <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                              <span className="leading-tight">Queue priority</span>
                            </li>
                            <li className="flex items-start gap-2 text-xs text-muted-foreground">
                              <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                              <span className="leading-tight">Fast team response</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Whitelisted */}
                  <Card 
                    ref={(el) => (cardRefs.current['whitelisted'] = el)}
                    className="relative bg-card/70 backdrop-blur-sm border-2 border-border/50 hover:border-primary/70 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 overflow-hidden group"
                  >
                    <Badge className="absolute top-2 right-2 z-10 bg-secondary/90 text-secondary-foreground text-[10px] px-2 py-0.5">
                      Exclusive
                    </Badge>

                    <div className="relative w-full aspect-square bg-gradient-to-br from-background/95 to-background/80 flex items-center justify-center p-6 border-b-2 border-border/40">
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <img
                        src={tierWhitelist}
                        alt="Whitelisted"
                        className="w-full h-full object-contain drop-shadow-[0_0_25px_rgba(255,255,255,0.25)] group-hover:scale-110 group-hover:drop-shadow-[0_0_35px_rgba(255,255,255,0.4)] transition-all duration-500 relative z-10"
                      />
                    </div>
                    
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-foreground">Whitelisted</h3>
                          <div className="text-xl font-bold text-primary">
                            {getDisplayPrice(BASE_PRICES.whitelisted, currency)}
                          </div>
                        </div>

                        <Button
                          onClick={() => handleAddToCart('Whitelisted', BASE_PRICES.whitelisted, 'whitelisted', tierWhitelist, 'whitelisted')}
                          disabled={addingToCart === 'whitelisted'}
                          className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-5"
                        >
                          <ShoppingCart className={`w-4 h-4 mr-2 ${
                            addingToCart === 'whitelisted' ? 'animate-bounce' : ''
                          }`} />
                          {addingToCart === 'whitelisted' ? 'Adding...' : 'Add to Basket'}
                        </Button>

                        <div className="pt-2 border-t border-border/30">
                          <ul className="space-y-1.5">
                            <li className="flex items-start gap-2 text-xs text-muted-foreground">
                              <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                              <span className="leading-tight">Instant server entry</span>
                            </li>
                            <li className="flex items-start gap-2 text-xs text-muted-foreground">
                              <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                              <span className="leading-tight">No need to fill any form</span>
                            </li>
                            <li className="flex items-start gap-2 text-xs text-muted-foreground">
                              <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                              <span className="leading-tight">Exclusive access</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* One of One */}
              <section className="mb-12">
                <div className="max-w-3xl mx-auto">
                  <Card 
                    ref={(el) => (cardRefs.current['oneofone'] = el)}
                    className="relative bg-card/70 backdrop-blur-sm border-2 border-border/50 hover:border-primary/70 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 overflow-hidden group"
                  >
                    <Badge className="absolute top-2 right-2 z-10 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] px-2 py-0.5">
                      <Crown className="w-2.5 h-2.5 mr-1" />
                      Ultimate
                    </Badge>

                    <div className="relative w-full aspect-[16/9] bg-gradient-to-br from-background/95 to-background/80 flex items-center justify-center p-8 border-b-2 border-border/40">
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <img
                        src={tierOneOfOne}
                        alt="One of One"
                        className="w-full h-full object-contain drop-shadow-[0_0_25px_rgba(255,255,255,0.25)] group-hover:scale-110 group-hover:drop-shadow-[0_0_35px_rgba(255,255,255,0.4)] transition-all duration-500 relative z-10"
                      />
                    </div>
                    
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-2xl font-bold text-foreground">One of One</h3>
                          <div className="text-2xl font-bold text-primary">
                            {getDisplayPrice(BASE_PRICES.oneOfOne, currency)}
                          </div>
                        </div>

                        <Button
                          onClick={() => handleAddToCart('One of One', BASE_PRICES.oneOfOne, 'oneofone', tierOneOfOne, 'oneofone')}
                          disabled={addingToCart === 'oneofone'}
                          className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-5"
                        >
                          <ShoppingCart className={`w-4 h-4 mr-2 ${
                            addingToCart === 'oneofone' ? 'animate-bounce' : ''
                          }`} />
                          {addingToCart === 'oneofone' ? 'Adding...' : 'Add to Basket'}
                        </Button>

                        <div className="pt-3 border-t border-border/30">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-start gap-2 text-sm text-muted-foreground">
                              <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                              <span className="leading-tight">Everything from Skylife +</span>
                            </div>
                            <div className="flex items-start gap-2 text-sm text-muted-foreground">
                              <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                              <span className="leading-tight">Custom vehicle</span>
                            </div>
                            <div className="flex items-start gap-2 text-sm text-muted-foreground">
                              <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                              <span className="leading-tight">Custom name on cars</span>
                            </div>
                            <div className="flex items-start gap-2 text-sm text-muted-foreground">
                              <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                              <span className="leading-tight">All clothing items</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* Referral Program */}
              <section>
                <ReferralProgram />
              </section>
            </div>
          </div>
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
