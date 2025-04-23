<div align="center">

# Shiya-Botz

### Shiya Botz | Open Source Project

<img src="media/shiya.png" width="240" height="240" alt="Li Shiya">

</div>

<div align="center">

[![Open Source](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://github.com/ellerbrock/open-source-badges) [![Watchers](https://img.shields.io/github/watchers/DitzDev/shiya.svg)](https://github.com/DitzDev/shiya/watchers) [![Stars](https://img.shields.io/github/stars/DitzDev/shiya.svg)](https://github.com/DitzDev/shiya/stargazers) [![Forks](https://img.shields.io/github/forks/DitzDev/shiya.svg)](https://github.com/DitzDev/shiya/network/members) [![Repo Size](https://img.shields.io/github/repo-size/DitzDev/shiya.svg)](https://github.com/DitzDev/shiya) [![Issues](https://img.shields.io/github/issues/DitzDev/shiya)](https://github.com/DitzDev/shiya/issues)

<img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/colored.png"/>

</div>

> [!WARNING]
> This project is still under development!!!!

## Introduction
Shiya-Botz is a lightweight WhatsApp bot script, using libraries from [Baileys](https://github.com/WhiskeySockets/Baileys). This project is designed to be a simple and easy-to-use bot for WhatsApp, with a focus on user experience and customization. With Type **plugin**, users no longer need to manage or develop complicated code.

> [!NOTE]
> This project is the latest version of [YukiBotz](https://github.com/DitzDev/YukiBotz) built from zero to fix issues, and make some changes.

### Features
- [x] **Plugin-based architecture**: Easily add or remove features without modifying the core code.
- [x] **Customizable**: Users can customize the bot's behavior, appearance, and functionality
- [x] **No session time out or other problems related to the session**: While the bot is running, the process will not stop because it is built with an error handler.
- [x] **Flexible**: Run all conditions in one file.

## Installation
To install & run Shiya-Botz, follow these steps:

### Requirements
- [x] [Node.js](https://nodejs.org/) (18.x or higher)
- [x] [FFmpeg](https://www.ffmpeg.org/) Installed
- [x] [ImageMagick](https://imagemagick.org/) Installed 

### Steps
- Clone the repository using the following command: `git clone https://github.com/DitzDev/shiya`. Or download the zip file from the [Release Page](https://github.com/DitzDev/shiya/releases).
- Install the required packages by running `npm install` or `yarn install` in the project directory.
- **Important!** The first time you connect, you must run:
  ```bash
  npm run preconnect # For QRCode
  npm run preconnect:pairing # For Pairing Code
  ```
- Run the bot using `npm start` or `yarn start` in the project directory. And congrats your bot is live ~

## For Termux Users

> [!WARNING]
> For termux users, this step is recommended, because this script will install several native modules such as "canvas"

To install Shiya-Botz on Termux, ensure you have a compatible environment by executing the following commands:
```bash
# Enter to directory project, then
bash shiya_termux.sh
```

> [!NOTE]
> This process will take quite a long time, it will install the required dependencies, make sure you have a stable internet connection.

- Next step, you just need to follow the steps above.

## Issue
If you encounter any issues, please report them to the [Issues Page](https://github.com/DitzDev/shiya/issues).

## License
Shiya-Botz is released under the [MIT License](LICENSE). Click to see