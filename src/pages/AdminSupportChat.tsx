import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send, MessageCircle, Check, Paperclip, X, Download, Zap, AlertCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { CannedResponsesManager } from "@/components/CannedResponsesManager";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StaffAvailabilityToggle } from "@/components/StaffAvailabilityToggle";

interface Message {
  id: string;
  message: string;
  is_staff: boolean;
  created_at: string;
  user_id: string;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_size: number | null;
}

interface CannedResponse {
  id: string;
  title: string;
  content: string;
  category: string;
}

interface Chat {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  created_at: string;
  last_message_at: string;
  assigned_to: string | null;
  sentiment: string | null;
  sentiment_score: number | null;
  escalated: boolean | null;
  sla_breached: boolean | null;
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
  const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchChats();
      fetchCannedResponses();
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

  const fetchCannedResponses = async () => {
    const { data, error } = await supabase
      .from("canned_responses")
      .select("*")
      .order("category", { ascending: true })
      .order("title", { ascending: true });

    if (error) {
      console.error("Error fetching canned responses:", error);
      return;
    }

    setCannedResponses(data || []);
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }
      setAttachment(file);
    }
  };

  const uploadAttachment = async (chatId: string, userId: string) => {
    if (!attachment) return null;

    const fileExt = attachment.name.split('.').pop();
    const fileName = `${userId}/${chatId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('chat-attachments')
      .upload(fileName, attachment);

    if (error) {
      console.error("Error uploading file:", error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(data.path);

    return {
      url: publicUrl,
      name: attachment.name,
      size: attachment.size,
    };
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !attachment) || !selectedChat) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUploading(true);

    try {
      let attachmentData = null;
      if (attachment) {
        attachmentData = await uploadAttachment(selectedChat.id, user.id);
      }

      const { error } = await supabase.from("support_messages").insert({
        chat_id: selectedChat.id,
        user_id: user.id,
        message: newMessage || "Sent an attachment",
        is_staff: true,
        attachment_url: attachmentData?.url,
        attachment_name: attachmentData?.name,
        attachment_size: attachmentData?.size,
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

      await supabase
        .from("support_chats")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", selectedChat.id);

      // Log staff activity
      await supabase.rpc('log_staff_activity', {
        p_staff_user_id: user.id,
        p_action_type: 'chat_response',
        p_action_description: `Responded to support chat: ${selectedChat.subject}`,
        p_related_id: selectedChat.id,
        p_related_type: 'support_chat',
      });

      setNewMessage("");
      setAttachment(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload attachment.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const insertCannedResponse = (content: string) => {
    setNewMessage(content);
  };

  const updateChatStatus = async (chatId: string, status: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    
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

    // Log staff activity
    if (user) {
      await supabase.rpc('log_staff_activity', {
        p_staff_user_id: user.id,
        p_action_type: 'status_change',
        p_action_description: `Changed chat status to: ${status}`,
        p_related_id: chatId,
        p_related_type: 'support_chat',
      });
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
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold">Support Chat Management</h1>
            <CannedResponsesManager />
          </div>
          <StaffAvailabilityToggle />
        </div>

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
              <p className="text-xs text-muted-foreground mt-1">
                <span className="mr-2">🔴 Frustrated</span>
                <span className="mr-2">😟 Negative</span>
                <span className="mr-2">😐 Neutral</span>
                <span>😊 Positive</span>
              </p>
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
                        } ${chat.sentiment === 'frustrated' ? "border-l-4 border-l-destructive" : ""}`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-1 flex-1 min-w-0">
                            {chat.sentiment === 'frustrated' && (
                              <span className="text-sm shrink-0" title="Frustrated user">🔴</span>
                            )}
                            {chat.sentiment === 'negative' && (
                              <span className="text-sm shrink-0" title="Negative sentiment">😟</span>
                            )}
                            {chat.sentiment === 'positive' && (
                              <span className="text-sm shrink-0" title="Positive sentiment">😊</span>
                            )}
                            <p className="font-medium text-sm truncate pr-2">{chat.subject}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {chat.escalated && (
                              <Badge variant="destructive" className="text-xs px-1 py-0">
                                <AlertCircle className="h-3 w-3" />
                              </Badge>
                            )}
                            {chat.sla_breached && (
                              <Badge variant="destructive" className="text-xs px-1 py-0">
                                <Clock className="h-3 w-3" />
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {chat.status}
                            </Badge>
                          </div>
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
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{selectedChat.subject}</CardTitle>
                      {selectedChat.sentiment === 'frustrated' && (
                        <Badge variant="destructive" className="animate-pulse shrink-0">
                          🔴 Frustrated
                        </Badge>
                      )}
                      {selectedChat.sentiment === 'negative' && (
                        <Badge variant="secondary" className="shrink-0">😟 Negative</Badge>
                      )}
                      {selectedChat.escalated && (
                        <Badge variant="destructive" className="shrink-0">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Escalated
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
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
                            {message.attachment_url && (
                              <a
                                href={message.attachment_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 mt-2 text-xs underline hover:opacity-80"
                              >
                                <Download className="h-3 w-3" />
                                {message.attachment_name} ({(message.attachment_size! / 1024).toFixed(1)}KB)
                              </a>
                            )}
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
                    <div className="space-y-2 mt-4 pt-4 border-t border-border/20">
                      {/* Canned Responses */}
                      <div className="flex gap-2">
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Quick Replies" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Templates</SelectItem>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="technical">Technical</SelectItem>
                            <SelectItem value="billing">Billing</SelectItem>
                            <SelectItem value="account">Account</SelectItem>
                            <SelectItem value="whitelist">Whitelist</SelectItem>
                          </SelectContent>
                        </Select>
                        {selectedCategory !== "all" && (
                          <ScrollArea className="flex-1 h-[100px]">
                            <div className="flex flex-wrap gap-2">
                              {cannedResponses
                                .filter(r => selectedCategory === "all" || r.category === selectedCategory)
                                .map(response => (
                                  <Button
                                    key={response.id}
                                    size="sm"
                                    variant="outline"
                                    onClick={() => insertCannedResponse(response.content)}
                                  >
                                    <Zap className="h-3 w-3 mr-1" />
                                    {response.title}
                                  </Button>
                                ))}
                            </div>
                          </ScrollArea>
                        )}
                      </div>

                      {/* Attachment Preview */}
                      {attachment && (
                        <div className="flex items-center gap-2 text-sm bg-accent px-3 py-2 rounded-md">
                          <Paperclip className="h-4 w-4" />
                          <span className="flex-1 truncate">{attachment.name}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setAttachment(null);
                              if (fileInputRef.current) {
                                fileInputRef.current.value = "";
                              }
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}

                      {/* Message Input */}
                      <div className="flex gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          className="hidden"
                          accept="image/*,.pdf,.txt,.doc,.docx"
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                        >
                          <Paperclip className="h-4 w-4" />
                        </Button>
                        <Input
                          placeholder="Type your response..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && !uploading && sendMessage()}
                          disabled={uploading}
                        />
                        <Button onClick={sendMessage} size="icon" disabled={uploading}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
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
