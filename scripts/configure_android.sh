#!/usr/bin/env bash
# Portrait only, app name, version name/code. Safe to re-run.
#   VERSION_CODE=2 bash scripts/configure_android.sh     (every upload to Google Play needs a higher versionCode)
cd "$(dirname "$0")/.."
M="android/app/src/main/AndroidManifest.xml"; G="android/app/build.gradle"; S="android/app/src/main/res/values/strings.xml"
[ -f "$M" ] || { echo "No $M yet. Run: npx cap add android"; exit 0; }
grep -q 'android:screenOrientation' "$M" || perl -pi -e 's#android:name="\.MainActivity"#android:name=".MainActivity"\n            android:screenOrientation="portrait"#' "$M"
[ -f "$S" ] && sed -i.bak -E 's#(<string name="app_name">)[^<]*#\1Honk Hustle#; s#(<string name="title_activity_main">)[^<]*#\1Honk Hustle#' "$S"
VN=$(node -p "require('./package.json').version"); VC=${VERSION_CODE:-$(grep -Eo 'versionCode [0-9]+' "$G" | grep -Eo '[0-9]+' || echo 1)}
sed -i.bak -E "s/versionCode [0-9]+/versionCode $VC/; s/versionName \"[^\"]*\"/versionName \"$VN\"/" "$G"
rm -f "$M.bak" "$G.bak" "$S.bak"
echo "Android project configured: portrait, Honk Hustle, version $VN ($VC)."
