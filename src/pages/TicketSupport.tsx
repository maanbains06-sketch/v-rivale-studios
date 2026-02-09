import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Ticket, Send, Clock, CheckCircle, FileText, ArrowLeft, Upload, X, Image as ImageIcon, Video, Plus, AlertCircle, Wrench, Pause, XCircle, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import AnimatedSLRPLogo from "@/components/AnimatedSLRPLogo";

interface SupportTicket {
  id: string;
  ticket_number: string;
  category: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  admin_notes: string | null;
  resolution: string | null;
  created_at: string;
  resolved_at: string | null;
  player_id: string | null;
  player_name: string | null;
  attachments: string[] | null;
}

const ticketCategories = [
  { value: 'whitelist', label: 'Whitelist Issue', description: 'Problems with whitelist status or access' },
  { value: 'refund', label: 'Refund Request', description: 'Request a refund for in-game or store purchases' },
  { value: 'account', label: 'Account Issue', description: 'Problems with your account or login' },
  { value: 'technical', label: 'Technical Support', description: 'Game crashes, connection issues, etc.' },
  { value: 'staff_complaint', label: 'Staff Complaint', description: 'Report staff misconduct (confidential)' },
  { value: 'ban_inquiry', label: 'Ban Inquiry', description: 'Questions about your ban (not an appeal)' },
  { value: 'other', label: 'Other', description: 'Other issues not listed above' },
];

const priorityOptions = [
  { value: 'low', label: 'Low', description: 'General inquiry, no urgency' },
  { value: 'normal', label: 'Normal', description: 'Standard issue requiring attention' },
  { value: 'high', label: 'High', description: 'Urgent matter affecting gameplay' },
  { value: 'critical', label: 'Critical', description: 'Severe issue requiring immediate action' },
];

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];

const TicketSupport = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // Form state
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");
  const [discordId, setDiscordId] = useState("");
  const [steamId, setSteamId] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const resetFormFields = () => {
    setCategory("");
    setSubject("");
    setDescription("");
    setPriority("normal");
    setDiscordId("");
    setSteamId("");
    setPlayerId("");
    setPlayerName("");
    setFiles([]);
  };

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  // Real-time subscription for ticket updates
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('user-tickets-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'support_tickets',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setTickets(prev => [payload.new as SupportTicket, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              setTickets(prev => prev.map(t => 
                t.id === (payload.new as SupportTicket).id ? payload.new as SupportTicket : t
              ));
              // Update selected ticket if it's the one being updated
              if (selectedTicket?.id === (payload.new as SupportTicket).id) {
                setSelectedTicket(payload.new as SupportTicket);
              }
            } else if (payload.eventType === 'DELETE') {
              setTickets(prev => prev.filter(t => t.id !== (payload.old as SupportTicket).id));
              if (selectedTicket?.id === (payload.old as SupportTicket).id) {
                setSelectedTicket(null);
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupRealtimeSubscription();
  }, [selectedTicket]);

  const checkAuthAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to access ticket support.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    fetchTickets();
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Users can only see their own tickets
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    const validFiles = selectedFiles.filter(file => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported format.`,
          variant: "destructive",
        });
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 10MB limit.`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    if (files.length + validFiles.length > MAX_FILES) {
      toast({
        title: "Too many files",
        description: `Maximum ${MAX_FILES} files allowed.`,
        variant: "destructive",
      });
      return;
    }

    setFiles(prev => [...prev, ...validFiles]);
    e.target.value = '';
  }, [files, toast]);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (userId: string): Promise<string[]> => {
    if (files.length === 0) return [];
    
    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('ticket-attachments')
          .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('ticket-attachments')
          .getPublicUrl(data.path);

        uploadedUrls.push(publicUrl);
      }
    } finally {
      setUploading(false);
    }

    return uploadedUrls;
  };

  const submitTicket = async () => {
    // Validate required fields
    if (!category || !subject.trim() || !description.trim() || !steamId.trim() || !playerId.trim() || !playerName.trim() || !discordId.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (Discord ID, Steam ID, Player ID, Player Name).",
        variant: "destructive",
      });
      return;
    }

    // Validate Discord ID format
    if (!/^\d{17,19}$/.test(discordId.trim())) {
      toast({
        title: "Invalid Discord ID",
        description: "Discord ID must be 17-19 digits.",
        variant: "destructive",
      });
      return;
    }

    if (files.length === 0) {
      toast({
        title: "Proof Required",
        description: "Please upload at least one image or video as proof.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Upload files first
      const attachmentUrls = await uploadFiles(user.id);

      const discordUsername = user.user_metadata?.full_name || user.user_metadata?.name || null;

      const { data, error } = await supabase
        .from("support_tickets")
        .insert({
          user_id: user.id,
          discord_id: discordId.trim(),
          discord_username: discordUsername,
          steam_id: steamId.trim(),
          player_id: playerId.trim(),
          player_name: playerName.trim(),
          category,
          subject,
          description,
          priority,
          attachments: attachmentUrls,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Ticket Submitted",
        description: `Your ticket ${data.ticket_number} has been submitted successfully.`,
      });

      // Send Discord notification
      try {
        await supabase.functions.invoke("send-ticket-notification", {
          body: {
            ticketId: data.id,
            status: "open",
            isNew: true,
          },
        });
      } catch (notifyError) {
        console.error("Failed to send Discord notification:", notifyError);
      }

      resetFormFields();
      setShowForm(false);
      fetchTickets();
    } catch (error: any) {
      console.error("Error submitting ticket:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.3)] animate-pulse">
            <span className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse" />
            Open
          </Badge>
        );
      case "in_review":
      case "in_progress":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.3)]">
            <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse" />
            In Review
          </Badge>
        );
      case "waiting":
      case "on_hold":
        return (
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.3)]">
            <span className="w-2 h-2 bg-orange-400 rounded-full mr-2" />
            Waiting
          </Badge>
        );
      case "resolved":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.3)]">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-2" />
            Resolved
          </Badge>
        );
      case "closed":
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50">
            <span className="w-2 h-2 bg-gray-400 rounded-full mr-2" />
            Closed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "high":
        return <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/50">High</Badge>;
      case "normal":
        return <Badge variant="secondary">Normal</Badge>;
      case "low":
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50">Low</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const getCategoryLabel = (value: string) => {
    return ticketCategories.find(c => c.value === value)?.label || value;
  };

  const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  const isVideo = (url: string) => /\.(mp4|webm|mov)$/i.test(url);

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "open":
        return (
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/20 via-blue-500/10 to-blue-600/20 border border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/30 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-blue-400 animate-pulse" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-blue-400 text-lg flex items-center gap-2">
                  Ticket Received
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                </h4>
                <p className="text-blue-100/80 text-sm mt-1">
                  Your ticket has been successfully submitted and is waiting to be assigned to a staff member. 
                  Our team will review your request shortly. Thank you for your patience!
                </p>
              </div>
            </div>
          </div>
        );
      case "in_review":
      case "in_progress":
        return (
          <div className="p-4 rounded-xl bg-gradient-to-r from-yellow-500/20 via-yellow-500/10 to-amber-500/20 border border-yellow-500/40 shadow-[0_0_20px_rgba(234,179,8,0.15)]">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/30 flex items-center justify-center flex-shrink-0">
                <Wrench className="w-5 h-5 text-yellow-400 animate-pulse" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-yellow-400 text-lg flex items-center gap-2">
                  Under Review
                  <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                </h4>
                <p className="text-yellow-100/80 text-sm mt-1">
                  Great news! A staff member is actively working on your ticket. They are reviewing the details 
                  and investigating your issue. You will receive an update soon with a resolution or follow-up questions.
                </p>
              </div>
            </div>
          </div>
        );
      case "waiting":
      case "on_hold":
        return (
          <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500/20 via-orange-500/10 to-amber-600/20 border border-orange-500/40 shadow-[0_0_20px_rgba(249,115,22,0.15)]">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500/30 flex items-center justify-center flex-shrink-0">
                <Pause className="w-5 h-5 text-orange-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-orange-400 text-lg flex items-center gap-2">
                  Waiting for Your Response
                  <MessageSquare className="w-4 h-4 text-orange-400" />
                </h4>
                <p className="text-orange-100/80 text-sm mt-1">
                  We need additional information from you to proceed with your ticket. Please check the staff notes 
                  below and provide the requested details. Your ticket will remain on hold until we receive your response.
                </p>
              </div>
            </div>
          </div>
        );
      case "resolved":
        return (
          <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/20 via-green-500/10 to-emerald-500/20 border border-green-500/40 shadow-[0_0_20px_rgba(34,197,94,0.15)]">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/30 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-green-400 text-lg flex items-center gap-2">
                  Issue Resolved ✓
                </h4>
                <p className="text-green-100/80 text-sm mt-1">
                  Your ticket has been successfully resolved! The solution has been provided below. If you're satisfied 
                  with the resolution, no further action is needed. If you have any follow-up questions, feel free to 
                  submit a new ticket referencing this one.
                </p>
              </div>
            </div>
          </div>
        );
      case "closed":
        return (
          <div className="p-4 rounded-xl bg-gradient-to-r from-gray-500/20 via-gray-500/10 to-slate-500/20 border border-gray-500/40">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-500/30 flex items-center justify-center flex-shrink-0">
                <XCircle className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-400 text-lg">
                  Ticket Closed
                </h4>
                <p className="text-gray-300/80 text-sm mt-1">
                  This ticket has been closed and is now archived. If you still need assistance with a similar issue, 
                  please submit a new ticket with updated details. We're always here to help!
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Custom Header - Compact Premium Design */}
      <div className="relative w-full overflow-hidden pt-16 md:pt-20">
        {/* Multi-layer background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent" />
        
        {/* Subtle floating orbs */}
        <div className="absolute top-4 left-[10%] w-20 h-20 bg-primary/15 rounded-full blur-2xl" />
        <div className="absolute bottom-2 right-[15%] w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl" />
        
        <div className="relative container mx-auto px-4 py-6 md:py-8">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
            {/* Animated SLRP Logo - Smaller size */}
            <AnimatedSLRPLogo size="sm" />
            
            <div className="flex flex-col text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-black tracking-wider text-white uppercase">
                SKYLIFE ROLEPLAY{' '}
                <span 
                  className="font-black italic inline-block"
                  style={{
                    background: 'linear-gradient(90deg, #FF9933 0%, #FFFFFF 50%, #138808 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  INDIA
                </span>
              </h1>
              <p className="text-sm md:text-base text-primary/80 font-semibold tracking-[0.3em] uppercase mt-1">
                Ticket Support
              </p>
            </div>
          </div>
        </div>
        
        {/* Bottom decorative border */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      </div>

      <main className="container mx-auto px-4 py-8 relative">
        {/* Ambient background effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl" />
        </div>

        {/* Ticket Details View */}
        {selectedTicket ? (
          <div className="max-w-3xl mx-auto">
            <Button 
              variant="ghost" 
              onClick={() => setSelectedTicket(null)}
              className="mb-6 group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Tickets
            </Button>

            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl shadow-2xl">
              {/* Card glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-cyan-500/10 pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              
              <CardHeader className="relative">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Ticket className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-mono text-primary">{selectedTicket.ticket_number}</span>
                    </CardTitle>
                    <CardDescription className="mt-2 ml-13">
                      Submitted on {format(new Date(selectedTicket.created_at), "PPP 'at' p")}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {getStatusBadge(selectedTicket.status)}
                    {getPriorityBadge(selectedTicket.priority)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 relative">
                {/* Status Message Banner */}
                {getStatusMessage(selectedTicket.status)}

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Category</Label>
                    <p className="font-semibold mt-1">{getCategoryLabel(selectedTicket.category)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Player ID</Label>
                    <p className="font-mono mt-1 text-primary">{selectedTicket.player_id || '-'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider">Player Name</Label>
                    <p className="font-semibold mt-1">{selectedTicket.player_name || '-'}</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Subject</Label>
                  <p className="font-semibold mt-1 text-lg">{selectedTicket.subject}</p>
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Description</Label>
                  <div className="mt-2 whitespace-pre-wrap text-sm text-foreground/80 leading-relaxed">
                    {selectedTicket.description}
                  </div>
                </div>

                {/* Attachments Display */}
                {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Attachments ({selectedTicket.attachments.length})
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                      {selectedTicket.attachments.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-xl overflow-hidden border-2 border-white/10 hover:border-primary/50 transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/10"
                        >
                          {isImage(url) ? (
                            <img src={url} alt={`Attachment ${idx + 1}`} className="w-full h-28 object-cover" />
                          ) : isVideo(url) ? (
                            <div className="w-full h-28 bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                              <Video className="w-10 h-10 text-purple-400" />
                            </div>
                          ) : (
                            <div className="w-full h-28 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                              <FileText className="w-10 h-10 text-blue-400" />
                            </div>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTicket.resolution && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30">
                    <Label className="text-green-400 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Resolution
                    </Label>
                    <p className="text-sm mt-2 whitespace-pre-wrap text-green-100/80">{selectedTicket.resolution}</p>
                    {selectedTicket.resolved_at && (
                      <p className="text-xs text-green-400/60 mt-3">
                        Resolved on {format(new Date(selectedTicket.resolved_at), "PPP 'at' p")}
                      </p>
                    )}
                  </div>
                )}

                {selectedTicket.admin_notes && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/30">
                    <Label className="text-blue-400 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Staff Notes
                    </Label>
                    <p className="text-sm mt-2 whitespace-pre-wrap text-blue-100/80">{selectedTicket.admin_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : showForm ? (
          /* New Ticket Form */
          <div className="max-w-2xl mx-auto">
            <Button 
              variant="ghost" 
              onClick={() => setShowForm(false)}
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tickets
            </Button>

            <Card className="glass-effect border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Submit New Ticket
                </CardTitle>
                <CardDescription>
                  Please provide as much detail as possible to help us resolve your issue quickly.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Player Info Section */}
                <div className="p-4 rounded-lg bg-muted/30 border border-border/30 space-y-4">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-primary" />
                    Player Information (Required)
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="player_id">Player ID (In-Game) *</Label>
                      <Input
                        id="player_id"
                        value={playerId}
                        onChange={(e) => setPlayerId(e.target.value)}
                        placeholder="e.g., 123"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="player_name">Player Name (In-Game) *</Label>
                      <Input
                        id="player_name"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="e.g., John_Doe"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="steam_id">Steam ID *</Label>
                      <Input
                        id="steam_id"
                        value={steamId}
                        onChange={(e) => setSteamId(e.target.value)}
                        placeholder="steam:xxxxxx"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discord_id">Discord ID *</Label>
                      <Input
                        id="discord_id"
                        value={discordId}
                        onChange={(e) => setDiscordId(e.target.value)}
                        placeholder="e.g., 123456789012345678"
                        required
                      />
                      <p className="text-xs text-muted-foreground">Your 17-19 digit Discord ID</p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {ticketCategories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief summary of your issue"
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your issue in detail..."
                    rows={6}
                    className="resize-none"
                  />
                </div>

                {/* File Upload Section */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Image/Video Proof * (Required)
                  </Label>
                  <div className="border-2 border-dashed border-border/50 rounded-lg p-4 hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center cursor-pointer py-4"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                        <Plus className="w-6 h-6 text-primary" />
                      </div>
                      <p className="text-sm font-medium">Click to upload files</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Images (JPG, PNG, GIF) or Videos (MP4, WebM) • Max 10MB each • Up to {MAX_FILES} files
                      </p>
                    </label>
                  </div>

                  {/* File Preview */}
                  {files.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {files.map((file, idx) => (
                        <div key={idx} className="relative group rounded-lg overflow-hidden border border-border/50">
                          {file.type.startsWith('image/') ? (
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              className="w-full h-20 object-cover"
                            />
                          ) : (
                            <div className="w-full h-20 bg-muted flex items-center justify-center">
                              <Video className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                            <p className="text-xs text-white truncate">{file.name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {files.length === 0 && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      At least one image or video is required as proof
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={submitTicket}
                    disabled={submitting || uploading}
                    className="flex-1"
                  >
                    {submitting || uploading ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        {uploading ? "Uploading..." : "Submitting..."}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Ticket
                      </>
                    )}
                  </Button>
                </div>

                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <h4 className="font-medium text-sm mb-2">📋 Ticket Guidelines</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Tickets are reviewed within 24-48 hours</li>
                    <li>• For urgent in-game issues, use Live Chat Support instead</li>
                    <li>• Ban appeals should be submitted separately</li>
                    <li>• Please do not submit duplicate tickets</li>
                    <li>• Staff complaints are handled confidentially</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Tickets List */
          <div className="max-w-4xl mx-auto">
            {/* Header with Create Button - Premium Design */}
            <div className="relative flex items-center justify-between mb-8 p-6 rounded-2xl overflow-hidden">
              {/* Background effects */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-cyan-500/10" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
              
              <div className="relative flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-cyan-500/20 flex items-center justify-center border border-white/10">
                  <Ticket className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider text-white">Support Tickets</h2>
                  <p className="text-sm text-muted-foreground">Manage your support requests</p>
                </div>
              </div>
              <Button 
                onClick={() => { resetFormFields(); setShowForm(true); }}
                className="relative bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 text-white border-0 shadow-lg shadow-primary/25 uppercase tracking-wider font-bold px-6 transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/30"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Ticket
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                  <Clock className="w-8 h-8 animate-spin text-primary" />
                </div>
                <p className="text-muted-foreground">Loading your tickets...</p>
              </div>
            ) : tickets.length === 0 ? (
              <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-cyan-500/5" />
                <CardContent className="py-16 text-center relative">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-cyan-500/20 flex items-center justify-center border border-white/10">
                    <Ticket className="w-12 h-12 text-primary/50" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">No Tickets Yet</h3>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                    You haven't submitted any support tickets. Create one to get help from our team.
                  </p>
                  <Button 
                    onClick={() => { resetFormFields(); setShowForm(true); }}
                    className="bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 text-white shadow-lg shadow-primary/25"
                  >
                    <Ticket className="w-4 h-4 mr-2" />
                    Create Your First Ticket
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket, idx) => (
                  <Card 
                    key={ticket.id}
                    className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-900/80 via-slate-800/80 to-slate-900/80 backdrop-blur-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/10 group"
                    onClick={() => setSelectedTicket(ticket)}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    {/* Hover glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-primary/50 transition-colors" />
                    
                    <CardContent className="py-5 relative">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className="font-mono text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                              {ticket.ticket_number}
                            </span>
                            <Badge variant="outline" className="text-xs border-white/20 bg-white/5">
                              {getCategoryLabel(ticket.category)}
                            </Badge>
                            {ticket.attachments && ticket.attachments.length > 0 && (
                              <Badge className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/30">
                                <ImageIcon className="w-3 h-3 mr-1" />
                                {ticket.attachments.length}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">{ticket.subject}</h3>
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {ticket.description.substring(0, 100)}...
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="flex gap-2 flex-wrap justify-end">
                            {getStatusBadge(ticket.status)}
                            {getPriorityBadge(ticket.priority)}
                          </div>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(ticket.created_at), "MMM d, yyyy")}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default TicketSupport;