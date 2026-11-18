"use strict";

// Painted once at scene load. The two pictures share the room's warm/cool palette.
function makeRoomArt(renderer) {
  function panel(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas.getContext("2d");
  }
  function paint(ctx, color, path) {
    ctx.fillStyle = color;
    ctx.fill(new Path2D(path));
  }
  function line(ctx, color, width, path) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.stroke(new Path2D(path));
  }
  function disk(ctx, x, y, radius, color) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  // Directional sunlight touches the rightmost cloud towers and the mountain faces.
  const view = panel(512, 512);
  function wash(top, bottom, y1, y2) {
    const color = view.createLinearGradient(0, y1, 0, y2);
    color.addColorStop(0, top);
    color.addColorStop(1, bottom);
    return color;
  }
  const sky = view.createLinearGradient(0, 0, 0, 367);
  sky.addColorStop(0, "#79a6c1");
  sky.addColorStop(.50, "#bfd4df");
  sky.addColorStop(.85, "#efdeca");
  sky.addColorStop(1, "#f7deb7");
  view.fillStyle = sky;
  view.fillRect(0, 0, 512, 512);
  const glow = view.createRadialGradient(395, 140, 10, 395, 140, 132);
  glow.addColorStop(0, "rgba(255,238,204,.87)");
  glow.addColorStop(1, "rgba(255,238,204,0)");
  view.fillStyle = glow;
  view.fillRect(0, 0, 512, 280);
  disk(view, 395, 140, 16, "#fff1cc");

  // A sprawling summer bank with a cool underbelly, sunny towers, and windblown wisps.
  paint(view, wash("#fff5dd", "#d4d7de", 41, 173), "M-10 155 Q4 134 31 134 Q37 120 56 118 Q53 98 69 91 Q78 72 94 80 Q101 58 120 63 Q120 48 137 45 Q145 32 163 39 Q181 38 186 58 Q203 57 206 74 Q225 73 229 95 Q246 89 251 108 Q272 103 280 123 Q302 121 311 133 Q335 131 348 145 Q363 145 375 151 Q330 158 292 154 Q247 163 205 157 Q171 165 144 163 Q96 174 59 167 Q25 174 -10 168Z");
  paint(view, "#e7e3db", "M62 117 Q74 101 90 106 Q89 91 101 87 Q112 75 125 84 Q131 69 148 69 Q166 61 174 72 Q159 66 151 78 Q132 80 131 99 Q115 93 107 103 Q93 99 87 114 Q74 109 62 117Z");
  paint(view, "#c8d2d8", "M0 152 Q32 139 52 145 Q69 135 91 139 Q110 129 128 141 Q141 128 158 131 Q167 114 184 119 Q197 107 208 116 Q214 98 224 98 Q219 113 231 120 Q247 112 264 125 Q280 123 292 137 Q312 133 330 144 Q297 141 275 148 Q258 146 242 152 Q212 149 198 156 Q159 151 133 160 Q94 157 71 163 Q32 158 0 168Z");
  paint(view, "#f9eddb", "M167 125 Q177 113 187 119 Q194 110 201 111 Q194 115 191 123 Q178 120 167 125Z M242 110 Q253 101 263 109 Q270 108 276 114 Q257 110 242 117Z M327 150 Q360 144 375 147 Q393 140 403 143 Q426 139 444 143 Q406 149 369 149Z");
  paint(view,"#f7e9d2", "M38 189 Q85 181 118 184 Q136 176 157 180 Q181 176 203 179 Q165 183 138 184 Q98 192 38 189Z M360 176 Q382 172 405 171 Q427 169 457 171 Q440 176 418 175 Q388 179 360 176Z");

  paint(view, wash("#96b0c5","#c5cfd1",176,317), "M0 278 L0 258 L43 230 L58 226 L90 200 L101 205 L125 194 L151 207 L178 224 L202 220 L242 194 L256 198 L280 183 L290 188 L307 171 L318 176 L331 165 L355 181 L368 183 L404 204 L435 211 L457 194 L468 196 L500 173 L512 177 L512 512 L0 512Z");
  paint(view,"#d8d3c6", "M281 183 L290 188 L307 171 L318 176 L331 165 L354 181 L367 184 L394 200 L364 189 L348 188 L331 174 L327 185 L320 180 L309 192 L312 183 L297 196Z M74 214 L90 200 L101 205 L125 194 L151 207 L170 220 L145 212 L130 205 L117 210 L117 202 L103 214 L91 208Z");
  paint(view,wash("#8ba5b4","#b9c6bd",219,350), "M0 287 Q41 268 76 256 L117 232 L138 223 L162 231 Q189 253 218 259 Q245 247 268 244 L308 223 L325 220 L343 210 Q384 226 409 239 Q452 227 483 201 L512 187 L512 512 L0 512Z");
  paint(view,"#8ca9ac", "M0 270 Q42 250 70 262 Q97 272 129 292 L180 309 Q218 325 245 315 Q299 300 335 292 L379 279 Q444 266 512 214 L512 512 L0 512Z");
  paint(view,wash("#c4c8ad","#84a298",290,432), "M0 325 Q56 316 103 329 Q173 352 220 345 Q260 341 301 324 Q357 298 405 299 Q458 293 512 264 L512 512 L0 512Z");
  paint(view, "#e1d6b3", "M337 313 Q297 329 260 344 Q233 354 216 362 Q242 358 259 359 Q291 356 289 363 Q282 372 254 382 L184 409 L103 426 L150 398 Q190 379 230 368 Q249 361 226 363 Q209 367 192 364 Q176 362 191 356 Q223 345 247 339 Q291 324 337 313Z");
  paint(view,wash("#759591","#95a897",282,420), "M0 314 Q44 307 80 335 Q119 361 167 374 Q198 383 232 386 Q167 395 125 419 Q72 451 0 459Z");
  paint(view,wash("#688d8a","#8da188",282,490), "M0 478 Q61 435 118 419 Q175 400 216 400 Q284 397 328 366 Q370 336 425 327 Q466 320 512 287 L512 512 L0 512Z");

  // Reuse one tapered silhouette in a few loose clusters. Clearings leave room
  // for the light across the valley instead of filling the whole lower pane.
  function fir(x, ground, h, color) {
    view.save();
    view.translate(x, ground);
    view.scale(h / 90, h / 90);
    paint(view, color, "M-2 1 L-2 -12 L-17 -9 L-12 -18 L-19 -16 L-9 -36 L-15 -33 L-6 -51 L-10 -50 L-3 -68 L-5 -67 L0 -90 L5 -64 L3 -65 L11 -46 L7 -47 L15 -29 L10 -31 L20 -13 L14 -15 L18 -9 L2 -12 L2 1Z");
    view.restore();
  }
  for (const [x,y,h] of [[-4,321,59],[14,319,38],[28,321,48],[45,322,38],[67,330,25],[79,339,31],[95,350,23]]) fir(x,y,h,"#668c79");
  for (const [x,y,h] of [[358,353,23],[372,346,33],[386,342,29],[399,338,39],[416,333,32],[428,333,53],[450,326,42],[467,316,68],[489,314,53],[506,302,77]]) fir(x,y,h,"#587d6c");
  paint(view, "#446b60", "M0 475 Q78 444 148 451 Q214 460 269 448 Q339 437 379 417 Q435 392 512 379 L512 512 L0 512Z");
  for (const [x,y,h] of [[-2,478,102],[19,472,75],[39,469,98],[60,462,60],[79,458,48],[446,399,52],[471,394,77],[504,387,112]]) fir(x,y,h,"#446b60");

  // Nearest branches frame the luminous sky rather than covering the centre.
  line(view, "#536f65", 7, "M-12 77 Q28 26 97 11 Q130 1 172 -17 M15 48 Q47 40 70 51");
  line(view, "#68806e", 3.3, "M35 33 Q80 19 95 35 M56 21 Q70 7 72 -9 M95 12 Q124 24 148 18 M6 61 Q12 87 4 102");
  function leafySpray(x, y, angle, scale, shade, sunlight) {
    view.save();
    view.translate(x,y);
    view.rotate(angle);
    view.scale(scale,scale);
    paint(view, shade, "M0 0 Q8 -10 26 -12 Q16 -4 0 0Z M6 -3 Q12 -19 28 -26 Q23 -11 6 -3Z M9 -1 Q19 -4 30 2 Q21 6 9 -1Z M0 0 Q-10 -8 -13 -15 Q-1 -11 1 -3Z");
    paint(view, sunlight, "M7 -5 Q13 -17 27 -25 Q17 -12 7 -5Z M4 -1 Q18 -10 26 -11 Q18 -5 4 -1Z");
    view.restore();
  }
  for(const [x,y,angle,size] of [[3,65,-2.8,1.45],[9,73,1.5,1.2],[17,50,-2.8,1.5],[31,43,1.1,1.28],[52,46,1.2,1.13],[66,50,1.36,1.12],[29,33,-1.5,1.28],[46,24,1.5,1.2],[64,21,-1.2,1.22],[72,18,-1.15,1.3],[82,26,.7,1.07],[92,33,1.1,.92],[99,11,-1.1,1.25],[115,16,1.18,1.17],[131,20,.9,.89],[146,19,.47,.82],[151,-4,.7,1.3],[187,-4,.4,1.05]]) {
    leafySpray(x,y,angle,size,"#648674","#a3ac83");
  }

  // An ink-and-gouache botanical print, mounted on ivory stock.
  const print = panel(360, 256);
  print.fillStyle = "#f5e8ce";
  print.fillRect(0, 0, 360, 256);
  disk(print, 208, 126, 86, "#e7ba94");
  line(print, "#665f49", 3, "M88 237 Q153 177 189 126 Q219 85 272 43");
  line(print, "#665f49", 2.4, "M134 189 Q99 161 83 117 M161 158 Q207 170 250 146 M189 126 Q172 91 161 58 M216 96 Q250 109 276 90 M243 149 Q250 142 259 140 M273 91 Q278 85 283 82 M163 59 Q159 51 157 45");
  function leaf(x, y, angle, size, color) {
    print.save();
    print.translate(x, y);
    print.rotate(angle * Math.PI / 180);
    print.scale(size, size);
    paint(print, color, "M0 0 Q-17 -10 -25 -27 Q-29 -38 -37 -45 Q-14 -44 -5 -33 Q5 -21 0 0Z");
    line(print, "rgba(246,232,196,.7)", 1.2, "M-2 -5 Q-14 -25 -31 -40");
    print.restore();
  }
  for (const [x,y,a,s,c] of [[117,202,-11,1.0,"#536f62"],[135,185,82,1.12,"#768b70"],[114,168,-30,.84,"#728d7b"],[98,148,18,.8,"#4f7467"],[88,130,19,.65,"#8c9773"],[158,161,-16,.93,"#668676"],[193,162,105,.85,"#5d7866"],[214,159,57,.8,"#839883"],[173,92,-19,.88,"#607d68"],[170,81,30,.68,"#859578"],[198,113,86,.94,"#597a69"],[216,96,-14,.83,"#668774"],[236,74,62,.66,"#426b60"],[255,55,59,.54,"#859578"]]) leaf(x,y,a,s,c);
  const berries = [[245,148],[259,140],[274,90],[283,82],[162,56],[157,45],[269,45]];
  for (const [x,y] of berries) {
    disk(print,x,y,5.6,"#ab634d");
    disk(print,x-1.3,y-1.5,1.35,"#f2c19b");
  }
  return { window: renderer.texture(view.canvas), print: renderer.texture(print.canvas) };
}
