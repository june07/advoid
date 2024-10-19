importScripts(
    '../dist/socket.io.min.js',
    './utilities.js',
    './google-analytics.js',
    './settings.js',
    './scripting.js',
)

const INSTALL_URL = 'https://june07.com/advoid-install/?utm_source=advoid&utm_medium=chrome_extension&utm_campaign=extension_install&utm_content=1'
const APP_SERVER = 'https://api.june07.com'
let cache = {
    injected: {},
    audioAction: undefined,
}
let sio

async function initSocketIO() {
    sio = io(APP_SERVER + '/blur/advoid', {
        transports: ['websocket'],
        query: {
            userId: await userId(),
        }
    })
    sio
        .on('connect', () => {
            console.info('connected to BLUR ADvoid namespace')
        })
        .on('connect_error', error => {
            console.error('connect error from BLUR ADvoid namespace: ', error)
        })
        .on('disconnect', reason => {
            console.info('disconnected from BLUR ADvoid namespace: ', reason)
        })
        .on('error', errorMessage => {
            console.error('error from BLUR ADvoid namespace: ', errorMessage)
        })
}
function generateSecureRandomString(length) {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789-_'
    const alphabetLength = alphabet.length
    let randomString = ''

    const randomValues = new Uint8Array(length)
    crypto.getRandomValues(randomValues)

    for (let i = 0; i < length; i++) {
        randomString += alphabet[randomValues[i] % alphabetLength]
    }

    return randomString
}
function injectListener(tabId) {
    const timestamp = Date.now()

    if (cache.injected[tabId]) {
        return
    }
    cache.injected[tabId] = timestamp
    Promise.all([
        chrome.scripting.insertCSS({
            target: { tabId, allFrames: false },
            files: ["src/scripting.css", "dist/animate.min.css"]
        })
    ]).then(async () => {
        chrome.scripting.executeScript({
            target: { tabId },
            func: scripting.prime.waitForAdTimer,
            world: 'MAIN',
            args: [chrome.runtime.id, settings]
        })
    }).finally(() => {
        delete cache.injected[tabId]
    })
}
let debounceTimeout
function debouncer(func, delay) {
    if (debounceTimeout) return

    return (...args) => {
        setTimeout(() => {
            delete debounceTimeout
        }, delay)
        func.apply(this, args)
    }
}
async function setMuteState(tabId, muted) {
    const tab = await chrome.tabs.get(tabId)

    await chrome.tabs.update(tabId, { muted })

    console.log(`Tab ${tab.id} is ${muted ? "muted" : "unmuted"}`)
}
async function init() {
    initSocketIO()
}

init()
async function userId() {
    let userId = (await chrome.storage.local.get('userId'))?.userId

    if (userId) {
        return userId
    }

    userId = generateSecureRandomString(21)
    await chrome.storage.local.set({
        userId
    })

    return userId
}
chrome.runtime.onInstalled.addListener(details => {
    if (details.reason === 'install') {
        chrome.tabs.create({ url: INSTALL_URL })
        // analytics.push({ event: 'install', onInstalledReason: details.reason })
        googleAnalytics.fireEvent('install', { onInstalledReason: details.reason })
    }
})
chrome.webNavigation.onCompleted.addListener(details => {
    const { url, tabId } = details

    if (url.match('https://www.amazon.com/gp/video')) {
        const func = debouncer(injectListener, 3000)

        if (func) {
            func(tabId)
        }
    }
}, {
    url: [
        { urlMatches: 'https:\/\/www\.amazon\.com\/gp\/video' },
    ]
})
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    switch (message.type) {
        case 'getSettings':
            settings.get(settings).then(sendResponse(settings))
            break
        case 'updateSetting':
            settings.set({ [Object.keys(message.setting)[0]]: Object.values(message.setting)[0] })
            break
        case 'getAudioAction':
            sendResponse(cache.audioAction, cache.audioAction = false)
            break
        case 'getStats':
            chrome.storage.local.get(['adsAvoided', 'timeSaved']).then((settings) => sendResponse(settings))
            break
    }
    return true
})
chrome.runtime.onMessageExternal.addListener(async (message, sender, sendResponse) => {
    if (message.event === 'adTimerFound') {
        setMuteState(sender.tab.id, true)
        sendResponse()
    } else if (message.event === 'adsCompleted') {
        setMuteState(sender.tab.id, false)
        sendResponse()
    } else if (message.event === 'adsAvoided') {
        if (settings.notificationType === 'voice') {
            cache.audioAction = 'voice:Your movie is ready.'
            await chrome.action.openPopup()
        } else if (settings.notificationType === 'bell') {
            cache.audioAction = 'bell'
            await chrome.action.openPopup()
        }
        sendResponse()
    } else if (message.event === 'adAvoided') {
        // analytics.push({ event: 'adAvoided' })
        const { adsAvoided, timeSaved } = await chrome.storage.local.get(['adsAvoided', 'timeSaved'])
        const updatedAdsAvoided = adsAvoided ? adsAvoided + 1 : 1

        await Promise.all([
            chrome.storage.local.set({ adsAvoided: updatedAdsAvoided }),
            chrome.storage.local.set({ timeSaved: timeSaved ? timeSaved + message.timeSaved : message.timeSaved })
        ])
        sio.emit('adAvoided', {
            adsAvoided: updatedAdsAvoided,
            timeSaved: timeSaved + message.timeSaved
        })
        sendResponse()
    }
    if (message.action === 'getStats') {
        const { adsAvoided, timeSaved } = await chrome.storage.local.get(['adsAvoided', 'timeSaved'])

        sendResponse({ adsAvoided, timeSaved })
    } else if (message.action === 'getUserId') {
        sendResponse(await userId())
    }
    return true
})