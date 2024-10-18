const fs = require('fs')
const path = require('path')
const manifest = require('../manifest.json')

// Read the source file
const sourceFilePath = path.join(__dirname, '../src/sw.js')
const targetFilePath = path.join(__dirname, '../src/background.js')

// Function to replace importScripts with ES6 imports
function replaceImportScripts(content) {
    let update = content.replace(/importScripts\(\s*([^)]*)\s*\)/g, (match, p1) => {
        return p1
            .split(',')
            .map(script => script.trim().replace(/['"]/g, ''))
            .filter(script => script)
            .map(script => `import '${script}'`)
            .join('\n')
    })
    update = update.replace('const { client_id: clientId, scopes } = await chrome.runtime.getManifest().oauth2', `
const clientId = \'${manifest.oauth2.client_id}\'
const scopes = \'${manifest.oauth2.scopes}\'
    `)
    update = update.replace(/await chrome.runtime.getManifest\(\)\.oauth2/, `const oauth2 = ${manifest.oauth2}\noauth2`)

    return update
}

// Read the source file
fs.readFile(sourceFilePath, 'utf8', (err, data) => {
    if (err) {
        console.error(`Error reading the file ${sourceFilePath}:`, err)
        return
    }

    // Replace importScripts with ES6 imports
    const newData = replaceImportScripts(data)

    // Write the new content to the target file
    fs.writeFile(targetFilePath, newData, 'utf8', err => {
        if (err) {
            console.error(`Error writing the file ${targetFilePath}:`, err)
            return
        }
        console.log(`File has been saved as ${targetFilePath}`)
    })
})
