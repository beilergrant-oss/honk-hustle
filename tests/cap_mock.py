import seam
from playwright.sync_api import sync_playwright
errs=[]; calls=[]
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
    ctx.add_init_script("""
      window.__calls=[]; const rec=(n)=>(...a)=>{window.__calls.push(n); return Promise.resolve({value:null})};
      window.Capacitor={isNativePlatform:()=>true,Plugins:{Haptics:{impact:rec('haptic.impact'),notification:rec('haptic.notify')},Preferences:{set:rec('prefs.set'),get:rec('prefs.get')},SplashScreen:{hide:rec('splash.hide')}}};
    """)
    pg=ctx.new_page(); pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: m.type=='error' and 'fonts.g' not in m.text and errs.append(m.text))
    pg.goto('http://localhost:8080/index.html?fast=1'); pg.wait_for_selector('#home:not([hidden])',timeout=15000)
    pg.click('[data-act=play]'); pg.wait_for_selector('#game:not([hidden])'); pg.wait_for_timeout(300)
    sol=pg.evaluate('window.__hh.level.solution'); box=pg.locator('#board').bounding_box()
    for id in sol[:2]:
        pt=pg.evaluate("(id)=>window.__hh.renderer.vehiclePoint(id)", id); pg.touchscreen.tap(box['x']+pt['x'], box['y']+pt['y']); pg.wait_for_timeout(400)
    pg.locator('[data-go=home]:visible').count()
    print('native calls:', sorted(set(pg.evaluate('window.__calls'))))
    pg.click('[data-pw=heli]'); pg.wait_for_timeout(200)
    print('money buttons hidden in native shell without IAP bridge:', pg.evaluate('!window.NativeIAP'))
    print('ERRORS:',errs); b.close()
