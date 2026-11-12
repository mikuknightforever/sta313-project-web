from pathlib import Path
import json, random, shutil

ROOT = Path(__file__).parent
for folder in ['assets', 'native', 'react', 'shiny', 'streamlit/.streamlit', 'quarto', 'screenshots', 'deliverables']:
    (ROOT/folder).mkdir(parents=True, exist_ok=True)
rng = random.Random(313)
rows=[]
for i in range(90):
    region=['城市','郊区','乡镇'][i%3]
    income=round(rng.uniform(38,148),1)
    score=round(max(40,min(96,43+income*.29+rng.gauss(0,9))),1)
    rows.append(dict(school=f'School {i+1:02d}',region=region,income=income,score=score,students=rng.randint(180,1200)))
(ROOT/'assets/data.json').write_text(json.dumps(rows,ensure_ascii=False),encoding='utf-8')
(ROOT/'assets/data.js').write_text('window.SCHOOL_DATA='+json.dumps(rows,ensure_ascii=False)+';',encoding='utf-8')

common_css='''
:root{--ink:#172e32;--muted:#647879;--teal:#075b5e;--mint:#edf5f1;--line:#dce7e2;--paper:#f7f9f6;--orange:#d99152}*{box-sizing:border-box}body{margin:0;color:var(--ink);font-family:Arial,"Noto Sans CJK SC",sans-serif;background:var(--paper)}a{color:var(--teal)}button,select,input{font:inherit}button,select{cursor:pointer}button:focus-visible,a:focus-visible,select:focus-visible{outline:3px solid #d99152;outline-offset:3px}.eyebrow{font-size:11px;letter-spacing:2px;color:var(--teal);font-weight:700;text-transform:uppercase}.muted{color:var(--muted)}.pill{border:1px solid var(--line);padding:7px 12px;border-radius:30px;font-size:11px;background:white}.card{background:white;border:1px solid var(--line);border-radius:16px;padding:22px}.card h2{margin:0 0 6px;font-size:19px}.card p{font-size:13px;line-height:1.7}.controls label{display:block;font-size:13px;font-weight:600;margin-bottom:10px}.controls select{width:100%;border:1px solid var(--line);padding:11px 12px;border-radius:8px;background:white;color:var(--ink)}.controls input[type=range]{width:100%;accent-color:var(--teal)}.controls .field{margin:24px 0}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.stat-label{font-size:12px;color:var(--muted)}.stat-value{font-size:31px;font-weight:600;letter-spacing:-1px;margin:7px 0}.stat-note{font-size:11px;color:var(--muted)}.chart{width:100%;min-height:380px}.note{font-size:12px;line-height:1.8;color:var(--muted)}.legend-dot{display:inline-block;background:var(--teal);width:8px;height:8px;border-radius:50%;margin-right:7px}button.primary{background:var(--teal);color:white;border:0;border-radius:8px;padding:10px 16px}table{width:100%;border-collapse:collapse;font-size:13px}td,th{padding:13px 8px;border-bottom:1px solid var(--line);text-align:left}footer{font-size:11px;color:var(--muted);padding:20px 0;line-height:1.7}@media(max-width:760px){.stats{gap:8px}.card{padding:16px}.stat-value{font-size:25px}.chart{min-height:320px}}
'''
(ROOT/'assets/common.css').write_text(common_css,encoding='utf-8')

chart_js='''
window.PALETTE={'城市':'#075b5e','郊区':'#d99152','乡镇':'#778eb0'};
window.filterRows=(region='全部',minimum=0)=>SCHOOL_DATA.filter(d=>(region==='全部'||d.region===region)&&d.students>=minimum);
window.metrics=rows=>({n:rows.length,mean:rows.length?(rows.reduce((a,b)=>a+b.score,0)/rows.length).toFixed(1):'—',income:rows.length?(rows.reduce((a,b)=>a+b.income,0)/rows.length).toFixed(1):'—'});
window.drawChart=function(id,rows,kind='scatter'){
 const groups=Object.keys(PALETTE);
 let traces=kind==='bar'?[{type:'bar',x:groups,y:groups.map(g=>{let r=rows.filter(x=>x.region===g);return r.length?r.reduce((a,b)=>a+b.score,0)/r.length:null}),marker:{color:groups.map(g=>PALETTE[g])},hovertemplate:'%{x}<br>平均达标率 %{y:.1f}%<extra></extra>'}]:groups.map(g=>{let r=rows.filter(x=>x.region===g);return {type:'scatter',mode:'markers',name:g,x:r.map(x=>x.income),y:r.map(x=>x.score),text:r.map(x=>x.school),marker:{color:PALETTE[g],size:10,opacity:.78,line:{color:'#fff',width:1}},hovertemplate:'%{text}<br>家庭收入 %{x} 千元<br>阅读达标率 %{y}%<extra>'+g+'</extra>'}});
 let layout={height:385,margin:{l:54,r:18,t:20,b:55},paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'rgba(0,0,0,0)',font:{family:'Arial, Noto Sans CJK SC, sans-serif',color:'#647879',size:11},xaxis:{title:{text:kind==='bar'?'学校所在区域':'家庭年收入中位数（千加元）'},range:kind==='bar'?undefined:[30,155],gridcolor:'#edf1ed',zeroline:false},yaxis:{title:{text:'阅读达标率（%）'},range:[35,100],gridcolor:'#edf1ed',zeroline:false},legend:{orientation:'h',x:0,y:1.13},showlegend:kind!=='bar'};
 return Plotly.react(id,traces,layout,{responsive:true,displayModeBar:false});
};
'''
(ROOT/'assets/charts.js').write_text(chart_js,encoding='utf-8')

native='''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>教育机会 · 原生前端 Demo</title><link rel="stylesheet" href="../assets/common.css"><style>
.wrap{max-width:1180px;margin:auto;padding:0 34px}nav{display:flex;justify-content:space-between;align-items:center;height:76px;border-bottom:1px solid var(--line)}.brand{font-weight:700;font-size:15px;letter-spacing:1px}.navlinks{display:flex;gap:28px;font-size:12px}.hero{display:grid;grid-template-columns:1.5fr 1fr;gap:80px;padding:42px 0 30px;align-items:end}.hero h1{font-size:45px;line-height:1.3;letter-spacing:-2px;margin:13px 0}.hero p{font-size:14px;line-height:1.9;color:var(--muted)}.accent{color:var(--teal)}.explore{display:grid;grid-template-columns:255px 1fr;gap:22px;margin-top:20px}.sidebar{background:var(--mint)}.chart-top{display:flex;justify-content:space-between;align-items:center}.below{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:22px}.below h3{font-size:17px;margin-top:0}@media(max-width:760px){.wrap{padding:0 18px}.hero{grid-template-columns:1fr;gap:0;padding:25px 0}.hero h1{font-size:32px}.explore,.below{grid-template-columns:1fr}.navlinks{gap:12px}.sidebar .controls{display:grid;grid-template-columns:1fr 1fr;gap:20px}}
</style></head><body><div class="wrap"><nav><div class="brand">◈ SCHOOL / OPPORTUNITY</div><div class="navlinks"><a href="#explore">探索数据</a><a href="#findings">阅读发现</a><span class="pill">01 · 原生前端</span></div></nav><section class="hero"><div><div class="eyebrow">STA313 / VISUAL EXPLORATION</div><h1>成长的起点，<br>会影响<span class="accent">学习的机会</span>吗？</h1></div><p>从家庭收入与阅读表现的关系开始，观察不同社区的学校。选择一个区域，看看整体趋势和个体差异。<br><span class="note">演示用合成数据 · 90 所虚构学校</span></p></section><div class="stats"><div class="card"><div class="stat-label">当前学校</div><div class="stat-value" id="n">90</div><div class="stat-note">筛选后样本数</div></div><div class="card"><div class="stat-label">平均阅读达标率</div><div class="stat-value"><span id="mean"></span><small>%</small></div><div class="stat-note">学校等权平均</div></div><div class="card"><div class="stat-label">平均家庭收入中位数</div><div class="stat-value"><span id="income"></span><small>k</small></div><div class="stat-note">单位：千加元 · 学校等权平均</div></div></div><section class="explore" id="explore"><aside class="card sidebar"><div class="eyebrow">MAKE IT YOURS</div><h2 style="margin-top:14px">探索一个群体</h2><div class="controls"><div class="field"><label for="region">学校所在区域</label><select id="region"><option>全部</option><option>城市</option><option>郊区</option><option>乡镇</option></select></div><div class="field"><label for="minimum">最低学生人数 · <span id="min-label">0</span></label><input id="minimum" type="range" min="0" max="1000" step="100" value="0"></div></div><p class="note">悬停查看学校详情。图中的每一个点代表一所学校。</p><button class="primary" id="reset">重置筛选</button></aside><div class="card"><div class="chart-top"><div><h2>收入与阅读表现</h2><p class="muted">同一个趋势中，也存在不同的学校故事。</p></div><span class="pill">可交互图表</span></div><div id="chart" class="chart"></div></div></section><section class="below" id="findings"><div class="card"><div class="eyebrow">01 / OBSERVE</div><h3>关注趋势，也关注差异</h3><p>这组模拟数据预设了正向关联。即使收入相近，学校的阅读表现也可能不同。</p></div><div class="card"><div class="eyebrow">02 / INTERPRET</div><h3>关联不等于因果</h3><p>学校层面的聚合数据不能解释每个学生，也不能单独证明收入造成成绩差异。</p></div></section><footer>合成数据，仅用于比较网站路线；不代表安省学校的真实情况。</footer></div><script src="../assets/plotly.min.js"></script><script src="../assets/data.js"></script><script src="../assets/charts.js"></script><script>
function update(){const rows=filterRows(document.querySelector('#region').value,+document.querySelector('#minimum').value);const m=metrics(rows);for(const k of ['n','mean','income'])document.getElementById(k).textContent=m[k];document.getElementById('min-label').textContent=document.getElementById('minimum').value;drawChart('chart',rows)}document.getElementById('region').onchange=update;document.getElementById('minimum').oninput=update;document.getElementById('reset').onclick=()=>{document.getElementById('region').value='全部';document.getElementById('minimum').value=0;update()};update();</script></body></html>'''
(ROOT/'native/index.html').write_text(native,encoding='utf-8')

(ROOT/'react/index.html').write_text('''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>教育机会 · React Demo</title><link rel="stylesheet" href="../assets/common.css"><link rel="stylesheet" href="style.css"></head><body><div id="root"></div><script src="../assets/plotly.min.js"></script><script src="../assets/data.js"></script><script src="../assets/charts.js"></script><script src="app.js"></script></body></html>''',encoding='utf-8')
(ROOT/'react/style.css').write_text('''
.app{display:grid;grid-template-columns:218px 1fr;min-height:100vh}.rail{padding:32px 22px;background:#143f41;color:#dceae5;display:flex;flex-direction:column}.rail .brand{font-weight:700;font-size:17px;line-height:1.8}.rail a{color:#dceae5;text-decoration:none;display:block;padding:13px 15px;margin:7px 0;border-radius:9px;font-size:13px}.rail a.active{background:#2d5556}.rail p{font-size:12px;line-height:1.9;color:#a4c1bb}.rail-bottom{margin-top:auto}.main{padding:32px;max-width:1450px}.top{display:flex;justify-content:space-between;align-items:center}.top h1{margin:8px 0;font-size:30px}.top p{font-size:13px}.toolbar{display:flex;align-items:center;gap:14px;background:white;border:1px solid var(--line);border-radius:12px;padding:14px 18px;margin:23px 0}.toolbar label{font-size:12px}.toolbar select{padding:8px 12px;border:1px solid var(--line);border-radius:7px}.toolbar input{accent-color:var(--teal);max-width:130px}.toolbar button{margin-left:auto}.workspace{display:grid;grid-template-columns:minmax(0,1fr) 235px;gap:18px;margin-top:20px}.tabs{display:flex;gap:7px;margin-bottom:10px}.tabs button{background:transparent;border:0;padding:10px 16px;border-radius:8px;color:var(--muted)}.tabs button.active{background:var(--mint);color:var(--teal);font-weight:700}.insight{background:var(--mint)}.insight h3{font-size:19px;line-height:1.6}.insight p{font-size:13px;line-height:1.9}.big{font-size:44px;color:var(--teal);font-weight:600;margin:25px 0 10px}.mini{padding:16px 0;border-top:1px solid #cddfd7}.datawrap{max-height:385px;overflow:auto}@media(max-width:1000px){.app{grid-template-columns:1fr}.rail{display:none}.workspace{grid-template-columns:1fr}.toolbar{flex-wrap:wrap}.main{padding:18px}.top .pill{display:none}}
''',encoding='utf-8')
(ROOT/'react/app.jsx').write_text('''
import React,{useState,useEffect,useRef} from 'react';import{createRoot}from'react-dom/client';
function Stat({label,value,note}){return <div className="card"><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></div>}
function Chart({rows,kind}){const ref=useRef();useEffect(()=>{drawChart(ref.current,rows,kind)},[rows,kind]);return <div className="chart" ref={ref}/>}
function App(){const[region,setRegion]=useState('全部'),[minimum,setMinimum]=useState(0),[tab,setTab]=useState('scatter');const rows=filterRows(region,minimum),m=metrics(rows);return <div className="app"><aside className="rail"><div className="brand">◈ SCHOOL<br/>OPPORTUNITY</div><p>学校数据探索工作台</p><div style={{marginTop:32}}><a className="active" href="#overview">◫　数据概览</a><a href="#analysis" onClick={()=>setTab('bar')}>▥　区域比较</a><a href="#analysis" onClick={()=>setTab('table')}>▤　学校明细</a></div><div className="rail-bottom"><p>STA313 / ROUTE 02<br/>React + JavaScript</p><p>演示用合成数据<br/>90 所虚构学校</p></div></aside><main className="main" id="overview"><div className="top"><div><div className="eyebrow">EXPLORATION WORKSPACE</div><h1>教育机会，换个角度看。</h1><p className="muted">用同一组筛选条件，联动指标、图表和学校明细。</p></div><span className="pill">02 · React</span></div><div className="toolbar"><label htmlFor="region">学校区域</label><select id="region" value={region} onChange={e=>setRegion(e.target.value)}>{['全部','城市','郊区','乡镇'].map(x=><option key={x}>{x}</option>)}</select><label htmlFor="minimum">最低人数 {minimum}</label><input id="minimum" type="range" min="0" max="1000" step="100" value={minimum} onChange={e=>setMinimum(+e.target.value)}/><button className="primary" onClick={()=>{setRegion('全部');setMinimum(0)}}>重置筛选</button></div><div className="stats"><Stat label="当前学校" value={m.n} note="筛选后样本数"/><Stat label="平均阅读达标率" value={m.mean+'%'} note="学校等权平均"/><Stat label="平均家庭收入中位数" value={m.income+'k'} note="千加元 · 学校等权平均"/></div><div className="workspace" id="analysis"><section className="card"><div className="tabs" role="tablist" aria-label="图表视图">{[['scatter','收入与表现'],['bar','区域比较'],['table','学校明细']].map(([id,label])=><button key={id} role="tab" aria-selected={tab===id} className={tab===id?'active':''} onClick={()=>setTab(id)}>{label}</button>)}</div>{tab==='table'?<div className="datawrap"><table><thead><tr><th>学校</th><th>区域</th><th>收入 / 千元</th><th>达标率</th></tr></thead><tbody>{rows.map(d=><tr key={d.school}><td>{d.school}</td><td>{d.region}</td><td>{d.income}</td><td>{d.score}%</td></tr>)}</tbody></table></div>:<Chart rows={rows} kind={tab}/>}</section><aside className="card insight"><div className="eyebrow">CURRENT SELECTION</div><h3>{region==='全部'?'从整体到局部':region+'学校的切片'}</h3><div className="big">{m.n}<span style={{fontSize:15}}> 所学校</span></div><p>切换图表时保留筛选条件，比较相同群体的不同侧面。</p><div className="mini"><strong style={{fontSize:13}}>读图提示</strong><p>悬停查看单个学校；点击图例可临时隐藏一个区域。</p></div></aside></div><footer>合成数据，仅供演示。图中的正向关联是预设的，不构成真实研究结论或因果证据。</footer></main></div>};createRoot(document.getElementById('root')).render(<App/>);
''',encoding='utf-8')

(ROOT/'analysis.py').write_text('''
from pathlib import Path
import json
import pandas as pd
import plotly.graph_objects as go
DATA=pd.DataFrame(json.loads((Path(__file__).parent/'assets/data.json').read_text()))
COLORS={'城市':'#075b5e','郊区':'#d99152','乡镇':'#778eb0'}
def filtered(region='全部',minimum=0):
    return DATA[(DATA.region.eq(region) if region!='全部' else DATA.index>=0)&DATA.students.ge(minimum)]
def figure(df,kind='scatter'):
    fig=go.Figure()
    if kind=='bar':
        for region,color in COLORS.items():
            fig.add_bar(x=[region],y=[df[df.region.eq(region)].score.mean()],marker_color=color,name=region,hovertemplate='%{x}<br>平均达标率 %{y:.1f}%<extra></extra>')
    else:
        for region,color in COLORS.items():
            d=df[df.region.eq(region)]
            fig.add_scatter(x=d.income,y=d.score,text=d.school,name=region,mode='markers',marker=dict(color=color,size=10,opacity=.78,line=dict(color='white',width=1)),hovertemplate='%{text}<br>家庭收入 %{x} 千元<br>阅读达标率 %{y}%<extra>'+region+'</extra>')
    fig.update_layout(height=385,margin=dict(l=54,r=18,t=35,b=55),paper_bgcolor='rgba(0,0,0,0)',plot_bgcolor='rgba(0,0,0,0)',font=dict(family='Arial, Noto Sans CJK SC, sans-serif',color='#647879',size=11),legend=dict(orientation='h',x=0,y=1.13),showlegend=kind!='bar')
    fig.update_xaxes(title='学校所在区域' if kind=='bar' else '家庭年收入中位数（千加元）',gridcolor='#edf1ed',zeroline=False)
    if kind!='bar':fig.update_xaxes(range=[30,155])
    fig.update_yaxes(title='阅读达标率（%）',range=[35,100],gridcolor='#edf1ed',zeroline=False)
    return fig
''',encoding='utf-8')

(ROOT/'shiny/app.py').write_text('''
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from shiny import App, ui, render, reactive
from analysis import filtered, figure
ROOT=Path(__file__).resolve().parents[1]
app_ui=ui.page_sidebar(
 ui.sidebar(ui.p('FILTERS / 筛选',style='font-size:11px;letter-spacing:2px;color:#075b5e'),ui.h4('定义你的样本'),ui.input_select('region','学校所在区域',['全部','城市','郊区','乡镇']),ui.input_slider('minimum','最低学生人数',min=0,max=1000,value=0,step=100),ui.input_action_button('reset','重置筛选',class_='btn-primary'),ui.hr(),ui.p('悬停查看学校详情。筛选会同步更新指标、图表与数据表。',class_='text-muted'),width=260,bg='#edf5f1'),
 ui.tags.head(ui.tags.script(src='assets/plotly.min.js'),ui.tags.style('body{font-family:Arial,"Noto Sans CJK SC",sans-serif;color:#172e32;background:#f7f9f6}.bslib-page-title{font-weight:700;color:#075b5e}.card{border-color:#dce7e2;border-radius:13px}.btn-primary{background:#075b5e;border-color:#075b5e}.bslib-value-box{min-height:125px}.bslib-value-box .value-box-value{font-size:30px}.bslib-value-box .value-box-title{font-size:13px}.card-header{background:white}.form-control:focus,.form-select:focus{border-color:#075b5e}')),
 ui.div(ui.p('STA313 / INTERACTIVE ANALYSIS',style='font-size:11px;letter-spacing:2px;color:#075b5e'),ui.h2('同一组数据，实时探索。'),ui.p('选择区域或调整人数门槛，观察学校收入与阅读表现。',class_='text-muted')),
 ui.layout_columns(ui.value_box('当前学校',ui.output_text('count'),theme='bg-light'),ui.value_box('平均阅读达标率',ui.output_text('score'),theme='bg-light'),ui.value_box('平均家庭收入中位数',ui.output_text('income'),theme='bg-light'),col_widths=[4,4,4]),
 ui.navset_card_tab(ui.nav_panel('收入与表现',ui.output_ui('scatter')),ui.nav_panel('区域比较',ui.output_ui('bar')),ui.nav_panel('学校明细',ui.output_data_frame('table'))),
 ui.div(ui.h5('读图与解释'),ui.p('模拟数据预设了正向关联。比较不同区域时，也要留意样本量与点的分散程度。关联不等于因果。'),ui.p('合成数据 · 90 所虚构学校 · 金额单位：千加元 · 均值按学校等权计算。',class_='text-muted'),style='padding:20px 4px'),
 title='◈ 教育机会 / Shiny',fillable=False)
def server(input,output,session):
 @reactive.calc
 def data():return filtered(input.region(),input.minimum())
 @reactive.effect
 @reactive.event(input.reset)
 def reset():
  ui.update_select('region',selected='全部');ui.update_slider('minimum',value=0)
 @render.text
 def count():return str(len(data()))
 @render.text
 def score():return f'{data().score.mean():.1f}%'
 @render.text
 def income():return f'{data().income.mean():.1f}k'
 @render.ui
 def scatter():return ui.HTML(figure(data()).to_html(full_html=False,include_plotlyjs=False,config={'displayModeBar':False,'responsive':True}))
 @render.ui
 def bar():return ui.HTML(figure(data(),'bar').to_html(full_html=False,include_plotlyjs=False,config={'displayModeBar':False,'responsive':True}))
 @render.data_frame
 def table():return render.DataGrid(data().rename(columns={'school':'学校','region':'区域','income':'收入 / 千元','score':'达标率 / %','students':'学生人数'}),width='100%')
app=App(app_ui,server,static_assets={'/assets':ROOT/'assets'})
''',encoding='utf-8')

(ROOT/'streamlit/.streamlit/config.toml').write_text('''[theme]
primaryColor = "#075b5e"
backgroundColor = "#ffffff"
secondaryBackgroundColor = "#edf5f1"
textColor = "#172e32"
font = "sans serif"
[browser]
gatherUsageStats = false
''',encoding='utf-8')
(ROOT/'streamlit/app.py').write_text('''
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import streamlit as st
from analysis import filtered, figure
st.set_page_config(page_title='教育机会 · Streamlit Demo',page_icon='◈',layout='wide')
st.markdown('<style>.block-container{padding-top:4.5rem;padding-bottom:1rem}h1{font-size:2.1rem!important}div[data-testid="stMetric"]{background:#f6f9f6;border:1px solid #dce7e2;border-radius:12px;padding:16px}div[data-testid="stMetricValue"]{font-size:30px}</style>',unsafe_allow_html=True)
def reset():st.session_state.region='全部';st.session_state.minimum=0
with st.sidebar:
 st.markdown('### ◈ SCHOOL\\nOPPORTUNITY')
 st.caption('STA313 · 数据探索')
 st.divider()
 region=st.selectbox('学校所在区域',['全部','城市','郊区','乡镇'],key='region')
 minimum=st.slider('最低学生人数',0,1000,0,100,key='minimum')
 st.button('重置筛选',on_click=reset,use_container_width=True)
 st.divider()
 st.caption('演示用合成数据\\n\\n90 所虚构学校，不代表实际研究结论。')
st.caption('04 / STREAMLIT · PYTHON DATA APP')
st.title('教育机会，从数据开始探索。')
st.markdown('选择一个区域，观察家庭收入与阅读表现的关系。所有指标随筛选同步更新。')
data=filtered(region,minimum)
c1,c2,c3=st.columns(3)
c1.metric('当前学校',len(data));c2.metric('平均阅读达标率',f'{data.score.mean():.1f}%');c3.metric('平均家庭收入中位数',f'{data.income.mean():.1f}k')
st.write('')
a,b,c=st.tabs(['收入与表现','区域比较','学校明细'])
with a:st.plotly_chart(figure(data),width='stretch',config={'displayModeBar':False})
with b:st.plotly_chart(figure(data,'bar'),width='stretch',config={'displayModeBar':False})
with c:st.dataframe(data.rename(columns={'school':'学校','region':'区域','income':'收入 / 千元','score':'达标率 / %','students':'学生人数'}),hide_index=True,width='stretch')
with st.expander('如何解读这张图？',expanded=True):
 st.markdown('每个点是一所学校；颜色代表所在区域。合成数据预设了正向关联，但同一收入水平仍存在差异。**关联不等于因果。**')
st.caption('合成数据 · 金额单位：千加元 · 均值按学校等权计算。')
''',encoding='utf-8')

(ROOT/'quarto/_quarto.yml').write_text('''project:
  type: website
  output-dir: _site
website:
  search: false
  title: "◈ 教育机会"
  navbar:
    background: "#ffffff"
    left:
      - href: index.qmd
        text: 研究报告
      - href: "#explore"
        text: 交互探索
format:
  html:
    lang: zh
    theme: default
    toc: true
    toc-title: 本页内容
    css: styles.css
    embed-resources: true
''',encoding='utf-8')
(ROOT/'quarto/styles.css').write_text('''body{font-family:Arial,"Noto Sans CJK SC",sans-serif;color:#172e32;background:#fbfcfa}.navbar{border-bottom:1px solid #dce7e2}.navbar-brand{color:#075b5e;font-weight:700}h1.title{font-size:38px;line-height:1.4;color:#172e32}h2{font-size:24px;color:#075b5e}p{line-height:1.85}a{color:#075b5e}.quarto-title .quarto-categories .quarto-category{color:#075b5e;border-color:#dce7e2}.callout{border-radius:8px}#quarto-margin-sidebar{font-size:13px}.demo-controls{display:flex;gap:16px;flex-wrap:wrap;align-items:center;background:#edf5f1;border-radius:9px;padding:15px;font-size:13px}.demo-controls select{padding:6px;border:1px solid #bfd3ca;border-radius:6px}.demo-controls input{accent-color:#075b5e}.metric-strip{display:flex;justify-content:space-between;padding:18px 0;border-bottom:1px solid #dce7e2;font-size:14px}.metric-strip strong{color:#075b5e;font-size:22px}.chart{width:100%;min-height:385px}''',encoding='utf-8')
quarto='''---
title: "成长的起点，会影响学习的机会吗？"
subtitle: "家庭收入与学校阅读表现的一次可视化探索"
author: "STA313 · 网站路线演示"
---

## 研究问题

学校所在社区的家庭收入，与学生的阅读表现有什么关系？本页使用 **90 所虚构学校**的合成数据，演示如何将研究背景、交互图表和解释放在同一篇报告中。

::: {.callout-note title="先了解数据"}
每行代表一所学校，包含所在区域、家庭年收入中位数、阅读达标率与学生人数。数据仅用于网站演示，不代表安省学校的真实情况。
:::

## 交互探索 {#explore}

选择学校所在区域，或调整最低人数门槛。悬停在点上查看单所学校。

```{=html}
<div class="demo-controls"><label for="region">学校区域 <select id="region"><option>全部</option><option>城市</option><option>郊区</option><option>乡镇</option></select></label><label for="minimum">最低人数 <span id="min-label">0</span> <input id="minimum" type="range" min="0" max="1000" step="100" value="0"></label><button id="reset">重置</button></div>
<div class="metric-strip"><span>当前学校 <strong id="n"></strong></span><span>平均达标率 <strong id="mean"></strong>%</span><span>平均收入中位数 <strong id="income"></strong>k</span></div>
<div id="chart" class="chart"></div>
<script src="../assets/plotly.min.js"></script><script src="../assets/data.js"></script><script src="../assets/charts.js"></script><script>
function update(){let r=filterRows(document.getElementById('region').value,+document.getElementById('minimum').value),m=metrics(r);for(let k of ['n','mean','income'])document.getElementById(k).textContent=m[k];document.getElementById('min-label').textContent=document.getElementById('minimum').value;drawChart('chart',r)}document.getElementById('region').onchange=update;document.getElementById('minimum').oninput=update;document.getElementById('reset').onclick=()=>{document.getElementById('region').value='全部';document.getElementById('minimum').value=0;update()};update();
</script>
```

## 观察与解释

这组模拟数据预设了收入与阅读表现的正向关联，但收入相近的学校仍可能有不同表现。通过筛选，可以区分整体趋势与群体内部的变化。

**关联不等于因果。** 学校层面的聚合指标不能直接推断个体学生的经历，也不能排除其他因素。

## 方法与局限

- 数据采用固定随机种子生成，五个 demo 使用相同的 90 行数据。
- 均值按学校等权计算，不按学生人数加权。
- 图表使用 Plotly，筛选使用嵌入的 JavaScript；Quarto 负责报告、导航和排版。
'''
(ROOT/'quarto/index.qmd').write_text(quarto,encoding='utf-8')
print('Created five demo sources and shared synthetic dataset.')
