document.addEventListener('DOMContentLoaded', async function () {
    const settings = await getSettings()
    const settingSelect = document.getElementById('settingSelect')
    const settingsCheckboxPause = document.getElementById('settingsCheckboxPause')
    let timeoutId

    function closePage() {
        // Close the page after 5 seconds if no mouse movement is detected
        timeoutId = setTimeout(() => {
            window.close() // Close the page
        }, 5000)
    }

    // Cancel the close action if any mouse movement is detected
    function cancelCloseAction() {
        clearTimeout(timeoutId) // Cancel the timeout
        window.removeEventListener('mousemove', cancelCloseAction) // Remove the event listener so it doesn't trigger again
    }

    chrome.runtime.sendMessage({ type: 'getAudioAction' }, function (action) {
        if (action === 'bell') {
            document.getElementById('bell').play()
        } else if (typeof action === 'string' && action.startsWith('voice')) {
            const utterance = action.split(':')[1]

            const speech = new SpeechSynthesisUtterance(utterance)
            speech.lang = 'en-US'
            speech.volume = 1
            speech.rate = 1
            speech.pitch = 1
            window.speechSynthesis.speak(speech)
        }
    })

    document.getElementById('adsAvoided').innerHTML = (await chrome.storage.local.get('adsAvoided'))?.adsAvoided || 0
    document.getElementById('timeSaved').innerHTML = formatDuration((await chrome.storage.local.get('timeSaved'))?.timeSaved || 0)

    settingSelect.value = settings.notificationType
    settingSelect.addEventListener('change', async function () {
        await updateSetting({ [settingSelect.name]: settingSelect.value })
    })
    settingsCheckboxPause.checked = settings.pause
    settingsCheckboxPause.addEventListener('change', async function () {
        await updateSetting({ [settingsCheckboxPause.name]: settingsCheckboxPause.checked })
    })

    // Start the 5-second timer to close the page
    closePage()

    // Add event listener to detect mouse movement and cancel the close action
    window.addEventListener('mousemove', cancelCloseAction)
})

function formatDuration(milliseconds) {
    const seconds = Number(milliseconds) / 1000
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    let result = []
    if (hours > 0) {
        result.push(`${hours} hour${hours > 1 ? 's' : ''}`)
    }
    if (minutes > 0) {
        result.push(`${minutes} minute${minutes > 1 ? 's' : ''}`)
    }
    if (remainingSeconds > 0) {
        result.push(`${remainingSeconds} second${remainingSeconds > 1 ? 's' : ''}`)
    }

    return result.join(', ') || '0 seconds'
}

function getSettings() {
    return new Promise(resolve => {
        // Sending a message from popup to service worker or background script
        chrome.runtime.sendMessage({ type: 'getSettings' }, function (settings) {
            console.log('getSettings:', JSON.stringify(settings))
            resolve(settings)
        })
    })
}

async function updateSetting(setting) {
    return new Promise(resolve => {
        chrome.runtime.sendMessage({ type: 'updateSetting', setting }, function (response) {
            console.log('updateSetting:', response)
            resolve(response)
        })
    })
}