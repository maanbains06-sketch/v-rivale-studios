import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Tv, DoorOpen, Crown, Mic, Monitor, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CinemaRoom from "@/components/cinema/CinemaRoom";
import Navigation from "@/components/Navigation";


interface Room {
  id: string;
  room_number: number;
  name: string;
  created_by: string;
  created_by_username: string | null;
  created_by_avatar: string | null;
  is_active: boolean;
  max_members: number;
  embed_url: string | null;
  created_at: string;
}

interface RoomMember {
  id: string;
  room_id: string;
  user_id: string;
  discord_username: string | null;
  discord_avatar: string | null;
  is_muted: boolean;
  is_sharing_screen: boolean;
}

const CinemaHub = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomMembers, setRoomMembers] = useState<Record<string, RoomMember[]>>({});
  const [user, setUser] = useState<any>(null);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [creating, setCreating] = useState(false);
  const [liveVisitorCount, setLiveVisitorCount] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const fetchRooms = useCallback(async () => {
    const { data } = await supabase
      .from("cinema_rooms")
      .select("*")
      .eq("is_active", true)
      .order("room_number", { ascending: true });
    if (data) setRooms(data);
  }, []);

  const fetchAllMembers = useCallback(async () => {
    const { data } = await supabase
      .from("cinema_room_members")
      .select("*");
    if (data) {
      const grouped: Record<string, RoomMember[]> = {};
      data.forEach((m: any) => {
        if (!grouped[m.room_id]) grouped[m.room_id] = [];
        grouped[m.room_id].push(m);
      });
      setRoomMembers(grouped);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
    fetchAllMembers();

    const roomChannel = supabase
      .channel("cinema-rooms-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "cinema_rooms" }, () => fetchRooms())
      .on("postgres_changes", { event: "*", schema: "public", table: "cinema_room_members" }, () => fetchAllMembers())
      .subscribe();

    return () => { supabase.removeChannel(roomChannel); };
  }, [fetchRooms, fetchAllMembers]);

  const getNextRoomNumber = () => {
    if (rooms.length === 0) return 1;
    return Math.max(...rooms.map(r => r.room_number)) + 1;
  };

  const createRoom = async () => {
    if (!user || !roomName.trim()) return;
    setCreating(true);
    const roomNumber = getNextRoomNumber();
    const username = user.user_metadata?.display_name || user.user_metadata?.username || "Unknown";
    const avatar = user.user_metadata?.avatar_url || user.user_metadata?.discord_avatar;

    const { data, error } = await supabase.from("cinema_rooms").insert({
      room_number: roomNumber,
      name: roomName.trim(),
      created_by: user.id,
      created_by_username: username,
      created_by_avatar: avatar,
    }).select().single();

    if (error) {
      toast({ title: "Error", description: "Failed to create room", variant: "destructive" });
    } else if (data) {
      // Auto-join the room
      await supabase.from("cinema_room_members").insert({
        room_id: data.id,
        user_id: user.id,
        discord_username: username,
        discord_avatar: avatar,
      });
      setActiveRoom(data);
      setCreateOpen(false);
      setRoomName("");
      toast({ title: "Room Created!", description: `Room #${String(roomNumber).padStart(2, "0")} is now live` });
    }
    setCreating(false);
  };

  const joinRoom = async (room: Room) => {
    if (!user) return;
    const username = user.user_metadata?.display_name || user.user_metadata?.username || "Unknown";
    const avatar = user.user_metadata?.avatar_url || user.user_metadata?.discord_avatar;

    await supabase.from("cinema_room_members").upsert({
      room_id: room.id,
      user_id: user.id,
      discord_username: username,
      discord_avatar: avatar,
    }, { onConflict: "room_id,user_id" });

    setActiveRoom(room);
  };

  const leaveRoom = async () => {
    if (!user || !activeRoom) return;
    await supabase.from("cinema_room_members").delete().eq("room_id", activeRoom.id).eq("user_id", user.id);
    setActiveRoom(null);
  };

  const endRoom = async (room: Room) => {
    if (!user || room.created_by !== user.id) return;
    // Delete all members first, then deactivate
    await supabase.from("cinema_room_members").delete().eq("room_id", room.id);
    await supabase.from("cinema_rooms").update({ is_active: false }).eq("id", room.id);
    if (activeRoom?.id === room.id) setActiveRoom(null);
    toast({ title: "Room Ended", description: `Room #${String(room.room_number).padStart(2, "0")} has been closed` });
  };

  if (activeRoom) {
    return <CinemaRoom room={activeRoom} user={user} onLeave={leaveRoom} onEnd={() => endRoom(activeRoom)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="relative">
              <Tv className="w-12 h-12 text-primary" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-primary via-purple-400 to-pink-500 bg-clip-text text-transparent">
              Cinema Hub
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Create rooms, watch together, voice chat, and share your screen with friends
          </p>
        </motion.div>

        {/* Create Room Button */}
        <div className="flex justify-center mb-10">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2 text-lg px-8 py-6 rounded-2xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/25">
                <Plus className="w-6 h-6" />
                Create Room
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Tv className="w-5 h-5 text-primary" />
                  Create a Cinema Room
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Input
                  placeholder="Room name (e.g. Movie Night 🎬)"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  maxLength={50}
                  onKeyDown={(e) => e.key === "Enter" && createRoom()}
                />
                <Button onClick={createRoom} disabled={creating || !roomName.trim()} className="w-full gap-2">
                  <Plus className="w-4 h-4" />
                  {creating ? "Creating..." : "Create & Join"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Room Stats */}
        <div className="flex justify-center gap-6 mb-10">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border/50">
            <Tv className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{rooms.length} Live Rooms</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border/50">
            <Users className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium">
              {Object.values(roomMembers).reduce((acc, m) => acc + m.length, 0)} Online
            </span>
          </div>
        </div>

        {/* Rooms Grid */}
        {rooms.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Tv className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-xl text-muted-foreground">No rooms yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Be the first to create a cinema room!</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {rooms.map((room, i) => {
                const members = roomMembers[room.id] || [];
                const isCreator = user?.id === room.created_by;
                const isInRoom = members.some(m => m.user_id === user?.id);

                return (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.05 }}
                    className="group relative"
                  >
                    <div className="relative rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
                      {/* Room Number Banner */}
                      <div className="relative h-24 bg-gradient-to-br from-primary/20 via-purple-500/15 to-pink-500/10 flex items-center justify-center">
                        <span className="text-5xl font-black text-primary/30 select-none">
                          #{String(room.room_number).padStart(2, "0")}
                        </span>
                        {/* Live indicator */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/20 border border-red-500/30">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Live</span>
                        </div>
                        {isCreator && (
                          <div className="absolute top-3 left-3">
                            <Crown className="w-4 h-4 text-amber-400" />
                          </div>
                        )}
                      </div>

                      {/* Room Info */}
                      <div className="p-4 space-y-3">
                        <div>
                          <h3 className="font-bold text-lg truncate">{room.name}</h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <span>by</span>
                            <span className="text-foreground/70">{room.created_by_username || "Unknown"}</span>
                          </p>
                        </div>

                        {/* Members avatars */}
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {members.slice(0, 5).map((m) => (
                              <Avatar key={m.id} className="w-7 h-7 border-2 border-card">
                                <AvatarImage src={m.discord_avatar || undefined} />
                                <AvatarFallback className="text-[10px] bg-primary/20">
                                  {(m.discord_username || "?")[0]}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {members.length > 5 && (
                              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold border-2 border-card">
                                +{members.length - 5}
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {members.length}/{room.max_members}
                          </span>
                        </div>

                        {/* Feature icons */}
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] gap-1 px-2 py-0.5">
                            <Mic className="w-3 h-3" /> Voice
                          </Badge>
                          <Badge variant="outline" className="text-[10px] gap-1 px-2 py-0.5">
                            <Monitor className="w-3 h-3" /> Screen
                          </Badge>
                          <Badge variant="outline" className="text-[10px] gap-1 px-2 py-0.5">
                            <MessageSquare className="w-3 h-3" /> Chat
                          </Badge>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 pt-1">
                          {isInRoom ? (
                            <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => setActiveRoom(room)}>
                              <DoorOpen className="w-3.5 h-3.5" /> Rejoin
                            </Button>
                          ) : (
                            <Button size="sm" className="flex-1 gap-1 bg-gradient-to-r from-primary to-purple-600" onClick={() => joinRoom(room)}>
                              <DoorOpen className="w-3.5 h-3.5" /> Join
                            </Button>
                          )}
                          {isCreator && (
                            <Button size="sm" variant="destructive" onClick={() => endRoom(room)} className="gap-1">
                              End
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
      
    </div>
  );
};

export default CinemaHub;
