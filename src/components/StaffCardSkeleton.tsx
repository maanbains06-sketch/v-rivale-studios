import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export const StaffCardSkeleton = () => {
  return (
    <div className="relative group">
      <Card className="relative glass-effect border-border/20 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary/30 via-secondary/30 to-primary/30"></div>
        
        {/* Fake achievement badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-1 z-10">
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>

        {/* Fake favorite button */}
        <div className="absolute top-3 left-3 z-10">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>

        <CardContent className="pt-5 pb-4">
          <div className="flex flex-col items-center text-center">
            {/* Avatar skeleton */}
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-lg animate-pulse"></div>
              <Skeleton className="w-20 h-20 rounded-full" />
              <Skeleton className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full" />
              <Skeleton className="absolute -top-1 -left-1 w-4 h-4 rounded-full" />
            </div>

            {/* Name skeleton */}
            <Skeleton className="h-6 w-32 mb-1.5" />
            
            {/* Role badge skeleton */}
            <Skeleton className="h-6 w-24 rounded-full mb-1.5" />
            
            {/* Department badges skeleton */}
            <div className="flex items-center gap-2 mb-3">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>

            {/* Bio skeleton */}
            <div className="w-full max-w-xs mb-4 space-y-1">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4 mx-auto" />
            </div>

            {/* Button skeleton */}
            <Skeleton className="w-full h-10 rounded-md" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const StaffCardsSkeletonGrid = ({ count = 6 }: { count?: number }) => {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="animate-fade-in"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <StaffCardSkeleton />
        </div>
      ))}
    </div>
  );
};
