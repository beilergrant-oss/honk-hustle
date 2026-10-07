// platform.js - which store build this is. Capacitor tells us at runtime: 'ios', 'android' or 'web' (the preview page).
export const platform = () => { try { const C = window.Capacitor; return (C && C.getPlatform && C.getPlatform()) || 'web'; } catch (e) { return 'web'; } };
export const isAndroid = () => platform() === 'android';
export const isIos = () => platform() === 'ios';
export const storeName = () => (isAndroid() ? 'Google Play' : 'the App Store');
