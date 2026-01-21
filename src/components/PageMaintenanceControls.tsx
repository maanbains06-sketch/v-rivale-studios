import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useOwnerAuditLog } from '@/hooks/useOwnerAuditLog';
import { 
  Globe, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Settings,
  Timer,
  RefreshCw,
  Play,
  Pause
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PageMaintenanceSetting {
  id: string;
  page_key: string;
  page_name: string;
  is_enabled: boolean;
  maintenance_message: string | null;
  cooldown_minutes: number;
  enabled_at: string | null;
  scheduled_end_at: string | null;
  created_at: string;
  updated_at: string;
}

export const PageMaintenanceControls = () => {
  const { toast } = useToast();
  const { logAction } = useOwnerAuditLog();
  const [settings, setSettings] = useState<PageMaintenanceSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [cooldownInputs, setCooldownInputs] = useState<Record<string, number>>({});
  const [timeRemaining, setTimeRemaining] = useState<Record<string, { hours: number; minutes: number; seconds: number }>>({});

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('page_maintenance_settings')
        .select('*')
        .order('page_name');

      if (error) {
        console.error('Error fetching page maintenance settings:', error);
        toast({
          title: "Error",
          description: "Failed to load page maintenance settings.",
          variant: "destructive",
        });
        return;
      }

      setSettings(data as PageMaintenanceSetting[] || []);
      
      // Initialize cooldown inputs
      const cooldowns: Record<string, number> = {};
      (data || []).forEach((s: PageMaintenanceSetting) => {
        cooldowns[s.page_key] = s.cooldown_minutes || 30;
      });
      setCooldownInputs(cooldowns);
    } catch (err) {
      console.error('Error in fetchSettings:', err);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('page_maintenance_admin')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'page_maintenance_settings',
        },
        () => {
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSettings]);

  // Update countdown timers
  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeRemaining: Record<string, { hours: number; minutes: number; seconds: number }> = {};
      const expiredPages: string[] = [];
      
      settings.forEach(setting => {
        if (setting.is_enabled && setting.scheduled_end_at) {
          const endTime = new Date(setting.scheduled_end_at);
          const now = new Date();
          const diff = endTime.getTime() - now.getTime();

          if (diff > 0) {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            newTimeRemaining[setting.page_key] = { hours, minutes, seconds };
          } else {
            expiredPages.push(setting.page_key);
          }
        }
      });
      
      setTimeRemaining(newTimeRemaining);
      
      // Auto-disable expired maintenance pages (outside of render cycle)
      expiredPages.forEach(async (pageKey) => {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase
          .from('page_maintenance_settings')
          .update({
            is_enabled: false,
            enabled_at: null,
            scheduled_end_at: null,
            updated_by: user?.id,
            updated_at: new Date().toISOString(),
          })
          .eq('page_key', pageKey);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [settings]);

  const handleToggle = async (pageKey: string, enable: boolean) => {
    console.log('Toggle maintenance:', pageKey, enable);
    setSaving(pageKey);
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        toast({
          title: "Authentication Error",
          description: "Please make sure you are logged in.",
          variant: "destructive",
        });
        setSaving(null);
        return;
      }
      
      const cooldownMinutes = cooldownInputs[pageKey] || 30;
      
      const updateData: Record<string, any> = {
        is_enabled: enable,
        updated_by: user?.id || null,
        updated_at: new Date().toISOString(),
      };

      if (enable) {
        updateData.enabled_at = new Date().toISOString();
        updateData.cooldown_minutes = cooldownMinutes;
        updateData.scheduled_end_at = new Date(Date.now() + cooldownMinutes * 60 * 1000).toISOString();
      } else {
        updateData.enabled_at = null;
        updateData.scheduled_end_at = null;
      }

      console.log('Update data:', updateData);

      const { data, error } = await supabase
        .from('page_maintenance_settings')
        .update(updateData)
        .eq('page_key', pageKey)
        .select();

      console.log('Update result:', { data, error });

      if (error) {
        console.error('Error updating page maintenance:', error);
        toast({
          title: "Error",
          description: `Failed to update page maintenance: ${error.message}`,
          variant: "destructive",
        });
        setSaving(null);
        return;
      }

      const pageName = settings.find(s => s.page_key === pageKey)?.page_name || pageKey;
      
      await logAction({
        actionType: enable ? 'page_maintenance_enabled' : 'page_maintenance_disabled',
        actionDescription: `${enable ? 'Enabled' : 'Disabled'} maintenance mode for "${pageName}" page${enable ? ` for ${cooldownMinutes} minutes` : ''}`,
        targetTable: 'page_maintenance_settings',
        oldValue: { page_key: pageKey, is_enabled: !enable },
        newValue: { page_key: pageKey, is_enabled: enable, cooldown_minutes: cooldownMinutes }
      });

      toast({
        title: enable ? "Page Maintenance Enabled" : "Page Maintenance Disabled",
        description: `${pageName} page is now ${enable ? 'under maintenance' : 'accessible to all users'}${enable ? ` for ${cooldownMinutes} minutes` : ''}.`,
      });

      // Immediately update local state for faster UI feedback
      setSettings(prev => prev.map(s => 
        s.page_key === pageKey 
          ? { ...s, is_enabled: enable, scheduled_end_at: enable ? updateData.scheduled_end_at : null, enabled_at: enable ? updateData.enabled_at : null }
          : s
      ));
    } catch (err) {
      console.error('Unexpected error in handleToggle:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const handleCooldownChange = (pageKey: string, value: number) => {
    setCooldownInputs(prev => ({ ...prev, [pageKey]: value }));
  };

  const extendMaintenance = async (pageKey: string, extraMinutes: number) => {
    setSaving(pageKey);
    const { data: { user } } = await supabase.auth.getUser();
    const setting = settings.find(s => s.page_key === pageKey);
    
    if (!setting?.scheduled_end_at) {
      setSaving(null);
      return;
    }

    const currentEnd = new Date(setting.scheduled_end_at);
    const newEnd = new Date(currentEnd.getTime() + extraMinutes * 60 * 1000);

    const { error } = await supabase
      .from('page_maintenance_settings')
      .update({
        scheduled_end_at: newEnd.toISOString(),
        cooldown_minutes: (setting.cooldown_minutes || 0) + extraMinutes,
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq('page_key', pageKey);

    if (error) {
      console.error('Error extending maintenance:', error);
      toast({
        title: "Error",
        description: "Failed to extend maintenance time.",
        variant: "destructive",
      });
      setSaving(null);
      return;
    }

    await logAction({
      actionType: 'page_maintenance_extended',
      actionDescription: `Extended maintenance for "${setting.page_name}" by ${extraMinutes} minutes`,
      targetTable: 'page_maintenance_settings',
      newValue: { page_key: pageKey, extended_by_minutes: extraMinutes }
    });

    toast({
      title: "Maintenance Extended",
      description: `Maintenance for ${setting.page_name} extended by ${extraMinutes} minutes.`,
    });

    setSaving(null);
    fetchSettings();
  };

  const formatTime = (remaining: { hours: number; minutes: number; seconds: number }) => {
    const parts = [];
    if (remaining.hours > 0) parts.push(`${remaining.hours}h`);
    if (remaining.minutes > 0 || remaining.hours > 0) parts.push(`${remaining.minutes}m`);
    parts.push(`${remaining.seconds}s`);
    return parts.join(' ');
  };

  const enabledCount = settings.filter(s => s.is_enabled).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="glass-effect border-border/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Page Maintenance Controls</CardTitle>
          </div>
          <Badge variant={enabledCount > 0 ? "destructive" : "secondary"}>
            {enabledCount} page{enabledCount !== 1 ? 's' : ''} under maintenance
          </Badge>
        </div>
        <CardDescription>
          Enable maintenance mode for individual pages. Staff and owners can still access pages under maintenance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {settings.map((setting) => {
              const remaining = timeRemaining[setting.page_key];
              const isActive = setting.is_enabled && remaining;

              return (
                <div
                  key={setting.id}
                  className={`p-4 rounded-lg border transition-all ${
                    setting.is_enabled 
                      ? 'bg-destructive/10 border-destructive/30' 
                      : 'bg-muted/30 border-border/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {setting.is_enabled ? (
                          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        )}
                        <span className="font-medium truncate">{setting.page_name}</span>
                        <Badge variant="outline" className="text-xs">
                          /{setting.page_key}
                        </Badge>
                      </div>
                      
                      {isActive && remaining && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-destructive">
                          <Timer className="w-3 h-3" />
                          <span>Ends in: {formatTime(remaining)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {!setting.is_enabled && (
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground whitespace-nowrap">Duration:</Label>
                          <Input
                            type="number"
                            min={1}
                            max={1440}
                            value={cooldownInputs[setting.page_key] || 30}
                            onChange={(e) => handleCooldownChange(setting.page_key, parseInt(e.target.value) || 30)}
                            className="w-20 h-8 text-sm"
                          />
                          <span className="text-xs text-muted-foreground">min</span>
                        </div>
                      )}

                      {setting.is_enabled && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => extendMaintenance(setting.page_key, 15)}
                            disabled={saving === setting.page_key}
                            className="h-8 px-2 text-xs"
                          >
                            +15m
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => extendMaintenance(setting.page_key, 30)}
                            disabled={saving === setting.page_key}
                            className="h-8 px-2 text-xs"
                          >
                            +30m
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => extendMaintenance(setting.page_key, 60)}
                            disabled={saving === setting.page_key}
                            className="h-8 px-2 text-xs"
                          >
                            +1h
                          </Button>
                        </div>
                      )}

                      <Switch
                        checked={setting.is_enabled}
                        onCheckedChange={(checked) => handleToggle(setting.page_key, checked)}
                        disabled={saving === setting.page_key}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
