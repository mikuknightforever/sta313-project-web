// Region identity is stable across views; shape reinforces color.
window.PALETTE={'城市':'#28635b','郊区':'#bc572c','乡镇':'#766698'};
window.filterRows=(region='全部',minimum=0)=>SCHOOL_DATA.filter(d=>(region==='全部'||d.region===region)&&d.students>=minimum);
window.metrics=rows=>({n:rows.length,mean:rows.length?(rows.reduce((a,b)=>a+b.score,0)/rows.length).toFixed(1):'—',income:rows.length?(rows.reduce((a,b)=>a+b.income,0)/rows.length).toFixed(1):'—'});
window.drawChart=function(id,rows,kind='scatter',options={}){
 const el=typeof id==='string'?document.getElementById(id):id;
 const groups=Object.keys(PALETTE),colors=Object.values(PALETTE),symbols=['circle','diamond','square'];
 const small=(el.clientWidth||750)<480;
 const traces=kind==='bar'?[{type:'bar',x:groups,y:groups.map(g=>{const r=rows.filter(x=>x.region===g);return r.length?r.reduce((a,b)=>a+b.score,0)/r.length:null}),marker:{color:colors},text:groups.map(g=>{const r=rows.filter(x=>x.region===g);return r.length?metrics(r).mean+'%':''}),textposition:'outside',cliponaxis:false,hovertemplate:'%{x}<br>平均达标率 %{y:.1f}%<extra></extra>'}]:groups.map((g,i)=>{const r=rows.filter(x=>x.region===g);return {type:'scatter',mode:'markers',name:g,x:r.map(x=>x.income),y:r.map(x=>x.score),text:r.map(x=>x.school),customdata:r.map(x=>x.students),marker:{color:colors[i],symbol:symbols[i],size:small?9:11,opacity:.85,line:{color:'#fff',width:1}},hovertemplate:'%{text} · '+g+'<br>家庭收入 %{x} 千加元<br>阅读达标率 %{y}%<br>%{customdata} 位学生<extra></extra>'}});
 const layout={height:options.height??(small?350:400),margin:{l:small?45:55,r:small?10:22,t:35,b:55},paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'rgba(0,0,0,0)',font:{family:'Arial, PingFang SC, Noto Sans CJK SC, sans-serif',color:options.text||'#625d57',size:11},xaxis:{title:{text:kind==='bar'?'学校所在区域':'家庭年收入中位数（千加元）',standoff:14},range:kind==='bar'?undefined:[30,155],gridcolor:options.grid||'#e8e1da',zeroline:false,nticks:small?4:6},yaxis:{title:{text:'阅读达标率（%）',standoff:8},range:kind==='bar'?[0,100]:[35,100],gridcolor:options.grid||'#e8e1da',zeroline:kind==='bar',zerolinecolor:'#a99e93'},legend:{orientation:'h',x:0,y:1.15,itemsizing:'constant'},bargap:.52,showlegend:kind!=='bar',hoverlabel:options.hoverlabel||{bgcolor:'#321d16',font:{color:'#fff6ed'}},annotations:rows.length?[]:[{text:'没有符合条件的学校，请调整筛选。',xref:'paper',yref:'paper',x:.5,y:.5,showarrow:false}]};
 el.style.height=layout.height+'px';
 return Plotly.react(el,traces,layout,{responsive:true,displayModeBar:false});
};
