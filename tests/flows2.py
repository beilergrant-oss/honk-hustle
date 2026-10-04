import json
from playwright.sync_api import sync_playwright
exec(open('flows.py').read().split("with sync_playwright")[0])   # reuse helpers and SEED
with sync_playwright() as p:
    b=p.chromium.launch()
    ctx,pg=newpage(b); pg.goto(BASE+'?fast=1&go=home'); pg.wait_for_selector('#home:not([hidden])'); pg.wait_for_timeout(300)
    # levels picker
    pg.locator('[data-go=levels]:visible').first.click(); pg.wait_for_timeout(400); pg.screenshot(path='shots/20_levels.png')
    pg.click('[data-area="1"]'); pg.wait_for_timeout(200); print('area view', pg.evaluate('window.__hh.areaView'))
    pg.locator('[data-go=home]:visible').first.click(); pg.wait_for_timeout(200)
    # shop: sets
    pg.locator('[data-go=shop]:visible').first.click(); pg.wait_for_timeout(800); pg.screenshot(path='shots/21_shop_sets.png')
    cards=pg.locator('[data-buyset]').count(); print('buyable set cards', cards)
    before=pg.evaluate('window.__hh.profile.coins')
    sid=pg.locator('[data-buyset]').first.get_attribute('data-buyset'); pg.locator('[data-buyset]').first.click(); pg.wait_for_timeout(500)
    after=pg.evaluate('window.__hh.profile'); print('bought',sid,'coins',before,'->',after['coins'],'owned',[s for s in after['ownedSkins'] if sid in s])
    pg.click('[data-tab=power]'); pg.wait_for_timeout(300); pg.screenshot(path='shots/22_shop_power.png')
    pg.click('[data-buypu=heli]'); pg.wait_for_timeout(300); print('heli owned', pg.evaluate('window.__hh.profile.powerups.heli'))
    pg.click('[data-tab=coins]'); pg.wait_for_timeout(300); pg.screenshot(path='shots/23_shop_coins.png')
    pg.locator('[data-go=home]:visible').first.click(); pg.wait_for_timeout(200)
    # garage
    pg.locator('[data-go=garage]:visible').first.click(); pg.wait_for_timeout(900); pg.screenshot(path='shots/24_garage.png')
    pg.click('#garage [data-id=ocean]'); pg.wait_for_timeout(300); pg.screenshot(path='shots/25_garage_sheet.png')
    pg.click('#garage [data-act=equip]'); pg.wait_for_timeout(300); print('equipped', pg.evaluate('window.__hh.profile.equippedVehicleSkin'), pg.evaluate('window.__hh.profile.equippedPassengerSkin'))
    pg.click('#garage [data-act=back]'); pg.wait_for_timeout(200)
    pg.click('#garage [data-id=pride]'); pg.wait_for_timeout(300); print('locked pride text:', pg.inner_text('#garage .bg-sheet .bg-row'))
    pg.click('#garage [data-act=back]'); pg.wait_for_timeout(200); pg.click('#garage [data-act=close]'); pg.wait_for_timeout(300)
    # settings
    pg.locator('[data-go=settings]:visible').first.click(); pg.wait_for_timeout(300); pg.screenshot(path='shots/26_settings.png')
    pg.click('[data-set=seasonal]'); pg.wait_for_timeout(200); print('seasonal', pg.evaluate('window.__hh.profile.settings.seasonal'))
    pg.select_option('[data-hemi]','south'); print('hemisphere', pg.evaluate('window.__hh.profile.hemisphere'))
    pg.locator('[data-go=home]:visible').first.click(); pg.wait_for_timeout(500); pg.screenshot(path='shots/27_home_regular.png'); print('chip present', pg.locator('.home-chip').count())
    # reset
    pg.locator('[data-go=settings]:visible').first.click(); pg.click('[data-act=reset]'); pg.click('.dlg .btn.red'); pg.wait_for_timeout(400); print('after reset coins', pg.evaluate('window.__hh.profile.coins'), 'route', pg.evaluate('window.__hh.route'))
    # offline mid-session: game keeps working
    ctx.set_offline(True); pg.click('[data-act=play]'); pg.wait_for_selector('#game:not([hidden])'); pg.wait_for_timeout(300); print('offline play ok', game(pg)['status'])
    ctx.close()
    # small phone + tablet layout
    for name,w,h in [('se',375,667),('ipad',820,1180)]:
        ctx,pg=newpage(b,w=w,h=h); pg.goto(BASE+'?fast=1&go=game&level=16'); pg.wait_for_selector('#game:not([hidden])'); pg.wait_for_timeout(600); pg.screenshot(path=f'shots/30_{name}.png'); ctx.close()
    print('ERRORS:',errs); b.close()
