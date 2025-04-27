exports.handler = {
    name: 'Banned Chat',
    cmd: /^(banchat|turu)$/i,
    usePrefix: false,
    opts: {
        mods: true
    },
    exec: async (m, { conn }) => {
        conn.reply(m.chat, 'Baiklah', m)
        global.db.data.chats[m.chat].isBanned = true
    }
}