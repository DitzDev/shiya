const moment = require("moment-timezone")
const fs = require("fs")
const path = require("path")

function ucapan() {
    const time = moment.tz('Asia/Jakarta').format('HH');
    let res = "Malam🌃";
    if (time >= 4) {
        res = "Pagi🌤️";
    }
    if (time > 10) {
        res = "Siang🌞";
    }
    if (time >= 15) {
        res = "Sore🌄";
    }
    if (time >= 18) {
        res = "Malam🌃";
    }
    return res;
}

exports.handler = {
    name: 'Menu bot',
    desc: 'Show bot menu',
    usage: '.menu <tags>',
    cmd: ['menu'],
    tags: ['Public 🌐'],
    exec: async (m, { conn, text, usedPrefix: _p, command }) => {
        try {
            let package = JSON.parse(await fs.promises.readFile(path.join(__dirname, '../package.json')).catch(_ => '{}'));
            let { registered } = global.db.data.users[m.sender];
            let name = registered ? global.db.data.users[m.sender].name : conn.getName(m.sender)

            let payment = { "key": { "remoteJid": "0@s.whatsapp.net", "fromMe": false }, "message": { "requestPaymentMessage": { "currencyCodeIso4217": "USD", "amount1000": "99999999999", "requestFrom": "0@s.whatsapp.net", "noteMessage": { "extendedTextMessage": { "text": `${name}-san 🐼`, "contextInfo": { "mentionedJid": [`${m.sender}`] } } }, "expiryTimestamp": "0", "amount": { "value": "99999999999", "offset": 1000, "currencyCode": "USD" } } } }
            let help = Object.values(plugins).map(plug => {
                return {
                    name: plug.handler?.name,
                    desc: plug.handler?.desc,
                    tags: Array.isArray(plug.handler?.tags) ? plug.handler?.tags : [plug.handler?.tags],
                    enabled: !plug.handler?.disabled,
                    usage: plug.handler?.usage || '',
                    cmd: Array.isArray(plug.handler?.cmd) ? plug.handler?.cmd : [plug.handler?.cmd]
                }
            }).filter(item => item.name && item.desc && item.tags && item.enabled);

            if (text) {
                const tagQuery = text.toLowerCase();
                help = help.filter(plugin => plugin.tags.some(tag => tag.toLowerCase().includes(tagQuery)))

                if (help.length === 0) {
                    await conn.reply(m.chat, `Tidak ditemukan fitur dengan tag "${text}"`, m)
                    return
                }

                const groupedByTag = {};
                help.forEach(plugin => {
                    plugin.tags.forEach(tag => {
                        if (!groupedByTag[tag]) {
                            groupedByTag[tag] = [];
                        }
                        groupedByTag[tag].push(plugin);
                    });
                });

                let capt = `Hai ${name}! Selamat ${ucapan()}\n\n`
                capt += `Berikut adalah fitur dengan tag "${text}":\n\n`

                for (const [tag, plugins] of Object.entries(groupedByTag)) {
                    capt += `╭─── *${tag.toUpperCase()}* ───\n`

                    plugins.forEach((plugin, index) => {
                        capt += `│ ➤ *${plugin.name}*\n`
                        capt += `│ ◦ ${plugin.desc}\n`
                        capt += `│ ◦ Usage: ${plugin.usage || plugin.cmd.filter(c => c).map(c => `${_p}${c}`).join(' / ')}\n`

                        if (index < plugins.length - 1) capt += `│\n`
                    });

                    capt += `╰────────────────\n\n`
                }

                capt += `Total fitur ditemukan: ${help.length}\n`

                await conn.sendMessage(m.chat, {
                    text: capt, contextInfo: {
                        mentionedJid: [m.sender],
                        externalAdReply: {
                            showAdAttribution: true,
                            title: `Shiya-Botz | ${package.version}`,
                            thumbnailUrl: "https://files.catbox.moe/8g6rpf.jpeg",
                            sourceUrl: "https://whatsapp.com/channel/0029VaxCdVuFsn0eDKeiIm2c",
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                }, { quoted: payment })
                return
            }

            const tagGroups = {};
            help.forEach(plugin => {
                plugin.tags.forEach(tag => {
                    if (!tagGroups[tag]) {
                        tagGroups[tag] = [];
                    }
                    tagGroups[tag].push(plugin)
                });
            });
            let capt = `Hai ${name}! Selamat ${ucapan()}\n\n`
            capt += `Nama ku, Shiya! Aku adalah sistem otomatis (WhatsApp Bot) yang dapat membantu melakukan sesuatu, mencari dan mendapatkan data/informasi hanya melalui WhatsApp.\n\n`
            capt += `-- Informasi Bot\n`
            capt += `System: baileys (md)\n`
            capt += `Total Features: ${help.length}\n`
            capt += `Versi: ${package.version}\n\n`

            for (const [tag, plugins] of Object.entries(tagGroups)) {
                capt += `╭─── *${tag.toUpperCase()}* ───\n`

                plugins.forEach((plugin, index) => {
                    const commands = plugin.cmd.filter(c => c).map(c => `${_p}${c}`).join(' / ')
                    capt += `│ ➤ *${plugin.name}*\n`
                    capt += `│ ◦ ${plugin.desc}\n`
                    capt += `│ ◦ Usage: ${plugin.usage || commands}\n`

                    if (index < plugins.length - 1) capt += `│\n`
                });

                capt += `╰────────────────\n\n`

            }

            // footer 
            capt += `Type ${_p}menu <tag> to filter by category\n`
            capt += `Example: ${_p}menu downloader`

            await conn.sendMessage(m.chat, {
                text: capt, contextInfo: {
                    mentionedJid: [m.sender],
                    externalAdReply: {
                        showAdAttribution: true,
                        title: `Shiya-Botz | ${package.version}`,
                        thumbnailUrl: "https://files.catbox.moe/8g6rpf.jpeg",
                        sourceUrl: "https://whatsapp.com/channel/0029VaxCdVuFsn0eDKeiIm2c",
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: payment })
        } catch (e) {
            conn.reply(m.chat, 'Maaf, menu sedang error', m)
            throw e
        }
    }
}