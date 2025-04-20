const fs = require('fs');
const path = require("path");
const { consoleErr } = require('./lib/console');
const util = require("util");
const simple = require('./lib/simple');
const fetch = require("node-fetch");
const { generateWAMessageFromContent, prepareWAMessageMedia, proto } = require('baileys');
const isNumber = x => typeof x === 'number' && !isNaN(x)
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(resolve, ms))

module.exports = {
    /** @param {import('baileys').ChatUpdate} chatUpdate */
    async handler(chatUpdate) {
        if (global.db.data == null) await loadDatabase();
        this.msgqueque = this.msgqueque || [];
        if (!chatUpdate) return;
        this.pushMessage(chatUpdate.messages).catch(console.error);
        let m = chatUpdate.messages[chatUpdate.messages.length - 1];
        if (m.mtype === 'templateButtonReplyMessage') this.appenTextMessage(m.msg.selectedId, chatUpdate);
        if (!m) return;
        // console.log(m)
        try {
            m = simple.smsg(this, m);
            if (!m) return;
            // console.log(m)
            m.exp = 0
            m.limit = false
            try {
                let user = global.db.data.users[m.sender];
                if (typeof user !== 'object') global.db.data.users[m.sender] = {}
                if (user) {
                    if (!isNumber(user.exp)) user.exp = 0;
                    if (!isNumber(user.limit)) user.limit = 100; // default limit
                    if (!isNumber(user.level)) user.level = 0;
                    if (!('registered' in user)) user.registered = false;
                    if (!user.registered) {
                        if (!("name" in user)) user.name = m.name;
                        if (!isNumber(user.age)) user.age = -1;
                        if (!isNumber(user.regTime)) user.regTime = -1;
                        if (!isNumber(user.limit)) user.limit = 50;
                    }
                    if (!isNumber(user.afk)) user.afk = -1;
                    if (!('afkReason' in user)) user.afkReason = '';
                    if (!('banned' in user)) user.banned = false;
                    if (!('bannedReason' in user)) user.bannedReason = '';
                    if (!('premium' in user)) user.premium = false;
                    if (!isNumber(user.premiumDate)) user.premiumDate = 0;
                } else global.db.data.users[m.sender] = {
                    name: m.name,
                    level: 0,
                    age: -1,
                    regTime: -1,
                    exp: 0,
                    limit: 100,
                    registered: false,
                    afk: -1,
                    afkReason: '',
                    banned: false,
                    bannedReason: '',
                    premium: false,
                }
                let chat = global.db.data.chats[m.chat]
                if (typeof chat !== 'object') global.db.data.chats[m.chat] = {}
                if (chat) {
                    if (!('isBanned' in chat)) chat.isBanned = false
                    if (!('welcome' in chat)) chat.welcome = true
                    if (!('autoread' in chat)) chat.autoread = false
                    if (!('detect' in chat)) chat.detect = false
                    if (!('sWelcome' in chat)) chat.sWelcome = `Selamat Datang @user`
                    if (!('sBye' in chat)) chat.sBye = `Selamat Tinggal @user`
                    if (!('sPromote' in chat)) chat.sPromote = '@user telah di promote'
                    if (!('sDemote' in chat)) chat.sDemote = '@user telah di demote'
                    if (!('delete' in chat)) chat.delete = true
                    if (!('antiVirtex' in chat)) chat.antiVirtex = false
                    if (!('antiLink' in chat)) chat.antiLink = false
                    if (!('tikauto' in chat)) chat.tikauto = false
                    if (!('captcha' in chat)) chat.captcha = false
                    if (!('antifoto' in chat)) chat.antiFoto = false
                    if (!('antividio' in chat)) chat.antiVideo = false
                    if (!('autoJpm' in chat)) chat.autoJpm = false
                    if (!('antiPorn' in chat)) chat.antiPorn = false
                    if (!('antiBot' in chat)) chat.antiBot = true
                    if (!('antiSpam' in chat)) chat.antiSpam = false
                    if (!('freply' in chat)) chat.freply = false
                    if (!('simi' in chat)) chat.simi = false
                    if (!('ai' in chat)) chat.ai = false
                    if (!('ngetik' in chat)) chat.ngetik = true
                    if (!('autoVn' in chat)) chat.autoVn = false
                    if (!('antiSticker' in chat)) chat.antiSticker = false
                    if (!('stiker' in chat)) chat.stiker = false
                    if (!('antiBadword' in chat)) chat.antiBadword = false
                    if (!('antiToxic' in chat)) chat.antiToxic = false
                    if (!('viewonce' in chat)) chat.viewonce = false
                    if (!('useDocument' in chat)) chat.useDocument = false
                    if (!('antiToxic' in chat)) chat.antiToxic = false
                    if (!isNumber(chat.expired)) chat.expired = 0
                } else global.db.data.chats[m.chat] = {
                    isBanned: false,
                    welcome: true,
                    autoread: false,
                    simi: false,
                    ai: false,
                    ngetik: true,
                    autoVn: false,
                    stiker: false,
                    antiSticker: false,
                    antiBadword: false,
                    antiToxic: false,
                    antiSpam: false,
                    antiBot: true,
                    detect: false,
                    autoJpm: false,
                    sWelcome: '',
                    sBye: '',
                    sPromote: '@user telah di promote!',
                    sDemote: '@user telah di demote',
                    delete: true,
                    antiLink: false,
                    tikauto: false,
                    captcha: false,
                    antifoto: false,
                    antividio: false,
                    antiPorn: false
                }
                let settings = global.db.data.settings[this.user.jid]
                if (typeof settings !== 'object') global.db.data.settings[this.user.jid] = {}
                if (settings) {
                    if (!('self' in settings)) settings.self = false
                    if (!('autoread' in settings)) settings.autoread = false
                    if (!('composing' in settings)) settings.composing = true
                    if (!('restrict' in settings)) settings.restrict = true
                    if (!('autorestart' in settings)) settings.autorestart = true
                    if (!('gconly' in settings)) settings.gconly = true
                    if (!('restartDB' in settings)) settings.restartDB = 0
                    if (!isNumber(settings.status)) settings.status = 0 // ini buat data set Status, tambah disini
                    if (!('anticall' in settings)) settings.anticall = true
                    if (!('clear' in settings)) settings.clear = true
                    if (!isNumber(settings.clearTime)) settings.clearTime = 0
                    if (!('freply' in settings)) settings.freply = true
                    if (!('akinator' in settings)) settings.akinator = {}
                } else global.db.data.settings[this.user.jid] = {
                    self: false,
                    autoread: false,
                    restrict: true,
                    autorestart: true,
                    composing: true,
                    restartDB: 0,
                    gconly: true,
                    status: 0, // disini juga,
                    anticall: true, // anticall on apa off?
                    clear: true,
                    clearTime: 0,
                    freply: true,
                    akinator: {}
                }
            } catch (e) {
                console.error(e)
            }
            if (opts['nyimak']) return
            if (opts["self"] && !m.fromMe && !global.db.data.users[m.sender].moderator) return
            if (opts["autoread"]) await this.readMessages([m.key]);
            if (opts['pconly'] && m.chat.endsWith('g.us')) return

            if (opts['gconly'] && !m.fromMe && !m.chat.endsWith('g.us') && !global.db.data.users[m.sender].premium)
                return this.sendMessage(m.chat, { text: '```🚩 Akses Bot Ke Private Chat Di Tolak, Upgrade Premium Hanya Rp 5.000 Agar Bisa Bebas Akses Bot Dengan Hubungi Owner : ```' + `@${nomorown.split("@")[0]}` + '```\n\n• Join Ke Channel Informasi Bot Untuk Update Kedepannya Tentang Bot : https://whatsapp.com/channel/0029VaxCdVuFsn0eDKeiIm2c```' }, { quoted: m });
            if (opts['swonly'] && m.chat !== 'status@broadcast') return

            if (typeof m.text !== 'string') m.text = '';
            const body = typeof m.text == 'string' ? m.text : false;
            const isROwner = [conn.decodeJid(this.user.id), ...global.owner.map(([number, isCreator, isDeveloper]) => number)].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender);
            const isOwner = isROwner || m.fromMe;

            if (isROwner) {
                db.data.users[m.sender].premium = true;
                db.data.users[m.sender].premiumDate = "infinity";
                db.data.users[m.sender].limit = "infinity";
                db.data.users[m.sender].moderator = true;
            }

            if (opts['queque'] && m.text && !(isMods || isPrems)) {
                let queque = this.msgqueque, time = 1000 * 5
                const previousID = queque[queque.length - 1]
                queque.push(m.id || m.key.id)
                setInterval(async function () {
                    if (queque.indexOf(previousID) === -1) clearInterval(this)
                    else await delay(time)
                }, time)
            }

            if (m.isBaileys) return
            m.exp += Math.ceil(Math.random() * 10)

            let usedPrefix
            let _user = global.db.data && global.db.data.users && global.db.data.users[m.sender]

            const groupMetadata = (m.isGroup ? (conn.chats[m.chat] || {}).metadata : {}) || {}
            const participants = (m.isGroup ? groupMetadata.participants : []) || []
            const user = (m.isGroup ? participants.find(u => conn.decodeJid(u.id) === m.sender) : {}) || {} // User Data
            const bot = (m.isGroup ? participants.find(u => conn.decodeJid(u.id) == this.user.jid) : {}) || {} // Your Data
            const isRAdmin = user && user.admin == 'superadmin' || false
            const isAdmin = isRAdmin || user && user.admin == 'admin' || false // Is User Admin?
            const isBotAdmin = bot && bot.admin || false // Are you Admin?
            const isPrem = global.db.data.users[m.sender].premium
            const isBan = global.db.data.users[m.sender].banned
            for (let name in global.plugins) {
                let plugin = global.plugins[name];
                if (!plugin || !plugin.handler) continue;
                const { handler } = plugin;
                if (typeof handler.all === 'function') {
                    try {
                        await handler.all.call(this, m, chatUpdate);
                    } catch (e) {
                        console.error(e);
                    }
                }
                if (!opts['restrict']) if (handler.tags && handler.tags.includes('admin')) {
                    continue
                }
                const str2Regex = str => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
                let _prefix = handler.customPrefix ? handler.customPrefix : conn.prefix ? conn.prefix : global.prefix;

                const usePrefix = handler.usePrefix !== false;

                let match;
                if (usePrefix) {
                    match = (_prefix instanceof RegExp ? // RegExp Mode?
                        [[_prefix.exec(m.text), _prefix]] :
                        Array.isArray(_prefix) ? // Array?
                            _prefix.map(p => {
                                let re = p instanceof RegExp ? // RegExp in Array?
                                    p :
                                    new RegExp(str2Regex(p))
                                return [re.exec(m.text), re]
                            }) :
                            typeof _prefix === 'string' ? // String?
                                [[new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]] :
                                [[[], new RegExp]]
                    ).find(p => p[1]);
                } else {
                    match = [[m.text, new RegExp("^")]];
                }

                if (typeof handler.before === 'function') if (await handler.before.call(this, m, {
                    match,
                    conn: this,
                    participants,
                    groupMetadata,
                    user,
                    bot,
                    isROwner,
                    isOwner,
                    isRAdmin,
                    isAdmin,
                    isBotAdmin,
                    isPrem,
                    isBan,
                    chatUpdate,
                })) continue

                if (typeof handler.exec !== 'function') continue;

                let noPrefix, command, args, _args, text;

                if (usePrefix) {
                    if ((usedPrefix = (match[0] || '')[0])) {
                        noPrefix = m.text.replace(usedPrefix, '')
                            ;[command, ...args] = noPrefix.trim().split` `.filter(v => v)
                        _args = noPrefix.trim().split` `.slice(1)
                        text = _args.join` `
                    } else {
                        continue; // Skip if prefix is required but not found
                    }
                } else {
                    noPrefix = m.text;
                    [command, ...args] = noPrefix.trim().split` `.filter(v => v)
                    _args = noPrefix.trim().split` `.slice(1)
                    text = _args.join` `
                    usedPrefix = ''; // Empty prefix
                }

                command = (command || '').toLowerCase()
                let fail = handler.fail || global.dfail
                let isAccept = handler.cmd instanceof RegExp ? // RegExp Mode?
                    handler.cmd.test(command) :
                    Array.isArray(handler.cmd) ? // Array?
                        handler.cmd.some(cmd => cmd instanceof RegExp ? // RegExp in Array?
                            cmd.test(command) :
                            cmd === command
                        ) :
                        typeof handler.cmd === 'string' ? // String?
                            handler.cmd === command :
                            false

                if (!isAccept) continue
                m.plugin = name
                if (m.chat in global.db.data.chats || m.sender in global.db.data.users) {
                    let chat = global.db.data.chats[m.chat]
                    let user = global.db.data.users[m.sender]
                    if (name != 'unbanchat.js' && chat && chat.isBanned) return // Except this
                    if (name != 'unbanuser.js' && user && user.banned) return
                }
                if (handler.opts?.owner && !isOwner) { // Number Owner
                    fail('owner', m, this)
                    continue
                }
                if (handler.opts?.premium && !isPrems) { // Premium
                    fail('premium', m, this)
                    continue
                }
                if (handler.opts?.banned && !isBan) { // Banned
                    fail('banned', m, this)
                    continue
                }
                if (handler.opts?.group && !m.isGroup) { // Group Only
                    fail('group', m, this)
                    continue
                } else if (handler.opts?.botAdmin && !isBotAdmin) { // You Admin
                    fail('botAdmin', m, this)
                    continue
                } else if (handler.opts?.admin && !isAdmin) { // User Admin
                    fail('admin', m, this)
                    continue
                }
                if (handler.opts?.private && m.isGroup) { // Private Chat Only
                    fail('private', m, this)
                    continue
                }
                if (handler.opts?.register == true && _user.registered == false) { // Butuh daftar?
                    fail('unreg', m, this)
                    continue
                }
                if (handler.opts?.level > _user.level) {
                    this.reply(m.chat, `diperlukan level ${plugin.level} untuk menggunakan perintah ini. Level kamu ${_user.level}`, m)
                    continue
                }
                let extra = {
                    match,
                    plugin,
                    usedPrefix,
                    noPrefix,
                    _args,
                    args,
                    body,
                    command,
                    text,
                    conn: this,
                    participants,
                    groupMetadata,
                    user,
                    bot,
                    isROwner,
                    isOwner,
                    isRAdmin,
                    isAdmin,
                    isBotAdmin,
                    isPrem,
                    isBan,
                    chatUpdate,
                }
                try {
                    await handler.exec.call(this, m, extra);
                    if (!isPrem) m.limit = m.limit || handler.limit || true
                } catch (e) {
                    m.error = e
                    console.error(e)
                    if (e) {
                        let text = util.format(e)
                        if (e.name) for (let [jid] of global.owner.filter(([number, isCreator, isDeveloper]) => isDeveloper && number)) {
                            let data = (await conn.onWhatsApp(jid))[0] || {}
                            if (data.exists) conn.reply(data.jid, `*Plugin:* ${m.plugin}\n*Sender:* ${m.sender}\n*Chat:* ${m.chat}\n*Command:* ${usedPrefix}${command} ${args.join(' ')}\n\n\`\`\`${text}\`\`\``, m)
                        }
                        conn.reply(m.chat, text, m)
                    }
                } finally {
                    // m.reply(util.format(_user))
                    if (typeof handler.after === 'function') {
                        try {
                            await handler.after.call(this, m, extra)
                        } catch (e) {
                            console.error(e)
                        }
                    }
                }
                break
            }
        } catch (e) {
            consoleErr(e)
        } finally {
            if (opts['queque'] && m.text) {
                const quequeIndex = this.msgqueque.indexOf(m.id || m.key.id)
                if (quequeIndex !== -1) this.msgqueque.splice(quequeIndex, 1)
            }
            let user, stats = global.db.data.stats
            if (m) {
                if (m.sender && (user = global.db.data.users[m.sender])) {
                    user.exp += m.exp
                    user.limit -= m.limit * 1
                }

                let stat
                if (m.plugin) {
                    let now = + new Date
                    if (m.plugin in stats) {
                        stat = stats[m.plugin]
                        if (!isNumber(stat.total)) stat.total = 1
                        if (!isNumber(stat.success)) stat.success = m.error != null ? 0 : 1
                        if (!isNumber(stat.last)) stat.last = now
                        if (!isNumber(stat.lastSuccess)) stat.lastSuccess = m.error != null ? 0 : now
                    } else stat = stats[m.plugin] = {
                        total: 1,
                        success: m.error != null ? 0 : 1,
                        last: now,
                        lastSuccess: m.error != null ? 0 : now
                    }
                    stat.total += 1
                    stat.last = now
                    if (m.error == null) {
                        stat.success += 1
                        stat.lastSuccess = now
                    }
                }
            }

            try {
                require('./lib/print')(m, this)
            } catch (e) {
                console.log(m, m.quoted, e)
            }
            if (opts["autoread"])
                await this.chatRead(
                    m.chat,
                    m.isGroup ? m.sender : undefined,
                    m.id || m.key.id,
                ).catch(() => { });
        }
    },
    async participantsUpdate({ id, participants, action, m }) {
        if (opts['self']) return
        // if (id in conn.chats) return // First login will spam
        if (global.isInit) return
        let chat = global.db.data.chats[id] || {}
        let text = ''
        switch (action) {
            case 'add':
            case 'remove':
                if (chat.welcome) {
                    let groupMetadata = await this.groupMetadata(id) || (conn.chats[id] || {}).metadata
                    for (let user of participants) {
                        let pp = 'https://telegra.ph/file/24fa902ead26340f3df2c.png'
                        let ppgc = 'https://telegra.ph/file/24fa902ead26340f3df2c.png'
                        let gcname = groupMetadata.subject
                        try {
                            pp = await this.profilePictureUrl(user, 'image')
                            ppgc = await this.profilePictureUrl(id, 'image')
                        } catch (e) { } finally {
                            text = (action === 'add' ? (chat.sWelcome || this.welcome || conn.welcome || 'Selamat Datang!, @user!').replace('@subject', await this.getName(id)).replace('@desc', groupMetadata.desc ? String.fromCharCode(8206).repeat(4001) + groupMetadata.desc : '') :
                                (chat.sBye || this.bye || conn.bye || 'Selamat Tinggal!, @user!')).replace(/@user/g, '@' + user.split`@`[0])
                            let wel = pp
                            let lea = pp
                            let messa = await prepareWAMessageMedia({ image: { url: pp } }, { upload: conn.waUploadToServer });
                            let product = {
                                "productImage": messa.imageMessage,
                                "productId": "343056591714248",
                                "title": text,
                                "description": "Made by ©DitzOfc",
                                "currencyCode": "YURO",
                                "priceAmount1000": 10000,
                                "productImageCount": 2
                            };

                            let catalog = generateWAMessageFromContent(
                                id,
                                proto.Message.fromObject({
                                    "productMessage": {
                                        "product": product,
                                        "businessOwnerJid": '6285717062467@s.whatsapp.net'
                                    }
                                }),
                                { userJid: id }
                            );
                            await conn.relayMessage(id, catalog.message, { messageId: catalog.key.id });
                        }

                    }
                }
                break
            case 'promote':
                text = (chat.sPromote || this.spromote || conn.spromote || '@user ```is now Admin```')
            case 'demote':
                if (!text)
                    text = (chat.sDemote || this.sdemote || conn.sdemote || '@user ```is no longer Admin```')
                text = text.replace('@user', '@' + participants[0].split('@')[0])
                if (chat.detect)
                    conn.sendMessage(id, { text, mentions: this.parseMention(text) })
                break
        }
    },
    async onCall(json) {
        if (!db.data.settings[this.user.jid].anticall) return
        let jid = json[2][0][1]['from']
        let isOffer = json[2][0][2][0][0] == 'offer'
        let users = global.db.data.users
        let user = users[jid] || {}
        if (user.whitelist) return
        if (jid && isOffer) {
            const tag = this.generateMessageTag()
            const nodePayload = ['action', 'call', ['call', {
                'from': this.user.jid,
                'to': `${jid.split`@`[0]}@s.whatsapp.net`,
                'id': tag
            }, [['reject', {
                'call-id': json[2][0][2][0][1]['call-id'],
                'call-creator': `${jid.split`@`[0]}@s.whatsapp.net`,
                'count': '0'
            }, null]]]]
            this.sendJSON(nodePayload, tag)
            m.reply(`Kamu dibanned karena menelepon bot, owner : @${owner[0]}`)
        }
    },
    async GroupUpdate({ jid, desc, descId, descTime, descOwner, announce }) {
        if (!db.data.chats[jid].desc) return
        if (!desc) return
        let caption = `
        @${descOwner.split`@`[0]} telah mengubah deskripsi grup.
        ${desc}
            `.trim()
        this.sendMessage(jid, caption, wm, m)

    }
}

global.dfail = (type, m, conn) => {
    let userss = global.db.data.users[m.sender]
    let imgr = 'https://telegra.ph/file/0b32e0a0bb3b81fef9838.jpg'
    let msg = {
        rowner: '```Maaf, Fitur Ini Hanya Untuk Creator```',
        owner: '```Maaf, Fitur ini khusus hanya untuk Owner```',
        mods: '```Maaf, Fitur Ini hanya untuk Moderator```',
        group: '```Maaf, Fitur ini hanya dapat di gunakan dalam grup```',
        private: '```Fitur ini hanya bisa di gunakan di dalam Private Chat!```',
        admin: null,
        botAdmin: '```Shiya Blom Jadi Admin, Gabisa pake Fitur itu🥲```',
        restrict: '```Restrict Dinyalakan pada Chat ini, Harap matikan restrict```',
        unreg: null,
        premium: '```Fitur Ini hanya bisa di Akses Oleh member premium!```',
    }[type];
    if (type === 'admin') {
        let stickerBuffer = fs.readFileSync('./media/admin.webp');
        conn.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m });
    } else if (msg) {
        return conn.sendMessage(
            m.chat,
            {
                text: msg,
                contextInfo: {
                    mentionedJid: conn.parseMention(msg),
                    groupMentions: [],
                    isForwarded: true,
                    businessMessageForwardInfo: {
                        businessOwnerJid: global.owner[0] + "@s.whatsapp.net",
                    },
                    forwardingScore: 256,
                    externalAdReply: {
                        title: "[ AKSES DI TOLAK ]",
                        body: 'ACCESS_DANIED',
                        thumbnailUrl: imgr,
                        sourceUrl: null,
                        mediaType: 1,
                        renderLargerThumbnail: false,
                    },
                },
            },
            { quoted: m },
        );
    } else if (type == 'unreg') {
        conn.sendMessage(m.chat, {
            text: "Hallo! Shiya gabisa prosess Permintaan kamu karena kamu belum terdaftar😌, Yuk pilih cara daftar di bawah ini dan dapatkan 50 limit tambahan!\n\n```.register``` Untuk register via Captcha\n```.regmail``` Untuk register via email"
        }, { quoted: m })
    };
    let msg3 = {
        zevent: `Perintah ini hanya dapat digunakan saat event*!`
    }[type]
    if (msg3) return m.reply(msg3)
}