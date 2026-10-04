import json
from playwright.sync_api import sync_playwright
BASE='http://localhost:8080/index.html'
errs=[]
SEED={"id":"local","coins":5000,"highestLevel":30,"winStreak":3,"bestStreak":3,"powerups":{"heli":2,"bay":2,"key":2},
      "ownedSkins":["v_set_ocean","p_set_ocean","v_set_space","p_set_space"],"equippedVehicleSkin":"v_set_space","equippedPassengerSkin":"p_set_space",
      "hemisphere":"north","settings":{"sound":True,"haptics":True,"seasonal":True}}
def newpage(b, ls=SEED, w=390, h=844):
    ctx=b.new_context(viewport={'width':w,'height':h},device_scale_factor=2,has_touch=True,is_mobile=True)
    ctx.add_init_script("try{ if(!localStorage.getItem('__seeded')){ localStorage.setItem('honkhustle_profile_v1', %s); localStorage.setItem('__seeded','1'); } }catch(e){}" % json.dumps(json.dumps(ls)))
    pg=ctx.new_page()
    pg.on('pageerror',lambda e:errs.append('PAGEERROR '+str(e)))
    pg.on('console',lambda m: m.type=='error' and 'fonts.g' not in m.text and errs.append('CONSOLE '+m.text))
    return ctx,pg
def tap(pg,id):
    pt=pg.evaluate("(id)=>window.__hh.renderer.vehiclePoint(id)", id); box=pg.locator('#board').bounding_box()
    pg.touchscreen.tap(box['x']+pt['x'], box['y']+pt['y'])
def game(pg): return pg.evaluate("""()=>{const g=window.__hh.game;return {status:g.status,reason:g.reason,moves:g.round.moveLimit-g.round.movesUsed,queue:g.queue.length,bay:g.bay,
   locked:g.vehicles.filter(v=>v.state==='grid'&&v.lock>0).length, grid:g.vehicles.filter(v=>v.state==='grid').length, free:g.round.freeUses}}""")
with sync_playwright() as p:
    b=p.chromium.launch()
    # ---- hard level with skins, locks, cones; power-ups ----
    ctx,pg=newpage(b); pg.goto(BASE+'?fast=1&go=game&level=16'); pg.wait_for_selector('#game:not([hidden])'); pg.wait_for_timeout(700)
    print('L16 start', game(pg)); pg.screenshot(path='shots/10_hard_skin.png')
    # key: unlock all
    pg.click('[data-pw=key]'); pg.wait_for_timeout(300); g=game(pg); print('after key', g); assert g['locked']==0
    prof=pg.evaluate('window.__hh.profile.powerups'); print('powerups now', prof, '(a free use should have been spent first)')
    # heli: target a free vehicle
    pg.click('[data-pw=heli]'); pg.wait_for_timeout(200); pg.screenshot(path='shots/11_heli_target.png')
    free=pg.evaluate("""async()=>{const m=await import('/js/game.js');const g=window.__hh.game;return g.vehicles.filter(v=>v.state==='grid'&&!m.blocker(g,v)).map(v=>v.id)}""")
    blocked=pg.evaluate("""async()=>{const m=await import('/js/game.js');const g=window.__hh.game;return g.vehicles.filter(v=>v.state==='grid'&&m.blocker(g,v)).map(v=>v.id)}""")
    print('free',len(free),'blocked',len(blocked))
    tap(pg,blocked[0]); pg.wait_for_timeout(900); g=game(pg); print('after heli on a BLOCKED vehicle', g); pg.screenshot(path='shots/12_after_heli.png')
    # bay+
    pg.click('[data-pw=bay]'); pg.wait_for_timeout(500); g=game(pg); print('after bay+', g)
    # ---- lose by running out of moves ----
    pg.goto(BASE+'?fast=1&go=game&level=40'); pg.wait_for_selector('#game:not([hidden])'); pg.wait_for_timeout(500)
    for i in range(80):
        st=game(pg)
        if st['status']!='playing': break
        ids=pg.evaluate("""async()=>{const m=await import('/js/game.js');const g=window.__hh.game;return g.vehicles.filter(v=>v.state==='grid'&&v.lock===0&&m.blocker(g,v)).map(v=>v.id)}""")
        if not ids: break
        tap(pg,ids[0]); pg.wait_for_timeout(120)
    pg.wait_for_selector('.overlay .dlg',timeout=8000); pg.wait_for_timeout(300); print('lose dialog:', pg.inner_text('.dlg h2'), '| streak now', pg.evaluate('window.__hh.profile.winStreak'))
    pg.screenshot(path='shots/13_lose.png')
    pg.click('.dlg .btn.green'); pg.wait_for_timeout(600); print('retry ->', game(pg), 'attempts', pg.evaluate('window.__hh.attempts'))
    ctx.close()
    # ---- stuck bay: park vehicles that nobody wants ----
    ctx,pg=newpage(b, {**SEED,"powerups":{"heli":0,"bay":1,"key":0},"winStreak":0}); pg.goto(BASE+'?fast=1&go=game&level=45'); pg.wait_for_selector('#game:not([hidden])'); pg.wait_for_timeout(500)
    for i in range(40):
        st=game(pg)
        if st['status']!='playing': break
        pick=pg.evaluate("""async()=>{const m=await import('/js/game.js');const g=window.__hh.game;const front=g.queue[0];
          const free=g.vehicles.filter(v=>v.state==='grid'&&v.lock===0&&!m.blocker(g,v));
          const bad=free.find(v=>v.color!==front)||free[0];return bad?bad.id:null}""")
        if not pick: break
        tap(pg,pick); pg.wait_for_timeout(700)
    pg.wait_for_timeout(1500)
    st=game(pg); print('stuck test state', st)
    if pg.locator('.overlay .dlg').count(): print('dialog:', pg.inner_text('.dlg h2')); pg.screenshot(path='shots/14_stuck.png')
    ctx.close()
    print('ERRORS:',errs)
    b.close()
