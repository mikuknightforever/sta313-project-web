"use strict";

// One painted valley and one tree skeleton align the four panes during the reveal.
function makeSeasonWindowArt(renderer) {
  const size = 768, extent = 512, pane = extent / 2;
  function surface() {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d", {alpha: false});
    ctx.scale(size / extent, size / extent);
    return ctx;
  }
  const dusk = surface(), seasons = surface(), display = surface();

  function shape(ctx, color, path) {
    ctx.fillStyle = color;
    ctx.fill(typeof path === "string" ? new Path2D(path) : path);
  }
  function stroke(ctx, color, width, path) {
    ctx.lineWidth = width; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = color;
    ctx.stroke(new Path2D(path));
  }
  function ellipse(ctx, x, y, rx, ry, color, angle = 0) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x,y,rx,ry,angle,0,Math.PI*2); ctx.fill();
  }
  function wash(ctx, top, horizon) {
    const gradient = ctx.createLinearGradient(0,0,80,extent*.78);
    gradient.addColorStop(0,top); gradient.addColorStop(1,horizon);
    return gradient;
  }
  const palettes = [
    // Sky, horizon, cloud shadow, cloud rim, distant hills, middle hills, ground, near grass, bark, light.
    ["#a89eb7","#efc9ba","#c5acbc","#edd5c8","#aba3b7","#9998aa","#a5aba3","#7b9186","#75616a","#b08a83"],
    ["#83aab2","#d8d7b8","#a9bfc0","#e6e1c9","#8caab1","#789da1","#a8b99c","#739388","#5f726c","#99a68d"],
    ["#b0a5b2","#ecc9ac","#bcacb2","#e8d2b8","#a79da8","#a09c94","#c3ad85","#928c72","#796359","#b59572"],
    ["#a5b3c5","#d9d6d7","#b6bdcd","#dedddc","#a8b6c1","#93a6b4","#d8dedc","#afbfc8","#676878","#a2a2ac"],
    ["#7988a6","#ddbaa7","#a99dac","#ddc1b4","#9597aa","#818e9b","#94a199","#71887f","#58666a","#84918a"],
  ];
  function world(ctx, p, winter) {
    ctx.fillStyle = wash(ctx,p[0],p[1]); ctx.fillRect(0,0,extent,extent);
    shape(ctx,p[2],"M-10 101 Q22 96 45 87 Q57 81 78 84 Q94 70 110 77 Q128 59 143 67 Q159 64 166 77 Q187 74 199 89 Q225 87 255 99 Q220 103 177 99 Q141 107 101 101 Q55 110 -10 105Z");
    shape(ctx,p[3],"M69 90 Q85 76 103 82 Q118 65 140 70 Q157 65 165 79 Q184 77 196 90 Q178 82 165 85 Q150 77 136 81 Q117 75 109 87 Q88 84 69 90Z M293 113 Q330 105 350 108 Q363 100 381 105 Q410 96 433 102 Q454 102 483 111 Q424 110 391 113 Q351 116 293 113Z");
    shape(ctx,p[4],"M0 339 L0 293 L34 274 Q56 264 80 246 L105 255 L138 238 L156 245 L183 228 L207 238 L224 236 L253 216 L264 219 L291 198 L308 205 L318 201 L340 215 L365 220 L390 237 L412 233 L442 214 L464 219 L489 201 L512 193 L512 512 L0 512Z");
    shape(ctx,p[5],"M0 301 Q40 294 84 278 Q109 267 139 254 L157 256 Q190 279 232 291 Q266 282 295 272 Q337 247 360 251 Q395 252 426 240 Q475 224 512 213 L512 512 H0Z");
    shape(ctx,p[6],"M0 350 Q48 326 97 335 Q156 345 197 350 Q248 360 310 336 Q383 306 439 310 Q483 312 512 291 L512 512 H0Z");
    shape(ctx,winter ? "#c3cfd5" : "#c9baa1","M345 334 Q289 347 249 364 Q226 374 256 371 Q292 365 305 372 Q319 384 263 406 Q213 428 176 460 L144 472 Q176 429 240 403 Q280 387 284 380 Q285 375 257 378 Q233 382 222 377 Q214 367 252 356 Q299 341 345 334Z");
    shape(ctx,p[7],"M0 393 Q50 374 95 394 Q169 425 212 423 Q154 443 116 474 Q69 494 0 503Z M270 512 Q315 459 361 431 Q399 412 439 409 Q476 408 512 387 L512 512Z");
    if(winter) {
      shape(ctx,"#dce1df","M267 465 Q324 439 372 445 Q437 451 512 417 L512 512 L256 512Z");
      shape(ctx,"#c6cfd5","M350 496 Q415 474 468 483 Q491 486 512 476 L512 512 H311Z");
    }
  }

  // Interpolating through the knots keeps the limbs underneath their shoots.
  function cubic(a,b,c,d,t) {
    return .5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);
  }
  function sample(knots, fraction) {
    const f = Math.max(0,Math.min(1,fraction))*(knots.length-1);
    const i = Math.min(knots.length-2,Math.floor(f)), t=f-i;
    const a=knots[Math.max(0,i-1)], b=knots[i], c=knots[i+1], d=knots[Math.min(knots.length-1,i+2)];
    return b.map((v,k)=>cubic(a[k],v,c[k],d[k],t));
  }
  function branch(ctx, knots, color) {
    const left=[],right=[];
    const count=6*(knots.length-1);
    for(let i=0;i<=count;i++) {
      const p=sample(knots,i/count), prev=sample(knots,(i-.06)/count), next=sample(knots,(i+.06)/count);
      const dx=next[0]-prev[0],dy=next[1]-prev[1], scale=p[2]/(2*(Math.hypot(dx,dy)||1));
      left.push([p[0]+dy*scale,p[1]-dx*scale]); right.push([p[0]-dy*scale,p[1]+dx*scale]);
    }
    ctx.beginPath(); ctx.moveTo(...left[0]);
    for(const point of left)ctx.lineTo(...point);
    for(const point of right.reverse())ctx.lineTo(...point);
    ctx.closePath(); ctx.fillStyle=color;ctx.fill();
  }
  const trunk=[[246,543,37],[252,472,30],[246,405,25],[258,346,20],[244,281,16],[260,216,12],[289,164,7],[290,109,4],[324,56,1],[330,30,.25]];
  const limbs=[
    [[246,306,16],[220,244,12],[179,206,8],[150,160,6],[97,137,3.3],[71,100,.4]],
    [[180,206,8],[132,200,5],[93,177,3.3],[53,177,1.6],[21,153,.4]],
    [[150,161,6],[147,124,4.6],[115,87,3.5],[90,65,2.1],[80,27,.4]],
    [[114,87,3.5],[143,67,2],[161,34,.4]],
    [[221,246,9],[209,208,6],[222,161,4],[202,113,3],[211,71,.5]],
    [[256,227,12],[301,211,9],[339,178,7],[391,155,4.8],[441,119,2.8],[494,109,.4]],
    [[337,180,6.5],[330,145,4.8],[353,95,2.9],[348,52,.4]],
    [[391,155,4.6],[403,111,3.2],[437,65,1.6],[450,34,.35]],
    [[299,211,7],[354,223,5],[410,208,3.2],[466,209,.4]],
    [[247,410,19],[203,380,12],[158,366,8],[113,337,5],[57,317,3.1],[13,276,.4]],
    [[157,365,8],[158,333,5.6],[126,303,3],[121,272,.4]],
    [[204,380,10],[202,350,6],[223,313,3.1],[213,276,.4]],
    [[249,455,17],[208,439,10],[154,444,7],[104,423,4.3],[50,422,2.5],[12,398,.4]],
    [[105,424,4.5],[87,392,3],[50,373,1.5],[21,343,.4]],
    [[154,444,6],[123,467,4],[83,479,2],[45,475,.4]],
    [[249,431,17],[297,408,10],[336,372,6.6],[381,359,4.8],[426,335,3],[485,322,.35]],
    [[335,372,6],[332,340,3.8],[355,305,2.3],[352,280,.35]],
    [[383,357,4],[398,323,2.3],[398,296,.35]],
    [[426,335,3],[448,304,1.7],[480,287,.35]],
    [[252,481,17],[291,466,9],[322,439,5.5],[360,430,2.9],[380,405,.4]],
  ];
  // The parasol tree has large, smooth-edged, palmately lobed leaves.
  const greenLeaf=new Path2D("M0 0 Q-5 4 -11 1 Q-17 -1 -20 -7 Q-12 -6 -10 -9 Q-16 -10 -18 -23 Q-11 -21 -4 -16 Q-7 -26 2 -37 Q5 -26 8 -16 Q14 -23 23 -24 Q22 -14 15 -9 Q20 -8 24 -10 Q21 -1 13 0 Q6 -2 1 2Z");
  const mapleLeaf=new Path2D("M0 2 L-9 3 -7 0 -18 -4 -14 -6 -21 -13 -11 -11 -13 -18 -5 -12 -7 -26 -3 -24 1 -36 6 -23 8 -27 8 -13 17 -23 15 -15 23 -16 19 -9 25 -9 14 -2 17 0 5 2 1 8Z");
  function leaf(ctx,x,y,angle,scale,index,tint) {
    const summer=index===1, autumn=index===2;
    const colors=summer?["#527f73","#69957c","#91ab80","#779d76"]:autumn?["#a3514d","#c0674e","#ce8555","#ae5d4c"]:["#637d77","#607775","#788d7c","#72867c"];
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(scale,scale);
    shape(ctx,colors[tint%colors.length],autumn?mapleLeaf:greenLeaf);
    stroke(ctx,autumn?"#e5ad79":summer?"#a8bd93":"#91a18a",.85,autumn?"M1 6 Q2 -11 2 -29 M1 -4 L-12 -12 M2 -5 L16 -15":"M0 2 Q2 -12 2 -30 M1 -3 Q-8 -9 -15 -19 M1 -3 Q12 -10 20 -20");
    ctx.restore();
  }
  const cherryPetal=new Path2D("M0 0 C-3 -2 -6 -8 -4 -11 Q-3 -13 -1 -10 Q1 -14 3 -12 C7 -9 3 -2 0 0Z");
  function cherry(ctx,x,y,s,angle,tint) {
    const pink=["#e9abb8","#efbdc4","#f0c9c9","#e6a9b8"];
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(s,s);
    for(let i=0;i<5;i++){ctx.rotate(Math.PI*2/5);shape(ctx,pink[(tint+i)%4],cherryPetal);}
    ellipse(ctx,0,0,2.4,2.4,"#b87980");
    for (const [dx,dy] of [[-2,-2],[2,-2],[1,2],[-2,1]])ellipse(ctx,dx,dy,.85,.85,"#ecd89c");
    ctx.restore();
  }
  function noise(seed) {
    const v=Math.sin(seed*127.1+311.7)*43758.5453123; return v-Math.floor(v);
  }
  function paintTree(ctx, season) {
    const p=palettes[season];
    branch(ctx,trunk,p[8]);
    for(const limb of limbs)branch(ctx,limb,p[8]);
    stroke(ctx,p[9],2.7,"M250 505 Q258 472 252 443 M253 382 Q262 351 257 327 M242 302 Q245 275 250 260 M173 204 Q149 187 146 166 M326 189 Q358 167 374 162 M160 368 Q126 346 108 337");
    limbs.forEach((limb,id)=>{
      const direction=limb[limb.length-1][0]>limb[0][0]?1:-1;
      for(let i=0;i<6;i++) {
        const seed=id*31+i*3+1;
        const [x,y]=sample(limb,.33+.65*i/5);
        // Fan side shoots from actual junctions on the same bough.
        const side=i%2 ? 1 : -1;
        const reach=(12+noise(seed)*18)*direction;
        const dy=side*(12+noise(seed+1)*15)-8;
        const ex=x+reach,ey=y+dy;
        branch(ctx,[[x,y,1.8],[x+reach*.55,y+dy*.24,1.1],[ex,ey,.18]],p[8]);
        if(season===3)continue;
        const tint=Math.floor(noise(seed+11)*4),angle=noise(seed+2)*2.1-.5;
        if(season===0) {
          cherry(ctx,ex,ey,.39+.29*noise(seed+14),angle,tint);
          cherry(ctx,ex-reach*.36,ey-dy*.42,.32+.21*noise(seed+16),angle+1,tint+1);
          ellipse(ctx,ex+3,ey+6,2.2,3.4,"#ca8e9e",-.4);
        } else {
          const scale=(.55+.41*noise(seed+8))*(season===4?.78:1);
          leaf(ctx,ex,ey,angle*direction,scale,season,tint);
          if(i%2===0)leaf(ctx,ex-reach*.42,ey-dy*.54,2.7-angle,scale*.69,season,tint+2);
        }
      }
    });
    if(season===3){
      // Snow rests on the upward faces, with breaks where small twigs cross.
      stroke(ctx,"#d8dce1",3.1,"M274 416 Q299 405 311 391 M339 369 Q358 364 380 356 Q400 345 415 339 M428 333 Q458 326 478 322 M297 459 Q315 441 328 435 M333 336 Q339 322 348 311");
    }
  }
  function snowBear(ctx) {
    // A rounded snow figure is recognisable by its ears, short paws, muzzle and scarf.
    ellipse(ctx,416,480,53,8,"#acb9c5",-.04);
    const cool="#bcc9d4",snow="#e7e4df",shade="#cbd4da";
    ellipse(ctx,412,451,31,34,cool);ellipse(ctx,416,447,27,32,snow);
    ellipse(ctx,382,448,10,16,shade,.36);ellipse(ctx,443,445,10,14,snow,-.56);
    ellipse(ctx,393,408,10,11,cool,-.44);ellipse(ctx,393,406,7.6,8.7,snow,-.44);
    ellipse(ctx,427,405,10,11,shade,.35);ellipse(ctx,429,404,7,8,snow,.35);
    ellipse(ctx,410,419,23,21,cool,-.06);ellipse(ctx,412,417,21,19,snow,-.06);
    ellipse(ctx,410,425,10,6.5,"#d6d8d7");
    ellipse(ctx,402,417,2.1,2.3,"#4c535b");ellipse(ctx,417,416,2.1,2.3,"#4c535b");
    ellipse(ctx,409,422,3.7,2.4,"#555560",-.08);
    stroke(ctx,"#83818a",1.2,"M409 424 Q409 428 405 428 M409 425 Q412 429 414 426");
    shape(ctx,"#a86465","M390 432 Q409 439 430 429 L432 436 Q409 446 389 439Z M423 436 Q431 446 438 455 L431 460 Q424 451 419 438Z");
    stroke(ctx,"#ce8f84",2,"M392 435 Q406 440 426 434 M425 444 L430 442");
    ellipse(ctx,395,478,13,7,shade,-.12);ellipse(ctx,428,475,13,7,snow,-.16);
  }
  function clipPane(ctx,index) {
    ctx.beginPath();ctx.rect((index%2)*pane,Math.floor(index/2)*pane,pane,pane);ctx.clip();
  }
  world(dusk,palettes[4],false);paintTree(dusk,4);
  for(let i=0;i<4;i++) {
    seasons.save();clipPane(seasons,i);world(seasons,palettes[i],i===3);paintTree(seasons,i);
    if(i===3)snowBear(seasons);
    seasons.restore();
  }

  function driftingPetal(ctx,x,y,t,s) {
    ctx.save();ctx.translate(x,y);ctx.rotate(.5+.65*Math.sin(t));
    ctx.scale(.38+.23*Math.sin(t*.8)**2,s);shape(ctx,"#efb7c3",cherryPetal);ctx.restore();
  }
  function atmosphere(ctx,time,active) {
    if(active===1) {
      ctx.save();clipPane(ctx,1);
      for (const [x,y,angle] of [[440,119,.8],[353,95,-.4],[411,208,.1]]) {
        leaf(ctx,x,y,angle+Math.sin(time*1.4+y)*.15,.7,1,1);
      }
      ctx.restore();
    }
    for(const season of [0,2,3]) {
      ctx.save();clipPane(ctx,season);
      const left=(season%2)*pane, top=Math.floor(season/2)*pane;
      const count=(season===3?9:season===0?11:3)+(active===season?3:0);
      for(let i=0;i<count;i++) {
        const seed=31*i+season*5, phase=time*(.42+.24*noise(seed))+i;
        const y=top+(noise(seed+4)*pane+time*(6+8*noise(seed+8)))%(pane+14)-5;
        const x=left+noise(seed+6)*pane+Math.sin(phase)*6;
        if(season===0)driftingPetal(ctx,x,y,phase,.42+.2*noise(seed+3));
        if(season===2)leaf(ctx,x,y,phase*.65,.19+.12*noise(seed+7),2,i);
        if(season===3)ellipse(ctx,x,y,1.0+noise(seed)*.9,1.1+noise(seed)*.8,"rgba(235,237,235,.78)");
      }
      ctx.restore();
    }
  }
  display.drawImage(dusk.canvas,0,0,extent,extent);
  const texture=renderer.texture(display.canvas);
  let lastLevel=0,lastFrame=0,lastActive=-1;
  function update(reveal,timeSeconds,reduced=false,activeSeason=-1) {
    const level=Math.round(Math.max(0,Math.min(1,reveal))*120);
    const frame=level && !reduced ? Math.floor(Math.max(0,timeSeconds)*12) : 0;
    if(level===lastLevel && frame===lastFrame && activeSeason===lastActive)return;
    lastLevel=level;lastFrame=frame;lastActive=activeSeason;
    display.globalAlpha=1;
    if(level<120)display.drawImage(dusk.canvas,0,0,extent,extent);
    if(level>0) {
      display.globalAlpha=level/120;
      display.drawImage(seasons.canvas,0,0,extent,extent);
      atmosphere(display,frame/12,activeSeason);
      display.globalAlpha=1;
    }
    texture.needsUpdate=true;
  }
  return {texture,update};
}
