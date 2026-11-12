
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
