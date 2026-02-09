import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Lock, Search, Eye, CheckCircle, Clock, XCircle, Loader2, RefreshCw, Paperclip, FileIcon } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ConfidentialTicket {
  id: string;
  ticket_number: string;
  user_id: string;
  discord_id: string;
  discord_username: string | null;
  category: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  admin_notes: string | null;
  resolution: string | null;
  attachment_url: string | null;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

const categoryLabels: Record<string, string> = {
  personal_conflict: "Personal Conflict",
  staff_complaint: "Staff Complaint",
  harassment: "Harassment",
  staff_support: "Staff Support",
  privacy_concern: "Privacy Concern",
  other_sensitive: "Other Sensitive",
};

const ConfidentialTicketManagement = () => {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<ConfidentialTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<ConfidentialTicket | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [resolution, setResolution] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("confidential_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error("Error fetching confidential tickets:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("confidential-tickets-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "confidential_tickets" }, () => fetchTickets())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchTickets]);

  const updateTicketStatus = async (status: string) => {
    if (!selectedTicket) return;
    setUpdating(true);
    try {
      const updateData: any = {
        status,
        admin_notes: adminNotes || selectedTicket.admin_notes,
        updated_at: new Date().toISOString(),
      };

      if (status === "resolved") {
        updateData.resolution = resolution || null;
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("confidential_tickets")
        .update(updateData)
        .eq("id", selectedTicket.id);

      if (error) throw error;
      toast({ title: "Ticket Updated", description: `Status changed to ${status}` });
      setSelectedTicket(null);
      setAdminNotes("");
      setResolution("");
      fetchTickets();
    } catch (error) {
      console.error("Error updating ticket:", error);
      toast({ title: "Error", description: "Failed to update ticket.", variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open": return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">Open</Badge>;
      case "in_review": return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">In Review</Badge>;
      case "resolved": return <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Resolved</Badge>;
      case "closed": return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50">Closed</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical": return <Badge variant="destructive">Critical</Badge>;
      case "high": return <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/50">High</Badge>;
      case "normal": return <Badge variant="secondary">Normal</Badge>;
      case "low": return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50">Low</Badge>;
      default: return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = searchTerm === "" ||
      (t.ticket_number && t.ticket_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.discord_username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.discord_id.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Card className="glass-effect border-red-500/20">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2 text-red-400">
            <Lock className="w-5 h-5" />
            Confidential Tickets
            {tickets.filter(t => t.status === "open").length > 0 && (
              <Badge variant="destructive" className="ml-2">{tickets.filter(t => t.status === "open").length} New</Badge>
            )}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={fetchTickets} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by ticket number, subject, Discord name or ID..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-red-400" /></div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No confidential tickets found.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map(ticket => (
                  <TableRow key={ticket.id} className="hover:bg-red-500/5">
                    <TableCell><Badge variant="outline" className="font-mono text-xs">{ticket.ticket_number}</Badge></TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      <div className="flex items-center gap-1">
                        {ticket.subject}
                        {ticket.attachment_url && <Paperclip className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
                      </div>
                    </TableCell>
                    <TableCell>{categoryLabels[ticket.category] || ticket.category}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{ticket.discord_username || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{ticket.discord_id}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{format(new Date(ticket.created_at), "PP")}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => { setSelectedTicket(ticket); setAdminNotes(ticket.admin_notes || ""); setResolution(ticket.resolution || ""); }}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => { if (!open) setSelectedTicket(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto border-red-500/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400 flex-wrap">
              <Lock className="w-5 h-5" />
              <Badge variant="outline" className="font-mono">{selectedTicket?.ticket_number}</Badge>
              {selectedTicket?.subject}
            </DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Category:</span> <span className="font-medium">{categoryLabels[selectedTicket.category]}</span></div>
                <div><span className="text-muted-foreground">Priority:</span> {getPriorityBadge(selectedTicket.priority)}</div>
                <div><span className="text-muted-foreground">Discord:</span> <span className="font-medium">{selectedTicket.discord_username} ({selectedTicket.discord_id})</span></div>
                <div><span className="text-muted-foreground">Status:</span> {getStatusBadge(selectedTicket.status)}</div>
                <div><span className="text-muted-foreground">Submitted:</span> {format(new Date(selectedTicket.created_at), "PPP p")}</div>
              </div>

              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                <p className="whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>

              {selectedTicket.attachment_url && (
                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                  <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2"><Paperclip className="w-4 h-4" /> Attachment</p>
                  {selectedTicket.attachment_url.match(/\.(png|jpg|jpeg|gif|webp)/) ? (
                    <img src={selectedTicket.attachment_url} alt="Attachment" className="max-w-full max-h-64 rounded-lg" />
                  ) : (
                    <a href={selectedTicket.attachment_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-red-400 hover:underline">
                      <FileIcon className="w-4 h-4" /> View Attachment
                    </a>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Staff Notes</label>
                <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={3} placeholder="Internal notes (visible to ticket submitter)" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Resolution</label>
                <Textarea value={resolution} onChange={e => setResolution(e.target.value)} rows={3} placeholder="Final resolution (visible when resolved)" />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="border-yellow-500/50 text-yellow-500" onClick={() => updateTicketStatus("in_review")} disabled={updating}>
                  <Clock className="w-4 h-4 mr-1" /> In Review
                </Button>
                <Button size="sm" variant="outline" className="border-green-500/50 text-green-500" onClick={() => updateTicketStatus("resolved")} disabled={updating}>
                  <CheckCircle className="w-4 h-4 mr-1" /> Resolve
                </Button>
                <Button size="sm" variant="outline" className="border-gray-500/50 text-gray-400" onClick={() => updateTicketStatus("closed")} disabled={updating}>
                  <XCircle className="w-4 h-4 mr-1" /> Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ConfidentialTicketManagement;
