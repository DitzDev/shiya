const fs = require("fs");
const path = require("path");

exports.handler = {
    name: 'Clear Session',
    cmd: /^(csesi)$/i,
    opts: {
        owner: true
    },
    exec: async (m, { conn }) => {
        const directory = './'.concat(global.sessionName);
        const sampah = [];

        fs.readdir(directory, (err, files) => {
            if (err) {
                console.error("Terjadi kesalahan:", err);
                return;
            }
            files.forEach((file) => {
                sampah.push(file);
                const filePath = path.join(directory, file);
                if (file !== "creds.json") {
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            console.error("Gagal menghapus file:", err);
                            return;
                        }
                    });
                }
            });
            m.reply(`Success Delete File Trash Total: *[ ${sampah.length} ]*`);
        });
    }
}