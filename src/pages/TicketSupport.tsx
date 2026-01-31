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
import { Ticket, Send, Clock, CheckCircle, FileText, ArrowLeft, Upload, X, Image as ImageIcon, Video, Plus, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import slrpLogo from "@/assets/slrp-logo.png";

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
    if (!category || !subject.trim() || !description.trim() || !steamId.trim() || !playerId.trim() || !playerName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (Steam ID, Player ID, Player Name).",
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
          discord_id: discordId || null,
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
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/50">Open</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50">Working On It</Badge>;
      case "on_hold":
        return <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/50">On Hold</Badge>;
      case "resolved":
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/50">Resolved</Badge>;
      case "closed":
        return <Badge className="bg-gray-500/20 text-gray-500 border-gray-500/50">Closed</Badge>;
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Custom Header - Matching Reference Design */}
      <div className="relative w-full bg-gradient-to-r from-background via-card to-background border-b border-border/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <img 
              src={slrpLogo} 
              alt="SKYLIFE ROLEPLAY" 
              className="w-16 h-16 md:w-20 md:h-20 object-contain"
            />
            <div>
              <h1 className="text-xl md:text-3xl font-black tracking-wide text-foreground uppercase">
                SKYLIFE ROLEPLAY INDIA
              </h1>
              <p className="text-sm md:text-lg text-muted-foreground font-medium tracking-widest uppercase">
                Ticket Support
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {/* Ticket Details View */}
        {selectedTicket ? (
          <div className="max-w-3xl mx-auto">
            <Button 
              variant="ghost" 
              onClick={() => setSelectedTicket(null)}
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tickets
            </Button>

            <Card className="glass-effect border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Ticket className="w-5 h-5 text-primary" />
                      {selectedTicket.ticket_number}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Submitted on {format(new Date(selectedTicket.created_at), "PPP 'at' p")}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {getStatusBadge(selectedTicket.status)}
                    {getPriorityBadge(selectedTicket.priority)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">Category</Label>
                    <p className="font-medium">{getCategoryLabel(selectedTicket.category)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Player ID</Label>
                    <p className="font-mono">{selectedTicket.player_id || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Player Name</Label>
                    <p className="font-medium">{selectedTicket.player_name || '-'}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">Subject</Label>
                  <p className="font-medium">{selectedTicket.subject}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">Description</Label>
                  <div className="p-3 rounded-lg bg-muted/50 mt-1 whitespace-pre-wrap text-sm">
                    {selectedTicket.description}
                  </div>
                </div>

                {/* Attachments Display */}
                {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Attachments</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                      {selectedTicket.attachments.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-lg overflow-hidden border border-border/50 hover:border-primary/50 transition-colors"
                        >
                          {isImage(url) ? (
                            <img src={url} alt={`Attachment ${idx + 1}`} className="w-full h-24 object-cover" />
                          ) : isVideo(url) ? (
                            <div className="w-full h-24 bg-muted flex items-center justify-center">
                              <Video className="w-8 h-8 text-muted-foreground" />
                            </div>
                          ) : (
                            <div className="w-full h-24 bg-muted flex items-center justify-center">
                              <FileText className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTicket.resolution && (
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                    <Label className="text-green-500">Resolution</Label>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{selectedTicket.resolution}</p>
                    {selectedTicket.resolved_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Resolved on {format(new Date(selectedTicket.resolved_at), "PPP 'at' p")}
                      </p>
                    )}
                  </div>
                )}

                {selectedTicket.admin_notes && (
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <Label className="text-blue-500">Staff Notes</Label>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{selectedTicket.admin_notes}</p>
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
                      <Label htmlFor="discord_id">Discord ID (Optional)</Label>
                      <Input
                        id="discord_id"
                        value={discordId}
                        onChange={(e) => setDiscordId(e.target.value)}
                        placeholder=""
                      />
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
            {/* Header with Create Button - Matching Reference */}
            <div className="flex items-center justify-between mb-6 p-4 rounded-xl bg-card/50 border border-border/30">
              <h2 className="text-xl md:text-2xl font-bold uppercase tracking-wide">Support Tickets</h2>
              <Button 
                onClick={() => { resetFormFields(); setShowForm(true); }}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Ticket
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <Clock className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading tickets...</p>
              </div>
            ) : tickets.length === 0 ? (
              <Card className="glass-effect border-border/20">
                <CardContent className="py-12 text-center">
                  <Ticket className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                  <h3 className="text-xl font-semibold mb-2">No Tickets Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    You haven't submitted any support tickets. Create one to get help from our team.
                  </p>
                  <Button onClick={() => { resetFormFields(); setShowForm(true); }}>
                    <Ticket className="w-4 h-4 mr-2" />
                    Create Your First Ticket
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <Card 
                    key={ticket.id}
                    className="glass-effect border-border/20 hover:border-primary/50 transition-all cursor-pointer"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <span className="font-mono text-sm text-primary">{ticket.ticket_number}</span>
                            <Badge variant="outline" className="text-xs">
                              {getCategoryLabel(ticket.category)}
                            </Badge>
                            {ticket.attachments && ticket.attachments.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                <ImageIcon className="w-3 h-3 mr-1" />
                                {ticket.attachments.length}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-medium truncate">{ticket.subject}</h3>
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {ticket.description.substring(0, 80)}...
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="flex gap-2 flex-wrap justify-end">
                            {getStatusBadge(ticket.status)}
                            {getPriorityBadge(ticket.priority)}
                          </div>
                          <span className="text-xs text-muted-foreground">
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