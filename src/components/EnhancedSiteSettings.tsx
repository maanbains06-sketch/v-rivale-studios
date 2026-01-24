import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useOwnerAuditLog } from '@/hooks/useOwnerAuditLog';
import { 
  Settings, 
  Save, 
  Shield, 
  MessageSquare, 
  Bell, 
  Users, 
  Globe, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  Send,
  Trash2
} from 'lucide-react';

interface SiteSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
}

interface EnhancedSiteSettingsProps {
  settings: SiteSetting[];
  onSettingsChange: () => void;
}

interface Announcement {
  id: string;
  message: string;
  type: string;
  created_at: string;
  expires_at: string;
}

export const EnhancedSiteSettings = ({ settings, onSettingsChange }: EnhancedSiteSettingsProps) => {
  const { toast } = useToast();
  const { logAction } = useOwnerAuditLog();
  const [editedSettings, setEditedSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementType, setAnnouncementType] = useState('info');
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);
  const [activeAnnouncements, setActiveAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const settingsMap: Record<string, string> = {};
    settings.forEach(s => settingsMap[s.key] = s.value);
    setEditedSettings(settingsMap);
  }, [settings]);

  // Fetch active announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      
      if (data) setActiveAnnouncements(data);
    };
    
    fetchAnnouncements();

    // Subscribe to changes
    const channel = supabase
      .channel('announcements_admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
        fetchAnnouncements();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const sendAnnouncement = async () => {
    if (!announcementMessage.trim()) {
      toast({
        title: "Error",
        description: "Please enter an announcement message.",
        variant: "destructive",
      });
      return;
    }

    setSendingAnnouncement(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('announcements')
      .insert({
        message: announcementMessage.trim(),
        type: announcementType,
        created_by: user?.id,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send announcement.",
        variant: "destructive",
      });
      setSendingAnnouncement(false);
      return;
    }

    await logAction({
      actionType: 'announcement_sent',
      actionDescription: `Sent announcement: "${announcementMessage.substring(0, 50)}..."`,
      targetTable: 'announcements',
      newValue: { message: announcementMessage, type: announcementType }
    });

    toast({
      title: "Announcement Sent!",
      description: "Your announcement is now visible to all users.",
    });

    setAnnouncementMessage('');
    setSendingAnnouncement(false);
  };

  const deleteAnnouncement = async (id: string) => {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete announcement.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Announcement Deleted",
      description: "The announcement has been removed.",
    });
  };

  const getValue = (key: string, defaultValue: string = '') => {
    return editedSettings[key] ?? defaultValue;
  };

  const saveSetting = async (key: string) => {
    setSaving(key);
    const { data: { user } } = await supabase.auth.getUser();
    const oldValue = settings.find(s => s.key === key)?.value;
    
    // Check if setting exists
    const existingSetting = settings.find(s => s.key === key);
    
    if (existingSetting) {
      const { error } = await supabase
        .from("site_settings")
        .update({
          value: editedSettings[key],
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq("key", key);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to save setting.",
          variant: "destructive",
        });
        setSaving(null);
        return;
      }
    } else {
      // Insert new setting
      const { error } = await supabase
        .from("site_settings")
        .insert({
          key,
          value: editedSettings[key],
          updated_by: user?.id,
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to save setting.",
          variant: "destructive",
        });
        setSaving(null);
        return;
      }
    }

    await logAction({
      actionType: 'setting_update',
      actionDescription: `Updated setting "${key}"`,
      targetTable: 'site_settings',
      oldValue: { key, value: oldValue },
      newValue: { key, value: editedSettings[key] }
    });

    toast({
      title: "Success",
      description: "Setting saved successfully.",
    });
    setSaving(null);
    onSettingsChange();
  };

  const toggleSetting = async (key: string) => {
    const currentValue = getValue(key, 'false');
    const newValue = currentValue === 'true' ? 'false' : 'true';
    setEditedSettings(prev => ({ ...prev, [key]: newValue }));
    
    // Auto-save toggle settings
    const { data: { user } } = await supabase.auth.getUser();
    
    const existingSetting = settings.find(s => s.key === key);
    
    if (existingSetting) {
      await supabase
        .from("site_settings")
        .update({
          value: newValue,
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq("key", key);
    } else {
      await supabase
        .from("site_settings")
        .insert({
          key,
          value: newValue,
          updated_by: user?.id,
        });
    }

    await logAction({
      actionType: 'setting_update',
      actionDescription: `Toggled "${key}" to ${newValue}`,
      targetTable: 'site_settings',
      oldValue: { key, value: currentValue },
      newValue: { key, value: newValue }
    });

    toast({
      title: "Setting Updated",
      description: `${key.replace(/_/g, ' ')} ${newValue === 'true' ? 'enabled' : 'disabled'}.`,
    });
    
    onSettingsChange();
  };

  return (
    <div className="space-y-6">
      {/* Discord Configuration */}
      <Card className="glass-effect border-border/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Discord Configuration</CardTitle>
          </div>
          <CardDescription>Configure Discord integration settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Discord Server ID</Label>
              <div className="flex gap-2">
                <Input
                  value={getValue("discord_server_id")}
                  onChange={(e) => setEditedSettings({...editedSettings, discord_server_id: e.target.value})}
                  placeholder="Enter your Discord server ID"
                />
                <Button onClick={() => saveSetting("discord_server_id")} disabled={saving === "discord_server_id"}>
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Owner Discord ID</Label>
              <div className="flex gap-2">
                <Input
                  value={getValue("owner_discord_id")}
                  onChange={(e) => setEditedSettings({...editedSettings, owner_discord_id: e.target.value})}
                  placeholder="Your Discord user ID"
                />
                <Button onClick={() => saveSetting("owner_discord_id")} disabled={saving === "owner_discord_id"}>
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Whitelist Role ID</Label>
              <div className="flex gap-2">
                <Input
                  value={getValue("whitelist_discord_role_id")}
                  onChange={(e) => setEditedSettings({...editedSettings, whitelist_discord_role_id: e.target.value})}
                  placeholder="Role ID for whitelisted members"
                />
                <Button onClick={() => saveSetting("whitelist_discord_role_id")} disabled={saving === "whitelist_discord_role_id"}>
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Discord Invite Link</Label>
              <div className="flex gap-2">
                <Input
                  value={getValue("discord_invite_link", "https://discord.gg/skylife")}
                  onChange={(e) => setEditedSettings({...editedSettings, discord_invite_link: e.target.value})}
                  placeholder="https://discord.gg/..."
                />
                <Button onClick={() => saveSetting("discord_invite_link")} disabled={saving === "discord_invite_link"}>
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Announcement Banner - Send Announcements */}
      <Card className="glass-effect border-border/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Send Announcement</CardTitle>
          </div>
          <CardDescription>Broadcast announcements to all users in real-time (visible for 1 hour)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Announcement Message</Label>
            <Textarea
              value={announcementMessage}
              onChange={(e) => setAnnouncementMessage(e.target.value)}
              placeholder="Enter your announcement message..."
              className="min-h-[80px]"
            />
          </div>
          
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-2">
              <Label>Announcement Type</Label>
              <Select 
                value={announcementType}
                onValueChange={setAnnouncementType}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-500" />
                      Info
                    </div>
                  </SelectItem>
                  <SelectItem value="success">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Success
                    </div>
                  </SelectItem>
                  <SelectItem value="warning">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      Warning
                    </div>
                  </SelectItem>
                  <SelectItem value="error">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-500" />
                      Error
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={sendAnnouncement}
              disabled={sendingAnnouncement || !announcementMessage.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              <Send className="w-4 h-4 mr-2" />
              {sendingAnnouncement ? 'Sending...' : 'Send Announcement'}
            </Button>
          </div>
          
          {/* Preview */}
          {announcementMessage && (
            <div className={`p-3 rounded-lg border ${
              announcementType === 'info' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
              announcementType === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
              announcementType === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
              'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              <p className="text-sm font-medium flex items-center gap-2">
                {announcementType === 'info' && <Info className="w-4 h-4" />}
                {announcementType === 'success' && <CheckCircle className="w-4 h-4" />}
                {announcementType === 'warning' && <AlertTriangle className="w-4 h-4" />}
                {announcementType === 'error' && <XCircle className="w-4 h-4" />}
                Preview: {announcementMessage}
              </p>
            </div>
          )}

          {/* Active Announcements */}
          {activeAnnouncements.length > 0 && (
            <div className="mt-6 space-y-3">
              <Label className="text-base">Active Announcements ({activeAnnouncements.length})</Label>
              <div className="space-y-2">
                {activeAnnouncements.map((announcement) => (
                  <div 
                    key={announcement.id}
                    className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
                      announcement.type === 'info' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                      announcement.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                      announcement.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                      'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {announcement.type === 'info' && <Info className="w-4 h-4 flex-shrink-0" />}
                      {announcement.type === 'success' && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                      {announcement.type === 'warning' && <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
                      {announcement.type === 'error' && <XCircle className="w-4 h-4 flex-shrink-0" />}
                      <p className="text-sm font-medium truncate">{announcement.message}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteAnnouncement(announcement.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feature Toggles */}
      <Card className="glass-effect border-border/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Feature Toggles</CardTitle>
          </div>
          <CardDescription>Enable or disable site features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="space-y-0.5">
                <Label className="text-base">Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">Block access to the site</p>
              </div>
              <Switch 
                checked={getValue("maintenance_mode") === "true"}
                onCheckedChange={() => toggleSetting("maintenance_mode")}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="space-y-0.5">
                <Label className="text-base">Registration Enabled</Label>
                <p className="text-sm text-muted-foreground">Allow new signups</p>
              </div>
              <Switch 
                checked={getValue("registration_enabled", "true") === "true"}
                onCheckedChange={() => toggleSetting("registration_enabled")}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="space-y-0.5">
                <Label className="text-base">Support Chat</Label>
                <p className="text-sm text-muted-foreground">Enable live support</p>
              </div>
              <Switch 
                checked={getValue("support_chat_enabled", "true") === "true"}
                onCheckedChange={() => toggleSetting("support_chat_enabled")}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="space-y-0.5">
                <Label className="text-base">Gallery Submissions</Label>
                <p className="text-sm text-muted-foreground">Allow gallery uploads</p>
              </div>
              <Switch 
                checked={getValue("gallery_submissions_enabled", "true") === "true"}
                onCheckedChange={() => toggleSetting("gallery_submissions_enabled")}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="space-y-0.5">
                <Label className="text-base">Pause All Applications</Label>
                <p className="text-sm text-muted-foreground">Pause all application types</p>
              </div>
              <Switch 
                checked={getValue("applications_paused") === "true"}
                onCheckedChange={() => toggleSetting("applications_paused")}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="space-y-0.5">
                <Label className="text-base">Whitelist Applications</Label>
                <p className="text-sm text-muted-foreground">Accept whitelist applications</p>
              </div>
              <Switch 
                checked={getValue("whitelist_applications_enabled", "true") === "true"}
                onCheckedChange={() => toggleSetting("whitelist_applications_enabled")}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="space-y-0.5">
                <Label className="text-base">Ban Appeals</Label>
                <p className="text-sm text-muted-foreground">Accept ban appeal submissions</p>
              </div>
              <Switch 
                checked={getValue("ban_appeals_enabled", "true") === "true"}
                onCheckedChange={() => toggleSetting("ban_appeals_enabled")}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="space-y-0.5">
                <Label className="text-base">Gang Applications</Label>
                <p className="text-sm text-muted-foreground">Accept gang RP applications</p>
              </div>
              <Switch 
                checked={getValue("gang_applications_enabled", "true") === "true"}
                onCheckedChange={() => toggleSetting("gang_applications_enabled")}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="space-y-0.5">
                <Label className="text-base">Auto-Approve Veterans</Label>
                <p className="text-sm text-muted-foreground">Auto-approve returning players</p>
              </div>
              <Switch 
                checked={getValue("auto_approve_veterans") === "true"}
                onCheckedChange={() => toggleSetting("auto_approve_veterans")}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-amber-500/50">
              <div className="space-y-0.5">
                <Label className="text-base">Hide Business Header</Label>
                <p className="text-sm text-muted-foreground">Hide Business page from all users (owner only)</p>
              </div>
              <Switch 
                checked={getValue("business_header_hidden") === "true"}
                onCheckedChange={() => toggleSetting("business_header_hidden")}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="space-y-0.5">
                <Label className="text-base">Giveaways Enabled</Label>
                <p className="text-sm text-muted-foreground">Enable giveaway system</p>
              </div>
              <Switch 
                checked={getValue("giveaways_enabled", "true") === "true"}
                onCheckedChange={() => toggleSetting("giveaways_enabled")}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="space-y-0.5">
                <Label className="text-base">Community Events</Label>
                <p className="text-sm text-muted-foreground">Show community events</p>
              </div>
              <Switch 
                checked={getValue("events_enabled", "true") === "true"}
                onCheckedChange={() => toggleSetting("events_enabled")}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="space-y-0.5">
                <Label className="text-base">Creator Applications</Label>
                <p className="text-sm text-muted-foreground">Accept creator program apps</p>
              </div>
              <Switch 
                checked={getValue("creator_applications_enabled", "true") === "true"}
                onCheckedChange={() => toggleSetting("creator_applications_enabled")}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="space-y-0.5">
                <Label className="text-base">Staff Applications</Label>
                <p className="text-sm text-muted-foreground">Accept staff applications</p>
              </div>
              <Switch 
                checked={getValue("staff_applications_enabled", "true") === "true"}
                onCheckedChange={() => toggleSetting("staff_applications_enabled")}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="space-y-0.5">
                <Label className="text-base">Job Applications</Label>
                <p className="text-sm text-muted-foreground">Accept job applications</p>
              </div>
              <Switch 
                checked={getValue("job_applications_enabled", "true") === "true"}
                onCheckedChange={() => toggleSetting("job_applications_enabled")}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="space-y-0.5">
                <Label className="text-base">Discord Sync</Label>
                <p className="text-sm text-muted-foreground">Auto-sync Discord profiles</p>
              </div>
              <Switch 
                checked={getValue("discord_sync_enabled", "true") === "true"}
                onCheckedChange={() => toggleSetting("discord_sync_enabled")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Server & Limits */}
      <Card className="glass-effect border-border/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Server & Limits</CardTitle>
          </div>
          <CardDescription>Configure server settings and limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>FiveM Connect URL</Label>
              <div className="flex gap-2">
                <Input
                  value={getValue("fivem_server_connect", "fivem://connect/cfx.re/join/abc123")}
                  onChange={(e) => setEditedSettings({...editedSettings, fivem_server_connect: e.target.value})}
                  placeholder="fivem://connect/..."
                />
                <Button onClick={() => saveSetting("fivem_server_connect")} disabled={saving === "fivem_server_connect"}>
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Server Restart Time (24h)</Label>
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={getValue("server_restart_time", "03:00")}
                  onChange={(e) => setEditedSettings({...editedSettings, server_restart_time: e.target.value})}
                />
                <Button onClick={() => saveSetting("server_restart_time")} disabled={saving === "server_restart_time"}>
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Max Whitelist Per Day</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={getValue("max_whitelist_per_day", "50")}
                  onChange={(e) => setEditedSettings({...editedSettings, max_whitelist_per_day: e.target.value})}
                />
                <Button onClick={() => saveSetting("max_whitelist_per_day")} disabled={saving === "max_whitelist_per_day"}>
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Minimum Age Requirement</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={getValue("min_age_requirement", "16")}
                  onChange={(e) => setEditedSettings({...editedSettings, min_age_requirement: e.target.value})}
                />
                <Button onClick={() => saveSetting("min_age_requirement")} disabled={saving === "min_age_requirement"}>
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social & Branding */}
      <Card className="glass-effect border-border/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Social & Branding</CardTitle>
          </div>
          <CardDescription>Configure social media and branding</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Welcome Message</Label>
              <div className="flex gap-2">
                <Input
                  value={getValue("welcome_message", "Welcome to SkyLife RP!")}
                  onChange={(e) => setEditedSettings({...editedSettings, welcome_message: e.target.value})}
                  placeholder="Welcome message for new members"
                />
                <Button onClick={() => saveSetting("welcome_message")} disabled={saving === "welcome_message"}>
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Twitter/X Handle</Label>
              <div className="flex gap-2">
                <Input
                  value={getValue("twitter_handle", "@SkyLifeRP")}
                  onChange={(e) => setEditedSettings({...editedSettings, twitter_handle: e.target.value})}
                  placeholder="@YourHandle"
                />
                <Button onClick={() => saveSetting("twitter_handle")} disabled={saving === "twitter_handle"}>
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Maintenance Message</Label>
            <div className="flex gap-2">
              <Textarea
                value={getValue("maintenance_message", "We are currently performing scheduled maintenance. Please check back soon!")}
                onChange={(e) => setEditedSettings({...editedSettings, maintenance_message: e.target.value})}
                placeholder="Message shown during maintenance"
              />
              <Button onClick={() => saveSetting("maintenance_message")} disabled={saving === "maintenance_message"}>
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Open Positions</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={getValue("open_positions", "7")}
                  onChange={(e) => setEditedSettings({...editedSettings, open_positions: e.target.value})}
                />
                <Button onClick={() => saveSetting("open_positions")} disabled={saving === "open_positions"}>
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Staff Role ID</Label>
              <div className="flex gap-2">
                <Input
                  value={getValue("staff_discord_role_id")}
                  onChange={(e) => setEditedSettings({...editedSettings, staff_discord_role_id: e.target.value})}
                  placeholder="Discord role ID for staff"
                />
                <Button onClick={() => saveSetting("staff_discord_role_id")} disabled={saving === "staff_discord_role_id"}>
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
