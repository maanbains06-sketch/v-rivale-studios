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

  // Helper function to get server start time for uptime tracking
  async function getServerStartTime(): Promise<string | null> {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'fivem_server_start_time')
        .single();
      
      return data?.value || null;
    } catch (error) {
      console.log('Could not fetch server start time:', error);
      return null;
    }
  }

  // Helper function to save server start time
  async function saveServerStartTime(timestamp: string) {
    try {
      await supabase
        .from('site_settings')
        .upsert({
          key: 'fivem_server_start_time',
          value: timestamp,
          description: 'FiveM server start time for uptime tracking (auto-synced)',
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });
      console.log('Saved server start time:', timestamp);
    } catch (error) {
      console.log('Could not save server start time:', error);
    }
  }

  // Helper function to get last known server status
  async function getLastServerStatus(): Promise<string> {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'fivem_last_status')
        .single();
      
      return data?.value || 'offline';
    } catch (error) {
      return 'offline';
    }
  }

  // Helper function to save server status
  async function saveServerStatus(status: string) {
    try {
      await supabase
        .from('site_settings')
        .upsert({
          key: 'fivem_last_status',
          value: status,
          description: 'Last known FiveM server status (auto-synced)',
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });
    } catch (error) {
      console.log('Could not save server status:', error);
    }
  }

  function formatResourceName(resourceName: string): string {
    // Remove common prefixes and technical patterns
    let formatted = resourceName
      .replace(/^(es_|esx_|qb-|qbcore-|vrp_|vRP_|ox_|okokBilling|okokGarage|okokPed|okokTextUI|slrp_|slrp-|server_|client_|shared_|core_|base_|)/gi, '')
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Skip system/internal resources
    const skipPatterns = ['webpack', 'monitor', 'mysql', 'oxmysql', 'yarn', 'spawnmanager', 'sessionmanager', 'hardcap', 'baseevents', 'chat', 'mapmanager', 'basic-gamemode'];
    if (skipPatterns.some(pattern => resourceName.toLowerCase().includes(pattern))) {
      return '';
    }
    
    // Capitalize first letter of each word
    formatted = formatted
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    return formatted || '';
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
        // Insert new resource updates (only user-friendly names, no raw file names)
        const updates = newResources
          .map(resource => {
            const formattedName = formatResourceName(resource);
            if (!formattedName) return null; // Skip system resources
            return {
              title: formattedName,
              description: 'New feature added to the server',
              update_type: 'resource',
              resource_name: null, // Don't store raw resource name
              detected_at: new Date().toISOString()
            };
          })
          .filter(update => update !== null);

        if (updates.length > 0) {
          const { error: insertError } = await supabase
            .from('server_updates')
            .insert(updates);

          if (insertError) {
            console.error('Error inserting server updates:', insertError);
          } else {
            console.log('Inserted', updates.length, 'new resource updates');
          }
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
        console.log('Info vars:', JSON.stringify(info.vars || {}));
      }

      if (dynamicResponse.ok) {
        dynamic = await dynamicResponse.json();
        console.log('Dynamic response:', JSON.stringify(dynamic));
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
      
      // Get server uptime from txAdmin
      let uptimeSeconds = 0;
      const txAdminPort = '30121';
      
      // Try multiple txAdmin API endpoints
      const txAdminEndpoints = [
        `http://${serverIp}:${txAdminPort}/status.json`,
        `http://${serverIp}:${txAdminPort}/api/status`,
        `http://${serverIp}:${txAdminPort}/serverStatus.json`,
      ];
      
      for (const txAdminUrl of txAdminEndpoints) {
        if (uptimeSeconds > 0) break;
        
        try {
          console.log('Trying txAdmin endpoint:', txAdminUrl);
          const txController = new AbortController();
          const txTimeoutId = setTimeout(() => txController.abort(), 3000);
          
          const txAdminResponse = await fetch(txAdminUrl, {
            signal: txController.signal,
            headers: {
              'Accept': 'application/json',
            },
          });
          
          clearTimeout(txTimeoutId);
          
          if (txAdminResponse.ok) {
            const contentType = txAdminResponse.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              const txAdminData = await txAdminResponse.json();
              console.log('txAdmin response:', JSON.stringify(txAdminData));
              
              // txAdmin returns uptime in different formats depending on version
              if (typeof txAdminData.uptime === 'number' && txAdminData.uptime > 0) {
                uptimeSeconds = txAdminData.uptime;
                console.log('Got uptime from txAdmin:', uptimeSeconds, 'seconds');
              } else if (txAdminData.server?.uptime) {
                uptimeSeconds = txAdminData.server.uptime;
                console.log('Got uptime from txAdmin server:', uptimeSeconds, 'seconds');
              } else if (txAdminData.serverUptime) {
                uptimeSeconds = txAdminData.serverUptime;
                console.log('Got serverUptime from txAdmin:', uptimeSeconds, 'seconds');
              }
            }
          }
        } catch (txError) {
          console.log('txAdmin endpoint failed:', txAdminUrl, txError);
        }
      }
      
      // Fallback: try to get uptime from FiveM server response
      if (uptimeSeconds === 0) {
        if (typeof dynamic.uptime === 'number' && dynamic.uptime > 0) {
          uptimeSeconds = dynamic.uptime;
        } else if (typeof dynamic.uptime === 'string' && parseInt(dynamic.uptime, 10) > 0) {
          uptimeSeconds = parseInt(dynamic.uptime, 10);
        } else if (dynamic.sv_uptime) {
          uptimeSeconds = parseInt(dynamic.sv_uptime, 10) || 0;
        } else if (info.vars?.sv_uptime) {
          uptimeSeconds = parseInt(info.vars.sv_uptime, 10) || 0;
        }
      }
      
      // Last fallback: track it ourselves
      if (uptimeSeconds === 0 && isOnline) {
        const lastStatus = await getLastServerStatus();
        const storedStartTime = await getServerStartTime();
        
        if (lastStatus !== 'online' || !storedStartTime) {
          const now = new Date().toISOString();
          saveServerStartTime(now).catch(err => console.log('Save start time error:', err));
          uptimeSeconds = 0;
        } else {
          const startTime = new Date(storedStartTime).getTime();
          const now = Date.now();
          uptimeSeconds = Math.floor((now - startTime) / 1000);
        }
        console.log('Using tracked uptime:', uptimeSeconds, 'seconds');
      }
      
      // Save current server status for tracking
      saveServerStatus(isOnline ? 'online' : 'offline').catch(err => console.log('Save status error:', err));
      
      console.log('Final uptime seconds:', uptimeSeconds);
      
      const uptimeMinutes = Math.floor(uptimeSeconds / 60) % 60;
      const uptimeHours = Math.floor(uptimeSeconds / 3600) % 24;
      const uptimeDays = Math.floor(uptimeSeconds / 86400);
      const uptime = uptimeDays > 0 
        ? `${uptimeDays}d ${uptimeHours}h ${uptimeMinutes}m`
        : `${uptimeHours}h ${uptimeMinutes}m`;

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
        serverName: (info.vars?.sv_hostname || info.vars?.sv_projectName || 'Skylife RP India').replace(/\[Qbox Project\]/gi, '').trim(),
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
        serverName: 'Skylife RP India',
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
