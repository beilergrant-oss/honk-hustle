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

// In a plain browser (the test page) there is no App Store, so this stands in for it: it asks for a "test purchase" confirmation and charges nothing.
// It is never installed inside the iOS app, where the real StoreKit bridge below is used (or the buttons stay hidden without a key).
function installSandbox() {
  const ask = (productId) => new Promise((res, rej) => {
    const d = document.createElement('div');
    d.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(10,20,60,.55);display:flex;align-items:center;justify-content:center;padding:24px;font-family:Poppins,system-ui,sans-serif';
    d.innerHTML = '<div style="background:#fff;border-radius:20px;padding:20px;max-width:300px;text-align:center;color:#10246b;box-shadow:0 12px 30px rgba(0,0,0,.35)"><b style="font-size:18px">Test purchase</b><p style="font-size:14px;margin:8px 0 14px">Sandbox store: nothing is charged. Confirm to receive this item.</p><div style="display:flex;gap:10px"><button data-n style="flex:1;border:0;border-radius:12px;padding:11px;font-weight:800;background:#e6ecff;color:#10246b">Cancel</button><button data-y style="flex:1;border:0;border-radius:12px;padding:11px;font-weight:800;background:#22b85a;color:#fff">Confirm</button></div></div>';
    document.body.appendChild(d);
    d.querySelector('[data-y]').onclick = () => { d.remove(); res({ transactionId: 'sandbox-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7), productId }); };
    d.querySelector('[data-n]').onclick = () => { d.remove(); rej(new Error('Purchase cancelled.')); };
  });
  window.NativeIAP = { sandbox: true, getPrices: async () => ({}), purchase: ask, restore: async () => [] };
}

export async function initIap() {
  const P = plugin();
  if (!P && !(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform())) { installSandbox(); return true; }
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
