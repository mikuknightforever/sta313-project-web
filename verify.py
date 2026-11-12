from pathlib import Path
import json, sys
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).parent
reports=json.loads((ROOT/'verification.json').read_text()) if (ROOT/'verification.json').exists() else []
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1440,'height':1050},device_scale_factor=1)
    for name,url in [('native','http://127.0.0.1:8765/native/'),('react','http://127.0.0.1:8765/react/'),('shiny','http://127.0.0.1:8767/'),('streamlit','http://127.0.0.1:8768/'),('quarto','http://127.0.0.1:8765/quarto/_site/')]:
        if len(sys.argv)>1 and name not in sys.argv[1:]:continue
        errors=[]
        def on_error(error):errors.append(str(error))
        page.on('pageerror',on_error)
        response=page.goto(url,wait_until='networkidle')
        page.locator('.js-plotly-plot').first.wait_for(timeout=45000)
        page.wait_for_timeout(1200)
        page.screenshot(path=str(ROOT/'screenshots'/f'{name}.png'),full_page=True)
        if name in ['native','react','quarto']:
            page.locator('#region').select_option('城市')
            expected='#n' if name!='react' else '.stat-value'
            page.wait_for_function("() => document.querySelector('"+expected+"').textContent.trim() === '30'")
            assert page.locator('.js-plotly-plot').first.evaluate('(el)=>el.data.reduce((n,t)=>n+(t.x?.length||0),0)')==30
            page.locator('#minimum').fill('1000')
            page.locator('#minimum').dispatch_event('input')
            page.wait_for_timeout(200)
            assert int(page.locator(expected).first.inner_text())<30
            page.get_by_role('button',name='重置筛选' if name!='quarto' else '重置',exact=True).click()
            page.wait_for_function("() => document.querySelector('"+expected+"').textContent.trim() === '90'")
            if name=='react':
                page.get_by_role('tab',name='区域比较').click()
                page.wait_for_function("() => document.querySelector('.js-plotly-plot').data[0].type === 'bar'")
                page.get_by_role('tab',name='学校明细').click()
                assert page.locator('tbody tr').count()==90
                page.get_by_role('tab',name='收入与表现').click()
        elif name=='shiny':
            page.locator('#region').select_option('城市')
            page.wait_for_function("() => document.querySelector('#count').textContent === '30'")
            page.wait_for_function("() => document.querySelector('.js-plotly-plot').querySelectorAll('.scatterlayer .point').length === 30")
            page.get_by_role('button',name='重置筛选').click()
            page.wait_for_function("() => document.querySelector('#count').textContent === '90'")
            page.get_by_role('tab',name='区域比较').click()
            page.locator('.js-plotly-plot').nth(1).wait_for()
            page.get_by_role('tab',name='收入与表现').click()
        else:
            page.get_by_role('combobox').click()
            page.get_by_role('option',name='城市',exact=True).click()
            page.wait_for_function("() => document.querySelector('[data-testid=stMetricValue]').textContent === '30'")
            page.get_by_role('button',name='重置筛选').click()
            page.wait_for_function("() => document.querySelector('[data-testid=stMetricValue]').textContent === '90'")
            page.get_by_role('tab',name='区域比较').click()
            page.get_by_role('tab',name='学校明细').click()
            page.locator('[data-testid=stDataFrame]').wait_for()
            page.get_by_role('tab',name='收入与表现').click()
        page.set_viewport_size({'width':390,'height':844})
        page.wait_for_timeout(500)
        overflow=page.evaluate('document.documentElement.scrollWidth > innerWidth + 1')
        page.screenshot(path=str(ROOT/'screenshots'/f'{name}-mobile.png'),full_page=True)
        page.set_viewport_size({'width':1440,'height':1050})
        page.remove_listener('pageerror',on_error)
        report={'route':name,'http':response.status,'filter_and_reset':'pass','mobile_overflow':overflow,'browser_errors':errors}
        reports=[r for r in reports if r['route']!=name]+[report]
        (ROOT/'verification.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2))
        print(json.dumps(report,ensure_ascii=False),flush=True)
    browser.close()
(ROOT/'verification.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2))
