exports.handler = {
    before: async (m, { conn }) => {
        const chat = global.db.data.chats[m.chat];
        if (!chat.ngetik) return;

        const commands = Object.values(global.plugins).flatMap((plugin) => [].concat(plugin.handler.cmd));
        const presenceStatus = commands.some((cmd) => (cmd instanceof RegExp ? cmd.test(m.text) : m.text.includes(cmd))) ? 'composing' : 'composing';

        if (presenceStatus) await conn.sendPresenceUpdate(presenceStatus, m.chat);
    }
}