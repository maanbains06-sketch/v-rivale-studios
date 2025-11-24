import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send, MessageCircle, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

interface Message {
  id: string;
  message: string;
  is_staff: boolean;
  created_at: string;
  user_id: string;
}

interface Chat {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  created_at: string;
  last_message_at: string;
  assigned_to: string | null;
}

const AdminSupportChat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");
  const [isAdmin, setIsAdmin] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchChats();
      setupChatsRealtimeSubscription();
    }
  }, [isAdmin, statusFilter]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
      setupMessagesRealtimeSubscription(selectedChat.id);
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const hasAccess = roles?.some(r => r.role === "admin" || r.role === "moderator");
    
    if (!hasAccess) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    setIsAdmin(true);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchChats = async () => {
    const { data, error } = await supabase
      .from("support_chats")
      .select("*")
      .eq("status", statusFilter)
      .order("last_message_at", { ascending: false });

    if (error) {
      console.error("Error fetching chats:", error);
      return;
    }

    setChats(data || []);
  };

  const setupChatsRealtimeSubscription = () => {
    const channel = supabase
      .channel("admin-support-chats")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_chats",
        },
        () => {
          fetchChats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchMessages = async (chatId: string) => {
    const { data, error } = await supabase
      .from("support_messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }

    setMessages(data || []);
  };

  const setupMessagesRealtimeSubscription = (chatId: string) => {
    const channel = supabase
      .channel(`admin-messages-${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("support_messages").insert({
      chat_id: selectedChat.id,
      user_id: user.id,
      message: newMessage,
      is_staff: true,
    });

    if (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive",
      });
      return;
    }

    // Update last_message_at
    await supabase
      .from("support_chats")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", selectedChat.id);

    setNewMessage("");
  };

  const updateChatStatus = async (chatId: string, status: string) => {
    const { error } = await supabase
      .from("support_chats")
      .update({ status })
      .eq("id", chatId);

    if (error) {
      console.error("Error updating chat status:", error);
      toast({
        title: "Error",
        description: "Failed to update chat status.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Status Updated",
      description: `Chat status changed to ${status}.`,
    });

    fetchChats();
    if (selectedChat?.id === chatId) {
      setSelectedChat(prev => prev ? { ...prev, status } : null);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Support Chat Management</h1>

        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-6">
          <TabsList>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-300px)]">
          {/* Chats List */}
          <Card className="glass-effect border-border/20">
            <CardHeader>
              <CardTitle className="text-lg">Support Requests</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-400px)]">
                {chats.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No {statusFilter} chats</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {chats.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => setSelectedChat(chat)}
                        className={`w-full p-4 text-left hover:bg-accent transition-colors ${
                          selectedChat?.id === chat.id ? "bg-accent" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <p className="font-medium text-sm truncate pr-2">{chat.subject}</p>
                          <Badge variant="outline" className="text-xs">
                            {chat.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(chat.last_message_at), "PPp")}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Messages Area */}
          <Card className="lg:col-span-2 glass-effect border-border/20 flex flex-col">
            {selectedChat ? (
              <>
                <CardHeader className="border-b border-border/20">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{selectedChat.subject}</CardTitle>
                    <div className="flex gap-2">
                      {selectedChat.status === "open" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateChatStatus(selectedChat.id, "in_progress")}
                        >
                          Start Working
                        </Button>
                      )}
                      {selectedChat.status !== "closed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateChatStatus(selectedChat.id, "closed")}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Close
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-4">
                  <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.is_staff ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-4 py-2 ${
                              message.is_staff
                                ? "bg-primary text-primary-foreground"
                                : "bg-accent text-foreground"
                            }`}
                          >
                            {message.is_staff && (
                              <p className="text-xs font-semibold opacity-70 mb-1">Support Staff</p>
                            )}
                            <p className="text-sm">{message.message}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {format(new Date(message.created_at), "p")}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                  {selectedChat.status !== "closed" && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-border/20">
                      <Input
                        placeholder="Type your response..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      />
                      <Button onClick={sendMessage} size="icon">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p>Select a chat to view messages</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminSupportChat;
