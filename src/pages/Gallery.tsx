import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import headerGallery from "@/assets/header-gallery.jpg";
import GalleryUploadForm from "@/components/GalleryUploadForm";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, Video, Calendar, Users, Lock, MapPin, UserPlus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStaffRole } from "@/hooks/useStaffRole";
import { useEvents } from "@/hooks/useEvents";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";

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
            {/* Screenshots - All Staff */}
            <button
              onClick={() => handleCategoryClick('screenshot')}
              disabled={!isStaff}
              className={`relative group ${!isStaff ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} w-full text-left`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative glass-effect rounded-2xl p-8 border border-border/20 hover:border-primary/40 transition-all duration-300 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2 flex items-center justify-center gap-2">
                  Screenshots
                  {!isStaff && <Lock className="w-4 h-4 text-muted-foreground" />}
                </h3>
                <p className="text-sm text-muted-foreground">Beautiful moments captured by our community</p>
                <div className="mt-4">
                  {isStaff ? (
                    <Badge variant="secondary" className="text-xs">
                      Staff Access
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Staff Only
                    </Badge>
                  )}
                </div>
              </div>
            </button>

            {/* Videos - All Staff */}
            <button
              onClick={() => handleCategoryClick('video')}
              disabled={!isStaff}
              className={`relative group ${!isStaff ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} w-full text-left`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative glass-effect rounded-2xl p-8 border border-border/20 hover:border-secondary/40 transition-all duration-300 text-center">
                <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                  <Video className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-xl font-bold mb-2 flex items-center justify-center gap-2">
                  Videos
                  {!isStaff && <Lock className="w-4 h-4 text-muted-foreground" />}
                </h3>
                <p className="text-sm text-muted-foreground">Epic roleplay scenarios and highlights</p>
                <div className="mt-4">
                  {isStaff ? (
                    <Badge variant="secondary" className="text-xs">
                      Staff Access
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Staff Only
                    </Badge>
                  )}
                </div>
              </div>
            </button>

            {/* Events - Open to All */}
            <button
              onClick={() => handleCategoryClick('event')}
              className="relative group cursor-pointer w-full text-left"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative glass-effect rounded-2xl p-8 border border-border/20 hover:border-primary/40 transition-all duration-300 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Events</h3>
                <p className="text-sm text-muted-foreground">Special events and community gatherings</p>
                <div className="mt-4">
                  <Badge variant="secondary" className="text-xs">
                    {getRunningEvents().length} Running · {getUpcomingEvents().length} Upcoming
                  </Badge>
                </div>
              </div>
            </button>

            {/* Community - Open to All */}
            <button
              onClick={() => handleCategoryClick('community')}
              className="relative group cursor-pointer w-full text-left"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative glass-effect rounded-2xl p-8 border border-border/20 hover:border-secondary/40 transition-all duration-300 text-center">
                <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Community</h3>
                <p className="text-sm text-muted-foreground">Member submissions and fan art</p>
                <Badge className="mt-4 text-xs" variant="secondary">
                  {getSubmissionsByCategory('community').length} submissions
                </Badge>
              </div>
            </button>
          </div>

          {/* Filtered Submissions */}
          {selectedCategory && (
            <div className="mb-16">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {selectedCategory === 'screenshot' && <ImageIcon className="h-8 w-8 text-primary" />}
                  {selectedCategory === 'video' && <Video className="h-8 w-8 text-secondary" />}
                  {selectedCategory === 'community' && <Users className="h-8 w-8 text-primary" />}
                  <div>
                    <h2 className="text-3xl font-bold text-gradient capitalize">{selectedCategory}s</h2>
                    <p className="text-muted-foreground">{filteredSubmissions.length} items</p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setSelectedCategory(null)}>
                  <X className="w-4 h-4 mr-2" />
                  Clear Filter
                </Button>
              </div>

              {filteredSubmissions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredSubmissions.map((submission) => (
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
              ) : (
                <div className="text-center py-16 glass-effect rounded-2xl border border-border/20">
                  <p className="text-muted-foreground">No {selectedCategory}s available yet</p>
                </div>
              )}
            </div>
          )}

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
            <div className="text-center min-h-[40vh] flex flex-col items-center justify-center glass-effect rounded-3xl p-12 border border-border/20">
              <h2 className="text-4xl md:text-5xl font-bold text-gradient mb-4">Welcome to the Gallery</h2>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Click on a category above to explore community content, or check out our events!
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Gallery;
