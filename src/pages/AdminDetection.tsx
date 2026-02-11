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
  Ban, Check, X, Eye, AlertTriangle, Users, Unlock, FileText, Copy,
  Monitor, Smartphone, Tablet, Cpu, Clock, Languages, ArrowLeft, Download
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
import jsPDF from 'jspdf';

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
  const [evidenceDialog, setEvidenceDialog] = useState<{ open: boolean; detection: Detection | null }>({ open: false, detection: null });
  const [deviceSpecs, setDeviceSpecs] = useState<{ primary: any[]; alt: any[] }>({ primary: [], alt: [] });
  const [loadingSpecs, setLoadingSpecs] = useState(false);

  const openEvidenceDialog = async (detection: Detection) => {
    setEvidenceDialog({ open: true, detection });
    setLoadingSpecs(true);
    try {
      const [primaryRes, altRes] = await Promise.all([
        supabase.from('device_fingerprints').select('*').eq('user_id', detection.primary_user_id).order('updated_at', { ascending: false }).limit(5),
        supabase.from('device_fingerprints').select('*').eq('user_id', detection.alt_user_id).order('updated_at', { ascending: false }).limit(5),
      ]);
      console.log('Device specs primary:', primaryRes.data, primaryRes.error);
      console.log('Device specs alt:', altRes.data, altRes.error);
      setDeviceSpecs({ primary: primaryRes.data || [], alt: altRes.data || [] });
    } catch (err) {
      console.error('Failed to load device specs:', err);
      setDeviceSpecs({ primary: [], alt: [] });
    }
    setLoadingSpecs(false);

    // Subscribe to realtime device fingerprint changes
    const fpChannel = supabase
      .channel(`device-fp-${detection.primary_user_id}-${detection.alt_user_id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'device_fingerprints', filter: `user_id=eq.${detection.primary_user_id}` }, async () => {
        const { data } = await supabase.from('device_fingerprints').select('*').eq('user_id', detection.primary_user_id).order('updated_at', { ascending: false }).limit(5);
        setDeviceSpecs(prev => ({ ...prev, primary: data || [] }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'device_fingerprints', filter: `user_id=eq.${detection.alt_user_id}` }, async () => {
        const { data } = await supabase.from('device_fingerprints').select('*').eq('user_id', detection.alt_user_id).order('updated_at', { ascending: false }).limit(5);
        setDeviceSpecs(prev => ({ ...prev, alt: data || [] }));
      })
      .subscribe();

    return () => { supabase.removeChannel(fpChannel); };
  };

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
          <Button variant="outline" size="sm" className="mb-4" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
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
                            <TableHead>Evidence</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredDetections.map(d => {
                            const details = d.details || {};
                            const isIp = d.detection_type === 'ip_match';
                            return (
                            <TableRow key={d.id} className="group">
                              <TableCell>
                                {isIp ? (
                                  <div className="flex items-center gap-1"><Globe className="w-4 h-4 text-blue-500" />IP</div>
                                ) : (
                                  <div className="flex items-center gap-1"><Fingerprint className="w-4 h-4 text-purple-500" />Device</div>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{details.primary_username || 'Unknown'}</div>
                                {details.primary_discord_id && (
                                  <span className="text-xs text-muted-foreground">ID: {details.primary_discord_id}</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="font-medium text-destructive">{details.alt_username || 'Unknown'}</div>
                                {details.alt_discord_id && (
                                  <span className="text-xs text-muted-foreground">ID: {details.alt_discord_id}</span>
                                )}
                              </TableCell>
                              <TableCell>{getConfidenceBadge(d.confidence_score)}</TableCell>
                              <TableCell>{getStatusBadge(d.status)}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs underline text-primary hover:text-primary/80 p-0 h-auto"
                                  onClick={() => openEvidenceDialog(d)}
                                >
                                  <FileText className="w-3 h-3 mr-1" />
                                  View Evidence
                                </Button>
                              </TableCell>
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
                            );
                          })}
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

      {/* Evidence Detail Dialog */}
      <AlertDialog open={evidenceDialog.open} onOpenChange={(open) => !open && setEvidenceDialog({ open: false, detection: null })}>
        <AlertDialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Detection Evidence Report
            </AlertDialogTitle>
          </AlertDialogHeader>
          {evidenceDialog.detection && (() => {
            const d = evidenceDialog.detection!;
            const det = d.details || {};
            const isIp = d.detection_type === 'ip_match';
            const confidence = d.confidence_score;
            const severityLabel = confidence >= 80 ? '🔴 HIGH RISK' : confidence >= 50 ? '🟡 MEDIUM RISK' : '🟢 LOW RISK';
            const copyText = (text: string) => { navigator.clipboard.writeText(text); toast.success('Copied to clipboard'); };

            // Build human-readable reasoning
            const reasonLines: string[] = [];
            if (isIp) {
              reasonLines.push(`Two different accounts logged in from the exact same IP address (${det.shared_ip || d.ip_address || 'unknown'}).`);
              if (det.match_count && det.match_count > 1) {
                reasonLines.push(`This IP was shared across ${det.match_count} login sessions, indicating repeated access from the same network/device.`);
              }
              if (confidence >= 80) {
                reasonLines.push('The high number of shared logins strongly suggests these accounts belong to the same person.');
              } else if (confidence >= 50) {
                reasonLines.push('This could be a shared household/network or an alt account. Further investigation is recommended.');
              } else {
                reasonLines.push('Low match count — this may be a coincidence (e.g., public WiFi, VPN). Verify before taking action.');
              }
            } else {
              reasonLines.push(`Two different accounts were accessed from the exact same device/browser (matching hardware fingerprint).`);
              reasonLines.push(`Device fingerprint: ${(det.shared_fingerprint || d.fingerprint_hash || 'unknown').substring(0, 30)}...`);
              reasonLines.push('A fingerprint match is a strong indicator that the same physical device was used, meaning these accounts are very likely operated by the same person.');
              if (d.ip_address) {
                reasonLines.push(`The device was also detected at IP address ${d.ip_address} during this session.`);
              }
            }

            return (
              <div className="space-y-4 text-sm">
                {/* Severity Banner */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center gap-2">
                    {isIp ? <Globe className="w-5 h-5 text-blue-500" /> : <Fingerprint className="w-5 h-5 text-purple-500" />}
                    <span className="font-semibold">{isIp ? 'IP Address Match' : 'Device Fingerprint Match'}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{confidence}% Confidence</div>
                    <div className="text-xs">{severityLabel}</div>
                  </div>
                </div>

                {/* Human-Readable Reasoning */}
                <div className="p-4 rounded-lg border border-orange-500/30 bg-orange-500/5 space-y-2">
                  <div className="font-semibold flex items-center gap-2 text-orange-400">
                    <AlertTriangle className="w-4 h-4" />
                    Why This Was Flagged
                  </div>
                  {reasonLines.map((line, i) => (
                    <p key={i} className="text-muted-foreground leading-relaxed">
                      {i === 0 ? <span className="font-medium text-foreground">{line}</span> : line}
                    </p>
                  ))}
                </div>

                {/* Accounts Side by Side */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-border">
                    <div className="text-xs text-muted-foreground mb-1">👤 Primary Account</div>
                    <div className="font-semibold text-base">{det.primary_username || 'Unknown'}</div>
                    {det.primary_discord_id && (
                      <button onClick={() => copyText(det.primary_discord_id)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mt-1">
                        <Copy className="w-3 h-3" />Discord ID: {det.primary_discord_id}
                      </button>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">User ID: <span className="font-mono">{d.primary_user_id.substring(0, 12)}...</span></div>
                  </div>
                  <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                    <div className="text-xs text-muted-foreground mb-1">⚠️ Suspected Alt</div>
                    <div className="font-semibold text-base text-destructive">{det.alt_username || 'Unknown'}</div>
                    {det.alt_discord_id && (
                      <button onClick={() => copyText(det.alt_discord_id)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mt-1">
                        <Copy className="w-3 h-3" />Discord ID: {det.alt_discord_id}
                      </button>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">User ID: <span className="font-mono">{d.alt_user_id.substring(0, 12)}...</span></div>
                  </div>
                </div>

                {/* Technical Evidence */}
                <div className="p-4 rounded-lg border border-border space-y-3">
                  <div className="font-semibold flex items-center gap-1"><Eye className="w-4 h-4" /> Technical Evidence</div>
                  
                  {(det.shared_ip || d.ip_address) && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{isIp ? 'Shared IP Address:' : 'IP at Detection:'}</span>
                      <button onClick={() => copyText(det.shared_ip || d.ip_address || '')} className="font-mono text-xs bg-muted px-2 py-1 rounded hover:bg-muted/80 flex items-center gap-1">
                        <Copy className="w-3 h-3" />{det.shared_ip || d.ip_address}
                      </button>
                    </div>
                  )}

                  {(det.shared_fingerprint || d.fingerprint_hash) && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{!isIp ? 'Shared Device Fingerprint:' : 'Fingerprint at Detection:'}</span>
                      <button onClick={() => copyText(det.shared_fingerprint || d.fingerprint_hash || '')} className="font-mono text-xs bg-muted px-2 py-1 rounded hover:bg-muted/80 flex items-center gap-1">
                        <Copy className="w-3 h-3" />{(det.shared_fingerprint || d.fingerprint_hash || '').substring(0, 20)}...
                      </button>
                    </div>
                  )}

                  {isIp && det.match_count && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Shared Login Sessions:</span>
                      <span className="font-bold text-destructive">{det.match_count} login(s) from same IP</span>
                    </div>
                  )}
                </div>

                {/* What to Ask the User */}
                <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-2">
                  <div className="font-semibold flex items-center gap-2 text-primary">
                    <Users className="w-4 h-4" />
                    Suggested Questions to Ask the User
                  </div>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    {isIp ? (
                      <>
                        <li>Do you share your internet connection with anyone else who plays on this server?</li>
                        <li>Are you using a VPN or public WiFi that others may also use?</li>
                        <li>Do you know the user <strong className="text-foreground">{det.alt_username || 'Unknown'}</strong>? Are they in your household?</li>
                        <li>Can you explain why your account and <strong className="text-foreground">{det.alt_username || 'Unknown'}</strong>'s account share the same IP address?</li>
                      </>
                    ) : (
                      <>
                        <li>Do you have more than one account on this website?</li>
                        <li>Has anyone else used your computer/phone to access this website?</li>
                        <li>Can you explain why your device fingerprint matches the account <strong className="text-foreground">{det.alt_username || 'Unknown'}</strong>?</li>
                        <li>Are you aware that using multiple accounts is against our rules?</li>
                      </>
                    )}
                  </ul>
                </div>

                {/* Device Specifications */}
                <div className="p-4 rounded-lg border border-border space-y-3">
                  <div className="font-semibold flex items-center gap-2"><Monitor className="w-4 h-4" /> Device Specifications</div>
                  {loadingSpecs ? (
                    <div className="text-xs text-muted-foreground">Loading device specs...</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { label: `👤 ${det.primary_username || 'Primary'}`, devices: deviceSpecs.primary },
                        { label: `⚠️ ${det.alt_username || 'Alt'}`, devices: deviceSpecs.alt },
                      ].map(({ label, devices }) => (
                        <div key={label} className="space-y-2">
                          <div className="text-xs font-semibold text-muted-foreground">{label}</div>
                          {devices.length === 0 ? (
                            <div className="text-xs text-muted-foreground italic">No device data recorded</div>
                          ) : devices.map((dev: any, i: number) => {
                            const ua = dev.user_agent || '';
                            const isMobile = /mobile|android|iphone|ipad/i.test(ua);
                            const isTablet = /ipad|tablet/i.test(ua);
                            const DeviceIcon = isTablet ? Tablet : isMobile ? Smartphone : Monitor;
                            
                            // Parse browser & OS from user agent
                            let browser = 'Unknown Browser';
                            let os = 'Unknown OS';
                            if (/edg/i.test(ua)) browser = 'Microsoft Edge';
                            else if (/chrome/i.test(ua)) browser = 'Google Chrome';
                            else if (/firefox/i.test(ua)) browser = 'Mozilla Firefox';
                            else if (/safari/i.test(ua)) browser = 'Safari';
                            else if (/opera|opr/i.test(ua)) browser = 'Opera';

                            if (/windows/i.test(ua)) os = 'Windows';
                            else if (/mac os/i.test(ua)) os = 'macOS';
                            else if (/android/i.test(ua)) os = 'Android';
                            else if (/iphone|ipad|ios/i.test(ua)) os = 'iOS';
                            else if (/linux/i.test(ua)) os = 'Linux';

                            return (
                              <div key={dev.id || i} className="p-2 rounded border border-border/50 bg-muted/30 text-xs space-y-1">
                                <div className="flex items-center gap-1 font-medium">
                                  <DeviceIcon className="w-3 h-3" />
                                  {isTablet ? 'Tablet' : isMobile ? 'Mobile' : 'Desktop'} — {browser}
                                </div>
                                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-muted-foreground">
                                  <span className="flex items-center gap-1"><Cpu className="w-3 h-3" />OS:</span>
                                  <span>{os}</span>
                                  <span className="flex items-center gap-1"><Monitor className="w-3 h-3" />Screen:</span>
                                  <span>{dev.screen_resolution || 'N/A'}</span>
                                  <span className="flex items-center gap-1"><Languages className="w-3 h-3" />Language:</span>
                                  <span>{dev.language || 'N/A'}</span>
                                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Timezone:</span>
                                  <span>{dev.timezone || 'N/A'}</span>
                                  <span>Platform:</span>
                                  <span>{dev.platform || 'N/A'}</span>
                                  <span>IP:</span>
                                  <span className="font-mono">{dev.ip_address || 'N/A'}</span>
                                  <span>Blocked:</span>
                                  <span>{dev.is_blocked ? '🔴 Yes' : '🟢 No'}</span>
                                </div>
                                <div className="text-[10px] text-muted-foreground/60 truncate" title={ua}>
                                  UA: {ua.substring(0, 80)}{ua.length > 80 ? '...' : ''}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Meta Info */}
                <div className="p-3 rounded-lg border border-border space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Detected At:</span>
                    <span>{new Date(d.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Current Status:</span>
                    <span className="capitalize font-semibold">{d.status}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Discord Alert Sent:</span>
                    <span>{d.discord_alert_sent ? '✅ Yes' : '❌ No'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Detection ID:</span>
                    <button onClick={() => copyText(d.id)} className="font-mono hover:text-foreground flex items-center gap-1 text-muted-foreground">
                      <Copy className="w-3 h-3" />{d.id.substring(0, 16)}...
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
          <AlertDialogFooter>
            <Button variant="outline" size="sm" onClick={() => {
              if (!evidenceDialog.detection) return;
              const d = evidenceDialog.detection;
              const det = d.details || {};
              const isIp = d.detection_type === 'ip_match';
              const doc = new jsPDF();
              doc.setFontSize(20);
              doc.setFont('helvetica', 'bold');
              doc.text('SKYLIFE ROLEPLAY INDIA', 105, 20, { align: 'center' });
              doc.setFontSize(14);
              doc.text('Alt-Account Detection Evidence Report', 105, 30, { align: 'center' });
              doc.setDrawColor(59, 130, 246);
              doc.line(15, 35, 195, 35);
              let y = 45;
              const addLine = (label: string, value: string) => {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                doc.text(label, 20, y);
                doc.setFont('helvetica', 'normal');
                doc.text(value, 75, y);
                y += 7;
              };
              addLine('Detection Type:', isIp ? 'IP Address Match' : 'Device Fingerprint Match');
              addLine('Confidence:', `${d.confidence_score}%`);
              addLine('Status:', d.status);
              addLine('Detected At:', new Date(d.created_at).toLocaleString());
              addLine('Detection ID:', d.id);
              y += 5;
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(12);
              doc.text('Primary Account', 20, y); y += 7;
              doc.setFontSize(10);
              addLine('Username:', det.primary_username || 'Unknown');
              addLine('Discord ID:', det.primary_discord_id || 'N/A');
              addLine('User ID:', d.primary_user_id);
              y += 5;
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(12);
              doc.text('Suspected Alt Account', 20, y); y += 7;
              doc.setFontSize(10);
              addLine('Username:', det.alt_username || 'Unknown');
              addLine('Discord ID:', det.alt_discord_id || 'N/A');
              addLine('User ID:', d.alt_user_id);
              y += 5;
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(12);
              doc.text('Technical Evidence', 20, y); y += 7;
              doc.setFontSize(10);
              if (det.shared_ip || d.ip_address) addLine('IP Address:', det.shared_ip || d.ip_address);
              if (det.shared_fingerprint || d.fingerprint_hash) addLine('Fingerprint:', det.shared_fingerprint || d.fingerprint_hash || '');
              if (det.match_count) addLine('Match Count:', `${det.match_count} shared login(s)`);
              y += 5;
              // Device specs
              const addDeviceSpecs = (label: string, devices: any[]) => {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.text(label, 20, y); y += 7;
                doc.setFontSize(9);
                if (devices.length === 0) { addLine('', 'No device data recorded'); return; }
                devices.forEach((dev: any) => {
                  const ua = dev.user_agent || '';
                  let browser = 'Unknown';
                  if (/edg/i.test(ua)) browser = 'Edge';
                  else if (/chrome/i.test(ua)) browser = 'Chrome';
                  else if (/firefox/i.test(ua)) browser = 'Firefox';
                  else if (/safari/i.test(ua)) browser = 'Safari';
                  let os = 'Unknown';
                  if (/windows/i.test(ua)) os = 'Windows';
                  else if (/mac os/i.test(ua)) os = 'macOS';
                  else if (/android/i.test(ua)) os = 'Android';
                  else if (/iphone|ipad/i.test(ua)) os = 'iOS';
                  else if (/linux/i.test(ua)) os = 'Linux';
                  if (y > 260) { doc.addPage(); y = 20; }
                  addLine('Browser:', browser);
                  addLine('OS:', os);
                  addLine('Screen:', dev.screen_resolution || 'N/A');
                  addLine('Language:', dev.language || 'N/A');
                  addLine('Timezone:', dev.timezone || 'N/A');
                  addLine('Platform:', dev.platform || 'N/A');
                  addLine('IP:', dev.ip_address || 'N/A');
                  addLine('Blocked:', dev.is_blocked ? 'Yes' : 'No');
                  y += 3;
                });
              };
              addDeviceSpecs(`Primary (${det.primary_username || 'Unknown'})`, deviceSpecs.primary);
              addDeviceSpecs(`Alt (${det.alt_username || 'Unknown'})`, deviceSpecs.alt);
              doc.save(`Evidence-${d.id.substring(0, 8)}.pdf`);
              toast.success('Evidence PDF downloaded');
            }}>
              <Download className="w-4 h-4 mr-1" />
              Download Evidence PDF
            </Button>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDetection;
