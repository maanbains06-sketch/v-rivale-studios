import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DiscordNameCache {
  [discordId: string]: {
    displayName: string;
    username: string;
    avatar: string | null;
    loading: boolean;
    error?: boolean;
  };
}

export const useDiscordNames = (discordIds: string[]) => {
  const [nameCache, setNameCache] = useState<DiscordNameCache>({});
  const [loading, setLoading] = useState(false);
  const fetchedIdsRef = useRef<Set<string>>(new Set());

  const fetchDiscordName = useCallback(async (discordId: string) => {
    if (!discordId || !/^\d{17,19}$/.test(discordId)) {
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('fetch-discord-user', {
        body: { discordId }
      });

      if (error) {
        console.error(`[useDiscordNames] Error fetching Discord user ${discordId}:`, error);
        return null;
      }

      // Handle both direct response format and nested user format
      const userData = data?.user || data;
      
      if (!userData) {
        console.warn(`[useDiscordNames] No user data returned for ${discordId}`);
        return null;
      }

      return {
        displayName: userData.displayName || userData.globalName || userData.global_name || userData.username || null,
        username: userData.username || null,
        avatar: userData.avatar || null,
      };
    } catch (error) {
      console.error(`[useDiscordNames] Exception fetching Discord user ${discordId}:`, error);
      return null;
    }
  }, []);

  useEffect(() => {
    const uniqueIds = [...new Set(discordIds.filter(id => id && /^\d{17,19}$/.test(id)))];
    
    // Filter out IDs we've already fetched (including failed ones)
    const idsToFetch = uniqueIds.filter(id => !fetchedIdsRef.current.has(id));
    
    if (idsToFetch.length === 0) return;

    setLoading(true);

    // Mark all as loading first
    setNameCache(prev => {
      const updated = { ...prev };
      idsToFetch.forEach(id => {
        if (!updated[id]) {
          updated[id] = { displayName: '', username: '', avatar: null, loading: true };
        }
      });
      return updated;
    });

    // Track that we're fetching these IDs
    idsToFetch.forEach(id => fetchedIdsRef.current.add(id));

    // Fetch in batches of 3 to avoid rate limiting
    const batchSize = 3;
    const batches: string[][] = [];
    for (let i = 0; i < idsToFetch.length; i += batchSize) {
      batches.push(idsToFetch.slice(i, i + batchSize));
    }

    const fetchBatches = async () => {
      for (const batch of batches) {
        const results = await Promise.all(
          batch.map(async (discordId) => {
            const result = await fetchDiscordName(discordId);
            return { discordId, result };
          })
        );

        setNameCache(prev => {
          const updated = { ...prev };
          results.forEach(({ discordId, result }) => {
            updated[discordId] = {
              displayName: result?.displayName || '',
              username: result?.username || '',
              avatar: result?.avatar || null,
              loading: false,
              error: !result,
            };
          });
          return updated;
        });

        // Delay between batches to avoid rate limiting
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      setLoading(false);
    };

    fetchBatches();
  }, [discordIds.join(','), fetchDiscordName]);

  const getDisplayName = useCallback((discordId: string | undefined): string | null => {
    if (!discordId) return null;
    const cached = nameCache[discordId];
    if (cached && !cached.loading && cached.displayName) {
      return cached.displayName;
    }
    return null;
  }, [nameCache]);

  const getAvatar = useCallback((discordId: string | undefined): string | null => {
    if (!discordId) return null;
    const cached = nameCache[discordId];
    if (cached && !cached.loading) {
      return cached.avatar;
    }
    return null;
  }, [nameCache]);

  const isLoading = useCallback((discordId: string | undefined): boolean => {
    if (!discordId) return false;
    const cached = nameCache[discordId];
    return cached?.loading ?? false;
  }, [nameCache]);

  const refetch = useCallback(() => {
    fetchedIdsRef.current.clear();
    setNameCache({});
  }, []);

  return { 
    nameCache, 
    loading, 
    getDisplayName, 
    getAvatar,
    isLoading,
    refetch
  };
};
