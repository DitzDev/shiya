let fetch = require("node-fetch");

exports.handler = {
    name: 'TikTok Downloader',
    desc: 'Download TikTok Videos & Photo',
    usage: 'tiktok <url>',
    cmd: ['tt', 'tiktok'],
    tags: ['Downloader'],
    limit: true,
    exec: async (m, { conn, text, usedPrefix, command }) => {
        if (!text) {
            return conn.reply(m.chat, `• *Example :* ${usedPrefix}tiktok https://vm.tiktok.com/xxxxx`, m);
        }

        if (!text.match(/tiktok/gi)) {
            return conn.reply(m.chat, 'Make sure the link is from TikTok', m);
        }

        conn.sendMessage(m.chat, {
            react: {
                text: '🕒',
                key: m.key,
            }
        });

        try {
            let response = await fetch(`https://api.tiklydown.eu.org/api/download?url=${text}`);
            let data = await response.json();

            if (data.images && data.images.length > 0) {
                for (let img of data.images) {
                    await conn.sendMessage(m.chat, { image: { url: img.url }, caption: '' }, { quoted: m });
                }
            } else if (data.video && data.video.noWatermark) {
                await conn.sendMessage(m.chat, {
                    video: { url: data.video.noWatermark },
                    caption: `${data.title ?? "No Title Available"}`
                }, { quoted: m });
            }

            if (data.music && data.music.play_url) {
                await conn.sendMessage(m.chat, {
                    audio: { url: data.music.play_url },
                    mimetype: 'audio/mpeg'
                }, { quoted: m });
            } else {
                m.reply('Sorry, no audio available.');
            }

        } catch (e) {
            console.error(e);
            m.reply('Sorry, an error occurred.');
        }
    }
}