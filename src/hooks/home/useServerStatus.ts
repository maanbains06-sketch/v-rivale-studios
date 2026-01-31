import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ServerStatus {
  status: "online" | "offline" | "maintenance";
  players: number;
  maxPlayers: number;
}

// Fetch server status with aggressive caching - ultra optimized to prevent lag
export const useServerStatus = () => {
  return useQuery<ServerStatus>({
    queryKey: ["server-status"],
    queryFn: async () => {
      // Check maintenance mode first
      const { data: maintenanceSetting } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "server_maintenance")
        .maybeSingle();

      if (maintenanceSetting?.value === "true") {
        return { status: "maintenance" as const, players: 0, maxPlayers: 64 };
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

        const { data, error } = await supabase.functions.invoke("fivem-server-status", {
          body: {},
        });

        clearTimeout(timeoutId);

        if (error || !data) {
          return { status: "offline" as const, players: 0, maxPlayers: 64 };
        }

        const playerCount = typeof data.players === "object" ? data.players.current : (data.players || 0);
        const maxCount = typeof data.players === "object" ? data.players.max : (data.maxPlayers || 64);

        return {
          status: data.status === "online" ? ("online" as const) : ("offline" as const),
          players: playerCount,
          maxPlayers: maxCount,
        };
      } catch {
        // Silently fail - don't retry on network errors
        return { status: "offline" as const, players: 0, maxPlayers: 64 };
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hour - very long cache for performance
    gcTime: 1000 * 60 * 120, // 2 hours cache retention
    refetchInterval: false,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    networkMode: "offlineFirst",
  });
};
