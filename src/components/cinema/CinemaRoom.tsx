import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ArrowLeft, Send, Mic, MicOff, Monitor, MonitorOff, Users, MessageSquare,
  Crown, Link as LinkIcon, X, Volume2, VolumeX, Maximize2, Minimize2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Room {
  id: string;
  room_number: number;
  name: string;
  created_by: string;
  created_by_username: string | null;
  embed_url: string | null;
}

interface Member {
  id: string;
  room_id: string;
  user_id: string;
  discord_username: string | null;
  discord_avatar: string | null;
  is_muted: boolean;
  is_sharing_screen: boolean;
}

interface Message {
  id: string;
  user_id: string;
  discord_username: string | null;
  discord_avatar: string | null;
  message: string;
  message_type: string;
  created_at: string;
}

interface CinemaRoomProps {
  room: Room;
  user: any;
  onLeave: () => void;
  onEnd: () => void;
}

const CinemaRoom = ({ room, user, onLeave, onEnd }: CinemaRoomProps) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isMuted, setIsMuted] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [showMembers, setShowMembers] = useState(false);
  const [embedUrl, setEmbedUrl] = useState("");
  const [showEmbedInput, setShowEmbedInput] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const isCreator = user?.id === room.created_by;

  const fetchMembers = useCallback(async () => {
    const { data } = await supabase
      .from("cinema_room_members")
      .select("*")
      .eq("room_id", room.id);
    if (data) setMembers(data);
  }, [room.id]);

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from("cinema_room_messages")
      .select("*")
      .eq("room_id", room.id)
      .order("created_at", { ascending: true })
      .limit(200);
    if (data) setMessages(data);
  }, [room.id]);

  useEffect(() => {
    fetchMembers();
    fetchMessages();

    const channel = supabase
      .channel(`cinema-room-${room.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "cinema_room_members", filter: `room_id=eq.${room.id}` }, () => fetchMembers())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "cinema_room_messages", filter: `room_id=eq.${room.id}` }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      // Cleanup media streams
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [room.id, fetchMembers, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const username = user.user_metadata?.display_name || user.user_metadata?.username || "Unknown";
    const avatar = user.user_metadata?.avatar_url || user.user_metadata?.discord_avatar;

    // Check if it's an embed link
    const isEmbed = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be|twitch\.tv|vimeo\.com)/.test(newMessage.trim());

    await supabase.from("cinema_room_messages").insert({
      room_id: room.id,
      user_id: user.id,
      discord_username: username,
      discord_avatar: avatar,
      message: newMessage.trim(),
      message_type: isEmbed ? "embed" : "text",
    });
    setNewMessage("");
  };

  const toggleMic = async () => {
    if (isMuted) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = stream;
        setIsMuted(false);
        await supabase.from("cinema_room_members").update({ is_muted: false }).eq("room_id", room.id).eq("user_id", user.id);
      } catch {
        // Mic access denied
      }
    } else {
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
      setIsMuted(true);
      await supabase.from("cinema_room_members").update({ is_muted: true }).eq("room_id", room.id).eq("user_id", user.id);
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        screenStreamRef.current = stream;
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
        }
        setIsScreenSharing(true);
        await supabase.from("cinema_room_members").update({ is_sharing_screen: true }).eq("room_id", room.id).eq("user_id", user.id);

        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          supabase.from("cinema_room_members").update({ is_sharing_screen: false }).eq("room_id", room.id).eq("user_id", user.id);
        };
      } catch {
        // Screen share denied
      }
    } else {
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
      setIsScreenSharing(false);
      await supabase.from("cinema_room_members").update({ is_sharing_screen: false }).eq("room_id", room.id).eq("user_id", user.id);
    }
  };

  const getEmbedUrl = (url: string) => {
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
    // Twitch
    const twitchMatch = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/);
    if (twitchMatch) return `https://player.twitch.tv/?channel=${twitchMatch[1]}&parent=${window.location.hostname}`;
    return null;
  };

  const shareEmbed = async () => {
    if (!embedUrl.trim()) return;
    const embedSrc = getEmbedUrl(embedUrl.trim());
    if (embedSrc) {
      await supabase.from("cinema_rooms").update({ embed_url: embedSrc }).eq("id", room.id);
    }
    const username = user.user_metadata?.display_name || user.user_metadata?.username || "Unknown";
    const avatar = user.user_metadata?.avatar_url || user.user_metadata?.discord_avatar;
    await supabase.from("cinema_room_messages").insert({
      room_id: room.id,
      user_id: user.id,
      discord_username: username,
      discord_avatar: avatar,
      message: embedUrl.trim(),
      message_type: "embed",
    });
    setEmbedUrl("");
    setShowEmbedInput(false);
  };

  const screenSharer = members.find(m => m.is_sharing_screen);

  return (
    <div className={`h-screen flex flex-col bg-background ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-card/80 backdrop-blur border-b border-border/50 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onLeave} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                #{String(room.room_number).padStart(2, "0")}
              </span>
              <h2 className="font-bold text-sm md:text-base truncate max-w-[200px]">{room.name}</h2>
            </div>
            <p className="text-[10px] text-muted-foreground">{members.length} members connected</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => setShowMembers(!showMembers)} className="relative">
                <Users className="w-4 h-4" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-[9px] flex items-center justify-center font-bold">
                  {members.length}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Members</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => setShowChat(!showChat)}>
                <MessageSquare className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Chat</TooltipContent>
          </Tooltip>
          <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)}>
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          {isCreator && (
            <Button variant="destructive" size="sm" onClick={onEnd} className="text-xs ml-2">
              End Room
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Stage */}
        <div className="flex-1 flex flex-col relative">
          {/* Screen Share / Embed Area */}
          <div className="flex-1 bg-black/50 flex items-center justify-center relative">
            {isScreenSharing ? (
              <video
                ref={screenVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />
            ) : screenSharer ? (
              <div className="text-center space-y-3">
                <Monitor className="w-16 h-16 mx-auto text-primary animate-pulse" />
                <p className="text-lg font-semibold">
                  {screenSharer.discord_username} is sharing their screen
                </p>
                <p className="text-sm text-muted-foreground">
                  Screen sharing is peer-to-peer. You'll see the stream when connected.
                </p>
              </div>
            ) : room.embed_url ? (
              <iframe
                src={room.embed_url}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="text-center space-y-4 p-8">
                <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <Monitor className="w-12 h-12 text-primary/50" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-muted-foreground">No content playing</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Share your screen or paste a YouTube/Twitch link
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" size="sm" onClick={toggleScreenShare} className="gap-1.5">
                    <Monitor className="w-4 h-4" /> Share Screen
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowEmbedInput(true)} className="gap-1.5">
                    <LinkIcon className="w-4 h-4" /> Paste Link
                  </Button>
                </div>
              </div>
            )}

            {/* Embed URL Input */}
            <AnimatePresence>
              {showEmbedInput && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-4 left-4 right-4 flex gap-2"
                >
                  <Input
                    placeholder="Paste YouTube or Twitch URL..."
                    value={embedUrl}
                    onChange={(e) => setEmbedUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && shareEmbed()}
                    className="bg-card/90 backdrop-blur"
                  />
                  <Button onClick={shareEmbed} size="icon" disabled={!embedUrl.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setShowEmbedInput(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Controls */}
          <div className="flex items-center justify-center gap-3 py-3 px-4 bg-card/80 backdrop-blur border-t border-border/50">
            <Button
              variant={isMuted ? "outline" : "default"}
              size="icon"
              onClick={toggleMic}
              className={`rounded-full w-12 h-12 ${!isMuted ? 'bg-green-600 hover:bg-green-700' : ''}`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
            <Button
              variant={isScreenSharing ? "default" : "outline"}
              size="icon"
              onClick={toggleScreenShare}
              className={`rounded-full w-12 h-12 ${isScreenSharing ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
            >
              {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowEmbedInput(!showEmbedInput)}
              className="rounded-full w-12 h-12"
            >
              <LinkIcon className="w-5 h-5" />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={onLeave}
              className="rounded-full w-12 h-12"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Members Panel */}
        <AnimatePresence>
          {showMembers && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 220, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-border/50 bg-card/50 overflow-hidden shrink-0"
            >
              <div className="p-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  In Room — {members.length}
                </h3>
                <div className="space-y-2">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent/50">
                      <div className="relative">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={m.discord_avatar || undefined} />
                          <AvatarFallback className="text-xs bg-primary/20">
                            {(m.discord_username || "?")[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${m.is_muted ? 'bg-red-500' : 'bg-green-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate flex items-center gap-1">
                          {m.discord_username || "Unknown"}
                          {m.user_id === room.created_by && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                        </p>
                        <div className="flex items-center gap-1">
                          {!m.is_muted && <Volume2 className="w-2.5 h-2.5 text-green-400" />}
                          {m.is_muted && <VolumeX className="w-2.5 h-2.5 text-muted-foreground" />}
                          {m.is_sharing_screen && (
                            <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5">
                              <Monitor className="w-2 h-2 mr-0.5" /> Live
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Panel */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-border/50 bg-card/30 flex flex-col overflow-hidden shrink-0"
            >
              <div className="p-3 border-b border-border/50">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Chat</h3>
              </div>

              <ScrollArea className="flex-1 p-3">
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const isMine = msg.user_id === user?.id;
                    const embedSrc = msg.message_type === "embed" ? getEmbedUrl(msg.message) : null;

                    return (
                      <div key={msg.id} className={`flex gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
                        <Avatar className="w-6 h-6 shrink-0 mt-0.5">
                          <AvatarImage src={msg.discord_avatar || undefined} />
                          <AvatarFallback className="text-[9px] bg-primary/20">
                            {(msg.discord_username || "?")[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`max-w-[85%] ${isMine ? 'text-right' : ''}`}>
                          <p className="text-[10px] text-muted-foreground mb-0.5">
                            {msg.discord_username || "Unknown"}
                          </p>
                          {embedSrc ? (
                            <div className="rounded-lg overflow-hidden border border-border/50 bg-black/30">
                              <p className="text-[10px] text-blue-400 p-1.5 truncate">{msg.message}</p>
                            </div>
                          ) : (
                            <div className={`px-3 py-1.5 rounded-2xl text-sm ${isMine ? 'bg-primary text-primary-foreground' : 'bg-accent/50'}`}>
                              {msg.message}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="p-3 border-t border-border/50">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    className="text-sm h-9"
                  />
                  <Button size="icon" onClick={sendMessage} disabled={!newMessage.trim()} className="h-9 w-9 shrink-0">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Helper to convert URLs to embed format
const getEmbedUrl = (url: string) => {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
  const twitchMatch = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/);
  if (twitchMatch) return `https://player.twitch.tv/?channel=${twitchMatch[1]}&parent=${window.location.hostname}`;
  return null;
};

export default CinemaRoom;
