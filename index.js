let cluster = require('cluster')
let path = require('path')
let fs = require('fs')
const moment = require("moment-timezone")
const time = moment.tz('Asia/Jakarta').format("HH:mm:ss")
const CFonts = require('cfonts')
const Readline = require('readline')
const yargs = require('yargs/yargs')
const { color } = require('./lib/color')
const { say } = CFonts
const rl = Readline.createInterface(process.stdin, process.stdout)
const os = require('os')
const chalk = require('chalk')
const Spinnies = require('spinnies')
const axios = require('axios')
const AdmZip = require('adm-zip')
const { exec } = require('child_process')

const spinnies = new Spinnies({
    spinner: {
        interval: 80,
        frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
    }
})

function parseVersion(v) {
    const parts = v.split('.').map(Number);
    return parts[0] * 10000 + parts[1] * 100 + parts[2];
}

const packageJson = JSON.parse(fs.readFileSync('./package.json'))
const currentVersion = parseVersion(packageJson.version);

async function systemCheck() {
    spinnies.add('syscheck', { text: chalk.cyan('System check is running...') })

    try {
        const totalRam = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2)
        const freeRam = (os.freemem() / 1024 / 1024 / 1024).toFixed(2)
        const usedRam = (totalRam - freeRam).toFixed(2)
        const cpuInfo = os.cpus()[0]?.model
        const cpuCores = os.cpus().length
        const osType = os.type()
        const osVersion = os.release()
        const hostname = os.hostname()
        const uptime = (os.uptime() / 60 / 60).toFixed(2)

        await new Promise(resolve => setTimeout(resolve, 1500))

        spinnies.succeed('syscheck', { text: chalk.green('System check completed!') })

        console.log('')
        console.log(chalk.cyan('╭─') + chalk.yellow('「 SYSTEM INFORMATION 」'))
        console.log(chalk.cyan('│'))
        console.log(chalk.cyan('├─ ') + chalk.greenBright(`Version: v${currentVersion}`))
        console.log(chalk.cyan('├─ ') + chalk.greenBright(`OS: ${osType} ${osVersion}`))
        console.log(chalk.cyan('├─ ') + chalk.greenBright(`Hostname: ${hostname}`))
        console.log(chalk.cyan('├─ ') + chalk.greenBright(`CPU: ${cpuInfo}`))
        console.log(chalk.cyan('├─ ') + chalk.greenBright(`CPU Cores: ${cpuCores}`))
        console.log(chalk.cyan('├─ ') + chalk.greenBright(`Total RAM: ${totalRam} GB`))
        console.log(chalk.cyan('├─ ') + chalk.greenBright(`Used RAM: ${usedRam} GB`))
        console.log(chalk.cyan('├─ ') + chalk.greenBright(`Free RAM: ${freeRam} GB`))
        console.log(chalk.cyan('├─ ') + chalk.greenBright(`Uptime: ${uptime} hours`))
        console.log(chalk.cyan('│'))
        console.log(chalk.cyan('╰───────────────────────────'))
        console.log('')

        return true
    } catch (err) {
        spinnies.fail('syscheck', { text: chalk.red('System check failed!') })
        console.error(chalk.red(`[ERROR] System check error: ${err.message}`))
        return false
    }
}

async function checkUpdate() {
    spinnies.add('update', { text: chalk.cyan('Checking for updates...') })

    try {
        const repoOwner = 'DitzDev'
        const repoName = 'shiya'
        const url = `https://api.github.com/repos/${repoOwner}/${repoName}/releases/latest`

        const response = await axios.get(url)
        const latestVersion = parseVersion(response.data.tag_name.replace('shiya-v', ''))
        const releaseUrl = response.data.assets.map(item => item.browser_download_url)[0];

        await new Promise(resolve => setTimeout(resolve, 1500))

        if (latestVersion > currentVersion && releaseUrl !== '') {
            spinnies.succeed('update', { text: chalk.yellow(`New version available: v${latestVersion}`) })

            console.log('')
            console.log(chalk.cyan('╭─') + chalk.yellow('「 UPDATE AVAILABLE 」'))
            console.log(chalk.cyan('│'))
            console.log(chalk.cyan('├─ ') + chalk.greenBright(`Current version: v${currentVersion}`))
            console.log(chalk.cyan('├─ ') + chalk.greenBright(`Latest version: v${latestVersion}`))
            console.log(chalk.cyan('│'))
            console.log(chalk.cyan('├─ ') + chalk.yellowBright('Do you want to update now? (y/n)'))
            console.log(chalk.cyan('│'))
            console.log(chalk.cyan('╰───────────────────────────'))

            rl.once('line', async (line) => {
                if (line.trim().toLowerCase() === 'y') {
                    await downloadUpdate(releaseUrl, latestVersion)
                } else {
                    console.log(chalk.yellow('Update skipped. Starting bot...'))
                    startBot()
                }
            })

            return true
        } else {
            spinnies.succeed('update', { text: chalk.green('You are using the latest version!') })
            startBot()
            return false
        }
    } catch (err) {
        spinnies.fail('update', { text: chalk.red('Update check failed!') })
        console.error(chalk.red(`[ERROR] Update check error: ${err.message}`))
        console.log(chalk.yellow('Starting bot anyway...'))
        startBot()
        return false
    }
}

async function downloadUpdate(url, version) {
    spinnies.add('download', { text: chalk.cyan(`Downloading update v${version}...`) })

    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' })
        const zipPath = path.join(__dirname, `shiya-v${version}.zip`)

        fs.writeFileSync(zipPath, response.data)

        spinnies.succeed('download', { text: chalk.green('Download completed!') })
        spinnies.add('extract', { text: chalk.cyan('Extracting update...') })

        const updateDir = path.join(__dirname, `update-v${version}`)
        if (!fs.existsSync(updateDir)) {
            fs.mkdirSync(updateDir, { recursive: true })
        }

        const zip = new AdmZip(zipPath)
        zip.extractAllTo(updateDir, true)

        fs.unlinkSync(zipPath)

        spinnies.succeed('extract', { text: chalk.green(`Update extracted to folder update-v${version}!`) })

        console.log('')
        console.log(chalk.cyan('╭─') + chalk.yellow('「 UPDATE EXTRACTED 」'))
        console.log(chalk.cyan('│'))
        console.log(chalk.cyan('├─ ') + chalk.greenBright(`Update v${version} has been extracted to folder: update-v${version}`))
        console.log(chalk.cyan('├─ ') + chalk.yellowBright('Do you want to install modules in the update folder? (y/n)'))
        console.log(chalk.cyan('│'))
        console.log(chalk.cyan('╰───────────────────────────'))

        rl.once('line', async (line) => {
            if (line.trim().toLowerCase() === 'y') {
                spinnies.add('install', { text: chalk.cyan(`Installing modules in update-v${version}...`) })

                exec(`cd "${updateDir}" && npm install`, (error, stdout, stderr) => {
                    if (error) {
                        spinnies.fail('install', { text: chalk.red('Installation failed!') })
                        console.error(chalk.red(`[ERROR] Installation error: ${error.message}`))
                        console.log(chalk.yellow('Starting bot with current version...'))
                        startBot()
                        return
                    }

                    spinnies.succeed('install', { text: chalk.green('Modules installed successfully!') })
                    console.log('')
                    console.log(chalk.cyan('╭─') + chalk.yellow('「 UPDATE READY 」'))
                    console.log(chalk.cyan('│'))
                    console.log(chalk.cyan('├─ ') + chalk.greenBright(`Update v${version} is ready in folder: update-v${version}`))
                    console.log(chalk.cyan('├─ ') + chalk.greenBright('You can manually move the files to main directory when ready'))
                    console.log(chalk.cyan('├─ ') + chalk.yellowBright('Starting bot with current version...'))
                    console.log(chalk.cyan('│'))
                    console.log(chalk.cyan('╰───────────────────────────'))
                    startBot()
                })
            } else {
                console.log(chalk.yellow('Module installation skipped. Starting bot with current version...'))
                startBot()
            }
        })
    } catch (err) {
        spinnies.fail('download', { text: chalk.red('Download failed!') })
        console.error(chalk.red(`[ERROR] Download error: ${err.message}`))
        console.log(chalk.yellow('Starting bot with current version...'))
        startBot()
    }
}

function showBanner() {
    say("SHIYA", {
        font: '3d',
        align: 'left',
        colors: ['blueBright', 'cyan']
    });

    console.log(chalk.cyan('╭─') + chalk.yellow('「 SHIYA BOT 」'))
    console.log(chalk.cyan('│'))
    console.log(chalk.cyan('├─ ') + chalk.greenBright(`Version: v${currentVersion}`))
    console.log(chalk.cyan('├─ ') + chalk.greenBright(`Time: ${time}`))
    console.log(chalk.cyan('│'))
    console.log(chalk.cyan('╰───────────────────────────'))
    console.log('')
}

var isRunning = false
/**
 * Start a js file
 * @param {String} file `path/to/file`
 */
function start(file) {
    if (isRunning) return
    isRunning = true
    let args = [path.join(__dirname, file), ...process.argv.slice(2)]
    cluster.setupMaster({
        exec: args[0],
        args: args.slice(1),
    })
    let p = cluster.fork()
    p.on('message', data => {
        console.log('[RECEIVED]', data)
        switch (data) {
            case 'reset':
                p.process.kill()
                isRunning = false
                start.apply(this, arguments)
                break
            case 'uptime':
                p.send(process.uptime())
                break
        }
    })
    p.on('exit', (_, code) => {
        isRunning = false
        console.error(chalk.red(`[❗] Exited with code: ${code}`))
        if (code === 0) return
        fs.watchFile(args[0], () => {
            fs.unwatchFile(args[0])
            start(file)
        })
    })
    let opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
    if (!opts['test'])
        if (!rl.listenerCount()) rl.on('line', line => {
            p.emit('message', line.trim())
        })
}

function startBot() {
    start('main.js')
}

(async () => {
    showBanner()
    await systemCheck()
    await checkUpdate()
})()