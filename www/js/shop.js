// shop.js - the client side of the store. Pure rules live in catalog.js.
//
// iOS RULES (Apple guideline 3.1.1): coins, power-ups and skins are DIGITAL goods, so real-money purchases inside the
// iOS app MUST use Apple In-App Purchase (StoreKit). Base44's wrapper has no StoreKit yet, and Stripe/Base44 Payments
// inside the app gets rejected. So:
//   - iOS app WITH window.NativeIAP:      real money via StoreKit (nativeProvider, see nativeIap.js)
//   - iOS app WITHOUT window.NativeIAP:   real-money buttons are hidden; coins earned in-game still work
import { base44 } from './api/base44Client.js'; // adjust to your project's client import
import { PRODUCTS, coinPurchase, setUsd, setCoinPrice } from './catalog.js';
import { ALL_PACKS } from './packs.js';
import { shopOffers, isOffered, setProductId, vehicleSkinId, passengerSkinId } from './themes.js';

const nativeProvider = {
  name: 'apple',
  prices: (ids) => window.NativeIAP.getPrices(ids),                 // localized prices from the App Store
  async purchase(productId) { return window.NativeIAP.purchase(productId); }, // -> { transactionId, productId }
  restore: () => window.NativeIAP.restore(),                        // -> [productId, ...] (non-consumables)
};

// null = do not show real-money buttons (no StoreKit bridge, e.g. no RevenueCat key yet). Coins earned by playing always work.
export function realMoneyProvider() { return window.NativeIAP ? nativeProvider : null; }

export async function buyWithMoney(productId) {
  const provider = realMoneyProvider();
  if (!provider) throw new Error('Paid purchases are not available in this build.');
  if (!PRODUCTS[productId]) throw new Error('Unknown product');
  const result = await provider.purchase(productId);
  if (result.pending) return result;
  // The SERVER verifies with Apple/RevenueCat, ignores repeated transactionIds, then updates the PlayerProfile.
  return base44.functions.invoke('verifyPurchase', { productId, transactionId: result.transactionId, platform: provider.name });
}

export async function restorePurchases() {   // Apple requires a visible Restore Purchases button (skins are non-consumable)
  const provider = realMoneyProvider();
  if (!provider) return { restored: [] };
  const productIds = await provider.restore();
  return base44.functions.invoke('restorePurchases', { productIds, platform: provider.name });
}

export async function buyWithCoins(profile, kind, item, opts) {
  const r = coinPurchase(profile, kind, item, opts);
  if (r.ok) await base44.entities.PlayerProfile.update(profile.id, r.profile);
  return r;
}

export async function equipSkin(profile, skinId) {
  const field = skinId.startsWith('p_') ? 'equippedPassengerSkin' : 'equippedVehicleSkin';
  const next = { ...profile, [field]: skinId };
  await base44.entities.PlayerProfile.update(profile.id, next);
  return next;
}

// Call when a world is finished (see completionEvents in campaign.js).
export async function grantRewards(profile, events) {
  const next = {
    ...profile,
    coins: (profile.coins || 0) + events.bonusCoins,
    ownedSkins: [...new Set([...(profile.ownedSkins || []), ...events.rewardSkins])],
  };
  await base44.entities.PlayerProfile.update(profile.id, next);
  return next;
}

// ---- Themed sets: what the shop screen shows right now ----
// Returns this week's 4 rotating sets (with a countdown) plus any season/holiday set that is currently running.
// profile.hemisphere ('north' | 'south') is optional and defaults to north.
export function getShopSets(profile, now = new Date()) {
  const o = shopOffers(now, profile.hemisphere || 'north');
  const owned = new Set(profile.ownedSkins || []);
  const card = (set, endsAt, tag) => {
    const v = vehicleSkinId(set.id), p = passengerSkinId(set.id);
    return {
      tag, endsAt, set,
      ownsVehicle: owned.has(v), ownsPassenger: owned.has(p), ownsAll: owned.has(v) && owned.has(p),
      coinPrice: setCoinPrice(set),
      usd: setUsd(set),
      productId: setProductId(set.id),
      canBuyWithMoney: !!realMoneyProvider(),   // false in the iOS app until the StoreKit bridge exists
    };
  };
  return {
    weeklyEndsAt: o.weeklyEndsAt,
    weekly: o.weekly.map((s) => card(s, o.weeklyEndsAt, 'This week')),
    limited: o.limited.map((l) => card(l.set, l.endsAt, l.set.kind === 'season' ? 'Season' : 'Holiday')),
  };
}
export const buySetWithMoney = (setId) => buyWithMoney(setProductId(setId));

// ---- Season Packs ----
export function getShopPacks(profile, now = new Date()) {
  const owned = new Set(profile.ownedSkins || []), hemi = profile.hemisphere || 'north', endsAt = shopOffers(now, hemi).weeklyEndsAt;
  const card = (p) => {
    const ids = [vehicleSkinId(p.setId), passengerSkinId(p.setId), ...p.variants.flatMap((v) => [v.id, v.riderId])];
    return { pack: p, kind: p.kind, endsAt: p.kind === 'weekly' ? endsAt : null, inSeason: isOffered(p.setId, now, hemi), ownsAll: ids.every((i) => owned.has(i)), owned, canBuyWithMoney: !!realMoneyProvider() };
  };
  const all = ALL_PACKS.map(card);
  return [...all.filter((c) => c.kind === 'weekly' && c.inSeason), ...all.filter((c) => c.kind === 'season').sort((a, b) => (b.inSeason - a.inSeason))];
}

// "2d 5h left" style countdown for the shop cards
export function timeLeft(endsAt, now = new Date()) {
  const ms = Math.max(0, endsAt - now), d = Math.floor(ms / 86400000), h = Math.floor((ms % 86400000) / 3600000), m = Math.floor((ms % 3600000) / 60000);
  return d ? d + 'd ' + h + 'h left' : h ? h + 'h ' + m + 'm left' : m + 'm left';
}
