import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { useRpNews } from "@/hooks/useRpNews";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import LazyImage from "@/components/LazyImage";
import {
  Newspaper, Skull, ShieldAlert, Crosshair, Scale, CarFront, CalendarDays, Clock, MapPin,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

const EVENT_CATEGORIES = [
  { key: "all", label: "All News", icon: Newspaper },
  { key: "death", label: "Deaths", icon: Skull },
  { key: "arrest", label: "Arrests", icon: ShieldAlert },
  { key: "shootout", label: "Shootouts", icon: Crosshair },
  { key: "court_case", label: "Court Cases", icon: Scale },
  { key: "impound", label: "Impounds", icon: CarFront },
  { key: "event", label: "Events", icon: CalendarDays },
];

const EVENT_COLORS: Record<string, string> = {
  death: "bg-red-500/20 text-red-400 border-red-500/30",
  arrest: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  shootout: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  court_case: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  impound: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  event: "bg-green-500/20 text-green-400 border-green-500/30",
};

const EVENT_LABELS: Record<string, string> = {
  death: "DEATH REPORT",
  arrest: "ARREST",
  shootout: "SHOOTOUT",
  court_case: "COURT CASE",
  impound: "VEHICLE IMPOUND",
  event: "CITY EVENT",
};

const News = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const { articles, loading } = useRpNews(activeFilter);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="City Chronicle"
        description="Breaking news from the streets of Los Santos — powered by AI journalism"
      />

      <div className="container mx-auto px-4 py-8">
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

/* ── Featured (hero) article ── */
function FeaturedArticle({ article }: { article: import("@/hooks/useRpNews").RpNewsArticle }) {
  return (
    <Card className="overflow-hidden border-primary/20 bg-card/80 backdrop-blur">
      <div className="grid md:grid-cols-2 gap-0">
        {/* Image */}
        <div className="relative h-64 md:h-auto min-h-[300px] bg-muted">
          {article.image_url ? (
            <LazyImage
              src={article.image_url}
              alt={article.headline}
              className="w-full h-full object-cover absolute inset-0"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-primary/20 to-primary/5">
              <Newspaper className="w-16 h-16 text-primary/40" />
            </div>
          )}
          <div className="absolute top-4 left-4">
            <Badge className={`${EVENT_COLORS[article.event_type] || ""} font-bold text-xs tracking-wider uppercase border`}>
              {EVENT_LABELS[article.event_type] || "BREAKING"}
            </Badge>
          </div>
          <div className="absolute top-4 right-4">
            <Badge variant="destructive" className="animate-pulse font-bold text-xs">
              BREAKING
            </Badge>
          </div>
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
  article: import("@/hooks/useRpNews").RpNewsArticle;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Card
      className="overflow-hidden hover:border-primary/30 transition-all duration-300 cursor-pointer group"
      onClick={onToggle}
    >
      {/* Image */}
      <div className="relative h-48 bg-muted overflow-hidden">
        {article.image_url ? (
          <LazyImage
            src={article.image_url}
            alt={article.headline}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-muted to-muted/50">
            <Newspaper className="w-10 h-10 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute top-3 left-3">
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
