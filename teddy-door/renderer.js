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
      const nap = roundness === 1.0
        ? 1 + .004 * Math.sin(azimuth * 21 + polar * 8) * Math.sin(polar * 19) * Math.sin(polar) : 1;
      const p = sphere.map(value => pow(value, roundness) * .5 * nap);
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

const vertexSource = `#version 300 es
  layout(location=0) in vec3 a_position;
  layout(location=1) in vec3 a_normal;
  layout(location=2) in vec2 a_uv;
  uniform mat4 u_model, u_viewProjection;
  out vec3 v_position, v_normal;
  out vec2 v_uv;
  void main() {
    vec4 p = u_model * vec4(a_position, 1.);
    v_position = p.xyz;
    v_normal = transpose(inverse(mat3(u_model))) * a_normal;
    v_uv = a_uv;
    gl_Position = u_viewProjection * p;
  }`;

const fragmentSource = `#version 300 es
  precision highp float;
  uniform vec3 u_color, u_eye;
  uniform vec4 u_region;
  uniform sampler2D u_texture;
  uniform int u_material, u_project;
  in vec3 v_position, v_normal;
  in vec2 v_uv;
  out vec4 outColor;

  float hash(vec2 v) {
    return fract(sin(dot(v, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 v) {
    vec2 i = floor(v), f = fract(v);
    f = f * f * (3. - 2. * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x),
      mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  void main() {
    vec2 uv = v_uv;
    vec3 base = u_color;
    float ao = 1.;
    if (u_material == 11) {
      float r = length(uv * 2. - 1.);
      outColor = vec4(base, .63 * (1. - smoothstep(.06, 1., r)));
      return;
    }
    if (u_material == 1 && u_project == 1) {
      vec2 p = v_position.xz;
      float row = (p.x + 5.) * 2.8;
      float plank = floor(row);
      float offset = hash(vec2(plank, 6.));
      float joint = p.y * .58 + offset;
      float edge = min(fract(row), 1. - fract(row));
      float end = min(fract(joint), 1. - fract(joint));
      base *= .94 + .09 * hash(vec2(plank, floor(joint)));
      base *= mix(.86, 1., smoothstep(.006, .025, edge) * smoothstep(.004, .013, end));
    }
    if (u_material == 2) {
      vec2 p = u_project == 2 ? v_position.zy : v_position.xy;
      vec2 cell = abs(fract(p * vec2(2.0, 2.15)) - .5);
      float spot = 1. - smoothstep(.043, .064, cell.x + cell.y);
      base = mix(base, vec3(.84, .69, .55), spot * .42);
      ao = mix(.85, 1., smoothstep(.06, 1.14, v_position.y));
    }
    if (u_material == 7 || u_material == 8 || u_material == 9 || u_material == 13) {
      vec3 paper = texture(u_texture, u_region.xy + uv * u_region.zw).rgb;
      if (u_material == 8 && !gl_FrontFacing) {
        paper = vec3(.72,.59,.40) * (.92 + noise(uv * 170.) * .09);
      }
      base *= paper;
      if (u_material == 8) {
        base *= mix(.81, 1., smoothstep(.0, .037, min(uv.x, 1. - uv.x)));
      }
    }
    if (u_material == 10) {
      float radius = length(uv * 2. - 1.);
      if (radius > 1.) discard;
      float trim = max(1. - smoothstep(.004, .009, abs(radius - .93)),
        1. - smoothstep(.003, .007, abs(radius - .966)));
      base = mix(base, vec3(.72, .60, .46), trim * .36);
    }
    vec3 n = normalize(v_normal);
    if (!gl_FrontFacing && u_material == 8) n = -n;
    vec3 view = normalize(u_eye - v_position);
    vec3 key = normalize(vec3(-.44, .75, .64));
    float sunlight = max(dot(n, key), 0.);
    float softShade = smoothstep(.15, .31, sunlight);
    float highlight = smoothstep(.60, .75, sunlight);
    vec3 light = vec3(.69, .61, .65) + softShade * vec3(.23, .21, .15)
      + highlight * vec3(.19, .19, .15);
    vec3 color = base * light * ao;
    if (u_material == 3 || u_material == 4) {
      float edge = 1. - smoothstep(.07, .23, max(dot(n, view), 0.));
      color = mix(color, base * vec3(.43, .30, .36), edge * .46);
    }
    if (u_material == 5 || u_material == 6) {
      float shine = smoothstep(.83, .95, max(dot(n, normalize(key + view)), 0.));
      color += vec3(1., .81, .64) * shine * (u_material == 5 ? .11 : .045);
    }
    if (u_material == 14) {
      float fold = .94 + .06 * cos(uv.x * 201.06193);
      float fabric = .975 + .025 * noise(uv * vec2(220., 170.));
      float binding = max(1. - smoothstep(.025, .055, uv.y), smoothstep(.945, .975, uv.y));
      vec3 transmitted = mix(vec3(1.04, .89, .70), vec3(1., .95, .86), uv.y);
      vec3 shade = base * transmitted * fold * fabric * (.88 + .12 * sunlight);
      color = mix(shade, shade * vec3(.79, .71, .60), binding);
    }
    if (u_material == 8) color = mix(base, color, .19);
    if (u_material == 12 || u_material == 13) color = base;
    outColor = vec4(pow(max(color, vec3(0.)), vec3(.95)), 1.);
  }`;

function makeRenderer(canvas) {
  const gl = canvas.getContext("webgl2", { alpha: false, antialias: true });
  if (!gl) return null;

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  }

  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const uniforms = Object.fromEntries(["model", "viewProjection", "color", "eye", "region", "texture", "material", "project"]
    .map(name => [name, gl.getUniformLocation(program, "u_" + name)]));

  function buffer(data) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    for (const [index, length, offset] of [[0, 3, 0], [1, 3, 12], [2, 2, 24]]) {
      gl.enableVertexAttribArray(index);
      gl.vertexAttribPointer(index, length, gl.FLOAT, false, 32, offset);
    }
    return { vao, count: data.length / 8 };
  }

  const meshes = {
    box: buffer(boxGeometry()),
    sphere: buffer(globeGeometry(1)),
    cushion: buffer(globeGeometry(.44, 32, 22)),
    quad: buffer(quadGeometry),
    turnedBase: buffer(latheGeometry([
      [0, -.5], [.46, -.5], [.50, -.43], [.50, -.26], [.47, -.19],
      [.29, -.15], [.22, -.05], [.18, .23], [.13, .36], [.12, .5], [0, .5],
    ])),
    shade: buffer(latheGeometry([
      [.47, -.5], [.50, -.484], [.495, -.441], [.32, .457], [.313, .5],
      [.283, .5], [.288, .452], [.465, -.452], [.470, -.484], [.47, -.5],
    ])),
  };

  function texture(image) {
    const id = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, id);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    if (image) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([246, 217, 158, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
    return id;
  }
  const solid = texture();
  const region = [0, 0, 1, 1];
  const transparent = [];
  gl.uniform1i(uniforms.texture, 0);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(.941, .878, .796, 1);

  function draw(obj, parent) {
    const model = parent ? multiply(parent, obj.model) : obj.model;
    if (obj.material === 11) {
      transparent.push([obj, model]);
      return;
    }
    paint(obj, model);
  }

  function paint(obj, model) {
    const mesh = meshes[obj.shape];
    gl.bindVertexArray(mesh.vao);
    gl.uniformMatrix4fv(uniforms.model, false, model);
    gl.uniform3fv(uniforms.color, obj.color);
    gl.uniform1i(uniforms.material, obj.material);
    gl.uniform1i(uniforms.project, obj.project || 0);
    if ((obj.material >= 7 && obj.material <= 9) || obj.material === 13) {
      gl.bindTexture(gl.TEXTURE_2D, obj.texture || solid);
      gl.uniform4fv(uniforms.region, obj.region || region);
    }
    gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
  }

  function resize(width, height) {
    const pixels = Math.min(devicePixelRatio || 1, 1.8, Math.sqrt(2400000 / (width * height)));
    const w = Math.max(1, Math.round(width * pixels));
    const h = Math.max(1, Math.round(height * pixels));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }

  function frame(camera) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform3f(uniforms.eye, camera.x, camera.y, camera.z);
    gl.uniformMatrix4fv(uniforms.viewProjection, false,
      multiply(perspective(camera.tan, camera.aspect), viewAt(camera)));
  }

  function finish() {
    gl.depthMask(false);
    for (const [obj, model] of transparent) paint(obj, model);
    gl.depthMask(true);
    transparent.length = 0;
  }

  return { draw, finish, frame, resize, texture };
}
