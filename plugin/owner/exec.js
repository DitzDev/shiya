let cp = require("child_process");
let { promisify } = require("util");
let exec = promisify(cp.exec).bind(cp);

exports.handler = {
    name: "Execute Code",
    description: "Execute a code snippet",
    cmd: /^[$]/,
    usePrefix: false,
    opts: {
        owner: true
    },
    exec: async (m, { conn }) => {
        if (global.conn.user.jid != conn.user.jid) return;
        m.reply("Executing...");
        let o;
        try {
            o = await exec(command.trimStart() + " " + text.trimEnd());
        } catch (e) {
            o = e;
        } finally {
            let { stdout, stderr } = o;
            if (stdout) m.reply(stdout);
            if (stderr) m.reply(stderr);
        }
    }
}