exports.handler = {
    name: "Ping",
    cmd: ['ping', 'p', 'test'],
    desc: "Check bot response time",
    tags: ['Tools 🔨'],
    opts: {
        admin: true
    },
    usage: "ping",
    exec: async (m, { conn }) => {
        const start = new Date();
        const msg = await conn.sendMessage(m.chat, {
            text: 'Testing ping...'
        }, { quoted: m });
        const end = new Date();
        const responseTime = end - start;
        await conn.sendMessage(m.chat, {
            text: `🏓 Pong!\nResponse time: ${responseTime}ms`
        }, { quoted: m })
    }
}