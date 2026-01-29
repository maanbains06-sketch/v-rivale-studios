import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Play } from "lucide-react";
import { useState } from "react";
import { useGalleryReactions } from "@/hooks/useGalleryReactions";
import { GalleryReactionPicker } from "@/components/GalleryReactionPicker";

interface GallerySubmission {
  id: string;
  title: string;
  description: string | null;
  category: string;
  file_path: string;
  file_type: string;
  created_at: string;
}

interface GalleryCardProps {
  submission: GallerySubmission;
  getFileUrl: (path: string) => string;
  onClick: () => void;
}

export const GalleryCard = ({ submission, getFileUrl, onClick }: GalleryCardProps) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const { reactions, loading, toggleReaction } = useGalleryReactions(submission.id);
  const isVideo = submission.file_type.startsWith("video/");

  return (
    <Card
      className="group overflow-hidden border-border/20 hover:border-primary/40 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-primary/10"
      onClick={onClick}
    >
      <div className="aspect-video bg-muted/30 relative overflow-hidden">
        {isVideo ? (
          <>
            <video
              src={getFileUrl(submission.file_path)}
              className="w-full h-full object-cover"
              muted
              onLoadedData={() => setIsImageLoaded(true)}
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors">
              <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 text-primary-foreground ml-1" />
              </div>
            </div>
          </>
        ) : (
          <>
            {!isImageLoaded && (
              <div className="absolute inset-0 bg-muted/50 animate-pulse" />
            )}
            <img
              src={getFileUrl(submission.file_path)}
              alt={submission.title}
              className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${
                isImageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setIsImageLoaded(true)}
              loading="lazy"
            />
          </>
        )}
        
        {/* Category Badge */}
        <Badge
          variant="secondary"
          className="absolute top-2 right-2 backdrop-blur-sm bg-background/80"
        >
          {submission.category}
        </Badge>
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold mb-1 truncate group-hover:text-primary transition-colors">
          {submission.title}
        </h3>
        {submission.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {submission.description}
          </p>
        )}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
            <Calendar className="h-3 w-3" />
            {new Date(submission.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
          <div className="overflow-hidden">
            <GalleryReactionPicker
              reactions={reactions}
              onReact={toggleReaction}
              loading={loading}
              variant="card"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
