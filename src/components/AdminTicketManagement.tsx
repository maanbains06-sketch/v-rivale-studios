import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Ticket, Clock, CheckCircle, Loader2, Trash2, Eye, RefreshCw, Pause, Wrench, Search, Image as ImageIcon, Video, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface SupportTicket {
  id: string;
  ticket_number: string;
  user_id: string;
  discord_id: string | null;
  discord_username: string | null;
  steam_id: string | null;
  player_id: string | null;
  player_name: string | null;
  category: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  admin_notes: string | null;
  resolution: string | null;
  created_at: string;
  resolved_at: string | null;
  assigned_to: string | null;
  attachments: string[] | null;
}

const ticketCategories = [
  { value: 'whitelist', label: 'Whitelist Issue' },
  { value: 'refund', label: 'Refund Request' },
  { value: 'account', label: 'Account Issue' },
  { value: 'technical', label: 'Technical Support' },
  { value: 'staff_complaint', label: 'Staff Complaint' },
  { value: 'ban_inquiry', label: 'Ban Inquiry' },
  { value: 'other', label: 'Other' },
];

const statusOptions = [
  { value: 'open', label: 'Open', icon: Clock, color: 'bg-blue-500/20 text-blue-500 border-blue-500/50' },
  { value: 'in_progress', label: 'Working On It', icon: Wrench, color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50' },
  { value: 'on_hold', label: 'On Hold', icon: Pause, color: 'bg-orange-500/20 text-orange-500 border-orange-500/50' },
  { value: 'resolved', label: 'Resolved', icon: CheckCircle, color: 'bg-green-500/20 text-green-500 border-green-500/50' },
];

const AdminTicketManagement = () => {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [resolution, setResolution] = useState("");
  const [updating, setUpdating] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast({
        title: "Error",
        description: "Failed to fetch tickets.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => {
    fetchTickets();

    const channel = supabase
      .channel('admin-tickets')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'support_tickets' },
        () => fetchTickets()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTickets]);

  // Filter tickets by search query
  const filteredTickets = tickets.filter(ticket => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return ticket.ticket_number.toLowerCase().includes(query) ||
           ticket.subject.toLowerCase().includes(query) ||
           (ticket.player_name?.toLowerCase().includes(query)) ||
           (ticket.player_id?.toLowerCase().includes(query));
  });

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    setUpdating(true);
    try {
      const updateData: Record<string, any> = {
        status: newStatus,
        admin_notes: adminNotes || null,
      };

      if (newStatus === 'resolved') {
        updateData.resolution = resolution || null;
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("support_tickets")
        .update(updateData)
        .eq("id", ticketId);

      if (error) throw error;

      try {
        await supabase.functions.invoke("send-ticket-notification", {
          body: {
            ticketId,
            status: newStatus,
            adminNotes: adminNotes || undefined,
            resolution: resolution || undefined,
          },
        });
      } catch (notifyError) {
        console.error("Failed to send Discord notification:", notifyError);
      }

      toast({
        title: "Ticket Updated",
        description: `Status changed to ${newStatus}.`,
      });

      setSelectedTicket(null);
      setAdminNotes("");
      setResolution("");
      fetchTickets();
    } catch (error: any) {
      console.error("Error updating ticket:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update ticket.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const deleteTicket = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from("support_tickets")
        .delete()
        .eq("id", ticketId);

      if (error) throw error;

      toast({
        title: "Ticket Deleted",
        description: "The ticket has been permanently deleted.",
      });

      setTicketToDelete(null);
      fetchTickets();
    } catch (error: any) {
      console.error("Error deleting ticket:", error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete ticket.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status);
    if (!statusOption) return <Badge variant="secondary">{status}</Badge>;
    const Icon = statusOption.icon;
    return (
      <Badge className={statusOption.color}>
        <Icon className="w-3 h-3 mr-1" />
        {statusOption.label}
      </Badge>
    );
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
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Ticket className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Ticket Support Management</h2>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search by ticket number */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by ticket #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-48"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tickets</SelectItem>
              {statusOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchTickets} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="glass-effect border-primary/20">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Ticket className="w-12 h-12 mb-4 opacity-20" />
              <p>{searchQuery ? "No tickets match your search" : "No tickets found"}</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket #</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center gap-1">
                          {ticket.ticket_number}
                          {ticket.attachments && ticket.attachments.length > 0 && (
                            <ImageIcon className="w-3 h-3 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getCategoryLabel(ticket.category)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {ticket.subject}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <p className="font-medium">{ticket.player_name || '-'}</p>
                          <p className="text-muted-foreground">ID: {ticket.player_id || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(ticket.created_at), "PP")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setAdminNotes(ticket.admin_notes || "");
                              setResolution(ticket.resolution || "");
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setTicketToDelete(ticket.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-primary" />
                  {selectedTicket.ticket_number}
                </DialogTitle>
                <DialogDescription>
                  Submitted on {format(new Date(selectedTicket.created_at), "PPP 'at' p")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">Category</Label>
                    <p className="font-medium text-sm">{getCategoryLabel(selectedTicket.category)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Player ID</Label>
                    <p className="font-mono text-sm">{selectedTicket.player_id || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Player Name</Label>
                    <p className="font-medium text-sm">{selectedTicket.player_name || '-'}</p>
                  </div>
                  <div className="flex gap-2 items-start">
                    {getPriorityBadge(selectedTicket.priority)}
                    {getStatusBadge(selectedTicket.status)}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">Steam ID</Label>
                    <p className="font-mono text-sm">{selectedTicket.steam_id || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Discord</Label>
                    <p className="text-sm">{selectedTicket.discord_username || selectedTicket.discord_id || '-'}</p>
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

                {/* Attachments */}
                {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Attachments ({selectedTicket.attachments.length})</Label>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                      {selectedTicket.attachments.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative group rounded-lg overflow-hidden border border-border/50 hover:border-primary transition-colors"
                        >
                          {isImage(url) ? (
                            <img src={url} alt={`Attachment ${idx + 1}`} className="w-full h-20 object-cover" />
                          ) : isVideo(url) ? (
                            <div className="w-full h-20 bg-muted flex items-center justify-center">
                              <Video className="w-6 h-6 text-muted-foreground" />
                            </div>
                          ) : (
                            <div className="w-full h-20 bg-muted flex items-center justify-center">
                              <ExternalLink className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <ExternalLink className="w-5 h-5 text-white" />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4 space-y-4">
                  <div>
                    <Label htmlFor="admin_notes">Admin Notes</Label>
                    <Textarea
                      id="admin_notes"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Internal notes (visible to staff only)"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="resolution">Resolution (shown to user)</Label>
                    <Textarea
                      id="resolution"
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      placeholder="Response to the user explaining the resolution"
                      rows={4}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {statusOptions.map(option => (
                      <Button
                        key={option.value}
                        variant={selectedTicket.status === option.value ? "default" : "outline"}
                        size="sm"
                        disabled={updating}
                        onClick={() => updateTicketStatus(selectedTicket.id, option.value)}
                      >
                        {updating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <option.icon className="w-4 h-4 mr-1" />}
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!ticketToDelete} onOpenChange={() => setTicketToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ticket?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The ticket will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => ticketToDelete && deleteTicket(ticketToDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminTicketManagement;
