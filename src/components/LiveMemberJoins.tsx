import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Users, RefreshCw, Zap, Clock, Ban, ShieldAlert, Shield } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

interface UserRoleData {
  role: string;
}

export const LiveMemberJoins = () => {
  const { toast } = useToast();
  const [memberJoins, setMemberJoins] = useState<MemberJoin[]>([]);
  const [discordData, setDiscordData] = useState<Record<string, DiscordUserData>>({});
  const [userRoles, setUserRoles] = useState<Record<string, UserRoleData[]>>({});
  const [bannedUserIds, setBannedUserIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [newJoinAnimation, setNewJoinAnimation] = useState<string | null>(null);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banTarget, setBanTarget] = useState<MemberJoin | null>(null);
  const [banReason, setBanReason] = useState('');
  const [isBanning, setIsBanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    } catch {
      return null;
    }
  }, []);

  const fetchBannedUsers = useCallback(async () => {
    const { data } = await supabase
      .from('website_bans')
      .select('user_id, discord_id')
      .eq('is_active', true);
    
    const ids = new Set<string>();
    (data || []).forEach(b => {
      if (b.user_id) ids.add(b.user_id);
    });
    setBannedUserIds(ids);
  }, []);

  const fetchUserRoles = useCallback(async (userIds: string[]) => {
    if (!userIds.length) return;
    const { data } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', userIds);
    
    const rolesMap: Record<string, UserRoleData[]> = {};
    (data || []).forEach(r => {
      if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
      rolesMap[r.user_id].push({ role: r.role });
    });
    setUserRoles(prev => ({ ...prev, ...rolesMap }));
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

      // Fetch roles for all users
      const userIds = (data || []).map(m => m.user_id).filter(Boolean);
      fetchUserRoles(userIds);

      // Fetch Discord data for members with discord_id but no username
      const membersToFetch = (data || []).filter(m =>
        m.discord_id &&
        /^\d{17,19}$/.test(m.discord_id) &&
        (!m.discord_username || m.discord_username === 'Unknown User')
      );

      const newDiscordData: Record<string, DiscordUserData> = {};
      for (const member of membersToFetch.slice(0, 10)) {
        const userData = await fetchDiscordUserData(member.discord_id!);
        if (userData) {
          newDiscordData[member.discord_id!] = userData;
        }
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      setDiscordData(prev => ({ ...prev, ...newDiscordData }));
    } catch (error) {
      console.error('Error fetching member joins:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!banTarget || !banReason.trim()) return;
    setIsBanning(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const discordName = (banTarget.discord_id && discordData[banTarget.discord_id]?.displayName) ||
        banTarget.discord_username || null;

      const { error } = await supabase.from('website_bans').insert({
        user_id: banTarget.user_id,
        discord_id: banTarget.discord_id,
        discord_username: discordName,
        ban_reason: banReason.trim(),
        ban_source: 'website_manual',
        banned_by: user?.id || null,
        is_permanent: true,
        is_active: true,
      });

      if (error) throw error;

      setBannedUserIds(prev => new Set([...prev, banTarget.user_id]));
      setBanDialogOpen(false);
      setBanTarget(null);
      setBanReason('');
      toast({ title: 'User Banned', description: `${discordName || 'User'} has been banned from the website.` });
    } catch (error) {
      console.error('Ban error:', error);
      toast({ title: 'Error', description: 'Failed to ban user.', variant: 'destructive' });
    } finally {
      setIsBanning(false);
    }
  };

  const handleUnbanUser = async (member: MemberJoin) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('website_bans')
        .update({ is_active: false, unbanned_by: user?.id, unbanned_at: new Date().toISOString() })
        .eq('user_id', member.user_id)
        .eq('is_active', true);

      if (error) throw error;
      setBannedUserIds(prev => {
        const next = new Set(prev);
        next.delete(member.user_id);
        return next;
      });
      toast({ title: 'User Unbanned', description: 'The user has been unbanned.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to unban user.', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchMemberJoins();
    fetchBannedUsers();

    const channel = supabase
      .channel('member-joins-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'member_joins' },
        async (payload) => {
          const newMember = payload.new as MemberJoin;
          setMemberJoins(prev => [newMember, ...prev].slice(0, 50));
          setNewJoinAnimation(newMember.id);
          fetchUserRoles([newMember.user_id]);

          if (newMember.discord_id && /^\d{17,19}$/.test(newMember.discord_id)) {
            const userData = await fetchDiscordUserData(newMember.discord_id);
            if (userData) {
              setDiscordData(prev => ({ ...prev, [newMember.discord_id!]: userData }));
            }
          }
          setTimeout(() => setNewJoinAnimation(null), 3000);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchDiscordUserData, fetchBannedUsers, fetchUserRoles]);

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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">Admin</Badge>;
      case 'moderator': return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">Moderator</Badge>;
      default: return <Badge variant="outline" className="text-[10px]">User</Badge>;
    }
  };

  const getDisplayName = (member: MemberJoin) => {
    return (member.discord_id && discordData[member.discord_id]?.displayName) ||
      member.discord_username ||
      (member.discord_id ? `User ${member.discord_id.slice(-4)}` : 'Unknown User');
  };

  const filteredMembers = memberJoins.filter(m => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = getDisplayName(m).toLowerCase();
    const discId = m.discord_id?.toLowerCase() || '';
    const username = (m.discord_id && discordData[m.discord_id]?.username?.toLowerCase()) || '';
    return name.includes(q) || discId.includes(q) || username.includes(q);
  });

  return (
    <>
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
            <CardDescription>Real-time tracking of new member registrations</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => { fetchMemberJoins(); fetchBannedUsers(); }} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
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

          {/* Search */}
          <Input
            placeholder="Search by name, Discord ID, or username..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="mb-4"
          />

          <ScrollArea className="h-[500px] pr-4">
            {filteredMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No members found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMembers.map((member) => {
                  const isBanned = bannedUserIds.has(member.user_id);
                  const roles = userRoles[member.user_id] || [];

                  return (
                    <div
                      key={member.id}
                      className={`p-4 rounded-lg border transition-all duration-500 ${
                        isBanned
                          ? 'bg-red-500/10 border-red-500/30'
                          : newJoinAnimation === member.id
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
                                member.discord_avatar || ''
                              }
                              alt={getDisplayName(member)}
                            />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getDisplayName(member).charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium flex items-center gap-2 flex-wrap">
                              {getDisplayName(member)}
                              {isBanned && (
                                <Badge className="bg-red-600 text-white text-[10px] px-1.5">
                                  <Ban className="w-3 h-3 mr-0.5" /> BANNED
                                </Badge>
                              )}
                              {newJoinAnimation === member.id && (
                                <Badge className="bg-green-500 text-white text-[10px] px-1.5">NEW</Badge>
                              )}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap mt-0.5">
                              {member.discord_id && (
                                <code className="bg-muted px-1.5 py-0.5 rounded">{member.discord_id}</code>
                              )}
                              {member.discord_id && discordData[member.discord_id]?.username && (
                                <span>@{discordData[member.discord_id].username}</span>
                              )}
                            </div>
                            {/* Roles */}
                            <div className="flex items-center gap-1 mt-1 flex-wrap">
                              {roles.length > 0 ? (
                                roles.map((r, i) => (
                                  <span key={i}>{getRoleBadge(r.role)}</span>
                                ))
                              ) : (
                                <Badge variant="outline" className="text-[10px]">User</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
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
                          {isBanned ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-500 border-green-500/30 hover:bg-green-500/10"
                              onClick={() => handleUnbanUser(member)}
                            >
                              <Shield className="w-3 h-3 mr-1" /> Unban
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-500 border-red-500/30 hover:bg-red-500/10"
                              onClick={() => { setBanTarget(member); setBanDialogOpen(true); }}
                            >
                              <ShieldAlert className="w-3 h-3 mr-1" /> Ban
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Ban Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <ShieldAlert className="w-5 h-5" /> Ban User
            </DialogTitle>
            <DialogDescription>
              Ban <strong>{banTarget ? getDisplayName(banTarget) : ''}</strong> from the website. This will block their access immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {banTarget?.discord_id && (
              <div className="text-sm text-muted-foreground">
                Discord ID: <code className="bg-muted px-1.5 py-0.5 rounded">{banTarget.discord_id}</code>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Ban Reason *</label>
              <Textarea
                placeholder="Enter the reason for banning this user..."
                value={banReason}
                onChange={e => setBanReason(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleBanUser}
              disabled={isBanning || !banReason.trim()}
            >
              {isBanning ? 'Banning...' : 'Confirm Ban'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
