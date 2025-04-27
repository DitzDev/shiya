exports.handler = {
    name: 'Banned User',
    cmd: /^(ban)$/i,
    opts: {
        mods: true
    },
    exec: async (m, { conn, text }) => {
        let user = global.db.data.users[m.sender]
        if (!text) return conn.reply(m.chat, '• *Example :* .ban 628xx', m)
        let who
        if (m.isGroup) who = m.mentionedJid[0]
        else who = m.chat
        if (!who) return conn.reply(m.chat, '🚩 Tags you want to ban bots', m)
        let users = global.db.data.users
        users[who].banned = true
        conn.sendMessage(m.chat, { react: { text: '☑️', key: m.key } })
        if (global.db.data.users[who].premium == true) {
            user.premium = true
            global.db.data.users[who].banned = false
            conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
            return conn.reply(m.chat, '🚩 Cant chapter him because hes a special member', m)
        }
    }
}