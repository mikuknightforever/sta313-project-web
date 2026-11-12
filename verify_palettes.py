"""Render the four light palettes and verify switching without losing analysis state."""
from pathlib import Path
from datetime import datetime, timezone
import json
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).parent
PALETTES = json.loads((ROOT/'assets/palettes.json').read_text())

def luminance(hex_color):
    rgb = [int(hex_color[i:i+2],16)/255 for i in (1,3,5)]
    linear = [v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4 for v in rgb]
    return sum(v*w for v,w in zip(linear,[.2126,.7152,.0722]))

def contrast(a,b):
    a,b=sorted([luminance(a),luminance(b)])
    return (b+.05)/(a+.05)

report={'verified_at_utc':datetime.now(timezone.utc).isoformat(),'capture_scale':2,'desktop_image_width_px':2880,'mobile_image_width_px':780,'palettes':[],'limits':'Flat-color pairs and affected Chromium interactions only; not a full accessibility audit.'}
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1440,'height':1050},device_scale_factor=2)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    for palette in PALETTES:
        colors=palette['colors']
        checks=[]
        for fg in ['ink','muted','teal']:
            for bg in ['paper','surface','rail','note','soft']:
                ratio=contrast(colors[fg],colors[bg]);checks.append({'pair':fg+'/'+bg,'ratio':round(ratio,2),'minimum':4.5})
                assert ratio>=4.5,(palette['id'],fg,bg,ratio)
        ratio=contrast(colors['on-button'],colors['button']);assert ratio>=4.5
        checks.append({'pair':'on-button/button','ratio':round(ratio,2),'minimum':4.5})
        for bg in ['paper','surface']:
            ratio=contrast(colors['control'],colors[bg]);checks.append({'pair':'control/'+bg,'ratio':round(ratio,2),'minimum':3})
            assert ratio>=3,(palette['id'],'control',bg,ratio)
        assert all(luminance(colors[x])>.7 for x in ['paper','surface','rail','note','soft'])
        page.goto('http://127.0.0.1:8765/react/?palette='+palette['id'],wait_until='networkidle')
        page.locator('.js-plotly-plot').wait_for()
        assert page.locator('html').get_attribute('data-palette')==palette['id']
        assert page.get_by_role('button',name=palette['name']).get_attribute('aria-pressed')=='true'
        assert page.locator('.palette-option[aria-pressed=true]').count()==1
        page.screenshot(path=str(ROOT/'screenshots'/('palette-'+palette['id']+'.png')),full_page=True)
        page.set_viewport_size({'width':390,'height':844})
        page.wait_for_timeout(300)
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
        page.screenshot(path=str(ROOT/'screenshots'/('palette-'+palette['id']+'-mobile.png')),full_page=True)
        page.set_viewport_size({'width':1440,'height':1050})
        report['palettes'].append({'id':palette['id'],'desktop_mobile':'pass','contrast_pairs':checks})
    page.locator('#region').select_option('城市')
    page.get_by_role('tab',name='学校明细').click()
    for palette in PALETTES:
        page.get_by_role('button',name=palette['name']).click()
        assert page.locator('.stat-value').first.inner_text()=='30'
        assert page.locator('tbody tr').count()==30
        assert page.get_by_role('tab',name='学校明细').get_attribute('aria-selected')=='true'
        assert page.locator('html').get_attribute('data-palette')==palette['id']
    page.reload(wait_until='networkidle')
    assert page.locator('html').get_attribute('data-palette')=='citrus'
    page.get_by_role('button',name='暖白鼠尾草').focus();page.keyboard.press('Space')
    assert page.locator('html').get_attribute('data-palette')=='sage'
    page.goto('http://127.0.0.1:8765/react/?palette=unknown',wait_until='networkidle')
    assert page.locator('html').get_attribute('data-palette')=='sage'
    assert not errors,errors
    report['state_preservation_keyboard_reload_fallback']='pass'
    report['browser_errors']=errors
    browser.close()
(ROOT/'palette-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'palettes':len(PALETTES),'screenshots':len(PALETTES)*2,'contrast_pairs':sum(len(x['contrast_pairs']) for x in report['palettes']),'state_checks':'pass'}))
