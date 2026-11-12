from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from shiny import App, ui, render, reactive
from analysis import filtered, figure, mean_label
ROOT = Path(__file__).resolve().parents[1]

def metric(label, output, note, index):
    return ui.div(ui.div(ui.span(label), ui.span(index, class_='metric-index'), class_='metric-title'), ui.div(ui.output_text(output), class_='metric-number'), ui.p(note), class_='lab-metric')

app_ui = ui.page_fluid(
    ui.tags.head(ui.tags.script(src='assets/plotly.min.js'), ui.tags.link(rel='stylesheet', href='assets/shiny.css')),
    ui.tags.header(ui.div(ui.span('◎', class_='lab-symbol'), ui.span('OPPORTUNITY', class_='lab-name'), ui.span('研究实验室 / LAB', class_='lab-sub')), ui.span('03 / SHINY FOR PYTHON', class_='lab-route'), class_='lab-header'),
    ui.div(
        ui.div(ui.p('QUESTION 01 / EDUCATION & COMMUNITY', class_='kicker'), ui.h1('定义样本，观察关系。'), ui.p('从筛选到比较，让每一步探索都有清晰的依据。', class_='lab-lead'), class_='lab-heading'),
        ui.layout_sidebar(
            ui.sidebar(
                ui.div(ui.span('01', class_='step-number'), ui.h2('选择研究样本'), class_='side-heading'),
                ui.p('输入条件，右侧结果同步更新。', class_='side-note'),
                ui.input_select('region', '学校所在区域', ['全部', '城市', '郊区', '乡镇']),
                ui.input_slider('minimum', '最低学生人数', min=0, max=1000, value=0, step=100),
                ui.input_action_button('reset', '重置筛选', class_='btn-primary'),
                ui.div(ui.p('SAMPLE / 样本说明', class_='kicker'), ui.h3('90 所学校\n3 类社区'), ui.p('每行是一所虚构学校。收入单位为千加元，所有均值按学校等权计算。'), class_='sample-note'),
                width=265, bg='#e8eddf', open='always',
            ),
            ui.div(metric('当前学校', 'count', '筛选后样本数', 'N'), metric('平均阅读达标率', 'score', '学校等权平均', '%'), metric('平均家庭收入中位数', 'income', '千加元 · 学校等权平均', '$'), class_='lab-metrics'),
            ui.div(ui.div(ui.span('02', class_='step-number'), ui.h2('观察与比较'), class_='output-heading'), ui.navset_card_tab(
                ui.nav_panel('收入与表现', ui.p('每个标记代表一所学校；颜色与形状共同表示区域。', class_='chart-intro'), ui.output_ui('scatter')),
                ui.nav_panel('区域比较', ui.p('比较当前样本的学校平均阅读达标率；柱形图从 0 开始。', class_='chart-intro'), ui.output_ui('bar')),
                ui.nav_panel('学校明细', ui.output_data_frame('table')),
            ), class_='lab-results'),
            ui.div(ui.span('03', class_='step-number'), ui.div(ui.h3('回到问题本身'), ui.p('相近的收入并不意味着相同的表现。先比较分布，再解释差异；合成数据中的正向关联由生成方式预设，不能作为因果证据。')), class_='lab-interpret'),
            fillable=False,
        ),
        ui.tags.footer(ui.span('OPPORTUNITY LAB / STA313'), ui.span('合成数据 · 不代表安省学校的真实情况')), class_='lab-wrap'),
    title='教育机会 · Shiny 研究实验室',
)

def server(input, output, session):
    @reactive.calc
    def data(): return filtered(input.region(), input.minimum())
    @reactive.effect
    @reactive.event(input.reset)
    def reset():
        ui.update_select('region', selected='全部')
        ui.update_slider('minimum', value=0)
    @render.text
    def count(): return str(len(data()))
    @render.text
    def score(): return mean_label(data(), 'score', '%')
    @render.text
    def income(): return mean_label(data(), 'income', 'k')
    @render.ui
    def scatter(): return ui.HTML(figure(data()).to_html(full_html=False, include_plotlyjs=False, config={'displayModeBar':False, 'responsive':True}))
    @render.ui
    def bar(): return ui.HTML(figure(data(), 'bar').to_html(full_html=False, include_plotlyjs=False, config={'displayModeBar':False, 'responsive':True}))
    @render.data_frame
    def table(): return render.DataGrid(data().rename(columns={'school':'学校','region':'区域','income':'收入 / 千加元','score':'达标率 / %','students':'学生人数'}), width='100%')

app = App(app_ui, server, static_assets={'/assets':ROOT/'assets'})
