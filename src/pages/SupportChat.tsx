import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send, MessageCircle, Plus, Paperclip, X, Download, Star, Sparkles, UserPlus, ThumbsUp, ThumbsDown, CreditCard } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface MessageRating {
  message_id: string;
  rating: 'helpful' | 'not_helpful';
}

interface Chat {
  id: string;
  subject: string;
  status: string;
  created_at: string;
  last_message_at: string;
  priority: string;
  tags: string[];
  assigned_to: string | null;
  detected_language: string | null;
}

const SupportChat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category');
  const tagStaffId = searchParams.get('tagStaff');
  const tagStaffName = searchParams.get('staffName');
  const dmStaffId = searchParams.get('dmStaff');
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [newChatSubject, setNewChatSubject] = useState("");
  const [newChatPriority, setNewChatPriority] = useState("normal");
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [aiAssisting, setAiAssisting] = useState(false);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [messageRatings, setMessageRatings] = useState<Map<string, MessageRating>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkAuth();
    fetchChats();
    
    // Auto-open create dialog if category is specified and no chats exist
    if (category === 'refund') {
      setNewChatSubject("Refund Request");
      setCreateDialogOpen(true);
    }
    
    // Auto-open create dialog for staff tagging
    if (tagStaffId && tagStaffName) {
      setNewChatSubject(`Support Request - Tagging ${decodeURIComponent(tagStaffName)}`);
      setCreateDialogOpen(true);
    }
    
    // Auto-open create dialog for direct message to staff
    if (dmStaffId && tagStaffName) {
      setNewChatSubject(`Direct Message to ${decodeURIComponent(tagStaffName)}`);
      setCreateDialogOpen(true);
    }
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
      fetchMessageRatings(selectedChat.id);
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

  const fetchMessageRatings = async (chatId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("ai_message_ratings")
      .select("message_id, rating")
      .eq("chat_id", chatId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching ratings:", error);
      return;
    }

    const ratingsMap = new Map<string, MessageRating>();
    data?.forEach((rating) => {
      ratingsMap.set(rating.message_id, {
        message_id: rating.message_id,
        rating: rating.rating as 'helpful' | 'not_helpful'
      });
    });
    setMessageRatings(ratingsMap);
  };

  const rateMessage = async (messageId: string, ratingValue: 'helpful' | 'not_helpful') => {
    if (!selectedChat) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { error } = await supabase
        .from("ai_message_ratings")
        .insert({
          message_id: messageId,
          chat_id: selectedChat.id,
          user_id: user.id,
          rating: ratingValue,
        });

      if (error) throw error;

      setMessageRatings(prev => {
        const newMap = new Map(prev);
        newMap.set(messageId, { message_id: messageId, rating: ratingValue });
        return newMap;
      });

      toast({
        title: "Thank you!",
        description: "Your feedback helps us improve our AI support.",
      });
    } catch (error) {
      console.error("Error rating message:", error);
    }
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

    // Prepare tags based on category or staff tagging
    let tags: string[] = [];
    let assignedTo: string | null = null;
    let priority = 'normal';
    
    if (category === 'refund') {
      tags = ['refund', 'billing'];
      priority = 'high';
    }
    
    // If tagging a specific staff member or DM
    const staffId = tagStaffId || dmStaffId;
    if (staffId) {
      // Get the staff member's user_id from staff_members table
      const { data: staffData } = await supabase
        .from("staff_members")
        .select("user_id, name")
        .eq("id", staffId)
        .single();
      
      if (staffData?.user_id) {
        assignedTo = staffData.user_id;
        tags.push('staff_tagged');
        if (dmStaffId) {
          tags.push('direct_message');
        }
      }
    }

    const { data, error } = await supabase
      .from("support_chats")
      .insert({
        user_id: user.id,
        subject: newChatSubject,
        tags: tags,
        priority: priority,
        assigned_to: assignedTo,
        status: assignedTo ? 'in_progress' : 'open',
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

    // Send notification to the tagged/assigned staff member
    if (assignedTo) {
      const notificationType = dmStaffId ? 'direct_message' : 'staff_tagged';
      const notificationTitle = dmStaffId ? 'New Direct Message' : 'You were tagged in a support ticket';
      const notificationMessage = dmStaffId 
        ? `Someone has sent you a direct message: "${newChatSubject}"`
        : `Someone has opened a support ticket and tagged you: "${newChatSubject}"`;
      
      try {
        await supabase.from("notifications").insert({
          user_id: assignedTo,
          title: notificationTitle,
          message: notificationMessage,
          type: notificationType,
          reference_id: data.id,
        });
      } catch (notifError) {
        console.error("Error sending notification:", notifError);
      }
    }

    setChats(prev => [data, ...prev]);
    setSelectedChat(data);
    setNewChatSubject("");
    setCreateDialogOpen(false);
    setLoading(false);
    
    // Send refund notification email to staff if it's a refund request
    if (category === 'refund') {
      try {
        await supabase.functions.invoke('send-refund-notification', {
          body: {
            chatId: data.id,
            subject: newChatSubject,
            userId: user.id,
          }
        });
      } catch (error) {
        console.error("Error sending refund notification:", error);
      }
    }
    
    // Show appropriate toast message
    let toastMessage = 'Your support chat has been created. Our team will respond shortly.';
    if (dmStaffId && tagStaffName) {
      toastMessage = `Your direct message to ${decodeURIComponent(tagStaffName)} has been sent. They will be notified.`;
    } else if (tagStaffId && tagStaffName) {
      toastMessage = `Your support ticket has been created and ${decodeURIComponent(tagStaffName)} has been notified.`;
    } else if (category === 'refund') {
      toastMessage = 'Your refund request has been created. Our team will respond shortly.';
    }
    
    toast({
      title: dmStaffId ? "Message Sent" : "Chat Created",
      description: toastMessage,
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

  const requestHumanSupport = async () => {
    if (!selectedChat) return;

    try {
      const { error } = await supabase
        .from("support_chats")
        .update({ 
          status: 'in_progress',
          priority: 'high',
          tags: ['human_requested']
        })
        .eq("id", selectedChat.id);

      if (error) throw error;

      // Refresh chats to update UI
      await fetchChats();

      toast({
        title: "Human support requested",
        description: "A staff member will assist you shortly.",
      });
    } catch (error) {
      console.error("Error requesting human support:", error);
      toast({
        title: "Error",
        description: "Failed to request human support.",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !attachment) || !selectedChat) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUploading(true);
    const messageToSend = newMessage;

    try {
      let attachmentData = null;
      if (attachment) {
        attachmentData = await uploadAttachment(selectedChat.id, user.id);
      }

      const { error } = await supabase.from("support_messages").insert({
        chat_id: selectedChat.id,
        user_id: user.id,
        message: messageToSend || "Sent an attachment",
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

      // Get AI response if chat is still open and not assigned to human
      if (selectedChat.status === 'open' && !selectedChat.assigned_to && messageToSend.trim()) {
        const chatMessages = messages.map(m => ({
          role: m.is_staff ? 'assistant' : 'user',
          content: m.message
        }));
        chatMessages.push({ role: 'user', content: messageToSend });

        const { data: session } = await supabase.auth.getSession();
        
        try {
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-support-chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.session?.access_token}`,
            },
            body: JSON.stringify({
              messages: chatMessages,
              chatId: selectedChat.id
            }),
          });

          if (response.ok) {
            const data = await response.json();
            // If chat was auto-escalated, refresh chat data to show updated status
            if (data.escalated) {
              await fetchChats();
              toast({
                title: "Escalated to Human Support",
                description: "Your request has been prioritized for immediate assistance.",
              });
            }
          } else {
            console.error('AI response failed:', response.status);
          }
        } catch (aiError) {
          console.error('AI call error:', aiError);
          // Don't show error to user, AI is optional enhancement
        }
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
        title={category === 'refund' ? "Refund Support" : "Live Support Chat"}
        description={category === 'refund' ? "Get assistance with refund requests and billing issues" : "Get real-time assistance from our support team"}
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
                    Skylife Support
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {category === 'refund' ? (
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-primary" />
                          Create Refund Request
                        </div>
                      ) : (
                        'Create New Support Chat'
                      )}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    {category === 'refund' && (
                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">
                          <strong>Refund requests</strong> are prioritized and handled by our billing team. 
                          Please provide details about your purchase and reason for the refund request.
                        </p>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        placeholder={category === 'refund' ? "Refund Request - Order #" : "What do you need help with?"}
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
                    {chats.map((chat) => {
                      const isEscalated = chat.tags?.includes('auto_escalated');
                      const isRefund = chat.tags?.includes('refund');
                      const languageEmoji = {
                        'en': '🇬🇧',
                        'es': '🇪🇸',
                        'fr': '🇫🇷',
                        'de': '🇩🇪',
                        'it': '🇮🇹',
                        'pt': '🇵🇹',
                        'ru': '🇷🇺',
                        'zh': '🇨🇳',
                        'ja': '🇯🇵',
                        'ko': '🇰🇷',
                        'ar': '🇸🇦',
                      }[chat.detected_language || 'en'] || '🌐';
                      
                      return (
                        <button
                          key={chat.id}
                          onClick={() => setSelectedChat(chat)}
                          className={`w-full p-4 text-left hover:bg-accent transition-colors ${
                            selectedChat?.id === chat.id ? "bg-accent" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-sm">{languageEmoji}</span>
                              <p className="font-medium text-sm truncate">{chat.subject}</p>
                              {isRefund && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/20 text-secondary flex items-center gap-1">
                                  <CreditCard className="h-3 w-3" />
                                  Refund
                                </span>
                              )}
                              {isEscalated && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-500 flex items-center gap-1">
                                  <UserPlus className="h-3 w-3" />
                                  Escalated
                                </span>
                              )}
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ml-2 ${
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
                      );
                    })}
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
                    <div>
                      <CardTitle className="text-lg">{selectedChat.subject}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-3">
                        {selectedChat.assigned_to ? (
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                            Staff Support
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-blue-500" />
                            AI Assistant
                          </span>
                        )}
                        {selectedChat.detected_language && selectedChat.detected_language !== 'en' && (
                          <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-500">
                            <span>🌐</span>
                            <span className="uppercase">{selectedChat.detected_language}</span>
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!selectedChat.assigned_to && selectedChat.status === 'open' && (
                        <Button size="sm" variant="outline" onClick={requestHumanSupport}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Request Human
                        </Button>
                      )}
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
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-4">
                  <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-4">
                      {messages.map((message) => {
                        const isAiMessage = message.is_staff && message.user_id === "00000000-0000-0000-0000-000000000000";
                        const currentRating = messageRatings.get(message.id);
                        
                        return (
                          <div
                            key={message.id}
                            className={`flex ${message.is_staff ? "justify-start" : "justify-end"}`}
                          >
                            <div className="flex flex-col gap-2">
                              <div
                                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                  message.is_staff
                                    ? "bg-accent text-foreground"
                                    : "bg-primary text-primary-foreground"
                                }`}
                              >
                                {isAiMessage && (
                                  <div className="flex items-center gap-2 mb-2 text-xs opacity-70">
                                    <Sparkles className="h-3 w-3" />
                                    <span>AI Assistant</span>
                                  </div>
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
                              {isAiMessage && (
                                <div className="flex items-center gap-2 ml-2">
                                  <span className="text-xs text-muted-foreground">Was this helpful?</span>
                                  <Button
                                    size="sm"
                                    variant={currentRating?.rating === 'helpful' ? "default" : "ghost"}
                                    className="h-6 w-6 p-0"
                                    onClick={() => rateMessage(message.id, 'helpful')}
                                    disabled={!!currentRating}
                                  >
                                    <ThumbsUp className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={currentRating?.rating === 'not_helpful' ? "default" : "ghost"}
                                    className="h-6 w-6 p-0"
                                    onClick={() => rateMessage(message.id, 'not_helpful')}
                                    disabled={!!currentRating}
                                  >
                                    <ThumbsDown className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
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
