exports.handler = {
    name: 'Unbanned User',
    cmd: /^(unban)$/i,
    opts: {
        mods: true
    },
    exec: async (m, { conn, text }) => {
        if (!text) throw '• *Example :* .unban 628816609112'
        let who
        if (m.isGroup) who = m.mentionedJid[0]
        else who = m.chat
        if (!who) throw 'Tag yang ingin di unban Bot'
        let users = global.db.data.users
        users[who].banned = false
        conn.sendMessage(m.chat, { react: { text: '☑️', key: m.key } })
    }
}