import { useState } from "react";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Image, Video, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MediaItem {
  id: number;
  type: "image" | "video";
  category: "screenshots" | "videos" | "community";
  url: string;
  thumbnail: string;
  title: string;
  author: string;
}

const mediaItems: MediaItem[] = [
  {
    id: 1,
    type: "image",
    category: "screenshots",
    url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800",
    thumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400",
    title: "Downtown Los Santos",
    author: "PlayerOne"
  },
  {
    id: 2,
    type: "image",
    category: "screenshots",
    url: "https://images.unsplash.com/photo-1493238792000-8113da705763?w=800",
    thumbnail: "https://images.unsplash.com/photo-1493238792000-8113da705763?w=400",
    title: "Police Chase",
    author: "Officer_Mike"
  },
  {
    id: 3,
    type: "image",
    category: "screenshots",
    url: "https://images.unsplash.com/photo-1542282088-fe8426682b8f?w=800",
    thumbnail: "https://images.unsplash.com/photo-1542282088-fe8426682b8f?w=400",
    title: "Sunset Drive",
    author: "RacerX"
  },
  {
    id: 4,
    type: "image",
    category: "community",
    url: "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=800",
    thumbnail: "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=400",
    title: "Community Event",
    author: "EventTeam"
  },
  {
    id: 5,
    type: "image",
    category: "screenshots",
    url: "https://images.unsplash.com/photo-1533136251085-f6c290db6e78?w=800",
    thumbnail: "https://images.unsplash.com/photo-1533136251085-f6c290db6e78?w=400",
    title: "Gang Territory",
    author: "GangLeader"
  },
  {
    id: 6,
    type: "image",
    category: "community",
    url: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800",
    thumbnail: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400",
    title: "Car Meet",
    author: "CarCrew"
  },
  {
    id: 7,
    type: "image",
    category: "screenshots",
    url: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800",
    thumbnail: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400",
    title: "Nightlife",
    author: "DJNight"
  },
  {
    id: 8,
    type: "image",
    category: "screenshots",
    url: "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?w=800",
    thumbnail: "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?w=400",
    title: "Business District",
    author: "CEOLife"
  },
];

const Gallery = () => {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const filteredMedia = activeTab === "all" 
    ? mediaItems 
    : mediaItems.filter(item => item.category === activeTab);

  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gradient mb-4">Media Gallery</h1>
            <p className="text-xl text-muted-foreground">
              Explore moments captured by our community
            </p>
          </div>

          <Tabs defaultValue="all" className="mb-8" onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4">
              <TabsTrigger value="all" className="gap-2">
                <Image className="w-4 h-4" />
                All
              </TabsTrigger>
              <TabsTrigger value="screenshots" className="gap-2">
                <Image className="w-4 h-4" />
                Screenshots
              </TabsTrigger>
              <TabsTrigger value="videos" className="gap-2">
                <Video className="w-4 h-4" />
                Videos
              </TabsTrigger>
              <TabsTrigger value="community" className="gap-2">
                <Users className="w-4 h-4" />
                Community
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredMedia.map((item) => (
                  <Card 
                    key={item.id}
                    className="glass-effect border-border/20 overflow-hidden cursor-pointer group hover:border-primary/40 transition-all duration-300"
                    onClick={() => setSelectedMedia(item)}
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <img 
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                          <p className="text-xs text-muted-foreground">by {item.author}</p>
                        </div>
                      </div>
                      {item.type === "video" && (
                        <div className="absolute top-2 right-2 bg-background/80 rounded-full p-2">
                          <Video className="w-4 h-4 text-primary" />
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
            <DialogContent className="max-w-5xl p-0 overflow-hidden bg-background/95 backdrop-blur">
              {selectedMedia && (
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 z-10 bg-background/80 hover:bg-background"
                    onClick={() => setSelectedMedia(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <img 
                    src={selectedMedia.url}
                    alt={selectedMedia.title}
                    className="w-full h-auto"
                  />
                  <div className="p-6 border-t border-border/20">
                    <h2 className="text-2xl font-bold mb-2">{selectedMedia.title}</h2>
                    <p className="text-muted-foreground">Captured by {selectedMedia.author}</p>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
};

export default Gallery;
