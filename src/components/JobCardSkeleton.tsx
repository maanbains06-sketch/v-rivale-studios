import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const JobCardSkeleton = () => {
  return (
    <Card className="glass-effect border-border/20 overflow-hidden">
      {/* Image skeleton */}
      <div className="relative h-36 overflow-hidden">
        <Skeleton className="w-full h-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4">
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-md" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
      </div>
      
      <CardContent className="pt-3 pb-4 space-y-3">
        {/* Description skeleton */}
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
        
        {/* Benefits skeleton */}
        <div className="space-y-1.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Skeleton className="w-3 h-3 rounded-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
        
        {/* Button skeleton */}
        <Skeleton className="h-9 w-full mt-3 rounded-md" />
      </CardContent>
    </Card>
  );
};

export const JobCardsSkeletonGrid = () => {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 7 }).map((_, index) => (
        <div 
          key={index} 
          className="animate-fade-in"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <JobCardSkeleton />
        </div>
      ))}
    </div>
  );
};

export default JobCardSkeleton;
