"use strict";

// A gathered linen panel at the far jamb on the right wall, to the viewer's left.
function addWindowCurtain(renderer, part) {
  const rodX = 3.015, rodY = 3.38;
  const centerZ = -1.45;

  // An eight-sided turned pole with small tapered finials, all in one mesh.
  const rodRings = [[-1.42,.010],[-1.402,.041],[-1.367,.046],[-1.337,.019],
    [1.337,.019],[1.367,.046],[1.402,.041],[1.42,.010]];
  const rod = [];
  function ringVertex(ring, side) {
    const angle = side * Math.PI / 4;
    const [z,radius] = rodRings[ring];
    const c = Math.cos(angle), s = Math.sin(angle);
    return [c*radius,s*radius,z,c,s,0,side/8,ring/(rodRings.length-1)];
  }
  for (let ring = 1; ring < rodRings.length; ring++) {
    for (let side = 0; side < 8; side++) {
      const a = ringVertex(ring-1,side), b = ringVertex(ring-1,side+1);
      const c = ringVertex(ring,side+1), d = ringVertex(ring,side);
      rod.push(...a,...b,...c,...a,...c,...d);
    }
  }
  for (const ring of [0,rodRings.length-1]) {
    const normalZ = ring === 0 ? -1 : 1;
    for (let side = 0; side < 8; side++) {
      const a = ringVertex(ring,side), b = ringVertex(ring,side+1);
      const center = [0,0,rodRings[ring][0],0,0,normalZ,.5,.5];
      rod.push(...center,...(normalZ > 0 ? a : b),...(normalZ > 0 ? b : a));
    }
  }
  renderer.mesh("curtainRod", rod);
  part("curtainRod",0x977754,[rodX,rodY,centerZ],[1,1,1]);
  for (const z of [-2.75,-.15]) {
    part("box",0xb19370,[3.157,rodY-.01,z],[.287,.032,.038]);
  }

  // Rows follow a loose header, a gently billowing fall, the tie, and the hem.
  // The front edge sweeps away from the view as it approaches the tie.
  const rows = [
    // height, left edge Z, width, pleat depth, hem variation
    [3.398,-2.712,.701,.041,.004], [3.332,-2.715,.712,.057,.010],
    [3.182,-2.712,.685,.069,.022], [2.845,-2.698,.615,.077,.019],
    [2.465,-2.673,.482,.073,.016], [2.145,-2.644,.349,.053,.009],
    [1.970,-2.632,.237,.033,.008], [1.919,-2.630,.232,.031,.007],
    [1.738,-2.673,.314,.052,.020], [1.512,-2.735,.411,.063,.036],
    [1.412,-2.750,.465,.064,.052],
  ];
  const columns = 12;
  function position(row, col) {
    const [height,z,width,depth,hem] = rows[row];
    const t = row/(rows.length-1), u = col/columns;
    const fold = 6*Math.PI*u + .32*Math.sin(Math.PI*t) + .38*t*u;
    const billow = .041*Math.sin(Math.PI*Math.min(t/.65,1));
    return [rodX-billow-depth*(.5+.5*Math.cos(fold)),
      height - hem*(.5+.5*Math.cos(fold)) - .065*t*t*u,
      z + width*u];
  }
  function vertex(row, col) {
    const left = position(row,Math.max(0,col-1)), right = position(row,Math.min(columns,col+1));
    const above = position(Math.max(0,row-1),col), below = position(Math.min(rows.length-1,row+1),col);
    const dx = right[0]-left[0], dy = right[1]-left[1], dz = right[2]-left[2];
    const ex = below[0]-above[0], ey = below[1]-above[1], ez = below[2]-above[2];
    const nx = ey*dz-ez*dy, ny = ez*dx-ex*dz, nz = ex*dy-ey*dx;
    const length = Math.hypot(nx,ny,nz);
    return [...position(row,col),nx/length,ny/length,nz/length,col/columns,1-row/(rows.length-1)];
  }
  const cloth = [];
  for (let row=0; row < rows.length-1; row++) {
    for (let col=0; col < columns; col++) {
      const a = vertex(row,col), b = vertex(row+1,col), c = vertex(row+1,col+1), d = vertex(row,col+1);
      cloth.push(...a,...b,...c,...a,...c,...d);
    }
  }
  renderer.mesh("gatheredLinen",cloth);

  // Broad ink-and-paint fold tones stay readable in the small opening shot.
  const linen = document.createElement("canvas");
  linen.width = 96; linen.height = 80;
  const ctx = linen.getContext("2d");
  ctx.fillStyle = "#f6e5c7"; ctx.fillRect(0,0,96,80);
  for (const x of [0,32,64]) {
    ctx.fillStyle = "#fbeed8"; ctx.fillRect(x,0,8,80);
    ctx.fillStyle = "#e7d4bc"; ctx.fillRect(x+8,0,8,80);
    ctx.fillStyle = "#d8c9bc"; ctx.fillRect(x+16,0,7,80);
  }
  ctx.fillStyle = "#b88867"; ctx.fillRect(0,48,96,8);
  ctx.fillStyle = "#dbac83"; ctx.fillRect(0,49,96,3);
  ctx.fillStyle = "rgba(166,136,108,.36)"; ctx.fillRect(0,77,96,1);
  part("gatheredLinen",0xffffff,[0,0,0],[1,1,1],[],{texture:renderer.texture(linen),castShadow:true});
}
