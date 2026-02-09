import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { useRpNews, type RpNewsArticle } from "@/hooks/useRpNews";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import LazyImage from "@/components/LazyImage";
import {
  Newspaper, Skull, ShieldAlert, Crosshair, Scale, CarFront, CalendarDays, Clock, MapPin,
  Play, Pause, Volume2, VolumeX, Maximize, Siren, Radio, Wifi, ArrowLeft,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

const EVENT_CATEGORIES = [
  { key: "all", label: "All News", icon: Newspaper },
  { key: "death", label: "Deaths", icon: Skull },
  { key: "arrest", label: "Arrests", icon: ShieldAlert },
  { key: "shootout", label: "Shootouts", icon: Crosshair },
  { key: "chase", label: "Chases", icon: Siren },
  { key: "court_case", label: "Court Cases", icon: Scale },
  { key: "impound", label: "Impounds", icon: CarFront },
  { key: "event", label: "Events", icon: CalendarDays },
];

const EVENT_COLORS: Record<string, string> = {
  death: "bg-red-500/20 text-red-400 border-red-500/30",
  arrest: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  shootout: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  chase: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  court_case: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  impound: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  event: "bg-green-500/20 text-green-400 border-green-500/30",
};

const EVENT_LABELS: Record<string, string> = {
  death: "DEATH REPORT",
  arrest: "ARREST",
  shootout: "SHOOTOUT",
  chase: "POLICE CHASE",
  court_case: "COURT CASE",
  impound: "VEHICLE IMPOUND",
  event: "CITY EVENT",
};

const News = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("all");
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const { articles, loading, liveCount } = useRpNews(activeFilter);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update relative timestamps every 30s without full page refresh
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="City Chronicle"
        description="Breaking news from the streets of Los Santos — powered by AI journalism"
      />

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-6 gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        {/* Live indicator */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-sm font-semibold text-foreground">LIVE</span>
            <Wifi className="w-4 h-4 text-primary" />
          </div>
          {liveCount > 0 && (
            <Badge variant="outline" className="text-xs border-primary/30 text-primary animate-fade-in">
              +{liveCount} new since you arrived
            </Badge>
          )}
        </div>

        {/* Category Filter Bar */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {EVENT_CATEGORIES.map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={activeFilter === key ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(key)}
              className="gap-2"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && articles.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center gap-6 py-20">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Newspaper className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">No News Yet</h2>
            <p className="text-muted-foreground max-w-md">
              The City Chronicle is waiting for events from the streets of Los Santos.
              Once your FiveM server starts sending events, AI-generated articles will appear here.
            </p>
          </div>
        )}

        {/* Featured Article (latest) */}
        {!loading && articles.length > 0 && (
          <>
            <FeaturedArticle article={articles[0]} />

            {/* Article Grid */}
            {articles.length > 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {articles.slice(1).map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    expanded={expandedArticle === article.id}
                    onToggle={() =>
                      setExpandedArticle(expandedArticle === article.id ? null : article.id)
                    }
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

/* ── Video Player Component ── */
function NewsVideoPlayer({ src, poster, className = "" }: { src: string; poster?: string | null; className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(!playing);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
  };

  const goFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    videoRef.current?.requestFullscreen();
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
  };

  return (
    <div className={`relative group ${className}`}>
      <video
        ref={videoRef}
        src={src}
        poster={poster || undefined}
        muted={muted}
        loop
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setPlaying(false)}
        className="w-full h-full object-cover"
      />

      {/* Play overlay */}
      {!playing && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer"
          onClick={togglePlay}
        >
          <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-lg shadow-primary/30">
            <Play className="w-8 h-8 text-primary-foreground ml-1" />
          </div>
          <Badge className="absolute top-3 right-3 bg-red-600 text-white border-none text-[10px] font-bold">
            VIDEO
          </Badge>
        </div>
      )}

      {/* Controls overlay */}
      {playing && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Progress bar */}
          <div className="w-full h-1 bg-white/20 rounded-full mb-2 cursor-pointer" onClick={(e) => {
            e.stopPropagation();
            if (!videoRef.current) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            videoRef.current.currentTime = pct * videoRef.current.duration;
          }}>
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={togglePlay} className="text-white hover:text-primary transition-colors">
              <Pause className="w-4 h-4" />
            </button>
            <button onClick={toggleMute} className="text-white hover:text-primary transition-colors">
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <div className="flex-1" />
            <button onClick={goFullscreen} className="text-white hover:text-primary transition-colors">
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Media renderer (image, video, or both) ── */
function ArticleMedia({ article, className = "", height = "h-64" }: { article: RpNewsArticle; className?: string; height?: string }) {
  const hasVideo = !!article.video_url;
  const hasImage = !!article.image_url;

  if (hasVideo) {
    return (
      <NewsVideoPlayer
        src={article.video_url!}
        poster={article.image_url}
        className={`${height} ${className}`}
      />
    );
  }

  if (hasImage) {
    return (
      <div className={`relative ${height} bg-muted overflow-hidden ${className}`}>
        <LazyImage
          src={article.image_url!}
          alt={article.headline}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${height} bg-gradient-to-br from-primary/20 to-primary/5 ${className}`}>
      <Newspaper className="w-16 h-16 text-primary/40" />
    </div>
  );
}

/* ── Featured (hero) article ── */
function FeaturedArticle({ article }: { article: RpNewsArticle }) {
  return (
    <Card className="overflow-hidden border-primary/20 bg-card/80 backdrop-blur">
      <div className="grid md:grid-cols-2 gap-0">
        {/* Media */}
        <div className="relative min-h-[300px]">
          <ArticleMedia article={article} height="h-full min-h-[300px]" />
          <div className="absolute top-4 left-4 z-10">
            <Badge className={`${EVENT_COLORS[article.event_type] || ""} font-bold text-xs tracking-wider uppercase border`}>
              {EVENT_LABELS[article.event_type] || "BREAKING"}
            </Badge>
          </div>
          {!article.video_url && (
            <div className="absolute top-4 right-4 z-10">
              <Badge variant="destructive" className="animate-pulse font-bold text-xs">
                BREAKING
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <CardContent className="p-6 md:p-8 flex flex-col justify-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 leading-tight">
            {article.headline}
          </h2>

          <p className="text-muted-foreground leading-relaxed mb-6 whitespace-pre-line">
            {article.article_body}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            {article.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {article.location}
              </span>
            )}
            {article.character_name && (
              <span className="flex items-center gap-1">
                <Skull className="w-3 h-3" /> {article.character_name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />{" "}
              {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
            </span>
            {article.video_url && (
              <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400">
                📹 Video Available
              </Badge>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

/* ── Regular article card ── */
function ArticleCard({
  article,
  expanded,
  onToggle,
}: {
  article: RpNewsArticle;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Card
      className="overflow-hidden hover:border-primary/30 transition-all duration-300 cursor-pointer group"
      onClick={onToggle}
    >
      {/* Media */}
      <div className="relative h-48 overflow-hidden">
        <ArticleMedia article={article} height="h-48" className="group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-3 left-3 z-10">
          <Badge className={`${EVENT_COLORS[article.event_type] || ""} font-bold text-[10px] tracking-wider uppercase border`}>
            {EVENT_LABELS[article.event_type] || "NEWS"}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {article.headline}
        </h3>

        <p className={`text-sm text-muted-foreground ${expanded ? "" : "line-clamp-3"} whitespace-pre-line`}>
          {article.article_body}
        </p>

        <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {article.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {article.location}
              </span>
            )}
            {article.video_url && (
              <Badge variant="outline" className="text-[9px] border-cyan-500/30 text-cyan-400 px-1.5 py-0">
                📹 Video
              </Badge>
            )}
          </div>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {format(new Date(article.published_at), "MMM d, h:mm a")}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default News;
