const crypto = require("crypto");
const captcha = require('@neoxr/captcha');
const PhoneNumber = require('awesome-phonenumber')
const fetch = require("node-fetch");
let nodemailer = require('nodemailer');
const fs = require("fs");
let pkg = JSON.parse(fs.readFileSync('./package.json'));

let v1 = { key: { participant: '0@s.whatsapp.net', remoteJid: "0@s.whatsapp.net" }, message: { conversation: "REGISTER (1/3)" } }
let v2 = { key: { participant: '0@s.whatsapp.net', remoteJid: "0@s.whatsapp.net" }, message: { conversation: "REGISTER (2/3)" } }
let v3 = { key: { participant: '0@s.whatsapp.net', remoteJid: "0@s.whatsapp.net" }, message: { conversation: "REGISTER (3/3)" } }


function toRupiah(angka) {
    var saldo = '';
    var angkarev = angka.toString().split('').reverse().join('');
    for (var i = 0; i < angkarev.length; i++)
        if (i % 3 == 0) saldo += angkarev.substr(i, 3) + '.';
    return '' + saldo.split('', saldo.length - 1).reverse().join('');
}

function formatRupiah(number) {
    const formatter = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    });

    return formatter.format(number);
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Ignore
var code;

exports.handler = {
    name: "Registerred System",
    desc: "Helpful for registering a user",
    tags: ["Public"],
    cmd: ["register", "regmail"],
    exec: async (m, { conn, args, command }) => {
        if (command === 'register') {
            conn.register = conn.register ? conn.register : {};
            if (conn.register[m.chat]?.[m.sender]) return m.reply('You have already requesting verification');
            let user = global.db.data.users[m.sender];
            let getName = conn.getName(m.sender);
            if (user.registered === true) return m.reply('You have already registered');
            let sn = crypto.createHash("md5").update(m.sender).digest("hex");
            let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : m.fromMe ? conn.user.jid : m.sender;
            let newCaptcha = captcha();
            let image = Buffer.from(newCaptcha.image.split(',')[1], 'base64')
            let confirm = "Reply pesan ini dengan mengetik kode CAPTCHA yang ada pada gambar!";
            let { key } = await conn.sendFile(m.chat, image, '', confirm.trim(), v1);

            conn.register[m.chat] = {
                ...conn.register[m.chat],
                [m.sender]: {
                    step: 1,
                    message: m,
                    sender: m.sender,
                    otp: newCaptcha.value,
                    user,
                    key,
                    timeout: setTimeout(() => {
                        conn.sendMessage(m.chat, { delete: key });
                        delete conn.register[m.chat][m.sender];
                    }, 60 * 1000)
                }
            };

            exports.handler = {
                before: async (m, { conn }) => {
                    conn.register = conn.register ? conn.register : {};
                    if (m.isBaileys) return;
                    if (!conn.register[m.chat]?.[m.sender]) return;
                    if (!m.text) return;

                    let { timeout, otp, step, message, key } = conn.register[m.chat]?.[m.sender];

                    console.log(`Step: ${step}, Message: ${m.text}`);

                    if (step === 1) {
                        if (m.text !== otp) {
                            clearTimeout(timeout);
                            await conn.sendMessage(m.chat, { delete: key });
                            delete conn.register[m.chat]?.[m.sender];
                            return await m.reply(`🚩 Your verification code is wrong.`);
                        }
                        clearTimeout(timeout);
                        let messageName = await conn.sendMessage(m.chat, { text: "Masukan Nama Anda:" }, { quoted: v2 });
                        let nameTimeout = setTimeout(async () => {
                            await conn.sendMessage(m.chat, { delete: messageName.key });
                            delete conn.register[m.chat]?.[m.sender];
                        }, 180000);
                        conn.register[m.chat][m.sender] = { step: 2, timeout: nameTimeout, messageName };
                    } else if (step === 2) {
                        clearTimeout(conn.register[m.chat][m.sender].timeout);
                        let name = m.text.trim();
                        let user = global.db.data.users[m.sender];
                        user.name = name;
                        let messageAge = await conn.sendMessage(m.chat, { text: "Masukan Umur Anda:" }, { quoted: v3 });
                        let ageTimeout = setTimeout(async () => {
                            await conn.sendMessage(m.chat, { delete: messageAge.key });
                            delete conn.register[m.chat]?.[m.sender];
                        }, 180000);
                        conn.register[m.chat][m.sender] = { step: 3, timeout: ageTimeout, messageAge };
                    } else if (step === 3) {
                        clearTimeout(conn.register[m.chat][m.sender].timeout);
                        let age = parseInt(m.text);
                        if (isNaN(age)) {
                            return await conn.sendMessage(m.chat, { text: "🚩 Umur tidak valid. Harap masukkan umur yang valid.", quoted: m });
                        }
                        let user = global.db.data.users[m.sender];
                        user.age = age;
                        user.regTime = +new Date();
                        user.registered = true;
                        user.limit += 50;
                        // Send registration success message
                        let kontol = '0@s.whatsapp.net';
                        let today = new Date();
                        let tanggal = today.toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' });
                        let ppUrl = await conn.profilePictureUrl(m.sender, 'image').catch((_) => "https://telegra.ph/file/1dff1788814dd281170f8.jpg");

                        let tteks = '```Success Verified```\n\n';
                        tteks += '```Name:``` ' + `${user.name}\n`;
                        tteks += '```Age:``` ' + `${user.age}\n`;
                        tteks += '```Number:``` ' + `${PhoneNumber('+' + m.sender.split('@')[0]).getNumber('international')}\n`;
                        tteks += '```Date:``` ' + `${tanggal}\n\n`;
                        tteks += '```RPG StarterPack```\n\n';
                        tteks += '```Limit:``` ' + `${user.limit}\n`;
                        tteks += `Supported By @${kontol.replace(/@.+/g, '')}`;
                        await conn.sendMessage(m.chat, {
                            text: tteks,
                            contextInfo: {
                                mentionedJid: [kontol],
                                externalAdReply: {
                                    showAdAttribution: true,
                                    title: 'Shiya-chan',
                                    body: `Version: ${pkg.version}`,
                                    thumbnailUrl: ppUrl,
                                    mediaType: 1,
                                    renderLargerThumbnail: true
                                }
                            }
                        }, { quoted: m });
                        delete conn.register[m.chat]?.[m.sender];
                    }
                }
            }
        } else if (command === 'regmail') {
            if (m.isGroup) return conn.sendMessage(m.chat, { text: 'Perintah hanya bisa digunakan di Private Chat' }, { quoted: m });
            conn.regmail = conn.regmail ? conn.regmail : {};
            if (conn.regmail[m.chat]?.[m.sender]) {
                return m.reply('You are requesting verification! please check your email box!');
            }
            let users = global.db.data.users[m.sender];
            let name = await conn.getName(m.sender);
            if (users.registered === true) {
                return conn.reply(m.chat, Func.texted('bold', `✅ Your number is already verified.`), m);
            }
            if (!args || !args[0]) {
                return conn.reply(m.chat, `• *Example :* .${command} yourmail@gmail.com`, m);
            }

            await conn.sendMessage(m.chat, { react: { text: '🕒', key: m.key } });

            if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/ig.test(args[0])) {
                return conn.reply(m.chat, Func.texted('bold', '🚩 Invalid email.'), m);
            }

            code = `${getRandomInt(100, 900)}-${getRandomInt(100, 900)}`;
            let yuki = conn.user.jid.split("@")[0];
            users.codeExpire = new Date * 1;
            users.code = code;
            users.email = args[0];

            let transport = nodemailer.createTransport({
                service: "gmail",
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: global.smtp.user,
                    pass: global.smtp.pass
                }
            });

            let mailOptions = {
                from: {
                    name: 'Shiya System Service',
                    address: 'shiyabotz.offc@gmail.com'
                },
                to: args[0],
                subject: 'Email Verification',
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #0f0f0f, #1c1c1c); padding: 40px; text-align: center; border-radius: 15px; color: #ffffff; box-shadow: 0px 0px 30px 10px rgba(0, 191, 255, 0.8);">
                        <div style="background-color: #181818; padding: 35px; border-radius: 15px;">
                            <h2 style="color: #00bfff; font-size: 28px;">Hi <b>${name} 😘</b>,</h2>
                            <p style="color: #cccccc; font-size: 18px;">
                                Confirm your email to start using <b>Shiya Botz</b>. Please enter the verification code below in the bot. The code will expire in 3 minutes.
                            </p>
                            <h1 style="color: #00bfff; font-size: 48px; margin: 30px 0; text-shadow: 0 0 20px #00bfff, 0 0 10px #00bfff;">${code}</h1>
                            <p style="font-size: 14px; color: #999999;">
                                Click the button below to automatically send the code:
                            </p>
                            <a href="https://wa.me/${yuki}?text=${code}" style="display: inline-block; margin-top: 25px; padding: 15px 35px; background-color: #00bfff; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 18px; box-shadow: 0px 0px 20px 5px rgba(0, 191, 255, 0.8); transition: all 0.3s ease-in-out;">
                                Verify
                            </a>
                            <hr style="border-top: 1px dashed #333333; margin: 35px 0;">
                            <p style="font-size: 12px; color: #666666;">
                                Powered by: <b>DitzOfc</b><br> 
                                <i>All rights reserved © Yuki-chan</i>
                            </p>
                            <div style="margin-top: 10px;">
                                <a href="https://github.com/DitzDev" style="margin: 0 5px;">
                                    <img src="https://cdn-icons-png.flaticon.com/512/25/25231.png" alt="GitHub" style="width: 20px; height: 20px; opacity: 0.7;">
                                </a>
                                <a href="https://www.tiktok.com/@ditz.ofc" style="margin: 0 5px;">
                                    <img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" alt="TikTok" style="width: 20px; height: 20px; opacity: 0.7;">
                                </a>
                                <a href="https://www.youtube.com/@DitzDev" style="margin: 0 5px;">
                                    <img src="https://cdn-icons-png.flaticon.com/512/174/174883.png" alt="YouTube" style="width: 20px; height: 20px; opacity: 0.7;">
                                </a>
                                <a href="https://www.instagram.com/wayssokasik" style="margin: 0 5px;">
                                    <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" alt="Instagram" style="width: 20px; height: 20px; opacity: 0.7;">
                                </a>
                                <a href="https://t.me/Ditzstore236" style="margin: 0 5px;">
                                    <img src="https://cdn-icons-png.flaticon.com/512/2111/2111646.png" alt="Telegram" style="width: 20px; height: 20px; opacity: 0.7;">
                                </a>
                            </div>
                        </div>
                    </div>`
            };

            transport.sendMail(mailOptions, function (err, data) {
                if (err) {
                    return m.reply(Func.texted('bold', `❌ SMTP Error !!`));
                } else {
                    conn.reply(m.chat, Func.texted('bold', `✅ Check your mailbox for the verification code.`), m);
                }
            });

            conn.regmail[m.chat] = {
                ...conn.regmail[m.chat],
                [m.sender]: {
                    step: 1,
                    message: m,
                    sender: m.sender,
                    otp: code,
                    users,
                    timeout: setTimeout(() => {
                        delete conn.regmail[m.chat][m.sender];
                    }, 60 * 1000)
                }
            }

            exports.handler = {
                before: async (m, { conn }) => {
                    conn.regmail = conn.regmail ? conn.regmail : {};
                    if (m.isBaileys) return;
                    if (!conn.regmail[m.chat]?.[m.sender]) return;
                    if (!m.text) return;

                    let user = global.db.data.users[m.sender];
                    if (user?.registered) {
                        delete conn.regmail[m.chat]?.[m.sender];
                        return;
                    }

                    let { timeout, otp, step, message } = conn.regmail[m.chat]?.[m.sender];
                    console.log(`Step: ${step}, Message: ${m.text}`);
                    if (step === 1) {
                        if (m.text !== otp) {
                            clearTimeout(timeout);
                            delete conn.regmail[m.chat]?.[m.sender];
                            return await m.reply(`🚩 Your verification code is wrong.`);
                        }
                        clearTimeout(timeout);
                        let messageName = await conn.sendMessage(m.chat, { text: "Masukan Nama Anda:" }, { quoted: m });
                        let nameTimeout = setTimeout(async () => {
                            await conn.sendMessage(m.chat, { delete: messageName.key });
                            delete conn.regmail[m.chat]?.[m.sender];
                        }, 180000);
                        conn.regmail[m.chat][m.sender] = { step: 2, timeout: nameTimeout, messageName };
                    } else if (step === 2) {
                        clearTimeout(conn.regmail[m.chat][m.sender].timeout);
                        let name = m.text.trim();
                        user.name = name;
                        let messageAge = await conn.sendMessage(m.chat, { text: "Masukan Umur Anda:" }, { quoted: m });
                        let ageTimeout = setTimeout(async () => {
                            await conn.sendMessage(m.chat, { delete: messageAge.key });
                            delete conn.regmail[m.chat]?.[m.sender];
                        }, 180000);
                        conn.regmail[m.chat][m.sender] = { step: 3, timeout: ageTimeout, messageAge };
                    } else if (step === 3) {
                        clearTimeout(conn.regmail[m.chat][m.sender].timeout);
                        let ageText = m.text.trim();
                        let age = parseInt(ageText);

                        if (isNaN(age) || age <= 0) {
                            console.log('Invalid age detected:', age);
                            return await conn.sendMessage(m.chat, { text: "🚩 Umur tidak valid. Harap masukkan umur yang valid." }, { quoted: m });
                        }

                        user.age = age;
                        user.regTime = +new Date();
                        user.registered = true;
                        user.limit += 50;

                        await conn.reply(m.chat, '✅ Succes! (+50 Limits)', m);
                        delete conn.regmail[m.chat]?.[m.sender];
                    }
                }
            }
        }
    }
}