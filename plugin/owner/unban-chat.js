exports.handler = {
    name: 'Unbanned Chat',
    cmd: /^(unbanchat|bangun)$/i,
    usePrefix: false,
    opts: {
        mods: true
    },
    exec: async (m, { conn, participants }) => {
        global.db.data.chats[m.chat].isBanned = false
        conn.reply(m.chat, 'Wakata~', m)
    }
}