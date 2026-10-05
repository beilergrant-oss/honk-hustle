# seam.py - the app has no URL test switches any more. Import this first in a test: it turns the old ?fast=1&go=game&level=N style URLs
# into window.__HH_TEST__ (which only the tests define, before the page loads) so the existing flows keep working.
import json
from urllib.parse import urlparse, parse_qs
from playwright.sync_api import Page

_goto = Page.goto
def _patched(self, url, **kw):
    u = urlparse(url); q = {k: v[0] for k, v in parse_qs(u.query).items()}; s = {}
    if q.get('fast'): s['fast'] = 1
    if 'go' in q: s['go'] = q['go']
    if 'level' in q: s['level'] = int(q['level'])
    if 'date' in q: s['date'] = q['date']
    if 'theme' in q: s['theme'] = q['theme']
    self.add_init_script('window.__HH_TEST__=' + json.dumps(s))
    return _goto(self, u._replace(query='').geturl(), **kw)
Page.goto = _patched
