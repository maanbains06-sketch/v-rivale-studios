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
import { Clock, Calendar, Save, Wrench, AlertTriangle, Plus, Power, RefreshCw, Timer } from 'lucide-react';
import { format, addHours, addMinutes, differenceInMinutes } from 'date-fns';

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
  
  // Form state
  const [title, setTitle] = useState('Scheduled Maintenance');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState({ hours: 2, minutes: 0 });
  const [scheduleInFuture, setScheduleInFuture] = useState(false);
  const [scheduledStart, setScheduledStart] = useState('');

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
    
    // Subscribe to realtime changes
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

  const startMaintenance = async () => {
    setSaving(true);
    try {
      const start = scheduleInFuture ? new Date(scheduledStart) : new Date();
      const end = addMinutes(addHours(start, duration.hours), duration.minutes);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      // First, check if there's an existing active/scheduled maintenance
      // NOTE: maybeSingle() throws if multiple rows match; limit(1) keeps it safe.
      const { data: existingMaintenance, error: existingError } = await supabase
        .from('maintenance_schedules')
        .select('id')
        .in('status', ['scheduled', 'active'])
        .limit(1)
        .maybeSingle();

      if (existingError) {
        console.error('Error checking existing maintenance:', existingError);
        throw existingError;
      }

      if (existingMaintenance) {
        toast({
          title: "Error",
          description: "There's already an active or scheduled maintenance. End it first.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      // Insert the maintenance schedule
      const { error: scheduleError } = await supabase
        .from('maintenance_schedules')
        .insert({
          title,
          description: description || null,
          scheduled_start: start.toISOString(),
          scheduled_end: end.toISOString(),
          status: scheduleInFuture ? 'scheduled' : 'active',
          created_by: user?.id || null
        });

      if (scheduleError) {
        console.error('Schedule error:', scheduleError);
        throw scheduleError;
      }

      // Only enable maintenance mode immediately if we're starting now.
      // If the owner schedules it in the future, do NOT block the site yet.
      if (!scheduleInFuture) {
        const { data: existingSetting } = await supabase
          .from('site_settings')
          .select('id')
          .eq('key', 'maintenance_mode')
          .maybeSingle();

        if (existingSetting) {
          const { error: updateError } = await supabase
            .from('site_settings')
            .update({ value: 'true', updated_at: new Date().toISOString() })
            .eq('key', 'maintenance_mode');

          if (updateError) {
            console.error('Update setting error:', updateError);
            throw updateError;
          }
        } else {
          const { error: insertError } = await supabase
            .from('site_settings')
            .insert({
              key: 'maintenance_mode',
              value: 'true',
              description: 'Enable maintenance mode to block non-staff access'
            });

          if (insertError) {
            console.error('Insert setting error:', insertError);
            throw insertError;
          }
        }
      }

      await logAction({
        actionType: 'maintenance_start',
        actionDescription: `Started maintenance: ${title}`,
        newValue: { title, duration, scheduledStart: start.toISOString(), scheduledEnd: end.toISOString() }
      });

      toast({
        title: "Maintenance Started",
        description: `Maintenance will ${scheduleInFuture ? 'start at ' + format(start, 'PPp') : 'start now'} and end at ${format(end, 'PPp')}`,
      });

      fetchActiveMaintenance();
    } catch (error: any) {
      console.error('Maintenance start error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start maintenance",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const endMaintenance = async () => {
    if (!activeMaintenance) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('maintenance_schedules')
        .update({ 
          status: 'completed',
          scheduled_end: new Date().toISOString()
        })
        .eq('id', activeMaintenance.id);

      if (error) throw error;

      // Disable maintenance mode
      await supabase
        .from('site_settings')
        .update({ value: 'false', updated_at: new Date().toISOString() })
        .eq('key', 'maintenance_mode');

      await logAction({
        actionType: 'maintenance_end',
        actionDescription: `Ended maintenance: ${activeMaintenance.title}`,
      });

      toast({
        title: "Maintenance Ended",
        description: "Site is now back online",
      });

      setActiveMaintenance(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to end maintenance",
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
      const newEnd = addMinutes(currentEnd, extraMinutes);
      
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
        description: `New end time: ${format(newEnd, 'PPp')}`,
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

  const getTimeRemaining = useCallback(() => {
    if (!activeMaintenance) return null;
    const end = new Date(activeMaintenance.scheduled_end);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, expired: true };
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { hours, minutes, seconds, expired: false };
  }, [activeMaintenance]);

  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining());

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = getTimeRemaining();
      setTimeRemaining(remaining);
      
      // Auto-end maintenance if countdown expired
      if (remaining?.expired && activeMaintenance) {
        endMaintenance();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeMaintenance, getTimeRemaining]);

  // Quick duration presets
  const quickDurations = [
    { label: '30m', hours: 0, minutes: 30 },
    { label: '1h', hours: 1, minutes: 0 },
    { label: '2h', hours: 2, minutes: 0 },
    { label: '4h', hours: 4, minutes: 0 },
  ];

  if (loading) {
    return (
      <Card className="glass-effect border-border/20">
        <CardContent className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect border-border/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Maintenance Mode Control</CardTitle>
          </div>
          {activeMaintenance && (
            <Badge variant="destructive" className="animate-pulse">
              <Power className="w-3 h-3 mr-1" />
              ACTIVE
            </Badge>
          )}
        </div>
        <CardDescription>Schedule and control site maintenance with live countdown</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {activeMaintenance ? (
          // Active Maintenance Display
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center gap-2 text-amber-400 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-semibold">Maintenance Active</span>
              </div>
              <h3 className="text-lg font-semibold mb-1">{activeMaintenance.title}</h3>
              {activeMaintenance.description && (
                <p className="text-sm text-muted-foreground mb-3">{activeMaintenance.description}</p>
              )}
              
              {/* Countdown Display */}
              {timeRemaining && !timeRemaining.expired && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="p-3 rounded-lg bg-background/50 text-center">
                    <div className="text-2xl font-mono font-bold text-primary">
                      {String(timeRemaining.hours).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-muted-foreground">Hours</div>
                  </div>
                  <div className="p-3 rounded-lg bg-background/50 text-center">
                    <div className="text-2xl font-mono font-bold text-primary">
                      {String(timeRemaining.minutes).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-muted-foreground">Minutes</div>
                  </div>
                  <div className="p-3 rounded-lg bg-background/50 text-center">
                    <div className="text-2xl font-mono font-bold text-primary">
                      {String(timeRemaining.seconds).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-muted-foreground">Seconds</div>
                  </div>
                </div>
              )}

              {timeRemaining?.expired && (
                <div className="p-3 rounded-lg bg-green-500/20 border border-green-500/30 text-center mb-4">
                  <p className="text-green-400 font-medium">Countdown completed - ending maintenance...</p>
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm mb-4">
                <span className="text-muted-foreground">
                  Started: {format(new Date(activeMaintenance.scheduled_start), 'PPp')}
                </span>
                <span className="text-muted-foreground">
                  Ends: {format(new Date(activeMaintenance.scheduled_end), 'PPp')}
                </span>
              </div>

              {/* Extend Time Buttons */}
              <div className="space-y-2 mb-4">
                <Label className="text-xs text-muted-foreground">Extend Maintenance</Label>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => extendMaintenance(15)}
                    disabled={saving}
                    className="text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" /> 15m
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => extendMaintenance(30)}
                    disabled={saving}
                    className="text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" /> 30m
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => extendMaintenance(60)}
                    disabled={saving}
                    className="text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" /> 1h
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => extendMaintenance(120)}
                    disabled={saving}
                    className="text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" /> 2h
                  </Button>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={endMaintenance} 
              disabled={saving}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Power className="w-4 h-4 mr-2" />
                  End Maintenance Now
                </>
              )}
            </Button>
          </div>
        ) : (
          // Schedule New Maintenance Form
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Maintenance Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Server Update, Database Migration"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the maintenance"
              />
            </div>
            
            {/* Quick Duration Presets */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Quick Duration</Label>
              <div className="flex gap-2 flex-wrap">
                {quickDurations.map((preset) => (
                  <Button
                    key={preset.label}
                    type="button"
                    size="sm"
                    variant={duration.hours === preset.hours && duration.minutes === preset.minutes ? "default" : "outline"}
                    onClick={() => setDuration({ hours: preset.hours, minutes: preset.minutes })}
                    className="text-xs"
                  >
                    <Timer className="w-3 h-3 mr-1" />
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration (Hours)</Label>
                <Input
                  type="number"
                  min={0}
                  max={48}
                  value={duration.hours}
                  onChange={(e) => setDuration(prev => ({ ...prev, hours: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Duration (Minutes)</Label>
                <Input
                  type="number"
                  min={0}
                  max={59}
                  value={duration.minutes}
                  onChange={(e) => setDuration(prev => ({ ...prev, minutes: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="space-y-0.5">
                <Label className="text-base">Schedule for Later</Label>
                <p className="text-sm text-muted-foreground">Set a future start time</p>
              </div>
              <Switch 
                checked={scheduleInFuture}
                onCheckedChange={setScheduleInFuture}
              />
            </div>
            
            {scheduleInFuture && (
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="datetime-local"
                  value={scheduledStart}
                  onChange={(e) => setScheduledStart(e.target.value)}
                  min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                />
              </div>
            )}
            
            <Button 
              onClick={startMaintenance} 
              disabled={saving || (scheduleInFuture && !scheduledStart) || (duration.hours === 0 && duration.minutes === 0)}
              className="w-full"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  {scheduleInFuture ? 'Schedule Maintenance' : 'Start Maintenance Now'}
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
