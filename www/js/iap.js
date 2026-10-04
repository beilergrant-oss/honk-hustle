// iap.js - real-money purchases through RevenueCat (StoreKit). Exposes window.NativeIAP, which shop.js already understands.
// Runs only inside the iOS app. Until you add a real RevenueCat key (config.js), nothing is exposed and the app hides every
// real-money button (Apple rule 3.1.1: digital goods in an iOS app must use In-App Purchase). Coins earned by playing always work.
//
// Written against RevenueCat's Capacitor plugin docs and NOT run here (it needs a real device and App Store Connect products).
// If a call name differs in the version you install, adjust it here: this is the only file that talks to the plugin.
import { CONFIG } from './config.js';

const plugin = () => window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Purchases;
const cache = new Map();

async function loadProducts(ids) {
  const P = plugin(), missing = ids.filter((id) => !cache.has(id));
  if (missing.length) {
    const { products } = await P.getProducts({ productIdentifiers: missing, type: 'inapp' });   // 'inapp' = one-time purchases
    (products || []).forEach((p) => cache.set(p.identifier, p));
  }
}

export async function initIap() {
  const P = plugin();
  if (!P || !CONFIG.REVENUECAT_PUBLIC_KEY || CONFIG.REVENUECAT_PUBLIC_KEY.includes('XXXX')) return false;
  try {
    await P.configure({ apiKey: CONFIG.REVENUECAT_PUBLIC_KEY });
    window.NativeIAP = {
      async getPrices(ids) { await loadProducts(ids); return Object.fromEntries(ids.filter((id) => cache.has(id)).map((id) => [id, cache.get(id).priceString])); },
      async purchase(productId) {
        await loadProducts([productId]);
        const res = await P.purchaseStoreProduct({ product: cache.get(productId) });
        const tx = res.transaction || {};
        return { transactionId: tx.transactionIdentifier || tx.storeTransactionId || String(Date.now()), productId: res.productIdentifier || productId };
      },
      async restore() { const { customerInfo } = await P.restorePurchases(); return customerInfo.allPurchasedProductIdentifiers || []; },
    };
    return true;
  } catch (e) { console.warn('IAP unavailable:', e); return false; }
}
