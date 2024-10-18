const fs = require('fs')
const { rollup } = require('rollup')
const chokidar = require('chokidar')

const watchDir = 'dist'
const deps = [
    {
        input: 'node_modules/socket.io-client/dist/socket.io.min.js',
        watch: `${watchDir}/socket.io.min.js`,
    }
]
const watchFiles = deps.map(dep => dep.watch)

console.log({ watchFiles })

if (!fs.existsSync(watchDir)) {
    fs.mkdirSync(watchDir)
}
const watcher = chokidar.watch(watchFiles, {
    persistent: process.env.NODE_ENV === 'production' ? false : true
})

watcher.on('ready', async () => {
    build()
})

watcher.on('unlink', async () => {
    build()
})

async function build() {
    watchFiles.map(async (path) => {
        if (!fs.existsSync(path)) {
            const dep = deps.find((dep) => dep.watch === path)

            if (dep.input.match(/nacl-fast|nacl-util|socket.io/)) {
                console.log(`copying dep ${dep.input} to ${dep.watch}`)
                fs.copyFileSync(dep.input, dep.watch)
            } else {
                console.log(`rolling up ${path}...`)
                try {
                    const bundle = await rollup({
                        input: dep.input,
                    })
                    const { output } = await bundle.generate({
                        compact: true,
                        format: 'iife',
                        file: dep.watch,
                        name: dep.name,
                    })
                    fs.writeFileSync(dep.watch, output[0].code)
                } catch (error) {
                    console.error(error)
                }
            }
        }
    })

}