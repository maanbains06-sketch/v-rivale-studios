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
import { Send, MessageCircle, Plus, Paperclip, X, Download, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import headerSupport from "@/assets/header-support.jpg";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";

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
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
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
        is_staff: false,
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

      // Update last_message_at
      await supabase
        .from("support_chats")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", selectedChat.id);

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

  const handleRateChat = async () => {
    if (!selectedChat || rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("support_chat_ratings").insert({
      chat_id: selectedChat.id,
      user_id: user.id,
      rating,
      feedback: feedback || null,
    });

    if (error) {
      console.error("Error submitting rating:", error);
      toast({
        title: "Error",
        description: "Failed to submit rating.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Thank You!",
      description: "Your feedback helps us improve our support service.",
    });

    setRatingDialogOpen(false);
    setRating(0);
    setFeedback("");
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
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{selectedChat.subject}</CardTitle>
                    {selectedChat.status === "closed" && (
                      <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Star className="h-4 w-4 mr-2" />
                            Rate Support
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Rate Your Support Experience</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <Label>How would you rate your experience?</Label>
                              <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Button
                                    key={star}
                                    variant={rating >= star ? "default" : "outline"}
                                    size="icon"
                                    onClick={() => setRating(star)}
                                  >
                                    <Star className={`h-5 w-5 ${rating >= star ? "fill-current" : ""}`} />
                                  </Button>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="feedback">Additional Feedback (Optional)</Label>
                              <Textarea
                                id="feedback"
                                placeholder="Tell us more about your experience..."
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                rows={4}
                              />
                            </div>
                            <Button onClick={handleRateChat} className="w-full">
                              Submit Rating
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
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
                  <div className="space-y-2 mt-4 pt-4 border-t border-border/20">
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
                        placeholder="Type your message..."
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
