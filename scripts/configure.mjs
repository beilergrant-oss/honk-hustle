// npm run configure  -  asks a few questions and writes every setting the store build needs. Safe to run again any time;
// press Enter to keep the value shown in [brackets]. Works on Windows, Mac and Linux (plain Node, no extra installs).
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline';
import { stdin, stdout } from 'node:process';

const root = fileURLToPath(new URL('..', import.meta.url));
const P = (f) => root + f;
const read = (f) => fs.readFileSync(P(f), 'utf8');
const write = (f, s) => fs.writeFileSync(P(f), s);
const SETTINGS = 'app-settings.json';
const old = fs.existsSync(P(SETTINGS)) ? JSON.parse(read(SETTINGS)) : {};
const cap = JSON.parse(read('capacitor.config.json'));
const cfg = read('www/js/config.js');
const pick = (re, d = '') => { const m = cfg.match(re); return m ? m[1] : d; };

// answers are queued as they arrive, so typing ahead (or pasting several lines) never loses one
const rl = readline.createInterface({ input: stdin, terminal: false });
const queue = [], waiting = []; let ended = false;
rl.on('line', (l) => (waiting.length ? waiting.shift()(l) : queue.push(l)));
rl.on('close', () => { ended = true; while (waiting.length) waiting.shift()(null); });
const nextLine = () => (queue.length ? Promise.resolve(queue.shift()) : ended ? Promise.resolve(null) : new Promise((r) => waiting.push(r)));
async function ask(q, def, check) {
  for (;;) {
    stdout.write(`${q}${def ? ` [${def}]` : ''}: `);
    const line = await nextLine();
    if (line === null) { console.log('\nStopped before all questions were answered - nothing was saved.'); process.exit(1); }
    const a = line.trim() || def || '';
    const err = check ? check(a) : null;
    if (!err) return a;
    console.log('  ! ' + err);
  }
}
const isTest = (s) => !s || s.includes('3940256099942544') || s.includes('XXXX');

console.log('\nBus Blitz Party - store settings. Press Enter to keep the value in [brackets].\n');
const pkg = await ask('1. Package name (lowercase, like com.yourname.busblitzparty - can never change after the first upload)', old.packageName || cap.appId,
  (s) => (/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){1,}$/.test(s) ? (s.includes('yourname') ? 'Replace "yourname" with something of your own, e.g. com.grantgames.busblitzparty' : null) : 'Use only lowercase letters, numbers, _ and at least one dot, e.g. com.grantgames.busblitzparty'));
const email = await ask('2. Support email shown on Google Play', old.supportEmail || pick(/SUPPORT_EMAIL: '([^']*)'/).replace('support@example.com', ''), (s) => (/^\S+@\S+\.\S+$/.test(s) ? null : 'Enter a valid email address'));
const site = 'https://beilergrant-oss.github.io/honk-hustle';
const privacy = await ask('3. Privacy policy web address', old.privacyUrl || site + '/privacy.html', (s) => (/^https:\/\//.test(s) ? null : 'Must start with https://'));
const terms = await ask('4. Terms web address', old.termsUrl || site + '/terms.html', (s) => (/^https:\/\//.test(s) ? null : 'Must start with https://'));
console.log('\nAdMob (leave blank for now to keep Google\'s TEST ads - fine for testing, NOT for the real release):');
const admobApp = await ask('5. AdMob Android App ID (looks like ca-app-pub-1234567890123456~1234567890)', isTest(old.admobAppId) ? '' : old.admobAppId, (s) => (!s || /^ca-app-pub-\d+~\d+$/.test(s) ? null : 'Should look like ca-app-pub-1234567890123456~1234567890 (with a ~)'));
const inter = await ask('6. AdMob Interstitial ad unit ID (ca-app-pub-...\/...)', isTest(old.admobInterstitial) ? '' : old.admobInterstitial, (s) => (!s || /^ca-app-pub-\d+\/\d+$/.test(s) ? null : 'Should look like ca-app-pub-1234567890123456/1234567890 (with a /)'));
const rew = await ask('7. AdMob Rewarded ad unit ID (ca-app-pub-...\/...)', isTest(old.admobRewarded) ? '' : old.admobRewarded, (s) => (!s || /^ca-app-pub-\d+\/\d+$/.test(s) ? null : 'Should look like ca-app-pub-1234567890123456/1234567890 (with a /)'));
console.log('\nRevenueCat (leave blank to hide the paid shop items for now):');
const rc = await ask('8. RevenueCat Google Play public SDK key (starts with goog_)', old.revenueCatAndroid || '', (s) => (!s || /^goog_\w+$/.test(s) ? null : 'Should start with goog_'));
const vc = await ask('9. Version code (a whole number; must go up by 1 for every upload to Google Play)', String(old.versionCode || 1), (s) => (/^\d+$/.test(s) && +s > 0 ? null : 'Whole number, 1 or more'));
rl.close();

const realAds = !!(admobApp && inter && rew);
const settings = { packageName: pkg, supportEmail: email, privacyUrl: privacy, termsUrl: terms, admobAppId: admobApp, admobInterstitial: inter, admobRewarded: rew, revenueCatAndroid: rc, versionCode: +vc };
write(SETTINGS, JSON.stringify(settings, null, 2) + '\n');

// capacitor.config.json + the bundle id the in-app products are named after
const oldPkg = cap.appId; cap.appId = pkg; write('capacitor.config.json', JSON.stringify(cap, null, 2) + '\n');
write('www/js/themes.js', read('www/js/themes.js').replace(/export const BUNDLE_ID = '[^']*'/, `export const BUNDLE_ID = '${pkg}'`));
let c = cfg
  .replace(/PRIVACY_URL: '[^']*'/, `PRIVACY_URL: '${privacy}'`).replace(/TERMS_URL: '[^']*'/, `TERMS_URL: '${terms}'`).replace(/SUPPORT_EMAIL: '[^']*'/, `SUPPORT_EMAIL: '${email}'`)
  .replace(/REVENUECAT_ANDROID_KEY: '[^']*'/, `REVENUECAT_ANDROID_KEY: '${rc || 'goog_XXXXXXXXXXXXXXXX'}'`)
  .replace(/testing: (true|false),/, `testing: ${realAds ? 'false' : 'true'},`);
if (realAds) c = c.replace(/android: \{ interstitial: '[^']*', rewarded: '[^']*' \}/, `android: { interstitial: '${inter}', rewarded: '${rew}' }`);
write('www/js/config.js', c);
// product list for Play Console uses the package name as prefix
if (fs.existsSync(P('store/iap_products.csv'))) write('store/iap_products.csv', read('store/iap_products.csv').split(oldPkg + '.').join(pkg + '.'));
// the privacy and terms pages hosted from docs/ on GitHub Pages
for (const f of ['docs/privacy.html', 'docs/terms.html']) if (fs.existsSync(P(f))) write(f, read(f).replace(/<a class="mail" href="mailto:[^"]*">[^<]*<\/a>/g, `<a class="mail" href="mailto:${email}">${email}</a>`));

console.log(`\nSaved. Package ${pkg}, version code ${vc}.`);
console.log(realAds ? 'Ads: your REAL AdMob ids are in.' : 'Ads: Google TEST ads (fill in questions 5-7 before the real release).');
console.log(rc ? 'Paid items: ON (RevenueCat key set).' : 'Paid items: hidden (no RevenueCat key yet).');
console.log('\nNext: npm run android\n');
