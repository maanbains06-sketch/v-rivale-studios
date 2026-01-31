import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useOwnerAuditLog } from '@/hooks/useOwnerAuditLog';
import { 
  Youtube, 
  Loader2, 
  Plus, 
  Trash2, 
  ExternalLink, 
  RefreshCw,
  Check,
  X,
  Radio,
  Zap
} from 'lucide-react';

interface FeaturedYoutuber {
  id: string;
  name: string;
  channel_url: string;
  channel_id: string | null;
  avatar_url: string | null;
  role: string | null;
  is_active: boolean;
  is_live: boolean;
  live_stream_url: string | null;
  display_order: number;
}

export const FeaturedStreamersManager = () => {
  const { toast } = useToast();
  const { logAction } = useOwnerAuditLog();
  const [youtubers, setYoutubers] = useState<FeaturedYoutuber[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelUrl, setChannelUrl] = useState('');
  const [channelId, setChannelId] = useState('');
  const [fetchingChannel, setFetchingChannel] = useState(false);
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [editChannelIdValue, setEditChannelIdValue] = useState('');

  useEffect(() => {
    fetchYoutubers();
  }, []);

  const fetchYoutubers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('featured_youtubers')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setYoutubers(data || []);
    } catch (error) {
      console.error('Error fetching youtubers:', error);
    } finally {
      setLoading(false);
    }
  };

  const addYoutuber = async () => {
    if (!channelUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a YouTube channel URL",
        variant: "destructive",
      });
      return;
    }

    setFetchingChannel(true);
    try {
      // Call edge function to fetch YouTube channel info
      const { data: channelInfo, error: fetchError } = await supabase.functions.invoke('fetch-youtube-channel', {
        body: { channelUrl }
      });

      if (fetchError) throw fetchError;
      
      if (!channelInfo || channelInfo.error) {
        throw new Error(channelInfo?.error || 'Failed to fetch channel info');
      }

      // Create entry with fetched info
      const { data, error } = await supabase
        .from('featured_youtubers')
        .insert({
          name: channelInfo.channelName,
          channel_url: channelUrl,
          channel_id: channelId.trim() || channelInfo.channelId || null,
          avatar_url: channelInfo.avatarUrl,
          role: 'Content Creator',
          is_active: true,
          is_live: false,
          display_order: youtubers.length
        })
        .select()
        .single();

      if (error) throw error;

      await logAction({
        actionType: 'creator_add',
        actionDescription: `Added featured streamer: ${channelInfo.channelName}`,
        targetTable: 'featured_youtubers',
        targetId: data.id,
        newValue: data
      });

      toast({
        title: "Streamer Added",
        description: `${channelInfo.channelName} has been added to featured streamers.`,
      });

      setChannelUrl('');
      setChannelId('');
      fetchYoutubers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add streamer",
        variant: "destructive",
      });
    } finally {
      setFetchingChannel(false);
    }
  };

  const removeYoutuber = async (id: string, name: string) => {
    try {
      const { error } = await supabase
        .from('featured_youtubers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await logAction({
        actionType: 'creator_remove',
        actionDescription: `Removed featured streamer: ${name}`,
        targetTable: 'featured_youtubers',
        targetId: id
      });

      toast({
        title: "Streamer Removed",
        description: `${name} has been removed from featured streamers.`,
      });

      fetchYoutubers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove streamer",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (id: string, name: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('featured_youtubers')
        .update({ is_active: !currentState })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: currentState ? "Streamer Hidden" : "Streamer Shown",
        description: `${name} is now ${currentState ? 'hidden from' : 'visible on'} the homepage.`,
      });

      fetchYoutubers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const toggleLive = async (id: string, name: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('featured_youtubers')
        .update({ is_live: !currentState })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: currentState ? "Marked Offline" : "Marked Live",
        description: `${name} is now ${currentState ? 'offline' : 'live'}.`,
      });

      fetchYoutubers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update live status",
        variant: "destructive",
      });
    }
  };

  const saveChannelId = async (id: string, name: string) => {
    try {
      const { error } = await supabase
        .from('featured_youtubers')
        .update({ channel_id: editChannelIdValue.trim() || null })
        .eq('id', id);

      if (error) throw error;

      await logAction({
        actionType: 'creator_update',
        actionDescription: `Updated channel ID for ${name}`,
        targetTable: 'featured_youtubers',
        targetId: id,
        newValue: { channel_id: editChannelIdValue.trim() || null }
      });

      toast({
        title: "Channel ID Updated",
        description: `Channel ID for ${name} has been updated.`,
      });

      setEditingChannelId(null);
      setEditChannelIdValue('');
      fetchYoutubers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update channel ID",
        variant: "destructive",
      });
    }
  };

  const startEditChannelId = (youtuber: FeaturedYoutuber) => {
    setEditingChannelId(youtuber.id);
    setEditChannelIdValue(youtuber.channel_id || '');
  };

  const syncLiveStatus = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-youtube-live-status');
      
      if (error) throw error;
      
      toast({
        title: "Live Status Synced",
        description: data.message || "Live status updated for all streamers.",
      });
      
      fetchYoutubers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sync live status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="glass-effect border-border/20">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect border-border/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-500" />
              <CardTitle className="text-gradient">Featured Streamers</CardTitle>
            </div>
            <CardDescription>Manage featured content creators on the homepage</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={syncLiveStatus}
              variant="secondary"
              size="sm"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Sync Live Status
            </Button>
            <Button
              onClick={fetchYoutubers}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Streamer */}
        <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-4">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            <Label className="font-semibold">Add New Streamer</Label>
          </div>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Paste YouTube channel URL (e.g., youtube.com/@channelname)"
                value={channelUrl}
                onChange={(e) => setChannelUrl(e.target.value)}
                className="flex-1"
              />
              <Button onClick={addYoutuber} disabled={fetchingChannel}>
                {fetchingChannel ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add Streamer
              </Button>
            </div>
            <div>
              <Input
                placeholder="Channel ID (optional, e.g., UCxxxxxxxxxxxxxxxx)"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                className="flex-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Optional: Provide YouTube Channel ID to ensure only this streamer's live streams are shown.
                Find it in YouTube Studio → Settings → Channel → Advanced settings.
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            The channel name and profile image will be automatically fetched from YouTube.
          </p>
        </div>

        {/* Streamers Table */}
        {youtubers.length === 0 ? (
          <div className="text-center py-8">
            <Youtube className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No featured streamers yet</p>
            <p className="text-sm text-muted-foreground">Add streamers using the form above</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
              <TableHead>Streamer</TableHead>
                <TableHead>Channel ID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Live</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {youtubers.map((youtuber) => (
                <TableRow key={youtuber.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={youtuber.avatar_url || ''} alt={youtuber.name} />
                        <AvatarFallback className="bg-red-500/10 text-red-500">
                          {youtuber.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{youtuber.name}</p>
                        <a 
                          href={youtuber.channel_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                        >
                          View Channel <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {editingChannelId === youtuber.id ? (
                      <div className="flex gap-1 items-center">
                        <Input
                          value={editChannelIdValue}
                          onChange={(e) => setEditChannelIdValue(e.target.value)}
                          placeholder="UCxxxxxxxx"
                          className="w-32 h-8 text-xs"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => saveChannelId(youtuber.id, youtuber.name)}
                          className="h-8 w-8 p-0 text-green-500"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingChannelId(null);
                            setEditChannelIdValue('');
                          }}
                          className="h-8 w-8 p-0 text-muted-foreground"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditChannelId(youtuber)}
                        className="text-xs font-mono"
                      >
                        {youtuber.channel_id ? (
                          <span className="truncate max-w-[100px]">{youtuber.channel_id}</span>
                        ) : (
                          <span className="text-muted-foreground">Set ID</span>
                        )}
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{youtuber.role || 'Creator'}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(youtuber.id, youtuber.name, youtuber.is_active)}
                      className={youtuber.is_active ? 'text-green-500' : 'text-muted-foreground'}
                    >
                      {youtuber.is_active ? (
                        <><Check className="w-4 h-4 mr-1" /> Active</>
                      ) : (
                        <><X className="w-4 h-4 mr-1" /> Hidden</>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleLive(youtuber.id, youtuber.name, youtuber.is_live || false)}
                      className={youtuber.is_live ? 'text-red-500' : 'text-muted-foreground'}
                    >
                      {youtuber.is_live ? (
                        <><Radio className="w-4 h-4 mr-1 animate-pulse" /> Live</>
                      ) : (
                        <><Radio className="w-4 h-4 mr-1" /> Offline</>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeYoutuber(youtuber.id, youtuber.name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};