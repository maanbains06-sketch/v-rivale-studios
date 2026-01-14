import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { X, Info, CheckCircle, AlertTriangle, XCircle, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Announcement {
  id: string;
  message: string;
  type: string;
  created_at: string;
  expires_at: string;
}

export const GlobalAnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Fetch active announcements
    const fetchAnnouncements = async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (!error && data) {
        setAnnouncements(data);
      }
    };

    fetchAnnouncements();

    // Subscribe to realtime announcements
    const channel = supabase
      .channel('announcements_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'announcements',
        },
        (payload) => {
          const newAnnouncement = payload.new as Announcement;
          setAnnouncements((prev) => [newAnnouncement, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'announcements',
        },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id;
          setAnnouncements((prev) => prev.filter((a) => a.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const dismissAnnouncement = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-500/90 border-green-400 text-white';
      case 'warning':
        return 'bg-yellow-500/90 border-yellow-400 text-black';
      case 'error':
        return 'bg-red-500/90 border-red-400 text-white';
      default:
        return 'bg-blue-500/90 border-blue-400 text-white';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 flex-shrink-0" />;
      case 'error':
        return <XCircle className="w-5 h-5 flex-shrink-0" />;
      default:
        return <Info className="w-5 h-5 flex-shrink-0" />;
    }
  };

  // Filter out dismissed and expired announcements
  const visibleAnnouncements = announcements.filter(
    (a) => !dismissedIds.has(a.id) && new Date(a.expires_at) > new Date()
  );

  if (visibleAnnouncements.length === 0) return null;

  return (
    <div className="w-full z-50">
      <AnimatePresence>
        {visibleAnnouncements.map((announcement) => (
          <motion.div
            key={announcement.id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              'border-b shadow-lg',
              getTypeStyles(announcement.type)
            )}
          >
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-center gap-3">
                <Bell className="w-4 h-4 animate-pulse" />
                {getTypeIcon(announcement.type)}
                <p className="text-sm font-medium text-center flex-1">
                  {announcement.message}
                </p>
                <button
                  onClick={() => dismissAnnouncement(announcement.id)}
                  className="p-1 rounded-full hover:bg-white/20 transition-colors"
                  aria-label="Dismiss announcement"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default GlobalAnnouncementBanner;
