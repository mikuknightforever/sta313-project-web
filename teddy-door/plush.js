"use strict";

// Downloaded "Teddy bears" by hectopod, CC BY 4.0. The original mesh,
// corner normals, UVs and arm weights are preserved by the offline export.
// See assets/teddy-bear/SOURCE.md for provenance and the reproducible conversion.
function makePlush(renderer) {
  const asset = window.teddyAsset;
  if (!asset) throw new Error("The downloaded teddy model is missing.");
  const decode = encoded => {
    const bytes = Uint8Array.from(atob(encoded), character => character.charCodeAt(0));
    return new Float32Array(bytes.buffer);
  };
  // The source cloth has separate stitched pieces. Group its existing faces
  // once, so the head and ears can turn at the neck while the paws hold still.
  function splitHeadCloth(vertices) {
    const triangleStride = 30, count = vertices.length / triangleStride;
    const parent = Uint32Array.from({ length: count }, (_, index) => index);
    const shared = new Map();
    const rootOf = index => {
      while (parent[index] !== index) {
        parent[index] = parent[parent[index]];
        index = parent[index];
      }
      return index;
    };
    for (let triangle = 0; triangle < count; triangle++) {
      for (let corner = 0; corner < 3; corner++) {
        const i = triangle * triangleStride + corner * 10;
        const key = vertices[i] + "," + vertices[i + 1] + "," + vertices[i + 2];
        if (shared.has(key)) parent[rootOf(triangle)] = rootOf(shared.get(key));
        else shared.set(key, triangle);
      }
    }
    const lowest = new Float32Array(count).fill(Infinity);
    for (let triangle = 0; triangle < count; triangle++) {
      const root = rootOf(triangle), i = triangle * triangleStride;
      lowest[root] = Math.min(lowest[root], vertices[i + 1], vertices[i + 11], vertices[i + 21]);
    }
    const neckY = Math.min(...asset.shoulders.map(position => position[1])) - .025;
    const headFaces = [], bodyFaces = [];
    for (let triangle = 0; triangle < count; triangle++) {
      const group = lowest[rootOf(triangle)] > neckY ? headFaces : bodyFaces;
      const i = triangle * triangleStride;
      group.push(...vertices.subarray(i, i + triangleStride));
    }
    return [{ vertices: new Float32Array(bodyFaces), head: false },
      { vertices: new Float32Array(headFaces), head: true }];
  }

  const parts = asset.parts.flatMap((part, index) => {
    const vertices = decode(part.vertices);
    const groups = part.name === "Object_7" ? splitHeadCloth(vertices) : [{ vertices, head: true }];
    const importedMaterial = { ...part.material, normalTexture: null };
    if (part.name === "Object_7") importedMaterial.inkWidth = 1.7;
    if (part.name === "Object_7_muzzle") importedMaterial.inkWidth = .85;
    // Web-only toon treatment; the exported asset keeps the author's colours.
    if (part.name === "Object_7") importedMaterial.baseColorFactor = [.36, .205, .12, 1];
    if (part.name === "Object_7_muzzle") importedMaterial.baseColorFactor = [.70, .48, .29, 1];
    if (part.name === "Object_10") importedMaterial.eyeGloss = true;
    return groups.map((group, subIndex) => {
      const name = "downloadedTeddy" + index + (subIndex ? "Head" : "");
      renderer.mesh(name, group.vertices, 10);
      return { shape: name, head: group.head, model: transform(0, 0, 0), color: [1, 1, 1],
        material: 18, importedMaterial };
    });
  });
  // The toon web export omits the fabric texture; the archived GLB retains it.
  const ready = !asset.normalMap ? Promise.resolve() : new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const texture = renderer.texture(image, { flipY: false, repeat: true, colorSpace: "linear" });
      for (const part of parts) {
        if (part.importedMaterial.hasNormalMap) part.importedMaterial.normalTexture = texture;
      }
      resolve();
    };
    image.onerror = () => reject(new Error("The teddy fabric normal map could not be loaded."));
    image.src = asset.normalMap;
  });

  const subtract = (a, b) => a.map((v, i) => v - b[i]);
  const dot = (a, b) => a.reduce((sum, v, i) => sum + v * b[i], 0);
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const normalized = a => { const length = Math.hypot(...a); return a.map(v => v / length); };

  function armMatrix(origin, rest, target) {
    const oldAxis = subtract(rest, origin), newAxis = subtract(target, origin);
    const a = normalized(oldAxis), b = normalized(newAxis);
    const axis = cross(a, b), cosine = Math.max(-.999, dot(a, b));
    const rotate = p => {
      const first = cross(axis, p), second = cross(axis, first);
      return p.map((v, i) => v + first[i] + second[i] / (1 + cosine));
    };
    // Rotate the author's arms around their original shoulders without stretching.
    const columns = [0, 1, 2].map(j => rotate([0, 1, 2].map(i => i === j ? 1 : 0)));
    const offset = origin.map((v, i) => v - columns.reduce((sum, column, j) => sum + column[i] * origin[j], 0));
    return new Float32Array([...columns[0], 0, ...columns[1], 0, ...columns[2], 0, ...offset, 1]);
  }

  function rig(grips = asset.wrists) {
    return asset.shoulders.map((shoulder, index) => armMatrix(shoulder, asset.wrists[index], grips[index]));
  }
  let lastGrips = asset.wrists;
  const neck = asset.shoulders[0].map((value, axis) => (value + asset.shoulders[1][axis]) / 2);
  function render(root, grips = asset.wrists, clay = false, headYaw = 0) {
    lastGrips = grips;
    const skin = rig(grips);
    const headRoot = headYaw ? multiply(root, multiply(transform(...neck, 1, 1, 1, 0, headYaw),
      transform(-neck[0], -neck[1], -neck[2]))) : root;
    for (const part of parts) {
      renderer.draw({ ...part, skin,
        material: clay ? 17 : 18,
        color: clay ? hex(0xb9b7b2) : part.color }, part.head ? headRoot : root);
    }
  }
  return { render, rig, ready, geometry: asset, parts,
    get lastGrips() { return lastGrips; } };
}
