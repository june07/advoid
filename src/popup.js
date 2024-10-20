document.addEventListener('mousemove', function () {
    Array.from(document.querySelectorAll('.d-none')).forEach(el => el.classList.remove('d-none'))
    document.removeEventListener('mousemove', this)
})
document.addEventListener('DOMContentLoaded', async function () {
    let settings = await getSettings()

    const notificationType = document.getElementById('notificationType')
    const pauseAfterAds = document.getElementById('pauseAfterAds')
    const pauseDelay = document.getElementById('pauseDelay')
    const pauseDelayContainer = document.querySelector('.pause-delay-container')
    const cardTitle = document.querySelector('.card-title')
    const cardText = document.querySelector('.card-text')
    const cardTitleOG = cardTitle.innerHTML
    const cardTextOG = cardText.innerHTML
    let timeoutId, timeout

    notificationType.value = settings.notificationType
    pauseAfterAds.value = settings.pauseAfterAds
    pauseDelay.value = settings.pauseDelay / 1000

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
    function resetCardText() {
        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(() => {
            if (cardTitleOG && cardTextOG) {
                cardTitle.innerHTML = cardTitleOG
                cardText.innerHTML = cardTextOG
            }
        }, 1500)
    }
    // Function to toggle the visibility of the pause delay input
    function togglePauseDelay() {
        if (pauseAfterAds.value == 'false') {
            if (!pauseDelayContainer.classList.contains('hide')) {
                console.log(pauseDelayContainer.classList.contains('hide'), pauseDelayContainer.classList)
                pauseDelayContainer.classList.add('hide')
                console.log(pauseDelayContainer.classList.contains('hide'), pauseDelayContainer.classList)
            }
        } else {
            pauseDelayContainer.classList.remove('hide')
        }
    }

    notificationType.addEventListener('change', async function () {
        await updateSetting({ [notificationType.id]: notificationType.value })
    })
    notificationType.addEventListener('mouseenter', async function () {
        if (timeout) clearTimeout(timeout)
        cardTitle.textContent = 'Notification Type'
        cardText.textContent = 'Audible notification when ads are completed.'
    })
    notificationType.addEventListener('mouseleave', async function () {
        resetCardText()
    })

    pauseAfterAds.addEventListener('change', async function () {
        await updateSetting({ [pauseAfterAds.id]: pauseAfterAds.value })
        togglePauseDelay()
        console.log('pauseAfterAds: ', pauseAfterAds.value)
    })
    pauseAfterAds.addEventListener('mouseenter', async function () {
        if (timeout) clearTimeout(timeout)
        cardTitle.textContent = 'Pause After Ads'
        cardText.textContent = 'Pause after ads are completed.'
    })
    pauseAfterAds.addEventListener('mouseleave', async function () {
        resetCardText()
    })

    pauseDelay.addEventListener('change', async function () {
        await updateSetting({ [pauseDelay.id]: pauseDelay.value * 1000 })
    })
    pauseDelay.addEventListener('mouseenter', async function () {
        if (timeout) clearTimeout(timeout)
        cardTitle.textContent = 'Pause Delay'
        cardText.textContent = 'Seconds into the movie to pause.'
    })
    pauseDelay.addEventListener('mouseleave', async function () {
        resetCardText()
    })

    // Initialize visibility on page load
    togglePauseDelay()
    playAudioIfNecessary()
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
        chrome.runtime.sendMessage({ action: 'getStats' }, resolve)
    })
}

function getSettings() {
    return new Promise(resolve => {
        // Sending a message from popup to service worker or background script
        chrome.runtime.sendMessage({ type: 'getSettings' }, resolve)
    })
}

async function updateSetting(setting) {
    await chrome.runtime.sendMessage({ type: 'updateSetting', setting })
}

async function playAudioIfNecessary() {
    return new Promise(resolve => {
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
            resolve()
        })

    })
}