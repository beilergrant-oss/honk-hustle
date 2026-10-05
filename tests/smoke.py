import seam
import json, sys
from playwright.sync_api import sync_playwright
BASE='http://localhost:8080/index.html'
errs=[]
def newpage(b, w=390, h=844, ls=None):
    ctx=b.new_context(viewport={'width':w,'height':h},device_scale_factor=2,has_touch=True,is_mobile=True)
    if ls: ctx.add_init_script("try{ if(!localStorage.getItem('__seeded')){ localStorage.setItem('honkhustle_profile_v1', %s); localStorage.setItem('__seeded','1'); } }catch(e){}" % json.dumps(json.dumps(ls)))
    pg=ctx.new_page()
    pg.on('pageerror',lambda e:errs.append('PAGEERROR '+str(e)))
    pg.on('console',lambda m: m.type=='error' and 'fonts.g' not in m.text and errs.append('CONSOLE '+m.text))
    return ctx,pg
def tap_vehicle(pg,id):
    pt=pg.evaluate("(id)=>{const p=window.__hh.renderer.vehiclePoint(id);return p}", id)
    box=pg.locator('#board').bounding_box()
    pg.touchscreen.tap(box['x']+pt['x'], box['y']+pt['y'])
with sync_playwright() as p:
    b=p.chromium.launch()
    # 1. boot -> home
    ctx,pg=newpage(b); pg.goto(BASE+'?fast=1'); pg.wait_for_selector('#home:not([hidden])',timeout=15000); pg.wait_for_timeout(500)
    pg.screenshot(path='shots/01_home.png'); print('home ok, route', pg.evaluate('window.__hh.route'))
    # 2. play level 1 by real taps, in solution order
    pg.click('[data-act=play]'); pg.wait_for_selector('#game:not([hidden])'); pg.wait_for_timeout(600)
    pg.screenshot(path='shots/02_level1.png')
    sol=pg.evaluate('window.__hh.level.solution')
    for i,id in enumerate(sol):
        tap_vehicle(pg,id); pg.wait_for_timeout(450)
        if i==1: pg.screenshot(path='shots/03_level1_mid.png')
    pg.wait_for_selector('.overlay .dlg',timeout=15000); pg.wait_for_timeout(300)
    pg.screenshot(path='shots/04_win.png')
    prof=pg.evaluate('window.__hh.profile'); print('after win: coins',prof['coins'],'highest',prof['highestLevel'],'streak',prof['winStreak'])
    assert prof['highestLevel']==1 and prof['winStreak']==1 and prof['coins']>0
    pg.click('.overlay .btn.green'); pg.wait_for_timeout(800)
    print('now on level', pg.evaluate('window.__hh.levelNo'))
    # 3. persistence
    pg.reload(); pg.wait_for_selector('#home:not([hidden])',timeout=15000)
    print('after reload play label:', pg.inner_text('.home-play small'), 'coins', pg.evaluate('window.__hh.profile.coins'))
    ctx.close()
    print('ERRORS:',errs)
    b.close()
