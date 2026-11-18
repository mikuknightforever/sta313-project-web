// Soft toon renderer for the room and its existing paper/character draw API.
// Build: npm run build:teddy-renderer. Three.js is vendored under the MIT license.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const ARM_DECLARATIONS = `
attribute vec2 armWeights;
uniform mat4 teddyArmLeft;
uniform mat4 teddyArmRight;
mat4 teddyArmMatrix() {
  return mat4(1.0) + (teddyArmLeft - mat4(1.0)) * armWeights.x
    + (teddyArmRight - mat4(1.0)) * armWeights.y;
}
`;

function armShader(material, uniforms, normals = true, celFur = false) {
  material.onBeforeCompile = shader => {
    shader.uniforms.teddyArmLeft = uniforms.left;
    shader.uniforms.teddyArmRight = uniforms.right;
    shader.vertexShader = ARM_DECLARATIONS + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
      'vec3 transformed = (teddyArmMatrix() * vec4(position, 1.0)).xyz;');
    if (normals) {
      // The author's arm weights are rigid 0/1 and runtime arm transforms are
      // rotations. Applying that rotation exactly preserves the original normals.
      shader.vertexShader = shader.vertexShader.replace('#include <beginnormal_vertex>',
        'vec3 objectNormal = mat3(teddyArmMatrix()) * vec3(normal);\n#ifdef USE_TANGENT\nvec3 objectTangent = mat3(teddyArmMatrix()) * vec3(tangent.xyz);\n#endif');
    }
    if (celFur) {
      // Paint the character in two intentionally chosen colour fields. The
      // terminator follows the same scene key through the entire camera move.
      shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
        #if NUM_DIR_LIGHTS > 0
          float keyFacing = dot(normal, directionalLights[0].direction);
          float aa = clamp(fwidth(keyFacing), 0.004, 0.030);
          float lit = smoothstep(-0.29 - aa, -0.29 + aa, keyFacing);
          vec3 base = diffuseColor.rgb;
          vec3 shadePaint = base * vec3(0.80, 0.61, 0.73) + vec3(0.012, 0.004, 0.016);
          vec3 lightPaint = base * vec3(1.45, 1.18, 0.97) + vec3(0.020, 0.010, 0.008);
          outgoingLight = mix(shadePaint, lightPaint, lit);
          float facing = dot(normal, normalize(vViewPosition));
          float narrowRim = (1.0 - smoothstep(0.07, 0.15, facing)) *
            smoothstep(0.28, 0.50, keyFacing);
          outgoingLight += narrowRim * sqrt(base) * vec3(0.18, 0.11, 0.08);
        #endif
        #include <opaque_fragment>
      `);
    }
  };
  material.customProgramCacheKey = () => 'teddy-arms-' + normals + '-painted-cel-' + celFur;
}

// A back-facing shell shares the animated body geometry. Extruding in pixel
// space gives the line the same visual weight as the camera moves closer.
function makeInkShell(geometry, arms, viewport) {
  const inkMaterial = new THREE.ShaderMaterial({
    uniforms: {
      teddyArmLeft: arms.left,
      teddyArmRight: arms.right,
      inkColor: { value: new THREE.Color(0x583c50) },
      lineWidth: { value: 1 },
      viewport,
    },
    side: THREE.BackSide,
    depthWrite: false,
    toneMapped: false,
    vertexShader: ARM_DECLARATIONS + `
      uniform vec2 viewport;
      uniform float lineWidth;
      void main() {
        mat4 skin = teddyArmMatrix();
        vec4 eyePosition = modelViewMatrix * skin * vec4(position, 1.0);
        vec4 clip = projectionMatrix * eyePosition;
        vec3 eyeNormal = normalize(normalMatrix * mat3(skin) * normal);
        vec4 projectedNormal = projectionMatrix * vec4(eyeNormal, 0.0);
        vec2 direction = (projectedNormal.xy * clip.w - clip.xy * projectedNormal.w) * viewport;
        direction /= max(length(direction), 0.00001);
        float width = lineWidth * clamp(5.0 / max(1.0, -eyePosition.z), 0.50, 1.1);
        clip.xy += direction * (2.0 * width / viewport) * clip.w;
        gl_Position = clip;
      }`,
    fragmentShader: `
      uniform vec3 inkColor;
      void main() {
        gl_FragColor = vec4(inkColor, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const shell = new THREE.Mesh(geometry, inkMaterial);
  shell.name = 'Bear contour';
  shell.renderOrder = 2;
  shell.frustumCulled = false;
  return shell;
}

function srgbColor(values) {
  return new THREE.Color().setRGB(...values.slice(0, 3), THREE.SRGBColorSpace);
}

function bufferGeometry(data, stride = 8) {
  const count = data.length / stride;
  const positions = new Float32Array(count * 3), normals = new Float32Array(count * 3);
  const uvs = new Float32Array(count * 2), weights = stride >= 10 ? new Float32Array(count * 2) : null;
  let outward = 0, inward = 0;
  for (let i = 0; i < data.length; i += stride * 3) {
    const ax = data[i + stride] - data[i], ay = data[i + stride + 1] - data[i + 1], az = data[i + stride + 2] - data[i + 2];
    const bx = data[i + stride * 2] - data[i], by = data[i + stride * 2 + 1] - data[i + 1], bz = data[i + stride * 2 + 2] - data[i + 2];
    const nx = data[i + 3] + data[i + stride + 3] + data[i + stride * 2 + 3];
    const ny = data[i + 4] + data[i + stride + 4] + data[i + stride * 2 + 4];
    const nz = data[i + 5] + data[i + stride + 5] + data[i + stride * 2 + 5];
    const direction = (ay * bz - az * by) * nx + (az * bx - ax * bz) * ny + (ax * by - ay * bx) * nz;
    if (direction > 1e-12) outward++; else if (direction < -1e-12) inward++;
  }
  // Earlier hand-built spheres used inward triangle winding with outward normals.
  // Reorder all vertex attributes together once so physical shading stays correct.
  const reverse = inward > outward;
  for (let v = 0; v < count; v++) {
    const sourceVertex = reverse ? Math.floor(v / 3) * 3 + [0, 2, 1][v % 3] : v;
    const source = sourceVertex * stride;
    positions.set(data.slice(source, source + 3), v * 3);
    const nx = data[source + 3], ny = data[source + 4], nz = data[source + 5];
    const length = Math.hypot(nx, ny, nz) || 1;
    normals.set([nx / length, ny / length, nz / length], v * 3);
    uvs.set(data.slice(source + 6, source + 8), v * 2);
    if (weights) weights.set(data.slice(source + 8, source + 10), v * 2);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  if (weights) geometry.setAttribute('armWeights', new THREE.BufferAttribute(weights, 2));
  geometry.computeBoundingSphere();
  return geometry;
}

window.makePhysicalRenderer = function makePhysicalRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0xcdbfbb, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.sortObjects = true;

  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(50, 1, .035, 40);
  const immediate = new THREE.Group(), modelRoot = new THREE.Group();
  scene.add(immediate, modelRoot);
  const hemisphere = new THREE.HemisphereLight(0xf1f5ff, 0xc3bfca, 1.1);
  scene.add(hemisphere);
  const key = new THREE.DirectionalLight(0xffecd7, 1.9);
  key.position.set(4.5, 6, 1.8);
  key.target.position.set(0, .65, -2);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -5.5; key.shadow.camera.right = 5.5;
  key.shadow.camera.top = 5.5; key.shadow.camera.bottom = -5.5;
  key.shadow.camera.near = .5; key.shadow.camera.far = 18;
  key.shadow.normalBias = .018; key.shadow.bias = -.00018;
  key.shadow.radius = 3;
  key.shadow.intensity = .43;
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(0xdce7f4, .35);
  fill.position.set(-4, 3, 2); scene.add(fill);
  const lampGlow = new THREE.PointLight(0xffd5a5, .8, 3.0, 2);
  lampGlow.position.set(-2.7, 1.6, -2.2); scene.add(lampGlow);

  // The repeated stops give each cel tone a broad plateau. Linear interpolation
  // softens just the transition between tones on rounded cheeks and ears.
  const celTones = new Uint8Array([105,105,105,105,164,164,164,164,221,221,221,221,255,255,255,255]);
  const gradient = new THREE.DataTexture(celTones, celTones.length, 1, THREE.RedFormat);
  gradient.name = 'Soft four-band toon lighting';
  gradient.minFilter = gradient.magFilter = THREE.LinearFilter;
  gradient.generateMipmaps = false;
  gradient.needsUpdate = true;

  // Trace the key direction back to the four panes in the right wall. The same
  // patch crosses the floor, rug and upholstery as the camera moves.
  const windowSlope = { value: new THREE.Vector2() };
  function updateWindowDirection() {
    const dx = key.position.x - key.target.position.x;
    if (dx > .01) {
      windowSlope.value.set((key.position.y - key.target.position.y) / dx,
        (key.position.z - key.target.position.z) / dx);
    }
  }
  updateWindowDirection();
  function addWindowLight(material, finish = 'room') {
    // Warm transmission is confined to the physical linen. Keep the tied band
    // and folded header denser than the thin fabric over the glass.
    const finishLight = finish === 'linen' ? `
      float fromBehind = max(0.0, -dot(normal, directionalLights[0].direction));
      float thinFold = 0.55 + 0.45 * cos(18.84956 * vMapUv.x);
      float tie = smoothstep(0.045, 0.075, abs(vMapUv.y - 0.355));
      float weave = mix(0.34, 1.0, thinFold) * mix(0.35, 1.0, tie);
      float nearGlass = smoothstep(-0.2, 0.45, opening);
      outgoingLight += diffuseColor.rgb * vec3(0.31, 0.14, 0.055)
        * fromBehind * weave * nearGlass;
    ` : finish === 'reveal' ? `
      // Only jamb and sash faces angled into the opening catch this bounce.
      outgoingLight += diffuseColor.rgb * vec3(0.13, 0.068, 0.025)
        * smoothstep(0.16, 0.70, surface);
    ` : '';
    material.onBeforeCompile = shader => {
      shader.uniforms.windowSlope = windowSlope;
      shader.vertexShader = 'varying vec3 vRoomPosition;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <worldpos_vertex>', `
        #include <worldpos_vertex>
        vRoomPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
      `);
      shader.fragmentShader = 'varying vec3 vRoomPosition;\nuniform vec2 windowSlope;\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
        #if NUM_DIR_LIGHTS > 0
          float distanceToWindow = max(0.0, 3.30 - vRoomPosition.x);
          vec2 pane = vRoomPosition.yz + distanceToWindow * windowSlope - vec2(2.05, -1.45);
          float softness = 0.055 + 0.070 * distanceToWindow;
          // Match the real horizontal sash and the slim vertical mullion.
          vec2 inset = vec2(1.075, 1.09) - abs(pane);
          float opening = smoothstep(-softness, softness, min(inset.x, inset.y));
          float sash = mix(0.48, 1.0, smoothstep(0.0414, 0.0414 + softness, abs(pane.x)));
          sash *= mix(0.52, 1.0, smoothstep(0.026, 0.026 + softness, abs(pane.y)));
          float surface = max(0.0, dot(normal, directionalLights[0].direction));
          outgoingLight += diffuseColor.rgb * vec3(0.32, 0.17, 0.085) * opening * sash * surface;
          ${finishLight}
        #endif
        #include <opaque_fragment>
      `);
    };
    material.customProgramCacheKey = () => 'room-window-light-four-panes-dusk-' + finish;
  }

  const geometries = new Map([
    ['box', bufferGeometry(boxGeometry())],
    ['sphere', bufferGeometry(globeGeometry(1, 16, 10))],
    ['bearHead', bufferGeometry(bearHeadGeometry(24, 16))],
    ['paper', bufferGeometry(paperGeometry())],
    ['cushion', bufferGeometry(globeGeometry(.44, 16, 10))],
    ['quad', bufferGeometry(quadGeometry)],
    ['turnedBase', bufferGeometry(latheGeometry([[0,-.5],[.46,-.5],[.50,-.43],[.50,-.26],[.47,-.19],[.29,-.15],[.22,-.05],[.18,.23],[.13,.36],[.12,.5],[0,.5]], 24))],
    ['shade', bufferGeometry(latheGeometry([[.47,-.5],[.50,-.484],[.495,-.441],[.32,.457],[.313,.5],[.283,.5],[.288,.452],[.465,-.452],[.470,-.484],[.47,-.5]], 24))],
  ]);
  const slots = [], models = new Map(), loader = new GLTFLoader();
  const textureCopies = new Map();
  let slotIndex = 0;
  const leftMatrix = new THREE.Matrix4();
  const inkViewport = { value: new THREE.Vector2(1, 1) };

  function texture(image, options = {}) {
    const result = new THREE.Texture(image);
    result.flipY = options.flipY ?? true;
    result.colorSpace = options.colorSpace === 'linear' ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    result.wrapS = result.wrapT = options.repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
    result.minFilter = THREE.LinearMipmapLinearFilter; result.magFilter = THREE.LinearFilter;
    result.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    result.needsUpdate = true;
    return result;
  }

  function transformedTexture(source, region, repeat, linear = false) {
    if (!source) return null;
    // Animated canvas maps must retain the texture whose version the painter
    // updates. A needless clone keeps its own version and can freeze a reveal.
    if (!region && !repeat && !linear) return source;
    const key = source.uuid + ':' + JSON.stringify(region || repeat || []) + ':' + linear;
    if (!textureCopies.has(key)) {
      const copy = source.clone();
      if (region) { copy.offset.set(region[0], region[1]); copy.repeat.set(region[2], region[3]); }
      if (repeat) { copy.repeat.set(...repeat); copy.wrapS = copy.wrapT = THREE.RepeatWrapping; }
      if (linear) copy.colorSpace = THREE.NoColorSpace;
      copy.needsUpdate = true;
      textureCopies.set(key, copy);
    }
    return textureCopies.get(key);
  }

  function materialFor(obj, skinned) {
    const code = obj.material;
    const basic = [7, 8, 9, 11, 12, 13, 15].includes(code);
    const imported = code === 18;
    const gloss = code === 6 || (imported && !!obj.importedMaterial?.eyeGloss);
    const material = basic ? new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false })
      : gloss ? new THREE.MeshPhongMaterial({ shininess: 70, specular: 0xb6afa1, side: THREE.DoubleSide })
        : new THREE.MeshToonMaterial({ gradientMap: gradient, side: THREE.DoubleSide });
    if (code === 11) {
      material.transparent = true;
      material.depthWrite = false;
      material.polygonOffset = true;
      material.polygonOffsetFactor = -1;
      material.polygonOffsetUnits = -1;
    }
    if (skinned) {
      material.userData.armUniforms = { left: { value: new THREE.Matrix4() }, right: { value: new THREE.Matrix4() } };
      armShader(material, material.userData.armUniforms, true, imported && !gloss);
    }
    material.userData.windowLight = !!obj.windowLight;
    material.userData.backlitLinen = !!obj.backlitLinen;
    if ((obj.windowLight || obj.backlitLinen) && material.isMeshToonMaterial && !skinned) {
      addWindowLight(material, obj.backlitLinen ? 'linen' : 'room');
    }
    material.userData.kind = code;
    material.userData.skinned = skinned;
    material.userData.imported = imported;
    material.userData.gloss = gloss;
    return material;
  }

  function updateMaterial(material, obj) {
    if (obj.material === 18) {
      const source = obj.importedMaterial || {};
      const color = source.baseColorFactor || [1,1,1,1];
      material.color.setRGB(color[0], color[1], color[2], THREE.LinearSRGBColorSpace);
      material.opacity = color[3] ?? 1;
      material.transparent = material.opacity < 1;
      // Immediate imported materials are the teddy and architectural surfaces.
      // Their original linear base colours are retained; fabric/wood/plaster
      // microdetail is deliberately omitted for a coherent, quiet cartoon look.
      if (material.map || material.normalMap) material.needsUpdate = true;
      material.map = material.normalMap = null;
    } else {
      material.color.copy(srgbColor(obj.color || [1,1,1]));
      const nextMap = transformedTexture(obj.texture, obj.region);
      if (!!nextMap !== !!material.map) material.needsUpdate = true;
      material.map = nextMap;
    }
  }

  function frame(view) {
    slotIndex = 0;
    for (const model of models.values()) model.used = 0;
    camera.fov = 2 * Math.atan(view.tan) * 180 / Math.PI;
    camera.aspect = view.aspect;
    camera.position.set(view.x, view.y, view.z);
    camera.up.set(0, 1, 0);
    camera.lookAt(view.targetX, view.targetY, view.targetZ);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }

  function draw(obj, parent) {
    // A soft alpha mask supplements the shadow map at contact points.
    if (obj.material === 11 && !obj.texture) return;
    const geometry = geometries.get(obj.shape);
    if (!geometry) throw new Error('Unknown room geometry: ' + obj.shape);
    const index = slotIndex++;
    let slot = slots[index];
    const skinned = !!obj.skin;
    const gloss = obj.material === 6 || (obj.material === 18 && !!obj.importedMaterial?.eyeGloss);
    if (!slot) {
      slot = new THREE.Mesh(geometry, materialFor(obj, skinned));
      slot.matrixAutoUpdate = false;
      slot.frustumCulled = false;
      slots[index] = slot; immediate.add(slot);
    }
    slot.visible = true; slot.geometry = geometry;
    slot.name = obj.shape;
    if (slot.material.userData.kind !== obj.material || slot.material.userData.skinned !== skinned
        || slot.material.userData.gloss !== gloss || slot.material.userData.windowLight !== !!obj.windowLight
        || slot.material.userData.backlitLinen !== !!obj.backlitLinen) {
      slot.material.dispose();
      slot.material = materialFor(obj, skinned);
      if (slot.customDepthMaterial) { slot.customDepthMaterial.dispose(); slot.customDepthMaterial = undefined; }
    }
    const lineWidth = skinned && obj.material === 18 ? (obj.importedMaterial.inkWidth || 0) : 0;
    let ink = slot.userData.ink;
    if (lineWidth && !ink) {
      ink = makeInkShell(geometry, slot.material.userData.armUniforms, inkViewport);
      slot.add(ink);
      slot.userData.ink = ink;
    }
    if (ink) {
      ink.visible = lineWidth > 0;
      if (ink.visible) {
        ink.geometry = geometry;
        const arms = slot.material.userData.armUniforms;
        ink.material.uniforms.teddyArmLeft = arms.left;
        ink.material.uniforms.teddyArmRight = arms.right;
        ink.material.uniforms.lineWidth.value = lineWidth;
      }
    }
    updateMaterial(slot.material, obj);
    slot.matrix.fromArray(obj.model);
    if (parent) slot.matrix.premultiply(leftMatrix.fromArray(parent));
    slot.matrixWorldNeedsUpdate = true;
    slot.castShadow = ![7,8,9,11,12,13].includes(obj.material) && obj.castShadow !== false;
    slot.receiveShadow = obj.material !== 11 && obj.receiveShadow !== false;
    if (obj.skin) {
      const uniforms = slot.material.userData.armUniforms;
      uniforms.left.value.fromArray(obj.skin[0]); uniforms.right.value.fromArray(obj.skin[1]);
      if (!slot.customDepthMaterial) {
        slot.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide });
        armShader(slot.customDepthMaterial, uniforms, false);
      }
    }
  }

  async function loadModel(name, source) {
    if (models.has(name)) return models.get(name).ready;
    const entry = { root: null, instances: [], used: 0 };
    models.set(name, entry);
    entry.ready = loader.loadAsync(source).then(gltf => {
      const root = gltf.scene;
      const convertedMaterials = new Map();
      const toonMaterial = original => {
        if (convertedMaterials.has(original)) return convertedMaterials.get(original);
        const material = new THREE.MeshToonMaterial({
          color: original.color || new THREE.Color(0xffffff),
          gradientMap: gradient,
          map: original.map || null,
          alphaMap: original.alphaMap || null,
          opacity: original.opacity,
          transparent: original.transparent,
          alphaTest: original.alphaTest,
          vertexColors: original.vertexColors,
          side: original.side,
          depthWrite: original.depthWrite,
          emissive: original.emissive || new THREE.Color(0x000000),
          emissiveMap: original.emissiveMap || null,
          emissiveIntensity: original.emissiveIntensity ?? 1,
        });
        // r176 supports FLAT_SHADED in the toon shader/program cache, but does
        // not declare the property in MeshToonMaterial's constructor options.
        material.flatShading = true;
        if (name.startsWith('room:')) addWindowLight(material, name === 'room:window' ? 'reveal' : 'room');
        material.name = original.name;
        material.userData = { ...original.userData, roomStyle: 'toon' };
        for (const map of [material.map, material.alphaMap, material.emissiveMap]) {
          if (map) map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        }
        convertedMaterials.set(original, material);
        return material;
      };
      const inkFurniture = ['room:sofa', 'room:table', 'room:lamp'].includes(name);
      const furnitureInk = inkFurniture ? new THREE.LineBasicMaterial({
        color: 0x594c5e, transparent: true, opacity: .42, depthWrite: false, toneMapped: false,
      }) : null;
      root.traverse(node => {
        if (node.isLight) { node.visible = false; node.intensity = 0; }
        if (node.isMesh) {
          node.castShadow = true; node.receiveShadow = true;
          node.material = Array.isArray(node.material) ? node.material.map(toonMaterial) : toonMaterial(node.material);
          if (furnitureInk) {
            const edgeLines = new THREE.LineSegments(new THREE.EdgesGeometry(node.geometry, 51), furnitureInk);
            edgeLines.name = 'Furniture ink';
            edgeLines.renderOrder = 1;
            node.add(edgeLines);
            for (const surface of Array.isArray(node.material) ? node.material : [node.material]) {
              surface.polygonOffset = true;
              surface.polygonOffsetFactor = 1;
              surface.polygonOffsetUnits = 1;
            }
          }
        }
      });
      for (const original of convertedMaterials.keys()) original.dispose();
      root.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(root);
      const bounds = { min: box.min.toArray(), max: box.max.toArray(),
        size: box.getSize(new THREE.Vector3()).toArray(), center: box.getCenter(new THREE.Vector3()).toArray() };
      entry.root = root; entry.bounds = bounds;
      return { root, bounds, animations: gltf.animations, asset: gltf.asset };
    }).catch(error => { models.delete(name); throw error; });
    return entry.ready;
  }

  function drawModel(name, matrix) {
    const entry = models.get(name);
    if (!entry?.root) return false;
    const index = entry.used++;
    if (!entry.instances[index]) {
      const wrapper = new THREE.Group(); wrapper.matrixAutoUpdate = false;
      wrapper.add(entry.root.clone(true));
      entry.instances[index] = wrapper; modelRoot.add(wrapper);
    }
    const instance = entry.instances[index]; instance.visible = true;
    instance.matrix.fromArray(matrix); instance.matrixWorldNeedsUpdate = true;
    return true;
  }

  function finish() {
    for (let i = slotIndex; i < slots.length; i++) slots[i].visible = false;
    for (const entry of models.values()) for (let i = entry.used; i < entry.instances.length; i++) entry.instances[i].visible = false;
    renderer.render(scene, camera);
  }

  function resize(width, height) {
    inkViewport.value.set(width, height);
    const pixels = Math.min(window.devicePixelRatio || 1, 1.6, Math.sqrt(1900000 / (width * height)));
    if (renderer.getPixelRatio() !== pixels) renderer.setPixelRatio(pixels);
    const current = renderer.getSize(new THREE.Vector2());
    if (current.x !== width || current.y !== height) renderer.setSize(width, height, false);
  }

  function mesh(name, data, stride = 8) {
    if (geometries.has(name)) throw new Error('Mesh already registered: ' + name);
    geometries.set(name, bufferGeometry(data, stride));
  }

  function setLighting(options = {}) {
    if (options.exposure !== undefined) renderer.toneMappingExposure = options.exposure;
    if (options.environmentIntensity !== undefined) scene.environmentIntensity = options.environmentIntensity;
    if (options.keyIntensity !== undefined) key.intensity = options.keyIntensity;
    if (options.keyColor !== undefined) key.color.setHex(options.keyColor);
    if (options.hemisphereColor !== undefined) hemisphere.color.setHex(options.hemisphereColor);
    if (options.groundColor !== undefined) hemisphere.groundColor.setHex(options.groundColor);
    if (options.fillColor !== undefined) fill.color.setHex(options.fillColor);
    if (options.lampColor !== undefined) lampGlow.color.setHex(options.lampColor);
    if (options.keyPosition) key.position.fromArray(options.keyPosition);
    if (options.lampPosition) lampGlow.position.fromArray(options.lampPosition);
    if (options.lampIntensity !== undefined) lampGlow.intensity = options.lampIntensity;
    if (options.keyTarget) key.target.position.fromArray(options.keyTarget);
    if (options.keyTarget || options.keyPosition) updateWindowDirection();
    if (options.hemisphereIntensity !== undefined) hemisphere.intensity = options.hemisphereIntensity;
    if (options.fillIntensity !== undefined) fill.intensity = options.fillIntensity;
  }

  function loadEnvironment() {
    // Kept for callers of the previous renderer; matte toon surfaces intentionally
    // do not load or use an HDR environment.
    return Promise.resolve(null);
  }

  return { draw, finish, frame, resize, texture, mesh, loadModel, drawModel, setLighting, loadEnvironment,
    getContext: () => renderer.getContext(), get info() { return renderer.info; },
    engine: 'Three.js r176', style: 'toon', scene, camera, renderer };
};
