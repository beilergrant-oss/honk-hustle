from playwright.sync_api import sync_playwright
import sys
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':390,'height':844})
    ctx.add_init_script("try{ if(!localStorage.getItem('__s')){localStorage.setItem('honkhustle_profile_v1', JSON.stringify({coins:0,highestLevel:11199,powerups:{heli:0,bay:0,key:0},ownedSkins:[]}));localStorage.setItem('__s','1')} }catch(e){}")
    pg=ctx.new_page(); pg.on('pageerror',lambda e:print('PAGEERROR',e)); pg.on('console',lambda m: print('CONSOLE',m.type,m.text[:200]))
    pg.goto('http://localhost:8080/index.html?fast=1&go=game&level='+sys.argv[1]); pg.wait_for_timeout(8000)
    print('route',pg.evaluate('window.__hh.route'), 'loading html len', pg.evaluate("document.querySelector('#loading').innerHTML.length"))
    print(pg.evaluate("document.querySelector('.hh-label')&&document.querySelector('.hh-label').textContent"))
    b.close()
