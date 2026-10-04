# Honk Hustle – iOS project (Capacitor)

A complete, offline 2D puzzle game (11,200 levels, loading screen, Garage, Shop, skins, streaks, power-ups) wrapped for iOS.
I could not compile or run it on an iPhone from my Linux workspace. The game itself was tested in a headless browser; the Xcode steps below are untested.

## You need
- A Mac with Xcode 15+ and Node.js 18+
- An Apple Developer account ($99/yr) to run on a device or ship to the App Store

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
2. Create a RevenueCat project, add your iOS app, and put the public key in `www/js/config.js` (`REVENUECAT_PUBLIC_KEY`).
3. In App Store Connect create the 31 products from `store/iap_products.csv` (consumable vs non-consumable is listed). Add the same ids in RevenueCat.
4. Test with a Sandbox tester. `www/js/iap.js` was never run against the real plugin, so expect to debug it.

## Before App Store submission
- Fill in `PRIVACY_URL`, `TERMS_URL`, `SUPPORT_EMAIL` in `www/js/config.js`. Host the privacy policy (template in `store/privacy-policy-template.md`).
- Restore Purchases must be reachable in-app if you enable real-money items.
- Age rating questionnaire, screenshots (6.9" and 6.5" iPhone), and the listing text are in `store/APP_STORE_LISTING.md`.
- `ITSAppUsesNonExemptEncryption` is set to false by `configure_ios.sh`.
- The app collects no data and makes no network calls except purchases.

## Season Packs
Four packs (Spring, Summer, Autumn, Winter) each unlock the season set plus three extra buses. Coin price 9,000 or $4.99. Product ids are `<bundle id>.pack.spring` etc. and are in `store/iap_products.csv`.

## Known limits
- Fonts: bundled Poppins Bold (Lilita One was not available offline).
- Garage portraits are crops of your sheet, soft at about 500 px.
- Colour-blind accessibility not tested.
- Save data is in localStorage, mirrored to Capacitor Preferences.

## Testing in a browser
`npm run serve` then open http://localhost:8080. Useful URL params: `?fast=1&go=game&level=N`.
