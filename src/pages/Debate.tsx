import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDiscordNames } from "@/hooks/useDiscordNames";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Mic, MicOff, Headphones, Send, Users, Clock, MessageSquare, 
  Radio, Zap, Volume2, ChevronRight, Crown, Eye, Monitor, MonitorOff, Square,
  Hand, UserCheck, UserMinus, ArrowUpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, differenceInSeconds } from "date-fns";

interface Debate {
  id: string;
  title: string;
  description: string | null;
  topic: string;
  image_url: string | null;
  status: string;
  starts_at: string;
  ends_at: string;
  max_participants: number | null;
  created_at: string;
}

interface Participant {
  id: string;
  debate_id: string;
  user_id: string;
  discord_id: string | null;
  discord_username: string | null;
  discord_avatar: string | null;
  role: string;
  joined_at: string;
}

interface DebateMessage {
  id: string;
  debate_id: string;
  user_id: string;
  discord_id: string | null;
  discord_username: string | null;
  discord_avatar: string | null;
  message: string;
  message_type: string;
  created_at: string;
}

const CountdownTimer = ({ endsAt, onExpired }: { endsAt: string; onExpired?: () => void }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const expiredRef = useRef(false);

  useEffect(() => {
    expiredRef.current = false;
    const update = () => {
      const diff = differenceInSeconds(new Date(endsAt), new Date());
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        if (!expiredRef.current) {
          expiredRef.current = true;
          onExpired?.();
        }
        return;
      }
      setTimeLeft({
        hours: Math.floor(diff / 3600),
        minutes: Math.floor((diff % 3600) / 60),
        seconds: diff % 60,
      });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endsAt, onExpired]);

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="flex items-center gap-1">
      {[
        { label: "HRS", value: pad(timeLeft.hours) },
        { label: "MIN", value: pad(timeLeft.minutes) },
        { label: "SEC", value: pad(timeLeft.seconds) },
      ].map((item, i) => (
        <div key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-primary text-2xl font-bold animate-pulse">:</span>}
          <div className="flex flex-col items-center">
            <div className="bg-gradient-to-b from-primary/30 to-primary/10 border border-primary/40 rounded-lg px-3 py-2 min-w-[52px] text-center shadow-[0_0_15px_hsl(var(--primary)/0.3)]">
              <span className="text-2xl md:text-3xl font-mono font-bold text-primary tabular-nums">
                {item.value}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground mt-1 tracking-widest">{item.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Audio Visualizer that reacts to actual mic input
const AudioVisualizer = ({ isMuted, isLive }: { isMuted: boolean; isLive: boolean }) => {
  const [levels, setLevels] = useState<number[]>(Array(32).fill(4));
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!isLive || isMuted) {
      setLevels(Array(32).fill(4));
      // Cleanup stream if muted
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      analyserRef.current = null;
      return;
    }

    let cancelled = false;

    const startMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        const ctx = new AudioContext();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          if (cancelled) return;
          analyser.getByteFrequencyData(dataArray);
          const newLevels = Array.from({ length: 32 }, (_, i) => {
            const val = dataArray[i] || 0;
            return Math.max(4, (val / 255) * 48);
          });
          setLevels(newLevels);
          animFrameRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        // Mic denied - show flat bars
        setLevels(Array(32).fill(4));
      }
    };

    startMic();

    return () => {
      cancelled = true;
      cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      analyserRef.current = null;
    };
  }, [isMuted, isLive]);

  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {levels.map((h, i) => (
        <motion.div
          key={i}
          className="w-1 bg-primary/60 rounded-full"
          animate={{ height: h }}
          transition={{ duration: 0.1, ease: "easeOut" }}
        />
      ))}
    </div>
  );
};

const DebatePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [debates, setDebates] = useState<Debate[]>([]);
  const [activeDebate, setActiveDebate] = useState<Debate | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState<any>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [debateEnded, setDebateEnded] = useState(false);
  const [speakRequests, setSpeakRequests] = useState<Participant[]>([]);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Collect discord IDs for name resolution
  const participantDiscordIds = participants
    .map(p => p.discord_id)
    .filter((id): id is string => !!id);
  const messageDiscordIds = messages
    .map(m => m.discord_id)
    .filter((id): id is string => !!id);
  const allDiscordIds = [...new Set([...participantDiscordIds, ...messageDiscordIds])];
  const { getDisplayName, getAvatar } = useDiscordNames(allDiscordIds);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const loadDebates = useCallback(async () => {
    const { data } = await supabase
      .from("debates")
      .select("*")
      .in("status", ["upcoming", "live", "ended"])
      .order("starts_at", { ascending: true });
    
    const allDebates = data || [];
    setDebates(allDebates);
    
    // Auto-select first live debate, or first upcoming
    const live = allDebates.find(d => d.status === "live");
    const upcoming = allDebates.find(d => d.status === "upcoming");
    if (live) { setActiveDebate(live); setDebateEnded(false); }
    else if (upcoming) { setActiveDebate(upcoming); setDebateEnded(false); }
    else {
      // Check if there's a recently ended debate (within last hour)
      const recentEnded = allDebates.find(d => d.status === "ended");
      if (recentEnded) { setActiveDebate(recentEnded); setDebateEnded(true); }
    }
    
    setLoading(false);
  }, []);

  const loadParticipants = useCallback(async (debateId: string) => {
    const { data } = await supabase
      .from("debate_participants")
      .select("*")
      .eq("debate_id", debateId)
      .order("joined_at", { ascending: true });
    const allParts = data || [];
    setParticipants(allParts);
    setSpeakRequests(allParts.filter(p => p.role === "requesting"));
  }, []);

  const loadMessages = useCallback(async (debateId: string) => {
    const { data } = await supabase
      .from("debate_messages")
      .select("*")
      .eq("debate_id", debateId)
      .order("created_at", { ascending: true })
      .limit(200);
    setMessages(data || []);
  }, []);

  // Check if current user is owner
  useEffect(() => {
    const checkOwner = async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u);
      if (u) {
        const discordId = u.user_metadata?.discord_id;
        if (discordId) {
          const { data: ownerSetting } = await supabase
            .from("site_settings")
            .select("value")
            .eq("key", "owner_discord_id")
            .maybeSingle();
          setIsOwner(ownerSetting?.value === discordId);
        }
      }
      await loadDebates();
    };
    checkOwner();
  }, [loadDebates]);

  // Auto-end debate when time expires
  const handleDebateExpired = useCallback(async () => {
    if (!activeDebate || activeDebate.status !== "live") return;
    
    // Update status to ended
    await supabase
      .from("debates")
      .update({ status: "ended" })
      .eq("id", activeDebate.id)
      .eq("status", "live");
    
    setActiveDebate(prev => prev ? { ...prev, status: "ended" } : null);
    setDebateEnded(true);
    setIsJoined(false);
    
    // Stop screenshare if active
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
      setIsScreenSharing(false);
    }

    // Send system message
    if (user) {
      await supabase.from("debate_messages").insert({
        debate_id: activeDebate.id,
        user_id: user.id,
        message: "⏰ Debate has ended. Thank you for joining!",
        message_type: "system",
      });
    }
  }, [activeDebate, user]);

  // Manual end debate (owner only)
  const handleEndDebate = async () => {
    if (!activeDebate || !isOwner) return;
    
    const { error } = await supabase
      .from("debates")
      .update({ status: "ended" })
      .eq("id", activeDebate.id);
    
    if (error) {
      toast({ title: "Error", description: "Failed to end debate.", variant: "destructive" });
      return;
    }

    // Send system message
    await supabase.from("debate_messages").insert({
      debate_id: activeDebate.id,
      user_id: user.id,
      message: "🛑 Debate has been ended by the host. Thank you all for participating!",
      message_type: "system",
    });

    // Remove all participants
    await supabase
      .from("debate_participants")
      .delete()
      .eq("debate_id", activeDebate.id);

    setActiveDebate(prev => prev ? { ...prev, status: "ended" } : null);
    setDebateEnded(true);
    setIsJoined(false);
    setParticipants([]);

    // Stop screenshare
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
      setIsScreenSharing(false);
    }

    toast({ title: "Debate Ended", description: "All participants have been removed." });
  };

  useEffect(() => {
    if (!activeDebate) return;
    loadParticipants(activeDebate.id);
    loadMessages(activeDebate.id);

    if (activeDebate.status === "ended") {
      setDebateEnded(true);
      setIsJoined(false);
    } else {
      setDebateEnded(false);
    }

    // Check if user already joined
    if (user && activeDebate.status === "live") {
      supabase
        .from("debate_participants")
        .select("id")
        .eq("debate_id", activeDebate.id)
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => setIsJoined(!!data));
    }

    // Realtime subscriptions
    const msgChannel = supabase
      .channel(`debate-msgs-${activeDebate.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "debate_messages", filter: `debate_id=eq.${activeDebate.id}` }, (payload) => {
        setMessages(prev => [...prev, payload.new as DebateMessage]);
      })
      .subscribe();

    const partChannel = supabase
      .channel(`debate-parts-${activeDebate.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "debate_participants", filter: `debate_id=eq.${activeDebate.id}` }, () => {
        loadParticipants(activeDebate.id);
      })
      .subscribe();

    // Listen for debate status changes
    const debateChannel = supabase
      .channel(`debate-status-${activeDebate.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "debates", filter: `id=eq.${activeDebate.id}` }, (payload) => {
        const updated = payload.new as Debate;
        setActiveDebate(updated);
        if (updated.status === "ended") {
          setDebateEnded(true);
          setIsJoined(false);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(partChannel);
      supabase.removeChannel(debateChannel);
    };
  }, [activeDebate?.id, user, loadParticipants, loadMessages]);

  const joinDebate = async () => {
    if (!user || !activeDebate) {
      toast({ title: "Login Required", description: "Please login to join the debate.", variant: "destructive" });
      return;
    }

    const discordId = user.user_metadata?.discord_id;
    const discordUsername = user.user_metadata?.username || user.user_metadata?.display_name || user.email?.split("@")[0];
    const avatarHash = user.user_metadata?.avatar;
    const discordAvatar = discordId && avatarHash 
      ? `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.png?size=128` 
      : null;

    const { error } = await supabase
      .from("debate_participants")
      .insert({
        debate_id: activeDebate.id,
        user_id: user.id,
        discord_id: discordId,
        discord_username: discordUsername,
        discord_avatar: discordAvatar,
        role: "listener",
      });

    if (error) {
      if (error.code === "23505") {
        toast({ title: "Already Joined", description: "You are already in this debate." });
      } else {
        toast({ title: "Error", description: "Failed to join debate.", variant: "destructive" });
      }
      return;
    }

    setIsJoined(true);
    toast({ title: "Joined!", description: "You are now listening to the debate." });
  };

  const leaveDebate = async () => {
    if (!user || !activeDebate) return;
    
    // Stop screenshare on leave
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
      setIsScreenSharing(false);
    }

    await supabase
      .from("debate_participants")
      .delete()
      .eq("debate_id", activeDebate.id)
      .eq("user_id", user.id);
    setIsJoined(false);
    setIsMuted(true);
    toast({ title: "Left Debate", description: "You have left the debate." });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !activeDebate || !isJoined) return;

    const discordId = user.user_metadata?.discord_id;
    const discordUsername = user.user_metadata?.username || user.user_metadata?.display_name || user.email?.split("@")[0];
    const avatarHash = user.user_metadata?.avatar;
    const discordAvatar = discordId && avatarHash 
      ? `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.png?size=128` 
      : null;

    const { error } = await supabase.from("debate_messages").insert({
      debate_id: activeDebate.id,
      user_id: user.id,
      discord_id: discordId,
      discord_username: discordUsername,
      discord_avatar: discordAvatar,
      message: newMessage.trim(),
      message_type: "chat",
    });

    if (!error) setNewMessage("");
  };

  // Request to speak (user action)
  const requestToSpeak = async () => {
    if (!user || !activeDebate || !isJoined) return;
    const myParticipant = participants.find(p => p.user_id === user.id);
    if (!myParticipant) return;
    if (myParticipant.role === "speaker" || myParticipant.role === "requesting") {
      toast({ title: "Already requested", description: "You've already requested or are speaking." });
      return;
    }

    await supabase
      .from("debate_participants")
      .update({ role: "requesting" })
      .eq("id", myParticipant.id);

    const discordUsername = user.user_metadata?.username || user.user_metadata?.display_name || "User";

    // Send system message visible to everyone
    await supabase.from("debate_messages").insert({
      debate_id: activeDebate.id,
      user_id: user.id,
      discord_id: user.user_metadata?.discord_id || null,
      discord_username: discordUsername,
      message: `🖐️ @${discordUsername} is requesting to speak`,
      message_type: "speak_request",
    });

    toast({ title: "Request Sent", description: "Your request to speak has been sent to the host." });
  };

  // Owner: promote user to speaker
  const promoteToSpeaker = async (participantId: string, participantName: string) => {
    if (!isOwner || !activeDebate) return;
    await supabase
      .from("debate_participants")
      .update({ role: "speaker" })
      .eq("id", participantId);

    await supabase.from("debate_messages").insert({
      debate_id: activeDebate.id,
      user_id: user.id,
      message: `🎤 @${participantName} has been promoted to speaker by the host`,
      message_type: "system",
    });

    toast({ title: "Promoted", description: `${participantName} is now a speaker.` });
  };

  // Owner: demote user back to listener
  const demoteToListener = async (participantId: string, participantName: string) => {
    if (!isOwner || !activeDebate) return;
    await supabase
      .from("debate_participants")
      .update({ role: "listener" })
      .eq("id", participantId);

    await supabase.from("debate_messages").insert({
      debate_id: activeDebate.id,
      user_id: user.id,
      message: `🔇 @${participantName} has been moved back to listener`,
      message_type: "system",
    });

    toast({ title: "Demoted", description: `${participantName} is now a listener.` });
  };

  // Owner: deny speak request
  const denyRequest = async (participantId: string, participantName: string) => {
    if (!isOwner || !activeDebate) return;
    await supabase
      .from("debate_participants")
      .update({ role: "listener" })
      .eq("id", participantId);

    toast({ title: "Denied", description: `${participantName}'s request was denied.` });
  };

  // Screen share
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
      toast({ title: "Screen Share Stopped" });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      screenStreamRef.current = stream;
      setIsScreenSharing(true);
      
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream;
      }

      // Handle user stopping share via browser UI
      stream.getVideoTracks()[0].onended = () => {
        screenStreamRef.current = null;
        setIsScreenSharing(false);
      };

      toast({ title: "Screen Sharing", description: "Your screen is now being shared." });
    } catch {
      toast({ title: "Screen Share Failed", description: "Could not access screen.", variant: "destructive" });
    }
  };

  // Helper to get resolved name/avatar
  const resolvedName = (discordId: string | null, fallback: string | null) => {
    if (discordId) {
      return getDisplayName(discordId) || fallback || "User";
    }
    return fallback || "User";
  };
  const resolvedAvatar = (discordId: string | null, fallback: string | null) => {
    if (discordId) {
      return getAvatar(discordId) || fallback || undefined;
    }
    return fallback || undefined;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-24 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24 pb-8 px-4">
        {/* Hero Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="relative inline-block">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-cyan-400 to-primary">
                SKYLIFE ROLEPLAY INDIA
              </span>
            </h1>
            <h2 className="text-xl md:text-2xl font-bold text-foreground/80 mt-2">
              DEBATE ARENA
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Where Lore & Justice Are Argued</p>
          </div>
        </motion.div>

        {/* Debate Ended Banner */}
        {debateEnded && activeDebate && (
          <div className="max-w-4xl mx-auto mb-8 space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
                <CardContent className="py-8 text-center">
                  <div className="text-4xl mb-3">🏁</div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">Debate Has Ended</h3>
                  <p className="text-muted-foreground mb-1">{activeDebate.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Thank you for joining! Stay tuned for the next debate.
                  </p>
                  <Badge variant="outline" className="mt-4 border-primary/50 text-primary">
                    Ended • {format(new Date(activeDebate.ends_at), "PPp")}
                  </Badge>
                </CardContent>
              </Card>
            </motion.div>

            {/* Previous Debates */}
            {debates.filter(d => d.status === "ended").length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Radio className="w-5 h-5 text-primary" />
                  Previous Debates
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {debates.filter(d => d.status === "ended").map((debate, i) => (
                    <motion.div
                      key={debate.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * i }}
                    >
                      <Card className="glass-effect border-border/20 overflow-hidden hover:border-primary/30 transition-all">
                        {debate.image_url && (
                          <div className="relative h-36 overflow-hidden">
                            <img src={debate.image_url} alt={debate.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                            <Badge variant="outline" className="absolute top-2 right-2 border-muted-foreground/40 bg-background/60 backdrop-blur-sm text-[10px]">
                              Ended
                            </Badge>
                          </div>
                        )}
                        <CardContent className={debate.image_url ? "pt-3 pb-4" : "py-4"}>
                          {!debate.image_url && (
                            <Badge variant="outline" className="border-muted-foreground/40 text-[10px] mb-2">
                              Ended
                            </Badge>
                          )}
                          <h4 className="font-bold text-foreground truncate">{debate.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{debate.topic}</p>
                          {debate.description && (
                            <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">{debate.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{format(new Date(debate.starts_at), "PP")} — {format(new Date(debate.ends_at), "PP")}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {!activeDebate ? (
          <div className="max-w-2xl mx-auto text-center">
            <Card className="glass-effect border-border/20">
              <CardContent className="py-16">
                <Radio className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-bold mb-2">No Active Debates</h3>
                <p className="text-muted-foreground">Check back soon for upcoming debates!</p>
              </CardContent>
            </Card>

            {debates.filter(d => d.status === "upcoming").length > 0 && (
              <div className="mt-8 space-y-4">
                <h3 className="text-lg font-semibold text-left">Upcoming Debates</h3>
                {debates.filter(d => d.status === "upcoming").map(debate => (
                  <Card 
                    key={debate.id} 
                    className="glass-effect border-border/20 cursor-pointer hover:border-primary/40 transition-all"
                    onClick={() => { setActiveDebate(debate); setDebateEnded(false); }}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      {debate.image_url && (
                        <img src={debate.image_url} alt="" className="w-16 h-16 rounded-lg object-cover" />
                      )}
                      <div className="flex-1 text-left">
                        <h4 className="font-bold">{debate.title}</h4>
                        <p className="text-sm text-muted-foreground">{debate.topic}</p>
                        <p className="text-xs text-primary mt-1">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {format(new Date(debate.starts_at), "PPp")}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : !debateEnded ? (
          <div className="max-w-7xl mx-auto">
            {/* Countdown Timer */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex justify-center mb-6"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-xl" />
                <div className="relative bg-background/80 backdrop-blur-xl border border-primary/30 rounded-2xl p-6 shadow-[0_0_30px_hsl(var(--primary)/0.15)]">
                  <div className="text-center mb-3">
                    <Badge variant="outline" className="border-primary/50 text-primary animate-pulse">
                      <Zap className="w-3 h-3 mr-1" />
                      {activeDebate.status === "live" ? "LIVE NOW" : "STARTS IN"}
                    </Badge>
                  </div>
                  <CountdownTimer 
                    endsAt={activeDebate.status === "live" ? activeDebate.ends_at : activeDebate.starts_at} 
                    onExpired={activeDebate.status === "live" ? handleDebateExpired : undefined}
                  />
                  {/* Owner End Debate Button */}
                  {isOwner && activeDebate.status === "live" && (
                    <div className="mt-4 text-center">
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={handleEndDebate}
                        className="gap-1"
                      >
                        <Square className="w-3 h-3" />
                        End Debate Now
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Sidebar - Featured Debates */}
              <div className="lg:col-span-3 space-y-4">
                <Card className="glass-effect border-border/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Radio className="w-4 h-4 text-primary" />
                      Featured Debates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {debates.filter(d => d.status !== "ended").map(debate => (
                      <motion.div
                        key={debate.id}
                        whileHover={{ scale: 1.02 }}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          activeDebate?.id === debate.id 
                            ? "border-primary/50 bg-primary/10" 
                            : "border-border/30 hover:border-primary/30"
                        }`}
                        onClick={() => { setActiveDebate(debate); setDebateEnded(false); }}
                      >
                        {debate.image_url && (
                          <img src={debate.image_url} alt="" className="w-full h-20 object-cover rounded-md mb-2" />
                        )}
                        <h4 className="text-sm font-semibold truncate">{debate.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{debate.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={debate.status === "live" ? "default" : "secondary"} className="text-[10px]">
                            {debate.status === "live" ? "🔴 LIVE" : "⏰ Upcoming"}
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Center - Main Debate Area */}
              <div className="lg:col-span-6 space-y-4">
                {/* Debate Info Card */}
                <Card className="glass-effect border-primary/20 overflow-hidden">
                  {activeDebate.image_url && (
                    <div className="relative h-48 overflow-hidden">
                      <img src={activeDebate.image_url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <h2 className="text-xl font-bold text-foreground">{activeDebate.title}</h2>
                        <p className="text-sm text-muted-foreground">{activeDebate.topic}</p>
                      </div>
                    </div>
                  )}
                  {!activeDebate.image_url && (
                    <CardHeader>
                      <CardTitle>{activeDebate.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{activeDebate.topic}</p>
                    </CardHeader>
                  )}
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{participants.length} participants</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Eye className="w-4 h-4" />
                          <span>{participants.filter(p => p.role === "listener").length} listening</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {isJoined ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setIsMuted(!isMuted)}
                              className={isMuted ? "border-muted-foreground/30" : "border-primary/50 text-primary"}
                            >
                              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                            </Button>
                            {activeDebate.status === "live" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={toggleScreenShare}
                                className={isScreenSharing ? "border-green-500/50 text-green-400" : "border-muted-foreground/30"}
                              >
                                {isScreenSharing ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                              </Button>
                            )}
                            <Button variant="outline" size="sm" className="border-green-500/30 text-green-400">
                              <Headphones className="w-4 h-4 mr-1" />
                              Listening
                            </Button>
                            {/* Request to Speak button - only show for listeners */}
                            {activeDebate.status === "live" && (() => {
                              const myP = participants.find(p => p.user_id === user?.id);
                              if (myP?.role === "listener") return (
                                <Button variant="outline" size="sm" onClick={requestToSpeak} className="border-yellow-500/30 text-yellow-400">
                                  <Hand className="w-4 h-4 mr-1" /> Request to Speak
                                </Button>
                              );
                              if (myP?.role === "requesting") return (
                                <Badge variant="outline" className="border-yellow-500/50 text-yellow-400 text-xs py-1 px-2">
                                  <Hand className="w-3 h-3 mr-1 animate-pulse" /> Request Pending
                                </Badge>
                              );
                              if (myP?.role === "speaker") return (
                                <Badge variant="outline" className="border-primary/50 text-primary text-xs py-1 px-2">
                                  <Mic className="w-3 h-3 mr-1" /> Speaker
                                </Badge>
                              );
                              return null;
                            })()}
                            <Button variant="destructive" size="sm" onClick={leaveDebate}>
                              Leave
                            </Button>
                          </>
                        ) : (
                          activeDebate.status === "live" && (
                            <Button onClick={joinDebate} className="bg-primary hover:bg-primary/90">
                              <Volume2 className="w-4 h-4 mr-2" />
                              Join Debate
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Participant Avatars Strip */}
                <Card className="glass-effect border-border/20">
                  <CardContent className="py-3">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      <span className="text-xs text-muted-foreground whitespace-nowrap mr-1">
                        <Users className="w-3 h-3 inline mr-1" />
                        Live:
                      </span>
                      {participants.slice(0, 20).map((p, i) => (
                        <motion.div
                          key={p.id}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex flex-col items-center min-w-[48px]"
                          title={resolvedName(p.discord_id, p.discord_username)}
                        >
                          <Avatar className="w-8 h-8 border-2 border-primary/30">
                            <AvatarImage src={resolvedAvatar(p.discord_id, p.discord_avatar)} />
                            <AvatarFallback className="text-[10px] bg-primary/20">
                              {resolvedName(p.discord_id, p.discord_username)[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[9px] text-muted-foreground truncate max-w-[48px] mt-0.5">
                            {resolvedName(p.discord_id, p.discord_username)}
                          </span>
                        </motion.div>
                      ))}
                      {participants.length > 20 && (
                        <div className="flex flex-col items-center min-w-[48px]">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                            +{participants.length - 20}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Speak Requests Banner (Owner Only) */}
                {isOwner && speakRequests.length > 0 && activeDebate.status === "live" && (
                  <Card className="border-yellow-500/30 bg-yellow-500/5">
                    <CardContent className="py-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Hand className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-medium text-yellow-400">
                          Speak Requests ({speakRequests.length})
                        </span>
                      </div>
                      <div className="space-y-2">
                        {speakRequests.map(req => {
                          const name = resolvedName(req.discord_id, req.discord_username);
                          return (
                            <motion.div
                              key={req.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center gap-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20"
                            >
                              <Avatar className="w-7 h-7">
                                <AvatarImage src={resolvedAvatar(req.discord_id, req.discord_avatar)} />
                                <AvatarFallback className="text-[9px] bg-yellow-500/20">{name[0]}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium flex-1 truncate">{name}</span>
                              <Button size="sm" variant="outline" className="h-7 px-2 border-green-500/40 text-green-400 text-xs" onClick={() => promoteToSpeaker(req.id, name)}>
                                <UserCheck className="w-3 h-3 mr-1" /> Accept
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 px-2 border-destructive/40 text-destructive text-xs" onClick={() => denyRequest(req.id, name)}>
                                <UserMinus className="w-3 h-3 mr-1" /> Deny
                              </Button>
                            </motion.div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Screen Share Preview */}
                {isScreenSharing && (
                  <Card className="glass-effect border-green-500/30">
                    <CardContent className="py-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Monitor className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-medium text-green-400">Screen Sharing Active</span>
                        <Button variant="ghost" size="sm" onClick={toggleScreenShare} className="ml-auto text-destructive">
                          <MonitorOff className="w-4 h-4 mr-1" /> Stop
                        </Button>
                      </div>
                      <video
                        ref={screenVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full rounded-lg border border-border/30 max-h-[300px] object-contain bg-black"
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Audio Visualizer */}
                <Card className="glass-effect border-primary/20">
                  <CardContent className="py-4">
                    <AudioVisualizer isMuted={isMuted} isLive={activeDebate.status === "live" && isJoined} />
                    <p className="text-center text-xs text-muted-foreground mt-2">
                      {activeDebate.status === "live" 
                        ? (isMuted || !isJoined ? "🔇 Mic muted — Unmute to see your audio" : "🔊 Audio Channel Active — Speaking") 
                        : "🔇 Waiting for debate to start..."}
                    </p>
                  </CardContent>
                </Card>

                {/* Live Feed */}
                <Card className="glass-effect border-border/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      Live Feed
                      <Badge variant="outline" className="text-[10px] ml-auto">{messages.length} messages</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px] pr-3">
                      <div className="space-y-3">
                        <AnimatePresence>
                          {messages.map((msg) => (
                            <motion.div
                              key={msg.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${
                                msg.message_type === "system" 
                                  ? "bg-primary/10 border border-primary/20" 
                                  : "hover:bg-muted/20"
                              }`}
                            >
                              {msg.message_type !== "system" && (
                                <Avatar className="w-8 h-8 border border-border/50">
                                  <AvatarImage src={resolvedAvatar(msg.discord_id, msg.discord_avatar)} />
                                  <AvatarFallback className="text-[10px] bg-primary/10">
                                    {resolvedName(msg.discord_id, msg.discord_username)[0].toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div className="flex-1 min-w-0">
                                {msg.message_type !== "system" && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-primary">
                                      {resolvedName(msg.discord_id, msg.discord_username)}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                      {format(new Date(msg.created_at), "HH:mm")}
                                    </span>
                                  </div>
                                )}
                                <p className={`text-sm break-words ${
                                  msg.message_type === "system" ? "text-primary font-medium text-center" : "text-foreground/90"
                                }`}>{msg.message}</p>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>

                    {/* Message Input */}
                    {isJoined && activeDebate.status === "live" && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/20">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                          placeholder="Type your message..."
                          className="flex-1 bg-muted/20 border-border/30"
                        />
                        <Button size="sm" onClick={sendMessage} disabled={!newMessage.trim()}>
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    {!isJoined && activeDebate.status === "live" && (
                      <p className="text-center text-xs text-muted-foreground mt-3 pt-3 border-t border-border/20">
                        Join the debate to participate in the live feed
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Sidebar - Participants */}
              <div className="lg:col-span-3 space-y-4">
                <Card className="glass-effect border-border/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-500" />
                      Participants
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-2">
                        {participants.map((p, i) => (
                          <motion.div
                            key={p.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="flex items-center gap-3 p-2 rounded-lg border border-border/20 hover:border-primary/30 transition-all"
                          >
                            <div className="relative">
                              <Avatar className="w-10 h-10 border-2 border-primary/20">
                                <AvatarImage src={resolvedAvatar(p.discord_id, p.discord_avatar)} />
                                <AvatarFallback className="bg-primary/10 text-xs">
                                  {resolvedName(p.discord_id, p.discord_username)[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {resolvedName(p.discord_id, p.discord_username)}
                              </p>
                              <div className="flex items-center gap-1">
                                <Badge variant="outline" className={`text-[9px] h-4 ${
                                  p.role === "requesting" ? "border-yellow-500/50 text-yellow-400" : ""
                                }`}>
                                  {p.role === "speaker" ? (
                                    <><Mic className="w-2 h-2 mr-0.5" /> Speaker</>
                                  ) : p.role === "requesting" ? (
                                    <><Hand className="w-2 h-2 mr-0.5 animate-pulse" /> Requesting</>
                                  ) : (
                                    <><Headphones className="w-2 h-2 mr-0.5" /> Listener</>
                                  )}
                                </Badge>
                              </div>
                            </div>
                            {/* Owner controls */}
                            {isOwner && activeDebate.status === "live" && (
                              <div className="flex items-center gap-1 shrink-0">
                                {p.role === "requesting" && (
                                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-green-400" onClick={() => promoteToSpeaker(p.id, resolvedName(p.discord_id, p.discord_username))} title="Accept">
                                    <UserCheck className="w-3 h-3" />
                                  </Button>
                                )}
                                {(p.role === "listener" || p.role === "requesting") && (
                                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-primary" onClick={() => promoteToSpeaker(p.id, resolvedName(p.discord_id, p.discord_username))} title="Make Speaker">
                                    <ArrowUpCircle className="w-3 h-3" />
                                  </Button>
                                )}
                                {p.role === "speaker" && (
                                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground" onClick={() => demoteToListener(p.id, resolvedName(p.discord_id, p.discord_username))} title="Move to Listener">
                                    <UserMinus className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </motion.div>
                        ))}
                        {participants.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">No participants yet</p>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default DebatePage;
