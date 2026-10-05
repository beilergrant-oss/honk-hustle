import seam
import sys, json, time
from playwright.sync_api import sync_playwright
BASE='http://localhost:8080/index.html'
levels=[int(x) for x in sys.argv[1:]] or [1,2,3,4,5,10,11,12,15,16,24]
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch()
    ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=1,has_touch=True,is_mobile=True)
    ctx.add_init_script("try{ if(!localStorage.getItem('__s')){localStorage.setItem('honkhustle_profile_v1', JSON.stringify({coins:0,highestLevel:11199,powerups:{heli:0,bay:0,key:0},ownedSkins:[]}));localStorage.setItem('__s','1')} }catch(e){}")
    pg=ctx.new_page(); pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: m.type=='error' and 'fonts.g' not in m.text and errs.append(m.text))
    for n in levels:
        pg.goto(BASE+f'?fast=1&go=game&level={n}'); pg.wait_for_selector('#game:not([hidden])'); pg.wait_for_timeout(300)
        t=time.time(); sol=pg.evaluate('window.__hh.level.solution'); tier=pg.evaluate('window.__hh.level.tier')
        for id in sol:
            pt=pg.evaluate("(id)=>window.__hh.renderer.vehiclePoint(id)", id); box=pg.locator('#board').bounding_box()
            pg.touchscreen.tap(box['x']+pt['x'], box['y']+pt['y']); pg.wait_for_timeout(260)
        try: pg.wait_for_selector('.overlay .dlg h2',timeout=12000); h=pg.inner_text('.dlg h2')
        except Exception as e: h='NO DIALOG '+pg.evaluate('window.__hh.game.status')
        print(f'level {n:>5} {tier:9} vehicles {len(sol):>2} -> {h}  ({time.time()-t:.1f}s)')
    print('ERRORS:',errs); b.close()
