import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import { 
  Flame, 
  Clock, 
  Star, 
  ArrowRight, 
  Zap,
  Shield,
  Heart,
  Wrench,
  Building2,
  Car,
  Newspaper,
  Gavel,
  Scale,
  UtensilsCrossed,
  PartyPopper
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FeaturedJob {
  id: string;
  name: string;
  icon: React.ReactNode;
  image: string;
  urgency: "critical" | "high" | "medium";
  spots: number;
  description: string;
  department: string;
  color: string;
}

interface FeaturedJobsCarouselProps {
  jobs: FeaturedJob[];
  onSelectJob: (jobId: string) => void;
}

const urgencyConfig = {
  critical: {
    label: "Urgent Hiring",
    bgClass: "bg-red-500",
    textClass: "text-red-400",
    borderClass: "border-red-500/50",
    glowClass: "shadow-red-500/30",
    icon: <Flame className="w-3.5 h-3.5" />,
  },
  high: {
    label: "High Priority",
    bgClass: "bg-amber-500",
    textClass: "text-amber-400",
    borderClass: "border-amber-500/50",
    glowClass: "shadow-amber-500/30",
    icon: <Zap className="w-3.5 h-3.5" />,
  },
  medium: {
    label: "Now Hiring",
    bgClass: "bg-green-500",
    textClass: "text-green-400",
    borderClass: "border-green-500/50",
    glowClass: "shadow-green-500/30",
    icon: <Star className="w-3.5 h-3.5" />,
  },
};

const FeaturedJobsCarousel = ({ jobs, onSelectJob }: FeaturedJobsCarouselProps) => {
  const [api, setApi] = useState<any>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });

    // Auto-scroll every 8 seconds (increased from 5 for less CPU usage)
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        if (api.canScrollNext()) {
          api.scrollNext();
        } else {
          api.scrollTo(0);
        }
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [api]);

  if (jobs.length === 0) return null;

  return (
    <div className="relative mb-12">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/30 rounded-xl blur-lg animate-pulse" />
            <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30">
              <Flame className="w-5 h-5 text-red-400" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              Featured Positions
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
            </h3>
            <p className="text-sm text-muted-foreground">Urgent openings that need immediate attention</p>
          </div>
        </div>

        {/* Carousel indicators */}
        <div className="hidden sm:flex items-center gap-1.5">
          {jobs.map((_, idx) => (
            <button
              key={idx}
              onClick={() => api?.scrollTo(idx)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                current === idx 
                  ? "w-6 bg-primary" 
                  : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>
      </div>

      {/* Carousel */}
      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {jobs.map((job, index) => {
            const urgency = urgencyConfig[job.urgency];
            
            return (
              <CarouselItem key={job.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                <Card 
                  className={cn(
                    "relative overflow-hidden cursor-pointer group transition-all duration-500",
                    "border-border/20 hover:border-primary/50",
                    "hover:scale-[1.02] hover:-translate-y-1",
                    "hover:shadow-2xl",
                    urgency.glowClass
                  )}
                  onClick={() => onSelectJob(job.id)}
                >
                  {/* Urgency ribbon */}
                  <div className={cn(
                    "absolute top-4 -right-8 z-10 px-10 py-1 rotate-45 text-xs font-bold text-white shadow-lg",
                    urgency.bgClass
                  )}>
                    {job.urgency === "critical" ? "URGENT" : job.urgency === "high" ? "PRIORITY" : "OPEN"}
                  </div>

                  {/* Image */}
                  <div className="relative h-40 overflow-hidden">
                    <img 
                      src={job.image} 
                      alt={job.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
                    
                    {/* Spots badge */}
                    <div className="absolute top-3 left-3">
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1 font-semibold",
                          urgency.bgClass, "text-white border-0"
                        )}
                      >
                        {urgency.icon}
                        {job.spots} {job.spots === 1 ? "Spot" : "Spots"} Left
                      </Badge>
                    </div>

                    {/* Job info overlay */}
                    <div className="absolute bottom-3 left-4 right-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg bg-background/90 backdrop-blur-sm shadow-lg",
                          "group-hover:scale-110 transition-transform duration-300"
                        )}>
                          {job.icon}
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">
                            {job.name}
                          </h4>
                          <p className="text-xs text-muted-foreground">{job.department}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <CardContent className="pt-4 pb-5 space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2 group-hover:text-foreground/80 transition-colors">
                      {job.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className={cn("flex items-center gap-1.5 text-xs font-medium", urgency.textClass)}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{urgency.label}</span>
                      </div>
                      
                      <Button 
                        size="sm"
                        className="group/btn bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/30"
                      >
                        Apply
                        <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover/btn:translate-x-0.5 transition-transform" />
                      </Button>
                    </div>
                  </CardContent>

                  {/* Hover glow effect */}
                  <div className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
                    "bg-gradient-to-t from-primary/5 to-transparent"
                  )} />
                </Card>
              </CarouselItem>
            );
          })}
        </CarouselContent>

        <CarouselPrevious className="hidden md:flex -left-4 bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background" />
        <CarouselNext className="hidden md:flex -right-4 bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background" />
      </Carousel>
    </div>
  );
};

export default FeaturedJobsCarousel;
