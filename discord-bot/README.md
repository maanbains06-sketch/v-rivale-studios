# SLRP Staff Presence Bot

This Discord bot syncs staff online/offline status from Discord to your website in real-time.

## Quick Start

### 1. Enable Bot Intents (REQUIRED)

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your bot application
3. Click **Bot** in the left sidebar
4. Scroll to **Privileged Gateway Intents**
5. Enable these intents:
   - ✅ **PRESENCE INTENT**
   - ✅ **SERVER MEMBERS INTENT**
6. Click **Save Changes**

### 2. Install & Run the Bot

#### Option A: Run on your computer

```bash
# Navigate to the discord-bot folder
cd discord-bot

# Install dependencies
npm install

# Set your bot token (replace with your actual token)
export DISCORD_BOT_TOKEN="your-bot-token-here"

# Run the bot
npm start
```

#### Option B: Run on Replit (Free, 24/7)

1. Go to [Replit](https://replit.com)
2. Create a new **Node.js** Repl
3. Copy the contents of `index.js` and `package.json`
4. Add your `DISCORD_BOT_TOKEN` to Replit Secrets
5. Click **Run**

#### Option C: Run on Railway (Free tier available)

1. Go to [Railway](https://railway.app)
2. Create new project from GitHub or paste code
3. Add `DISCORD_BOT_TOKEN` environment variable
4. Deploy

## Configuration

Edit `index.js` to update:

1. **BOT_TOKEN** - Your Discord bot token
2. **GUILD_ID** - Your Discord server ID
3. **STAFF_DISCORD_IDS** - Array of staff member Discord IDs

## How It Works

1. Bot connects to Discord with Presence Intent
2. Listens for staff members going online/offline
3. Sends updates to your Supabase edge function
4. Website displays real-time online status

## Troubleshooting

### "Used disallowed intents" error
- Enable PRESENCE INTENT and SERVER MEMBERS INTENT in Discord Developer Portal

### Staff not showing as online
- Verify staff Discord IDs are correct
- Check that staff are in the monitored Discord server
- Ensure bot has permission to see members

### Bot disconnects frequently
- This is normal - Discord Gateway may disconnect occasionally
- The bot will automatically reconnect

## Status Values

- 🟢 **online** - Actively online
- 🟡 **idle** - Away/Idle
- 🔴 **dnd** - Do Not Disturb
- ⚫ **offline** - Offline
