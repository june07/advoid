(async function (analytics) {
    analytics.push = async (options) => {
        const userInfo = (await chrome.storage.local.get('userInfo')).userInfo || await utilities.getUserInfo()

        await fetch(`https://api.june07.com/advoid/${options.event}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                source: 'advoid',
                userInfo,
                onInstalledReason: options.onInstalledReason
            })
        })
    }
})(typeof module !== 'undefined' && module.exports ? module.exports : (self.analytics = self.analytics || {}))