#!/usr/bin/env bash
# Portrait only, app name, version name/code. Safe to re-run.
#   VERSION_CODE=2 ADMOB_APP_ID_ANDROID=ca-app-pub-xxx~yyy bash scripts/configure_android.sh
# (every upload to Google Play needs a higher versionCode; without ADMOB_APP_ID_ANDROID Google's test App ID is used)
cd "$(dirname "$0")/.."
M="android/app/src/main/AndroidManifest.xml"; G="android/app/build.gradle"; S="android/app/src/main/res/values/strings.xml"
[ -f "$M" ] || { echo "No $M yet. Run: npx cap add android"; exit 0; }
grep -q 'android:screenOrientation' "$M" || perl -pi -e 's#android:name="\.MainActivity"#android:name=".MainActivity"\n            android:screenOrientation="portrait"#' "$M"
[ -f "$S" ] && sed -i.bak -E 's#(<string name="app_name">)[^<]*#\1Bus Blitz Party#; s#(<string name="title_activity_main">)[^<]*#\1Bus Blitz Party#' "$S"
VN=$(node -p "require('./package.json').version"); VC=${VERSION_CODE:-$(grep -Eo 'versionCode [0-9]+' "$G" | grep -Eo '[0-9]+' || echo 1)}
sed -i.bak -E "s/versionCode [0-9]+/versionCode $VC/; s/versionName \"[^\"]*\"/versionName \"$VN\"/" "$G"
# AdMob App ID (required by the Google Mobile Ads SDK, or the app crashes on launch)
AID=${ADMOB_APP_ID_ANDROID:-ca-app-pub-3940256099942544~3347511713}
if [ -f "$S" ]; then
  if grep -q 'name="admob_app_id"' "$S"; then perl -pi -e "s#(<string name=\"admob_app_id\">)[^<]*#\${1}$AID#" "$S"
  else perl -pi -e "s#</resources>#    <string name=\"admob_app_id\">$AID</string>\n</resources>#" "$S"; fi
fi
grep -q 'com.google.android.gms.ads.APPLICATION_ID' "$M" || perl -0pi -e 's#(<application\b[^>]*>)#$1\n        <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="\@string/admob_app_id"/>#' "$M"
rm -f "$M.bak" "$G.bak" "$S.bak"
echo "Android project configured: portrait, Bus Blitz Party, version $VN ($VC), AdMob app $AID."
