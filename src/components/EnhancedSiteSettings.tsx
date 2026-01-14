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
  XCircle
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

export const EnhancedSiteSettings = ({ settings, onSettingsChange }: EnhancedSiteSettingsProps) => {
  const { toast } = useToast();
  const { logAction } = useOwnerAuditLog();
  const [editedSettings, setEditedSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const settingsMap: Record<string, string> = {};
    settings.forEach(s => settingsMap[s.key] = s.value);
    setEditedSettings(settingsMap);
  }, [settings]);

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

      {/* Announcement Banner */}
      <Card className="glass-effect border-border/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Announcement Banner</CardTitle>
          </div>
          <CardDescription>Display a global announcement across the site</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Banner Message (leave empty to hide)</Label>
            <div className="flex gap-2">
              <Textarea
                value={getValue("announcement_banner")}
                onChange={(e) => setEditedSettings({...editedSettings, announcement_banner: e.target.value})}
                placeholder="Enter announcement text..."
                className="min-h-[80px]"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Label>Banner Type</Label>
              <Select 
                value={getValue("announcement_type", "info")}
                onValueChange={(value) => setEditedSettings({...editedSettings, announcement_type: value})}
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
              onClick={() => {
                saveSetting("announcement_banner");
                saveSetting("announcement_type");
              }}
              disabled={saving === "announcement_banner"}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Announcement
            </Button>
          </div>
          
          {getValue("announcement_banner") && (
            <div className={`p-3 rounded-lg border ${
              getValue("announcement_type") === 'info' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
              getValue("announcement_type") === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
              getValue("announcement_type") === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
              'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              <p className="text-sm font-medium flex items-center gap-2">
                {getValue("announcement_type") === 'info' && <Info className="w-4 h-4" />}
                {getValue("announcement_type") === 'success' && <CheckCircle className="w-4 h-4" />}
                {getValue("announcement_type") === 'warning' && <AlertTriangle className="w-4 h-4" />}
                {getValue("announcement_type") === 'error' && <XCircle className="w-4 h-4" />}
                Preview: {getValue("announcement_banner")}
              </p>
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
                <Label className="text-base">Pause Applications</Label>
                <p className="text-sm text-muted-foreground">Pause all application types</p>
              </div>
              <Switch 
                checked={getValue("applications_paused") === "true"}
                onCheckedChange={() => toggleSetting("applications_paused")}
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
