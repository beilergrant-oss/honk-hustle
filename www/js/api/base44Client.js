// api/base44Client.js - a tiny local stand-in for the Base44 SDK so shop.js and bootTasks.js run unchanged inside the app.
// Everything is stored on the device. To add a real backend later (cloud save, server-verified purchases), replace this file.
import { loadProfile, saveProfile } from '../store.js';
import { grantProduct, restoreSkins } from '../catalog.js';

export const base44 = {
  entities: {
    PlayerProfile: {
      list: async () => [loadProfile()],
      create: async (p) => saveProfile({ ...loadProfile(), ...p }),
      update: async (_id, patch) => saveProfile({ ...loadProfile(), ...patch }),
    },
  },
  functions: {
    async invoke(name, payload = {}) {
      if (name === 'verifyPurchase') {                    // RevenueCat / StoreKit already confirmed the purchase on the device
        const r = grantProduct(loadProfile(), payload.productId, payload.transactionId);
        if (r.granted) saveProfile(r.profile);
        return { data: { granted: r.granted, profile: r.profile } };
      }
      if (name === 'restorePurchases') {
        const next = saveProfile(restoreSkins(loadProfile(), payload.productIds || []));
        return { data: { restored: payload.productIds || [], profile: next } };
      }
      throw new Error('Not available in this build.');    // createCheckout (web payments) is intentionally unsupported in the iOS app
    },
  },
};
