#!/usr/bin/env bash
# Builds the signed .aab you upload to Google Play.
# One-time: create your upload key next to this repo's root (keep it and the passwords safe - you need them for every update):
#   keytool -genkeypair -v -keystore honk-upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
# Then each release:
#   KEYSTORE_PASS=... KEY_PASS=... VERSION_CODE=2 bash scripts/build_android_release.sh
set -e
cd "$(dirname "$0")/.."
[ -f honk-upload.jks ] || { echo "Missing honk-upload.jks (see the keytool line at the top of this script)."; exit 1; }
: "${KEYSTORE_PASS:?set KEYSTORE_PASS}"; : "${KEY_PASS:?set KEY_PASS}"
npx cap sync android
bash scripts/configure_android.sh
npx cap build android --androidreleasetype AAB --keystorepath ../honk-upload.jks --keystorealias upload --keystorepass "$KEYSTORE_PASS" --keystorealiaspass "$KEY_PASS"
echo "Done. Upload android/app/build/outputs/bundle/release/app-release-signed.aab (or app-release.aab) in Play Console."
