
window.PALETTE={'城市':'#075b5e','郊区':'#d99152','乡镇':'#778eb0'};
window.filterRows=(region='全部',minimum=0)=>SCHOOL_DATA.filter(d=>(region==='全部'||d.region===region)&&d.students>=minimum);
window.metrics=rows=>({n:rows.length,mean:rows.length?(rows.reduce((a,b)=>a+b.score,0)/rows.length).toFixed(1):'—',income:rows.length?(rows.reduce((a,b)=>a+b.income,0)/rows.length).toFixed(1):'—'});
window.drawChart=function(id,rows,kind='scatter'){
 const groups=Object.keys(PALETTE);
 let traces=kind==='bar'?[{type:'bar',x:groups,y:groups.map(g=>{let r=rows.filter(x=>x.region===g);return r.length?r.reduce((a,b)=>a+b.score,0)/r.length:null}),marker:{color:groups.map(g=>PALETTE[g])},hovertemplate:'%{x}<br>平均达标率 %{y:.1f}%<extra></extra>'}]:groups.map(g=>{let r=rows.filter(x=>x.region===g);return {type:'scatter',mode:'markers',name:g,x:r.map(x=>x.income),y:r.map(x=>x.score),text:r.map(x=>x.school),marker:{color:PALETTE[g],size:10,opacity:.78,line:{color:'#fff',width:1}},hovertemplate:'%{text}<br>家庭收入 %{x} 千元<br>阅读达标率 %{y}%<extra>'+g+'</extra>'}});
 let layout={height:385,margin:{l:54,r:18,t:20,b:55},paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'rgba(0,0,0,0)',font:{family:'Arial, Noto Sans CJK SC, sans-serif',color:'#647879',size:11},xaxis:{title:{text:kind==='bar'?'学校所在区域':'家庭年收入中位数（千加元）'},range:kind==='bar'?undefined:[30,155],gridcolor:'#edf1ed',zeroline:false},yaxis:{title:{text:'阅读达标率（%）'},range:[35,100],gridcolor:'#edf1ed',zeroline:false},legend:{orientation:'h',x:0,y:1.13},showlegend:kind!=='bar'};
 return Plotly.react(id,traces,layout,{responsive:true,displayModeBar:false});
};
