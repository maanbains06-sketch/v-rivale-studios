/**
 * SLRP Staff Presence Bot
 * 
 * This bot syncs Discord online status with your website.
 * 
 * SETUP:
 * 1. Install Node.js from https://nodejs.org
 * 2. Run: npm install
 * 3. Set your bot token as environment variable: DISCORD_BOT_TOKEN
 * 4. Set your Discord server ID as environment variable: DISCORD_SERVER_ID  
 * 5. Run: npm start
 * 
 * DISCORD DEVELOPER PORTAL SETUP:
 * 1. Go to https://discord.com/developers/applications
 * 2. Select your bot application
 * 3. Go to "Bot" settings
 * 4. Enable "PRESENCE INTENT" under Privileged Gateway Intents
 * 5. Enable "SERVER MEMBERS INTENT" under Privileged Gateway Intents
 */

const { Client, GatewayIntentBits, Events } = require('discord.js');

// ============================================
// CONFIGURATION
// ============================================

// Your Discord Bot Token (from Discord Developer Portal)
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

// Your Discord Server ID
const GUILD_ID = process.env.DISCORD_SERVER_ID;

// Lovable Cloud backend URLs (read from environment variables)
// - Presence updates are pushed in real-time via the bot
// - Event syncing is triggered by the bot (then the backend function fetches the latest scheduled events)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Validate Supabase configuration
if (!SUPABASE_URL) {
  console.error('❌ ERROR: SUPABASE_URL environment variable not set!');
  console.error('   Set it with: export SUPABASE_URL="https://your-project.supabase.co"');
  process.exit(1);
}

if (!SUPABASE_ANON_KEY) {
  console.error('❌ ERROR: SUPABASE_ANON_KEY environment variable not set!');
  console.error('   Set it with: export SUPABASE_ANON_KEY="your-anon-key"');
  process.exit(1);
}

// Backend functions
const SYNC_PRESENCE_URL = `${SUPABASE_URL}/functions/v1/sync-discord-presence`;
const SYNC_EVENTS_URL = `${SUPABASE_URL}/functions/v1/sync-discord-events`;

// Staff Discord IDs - will be auto-fetched from database
let STAFF_DISCORD_IDS = [];

// ============================================
// BOT CODE
// ============================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMembers,
    // Required to receive create/update/delete scheduled event gateway events
    GatewayIntentBits.GuildScheduledEvents,
  ],
});

// Fetch staff Discord IDs from database
async function fetchStaffIds() {
  try {
    console.log('📡 Fetching staff Discord IDs from database...');
    
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/staff_members?select=discord_id,name&is_active=eq.true`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    
    if (response.ok) {
      const staffMembers = await response.json();
      STAFF_DISCORD_IDS = staffMembers
        .filter(s => s.discord_id && s.discord_id !== '000000000000000001')
        .map(s => s.discord_id);
      
      console.log(`✅ Found ${STAFF_DISCORD_IDS.length} staff members to monitor:`);
      staffMembers.forEach(s => {
        if (s.discord_id && s.discord_id !== '000000000000000001') {
          console.log(`   - ${s.name} (${s.discord_id})`);
        }
      });
    } else {
      console.error('❌ Failed to fetch staff IDs:', response.status);
    }
  } catch (error) {
    console.error('❌ Error fetching staff IDs:', error.message);
  }
}

// Helper to send presence update to backend function
async function syncPresence(updates) {
  try {
    const presenceUpdates = Array.isArray(updates) ? updates : [updates];

    console.log(`📤 Sending ${presenceUpdates.length} presence update(s)...`);

    const response = await fetch(SYNC_PRESENCE_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        // Authentication required - use bot token as API key
        'x-api-key': BOT_TOKEN,
      },
      body: JSON.stringify({ presenceUpdates }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Presence sync failed:', response.status, errorText);
    } else {
      const result = await response.json();
      console.log('✅ Presence sync successful:', result.message);
    }
  } catch (error) {
    console.error('❌ Error syncing presence:', error.message);
  }
}

// Trigger event sync (debounced) so the website updates right after Discord changes
let eventsSyncTimeout = null;
let lastEventsSyncAt = 0;
const MIN_EVENTS_SYNC_INTERVAL_MS = 10_000; // avoid spam if multiple updates fire

function scheduleEventsSync(reason) {
  const now = Date.now();
  const waitMs = Math.max(0, MIN_EVENTS_SYNC_INTERVAL_MS - (now - lastEventsSyncAt));

  if (eventsSyncTimeout) clearTimeout(eventsSyncTimeout);

  eventsSyncTimeout = setTimeout(async () => {
    try {
      lastEventsSyncAt = Date.now();
      console.log(`\n📅 Triggering events sync (${reason})...`);

      const response = await fetch(SYNC_EVENTS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Edge function can be invoked with anon credentials; it uses service access internally.
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ triggeredBy: 'discord-bot', reason }),
      });

      const text = await response.text();
      if (!response.ok) {
        console.error('❌ Events sync trigger failed:', response.status, text);
        return;
      }

      try {
        const json = JSON.parse(text);
        console.log(`✅ Events sync triggered: ${json.message ?? 'ok'} (synced: ${json.synced ?? 0})`);
      } catch {
        console.log('✅ Events sync triggered:', text);
      }
    } catch (error) {
      console.error('❌ Error triggering events sync:', error.message);
    }
  }, waitMs);
}

// Handle real-time presence updates
client.on(Events.PresenceUpdate, async (oldPresence, newPresence) => {
  if (!newPresence?.userId) return;

  // Only sync staff members
  if (!STAFF_DISCORD_IDS.includes(newPresence.userId)) {
    return;
  }

  const oldStatus = oldPresence?.status || 'offline';
  const newStatus = newPresence.status || 'offline';
  const isOnline = newStatus !== 'offline';
  const username = newPresence.user?.username || newPresence.userId;

  console.log(`\n🔄 [${new Date().toLocaleTimeString()}] ${username}: ${oldStatus} → ${newStatus}`);

  await syncPresence({
    discord_id: newPresence.userId,
    is_online: isOnline,
    status: newStatus,
  });
});

// Scheduled event gateway events (create/update/delete) -> trigger backend sync immediately
client.on(Events.GuildScheduledEventCreate, (event) => {
  if (event?.guildId && event.guildId !== GUILD_ID) return;
  scheduleEventsSync('GuildScheduledEventCreate');
});

client.on(Events.GuildScheduledEventUpdate, (oldEvent, newEvent) => {
  const guildId = newEvent?.guildId || oldEvent?.guildId;
  if (guildId && guildId !== GUILD_ID) return;
  scheduleEventsSync('GuildScheduledEventUpdate');
});

client.on(Events.GuildScheduledEventDelete, (event) => {
  if (event?.guildId && event.guildId !== GUILD_ID) return;
  scheduleEventsSync('GuildScheduledEventDelete');
});

// Bot ready event
client.on(Events.ClientReady, async () => {
  console.log('\n=========================================');
  console.log(`🤖 Bot ready as ${client.user.tag}`);
  console.log('=========================================\n');
  
  // Fetch staff IDs from database
  await fetchStaffIds();
  
  const guild = client.guilds.cache.get(GUILD_ID) || client.guilds.cache.first();
  
  if (!guild) {
    console.error('❌ ERROR: Bot is not in any guild!');
    console.error('   Invite the bot to your server first.');
    return;
  }
  
  console.log(`\n✅ Connected to: ${guild.name} (${guild.id})`);
  
  // Function to sync all staff presences
  async function syncAllPresences() {
    if (STAFF_DISCORD_IDS.length === 0) {
      console.log('⚠️  No staff IDs to monitor');
      return;
    }
    
    console.log(`\n📡 [${new Date().toLocaleTimeString()}] Syncing all presences...`);
    const presenceUpdates = [];
    
    for (const discordId of STAFF_DISCORD_IDS) {
      try {
        const member = await guild.members.fetch(discordId);
        const status = member.presence?.status || 'offline';
        const isOnline = status !== 'offline';
        
        presenceUpdates.push({
          discord_id: discordId,
          is_online: isOnline,
          status: status,
        });
        
        const emoji = status === 'online' ? '🟢' : status === 'idle' ? '🟡' : status === 'dnd' ? '🔴' : '⚫';
        console.log(`   ${emoji} ${member.user.username}: ${status}`);
      } catch (error) {
        console.log(`   ⚠️  ${discordId}: not found in server`);
        presenceUpdates.push({
          discord_id: discordId,
          is_online: false,
          status: 'offline',
        });
      }
    }
    
    await syncPresence(presenceUpdates);
  }
  
  // Initial sync
  await syncAllPresences();
  
  // Sync every 30 seconds for faster updates
  setInterval(syncAllPresences, 30 * 1000);
  
  // Refresh staff IDs every 5 minutes
  setInterval(fetchStaffIds, 5 * 60 * 1000);
  
  console.log('\n=========================================');
  console.log('🎯 Now monitoring presence changes!');
  console.log('⏰ Auto-sync every 30 seconds');
  console.log('📌 Keep this running to maintain sync');
  console.log('=========================================\n');
});

// Error handling
client.on(Events.Error, (error) => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});

// Login
console.log('🚀 Starting SLRP Presence Bot...\n');

if (!BOT_TOKEN) {
  console.error('❌ ERROR: DISCORD_BOT_TOKEN environment variable not set!');
  console.error('   Set it with: export DISCORD_BOT_TOKEN="your-token-here"');
  process.exit(1);
}

if (!GUILD_ID) {
  console.error('❌ ERROR: DISCORD_SERVER_ID environment variable not set!');
  console.error('   Set it with: export DISCORD_SERVER_ID="your-server-id"');
  process.exit(1);
}

client.login(BOT_TOKEN).catch((error) => {
  console.error('❌ Failed to login:', error.message);
  console.error('\nCheck that:');
  console.error('  1. Your bot token is correct');
  console.error('  2. PRESENCE INTENT is enabled in Discord Developer Portal');
  console.error('  3. SERVER MEMBERS INTENT is enabled');
  process.exit(1);
});
