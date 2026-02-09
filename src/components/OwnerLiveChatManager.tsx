import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Trash2, RefreshCw, Loader2, Clock, User, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { useAllChatPresence } from "@/hooks/useChatPresence";
import ActiveStaffIndicator from "@/components/ActiveStaffIndicator";
import { useStaffNames } from "@/hooks/useStaffNames";

interface SupportChat {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  priority: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  sla_breached: boolean | null;
  escalated: boolean | null;
  sentiment: string | null;
}

interface Profile {
  id: string;
  discord_username: string | null;
  discord_id: string | null;
  discord_avatar: string | null;
}

const OwnerLiveChatManager = () => {
  const { toast } = useToast();
  const [chats, setChats] = useState<SupportChat[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Track staff presence in chats
  const { chatViewers } = useAllChatPresence();
  const { getStaffName } = useStaffNames();

  const fetchChats = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("support_chats")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      setChats(data || []);

      // Fetch user profiles for all unique user_ids
      const userIds = [...new Set((data || []).map(chat => chat.user_id).filter(Boolean))];
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, discord_username, discord_id, discord_avatar")
          .in("id", userIds);

        if (profilesData) {
          const profileMap: Record<string, Profile> = {};
          profilesData.forEach(p => { profileMap[p.id] = p; });
          setProfiles(profileMap);
        }
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
      toast({
        title: "Error",
        description: "Failed to fetch live chats.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => {
    fetchChats();

    // Real-time subscription
    const channel = supabase
      .channel('owner-live-chats')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'support_chats' },
        () => fetchChats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchChats]);

  const deleteChat = async (chatId: string) => {
    setIsDeleting(true);
    try {
      // Delete related messages first
      await supabase.from("support_messages").delete().eq("chat_id", chatId);
      
      // Delete AI ratings
      await supabase.from("ai_message_ratings").delete().eq("chat_id", chatId);
      
      // Delete chat ratings
      await supabase.from("support_chat_ratings").delete().eq("chat_id", chatId);

      // Delete the chat
      const { error } = await supabase.from("support_chats").delete().eq("id", chatId);
      if (error) throw error;

      toast({
        title: "Chat Deleted",
        description: "The chat and all related data have been permanently deleted.",
      });

      setChatToDelete(null);
      fetchChats();
    } catch (error: any) {
      console.error("Error deleting chat:", error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete chat.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteAllChats = async () => {
    setIsDeleting(true);
    try {
      // Get all chat IDs
      const { data: allChats, error: fetchError } = await supabase.from("support_chats").select("id");
      
      if (fetchError) {
        console.error("Error fetching chats for deletion:", fetchError);
        throw fetchError;
      }
      
      if (allChats && allChats.length > 0) {
        const chatIds = allChats.map(c => c.id);
        
        // Delete all related data with error handling
        const { error: messagesError } = await supabase.from("support_messages").delete().in("chat_id", chatIds);
        if (messagesError) {
          console.error("Error deleting messages:", messagesError);
        }
        
        const { error: aiRatingsError } = await supabase.from("ai_message_ratings").delete().in("chat_id", chatIds);
        if (aiRatingsError) {
          console.error("Error deleting AI ratings:", aiRatingsError);
        }
        
        const { error: chatRatingsError } = await supabase.from("support_chat_ratings").delete().in("chat_id", chatIds);
        if (chatRatingsError) {
          console.error("Error deleting chat ratings:", chatRatingsError);
        }
        
        // Delete all chats - use .in() with chatIds for proper deletion
        const { error: chatsError } = await supabase.from("support_chats").delete().in("id", chatIds);
        if (chatsError) {
          console.error("Error deleting chats:", chatsError);
          throw chatsError;
        }
      }

      toast({
        title: "All Chats Deleted",
        description: `Successfully deleted ${allChats?.length || 0} chats and all related data.`,
      });

      setDeleteAllConfirm(false);
      fetchChats();
    } catch (error: any) {
      console.error("Error deleting all chats:", error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete all chats.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
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
      case "pending":
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

  const getPriorityBadge = (priority: string | null) => {
    switch (priority) {
      case "urgent":
        return <Badge variant="destructive">Urgent</Badge>;
      case "high":
        return <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/50">High</Badge>;
      case "medium":
        return <Badge variant="secondary">Medium</Badge>;
      case "low":
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50">Low</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  const getUserDisplay = (userId: string) => {
    const profile = profiles[userId];
    if (profile?.discord_username) {
      return profile.discord_username;
    }
    return userId.slice(0, 8) + "...";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Live Chat Management</h2>
          <Badge variant="outline" className="ml-2">
            {chats.length} chats
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Chats</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchChats} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => setDeleteAllConfirm(true)}
            disabled={chats.length === 0 || isDeleting}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete All
          </Button>
        </div>
      </div>

      <Card className="glass-effect border-primary/20">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
              <p>No live chats found</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                     <TableHead>Assigned To</TableHead>
                     <TableHead>Staff Active</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Flags</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chats.map((chat) => (
                    <TableRow key={chat.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{getUserDisplay(chat.user_id)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate font-medium">
                        {chat.subject}
                      </TableCell>
                      <TableCell>{getStatusBadge(chat.status)}</TableCell>
                      <TableCell>{getPriorityBadge(chat.priority)}</TableCell>
                       <TableCell>
                        <span className="text-sm font-medium">{getStaffName(chat.assigned_to)}</span>
                       </TableCell>
                       <TableCell>
                        {chatViewers[chat.id] && chatViewers[chat.id].length > 0 ? (
                          <ActiveStaffIndicator viewers={chatViewers[chat.id]} type="chat" compact />
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(chat.created_at), "PP")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {chat.last_message_at 
                          ? format(new Date(chat.last_message_at), "PP p")
                          : "-"
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {chat.sla_breached && (
                            <Badge variant="destructive" className="text-xs">SLA</Badge>
                          )}
                          {chat.escalated && (
                            <Badge className="bg-orange-500/20 text-orange-500 text-xs">Escalated</Badge>
                          )}
                          {chat.sentiment === 'frustrated' && (
                            <Badge className="bg-red-500/20 text-red-500 text-xs">Frustrated</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setChatToDelete(chat.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Delete Single Chat Confirmation */}
      <AlertDialog open={!!chatToDelete} onOpenChange={() => setChatToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the chat, all messages, and related data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => chatToDelete && deleteChat(chatToDelete)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Chats Confirmation */}
      <AlertDialog open={deleteAllConfirm} onOpenChange={setDeleteAllConfirm}>
        <AlertDialogContent className="border-destructive/50">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <AlertDialogTitle className="text-xl">Delete All Live Chats?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-3">
              <p className="text-destructive font-medium">
                ⚠️ This action is IRREVERSIBLE and will permanently delete:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                <li>All {chats.length} live support chats</li>
                <li>All messages in these chats</li>
                <li>All AI message ratings</li>
                <li>All chat ratings and feedback</li>
              </ul>
              <p className="text-sm font-medium text-foreground">
                Are you absolutely sure you want to proceed?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteAllChats}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete All Chats
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OwnerLiveChatManager;
