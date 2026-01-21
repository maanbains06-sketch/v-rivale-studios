import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useOwnerAuditLog } from '@/hooks/useOwnerAuditLog';
import { Clock, Wrench, AlertTriangle, Plus, Power, RefreshCw, Timer } from 'lucide-react';

interface MaintenanceState {
  isEnabled: boolean;
  scheduledEnd: string | null;
}

export const MaintenanceCountdownControl = () => {
  const { toast } = useToast();
  const { logAction } = useOwnerAuditLog();
  const [maintenanceState, setMaintenanceState] = useState<MaintenanceState>({
    isEnabled: false,
    scheduledEnd: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Duration state with days, hours, minutes
  const [duration, setDuration] = useState({ days: 0, hours: 2, minutes: 0 });
  const [timeRemaining, setTimeRemaining] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  
  // Ref to track if we're currently auto-disabling to prevent loops
  const isAutoDisablingRef = useRef(false);

  const fetchMaintenanceState = useCallback(async () => {
    try {
      // Fetch from site_settings for maintenance_mode and scheduled_end
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['maintenance_mode', 'maintenance_scheduled_end']);

      if (error) throw error;

      const settingsMap: Record<string, string> = {};
      (data || []).forEach((s) => {
        settingsMap[s.key] = s.value;
      });

      setMaintenanceState({
        isEnabled: settingsMap.maintenance_mode === 'true',
        scheduledEnd: settingsMap.maintenance_scheduled_end || null,
      });
    } catch (error) {
      console.error('Error fetching maintenance state:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaintenanceState();
    
    const channel = supabase
      .channel('maintenance_control_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, (payload) => {
        // Only refetch if maintenance-related settings changed
        const record = payload.new as { key?: string } | undefined;
        if (record?.key === 'maintenance_mode' || record?.key === 'maintenance_scheduled_end') {
          fetchMaintenanceState();
        }
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMaintenanceState]);

  // Calculate time remaining
  const calculateTimeRemaining = useCallback(() => {
    if (!maintenanceState.scheduledEnd) return null;
    
    const end = new Date(maintenanceState.scheduledEnd);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return null; // Expired
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { days, hours, minutes, seconds };
  }, [maintenanceState.scheduledEnd]);

  // Timer effect - updates countdown and auto-disables when expired
  useEffect(() => {
    const interval = setInterval(async () => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);
      
      // If maintenance is enabled but timer expired, auto-disable
      if (maintenanceState.isEnabled && maintenanceState.scheduledEnd && !remaining && !isAutoDisablingRef.current) {
        isAutoDisablingRef.current = true;
        
        try {
          const { data: { user } } = await supabase.auth.getUser();
          
          // Update both settings
          await supabase
            .from('site_settings')
            .upsert([
              { key: 'maintenance_mode', value: 'false', updated_by: user?.id, updated_at: new Date().toISOString() },
              { key: 'maintenance_scheduled_end', value: '', updated_by: user?.id, updated_at: new Date().toISOString() },
            ], { onConflict: 'key' });
          
          console.log('Auto-disabled maintenance after timer expired');
        } catch (error) {
          console.error('Error auto-disabling maintenance:', error);
        } finally {
          isAutoDisablingRef.current = false;
        }
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [maintenanceState.isEnabled, maintenanceState.scheduledEnd, calculateTimeRemaining]);

  const handleToggle = async (enable: boolean) => {
    setSaving(true);
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        toast({
          title: "Authentication Error",
          description: "Please make sure you are logged in.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      if (enable) {
        const totalMinutes = (duration.days * 24 * 60) + (duration.hours * 60) + duration.minutes;
        
        if (totalMinutes <= 0) {
          toast({
            title: "Error",
            description: "Please set a duration greater than 0.",
            variant: "destructive",
          });
          setSaving(false);
          return;
        }

        const scheduledEnd = new Date(Date.now() + totalMinutes * 60 * 1000).toISOString();

        // Update site_settings
        const { error: settingsError } = await supabase
          .from('site_settings')
          .upsert([
            { key: 'maintenance_mode', value: 'true', updated_by: user?.id, updated_at: new Date().toISOString(), description: 'Enable maintenance mode to block site access' },
            { key: 'maintenance_scheduled_end', value: scheduledEnd, updated_by: user?.id, updated_at: new Date().toISOString(), description: 'Scheduled end time for maintenance mode' },
          ], { onConflict: 'key' });

        if (settingsError) {
          console.error('Error enabling maintenance:', settingsError);
          throw settingsError;
        }

        // Optimistic update
        setMaintenanceState({
          isEnabled: true,
          scheduledEnd: scheduledEnd,
        });

        await logAction({
          actionType: 'maintenance_start',
          actionDescription: `Started site maintenance for ${duration.days}d ${duration.hours}h ${duration.minutes}m`,
          newValue: { duration, scheduledEnd }
        });

        toast({
          title: "Maintenance Enabled",
          description: `Site is now under maintenance for ${duration.days}d ${duration.hours}h ${duration.minutes}m`,
        });
      } else {
        // Disable maintenance
        const { error: settingsError } = await supabase
          .from('site_settings')
          .upsert([
            { key: 'maintenance_mode', value: 'false', updated_by: user?.id, updated_at: new Date().toISOString(), description: 'Enable maintenance mode to block site access' },
            { key: 'maintenance_scheduled_end', value: '', updated_by: user?.id, updated_at: new Date().toISOString(), description: 'Scheduled end time for maintenance mode' },
          ], { onConflict: 'key' });

        if (settingsError) {
          console.error('Error disabling maintenance:', settingsError);
          throw settingsError;
        }

        // Optimistic update
        setMaintenanceState({
          isEnabled: false,
          scheduledEnd: null,
        });

        await logAction({
          actionType: 'maintenance_end',
          actionDescription: 'Ended site maintenance',
        });

        toast({
          title: "Maintenance Disabled",
          description: "Site is now back online",
        });
      }
    } catch (error: any) {
      console.error('Maintenance toggle error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to toggle maintenance",
        variant: "destructive",
      });
      // Refetch to get correct state
      fetchMaintenanceState();
    } finally {
      setSaving(false);
    }
  };

  const extendMaintenance = async (extraMinutes: number) => {
    if (!maintenanceState.scheduledEnd) return;
    
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const currentEnd = new Date(maintenanceState.scheduledEnd);
      const newEnd = new Date(currentEnd.getTime() + extraMinutes * 60 * 1000);
      
      const { error } = await supabase
        .from('site_settings')
        .upsert([
          { key: 'maintenance_scheduled_end', value: newEnd.toISOString(), updated_by: user?.id, updated_at: new Date().toISOString(), description: 'Scheduled end time for maintenance mode' },
        ], { onConflict: 'key' });

      if (error) throw error;

      // Optimistic update
      setMaintenanceState(prev => ({
        ...prev,
        scheduledEnd: newEnd.toISOString(),
      }));

      const extendText = extraMinutes >= 1440 
        ? `${Math.floor(extraMinutes / 1440)}d` 
        : extraMinutes >= 60 
          ? `${Math.floor(extraMinutes / 60)}h` 
          : `${extraMinutes}m`;

      await logAction({
        actionType: 'maintenance_extend',
        actionDescription: `Extended maintenance by ${extendText}`,
        newValue: { newEndTime: newEnd.toISOString() }
      });

      toast({
        title: "Maintenance Extended",
        description: `Extended by ${extendText}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to extend maintenance",
        variant: "destructive",
      });
      fetchMaintenanceState();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="glass-effect border-border/20">
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const isActive = maintenanceState.isEnabled;

  return (
    <Card className="glass-effect border-border/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Maintenance Mode Control</CardTitle>
          </div>
          {isActive && (
            <Badge variant="destructive" className="animate-pulse">
              <Power className="w-3 h-3 mr-1" />
              ACTIVE
            </Badge>
          )}
        </div>
        <CardDescription>Toggle site-wide maintenance mode with countdown timer</CardDescription>
      </CardHeader>
      <CardContent>
        <div className={`p-4 rounded-lg border transition-all ${
          isActive 
            ? 'bg-destructive/10 border-destructive/30' 
            : 'bg-muted/30 border-border/50'
        }`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {isActive ? (
                  <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className="font-medium">Site-Wide Maintenance</span>
              </div>
              
              {isActive && timeRemaining && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 text-sm text-destructive mb-3">
                    <Timer className="w-3 h-3" />
                    <span>Ends in: {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m {timeRemaining.seconds}s</span>
                  </div>
                  
                  {/* Countdown Display */}
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-background/50 text-center">
                      <div className="text-xl font-mono font-bold text-primary">
                        {String(timeRemaining.days).padStart(2, '0')}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Days</div>
                    </div>
                    <div className="p-2 rounded-lg bg-background/50 text-center">
                      <div className="text-xl font-mono font-bold text-primary">
                        {String(timeRemaining.hours).padStart(2, '0')}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Hours</div>
                    </div>
                    <div className="p-2 rounded-lg bg-background/50 text-center">
                      <div className="text-xl font-mono font-bold text-primary">
                        {String(timeRemaining.minutes).padStart(2, '0')}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Minutes</div>
                    </div>
                    <div className="p-2 rounded-lg bg-background/50 text-center">
                      <div className="text-xl font-mono font-bold text-primary">
                        {String(timeRemaining.seconds).padStart(2, '0')}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Seconds</div>
                    </div>
                  </div>

                  {/* Extend Buttons */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-xs text-muted-foreground mr-2">Extend:</span>
                    <Button variant="outline" size="sm" onClick={() => extendMaintenance(30)} disabled={saving} className="h-7 px-2 text-xs">
                      <Plus className="w-3 h-3 mr-1" />30m
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => extendMaintenance(60)} disabled={saving} className="h-7 px-2 text-xs">
                      <Plus className="w-3 h-3 mr-1" />1h
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => extendMaintenance(180)} disabled={saving} className="h-7 px-2 text-xs">
                      <Plus className="w-3 h-3 mr-1" />3h
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => extendMaintenance(1440)} disabled={saving} className="h-7 px-2 text-xs">
                      <Plus className="w-3 h-3 mr-1" />1d
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {!isActive && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      max={30}
                      value={duration.days}
                      onChange={(e) => setDuration(prev => ({ ...prev, days: parseInt(e.target.value) || 0 }))}
                      className="w-14 h-8 text-sm text-center"
                    />
                    <span className="text-xs text-muted-foreground">d</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      max={23}
                      value={duration.hours}
                      onChange={(e) => setDuration(prev => ({ ...prev, hours: parseInt(e.target.value) || 0 }))}
                      className="w-14 h-8 text-sm text-center"
                    />
                    <span className="text-xs text-muted-foreground">h</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      max={59}
                      value={duration.minutes}
                      onChange={(e) => setDuration(prev => ({ ...prev, minutes: parseInt(e.target.value) || 0 }))}
                      className="w-14 h-8 text-sm text-center"
                    />
                    <span className="text-xs text-muted-foreground">m</span>
                  </div>
                </div>
              )}

              <Switch
                checked={isActive}
                onCheckedChange={handleToggle}
                disabled={saving}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MaintenanceCountdownControl;