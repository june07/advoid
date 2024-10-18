const fs = require('fs')
const path = require('path')
const os = require('os')
const archiver = require('archiver')

const messages = require('../_locales/en/messages.json')
const package = require('../package.json')

// Define paths
const originalManifestPath = './manifest.json'
const chromeManifestPath = path.join(os.tmpdir(), 'chromeManifest.json')
const edgeManifestPath = path.join(os.tmpdir(), 'edgeManifest.json')
const firefoxManifestPath = path.join(os.tmpdir(), 'firefoxManifest.json')

function writeChromeManifest(originalManifest) {
    const manifest = { ...originalManifest }
    // Write back updated manifest
    fs.writeFile(chromeManifestPath, JSON.stringify(manifest, null, 4), 'utf8', async (err) => {
        if (err) {
            console.error('Error writing updated manifest:', err)
            return
        }
        console.log('Manifest updated successfully.')

        // Zip files
        const output = fs.createWriteStream(`${messages.appName.message.replace(/ /g, '_')}-chrome-${manifest.version}.zip`)
        const archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
        })

        output.on('close', () => {
            console.log('Zip file created successfully.')
        })

        archive.on('error', (err) => {
            console.error('Error creating zip file:', err)
        })

        archive.pipe(output)
        archive.directory('./src', 'src')
        archive.directory('./icon', 'icon')
        archive.file(chromeManifestPath, { name: 'manifest.json' })
        archive.directory('./_locales', '_locales')

        console.log({ chromeManifestPath })
        await archive.finalize()
        fs.rmSync(chromeManifestPath)
    })
}
function writeEdgeManifest(originalManifest) {
    const manifest = { ...originalManifest }

    // manifest.key = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAieSVJ9PZQjcEqEB9Xp7If2ER2j2JrvpCBJwVBKxu27+6fSrIyO6zBppku/8ZZYnlkw62k5jedxri96zeCscxWeCVgFO6TasVpTr+LtHZyVQL6u99cSInBk25RcO1jqv6hLiplkq3U4Rnuxa85p52Z0KkckM96/L7GhUjL6sej97QVBvk4lO27NAnz9GV14n6MkPWmcP2J6kFtDCl1H6X/P/z7oLXn9+ScgTYUh3izxKkodBubMlEO4UYXV3LCmBR7Wx6yLhxtontuO7mr2PzFiJ9A2VABfHMDFc9T/BBU0w5kTMp4jU5HR0+bLZVn/06No5De0G3R+V7OK5oPbhE0wIDAQAB"
    delete manifest.key
    // Write back updated manifest
    fs.writeFile(edgeManifestPath, JSON.stringify(manifest, null, 4), 'utf8', async (err) => {
        if (err) {
            console.error('Error writing updated manifest:', err)
            return
        }
        console.log('Manifest updated successfully.')

        // Zip files
        const output = fs.createWriteStream(`${messages.appName.message.replace(/ /g, '_')}-edge-${manifest.version}.zip`)
        const archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
        })

        output.on('close', () => {
            console.log('Zip file created successfully.')
        })

        archive.on('error', (err) => {
            console.error('Error creating zip file:', err)
        })

        archive.pipe(output)
        archive.directory('./src', 'src')
        archive.directory('./icon', 'icon')
        archive.file(edgeManifestPath, { name: 'manifest.json' })
        archive.directory('./_locales', '_locales')

        console.log({ edgeManifestPath })
        await archive.finalize()
        fs.rmSync(edgeManifestPath)
    })
}
function writeFirefoxManifest(originalManifest) {
    const firefoxManifest = { ...originalManifest }

    delete firefoxManifest.key
    delete firefoxManifest.oauth2

    firefoxManifest.browser_specific_settings = {
        gecko: {
            id: `${package.name}-gecko@june07.com`
        }
    }
    firefoxManifest.permissions = firefoxManifest.permissions.filter(permission => permission !== 'system.display')
    firefoxManifest.background = {
        scripts: ["src/background.js"],
        type: "module"
    }
    fs.writeFile(firefoxManifestPath, JSON.stringify(firefoxManifest, null, 4), 'utf8', async (err) => {
        if (err) {
            console.error('Error writing Firefox manifest:', err)
            return
        }
        console.log('Firefox manifest updated successfully.')
        // Zip files
        const output = fs.createWriteStream(`${messages.appName.message.replace(/ /g, '_')}-firefox-${firefoxManifest.version}.zip`)
        const archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
        })

        output.on('close', () => {
            console.log('Zip file created successfully.')
        })

        archive.on('error', (err) => {
            console.error('Error creating zip file:', err)
        })

        archive.pipe(output)
        archive.directory('./src', 'src')
        archive.directory('./icon', 'icon')
        archive.file(firefoxManifestPath, { name: 'manifest.json' })
        archive.directory('./_locales', '_locales')

        console.log({ firefoxManifestPath })
        await archive.finalize()
        fs.rmSync(firefoxManifestPath)
    })
}

// Read the manifest file
fs.readFile(originalManifestPath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading manifest file:', err)
        return
    }

    // Parse JSON
    let manifest
    try {
        manifest = JSON.parse(data)
    } catch (error) {
        console.error('Error parsing manifest JSON:', error)
        return
    }

    manifest.version = package.version

    writeChromeManifest(manifest)
    writeEdgeManifest(manifest)
    writeFirefoxManifest(manifest)
})