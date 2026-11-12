
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
