// config.js - the few things YOU set before shipping.
export const CONFIG = {
  // RevenueCat public SDK keys (RevenueCat dashboard > Project > API keys), one per store. Leave a placeholder as is to hide
  // all real-money buttons on that platform (coins earned by playing still work).
  REVENUECAT_IOS_KEY: 'appl_XXXXXXXXXXXXXXXX',
  REVENUECAT_ANDROID_KEY: 'goog_XXXXXXXXXXXXXXXX',
  // Required by App Store and Google Play review when the app has purchases. Put your real pages here.
  PRIVACY_URL: 'https://example.com/privacy',
  TERMS_URL: 'https://example.com/terms',
  SUPPORT_EMAIL: 'support@example.com',
  // Google AdMob (apps.admob.com). Until you replace these with your own ids, Google's TEST ids are used and only test ads show.
  // The App ID also goes into the native projects: ADMOB_APP_ID_ANDROID / ADMOB_APP_ID_IOS when you run the configure scripts.
  ADMOB: {
    testing: true,            // set to false only with your real ad unit ids below
    firstLevel: 5,            // no interstitials before the player has finished this many levels
    android: { interstitial: 'ca-app-pub-3940256099942544/1033173712', rewarded: 'ca-app-pub-3940256099942544/5224354917' },
    ios: { interstitial: 'ca-app-pub-3940256099942544/4411468910', rewarded: 'ca-app-pub-3940256099942544/1712485313' },
  },
  NO_ADS_PRICE: '$4.99',      // shown on the button; the real price is what you set for the product in each store
  VERSION: '1.0.0',
};
