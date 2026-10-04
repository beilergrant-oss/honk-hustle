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
echo "Info.plist updated. Please check it in Xcode (Info tab)."
