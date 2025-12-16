import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

type SyncState = {
  last_sync_at_ms: number;
  retry_until_ms: number;
};

const SYNC_STATE_KEY = "discord_events_sync_state";
const DEFAULT_MIN_SYNC_INTERVAL_MS = 60_000; // 1 min

function safeParseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

async function getSyncState(supabase: any): Promise<SyncState> {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", SYNC_STATE_KEY)
    .maybeSingle();

  const parsed = safeParseJson<SyncState>((data as any)?.value ?? null);
  return {
    last_sync_at_ms: parsed?.last_sync_at_ms ?? 0,
    retry_until_ms: parsed?.retry_until_ms ?? 0,
  };
}

async function setSyncState(supabase: any, next: SyncState) {
  await supabase.from("site_settings").upsert(
    {
      key: SYNC_STATE_KEY,
      value: JSON.stringify(next),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );
}

async function fetchActiveEventsFromDb(supabase: any) {
  const { data } = await supabase
    .from("events")
    .select("*")
    .in("status", ["upcoming", "running"])
    .order("start_date", { ascending: true });

  return data ?? [];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey) as any;

  try {
    const now = new Date();

    // Always keep DB statuses fresh based on timestamps (so ended events disappear even if Discord API is rate limited)
    await supabase
      .from("events")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .lt("end_date", now.toISOString())
      .in("status", ["upcoming", "running"]);

    await supabase
      .from("events")
      .update({ status: "running", updated_at: new Date().toISOString() })
      .lte("start_date", now.toISOString())
      .gte("end_date", now.toISOString())
      .eq("status", "upcoming");

    const state = await getSyncState(supabase);
    const nowMs = Date.now();

    // Respect stored retry window if we previously hit Discord rate-limits
    if (state.retry_until_ms && nowMs < state.retry_until_ms) {
      const existingEvents = await fetchActiveEventsFromDb(supabase);
      return new Response(
        JSON.stringify({
          success: true,
          synced: 0,
          total: existingEvents.length,
          events: existingEvents,
          message: "Using cached events (Discord rate limit active)",
          cached: true,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Basic persisted cooldown to avoid hammering Discord even when edge instances restart
    if (nowMs - state.last_sync_at_ms < DEFAULT_MIN_SYNC_INTERVAL_MS) {
      const existingEvents = await fetchActiveEventsFromDb(supabase);
      return new Response(
        JSON.stringify({
          success: true,
          synced: 0,
          total: existingEvents.length,
          events: existingEvents,
          message: "Using cached events (cooldown active)",
          cached: true,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const discordBotToken = Deno.env.get("DISCORD_BOT_TOKEN");
    const discordServerId = Deno.env.get("DISCORD_SERVER_ID");

    if (!discordBotToken) throw new Error("DISCORD_BOT_TOKEN not configured");
    if (!discordServerId) throw new Error("DISCORD_SERVER_ID not configured");

    console.log("Fetching Discord scheduled events for server:", discordServerId);

    const discordResponse = await fetch(
      `https://discord.com/api/v10/guilds/${discordServerId}/scheduled-events?with_user_count=true`,
      {
        headers: {
          Authorization: `Bot ${discordBotToken}`,
        },
      },
    );

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();
      console.error("Discord API error:", errorText);

      // Handle rate-limits gracefully by persisting retry window and returning cached events
      if (discordResponse.status === 429) {
        const payload = safeParseJson<{ retry_after?: number }>(errorText) ?? {};
        const retryAfterSeconds = payload.retry_after ?? 10;
        const retryUntilMs = Date.now() + Math.ceil(retryAfterSeconds * 1000);

        await setSyncState(supabase, {
          last_sync_at_ms: state.last_sync_at_ms,
          retry_until_ms: retryUntilMs,
        });

        const existingEvents = await fetchActiveEventsFromDb(supabase);

        return new Response(
          JSON.stringify({
            success: true,
            synced: 0,
            total: existingEvents.length,
            events: existingEvents,
            message: `Using cached events (rate limited, retry in ~${Math.ceil(retryAfterSeconds)}s)`,
            cached: true,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      throw new Error(
        `Discord API error: ${discordResponse.status} ${discordResponse.statusText}`,
      );
    }

    const discordEvents: DiscordScheduledEvent[] = await discordResponse.json();
    console.log(`Found ${discordEvents.length} Discord events`);

    // Update last sync time only after successful Discord response
    await setSyncState(supabase, {
      last_sync_at_ms: Date.now(),
      retry_until_ms: 0,
    });

    const syncedEvents = [];
    const nowDate = new Date();
    const activeDiscordIds: string[] = [];

    for (const discordEvent of discordEvents) {
      const startDate = new Date(discordEvent.scheduled_start_time);
      const endDate = discordEvent.scheduled_end_time
        ? new Date(discordEvent.scheduled_end_time)
        : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

      // Discord event status: 1 = scheduled, 2 = active, 3 = completed, 4 = cancelled
      // If event is cancelled (4) or completed (3), DELETE it from DB immediately
      if (discordEvent.status === 3 || discordEvent.status === 4) {
        const statusName = discordEvent.status === 4 ? "cancelled" : "completed";
        console.log(`Event "${discordEvent.name}" is ${statusName} - removing from website`);
        
        const { error: deleteError } = await supabase
          .from("events")
          .delete()
          .eq("discord_event_id", discordEvent.id);
        
        if (deleteError) {
          console.error(`Error deleting ${statusName} event ${discordEvent.name}:`, deleteError);
        }
        continue; // Don't add to activeDiscordIds
      }

      // Calculate status for active events
      let status: string;
      if (discordEvent.status === 2) {
        status = "running";
      } else if (startDate <= nowDate && endDate >= nowDate) {
        status = "running";
      } else if (endDate < nowDate) {
        // Event ended - delete it
        console.log(`Event "${discordEvent.name}" has ended - removing from website`);
        await supabase.from("events").delete().eq("discord_event_id", discordEvent.id);
        continue;
      } else {
        status = "upcoming";
      }

      // Track this as an active event
      activeDiscordIds.push(discordEvent.id);

      let eventType: string;
      switch (discordEvent.entity_type) {
        case 1:
          eventType = "stage";
          break;
        case 2:
          eventType = "voice";
          break;
        case 3:
          eventType = "external";
          break;
        default:
          eventType = "community";
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
        status,
        location,
        current_participants: discordEvent.user_count || 0,
        banner_image: bannerImage,
        source: "discord",
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("events")
        .upsert(eventData, {
          onConflict: "discord_event_id",
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

    // Delete any Discord events from DB that are no longer in the active list
    // (they were deleted from Discord or are cancelled/completed)
    if (activeDiscordIds.length === 0) {
      // Discord returned 0 active events - delete all discord-sourced events
      console.log("No active Discord events - removing all discord events from website");
      const { error: deleteAllError } = await supabase
        .from("events")
        .delete()
        .eq("source", "discord");

      if (deleteAllError) {
        console.error("Error deleting all discord events:", deleteAllError);
      }
    } else {
      // Delete events that are no longer in Discord's active list
      const { data: staleEvents } = await supabase
        .from("events")
        .select("id, discord_event_id, title")
        .eq("source", "discord")
        .not("discord_event_id", "in", `(${activeDiscordIds.map((id) => `'${id}'`).join(",")})`);

      if (staleEvents && staleEvents.length > 0) {
        console.log(`Removing ${staleEvents.length} stale events:`, staleEvents.map((e: any) => e.title));
        const { error: deleteError } = await supabase
          .from("events")
          .delete()
          .eq("source", "discord")
          .not("discord_event_id", "in", `(${activeDiscordIds.map((id) => `'${id}'`).join(",")})`);

        if (deleteError) {
          console.error("Error deleting stale events:", deleteError);
        }
      }
    }

    // Return only active (upcoming/running) events so UI always hides cancelled/completed
    const allEvents = await fetchActiveEventsFromDb(supabase);

    return new Response(
      JSON.stringify({
        success: true,
        synced: syncedEvents.length,
        total: allEvents.length,
        events: allEvents,
        message: `Successfully synced ${syncedEvents.length} events from Discord`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("Error in sync-discord-events function:", error);

    // On error, still return active events from database
    const fallbackEvents = await fetchActiveEventsFromDb(supabase);

    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message ?? String(error),
        events: fallbackEvents,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
};

serve(handler);
