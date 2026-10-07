# Honk Hustle – iOS and Android project (Capacitor 8)

A complete, offline 2D puzzle game (11,200 levels, loading screen, Garage, Shop, skins, streaks, power-ups) wrapped for iOS and Android.
I could not compile or run it on a phone from my Linux workspace. The game itself was tested in a headless browser; the Xcode and Android Studio steps below are untested.

## You need
- Node.js 22+ (Capacitor 8)
- iOS: a Mac with the current Xcode, and an Apple Developer account ($99/yr)
- Android: Android Studio Otter (2025.2.1) or newer on Mac, Windows or Linux, and a Google Play Console account ($25 one-time)

## Quick start (Mac)
```
unzip honk_hustle_ios.zip && cd hh_app
bash scripts/setup.sh
```
That installs packages, creates the Xcode project (`npx cap add ios`), generates icon and launch images, copies the game in, sets portrait-only, and opens Xcode.
Manual equivalent: `npm install`, `npx cap add ios`, `npm run assets`, `npx cap sync ios`, `npx cap open ios`.

## In Xcode
1. Select the **App** target, then **Signing & Capabilities**. Pick your Team and set a unique **Bundle Identifier**.
2. Use the same id in `capacitor.config.json` (`appId`) and `www/js/themes.js` (`BUNDLE_ID`). Product ids in `store/iap_products.csv` start with it.
3. Pick your iPhone or a simulator and press Run.
4. After editing anything in `www/`, run `npx cap sync ios` again.

## Real-money purchases (optional)
Coins, power-ups and skins bought with coins work with no setup. Real-money buttons stay hidden until a StoreKit bridge exists (Apple rule 3.1.1).
1. `npm i @revenuecat/purchases-capacitor` then `npx cap sync ios`
2. Create a RevenueCat project, add your iOS and Android apps, and put the public keys in `www/js/config.js` (`REVENUECAT_IOS_KEY`, `REVENUECAT_ANDROID_KEY`). Run `npx cap sync` for both platforms.
3. In App Store Connect create the 31 products from `store/iap_products.csv` (consumable vs non-consumable is listed). Add the same ids in RevenueCat.
4. Test with a Sandbox tester. `www/js/iap.js` was never run against the real plugin, so expect to debug it.

## Before App Store submission
- Fill in `PRIVACY_URL`, `TERMS_URL`, `SUPPORT_EMAIL` in `www/js/config.js`. Host the privacy policy (template in `store/privacy-policy-template.md`).
- Restore Purchases must be reachable in-app if you enable real-money items.
- Age rating questionnaire, screenshots (6.9" and 6.5" iPhone), and the listing text are in `store/APP_STORE_LISTING.md`.
- `ITSAppUsesNonExemptEncryption` is set to false by `configure_ios.sh`.
- The app collects no data and makes no network calls except purchases.

## Android / Google Play
Full submission checklist, listing text, Data safety and content-rating answers: `store/GOOGLE_PLAY_LISTING.md`. Graphics: `store/google-play/`.
```
bash scripts/setup_android.sh          # npm install, cap add android, icons, sync, portrait lock, opens Android Studio
```
- The Android package name comes from `appId` in `capacitor.config.json` (it cannot change after your first upload) - set it before `cap add android`.
- Capacitor 8 targets API 36 (Android 16), which Google Play requires for new apps and updates from Aug 31, 2026.
- Release build (signed .aab): create the upload key once with the `keytool` line in `scripts/build_android_release.sh`, then
  `KEYSTORE_PASS=... KEY_PASS=... VERSION_CODE=1 bash scripts/build_android_release.sh`. Raise `VERSION_CODE` for every upload. Never commit the .jks (it is in .gitignore) and back it up.
- The Android Back button closes popups, pauses a level, goes back to Home, and on Home sends the app to the background.
- Ads: `ios-native/AdManager.swift` is iOS only and not wired to the game. No ads run on Android.

## Season Packs
Four packs (Spring, Summer, Autumn, Winter) each unlock the season set plus three extra buses. Coin price 9,000 or $4.99. Product ids are `<bundle id>.pack.spring` etc. and are in `store/iap_products.csv`.

## Known limits
- Fonts: bundled Poppins Bold (Lilita One was not available offline).
- Garage portraits are crops of your sheet, soft at about 500 px.
- Colour-blind accessibility not tested.
- Save data is in localStorage, mirrored to Capacitor Preferences.

## Testing in a browser
`npm run serve` then open http://localhost:8080. The app has no URL test switches; the Playwright tests in `tests/` set `window.__HH_TEST__` before load (see `tests/seam.py`).

## Loading screen by holiday or event
`www/js/loadingThemes.js` picks the loading and home look by the player's local date: **special event > holiday > season > regular**.
Events: New Year, Independence Day, Thanksgiving, Lunar New Year, Diwali (dates in `EVENTS`; Lunar New Year and Diwali use a table through 2035).
Holidays: Christmas, Halloween, Valentine's, St. Patrick's, Easter, Pride. Preview any day with `?date=YYYY-MM-DD` (or force a look with `?theme=halloween`).

## Worlds, backgrounds, colours, Garage
- **56 worlds, a new one every 200 levels** (`WORLD_LIST` in `www/js/backdrops.js`). Each world has a backdrop (city, beach, forest, winter, halloween, space, autumn, jungle, candy, desert, ocean, spring, farm, volcano, mountain, castle, pirate, circus, toy, savanna) that sets the ground, board tiles, scattered details, scenery sprites and the name ribbon. Seasons and holidays only sprinkle a few of their own sprites in.
- **Colours grow with the level**: 10 bus and passenger colours (`COLORS`, `colorsFor` in `levelGen.js`); easy levels start with 3, harder tiers with more, up to all 10 around level 7,000+.
- **Garage** (`garageScreen.js`) lists every bus and rider skin you own, greyed out when locked; equipping a bus also equips the rider that matches it (`PASSENGER_FOR_VEHICLE` in `skinData.js`). Riders wear a vest in their bus's colours (`outfitFor` in `look.js`). Season Pack buses each come with a matching rider.
- Two new rider products were added to `store/iap_products.csv` (Unicorn Kid, Golden Star).

## Obstacles and difficulty
- Levels are still Easy / Hard / Extra Hard (12 / 5 / 3 per block of 20), but the first levels are gentler: levels 1-15 are all easy, no Extra Hard before level 40, and the vehicle count, tightness of the move limit and share of free vehicles ramp smoothly up to about level 5,000.
- Boards are a little bigger: Easy 7x7, Hard 8x8 then 9x9 (from level 120), Extra Hard 10x10 then 11x11 (from level 300).
- A new obstacle arrives every 100-200 levels (see `OBSTACLES` in `levelGen.js`): cones (1), padlocks (40), barriers that lift after N departures (200), frozen buses (350), mystery buses (500), blocked bay slots (650), deep freeze (800), roadworks (950).
- Every 150 levels the newest obstacle is always in play plus a changing mix of older ones, so some leave and come back later. The wall look changes every 200 levels (cone, barrel, rock, crate, bush).
- Every level is solvable by construction; `game.js` plays the generator's solution in tests.

## Drawn scenery instead of emoji
Scenery on the home screen, loading screen and in levels, the home buttons, the power-up bar, the top pills and the lock/ice badges are drawn vector graphics (`www/js/decorArt.js`). The backdrop data still names each sprite by an emoji key, but the emoji is never shown. Add a new scenery sprite by adding a template there and an `add('<emoji>', 'sprite', colour)` line.

## Shop: more coin packs and power-up kits
Coins now run $0.99-$49.99 across six packs (1,200 to 100,000 coins) and power-up bundles run $1.99-$19.99 across four kits (Starter 3x to Ultra 60x), each with its own drawn pile/kit-box art (`decorArt.js`) instead of a generic coin/gift symbol. New product IDs are in `store/iap_products.csv`.

## Scenery
All 20 world themes use the drawn vector sprites in `js/decorArt.js` (crisp at any size, no raster blur) with their palette in `js/backdrops.js`, so colours match across the ground, bay and scenery for every theme.
