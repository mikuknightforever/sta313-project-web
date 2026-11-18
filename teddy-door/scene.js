"use strict";

const materials = { plain: 0, wood: 1, wall: 2, fur: 3, cloth: 4, brass: 5, glass: 6,
  portrait: 7, map: 8, calendar: 9, rug: 10, shadow: 11, glow: 12, view: 13, linenShade: 14 };

const clamp = n => Math.max(0, Math.min(1, n));
const mix = (a, b, t) => a + (b - a) * t;
function smooth(start, end, value) {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
}
const interpolate = (a, b, t) => a.map((value, i) => mix(value, b[i], t));
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

function calendarArt() {
  const paper = document.createElement("canvas");
  paper.width = 420;
  paper.height = 520;
  const ctx = paper.getContext("2d");
  ctx.fillStyle = "#efe0bd";
  ctx.fillRect(0, 0, 420, 520);
  ctx.fillStyle = "#773f2b";
  ctx.fillRect(0, 0, 420, 22);
  ctx.textAlign = "center";
  ctx.fillStyle = "#3b3122";
  ctx.font = "bold 41px Georgia";
  ctx.fillText("NOVEMBER", 210, 111);
  ctx.strokeStyle = "#ac8862";
  ctx.lineWidth = 2;
  ctx.strokeRect(33, 143, 354, 310);
  ctx.font = "20px Georgia";
  "SMTWTFS".split("").forEach((letter, i) => ctx.fillText(letter, 59 + 50 * i, 182));
  for (let day = 1; day <= 30; day++) {
    const slot = day - 1;
    const x = 59 + 50 * (slot % 7), y = 225 + 46 * Math.floor(slot / 7);
    ctx.fillText(day, x, y);
    if (day === 16) {
      ctx.strokeStyle = "#973e2d";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(x, y - 6, 18, 15, -.23, 0, 2 * Math.PI);
      ctx.stroke();
    }
  }
  return paper;
}

function windowArt() {
  const view = document.createElement("canvas");
  view.width = 720;
  view.height = 620;
  const ctx = view.getContext("2d");
  const sky = ctx.createLinearGradient(0, 0, 0, 620);
  sky.addColorStop(0, "#92afab");
  sky.addColorStop(.5, "#d6d2a7");
  sky.addColorStop(1, "#f3c786");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 720, 620);

  ctx.fillStyle = "#fff4d2aa";
  ctx.beginPath();
  ctx.ellipse(220, 226, 110, 24, 0, 0, Math.PI * 2);
  ctx.ellipse(190, 215, 57, 29, 0, 0, Math.PI * 2);
  ctx.ellipse(261, 215, 44, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  const sunlight = ctx.createRadialGradient(535, 214, 7, 535, 214, 225);
  sunlight.addColorStop(0, "#fff5c4");
  sunlight.addColorStop(1, "#fff5c400");
  ctx.fillStyle = sunlight;
  ctx.fillRect(0, 0, 720, 620);

  let seed = 5041;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  for (const [layer, color] of ["#a6a582", "#7e8b6c", "#5c755e", "#3d594c"].entries()) {
    const base = 384 + layer * 73;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 620);
    for (let x = 0; x <= 720; x += 10) {
      ctx.lineTo(x, base + 34 * Math.sin(x * .007 + layer * 1.67) + 12 * Math.cos(x * .017));
    }
    ctx.lineTo(720, 620);
    ctx.fill();

    for (let x = -20; x < 740; x += 19 + random() * 26) {
      const foot = base + 37 + 34 * Math.sin(x * .007 + layer * 1.67) + 12 * Math.cos(x * .017);
      const treeHeight = 40 + layer * 19 + random() * (55 + layer * 45);
      const spread = treeHeight * (.10 + random() * .09);
      ctx.beginPath();
      ctx.moveTo(x, foot - treeHeight);
      for (const side of [1, -1]) {
        for (let j = 0; j < 7; j++) {
          const branch = side === 1 ? j : 6 - j;
          const length = spread * (.28 + .12 * branch) * (.75 + random() * .40);
          const y = foot - treeHeight + (branch + 1) * treeHeight / 8;
          ctx.lineTo(x + side * length, y);
          ctx.lineTo(x + side * length * .46, y + (side === 1 ? -1 : 1) * treeHeight * .052);
        }
        if (side === 1) ctx.lineTo(x, foot);
      }
      ctx.fill();
    }
  }
  return view;
}

function makeScene(renderer) {
  const room = [], sofa = [], bear = [];
  function collect(list) {
    return (shape, color, material, position, size, rotation, extra) => {
      const mesh = object(shape, color, material, position, size, rotation, extra);
      list.push(mesh);
      return mesh;
    };
  }
  const inside = collect(room);
  const upholster = collect(sofa);
  const plush = collect(bear);
  const wallHeight = 3.62;
  const wallBack = -4.08;
  const wallFront = 1.18;
  const roomDepth = wallFront - wallBack;
  const roomCenter = (wallFront + wallBack) / 2;
  const wallRight = 3.30;
  const floorWidth = 2 * wallRight + .08;
  inside("box", 0xffeed9, "wall", [0, wallHeight / 2, wallBack], [floorWidth, wallHeight, .145]);

  const windowZ = roomCenter, windowY = 2.05;
  const windowW = 2.18, windowH = 2.15;
  const windowBottom = windowY - windowH / 2;
  const windowTop = windowY + windowH / 2;
  function wallSection(bottom, top, back, frontEdge) {
    inside("box", 0xf4dfc6, "wall", [wallRight, (bottom + top) / 2, (back + frontEdge) / 2],
      [.145, top - bottom, frontEdge - back], [], { project: 2 });
  }
  wallSection(0, windowBottom, wallBack, wallFront);
  wallSection(windowTop, wallHeight, wallBack, wallFront);
  wallSection(windowBottom, windowTop, wallBack, windowZ - windowW / 2);
  wallSection(windowBottom, windowTop, windowZ + windowW / 2, wallFront);

  const windowFrame = transform(wallRight - .075, windowY, windowZ, 1, 1, 1, 0, -Math.PI / 2);
  const windowParts = [];
  const trim = collect(windowParts);
  const glass = trim("quad", 0xffffff, "view", [0, 0, -.17], [windowW + .05, windowH + .05, 1]);
  glass.texture = renderer.texture(windowArt());
  for (const x of [-windowW / 2, windowW / 2]) {
    trim("box", 0x624732, "wood", [x, 0, 0], [.17, windowH + .10, .34]);
    trim("box", 0xb1935f, "wood", [x, 0, .183], [.16, windowH + .18, .055]);
  }
  for (const y of [-windowH / 2, windowH / 2]) {
    trim("box", 0x745235, "wood", [0, y, 0], [windowW + .18, .154, .34]);
    trim("box", 0xb79764, "wood", [0, y, .174], [.152, windowW + .23, .065], [0, 0, Math.PI / 2]);
  }
  trim("box", 0x96744d, "wood", [0, 0, -.043], [.085, windowH, .095]);
  trim("box", 0x96744d, "wood", [0, -.06, -.043], [.080, windowW, .095], [0, 0, Math.PI / 2]);
  trim("box", 0xa38154, "wood", [0, -windowH / 2 - .096, .128], [windowW + .36, .131, .54]);
  trim("sphere", 0xc09850, "brass", [.096, -.18, .051], [.105, .15, .072]);

  inside("box", 0x9a6949, "wood", [wallRight - .09, .115, roomCenter], [.11, .23, roomDepth]);
  inside("box", 0xc59463, "wood", [wallRight - .01, wallHeight, roomCenter], [.22, .14, roomDepth + .12]);
  inside("box", 0xc0946e, "plain", [wallRight - .06, .40, roomCenter], [.10, .54, roomDepth]);
  inside("box", 0xa27452, "wood", [0, .11, -3.979], [floorWidth - .11, .22, .075]);
  inside("box", 0xd3a878, "wood", [0, wallHeight, wallBack], [floorWidth + .09, .14, .215]);
  inside("box", 0xad754b, "wood", [0, -.104, roomCenter], [floorWidth, .208, roomDepth + .09], [], { project: 1 });
  const rugHeight = .018;
  const sofaAdvance = .64;
  const sofaPose = transform(0, rugHeight, sofaAdvance);
  inside("quad", 0xe2d1b5, "rug", [0, rugHeight, -1.44], [6.02, 4.22, 1], [-Math.PI / 2]);
  inside("quad", 0x513a28, "shadow", [0, .029, -2.66 + sofaAdvance], [5.06, 1.75, 1], [-Math.PI / 2]);

  const sofaZ = -2.87;
  upholster("cushion", 0x7c8a60, "cloth", [0, .43, sofaZ], [4.47, .57, 1.50]);
  upholster("cushion", 0xa9b687, "cloth", [0, 1.26, -3.403], [4.41, 1.30, .61], [-.12]);
  upholster("cushion", 0x75865c, "cloth", [0, .38, -2.11], [4.25, .17, .13]);
  for (const side of [-1, 1]) {
    upholster("cushion", 0xabb989, "cloth", [side * 2.04, .846, -2.835], [.65, .81, 1.62]);
    upholster("sphere", 0xbec89b, "cloth", [side * 2.04, 1.19, -2.88], [.675, .42, 1.56]);
    upholster("cushion", 0xb9c494, "cloth", [side * .85, .64, -2.67], [1.73, .33, 1.04]);
    upholster("cushion", 0xabb787, "cloth", [side * 1.058, 1.28, -3.14], [2.08, 1.08, .36], [-.16]);
    for (const z of [-3.31, -2.27]) {
      upholster("cushion", 0x4a2e1c, "wood", [side * 1.83, .13, z], [.18, .29, .22], [0, 0, side * -.15]);
    }
  }
  for (let i = 0; i < 10; i++) {
    upholster("sphere", 0x87976d, "cloth", [(i - 4.5) * .382, 1.55, -2.96], [.068, .068, .041]);
  }
  upholster("cushion", 0xd9ad84, "cloth", [-1.51, 1.11, -2.972], [.72, .69, .33], [.14, -.16, -.29]);
  upholster("cushion", 0xe1b06d, "cloth", [1.55, 1.08, -2.974], [.66, .67, .33], [.12, .14, .24]);
  upholster("cushion", 0xad6951, "cloth", [1.47, .96, -2.73], [.65, .40, .19], [.11, -.32, -.13]);

  const portraitX = -1.71, portraitY = 2.72;
  inside("box", 0x3f2a1c, "wood", [portraitX, portraitY, -3.932], [1.47, 1.146, .109]);
  inside("box", 0xab8149, "brass", [portraitX, portraitY, -3.864], [1.412, 1.09, .05]);
  inside("box", 0xc0a16c, "plain", [portraitX, portraitY, -3.832], [1.329, .999, .025]);
  const family = makeFamily(renderer);
  const familyScale = .272;
  const familyRoot = transform(portraitX, portraitY, -3.804, familyScale, familyScale, familyScale);

  const calendarX = 1.72, calendarY = 2.66;
  inside("box", 0x472d1d, "wood", [calendarX, calendarY, -3.934], [1.11, 1.30, .068]);
  const artwork = inside("quad", 0xffffff, "calendar", [calendarX, calendarY, -3.897], [1.02, 1.21, 1]);
  artwork.texture = renderer.texture(calendarArt());
  inside("sphere", 0x967044, "brass", [calendarX, calendarY + .659, -3.915], [.091, .119, .081]);

  const lampX = -2.77, lampZ = -2.62;
  inside("quad", 0xf8dca3, "shadow", [lampX, 1.60, -3.994], [1.78, 1.62, 1]);
  inside("sphere", 0x976341, "wood", [lampX, .68, lampZ], [.76, .145, .70]);
  for (const angle of [0, 2.1, 4.2]) {
    const x = Math.cos(angle), z = Math.sin(angle);
    room.push(stick([lampX + x * .29, .06, lampZ + z * .27],
      [lampX + x * .22, .66, lampZ + z * .21], .095, .096, "cushion", 0x815538, "wood"));
  }
  inside("turnedBase", 0x9c7242, "brass", [lampX, .985, lampZ], [.42, .49, .42]);
  inside("sphere", 0xb68a52, "brass", [lampX, 1.231, lampZ], [.109, .109, .109]);
  inside("cushion", 0x9c784c, "brass", [lampX, 1.478, lampZ], [.033, .466, .033]);
  inside("sphere", 0xffd994, "glow", [lampX, 1.366, lampZ], [.141, .182, .141]);
  inside("shade", 0xf9e3bc, "linenShade", [lampX, 1.464, lampZ], [.73, .473, .73]);
  inside("sphere", 0xb18653, "brass", [lampX, 1.707, lampZ], [.080, .043, .080]);

  const tableX = 2.58, tableZ = -1.70;
  inside("sphere", 0x916241, "wood", [tableX, .68, tableZ], [.91, .126, .90]);
  for (const angle of [0, 2.1, 4.2]) {
    const x = Math.cos(angle), z = Math.sin(angle);
    room.push(stick([tableX + x * .38, .065, tableZ + z * .38],
      [tableX + x * .24, .67, tableZ + z * .24], .10, .108, "cushion", 0x6a492b, "wood"));
  }
  for (const [color, dx, y, angle] of [[0x553d2b, 0, .765, .13], [0x8f5c44, .05, .827, -.17], [0x60684c, .02, .884, .06]]) {
    inside("box", 0x9e8c66, "plain", [tableX + dx, y, tableZ], [.42, .043, .28], [0, angle]);
    for (const offset of [-.022, .022]) {
      inside("box", color, "cloth", [tableX + dx, y + offset, tableZ], [.45, .018, .305], [0, angle]);
    }
  }
  inside("sphere", 0x8f6c46, "plain", [tableX + .27, .869, tableZ - .10], [.179, .274, .176]);
  for (let i = 0; i < 5; i++) {
    const angle = i * 2.39;
    const tip = [tableX + .27 + Math.sin(angle) * .123, 1.272 + .045 * Math.sin(i), tableZ - .10 + Math.cos(angle) * .13];
    room.push(stick([tableX + .27, .967, tableZ - .10], tip, .014, .015, "cushion", 0x917048, "plain"));
    inside("sphere", i % 2 ? 0xa07b46 : 0xa48857, "cloth", tip, [.071, .09, .066]);
  }

  const bodyColor = 0xca884d, headColor = 0xe3a85f, padColor = 0xffdca7;
  const zBear = -2.57;
  const bearScale = .72, seatHeight = .795;
  const bearPose = multiply(sofaPose, transform(0, seatHeight * (1 - bearScale), zBear * (1 - bearScale),
    bearScale, bearScale, bearScale));
  plush("quad", 0x21170d, "shadow", [0, .81, zBear + .03], [1.76, .80, 1], [-Math.PI / 2]);
  plush("sphere", bodyColor, "fur", [0, 1.353, zBear], [1.17, 1.31, .862], [.10, 0, -.04]);
  plush("sphere", 0xe5ab68, "fur", [0, 1.295, zBear + .274], [.903, 1.07, .387], [.12]);
  for (const side of [-1, 1]) {
    plush("sphere", 0xd89959, "fur", [side * .536, 2.687, zBear + .073], [.493, .493, .313], [.08, 0, side * -.24]);
    plush("sphere", 0xe69a83, "fur", [side * .546, 2.702, zBear + .201], [.303, .295, .103], [.08, 0, side * -.24]);
    plush("sphere", bodyColor, "fur", [side * .473, 1.003, zBear + .28], [.60, .55, .89], [.22, side * -.35, side * -.19]);
    plush("sphere", headColor, "fur", [side * .600, .924, zBear + .622], [.543, .535, .513], [.18, 0, side * -.20]);
    plush("sphere", padColor, "fur", [side * .625, .939, zBear + .805], [.421, .404, .158], [-.14, side * -.21, side * -.16]);
  }
  plush("sphere", headColor, "fur", [0, 2.249, zBear + .08], [1.474, 1.231, .999], [.055, 0, -.025]);
  plush("sphere", padColor, "fur", [0, 2.076, zBear + .502], [.685, .426, .347], [.055, 0, -.02]);
  for (const side of [-1, 1]) {
    plush("sphere", 0xe9947b, "fur", [side * .487, 2.175, zBear + .455], [.198, .098, .065], [.05, side * .38, side * .13]);
    plush("sphere", 0x513432, "glass", [side * .276, 2.318, zBear + .558], [.169, .207, .100], [0, side * .15, 0]);
    plush("sphere", 0xfff5dd, "glow", [side * .276 - .027, 2.355, zBear + .599], [.054, .061, .023]);
    plush("sphere", 0xf4c6a7, "glow", [side * .276 + .026, 2.28, zBear + .603], [.018, .020, .012]);
  }
  plush("sphere", 0x623938, "glass", [0, 2.137, zBear + .658], [.207, .132, .103], [-.2]);
  plush("sphere", 0x41271d, "plain", [0, 2.089, zBear + .668], [.132, .097, .082]);
  bear.push(stick([0, 2.098, zBear + .691], [0, 1.997, zBear + .671], .024, .026, "sphere", 0x513122, "plain"));
  for (const side of [-1, 1]) {
    bear.push(stick([0, 2.006, zBear + .671], [side * .101, 1.978, zBear + .650], .021, .019, "sphere", 0x543225, "plain"));
  }

  const mapW = 1.78;
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
    load(art.map, image => {
      const texture = renderer.texture(image);
      pages.forEach(page => { page.texture = texture; });
      redraw();
    });
  }

  function render(progress, width, height, reduced, interaction) {
    const returnToRoom = smooth(.46, .67, progress);
    const portraitMove = smooth(.68, .96, progress);
    const storyProgress = progress <= .46 ? clamp(progress / .39) : mix(1, roomStop, returnToRoom);
    const p = reduced ? (storyProgress < .22 ? 0 : storyProgress < .58 ? roomStop : storyProgress < .89 ? .74 : 1) : storyProgress;
    const aspect = width / height;
    const roomWidth = mix(mix(.58, 1, smooth(.82, 1.73, aspect)), 1, portraitMove);
    const wide = smooth(.58, 1.65, aspect);
    const approach = smooth(0, roomStop, p);
    const close = smooth(.47, .77, p);
    const unfold = smooth(.43, .73, p);
    const face = smooth(.74, .99, p);
    const mapY = rugHeight + mix(1.08, 1.005, unfold);
    const mapZ = zBear + sofaAdvance + mix(.61, .98, unfold);

    const pitch = .044;
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
    const mapRoot = transform(0, mapY, mapZ, 1, 1, 1, mix(-.96, -pitch, unfold), -.12 * oblique);

    const portraitPose = multiply(transform(0, 0, 0, roomWidth, 1, 1), familyRoot);
    const portraitCenter = point(portraitPose, 0, .04, .48);
    const portraitTan = .43;
    const portraitFitY = Math.max(.48, Math.min(.78, 1 - 120 / height));
    const portraitDistance = Math.max(1.47 * roomWidth / (2 * portraitTan * aspect * .88),
      1.146 / (2 * portraitTan * portraitFitY));
    const portraitCamera = {
      x: portraitCenter[0], y: portraitCenter[1], z: portraitCenter[2] + portraitDistance,
      targetX: portraitCenter[0], targetY: portraitCenter[1], targetZ: portraitCenter[2],
      tan: portraitTan,
    };
    for (const key of Object.keys(portraitCamera)) camera[key] = mix(camera[key], portraitCamera[key], portraitMove);

    const sheets = family.papers(interaction, roomWidth);
    if (interaction.selected) {
      const paper = sheets[interaction.selected];
      const center = point(portraitPose, ...paper.center);
      const tan = .43;
      const sheetFitY = Math.max(.48, Math.min(.95, 1 - 90 / height));
      const paperDistance = Math.max(
        paper.size[0] * familyScale * roomWidth / (2 * tan * aspect * .95),
        paper.size[1] * familyScale / (2 * tan * sheetFitY));
      const paperCamera = {
        x: center[0], y: center[1], z: center[2] + .011 * familyScale + paperDistance,
        targetX: center[0], targetY: center[1], targetZ: center[2], tan,
      };
      for (const key of Object.keys(paperCamera)) camera[key] = mix(camera[key], paperCamera[key], interaction.zoom);
    }

    renderer.resize(width, height);
    renderer.frame(camera);
    const adjustedRoom = transform(0, 0, 0, roomWidth, 1, 1);
    for (const mesh of room) renderer.draw(mesh, adjustedRoom);
    const couchPose = multiply(adjustedRoom, sofaPose);
    for (const mesh of sofa) renderer.draw(mesh, couchPose);
    const windowPose = multiply(adjustedRoom, windowFrame);
    for (const mesh of windowParts) renderer.draw(mesh, windowPose);
    for (const mesh of bear) renderer.draw(mesh, bearPose);
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
      const grip = point(pose, side * (pageW / 2 - .026), mix(-.13, .015, unfold), -.013);
      const shoulder = point(bearPose, side * .467, 1.74, zBear + .04);
      const elbow = point(bearPose, side * mix(.686, .795, unfold), 1.34, zBear + .40);
      const armPosition = interpolate(shoulder, elbow, .58);
      renderer.draw(stick(shoulder, interpolate(elbow, shoulder, -.26), .31, .30, "sphere", bodyColor, "fur"));
      renderer.draw(stick(armPosition, interpolate(grip, armPosition, -.18), .248, .276, "sphere", bodyColor, "fur"));
      renderer.draw(object("sphere", headColor, "fur", grip, [.223, .229, .213], [-.15, 0, side * .24]));
      const pawPad = point(pose, side * (pageW / 2 - .064), mix(-.155, -.010, unfold), .069);
      renderer.draw(object("sphere", padColor, "fur", pawPad, [.119, .120, .055], [0, 0, side * .23]));
    }
    family.render(portraitPose, interaction, roomWidth);
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
      parents: screenBounds(0, .61, 3.88, 2.18, .70),
      child: screenBounds(0, -.80, 1.48, 1.82, 1.25),
    };
  }

  return { loadArt, render, roomStop };
}
