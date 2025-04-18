const { WAMessageStubType } = require("baileys")

const isNumber = x => typeof x === 'number' && !isNaN(x)
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(function () {
    clearTimeout(conn)
    resolve()
}, ms))

exports.handler = {
    before: async (m, { conn }) => {
        //if (m.fromMe && m.isBaileys) return !0;
        if (m.messageStubType === (WAMessageStubType.CALL_MISSED_VIDEO || WAMessageStubType.CALL_MISSED_VOICE)) {
            let adit = await conn.reply(m.chat, 'Kamu Di blokir secara otomatis oleh Bot karena terdeteksi telah lancang Menelpon!\n\nJika ingin di buka blokirannya segera hubungi Owner!', null)
            await conn.sendContact(m.chat, ['6285717062467@s.whatsapp.net', 'My Owner'], adit)
            await delay(1000)
            await conn.updateBlockStatus(m.chat, "block")
        }
    }
}