let fs = require("fs")
let path = require("path")

exports.handler = {
    name: "Delete & Create plugin",
    cmd: ["sfp", "dfp"],
    opts: {
        owner: true
    },
    exec: async (m, { conn, text, command }) => {
        if (command === "sfp") {
            conn.createPlugin = conn.createPlugin ? conn.createPlugin : {};
            if (conn.createPlugin[m.chat]?.[m.sender]) return m.reply('🚩 You already have an ongoing plugin creation process');

            let msgFileName = await conn.sendMessage(m.chat, {
                text: "🔹 Enter plugin filename (without .js):"
            }, { quoted: m });

            conn.createPlugin[m.chat] = {
                ...conn.createPlugin[m.chat],
                [m.sender]: {
                    step: 1,
                    data: {
                        filename: '',
                        description: 'No description provided',
                        tags: ['Misc'],
                        params: 'm',
                        code: '',
                        location: 'plugins'
                    },
                    msgFileName,
                    timeout: setTimeout(() => {
                        conn.sendMessage(m.chat, { delete: msgFileName.key });
                        delete conn.createPlugin[m.chat][m.sender];
                        m.reply('⏱️ Plugin creation timed out. Please try again.');
                    }, 300000) // 5 minutes timeout
                }
            };

            exports.handler = {
                before: async (m, { conn }) => {
                    conn.createPlugin = conn.createPlugin ? conn.createPlugin : {};
                    if (m.isBaileys) return;
                    if (!conn.createPlugin[m.chat]?.[m.sender]) return;
                    if (!m.text) return;

                    let { timeout, step, data } = conn.createPlugin[m.chat]?.[m.sender];

                    if (step === 1) { // Filename
                        clearTimeout(timeout);
                        if (!/^[\w-]+$/.test(m.text)) {
                            return m.reply('🚩 Invalid filename. Please use only letters, numbers, underscores, and hyphens.');
                        }

                        data.filename = m.text;
                        let msgDesc = await conn.sendMessage(m.chat, {
                            text: "🔹 Enter plugin description (or type 'skip' to use default):"
                        }, { quoted: m });

                        conn.createPlugin[m.chat][m.sender] = {
                            step: 2,
                            data,
                            msgDesc,
                            timeout: setTimeout(() => {
                                conn.sendMessage(m.chat, { delete: msgDesc.key });
                                delete conn.createPlugin[m.chat][m.sender];
                                m.reply('⏱️ Plugin creation timed out. Please try again.');
                            }, 300000)
                        };

                    } else if (step === 2) { // Description
                        clearTimeout(timeout);
                        if (m.text.toLowerCase() !== 'skip') {
                            data.description = m.text;
                        }

                        let msgTags = await conn.sendMessage(m.chat, {
                            text: "🔹 Enter plugin tags separated by commas (or type 'skip' to use default):"
                        }, { quoted: m });

                        conn.createPlugin[m.chat][m.sender] = {
                            step: 3,
                            data,
                            msgTags,
                            timeout: setTimeout(() => {
                                conn.sendMessage(m.chat, { delete: msgTags.key });
                                delete conn.createPlugin[m.chat][m.sender];
                                m.reply('⏱️ Plugin creation timed out. Please try again.');
                            }, 300000)
                        };

                    } else if (step === 3) { // Tags
                        clearTimeout(timeout);
                        if (m.text.toLowerCase() !== 'skip') {
                            data.tags = m.text.split(',').map(tag => tag.trim());
                        }

                        let msgParams = await conn.sendMessage(m.chat, {
                            text: "🔹 Enter function parameters for exec (separated by commas, 'm' is already included):\n\nExample: conn, text, command"
                        }, { quoted: m });

                        conn.createPlugin[m.chat][m.sender] = {
                            step: 4,
                            data,
                            msgParams,
                            timeout: setTimeout(() => {
                                conn.sendMessage(m.chat, { delete: msgParams.key });
                                delete conn.createPlugin[m.chat][m.sender];
                                m.reply('⏱️ Plugin creation timed out. Please try again.');
                            }, 300000)
                        };

                    } else if (step === 4) { // Exec parameters
                        clearTimeout(timeout);
                        let params = 'm';
                        if (m.text && m.text.trim() !== '') {
                            params += ', { ' + m.text.trim() + ' }';
                        } else {
                            params += ', { conn }';
                        }
                        data.params = params;

                        let msgCode = await conn.sendMessage(m.chat, {
                            text: "🔹 Enter the plugin code (the actual function body):"
                        }, { quoted: m });

                        conn.createPlugin[m.chat][m.sender] = {
                            step: 5,
                            data,
                            msgCode,
                            timeout: setTimeout(() => {
                                conn.sendMessage(m.chat, { delete: msgCode.key });
                                delete conn.createPlugin[m.chat][m.sender];
                                m.reply('⏱️ Plugin creation timed out. Please try again.');
                            }, 300000)
                        };

                    } else if (step === 5) { // Code
                        clearTimeout(timeout);
                        data.code = m.text;

                        let msgLocation = await conn.sendMessage(m.chat, {
                            text: "🔹 Enter the plugin location (or type 'default' for plugins folder):\n\nExample: plugins/downloader/youtube"
                        }, { quoted: m });

                        conn.createPlugin[m.chat][m.sender] = {
                            step: 6,
                            data,
                            msgLocation,
                            timeout: setTimeout(() => {
                                conn.sendMessage(m.chat, { delete: msgLocation.key });
                                delete conn.createPlugin[m.chat][m.sender];
                                m.reply('⏱️ Plugin creation timed out. Please try again.');
                            }, 300000)
                        };

                    } else if (step === 6) { // Location
                        clearTimeout(timeout);

                        if (m.text.toLowerCase() !== 'default') {
                            data.location = m.text;
                        }

                        const pluginContent = generatePluginContent(data);

                        try {
                            const dirPath = path.join(process.cwd(), data.location);
                            if (!fs.existsSync(dirPath)) {
                                fs.mkdirSync(dirPath, { recursive: true });
                            }

                            const filePath = path.join(dirPath, `${data.filename}.js`);
                            fs.writeFileSync(filePath, pluginContent);

                            let previewText = '```' + pluginContent.substring(0, 300) + '```';
                            if (pluginContent.length > 300) previewText += '\n... (truncated)';

                            await m.reply(`✅ Plugin created successfully! (Bot Will Restart)\n\n📄 File: ${data.location}/${data.filename}.js\n\n📝 Preview:\n${previewText}`);

                        } catch (error) {
                            await m.reply(`🚩 Error creating plugin: ${error.message}`);
                        }

                        delete conn.createPlugin[m.chat]?.[m.sender];
                        console.log("Restarting...");
                        process.send('reset')
                    }
                }
            };

        } else if (command === "dfp") { // Delete file plugin
            if (!text) return m.reply(`🚩 Please provide the plugin path to delete\n\nExample: .dfp plugins/downloader/youtube.js`);

            try {
                const filePath = path.resolve(process.cwd(), text);

                // Safety checks
                if (!filePath.endsWith('.js')) {
                    return m.reply('🚩 Only .js files can be deleted with this command');
                }

                if (!filePath.includes('plugin')) {
                    return m.reply('🚩 For safety reasons, you can only delete files within the plugins directory');
                }

                if (!fs.existsSync(filePath)) {
                    return m.reply(`🚩 File not found: ${text}`);
                }

                conn.deletePlugin = conn.deletePlugin ? conn.deletePlugin : {};

                if (conn.deletePlugin[m.sender]) {
                    clearTimeout(conn.deletePlugin[m.sender].timeout);
                    fs.unlinkSync(filePath);
                    delete conn.deletePlugin[m.sender];
                    return m.reply(`✅ Successfully deleted plugin: ${text}`);
                }

                m.reply(`⚠️ Are you sure you want to delete ${text}?\n\nType .dfp ${text} again to confirm.`);

                conn.deletePlugin[m.sender] = {
                    path: text,
                    timeout: setTimeout(() => {
                        delete conn.deletePlugin[m.sender];
                    }, 60000) // 1 minute timeout
                };
            } catch (error) {
                m.reply(`🚩 Error deleting plugin: ${error.message}`);
            }
        }
    }
};


function generatePluginContent(data) {
    return `/**
 * Plugin: ${data.filename}
 * Description: ${data.description}
 * Created with sfp command
 */

exports.handler = {
    name: "${capitalizeFirstLetter(data.filename)}",
    desc: "${data.description}",
    tags: ${JSON.stringify(data.tags)},
    cmd: ["${data.filename}"],
    exec: async (${data.params}) => {
        ${data.code}
    }
};`;
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}