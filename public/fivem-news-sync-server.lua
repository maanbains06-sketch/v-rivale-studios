-- SKYLIFE ROLEPLAY - FiveM to City Chronicle News Sync
-- Complete integration with live screenshots & video recording
--
-- SETUP:
-- 1. Place files in resources/[skylife]/news-sync/
-- 2. fxmanifest.lua:
--    fx_version 'cerulean'
--    game 'gta5'
--    server_script 'server.lua'
--    client_script 'client.lua'
--    dependency 'screenshot-basic'  -- Required for live screenshots
-- 3. Update WEBHOOK_URL below
-- 4. Add 'ensure screenshot-basic' and 'ensure news-sync' to server.cfg
--
-- REQUIREMENTS:
--   - screenshot-basic (for live screenshots): https://github.com/citizenfx/screenshot-basic
--   - For video recording: Uses GTA V's native replay/recording system

local WEBHOOK_URL = "https://obirpzwvnqveddyuulsb.supabase.co/functions/v1/fivem-news-webhook"

-- ═══════════════════════════════════════════
-- SCREENSHOT HELPER - Takes live game screenshot
-- ═══════════════════════════════════════════
function TakeScreenshotAndSend(eventName, data)
    -- Request screenshot from the relevant player's client
    local targetPlayer = data._source or source
    if targetPlayer and targetPlayer > 0 then
        TriggerClientEvent('skylife:news:captureAndSend', targetPlayer, eventName, data)
    else
        -- No player target, send without screenshot
        SendNewsWebhook(data)
    end
end

-- ═══════════════════════════════════════════
-- DEATH EVENT
-- ═══════════════════════════════════════════
RegisterNetEvent('skylife:news:playerDeath')
AddEventHandler('skylife:news:playerDeath', function(data)
    data.event_type = "death"
    data.character_name = data.victim_name or "Unknown"
    data._source = source
    TakeScreenshotAndSend('playerDeath', data)
end)

-- ═══════════════════════════════════════════
-- ARREST EVENT
-- ═══════════════════════════════════════════
RegisterNetEvent('skylife:news:playerArrest')
AddEventHandler('skylife:news:playerArrest', function(data)
    data.event_type = "arrest"
    data.character_name = data.suspect_name or "Unknown"
    data._source = source
    TakeScreenshotAndSend('playerArrest', data)
end)

-- ═══════════════════════════════════════════
-- SHOOTOUT EVENT
-- ═══════════════════════════════════════════
RegisterNetEvent('skylife:news:shootout')
AddEventHandler('skylife:news:shootout', function(data)
    data.event_type = "shootout"
    data.character_name = data.primary_name or "Unknown Suspects"
    data._source = source
    TakeScreenshotAndSend('shootout', data)
end)

-- ═══════════════════════════════════════════
-- POLICE CHASE - START (begins recording)
-- ═══════════════════════════════════════════
local activeChases = {} -- Track ongoing chases

RegisterNetEvent('skylife:news:chaseStart')
AddEventHandler('skylife:news:chaseStart', function(data)
    local chaseId = data.chase_id or tostring(source) .. "_" .. tostring(os.time())
    activeChases[chaseId] = {
        suspect_name = data.suspect_name or "Unknown Suspect",
        officer_name = data.officer_name or "LSPD Unit",
        vehicle = data.vehicle or "Unknown Vehicle",
        start_location = data.location or "Los Santos",
        start_time = os.time(),
        source_player = source
    }
    
    -- Tell the client to start recording
    TriggerClientEvent('skylife:news:startRecording', source, chaseId)
    
    -- Also tell the officer's client if different
    if data.officer_source and data.officer_source ~= source then
        TriggerClientEvent('skylife:news:startRecording', data.officer_source, chaseId)
    end
    
    print("[NEWS-SYNC] 🚔 Chase started: " .. chaseId)
end)

-- ═══════════════════════════════════════════
-- POLICE CHASE - END (stops recording, sends article)
-- ═══════════════════════════════════════════
RegisterNetEvent('skylife:news:chaseEnd')
AddEventHandler('skylife:news:chaseEnd', function(data)
    local chaseId = data.chase_id
    local chaseData = chaseId and activeChases[chaseId]
    
    if not chaseData then
        -- No tracked chase, just send as regular event
        data.event_type = "chase"
        data.character_name = data.suspect_name or "Unknown"
        data._source = source
        TakeScreenshotAndSend('chase', data)
        return
    end
    
    local duration = os.time() - chaseData.start_time
    local durationStr = string.format("%d minutes %d seconds", math.floor(duration / 60), duration % 60)
    
    -- Stop recording on clients
    TriggerClientEvent('skylife:news:stopRecording', chaseData.source_player, chaseId)
    
    -- Build the news payload
    local payload = {
        event_type = "chase",
        character_name = chaseData.suspect_name,
        location = data.end_location or chaseData.start_location,
        details = string.format(
            "A high-speed pursuit began near %s when %s fled from %s in a %s. The chase lasted %s and ended at %s. %s",
            chaseData.start_location,
            chaseData.suspect_name,
            chaseData.officer_name,
            chaseData.vehicle,
            durationStr,
            data.end_location or "an undisclosed location",
            data.end_reason or "The suspect was apprehended."
        ),
        officer_name = chaseData.officer_name,
        vehicle = chaseData.vehicle,
        chase_duration = durationStr,
        chase_end_reason = data.end_reason or "Suspect apprehended",
        involved_parties = chaseData.officer_name,
        screenshot_url = data.screenshot_url or nil,
        video_url = data.video_url or nil
    }
    
    SendNewsWebhook(payload)
    activeChases[chaseId] = nil
    print("[NEWS-SYNC] 🚔 Chase ended: " .. chaseId .. " (" .. durationStr .. ")")
end)

-- ═══════════════════════════════════════════
-- COURT CASE EVENT
-- ═══════════════════════════════════════════
RegisterNetEvent('skylife:news:courtCase')
AddEventHandler('skylife:news:courtCase', function(data)
    data.event_type = "court_case"
    data.character_name = data.defendant_name or "Unknown"
    data._source = source
    TakeScreenshotAndSend('courtCase', data)
end)

-- ═══════════════════════════════════════════
-- VEHICLE IMPOUND EVENT
-- ═══════════════════════════════════════════
RegisterNetEvent('skylife:news:vehicleImpound')
AddEventHandler('skylife:news:vehicleImpound', function(data)
    data.event_type = "impound"
    data.character_name = data.owner_name or "Unknown Owner"
    data._source = source
    TakeScreenshotAndSend('vehicleImpound', data)
end)

-- ═══════════════════════════════════════════
-- GENERAL EVENT
-- ═══════════════════════════════════════════
RegisterNetEvent('skylife:news:cityEvent')
AddEventHandler('skylife:news:cityEvent', function(data)
    data.event_type = "event"
    data.character_name = data.organizer_name or "City Officials"
    data._source = source
    TakeScreenshotAndSend('cityEvent', data)
end)

-- ═══════════════════════════════════════════
-- RECEIVE SCREENSHOT FROM CLIENT & SEND
-- ═══════════════════════════════════════════
RegisterNetEvent('skylife:news:screenshotReady')
AddEventHandler('skylife:news:screenshotReady', function(data)
    SendNewsWebhook(data)
end)

-- ═══════════════════════════════════════════
-- RECEIVE VIDEO URL FROM CLIENT
-- ═══════════════════════════════════════════
RegisterNetEvent('skylife:news:videoReady')
AddEventHandler('skylife:news:videoReady', function(chaseId, videoUrl)
    -- If we still have chase data waiting, attach the video
    if activeChases[chaseId] then
        activeChases[chaseId].video_url = videoUrl
    end
end)

-- ═══════════════════════════════════════════
-- WEBHOOK SENDER
-- ═══════════════════════════════════════════
function SendNewsWebhook(payload)
    -- Clean internal fields
    payload._source = nil
    
    PerformHttpRequest(WEBHOOK_URL, function(errorCode, resultData, resultHeaders)
        if errorCode == 200 then
            local result = json.decode(resultData)
            if result and result.headline then
                print("[NEWS-SYNC] ✅ Published: " .. result.headline)
            else
                print("[NEWS-SYNC] ✅ Article published successfully")
            end
        else
            print("[NEWS-SYNC] ❌ Failed to publish. Error: " .. tostring(errorCode))
        end
    end, "POST", json.encode(payload), {
        ["Content-Type"] = "application/json"
    })
end

-- ═══════════════════════════════════════════
-- AUTO-DETECT DEATHS (hook into base events)
-- ═══════════════════════════════════════════
AddEventHandler('baseevents:onPlayerDied', function(killerType, deathCoords)
    local src = source
    local playerName = GetPlayerName(src) or "Unknown"
    
    TriggerEvent('skylife:news:playerDeath', {
        victim_name = playerName,
        location = "Los Santos",
        details = "An individual was found deceased under suspicious circumstances."
    })
end)

AddEventHandler('baseevents:onPlayerKilled', function(killerId, deathData)
    local src = source
    local victimName = GetPlayerName(src) or "Unknown"
    local killerName = killerId and GetPlayerName(killerId) or "Unknown Assailant"
    
    TriggerEvent('skylife:news:shootout', {
        primary_name = victimName,
        location = "Los Santos",
        details = "A violent confrontation left one individual deceased.",
        involved = killerName,
        weapon_type = deathData and deathData.weapon or "Unknown"
    })
end)

-- ═══════════════════════════════════════════
-- MANUAL TRIGGER COMMANDS (for testing)
-- ═══════════════════════════════════════════
RegisterCommand("news-death", function(source, args)
    TriggerEvent('skylife:news:playerDeath', {
        victim_name = args[1] or "John Doe",
        location = args[2] or "Grove Street",
        details = table.concat(args, " ", 3) or "An individual was found deceased."
    })
end, true)

RegisterCommand("news-arrest", function(source, args)
    TriggerEvent('skylife:news:playerArrest', {
        suspect_name = args[1] or "John Doe",
        charges = args[2] or "Undisclosed charges",
        officer_name = args[3] or "Officer Smith"
    })
end, true)

RegisterCommand("news-chase-start", function(source, args)
    TriggerEvent('skylife:news:chaseStart', {
        chase_id = "test_chase_" .. tostring(os.time()),
        suspect_name = args[1] or "Speed Demon",
        officer_name = args[2] or "Officer Johnson",
        vehicle = args[3] or "Black Sultan RS",
        location = "Vinewood Blvd"
    })
end, true)

RegisterCommand("news-chase-end", function(source, args)
    -- Find active chase
    for chaseId, _ in pairs(activeChases) do
        TriggerEvent('skylife:news:chaseEnd', {
            chase_id = chaseId,
            end_location = args[1] or "Los Santos Freeway",
            end_reason = args[2] or "Suspect vehicle crashed into a barrier"
        })
        break
    end
end, true)

RegisterCommand("news-shootout", function(source, args)
    TriggerEvent('skylife:news:shootout', {
        primary_name = args[1] or "Unknown Suspects",
        location = args[2] or "Downtown",
        details = table.concat(args, " ", 3) or "Shots fired in the area."
    })
end, true)

RegisterCommand("news-impound", function(source, args)
    TriggerEvent('skylife:news:vehicleImpound', {
        owner_name = args[1] or "Unknown",
        vehicle_name = args[2] or "Adder",
        officer_name = args[3] or "Officer Smith"
    })
end, true)

RegisterCommand("news-court", function(source, args)
    TriggerEvent('skylife:news:courtCase', {
        defendant_name = args[1] or "John Doe",
        charges = args[2] or "Grand Theft Auto",
        verdict = args[3] or "Guilty",
        judge_name = "Honorable Judge Williams"
    })
end, true)
