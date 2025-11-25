# Discord Presence Integration Setup

This guide explains how to set up Discord-based online status tracking for staff members.

## Overview

The system tracks staff members' Discord activity to determine their online status. Staff members are considered "online" if they've been active on Discord within the last 5 minutes.

## Prerequisites

1. **Discord Bot Token**: You need a Discord bot with access to your server
2. **Discord Server (Guild) ID**: Your Discord server's ID
3. **Staff Discord IDs**: Each staff member must have their Discord ID linked in the `staff_members` table

## Setup Steps

### 1. Configure Discord Bot

Your Discord bot needs these permissions:
- `GUILD_MEMBERS` intent (to fetch guild member data)
- Read Members permission in your Discord server

The bot token is already configured in your secrets as `DISCORD_BOT_TOKEN`.

### 2. Update Guild ID

Edit `src/hooks/useStaffPresence.ts` and replace `YOUR_DISCORD_SERVER_ID` with your actual Discord server ID:

```typescript
const DISCORD_GUILD_ID = "1234567890123456789"; // Replace with your server ID
```

To find your Discord Server ID:
1. Enable Developer Mode in Discord (User Settings → Advanced → Developer Mode)
2. Right-click your server icon
3. Click "Copy Server ID"

### 3. Link Staff Discord IDs

Ensure all staff members have their `discord_id` field populated in the `staff_members` table. This is the Discord user ID (not username).

To find a Discord User ID:
1. Enable Developer Mode in Discord
2. Right-click the user
3. Click "Copy User ID"

## How It Works

### Automatic Activity Tracking

1. When a staff member logs into the website, `useStaffPresence` starts tracking their Discord activity
2. Every 2 minutes, it calls the `check-discord-activity` edge function
3. The function checks if the staff member is in the Discord server
4. If active, it updates the `last_seen` field in the database
5. Staff are considered "online" if `last_seen` is within the last 5 minutes

### Manual Sync (Optional)

You can also manually sync all staff presence data by calling the `sync-discord-presence` edge function:

```typescript
await supabase.functions.invoke("sync-discord-presence", {
  body: { guildId: "YOUR_DISCORD_SERVER_ID" }
});
```

This checks all staff members at once and updates their statuses.

## Edge Functions

### check-discord-activity
- **Purpose**: Check if a specific user is active on Discord
- **Parameters**: `{ userId, guildId }`
- **Returns**: `{ isActive, discordId, lastSeen, guildMember }`

### sync-discord-presence
- **Purpose**: Sync Discord presence for all staff members
- **Parameters**: `{ guildId }`
- **Returns**: `{ message, totalStaff, updated, timestamp }`

## Online Status Determination

A staff member is considered **online** if:
- They are a member of the Discord server (guild)
- Their `last_seen` timestamp is within the last 5 minutes

**Note**: Due to Discord API limitations without Gateway connection, we cannot detect:
- Exact presence status (Online, Idle, DND, Invisible)
- Real-time status changes
- Activity details

The system treats all guild members as "potentially active" and relies on periodic checks to update the `last_seen` field.

## Troubleshooting

### Staff Showing as Offline

1. Verify the staff member's `discord_id` is correct in the database
2. Confirm the bot is in the Discord server and has proper permissions
3. Check that `DISCORD_BOT_TOKEN` is correctly configured
4. Ensure the Discord server ID is correct in `useStaffPresence.ts`
5. Check edge function logs for errors

### Bot Permission Issues

If you get 403 errors:
1. Ensure the bot has "Read Members" permission
2. Enable the `GUILD_MEMBERS` intent in Discord Developer Portal
3. Re-invite the bot to your server with updated permissions

## Limitations

- Discord's public API does not expose real-time presence without a Gateway connection
- Invisible users cannot be detected (this is by design for privacy)
- Status updates have a 2-minute polling interval (configurable)
- The system determines activity by guild membership, not actual Discord client status
