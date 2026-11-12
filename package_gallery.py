"""Build an eight-entry gallery with full-resolution, un-cropped screenshots."""
from pathlib import Path
import base64
import copy
import json
import struct

ROOT = Path(__file__).parent
OUT = ROOT / 'deliverables'


def entries():
    items = [
        dict(id='native', title='暖纸色杂志专题', tag='原有设计 · HTML / CSS / JavaScript',
             note='暖纸色、衬线标题与开放版面。', accent='#a33119', route='native/', standalone='01-native.html'),
        dict(id='react', title='浅色探索工作台', tag='原有设计 · React',
             note='原深紫色已替换；当前默认使用暖白鼠尾草。', accent='#2f5c53', route='react/', standalone='02-react.html'),
        dict(id='shiny', title='玉石绿研究实验室', tag='原有设计 · Shiny for Python',
             note='保留原深绿页头、玉石绿样本区与白色分析台。', accent='#35543b', route='http://127.0.0.1:8767/', standalone=None),
        dict(id='streamlit', title='冷蓝色数据简报', tag='原有设计 · Streamlit',
             note='保留原冷蓝刊头、横向筛选与简报布局。', accent='#194f79', route='http://127.0.0.1:8768/', standalone=None),
    ]
    for palette in json.loads((ROOT / 'assets/palettes.json').read_text()):
        items.append(dict(id='palette-' + palette['id'], title=palette['name'],
                          tag='新增配色 · React', accent=palette['colors']['teal'],
                          note=palette['description'] + (' 与 02 当前默认同色，作为完整配色组保留。' if palette['id'] == 'sage' else ''),
                          route='react/?palette=' + palette['id'],
                          standalone='02-react.html?palette=' + palette['id']))
    for number, item in enumerate(items, 1):
        item['number'] = f'{number:02}'
        for mode in ('desktop', 'mobile'):
            suffix = '-mobile' if mode == 'mobile' else ''
            path = ROOT / 'screenshots' / (item['id'] + suffix + '.png')
            data = path.read_bytes()
            width, height = struct.unpack('>II', data[16:24])
            assert width == (2880 if mode == 'desktop' else 780), (path, width)
            item[mode] = dict(src='data:image/png;base64,' + base64.b64encode(data).decode(),
                              width=width, height=height, filename=f"{item['number']}-{item['id']}-{mode}.png")
    return items


TEMPLATE = '''<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>STA313 · 八套设计高清总览</title><style>
:root{color-scheme:light;--ink:#222826;--muted:#59625e;--paper:#f6f5f0;--line:#d1d8ca;--accent:#2f5c53}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:14px/1.75 Arial,"PingFang SC","Noto Sans CJK SC",sans-serif}
header,main,footer{max-width:1920px;margin:auto;padding:28px 38px}.masthead{display:flex;justify-content:space-between;gap:18px;border-bottom:1px solid var(--line);padding-bottom:18px;font-size:10px;letter-spacing:2px;color:var(--muted)}
.hero{display:flex;align-items:end;justify-content:space-between;gap:30px;margin-top:28px}h1{font:500 42px/1.5 Georgia,"Songti SC","Noto Serif CJK SC",serif;margin:0 0 10px}.hero p{font-size:13px;color:var(--muted);margin:0;max-width:850px}.switch{display:flex;gap:8px;flex-shrink:0;margin-bottom:4px}button,a{font:inherit}button{cursor:pointer}button,.action{border:1px solid #7c8a78;border-radius:4px;padding:8px 13px;background:white;color:var(--ink);font-size:12px;text-decoration:none}button[aria-pressed=true]{background:#dadfd1;border-color:var(--accent)}button:focus-visible,a:focus-visible{outline:3px solid var(--accent);outline-offset:4px}
main{padding-top:8px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:26px;align-items:start}.design{background:white;border:1px solid var(--line);border-top:3px solid var(--card-accent);border-radius:5px;overflow:hidden}.head{padding:20px 24px 16px}.tag{font-size:10px;letter-spacing:1px;color:var(--muted)}h2{font-size:23px;font-weight:500;margin:5px 0 7px}.number{font:italic 18px Georgia,serif;color:var(--card-accent);margin-right:12px}.head p{font-size:12px;color:var(--muted);margin:0;min-height:21px}
.preview{border:0;border-block:1px solid var(--line);border-radius:0;padding:0;display:block;width:100%;background:#f6f5f0;text-align:left;cursor:zoom-in}.preview img{display:block;width:100%;height:auto}.grid.mobile .preview{padding:20px}.grid.mobile .preview img{width:100%;max-width:390px;margin:auto}.caption{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:14px 24px;font-size:11px;color:var(--muted)}.actions{display:flex;gap:8px;flex-wrap:wrap}.open{color:var(--accent);text-decoration:none;font-size:12px;padding:7px 0;margin-left:4px}.resolution{font-variant-numeric:tabular-nums}.footnote{color:var(--muted);font-size:12px;margin:24px 0 0}footer{font-size:11px;color:var(--muted);padding-top:0}
dialog{padding:0;border:1px solid var(--line);border-radius:8px;background:var(--paper);color:var(--ink);width:96vw;max-width:1760px;height:94vh;max-height:none;margin:3vh auto;overflow:hidden}dialog::backdrop{background:#22282666}.viewer-shell{display:flex;flex-direction:column;height:100%}.viewer-bar{padding:15px 20px;display:flex;gap:16px;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line);background:white;flex-shrink:0}.viewer-title{font-size:16px;margin:0}.viewer-sub{font-size:11px;color:var(--muted)}.viewer-actions{display:flex;gap:7px;align-items:center;flex-wrap:wrap}.viewer-scroll{overflow:auto;flex:1;padding:20px}.viewer-scroll img{display:block;width:100%;height:auto;margin:auto;max-width:var(--image-width)}.viewer-scroll.original img{width:var(--image-width);max-width:none;margin:0}.viewer-count{font-size:11px;color:var(--muted);min-width:32px;text-align:center}
@media(max-width:800px){header,main,footer{padding:20px}.hero{display:block}h1{font-size:31px}.switch{margin-top:18px}.grid{grid-template-columns:1fr;gap:20px}.head{padding:17px 18px 13px}.head h2{font-size:21px}.caption{padding:12px 18px}.masthead{font-size:8px;letter-spacing:1px}.viewer-bar{align-items:start;flex-direction:column;gap:8px;padding:13px}.viewer-scroll{padding:10px}.viewer-actions button,.viewer-actions a{font-size:11px;padding:7px 10px}.grid.mobile .preview{padding:12px}}
@media print{.switch,.actions,dialog,footer{display:none}.grid{grid-template-columns:1fr 1fr}.design{break-inside:avoid}header,main{padding:15px}}
</style></head><body><header><div class="masthead"><span>STA313 / DESIGN COLLECTION</span><span>01—08 · HIGH RESOLUTION</span></div><div class="hero"><div><h1>八套呈现，放大看细节。</h1><p>01—04 为原来的四套页面，05—08 为新增的四套配色。原深紫色工作台已换浅色，其余页面保留原设计。</p><p>点击任意截图放大查看，或下载独立原图。桌面图宽 2880 像素，手机图宽 780 像素。</p></div><div class="switch" role="group" aria-label="截图尺寸"><button id="desktop" aria-pressed="true">桌面</button><button id="mobile" aria-pressed="false">手机</button></div></div></header><main><div id="designs" class="grid"></div><p class="footnote">02 与 05 使用同一套暖白鼠尾草配色：02 保留在原页面组，05 保留在新增配色组，方便分别比较布局与颜色。</p></main><footer>共享 90 所虚构学校数据。Shiny / Streamlit 的实际交互需要本地服务；原生与 React 也提供可离线打开的独立 HTML。保持启动终端开启，结束时按 Control+C。</footer>
<dialog id="viewer" aria-labelledby="viewer-title"><div class="viewer-shell"><div class="viewer-bar"><div><h2 class="viewer-title" id="viewer-title"></h2><div class="viewer-sub" id="viewer-sub"></div></div><div class="viewer-actions"><button id="previous" aria-label="上一套">←</button><span class="viewer-count" id="viewer-count"></span><button id="next" aria-label="下一套">→</button><button id="zoom" aria-pressed="false">原图尺寸</button><a class="action" id="download">下载原图</a><button id="close">关闭</button></div></div><div class="viewer-scroll" id="viewer-scroll"><img id="viewer-image" alt=""></div></div></dialog>
<script>
const DESIGNS=__DESIGNS__;
const $=selector=>document.querySelector(selector);
let mode='desktop',selected=0,original=false,opener=null;
const inside=location.pathname.includes('/deliverables/');
function liveLink(item){
 if(location.protocol==='file:')return item.standalone?(inside?'':'deliverables/')+item.standalone:item.route;
 return item.route.startsWith('http:')?item.route:(inside?'../':'')+item.route;
}
function render(){
 $('#designs').className='grid '+mode;
 $('#designs').innerHTML=DESIGNS.map((item,i)=>{const picture=item[mode];return `<article class="design" data-id="${item.id}" style="--card-accent:${item.accent}"><div class="head"><div class="tag">${item.tag}</div><h2><span class="number">${item.number}</span>${item.title}</h2><p>${item.note}</p></div><button class="preview" data-open="${i}" aria-label="放大 ${item.number} ${item.title}"><img src="${picture.src}" width="${picture.width}" height="${picture.height}" alt="${item.title} · ${mode==='desktop'?'桌面':'手机'}完整截图"></button><div class="caption"><span class="resolution">${picture.width} × ${picture.height} px · ${mode==='desktop'?'桌面':'手机'}</span><div class="actions"><button data-open="${i}">放大查看</button><a class="action" href="${picture.src}" download="${picture.filename}">下载原图</a><a class="open" href="${liveLink(item)}" target="_blank" rel="noopener">打开交互页 ↗</a></div></div></article>`}).join('');
 document.querySelectorAll('[data-open]').forEach(button=>button.onclick=()=>{selected=Number(button.dataset.open);opener=button;original=false;renderViewer();$('#viewer').showModal();$('#close').focus()});
 for(const name of ['desktop','mobile'])$('#'+name).setAttribute('aria-pressed',String(mode===name));
}
function renderViewer(){
 const item=DESIGNS[selected],picture=item[mode];
 $('#viewer-title').textContent=item.number+' · '+item.title;
 $('#viewer-sub').textContent=picture.width+' × '+picture.height+' px · '+(mode==='desktop'?'桌面':'手机');
 $('#viewer-count').textContent=(selected+1)+' / '+DESIGNS.length;
 $('#viewer-image').src=picture.src;$('#viewer-image').alt=item.title+'完整截图';$('#viewer-image').style.setProperty('--image-width',picture.width+'px');
 $('#viewer-scroll').classList.toggle('original',original);$('#viewer-scroll').scrollTo(0,0);
 $('#zoom').textContent=original?'适应宽度':'原图尺寸';$('#zoom').setAttribute('aria-pressed',String(original));
 $('#download').href=picture.src;$('#download').download=picture.filename;
}
function step(delta){selected=(selected+delta+DESIGNS.length)%DESIGNS.length;renderViewer()}
$('#previous').onclick=()=>step(-1);$('#next').onclick=()=>step(1);$('#zoom').onclick=()=>{original=!original;renderViewer()};$('#close').onclick=()=>$('#viewer').close();
$('#viewer').addEventListener('close',()=>opener?.focus());
$('#viewer').addEventListener('keydown',event=>{if(event.key==='ArrowRight'){event.preventDefault();step(1)}else if(event.key==='ArrowLeft'){event.preventDefault();step(-1)}});
for(const name of ['desktop','mobile'])$('#'+name).onclick=()=>{mode=name;render()};
render();
</script></body></html>'''


if __name__ == '__main__':
    items = entries()
    OUT.mkdir(exist_ok=True)
    html = TEMPLATE.replace('__DESIGNS__', json.dumps(items, ensure_ascii=False))
    (ROOT / 'index.html').write_text(html)
    (OUT / '八套设计高清对比.html').write_text(html)
    local_items = copy.deepcopy(items)
    for item in local_items:
        for mode in ('desktop', 'mobile'):
            suffix = '-mobile' if mode == 'mobile' else ''
            item[mode]['src'] = f"screenshots/{item['id']}{suffix}.png"
    (ROOT / 'local.html').write_text(TEMPLATE.replace('__DESIGNS__', json.dumps(local_items, ensure_ascii=False)))
    print('Built eight-entry HD gallery, self-contained copy, and local entry.')
