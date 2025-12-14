# Discord Presence Sync Setup

To show real-time online status of staff members based on their Discord activity, you need to set up a Discord bot that sends presence updates to your website.

## Why is this needed?

Discord's REST API does not provide user presence (online/offline status). This data is only available through:
1. **Discord Gateway API** - Requires a running bot with `GUILD_PRESENCES` intent
2. **Discord Widget** - Only shows anonymized data, can't match to specific users

## Setup Instructions

### Option 1: Use a Discord Bot (Recommended)

You'll need a Discord bot running that listens for presence changes and sends them to your edge function.

#### 1. Enable Required Intents

In the [Discord Developer Portal](https://discord.com/developers/applications):
1. Select your bot application
2. Go to **Bot** settings
3. Enable **Presence Intent** under "Privileged Gateway Intents"
4. Enable **Server Members Intent**

#### 2. Bot Code Example (Node.js with discord.js)

```javascript
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMembers,
  ],
});

// Your Supabase edge function URL
const SYNC_URL = 'https://obirpzwvnqveddyuulsb.supabase.co/functions/v1/sync-discord-presence';

// Staff Discord IDs to monitor
const STAFF_DISCORD_IDS = [
  '833680146510381097', // Maan
  '727581954408710272', // ASCENDOR
  '1417622059617357824', // Sexy
  '407091450560643073', // TheKid
  '1055766042871349248', // DagoBato
  // Add more staff IDs here
];

client.on('presenceUpdate', async (oldPresence, newPresence) => {
  if (!newPresence?.userId) return;
  
  // Only sync staff members
  if (!STAFF_DISCORD_IDS.includes(newPresence.userId)) return;
  
  const isOnline = newPresence.status !== 'offline';
  const status = newPresence.status; // online, idle, dnd, offline
  
  console.log(`Presence update: ${newPresence.userId} is now ${status}`);
  
  try {
    await fetch(SYNC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        discord_id: newPresence.userId,
        is_online: isOnline,
        status: status,
      }),
    });
  } catch (error) {
    console.error('Failed to sync presence:', error);
  }
});

// Sync all staff on bot startup
client.on('ready', async () => {
  console.log(`Bot ready as ${client.user.tag}`);
  
  // Get all staff presences on startup
  const guild = client.guilds.cache.first();
  if (!guild) return;
  
  const presenceUpdates = [];
  
  for (const discordId of STAFF_DISCORD_IDS) {
    const member = await guild.members.fetch(discordId).catch(() => null);
    if (member) {
      presenceUpdates.push({
        discord_id: discordId,
        is_online: member.presence?.status !== 'offline' && member.presence?.status !== undefined,
        status: member.presence?.status || 'offline',
      });
    }
  }
  
  if (presenceUpdates.length > 0) {
    try {
      await fetch(SYNC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presenceUpdates }),
      });
      console.log(`Synced ${presenceUpdates.length} staff presences`);
    } catch (error) {
      console.error('Failed to sync initial presences:', error);
    }
  }
});

client.login('YOUR_BOT_TOKEN');
```

### Option 2: Manual Presence Update API

You can manually update presence via the API:

```bash
# Single update
curl -X POST https://obirpzwvnqveddyuulsb.supabase.co/functions/v1/sync-discord-presence \
  -H "Content-Type: application/json" \
  -d '{"discord_id": "833680146510381097", "is_online": true, "status": "online"}'

# Bulk update
curl -X POST https://obirpzwvnqveddyuulsb.supabase.co/functions/v1/sync-discord-presence \
  -H "Content-Type: application/json" \
  -d '{
    "presenceUpdates": [
      {"discord_id": "833680146510381097", "is_online": true, "status": "online"},
      {"discord_id": "727581954408710272", "is_online": false, "status": "offline"}
    ]
  }'
```

## Status Values

- `online` - User is actively online
- `idle` - User is idle/away
- `dnd` - User has Do Not Disturb enabled
- `offline` - User is offline

## Troubleshooting

1. **All staff showing offline**: Ensure your Discord bot has Presence Intent enabled and is running
2. **Bot not detecting changes**: Check that the bot is in the same server as staff and has the right permissions
3. **Updates not reflecting**: The website refreshes presence every 30 seconds, or refresh manually
