import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2, Loader2, Newspaper, RefreshCw, AlertTriangle, Image as ImageIcon, Video, MapPin, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface NewsArticle {
  id: string;
  event_type: string;
  headline: string;
  article_body: string;
  character_name: string | null;
  location: string | null;
  image_url: string | null;
  video_url: string | null;
  media_type: string | null;
  published_at: string;
}

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
  death: "Death",
  arrest: "Arrest",
  shootout: "Shootout",
  chase: "Chase",
  court_case: "Court Case",
  impound: "Impound",
  event: "Event",
};

export const OwnerNewsManager = () => {
  const { toast } = useToast();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("rp_news_articles")
        .select("*")
        .order("published_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setArticles((data as any[]) || []);
    } catch (error) {
      console.error("Error loading articles:", error);
      toast({ title: "Error", description: "Failed to load news articles.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();

    const channel = supabase
      .channel("owner-news-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "rp_news_articles" }, () => {
        loadArticles();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const deleteArticle = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase.from("rp_news_articles").delete().eq("id", id);
      if (error) throw error;
      setArticles((prev) => prev.filter((a) => a.id !== id));
      toast({ title: "Deleted", description: "News article has been removed." });
    } catch (error) {
      console.error("Error deleting article:", error);
      toast({ title: "Error", description: "Failed to delete article.", variant: "destructive" });
    } finally {
      setDeletingId(null);
      setShowDeleteConfirm(null);
    }
  };

  const deleteAllArticles = async () => {
    setIsDeletingAll(true);
    try {
      const { error } = await supabase.from("rp_news_articles").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
      setArticles([]);
      toast({ title: "All Deleted", description: "All news articles have been removed." });
    } catch (error) {
      console.error("Error deleting all articles:", error);
      toast({ title: "Error", description: "Failed to delete all articles.", variant: "destructive" });
    } finally {
      setIsDeletingAll(false);
      setShowDeleteAllConfirm(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Newspaper className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>News Management</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {articles.length} article{articles.length !== 1 ? "s" : ""} published
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadArticles} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              {articles.length > 0 && (
                <Button variant="destructive" size="sm" onClick={() => setShowDeleteAllConfirm(true)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete All
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : articles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Newspaper className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No news articles yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Headline</TableHead>
                    <TableHead>Character</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Media</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {articles.map((article) => (
                    <TableRow key={article.id}>
                      <TableCell>
                        <Badge className={`${EVENT_COLORS[article.event_type] || ""} text-[10px] uppercase border`}>
                          {EVENT_LABELS[article.event_type] || article.event_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <p className="font-medium text-sm truncate">{article.headline}</p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {article.character_name || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {article.location ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {article.location}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {article.image_url && <ImageIcon className="w-4 h-4 text-green-400" />}
                          {article.video_url && <Video className="w-4 h-4 text-cyan-400" />}
                          {!article.image_url && !article.video_url && <span className="text-muted-foreground text-xs">None</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setShowDeleteConfirm(article.id)}
                          disabled={deletingId === article.id}
                        >
                          {deletingId === article.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Single Delete Confirm */}
      <AlertDialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete News Article?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this article from the City Chronicle. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => showDeleteConfirm && deleteArticle(showDeleteConfirm)}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Confirm */}
      <AlertDialog open={showDeleteAllConfirm} onOpenChange={setShowDeleteAllConfirm}>
        <AlertDialogContent className="border-destructive/50">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <AlertDialogTitle className="text-xl">Delete All News?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              This will permanently delete all {articles.length} news articles. This action is irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingAll}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteAllArticles}
              disabled={isDeletingAll}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeletingAll ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</>
              ) : (
                <><Trash2 className="w-4 h-4 mr-2" /> Delete All News</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
