/**
 * SLRP Staff Presence Bot
 * 
 * This bot syncs Discord online status with your website.
 * 
 * SETUP:
 * 1. Install Node.js from https://nodejs.org
 * 2. Run: npm install
 * 3. Set your bot token below or use environment variable
 * 4. Run: npm start
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
// CONFIGURATION - UPDATE THESE VALUES
// ============================================

// Your Discord Bot Token (from Discord Developer Portal)
// Set this as an environment variable: DISCORD_BOT_TOKEN
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

// Your Supabase Edge Function URL
const SYNC_URL = 'https://obirpzwvnqveddyuulsb.supabase.co/functions/v1/sync-discord-presence';

// Your Discord Server ID
// Set this as an environment variable: DISCORD_SERVER_ID
const GUILD_ID = process.env.DISCORD_SERVER_ID;

// Staff Discord IDs to monitor - ADD YOUR STAFF IDS HERE
const STAFF_DISCORD_IDS = [
  '833680146510381097',  // Maan
  '727581954408710272',  // ASCENDOR
  '1417622059617357824', // Sexy
  '407091450560643073',  // TheKid
  '1055766042871349248', // DagoBato
  '000000000000000001',  // NewStaff (placeholder)
  // Add more staff Discord IDs here
];

// ============================================
// BOT CODE - NO NEED TO MODIFY BELOW
// ============================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMembers,
  ],
});

// Helper to send presence update to edge function
async function syncPresence(updates) {
  try {
    // Normalize to array format
    const presenceUpdates = Array.isArray(updates) ? updates : [updates];
    
    console.log(`Sending ${presenceUpdates.length} presence update(s) to edge function...`);
    
    const response = await fetch(SYNC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ presenceUpdates }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Sync failed:', response.status, errorText);
    } else {
      const result = await response.json();
      console.log('✅ Sync successful:', result.message, `(mode: ${result.mode})`);
    }
  } catch (error) {
    console.error('❌ Error syncing presence:', error.message);
  }
}

// Handle presence updates
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
  
  console.log(`\n🔄 [${new Date().toISOString()}]`);
  console.log(`   User: ${username} (${newPresence.userId})`);
  console.log(`   Status: ${oldStatus} -> ${newStatus}`);
  
  // Always sync to ensure database is updated (even if status appears same)
  await syncPresence({
    discord_id: newPresence.userId,
    is_online: isOnline,
    status: newStatus,
  });
});

// Sync all staff presences on startup and periodically
client.on(Events.ClientReady, async () => {
  console.log('=========================================');
  console.log(`🤖 Bot ready as ${client.user.tag}`);
  console.log(`📋 Monitoring ${STAFF_DISCORD_IDS.length} staff members`);
  console.log(`🔗 Sync URL: ${SYNC_URL}`);
  console.log('=========================================\n');
  
  const guild = client.guilds.cache.get(GUILD_ID) || client.guilds.cache.first();
  
  if (!guild) {
    console.error('❌ ERROR: Bot is not in any guild! Invite the bot to your server.');
    return;
  }
  
  console.log(`✅ Connected to guild: ${guild.name} (${guild.id})`);
  
  // Function to sync all staff presences
  async function syncAllPresences() {
    console.log('\n📡 Fetching staff presences...');
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
        
        const statusEmoji = isOnline ? '🟢' : '⚫';
        console.log(`   ${statusEmoji} ${member.user.username} (@${member.user.tag}): ${status}`);
      } catch (error) {
        console.log(`   ⚠️  Could not fetch ${discordId}: ${error.message}`);
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
  
  // Sync every 2 minutes to ensure consistency
  setInterval(syncAllPresences, 2 * 60 * 1000);
  
  console.log('\n=========================================');
  console.log('🎯 Bot is now monitoring presence changes!');
  console.log('⏰ Auto-sync every 2 minutes');
  console.log('📌 Keep this terminal open to maintain sync.');
  console.log('=========================================\n');
});

// Error handling
client.on(Events.Error, (error) => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

// Login
console.log('Starting SLRP Presence Bot...\n');

if (BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
  console.error('ERROR: Please set your bot token in index.js or as DISCORD_BOT_TOKEN environment variable');
  process.exit(1);
}

client.login(BOT_TOKEN).catch((error) => {
  console.error('Failed to login:', error.message);
  console.error('\nMake sure your bot token is correct and the bot has the required intents enabled.');
  process.exit(1);
});