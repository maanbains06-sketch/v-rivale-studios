import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Mic, MicOff, Headphones, Send, Users, Clock, MessageSquare, 
  Radio, Zap, Volume2, ChevronRight, Crown, Eye
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

const CountdownTimer = ({ endsAt }: { endsAt: string }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const update = () => {
      const diff = differenceInSeconds(new Date(endsAt), new Date());
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
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
  }, [endsAt]);

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

const Debate = () => {
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const loadDebates = useCallback(async () => {
    const { data } = await supabase
      .from("debates")
      .select("*")
      .in("status", ["upcoming", "live"])
      .order("starts_at", { ascending: true });
    setDebates(data || []);
    
    // Auto-select first live debate, or first upcoming
    const live = data?.find(d => d.status === "live");
    const upcoming = data?.find(d => d.status === "upcoming");
    if (live) setActiveDebate(live);
    else if (upcoming) setActiveDebate(upcoming);
    
    setLoading(false);
  }, []);

  const loadParticipants = useCallback(async (debateId: string) => {
    const { data } = await supabase
      .from("debate_participants")
      .select("*")
      .eq("debate_id", debateId)
      .order("joined_at", { ascending: true });
    setParticipants(data || []);
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

  useEffect(() => {
    const init = async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u);
      await loadDebates();
    };
    init();
  }, [loadDebates]);

  useEffect(() => {
    if (!activeDebate) return;
    loadParticipants(activeDebate.id);
    loadMessages(activeDebate.id);

    // Check if user already joined
    if (user) {
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

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(partChannel);
    };
  }, [activeDebate, user, loadParticipants, loadMessages]);

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
    await supabase
      .from("debate_participants")
      .delete()
      .eq("debate_id", activeDebate.id)
      .eq("user_id", user.id);
    setIsJoined(false);
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

        {!activeDebate ? (
          <div className="max-w-2xl mx-auto text-center">
            <Card className="glass-effect border-border/20">
              <CardContent className="py-16">
                <Radio className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-bold mb-2">No Active Debates</h3>
                <p className="text-muted-foreground">Check back soon for upcoming debates!</p>
              </CardContent>
            </Card>

            {/* Upcoming debates list */}
            {debates.filter(d => d.status === "upcoming").length > 0 && (
              <div className="mt-8 space-y-4">
                <h3 className="text-lg font-semibold text-left">Upcoming Debates</h3>
                {debates.filter(d => d.status === "upcoming").map(debate => (
                  <Card 
                    key={debate.id} 
                    className="glass-effect border-border/20 cursor-pointer hover:border-primary/40 transition-all"
                    onClick={() => setActiveDebate(debate)}
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
        ) : (
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
                  <CountdownTimer endsAt={activeDebate.status === "live" ? activeDebate.ends_at : activeDebate.starts_at} />
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
                    {debates.map(debate => (
                      <motion.div
                        key={debate.id}
                        whileHover={{ scale: 1.02 }}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          activeDebate?.id === debate.id 
                            ? "border-primary/50 bg-primary/10" 
                            : "border-border/30 hover:border-primary/30"
                        }`}
                        onClick={() => setActiveDebate(debate)}
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
                      <div className="flex items-center gap-2">
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
                            <Button variant="outline" size="sm" className="border-green-500/30 text-green-400">
                              <Headphones className="w-4 h-4 mr-1" />
                              Listening
                            </Button>
                            <Button variant="destructive" size="sm" onClick={leaveDebate}>
                              Leave
                            </Button>
                          </>
                        ) : (
                          <Button onClick={joinDebate} className="bg-primary hover:bg-primary/90">
                            <Volume2 className="w-4 h-4 mr-2" />
                            Join Debate
                          </Button>
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
                          title={p.discord_username || "User"}
                        >
                          <Avatar className="w-8 h-8 border-2 border-primary/30">
                            <AvatarImage src={p.discord_avatar || undefined} />
                            <AvatarFallback className="text-[10px] bg-primary/20">
                              {(p.discord_username || "U")[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[9px] text-muted-foreground truncate max-w-[48px] mt-0.5">
                            {p.discord_username || "User"}
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

                {/* Audio Visualizer Placeholder */}
                <Card className="glass-effect border-primary/20">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-center gap-1 h-12">
                      {Array.from({ length: 32 }).map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-1 bg-primary/60 rounded-full"
                          animate={{
                            height: activeDebate.status === "live" 
                              ? [4, Math.random() * 40 + 4, 4]
                              : 4,
                          }}
                          transition={{
                            duration: 0.5 + Math.random() * 0.5,
                            repeat: Infinity,
                            repeatType: "reverse",
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-center text-xs text-muted-foreground mt-2">
                      {activeDebate.status === "live" ? "🔊 Audio Channel Active" : "🔇 Waiting for debate to start..."}
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
                              className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/20 transition-colors"
                            >
                              <Avatar className="w-8 h-8 border border-border/50">
                                <AvatarImage src={msg.discord_avatar || undefined} />
                                <AvatarFallback className="text-[10px] bg-primary/10">
                                  {(msg.discord_username || "U")[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-primary">
                                    {msg.discord_username || "Anonymous"}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {format(new Date(msg.created_at), "HH:mm")}
                                  </span>
                                </div>
                                <p className="text-sm text-foreground/90 break-words">{msg.message}</p>
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
                    {!isJoined && (
                      <p className="text-center text-xs text-muted-foreground mt-3 pt-3 border-t border-border/20">
                        Join the debate to participate in the live feed
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Sidebar - Top Debaters / Participants */}
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
                                <AvatarImage src={p.discord_avatar || undefined} />
                                <AvatarFallback className="bg-primary/10 text-xs">
                                  {(p.discord_username || "U")[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{p.discord_username || "User"}</p>
                              <div className="flex items-center gap-1">
                                <Badge variant="outline" className="text-[9px] h-4">
                                  {p.role === "speaker" ? (
                                    <><Mic className="w-2 h-2 mr-0.5" /> Speaker</>
                                  ) : (
                                    <><Headphones className="w-2 h-2 mr-0.5" /> Listener</>
                                  )}
                                </Badge>
                              </div>
                            </div>
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
        )}
      </div>
    </div>
  );
};

export default Debate;
