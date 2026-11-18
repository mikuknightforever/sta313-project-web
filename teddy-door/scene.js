"use strict";

const materials = { plain: 0, wood: 1, wall: 2, fur: 3, cloth: 4, brass: 5, glass: 6,
  portrait: 7, map: 8, calendar: 9, rug: 10, shadow: 11, glow: 12, view: 13, linenShade: 14,
  paper: 15, plush: 16, clay: 17, imported: 18 };

const clamp = n => Math.max(0, Math.min(1, n));
const mix = (a, b, t) => a + (b - a) * t;
function smooth(start, end, value) {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
}
const interpolate = (a, b, t) => a.map((value, i) => mix(value, b[i], t));
const storyTimeline = { sequenceEnd: .75, portraitStart: .72, portraitAnchor: .78, portraitExit: .84 };
const hex = value => [16, 8, 0].map(shift => ((value >> shift) & 255) / 255);

function point(matrix, x, y, z) {
  return [
    matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12],
    matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13],
    matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14],
  ];
}

function object(shape, color, material, position, size, rotation = [], extras = {}) {
  return { shape, color: hex(color), material: materials[material],
    model: transform(...position, ...size, ...rotation), ...extras };
}

function stick(a, b, width, depth, shape, color, material) {
  const [x, y, z] = b.map((value, i) => value - a[i]);
  const length = Math.hypot(x, y, z);
  const rx = Math.asin(z / length);
  const rz = Math.atan2(-x, y);
  return object(shape, color, material, interpolate(a, b, .5), [width, length, depth], [rx, 0, rz]);
}

function makeScene(renderer) {
  const room = makeRoomAssets(renderer);
  const portraitX = -1.71, portraitY = 2.72;
  const family = makeFamily(renderer);
  const familyScale = .272;
  const familyRoot = transform(portraitX, portraitY, -4.022, familyScale, familyScale, familyScale);
  const sofaAdvance = .64, zBear = -2.57;
  const bearScale = .72;
  // Kenney sofa seat at local Y=.23, scaled to 4.15 m wide.
  // Central hip underside is Y=.92683; the lower feet extend over the seat edge.
  const seatHeight = .024 + .23 * (4.15 / .98);
  const bearBaseY = seatHeight - .92683 * bearScale;
  const bearPose = transform(0, bearBaseY, zBear + sofaAdvance, bearScale, bearScale, bearScale);
  const seatedBear = makePlush(renderer);
  const ready = Promise.all([room.ready, seatedBear.ready]);

  // Fit the paper to the downloaded bear's original arm length.
  const mapW = .90;
  const mapH = mapW / 1.5;
  const roomStop = .39;
  const pageCount = 4;
  const pageW = mapW / pageCount;
  const pages = Array.from({ length: pageCount }, (_, i) => object("quad", 0xffffff, "map", [0, 0, 0],
    [1, 1, 1], [], { region: [i / pageCount, 0, 1 / pageCount, 1] }));

  function load(source, ready) {
    if (!source) return;
    const image = new Image();
    image.onload = () => ready(image);
    image.src = source;
  }

  function loadArt(art, redraw) {
    ready.then(redraw).catch(error => console.error(error));
    load(art.map, image => {
      const texture = renderer.texture(image);
      pages.forEach(page => { page.texture = texture; });
      redraw();
    });
  }

  function render(progress, width, height, reduced, interaction) {
    const sequence = clamp(progress / storyTimeline.sequenceEnd);
    const returnToRoom = smooth(.46, .67, sequence);
    const portraitReturn = smooth(storyTimeline.portraitExit, 1, progress);
    const portraitMove = smooth(.68, .96, sequence) * (1 - portraitReturn);
    const storyProgress = sequence <= .46 ? clamp(sequence / .39) : mix(1, roomStop, returnToRoom);
    const p = reduced ? (storyProgress < .22 ? 0 : storyProgress < .58 ? roomStop : storyProgress < .89 ? .74 : 1) : storyProgress;
    const aspect = width / height;
    const roomWidth = 1; // Preserve the downloaded furniture proportions; camera fits the viewport.
    const wide = smooth(.58, 1.65, aspect);
    const approach = smooth(0, roomStop, p);
    const close = smooth(.47, .77, p);
    const unfold = smooth(.43, .73, p);
    const face = smooth(.74, .99, p);
    const mapY = bearBaseY + bearScale * mix(1.30, 1.55, unfold);
    const mapZ = zBear + sofaAdvance + bearScale * mix(.62, .70, unfold);

    const pitch = .20;
    const endTan = Math.max(.51, .36 / aspect);
    const widthFit = .89;
    const heightFit = Math.min(.89, Math.max(.46, 1 - 90 / height));
    const distance = Math.max(mapW / (2 * endTan * aspect * widthFit), mapH / (2 * endTan * heightFit));
    const endZ = mapZ + Math.cos(pitch) * distance;
    const roomTan = Math.max(.46, .55 / aspect);
    const oblique = 1 - close;
    const camera = {
      aspect,
      x: mix(mix(-2.95, -4.55, wide), mix(-1.70, -2.23, wide), approach) * oblique,
      tan: mix(roomTan, endTan, face),
      y: mix(mix(mix(4.25, 4.65, wide), 1.99, approach), mapY + Math.sin(pitch) * distance, face),
      z: mix(mix(mix(mix(4.6, 5.55, wide), 2.37, approach), endZ + .46, close), endZ, face),
      targetX: mix(.18 - .79 * wide, .18, approach) * oblique,
      targetY: mix(mix(1.25, 1.57, approach), mapY, face),
      targetZ: mix(mix(-1.26, zBear + sofaAdvance, approach), mapZ, face),
    };
    const mapRoot = transform(0, mapY, mapZ, 1, 1, 1, mix(-.96, -.52, unfold), -.12);

    const portraitPose = multiply(transform(0, 0, 0, roomWidth, 1, 1), familyRoot);
    const portraitTan = .43;
    const photoWidth = 1.66, photoHeight = 1.146;
    const portraitCenter = [portraitX, portraitY, -4.0955];
    const portraitFit = .95;
    const portraitFitY = Math.max(.68, Math.min(.91, 1 - 110 / height));
    const basePortraitDistance = Math.max(
      photoWidth / (2 * portraitTan * aspect * portraitFit),
      photoHeight / (2 * portraitTan * portraitFitY));
    const sheets = family.papers(interaction, roomWidth);
    let liftedDistance = basePortraitDistance;
    for (const sheet of Object.values(sheets)) {
      const center = point(portraitPose, ...sheet.center);
      const halfWidth = sheet.size[0] * familyScale * roomWidth / 2;
      const halfHeight = sheet.size[1] * familyScale / 2;
      const paperHeight = Math.abs(center[1] - portraitCenter[1]) + halfHeight;
      const paperDepth = center[2] + paperFrontDepth * familyScale - portraitCenter[2];
      liftedDistance = Math.max(liftedDistance,
        halfWidth / (portraitTan * aspect * portraitFit) + paperDepth,
        paperHeight / (portraitTan * portraitFitY) + paperDepth);
    }
    // Fit the sheets even at rest: the cub's paper projects beyond the frame.
    // The vertical safe area also keeps it clear of the instructions below.
    const portraitDistance = liftedDistance;
    const portraitCamera = {
      x: portraitCenter[0], y: portraitCenter[1], z: portraitCenter[2] + portraitDistance,
      targetX: portraitCenter[0], targetY: portraitCenter[1], targetZ: portraitCenter[2],
      tan: portraitTan,
    };
    for (const key of Object.keys(portraitCamera)) camera[key] = mix(camera[key], portraitCamera[key], portraitMove);

    if (interaction.selected) {
      const paper = sheets[interaction.selected];
      const center = point(portraitPose, ...paper.center);
      const tan = .43;
      const sheetFitY = Math.max(.48, Math.min(.95, 1 - 90 / height));
      const paperDistance = Math.max(
        paper.size[0] * familyScale * roomWidth / (2 * tan * aspect * .95),
        paper.size[1] * familyScale / (2 * tan * sheetFitY));
      const paperCamera = {
        x: center[0], y: center[1], z: center[2] + paperFrontDepth * familyScale + paperDistance,
        targetX: center[0], targetY: center[1], targetZ: center[2], tan,
      };
      for (const key of Object.keys(paperCamera)) camera[key] = mix(camera[key], paperCamera[key], interaction.zoom);
    }

    renderer.resize(width, height);
    renderer.frame(camera);
    room.render();
    const grips = [];
    // Every panel shares an edge with its neighbor. Alternating hinge
    // directions form a concertina that straightens as the paws pull apart.
    const fold = mix(1.17, 0, unfold);
    let edgeX = -mapW * Math.cos(fold) / 2;
    let edgeZ = 0;
    for (const [i, page] of pages.entries()) {
      const angle = i % 2 === 0 ? -fold : fold;
      const nextX = edgeX + pageW * Math.cos(angle);
      const nextZ = edgeZ - pageW * Math.sin(angle);
      const pose = multiply(mapRoot, transform((edgeX + nextX) / 2, 0, (edgeZ + nextZ) / 2, 1, 1, 1, 0, angle));
      renderer.draw(page, multiply(pose, transform(0, 0, 0, pageW + .0005, mapH, 1)));
      edgeX = nextX;
      edgeZ = nextZ;

      if (i !== 0 && i !== pageCount - 1) continue;
      const side = i === 0 ? -1 : 1;
      const pawY = mix(.12, .08, unfold);
      const grip = point(pose, side * (pageW / 2 + .04), pawY, -.006);
      grips[i === 0 ? 0 : 1] = grip.map((value, axis) => (value - bearPose[12 + axis]) / bearScale);
    }
    seatedBear.render(bearPose, grips);
    const portraitBoard = [4.40, 3.48];
    family.render(portraitPose, interaction, roomWidth, portraitBoard);
    renderer.finish();

    const viewProjection = multiply(perspective(camera.tan, aspect), viewAt(camera));
    const projection = multiply(viewProjection, portraitPose);
    function screenBounds(x, y, w, h, z) {
      const corners = [-1, 1].flatMap(sideX => [-1, 1].map(sideY => {
        const px = x + sideX * w / 2, py = y + sideY * h / 2;
        const depth = projection[3] * px + projection[7] * py + projection[11] * z + projection[15];
        return [
          (.5 + (projection[0] * px + projection[4] * py + projection[8] * z + projection[12]) / depth / 2) * width,
          (.5 - (projection[1] * px + projection[5] * py + projection[9] * z + projection[13]) / depth / 2) * height,
        ];
      }));
      const left = Math.min(...corners.map(c => c[0])), top = Math.min(...corners.map(c => c[1]));
      return [left, top, Math.max(...corners.map(c => c[0])) - left, Math.max(...corners.map(c => c[1])) - top];
    }
    return {
      mapProgress: p,
      portraitMove,
      parents: screenBounds(0, .61, 3.36, 2.18, .70),
      child: screenBounds(0, -.80, 1.48, 1.82, 1.25),
      paper: interaction.selected ? screenBounds(...sheets[interaction.selected].center.slice(0, 2),
        ...sheets[interaction.selected].size, sheets[interaction.selected].center[2] + paperFrontDepth) : null,
    };
  }

  return { loadArt, render, roomStop, plush: seatedBear, room, ready, backend: renderer.engine };
}
