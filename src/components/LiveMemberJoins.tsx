import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Users, RefreshCw, Zap, Clock } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface MemberJoin {
  id: string;
  user_id: string;
  discord_username: string | null;
  discord_id: string | null;
  discord_avatar: string | null;
  joined_at: string;
  referral_source: string | null;
}

interface DiscordUserData {
  username: string;
  displayName: string;
  avatar: string | null;
}

export const LiveMemberJoins = () => {
  const [memberJoins, setMemberJoins] = useState<MemberJoin[]>([]);
  const [discordData, setDiscordData] = useState<Record<string, DiscordUserData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [newJoinAnimation, setNewJoinAnimation] = useState<string | null>(null);

  // Fetch Discord user data for a member
  const fetchDiscordUserData = useCallback(async (discordId: string): Promise<DiscordUserData | null> => {
    if (!discordId || !/^\d{17,19}$/.test(discordId)) return null;
    
    try {
      const { data, error } = await supabase.functions.invoke('fetch-discord-user', {
        body: { discordId }
      });
      
      if (error || !data) return null;
      
      return {
        username: data.username || data.displayName || 'Unknown',
        displayName: data.displayName || data.globalName || data.username || 'Unknown',
        avatar: data.avatar ? `https://cdn.discordapp.com/avatars/${discordId}/${data.avatar}.png?size=128` : null
      };
    } catch (err) {
      console.error('Error fetching Discord user:', err);
      return null;
    }
  }, []);

  const fetchMemberJoins = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('member_joins')
        .select('*')
        .order('joined_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setMemberJoins(data || []);
      
      // Fetch Discord data for members with discord_id but no username
      const membersToFetch = (data || []).filter(m => 
        m.discord_id && 
        /^\d{17,19}$/.test(m.discord_id) && 
        (!m.discord_username || m.discord_username === 'Unknown User')
      );
      
      // Fetch Discord data in batches
      const newDiscordData: Record<string, DiscordUserData> = {};
      for (const member of membersToFetch.slice(0, 10)) { // Limit to 10 to avoid rate limits
        const userData = await fetchDiscordUserData(member.discord_id!);
        if (userData) {
          newDiscordData[member.discord_id!] = userData;
        }
        await new Promise(resolve => setTimeout(resolve, 200)); // Rate limit delay
      }
      
      setDiscordData(prev => ({ ...prev, ...newDiscordData }));
    } catch (error) {
      console.error('Error fetching member joins:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberJoins();

    // Set up realtime subscription
    const channel = supabase
      .channel('member-joins-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'member_joins'
        },
        async (payload) => {
          const newMember = payload.new as MemberJoin;
          setMemberJoins(prev => [newMember, ...prev].slice(0, 50));
          setNewJoinAnimation(newMember.id);
          
          // Fetch Discord data for new member
          if (newMember.discord_id && /^\d{17,19}$/.test(newMember.discord_id)) {
            const userData = await fetchDiscordUserData(newMember.discord_id);
            if (userData) {
              setDiscordData(prev => ({ ...prev, [newMember.discord_id!]: userData }));
            }
          }
          
          // Clear animation after 3 seconds
          setTimeout(() => {
            setNewJoinAnimation(null);
          }, 3000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDiscordUserData]);

  const getTodayCount = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return memberJoins.filter(m => new Date(m.joined_at) >= today).length;
  };

  const getWeekCount = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return memberJoins.filter(m => new Date(m.joined_at) >= weekAgo).length;
  };

  return (
    <Card className="glass-effect border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Live Member Joins
            {isLive && (
              <Badge variant="outline" className="ml-2 border-green-500/50 text-green-500 animate-pulse">
                <Zap className="w-3 h-3 mr-1" />
                LIVE
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Real-time tracking of new member registrations
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchMemberJoins} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
            <div className="text-2xl font-bold text-primary">{memberJoins.length}</div>
            <div className="text-xs text-muted-foreground">Total (Last 50)</div>
          </div>
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
            <div className="text-2xl font-bold text-green-500">{getTodayCount()}</div>
            <div className="text-xs text-muted-foreground">Today</div>
          </div>
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
            <div className="text-2xl font-bold text-blue-500">{getWeekCount()}</div>
            <div className="text-xs text-muted-foreground">This Week</div>
          </div>
        </div>

        <ScrollArea className="h-[400px] pr-4">
          {memberJoins.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No member joins recorded yet</p>
              <p className="text-sm">New members will appear here in real-time</p>
            </div>
          ) : (
            <div className="space-y-3">
              {memberJoins.map((member) => (
                <div
                  key={member.id}
                  className={`p-4 rounded-lg border transition-all duration-500 ${
                    newJoinAnimation === member.id
                      ? 'bg-green-500/20 border-green-500/50 animate-pulse scale-[1.02]'
                      : 'bg-muted/30 border-border/50 hover:border-primary/30'
                  }`}
                >
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-primary/20">
                        <AvatarImage 
                          src={
                            (member.discord_id && discordData[member.discord_id]?.avatar) ||
                            member.discord_avatar || 
                            ''
                          } 
                          alt={
                            (member.discord_id && discordData[member.discord_id]?.displayName) ||
                            member.discord_username || 
                            'User'
                          } 
                        />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {((member.discord_id && discordData[member.discord_id]?.displayName) || 
                            member.discord_username || 
                            'U'
                          ).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          {(member.discord_id && discordData[member.discord_id]?.displayName) ||
                           member.discord_username || 
                           (member.discord_id ? `User ${member.discord_id.slice(-4)}` : 'Unknown User')}
                          {newJoinAnimation === member.id && (
                            <Badge className="bg-green-500 text-white text-[10px] px-1.5">NEW</Badge>
                          )}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {member.discord_id && (
                            <code className="bg-muted px-1.5 py-0.5 rounded">
                              {member.discord_id}
                            </code>
                          )}
                          {member.discord_id && discordData[member.discord_id]?.username && (
                            <span className="text-muted-foreground">
                              @{discordData[member.discord_id].username}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                      </div>
                      <div className="text-[10px] text-muted-foreground/70">
                        {format(new Date(member.joined_at), 'MMM d, yyyy HH:mm')}
                      </div>
                      {member.referral_source && (
                        <Badge variant="outline" className="text-[10px] mt-1">
                          via {member.referral_source}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
