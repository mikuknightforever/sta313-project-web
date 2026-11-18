"use strict";

function multiply(a, b) {
  const result = new Float32Array(16);
  for (let column = 0; column < 16; column += 4) {
    for (let row = 0; row < 4; row++) {
      result[column + row] = a[row] * b[column] + a[row + 4] * b[column + 1]
        + a[row + 8] * b[column + 2] + a[row + 12] * b[column + 3];
    }
  }
  return result;
}

function transform(x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) {
  const cx = Math.cos(rx), ax = Math.sin(rx);
  const cy = Math.cos(ry), ay = Math.sin(ry);
  const cz = Math.cos(rz), az = Math.sin(rz);
  return new Float32Array([
    cz * cy * sx, az * cy * sx, -ay * sx, 0,
    (cz * ay * ax - az * cx) * sy, (az * ay * ax + cz * cx) * sy, cy * ax * sy, 0,
    (cz * ay * cx + az * ax) * sz, (az * ay * cx - cz * ax) * sz, cy * cx * sz, 0,
    x, y, z, 1,
  ]);
}

function viewAt({ x, y, z, targetX, targetY, targetZ }) {
  const dx = x - targetX, dy = y - targetY, dz = z - targetZ;
  const length = Math.hypot(dx, dy, dz);
  const groundLength = Math.hypot(dx, dz);
  const fx = dx / length, fy = dy / length, fz = dz / length;
  const rx = dz / groundLength, rz = -dx / groundLength;
  const ux = fy * rz, uy = fz * rx - fx * rz, uz = -fy * rx;
  return new Float32Array([
    rx, ux, fx, 0,
    0, uy, fy, 0,
    rz, uz, fz, 0,
    -rx * x - rz * z, -ux * x - uy * y - uz * z, -fx * x - fy * y - fz * z, 1,
  ]);
}

function perspective(tan, aspect) {
  const near = .035, far = 40;
  return new Float32Array([
    1 / (tan * aspect), 0, 0, 0,
    0, 1 / tan, 0, 0,
    0, 0, (far + near) / (near - far), -1,
    0, 0, 2 * far * near / (near - far), 0,
  ]);
}

function boxGeometry() {
  const data = [];
  const face = (normal, a, b, c, d) => {
    const vertex = (p, u, v) => data.push(...p, ...normal, u, v);
    vertex(a, 0, 0); vertex(b, 1, 0); vertex(c, 1, 1);
    vertex(a, 0, 0); vertex(c, 1, 1); vertex(d, 0, 1);
  };
  const q = .5;
  face([0, 0, 1], [-q, -q, q], [q, -q, q], [q, q, q], [-q, q, q]);
  face([0, 0, -1], [q, -q, -q], [-q, -q, -q], [-q, q, -q], [q, q, -q]);
  face([1, 0, 0], [q, -q, q], [q, -q, -q], [q, q, -q], [q, q, q]);
  face([-1, 0, 0], [-q, -q, -q], [-q, -q, q], [-q, q, q], [-q, q, -q]);
  face([0, 1, 0], [-q, q, q], [q, q, q], [q, q, -q], [-q, q, -q]);
  face([0, -1, 0], [-q, -q, -q], [q, -q, -q], [q, -q, q], [-q, -q, q]);
  return data;
}

function globeGeometry(roundness, segments = 40, rings = 28) {
  const points = [];
  for (let row = 0; row <= rings; row++) {
    const polar = row / rings * Math.PI;
    for (let col = 0; col <= segments; col++) {
      const azimuth = col / segments * Math.PI * 2;
      const sphere = [Math.sin(polar) * Math.cos(azimuth), Math.cos(polar), Math.sin(polar) * Math.sin(azimuth)];
      const pow = (value, power) => Math.sign(value) * Math.pow(Math.abs(value), power);
      const p = sphere.map(value => pow(value, roundness) * .5);
      const n = sphere.map(value => pow(value, 2 - roundness));
      points.push([...p, ...n, col / segments, 1 - row / rings]);
    }
  }
  const result = [];
  for (let row = 0; row < rings; row++) {
    for (let col = 0; col < segments; col++) {
      const a = row * (segments + 1) + col;
      const b = a + segments + 1;
      result.push(...points[a], ...points[b], ...points[a + 1], ...points[a + 1], ...points[b], ...points[b + 1]);
    }
  }
  return result;
}

// A softly filled head: the lower cheeks are wider than the forehead. The
// inverse Jacobian gives continuous normals for the deformation, including
// the poles; duplicated seam vertices have identical positions and normals.
function bearHeadGeometry(segments = 48, rings = 32) {
  const points = [];
  for (let row = 0; row <= rings; row++) {
    const polar = row / rings * Math.PI;
    const y = Math.cos(polar);
    const radius = row === 0 || row === rings ? 0 : Math.sin(polar);
    const width = .99 - .075 * y - .045 * y * y;
    const depth = .98 - .03 * y;
    const dWidth = -.075 - .09 * y;
    for (let col = 0; col <= segments; col++) {
      const azimuth = (col % segments) / segments * Math.PI * 2;
      const x = radius * Math.cos(azimuth), z = radius * Math.sin(azimuth);
      const normal = [x / width, y - x * x * dWidth / width + z * z * .03 / depth, z / depth];
      const length = Math.hypot(...normal);
      points.push([x * width * .5, y * .5, z * depth * .5,
        ...normal.map(value => value / length), col / segments, 1 - row / rings]);
    }
  }
  const data = [];
  for (let row = 0; row < rings; row++) {
    for (let col = 0; col < segments; col++) {
      const a = row * (segments + 1) + col, b = a + segments + 1;
      // Omit the collapsed half of each polar quad.
      if (row > 0) data.push(...points[a], ...points[a + 1], ...points[b]);
      if (row < rings - 1) data.push(...points[a + 1], ...points[b + 1], ...points[b]);
    }
  }
  return data;
}

function plushNoseGeometry() {
  const data = globeGeometry(1, 32, 24);
  for (let i = 0; i < data.length; i += 8) {
    const x = data[i], y = data[i + 1], taper = .78 + .44 * y;
    const nx = data[i + 3] / taper;
    const ny = data[i + 4] - .44 * x * nx;
    const nz = data[i + 5], length = Math.hypot(nx, ny, nz);
    data[i] = x * taper;
    data[i + 3] = nx / length;
    data[i + 4] = ny / length;
    data[i + 5] = nz / length;
  }
  return data;
}

// XY is a unit sheet. Z stays in family scene units: use a model Z scale of 1.
// Its center sags behind the two grips; the edge midpoints are at Z = .025.
const paperFrontDepth = .034;
function paperGeometry(columns = 24, rows = 16) {
  const data = [], halfThickness = .003;
  const surface = (x, y, side) => {
    const z = .1 * x * x + .016 * y * y + .002 * Math.sin(Math.PI * x) * Math.sin(Math.PI * y);
    const dx = .2 * x + .002 * Math.PI * Math.cos(Math.PI * x) * Math.sin(Math.PI * y);
    const dy = .032 * y + .002 * Math.PI * Math.sin(Math.PI * x) * Math.cos(Math.PI * y);
    const length = Math.hypot(dx, dy, 1);
    return [x, y, z + side * halfThickness,
      -dx / length * side, -dy / length * side, side / length, x + .5, y + .5];
  };
  for (const side of [1, -1]) {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const x0 = col / columns - .5, x1 = (col + 1) / columns - .5;
        const y0 = row / rows - .5, y1 = (row + 1) / rows - .5;
        const a = surface(x0, y0, side), b = surface(x1, y0, side);
        const c = surface(x1, y1, side), d = surface(x0, y1, side);
        data.push(...(side > 0 ? [...a, ...b, ...c, ...a, ...c, ...d]
          : [...a, ...c, ...b, ...a, ...d, ...c]));
      }
    }
  }
  const edge = (from, to, count, normal) => {
    for (let i = 0; i < count; i++) {
      const point = (step, side) => {
        const t = step / count;
        const p = surface(from[0] + (to[0] - from[0]) * t,
          from[1] + (to[1] - from[1]) * t, side);
        p.splice(3, 3, ...normal);
        return p;
      };
      const a = point(i, 1), b = point(i, -1), c = point(i + 1, -1), d = point(i + 1, 1);
      data.push(...a, ...b, ...c, ...a, ...c, ...d);
    }
  };
  edge([-.5, -.5], [.5, -.5], columns, [0, -1, 0]);
  edge([.5, -.5], [.5, .5], rows, [1, 0, 0]);
  edge([.5, .5], [-.5, .5], columns, [0, 1, 0]);
  edge([-.5, .5], [-.5, -.5], rows, [-1, 0, 0]);
  return data;
}

function latheGeometry(profile, segments = 64) {
  const data = [];
  for (let band = 1; band < profile.length; band++) {
    const [r0, y0] = profile[band - 1];
    const [r1, y1] = profile[band];
    const radial = y1 - y0, vertical = r0 - r1;
    for (let segment = 0; segment < segments; segment++) {
      const a = segment / segments, b = (segment + 1) / segments;
      for (const [u, radius, y] of [[a, r0, y0], [a, r1, y1], [b, r0, y0],
        [b, r0, y0], [a, r1, y1], [b, r1, y1]]) {
        const angle = u * Math.PI * 2;
        const x = Math.cos(angle), z = Math.sin(angle);
        data.push(radius * x, y, radius * z, radial * x, vertical, radial * z, u, y + .5);
      }
    }
  }
  return data;
}

const quadGeometry = [
  -.5, -.5, 0, 0, 0, 1, 0, 0, .5, -.5, 0, 0, 0, 1, 1, 0, .5, .5, 0, 0, 0, 1, 1, 1,
  -.5, -.5, 0, 0, 0, 1, 0, 0, .5, .5, 0, 0, 0, 1, 1, 1, -.5, .5, 0, 0, 0, 1, 0, 1,
];

// Shared scene math/geometry above; physical materials and imported GLBs use Three.js.
function makeRenderer(canvas) {
  return makePhysicalRenderer(canvas);
}
