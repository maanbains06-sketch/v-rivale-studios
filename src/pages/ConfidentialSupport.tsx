import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Shield, Lock, Send, AlertTriangle, Clock, CheckCircle, Eye, Wrench, XCircle } from "lucide-react";
import { format } from "date-fns";
import AnimatedSLRPLogo from "@/components/AnimatedSLRPLogo";

const confidentialCategories = [
  { value: "personal_conflict", label: "Personal Conflict with Member", description: "Issues or disputes with another community member" },
  { value: "staff_complaint", label: "Staff Complaint", description: "Report staff misconduct or abuse of power (handled privately)" },
  { value: "harassment", label: "Harassment / Bullying", description: "Report any form of harassment, bullying, or discrimination" },
  { value: "staff_support", label: "Staff Support Request", description: "Request private assistance from staff for sensitive matters" },
  { value: "privacy_concern", label: "Privacy Concern", description: "Report privacy violations or doxxing attempts" },
  { value: "other_sensitive", label: "Other Sensitive Matter", description: "Any other private issue requiring confidential attention" },
];

interface ConfidentialTicket {
  id: string;
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

const ConfidentialSupport = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState<ConfidentialTicket[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<ConfidentialTicket | null>(null);

  // Form state
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");
  const [discordId, setDiscordId] = useState("");

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Authentication Required", description: "Please sign in to access confidential support.", variant: "destructive" });
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
        .from("confidential_tickets")
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
    if (!category || !subject.trim() || !description.trim() || !discordId.trim()) {
      toast({ title: "Missing Information", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    if (!/^\d{17,19}$/.test(discordId.trim())) {
      toast({ title: "Invalid Discord ID", description: "Discord ID must be 17-19 digits.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }

      const discordUsername = user.user_metadata?.full_name || user.user_metadata?.name || null;

      const { data, error } = await supabase
        .from("confidential_tickets")
        .insert({
          user_id: user.id,
          discord_id: discordId.trim(),
          discord_username: discordUsername,
          category,
          subject,
          description,
          priority,
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Confidential Ticket Submitted", description: "Your ticket has been submitted privately. Only the owner and staff will review it." });

      // Send Discord notification
      try {
        await supabase.functions.invoke("send-confidential-ticket-notification", {
          body: {
            ticketId: data.id,
            category,
            subject,
            discordId: discordId.trim(),
            discordUsername,
            priority,
          },
        });
      } catch (notifyError) {
        console.error("Failed to send Discord notification:", notifyError);
      }

      setCategory("");
      setSubject("");
      setDescription("");
      setPriority("normal");
      setDiscordId("");
      setShowForm(false);
      fetchTickets();
    } catch (error: any) {
      console.error("Error submitting ticket:", error);
      toast({ title: "Submission Failed", description: error.message || "Failed to submit ticket.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50"><span className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse" />Open</Badge>;
      case "in_review":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50"><span className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse" />In Review</Badge>;
      case "resolved":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/50"><span className="w-2 h-2 bg-green-400 rounded-full mr-2" />Resolved</Badge>;
      case "closed":
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50"><span className="w-2 h-2 bg-gray-400 rounded-full mr-2" />Closed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCategoryLabel = (value: string) => confidentialCategories.find(c => c.value === value)?.label || value;

  if (selectedTicket) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8 max-w-3xl">
          <Button variant="ghost" onClick={() => setSelectedTicket(null)} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Tickets
          </Button>

          <Card className="glass-effect border-red-500/20">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Lock className="w-5 h-5 text-red-400" />
                    <CardTitle className="text-xl">{selectedTicket.subject}</CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">{getCategoryLabel(selectedTicket.category)} • {format(new Date(selectedTicket.created_at), "PPP p")}</p>
                </div>
                {getStatusBadge(selectedTicket.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="mt-1 text-foreground whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>
              {selectedTicket.admin_notes && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                  <Label className="text-red-400 flex items-center gap-2"><Eye className="w-4 h-4" /> Staff Response</Label>
                  <p className="mt-1 text-foreground whitespace-pre-wrap">{selectedTicket.admin_notes}</p>
                </div>
              )}
              {selectedTicket.resolution && (
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                  <Label className="text-green-400 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Resolution</Label>
                  <p className="mt-1 text-foreground whitespace-pre-wrap">{selectedTicket.resolution}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate("/support")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Support
        </Button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center">
              <Lock className="w-8 h-8 text-red-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Confidential Support</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">Private & secure channel for sensitive matters</p>
        </div>

        {/* Warning Notice */}
        <Card className="mb-8 border-red-500/40 bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent shadow-[0_0_30px_rgba(239,68,68,0.1)]">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-red-400 text-lg mb-2">⚠️ Important Notice</h3>
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  <li>🔒 This ticket will be reviewed <strong className="text-foreground">exclusively by the Owner and Staff</strong>. No one else will have access.</li>
                  <li>📋 Submit carefully — provide accurate details about your concern.</li>
                  <li>🚫 <strong className="text-red-400">No spam tickets.</strong> Misuse will result in action against your account.</li>
                  <li>💬 For general questions, please use <strong className="text-foreground">Live Chat Support</strong> or <strong className="text-foreground">Ticket Support</strong> instead.</li>
                  <li>🤝 This is the right place to discuss <strong className="text-foreground">personal issues, conflicts with members or staff, harassment, or any sensitive matter</strong> that requires private attention.</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-center mb-8">
          <Button
            size="lg"
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg shadow-red-500/25"
          >
            <Lock className="w-5 h-5 mr-2" />
            {showForm ? "Cancel" : "Submit Confidential Ticket"}
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <Card className="mb-8 glass-effect border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.08)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-400">
                <Shield className="w-5 h-5" />
                New Confidential Ticket
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Discord ID <span className="text-red-400">*</span></Label>
                  <Input value={discordId} onChange={(e) => setDiscordId(e.target.value)} placeholder="" className="border-red-500/20 focus:border-red-500/50" />
                  <p className="text-xs text-muted-foreground">17-19 digit numeric Discord ID</p>
                </div>
                <div className="space-y-2">
                  <Label>Category <span className="text-red-400">*</span></Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="border-red-500/20 focus:border-red-500/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {confidentialCategories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div>
                            <span className="font-medium">{cat.label}</span>
                            <p className="text-xs text-muted-foreground">{cat.description}</p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="border-red-500/20 focus:border-red-500/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low — General concern</SelectItem>
                    <SelectItem value="normal">Normal — Needs attention</SelectItem>
                    <SelectItem value="high">High — Urgent matter</SelectItem>
                    <SelectItem value="critical">Critical — Immediate action needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Subject <span className="text-red-400">*</span></Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="border-red-500/20 focus:border-red-500/50" maxLength={200} />
              </div>

              <div className="space-y-2">
                <Label>Detailed Description <span className="text-red-400">*</span></Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} className="border-red-500/20 focus:border-red-500/50" maxLength={3000} />
                <p className="text-xs text-muted-foreground">Provide as much detail as possible. Include names, dates, and any relevant context.</p>
              </div>

              <Button onClick={submitTicket} disabled={submitting} className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white">
                {submitting ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> Submitting...</> : <><Send className="w-4 h-4 mr-2" /> Submit Confidential Ticket</>}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Existing Tickets */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-red-400" />
            Your Confidential Tickets
          </h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <AnimatedSLRPLogo size="md" />
            </div>
          ) : tickets.length === 0 ? (
            <Card className="glass-effect border-border/20">
              <CardContent className="py-12 text-center">
                <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No confidential tickets submitted yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {tickets.map(ticket => (
                <Card
                  key={ticket.id}
                  className="glass-effect border-red-500/10 hover:border-red-500/30 transition-all cursor-pointer"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Lock className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <h3 className="font-semibold truncate">{ticket.subject}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {getCategoryLabel(ticket.category)} • {format(new Date(ticket.created_at), "PPP")}
                        </p>
                      </div>
                      {getStatusBadge(ticket.status)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ConfidentialSupport;
