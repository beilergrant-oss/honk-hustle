# Google Play listing and submission – Honk Hustle

Everything here is a draft for you to paste into Play Console and check. Answers assume the build as shipped: no ads, no accounts,
no analytics, progress saved only on the device, optional real-money purchases through Google Play Billing (via RevenueCat).
If you add ads or analytics, the Data safety and Ads answers change.

## Store listing
**App name (30):** Honk Hustle: Bus Jam Puzzle
**Short description (80):** Tap buses out of the jam and fill them with the right riders. 11,200 levels!
**Full description (4000):**
Traffic is a mess and only you can fix it! Tap buses to honk them out of the lot, park them in the bay, and watch the waiting riders hop on the bus that matches their colour.

• 11,200 hand-balanced levels across 56 worlds – every one can be solved
• Locked, frozen and mystery buses, barriers and tight parking bays
• Heli-Lift, Bay+ and Master Key power-ups for sticky spots
• Win streaks, daily rewards and bonus coins for finishing areas
• Collect buses and riders in the Garage – new packs every week and for every season
• Plays offline, no account needed

**Category:** Game › Puzzle   **Tags:** Puzzle, Casual, Brain games
**Contact email:** your support email (same as `SUPPORT_EMAIL` in `www/js/config.js`)
**Privacy policy URL:** required because the app has purchases – host `store/privacy-policy-template.md` and use that URL.

## Graphics (in `store/google-play/`)
| Asset | File | Play requirement |
|---|---|---|
| App icon | `icon-512.png` | 512×512 PNG |
| Feature graphic | `feature-graphic-1024x500.png` | 1024×500 PNG/JPG, required |
| Phone screenshots | `phone-1-home.png` … `phone-5-shop.png` | 2–8 shots, 1080×1920 (9:16) |
For a better "Games" listing, also add 7" and 10" tablet screenshots (capture the same screens at 1200×1920 / 1600×2560).

## App content (Policy › App content)
- **Ads:** No, the app does not contain ads.
- **App access:** All functionality is available without special access.
- **Target audience and content:** choose **13 and over**. If you include ages under 13, the Families Policy applies (teacher-approved/ads-certified SDK rules, extra review) – only do that on purpose.
- **Content rating (IARC questionnaire):** Category "Game". Violence, fear, sexuality, language, controlled substances, gambling: **No**. Users interact / share location / personal info: **No**. Digital purchases: **Yes**. Expected result: Everyone / PEGI 3.
- **Data safety:**
  - Collects or shares user data: if real-money purchases are off (no RevenueCat key) – **No data collected**.
  - With RevenueCat on: declare **App activity › Purchase history** and **App info and performance**/**Device or other IDs** only if RevenueCat's current Data safety guide says so for your configuration – check https://www.revenuecat.com/docs before submitting. Data is encrypted in transit; users cannot request deletion of purchase records held by Google.
  - Progress, coins and settings stay on the device (not collected).
- **Government app / Financial features / Health:** No.

## In-app products (Monetize › Products › In-app products)
Create the same ids as `store/iap_products.csv` (they start with your package name). On Play all of them are *one-time products*:
"Consumable" rows (coins, power-up kits) must be consumed after purchase – RevenueCat does this when the product is set as consumable there.
Product ids can never be reused once created, so finalise the package name first.

## Release checklist
1. Set the real package name (`appId` in `capacitor.config.json` and `BUNDLE_ID` in `www/js/themes.js`) **before** `npx cap add android`.
2. `bash scripts/setup_android.sh`, run on a phone/emulator from Android Studio, test the Back button and a purchase with a licence tester.
3. Fill `REVENUECAT_ANDROID_KEY`, `PRIVACY_URL`, `TERMS_URL`, `SUPPORT_EMAIL` in `www/js/config.js`, then `npx cap sync android`.
4. Build the signed bundle: `KEYSTORE_PASS=... KEY_PASS=... VERSION_CODE=1 bash scripts/build_android_release.sh`.
5. Play Console: create the app, enrol in **Play App Signing** (default), upload the .aab to **Internal testing** first.
6. New personal developer accounts must run a **closed test with at least 12 testers for 14 days** before production access – plan for it.
7. Complete App content, Store listing and pricing/countries, then promote to Production.
