(async function (analytics) {
    analytics.push = async (options) => {
        const userInfo = (await chrome.storage.local.get('userInfo')).userInfo || await utilities.getUserInfo()

        await fetch(`https://api.june07.com/mfa/${options.event}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                source: 'mfa',
                userInfo,
                onInstalledReason: options.onInstalledReason
            })
        })
    }
})(typeof module !== 'undefined' && module.exports ? module.exports : (self.analytics = self.analytics || {}))