const chalk = require("chalk");

function consoleWarn(text) {
    console.log(chalk.bgBlack(chalk.yellow("[ WARN ] ")), text);
}

function consoleInfo(text) {
    console.log(chalk.bgBlack(chalk.green("[ INFO ] ")), text);
}

function consoleErr(text) {
    console.log(chalk.bgBlack(chalk.redBright("[ ERROR ] ")), text);
}

module.exports = { consoleWarn, consoleErr, consoleInfo }