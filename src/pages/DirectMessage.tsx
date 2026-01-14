import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useStaffOnlineStatus } from "@/hooks/useStaffOnlineStatus";
import { StaffOnlineIndicator } from "@/components/StaffOnlineIndicator";
import {
  Send,
  ArrowLeft,
  MessageCircle,
  Users,
  Loader2,
  Check,
  CheckCheck,
} from "lucide-react";
import headerSupport from "@/assets/header-support.jpg";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  staff_member_id: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  role_type: string;
  department: string;
  discord_avatar?: string;
  discord_username?: string;
  user_id?: string;
}

interface Conversation {
  staff_member: StaffMember;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

const DirectMessage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);

  const staffMemberId = searchParams.get("staffId");

  // Get online status for all staff
  const { isOnline, getLastSeen, getStatus } = useStaffOnlineStatus();

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUserId(user.id);
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  // Load staff members
  useEffect(() => {
    const loadStaffMembers = async () => {
      const { data, error } = await supabase
        .from("staff_members")
        .select("id, name, role, role_type, department, discord_avatar, discord_username, user_id")
        .eq("is_active", true)
        .order("display_order");

      if (!error && data) {
        setStaffMembers(data);
      }
    };
    loadStaffMembers();
  }, []);

  // Load conversations
  useEffect(() => {
    if (!userId) return;

    const loadConversations = async () => {
      // Get all messages involving the current user
      const { data: messages, error } = await supabase
        .from("direct_messages")
        .select("*")
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading conversations:", error);
        return;
      }

      // Group by staff member
      const conversationMap = new Map<string, { messages: Message[], staffMemberId: string }>();
      
      messages?.forEach((msg) => {
        const staffId = msg.staff_member_id;
        if (staffId) {
          if (!conversationMap.has(staffId)) {
            conversationMap.set(staffId, { messages: [], staffMemberId: staffId });
          }
          conversationMap.get(staffId)?.messages.push(msg);
        }
      });

      // Build conversation list
      const convos: Conversation[] = [];
      for (const [staffId, data] of conversationMap) {
        const staff = staffMembers.find(s => s.id === staffId);
        if (staff && data.messages.length > 0) {
          const latestMsg = data.messages[0];
          const unreadCount = data.messages.filter(m => 
            m.receiver_id === userId && !m.read
          ).length;

          convos.push({
            staff_member: staff,
            last_message: latestMsg.message,
            last_message_at: latestMsg.created_at,
            unread_count: unreadCount,
          });
        }
      }

      // Sort by latest message
      convos.sort((a, b) => 
        new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );

      setConversations(convos);
    };

    if (staffMembers.length > 0) {
      loadConversations();
    }
  }, [userId, staffMembers]);

  // Auto-select staff from URL params
  useEffect(() => {
    if (staffMemberId && staffMembers.length > 0) {
      const staff = staffMembers.find(s => s.id === staffMemberId);
      if (staff) {
        setSelectedStaff(staff);
      }
    }
  }, [staffMemberId, staffMembers]);

  // Load messages for selected staff
  useEffect(() => {
    if (!userId || !selectedStaff) return;

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("direct_messages")
        .select("*")
        .eq("staff_member_id", selectedStaff.id)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading messages:", error);
        return;
      }

      setMessages(data || []);

      // Mark messages as read
      const unreadIds = data?.filter(m => m.receiver_id === userId && !m.read).map(m => m.id) || [];
      if (unreadIds.length > 0) {
        await supabase
          .from("direct_messages")
          .update({ read: true })
          .in("id", unreadIds);
      }
    };

    loadMessages();

    // Set up realtime subscription
    const channel = supabase
      .channel(`dm-${selectedStaff.id}-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `staff_member_id=eq.${selectedStaff.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.sender_id === userId || newMsg.receiver_id === userId) {
            setMessages(prev => [...prev, newMsg]);
            
            // Mark as read if receiver
            if (newMsg.receiver_id === userId) {
              supabase
                .from("direct_messages")
                .update({ read: true })
                .eq("id", newMsg.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, selectedStaff]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !userId || !selectedStaff) return;

    setSendingMessage(true);

    // Determine receiver - if user is staff, receiver is the user who started convo
    // Otherwise, receiver is the staff member's user_id
    const receiverId = selectedStaff.user_id || selectedStaff.id;

    const { error } = await supabase
      .from("direct_messages")
      .insert({
        sender_id: userId,
        receiver_id: receiverId,
        staff_member_id: selectedStaff.id,
        message: newMessage.trim(),
      });

    setSendingMessage(false);

    if (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const getAvatarUrl = (staff: StaffMember) => {
    if (staff.discord_avatar) {
      return staff.discord_avatar;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(staff.name)}&background=random`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader
        title="Direct Messages"
        description="Chat directly with our team members"
        backgroundImage={headerSupport}
      />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid lg:grid-cols-[320px,1fr] gap-6 min-h-[600px]">
          {/* Conversations List */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5" />
                Conversations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="p-2 space-y-1">
                  {/* Show all staff members to start new conversations */}
                  {staffMembers.map((staff) => {
                    const conversation = conversations.find(c => c.staff_member.id === staff.id);
                    const staffIsOnline = isOnline(staff.id);
                    const staffLastSeen = getLastSeen(staff.id);
                    const staffStatus = getStatus(staff.id);
                    
                    return (
                      <motion.button
                        key={staff.id}
                        onClick={() => setSelectedStaff(staff)}
                        className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all ${
                          selectedStaff?.id === staff.id
                            ? "bg-primary/20 border border-primary/30"
                            : "hover:bg-muted/50"
                        }`}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="relative">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={getAvatarUrl(staff)} />
                            <AvatarFallback>{staff.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-0.5 -right-0.5">
                            <StaffOnlineIndicator 
                              isOnline={staffIsOnline} 
                              lastSeen={staffLastSeen}
                              status={staffStatus}
                              size="sm" 
                            />
                          </div>
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{staff.name}</span>
                            {conversation?.unread_count ? (
                              <Badge variant="destructive" className="text-xs px-1.5 py-0">
                                {conversation.unread_count}
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {conversation?.last_message || staff.role}
                          </p>
                        </div>
                        {conversation && (
                          <span className="text-xs text-muted-foreground">
                            {formatTime(conversation.last_message_at)}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 flex flex-col">
            {selectedStaff ? (
              <>
                {/* Chat Header */}
                <CardHeader className="border-b border-border/50 pb-4">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="lg:hidden"
                      onClick={() => setSelectedStaff(null)}
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={getAvatarUrl(selectedStaff)} />
                        <AvatarFallback>{selectedStaff.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5">
                        <StaffOnlineIndicator 
                          isOnline={isOnline(selectedStaff.id)} 
                          lastSeen={getLastSeen(selectedStaff.id)}
                          status={getStatus(selectedStaff.id)}
                          size="sm" 
                        />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold">{selectedStaff.name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {selectedStaff.role}
                        </Badge>
                        {isOnline(selectedStaff.id) && (
                          <span className="text-xs text-green-500">Online</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    <AnimatePresence>
                      {messages.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-center py-12 text-muted-foreground"
                        >
                          <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No messages yet</p>
                          <p className="text-sm">Start a conversation with {selectedStaff.name}</p>
                        </motion.div>
                      ) : (
                        messages.map((msg) => {
                          const isSender = msg.sender_id === userId;
                          return (
                            <motion.div
                              key={msg.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex ${isSender ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                                  isSender
                                    ? "bg-primary text-primary-foreground rounded-br-md"
                                    : "bg-muted rounded-bl-md"
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">
                                  {msg.message}
                                </p>
                                <div className={`flex items-center gap-1 mt-1 text-xs ${
                                  isSender ? "text-primary-foreground/70" : "text-muted-foreground"
                                }`}>
                                  <span>{formatTime(msg.created_at)}</span>
                                  {isSender && (
                                    msg.read ? (
                                      <CheckCheck className="w-3.5 h-3.5" />
                                    ) : (
                                      <Check className="w-3.5 h-3.5" />
                                    )
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t border-border/50">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder={`Message ${selectedStaff.name}...`}
                      className="flex-1"
                      disabled={sendingMessage}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendingMessage}
                      size="icon"
                    >
                      {sendingMessage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                  <p className="text-sm">Choose a staff member to start chatting</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DirectMessage;
