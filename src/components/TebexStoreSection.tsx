import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ExternalLink, ShoppingBag, Sparkles, Star, Crown, Gem, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface TebexPackage {
  id: number;
  name: string;
  description: string;
  image: string | null;
  price: number;
  category: {
    id: number;
    name: string;
  };
}

interface TebexStoreData {
  store: {
    name: string;
    domain: string;
    currency: {
      iso_4217: string;
      symbol: string;
    };
  };
  packages: TebexPackage[];
  categories: {
    id: number;
    name: string;
    packages: TebexPackage[];
  }[];
}

const TEBEX_STORE_URL = "https://skylife-roleplay-india.tebex.io";

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const TebexStoreSection = () => {
  const [storeData, setStoreData] = useState<TebexStoreData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        setIsLoading(true);
        const { data, error: fetchError } = await supabase.functions.invoke('fetch-tebex-store');
        
        if (fetchError) {
          console.error('Error fetching store:', fetchError);
          setError('Unable to load store data');
          return;
        }

        if (data?.success) {
          setStoreData(data);
        } else {
          setError(data?.error || 'Failed to load store');
        }
      } catch (err) {
        console.error('Store fetch error:', err);
        setError('Failed to connect to store');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStoreData();
  }, []);

  const formatPrice = (price: number, currency?: { symbol: string }) => {
    const symbol = currency?.symbol || '₹';
    return `${symbol}${price.toFixed(2)}`;
  };

  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('vip') || name.includes('priority') || name.includes('prio')) return Crown;
    if (name.includes('premium') || name.includes('gold')) return Star;
    if (name.includes('diamond') || name.includes('gem')) return Gem;
    return Sparkles;
  };

  // Get featured packages (first 6 or all if less)
  const featuredPackages = storeData?.packages?.slice(0, 6) || [];

  if (isLoading) {
    return (
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading store...</span>
          </div>
        </div>
      </section>
    );
  }

  if (error || !storeData) {
    return (
      <section className="py-20 relative">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <ShoppingBag className="w-16 h-16 mx-auto text-primary mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Visit Our Store</h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Explore premium packages and exclusive items to enhance your roleplay experience.
            </p>
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90"
              onClick={() => window.open(TEBEX_STORE_URL, '_blank')}
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              Open Store
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
            <ShoppingBag className="w-3 h-3 mr-1" />
            {storeData.store.name}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Premium Store Packages
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Upgrade your experience with exclusive packages, priority access, and premium perks.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
        >
          {featuredPackages.map((pkg) => {
            const CategoryIcon = getCategoryIcon(pkg.category?.name || '');
            return (
              <motion.div key={pkg.id} variants={itemVariants}>
                <Card className="group relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 h-full">
                  {pkg.image && (
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={pkg.image}
                        alt={pkg.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                    </div>
                  )}
                  <CardContent className={`${pkg.image ? 'pt-4' : 'pt-6'} pb-6`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <Badge variant="secondary" className="mb-2 text-xs">
                          <CategoryIcon className="w-3 h-3 mr-1" />
                          {pkg.category?.name || 'Package'}
                        </Badge>
                        <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                          {pkg.name}
                        </h3>
                      </div>
                    </div>
                    
                    {pkg.description && (
                      <p 
                        className="text-sm text-muted-foreground line-clamp-2 mb-4"
                        dangerouslySetInnerHTML={{ 
                          __html: pkg.description.replace(/<[^>]*>/g, '').slice(0, 100) + '...' 
                        }}
                      />
                    )}
                    
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-2xl font-bold text-primary">
                        {formatPrice(pkg.price, storeData.store.currency)}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-primary/30 hover:bg-primary hover:text-primary-foreground"
                        onClick={() => window.open(`${TEBEX_STORE_URL}/package/${pkg.id}`, '_blank')}
                      >
                        View
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
            onClick={() => window.open(TEBEX_STORE_URL, '_blank')}
          >
            <ShoppingBag className="w-5 h-5 mr-2" />
            View All Packages
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            {storeData.packages.length} packages available • Secure checkout via Tebex
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default TebexStoreSection;
