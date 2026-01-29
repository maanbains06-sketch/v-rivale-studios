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
import { Send, MessageCircle, Plus, Paperclip, X, Download, Star, Sparkles, UserPlus, ThumbsUp, ThumbsDown, CreditCard, Ribbon, Globe, AlertOctagon, Bug, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import headerSupport from "@/assets/header-support.jpg";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { FeatureDisabledAlert } from "@/components/FeatureDisabledAlert";
import { useStaffRole } from "@/hooks/useStaffRole";

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
  const { settings, loading: settingsLoading } = useSiteSettings();
  const { isStaff, isAdmin, loading: staffRoleLoading } = useStaffRole();
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
  const [newChatInitialMessage, setNewChatInitialMessage] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [messageRatings, setMessageRatings] = useState<Map<string, MessageRating>>(new Map());
  const [isOwner, setIsOwner] = useState(false);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkAuth();
    
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

  // Fetch chats when staff role is loaded
  useEffect(() => {
    if (!staffRoleLoading) {
      fetchChats();
    }
  }, [staffRoleLoading, isStaff, isAdmin, isOwner]);

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
      return;
    }

    // Check if user is owner
    try {
      const { data: ownerCheck } = await supabase.rpc('is_owner');
      setIsOwner(ownerCheck === true);
    } catch {
      setIsOwner(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchChats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if user can see all chats (owner or staff)
    const canSeeAllChats = isOwner || isStaff || isAdmin;

    let query = supabase
      .from("support_chats")
      .select("*")
      .order("last_message_at", { ascending: false });

    // Regular users can only see their own chats
    if (!canSeeAllChats) {
      query = query.eq("user_id", user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching chats:", error);
      return;
    }

    setChats(data || []);
    if (data && data.length > 0 && !selectedChat) {
      setSelectedChat(data[0]);
    }
  };

  const deleteChat = async (chatId: string) => {
    setDeletingChatId(chatId);
    try {
      // First delete all messages in the chat
      const { error: messagesError } = await supabase
        .from("support_messages")
        .delete()
        .eq("chat_id", chatId);

      if (messagesError) {
        console.error("Error deleting messages:", messagesError);
        toast({
          title: "Error",
          description: "Failed to delete chat messages.",
          variant: "destructive",
        });
        return;
      }

      // Delete AI message ratings
      await supabase
        .from("ai_message_ratings")
        .delete()
        .eq("chat_id", chatId);

      // Delete chat ratings
      await supabase
        .from("support_chat_ratings")
        .delete()
        .eq("chat_id", chatId);

      // Then delete the chat
      const { error: chatError } = await supabase
        .from("support_chats")
        .delete()
        .eq("id", chatId);

      if (chatError) {
        console.error("Error deleting chat:", chatError);
        toast({
          title: "Error",
          description: "Failed to delete chat.",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      
      // If the deleted chat was selected, clear selection
      if (selectedChat?.id === chatId) {
        setSelectedChat(null);
        setMessages([]);
      }

      toast({
        title: "Chat Deleted",
        description: "The support chat has been permanently deleted.",
      });
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setDeletingChatId(null);
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

    if (!newChatInitialMessage.trim()) {
      toast({
        title: "Message Required",
        description: "Please describe your issue or question.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a support chat.",
        variant: "destructive",
      });
      navigate("/auth");
      setLoading(false);
      return;
    }

    // Prepare tags based on category or staff tagging
    let tags: string[] = [];
    let assignedTo: string | null = null;
    let priority = 'normal';
    
    // Add category tags
    if (selectedCategory === 'purchase' || category === 'refund') {
      tags = ['billing', 'purchase'];
      priority = 'high';
    } else if (selectedCategory === 'report') {
      tags = ['player-report', 'misconduct'];
      priority = 'high';
    } else if (selectedCategory === 'ingame') {
      tags = ['in-game', 'whitelisted'];
    } else if (selectedCategory === 'bug') {
      tags = ['bug', 'technical'];
    } else {
      tags = ['general'];
    }
    
    // If tagging a specific staff member or DM
    const staffId = tagStaffId || dmStaffId;
    if (staffId) {
      // Get the staff member's user_id from staff_members table
      const { data: staffData, error: staffError } = await supabase
        .from("staff_members")
        .select("user_id, name")
        .eq("id", staffId)
        .maybeSingle();

      if (staffError) {
        console.warn("Staff lookup failed:", staffError);
      }
      
      if (staffData?.user_id) {
        assignedTo = staffData.user_id;
        tags.push('staff_tagged');
        if (dmStaffId) {
          tags.push('direct_message');
        }
      }
    }

    try {
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
          title: "Error creating chat",
          description: `${error.message}${error.code ? ` (code: ${error.code})` : ""}`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Send the initial message
      const { error: messageError } = await supabase.from("support_messages").insert({
        chat_id: data.id,
        user_id: user.id,
        message: newChatInitialMessage,
        is_staff: false,
      });

      if (messageError) {
        console.error("Error sending initial message:", messageError);
      }

      // Update last_message_at
      await supabase
        .from("support_chats")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", data.id);

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
      setNewChatInitialMessage("");
      setCreateDialogOpen(false);
      
      // Trigger AI response for non-assigned chats
      if (!assignedTo && newChatInitialMessage.trim()) {
        try {
          await supabase.functions.invoke("ai-support-chat", {
            body: {
              messages: [{ role: "user", content: newChatInitialMessage }],
              chatId: data.id,
            },
          });
        } catch (aiError) {
          console.error("AI call error:", aiError);
          // AI is optional enhancement; don't block chat creation
        }
      }
      
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
      let toastMessage = 'Your support chat has been created. Our AI assistant will respond first, and staff will join if needed.';
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

      // Fetch messages for the new chat
      setTimeout(() => {
        fetchMessages(data.id);
      }, 1000);

    } catch (err) {
      console.error("Unexpected error:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
      // Get user info for the notification
      const { data: { user } } = await supabase.auth.getUser();
      const discordId = user?.user_metadata?.discord_id || user?.user_metadata?.provider_id;
      const discordUsername = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || 'Anonymous User';

      const { error } = await supabase
        .from("support_chats")
        .update({ 
          status: 'in_progress',
          priority: 'high',
          tags: ['human_requested']
        })
        .eq("id", selectedChat.id);

      if (error) throw error;

      // Send Discord channel notification with role ping (replaces DM notifications)
      try {
        const { data: notifyResult, error: notifyError } = await supabase.functions.invoke("notify-staff-discord-dm", {
          body: {
            chatId: selectedChat.id,
            userName: discordUsername,
            subject: selectedChat.subject || 'Support Request',
            userDiscordId: discordId,
          },
        });

        if (notifyError) {
          console.error("Failed to send staff channel notification:", notifyError);
        } else {
          console.log("Staff channel notification result:", notifyResult);
        }
      } catch (notifyErr) {
        console.error("Error invoking notify-staff-discord-dm:", notifyErr);
        // Don't fail the request if notifications fail
      }

      // Refresh chats to update UI
      await fetchChats();

      toast({
        title: "Human support requested",
        description: "A staff member will assist you shortly. They have been notified via Discord.",
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

        try {
          const { data, error } = await supabase.functions.invoke("ai-support-chat", {
            body: {
              messages: chatMessages,
              chatId: selectedChat.id,
            },
          });

          if (error) {
            console.error("AI response failed:", error);
          } else if (data?.escalated) {
            // If chat was auto-escalated, refresh chat data to show updated status
            await fetchChats();
            toast({
              title: "Escalated to Human Support",
              description: "Your request has been prioritized for immediate assistance.",
            });
          }
        } catch (aiError) {
          console.error("AI call error:", aiError);
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

  // If support chat is disabled, show alert
  if (!settingsLoading && !settings.support_chat_enabled) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <PageHeader
          title="Live Support Chat"
          description="Get real-time assistance from our support team"
          backgroundImage={headerSupport}
          pageKey="support"
        />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <FeatureDisabledAlert feature="support_chat" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader
        title={category === 'refund' ? "Refund Support" : "Live Support Chat"}
        description={category === 'refund' ? "Get assistance with refund requests and billing issues" : "Get real-time assistance from our AI and support team"}
        backgroundImage={headerSupport}
        pageKey="support"
      />

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-300px)]">
          {/* Chats List */}
          <Card className="relative overflow-hidden bg-gradient-to-b from-card to-card/80 backdrop-blur-xl border-border/30 shadow-xl">
            {/* Decorative gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,hsl(var(--primary)/0.08),transparent_50%)] pointer-events-none" />
            
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-semibold">Support Chats</CardTitle>
              </div>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20">
                    <Plus className="h-4 w-4 mr-2" />
                    New Chat
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {category === 'refund' ? (
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-primary" />
                          Create Refund Request
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-primary" />
                          Start New Support Chat
                        </div>
                      )}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto">
                    {category === 'refund' && (
                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">
                          <strong>Refund requests</strong> are prioritized and handled by our billing team. 
                          Please provide details about your purchase and reason for the refund request.
                        </p>
                      </div>
                    )}
                    
                    {/* Category Selection */}
                    {category !== 'refund' && (
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Select Category</Label>
                        <div className="grid gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedCategory('general')}
                            className={`flex items-center gap-4 p-3 rounded-lg border transition-all duration-200
                              bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 hover:border-yellow-500/60
                              ${selectedCategory === 'general' ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
                          >
                            <Ribbon className="w-5 h-5 text-yellow-500" />
                            <div className="text-left">
                              <p className="font-semibold text-foreground text-sm">General Support</p>
                              <p className="text-xs text-muted-foreground">Questions, guidance, or general assistance</p>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedCategory('ingame')}
                            className={`flex items-center gap-4 p-3 rounded-lg border transition-all duration-200
                              bg-gradient-to-r from-blue-500/20 to-blue-600/10 border-blue-500/30 hover:border-blue-500/60
                              ${selectedCategory === 'ingame' ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
                          >
                            <Globe className="w-5 h-5 text-blue-500" />
                            <div className="text-left">
                              <p className="font-semibold text-foreground text-sm">In-Game Support</p>
                              <p className="text-xs text-muted-foreground">In-game issues for whitelisted members</p>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedCategory('report')}
                            className={`flex items-center gap-4 p-3 rounded-lg border transition-all duration-200
                              bg-gradient-to-r from-red-500/20 to-red-600/10 border-red-500/30 hover:border-red-500/60
                              ${selectedCategory === 'report' ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
                          >
                            <AlertOctagon className="w-5 h-5 text-red-500" />
                            <div className="text-left">
                              <p className="font-semibold text-foreground text-sm">Player Report</p>
                              <p className="text-xs text-muted-foreground">Report rule violations or player misconduct</p>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedCategory('purchase')}
                            className={`flex items-center gap-4 p-3 rounded-lg border transition-all duration-200
                              bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 hover:border-emerald-500/60
                              ${selectedCategory === 'purchase' ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
                          >
                            <CreditCard className="w-5 h-5 text-emerald-500" />
                            <div className="text-left">
                              <p className="font-semibold text-foreground text-sm">Purchase Support</p>
                              <p className="text-xs text-muted-foreground">Store purchases, billing, or payment issues</p>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedCategory('bug')}
                            className={`flex items-center gap-4 p-3 rounded-lg border transition-all duration-200
                              bg-gradient-to-r from-orange-500/20 to-orange-600/10 border-orange-500/30 hover:border-orange-500/60
                              ${selectedCategory === 'bug' ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
                          >
                            <Bug className="w-5 h-5 text-orange-500" />
                            <div className="text-left">
                              <p className="font-semibold text-foreground text-sm">Bug Report</p>
                              <p className="text-xs text-muted-foreground">Report bugs, glitches, or technical problems</p>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        placeholder={category === 'refund' ? "Refund Request - Order #" : "Brief title for your request"}
                        value={newChatSubject}
                        onChange={(e) => setNewChatSubject(e.target.value)}
                        className="bg-background/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="initialMessage">Describe your issue</Label>
                      <Textarea
                        id="initialMessage"
                        placeholder={category === 'refund' 
                          ? "Please include your order number, what you purchased, and why you're requesting a refund..." 
                          : "Please describe your issue or question in detail. Our AI assistant will respond first, and a staff member will join if needed..."
                        }
                        value={newChatInitialMessage}
                        onChange={(e) => setNewChatInitialMessage(e.target.value)}
                        rows={4}
                        className="resize-none bg-background/50"
                      />
                      <p className="text-xs text-muted-foreground">
                        The more details you provide, the faster we can help you.
                      </p>
                    </div>
                    <Button 
                      onClick={createNewChat} 
                      disabled={loading || !newChatSubject.trim() || !newChatInitialMessage.trim()} 
                      className="w-full bg-gradient-to-r from-primary to-primary/80"
                    >
                      {loading ? "Creating..." : "Start Support Chat"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="relative p-0">
              <ScrollArea className="h-[calc(100vh-400px)]">
                {chats.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/20 flex items-center justify-center">
                      <MessageCircle className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">No support chats yet</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Click "New Chat" to get started</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/30">
                    {chats.map((chat) => {
                      const isEscalated = chat.tags?.includes('auto_escalated');
                      const isRefund = chat.tags?.includes('refund');
                      const isSelected = selectedChat?.id === chat.id;
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
                        <div
                          key={chat.id}
                          className={`w-full p-4 text-left transition-all duration-200 hover:bg-accent/50 group relative ${
                            isSelected 
                              ? "bg-gradient-to-r from-primary/10 to-transparent border-l-2 border-primary" 
                              : "border-l-2 border-transparent"
                          }`}
                        >
                          <button
                            onClick={() => setSelectedChat(chat)}
                            className="w-full text-left"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2 flex-1">
                                <span className="text-sm">{languageEmoji}</span>
                                <p className={`font-medium text-sm truncate ${isSelected ? 'text-primary' : ''}`}>
                                  {chat.subject}
                                </p>
                              </div>
                              <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ml-2 ${
                                chat.status === "open" 
                                  ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-500 border border-green-500/30" 
                                  : chat.status === "closed" 
                                    ? "bg-gray-500/20 text-gray-400 border border-gray-500/20" 
                                    : "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-500 border border-amber-500/30"
                              }`}>
                                {chat.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {isRefund && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/20 text-secondary flex items-center gap-1 border border-secondary/30">
                                  <CreditCard className="h-3 w-3" />
                                  Refund
                                </span>
                              )}
                              {isEscalated && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-500 flex items-center gap-1 border border-orange-500/30">
                                  <UserPlus className="h-3 w-3" />
                                  Escalated
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              {format(new Date(chat.last_message_at), "PPp")}
                            </p>
                          </button>
                          
                          {/* Delete button */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Support Chat</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this chat? This action cannot be undone and will permanently remove all messages in this conversation.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteChat(chat.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  disabled={deletingChatId === chat.id}
                                >
                                  {deletingChatId === chat.id ? "Deleting..." : "Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Messages Area */}
          <Card className="lg:col-span-2 relative overflow-hidden bg-gradient-to-b from-card to-card/80 backdrop-blur-xl border-border/30 shadow-xl flex flex-col">
            {/* Decorative gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,hsl(var(--primary)/0.05),transparent_40%)] pointer-events-none" />
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
                <CardContent className="relative flex-1 flex flex-col p-4">
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
                            <div className="flex flex-col gap-2 max-w-[80%]">
                              <div
                                className={`relative rounded-2xl px-4 py-3 shadow-lg ${
                                  message.is_staff
                                    ? "bg-gradient-to-br from-muted/80 to-muted/50 text-foreground border border-border/30"
                                    : "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
                                }`}
                              >
                                {isAiMessage && (
                                  <div className="flex items-center gap-2 mb-2 text-xs opacity-80">
                                    <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                                      <Sparkles className="h-3 w-3 text-blue-400" />
                                    </div>
                                    <span className="font-medium">AI Assistant</span>
                                  </div>
                                )}
                                <p className="text-sm leading-relaxed">{message.message}</p>
                                {message.attachment_url && (
                                  <a
                                    href={message.attachment_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 mt-2 text-xs underline hover:opacity-80 bg-background/20 px-3 py-2 rounded-lg"
                                  >
                                    <Download className="h-3 w-3" />
                                    {message.attachment_name} ({(message.attachment_size! / 1024).toFixed(1)}KB)
                                  </a>
                                )}
                                <p className="text-[10px] opacity-60 mt-2">
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
                  <div className="space-y-3 mt-4 pt-4 border-t border-border/20">
                    {attachment && (
                      <div className="flex items-center gap-2 text-sm bg-gradient-to-r from-primary/10 to-transparent px-4 py-2.5 rounded-xl border border-primary/20">
                        <Paperclip className="h-4 w-4 text-primary" />
                        <span className="flex-1 truncate font-medium">{attachment.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 rounded-full hover:bg-destructive/20 hover:text-destructive"
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
                        className="bg-background/50 hover:bg-background/80 border-border/50"
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && !uploading && sendMessage()}
                        disabled={uploading}
                        className="bg-background/50 border-border/50 focus-visible:ring-primary/30"
                      />
                      <Button 
                        onClick={sendMessage} 
                        size="icon" 
                        disabled={uploading}
                        className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="relative flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/20 flex items-center justify-center border border-border/30">
                    <MessageCircle className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                  <p className="text-lg font-medium text-muted-foreground">Select a chat</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Choose a conversation to view messages</p>
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
