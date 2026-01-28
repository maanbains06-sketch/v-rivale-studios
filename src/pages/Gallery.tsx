import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import headerGallery from "@/assets/header-gallery.jpg";
import GalleryUploadForm from "@/components/GalleryUploadForm";
import GalleryQuickUploadDialog from "@/components/GalleryQuickUploadDialog";
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
  const { canAccessCategory, isStaff, isAdmin, loading: staffLoading } = useStaffRole();
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
  const [quickUploadOpen, setQuickUploadOpen] = useState(false);
  const [quickUploadCategory, setQuickUploadCategory] = useState<'screenshot' | 'video'>('screenshot');

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
        pageKey="gallery"
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
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {/* Screenshots */}
            <div 
              className="group cursor-pointer"
              onClick={() => handleCategoryClick('screenshot')}
            >
              <div className="relative overflow-hidden rounded-2xl bg-card border border-border/30 hover:border-primary/50 transition-all duration-500 h-full">
                {/* Animated gradient border on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
                </div>
                
                {/* Content */}
                <div className="relative p-8 flex flex-col items-center text-center h-full">
                  {/* Icon with glow effect */}
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 group-hover:border-primary/40 transition-all duration-300">
                      <ImageIcon className="w-10 h-10 text-primary" />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">Screenshots</h3>
                  <p className="text-muted-foreground text-sm mb-4 leading-relaxed">Capture your best roleplay moments</p>
                  
                  <div className="mt-auto pt-4 w-full">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <span className="text-3xl font-bold text-primary">{getSubmissionsByCategory('screenshot').length}</span>
                      <span className="text-muted-foreground text-sm">photos</span>
                    </div>
                    <div className="h-1 w-full bg-muted/30 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full w-3/4 group-hover:w-full transition-all duration-700" />
                    </div>
                  </div>
                </div>
                
                {/* Hover arrow indicator */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Quick Upload for Staff */}
              {(isStaff || isAdmin) && (
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuickUploadCategory('screenshot');
                    setQuickUploadOpen(true);
                  }}
                  size="sm"
                  variant="ghost"
                  className="w-full mt-3 text-muted-foreground hover:text-primary hover:bg-primary/10"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Quick Upload
                </Button>
              )}
            </div>

            {/* Videos */}
            <div 
              className="group cursor-pointer"
              onClick={() => handleCategoryClick('video')}
            >
              <div className="relative overflow-hidden rounded-2xl bg-card border border-border/30 hover:border-primary/50 transition-all duration-500 h-full">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
                </div>
                
                <div className="relative p-8 flex flex-col items-center text-center h-full">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 group-hover:border-primary/40 transition-all duration-300">
                      <Video className="w-10 h-10 text-primary" />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">Videos</h3>
                  <p className="text-muted-foreground text-sm mb-4 leading-relaxed">Epic roleplay cinematics</p>
                  
                  <div className="mt-auto pt-4 w-full">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <span className="text-3xl font-bold text-primary">{getSubmissionsByCategory('video').length}</span>
                      <span className="text-muted-foreground text-sm">videos</span>
                    </div>
                    <div className="h-1 w-full bg-muted/30 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full w-1/2 group-hover:w-full transition-all duration-700" />
                    </div>
                  </div>
                </div>
                
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {(isStaff || isAdmin) && (
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuickUploadCategory('video');
                    setQuickUploadOpen(true);
                  }}
                  size="sm"
                  variant="ghost"
                  className="w-full mt-3 text-muted-foreground hover:text-primary hover:bg-primary/10"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Quick Upload
                </Button>
              )}
            </div>

            {/* Events */}
            <div 
              className="group cursor-pointer"
              onClick={() => handleCategoryClick('event')}
            >
              <div className="relative overflow-hidden rounded-2xl bg-card border border-border/30 hover:border-primary/50 transition-all duration-500 h-full">
                {/* Live indicator */}
                <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-background/80 backdrop-blur-sm px-2.5 py-1 rounded-full border border-green-500/30">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-xs font-medium text-green-500">Live</span>
                </div>
                
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
                </div>
                
                <div className="relative p-8 flex flex-col items-center text-center h-full">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 group-hover:border-primary/40 transition-all duration-300">
                      <Calendar className="w-10 h-10 text-primary" />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">Events</h3>
                  <p className="text-muted-foreground text-sm mb-4 leading-relaxed">Join community gatherings</p>
                  
                  <div className="mt-auto pt-4 w-full">
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <div className="text-center">
                        <span className="text-2xl font-bold text-primary">{getRunningEvents().length}</span>
                        <span className="text-muted-foreground text-xs block">Running</span>
                      </div>
                      <div className="w-px h-8 bg-border/50" />
                      <div className="text-center">
                        <span className="text-2xl font-bold text-primary">{getUpcomingEvents().length}</span>
                        <span className="text-muted-foreground text-xs block">Upcoming</span>
                      </div>
                    </div>
                    <div className="h-1 w-full bg-muted/30 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full w-1/3 group-hover:w-full transition-all duration-700" />
                    </div>
                  </div>
                </div>
                
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Community */}
            <div 
              className="group cursor-pointer"
              onClick={() => handleCategoryClick('community')}
            >
              <div className="relative overflow-hidden rounded-2xl bg-card border border-border/30 hover:border-primary/50 transition-all duration-500 h-full">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
                </div>
                
                <div className="relative p-8 flex flex-col items-center text-center h-full">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 group-hover:border-primary/40 transition-all duration-300">
                      <Users className="w-10 h-10 text-primary" />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">Community</h3>
                  <p className="text-muted-foreground text-sm mb-4 leading-relaxed">Fan art & player creations</p>
                  
                  <div className="mt-auto pt-4 w-full">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <span className="text-3xl font-bold text-primary">{getSubmissionsByCategory('community').length}</span>
                      <span className="text-muted-foreground text-sm">items</span>
                    </div>
                    <div className="h-1 w-full bg-muted/30 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full w-1/4 group-hover:w-full transition-all duration-700" />
                    </div>
                  </div>
                </div>
                
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
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

          {/* Quick Upload Dialog */}
          <GalleryQuickUploadDialog
            open={quickUploadOpen}
            onOpenChange={setQuickUploadOpen}
            category={quickUploadCategory}
            onSuccess={loadApprovedSubmissions}
          />

          {/* Events Dialog */}
          <Dialog open={showEventsDialog} onOpenChange={setShowEventsDialog}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl text-gradient flex items-center gap-3">
                  Community Events
                  <span className="flex items-center gap-1.5 bg-background/80 backdrop-blur-sm px-2.5 py-1 rounded-full border border-green-500/30 text-sm font-normal">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-xs font-medium text-green-500">Live</span>
                  </span>
                </DialogTitle>
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
