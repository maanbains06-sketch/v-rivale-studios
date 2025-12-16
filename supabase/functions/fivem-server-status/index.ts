import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Helper function to get last known max players from database
  async function getLastKnownMaxPlayers(): Promise<number> {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'fivem_max_players')
        .single();
      
      if (data?.value) {
        return parseInt(data.value, 10) || 48;
      }
    } catch (error) {
      console.log('Could not fetch last known max players:', error);
    }
    return 48; // Default fallback
  }

  // Helper function to save max players to database
  async function saveMaxPlayers(maxPlayers: number) {
    try {
      await supabase
        .from('site_settings')
        .upsert({
          key: 'fivem_max_players',
          value: maxPlayers.toString(),
          description: 'Last known FiveM server max player limit (auto-synced)',
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });
      console.log('Saved max players to database:', maxPlayers);
    } catch (error) {
      console.log('Could not save max players:', error);
    }
  }

  // Helper function to format resource name for display
  function formatResourceName(resourceName: string): string {
    // Remove common prefixes and clean up the name
    let formatted = resourceName
      .replace(/^(es_|esx_|qb-|qbcore-|vrp_|vRP_|ox_|okokBilling|okokGarage|okokPed|okokTextUI|)/i, '')
      .replace(/[-_]/g, ' ')
      .trim();
    
    // Capitalize first letter of each word
    formatted = formatted
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    return formatted || resourceName;
  }

  // Helper function to detect and save new resources
  async function detectNewResources(currentResources: string[]) {
    try {
      // Get the last known resource snapshot
      const { data: snapshot } = await supabase
        .from('server_resource_snapshot')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      const previousResources: string[] = snapshot?.resources || [];
      
      // Find new resources (in current but not in previous)
      const newResources = currentResources.filter(r => !previousResources.includes(r));
      
      // Find removed resources (in previous but not in current)
      const removedResources = previousResources.filter(r => !currentResources.includes(r));

      console.log('Previous resources count:', previousResources.length);
      console.log('Current resources count:', currentResources.length);
      console.log('New resources found:', newResources.length);

      // If we have new resources and this isn't the first sync (previous had resources)
      if (newResources.length > 0 && previousResources.length > 0) {
        // Insert new resource updates
        const updates = newResources.map(resource => ({
          title: formatResourceName(resource),
          description: `New resource added: ${resource}`,
          update_type: 'resource',
          resource_name: resource,
          detected_at: new Date().toISOString()
        }));

        const { error: insertError } = await supabase
          .from('server_updates')
          .insert(updates);

        if (insertError) {
          console.error('Error inserting server updates:', insertError);
        } else {
          console.log('Inserted', updates.length, 'new resource updates');
        }
      }

      // Update the snapshot with current resources
      if (snapshot?.id) {
        await supabase
          .from('server_resource_snapshot')
          .update({
            resources: currentResources,
            resource_count: currentResources.length,
            updated_at: new Date().toISOString()
          })
          .eq('id', snapshot.id);
      } else {
        await supabase
          .from('server_resource_snapshot')
          .insert({
            resources: currentResources,
            resource_count: currentResources.length
          });
      }

      console.log('Updated resource snapshot');
    } catch (error) {
      console.error('Error detecting new resources:', error);
    }
  }

  try {
    let serverIp = Deno.env.get('FIVEM_SERVER_IP') || '';
    const serverPort = Deno.env.get('FIVEM_SERVER_PORT') || '30120';

    if (!serverIp) {
      throw new Error('FiveM server IP not configured');
    }

    // Clean up the IP - remove any protocol prefix, "connect" prefix, or port suffix
    serverIp = serverIp.replace(/^(https?:\/\/|connect\s*)/i, '').trim();
    
    // If IP already contains a port, extract just the IP
    if (serverIp.includes(':')) {
      serverIp = serverIp.split(':')[0];
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
      const maxPlayers = parseInt(info.vars?.sv_maxClients, 10) || await getLastKnownMaxPlayers();
      
      // Get resource list from server
      const currentResources: string[] = info.resources || [];
      
      // Save max players to database for future offline fallback (non-blocking)
      if (info.vars?.sv_maxClients) {
        saveMaxPlayers(maxPlayers).catch(err => console.log('Background save error:', err));
      }
      
      // Detect and save new resources (non-blocking)
      if (currentResources.length > 0) {
        detectNewResources(currentResources).catch(err => console.log('Resource detection error:', err));
      }
      
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
        resources: currentResources.length,
        playerList: players,
      };

      console.log('Server data:', serverData);

      return new Response(JSON.stringify(serverData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (fetchError) {
      console.error('Failed to fetch from FiveM server:', fetchError);
      
      // Get last known max players from database
      const lastKnownMaxPlayers = await getLastKnownMaxPlayers();
      
      // Return offline status if server is unreachable
      return new Response(JSON.stringify({
        status: 'offline',
        players: { current: 0, max: lastKnownMaxPlayers },
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
