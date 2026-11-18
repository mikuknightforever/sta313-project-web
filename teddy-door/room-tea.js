"use strict";

// The mug and open field notebook sit in local table coordinates.
function addTeaThings(renderer, part, x, surfaceY, z) {
  const sides = 16;
  const mug = latheGeometry([
    [.068, 0], [.088, .009], [.116, .043], [.136, .205],
    [.135, .220], [.123, .222], [.120, .208], [.113, .150],
  ], sides);

  // The handle is part of the same ceramic draw as the body. Its ends
  // enter the outside of the cup while leaving a visible hole in the middle.
  const handleSteps = 9, tubeSteps = 6;
  function handleVertex(i, j) {
    const arc = i / handleSteps * Math.PI, ring = j / tubeSteps * Math.PI * 2;
    const c = Math.cos(ring), s = Math.sin(ring);
    const nx = -Math.sin(arc) * c, ny = Math.cos(arc) * c;
    return [-.115 - .093 * Math.sin(arc) + .015 * nx,
      .126 + .064 * Math.cos(arc) + .015 * ny, .015 * s,
      nx, ny, s, .5, .5];
  }
  for (let i = 0; i < handleSteps; i++) {
    for (let j = 0; j < tubeSteps; j++) {
      const a = handleVertex(i, j), b = handleVertex(i + 1, j);
      const c = handleVertex(i + 1, j + 1), d = handleVertex(i, j + 1);
      mug.push(...a, ...b, ...d, ...b, ...c, ...d);
    }
  }
  renderer.mesh("fieldMug", mug);
  const cupPosition = [x - .39, surfaceY, z - .035];
  part("fieldMug", 0xe7b78c, cupPosition, [1, 1, 1], [0, .30], { windowLight: true });

  const tea = [];
  for (let i = 0; i < sides; i++) {
    const a = i * Math.PI * 2 / sides, b = (i + 1) * Math.PI * 2 / sides;
    for (const [u, v] of [[0, 0], [Math.cos(b), Math.sin(b)], [Math.cos(a), Math.sin(a)]]) {
      tea.push(.119 * u, .187, .119 * v, 0, 1, 0, .5 + u / 2, .5 + v / 2);
    }
  }
  renderer.mesh("mugTea", tea);
  part("mugTea", 0x98562f, cupPosition, [1, 1, 1], [], { castShadow: false });

  const pageArt = document.createElement("canvas");
  pageArt.width = 160; pageArt.height = 96;
  const ctx = pageArt.getContext("2d");
  ctx.fillStyle = "#f4e6cb";
  ctx.fillRect(0, 0, 160, 96);
  const crease = ctx.createLinearGradient(72, 0, 90, 0);
  crease.addColorStop(0, "#0000"); crease.addColorStop(.45, "#83593436");
  crease.addColorStop(1, "#0000");
  ctx.fillStyle = crease;
  ctx.fillRect(72, 0, 18, 96);
  // A pressed olive sprig held in with a small strip of ochre tape.
  ctx.strokeStyle = "#889074"; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(27, 77); ctx.quadraticCurveTo(40, 52, 56, 22); ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const t = i / 6, bx = 32 + 20*t, by = 65 - 37*t;
    const dir = i % 2 ? 1 : -1;
    ctx.fillStyle = i % 2 ? "#a1ab87" : "#8b9a78";
    ctx.beginPath(); ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx+dir*12, by-3, bx+dir*16, by-13);
    ctx.quadraticCurveTo(bx+dir*5, by-13, bx, by); ctx.fill();
  }
  ctx.fillStyle = "#d8bd88b3"; ctx.fillRect(24, 70, 13, 4);
  ctx.strokeStyle = "#d2bea0"; ctx.lineWidth = .9;
  for (const [row, width] of [35, 41, 28].entries()) {
    ctx.beginPath(); ctx.moveTo(101, 52 + row*7); ctx.lineTo(101 + width, 52 + row*7); ctx.stroke();
  }

  // Cross sections lift the page blocks above the cloth binding and bend
  // the open sheets down into the gutter. End faces share the paper draw.
  const pages = [];
  const sections = [[-.303,.030],[-.22,.049],[-.11,.057],[0,.025],[.11,.060],[.22,.046],[.303,.032]];
  function pageQuad(a, b, c, d, faceUV) {
    const u = b.map((value, i) => value - a[i]), v = c.map((value, i) => value - a[i]);
    const n = [u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0]];
    for (const point of [a,b,c,a,c,d]) {
      const uv = faceUV ? [(point[0] + .303) / .606, .5 - point[2] / .386] : [.02,.02];
      pages.push(...point,...n,...uv);
    }
  }
  const halfDepth = .193, foot = .014;
  for (let i = 1; i < sections.length; i++) {
    const [x0,y0] = sections[i-1], [x1,y1] = sections[i];
    const a = [x0,y0,halfDepth], b = [x1,y1,halfDepth];
    const c = [x1,y1,-halfDepth], d = [x0,y0,-halfDepth];
    pageQuad(a,b,c,d,true);
    pageQuad([x0,foot,halfDepth],[x1,foot,halfDepth],b,a,false);
    pageQuad([x1,foot,-halfDepth],[x0,foot,-halfDepth],d,c,false);
    if (i === 1) pageQuad([x0,foot,-halfDepth],[x0,foot,halfDepth],a,d,false);
    if (i === sections.length-1) pageQuad([x1,foot,halfDepth],[x1,foot,-halfDepth],c,b,false);
  }
  renderer.mesh("fieldNotes", pages);
  const bookPosition = [x + .254, surfaceY, z + .042], turn = [0,-.23];
  part("box",0x738f82,[bookPosition[0],surfaceY+.007,bookPosition[2]],
    [.635,.014,.410],turn,{windowLight:true});
  part("fieldNotes",0xffffff,bookPosition,[1,1,1],turn,{texture:renderer.texture(pageArt),windowLight:true});
  const ribbonZ = .218;
  part("box",0xc17e67,[bookPosition[0]+Math.sin(turn[1])*ribbonZ,
    surfaceY+.015,bookPosition[2]+Math.cos(turn[1])*ribbonZ],
    [.027,.004,.066],turn);
}
