// catalog.js - products + a PURE grant function. Used by the app AND by your backend verifyPurchase function.
import { ALL_SKINS } from './skinData.js';
import { SEASON_PACKS } from './packs.js';
import { SETS, PRICES, BUNDLE_ID, setProductId, vehicleSkinId, passengerSkinId, isOffered } from './themes.js';
const P = BUNDLE_ID; // must match App Store Connect (change it in themes.js)

export const COIN_PACKS = [   // consumables
  { id: 'coins_xs', productId: P + '.coins.xs', coins: 1200,   price: '$0.99', art: 'coins1' },
  { id: 'coins_s',  productId: P + '.coins.s',  coins: 3200,   price: '$2.99', art: 'coins1' },
  { id: 'coins_m',  productId: P + '.coins.m',  coins: 7000,   price: '$4.99', badge: 'Popular',    art: 'coins2' },
  { id: 'coins_l',  productId: P + '.coins.l',  coins: 16000,  price: '$9.99', art: 'coins2' },
  { id: 'coins_xl', productId: P + '.coins.xl', coins: 36000,  price: '$19.99', badge: 'Best value', art: 'coins3' },
  { id: 'coins_xxl', productId: P + '.coins.xxl', coins: 100000, price: '$49.99', badge: 'Huge',     art: 'coins4' },
];
export const POWERUP_BUNDLES = [ // consumables, also buyable with coins
  { id: 'pu_starter', name: 'Starter Kit', items: { heli: 3,  bay: 3,  key: 3 },  coinPrice: 900,   productId: P + '.pu.starter', price: '$1.99', art: 'kit1' },
  { id: 'pu_mega',    name: 'Mega Kit',    items: { heli: 10, bay: 10, key: 10 }, coinPrice: 2500,  productId: P + '.pu.mega',    price: '$4.99', art: 'kit2' },
  { id: 'pu_super',   name: 'Super Kit',   items: { heli: 25, bay: 25, key: 25 }, coinPrice: 5800,  productId: P + '.pu.super',   price: '$9.99', art: 'kit3' },
  { id: 'pu_ultra',   name: 'Ultra Kit',   items: { heli: 60, bay: 60, key: 60 }, coinPrice: 13000, productId: P + '.pu.ultra',   price: '$19.99', art: 'kit4' },
];
export const SINGLE_POWERUP_COIN_PRICE = { heli: 300, bay: 200, key: 250 };

// Non-consumables: skins that have a productId.
const SKIN_PRODUCTS = ALL_SKINS.filter((s) => s.productId);

export const PRODUCTS = {};
COIN_PACKS.forEach((p) => { PRODUCTS[p.productId] = { kind: 'coins', coins: p.coins }; });
POWERUP_BUNDLES.forEach((p) => { PRODUCTS[p.productId] = { kind: 'bundle', items: p.items }; });
SKIN_PRODUCTS.forEach((s) => { PRODUCTS[s.productId] = { kind: 'skin', skinId: s.id }; });
// Themed sets: ONE non-consumable product per set that unlocks the vehicle skin AND the passenger skin.
SETS.forEach((s) => { PRODUCTS[setProductId(s.id)] = { kind: 'set', setId: s.id, skinIds: [vehicleSkinId(s.id), passengerSkinId(s.id)] }; });
// Season Packs: ONE non-consumable product per season unlocks the season's set (bus + outfit) and its three extra buses.
export const packSkinIds = (p) => [vehicleSkinId(p.setId), passengerSkinId(p.setId), ...p.variants.flatMap((v) => [v.id, v.riderId])];
SEASON_PACKS.forEach((p) => { PRODUCTS[p.productId] = { kind: 'pack', packId: p.id, skinIds: packSkinIds(p) }; });
export const setUsd = (set) => PRICES[set.price].usd;
export const setCoinPrice = (set) => PRICES[set.price].set;

// Returns { granted, profile }. Safe to call twice with the same transactionId (the second call grants nothing).
export function grantProduct(profile, productId, transactionId) {
  const prod = PRODUCTS[productId];
  if (!prod) return { granted: false, reason: 'unknown-product', profile };
  const done = profile.processedTransactions || [];
  if (transactionId && done.includes(transactionId)) return { granted: false, reason: 'already-processed', profile };
  const next = { ...profile, processedTransactions: transactionId ? [...done, transactionId] : done };
  if (prod.kind === 'coins') next.coins = (profile.coins || 0) + prod.coins;
  if (prod.kind === 'bundle') {
    next.powerups = { ...(profile.powerups || {}) };
    Object.entries(prod.items).forEach(([k, n]) => { next.powerups[k] = (next.powerups[k] || 0) + n; });
  }
  if (prod.kind === 'skin') next.ownedSkins = [...new Set([...(profile.ownedSkins || []), prod.skinId])];
  if (prod.kind === 'set' || prod.kind === 'pack') next.ownedSkins = [...new Set([...(profile.ownedSkins || []), ...prod.skinIds])];
  return { granted: true, profile: next };
}

// Restore = re-grant non-consumables only (single skins and themed sets). Consumables (coins, bundles) are never restored.
export function restoreSkins(profile, productIds) {
  const ids = productIds.map((id) => PRODUCTS[id]).filter(Boolean).flatMap((p) => (p.kind === 'skin' ? [p.skinId] : p.kind === 'set' || p.kind === 'pack' ? p.skinIds : []));
  return { ...profile, ownedSkins: [...new Set([...(profile.ownedSkins || []), ...ids])] };
}

// Spending EARNED coins (no payment processor involved, so this is fine on iOS). Pure: returns the new profile.
// kind: 'skin' (item = skin) | 'set' (item = a set from themes.js) | 'bundle' (item = bundle) | 'powerup' (item = 'heli' | 'bay' | 'key')
// opts: { now, hemisphere } - themed items can only be bought while they are in the shop. Anything already owned stays owned forever.
export function coinPurchase(profile, kind, item, opts = {}) {
  const now = opts.now || new Date(), hemi = opts.hemisphere || profile.hemisphere || 'north';
  const owned = new Set(profile.ownedSkins || []);
  let price, grantSkins = [];
  if (kind === 'skin') {
    if (item.obtain === 'shop') price = item.coinPrice;
    else if (item.obtain === 'set') {
      if (!isOffered(item.setId, now, hemi)) return { ok: false, reason: 'not-in-shop' };
      price = item.coinPrice;
    }
    grantSkins = [item.id];
  }
  if (kind === 'set') {
    if (!isOffered(item.id, now, hemi)) return { ok: false, reason: 'not-in-shop' };
    grantSkins = [vehicleSkinId(item.id), passengerSkinId(item.id)];
    if (grantSkins.every((id) => owned.has(id))) return { ok: false, reason: 'already-owned' };
    price = setCoinPrice(item);   // the set price is the same even if you already own one half (keeps it simple)
  }
  if (kind === 'pack') {   // always for sale (not tied to the season window)
    grantSkins = packSkinIds(item);
    if (grantSkins.every((id) => owned.has(id))) return { ok: false, reason: 'already-owned' };
    price = item.coinPrice;
  }
  if (kind === 'bundle') price = item.coinPrice;
  if (kind === 'powerup') price = SINGLE_POWERUP_COIN_PRICE[item];
  if (price === undefined) return { ok: false, reason: 'not-for-sale' };
  if (kind === 'skin' && owned.has(item.id)) return { ok: false, reason: 'already-owned' };
  if ((profile.coins || 0) < price) return { ok: false, reason: 'not-enough-coins' };
  const next = { ...profile, coins: profile.coins - price, powerups: { ...(profile.powerups || {}) } };
  if (grantSkins.length) next.ownedSkins = [...new Set([...(profile.ownedSkins || []), ...grantSkins])];
  if (kind === 'bundle') Object.entries(item.items).forEach(([k, n]) => { next.powerups[k] = (next.powerups[k] || 0) + n; });
  if (kind === 'powerup') next.powerups[item] = (next.powerups[item] || 0) + 1;
  return { ok: true, profile: next };
}
