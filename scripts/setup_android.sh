#!/usr/bin/env bash
# Creates and opens the Android Studio project. Runs on Mac, Windows (Git Bash / WSL) or Linux with
# Node 22+ and Android Studio Otter (2025.2.1) or newer installed:  bash scripts/setup_android.sh
set -e
cd "$(dirname "$0")/.."
command -v node >/dev/null || { echo "Install Node.js 22+ first: https://nodejs.org"; exit 1; }
echo "==> Installing packages"; npm install
if [ ! -d android ]; then echo "==> Creating the Android Studio project"; npx cap add android; fi
echo "==> Generating the adaptive app icon and splash from assets/"; npx capacitor-assets generate --android --iconBackgroundColor '#35b6ff' --splashBackgroundColor '#0e1730' || echo "(icon step failed - you can use Android Studio > New > Image Asset with assets/icon.png instead)"
echo "==> Copying the game into the Android project"; npx cap sync android
bash scripts/configure_android.sh
echo "==> Opening Android Studio"; npx cap open android
