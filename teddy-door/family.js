"use strict";

function makeFamily(renderer) {
  const figures = [];
  const parents = [];
  const child = [];
  const paperColor = 0xffffff;

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

    sphere(clothes, "cloth", [0, -.73, -.07], [.94, 1.16, .46]);
    for (const side of [-1, 1]) {
      sphere(fur, "fur", [side * .43, .41, -.02], [.39, .39, .22]);
      sphere(0xefad91, "fur", [side * .435, .42, .088], [.231, .231, .049]);
      sphere(fur, "fur", [side * .25, -1.23, -.01], [.38, .33, .33]);
      sphere(0xfbe1b8, "fur", [side * .25, -1.24, .12], [.22, .19, .08]);
    }
    sphere(fur, "fur", [0, 0, .0], [1.17, 1.03, .51]);
    sphere(0xffdfb1, "fur", [0, -.18, .236], [.55, .34, .16]);
    for (const side of [-1, 1]) {
      sphere(0x503333, "glass", [side * .214, .016, .234], [.127, .164, .072]);
      sphere(0xfff6de, "glow", [side * .214 - .020, .047, .270], [.040, .046, .013]);
      sphere(0xe99586, "fur", [side * .373, -.108, .215], [.154, .069, .037]);
    }
    sphere(0x634038, "glass", [0, -.139, .330], [.17, .109, .08]);
    parts.push(stick([0, -.181, .339], [0, -.245, .333], .016, .017, "sphere", 0x684235, "plain"));
    for (const side of [-1, 1]) {
      parts.push(stick([0, -.242, .333], [side * .075, -.266, .319], .016, .016, "sphere", 0x684235, "plain"));
    }

    if (isMother) {
      for (const side of [-1, 1]) {
        sphere(0xcc777a, "cloth", [.37 + side * .105, .40, .15], [.24, .16, .075], [0, 0, side * .33]);
      }
      sphere(0xf4d2aa, "brass", [.37, .4, .19], [.095, .095, .048]);
      for (let i = 0; i < 7; i++) {
        const a = Math.PI * (i / 6);
        sphere(0xffe2bf, "plain", [Math.cos(a) * .22, -.44 - Math.sin(a) * .10, .171], [.045, .045, .036]);
      }
    } else if (size > 1) {
      add(parts, "cushion", 0xf5e6c4, "cloth", [0, -.443, .15], [.36, .11, .045], [0, 0, -.05]);
      for (const side of [-1, 1]) {
        sphere(0x8f6349, "cloth", [side * .094, -.476, .181], [.18, .104, .062], [0, 0, side * -.3]);
      }
      sphere(0x624632, "cloth", [0, -.475, .212], [.07, .07, .029]);
      for (const b of [-.78, -.99]) sphere(0xf3ce91, "brass", [0, b, .174], [.054, .054, .033]);
    } else {
      for (const side of [-1, 1]) {
        add(parts, "cushion", 0x8b9d82, "cloth", [side * .285, -.66, .178], [.081, .43, .048], [0, 0, side * .10]);
        sphere(0xf8d493, "brass", [side * .285, -.69, .205], [.06, .06, .023]);
      }
    }
    for (const part of parts) {
      part.model = multiply(pose, part.model);
      list.push(part);
    }
  }

  character(parents, -.82, .88, .10, 1.10, 0xca8b55, 0x899d7c, false);
  character(parents, .82, .88, .13, 1.08, 0xdfa466, 0xb2787b, true);
  character(child, 0, -.43, .93, .80, 0xe9b46d, 0xe2b15f, false);

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
    const parentY = mix(-.37, 1.13, parentLift);
    const parentZ = mix(.56, 1.43, parentReach);
    const childReach = smooth(0, 1, state.child);
    const childLift = smooth(.18, 1, state.child);
    const childY = mix(-1.141, -.981, childLift);
    const childZ = mix(1.15, 1.72, childReach);
    const parentSize = [2.65, 2.65 / Math.SQRT2];
    const childSize = [1.18, 1.18 / Math.SQRT2];
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
    const radius = isChild ? .135 : .19;
    for (const side of [-1, 1]) {
      const shoulder = isChild
        ? [side * .31, -.93, 1.02]
        : [side * 1.17, .28, .16];
      const grip = [
        x + side * (width / 2 + radius / 2 + .006),
        y - .01,
        z - .012,
      ];
      // Both round paws sit beside the sheet, with the forearms behind it.
      const wrist = [grip[0], grip[1], grip[2] - radius * .48];
      const elbow = interpolate(shoulder, wrist, .46);
      elbow[1] -= isChild ? .05 : .16;
      const fur = isChild ? 0xe9b46d : side < 0 ? 0xca8b55 : 0xdfa466;
      renderer.draw(stick(shoulder, elbow, radius * 1.5, radius * 1.4, "sphere", fur, "fur"), root);
      renderer.draw(stick(elbow, wrist, radius * 1.4, radius * 1.1, "sphere", fur, "fur"), root);
      renderer.draw(object("sphere", fur, "fur", grip, [radius, radius * 1.04, radius * .96]), root);
    }
  }

  function render(root, state, xScale, boardSize) {
    const sheets = papers(state, xScale);
    background.model = transform(0, 0, -.02, boardSize[0], boardSize[1], 1);
    for (const part of figures) renderer.draw(part, root);
    for (const part of parents) renderer.draw(part, root);
    for (const part of child) renderer.draw(part, root);
    for (const who of ["parents", "child"]) {
      const paper = sheets[who];
      renderer.draw(object("box", 0xd5c1a4, "plain", paper.center, [...paper.size, .019]), root);
      renderer.draw(object("quad", paperColor, "glow",
        [paper.center[0], paper.center[1], paper.center[2] + .011], [...paper.size, 1]), root);
      hands(root, paper, who);
    }
    return sheets;
  }

  return { render, papers };
}
