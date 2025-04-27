exports.handler = {
    name: 'Broadcast Group',
    cmd: ['bcgc'],
    opts: {
        owner: true
    },
    exec: async (m, { conn, text, participants, usedPrefix, command }) => {
        if (!text) throw `*Example :* ${usedPrefix + command} Ready Open BO, Minat? Chat aja.`
        let gc = Object.entries(conn.chats)
            .filter(
                ([jid, chat]) =>
                    jid.endsWith("@g.us") && chat.isChats && !chat.metadata?.read_only && !chat.metadata?.announce
            )
            .map((v) => v[0]);
        conn.reply(m.chat, `Sending Broadcast to Group: [ ${gc.length} ]`, m)

        for (let id of gc) {
            let memberGob = participants.map((i) => i.id)
            await conn.sendMessage(id, { text: `*[ BROADCAST CHAT ]*\n*• FROM :* @${m.sender.split("@")[0]}\n<=========================>\n${text}`, mentions: [m.sender] }, { quoted: m }).catch((_) => _)
        }
    }
}