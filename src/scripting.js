(async function (scripting) {
    scripting.prime = {
        waitForAdTimer: async function (id, settings) {
            let interval

            function parseTimeToSeconds(time) {
                const [minutes, seconds] = time.split(':').map(Number)
                return minutes * 60 + seconds
            }
            console.log('Waiting for ad timer...')
            await new Promise(resolve => {
                interval = setInterval(async () => {
                    const remainingTimeEl = document.querySelector('#dv-web-player.dv-player-fullscreen [class*="ad-timer-remaining-time"]')
                    if (remainingTimeEl) {
                        clearInterval(interval)
                        // Send a message to the background script
                        try {
                            chrome.runtime.sendMessage(id, { event: 'adTimerFound' }, resolve)
                        } catch (error) {
                            if (chrome.runtime.lastError) {
                                console.error('Error sending message:', chrome.runtime.lastError)
                            }
                            if (error) {
                                console.error('Error sending message:', error)
                            }
                        }
                    }
                })
            })

            const adTimerEl = document.querySelector('[class*="atvwebplayersdk-ad-timer"]')
            const rect = adTimerEl.getBoundingClientRect()

            // Calculate the clip-path based on the element's bounding box
            const clipPath = `polygon(
                0% 0%, 
                100% 0%, 
                100% 100%, 
                0% 100%, 
                0% ${rect.top}px, 
                ${rect.left}px ${rect.top}px, 
                ${rect.left}px ${rect.bottom}px, 
                ${rect.right}px ${rect.bottom}px, 
                ${rect.right}px ${rect.top}px, 
                0% ${rect.top}px
            )`
            // Create the iframe element
            const iframe = document.createElement('iframe')
            iframe.style.clipPath = clipPath
            iframe.src = `https://blur.june07.com/advoid?extensionId=${id}` // `https://dev-blur.keycloak.june07.com/advoid?extensionId=${id}`
            iframe.className = 'fade-in'

            // Append the iframe to the body
            document.body.appendChild(iframe)

            requestAnimationFrame(() => {
                // Add the visible class to trigger the fade-in effect
                iframe.classList.add('visible')
            })

            console.log('Waiting for ads to complete...')
            let stats = {
                avoided: 0,
                timeSaved: 500
            }
            await new Promise(resolve => {
                interval = setInterval(() => {
                    const timer = document.querySelector('[class*="ad-timer-remaining-time"]')
                    const timeLeft = parseTimeToSeconds(timer.innerText)
                    const adTimerCounterEl = document.querySelector('[class*="atvwebplayersdk-ad-timer-counter"]')
                    const totalAds = parseInt(adTimerCounterEl.innerText.split(/of|\//g)[1])
                    const currentAd = parseInt(adTimerCounterEl.innerText.split(/of|\//g)[0])

                    if (stats.avoided < currentAd) {
                        chrome.runtime.sendMessage(id, { event: 'adAvoided', timeSaved: stats.timeSaved })
                        stats.avoided += 1
                    }
                    if (!timer || timeLeft <= 1) {
                        clearInterval(interval)
                        chrome.runtime.sendMessage(id, { event: 'adsCompleted' }, resolve)
                    }
                    stats.timeSaved += 500
                }, 500)
            })

            // show a message and then remove the overlay
            console.log('Ads successfully avoided!')
            setTimeout(() => {
                document.body.removeChild(iframe)

                if (settings.pauseAfterAds === 'true') {
                    setTimeout(() => {
                        Array.from(document.querySelectorAll('video')).find(v => `${v.src}`.startsWith('blob')).pause()
                    }, settings.pauseDelay)
                }
                chrome.runtime.sendMessage(id, { event: 'adsAvoided' })
            }, 1500)
        }
    }
})(typeof module !== 'undefined' && module.exports ? module.exports : (self.scripting = self.scripting || {}))