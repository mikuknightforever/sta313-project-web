"""Shared data and chart semantics for the two Python demo applications."""
from pathlib import Path
import json
import pandas as pd
import plotly.graph_objects as go
DATA = pd.DataFrame(json.loads((Path(__file__).parent / 'assets/data.json').read_text()))
COLORS = {'城市': '#28635b', '郊区': '#bc572c', '乡镇': '#766698'}
SYMBOLS = ['circle', 'diamond', 'square']

def filtered(region='全部', minimum=0):
    return DATA[(DATA.region.eq(region) if region != '全部' else DATA.index >= 0) & DATA.students.ge(minimum)]

def mean_label(df, column, suffix=''):
    return f'{df[column].mean():.1f}{suffix}' if len(df) else '—'

def figure(df, kind='scatter'):
    fig = go.Figure()
    for i, (region, color) in enumerate(COLORS.items()):
        d = df[df.region.eq(region)]
        if kind == 'bar':
            value = float(d.score.mean()) if len(d) else None
            fig.add_bar(x=[region], y=[value], text=[f'{value:.1f}%' if value is not None else ''], textposition='outside', cliponaxis=False, marker_color=color, name=region, hovertemplate='%{x}<br>平均达标率 %{y:.1f}%<extra></extra>')
        else:
            fig.add_scatter(x=d.income, y=d.score, text=d.school, customdata=d.students, name=region, mode='markers', marker=dict(color=color, symbol=SYMBOLS[i], size=11, opacity=.85, line=dict(color='white', width=1)), hovertemplate='%{text} · '+region+'<br>家庭收入 %{x} 千加元<br>阅读达标率 %{y}%<br>%{customdata} 位学生<extra></extra>')
    fig.update_layout(height=400, margin=dict(l=48, r=14, t=38, b=55), paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)', font=dict(family='Arial, PingFang SC, Noto Sans CJK SC, sans-serif', color='#52624e', size=11), legend=dict(orientation='h', x=0, y=1.15), showlegend=kind != 'bar', bargap=.52, hoverlabel=dict(bgcolor='#243127', font_color='white'))
    fig.update_xaxes(title=dict(text='学校所在区域' if kind == 'bar' else '家庭年收入中位数（千加元）', standoff=14), gridcolor='#e6e9e0', zeroline=False, nticks=5)
    if kind != 'bar':
        fig.update_xaxes(range=[30,155])
    fig.update_yaxes(title=dict(text='阅读达标率（%）', standoff=8), range=[0,100] if kind == 'bar' else [35,100], gridcolor='#e6e9e0', zeroline=kind == 'bar', zerolinecolor='#84937f')
    if df.empty:
        fig.add_annotation(text='没有符合条件的学校，请调整筛选。', xref='paper', yref='paper', x=.5, y=.5, showarrow=False)
    return fig
