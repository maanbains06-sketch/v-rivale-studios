import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, RefreshCw, User, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useStaffRole } from "@/hooks/useStaffRole";
import { Skeleton } from "@/components/ui/skeleton";

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
                          {player.ping !== undefined && (
                            <Badge variant="outline">
                              {player.ping}ms
                            </Badge>
                          )}
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
    </div>
  );
};

export default AdminPlayers;
