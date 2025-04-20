exports.handler = {
    cmd: ["self", "Public"],
    opts: {
        owner: true
    },
    exec: async (m, { conn, command }) => {
        if (command === "self") {
            if (opts["self"]) throw "*[ ! ] self has been activated previously*";
            opts["self"] = true;
            m.reply("[ ✓ ] self activated successfully");
        } else if (command === "public") {
            if (!opts["self"]) throw "*[ ! ] public has been activated previously*";
            opts["self"] = false;
            m.reply("[ ✓ ] public activated successfully");
        }
    }
}