
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import streamlit as st
from analysis import filtered, figure
st.set_page_config(page_title='教育机会 · Streamlit Demo',page_icon='◈',layout='wide')
st.markdown('<style>.block-container{padding-top:4.5rem;padding-bottom:1rem}h1{font-size:2.1rem!important}div[data-testid="stMetric"]{background:#f6f9f6;border:1px solid #dce7e2;border-radius:12px;padding:16px}div[data-testid="stMetricValue"]{font-size:30px}</style>',unsafe_allow_html=True)
def reset():st.session_state.region='全部';st.session_state.minimum=0
with st.sidebar:
 st.markdown('### ◈ SCHOOL\nOPPORTUNITY')
 st.caption('STA313 · 数据探索')
 st.divider()
 region=st.selectbox('学校所在区域',['全部','城市','郊区','乡镇'],key='region')
 minimum=st.slider('最低学生人数',0,1000,0,100,key='minimum')
 st.button('重置筛选',on_click=reset,use_container_width=True)
 st.divider()
 st.caption('演示用合成数据\n\n90 所虚构学校，不代表实际研究结论。')
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
