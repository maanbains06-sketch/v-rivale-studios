import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, RefreshCw, User, Hash, MoreVertical, Ban, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useStaffRole } from "@/hooks/useStaffRole";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Player {
  id: number;
  name: string;
  identifiers?: string[];
  ping?: number;
}

const AdminPlayers = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [serverStatus, setServerStatus] = useState<'online' | 'offline'>('offline');
  const { isAdmin, loading: roleLoading } = useStaffRole();
  const navigate = useNavigate();
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: 'kick' | 'ban' | null;
    player: Player | null;
  }>({ open: false, type: null, player: null });
  const [actionReason, setActionReason] = useState("");

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error('Access denied', {
        description: 'You do not have permission to access this page.',
      });
      navigate('/');
    }
  }, [isAdmin, roleLoading, navigate]);

  const fetchPlayers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fivem-server-status');
      
      if (error) {
        console.error('Error fetching server status:', error);
        toast.error('Failed to fetch player data');
        setIsLoading(false);
        return;
      }

      setServerStatus(data.status);
      
      // Set players from the playerList returned by the edge function
      if (data.status === 'online' && data.playerList) {
        setPlayers(data.playerList);
      } else {
        setPlayers([]);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to connect to server');
      setIsLoading(false);
    }
  };

  const handleAction = async () => {
    if (!actionDialog.player || !actionDialog.type) return;

    try {
      const { error } = await supabase.functions.invoke('admin-player-action', {
        body: {
          playerId: actionDialog.player.id,
          action: actionDialog.type,
          reason: actionReason || 'No reason provided',
        },
      });

      if (error) throw error;

      toast.success(
        `Player ${actionDialog.player.name} has been ${actionDialog.type}ed`,
        {
          description: actionReason || 'No reason provided',
        }
      );

      setActionDialog({ open: false, type: null, player: null });
      setActionReason("");
      fetchPlayers();
    } catch (error) {
      console.error('Error performing action:', error);
      toast.error(`Failed to ${actionDialog.type} player`);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchPlayers();
      const interval = setInterval(fetchPlayers, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  if (roleLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="pt-24 px-4">
          <div className="container mx-auto">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="pt-24 px-4 pb-16">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gradient mb-2">Players Active</h1>
              <p className="text-muted-foreground">View all currently connected players</p>
            </div>
            <Button
              onClick={fetchPlayers}
              disabled={isLoading}
              variant="outline"
              className="glass-effect"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <Card className="glass-effect border-border/20 mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-primary" />
                  <div>
                    <CardTitle>Connected Players</CardTitle>
                    <CardDescription>Real-time player list from FiveM server</CardDescription>
                  </div>
                </div>
                <Badge variant={serverStatus === 'online' ? 'default' : 'destructive'}>
                  {serverStatus === 'online' ? 'Server Online' : 'Server Offline'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : serverStatus === 'offline' ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg text-muted-foreground">Server is currently offline</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Player data is only available when the server is online
                  </p>
                </div>
              ) : players.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg text-muted-foreground">No players currently connected</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Players will appear here when they join the server
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {players.map((player) => (
                    <Card key={player.id} className="bg-background/50 border-border/40">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{player.name}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Hash className="w-3 h-3" />
                                ID: {player.id}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {player.ping !== undefined && (
                              <Badge variant="outline">
                                {player.ping}ms
                              </Badge>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    setActionDialog({ open: true, type: 'kick', player })
                                  }
                                  className="text-orange-600"
                                >
                                  <UserX className="w-4 h-4 mr-2" />
                                  Kick Player
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    setActionDialog({ open: true, type: 'ban', player })
                                  }
                                  className="text-destructive"
                                >
                                  <Ban className="w-4 h-4 mr-2" />
                                  Ban Player
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-effect border-border/20 border-l-4 border-l-primary/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-primary mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Note: Player Data Integration</p>
                  <p className="text-sm text-muted-foreground">
                    This page displays live player data from the FiveM server. The list updates automatically every 10 seconds.
                    Player names, IDs, and connection information are fetched directly from the server's API.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={actionDialog.open} onOpenChange={(open) => {
        if (!open) {
          setActionDialog({ open: false, type: null, player: null });
          setActionReason("");
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog.type === 'kick' ? 'Kick Player' : 'Ban Player'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {actionDialog.type} {actionDialog.player?.name}?
              {actionDialog.type === 'ban' && ' This action will permanently ban the player from the server.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              placeholder="Enter reason for this action..."
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className={actionDialog.type === 'ban' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {actionDialog.type === 'kick' ? 'Kick' : 'Ban'} Player
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPlayers;
