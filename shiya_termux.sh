#!/data/data/com.termux/files/usr/bin/bash

spinner() {
    local pid=$!
    local delay=0.1
    local spinstr='|/-\'
    while [ "$(ps a | awk '{print $1}' | grep $pid)" ]; do
        local temp=${spinstr#?}
        printf " [%c]  " "$spinstr"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b\b\b\b"
    done
    printf "    \b\b\b\b"
}

progress_bar() {
    local duration=${1}
    local columns=$(tput cols)
    local space=$(( columns - 20 ))
    local increment=$((100/$duration))
    local current=0
    
    printf "\n"
    while [ $current -le 100 ]; do
        printf "\rProgress: ["
        local pos=0
        while [ $pos -lt $((current * space / 100)) ]; do
            printf "="
            pos=$((pos+1))
        done
        printf ">"
        while [ $pos -lt $space ]; do
            printf " "
            pos=$((pos+1))
        done
        printf "] %d%%" $current
        current=$((current + increment))
        sleep 1
    done
    printf "\n\n"
}

check_termux_version() {
    local required_version="0.118.2"
    local current_version=$TERMUX_VERSION
    
    if [ -z "$current_version" ]; then
        echo -e "\033[1;31mError: Unable to detect Termux version!\033[0m"
        return 1
    fi
    
    if [ "$(printf '%s\n' "$required_version" "$current_version" | sort -V | head -n1)" != "$required_version" ]; then
        echo -e "\033[1;33mYour Termux Version ($current_version) lower than required ($required_version). Please install a compatible version.\033[0m"
        echo -e "\033[1;36mRedirecting to the Termux GitHub page...\033[0m"
        sleep 2
        am start -a android.intent.action.VIEW -d "https://github.com/termux/termux-app/releases" > /dev/null 2>&1
        return 1
    fi
    return 0
}

clear

echo -e "\033[1;34m"
cat << "EOF"
  
     __                      __   __  ___ __ 
    /__` |__| | \ /  /\  __ |__) /  \  |   / 
   .__/  |  | |  |  /~~\    |__) \__/  |  /_ 
         Installer, Made by DitzDev
                                         
EOF
echo -e "\033[0m"

echo -e "\033[1;32mChecking Termux version...\033[0m"
if ! check_termux_version; then
    exit 1
fi
echo -e "\033[1;32mTermux version compatible!\033[0m"
sleep 1

echo -e "\n\033[1;32mUpdating packages...\033[0m"
pkg update -y > /dev/null 2>&1 & spinner
pkg upgrade -y > /dev/null 2>&1 & spinner

echo -e "\n\033[1;32mInstalling required modules...\033[0m"
pkg install -y ffmpeg imagemagick ncurses-utils libpixman libcairo pango x11-repo xorgproto clang python nodejs-lts yarn > /dev/null 2>&1 & spinner

echo -e "\n\033[1;32mCreating a Node-GYP configuration...\033[0m"
mkdir -p ~/.gyp && echo "{'variables':{'android_ndk_path':''}}" > ~/.gyp/include.gypi & spinner

echo -e "\n\033[1;32mInstalling Yarn dependencies...\033[0m"
yarn install --silent > /dev/null 2>&1 & spinner

progress_bar 3

echo -e "\033[1;32mInstallation complete!\033[0m"
echo -e "\033[1;36mAll modules have been successfully installed.\033[0m"