"use strict";

// Small surface illustrations are built once and lit in the same pass as the models.
function makeRoomFinishes(renderer) {
  function canvas(width, height) {
    const surface = document.createElement("canvas");
    surface.width = width;
    surface.height = height;
    return surface.getContext("2d");
  }

  const floor = canvas(768, 640);
  const boardWidth = 64;
  const boardColors = ["#cabbb0", "#c9b7ad", "#c2b3af", "#d1c2b5"];
  for (let i = 0; i < 12; i++) {
    const x = i * boardWidth;
    floor.fillStyle = boardColors[i % boardColors.length];
    floor.fillRect(x, 0, boardWidth, 640);
    floor.fillStyle = "#796b7433";
    floor.fillRect(x, 0, 1.6, 640);
    for (let joint = 60 + (i * 93) % 200; joint < 640; joint += 245) {
      floor.fillRect(x, joint, boardWidth, 1.5);
    }
    floor.strokeStyle = "#88747b26";
    floor.lineWidth = 1.6;
    for (let j = 0; j < 3; j++) {
      const y = (i * 87 + j * 215) % 640;
      const grainX = x + 9 + (i * 11 + j * 13) % 44;
      floor.beginPath();
      floor.moveTo(grainX, y);
      floor.bezierCurveTo(grainX + 6, y + 36, grainX - 8, y + 55, grainX - 2, y + 107);
      floor.stroke();
    }
  }

  const wall = canvas(512, 256);
  const wash = wall.createLinearGradient(0, 255, 450, 14);
  wash.addColorStop(0, "#b7b7c8");
  wash.addColorStop(.62, "#ccc8d1");
  wash.addColorStop(1, "#ded0ca");
  wall.fillStyle = wash;
  wall.fillRect(0, 0, 512, 256);
  // A faint canopy silhouette breaks the empty wash near the sunlit window.
  wall.save();
  wall.fillStyle = "rgba(102,115,147,.08)";
  for (const [x, y, angle, length] of [[491,7,-.55,19],[510,21,-.60,20],[476,15,-.58,17],
    [465,24,-.66,14],[485,31,-.36,15],[506,46,-.32,21],[496,61,-.42,15],[473,53,-.42,14],
    [453,32,-.60,13],[451,43,-.58,10],[441,51,-.60,8],[508,83,-.4,14]]) {
    wall.save(); wall.translate(x,y); wall.rotate(angle);
    wall.beginPath(); wall.moveTo(-length,0);
    wall.quadraticCurveTo(0,-length*.54,length,0);
    wall.quadraticCurveTo(0,length*.48,-length,0);
    wall.fill(); wall.restore();
  }
  wall.restore();
  // Painted lower wall panels keep the back corner legible behind the furniture.
  wall.fillStyle = "#a6b4c2";
  wall.fillRect(0, 181, 512, 75);
  wall.fillStyle = "#7c90a6";
  wall.fillRect(0, 184, 512, 1.4);
  for (let x = 10; x < 512; x += 48) {
    wall.strokeStyle = "#71849b80";
    wall.strokeRect(x, 191, 37, 55);
    wall.strokeStyle = "#cdd0d16b";
    wall.strokeRect(x + 1, 192, 37, 55);
  }

  const knit = canvas(180, 288);
  knit.fillStyle = "#c48e88";
  knit.fillRect(0, 0, 180, 288);
  for (const x of [9, 164]) {
    knit.fillStyle = "#dbc1ab";
    knit.fillRect(x, 0, 6, 288);
    knit.fillRect(x + 8, 0, 2, 288);
  }
  for (const y of [12, 26, 254, 268]) {
    knit.fillStyle = "#e3cbb2";
    knit.fillRect(0, y, 180, 4);
  }
  // A quiet woven rhythm remains readable as fabric without a normal-map pass.
  knit.strokeStyle = "rgba(101,67,71,.075)";
  knit.lineWidth = .65;
  for (let y = 3; y < 288; y += 4) {
    knit.beginPath(); knit.moveTo(0, y); knit.lineTo(180, y); knit.stroke();
  }
  knit.strokeStyle = "rgba(255,234,216,.10)";
  for (let x = 3; x < 180; x += 5) {
    knit.beginPath(); knit.moveTo(x, 0); knit.lineTo(x, 288); knit.stroke();
  }
  knit.strokeStyle = "#e4c7b7";
  knit.lineWidth = 2;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 3; col++) {
      const x = 40 + col * 42 + (row % 2) * 12;
      const y = 54 + row * 41;
      knit.beginPath();
      knit.moveTo(x, y - 5); knit.lineTo(x + 4, y); knit.lineTo(x, y + 5); knit.lineTo(x - 4, y);
      knit.closePath(); knit.stroke();
    }
  }

  const ticking = canvas(128, 48);
  ticking.fillStyle = "#d0c8b9";
  ticking.fillRect(0, 0, 128, 48);
  for (const end of [14, 99]) {
    ticking.fillStyle = "#86a19a";
    ticking.fillRect(end, 0, 7, 48);
    ticking.fillStyle = "#a7b9a4";
    ticking.fillRect(end + 10, 0, 3, 48);
  }

  const shade = canvas(96, 96);
  const penumbra = shade.createRadialGradient(48, 48, 0, 48, 48, 47);
  penumbra.addColorStop(0, "rgba(56,44,52,.38)");
  penumbra.addColorStop(.53, "rgba(66,51,59,.22)");
  penumbra.addColorStop(1, "rgba(77,63,71,0)");
  shade.fillStyle = penumbra;
  shade.fillRect(0, 0, 96, 96);
  return { floor: renderer.texture(floor.canvas), wall: renderer.texture(wall.canvas),
    blanket: renderer.texture(knit.canvas), ticking: renderer.texture(ticking.canvas),
    shade: renderer.texture(shade.canvas) };
}

// One continuous cloth strip rests on the arm, then turns inward onto the seat.
// Smooth shared normals keep the soft folds connected through each rounded bend.
function registerThrow(renderer) {
  const profile = [[-2.108,.70],[-2.116,.92],[-2.117,1.29],[-2.109,1.50],
    [-2.095,1.565],[-2.073,1.605],[-2.040,1.620],[-1.745,1.620],
    [-1.704,1.610],[-1.674,1.581],[-1.658,1.535],[-1.654,1.34],
    [-1.650,1.14],[-1.631,1.058],[-1.592,1.043],[-1.506,1.040],[-1.31,1.040]];
  const columns = 12, lengths = [0], normals = [];
  for (let i = 1; i < profile.length; i++) {
    lengths.push(lengths[i-1] + Math.hypot(profile[i][0]-profile[i-1][0], profile[i][1]-profile[i-1][1]));
  }
  for (let i = 0; i < profile.length; i++) {
    const previous = profile[Math.max(0, i-1)], next = profile[Math.min(profile.length-1, i+1)];
    const dx = next[0]-previous[0], dy = next[1]-previous[1], length = Math.hypot(dx, dy);
    normals.push([-dy/length, dx/length]);
  }
  function vertex(row, column) {
    const u = column/columns, v = lengths[row]/lengths[lengths.length-1];
    const [nx,ny] = normals[row];
    const folds = .011 * (Math.sin(u*Math.PI*4.5+.3)+.35*Math.sin(u*Math.PI*8));
    const draped = row < 4 || row > 10 ? 1 : .45;
    // An uneven free hem and a small diagonal drift prevent a rigid rectangular edge.
    const hem = row === 0 ? .035*Math.sin(u*Math.PI*2.2+.4) : 0;
    const sideCurl = .006*Math.pow(Math.abs(u-.5)*2,6);
    const across = .011*(Math.PI*4.5*Math.cos(u*Math.PI*4.5+.3)
      +.35*Math.PI*8*Math.cos(u*Math.PI*8))*draped/.80;
    const normalLength = Math.hypot(nx,ny,across);
    return [profile[row][0]+nx*(folds*draped+sideCurl),
      profile[row][1]+ny*(folds*draped+sideCurl)+hem,
      -2.54+u*.80+v*.075, nx/normalLength,ny/normalLength,-across/normalLength,u,v];
  }
  const vertices = [];
  for (let row = 0; row < profile.length-1; row++) {
    for (let column = 0; column < columns; column++) {
      for (const [r,c] of [[row,column],[row,column+1],[row+1,column+1],
        [row,column],[row+1,column+1],[row+1,column]]) vertices.push(...vertex(r,c));
    }
  }
  renderer.mesh("sofaThrow", vertices);
}

// Only the original flat seat top is retessellated. Its boundary, imported body,
// feet, arms and back keep Kenney's geometry; no extra cushion floats above it.
// A shallow surrounding loft leaves the existing bear/seat contact height fixed.
function addSofaContact(loaded) {
  if (!loaded?.root || loaded.root.userData.seatContact) return 0;
  const segmentsX = 24, segmentsZ = 10, seatY = .230000004;
  const xMin = .0901714414, xMax = .8898285031, zMin = -.3198285699, zMax = 0;
  const centerX = .48999998, hipZ = -.12235;
  const clamp01 = value => Math.max(0,Math.min(1,value));
  function surface(x,z) {
    const u = clamp01((x-xMin)/(xMax-xMin)), v = clamp01((z-zMin)/(zMax-zMin));
    const edge = Math.pow(Math.max(0,Math.sin(Math.PI*u)*Math.sin(Math.PI*v)), .65);
    const q = ((x-centerX)/.115)**2+((z-hipZ)/.086)**2;
    return seatY + .0085*edge*(1-Math.exp(-1.65*q));
  }
  function shade(x,z) {
    const q = ((x-centerX)/.113)**2+((z-hipZ)/.080)**2;
    // Broad soft occlusion sits under the hips; its feather follows the seat mesh.
    const contact = .30*Math.exp(-1.75*q);
    const backCrease = .06*Math.exp(-(((z-zMin)/.025)**2));
    const amount = 1-contact-backCrease;
    return [amount,amount*.998,Math.min(1,amount+.014*contact)];
  }
  let trianglesAdded = 0;
  loaded.root.traverse(node => {
    if (!node.isMesh) return;
    const geometry = node.geometry, positions = geometry.attributes.position;
    const sourceNormals = geometry.attributes.normal, sourceUV = geometry.attributes.uv;
    if (!positions || !sourceNormals) return;
    const index = geometry.index, count = index ? index.count : positions.count;
    const keep = [], removed = [], lipFaces = [];
    for (let i=0;i<count;i+=3) {
      const ids = [0,1,2].map(j=>index?index.getX(i+j):i+j);
      const top = ids.every(j=>Math.abs(positions.getY(j)-seatY)<.00001 && sourceNormals.getY(j)>.8);
      const onLip = ids.every(j=>positions.getY(j)>=.1448143-.00001 && positions.getY(j)<=seatY+.00001)
        && (ids.every(j=>Math.abs(positions.getZ(j))<.00001 && sourceNormals.getZ(j)>.8)
          || ids.every(j=>Math.abs(positions.getX(j)-xMin)<.00001 && sourceNormals.getX(j)<-.8
            && positions.getZ(j)>=-.020001 && positions.getZ(j)<=.00001)
          || ids.every(j=>Math.abs(positions.getX(j)-xMax)<.00001 && sourceNormals.getX(j)>.8
            && positions.getZ(j)>=-.020001 && positions.getZ(j)<=.00001));
      (top?removed:onLip?lipFaces:keep).push(ids);
    }
    if (!removed.length) return;
    const points = [], normals = [], uv = [], colors = [];
    const append = (p,n,t,color) => {points.push(...p);normals.push(...n);uv.push(...t);colors.push(...color);};
    for (const triangle of keep) for (const j of triangle) append(
      [positions.getX(j),positions.getY(j),positions.getZ(j)],
      [sourceNormals.getX(j),sourceNormals.getY(j),sourceNormals.getZ(j)],
      sourceUV?[sourceUV.getX(j),sourceUV.getY(j)]:[0,0],[1,1,1]);
    function vertex(column,row) {
      const x=xMin+(xMax-xMin)*column/segmentsX, z=zMin+(zMax-zMin)*row/segmentsZ;
      const epsilon=.0005;
      const dx=(surface(x+epsilon,z)-surface(x-epsilon,z))/(2*epsilon);
      const dz=(surface(x,z+epsilon)-surface(x,z-epsilon))/(2*epsilon);
      const length=Math.hypot(dx,1,dz);
      return [[x,surface(x,z),z],[-dx/length,1/length,-dz/length],
        [column/segmentsX,row/segmentsZ],shade(x,z)];
    }
    for (let row=0;row<segmentsZ;row++) for (let column=0;column<segmentsX;column++) {
      for (const [c,r] of [[column,row],[column,row+1],[column+1,row+1],
        [column,row],[column+1,row+1],[column+1,row]]) append(...vertex(c,r));
    }
    // A narrow matte seam belongs to the actual cushion front, below the paws.
    // It wraps just around the existing 8 cm-deep return, with a soft upper lip.
    const seamRows = [[.144814327,.985],[.206,.995],[.2125,.995],
      [.214,.87],[.2155,1.035],[.223,1.015],[seatY,1.005]];
    const lipPaths = [
      [[xMin,0],[xMax,0],[0,0,1]],
      [[xMin,-.02],[xMin,0],[-1,0,0]],
      [[xMax,0],[xMax,-.02],[1,0,0]],
    ];
    if (lipFaces.length) for (const [left,right,normal] of lipPaths) {
      for (let row=0;row<seamRows.length-1;row++) {
        for (const [side,r] of [[0,row],[1,row],[1,row+1],[0,row],[1,row+1],[0,row+1]]) {
          const [x,z]=side?right:left, [y,value]=seamRows[r];
          append([x,y,z],normal,[side,r/(seamRows.length-1)],[value,value,value]);
        }
      }
    }
    const replacement=geometry.clone();
    replacement.setIndex(null); replacement.clearGroups();
    const Attribute=positions.constructor;
    replacement.setAttribute("position",new Attribute(new Float32Array(points),3));
    replacement.setAttribute("normal",new Attribute(new Float32Array(normals),3));
    replacement.setAttribute("uv",new Attribute(new Float32Array(uv),2));
    replacement.setAttribute("color",new Attribute(new Float32Array(colors),3));
    replacement.computeBoundingBox(); replacement.computeBoundingSphere();
    node.geometry=replacement;
    for (const material of Array.isArray(node.material)?node.material:[node.material]) {
      material.vertexColors=true; material.flatShading=false; material.needsUpdate=true;
    }
    trianglesAdded += segmentsX*segmentsZ*2-removed.length;
    if (lipFaces.length) trianglesAdded += lipPaths.length*(seamRows.length-1)*2-lipFaces.length;
  });
  loaded.root.userData.seatContact=true;
  loaded.triangles += trianglesAdded;
  return trianglesAdded;
}

// Three rings give the linen cushion a rounded face, a narrow sewn edge and a back.
function registerPillow(renderer) {
  const segments = 20;
  function ring(radius, depth, slope) {
    return Array.from({length: segments}, (_, index) => {
      const angle = 2 * Math.PI * index / segments;
      const c = Math.cos(angle), s = Math.sin(angle);
      const x = Math.sign(c) * Math.pow(Math.abs(c), .44);
      const y = Math.sign(s) * Math.pow(Math.abs(s), .44);
      return [x * radius, y * radius, depth, c*slope, s*slope, 1-slope, .5+x*.5, .5+y*.5];
    });
  }
  const face = ring(.42, .36, .33), edge = ring(.5, .02, 1), back = ring(.43, -.36, .7);
  const points = [];
  for (let i=0; i<segments; i++) {
    const j=(i+1)%segments;
    points.push([0,0,.5,0,0,1,.5,.5],face[i],face[j]);
    for (const [inner, outer] of [[face,edge],[edge,back]]) {
      points.push(inner[i],outer[i],outer[j],inner[i],outer[j],inner[j]);
    }
    points.push([0,0,-.5,0,0,-1,.5,.5],back[j],back[i]);
  }
  renderer.mesh("linenPillow",points.flat());
}
