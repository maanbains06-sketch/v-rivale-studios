import { Briefcase, Car, Home, TrendingUp, Calendar, Shield } from "lucide-react";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import jobsImg from "@/assets/feature-jobs.jpg";
import vehiclesImg from "@/assets/feature-vehicles.jpg";
import housingImg from "@/assets/feature-housing.jpg";
import economyImg from "@/assets/feature-economy.jpg";
import eventsImg from "@/assets/feature-events.jpg";
import emergencyImg from "@/assets/feature-emergency.jpg";

const features = [
  {
    title: "Custom Jobs",
    description: "30+ unique jobs including legal and illegal activities with realistic progression systems and specialized skills.",
    image: jobsImg,
    icon: Briefcase,
  },
  {
    title: "500+ Vehicles",
    description: "Extensive vehicle collection with custom handling, modifications, and realistic damage systems.",
    image: vehiclesImg,
    icon: Car,
  },
  {
    title: "Housing System",
    description: "Buy, sell, and customize your own properties. From apartments to luxury mansions with full interior customization.",
    image: housingImg,
    icon: Home,
  },
  {
    title: "Advanced Economy",
    description: "Dynamic player-driven economy with businesses, stocks, banking systems, and cryptocurrency trading.",
    image: economyImg,
    icon: TrendingUp,
  },
  {
    title: "Weekly Events",
    description: "Exclusive server events, tournaments, and community activities with special rewards and prizes.",
    image: eventsImg,
    icon: Calendar,
  },
  {
    title: "Emergency Services",
    description: "Join LSPD, LSFD, or EMS with realistic training, equipment, and dispatch systems.",
    image: emergencyImg,
    icon: Shield,
  },
];

const Features = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <PageHeader 
        title="Server Features"
        description="Experience unmatched gameplay with our custom features and systems"
      />
      
      <main className="pb-16">
        <div className="container mx-auto px-4">
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group glass-effect rounded-xl overflow-hidden hover:scale-105 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent"></div>
                  <div className="absolute bottom-4 left-4 p-3 rounded-lg bg-primary/20 backdrop-blur-sm">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Features;
