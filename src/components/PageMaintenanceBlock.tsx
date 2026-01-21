import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useMaintenanceAccess } from '@/hooks/useMaintenanceAccess';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Clock, Home, ArrowLeft, Lock } from 'lucide-react';
import Navigation from '@/components/Navigation';

interface PageMaintenanceBlockProps {
  pageKey: string;
  children: React.ReactNode;
}

interface PageMaintenanceSetting {
  id: string;
  page_key: string;
  page_name: string;
  is_enabled: boolean;
  maintenance_message: string | null;
  cooldown_minutes: number;
  enabled_at: string | null;
  scheduled_end_at: string | null;
}

export const PageMaintenanceBlock = ({ pageKey, children }: PageMaintenanceBlockProps) => {
  const navigate = useNavigate();
  const { hasAccess, isStaffOrOwner, loading: accessLoading } = useMaintenanceAccess();
  const [setting, setSetting] = useState<PageMaintenanceSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const fetchSetting = async () => {
      const { data, error } = await supabase
        .from('page_maintenance_settings')
        .select('*')
        .eq('page_key', pageKey)
        .maybeSingle();

      if (error) {
        console.error('Error fetching page maintenance setting:', error);
      }

      setSetting(data as PageMaintenanceSetting | null);
      setLoading(false);
    };

    fetchSetting();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`page_maintenance_${pageKey}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'page_maintenance_settings',
          filter: `page_key=eq.${pageKey}`,
        },
        () => {
          fetchSetting();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pageKey]);

  // Update countdown timer
  useEffect(() => {
    if (!setting?.is_enabled || !setting?.scheduled_end_at) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const endTime = new Date(setting.scheduled_end_at!);
      const now = new Date();
      const diff = endTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining(null);
        // Refetch to check if maintenance was auto-disabled
        supabase
          .from('page_maintenance_settings')
          .select('*')
          .eq('page_key', pageKey)
          .maybeSingle()
          .then(({ data }) => setSetting(data as PageMaintenanceSetting | null));
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeRemaining({ hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [setting, pageKey]);

  // Show loading while checking access
  if (loading || accessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Staff and owners can always access
  if (hasAccess && isStaffOrOwner) {
    return <>{children}</>;
  }

  // Check if page is under maintenance
  const isUnderMaintenance = setting?.is_enabled && (
    !setting.scheduled_end_at || new Date(setting.scheduled_end_at) > new Date()
  );

  if (!isUnderMaintenance) {
    return <>{children}</>;
  }

  // Show maintenance page
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[80vh]">
        <Card className="glass-effect border-destructive/30 max-w-lg w-full">
          <CardContent className="pt-8 pb-8">
            <div className="text-center space-y-6">
              {/* Icon */}
              <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                <Lock className="w-10 h-10 text-destructive" />
              </div>

              {/* Title */}
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Page Under Maintenance
                </h1>
                <p className="text-muted-foreground">
                  {setting?.maintenance_message || `The ${setting?.page_name || 'requested'} page is currently unavailable.`}
                </p>
              </div>

              {/* Countdown */}
              {timeRemaining && (
                <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-3">
                    <Clock className="w-4 h-4" />
                    <span>Estimated time remaining</span>
                  </div>
                  <div className="flex justify-center gap-4">
                    {timeRemaining.hours > 0 && (
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary">{timeRemaining.hours}</div>
                        <div className="text-xs text-muted-foreground">Hours</div>
                      </div>
                    )}
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">{timeRemaining.minutes}</div>
                      <div className="text-xs text-muted-foreground">Minutes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">{timeRemaining.seconds}</div>
                      <div className="text-xs text-muted-foreground">Seconds</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Warning */}
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span>Staff members can still access this page</span>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Go Back
                </Button>
                <Button
                  onClick={() => navigate('/')}
                  className="gap-2"
                >
                  <Home className="w-4 h-4" />
                  Return Home
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
