(async function (utilities) {
    utilities.getUserInfo = async function getUserInfo() {
        const userInfo = await chrome.identity.getProfileUserInfo()
        const encryptedUserInfo = encryptMessage(userInfo)

        chrome.storage.local.set({ userInfo: encryptedUserInfo })
        return encryptedUserInfo
    }
    utilities.encryptMessage = function encryptMessage(message) {
        const clientPrivateKey = nacl.randomBytes(32)
        const publicKey = nacl.util.decodeBase64('cXFjuDdYNvsedzMWf1vSXbymQ7EgG8c40j/Nfj3a2VU=')
        const nonce = crypto.getRandomValues(new Uint8Array(24))
        const keyPair = nacl.box.keyPair.fromSecretKey(clientPrivateKey)

        message = nacl.util.decodeUTF8(JSON.stringify(message))
        const encryptedMessage = nacl.box(message, nonce, publicKey, keyPair.secretKey)
        
        return nacl.util.encodeBase64(nonce) + ' ' + nacl.util.encodeBase64(keyPair.publicKey) + ' ' + nacl.util.encodeBase64(encryptedMessage)
    }

})(typeof module !== 'undefined' && module.exports ? module.exports : (self.utilities = self.utilities || {}))