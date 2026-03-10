import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft, Send, Mic, MicOff, Monitor, MonitorOff, Users, MessageSquare,
  Crown, Link as LinkIcon, X, Volume2, VolumeX, Maximize2, Minimize2, Wifi, WifiOff, Info,
  Play, Radio, Sparkles, PanelRightOpen, PanelRightClose
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const [showChat, setShowChat] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [embedUrl, setEmbedUrl] = useState("");
  const [showEmbedInput, setShowEmbedInput] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentEmbed, setCurrentEmbed] = useState<string | null>(room.embed_url);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const isCreator = user?.id === room.created_by;
  const username = user?.user_metadata?.display_name || user?.user_metadata?.username || "Unknown";
  const { toast } = useToast();
  const [showPermissionBanner, setShowPermissionBanner] = useState(true);

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
    micPermission,
    lastError,
    clearError,
  } = useWebRTC(room.id, user?.id || "", username);

  // Show error toasts
  useEffect(() => {
    if (lastError) {
      toast({ title: "Permission Required", description: lastError, variant: "destructive" });
      clearError();
    }
  }, [lastError, toast, clearError]);

  // Join WebRTC signaling on mount
  useEffect(() => {
    if (user?.id) {
      joinSignaling();
    }
    return () => {
      leaveSignaling();
    };
  }, [user?.id]);

  // Attach remote screen stream to video element with retry
  useEffect(() => {
    const video = remoteVideoRef.current;
    if (!video || !remoteScreenStream) return;
    
    video.srcObject = remoteScreenStream;
    const playVideo = () => {
      video.play().then(() => {
        console.log("[CinemaRoom] Remote video playing");
      }).catch((err) => {
        console.warn("[CinemaRoom] Remote video play failed, retrying...", err);
        setTimeout(() => video.play().catch(() => {}), 500);
      });
    };
    playVideo();
    
    // Also try playing when tracks are added
    remoteScreenStream.onaddtrack = () => playVideo();
  }, [remoteScreenStream]);

  // Attach local screen stream to video element
  useEffect(() => {
    const video = localVideoRef.current;
    if (!video || !localScreenStream) return;
    
    video.srcObject = localScreenStream;
    video.play().catch(() => {});
  }, [localScreenStream]);

  // On mobile, default to no chat shown; on desktop show chat
  useEffect(() => {
    setShowChat(!isMobile);
  }, [isMobile]);

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

  const getDiscordAvatarUrl = () => {
    const meta = user?.user_metadata || {};
    const discordId = meta.discord_id || meta.provider_id || meta.sub;
    if (discordId && meta.discord_avatar) {
      return `https://cdn.discordapp.com/avatars/${discordId}/${meta.discord_avatar}.png?size=256`;
    }
    return meta.avatar_url || null;
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const avatar = getDiscordAvatarUrl();
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
    const avatar = getDiscordAvatarUrl();
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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {
        // Fallback for mobile
        setIsFullscreen(!isFullscreen);
      });
    } else if (document.fullscreenElement) {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    } else {
      setIsFullscreen(!isFullscreen);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const screenSharer = members.find(m => m.is_sharing_screen && m.user_id !== user?.id);
  const hasVideo = isScreenOn || remoteScreenStream || currentEmbed;
  const showSidePanel = showChat || showMembers;
  const sidePanelWidth = isMobile ? "100%" : 320;

  return (
    <div 
      ref={containerRef}
      className={`h-screen flex flex-col bg-background ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-3 md:px-4 py-2 bg-card/80 backdrop-blur border-b border-border/30 shrink-0">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={handleLeave} className="shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] md:text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                #{String(room.room_number).padStart(2, "0")}
              </span>
              <h2 className="font-bold text-xs md:text-sm truncate max-w-[120px] md:max-w-[200px] text-foreground">{room.name}</h2>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] md:text-[10px] text-muted-foreground flex items-center gap-1">
                <Users className="w-2.5 h-2.5" /> {members.length}
              </span>
              <span className="text-[9px] md:text-[10px] flex items-center gap-1">
                {connectedPeers.length > 0 ? (
                  <><Wifi className="w-2.5 h-2.5 text-emerald-500" /><span className="text-emerald-500">{connectedPeers.length}</span></>
                ) : (
                  <><WifiOff className="w-2.5 h-2.5 text-muted-foreground" /><span className="text-muted-foreground">...</span></>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => { setShowMembers(!showMembers); if (!showMembers) setShowChat(false); }} className="relative h-8 w-8">
                <Users className="w-4 h-4" />
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-primary text-[8px] flex items-center justify-center font-bold text-primary-foreground">
                  {members.length}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Members</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => { setShowChat(!showChat); if (!showChat) setShowMembers(false); }} className="h-8 w-8">
                {showChat ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{showChat ? "Hide Chat" : "Show Chat"}</TooltipContent>
          </Tooltip>
          {hasVideo && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => setIsTheaterMode(!isTheaterMode)} className="h-8 w-8">
                  {isTheaterMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isTheaterMode ? "Normal View" : "Theater Mode"}</TooltipContent>
            </Tooltip>
          )}
          <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="h-8 w-8 hidden md:flex">
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          {isCreator && (
            <Button variant="destructive" size="sm" onClick={handleEnd} className="text-[10px] md:text-xs ml-1 h-7 px-2 md:px-3 rounded-lg">
              End
            </Button>
          )}
        </div>
      </div>

      {/* Permission Banner */}
      <AnimatePresence>
        {showPermissionBanner && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden shrink-0"
          >
            <Alert className="rounded-none border-x-0 border-t-0 bg-primary/5 border-primary/10">
              <Info className="w-4 h-4 text-primary" />
              <AlertDescription className="text-[10px] md:text-xs flex items-center justify-between gap-2">
                <span>
                  <strong>Voice & Screen:</strong> Allow browser permissions when prompted.
                </span>
                <Button variant="ghost" size="sm" onClick={() => setShowPermissionBanner(false)} className="shrink-0 h-6 text-[10px] md:text-xs">
                  Got it
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`flex-1 flex ${isMobile ? 'flex-col' : 'flex-row'} overflow-hidden relative`}>
        {/* Main Stage */}
        <div className={`flex flex-col min-w-0 ${
          isMobile 
            ? (showSidePanel && !isTheaterMode ? 'h-[45%]' : 'flex-1') 
            : 'flex-1'
        } ${isTheaterMode && !isMobile ? 'w-full' : ''}`}>
          {/* Screen Share / Embed Area */}
          <div className="flex-1 bg-gradient-to-b from-card/50 to-background flex items-center justify-center relative overflow-hidden">
            {isScreenOn && localScreenStream ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain bg-black"
              />
            ) : remoteScreenStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain bg-black"
              />
            ) : currentEmbed ? (
              <iframe
                src={currentEmbed}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="text-center space-y-4 md:space-y-6 p-4 md:p-8">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="relative"
                >
                  <div className="w-20 h-20 md:w-28 md:h-28 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 via-purple-500/10 to-pink-500/10 flex items-center justify-center border border-border/30 backdrop-blur-sm">
                    <Play className="w-8 h-8 md:w-12 md:h-12 text-primary/60" />
                  </div>
                  <div className="absolute -top-2 -right-2">
                    <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-amber-400/60" />
                  </div>
                </motion.div>
                <div>
                  <p className="text-sm md:text-lg font-semibold text-foreground/70">No content playing</p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">
                    Share your screen or paste a link
                  </p>
                </div>
                <div className="flex gap-2 md:gap-3 justify-center flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleScreen}
                    className="gap-1.5 rounded-xl text-xs md:text-sm"
                  >
                    <Monitor className="w-3.5 h-3.5 text-primary" /> Share Screen
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEmbedInput(true)}
                    className="gap-1.5 rounded-xl text-xs md:text-sm"
                  >
                    <LinkIcon className="w-3.5 h-3.5 text-purple-400" /> Paste Link
                  </Button>
                </div>
              </div>
            )}

            {/* Screen sharer label */}
            {(isScreenOn || remoteScreenStream) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-destructive/90 backdrop-blur text-[10px] md:text-xs font-bold text-destructive-foreground flex items-center gap-1.5 shadow-lg"
              >
                <Radio className="w-2.5 h-2.5 md:w-3 md:h-3 animate-pulse" />
                {isScreenOn ? "You are sharing" : `${screenSharer?.discord_username || "Someone"} is sharing`}
              </motion.div>
            )}

            {/* Embed URL Input Overlay */}
            <AnimatePresence>
              {showEmbedInput && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-3 left-3 right-3 flex gap-2"
                >
                  <Input
                    placeholder="Paste YouTube or Twitch URL..."
                    value={embedUrl}
                    onChange={(e) => setEmbedUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && shareEmbed()}
                    className="bg-card/95 backdrop-blur border-primary/20 text-sm"
                    autoFocus
                  />
                  <Button onClick={shareEmbed} size="icon" disabled={!embedUrl.trim()} className="shrink-0 rounded-lg h-9 w-9">
                    <Send className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setShowEmbedInput(false)} className="shrink-0 h-9 w-9">
                    <X className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Controls */}
          <div className="flex items-center justify-center gap-2 md:gap-3 py-2.5 md:py-3.5 px-3 md:px-4 bg-card/60 backdrop-blur border-t border-border/20">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  onClick={toggleMic}
                  className={`rounded-full w-10 h-10 md:w-12 md:h-12 transition-all duration-300 border-2 ${isMicOn ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-muted/50 text-foreground border-border hover:bg-muted'}`}
                >
                  {isMicOn ? <Mic className="w-4 h-4 md:w-5 md:h-5" /> : <MicOff className="w-4 h-4 md:w-5 md:h-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isMicOn ? "Mute Mic" : "Unmute Mic"}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  onClick={toggleScreen}
                  className={`rounded-full w-10 h-10 md:w-12 md:h-12 transition-all duration-300 border-2 ${isScreenOn ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500 shadow-lg shadow-blue-500/30' : 'bg-muted/50 text-foreground border-border hover:bg-muted'}`}
                >
                  {isScreenOn ? <MonitorOff className="w-4 h-4 md:w-5 md:h-5" /> : <Monitor className="w-4 h-4 md:w-5 md:h-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isScreenOn ? "Stop Sharing" : "Share Screen"}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  onClick={() => setShowEmbedInput(!showEmbedInput)}
                  className="rounded-full w-10 h-10 md:w-12 md:h-12 bg-muted/50 text-foreground border-2 border-border hover:bg-muted transition-all duration-300"
                >
                  <LinkIcon className="w-4 h-4 md:w-5 md:h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Share Video Link</TooltipContent>
            </Tooltip>

            {/* Mobile-only chat toggle in controls */}
            {isMobile && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    onClick={() => { setShowChat(!showChat); setShowMembers(false); }}
                    className={`rounded-full w-10 h-10 transition-all duration-300 border-2 ${showChat ? 'bg-primary hover:bg-primary/80 text-primary-foreground border-primary' : 'bg-muted/50 text-foreground border-border hover:bg-muted'}`}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{showChat ? "Hide Chat" : "Show Chat"}</TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  onClick={handleLeave}
                  className="rounded-full w-10 h-10 md:w-12 md:h-12 bg-destructive text-destructive-foreground border-2 border-destructive hover:bg-destructive/80 shadow-lg transition-all duration-300"
                >
                  <X className="w-4 h-4 md:w-5 md:h-5" />
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
              initial={isMobile ? { height: 0, opacity: 0 } : { width: 0, opacity: 0 }}
              animate={isMobile ? { height: "55%", opacity: 1 } : { width: sidePanelWidth, opacity: 1 }}
              exit={isMobile ? { height: 0, opacity: 0 } : { width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`${isMobile ? '' : 'border-l'} border-border/20 bg-card/50 backdrop-blur overflow-hidden shrink-0`}
            >
              <div className={`p-4 ${isMobile ? 'w-full' : 'w-[320px]'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    In Room — {members.length}
                  </h3>
                  {isMobile && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowMembers(false)}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
                <ScrollArea className={isMobile ? "h-[calc(100%-40px)]" : "h-[calc(100vh-200px)]"}>
                  <div className="space-y-1">
                    {members.map((m) => {
                      const isConnected = connectedPeers.includes(m.user_id) || m.user_id === user?.id;
                      return (
                        <div key={m.id} className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-muted/50 transition-colors">
                          <div className="relative">
                            <Avatar className="w-8 h-8 border border-border/30">
                              <AvatarImage src={m.discord_avatar || undefined} />
                              <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                                {(m.discord_username || "?")[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${isConnected ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate flex items-center gap-1">
                              {m.discord_username || "Unknown"}
                              {m.user_id === room.created_by && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {!m.is_muted ? (
                                <Volume2 className="w-2.5 h-2.5 text-emerald-400" />
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
                </ScrollArea>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Side Panel: Chat */}
        <AnimatePresence>
          {showChat && !isTheaterMode && (
            <motion.div
              initial={isMobile ? { height: 0, opacity: 0 } : { width: 0, opacity: 0 }}
              animate={isMobile ? { height: "55%", opacity: 1 } : { width: sidePanelWidth, opacity: 1 }}
              exit={isMobile ? { height: 0, opacity: 0 } : { width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`${isMobile ? '' : 'border-l'} border-border/20 bg-card/30 backdrop-blur flex flex-col overflow-hidden shrink-0`}
            >
              <div className={`p-3 border-b border-border/20 ${isMobile ? 'w-full' : 'w-[320px]'} flex items-center justify-between`}>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-primary" />
                  Room Chat
                </h3>
                {isMobile && (
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowChat(false)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>

              <ScrollArea className={`flex-1 p-3 ${isMobile ? 'w-full' : 'w-[320px]'}`}>
                <div className="space-y-3">
                  {messages.length === 0 && (
                    <div className="text-center py-8 md:py-12">
                      <MessageSquare className="w-6 h-6 md:w-8 md:h-8 mx-auto text-muted-foreground/20 mb-2" />
                      <p className="text-[10px] md:text-xs text-muted-foreground">No messages yet. Say hi! 👋</p>
                    </div>
                  )}
                  {messages.map((msg) => {
                    const isMine = msg.user_id === user?.id;
                    const embedSrc = msg.message_type === "embed" ? getEmbedUrl(msg.message) : null;

                    return (
                      <div key={msg.id} className={`flex gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
                        <Avatar className="w-6 h-6 shrink-0 mt-0.5 border border-border/20">
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
                            <div className="rounded-xl overflow-hidden border border-blue-500/15 bg-blue-500/5 p-2.5">
                              <p className="text-[10px] text-blue-400 truncate flex items-center gap-1">
                                <LinkIcon className="w-2.5 h-2.5 shrink-0" />
                                {msg.message}
                              </p>
                            </div>
                          ) : (
                            <div className={`px-3 py-2 rounded-2xl text-xs md:text-sm ${isMine ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted/50 rounded-bl-md'}`}>
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

              <div className={`p-3 border-t border-border/20 ${isMobile ? 'w-full' : 'w-[320px]'}`}>
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    className="text-xs md:text-sm h-9 bg-muted/30 border-border/20 placeholder:text-muted-foreground"
                  />
                  <Button size="icon" onClick={sendMessage} disabled={!newMessage.trim()} className="h-9 w-9 shrink-0 rounded-lg">
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
