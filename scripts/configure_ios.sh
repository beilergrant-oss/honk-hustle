#!/usr/bin/env bash
# Sets portrait-only, export compliance and the display name in Info.plist. Mac only (uses PlistBuddy). Safe to re-run.
P="ios/App/App/Info.plist"
[ -f "$P" ] || { echo "No $P yet. Run: npx cap add ios"; exit 0; }
pb() { /usr/libexec/PlistBuddy -c "$1" "$P" 2>/dev/null || true; }
pb "Set :CFBundleDisplayName Honk Hustle"
pb "Delete :UISupportedInterfaceOrientations"
pb "Add :UISupportedInterfaceOrientations array"
pb "Add :UISupportedInterfaceOrientations:0 string UIInterfaceOrientationPortrait"
pb "Delete :UISupportedInterfaceOrientations~ipad"
pb "Add :UISupportedInterfaceOrientations~ipad array"
pb "Add :UISupportedInterfaceOrientations~ipad:0 string UIInterfaceOrientationPortrait"
pb "Add :UISupportedInterfaceOrientations~ipad:1 string UIInterfaceOrientationPortraitUpsideDown"
pb "Delete :UIRequiresFullScreen"
pb "Add :UIRequiresFullScreen bool true"
pb "Delete :ITSAppUsesNonExemptEncryption"
pb "Add :ITSAppUsesNonExemptEncryption bool false"
# AdMob: App ID (ADMOB_APP_ID_IOS, else Google's test id), tracking prompt text, and SKAdNetwork ids.
# Google publishes the full SKAdNetwork list (developers.google.com/admob/ios/quick-start) - add it in Xcode for better ad fill.
pb "Delete :GADApplicationIdentifier"
pb "Add :GADApplicationIdentifier string ${ADMOB_APP_ID_IOS:-ca-app-pub-3940256099942544~1458002511}"
pb "Delete :NSUserTrackingUsageDescription"
pb "Add :NSUserTrackingUsageDescription string Your choice lets us show ads that fit you better. Honk Hustle works the same either way."
pb "Delete :SKAdNetworkItems"
pb "Add :SKAdNetworkItems array"
pb "Add :SKAdNetworkItems:0 dict"
pb "Add :SKAdNetworkItems:0:SKAdNetworkIdentifier string cstr6suwn9.skadnetwork"
echo "Info.plist updated. Please check it in Xcode (Info tab)."
