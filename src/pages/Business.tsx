import { useState } from "react";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, UtensilsCrossed, Wrench, Car, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import headerBg from "@/assets/header-features.jpg";
import BusinessApplicationForm, { BusinessType } from "@/components/BusinessApplicationForm";

const businessTypes: {
  type: BusinessType;
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  gradient: string;
  borderColor: string;
  iconBg: string;
}[] = [
  {
    type: "real_estate",
    title: "Real Estate Agency",
    description: "Buy, sell, and manage properties across Los Santos",
    icon: <Building2 className="w-8 h-8" />,
    features: ["Property Sales & Rentals", "Property Management", "Investment Consulting", "Commercial Leasing"],
    gradient: "from-blue-500/10 via-blue-600/5 to-transparent",
    borderColor: "border-blue-500/30 hover:border-blue-500/60",
    iconBg: "bg-blue-500/20 text-blue-500",
  },
  {
    type: "food_joint",
    title: "Food Joint / Restaurant",
    description: "Serve delicious food to the citizens of Los Santos",
    icon: <UtensilsCrossed className="w-8 h-8" />,
    features: ["Fast Food & Diners", "Fine Dining", "Food Trucks", "Catering Services"],
    gradient: "from-orange-500/10 via-orange-600/5 to-transparent",
    borderColor: "border-orange-500/30 hover:border-orange-500/60",
    iconBg: "bg-orange-500/20 text-orange-500",
  },
  {
    type: "mechanic_shop",
    title: "Mechanic Shop",
    description: "Repair, maintain, and customize vehicles",
    icon: <Wrench className="w-8 h-8" />,
    features: ["Vehicle Repairs", "Maintenance Services", "Custom Paint Jobs", "Emergency Repairs"],
    gradient: "from-green-500/10 via-green-600/5 to-transparent",
    borderColor: "border-green-500/30 hover:border-green-500/60",
    iconBg: "bg-green-500/20 text-green-500",
  },
  {
    type: "tuner_shop",
    title: "Tuner Shop",
    description: "Transform vehicles into performance machines",
    icon: <Car className="w-8 h-8" />,
    features: ["Performance Tuning", "Engine Upgrades", "Racing Modifications", "Custom Builds"],
    gradient: "from-purple-500/10 via-purple-600/5 to-transparent",
    borderColor: "border-purple-500/30 hover:border-purple-500/60",
    iconBg: "bg-purple-500/20 text-purple-500",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const Business = () => {
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessType | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader 
        title="Business Opportunities"
        description="Start your entrepreneurial journey in Skylife Roleplay India"
        badge="Apply Now"
        backgroundImage={headerBg}
      />
      
      <div className="container mx-auto px-4 py-12">
        {selectedBusiness ? (
          <BusinessApplicationForm 
            businessType={selectedBusiness}
            onBack={() => setSelectedBusiness(null)}
          />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Introduction Card */}
            <motion.div variants={itemVariants}>
              <Card className="glass-effect border-border/20 overflow-hidden">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10" />
                  <CardHeader className="relative text-center pb-2">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                      <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-3xl text-gradient">Own Your Business Empire</CardTitle>
                    <CardDescription className="text-lg max-w-2xl mx-auto">
                      Apply to own and operate a business in Skylife Roleplay India. Build your empire, hire employees, and become a cornerstone of the city's economy.
                    </CardDescription>
                  </CardHeader>
                </div>
              </Card>
            </motion.div>

            {/* Business Types Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {businessTypes.map((business) => (
                <motion.div key={business.type} variants={itemVariants}>
                  <Card 
                    className={`relative group cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 border ${business.borderColor} overflow-hidden h-full`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${business.gradient} opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none`} />
                    <CardHeader className="relative">
                      <div className="flex items-start justify-between">
                        <div className={`p-3 rounded-xl ${business.iconBg}`}>
                          {business.icon}
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                      <CardTitle className="text-xl mt-4">{business.title}</CardTitle>
                      <CardDescription>{business.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="relative">
                      <div className="space-y-2">
                        {business.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                            {feature}
                          </div>
                        ))}
                      </div>
                      <Button 
                        className="w-full mt-6"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBusiness(business.type);
                        }}
                      >
                        Apply Now
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Info Section */}
            <motion.div variants={itemVariants}>
              <Card className="glass-effect border-border/20">
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-3 gap-6 text-center">
                    <div className="p-4">
                      <div className="text-3xl font-bold text-primary mb-2">48h</div>
                      <p className="text-sm text-muted-foreground">Application Review Time</p>
                    </div>
                    <div className="p-4">
                      <div className="text-3xl font-bold text-primary mb-2">100%</div>
                      <p className="text-sm text-muted-foreground">Ownership Control</p>
                    </div>
                    <div className="p-4">
                      <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                      <p className="text-sm text-muted-foreground">Support Available</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Business;
