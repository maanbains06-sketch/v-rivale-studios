import { useState, useEffect, useRef } from "react";
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
import { Ticket, Send, Clock, CheckCircle, AlertCircle, FileText, ArrowLeft, Upload, X, Image, Video, Plus, Headphones } from "lucide-react";
import { format } from "date-fns";
import slrpLogo from "@/assets/slrp-logo.png";

const ACCEPTED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILES = 5;

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

const TicketSupport = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // Form state - always start with empty values
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");
  const [discordId, setDiscordId] = useState("");
  const [steamId, setSteamId] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form fields when showing form
  const resetFormFields = () => {
    setCategory("");
    setSubject("");
    setDescription("");
    setPriority("normal");
    setDiscordId("");
    setSteamId("");
    setPlayerId("");
    setPlayerName("");
    setAttachments([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate files
    const validFiles: File[] = [];
    for (const file of files) {
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: `${file.name} is not a supported file type. Please upload images (JPG, PNG, GIF, WebP) or videos (MP4, WebM, MOV).`,
          variant: "destructive",
        });
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds the 50MB size limit.`,
          variant: "destructive",
        });
        continue;
      }
      validFiles.push(file);
    }

    // Check total count
    if (attachments.length + validFiles.length > MAX_FILES) {
      toast({
        title: "Too Many Files",
        description: `You can only upload up to ${MAX_FILES} files.`,
        variant: "destructive",
      });
      return;
    }

    setAttachments((prev) => [...prev, ...validFiles]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (userId: string, ticketId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (const file of attachments) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${ticketId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from("ticket-attachments")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });
      
      if (error) {
        console.error("Upload error:", error);
        throw new Error(`Failed to upload ${file.name}`);
      }
      
      const { data: urlData } = supabase.storage
        .from("ticket-attachments")
        .getPublicUrl(data.path);
      
      uploadedUrls.push(urlData.publicUrl);
    }
    
    return uploadedUrls;
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

  const submitTicket = async () => {
    if (!category || !subject.trim() || !description.trim() || !steamId.trim() || !playerId.trim() || !playerName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (Steam ID, Player ID, and Player Name).",
        variant: "destructive",
      });
      return;
    }

    if (attachments.length === 0) {
      toast({
        title: "Proof Required",
        description: "Please upload at least one image or video as proof for your ticket.",
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

      const discordUsername = user.user_metadata?.full_name || user.user_metadata?.name || null;

      // First create the ticket to get the ID
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
        })
        .select()
        .single();

      if (error) throw error;

      // Upload attachments
      setUploadingFiles(true);
      try {
        const uploadedUrls = await uploadFiles(user.id, data.id);
        
        // Update ticket with attachment URLs
        if (uploadedUrls.length > 0) {
          await supabase
            .from("support_tickets")
            .update({ attachments: uploadedUrls })
            .eq("id", data.id);
        }
      } catch (uploadError) {
        console.error("Failed to upload attachments:", uploadError);
        toast({
          title: "Warning",
          description: "Ticket created but some attachments failed to upload.",
          variant: "destructive",
        });
      } finally {
        setUploadingFiles(false);
      }

      toast({
        title: "Ticket Submitted",
        description: `Your ticket ${data.ticket_number} has been submitted successfully.`,
      });

      // Send Discord notification for new ticket
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

      // Reset form
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
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">Open</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">In Progress</Badge>;
      case "resolved":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Resolved</Badge>;
      case "closed":
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50">Closed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "high":
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">High</Badge>;
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Custom Dark Header Section */}
      <section className="relative pt-20">
        <div className="bg-gradient-to-r from-[#1a1f2e] via-[#1e2538] to-[#1a1f2e] border-b border-primary/20">
          <div className="container mx-auto px-4">
            {/* Main Header with Logo */}
            <div className="flex items-center gap-6 py-8">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                <img 
                  src={slrpLogo} 
                  alt="Skylife RP Logo" 
                  className="w-24 h-24 md:w-32 md:h-32 object-contain relative z-10 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                />
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-bold text-white tracking-wide uppercase">
                  Skylife Roleplay India
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  <Headphones className="w-5 h-5 text-primary" />
                  <span className="text-lg md:text-xl text-primary font-semibold uppercase tracking-wider">
                    Ticket Support
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Section Header Bar */}
        <div className="bg-gradient-to-r from-[#12151f] via-[#161a26] to-[#12151f] border-b border-white/5">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between py-4">
              <h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-wide flex items-center gap-3">
                <Ticket className="w-6 h-6 text-primary" />
                Support Tickets
              </h2>
              {!showForm && !selectedTicket && (
                <Button 
                  onClick={() => setShowForm(true)}
                  className="bg-[#1e2538] hover:bg-[#252b3d] border border-primary/30 text-white px-6 uppercase tracking-wide text-sm font-semibold"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Ticket
                </Button>
              )}
              {(showForm || selectedTicket) && (
                <Button 
                  variant="ghost"
                  onClick={() => {
                    setShowForm(false);
                    setSelectedTicket(null);
                  }}
                  className="text-muted-foreground hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Tickets
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8">
        {/* Ticket Details View */}
        {selectedTicket ? (
          <div className="max-w-3xl mx-auto">
            <Card className="bg-[#1a1f2e] border-primary/20 shadow-xl">
              <CardHeader className="border-b border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Ticket className="w-5 h-5 text-primary" />
                      {selectedTicket.ticket_number}
                    </CardTitle>
                    <CardDescription className="mt-1 text-gray-400">
                      Submitted on {format(new Date(selectedTicket.created_at), "PPP 'at' p")}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadge(selectedTicket.status)}
                    {getPriorityBadge(selectedTicket.priority)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div>
                  <Label className="text-gray-400 text-sm">Category</Label>
                  <p className="font-medium text-white">{getCategoryLabel(selectedTicket.category)}</p>
                </div>

                <div>
                  <Label className="text-gray-400 text-sm">Subject</Label>
                  <p className="font-medium text-white">{selectedTicket.subject}</p>
                </div>

                <div>
                  <Label className="text-gray-400 text-sm">Description</Label>
                  <p className="whitespace-pre-wrap text-sm mt-1 p-4 rounded-lg bg-black/30 text-gray-300 border border-white/5">
                    {selectedTicket.description}
                  </p>
                </div>

                {selectedTicket.resolution && (
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                    <Label className="text-green-400">Resolution</Label>
                    <p className="text-sm mt-1 whitespace-pre-wrap text-gray-300">{selectedTicket.resolution}</p>
                    {selectedTicket.resolved_at && (
                      <p className="text-xs text-gray-500 mt-2">
                        Resolved on {format(new Date(selectedTicket.resolved_at), "PPP 'at' p")}
                      </p>
                    )}
                  </div>
                )}

                {selectedTicket.admin_notes && (
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <Label className="text-blue-400">Staff Notes</Label>
                    <p className="text-sm mt-1 whitespace-pre-wrap text-gray-300">{selectedTicket.admin_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : showForm ? (
          /* New Ticket Form */
          <div className="max-w-2xl mx-auto">
            <Card className="bg-[#1a1f2e] border-primary/20 shadow-xl">
              <CardHeader className="border-b border-white/5">
                <CardTitle className="flex items-center gap-2 text-white">
                  <FileText className="w-5 h-5 text-primary" />
                  Submit New Ticket
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Please provide as much detail as possible to help us resolve your issue quickly.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="player_id" className="text-gray-300">Player ID (In-Game) *</Label>
                    <Input
                      id="player_id"
                      value={playerId}
                      onChange={(e) => setPlayerId(e.target.value)}
                      placeholder="Your in-game player ID"
                      className="bg-black/30 border-white/10 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="player_name" className="text-gray-300">Player Name (In-Game) *</Label>
                    <Input
                      id="player_name"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Your character name"
                      className="bg-black/30 border-white/10 text-white placeholder:text-gray-500"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="steam_id" className="text-gray-300">Steam ID *</Label>
                    <Input
                      id="steam_id"
                      value={steamId}
                      onChange={(e) => setSteamId(e.target.value)}
                      placeholder="Your Steam ID"
                      className="bg-black/30 border-white/10 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discord_id" className="text-gray-300">Discord ID</Label>
                    <Input
                      id="discord_id"
                      value={discordId}
                      onChange={(e) => setDiscordId(e.target.value)}
                      placeholder="Optional"
                      className="bg-black/30 border-white/10 text-white placeholder:text-gray-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-gray-300">Category *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="bg-black/30 border-white/10 text-white">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1f2e] border-white/10">
                      {ticketCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value} className="text-white hover:bg-white/5">
                          <div className="flex flex-col">
                            <span>{cat.label}</span>
                            <span className="text-xs text-gray-500">{cat.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-gray-300">Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="bg-black/30 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1f2e] border-white/10">
                      {priorityOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-white hover:bg-white/5">
                          <div className="flex flex-col">
                            <span>{opt.label}</span>
                            <span className="text-xs text-gray-500">{opt.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-gray-300">Subject *</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder=""
                    maxLength={100}
                    className="bg-black/30 border-white/10 text-white placeholder:text-gray-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-gray-300">Description *</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder=""
                    rows={8}
                    className="resize-none bg-black/30 border-white/10 text-white placeholder:text-gray-500"
                  />
                  <p className="text-xs text-gray-500">
                    Be as detailed as possible about your issue.
                  </p>
                </div>

                {/* File Upload Section */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-gray-300">
                    <Upload className="w-4 h-4" />
                    Proof (Images/Videos) *
                  </Label>
                  <p className="text-xs text-gray-500 -mt-1">
                    Upload screenshots or video evidence to support your ticket. At least 1 file is required.
                  </p>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_FILE_TYPES.join(",")}
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-primary/30 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors bg-black/20"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex gap-2">
                        <Image className="w-8 h-8 text-primary/60" />
                        <Video className="w-8 h-8 text-primary/60" />
                      </div>
                      <p className="text-sm font-medium text-gray-300">Click to upload files</p>
                      <p className="text-xs text-gray-500">
                        JPG, PNG, GIF, WebP, MP4, WebM, MOV (max 50MB each, up to 5 files)
                      </p>
                    </div>
                  </div>

                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-300">Selected Files ({attachments.length}/{MAX_FILES}):</p>
                      <div className="grid gap-2">
                        {attachments.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 rounded-lg bg-black/30 border border-white/5"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {file.type.startsWith("image/") ? (
                                <Image className="w-5 h-5 text-blue-400 flex-shrink-0" />
                              ) : (
                                <Video className="w-5 h-5 text-purple-400 flex-shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate text-gray-300">{file.name}</p>
                                <p className="text-xs text-gray-500">
                                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeAttachment(index)}
                              className="flex-shrink-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {attachments.length === 0 && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      At least one proof file is required
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="flex-1 border-white/10 text-gray-300 hover:bg-white/5"
                    disabled={submitting || uploadingFiles}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={submitTicket}
                    disabled={submitting || uploadingFiles || attachments.length === 0}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    {submitting || uploadingFiles ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        {uploadingFiles ? "Uploading..." : "Submitting..."}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Ticket
                      </>
                    )}
                  </Button>
                </div>

                <div className="p-4 rounded-lg bg-black/30 border border-white/5">
                  <h4 className="font-medium text-sm mb-2 text-gray-300">📋 Ticket Guidelines</h4>
                  <ul className="text-xs text-gray-500 space-y-1">
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
            {loading ? (
              <div className="text-center py-12">
                <Clock className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
                <p className="text-gray-400">Loading tickets...</p>
              </div>
            ) : tickets.length === 0 ? (
              <Card className="bg-[#1a1f2e] border-primary/20 shadow-xl">
                <CardContent className="py-12 text-center">
                  <Ticket className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <h3 className="text-xl font-semibold mb-2 text-white">No Tickets Yet</h3>
                  <p className="text-gray-400 mb-6">
                    You haven't submitted any support tickets. Create one to get help from our team.
                  </p>
                  <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90">
                    <Ticket className="w-4 h-4 mr-2" />
                    Create Your First Ticket
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <Card 
                    key={ticket.id}
                    className="bg-[#1a1f2e] border-white/5 hover:border-primary/50 transition-all cursor-pointer shadow-lg"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-mono text-sm text-primary">{ticket.ticket_number}</span>
                            <Badge variant="outline" className="text-xs border-white/10 text-gray-400">
                              {getCategoryLabel(ticket.category)}
                            </Badge>
                          </div>
                          <h3 className="font-medium truncate text-white">{ticket.subject}</h3>
                          <p className="text-sm text-gray-500 truncate mt-1">
                            {ticket.description.substring(0, 100)}...
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 ml-4">
                          <div className="flex gap-2">
                            {getStatusBadge(ticket.status)}
                            {getPriorityBadge(ticket.priority)}
                          </div>
                          <span className="text-xs text-gray-500">
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
