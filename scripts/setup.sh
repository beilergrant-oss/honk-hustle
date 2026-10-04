#!/usr/bin/env bash
# Run on a Mac with Xcode installed:  bash scripts/setup.sh
set -e
cd "$(dirname "$0")/.."
command -v node >/dev/null || { echo "Install Node.js 18+ first: https://nodejs.org"; exit 1; }
echo "==> Installing packages"; npm install
if [ ! -d ios ]; then echo "==> Creating the Xcode project"; npx cap add ios; fi
echo "==> Generating the app icon and launch image from assets/"; npx capacitor-assets generate --ios --iconBackgroundColor '#35b6ff' --splashBackgroundColor '#0e1730' || echo "(icon step failed - you can drag assets/icon.png into Xcode's AppIcon instead)"
echo "==> Copying the game into the Xcode project"; npx cap sync ios
bash scripts/configure_ios.sh
echo "==> Opening Xcode"; npx cap open ios
