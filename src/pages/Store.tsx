import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import ReferralProgram from "@/components/ReferralProgram";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Crown, Sparkles, Star, ShoppingCart, ArrowUpDown, Heart, Gift, Home, HeadphonesIcon, CreditCard } from "lucide-react";
import headerStore from "@/assets/header-store.jpg";
import { useState, useEffect, useRef, useMemo } from "react";
import { BASE_PRICES, detectUserCurrency, getDisplayPrice } from "@/lib/currency";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { usePackageFavorites } from "@/hooks/usePackageFavorites";
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

interface Package {
  name: string;
  price: number;
  image: string;
  icon: any;
  gradient: string;
  borderColor: string;
  iconColor: string;
  glowColor: string;
  features: string[];
  popular?: boolean;
  premium?: boolean;
}

const Store = () => {
  const [currency, setCurrency] = useState<string>('INR');
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [flyingItem, setFlyingItem] = useState<{ id: string; startX: number; startY: number; endX: number; endY: number; image: string } | null>(null);
  const [giftCardNumber, setGiftCardNumber] = useState("");
  const [sortBy, setSortBy] = useState<string>("default");
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [selectedSpecialPackage, setSelectedSpecialPackage] = useState<{name: string; price: number; image: string; features: string[]} | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const { addItem } = useCart();
  const { toast } = useToast();
  const { toggleFavorite, isFavorite } = usePackageFavorites();

  // Define bundles with discounted pricing
  const bundles = [
    {
      id: 'starter-bundle',
      name: 'Starter Bundle',
      packages: ['Bronze', 'Prio 200'],
      originalPrice: BASE_PRICES.bronze + BASE_PRICES.prio200,
      price: (BASE_PRICES.bronze + BASE_PRICES.prio200) * 0.85, // 15% off
      discount: 15,
      description: 'Perfect for getting started with priority access',
    },
    {
      id: 'premium-bundle',
      name: 'Premium Bundle',
      packages: ['Gold', 'Whitelisted'],
      originalPrice: BASE_PRICES.gold + BASE_PRICES.whitelisted,
      price: (BASE_PRICES.gold + BASE_PRICES.whitelisted) * 0.80, // 20% off
      discount: 20,
      description: 'Most popular combination for serious players',
    },
    {
      id: 'ultimate-bundle',
      name: 'Ultimate Bundle',
      packages: ['Skylife', 'Custom Jewelry (Solo)'],
      originalPrice: BASE_PRICES.skylife + BASE_PRICES.jewelrySolo,
      price: (BASE_PRICES.skylife + BASE_PRICES.jewelrySolo) * 0.75, // 25% off
      discount: 25,
      description: 'Complete VIP experience with custom accessories',
    },
  ];

  // Sort and filter packages
  const sortedPackages = useMemo(() => {
    let pkgCopy = [...packages];
    
    // Filter by favorites if enabled
    if (showFavoritesOnly) {
      pkgCopy = pkgCopy.filter(pkg => isFavorite(pkg.name.toLowerCase()));
    }
    
    // Sort packages
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
  }, [sortBy, showFavoritesOnly, isFavorite]);

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
              <div className="mb-6 flex items-center justify-between gap-4 bg-card/40 backdrop-blur-sm border border-border/50 rounded-lg p-4 flex-wrap">
                <div className="flex items-center gap-4">
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
                
                <Button
                  variant={showFavoritesOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className="gap-2"
                >
                  <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                  {showFavoritesOnly ? 'Show All' : 'Favorites Only'}
                </Button>
              </div>

              {/* Package Bundles */}
              <section className="mb-12">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold mb-2">🎁 Package Bundles</h2>
                  <p className="text-muted-foreground">Save more when you buy packages together</p>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  {bundles.map((bundle) => (
                    <Card key={bundle.id} className="relative bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm border-2 border-primary/30 hover:border-primary/60 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 overflow-hidden group">
                      <Badge className="absolute top-3 right-3 z-10 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-3 py-1 font-bold">
                        {bundle.discount}% OFF
                      </Badge>
                      
                      <CardContent className="p-6 space-y-4">
                        <div>
                          <h3 className="text-2xl font-bold text-foreground mb-2">{bundle.name}</h3>
                          <p className="text-sm text-muted-foreground">{bundle.description}</p>
                        </div>

                        <div className="space-y-2">
                          <div className="text-xs text-muted-foreground font-semibold">Includes:</div>
                          {bundle.packages.map((pkgName, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <Check className="w-4 h-4 text-green-500" />
                              <span>{pkgName}</span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-3 border-t border-border/30 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground line-through">Original Price:</span>
                            <span className="text-muted-foreground line-through">
                              {getDisplayPrice(bundle.originalPrice, currency)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-semibold">Bundle Price:</span>
                            <span className="text-2xl font-bold text-green-500">
                              {getDisplayPrice(bundle.price, currency)}
                            </span>
                          </div>
                        </div>

                        <Button
                          onClick={() => {
                            bundle.packages.forEach(pkgName => {
                              const pkg = packages.find(p => p.name === pkgName);
                              if (pkg) {
                                handleAddToCart(pkg.name, pkg.price, pkg.name.toLowerCase(), pkg.image, pkg.name.toLowerCase());
                              }
                            });
                            toast({
                              title: 'Bundle added to basket! 🎉',
                              description: `${bundle.name} packages added with ${bundle.discount}% discount applied.`,
                            });
                          }}
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-6 transition-all duration-200"
                        >
                          <Gift className="w-5 h-5 mr-2" />
                          Add Bundle to Basket
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>

              {/* Main Packages */}
              <section className="mb-12">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold mb-2">Individual Packages</h2>
                  <p className="text-muted-foreground">Choose packages that fit your needs</p>
                </div>
                {showFavoritesOnly && sortedPackages.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No favorites yet</h3>
                    <p className="text-muted-foreground">Click the heart icon on packages to save them as favorites</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedPackages.map((pkg) => (
                      <Card 
                        key={pkg.name}
                        ref={(el) => (cardRefs.current[pkg.name.toLowerCase()] = el)}
                        className="relative bg-card/70 backdrop-blur-sm border-2 border-border/50 hover:border-primary/70 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 overflow-hidden group"
                      >
                        {pkg.popular && (
                          <Badge className="absolute top-2 right-12 z-10 bg-primary/90 text-primary-foreground text-[10px] px-2 py-0.5">
                            <Star className="w-2.5 h-2.5 mr-1" />
                            Popular
                          </Badge>
                        )}
                        {pkg.premium && (
                          <Badge className="absolute top-2 right-12 z-10 bg-purple-500/90 text-white text-[10px] px-2 py-0.5">
                            <Star className="w-2.5 h-2.5 mr-1" />
                            Premium
                          </Badge>
                        )}
                        
                        {/* Favorite Button */}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full bg-background/80 hover:bg-background"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(pkg.name.toLowerCase());
                          }}
                        >
                          <Heart 
                            className={`h-4 w-4 transition-all ${
                              isFavorite(pkg.name.toLowerCase()) 
                                ? 'fill-red-500 text-red-500' 
                                : 'text-muted-foreground hover:text-red-500'
                            }`} 
                          />
                        </Button>
                        
                        {/* Image Container - Smaller */}
                        <div 
                          className="relative w-full aspect-[4/3] bg-gradient-to-br from-background/95 to-background/80 flex items-center justify-center p-4 border-b-2 border-border/40 cursor-pointer"
                          onClick={() => setSelectedPackage(pkg)}
                        >
                          <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          <img
                            src={pkg.image}
                            alt={pkg.name}
                            className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] group-hover:scale-110 group-hover:drop-shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all duration-500 relative z-10"
                          />
                        </div>
                        
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div 
                              className="flex items-center justify-between cursor-pointer"
                              onClick={() => setSelectedPackage(pkg)}
                            >
                              <h3 className="text-lg font-bold text-foreground">{pkg.name}</h3>
                              <div className="text-xl font-bold text-primary">
                                {getDisplayPrice(pkg.price, currency)}
                              </div>
                            </div>

                            <p 
                              className="text-xs text-muted-foreground text-center cursor-pointer"
                              onClick={() => setSelectedPackage(pkg)}
                            >
                              Click to view all features
                            </p>

                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(pkg.name, pkg.price, pkg.name.toLowerCase(), pkg.image, pkg.name.toLowerCase());
                              }}
                              disabled={addingToCart === pkg.name.toLowerCase()}
                              className="w-full bg-cyan-500 hover:bg-cyan-600 active:scale-95 text-white font-semibold py-6 transition-all duration-200"
                            >
                              <ShoppingCart className={`w-5 h-5 mr-2 ${
                                addingToCart === pkg.name.toLowerCase() ? 'animate-spin' : ''
                              }`} />
                              {addingToCart === pkg.name.toLowerCase() ? 'Adding...' : 'Add to Basket'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </section>

              {/* Additional Packages - Priority Tickets */}
              <section className="mb-12">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Prio 200 */}
                  <Card 
                    ref={(el) => (cardRefs.current['prio200'] = el)}
                    className="relative bg-card/70 backdrop-blur-sm border-2 border-border/50 hover:border-primary/70 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 overflow-hidden group cursor-pointer"
                    onClick={() => setSelectedSpecialPackage({ 
                      name: 'Prio 200', 
                      price: BASE_PRICES.prio200, 
                      image: tierPrio, 
                      features: ['Queue priority access to server', 'Skip long wait times', 'Fast team response and support', 'Join server during peak hours'] 
                    })}
                  >
                    <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-background/95 to-background/80 flex items-center justify-center p-4 border-b-2 border-border/40">
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <img
                        src={tierPrio}
                        alt="Prio 200"
                        className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] group-hover:scale-110 group-hover:drop-shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all duration-500 relative z-10"
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

                        <p className="text-xs text-muted-foreground text-center">Click to view all features</p>

                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart('Prio 200', BASE_PRICES.prio200, 'prio200', tierPrio, 'prio200');
                          }}
                          disabled={addingToCart === 'prio200'}
                          className="w-full bg-cyan-500 hover:bg-cyan-600 active:scale-95 text-white font-semibold py-6 transition-all duration-200"
                        >
                          <ShoppingCart className={`w-5 h-5 mr-2 ${
                            addingToCart === 'prio200' ? 'animate-spin' : ''
                          }`} />
                          {addingToCart === 'prio200' ? 'Adding...' : 'Add to Basket'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Whitelisted */}
                  <Card 
                    ref={(el) => (cardRefs.current['whitelisted'] = el)}
                    className="relative bg-card/70 backdrop-blur-sm border-2 border-border/50 hover:border-primary/70 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 overflow-hidden group cursor-pointer"
                    onClick={() => setSelectedSpecialPackage({ 
                      name: 'Whitelisted', 
                      price: BASE_PRICES.whitelisted, 
                      image: tierWhitelist, 
                      features: ['Instant server entry without waiting', 'Bypass whitelist application process', 'No need to fill any form', 'Exclusive immediate access', 'Priority customer support'] 
                    })}
                  >
                    <Badge className="absolute top-2 right-2 z-10 bg-secondary/90 text-secondary-foreground text-[10px] px-2 py-0.5">
                      Exclusive
                    </Badge>

                    <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-background/95 to-background/80 flex items-center justify-center p-4 border-b-2 border-border/40">
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <img
                        src={tierWhitelist}
                        alt="Whitelisted"
                        className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] group-hover:scale-110 group-hover:drop-shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all duration-500 relative z-10"
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

                        <p className="text-xs text-muted-foreground text-center">Click to view all features</p>

                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart('Whitelisted', BASE_PRICES.whitelisted, 'whitelisted', tierWhitelist, 'whitelisted');
                          }}
                          disabled={addingToCart === 'whitelisted'}
                          className="w-full bg-cyan-500 hover:bg-cyan-600 active:scale-95 text-white font-semibold py-6 transition-all duration-200"
                        >
                          <ShoppingCart className={`w-5 h-5 mr-2 ${
                            addingToCart === 'whitelisted' ? 'animate-spin' : ''
                          }`} />
                          {addingToCart === 'whitelisted' ? 'Adding...' : 'Add to Basket'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* One of One */}
              <section className="mb-12">
                <div className="max-w-4xl mx-auto">
                  <Card 
                    ref={(el) => (cardRefs.current['oneofone'] = el)}
                    className="relative bg-card/70 backdrop-blur-sm border-2 border-border/50 hover:border-primary/70 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 overflow-hidden group cursor-pointer"
                    onClick={() => setSelectedSpecialPackage({ 
                      name: 'One of One', 
                      price: BASE_PRICES.oneOfOne, 
                      image: tierOneOfOne, 
                      features: [
                        'Everything from Skylife package included',
                        'Fully custom exclusive vehicle - only 1 exists in the entire server',
                        'Complete freedom to design your dream vehicle from scratch',
                        'Custom vehicle model selection from extensive catalog',
                        'Personalized paint jobs with unlimited color combinations',
                        'Custom vinyl wraps and decals designed to your specifications',
                        'Unique license plate text (within guidelines)',
                        'Custom interior modifications and color schemes',
                        'Performance tuning to your preferred handling style',
                        'Exclusive sound customization (engine, horn, exhaust)',
                        'Custom lighting packages (underglow, interior ambient, headlights)',
                        'Permanent ownership - vehicle is bound to your character',
                        'Showcase your vehicle in special dealership display',
                        'Priority support for any vehicle-related issues',
                        'Free maintenance and repairs for lifetime',
                        'Ability to update customization once per month',
                        'Exclusive "One of One" badge on vehicle',
                        'VIP parking spot in city center',
                        'Featured in server social media and promotional content',
                        'Custom names on all your cars',
                        'All clothing items unlocked',
                      ] 
                    })}
                  >
                    <Badge className="absolute top-2 right-2 z-10 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] px-2 py-0.5">
                      <Crown className="w-2.5 h-2.5 mr-1" />
                      Ultimate
                    </Badge>

                    <div className="relative w-full aspect-[21/9] bg-gradient-to-br from-background/95 to-background/80 flex items-center justify-center p-8 border-b-2 border-border/40">
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <img
                        src={tierOneOfOne}
                        alt="One of One"
                        className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] group-hover:scale-105 group-hover:drop-shadow-[0_0_40px_rgba(255,255,255,0.5)] transition-all duration-500 relative z-10"
                      />
                    </div>
                    
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-2xl font-bold text-foreground">One of One</h3>
                          <div className="text-3xl font-bold text-primary">
                            {getDisplayPrice(BASE_PRICES.oneOfOne, currency)}
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground text-center">Click to view all features</p>

                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart('One of One', BASE_PRICES.oneOfOne, 'oneofone', tierOneOfOne, 'oneofone');
                          }}
                          disabled={addingToCart === 'oneofone'}
                          className="w-full bg-cyan-500 hover:bg-cyan-600 active:scale-95 text-white font-semibold py-7 text-lg transition-all duration-200"
                        >
                          <ShoppingCart className={`w-6 h-6 mr-2 ${
                            addingToCart === 'oneofone' ? 'animate-spin' : ''
                          }`} />
                          {addingToCart === 'oneofone' ? 'Adding...' : 'Add to Basket'}
                        </Button>
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

      {/* Package Details Dialog */}
      <Dialog open={!!selectedPackage} onOpenChange={() => setSelectedPackage(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selectedPackage && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-3xl">{selectedPackage.name}</DialogTitle>
                  <div className="text-3xl font-bold text-primary">
                    {getDisplayPrice(selectedPackage.price, currency)}
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-background/50">
                  <img
                    src={selectedPackage.image}
                    alt={selectedPackage.name}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4">Features Included:</h3>
                  <ul className="space-y-3">
                    {selectedPackage.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button 
                  onClick={(e) => {
                    handleAddToCart(selectedPackage.name, selectedPackage.price, selectedPackage.name.toLowerCase(), selectedPackage.image, selectedPackage.name.toLowerCase());
                    setSelectedPackage(null);
                  }}
                  disabled={addingToCart === selectedPackage.name.toLowerCase()}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 active:scale-95 text-white font-semibold text-lg py-7 transition-all duration-200"
                >
                  <ShoppingCart className={`w-6 h-6 mr-2 ${
                    addingToCart === selectedPackage.name.toLowerCase() ? 'animate-spin' : ''
                  }`} />
                  {addingToCart === selectedPackage.name.toLowerCase() ? 'Adding...' : 'Add to Basket'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Special Package Details Dialog */}
      <Dialog open={!!selectedSpecialPackage} onOpenChange={() => setSelectedSpecialPackage(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selectedSpecialPackage && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-3xl">{selectedSpecialPackage.name}</DialogTitle>
                  <div className="text-3xl font-bold text-primary">
                    {getDisplayPrice(selectedSpecialPackage.price, currency)}
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-background/50">
                  <img
                    src={selectedSpecialPackage.image}
                    alt={selectedSpecialPackage.name}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4">Features Included:</h3>
                  <ul className="space-y-3">
                    {selectedSpecialPackage.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button 
                  onClick={(e) => {
                    const refKey = selectedSpecialPackage.name.toLowerCase().replace(/\s+/g, '');
                    handleAddToCart(selectedSpecialPackage.name, selectedSpecialPackage.price, refKey, selectedSpecialPackage.image, refKey);
                    setSelectedSpecialPackage(null);
                  }}
                  disabled={addingToCart === selectedSpecialPackage.name.toLowerCase().replace(/\s+/g, '')}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 active:scale-95 text-white font-semibold text-lg py-7 transition-all duration-200"
                >
                  <ShoppingCart className={`w-6 h-6 mr-2 ${
                    addingToCart === selectedSpecialPackage.name.toLowerCase().replace(/\s+/g, '') ? 'animate-spin' : ''
                  }`} />
                  {addingToCart === selectedSpecialPackage.name.toLowerCase().replace(/\s+/g, '') ? 'Adding...' : 'Add to Basket'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      
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
