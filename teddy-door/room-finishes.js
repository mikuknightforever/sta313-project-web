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
  const boardColors = ["#edd6bf", "#ebcdb7", "#e5c4b5", "#efdbc2"];
  for (let i = 0; i < 12; i++) {
    const x = i * boardWidth;
    floor.fillStyle = boardColors[i % boardColors.length];
    floor.fillRect(x, 0, boardWidth, 640);
    floor.fillStyle = "#9c755537";
    floor.fillRect(x, 0, 1.6, 640);
    for (let joint = 60 + (i * 93) % 200; joint < 640; joint += 245) {
      floor.fillRect(x, joint, boardWidth, 1.5);
    }
    floor.strokeStyle = "#aa825329";
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
  wash.addColorStop(0, "#d6ced5");
  wash.addColorStop(.62, "#f4e8df");
  wash.addColorStop(1, "#fff1df");
  wall.fillStyle = wash;
  wall.fillRect(0, 0, 512, 256);
  // A faint canopy silhouette breaks the empty wash near the sunlit window.
  wall.save();
  wall.fillStyle = "rgba(121,136,163,.10)";
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
  wall.fillStyle = "#c3d2d9";
  wall.fillRect(0, 181, 512, 75);
  wall.fillStyle = "#92a6b4";
  wall.fillRect(0, 184, 512, 1.4);
  for (let x = 10; x < 512; x += 48) {
    wall.strokeStyle = "#8597a399";
    wall.strokeRect(x, 191, 37, 55);
    wall.strokeStyle = "#e2e5d780";
    wall.strokeRect(x + 1, 192, 37, 55);
  }

  const knit = canvas(180, 288);
  knit.fillStyle = "#e89281";
  knit.fillRect(0, 0, 180, 288);
  for (const x of [9, 164]) {
    knit.fillStyle = "#efd0a8";
    knit.fillRect(x, 0, 6, 288);
    knit.fillRect(x + 8, 0, 2, 288);
  }
  for (const y of [12, 26, 254, 268]) {
    knit.fillStyle = "#f8d9ad";
    knit.fillRect(0, y, 180, 4);
  }
  knit.strokeStyle = "#fad3b4";
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

  const shade = canvas(96, 96);
  const penumbra = shade.createRadialGradient(48, 48, 0, 48, 48, 47);
  penumbra.addColorStop(0, "rgba(56,44,52,.38)");
  penumbra.addColorStop(.53, "rgba(66,51,59,.22)");
  penumbra.addColorStop(1, "rgba(77,63,71,0)");
  shade.fillStyle = penumbra;
  shade.fillRect(0, 0, 96, 96);
  return { floor: renderer.texture(floor.canvas), wall: renderer.texture(wall.canvas),
    blanket: renderer.texture(knit.canvas), shade: renderer.texture(shade.canvas) };
}

// A light blanket follows the chamfer of the Kenney sofa's left arm. The strip
// uses its cross-section in world coordinates and only two shallow fabric folds.
function registerThrow(renderer) {
  const profile = [[-2.107,.72],[-2.11,1.55],[-2.084,1.615],[-2.05,1.629],
    [-1.702,1.629],[-1.665,1.614],[-1.652,1.568],[-1.652,1.24]];
  const lengths = [0];
  for (let i = 1; i < profile.length; i++) {
    lengths.push(lengths[i-1] + Math.hypot(profile[i][0]-profile[i-1][0], profile[i][1]-profile[i-1][1]));
  }
  const folds = [0,.021,.002,.027,0];
  const vertices = [];
  for (let i = 0; i < profile.length - 1; i++) {
    const dx = profile[i+1][0] - profile[i][0], dy = profile[i+1][1] - profile[i][1];
    const length = Math.hypot(dx, dy), nx = -dy / length, ny = dx / length;
    for (let j = 0; j < folds.length - 1; j++) {
      for (const [row, col] of [[i,j],[i,j+1],[i+1,j+1],[i,j],[i+1,j+1],[i+1,j]]) {
        const u = col / (folds.length-1), v = lengths[row]/lengths[lengths.length-1];
        // Offset each shared vertex identically across the bend so folds stay sewn together.
        const outer = row < 3 ? -1 : row > 4 ? 1 : 0;
        vertices.push(profile[row][0]+outer*folds[col],profile[row][1]+folds[col],
          -2.52+u*.73+v*.045,nx,ny,0,u,v);
      }
    }
  }
  renderer.mesh("sofaThrow", vertices);
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
