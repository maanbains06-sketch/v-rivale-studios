import { useState } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, UtensilsCrossed, Wrench, Car, ArrowRight, Sparkles, TrendingUp, Users, Clock, BadgeDollarSign, Crown, Star, FileText, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import headerBg from "@/assets/header-business.jpg";
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
  hoverGlow: string;
}[] = [
  {
    type: "real_estate",
    title: "Real Estate Agency",
    description: "Buy, sell, and manage properties across Los Santos",
    icon: <Building2 className="w-8 h-8" />,
    features: ["Property Sales & Rentals", "Property Management", "Investment Consulting", "Commercial Leasing"],
    gradient: "from-blue-500/20 via-blue-600/10 to-transparent",
    borderColor: "border-blue-500/30 hover:border-blue-400",
    iconBg: "bg-gradient-to-br from-blue-500/30 to-blue-600/20 text-blue-400",
    hoverGlow: "hover:shadow-blue-500/20",
  },
  {
    type: "food_joint",
    title: "Food Joint / Restaurant",
    description: "Serve delicious food to the citizens of Los Santos",
    icon: <UtensilsCrossed className="w-8 h-8" />,
    features: ["Fast Food & Diners", "Fine Dining", "Food Trucks", "Catering Services"],
    gradient: "from-orange-500/20 via-orange-600/10 to-transparent",
    borderColor: "border-orange-500/30 hover:border-orange-400",
    iconBg: "bg-gradient-to-br from-orange-500/30 to-orange-600/20 text-orange-400",
    hoverGlow: "hover:shadow-orange-500/20",
  },
  {
    type: "mechanic_shop",
    title: "Mechanic Shop",
    description: "Repair, maintain, and customize vehicles",
    icon: <Wrench className="w-8 h-8" />,
    features: ["Vehicle Repairs", "Maintenance Services", "Custom Paint Jobs", "Emergency Repairs"],
    gradient: "from-green-500/20 via-green-600/10 to-transparent",
    borderColor: "border-green-500/30 hover:border-green-400",
    iconBg: "bg-gradient-to-br from-green-500/30 to-green-600/20 text-green-400",
    hoverGlow: "hover:shadow-green-500/20",
  },
  {
    type: "tuner_shop",
    title: "Tuner Shop",
    description: "Transform vehicles into performance machines",
    icon: <Car className="w-8 h-8" />,
    features: ["Performance Tuning", "Engine Upgrades", "Racing Modifications", "Custom Builds"],
    gradient: "from-purple-500/20 via-purple-600/10 to-transparent",
    borderColor: "border-purple-500/30 hover:border-purple-400",
    iconBg: "bg-gradient-to-br from-purple-500/30 to-purple-600/20 text-purple-400",
    hoverGlow: "hover:shadow-purple-500/20",
  },
  {
    type: "entertainment",
    title: "Entertainment Venue",
    description: "Create unforgettable experiences with clubs, bars, and event spaces",
    icon: <PartyPopper className="w-8 h-8" />,
    features: ["Nightclubs & Bars", "Event Hosting", "Live Performances", "VIP Services"],
    gradient: "from-pink-500/20 via-pink-600/10 to-transparent",
    borderColor: "border-pink-500/30 hover:border-pink-400",
    iconBg: "bg-gradient-to-br from-pink-500/30 to-pink-600/20 text-pink-400",
    hoverGlow: "hover:shadow-pink-500/20",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
  },
};

const Business = () => {
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessType | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section with Full Background */}
      <div className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${headerBg})` }}
        />
        
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />
        
        {/* Animated Particles/Glow Effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/20 rounded-full blur-[80px] animate-pulse delay-1000" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 backdrop-blur-sm mb-6">
              <Crown className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Business Opportunities</span>
            </div>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold mb-6"
          >
            <span className="text-foreground">Build Your</span>
            <br />
            <span className="bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent">
              Business Empire
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
          >
            Start your entrepreneurial journey in Skylife Roleplay India. 
            Own properties, run restaurants, manage garages, and dominate the economy.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-6 text-sm"
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <BadgeDollarSign className="w-5 h-5 text-green-500" />
              <span>Unlimited Earning Potential</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-5 h-5 text-blue-500" />
              <span>Hire Employees</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <span>Grow Your Brand</span>
            </div>
          </motion.div>
        </div>
        
        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-primary/50 flex justify-center pt-2">
            <motion.div 
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-1.5 h-1.5 rounded-full bg-primary"
            />
          </div>
        </motion.div>
      </div>
      
      <div className="container mx-auto px-4 py-16">
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
            className="space-y-12"
          >
            {/* Stats Section */}
            <motion.div variants={itemVariants}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: <Building2 className="w-6 h-6" />, value: "5", label: "Business Types", color: "text-blue-500" },
                  { icon: <Clock className="w-6 h-6" />, value: "48h", label: "Review Time", color: "text-orange-500" },
                  { icon: <Star className="w-6 h-6" />, value: "100%", label: "Ownership", color: "text-yellow-500" },
                  { icon: <Users className="w-6 h-6" />, value: "24/7", label: "Support", color: "text-green-500" },
                ].map((stat, index) => (
                  <div 
                    key={index}
                    className="relative group p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/30 hover:border-primary/30 transition-all duration-300 text-center"
                  >
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-muted/50 ${stat.color} mb-3`}>
                      {stat.icon}
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Section Header */}
            <motion.div variants={itemVariants} className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-primary uppercase tracking-wider">Choose Your Path</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Available Business Types</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Select a business category below to start your application and become a business owner in Skylife RP.
              </p>
            </motion.div>

            {/* Business Types Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {businessTypes.map((business, index) => (
                <motion.div 
                  key={business.type} 
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card 
                    className={`relative group cursor-pointer transition-all duration-500 hover:shadow-2xl ${business.hoverGlow} border-2 ${business.borderColor} overflow-hidden h-full bg-card/80 backdrop-blur-sm`}
                  >
                    {/* Background Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${business.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                    
                    {/* Shine Effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                    </div>
                    
                    <CardHeader className="relative pb-2">
                      <div className="flex items-start justify-between">
                        <div className={`p-4 rounded-2xl ${business.iconBg} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          {business.icon}
                        </div>
                        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          <span>Apply</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                      <CardTitle className="text-2xl mt-4 group-hover:text-primary transition-colors duration-300">
                        {business.title}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {business.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="relative">
                      <div className="space-y-3 mb-6">
                        {business.features.map((feature, featureIndex) => (
                          <motion.div 
                            key={featureIndex} 
                            className="flex items-center gap-3 text-muted-foreground group-hover:text-foreground/80 transition-colors"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 + featureIndex * 0.05 }}
                          >
                            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-secondary" />
                            <span className="text-sm">{feature}</span>
                          </motion.div>
                        ))}
                      </div>
                      
                      <Button 
                        className="w-full relative overflow-hidden group/btn"
                        size="lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBusiness(business.type);
                        }}
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          Start Application
                          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-secondary opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Bottom CTA Section */}
            <motion.div variants={itemVariants}>
              <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
                <div className="absolute inset-0">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-[80px]" />
                </div>
                <CardContent className="relative py-12">
                  <div className="text-center max-w-2xl mx-auto">
                    <Crown className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                      Ready to Become a Business Owner?
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Join the elite group of entrepreneurs shaping the economy of Skylife Roleplay India. 
                      Your business empire awaits.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span>Applications Open</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span>Fast Review Process</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                        <span>Full Support Provided</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Selection Process Instructions */}
            <motion.div variants={itemVariants}>
              <Card className="relative overflow-hidden border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-background to-orange-500/5">
                <div className="absolute inset-0">
                  <div className="absolute top-0 left-1/4 w-48 h-48 bg-amber-500/10 rounded-full blur-[60px]" />
                  <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-orange-500/10 rounded-full blur-[60px]" />
                </div>
                <CardHeader className="relative text-center pb-2">
                  <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mx-auto mb-4">
                    <FileText className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium text-amber-500">Selection Process</span>
                  </div>
                  <CardTitle className="text-2xl md:text-3xl font-bold text-foreground">
                    How Business Owners Are Selected
                  </CardTitle>
                  <CardDescription className="text-base max-w-2xl mx-auto mt-2">
                    Understanding the journey from proposal submission to becoming a business owner
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative pt-6">
                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    {[
                      {
                        step: "01",
                        title: "Submit Your Proposal",
                        description: "Fill out the business application form with your vision, business plan, and unique selling points.",
                        icon: <FileText className="w-6 h-6" />,
                        color: "text-blue-500",
                        bgColor: "bg-blue-500/10",
                      },
                      {
                        step: "02",
                        title: "Proposal Review",
                        description: "Our management team reviews all proposals. Shortlisted candidates will be notified for the next stage.",
                        icon: <Clock className="w-6 h-6" />,
                        color: "text-amber-500",
                        bgColor: "bg-amber-500/10",
                      },
                      {
                        step: "03",
                        title: "Governor Meeting",
                        description: "Selected candidates meet with the Governor to present their vision. The most deserving candidate wins.",
                        icon: <Crown className="w-6 h-6" />,
                        color: "text-green-500",
                        bgColor: "bg-green-500/10",
                      },
                    ].map((item, index) => (
                      <div key={index} className="relative group">
                        <div className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/30 hover:border-amber-500/30 transition-all duration-300 h-full">
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`p-3 rounded-xl ${item.bgColor} ${item.color}`}>
                              {item.icon}
                            </div>
                            <span className="text-3xl font-bold text-muted-foreground/30">{item.step}</span>
                          </div>
                          <h4 className="text-lg font-semibold text-foreground mb-2">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        {index < 2 && (
                          <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                            <ArrowRight className="w-6 h-6 text-amber-500/50" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
                    <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      What Makes a Winning Proposal?
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {[
                        "Clear and detailed business plan with realistic goals",
                        "Long-term vision for growth and community contribution",
                        "Understanding of the server economy and market needs",
                        "Creative ideas that add value to the roleplay experience",
                        "Commitment to active management and customer service",
                        "Previous experience or strong justification for capability",
                      ].map((point, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-white">✓</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-6 text-center">
                    <p className="text-sm text-muted-foreground italic">
                      "The Governor personally meets with all shortlisted candidates. Only those with exceptional vision, 
                      dedication, and a genuine passion for building something great will be awarded business ownership."
                    </p>
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
