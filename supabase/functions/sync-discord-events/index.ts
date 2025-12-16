import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DiscordScheduledEvent {
  id: string;
  guild_id: string;
  name: string;
  description: string | null;
  scheduled_start_time: string;
  scheduled_end_time: string | null;
  status: number;
  entity_type: number;
  entity_metadata?: {
    location?: string;
  };
  user_count?: number;
  image?: string | null;
}

// Simple in-memory cache to prevent rate limiting
let lastSyncTime = 0;
const SYNC_COOLDOWN_MS = 30000; // 30 seconds cooldown

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Check cooldown to prevent rate limiting
    const currentTime = Date.now();
    if (currentTime - lastSyncTime < SYNC_COOLDOWN_MS) {
      console.log("Sync cooldown active, returning cached events");
      
      const { data: existingEvents } = await supabase
        .from('events')
        .select('*')
        .neq('status', 'cancelled')
        .order('start_date', { ascending: true });

      return new Response(
        JSON.stringify({
          success: true,
          synced: 0,
          total: existingEvents?.length || 0,
          events: existingEvents || [],
          message: "Using cached events (cooldown active)",
          cached: true,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const discordBotToken = Deno.env.get("DISCORD_BOT_TOKEN");
    const discordServerId = Deno.env.get("DISCORD_SERVER_ID");

    if (!discordBotToken) {
      throw new Error("DISCORD_BOT_TOKEN not configured");
    }

    if (!discordServerId) {
      throw new Error("DISCORD_SERVER_ID not configured");
    }

    console.log("Fetching Discord scheduled events for server:", discordServerId);

    const discordResponse = await fetch(
      `https://discord.com/api/v10/guilds/${discordServerId}/scheduled-events?with_user_count=true`,
      {
        headers: {
          Authorization: `Bot ${discordBotToken}`,
        },
      }
    );

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();
      console.error("Discord API error:", errorText);
      throw new Error(`Discord API error: ${discordResponse.status} ${discordResponse.statusText}`);
    }

    // Update last sync time after successful Discord API call
    lastSyncTime = Date.now();

    const discordEvents: DiscordScheduledEvent[] = await discordResponse.json();
    console.log(`Found ${discordEvents.length} Discord events`);

    const syncedEvents = [];
    const nowDate = new Date();

    for (const discordEvent of discordEvents) {
      let status: string;
      const startDate = new Date(discordEvent.scheduled_start_time);
      const endDate = discordEvent.scheduled_end_time 
        ? new Date(discordEvent.scheduled_end_time) 
        : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

      switch (discordEvent.status) {
        case 2:
          status = 'running';
          break;
        case 3:
          status = 'completed';
          break;
        case 4:
          status = 'cancelled';
          break;
        default:
          if (startDate <= nowDate && endDate >= nowDate) {
            status = 'running';
          } else if (endDate < nowDate) {
            status = 'completed';
          } else {
            status = 'upcoming';
          }
      }

      let eventType: string;
      switch (discordEvent.entity_type) {
        case 1:
          eventType = 'stage';
          break;
        case 2:
          eventType = 'voice';
          break;
        case 3:
          eventType = 'external';
          break;
        default:
          eventType = 'community';
      }

      const location = discordEvent.entity_metadata?.location || null;
      const bannerImage = discordEvent.image 
        ? `https://cdn.discordapp.com/guild-events/${discordEvent.id}/${discordEvent.image}.png?size=1024`
        : null;

      const eventData = {
        discord_event_id: discordEvent.id,
        title: discordEvent.name,
        description: discordEvent.description,
        event_type: eventType,
        start_date: discordEvent.scheduled_start_time,
        end_date: endDate.toISOString(),
        status: status,
        location: location,
        current_participants: discordEvent.user_count || 0,
        banner_image: bannerImage,
        source: 'discord',
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('events')
        .upsert(eventData, {
          onConflict: 'discord_event_id',
          ignoreDuplicates: false,
        })
        .select()
        .single();

      if (error) {
        console.error(`Error syncing event ${discordEvent.name}:`, error);
        continue;
      }

      console.log(`Synced event: ${discordEvent.name} (status: ${status})`);
      syncedEvents.push(data);
    }

    const syncedDiscordIds = discordEvents.map(e => e.id);

    if (syncedDiscordIds.length > 0) {
      const { error: updateError } = await supabase
        .from('events')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('source', 'discord')
        .not('discord_event_id', 'in', `(${syncedDiscordIds.map(id => `'${id}'`).join(',')})`)
        .in('status', ['upcoming', 'running']);

      if (updateError) {
        console.error('Error marking old events as completed:', updateError);
      }
    }

    const { data: allEvents, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .neq('status', 'cancelled')
      .order('start_date', { ascending: true });

    if (fetchError) {
      throw fetchError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced: syncedEvents.length,
        total: allEvents?.length || 0,
        events: allEvents,
        message: `Successfully synced ${syncedEvents.length} events from Discord`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in sync-discord-events function:", error);
    
    // On error, still return existing events from database
    const { data: fallbackEvents } = await supabase
      .from('events')
      .select('*')
      .neq('status', 'cancelled')
      .order('start_date', { ascending: true });

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        events: fallbackEvents || [],
        details: "Make sure DISCORD_BOT_TOKEN and DISCORD_SERVER_ID are configured",
      }),
      {
        status: 200, // Return 200 with fallback data instead of 500
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
