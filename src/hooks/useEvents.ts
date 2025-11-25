import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_date: string;
  end_date: string;
  status: string;
  location: string | null;
  max_participants: number | null;
  current_participants: number;
  banner_image: string | null;
  created_at: string;
}

interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  status: string;
  registered_at: string;
}

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .neq('status', 'cancelled')
        .order('start_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      console.error('Error loading events:', error);
      toast({
        title: 'Error',
        description: 'Failed to load events',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const registerForEvent = async (eventId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'Please sign in to register for events',
          variant: 'destructive',
        });
        return false;
      }

      const { error } = await supabase
        .from('event_participants')
        .insert({
          event_id: eventId,
          user_id: user.id,
          status: 'registered',
        });

      if (error) throw error;

      // Update participant count
      const event = events.find(e => e.id === eventId);
      if (event) {
        await supabase
          .from('events')
          .update({ current_participants: event.current_participants + 1 })
          .eq('id', eventId);
      }

      toast({
        title: 'Registration Successful',
        description: 'You have been registered for this event',
      });

      await loadEvents();
      return true;
    } catch (error: any) {
      console.error('Error registering for event:', error);
      toast({
        title: 'Registration Failed',
        description: error.message || 'Failed to register for event',
        variant: 'destructive',
      });
      return false;
    }
  };

  const cancelRegistration = async (eventId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('event_participants')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update participant count
      const event = events.find(e => e.id === eventId);
      if (event && event.current_participants > 0) {
        await supabase
          .from('events')
          .update({ current_participants: event.current_participants - 1 })
          .eq('id', eventId);
      }

      toast({
        title: 'Registration Cancelled',
        description: 'Your registration has been cancelled',
      });

      await loadEvents();
      return true;
    } catch (error: any) {
      console.error('Error cancelling registration:', error);
      toast({
        title: 'Cancellation Failed',
        description: error.message || 'Failed to cancel registration',
        variant: 'destructive',
      });
      return false;
    }
  };

  const checkUserRegistration = async (eventId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('event_participants')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking registration:', error);
      return false;
    }
  };

  const getRunningEvents = () => events.filter(e => e.status === 'running');
  const getUpcomingEvents = () => events.filter(e => e.status === 'upcoming');
  const getCompletedEvents = () => events.filter(e => e.status === 'completed');

  return {
    events,
    loading,
    registerForEvent,
    cancelRegistration,
    checkUserRegistration,
    getRunningEvents,
    getUpcomingEvents,
    getCompletedEvents,
    reloadEvents: loadEvents,
  };
};
