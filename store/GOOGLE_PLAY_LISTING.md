# Google Play listing and submission – Bus Blitz Party

Everything here is a draft for you to paste into Play Console and check. Answers assume the build as shipped: Google AdMob ads (between levels, plus optional reward videos), a $4.99 "Remove ads"
purchase, no accounts, no analytics, progress saved only on the device, real-money purchases through Google Play Billing (via RevenueCat).

## Store listing
**App name (30):** Bus Blitz Party: Jam Puzzle   (or just "Bus Blitz Party")
**Short description (80):** Tap buses out of the jam and fill them with the right riders. 11,200 levels!
**Full description (4000):**
The buses are throwing a party and the lot is jammed! Tap buses to honk them out of the lot, park them in the bay, and watch the waiting riders hop on the bus that matches their colour.

• 11,200 hand-balanced levels across 56 worlds – every one can be solved
• Locked, frozen and mystery buses, barriers and tight parking bays
• Heli-Lift, Bay+ and Master Key power-ups for sticky spots
• Win streaks, daily rewards and bonus coins for finishing areas
• Collect buses and riders in the Garage – new packs every week and for every season
• Plays offline, no account needed

**Category:** Game › Puzzle   **Tags:** Puzzle, Casual, Brain games
**Contact email:** your support email (same as `SUPPORT_EMAIL` in `www/js/config.js`)
**Privacy policy URL:** required because the app has purchases – host `store/privacy-policy-template.md` and use that URL.

## Logo and graphics (in `store/google-play/` and `assets/`)
The logo is the yellow party bus (big eyes, party hat) with three of the game's riders - pink, blue (cheering) and green - crowding in front of it, on a purple-blue sunburst with confetti. Source layers for the phone icons are in
`assets/`: `icon-foreground.png` + `icon-background.png` (Android adaptive icon - the bus sits inside the 66% safe zone so circle,
squircle and teardrop masks never cut it), `icon-only.png` (iOS / legacy), `splash.png`. `npm run assets` turns them into every size.
| Asset | File | Play requirement |
|---|---|---|
| App icon | `icon-512.png` | 512×512 PNG, full square (Play rounds the corners itself) |
| Feature graphic | `feature-graphic-1024x500.png` | 1024×500 PNG/JPG, required |
| Phone screenshots | `phone-1-home.png` … `phone-5-shop.png` | 2–8 shots, 1080×1920 (9:16) |
For a better "Games" listing, also add 7" and 10" tablet screenshots (capture the same screens at 1200×1920 / 1600×2560).

## App content (Policy › App content)
- **Ads:** **Yes, the app contains ads** (Google AdMob). The listing will show "Contains ads".
- **App access:** All functionality is available without special access.
- **Target audience and content:** choose **13 and over**. If you include ages under 13, the Families Policy applies (teacher-approved/ads-certified SDK rules, extra review) – only do that on purpose.
- **Content rating (IARC questionnaire):** Category "Game". Violence, fear, sexuality, language, controlled substances, gambling: **No**. Users interact / share location / personal info: **No**. Digital purchases: **Yes**. Expected result: Everyone / PEGI 3.
- **Data safety:** (the AdMob SDK collects data, so the answer is **Yes, collects and shares**). Follow Google's own guide for the
  Mobile Ads SDK: https://developers.google.com/admob/android/privacy/play-data-disclosure – at the time of writing it lists:
  - **Location › Approximate location** (from IP) – collected and shared, for Advertising/Analytics/Fraud prevention.
  - **Device or other IDs** (advertising ID, app set ID) – collected and shared, same purposes.
  - **App activity › App interactions** and **App info and performance › Crash logs / Diagnostics** – collected and shared.
  - Data is encrypted in transit; ad data cannot be deleted by request through the app (users can reset their advertising ID).
  - Purchases with RevenueCat on: declare **App activity › Purchase history** and **App info and performance**/**Device or other IDs** only if RevenueCat's current Data safety guide says so for your configuration – check https://www.revenuecat.com/docs before submitting. Data is encrypted in transit; users cannot request deletion of purchase records held by Google.
  - Progress, coins and settings stay on the device (not collected).
- **Government app / Financial features / Health:** No.

## Ads setup (AdMob)
1. Create an AdMob account (apps.admob.com), add the Android app (and iOS app), and create two ad units per app: **Interstitial** and **Rewarded**.
2. Put the ad unit ids in `www/js/config.js` › `ADMOB` and set `testing: false`. Until then Google's test ads show (safe to publish to internal testing, never to production).
3. Pass your App IDs when configuring the native projects: `ADMOB_APP_ID_ANDROID=ca-app-pub-…~… bash scripts/configure_android.sh` (iOS: `ADMOB_APP_ID_IOS=… bash scripts/configure_ios.sh`).
4. In AdMob › Privacy & messaging, create a **GDPR message** (and the **IDFA explainer** for iOS). The game shows it on launch where required and offers "Ad privacy choices" in Settings.
5. Publish **app-ads.txt** on the website listed as your developer website in Play Console (AdMob gives you the line).
6. Ad content rating is capped at "General" in the code (`maxAdContentRating`). Keep the target audience 13+ – with ages under 13 the Families Policy requires certified ad SDK settings.

## In-app products (Monetize › Products › In-app products)
Create the same ids as `store/iap_products.csv` (they start with your package name). On Play all of them are *one-time products*:
"Consumable" rows (coins, power-up kits) must be consumed after purchase – RevenueCat does this when the product is set as consumable there.
Product ids can never be reused once created, so finalise the package name first.
**Remove ads** (`<package>.noads`, $4.99) is a one-time, non-consumed product – it must restore on a new phone (Settings › Restore purchases).

## Release checklist
1. Set the real package name (`appId` in `capacitor.config.json` and `BUNDLE_ID` in `www/js/themes.js`) **before** `npx cap add android`.
2. `bash scripts/setup_android.sh`, run on a phone/emulator from Android Studio, test the Back button and a purchase with a licence tester.
3. Fill the AdMob ids (`ADMOB`, `testing: false`), `REVENUECAT_ANDROID_KEY`, `PRIVACY_URL`, `TERMS_URL`, `SUPPORT_EMAIL` in `www/js/config.js`, then `npx cap sync android`.
4. Build the signed bundle: `KEYSTORE_PASS=... KEY_PASS=... VERSION_CODE=1 bash scripts/build_android_release.sh`.
5. Play Console: create the app, enrol in **Play App Signing** (default), upload the .aab to **Internal testing** first.
6. New personal developer accounts must run a **closed test with at least 12 testers for 14 days** before production access – plan for it.
7. Complete App content, Store listing and pricing/countries, then promote to Production.
