document.addEventListener('mousemove', function () {
    document.getElementById('main').classList.remove('d-none')
})
document.addEventListener('DOMContentLoaded', async function () {
    const settings = await getSettings()
    const notificationType = document.getElementById('notificationType')
    const pauseAfterAds = document.getElementById('pauseAfterAds')
    const pauseDelay = document.getElementById('pauseDelay')
    const pauseDelayContainer = document.querySelector('.pause-delay-container')
    const cardTitle = document.querySelector('.card-title')
    const cardText = document.querySelector('.card-text')
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

    notificationType.value = settings.notificationType
    notificationType.addEventListener('change', async function () {
        await updateSetting({ [notificationType.id]: notificationType.value })
    })
    notificationType.addEventListener('mouseenter', async function () {
        cardTitle.textContent = 'Notification Type'
        cardText.textContent = 'Choose the type of notification to hear.'
    })

    pauseAfterAds.checked = settings.pause
    pauseAfterAds.addEventListener('change', async function () {
        await updateSetting({ [pauseAfterAds.id]: pauseAfterAds.checked })
        togglePauseDelay()
    })
    pauseAfterAds.addEventListener('mouseenter', async function () {
        cardTitle.textContent = 'Pause After Ads'
        cardText.textContent = 'Choose whether to pause after ads are completed.'
    })

    pauseDelay.value = settings.pauseDelay / 1000
    pauseDelay.addEventListener('change', async function () {
        await updateSetting({ [pauseDelay.id]: pauseDelay.value * 1000 })
    })
    pauseDelay.addEventListener('mouseenter', async function () {
        cardTitle.textContent = 'Pause Delay'
        cardText.textContent = 'Choose the number of seconds to pause after ads are completed.'
    })

    // Function to toggle the visibility of the pause delay input
    function togglePauseDelay() {
        if (pauseAfterAds.value === 'true') {
            pauseDelayContainer.classList.remove('d-none')
        } else {
            pauseDelayContainer.classList.add('d-none')
        }
    }

    // Initialize visibility on page load
    togglePauseDelay()

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

function getStats() {
    return new Promise(resolve => {
        // Sending a message from popup to service worker or background script
        chrome.runtime.sendMessage({ action: 'getStats' }, function (stats) {
            console.log('getStats:', JSON.stringify(stats))
            resolve(stats)
        })
    })
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