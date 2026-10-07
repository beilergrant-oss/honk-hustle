// npm run android  -  creates (first time) or updates the Android Studio project, applies the app settings, then opens Android Studio.
// Run it again after every change (new settings, new version code). Works on Windows, Mac and Linux.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('..', import.meta.url));
process.chdir(root);
const run = (cmd) => { console.log('\n> ' + cmd); const r = spawnSync(cmd, { stdio: 'inherit', shell: true }); if (r.status !== 0) { console.error('\nThat step failed. Read the red text above, fix it, then run  npm run android  again.'); process.exit(1); } };
const S = fs.existsSync('app-settings.json') ? JSON.parse(fs.readFileSync('app-settings.json', 'utf8')) : null;
if (!S) { console.error('Run  npm run configure  first.'); process.exit(1); }
const cap = JSON.parse(fs.readFileSync('capacitor.config.json', 'utf8'));
if (cap.appId.includes('yourname')) { console.error('The package name still says "yourname". Run  npm run configure  first.'); process.exit(1); }

if (!fs.existsSync('android')) run('npx cap add android');
else {
  const g = fs.readFileSync('android/app/build.gradle', 'utf8'), m = g.match(/applicationId "([^"]+)"/);
  if (m && m[1] !== cap.appId) console.warn(`\nWARNING: the android folder was made for ${m[1]} but your package name is now ${cap.appId}.\nDelete the "android" folder and run  npm run android  again.\n`);
}
run("npx capacitor-assets generate --android --iconBackgroundColor \"#5b55ff\" --splashBackgroundColor \"#5b55ff\"");
run('npx cap sync android');

const M = 'android/app/src/main/AndroidManifest.xml', G = 'android/app/build.gradle', STR = 'android/app/src/main/res/values/strings.xml';
let man = fs.readFileSync(M, 'utf8');
if (!man.includes('android:screenOrientation')) man = man.replace('android:name=".MainActivity"', 'android:name=".MainActivity"\n            android:screenOrientation="portrait"');
if (!man.includes('com.google.android.gms.ads.APPLICATION_ID')) man = man.replace(/(<application\b[^>]*>)/, '$1\n        <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="@string/admob_app_id"/>');
fs.writeFileSync(M, man);
const appId = S.admobAppId || 'ca-app-pub-3940256099942544~3347511713';   // Google's test App ID until you add yours
let str = fs.readFileSync(STR, 'utf8').replace(/(<string name="app_name">)[^<]*/, '$1Bus Blitz Party').replace(/(<string name="title_activity_main">)[^<]*/, '$1Bus Blitz Party');
str = str.includes('name="admob_app_id"') ? str.replace(/(<string name="admob_app_id">)[^<]*/, '$1' + appId) : str.replace('</resources>', `    <string name="admob_app_id">${appId}</string>\n</resources>`);
fs.writeFileSync(STR, str);
const version = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
fs.writeFileSync(G, fs.readFileSync(G, 'utf8').replace(/versionCode \d+/, 'versionCode ' + S.versionCode).replace(/versionName "[^"]*"/, `versionName "${version}"`));
console.log(`\nAndroid project ready: Bus Blitz Party ${version} (version code ${S.versionCode}), portrait, AdMob ${S.admobAppId ? 'app ' + appId : 'TEST app id'}.`);
if (!process.argv.includes('--no-open')) run('npx cap open android');
