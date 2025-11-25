import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ThumbsUp, Eye } from "lucide-react";
import { format } from "date-fns";

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  view_count: number;
  helpful_count: number;
  created_at: string;
}

const KnowledgeArticle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchArticle(id);
      incrementViewCount(id);
    }
  }, [id]);

  const fetchArticle = async (articleId: string) => {
    const { data, error } = await supabase
      .from("knowledge_articles")
      .select("*")
      .eq("id", articleId)
      .eq("is_published", true)
      .single();

    if (!error && data) {
      setArticle(data);
    }
    setLoading(false);
  };

  const incrementViewCount = async (articleId: string) => {
    await supabase.rpc("increment_article_helpful", { article_id: articleId });
  };

  const markHelpful = async () => {
    if (!article) return;
    await supabase.rpc("increment_article_helpful", { article_id: article.id });
    fetchArticle(article.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">Article not found</p>
          <Button onClick={() => navigate("/knowledge")} className="mt-4">
            Back to Knowledge Base
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => navigate("/knowledge")} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Knowledge Base
          </Button>

          <Card className="glass-effect border-border/20">
            <CardHeader>
              <div className="flex items-start justify-between mb-4">
                <Badge variant="outline">{article.category}</Badge>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {article.view_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-4 w-4" />
                    {article.helpful_count}
                  </span>
                </div>
              </div>
              <CardTitle className="text-3xl">{article.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Published on {format(new Date(article.created_at), "PPP")}
              </p>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none mb-6">
                <div className="whitespace-pre-wrap">{article.content}</div>
              </div>

              <div className="flex gap-2 flex-wrap mb-6">
                {article.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="border-t border-border/20 pt-6">
                <p className="text-sm text-muted-foreground mb-3">Was this article helpful?</p>
                <Button onClick={markHelpful} variant="outline">
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Yes, this helped
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeArticle;
