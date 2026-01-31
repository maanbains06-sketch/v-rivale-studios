import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Ticket, Send, Clock, CheckCircle, AlertCircle, FileText, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import headerSupport from "@/assets/header-support.jpg";

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

  // Reset form fields when showing form
  const resetFormFields = () => {
    setCategory("");
    setSubject("");
    setDescription("");
    setPriority("normal");
    setSteamId("");
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

    // Get Discord ID from user metadata
    const userDiscordId = user.user_metadata?.discord_id || user.user_metadata?.provider_id;
    if (userDiscordId) {
      setDiscordId(userDiscordId);
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
    if (!category || !subject.trim() || !description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
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

      const { data, error } = await supabase
        .from("support_tickets")
        .insert({
          user_id: user.id,
          discord_id: discordId || null,
          discord_username: discordUsername,
          steam_id: steamId || null,
          category,
          subject,
          description,
          priority,
        })
        .select()
        .single();

      if (error) throw error;

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
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/50">Open</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50">In Progress</Badge>;
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <PageHeader 
        title="Ticket Support"
        description="Submit a formal support ticket for issues that require detailed investigation. Our team will respond within 24-48 hours."
        backgroundImage={headerSupport}
        pageKey="ticket-support"
      />

      <main className="container mx-auto px-4 py-12">
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Ticket className="w-5 h-5 text-primary" />
                      {selectedTicket.ticket_number}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Submitted on {format(new Date(selectedTicket.created_at), "PPP 'at' p")}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadge(selectedTicket.status)}
                    {getPriorityBadge(selectedTicket.priority)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <p className="font-medium">{getCategoryLabel(selectedTicket.category)}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Subject</Label>
                  <p className="font-medium">{selectedTicket.subject}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="whitespace-pre-wrap text-sm mt-1 p-4 rounded-lg bg-muted/50">
                    {selectedTicket.description}
                  </p>
                </div>

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
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="discord_id">Discord ID</Label>
                    <Input
                      id="discord_id"
                      value={discordId}
                      onChange={(e) => setDiscordId(e.target.value)}
                      placeholder="Your 17-19 digit Discord ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="steam_id">Steam ID (Optional)</Label>
                    <Input
                      id="steam_id"
                      value={steamId}
                      onChange={(e) => setSteamId(e.target.value)}
                      placeholder="Your Steam ID (e.g., steam:110000...)"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {ticketCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div className="flex flex-col">
                            <span>{cat.label}</span>
                            <span className="text-xs text-muted-foreground">{cat.description}</span>
                          </div>
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
                          <div className="flex flex-col">
                            <span>{opt.label}</span>
                            <span className="text-xs text-muted-foreground">{opt.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    placeholder="Please describe your issue in detail. Include any relevant information such as:
- When the issue occurred
- Steps to reproduce the problem
- Any error messages you received
- What you've already tried"
                    rows={8}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Be as detailed as possible. Include screenshots or videos if available.
                  </p>
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
                    disabled={submitting}
                    className="flex-1"
                  >
                    {submitting ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
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
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold">Your Tickets</h2>
                <p className="text-muted-foreground">View and manage your support tickets</p>
              </div>
              <Button onClick={() => setShowForm(true)}>
                <Ticket className="w-4 h-4 mr-2" />
                New Ticket
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
                  <Button onClick={() => setShowForm(true)}>
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
                    className="glass-effect border-border/20 hover:border-primary/50 transition-all cursor-pointer"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-mono text-sm text-primary">{ticket.ticket_number}</span>
                            <Badge variant="outline" className="text-xs">
                              {getCategoryLabel(ticket.category)}
                            </Badge>
                          </div>
                          <h3 className="font-medium truncate">{ticket.subject}</h3>
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {ticket.description.substring(0, 100)}...
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 ml-4">
                          <div className="flex gap-2">
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
