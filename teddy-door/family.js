"use strict";

function makeFamily(renderer) {
  // The interactive figures belong to the picture; keep their depth and local
  // lighting without projecting oversized character shadows across the wall.
  const drawPortrait = (part, root) => renderer.draw({ ...part, castShadow: false }, root);
  const figures = [];
  const parents = [];
  const child = [];
  const paperColor = 0xf8eedc;

  function add(list, shape, color, material, position, size, rotation = []) {
    const mesh = object(shape, color, material, position, size, rotation);
    list.push(mesh);
    return mesh;
  }

  function character(list, x, y, z, size, fur, clothes, isMother) {
    const pose = transform(x, y, z, size, size, size);
    const parts = [];
    const sphere = (color, material, position, dimensions, rotation) =>
      add(parts, "sphere", color, material, position, dimensions, rotation);

    // A deeper torso, tucked ears and a continuous cheek shape keep the
    // portrait figures in the same stuffed-toy family as the seated bear.
    sphere(clothes, "cloth", [0, -.74, -.005], [.90, 1.13, .63]);
    for (const side of [-1, 1]) {
      sphere(fur, "fur", [side * .408, .387, -.024], [.355, .374, .285], [0, side * -.12, side * -.14]);
      sphere(0xa97957, "cloth", [side * .416, .397, .103], [.201, .223, .058], [0, side * -.12, side * -.14]);
      sphere(fur, "fur", [side * .25, -1.21, .025], [.39, .32, .43], [.10, side * -.13, side * -.08]);
      sphere(0xe8ceb0, "cloth", [side * .258, -1.225, .206], [.215, .175, .056], [.10, side * -.13, side * -.08]);
    }
    add(parts, "bearHead", fur, "fur", [0, 0, .018], [1.10, 1.01, .69]);
    sphere(0xf0d7b1, "fur", [0, -.181, .316], [.537, .322, .247]);
    for (const side of [-1, 1]) {
      sphere(0x34251d, "glass", [side * .201, .038, .320], [.102, .119, .067], [0, side * .10]);
      sphere(0xfff5e2, "glow", [side * .201 - .017, .061, .349], [.024, .025, .010]);
    }
    sphere(0x5e4030, "cloth", [0, -.123, .434], [.151, .091, .083], [-.10]);
    parts.push(stick([0, -.163, .466], [0, -.231, .437], .010, .010, "sphere", 0x765039, "cloth"));
    for (const side of [-1, 1]) {
      parts.push(stick([0, -.229, .438], [side * .041, -.248, .429], .010, .010, "sphere", 0x765039, "cloth"));
      parts.push(stick([side * .041, -.248, .429], [side * .076, -.231, .422], .010, .010, "sphere", 0x765039, "cloth"));
    }

    if (isMother) {
      for (const side of [-1, 1]) {
        sphere(0xb67c78, "cloth", [.36 + side * .089, .401, .156], [.208, .151, .101], [0, 0, side * .31]);
      }
      sphere(0xc48e85, "cloth", [.36, .401, .205], [.075, .089, .066]);
      for (const side of [-1, 1]) {
        add(parts, "cushion", 0xe7d7be, "cloth", [side * .116, -.466, .233], [.24, .14, .070], [0, 0, side * .22]);
      }
      for (const y of [-.72, -.92]) sphere(0xd8baa0, "wood", [0, y, .308], [.047, .047, .023]);
    } else if (size > 1) {
      add(parts, "cushion", 0xe8dcc4, "cloth", [0, -.447, .218], [.37, .12, .062], [0, 0, -.035]);
      for (const side of [-1, 1]) {
        sphere(0x8e6d51, "cloth", [side * .079, -.474, .261], [.168, .104, .070], [0, 0, side * -.27]);
      }
      sphere(0x75553e, "cloth", [0, -.475, .301], [.066, .074, .038]);
      for (const b of [-.78, -.99]) sphere(0xd5b68a, "wood", [0, b, .298], [.047, .047, .026]);
    } else {
      for (const side of [-1, 1]) {
        add(parts, "cushion", 0x8b9d82, "cloth", [side * .257, -.65, .261], [.083, .43, .050], [0, 0, side * .10]);
        sphere(0xd7bc8d, "wood", [side * .257, -.69, .294], [.052, .052, .024]);
      }
    }
    for (const part of parts) {
      part.model = multiply(pose, part.model);
      list.push(part);
    }
  }

  character(parents, -.82, .88, .10, 1.10, 0xb98250, 0x899d7c, false);
  character(parents, .82, .88, .13, 1.08, 0xc89660, 0xb2787b, true);
  character(child, 0, -.43, .93, .80, 0xd3a46e, 0xd7b68b, false);

  const background = add(figures, "quad", 0xefcfaa, "plain", [0, 0, -.02], [4.40, 3.48, 1]);
  const painted = document.createElement("canvas");
  painted.width = 880;
  painted.height = 696;
  const ctx = painted.getContext("2d");
  const glow = ctx.createRadialGradient(440, 260, 30, 440, 330, 560);
  glow.addColorStop(0, "#ffe8bf");
  glow.addColorStop(1, "#d9aa84");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 880, 696);
  ctx.strokeStyle = "#f7dfb4";
  ctx.lineWidth = 2;
  for (let i = 0; i < 15; i++) {
    const x = 42 + (i * 179) % 790, y = 38 + (i * 137) % 615;
    ctx.beginPath();
    ctx.moveTo(x - 7, y);
    ctx.lineTo(x + 7, y);
    ctx.moveTo(x, y - 7);
    ctx.lineTo(x, y + 7);
    ctx.stroke();
  }
  background.material = materials.portrait;
  background.color = hex(0xffffff);
  background.texture = renderer.texture(painted);

  function papers(state, xScale) {
    // Blend the end of the lift into the reach after the lower edge clears
    // the cub. The same path stays clear when lowering the sheet again.
    const soften = (start, end, value) => {
      const t = clamp((value - start) / (end - start));
      return t * t * t * (10 + t * (-15 + 6 * t));
    };
    const parentLift = soften(0, .76, state.parents);
    const parentReach = soften(.65, 1, state.parents);
    const parentY = mix(-.59, 1.13, parentLift);
    const parentZ = mix(.56, 1.43, parentReach);
    const childReach = smooth(0, 1, state.child);
    const childLift = smooth(.18, 1, state.child);
    const childY = mix(-1.17, -.99, childLift);
    // Keep the sheet's rear surface ahead of the deeper plush torso and
    // overalls throughout the lift, including its resting pose.
    const childZ = mix(1.30, 1.80, childReach);
    const parentSize = [2.20, 2.20 / Math.SQRT2];
    const childSize = [1.05, 1.05 / Math.SQRT2];
    const selected = state.selected;
    const parentW = parentSize[0] / mix(1, xScale, selected === "parents" ? state.zoom : 0);
    const childW = childSize[0] / mix(1, xScale, selected === "child" ? state.zoom : 0);

    return {
      parents: { center: [0, parentY, parentZ], size: [parentW, parentSize[1]] },
      child: { center: [0, childY, childZ], size: [childW, childSize[1]] },
    };
  }

  function hands(root, paper, who) {
    const [x, y, z] = paper.center;
    const width = paper.size[0];
    const isChild = who === "child";
    const pawSize = isChild ? .17 : .235;
    for (const side of [-1, 1]) {
      const shoulder = isChild
        ? [side * .31, -.93, 1.02]
        : [side * 1.17, .28, .16];
      const grip = [
        x + side * (width / 2 + pawSize * .27),
        y - .015,
        z + .008,
      ];
      // The palm curls behind the sheet and the thumb rests on its front.
      // The paper mesh's gently bowed edge is at z + .025.
      const wrist = [grip[0], grip[1] - pawSize * .18, grip[2] - pawSize * .43];
      const elbow = interpolate(shoulder, wrist, .46);
      elbow[1] -= isChild ? .05 : .16;
      const fur = isChild ? 0xd3a46e : side < 0 ? 0xb98250 : 0xc89660;
      drawPortrait(stick(shoulder, interpolate(elbow, wrist, .12), pawSize * 1.35, pawSize * 1.24, "sphere", fur, "fur"), root);
      drawPortrait(stick(interpolate(shoulder, elbow, .84), wrist, pawSize * 1.18, pawSize, "sphere", fur, "fur"), root);
      drawPortrait(object("sphere", fur, "fur", grip, [pawSize, pawSize * 1.19, pawSize * .88], [0, side * -.16, side * -.15]), root);
      drawPortrait(object("sphere", 0xe8ceb0, "cloth",
        [grip[0] + side * pawSize * .11, grip[1] - pawSize * .06, z + pawSize * .445],
        [pawSize * .42, pawSize * .57, pawSize * .12], [0, side * -.16, side * -.15]), root);
      drawPortrait(object("sphere", fur, "fur",
        [x + side * (width / 2 - pawSize * .12), y + pawSize * .10, z + .056],
        [pawSize * .48, pawSize * .62, pawSize * .46], [0, side * .14, side * -.32]), root);
    }
  }

  function render(root, state, xScale, boardSize) {
    const sheets = papers(state, xScale);
    background.model = transform(0, 0, -.02, boardSize[0], boardSize[1], 1);
    for (const part of figures) drawPortrait(part, root);
    for (const part of parents) drawPortrait(part, root);
    for (const part of child) drawPortrait(part, root);
    for (const who of ["parents", "child"]) {
      const paper = sheets[who];
      drawPortrait(object("paper", paperColor, "paper", paper.center, [...paper.size, 1]), root);
      hands(root, paper, who);
    }
    return sheets;
  }

  return { render, papers };
}
