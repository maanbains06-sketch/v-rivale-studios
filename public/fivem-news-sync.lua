-- SKYLIFE ROLEPLAY - FiveM to City Chronicle News Sync
-- This script captures RP events and sends them with screenshots to your website's news system
--
-- SETUP:
-- 1. Place this folder in your FiveM server resources (e.g., resources/[skylife]/news-sync/)
-- 2. Create a fxmanifest.lua:
--    fx_version 'cerulean'
--    game 'gta5'
--    server_script 'server.lua'
--    client_script 'client.lua'
-- 3. Update WEBHOOK_URL below with your Supabase function URL
-- 4. Add 'ensure news-sync' to your server.cfg
--
-- This script hooks into your server events and generates AI-powered news articles

-- ==================== SERVER SIDE (server.lua) ====================

local WEBHOOK_URL = "https://obirpzwvnqveddyuulsb.supabase.co/functions/v1/fivem-news-webhook"

-- ═══════════════════════════════════════════
-- DEATH EVENT - When a player dies
-- ═══════════════════════════════════════════
RegisterNetEvent('skylife:news:playerDeath')
AddEventHandler('skylife:news:playerDeath', function(data)
    local payload = {
        event_type = "death",
        character_name = data.victim_name or "Unknown",
        location = data.location or "Los Santos",
        details = data.details or "An individual was found deceased.",
        screenshot_base64 = data.screenshot or nil,
        screenshot_url = data.screenshot_url or nil,
        involved_parties = data.killer_name or nil,
        weapon = data.weapon or nil,
        timestamp = os.date("%I:%M %p")
    }
    SendNewsWebhook(payload)
end)

-- ═══════════════════════════════════════════
-- ARREST EVENT - When a player is arrested
-- ═══════════════════════════════════════════
RegisterNetEvent('skylife:news:playerArrest')
AddEventHandler('skylife:news:playerArrest', function(data)
    local payload = {
        event_type = "arrest",
        character_name = data.suspect_name or "Unknown",
        location = data.location or "Los Santos",
        details = data.details or "A suspect was taken into custody.",
        screenshot_base64 = data.screenshot or nil,
        screenshot_url = data.screenshot_url or nil,
        charges = data.charges or "Undisclosed charges",
        officer_name = data.officer_name or "LSPD Officer",
        timestamp = os.date("%I:%M %p")
    }
    SendNewsWebhook(payload)
end)

-- ═══════════════════════════════════════════
-- SHOOTOUT EVENT - When a shootout occurs
-- ═══════════════════════════════════════════
RegisterNetEvent('skylife:news:shootout')
AddEventHandler('skylife:news:shootout', function(data)
    local payload = {
        event_type = "shootout",
        character_name = data.primary_name or "Unknown Suspects",
        location = data.location or "Los Santos",
        details = data.details or "Gunfire was reported in the area.",
        screenshot_base64 = data.screenshot or nil,
        screenshot_url = data.screenshot_url or nil,
        involved_parties = data.involved or nil,
        weapon = data.weapon_type or "Firearms",
        timestamp = os.date("%I:%M %p")
    }
    SendNewsWebhook(payload)
end)

-- ═══════════════════════════════════════════
-- COURT CASE EVENT
-- ═══════════════════════════════════════════
RegisterNetEvent('skylife:news:courtCase')
AddEventHandler('skylife:news:courtCase', function(data)
    local payload = {
        event_type = "court_case",
        character_name = data.defendant_name or "Unknown",
        location = data.location or "Los Santos Courthouse",
        details = data.details or "A court hearing was held.",
        screenshot_base64 = data.screenshot or nil,
        screenshot_url = data.screenshot_url or nil,
        charges = data.charges or "Undisclosed",
        judge_name = data.judge_name or "Honorable Judge",
        verdict = data.verdict or "Pending",
        timestamp = os.date("%I:%M %p")
    }
    SendNewsWebhook(payload)
end)

-- ═══════════════════════════════════════════
-- VEHICLE IMPOUND EVENT
-- ═══════════════════════════════════════════
RegisterNetEvent('skylife:news:vehicleImpound')
AddEventHandler('skylife:news:vehicleImpound', function(data)
    local payload = {
        event_type = "impound",
        character_name = data.owner_name or "Unknown Owner",
        location = data.location or "Los Santos",
        details = data.details or "A vehicle was impounded by authorities.",
        screenshot_base64 = data.screenshot or nil,
        screenshot_url = data.screenshot_url or nil,
        vehicle = data.vehicle_name or "Unknown Vehicle",
        officer_name = data.officer_name or "LSPD Officer",
        timestamp = os.date("%I:%M %p")
    }
    SendNewsWebhook(payload)
end)

-- ═══════════════════════════════════════════
-- GENERAL EVENT (Car meets, parties, etc.)
-- ═══════════════════════════════════════════
RegisterNetEvent('skylife:news:cityEvent')
AddEventHandler('skylife:news:cityEvent', function(data)
    local payload = {
        event_type = "event",
        character_name = data.organizer_name or "City Officials",
        location = data.location or "Los Santos",
        details = data.details or "A city event is taking place.",
        screenshot_base64 = data.screenshot or nil,
        screenshot_url = data.screenshot_url or nil,
        involved_parties = data.participants or nil,
        timestamp = os.date("%I:%M %p")
    }
    SendNewsWebhook(payload)
end)

-- ═══════════════════════════════════════════
-- WEBHOOK SENDER
-- ═══════════════════════════════════════════
function SendNewsWebhook(payload)
    PerformHttpRequest(WEBHOOK_URL, function(errorCode, resultData, resultHeaders)
        if errorCode == 200 then
            local result = json.decode(resultData)
            if result and result.headline then
                print("[NEWS-SYNC] ✅ Published: " .. result.headline)
            else
                print("[NEWS-SYNC] ✅ Article published successfully")
            end
        else
            print("[NEWS-SYNC] ❌ Failed to publish news. Error: " .. tostring(errorCode))
            if resultData then
                print("[NEWS-SYNC] Response: " .. tostring(resultData))
            end
        end
    end, "POST", json.encode(payload), {
        ["Content-Type"] = "application/json"
    })
end

-- ═══════════════════════════════════════════
-- AUTO-DETECT DEATHS (hook into base events)
-- Modify these to match YOUR server's death/arrest system
-- ═══════════════════════════════════════════

-- Example: Auto-detect player death
AddEventHandler('baseevents:onPlayerDied', function(killerType, deathCoords)
    local src = source
    local playerName = GetPlayerName(src) or "Unknown"
    local streetName = GetStreetName(deathCoords)
    
    -- Request screenshot from client
    TriggerClientEvent('skylife:news:requestScreenshot', src, {
        event_type = "death",
        victim_name = playerName,
        location = streetName,
        details = "An individual was found deceased under suspicious circumstances.",
        killer_type = killerType
    })
end)

-- Example: Auto-detect player killed by another
AddEventHandler('baseevents:onPlayerKilled', function(killerId, deathData)
    local src = source
    local victimName = GetPlayerName(src) or "Unknown"
    local killerName = killerId and GetPlayerName(killerId) or "Unknown Assailant"
    
    -- Request screenshot from killer's perspective
    local screenshotTarget = killerId or src
    TriggerClientEvent('skylife:news:requestScreenshot', screenshotTarget, {
        event_type = "shootout",
        primary_name = victimName,
        location = "Los Santos",
        details = "A violent confrontation left one individual deceased.",
        involved = killerName,
        weapon_type = deathData and deathData.weapon or "Unknown"
    })
end)

-- Helper: Get street name from coords
function GetStreetName(coords)
    -- This runs server-side so we just return a generic location
    -- For accurate street names, get it from the client side
    return "Los Santos"
end

-- ═══════════════════════════════════════════
-- CLIENT SIDE (client.lua) - Screenshot capture
-- Put this in a separate client.lua file
-- ═══════════════════════════════════════════
--[[
RegisterNetEvent('skylife:news:requestScreenshot')
AddEventHandler('skylife:news:requestScreenshot', function(data)
    -- Wait a moment for the scene to settle
    Citizen.Wait(500)
    
    -- Use screenshot-basic or your screenshot resource
    -- If you have screenshot-basic installed:
    exports['screenshot-basic']:requestScreenshotUpload(
        "YOUR_IMAGE_UPLOAD_ENDPOINT", -- Or use a Discord webhook to get URL
        'files[]',
        {encoding = 'jpg', quality = 0.85},
        function(url)
            data.screenshot_url = url
            TriggerServerEvent('skylife:news:' .. 
                (data.event_type == "death" and "playerDeath" or
                 data.event_type == "arrest" and "playerArrest" or
                 data.event_type == "shootout" and "shootout" or
                 data.event_type == "court_case" and "courtCase" or
                 data.event_type == "impound" and "vehicleImpound" or
                 "cityEvent"), data)
        end
    )
    
    -- Alternative: If you don't have screenshot-basic, just send without image
    -- TriggerServerEvent('skylife:news:playerDeath', data)
end)
]]--

-- ═══════════════════════════════════════════
-- MANUAL TRIGGER COMMANDS (for testing/staff use)
-- ═══════════════════════════════════════════

RegisterCommand("news-death", function(source, args, rawCommand)
    local name = args[1] or "John Doe"
    local location = args[2] or "Grove Street"
    local details = table.concat(args, " ", 3) or "An individual was found deceased."
    
    TriggerEvent('skylife:news:playerDeath', {
        victim_name = name,
        location = location,
        details = details
    })
    print("[NEWS-SYNC] Manual death report submitted for: " .. name)
end, true)

RegisterCommand("news-arrest", function(source, args, rawCommand)
    local name = args[1] or "John Doe"
    local charges = args[2] or "Undisclosed charges"
    local officer = args[3] or "Officer Smith"
    
    TriggerEvent('skylife:news:playerArrest', {
        suspect_name = name,
        charges = charges,
        officer_name = officer,
        location = "Los Santos"
    })
    print("[NEWS-SYNC] Manual arrest report submitted for: " .. name)
end, true)

RegisterCommand("news-shootout", function(source, args, rawCommand)
    local location = args[1] or "Downtown"
    local details = table.concat(args, " ", 2) or "Shots fired in the area."
    
    TriggerEvent('skylife:news:shootout', {
        primary_name = "Unknown Suspects",
        location = location,
        details = details
    })
    print("[NEWS-SYNC] Manual shootout report submitted")
end, true)

RegisterCommand("news-impound", function(source, args, rawCommand)
    local owner = args[1] or "Unknown"
    local vehicle = args[2] or "Unknown Vehicle"
    local officer = args[3] or "Officer Smith"
    
    TriggerEvent('skylife:news:vehicleImpound', {
        owner_name = owner,
        vehicle_name = vehicle,
        officer_name = officer,
        location = "LSPD Impound Lot"
    })
    print("[NEWS-SYNC] Manual impound report submitted")
end, true)

RegisterCommand("news-court", function(source, args, rawCommand)
    local defendant = args[1] or "John Doe"
    local charges = args[2] or "Undisclosed"
    local verdict = args[3] or "Pending"
    
    TriggerEvent('skylife:news:courtCase', {
        defendant_name = defendant,
        charges = charges,
        verdict = verdict,
        judge_name = "Honorable Judge",
        location = "Los Santos Courthouse"
    })
    print("[NEWS-SYNC] Manual court case submitted for: " .. defendant)
end, true)
