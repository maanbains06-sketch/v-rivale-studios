import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import headerGallery from "@/assets/header-gallery.jpg";
import GalleryUploadForm from "@/components/GalleryUploadForm";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, Video, Calendar, Users, MapPin, UserPlus, X, Grid3x3, List } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStaffRole } from "@/hooks/useStaffRole";
import { useEvents } from "@/hooks/useEvents";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { GalleryImageViewer } from "@/components/GalleryImageViewer";
import { GalleryCard } from "@/components/GalleryCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const { canAccessCategory, isStaff, loading: staffLoading } = useStaffRole();
  const { events, getRunningEvents, getUpcomingEvents, registerForEvent, cancelRegistration, checkUserRegistration } = useEvents();
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [submissions, setSubmissions] = useState<GallerySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showEventsDialog, setShowEventsDialog] = useState(false);
  const [registeredEvents, setRegisteredEvents] = useState<Set<string>>(new Set());
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "masonry">("grid");

  useEffect(() => {
    loadApprovedSubmissions();
    loadUserRegistrations();
  }, []);

  const loadUserRegistrations = async () => {
    const registered = new Set<string>();
    for (const event of events) {
      const isRegistered = await checkUserRegistration(event.id);
      if (isRegistered) {
        registered.add(event.id);
      }
    }
    setRegisteredEvents(registered);
  };

  const loadApprovedSubmissions = async () => {
    try {
      setLoading(true);
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

  const handleCategoryClick = (category: string) => {
    if (category === 'event') {
      setShowEventsDialog(true);
    } else {
      setSelectedCategory(selectedCategory === category ? null : category);
    }
  };

  const handleRegisterForEvent = async (eventId: string) => {
    if (registeredEvents.has(eventId)) {
      const success = await cancelRegistration(eventId);
      if (success) {
        setRegisteredEvents(prev => {
          const next = new Set(prev);
          next.delete(eventId);
          return next;
        });
      }
    } else {
      const success = await registerForEvent(eventId);
      if (success) {
        setRegisteredEvents(prev => new Set(prev).add(eventId));
      }
    }
  };

  const filteredSubmissions = selectedCategory 
    ? getSubmissionsByCategory(selectedCategory)
    : [];

  const handleImageClick = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
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
          <div className="text-center mb-8 animate-fade-in">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
              onClick={() => setShowUploadForm(!showUploadForm)}
            >
              <Upload className="w-5 h-5 mr-2" />
              {showUploadForm ? "Hide Upload Form" : "Submit Your Content"}
            </Button>
            {isStaff && (
              <p className="text-sm text-muted-foreground mt-2">
                Staff members can upload to Screenshots, Videos, and Events
              </p>
            )}
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
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Screenshots */}
            <button
              onClick={() => handleCategoryClick('screenshot')}
              className="relative group cursor-pointer w-full text-left transform hover:scale-105 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative glass-effect rounded-2xl p-8 border border-border/20 hover:border-primary/40 transition-all duration-300 text-center overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/30 transition-colors relative z-10">
                  <ImageIcon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2 relative z-10">Screenshots</h3>
                <p className="text-sm text-muted-foreground mb-4 relative z-10">Beautiful moments captured</p>
                <Badge variant="secondary" className="text-xs relative z-10">
                  {getSubmissionsByCategory('screenshot').length} photos
                </Badge>
              </div>
            </button>

            {/* Videos */}
            <button
              onClick={() => handleCategoryClick('video')}
              className="relative group cursor-pointer w-full text-left transform hover:scale-105 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative glass-effect rounded-2xl p-8 border border-border/20 hover:border-secondary/40 transition-all duration-300 text-center overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-secondary/30 transition-colors relative z-10">
                  <Video className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-xl font-bold mb-2 relative z-10">Videos</h3>
                <p className="text-sm text-muted-foreground mb-4 relative z-10">Epic roleplay moments</p>
                <Badge variant="secondary" className="text-xs relative z-10">
                  {getSubmissionsByCategory('video').length} videos
                </Badge>
              </div>
            </button>

            {/* Events */}
            <button
              onClick={() => handleCategoryClick('event')}
              className="relative group cursor-pointer w-full text-left transform hover:scale-105 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative glass-effect rounded-2xl p-8 border border-border/20 hover:border-primary/40 transition-all duration-300 text-center overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/30 transition-colors relative z-10">
                  <Calendar className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2 relative z-10">Events</h3>
                <p className="text-sm text-muted-foreground mb-4 relative z-10">Community gatherings</p>
                <Badge variant="secondary" className="text-xs relative z-10">
                  {getRunningEvents().length} Running · {getUpcomingEvents().length} Upcoming
                </Badge>
              </div>
            </button>

            {/* Community */}
            <button
              onClick={() => handleCategoryClick('community')}
              className="relative group cursor-pointer w-full text-left transform hover:scale-105 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative glass-effect rounded-2xl p-8 border border-border/20 hover:border-secondary/40 transition-all duration-300 text-center overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-secondary/30 transition-colors relative z-10">
                  <Users className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-xl font-bold mb-2 relative z-10">Community</h3>
                <p className="text-sm text-muted-foreground mb-4 relative z-10">Fan art & creations</p>
                <Badge variant="secondary" className="text-xs relative z-10">
                  {getSubmissionsByCategory('community').length} items
                </Badge>
              </div>
            </button>
          </div>

          {/* Filtered Submissions */}
          {selectedCategory && (
            <div className="mb-16 animate-fade-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-3">
                  {selectedCategory === 'screenshot' && (
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  {selectedCategory === 'video' && (
                    <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                      <Video className="h-6 w-6 text-secondary" />
                    </div>
                  )}
                  {selectedCategory === 'community' && (
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-3xl font-bold text-gradient capitalize">{selectedCategory}s</h2>
                    <p className="text-muted-foreground">{filteredSubmissions.length} {filteredSubmissions.length === 1 ? 'item' : 'items'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "grid" | "masonry")}>
                    <TabsList>
                      <TabsTrigger value="grid" className="gap-2">
                        <Grid3x3 className="w-4 h-4" />
                        Grid
                      </TabsTrigger>
                      <TabsTrigger value="masonry" className="gap-2">
                        <List className="w-4 h-4" />
                        List
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <Button variant="outline" onClick={() => setSelectedCategory(null)} className="gap-2">
                    <X className="w-4 h-4" />
                    Close
                  </Button>
                </div>
              </div>

              {filteredSubmissions.length > 0 ? (
                <>
                  {loading ? (
                    <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "grid grid-cols-1 md:grid-cols-2 gap-6"}>
                      {[...Array(8)].map((_, i) => (
                        <Card key={i} className="overflow-hidden border-border/20 animate-pulse">
                          <div className="aspect-video bg-muted/30" />
                          <CardContent className="p-4">
                            <div className="h-5 bg-muted/30 rounded mb-2" />
                            <div className="h-4 bg-muted/20 rounded w-3/4" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "grid grid-cols-1 md:grid-cols-2 gap-6"}>
                      {filteredSubmissions.map((submission, index) => (
                        <GalleryCard
                          key={submission.id}
                          submission={submission}
                          getFileUrl={getFileUrl}
                          onClick={() => handleImageClick(index)}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-24 glass-effect rounded-3xl border border-border/20">
                  <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No {selectedCategory}s yet</h3>
                  <p className="text-muted-foreground">Be the first to upload content in this category!</p>
                </div>
              )}
            </div>
          )}

          {/* Image Viewer */}
          <GalleryImageViewer
            submissions={filteredSubmissions}
            currentIndex={viewerIndex}
            isOpen={viewerOpen}
            onClose={() => setViewerOpen(false)}
            getFileUrl={getFileUrl}
          />

          {/* Events Dialog */}
          <Dialog open={showEventsDialog} onOpenChange={setShowEventsDialog}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl text-gradient">Community Events</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-8">
                {/* Running Events */}
                {getRunningEvents().length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                      Running Now
                    </h3>
                    <div className="grid gap-4">
                      {getRunningEvents().map((event) => (
                        <Card key={event.id} className="border-green-500/20">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="mb-2">{event.title}</CardTitle>
                                <p className="text-sm text-muted-foreground">{event.description}</p>
                              </div>
                              <Badge variant="default" className="bg-green-500">Running</Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid gap-2 mb-4">
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span>{format(new Date(event.start_date), 'PPp')} - {format(new Date(event.end_date), 'PPp')}</span>
                              </div>
                              {event.location && (
                                <div className="flex items-center gap-2 text-sm">
                                  <MapPin className="w-4 h-4 text-muted-foreground" />
                                  <span>{event.location}</span>
                                </div>
                              )}
                              {event.max_participants && (
                                <div className="flex items-center gap-2 text-sm">
                                  <UserPlus className="w-4 h-4 text-muted-foreground" />
                                  <span>{event.current_participants} / {event.max_participants} participants</span>
                                </div>
                              )}
                            </div>
                            <Button 
                              onClick={() => handleRegisterForEvent(event.id)}
                              variant={registeredEvents.has(event.id) ? "outline" : "default"}
                              disabled={event.max_participants !== null && event.current_participants >= event.max_participants && !registeredEvents.has(event.id)}
                            >
                              {registeredEvents.has(event.id) ? 'Cancel Registration' : 'Register'}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upcoming Events */}
                {getUpcomingEvents().length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold mb-4">Upcoming Events</h3>
                    <div className="grid gap-4">
                      {getUpcomingEvents().map((event) => (
                        <Card key={event.id}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="mb-2">{event.title}</CardTitle>
                                <p className="text-sm text-muted-foreground">{event.description}</p>
                              </div>
                              <Badge variant="secondary">Upcoming</Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid gap-2 mb-4">
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span>{format(new Date(event.start_date), 'PPp')} - {format(new Date(event.end_date), 'PPp')}</span>
                              </div>
                              {event.location && (
                                <div className="flex items-center gap-2 text-sm">
                                  <MapPin className="w-4 h-4 text-muted-foreground" />
                                  <span>{event.location}</span>
                                </div>
                              )}
                              {event.max_participants && (
                                <div className="flex items-center gap-2 text-sm">
                                  <UserPlus className="w-4 h-4 text-muted-foreground" />
                                  <span>{event.current_participants} / {event.max_participants} participants</span>
                                </div>
                              )}
                            </div>
                            <Button 
                              onClick={() => handleRegisterForEvent(event.id)}
                              variant={registeredEvents.has(event.id) ? "outline" : "default"}
                              disabled={event.max_participants !== null && event.current_participants >= event.max_participants && !registeredEvents.has(event.id)}
                            >
                              {registeredEvents.has(event.id) ? 'Cancel Registration' : 'Register'}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {events.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No events scheduled at the moment. Check back soon!</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {!selectedCategory && submissions.length === 0 && !loading && (
            <div className="text-center min-h-[50vh] flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 rounded-3xl"></div>
              <div className="relative glass-effect rounded-3xl p-16 border border-border/20">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto animate-float">
                    <ImageIcon className="w-8 h-8 text-primary" />
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto animate-float" style={{ animationDelay: "0.2s" }}>
                    <Video className="w-8 h-8 text-secondary" />
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto animate-float" style={{ animationDelay: "0.4s" }}>
                    <Calendar className="w-8 h-8 text-primary" />
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto animate-float" style={{ animationDelay: "0.6s" }}>
                    <Users className="w-8 h-8 text-secondary" />
                  </div>
                </div>
                <h2 className="text-4xl md:text-6xl font-bold text-gradient mb-4">
                  Welcome to the Gallery
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                  Explore breathtaking screenshots, epic videos, exciting events, and amazing community creations. Click on any category above to start exploring!
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <Button size="lg" variant="default" onClick={() => handleCategoryClick('screenshot')}>
                    <ImageIcon className="w-5 h-5 mr-2" />
                    Browse Screenshots
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => handleCategoryClick('event')}>
                    <Calendar className="w-5 h-5 mr-2" />
                    View Events
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Gallery;
