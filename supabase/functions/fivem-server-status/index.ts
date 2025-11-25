import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serverIp = Deno.env.get('FIVEM_SERVER_IP');
    const serverPort = Deno.env.get('FIVEM_SERVER_PORT');

    if (!serverIp || !serverPort) {
      throw new Error('FiveM server IP or port not configured');
    }

    const baseUrl = `http://${serverIp}:${serverPort}`;
    console.log(`Fetching FiveM server data from ${baseUrl}`);

    // Fetch server data with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      // Fetch players data
      const playersResponse = await fetch(`${baseUrl}/players.json`, {
        signal: controller.signal,
      });
      
      // Fetch server info
      const infoResponse = await fetch(`${baseUrl}/info.json`, {
        signal: controller.signal,
      });
      
      // Fetch dynamic data
      const dynamicResponse = await fetch(`${baseUrl}/dynamic.json`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let players: any[] = [];
      let info: any = {};
      let dynamic: any = {};
      let isOnline = true;

      if (playersResponse.ok) {
        const rawPlayers = await playersResponse.json();
        // Format players data with id and name
        players = rawPlayers.map((player: any) => ({
          id: player.id,
          name: player.name,
          identifiers: player.identifiers,
          ping: player.ping,
        }));
      }

      if (infoResponse.ok) {
        info = await infoResponse.json();
      }

      if (dynamicResponse.ok) {
        dynamic = await dynamicResponse.json();
      }

      // Calculate server metrics
      const currentPlayers = players.length;
      const maxPlayers = info.vars?.sv_maxClients || 32;
      
      // Get server uptime (convert from seconds to readable format)
      const uptimeSeconds = dynamic.uptime || 0;
      const uptimeHours = Math.floor(uptimeSeconds / 3600);
      const uptimeDays = Math.floor(uptimeHours / 24);
      const remainingHours = uptimeHours % 24;
      const uptime = uptimeDays > 0 
        ? `${uptimeDays}d ${remainingHours}h`
        : `${uptimeHours}h`;

      // Calculate server load (based on player percentage)
      const serverLoad = Math.round((currentPlayers / maxPlayers) * 100);

      // Estimate network latency (this would need actual ping implementation)
      const networkLatency = Math.floor(Math.random() * 30) + 20; // Placeholder

      const serverData = {
        status: isOnline ? 'online' : 'offline',
        players: {
          current: currentPlayers,
          max: maxPlayers,
        },
        uptime: uptime,
        uptimeSeconds: uptimeSeconds,
        serverLoad: serverLoad,
        networkLatency: networkLatency,
        serverName: info.server || 'SLRP Server',
        gametype: info.gametype || 'Roleplay',
        mapname: info.mapname || 'Los Santos',
        resources: info.resources?.length || 0,
        playerList: players,
      };

      console.log('Server data:', serverData);

      return new Response(JSON.stringify(serverData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (fetchError) {
      console.error('Failed to fetch from FiveM server:', fetchError);
      
      // Return offline status if server is unreachable
      return new Response(JSON.stringify({
        status: 'offline',
        players: { current: 0, max: 32 },
        uptime: '0h',
        uptimeSeconds: 0,
        serverLoad: 0,
        networkLatency: 0,
        serverName: 'SLRP Server',
        error: 'Server unreachable'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in fivem-server-status function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
