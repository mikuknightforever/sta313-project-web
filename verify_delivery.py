from pathlib import Path
from playwright.sync_api import sync_playwright
import json
from urllib.parse import quote

ROOT=Path(__file__).parent.resolve()
OUT=ROOT/'deliverables'
reports=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    page=b.new_page(viewport={'width':1440,'height':1050})
    for name in ['01-native.html','02-react.html','05-quarto.html']:
        print('Verifying standalone:',name,flush=True)
        errors=[]
        def on_error(e):errors.append(str(e))
        page.on('pageerror',on_error)
        # Serve only the HTML document; block all network-loaded assets.
        page.route('http://**/*',lambda route:route.continue_() if route.request.resource_type=='document' and route.request.url.startswith('http://127.0.0.1:8765/deliverables/') else route.abort())
        page.route('https://**/*',lambda route:route.abort())
        page.goto('http://127.0.0.1:8765/deliverables/'+quote(name))
        page.locator('.js-plotly-plot').first.wait_for()
        page.locator('#region').select_option('城市')
        page.wait_for_function("() => document.querySelector('.js-plotly-plot').querySelectorAll('.scatterlayer .point').length === 30")
        assert not errors,errors
        reports.append({'file':name,'offline_chart_and_filter':'pass'})
        page.remove_listener('pageerror',on_error)
    page.goto('http://127.0.0.1:8765/deliverables/'+quote('五种建站路线对比.html'))
    assert page.get_by_role('tab').count()==5
    page.get_by_role('tab').nth(1).click()
    assert 'React' in page.locator('#current-title').inner_text()
    page.locator('#compare').select_option('shiny')
    assert page.locator('#previews img').count()==2
    page.get_by_role('button',name='手机',exact=True).click()
    assert page.locator('#previews .mobile').count()==2
    page.get_by_role('button',name='桌面',exact=True).click()
    page.locator('#compare').select_option('')
    page.get_by_role('button',name='五种总览',exact=True).click()
    assert page.locator('#overview article').count()==5
    page.wait_for_function("() => [...document.querySelectorAll('#overview img')].every(i => i.complete && i.naturalWidth > 0)")
    # Screenshot-only contact sheet; preserve image width and crop only vertical overflow.
    page.evaluate('''() => document.querySelectorAll('#overview img').forEach(img => {const frame=document.createElement('div');frame.className='contact-frame';img.replaceWith(frame);frame.append(img)})''')
    page.add_style_tag(content='header{padding:25px 32px 5px}header h1{font-size:30px}header p{margin-bottom:10px}.routes,.toolbar,.actions,#runtime-hint,footer{display:none!important}main{padding-top:15px}.overview{grid-template-columns:repeat(3,1fr)}.overview .contact-frame{height:380px;overflow:hidden;background:white}.overview img{width:100%;height:auto;display:block}.overview article{min-height:480px}.overview p{margin-top:12px}header,main{max-width:1440px}')
    page.screenshot(path=str(OUT/'五种路线总览.png'),full_page=True)
    reports.append({'file':'五种建站路线对比.html','tabs_compare_mobile_overview':'pass'})
    b.close()
(ROOT/'delivery-verification.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2))
print(json.dumps(reports,ensure_ascii=False))
