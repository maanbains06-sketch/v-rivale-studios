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
  status: number; // 1=SCHEDULED, 2=ACTIVE, 3=COMPLETED, 4=CANCELED
  entity_type: number; // 1=STAGE_INSTANCE, 2=VOICE, 3=EXTERNAL
  entity_metadata?: {
    location?: string;
  };
  user_count?: number;
  image?: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const discordBotToken = Deno.env.get("DISCORD_BOT_TOKEN");
    const discordServerId = Deno.env.get("DISCORD_SERVER_ID");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!discordBotToken) {
      throw new Error("DISCORD_BOT_TOKEN not configured");
    }

    if (!discordServerId) {
      throw new Error("DISCORD_SERVER_ID not configured");
    }

    console.log("Fetching Discord scheduled events for server:", discordServerId);

    // Fetch scheduled events from Discord
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

    const discordEvents: DiscordScheduledEvent[] = await discordResponse.json();
    console.log(`Found ${discordEvents.length} Discord events`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Process each Discord event
    const syncedEvents = [];
    const now = new Date();

    for (const discordEvent of discordEvents) {
      // Map Discord status to our status
      let status: string;
      const startDate = new Date(discordEvent.scheduled_start_time);
      const endDate = discordEvent.scheduled_end_time 
        ? new Date(discordEvent.scheduled_end_time) 
        : new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours if no end time

      // Determine status based on Discord status and time
      switch (discordEvent.status) {
        case 2: // ACTIVE
          status = 'running';
          break;
        case 3: // COMPLETED
          status = 'completed';
          break;
        case 4: // CANCELED
          status = 'cancelled';
          break;
        default: // SCHEDULED or unknown
          if (startDate <= now && endDate >= now) {
            status = 'running';
          } else if (endDate < now) {
            status = 'completed';
          } else {
            status = 'upcoming';
          }
      }

      // Map entity_type to event_type
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

      // Get location from entity_metadata
      const location = discordEvent.entity_metadata?.location || null;

      // Build banner image URL if available
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

      // Upsert event (insert or update based on discord_event_id)
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

    // Get IDs of currently synced Discord events
    const syncedDiscordIds = discordEvents.map(e => e.id);

    // Mark events that are no longer in Discord as completed (if they were from Discord)
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

    // Fetch all current events to return
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
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: "Make sure DISCORD_BOT_TOKEN and DISCORD_SERVER_ID are configured",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
