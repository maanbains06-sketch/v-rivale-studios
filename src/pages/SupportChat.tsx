import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send, MessageCircle, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import headerSupport from "@/assets/header-support.jpg";
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
  subject: string;
  status: string;
  created_at: string;
  last_message_at: string;
}

const SupportChat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [newChatSubject, setNewChatSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
    fetchChats();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
      setupRealtimeSubscription(selectedChat.id);
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to access support chat.",
        variant: "destructive",
      });
      navigate("/auth");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchChats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("support_chats")
      .select("*")
      .eq("user_id", user.id)
      .order("last_message_at", { ascending: false });

    if (error) {
      console.error("Error fetching chats:", error);
      return;
    }

    setChats(data || []);
    if (data && data.length > 0 && !selectedChat) {
      setSelectedChat(data[0]);
    }
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

  const setupRealtimeSubscription = (chatId: string) => {
    const channel = supabase
      .channel(`support-messages-${chatId}`)
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

  const createNewChat = async () => {
    if (!newChatSubject.trim()) {
      toast({
        title: "Subject Required",
        description: "Please enter a subject for your support request.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("support_chats")
      .insert({
        user_id: user.id,
        subject: newChatSubject,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating chat:", error);
      toast({
        title: "Error",
        description: "Failed to create support chat.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setChats(prev => [data, ...prev]);
    setSelectedChat(data);
    setNewChatSubject("");
    setCreateDialogOpen(false);
    setLoading(false);
    
    toast({
      title: "Chat Created",
      description: "Your support chat has been created. Our team will respond shortly.",
    });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("support_messages").insert({
      chat_id: selectedChat.id,
      user_id: user.id,
      message: newMessage,
      is_staff: false,
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader
        title="Live Support Chat"
        description="Get real-time assistance from our support team"
        backgroundImage={headerSupport}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-300px)]">
          {/* Chats List */}
          <Card className="glass-effect border-border/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">Support Chats</CardTitle>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    New Chat
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Support Chat</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        placeholder="What do you need help with?"
                        value={newChatSubject}
                        onChange={(e) => setNewChatSubject(e.target.value)}
                      />
                    </div>
                    <Button onClick={createNewChat} disabled={loading} className="w-full">
                      {loading ? "Creating..." : "Create Chat"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-400px)]">
                {chats.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No support chats yet</p>
                    <p className="text-xs mt-1">Create one to get started</p>
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
                          <p className="font-medium text-sm truncate">{chat.subject}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            chat.status === "open" ? "bg-green-500/20 text-green-500" :
                            chat.status === "closed" ? "bg-gray-500/20 text-gray-500" :
                            "bg-yellow-500/20 text-yellow-500"
                          }`}>
                            {chat.status}
                          </span>
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
                  <CardTitle className="text-lg">{selectedChat.subject}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-4">
                  <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.is_staff ? "justify-start" : "justify-end"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-4 py-2 ${
                              message.is_staff
                                ? "bg-accent text-foreground"
                                : "bg-primary text-primary-foreground"
                            }`}
                          >
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
                  <div className="flex gap-2 mt-4 pt-4 border-t border-border/20">
                    <Input
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    />
                    <Button onClick={sendMessage} size="icon">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
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

export default SupportChat;
