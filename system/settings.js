global.sessionName = 'shiya'; // Jangan di ubah
global.owner = [
    ['6285717062467'],
    ['6285717062467'],
    ['6285717062467', 'DitzDev', 'contact@ditzdev.my.id', true]
] // Put your number here

/// ++++++ SMTP CONFIG FOR REGMAIL +++++
global.smtp = {
    user: process.env.SMTP_USER || '', /** Replace with your user email */
    pass: process.env.SMTP_PASS || '', /** Replace with your user smtp password */
}