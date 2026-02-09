-- SKYLIFE NEWS SYNC - CLIENT SIDE
-- Place this as client.lua in your news-sync resource
-- Handles: live screenshots, chase video recording via GTA V Rockstar Editor
--
-- REQUIREMENTS: screenshot-basic resource (https://github.com/citizenfx/screenshot-basic)

local isRecording = false
local currentChaseId = nil

-- ═══════════════════════════════════════════
-- SCREENSHOT CAPTURE & SEND
-- Uses screenshot-basic to take a live in-game screenshot
-- and sends it as base64 to the webhook via server
-- ═══════════════════════════════════════════
RegisterNetEvent('skylife:news:captureAndSend')
AddEventHandler('skylife:news:captureAndSend', function(eventName, data)
    -- Small delay to let the scene settle (death animation, arrest anim, etc.)
    Citizen.Wait(1500)
    
    -- Capture screenshot using screenshot-basic
    exports['screenshot-basic']:requestScreenshotUpload(
        -- If you have a direct image upload endpoint, use it here
        -- Otherwise we use the base64 method below
        nil, -- We'll use requestScreenshot instead
        'files[]',
        {encoding = 'jpg', quality = 0.85},
        function(url)
            -- If upload endpoint is configured, we get a URL back
            if url and url ~= "" then
                data.screenshot_url = url
            end
            -- Send to server
            TriggerServerEvent('skylife:news:screenshotReady', data)
        end
    )
end)

-- Alternative: Capture as base64 (no upload endpoint needed)
-- This sends the raw image data to the webhook which uploads it to storage
RegisterNetEvent('skylife:news:captureBase64AndSend')
AddEventHandler('skylife:news:captureBase64AndSend', function(eventName, data)
    Citizen.Wait(1500)
    
    exports['screenshot-basic']:requestScreenshot(
        {encoding = 'jpg', quality = 0.80},
        function(base64Data)
            -- Remove the data:image/jpeg;base64, prefix if present
            local cleanBase64 = base64Data
            if string.find(base64Data, "base64,") then
                cleanBase64 = string.sub(base64Data, string.find(base64Data, "base64,") + 7)
            end
            
            data.screenshot_base64 = cleanBase64
            TriggerServerEvent('skylife:news:screenshotReady', data)
        end
    )
end)


-- ═══════════════════════════════════════════
-- CHASE VIDEO RECORDING
-- Uses GTA V's native recording system
-- Records gameplay during chase, saves clip
-- ═══════════════════════════════════════════

RegisterNetEvent('skylife:news:startRecording')
AddEventHandler('skylife:news:startRecording', function(chaseId)
    if isRecording then return end
    
    isRecording = true
    currentChaseId = chaseId
    
    -- Start GTA V game recording
    StartRecording(1) -- 1 = start recording
    
    -- Show notification to player
    ShowNotification("~r~📹 NEWS SYNC~s~\n~w~Recording chase footage...")
    
    print("[NEWS-SYNC] 🎥 Started recording chase: " .. chaseId)
end)

RegisterNetEvent('skylife:news:stopRecording')
AddEventHandler('skylife:news:stopRecording', function(chaseId)
    if not isRecording then return end
    if chaseId ~= currentChaseId then return end
    
    isRecording = false
    
    -- Stop GTA V recording and save
    StopRecordingAndSaveClip()
    
    ShowNotification("~g~📹 NEWS SYNC~s~\n~w~Chase footage saved!")
    
    -- Take a final screenshot as the chase-end thumbnail
    Citizen.Wait(500)
    exports['screenshot-basic']:requestScreenshot(
        {encoding = 'jpg', quality = 0.85},
        function(base64Data)
            local cleanBase64 = base64Data
            if string.find(base64Data, "base64,") then
                cleanBase64 = string.sub(base64Data, string.find(base64Data, "base64,") + 7)
            end
            
            -- Send the screenshot as chase thumbnail
            TriggerServerEvent('skylife:news:chaseEnd', {
                chase_id = chaseId,
                screenshot_base64 = cleanBase64,
                end_location = GetCurrentStreetName(),
                end_reason = "Chase concluded"
            })
        end
    )
    
    currentChaseId = nil
    print("[NEWS-SYNC] 🎥 Stopped recording chase: " .. chaseId)
end)

-- ═══════════════════════════════════════════
-- AUTO SCREENSHOT ON DEATH
-- Automatically captures when player dies
-- ═══════════════════════════════════════════
AddEventHandler('gameEventTriggered', function(name, args)
    if name == 'CEventNetworkEntityDamage' then
        local victim = args[1]
        local attacker = args[2]
        local isDead = args[4] == 1
        
        if isDead and victim == PlayerPedId() then
            -- Player died - capture the scene
            Citizen.Wait(2000) -- Wait for death animation
            
            exports['screenshot-basic']:requestScreenshot(
                {encoding = 'jpg', quality = 0.85},
                function(base64Data)
                    local cleanBase64 = base64Data
                    if string.find(base64Data, "base64,") then
                        cleanBase64 = string.sub(base64Data, string.find(base64Data, "base64,") + 7)
                    end
                    
                    -- The server will handle creating the news article
                    -- This just provides the screenshot to the existing death handler
                    TriggerServerEvent('skylife:news:deathScreenshot', cleanBase64)
                end
            )
        end
    end
end)


-- ═══════════════════════════════════════════
-- HELPER FUNCTIONS
-- ═══════════════════════════════════════════

function GetCurrentStreetName()
    local playerCoords = GetEntityCoords(PlayerPedId())
    local streetHash, crossingHash = GetStreetNameAtCoord(playerCoords.x, playerCoords.y, playerCoords.z)
    local streetName = GetStreetNameFromHashKey(streetHash)
    local crossingName = GetStreetNameFromHashKey(crossingHash)
    
    if crossingName and crossingName ~= "" then
        return streetName .. " & " .. crossingName
    end
    return streetName or "Los Santos"
end

function ShowNotification(text)
    SetNotificationTextEntry("STRING")
    AddTextComponentString(text)
    DrawNotification(false, true)
end

function StopRecordingAndSaveClip()
    if IsRecording() then
        StopRecording()
    end
    -- Note: GTA V saves recordings to Rockstar Editor
    -- For direct video upload, you'd need a custom solution
    -- like OBS websocket or a screen capture utility
    --
    -- ADVANCED: If you want to auto-upload the video:
    -- 1. Use a Discord webhook to upload the clip
    -- 2. Or use an external recording tool with API (OBS, Medal, etc.)
    -- 3. Then send the URL via: TriggerServerEvent('skylife:news:videoReady', chaseId, videoUrl)
end

-- ═══════════════════════════════════════════
-- VIDEO UPLOAD VIA DISCORD WEBHOOK (Optional)
-- If you have a Discord channel for video uploads,
-- the bot can extract the URL for the news article
-- ═══════════════════════════════════════════
--[[
-- Example: Upload video via Discord webhook
function UploadVideoToDiscord(chaseId, videoPath)
    -- This requires a custom implementation
    -- Discord webhooks support file uploads up to 25MB
    -- 
    -- After upload, send the URL back:
    -- TriggerServerEvent('skylife:news:videoReady', chaseId, discordVideoUrl)
end
]]--
