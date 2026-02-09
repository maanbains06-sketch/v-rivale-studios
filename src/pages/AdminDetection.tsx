import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useStaffRole } from "@/hooks/useStaffRole";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Shield, ShieldAlert, Fingerprint, Globe, RefreshCw, 
  Ban, Check, X, Eye, AlertTriangle, Users, Unlock 
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import headerStaffBg from "@/assets/header-staff.jpg";

interface Detection {
  id: string;
  primary_user_id: string;
  alt_user_id: string;
  detection_type: string;
  confidence_score: number;
  ip_address: string | null;
  fingerprint_hash: string | null;
  details: any;
  status: string;
  discord_alert_sent: boolean;
  created_at: string;
}

interface WebsiteBan {
  id: string;
  user_id: string | null;
  discord_id: string | null;
  discord_username: string | null;
  steam_id: string | null;
  fivem_id: string | null;
  ban_reason: string;
  ban_source: string;
  is_permanent: boolean;
  fingerprint_hashes: string[];
  ip_addresses: string[];
  banned_by: string | null;
  unbanned_by: string | null;
  unbanned_at: string | null;
  is_active: boolean;
  fivem_ban_id: string | null;
  created_at: string;
}

const AdminDetection = () => {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [bans, setBans] = useState<WebsiteBan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin, loading: roleLoading } = useStaffRole();
  const navigate = useNavigate();
  const [unbanDialog, setUnbanDialog] = useState<{ open: boolean; ban: WebsiteBan | null }>({ open: false, ban: null });
  const [banDialog, setBanDialog] = useState(false);
  const [newBan, setNewBan] = useState({ discord_id: '', discord_username: '', steam_id: '', ban_reason: '' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error('Access denied');
      navigate('/');
    }
  }, [isAdmin, roleLoading, navigate]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [{ data: dets }, { data: bansData }] = await Promise.all([
      supabase.from('alt_account_detections').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('website_bans').select('*').order('created_at', { ascending: false }),
    ]);
    setDetections(dets || []);
    setBans(bansData || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin, loadData]);

  // Realtime
  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel('detection-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alt_account_detections' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'website_bans' }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin, loadData]);

  const handleUpdateDetection = async (id: string, status: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to perform this action');
        return;
      }
      const { error } = await supabase.from('alt_account_detections').update({
        status,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) {
        toast.error(`Failed to update detection: ${error.message}`);
        return;
      }
      toast.success(`Detection marked as ${status}`);
      loadData();
    } catch (err: any) {
      toast.error(`Error updating detection: ${err.message || 'Unknown error'}`);
    }
  };

  const handleUnban = async () => {
    if (!unbanDialog.ban) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('website_bans').update({
        is_active: false,
        unbanned_by: user?.id,
        unbanned_at: new Date().toISOString(),
      }).eq('id', unbanDialog.ban.id);
      if (error) { toast.error(`Failed to unban: ${error.message}`); return; }

      if (unbanDialog.ban.user_id) {
        await supabase.from('device_fingerprints').update({ is_blocked: false }).eq('user_id', unbanDialog.ban.user_id);
      }
      toast.success('User unbanned successfully');
      setUnbanDialog({ open: false, ban: null });
      loadData();
    } catch (err: any) {
      toast.error(`Error unbanning: ${err.message || 'Unknown error'}`);
    }
  };

  const handleManualBan = async () => {
    if (!newBan.ban_reason) { toast.error('Ban reason is required'); return; }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let userId = null;
      if (newBan.discord_id) {
        const { data: profile } = await supabase.from('profiles').select('id').eq('discord_id', newBan.discord_id).maybeSingle();
        userId = profile?.id;
      }
      const { error } = await supabase.from('website_bans').insert({
        user_id: userId,
        discord_id: newBan.discord_id || null,
        discord_username: newBan.discord_username || null,
        steam_id: newBan.steam_id || null,
        ban_reason: newBan.ban_reason,
        ban_source: 'website',
        is_permanent: true,
        banned_by: user?.email || 'Admin',
      });
      if (error) { toast.error(`Failed to ban: ${error.message}`); return; }

      if (userId) {
        await supabase.from('device_fingerprints').update({ is_blocked: true }).eq('user_id', userId);
      }
      toast.success('User banned from website');
      setBanDialog(false);
      setNewBan({ discord_id: '', discord_username: '', steam_id: '', ban_reason: '' });
      loadData();
    } catch (err: any) {
      toast.error(`Error banning user: ${err.message || 'Unknown error'}`);
    }
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 80) return <Badge variant="destructive">{score}% High</Badge>;
    if (score >= 50) return <Badge className="bg-orange-500">{score}% Medium</Badge>;
    return <Badge variant="secondary">{score}% Low</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'flagged': return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Flagged</Badge>;
      case 'confirmed': return <Badge className="bg-red-700"><Check className="w-3 h-3 mr-1" />Confirmed</Badge>;
      case 'dismissed': return <Badge variant="secondary"><X className="w-3 h-3 mr-1" />Dismissed</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const activeBans = bans.filter(b => b.is_active);
  const inactiveBans = bans.filter(b => !b.is_active);
  const filteredDetections = detections.filter(d => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return d.details?.primary_username?.toLowerCase().includes(s) ||
           d.details?.alt_username?.toLowerCase().includes(s) ||
           d.ip_address?.includes(s);
  });

  if (roleLoading) return <div className="min-h-screen"><Navigation /><div className="pt-24 px-4"><Skeleton className="h-64 w-full" /></div></div>;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen">
      <Navigation />
      <PageHeader title="Detection Center" description="Alt-Account Detection & Ban Management" backgroundImage={headerStaffBg} />

      <div className="px-4 pb-16 -mt-8 relative z-10">
        <div className="container mx-auto">
          <Tabs defaultValue="detections" className="space-y-6">
            <TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-muted/50">
              <TabsTrigger value="detections" className="flex items-center gap-1">
                <ShieldAlert className="w-4 h-4" />
                <span>Alt Detections</span>
                {detections.filter(d => d.status === 'flagged').length > 0 && (
                  <Badge variant="destructive" className="ml-1 text-xs">
                    {detections.filter(d => d.status === 'flagged').length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="bans" className="flex items-center gap-1">
                <Ban className="w-4 h-4" />
                <span>Website Bans</span>
                {activeBans.length > 0 && (
                  <Badge variant="destructive" className="ml-1 text-xs">{activeBans.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-1">
                <Unlock className="w-4 h-4" />
                <span>Unban History</span>
              </TabsTrigger>
            </TabsList>

            {/* Alt Detections Tab */}
            <TabsContent value="detections">
              <Card className="glass-effect border-border/20">
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <ShieldAlert className="w-6 h-6 text-destructive" />
                      <div>
                        <CardTitle>Alt-Account Detections</CardTitle>
                        <CardDescription>IP & fingerprint-based detection of suspicious registrations</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input placeholder="Search users..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-48" />
                      <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
                        <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
                  ) : filteredDetections.length === 0 ? (
                    <div className="text-center py-12">
                      <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg text-muted-foreground">No alt-account detections found</p>
                      <p className="text-sm text-muted-foreground mt-2">The system monitors for suspicious patterns automatically</p>
                    </div>
                  ) : (
                    <ScrollArea className="max-h-[600px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Account 1</TableHead>
                            <TableHead>Account 2</TableHead>
                            <TableHead>Confidence</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredDetections.map(d => (
                            <TableRow key={d.id}>
                              <TableCell>
                                {d.detection_type === 'ip_match' ? (
                                  <div className="flex items-center gap-1"><Globe className="w-4 h-4 text-blue-500" />IP</div>
                                ) : (
                                  <div className="flex items-center gap-1"><Fingerprint className="w-4 h-4 text-purple-500" />Device</div>
                                )}
                              </TableCell>
                              <TableCell className="font-medium">{d.details?.primary_username || 'Unknown'}</TableCell>
                              <TableCell className="font-medium text-destructive">{d.details?.alt_username || 'Unknown'}</TableCell>
                              <TableCell>{getConfidenceBadge(d.confidence_score)}</TableCell>
                              <TableCell>{getStatusBadge(d.status)}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(d.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {d.status !== 'confirmed' && (
                                    <Button size="sm" variant="destructive" onClick={() => handleUpdateDetection(d.id, 'confirmed')} title="Confirm Alt">
                                      <Check className="w-3 h-3" />
                                    </Button>
                                  )}
                                  {d.status !== 'dismissed' && (
                                    <Button size="sm" variant="outline" onClick={() => handleUpdateDetection(d.id, 'dismissed')} title="Dismiss">
                                      <X className="w-3 h-3" />
                                    </Button>
                                  )}
                                  {d.status !== 'flagged' && (
                                    <Button size="sm" variant="secondary" onClick={() => handleUpdateDetection(d.id, 'flagged')} title="Re-flag">
                                      <AlertTriangle className="w-3 h-3" />
                                    </Button>
                                  )}
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
            </TabsContent>

            {/* Website Bans Tab */}
            <TabsContent value="bans">
              <Card className="glass-effect border-border/20">
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <Ban className="w-6 h-6 text-destructive" />
                      <div>
                        <CardTitle>Active Website Bans</CardTitle>
                        <CardDescription>Users permanently banned from FiveM server & website</CardDescription>
                      </div>
                    </div>
                    <Button onClick={() => setBanDialog(true)} variant="destructive" size="sm">
                      <Ban className="w-4 h-4 mr-1" />
                      Manual Ban
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {activeBans.length === 0 ? (
                    <div className="text-center py-12">
                      <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg text-muted-foreground">No active website bans</p>
                    </div>
                  ) : (
                    <ScrollArea className="max-h-[600px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Discord ID</TableHead>
                            <TableHead>Steam ID</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Devices Blocked</TableHead>
                            <TableHead>Banned At</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activeBans.map(ban => (
                            <TableRow key={ban.id}>
                              <TableCell className="font-medium">{ban.discord_username || 'Unknown'}</TableCell>
                              <TableCell className="text-sm">{ban.discord_id || 'N/A'}</TableCell>
                              <TableCell className="text-sm">{ban.steam_id || 'N/A'}</TableCell>
                              <TableCell className="max-w-[200px] truncate">{ban.ban_reason}</TableCell>
                              <TableCell>
                                <Badge variant={ban.ban_source === 'fivem' ? 'destructive' : 'secondary'}>
                                  {ban.ban_source === 'fivem' ? '🎮 FiveM' : '🌐 Website'}
                                </Badge>
                              </TableCell>
                              <TableCell>{ban.fingerprint_hashes?.length || 0}</TableCell>
                              <TableCell className="text-sm">{new Date(ban.created_at).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <Button size="sm" variant="outline" onClick={() => setUnbanDialog({ open: true, ban })}>
                                  <Unlock className="w-3 h-3 mr-1" />
                                  Unban
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
            </TabsContent>

            {/* Unban History Tab */}
            <TabsContent value="history">
              <Card className="glass-effect border-border/20">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Unlock className="w-6 h-6 text-green-500" />
                    <div>
                      <CardTitle>Unban History</CardTitle>
                      <CardDescription>Previously banned users who have been unbanned</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {inactiveBans.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg text-muted-foreground">No unban history</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Banned At</TableHead>
                          <TableHead>Unbanned At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inactiveBans.map(ban => (
                          <TableRow key={ban.id}>
                            <TableCell className="font-medium">{ban.discord_username || 'Unknown'}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{ban.ban_reason}</TableCell>
                            <TableCell><Badge variant="secondary">{ban.ban_source}</Badge></TableCell>
                            <TableCell className="text-sm">{new Date(ban.created_at).toLocaleDateString()}</TableCell>
                            <TableCell className="text-sm text-green-500">
                              {ban.unbanned_at ? new Date(ban.unbanned_at).toLocaleDateString() : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Unban Dialog */}
      <AlertDialog open={unbanDialog.open} onOpenChange={(open) => !open && setUnbanDialog({ open: false, ban: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unban User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unban <strong>{unbanDialog.ban?.discord_username || 'this user'}</strong>?
              This will restore their website access and unblock their devices.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnban}>Unban User</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Manual Ban Dialog */}
      <AlertDialog open={banDialog} onOpenChange={setBanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Manual Website Ban</AlertDialogTitle>
            <AlertDialogDescription>
              Ban a user from accessing the website. Their devices will be fingerprinted and blocked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Discord ID</Label>
              <Input placeholder="e.g. 123456789012345678" value={newBan.discord_id} onChange={e => setNewBan(p => ({ ...p, discord_id: e.target.value }))} />
            </div>
            <div>
              <Label>Discord Username</Label>
              <Input placeholder="e.g. username" value={newBan.discord_username} onChange={e => setNewBan(p => ({ ...p, discord_username: e.target.value }))} />
            </div>
            <div>
              <Label>Steam ID</Label>
              <Input placeholder="e.g. steam:110000xxxxxxx" value={newBan.steam_id} onChange={e => setNewBan(p => ({ ...p, steam_id: e.target.value }))} />
            </div>
            <div>
              <Label>Ban Reason *</Label>
              <Textarea placeholder="Reason for banning..." value={newBan.ban_reason} onChange={e => setNewBan(p => ({ ...p, ban_reason: e.target.value }))} />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleManualBan} className="bg-destructive hover:bg-destructive/90">
              <Ban className="w-4 h-4 mr-1" />Ban User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDetection;
