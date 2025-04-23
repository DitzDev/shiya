(async () => {
    require("dotenv").config();
    require('./system/settings');
    const simple = require('./lib/simple');
    const { consoleWarn, consoleInfo, consoleErr } = require("./lib/console");
    const { useMultiFileAuthState, Browsers, makeInMemoryStore, getAggregateVotesInPollMessage, DisconnectReason } = require('baileys');
    const { default: pino } = require('pino');
    const readline = require("readline");
    const yargs = require('yargs');
    const cp = require('child_process');
    const path = require("path");
    const fs = require("fs");
    const syntaxerror = require("syntax-error");
    let { promisify } = require('util');
    let exec = promisify(cp.exec).bind(cp);
    const chalk = require('chalk');
    const _ = require('lodash');
    const os = require('os');
    const { randomBytes } = require('crypto');
    const moment = require("moment-timezone");
    const chokidar = require("chokidar");

    function question(text) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        return new Promise((resolve) => {
            rl.question(text, resolve)
        })
    }

    timestamp = {
        start: new Date
    }

    opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
    prefix = new RegExp('^[' + (opts['prefix'] || '芒鈧絰zXZ/i!#$%+脗拢脗垄芒鈥毬偮脗掳=脗露芒藛鈥犆冣€斆兟访忊偓芒藛拧芒艙鈥溍偮┟偮�:;?&.\\-').replace(/[|\\{}()[\]^$+*?.\-\^]/g, '\\$&') + ']')

    var low;
    try {
        low = require('lowdb')
    } catch (e) {
        low = require('./lib/lowdb')
    }

    const { Low, JSONFile } = low
    const mongoDB = require('./lib/mongoDB')

    db = new Low(
        /https?:\/\//.test(opts['db'] || '') ?
            new cloudDBAdapter(opts['db']) : /mongodb/i.test(opts['db']) ?
                new mongoDB(opts['db']) :
                new JSONFile(`${opts._[0] ? opts._[0] + '_' : ''}database.json`)
    )

    DATABASE = db
    loadDatabase = async function loadDatabase() {
        if (db.READ) return new Promise((resolve) => setInterval(function () { (!db.READ ? (clearInterval(this), resolve(db.data == null ? loadDatabase() : db.data)) : null) }, 1 * 1000))
        if (db.data !== null) return
        db.READ = true
        await db.read()
        db.READ = false
        db.data = {
            users: {},
            chats: {},
            stats: {},
            msgs: {},
            sticker: {},
            settings: {},
            respon: {},
            ...(db.data || {})
        }
        db.chain = _.chain(db.data)
    }
    loadDatabase()

    const pairingCode = process.argv.includes("--pairing-code");
    const authFolder = `${opts._[0] || global.sessionName}`;
    global.isInit = !fs.existsSync(authFolder);
    const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });
    const { state, saveCreds } = await useMultiFileAuthState(authFolder);

    const connectionOptions = {
        ...(!pairingCode && {
            printQRInTerminal: true
        }),
        ...(pairingCode && {
            printQRInTerminal: !pairingCode
        }),
        logger: pino({ level: "silent" }),
        auth: state,
        markOnlineOnConnect: false,
        browser: Browsers.macOS("Safari")
    }
    global.conn = simple.makeWASocket(connectionOptions);
    global.ev = global.conn.ev;

    if (pairingCode && !conn.authState.creds.registered) {
        const phoneNumber = await question(chalk.yellowBright("Input your number eg 628xxx: "));
        const code = await conn.requestPairingCode(phoneNumber);
        const formattedCode = code.slice(0, 4) + "-" + code.slice(4);
        console.log(chalk.bgBlack(chalk.greenBright(`~ Pairing code: ${formattedCode}`)));
    }

    if (!opts['test']) {
        if (db) setInterval(async () => {
            if (global.db.data) await db.write()
            if (opts['autocleartmp'] && (support || {}).find) (tmp = [os.tmpdir(), 'tmp'], tmp.forEach(filename => cp.spawn('find', [filename, '-amin', '3', '-type', 'f', '-delete'])))
        }, 30 * 1000)
    }

    /** @param {import('baileys').WAMessageKey} key */
    async function getMessage(key) {
        if (store) {
            const msg = await store.loadMessage(key.remoteJid, key.id)
            return msg?.message
        }
        return {
            conversation: "DitzDev"
        }
    }

    conn.ev.on('message.update', async (chatUpdate) => {
        for (const { key, update } of chatUpdate) {
            if (update.pollUpdate && key.fromMe) {
                const pollCreation = await getMessage(key)
                if (pollCreation) {
                    const pollUpdate = await getAggregateVotesInPollMessage({
                        message: pollCreation,
                        pollUpdates: update.pollUpdates,
                    })
                    var toCmd = pollUpdate.filter(v => v.voters.length !== 0)[0]?.name
                    if (toCmd == undefined) return
                    var prefCmd = prefix + toCmd
                    conn.appenTextMessage(prefCmd, chatUpdate)
                }
            }
        }
    })

    /** @param {import('baileys').ConnectionState} update */
    async function connectionUpdate(update) {
        const { receivedPendingNotifications, connection, lastDisconnect, isOnline, isNewLogin } = update
        if (isNewLogin) conn.isInit = true
        if (connection == 'connecting') console.log(chalk.redBright('⚡ Mengaktifkan Bot, Mohon tunggu sebentar...'))
        if (connection == 'open') console.log(chalk.green('✅ Tersambung'))
        if (isOnline == true) console.log(chalk.green('✅ Status Aktif'))
        if (isOnline == false) console.log(chalk.red('❌ Status Mati'))
        if (receivedPendingNotifications) console.log(chalk.yellow('^_^ Menunggu Pesan Baru'))
        if (connection == 'close') console.log(chalk.red('⏱️ koneksi terputus & mencoba menyambung ulang...'))
        global.timestamp.connect = new Date
        if (lastDisconnect && lastDisconnect.error && lastDisconnect.error.output && lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut) {
            console.log(reloadHandler(true))
        }
        if (db.data == null) await loadDatabase()
    }

    process.on('uncaughtException', console.error);
    let isInit = true, handler = require('./handler');
    reloadHandler = function (restartConn) {
        let Handler = require('./handler');
        if (Object.keys(Handler || {}).length) handler = Handler;
        if (restartConn) {
            try { conn.ws.close() } catch { }
            conn = {
                ...conn, ...simple.makeWASocket(connectionOptions)
            }
        }

        if (!isInit) {
            conn.ev.off('messages.upsert', conn.handler)
            conn.ev.off('connection.update', conn.connectionUpdate)
            conn.ev.off('creds.update', conn.credsUpdate)
        }

        conn.handler = handler.handler.bind(conn);
        conn.onParticipantsUpdate = handler.participantsUpdate.bind(conn);
        conn.connectionUpdate = connectionUpdate.bind(conn);
        conn.credsUpdate = saveCreds.bind(conn);

        conn.ev.on('messages.upsert', conn.handler);
        conn.ev.on('group-participants.update', conn.onParticipantsUpdate);
        conn.ev.on('connection.update', conn.connectionUpdate);
        conn.ev.on('creds.update', conn.credsUpdate);
        isInit = false;
        return true;
    }

    function getAllJsFiles(dirPath, arrayOfFiles = []) {
        const files = fs.readdirSync(dirPath);

        files.forEach(file => {
            const fullPath = path.join(dirPath, file);
            if (fs.statSync(fullPath).isDirectory()) {
                getAllJsFiles(fullPath, arrayOfFiles);
            } else if (file.endsWith(".js")) {
                arrayOfFiles.push(fullPath);
            }
        });

        return arrayOfFiles;
    }

    let pluginFolder = path.join(__dirname, "plugin");
    let pluginFilter = filename => /\.js$/.test(filename);
    let jsFiles = getAllJsFiles(pluginFolder);
    plugins = {};

    for (let fullPath of jsFiles) {
        const filename = path.relative(pluginFolder, fullPath);
        try {
            plugins[filename] = require(fullPath);
        } catch (e) {
            consoleErr(`Gagal load plugin ${filename}: ` + e);
            delete plugins[filename];
        }
    }
    console.log(Object.keys(plugins));
    reload = (filename) => {
        if (!pluginFilter(filename)) return;

        const relPath = path.relative(pluginFolder, filename);
        const fullPath = path.resolve(filename);

        if (require.cache[fullPath]) {
            delete require.cache[fullPath];
            if (fs.existsSync(fullPath)) consoleInfo(`re-require plugin '${relPath}'`);
            else {
                consoleWarn(`deleted plugin '${relPath}'`);
                return delete plugins[relPath];
            }
        } else consoleInfo(`requiring new plugin '${relPath}'`);

        const content = fs.readFileSync(fullPath, "utf-8");
        const err = syntaxerror(content, filename);
        if (err) {
            consoleErr(`syntax error while loading '${relPath}'\n${err}`);
        } else {
            try {
                plugins[relPath] = require(fullPath);
            } catch (e) {
                consoleErr(`error require plugin '${relPath}'\n${e}`);
            } finally {
                plugins = Object.fromEntries(
                    Object.entries(plugins).sort(([a], [b]) => a.localeCompare(b))
                );
            }
        }
    };

    const watcher = chokidar.watch(pluginFolder, {
        persistent: true,
        ignoreInitial: true,
        usePolling: false,
        depth: Infinity,
        awaitWriteFinish: true
    });

    watcher.on('add', reload)
        .on('change', reload)
        .on('unlink', reload);

    reloadHandler();

    async function _quickTest() {
        let test = await Promise.all([
            cp.spawn('ffmpeg'),
            cp.spawn('ffprobe'),
            cp.spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-filter_complex', 'color', '-frames:v', '1', '-f', 'webp', '-']),
            cp.spawn('convert'),
            cp.spawn('magick'),
            cp.spawn('gm'),
            cp.spawn('find', ['--version'])
        ].map(p => {
            return Promise.race([
                new Promise(resolve => {
                    p.on('close', code => {
                        resolve(code !== 127)
                    })
                }),
                new Promise(resolve => {
                    p.on('error', _ => resolve(false))
                })
            ])
        }))
        let [ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find] = test
        let s = support = {
            ffmpeg,
            ffprobe,
            ffmpegWebp,
            convert,
            magick,
            gm,
            find
        }
        Object.freeze(support)
        if (!s.ffmpeg) consoleWarn('Please install ffmpeg for sending videos (pkg install ffmpeg)')
        if (s.ffmpeg && !s.ffmpegWebp) consoleWarn('Stickers may not animated without libwebp on ffmpeg (--enable-ibwebp while compiling ffmpeg)')
        if (!s.convert && !s.magick && !s.gm) consoleWarn('Stickers may not work without imagemagick if libwebp on ffmpeg doesnt isntalled (pkg install imagemagick)')
    }

    _quickTest()
        .then(() => consoleInfo('Quick Test Done'))
        .catch(console.error)
})();