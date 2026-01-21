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
  AlertTriangle,
  CheckCircle,
  Timer,
  RefreshCw,
  Plus
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

interface DurationInput {
  days: number;
  hours: number;
  minutes: number;
}

export const PageMaintenanceControls = () => {
  const { toast } = useToast();
  const { logAction } = useOwnerAuditLog();
  const [settings, setSettings] = useState<PageMaintenanceSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [durationInputs, setDurationInputs] = useState<Record<string, DurationInput>>({});
  const [timeRemaining, setTimeRemaining] = useState<Record<string, { days: number; hours: number; minutes: number; seconds: number }>>({});

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
      
      // Initialize duration inputs
      const durations: Record<string, DurationInput> = {};
      (data || []).forEach((s: PageMaintenanceSetting) => {
        const totalMinutes = s.cooldown_minutes || 30;
        const days = Math.floor(totalMinutes / (24 * 60));
        const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
        const minutes = totalMinutes % 60;
        durations[s.page_key] = { days, hours, minutes };
      });
      setDurationInputs(durations);
    } catch (err) {
      console.error('Error in fetchSettings:', err);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();

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
      const newTimeRemaining: Record<string, { days: number; hours: number; minutes: number; seconds: number }> = {};
      const expiredPages: string[] = [];
      
      settings.forEach(setting => {
        if (setting.is_enabled && setting.scheduled_end_at) {
          const endTime = new Date(setting.scheduled_end_at);
          const now = new Date();
          const diff = endTime.getTime() - now.getTime();

          if (diff > 0) {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            newTimeRemaining[setting.page_key] = { days, hours, minutes, seconds };
          } else {
            expiredPages.push(setting.page_key);
          }
        }
      });
      
      setTimeRemaining(newTimeRemaining);
      
      // Auto-disable expired maintenance pages
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
      
      const duration = durationInputs[pageKey] || { days: 0, hours: 0, minutes: 30 };
      const totalMinutes = (duration.days * 24 * 60) + (duration.hours * 60) + duration.minutes;
      
      if (enable && totalMinutes <= 0) {
        toast({
          title: "Error",
          description: "Please set a duration greater than 0.",
          variant: "destructive",
        });
        setSaving(null);
        return;
      }
      
      const updateData: Record<string, any> = {
        is_enabled: enable,
        updated_by: user?.id || null,
        updated_at: new Date().toISOString(),
      };

      if (enable) {
        updateData.enabled_at = new Date().toISOString();
        updateData.cooldown_minutes = totalMinutes;
        updateData.scheduled_end_at = new Date(Date.now() + totalMinutes * 60 * 1000).toISOString();
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
      const durationText = `${duration.days}d ${duration.hours}h ${duration.minutes}m`;
      
      await logAction({
        actionType: enable ? 'page_maintenance_enabled' : 'page_maintenance_disabled',
        actionDescription: `${enable ? 'Enabled' : 'Disabled'} maintenance mode for "${pageName}" page${enable ? ` for ${durationText}` : ''}`,
        targetTable: 'page_maintenance_settings',
        oldValue: { page_key: pageKey, is_enabled: !enable },
        newValue: { page_key: pageKey, is_enabled: enable, cooldown_minutes: totalMinutes }
      });

      toast({
        title: enable ? "Page Maintenance Enabled" : "Page Maintenance Disabled",
        description: `${pageName} page is now ${enable ? 'under maintenance' : 'accessible to all users'}${enable ? ` for ${durationText}` : ''}.`,
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

  const handleDurationChange = (pageKey: string, field: keyof DurationInput, value: number) => {
    setDurationInputs(prev => ({
      ...prev,
      [pageKey]: {
        ...prev[pageKey] || { days: 0, hours: 0, minutes: 30 },
        [field]: value
      }
    }));
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

    const extendText = extraMinutes >= 1440 
      ? `${Math.floor(extraMinutes / 1440)}d` 
      : extraMinutes >= 60 
        ? `${Math.floor(extraMinutes / 60)}h` 
        : `${extraMinutes}m`;

    await logAction({
      actionType: 'page_maintenance_extended',
      actionDescription: `Extended maintenance for "${setting.page_name}" by ${extendText}`,
      targetTable: 'page_maintenance_settings',
      newValue: { page_key: pageKey, extended_by_minutes: extraMinutes }
    });

    toast({
      title: "Maintenance Extended",
      description: `Maintenance for ${setting.page_name} extended by ${extendText}.`,
    });

    setSaving(null);
    fetchSettings();
  };

  const formatTime = (remaining: { days: number; hours: number; minutes: number; seconds: number }) => {
    const parts = [];
    if (remaining.days > 0) parts.push(`${remaining.days}d`);
    if (remaining.hours > 0 || remaining.days > 0) parts.push(`${remaining.hours}h`);
    if (remaining.minutes > 0 || remaining.hours > 0 || remaining.days > 0) parts.push(`${remaining.minutes}m`);
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
              const duration = durationInputs[setting.page_key] || { days: 0, hours: 0, minutes: 30 };

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
                        <div className="mt-3">
                          <div className="flex items-center gap-2 text-sm text-destructive mb-2">
                            <Timer className="w-3 h-3" />
                            <span>Ends in: {formatTime(remaining)}</span>
                          </div>
                          
                          {/* Countdown Display */}
                          <div className="grid grid-cols-4 gap-1 mb-3">
                            <div className="p-1.5 rounded bg-background/50 text-center">
                              <div className="text-lg font-mono font-bold text-primary">
                                {String(remaining.days).padStart(2, '0')}
                              </div>
                              <div className="text-[9px] text-muted-foreground">Days</div>
                            </div>
                            <div className="p-1.5 rounded bg-background/50 text-center">
                              <div className="text-lg font-mono font-bold text-primary">
                                {String(remaining.hours).padStart(2, '0')}
                              </div>
                              <div className="text-[9px] text-muted-foreground">Hours</div>
                            </div>
                            <div className="p-1.5 rounded bg-background/50 text-center">
                              <div className="text-lg font-mono font-bold text-primary">
                                {String(remaining.minutes).padStart(2, '0')}
                              </div>
                              <div className="text-[9px] text-muted-foreground">Min</div>
                            </div>
                            <div className="p-1.5 rounded bg-background/50 text-center">
                              <div className="text-lg font-mono font-bold text-primary">
                                {String(remaining.seconds).padStart(2, '0')}
                              </div>
                              <div className="text-[9px] text-muted-foreground">Sec</div>
                            </div>
                          </div>

                          {/* Extend Buttons */}
                          <div className="flex items-center gap-1 flex-wrap">
                            <Button variant="outline" size="sm" onClick={() => extendMaintenance(setting.page_key, 30)} disabled={saving === setting.page_key} className="h-6 px-2 text-xs">
                              <Plus className="w-2 h-2 mr-1" />30m
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => extendMaintenance(setting.page_key, 60)} disabled={saving === setting.page_key} className="h-6 px-2 text-xs">
                              <Plus className="w-2 h-2 mr-1" />1h
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => extendMaintenance(setting.page_key, 180)} disabled={saving === setting.page_key} className="h-6 px-2 text-xs">
                              <Plus className="w-2 h-2 mr-1" />3h
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => extendMaintenance(setting.page_key, 1440)} disabled={saving === setting.page_key} className="h-6 px-2 text-xs">
                              <Plus className="w-2 h-2 mr-1" />1d
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {!setting.is_enabled && (
                        <div className="flex items-center gap-1">
                          <div className="flex items-center gap-0.5">
                            <Input
                              type="number"
                              min={0}
                              max={30}
                              value={duration.days}
                              onChange={(e) => handleDurationChange(setting.page_key, 'days', parseInt(e.target.value) || 0)}
                              className="w-12 h-7 text-xs text-center px-1"
                            />
                            <span className="text-[10px] text-muted-foreground">d</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <Input
                              type="number"
                              min={0}
                              max={23}
                              value={duration.hours}
                              onChange={(e) => handleDurationChange(setting.page_key, 'hours', parseInt(e.target.value) || 0)}
                              className="w-12 h-7 text-xs text-center px-1"
                            />
                            <span className="text-[10px] text-muted-foreground">h</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <Input
                              type="number"
                              min={0}
                              max={59}
                              value={duration.minutes}
                              onChange={(e) => handleDurationChange(setting.page_key, 'minutes', parseInt(e.target.value) || 0)}
                              className="w-12 h-7 text-xs text-center px-1"
                            />
                            <span className="text-[10px] text-muted-foreground">m</span>
                          </div>
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
