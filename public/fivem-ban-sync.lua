-- SKYLIFE ROLEPLAY - FiveM to Website Ban Sync
-- Add this resource to your FiveM server to automatically sync permanent bans to your website
--
-- SETUP:
-- 1. Place this file in your FiveM server resources folder (e.g., resources/[skylife]/ban-sync/server.lua)
-- 2. Create a fxmanifest.lua in the same folder with:
--    fx_version 'cerulean'
--    game 'gta5'
--    server_script 'server.lua'
-- 3. Update WEBHOOK_URL below with your actual Supabase function URL
-- 4. Add 'ensure ban-sync' to your server.cfg
--
-- This script hooks into your ban system and sends permanent bans to the website webhook

local WEBHOOK_URL = "https://obirpzwvnqveddyuulsb.supabase.co/functions/v1/fivem-ban-webhook"

-- Call this function when you permanently ban a player
function SyncBanToWebsite(playerId, discordId, discordUsername, steamId, banReason, bannedBy)
    local data = {
        action = "ban",
        discord_id = discordId or "",
        discord_username = discordUsername or "",
        steam_id = steamId or "",
        fivem_id = tostring(playerId),
        ban_reason = banReason or "Permanently banned from FiveM server",
        is_permanent = true,
        banned_by = bannedBy or "FiveM Server",
        fivem_ban_id = tostring(playerId) .. "_" .. tostring(os.time())
    }

    PerformHttpRequest(WEBHOOK_URL, function(errorCode, resultData, resultHeaders)
        if errorCode == 200 then
            print("[BAN-SYNC] Successfully synced ban to website for: " .. (discordUsername or playerId))
        else
            print("[BAN-SYNC] Failed to sync ban to website. Error: " .. tostring(errorCode))
        end
    end, "POST", json.encode(data), {
        ["Content-Type"] = "application/json"
    })
end

-- Call this function when you unban a player
function SyncUnbanToWebsite(discordId, steamId)
    local data = {
        action = "unban",
        discord_id = discordId or "",
        steam_id = steamId or ""
    }

    PerformHttpRequest(WEBHOOK_URL, function(errorCode, resultData, resultHeaders)
        if errorCode == 200 then
            print("[BAN-SYNC] Successfully synced unban to website")
        else
            print("[BAN-SYNC] Failed to sync unban to website. Error: " .. tostring(errorCode))
        end
    end, "POST", json.encode(data), {
        ["Content-Type"] = "application/json"
    })
end

-- EXAMPLE: Hook into your existing ban command
-- Modify this to match YOUR ban system
RegisterCommand("permaban", function(source, args, rawCommand)
    local targetId = tonumber(args[1])
    local reason = table.concat(args, " ", 2) or "No reason provided"
    
    if targetId and GetPlayerName(targetId) then
        local identifiers = GetPlayerIdentifiers(targetId)
        local discordId, steamId = nil, nil
        
        for _, id in ipairs(identifiers) do
            if string.find(id, "discord:") then
                discordId = string.gsub(id, "discord:", "")
            elseif string.find(id, "steam:") then
                steamId = id
            end
        end
        
        -- Sync to website (only for permanent bans!)
        SyncBanToWebsite(
            targetId,
            discordId,
            GetPlayerName(targetId),
            steamId,
            reason,
            GetPlayerName(source) or "Console"
        )
        
        -- Drop the player
        DropPlayer(targetId, "You have been permanently banned: " .. reason)
        
        print("[BAN-SYNC] Player " .. GetPlayerName(targetId) .. " permanently banned and synced to website")
    end
end, true) -- restricted to ace-permitted users
