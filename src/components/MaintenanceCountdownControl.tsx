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
import { Clock, Wrench, AlertTriangle, Plus, Power, RefreshCw, Timer } from 'lucide-react';

interface MaintenanceSchedule {
  id: string;
  title: string;
  description: string | null;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
}

export const MaintenanceCountdownControl = () => {
  const { toast } = useToast();
  const { logAction } = useOwnerAuditLog();
  const [activeMaintenance, setActiveMaintenance] = useState<MaintenanceSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Duration state with days, hours, minutes
  const [duration, setDuration] = useState({ days: 0, hours: 2, minutes: 0 });
  const [timeRemaining, setTimeRemaining] = useState<{ days: number; hours: number; minutes: number; seconds: number; expired: boolean } | null>(null);

  const fetchActiveMaintenance = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_schedules')
        .select('*')
        .in('status', ['scheduled', 'active'])
        .order('scheduled_start', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setActiveMaintenance(data);
    } catch (error) {
      console.error('Error fetching maintenance:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveMaintenance();
    
    const channel = supabase
      .channel('maintenance_control_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_schedules' }, () => {
        fetchActiveMaintenance();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchActiveMaintenance]);

  const calculateTimeRemaining = useCallback(() => {
    if (!activeMaintenance) return null;
    const end = new Date(activeMaintenance.scheduled_end);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { days, hours, minutes, seconds, expired: false };
  }, [activeMaintenance]);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);
      
      if (remaining?.expired && activeMaintenance) {
        handleToggle(false);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeMaintenance, calculateTimeRemaining]);

  const handleToggle = async (enable: boolean) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (enable) {
        // Check for existing maintenance
        const { data: existingMaintenance } = await supabase
          .from('maintenance_schedules')
          .select('id')
          .in('status', ['scheduled', 'active'])
          .limit(1)
          .maybeSingle();

        if (existingMaintenance) {
          toast({
            title: "Error",
            description: "There's already an active maintenance. End it first.",
            variant: "destructive",
          });
          setSaving(false);
          return;
        }

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

        const start = new Date();
        const end = new Date(start.getTime() + totalMinutes * 60 * 1000);

        const { error: scheduleError } = await supabase
          .from('maintenance_schedules')
          .insert({
            title: 'Site Maintenance',
            description: null,
            scheduled_start: start.toISOString(),
            scheduled_end: end.toISOString(),
            status: 'active',
            created_by: user?.id || null
          });

        if (scheduleError) throw scheduleError;

        // Enable maintenance mode in site settings
        const { data: existingSetting } = await supabase
          .from('site_settings')
          .select('id')
          .eq('key', 'maintenance_mode')
          .maybeSingle();

        if (existingSetting) {
          await supabase
            .from('site_settings')
            .update({ value: 'true', updated_at: new Date().toISOString() })
            .eq('key', 'maintenance_mode');
        } else {
          await supabase
            .from('site_settings')
            .insert({
              key: 'maintenance_mode',
              value: 'true',
              description: 'Enable maintenance mode to block non-staff access'
            });
        }

        await logAction({
          actionType: 'maintenance_start',
          actionDescription: `Started site maintenance for ${duration.days}d ${duration.hours}h ${duration.minutes}m`,
          newValue: { duration, scheduledEnd: end.toISOString() }
        });

        toast({
          title: "Maintenance Enabled",
          description: `Site is now under maintenance for ${duration.days}d ${duration.hours}h ${duration.minutes}m`,
        });
      } else {
        // End maintenance
        if (activeMaintenance) {
          await supabase
            .from('maintenance_schedules')
            .update({ 
              status: 'completed',
              scheduled_end: new Date().toISOString()
            })
            .eq('id', activeMaintenance.id);
        }

        await supabase
          .from('site_settings')
          .update({ value: 'false', updated_at: new Date().toISOString() })
          .eq('key', 'maintenance_mode');

        await logAction({
          actionType: 'maintenance_end',
          actionDescription: 'Ended site maintenance',
        });

        toast({
          title: "Maintenance Disabled",
          description: "Site is now back online",
        });
      }

      fetchActiveMaintenance();
    } catch (error: any) {
      console.error('Maintenance toggle error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to toggle maintenance",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const extendMaintenance = async (extraMinutes: number) => {
    if (!activeMaintenance) return;
    
    setSaving(true);
    try {
      const currentEnd = new Date(activeMaintenance.scheduled_end);
      const newEnd = new Date(currentEnd.getTime() + extraMinutes * 60 * 1000);
      
      const { error } = await supabase
        .from('maintenance_schedules')
        .update({ 
          scheduled_end: newEnd.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', activeMaintenance.id);

      if (error) throw error;

      await logAction({
        actionType: 'maintenance_extend',
        actionDescription: `Extended maintenance by ${extraMinutes} minutes`,
        newValue: { newEndTime: newEnd.toISOString() }
      });

      toast({
        title: "Maintenance Extended",
        description: `Extended by ${extraMinutes >= 60 ? `${Math.floor(extraMinutes / 60)}h` : `${extraMinutes}m`}`,
      });

      fetchActiveMaintenance();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to extend maintenance",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatTimeRemaining = () => {
    if (!timeRemaining || timeRemaining.expired) return null;
    const parts = [];
    if (timeRemaining.days > 0) parts.push(`${timeRemaining.days}d`);
    if (timeRemaining.hours > 0 || timeRemaining.days > 0) parts.push(`${timeRemaining.hours}h`);
    if (timeRemaining.minutes > 0 || timeRemaining.hours > 0 || timeRemaining.days > 0) parts.push(`${timeRemaining.minutes}m`);
    parts.push(`${timeRemaining.seconds}s`);
    return parts.join(' ');
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

  const isActive = !!activeMaintenance;

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
              
              {isActive && timeRemaining && !timeRemaining.expired && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 text-sm text-destructive mb-3">
                    <Timer className="w-3 h-3" />
                    <span>Ends in: {formatTimeRemaining()}</span>
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
