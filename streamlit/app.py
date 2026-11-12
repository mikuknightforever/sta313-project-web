from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import streamlit as st
from analysis import filtered, figure, mean_label
ROOT = Path(__file__).resolve().parents[1]
st.set_page_config(page_title='教育机会 · 数据简报', page_icon='◈', layout='wide')
st.markdown('<style>'+ (ROOT/'assets/streamlit.css').read_text()+'</style>', unsafe_allow_html=True)

def reset():
    st.session_state.region = '全部'
    st.session_state.minimum = 0

st.markdown('''<div class="brief-masthead"><span>THE SCHOOL BRIEF</span><span>STA313 / 04 · STREAMLIT</span></div><div class="brief-hero"><div class="brief-issue">DATA BRIEF<br><strong>No. 01</strong></div><div><span class="brief-kicker">教育 · 社区 · 机会</span><h1>一个问题，从数据开始。</h1><p>家庭收入与学校阅读表现有怎样的关系？<br>用一份简报，把样本、分布与解释连在一起。</p></div><div class="brief-badge">90<span>所虚构学校</span><small>合成数据 / DEMO</small></div></div>''', unsafe_allow_html=True)
st.markdown('<div class="section-label"><b>01</b> 定义这份简报的样本 <span>按区域与学生人数筛选</span></div>', unsafe_allow_html=True)
with st.container(border=True):
    a, b, c = st.columns([1.15,1.8,1], vertical_alignment='bottom')
    with a: region = st.selectbox('学校所在区域', ['全部','城市','郊区','乡镇'], key='region')
    with b: minimum = st.slider('最低学生人数', 0,1000,0,100,key='minimum')
    with c: st.button('重置筛选',on_click=reset,use_container_width=True)
data=filtered(region,minimum)
a,b,c=st.columns(3)
a.metric('当前学校',len(data));b.metric('平均阅读达标率',mean_label(data,'score','%'));c.metric('平均家庭收入中位数',mean_label(data,'income','k'))
st.caption('当前筛选结果 · 均值按学校等权计算 · 收入单位：千加元')
st.markdown('<div class="section-label"><b>02</b> 把关系画出来 <span>从总体分布，到学校明细</span></div>',unsafe_allow_html=True)
a,b,c=st.tabs(['收入与表现','区域比较','学校明细'])
with a:
    st.plotly_chart(figure(data),width='stretch',theme=None,config={'displayModeBar':False})
with b:
    st.plotly_chart(figure(data,'bar'),width='stretch',theme=None,config={'displayModeBar':False})
with c:
    st.dataframe(data.rename(columns={'school':'学校','region':'区域','income':'收入 / 千加元','score':'达标率 / %','students':'学生人数'}),hide_index=True,width='stretch')
with st.expander('读图笔记 / 如何理解这些差异？',expanded=True):
    st.markdown('**每个标记是一所学校，颜色与形状表示区域。** 合成数据预设了正向关联；同一收入水平的学校，阅读表现仍有差异。切换到区域比较时，柱高表示当前筛选样本中的学校等权均值。')
    st.caption('关联不等于因果。这份简报演示阅读数据的过程，不构成真实研究结论。')
st.markdown('<div class="brief-footer"><span>THE SCHOOL BRIEF / 教育机会简报</span><span>合成数据 · 不代表安省学校的真实情况</span></div>',unsafe_allow_html=True)
