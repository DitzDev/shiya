let NeoApi = require("@neoxr/wb")
let b = new NeoApi();

function pickRandom(list) {
    return list[Math.floor(list.length * Math.random())];
}

exports.handler = {
    all: async (m) => {
        let name = await conn.getName(m.sender);
        let pp = "https://files.catbox.moe/8g6rpf.jpegglobal.thumb";
        try {
            pp = await this.profilePictureUrl(m.sender, "image");
        } catch (e) {
        } finally {
            global.fetch = require("node-fetch");
            global.doc = pickRandom([
                "application/vnd.ms-excel",
                "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                "application/msword",
                "application/pdf",
            ]);
            global.Func = b.Function;
            global.fkontak = {
                key: {
                    remoteJid: "0@s.whatsapp.net",
                    participant: "0@s.whatsapp.net",
                    id: "",
                },
                message: {
                    conversation: `©DitzOfc`,
                },
            };
        }
    }
}