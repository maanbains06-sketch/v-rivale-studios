import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import headerGallery from "@/assets/header-gallery.jpg";
import GalleryUploadForm from "@/components/GalleryUploadForm";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, Video, Calendar, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface GallerySubmission {
  id: string;
  title: string;
  description: string | null;
  category: string;
  file_path: string;
  file_type: string;
  created_at: string;
}

const Gallery = () => {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [submissions, setSubmissions] = useState<GallerySubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApprovedSubmissions();
  }, []);

  const loadApprovedSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from("gallery_submissions")
        .select("*")
        .eq("status", "approved")
        .order("approved_at", { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error("Error loading submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFileUrl = (filePath: string) => {
    const { data } = supabase.storage.from('gallery').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const getSubmissionsByCategory = (category: string) => {
    return submissions.filter(sub => sub.category === category);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <PageHeader 
        title="Community Gallery"
        description="Explore stunning screenshots, epic moments, and memorable experiences from our roleplay community"
        badge="Media Gallery"
        backgroundImage={headerGallery}
      />
      
      <main className="pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90"
              onClick={() => setShowUploadForm(!showUploadForm)}
            >
              <Upload className="w-5 h-5 mr-2" />
              {showUploadForm ? "Hide Upload Form" : "Submit Your Content"}
            </Button>
          </div>

          {/* Upload Form */}
          {showUploadForm && (
            <div className="mb-16 animate-fade-in">
              <GalleryUploadForm onSuccess={() => {
                setShowUploadForm(false);
                loadApprovedSubmissions();
              }} />
            </div>
          )}

          {/* Gallery Categories */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative glass-effect rounded-2xl p-8 border border-border/20 hover:border-primary/40 transition-all duration-300 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Screenshots</h3>
                <p className="text-sm text-muted-foreground">Beautiful moments captured by our community</p>
                <div className="mt-4 text-xs text-primary font-semibold">Coming Soon</div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative glass-effect rounded-2xl p-8 border border-border/20 hover:border-secondary/40 transition-all duration-300 text-center">
                <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Videos</h3>
                <p className="text-sm text-muted-foreground">Epic roleplay scenarios and highlights</p>
                <div className="mt-4 text-xs text-primary font-semibold">Coming Soon</div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative glass-effect rounded-2xl p-8 border border-border/20 hover:border-primary/40 transition-all duration-300 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Events</h3>
                <p className="text-sm text-muted-foreground">Special events and community gatherings</p>
                <div className="mt-4 text-xs text-primary font-semibold">Coming Soon</div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative glass-effect rounded-2xl p-8 border border-border/20 hover:border-secondary/40 transition-all duration-300 text-center">
                <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Community</h3>
                <p className="text-sm text-muted-foreground">Member submissions and fan art</p>
                <Badge className="mt-4 text-xs" variant="secondary">
                  {getSubmissionsByCategory('community').length} submissions
                </Badge>
              </div>
            </div>
          </div>

          {/* Community Submissions Section */}
          {submissions.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-6">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <h2 className="text-3xl font-bold text-gradient">Community Submissions</h2>
                  <p className="text-muted-foreground">Fan art and member contributions</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getSubmissionsByCategory('community').map((submission) => (
                  <Card key={submission.id} className="group overflow-hidden border-border/20 hover:border-primary/40 transition-all">
                    <div className="aspect-video bg-muted/30 relative overflow-hidden">
                      {submission.file_type.startsWith('image/') ? (
                        <img
                          src={getFileUrl(submission.file_path)}
                          alt={submission.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <video
                          src={getFileUrl(submission.file_path)}
                          className="w-full h-full object-cover"
                          controls
                        />
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-1 truncate">{submission.title}</h3>
                      {submission.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {submission.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(submission.created_at).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Other Categories */}
              {['screenshot', 'video', 'event'].map((category) => {
                const categorySubmissions = getSubmissionsByCategory(category);
                if (categorySubmissions.length === 0) return null;

                return (
                  <div key={category} className="mt-12">
                    <div className="flex items-center gap-3 mb-6">
                      {category === 'screenshot' && <ImageIcon className="h-8 w-8 text-primary" />}
                      {category === 'video' && <Video className="h-8 w-8 text-secondary" />}
                      {category === 'event' && <Calendar className="h-8 w-8 text-primary" />}
                      <div>
                        <h2 className="text-3xl font-bold text-gradient capitalize">{category}s</h2>
                        <p className="text-muted-foreground">{categorySubmissions.length} items</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {categorySubmissions.map((submission) => (
                        <Card key={submission.id} className="group overflow-hidden border-border/20 hover:border-primary/40 transition-all">
                          <div className="aspect-video bg-muted/30 relative overflow-hidden">
                            {submission.file_type.startsWith('image/') ? (
                              <img
                                src={getFileUrl(submission.file_path)}
                                alt={submission.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            ) : (
                              <video
                                src={getFileUrl(submission.file_path)}
                                className="w-full h-full object-cover"
                                controls
                              />
                            )}
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold mb-1 truncate">{submission.title}</h3>
                            {submission.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {submission.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {new Date(submission.created_at).toLocaleDateString()}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {submissions.length === 0 && !loading && (
            <div className="text-center min-h-[40vh] flex flex-col items-center justify-center glass-effect rounded-3xl p-12 border border-border/20">
              <h2 className="text-4xl md:text-5xl font-bold text-gradient mb-4">No Submissions Yet</h2>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Be the first to submit content to our community gallery!
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Gallery;
