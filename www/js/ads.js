// ads.js - Google AdMob through @capacitor-community/admob (the same SDK on Google Play and the App Store).
//   - Interstitial between levels: never in the first levels, at most one every 3 finished levels and 90 seconds. Off with "Remove ads".
//   - Rewarded video: always optional, the player taps to watch (2x coins on a win, or a free power-up). Still offered after
//     "Remove ads", because nobody is shown one without asking.
//   - Consent: Google's UMP form (EEA/UK/Switzerland), then Apple's tracking prompt on iOS, before any ad is requested.
// In the browser preview there is no plugin, so every call is a no-op.
import { CONFIG } from './config.js';
import { isAndroid, isIos } from './platform.js';

const plugin = () => window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob;
const units = () => (isAndroid() ? CONFIG.ADMOB.android : CONFIG.ADMOB.ios);
const opts = (adId) => ({ adId, isTesting: !!CONFIG.ADMOB.testing });

const st = { ready: false, inter: false, reward: false, lastInter: Date.now(), finished: 0, privacy: false, noAds: () => false, level: () => 0 };

async function loadInter() { const A = plugin(); if (!st.ready || st.noAds() || st.inter) return; try { await A.prepareInterstitial(opts(units().interstitial)); st.inter = true; } catch (e) { setTimeout(loadInter, 60000); } }
async function loadReward() { const A = plugin(); if (!st.ready || st.reward) return; try { await A.prepareRewardVideoAd(opts(units().rewarded)); st.reward = true; } catch (e) { setTimeout(loadReward, 60000); } }

// noAds(): true once "Remove ads" is owned. level(): the player's highest finished level.
export async function initAds({ noAds, level }) {
  st.noAds = noAds; st.level = level;
  const A = plugin(); if (!A) return;
  try {
    await A.initialize({ initializeForTesting: !!CONFIG.ADMOB.testing, maxAdContentRating: 'General' });
    let c = await A.requestConsentInfo();
    if (c.isConsentFormAvailable && c.status === 'REQUIRED') c = await A.showConsentForm();
    st.privacy = c.privacyOptionsRequirementStatus === 'REQUIRED';
    if (isIos()) { try { const t = await A.trackingAuthorizationStatus(); if (t.status === 'notDetermined') await A.requestTrackingAuthorization(); } catch (e) { /* older iOS */ } }
    if (c.canRequestAds === false) return;
    st.ready = true; loadInter(); loadReward();
  } catch (e) { console.warn('Ads unavailable:', e); }
}

// Call when a level ends (win or loss). The break itself happens when the next level starts (adBreak()).
export const levelFinished = () => { st.finished++; };
export function adBreak() {
  const A = plugin();
  if (!st.ready || st.noAds() || !st.inter || st.level() < CONFIG.ADMOB.firstLevel || st.finished < 3 || Date.now() - st.lastInter < 90000) return;
  st.inter = false; st.finished = 0; st.lastInter = Date.now();
  A.showInterstitial().catch(() => {}).finally(() => setTimeout(loadInter, 1000));
}

export const rewardedReady = () => st.ready && st.reward;
// Resolves true if the player watched long enough to earn the reward.
export async function showRewarded() {
  const A = plugin(); if (!rewardedReady()) return false;
  st.reward = false;
  try { const r = await A.showRewardVideoAd(); return !!(r && (r.amount > 0 || r.type)); } catch (e) { return false; } finally { setTimeout(loadReward, 1000); }
}

// Google requires a way to change the consent choice later (shown in Settings when needed).
export const privacyChoicesNeeded = () => st.privacy;
export async function showPrivacyChoices() { const A = plugin(); if (A) { try { await A.showPrivacyOptionsForm(); } catch (e) { /* none to show */ } } }
