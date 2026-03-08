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
  Crown, Link as LinkIcon, X, Volume2, VolumeX, Maximize2, Minimize2, Wifi, WifiOff
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWebRTC } from "@/hooks/useWebRTC";

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

const getEmbedUrl = (url: string) => {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
  const twitchMatch = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/);
  if (twitchMatch) return `https://player.twitch.tv/?channel=${twitchMatch[1]}&parent=${window.location.hostname}`;
  return null;
};

const CinemaRoom = ({ room, user, onLeave, onEnd }: CinemaRoomProps) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showChat, setShowChat] = useState(true);
  const [showMembers, setShowMembers] = useState(false);
  const [embedUrl, setEmbedUrl] = useState("");
  const [showEmbedInput, setShowEmbedInput] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentEmbed, setCurrentEmbed] = useState<string | null>(room.embed_url);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const isCreator = user?.id === room.created_by;
  const username = user?.user_metadata?.display_name || user?.user_metadata?.username || "Unknown";

  const {
    joinSignaling,
    leaveSignaling,
    toggleMic,
    toggleScreen,
    isMicOn,
    isScreenOn,
    remoteScreenStream,
    remoteScreenUser,
    connectedPeers,
    localScreenStream,
  } = useWebRTC(room.id, user?.id || "", username);

  // Join WebRTC signaling on mount
  useEffect(() => {
    if (user?.id) {
      joinSignaling();
    }
    return () => {
      leaveSignaling();
    };
  }, [user?.id]);

  // Attach remote screen stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteScreenStream) {
      remoteVideoRef.current.srcObject = remoteScreenStream;
    }
  }, [remoteScreenStream]);

  // Attach local screen stream to video element
  useEffect(() => {
    if (localVideoRef.current && localScreenStream) {
      localVideoRef.current.srcObject = localScreenStream;
    }
  }, [localScreenStream]);

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
      .channel(`cinema-room-data-${room.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "cinema_room_members", filter: `room_id=eq.${room.id}` }, () => fetchMembers())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "cinema_room_messages", filter: `room_id=eq.${room.id}` }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "cinema_rooms", filter: `id=eq.${room.id}` }, (payload: any) => {
        if (payload.new?.embed_url) {
          setCurrentEmbed(payload.new.embed_url);
        }
        if (payload.new?.is_active === false) {
          onLeave();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [room.id, fetchMembers, fetchMessages, onLeave]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const avatar = user.user_metadata?.avatar_url || user.user_metadata?.discord_avatar;
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

  const shareEmbed = async () => {
    if (!embedUrl.trim()) return;
    const embedSrc = getEmbedUrl(embedUrl.trim());
    if (embedSrc) {
      await supabase.from("cinema_rooms").update({ embed_url: embedSrc }).eq("id", room.id);
      setCurrentEmbed(embedSrc);
    }
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

  const handleLeave = async () => {
    leaveSignaling();
    onLeave();
  };

  const handleEnd = async () => {
    leaveSignaling();
    onEnd();
  };

  const screenSharer = members.find(m => m.is_sharing_screen && m.user_id !== user?.id);

  return (
    <div className={`h-screen flex flex-col bg-background ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-card/80 backdrop-blur border-b border-border/50 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleLeave} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                #{String(room.room_number).padStart(2, "0")}
              </span>
              <h2 className="font-bold text-sm md:text-base truncate max-w-[200px]">{room.name}</h2>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-muted-foreground">{members.length} members</span>
              <span className="text-[10px] flex items-center gap-1">
                {connectedPeers.length > 0 ? (
                  <><Wifi className="w-2.5 h-2.5 text-green-400" /><span className="text-green-400">{connectedPeers.length} connected</span></>
                ) : (
                  <><WifiOff className="w-2.5 h-2.5 text-muted-foreground" /><span className="text-muted-foreground">connecting...</span></>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => { setShowMembers(!showMembers); if (!showMembers) setShowChat(false); }} className="relative">
                <Users className="w-4 h-4" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-[9px] flex items-center justify-center font-bold text-primary-foreground">
                  {members.length}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Members</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => { setShowChat(!showChat); if (!showChat) setShowMembers(false); }}>
                <MessageSquare className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Chat</TooltipContent>
          </Tooltip>
          <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)}>
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          {isCreator && (
            <Button variant="destructive" size="sm" onClick={handleEnd} className="text-xs ml-2">
              End Room
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Stage */}
        <div className="flex-1 flex flex-col relative min-w-0">
          {/* Screen Share / Embed Area */}
          <div className="flex-1 bg-black/80 flex items-center justify-center relative overflow-hidden">
            {isScreenOn && localScreenStream ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />
            ) : remoteScreenStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            ) : currentEmbed ? (
              <iframe
                src={currentEmbed}
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
                    Share your screen or paste a YouTube / Twitch link
                  </p>
                </div>
                <div className="flex gap-2 justify-center flex-wrap">
                  <Button variant="outline" size="sm" onClick={toggleScreen} className="gap-1.5">
                    <Monitor className="w-4 h-4" /> Share Screen
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowEmbedInput(true)} className="gap-1.5">
                    <LinkIcon className="w-4 h-4" /> Paste Link
                  </Button>
                </div>
              </div>
            )}

            {/* Screen sharer label */}
            {(isScreenOn || remoteScreenStream) && (
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-red-500/90 text-xs font-bold text-white flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                {isScreenOn ? "You are sharing" : `${screenSharer?.discord_username || "Someone"} is sharing`}
              </div>
            )}

            {/* Embed URL Input Overlay */}
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
                    className="bg-card/95 backdrop-blur border-primary/30"
                    autoFocus
                  />
                  <Button onClick={shareEmbed} size="icon" disabled={!embedUrl.trim()} className="shrink-0">
                    <Send className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setShowEmbedInput(false)} className="shrink-0">
                    <X className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Controls */}
          <div className="flex items-center justify-center gap-3 py-3 px-4 bg-card/80 backdrop-blur border-t border-border/50">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isMicOn ? "default" : "outline"}
                  size="icon"
                  onClick={toggleMic}
                  className={`rounded-full w-12 h-12 transition-all ${isMicOn ? 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/25' : 'hover:border-green-500/50'}`}
                >
                  {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isMicOn ? "Mute Mic" : "Unmute Mic"}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isScreenOn ? "default" : "outline"}
                  size="icon"
                  onClick={toggleScreen}
                  className={`rounded-full w-12 h-12 transition-all ${isScreenOn ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25' : 'hover:border-blue-500/50'}`}
                >
                  {isScreenOn ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isScreenOn ? "Stop Sharing" : "Share Screen"}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowEmbedInput(!showEmbedInput)}
                  className="rounded-full w-12 h-12 hover:border-purple-500/50"
                >
                  <LinkIcon className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Share Video Link</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={handleLeave}
                  className="rounded-full w-12 h-12 shadow-lg shadow-red-500/25"
                >
                  <X className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Leave Room</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Side Panel: Members */}
        <AnimatePresence>
          {showMembers && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-l border-border/50 bg-card/50 overflow-hidden shrink-0"
            >
              <div className="p-3 w-[240px]">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" />
                  In Room — {members.length}
                </h3>
                <div className="space-y-1.5">
                  {members.map((m) => {
                    const isConnected = connectedPeers.includes(m.user_id) || m.user_id === user?.id;
                    return (
                      <div key={m.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="relative">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={m.discord_avatar || undefined} />
                            <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                              {(m.discord_username || "?")[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${isConnected ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate flex items-center gap-1">
                            {m.discord_username || "Unknown"}
                            {m.user_id === room.created_by && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {!m.is_muted ? (
                              <Volume2 className="w-2.5 h-2.5 text-green-400" />
                            ) : (
                              <VolumeX className="w-2.5 h-2.5 text-muted-foreground" />
                            )}
                            {m.is_sharing_screen && (
                              <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 border-blue-500/30 text-blue-400">
                                <Monitor className="w-2 h-2 mr-0.5" /> Live
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Side Panel: Chat */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-l border-border/50 bg-card/30 flex flex-col overflow-hidden shrink-0"
            >
              <div className="p-3 border-b border-border/50 w-[320px]">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Room Chat
                </h3>
              </div>

              <ScrollArea className="flex-1 p-3 w-[320px]">
                <div className="space-y-3">
                  {messages.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-8">No messages yet. Say hi! 👋</p>
                  )}
                  {messages.map((msg) => {
                    const isMine = msg.user_id === user?.id;
                    const embedSrc = msg.message_type === "embed" ? getEmbedUrl(msg.message) : null;

                    return (
                      <div key={msg.id} className={`flex gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
                        <Avatar className="w-6 h-6 shrink-0 mt-0.5">
                          <AvatarImage src={msg.discord_avatar || undefined} />
                          <AvatarFallback className="text-[9px] bg-primary/20 text-primary">
                            {(msg.discord_username || "?")[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`max-w-[85%] ${isMine ? 'text-right' : ''}`}>
                          <p className="text-[10px] text-muted-foreground mb-0.5">
                            {msg.discord_username || "Unknown"}
                          </p>
                          {embedSrc ? (
                            <div className="rounded-lg overflow-hidden border border-blue-500/20 bg-blue-500/5 p-2">
                              <p className="text-[10px] text-blue-400 truncate flex items-center gap-1">
                                <LinkIcon className="w-2.5 h-2.5 shrink-0" />
                                {msg.message}
                              </p>
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

              <div className="p-3 border-t border-border/50 w-[320px]">
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

export default CinemaRoom;
