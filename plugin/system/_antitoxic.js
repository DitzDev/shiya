const isToxic = /(anj[kg]|ajn[gk]|a?njin[gk]|bajingan|b[a]?[n]?gsa?t|ko?nto?l|me?me?[kq]|pe?pe?[kq]|meki|titi[t,d]|pe?ler|tetek|toket|ngewe|go?blo?k|to?lo?l|idiot|[kng]e?nto?[t,d]|jembut|bego|dajjal|janc[uo]k|pantek|puki?(mak)?|kimak|kampang|lonte|col[i,mek]|pelacur|henceut|nigga|fuck|dick|bitch|tits|bastard|asshole|a[su,w,yu])/i;

exports.handler = {
    before: async (m, { conn }) => {
        if (m.isBaileys && m.fromMe)
            return !0
        if (!m.isGroup) return !1
        let user = global.db.data.users[m.sender]
        let chat = global.db.data.chats[m.chat]
        const isAntiToxic = isToxic.exec(m.text)

        if (chat.antiToxic && isAntiToxic) {
            user.warn += 1
            m.reply(`${user.warn >= 5 ? 'Peringatan Kamu Sudah 5, Kamu Akan Di Keluarkan Dari Group ><' : 'Kata Toxic Terdeteksi +1 Peringatan'}`)
            if (user.warn >= 5) {
                user.warn = 0
                global.db.data.users[m.sender].banned = true
                conn.updateBlockStatus(m.sender, "block")
                conn.groupParticipantsUpdate(m.chat, [m.sender], "remove")
            }
        }
        return !0
    }
}