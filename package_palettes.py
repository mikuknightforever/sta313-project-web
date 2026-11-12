"""Package actual screenshots into a self-contained light-palette comparison."""
from pathlib import Path
import base64
import json

ROOT = Path(__file__).parent
OUT = ROOT / 'deliverables'
palettes = json.loads((ROOT / 'assets/palettes.json').read_text())
for palette in palettes:
    for mode in ('desktop', 'mobile'):
        suffix = '-mobile' if mode == 'mobile' else ''
        screenshot = ROOT / 'screenshots' / f"palette-{palette['id']}{suffix}.png"
        palette[mode] = 'data:image/png;base64,' + base64.b64encode(screenshot.read_bytes()).decode()

html = '''<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>STA313 · 四套浅色配色</title><style>
:root{color-scheme:light;--paper:#f6f5f0;--ink:#222826;--muted:#59625e;--line:#d1d8ca;--accent:#2f5c53}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:14px/1.7 Arial,"PingFang SC","Noto Sans CJK SC",sans-serif}header,main,footer{max-width:1520px;margin:auto;padding:28px 38px}.masthead{display:flex;justify-content:space-between;gap:20px;border-bottom:1px solid var(--line);padding-bottom:18px;font-size:10px;letter-spacing:2px;color:var(--muted)}.hero{display:flex;justify-content:space-between;align-items:end;gap:30px;margin-top:30px}h1{font:500 40px/1.5 Georgia,"Songti SC","Noto Serif CJK SC",serif;margin:0 0 10px}header p{color:var(--muted);margin:0;max-width:780px;font-size:13px}.switch{display:flex;gap:8px;flex-shrink:0;margin-bottom:5px}button,a{font:inherit}button{background:#fff;border:1px solid #7c8a78;border-radius:4px;padding:9px 16px;color:var(--ink);cursor:pointer;font-size:12px}button[aria-pressed=true]{background:#dadfd1;border-color:var(--accent)}a{color:var(--accent);text-underline-offset:4px}button:focus-visible,a:focus-visible{outline:3px solid var(--accent);outline-offset:4px}main{padding-top:8px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}.palette{background:#fff;border:1px solid var(--line);border-radius:6px;overflow:hidden}.head{padding:20px 24px 16px;display:flex;justify-content:space-between;align-items:center;gap:15px}h2{font-size:20px;font-weight:500;margin:0 0 4px}.number{font-size:10px;margin-right:10px;color:var(--muted)}.head p{font-size:12px;margin:0;color:var(--muted)}.swatches{display:flex;flex-shrink:0}.swatches i{width:25px;height:25px;border:1px solid #22282630;border-radius:50%;margin-left:-5px}.preview{background:var(--preview);border-block:1px solid var(--line)}.preview img{display:block;width:100%;height:auto}.grid.mobile .preview{height:590px;overflow:auto;padding:16px}.grid.mobile img{max-width:390px;margin:auto;border:1px solid var(--line)}.caption{display:flex;justify-content:space-between;gap:15px;align-items:center;padding:14px 24px;font-size:11px;color:var(--muted)}.caption a{white-space:nowrap}footer{padding-top:0;font-size:12px;color:var(--muted)}.footnote{margin-top:20px;color:var(--muted);font-size:12px}.label{display:inline-block;font-size:10px;margin-left:8px;padding:1px 7px;background:#e4e9dd;border-radius:3px;vertical-align:middle}@media(max-width:800px){header,main,footer{padding:20px}.hero{display:block}h1{font-size:31px}.switch{margin-top:20px}.grid{grid-template-columns:1fr}.head{padding:18px}.caption{padding:12px 18px}.masthead{font-size:8px;letter-spacing:1px}.head h2{font-size:19px}.swatches i{width:21px;height:21px}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto}}
</style></head><body><header><div class="masthead"><span>STA313 / COLOUR STUDIES</span><span>LIGHT EDITION · 01—04</span></div><div class="hero"><div><h1>同一页，四种浅色。</h1><p>保持布局、数据和图表标记一致，只比较页面配色。先看整体感受，再打开页面试试筛选与切换。</p></div><div class="switch" role="group" aria-label="截图尺寸"><button id="desktop" aria-pressed="true">桌面</button><button id="mobile" aria-pressed="false">手机</button></div></div></header><main><div class="grid" id="palettes"></div><p class="footnote">截图来自真实 React 页面。打开交互页后，也可以用“页面配色”切换方案；当前筛选和视图会保留。</p></main><footer>暖白鼠尾草为初始默认。四套均为浅色，视觉风格也可以用于其他建站路线。示例使用合成数据。</footer><script>
const PALETTES=__PALETTES__;
let mode='desktop';
const inside=location.pathname.includes('/deliverables/');
const base=location.protocol==='file:'?(inside?'02-react.html':'deliverables/02-react.html'):(inside?'../react/':'react/');
function render(){
  document.querySelector('#palettes').className='grid '+mode;
  document.querySelector('#palettes').innerHTML=PALETTES.map((p,i)=>`<article class="palette" data-palette="${p.id}"><div class="head"><div><h2><span class="number">0${i+1}</span>${p.name}${i===0?'<span class="label">默认</span>':''}</h2><p>${p.description}</p></div><div class="swatches" aria-hidden="true">${p.swatches.map(c=>`<i style="background:${c}"></i>`).join('')}</div></div><div class="preview" style="--preview:${p.colors.paper}"><img src="${p[mode]}" alt="${p.name} · ${mode==='desktop'?'桌面':'手机'}实际运行截图"></div><div class="caption"><span>${p.swatches[0].toUpperCase()} · ${mode==='desktop'?'1440 px 桌面':'390 px 手机'}</span><a href="${base}?palette=${p.id}" target="_blank" rel="noopener">打开这套配色 ↗</a></div></article>`).join('');
  for(const name of ['desktop','mobile'])document.querySelector('#'+name).setAttribute('aria-pressed',String(mode===name));
}
for(const name of ['desktop','mobile'])document.querySelector('#'+name).onclick=()=>{mode=name;render()};
render();
</script></body></html>'''
html = html.replace('__PALETTES__', json.dumps(palettes, ensure_ascii=False))
(ROOT / 'palettes.html').write_text(html)
(OUT / '浅色配色对比.html').write_text(html)
print('Created self-contained light-palette comparison pages.')
