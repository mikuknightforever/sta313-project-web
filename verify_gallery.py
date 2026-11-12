"""Verify all eight HD entries, offline viewing, zoom, downloads, and mobile layout."""
from pathlib import Path
from datetime import datetime, timezone
from urllib.parse import quote
import hashlib
import json
import struct
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).parent.resolve()
OUT = ROOT / 'deliverables'
BASE = 'http://127.0.0.1:8765/'
IDS = ['native', 'react', 'shiny', 'streamlit', 'palette-sage', 'palette-blue', 'palette-lilac', 'palette-citrus']
report = {'verified_at_utc': datetime.now(timezone.utc).isoformat(), 'entries': [], 'checks': {}}

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
    context = browser.new_context(viewport={'width':1440,'height':1050}, device_scale_factor=2, accept_downloads=True)
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    # Only serve the HTML itself, proving the embedded gallery needs no image/font/CDN requests.
    page.route('**/*', lambda route: route.continue_() if route.request.resource_type == 'document' and route.request.url.startswith(BASE) else route.abort())
    page.goto(BASE + 'deliverables/' + quote('八套设计高清对比.html'))
    page.wait_for_function('() => [...document.querySelectorAll(".preview img")].every(i => i.complete && i.naturalWidth === 2880)')
    assert page.locator('.design').count() == 8
    assert [item.get_attribute('data-id') for item in page.locator('.design').all()] == IDS
    assert page.locator('.design[data-id=native] .open').get_attribute('href') == '../native/'
    assert page.locator('.design[data-id=shiny] .open').get_attribute('href') == 'http://127.0.0.1:8767/'
    for index, id_ in enumerate(IDS):
        page.locator('.preview').nth(index).click()
        assert page.locator('#viewer').evaluate('(el) => el.open')
        assert page.locator('#viewer-count').inner_text() == f'{index+1} / 8'
        assert page.locator('#viewer-image').evaluate('(el) => el.naturalWidth') == 2880
        page.get_by_role('button', name='原图尺寸', exact=True).click()
        assert page.locator('#viewer-image').evaluate('(el) => Math.round(el.getBoundingClientRect().width)') == 2880
        assert page.locator('#viewer-scroll').evaluate('(el) => el.scrollWidth > el.clientWidth')
        page.keyboard.press('Escape')
        assert page.locator('.preview').nth(index).evaluate('(el) => el === document.activeElement')
        dimensions = {}
        for mode in ('desktop', 'mobile'):
            suffix = '-mobile' if mode == 'mobile' else ''
            data = (ROOT/'screenshots'/f'{id_}{suffix}.png').read_bytes()
            width, height = struct.unpack('>II', data[16:24])
            assert width == (2880 if mode == 'desktop' else 780)
            dimensions[mode] = {'width_px':width, 'height_px':height, 'sha256':hashlib.sha256(data).hexdigest()}
        report['entries'].append({'id':id_, **dimensions})
    page.locator('.preview').first.click()
    page.keyboard.press('ArrowLeft')
    assert page.locator('#viewer-count').inner_text() == '8 / 8'
    page.keyboard.press('ArrowRight')
    assert page.locator('#viewer-count').inner_text() == '1 / 8'
    with page.expect_download() as download_info:
        page.locator('#download').click()
    download = download_info.value
    assert download.suggested_filename == '01-native-desktop.png'
    assert Path(download.path()).read_bytes() == (ROOT/'screenshots/native.png').read_bytes()
    page.keyboard.press('Escape')
    page.get_by_role('button', name='手机', exact=True).click()
    page.set_viewport_size({'width':390,'height':844})
    page.wait_for_function('() => [...document.querySelectorAll(".preview img")].every(i => i.complete && i.naturalWidth === 780)')
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1')
    page.locator('.preview').nth(7).click()
    assert page.locator('#viewer-image').evaluate('(el) => el.naturalWidth') == 780
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1')
    page.get_by_role('button', name='关闭', exact=True).click()
    report['checks'].update({'eight_entries_ordered':'pass', 'embedded_images_without_external_assets':'pass',
                            'full_resolution_zoom_all_eight':'pass', 'keyboard_navigation_escape_focus':'pass',
                            'download_matches_source_png':'pass', 'mobile_gallery_and_dialog':'pass'})

    # The full-size contact sheet keeps each complete screenshot without cropping.
    page.set_viewport_size({'width':1920,'height':1200})
    page.goto(BASE + 'index.html')
    page.wait_for_function('() => [...document.querySelectorAll(".preview img")].every(i => i.complete && i.naturalWidth === 2880)')
    assert page.locator('.design[data-id=palette-lilac] .open').get_attribute('href') == 'react/?palette=lilac'
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1')
    page.add_style_tag(content='.switch,.actions{display:none!important}.hero p:last-child{margin-top:5px}.preview{cursor:default}footer{padding-bottom:24px}')
    page.screenshot(path=str(OUT/'八套设计高清总览.png'), full_page=True)
    data = (OUT/'八套设计高清总览.png').read_bytes()
    width, height = struct.unpack('>II', data[16:24])
    assert width == 3840
    report['overview_png'] = {'width_px':width, 'height_px':height, 'full_screenshots':True}

    # local.html uses the same gallery UI and local image files instead of embedded copies.
    page.unroute('**/*')
    page.set_viewport_size({'width':1440,'height':1050})
    page.goto(BASE + 'local.html', wait_until='networkidle')
    page.wait_for_function('() => [...document.querySelectorAll(".preview img")].every(i => i.complete && i.naturalWidth === 2880)')
    assert page.locator('.design').count() == 8
    page.screenshot(path=str(ROOT/'screenshots/local.png'), full_page=True)
    assert not errors, errors
    report['checks']['local_entry_eight_images_and_links'] = 'pass'
    report['browser_errors'] = errors
    report['limits'] = 'Chromium on Linux; file: navigation is blocked by managed-browser policy. Self-contained HTML was tested over localhost with additional asset requests blocked.'
    browser.close()

(ROOT/'gallery-verification.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
print(json.dumps({'entries':len(report['entries']), 'overview':report['overview_png'], 'checks':report['checks']}, ensure_ascii=False))
