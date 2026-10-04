from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(); 
    # ---- icon 1024 (no transparency, no rounded corners: iOS masks it) ----
    pg=b.new_page(viewport={'width':1024,'height':1024})
    pg.goto('http://localhost:8080/index.html?fast=1'); pg.wait_for_timeout(500)
    svg=pg.evaluate("""async()=>{const {busCardSvg}=await import('/js/busArt.js');const {lookFor}=await import('/js/busStyles.js');
        let s=busCardSvg(lookFor('classic'),'icon');return s.replace('viewBox="0 -24 400 440"','viewBox="10 -22 380 380" preserveAspectRatio="xMidYMid slice"')}""")
    pg.set_content('<style>html,body{margin:0;background:#35b6ff}svg{display:block;width:1024px;height:1024px}</style>'+svg)
    pg.wait_for_timeout(200); pg.screenshot(path='assets/icon.png', clip={'x':0,'y':0,'width':1024,'height':1024})
    pg.screenshot(path='www/img/icon.png', clip={'x':0,'y':0,'width':1024,'height':1024})
    # ---- splash 2732 ----
    pg=b.new_page(viewport={'width':2732,'height':2732})
    pg.goto('http://localhost:8080/index.html?fast=1'); pg.wait_for_timeout(500)
    svg=pg.evaluate("""async()=>{const {busCardSvg}=await import('/js/busArt.js');const {lookFor}=await import('/js/busStyles.js');
        return busCardSvg(lookFor('classic'),'splash').replace('viewBox="0 -24 400 440"','viewBox="10 -22 380 380" preserveAspectRatio="xMidYMid slice"')}""")
    pg.set_content('''<style>@font-face{font-family:P;font-weight:900;src:url(http://localhost:8080/fonts/Poppins-Bold.ttf)}
    html,body{margin:0;width:2732px;height:2732px;background:radial-gradient(circle at 50% 42%,#1d3a8a,#0e1730 70%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:60px;font-family:P}
    .bus{width:980px;height:980px;border-radius:200px;overflow:hidden;box-shadow:0 40px 0 rgba(0,0,0,.25)}.bus svg{display:block;width:100%;height:100%}
    .t{font-weight:900;font-size:230px;line-height:.9;color:#ffd23f;-webkit-text-stroke:34px #10246b;paint-order:stroke fill;text-align:center;letter-spacing:-4px}
    .t span{display:block;color:#5fd4ff;font-size:170px}</style><div class="bus">'''+svg+'''</div><div class="t">Honk<span>Hustle!</span></div>''')
    pg.wait_for_timeout(500); pg.screenshot(path='assets/splash.png'); pg.screenshot(path='assets/splash-dark.png')
    b.close()
from PIL import Image
im=Image.open('/home/claude/hh_app/www/img/icon.png').convert('RGB'); im.save('/home/claude/hh_app/assets/icon.png'); im.resize((192,192),Image.LANCZOS).save('/home/claude/hh_app/www/img/icon.png')
Image.open('/home/claude/hh_app/assets/splash.png').convert('RGB').resize((820,820)).save('/home/claude/hh_app/tests/shots/splash_preview.png')
print('ok')
