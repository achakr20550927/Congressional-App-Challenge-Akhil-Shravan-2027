// render3d.js — 3D & chart rendering module (PRD §9.5).
// Every animation here is data-driven (joint positions, jitter, a recorded
// trajectory, a real spectrum) — never decoration, per the Design System's
// "motion has a job" principle.
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import Chart from "chart.js/auto";

const CALM_BLUE = new THREE.Color(0x3e6fa6);
const HOT_AMBER = new THREE.Color(0xe8a23d);
const BONE_COLOR = 0x223028;
const HEAT_LOW = new THREE.Color(0x38d878);
const HEAT_NEUTRAL = new THREE.Color(0x5f8377);
const HEAT_HIGH = new THREE.Color(0xff4e4e);

export const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

function makeHandGroup(scene) {
  const joints = [];
  const bones = [];
  for (let i = 0; i < 21; i++) {
    const geo = new THREE.SphereGeometry(0.012, 12, 12);
    const mat = new THREE.MeshStandardMaterial({ color: CALM_BLUE, emissive: 0x0a1512, roughness: 0.4 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.visible = false;
    scene.add(mesh);
    joints.push(mesh);
  }
  for (const [a, b] of HAND_CONNECTIONS) {
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    const mat = new THREE.LineBasicMaterial({ color: BONE_COLOR });
    const line = new THREE.Line(geo, mat);
    line.visible = false;
    scene.add(line);
    bones.push({ a, b, line });
  }
  return { joints, bones, history: Array.from({ length: 21 }, () => []) };
}

function toVec3(p) {
  return new THREE.Vector3((p.x - 0.5) * -1.2, (0.5 - p.y) * 1.2, -(p.z || 0) * 1.2);
}

function rollingJitter(history) {
  if (history.length < 3) return 0;
  let sum = 0;
  for (let i = 1; i < history.length; i++) sum += history[i].distanceTo(history[i - 1]);
  return sum / (history.length - 1);
}

/**
 * Builds the Three.js scene, camera, renderer, and two 21-joint hand
 * skeletons (bilateral) with connecting bone lines.
 * @param {HTMLElement} container
 */
export function createHandScene(container) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, (container.clientWidth || 4) / (container.clientHeight || 3), 0.01, 10);
  camera.position.set(0, 0, 1.4);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth || 480, container.clientHeight || 360);
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0x8899aa, 1.4));
  const light = new THREE.PointLight(0x7fb3a3, 1.2);
  light.position.set(1, 1, 2);
  scene.add(light);

  const hands = [makeHandGroup(scene), makeHandGroup(scene)];

  let raf = null;
  function loop() {
    raf = requestAnimationFrame(loop);
    renderer.render(scene, camera);
  }
  loop();

  function resize() {
    const w = container.clientWidth || 480;
    const h = container.clientHeight || 360;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener("resize", resize);

  return {
    scene,
    camera,
    renderer,
    hands,
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    },
  };
}

/**
 * Updates joint positions every frame and recolors each joint from
 * calm-blue to hot-amber based on rolling per-joint jitter (Design System §7).
 * @param {ReturnType<typeof createHandScene>} sceneRefs
 * @param {{landmarks?: any[][]}} frame - a MediaPipe HandLandmarkerResult-shaped frame
 */
export function updateHandScene(sceneRefs, frame) {
  const lmList = frame?.landmarks || [];
  sceneRefs.hands.forEach((handGroup, idx) => {
    const lm = lmList[idx];
    const visible = !!lm;
    handGroup.joints.forEach((j) => (j.visible = visible));
    handGroup.bones.forEach((b) => (b.line.visible = visible));
    if (!visible) return;

    for (let i = 0; i < 21; i++) {
      const v = toVec3(lm[i]);
      handGroup.joints[i].position.copy(v);
      handGroup.history[i].push(v.clone());
      if (handGroup.history[i].length > 16) handGroup.history[i].shift();

      const jitter = rollingJitter(handGroup.history[i]);
      const t = Math.min(1, jitter / 0.01);
      const color = CALM_BLUE.clone().lerp(HOT_AMBER, t);
      handGroup.joints[i].material.color.copy(color);
      handGroup.joints[i].material.emissive.copy(color).multiplyScalar(0.2);
      // amplitude is also conveyed non-color: joint grows slightly with jitter (never color-alone)
      const scale = 1 + t * 0.6;
      handGroup.joints[i].scale.setScalar(scale);
    }
    handGroup.bones.forEach((b) =>
      b.line.geometry.setFromPoints([handGroup.joints[b.a].position, handGroup.joints[b.b].position])
    );
  });
}

/**
 * Renders the fingertip's (x,y,z) trajectory over a recording window as a
 * glowing, slowly-rotating 3D phase-space curve — data-driven, not synthetic.
 * @param {HTMLElement} container
 * @param {{x:number,y:number,z:number}[]} pointsBuffer
 */
export function createTremorSignaturePlot(container, pointsBuffer) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 4.5);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  const size = container.clientWidth || 320;
  renderer.setSize(size, size);
  container.appendChild(renderer.domElement);

  const reduceMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.classList.contains("reduced-motion");

  const pts =
    pointsBuffer && pointsBuffer.length > 3
      ? pointsBuffer.map((p) => new THREE.Vector3(p.x * 8, p.y * 8, (p.z || 0) * 8))
      : [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.1, 0.1, 0)];

  const curve = new THREE.CatmullRomCurve3(pts, false);
  const tubeGeo = new THREE.TubeGeometry(curve, Math.max(64, pts.length), 0.02, 8, false);
  const tubeMat = new THREE.MeshStandardMaterial({ color: 0x2f5d50, emissive: 0x0d1e18, transparent: true, opacity: 0.92 });
  const tube = new THREE.Mesh(tubeGeo, tubeMat);
  scene.add(tube);

  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const pointLight = new THREE.PointLight(0xd97b4f, 1.4, 20);
  pointLight.position.set(2, 2, 3);
  scene.add(pointLight);

  let raf = null;
  function loop() {
    raf = requestAnimationFrame(loop);
    if (!reduceMotion) {
      tube.rotation.y += 0.004;
      tube.rotation.x = Math.sin(Date.now() * 0.0003) * 0.12;
    }
    renderer.render(scene, camera);
  }
  loop();

  return {
    dispose() {
      cancelAnimationFrame(raf);
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    },
  };
}

function lerpHeat(t) {
  const clamped = Math.max(0, Math.min(1, t));
  return clamped < 0.52
    ? HEAT_LOW.clone().lerp(HEAT_NEUTRAL, clamped / 0.52)
    : HEAT_NEUTRAL.clone().lerp(HEAT_HIGH, (clamped - 0.52) / 0.48);
}

function jointMotionScores(frames) {
  const scores = Array(21).fill(0);
  for (let i = 0; i < 21; i++) {
    const pts = frames.map((lm) => lm[i]).filter(Boolean);
    if (pts.length < 3) continue;
    const mean = pts.reduce(
      (acc, p) => ({
        x: acc.x + p.x / pts.length,
        y: acc.y + p.y / pts.length,
        z: acc.z + (p.z || 0) / pts.length,
      }),
      { x: 0, y: 0, z: 0 }
    );
    const variance =
      pts.reduce((sum, p) => {
        const dx = p.x - mean.x;
        const dy = p.y - mean.y;
        const dz = (p.z || 0) - mean.z;
        return sum + dx * dx + dy * dy + dz * dz;
      }, 0) / pts.length;
    scores[i] = Math.sqrt(variance);
  }
  const maxScore = Math.max(...scores, 0.00001);
  return scores.map((score) => score / maxScore);
}

function medianLandmarks(frames) {
  if (!frames.length) return null;
  const sortedValue = (values) => values.sort((a, b) => a - b)[Math.floor(values.length / 2)] || 0;
  return Array.from({ length: 21 }, (_, i) => {
    const pts = frames.map((lm) => lm[i]).filter(Boolean);
    return {
      x: sortedValue(pts.map((p) => p.x)),
      y: sortedValue(pts.map((p) => p.y)),
      z: sortedValue(pts.map((p) => p.z || 0)),
    };
  });
}

function addLabelSprite(text, color = "rgba(220,238,255,0.92)") {
  const canvas = document.createElement("canvas");
  canvas.width = 384;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.font = "22px IBM Plex Mono, monospace";
  ctx.fillStyle = color;
  ctx.fillText(text, 12, 40);
  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    })
  );
  sprite.scale.set(0.72, 0.12, 1);
  return sprite;
}

function modelLandmarkAnchors(box) {
  const x = (t) => THREE.MathUtils.lerp(box.min.x, box.max.x, t);
  const z = (t) => THREE.MathUtils.lerp(box.min.z, box.max.z, t);
  const surfaceY = box.max.y + (box.max.y - box.min.y) * 0.018;
  const points = [
    [0.49, 0.11],
    [0.23, 0.28], [0.16, 0.39], [0.12, 0.49], [0.08, 0.6],
    [0.36, 0.43], [0.34, 0.61], [0.33, 0.78], [0.32, 0.94],
    [0.5, 0.45], [0.5, 0.66], [0.5, 0.84], [0.5, 0.99],
    [0.64, 0.43], [0.67, 0.62], [0.68, 0.79], [0.68, 0.93],
    [0.78, 0.36], [0.83, 0.52], [0.86, 0.66], [0.89, 0.79],
  ];
  return points.map(([px, pz]) => new THREE.Vector3(x(px), surfaceY, z(pz)));
}

function heatAtModelPoint(point, anchors, heatScores, box) {
  const scale = Math.max(box.max.x - box.min.x, box.max.z - box.min.z, 0.001);
  let weightedHeat = 0;
  let weightTotal = 0;
  anchors.forEach((anchor, idx) => {
    const dx = (point.x - anchor.x) / scale;
    const dz = (point.z - anchor.z) / scale;
    const weight = 1 / (dx * dx + dz * dz + 0.004);
    weightedHeat += heatScores[idx] * weight;
    weightTotal += weight;
  });
  return Math.max(0, Math.min(1, weightedHeat / weightTotal));
}

function applyVertexHeatMap(model, anchors, heatScores, box) {
  model.traverse((child) => {
    if (!child.isMesh || !child.geometry?.attributes?.position) return;
    const geometry = child.geometry.clone();
    const position = geometry.attributes.position;
    const colors = [];
    for (let i = 0; i < position.count; i++) {
      const point = new THREE.Vector3(position.getX(i), position.getY(i), position.getZ(i));
      const heat = heatAtModelPoint(point, anchors, heatScores, box);
      const color = lerpHeat(Math.pow(heat, 0.86));
      colors.push(color.r, color.g, color.b);
    }
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    child.geometry = geometry;
    child.material = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      roughness: 0.42,
      metalness: 0.02,
      clearcoat: 0.4,
      clearcoatRoughness: 0.45,
      transparent: true,
      opacity: 0.93,
      side: THREE.DoubleSide,
    });
    child.castShadow = true;
    child.receiveShadow = true;
  });
}

/**
 * Renders a real GLB hand mesh with a data-driven green-to-red motion map.
 * The mesh supplies the anatomy; recorded landmark motion variance drives the
 * vertex colors so the heat stays attached to the hand surface.
 * @param {HTMLElement} container
 * @param {any[][]} landmarkFrames - array of 21-landmark hands
 */
export function createClinicalHandHeatmap(container, landmarkFrames) {
  const frames = (landmarkFrames || []).filter((lm) => lm && lm.length >= 21);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.01, 10);
  camera.position.set(0, 0.02, 3.55);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth || 360, container.clientHeight || 360);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xc4e4ff, 1.15));
  const key = new THREE.DirectionalLight(0xffffff, 2.45);
  key.position.set(-1.2, 1.5, 2.4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x45ff9a, 1.4);
  rim.position.set(1.2, 0.4, 1.8);
  scene.add(rim);

  const root = new THREE.Group();
  root.position.set(0, 0, 0);
  root.rotation.set(-Math.PI / 2 - 0.08, 0.03, 0);
  scene.add(root);

  const grid = new THREE.GridHelper(1.8, 12, 0x1f5d4b, 0x113243);
  grid.position.set(0, -0.72, -0.05);
  grid.material.transparent = true;
  grid.material.opacity = 0.13;
  scene.add(grid);

  const heatScores = frames.length ? jointMotionScores(frames) : Array(21).fill(0);
  const loader = new GLTFLoader();
  let disposed = false;

  loader.load(
    "/models/poly-google-hand.glb",
    (gltf) => {
      if (disposed) return;
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const scalar = 1.18 / Math.max(size.x, size.z, size.y, 0.001);
      const anchors = modelLandmarkAnchors(box);

      applyVertexHeatMap(model, anchors, heatScores, box);
      model.position.copy(center).multiplyScalar(-1);
      root.scale.setScalar(scalar);
      root.add(model);
    },
    undefined,
    () => {
      const label = addLabelSprite("HAND MODEL ASSET MISSING", "rgba(255,120,120,0.96)");
      label.position.set(-0.38, 0, 0);
      scene.add(label);
    }
  );

  const reduceMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.classList.contains("reduced-motion");

  let raf = null;
  function resize() {
    const w = container.clientWidth || 360;
    const h = container.clientHeight || 360;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  function loop() {
    raf = requestAnimationFrame(loop);
    if (!reduceMotion) {
      root.rotation.z += 0.0026;
    }
    renderer.render(scene, camera);
  }
  window.addEventListener("resize", resize);
  resize();
  loop();

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    },
  };
}

/**
 * 2D hand-skeleton overlay drawn in VIDEO PIXEL coordinates, so it aligns
 * exactly with the mirrored <video> element it sits on (same width/height
 * attributes, same object-fit, same scaleX(-1) transform). The previous live
 * view projected landmarks through a 3D perspective camera whose projection
 * did not match the video's field of view — which is why the skeleton
 * floated off the user's actual hand. MediaPipe landmarks are normalized to
 * the video frame, so drawing at (x*width, y*height) on a canvas that
 * mirrors the video's exact layout is pixel-accurate by construction.
 * Keeps the calm-blue → hot-amber per-joint jitter ramp (Design System §7),
 * with joint radius also growing with jitter so amplitude is never conveyed
 * by color alone.
 */
export function createHandOverlay2D(canvas) {
  const ctx = canvas.getContext("2d");
  const CALM = [62, 111, 166]; // #3E6FA6
  const HOT = [232, 162, 61]; // #E8A23D
  const history = [Array.from({ length: 21 }, () => []), Array.from({ length: 21 }, () => [])];
  const smoothed = [Array(21).fill(null), Array(21).fill(null)];

  function jitterOf(h) {
    if (h.length < 3) return 0;
    let s = 0;
    for (let i = 1; i < h.length; i++) {
      const dx = h[i].x - h[i - 1].x;
      const dy = h[i].y - h[i - 1].y;
      s += Math.sqrt(dx * dx + dy * dy);
    }
    return s / (h.length - 1);
  }

  function heat(t) {
    const r = Math.round(CALM[0] + (HOT[0] - CALM[0]) * t);
    const g = Math.round(CALM[1] + (HOT[1] - CALM[1]) * t);
    const b = Math.round(CALM[2] + (HOT[2] - CALM[2]) * t);
    return `rgb(${r},${g},${b})`;
  }

  function draw(frame) {
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const lmList = frame?.landmarks || [];
    for (let hand = 0; hand < 2; hand++) {
      const lm = lmList[hand];
      if (!lm) {
        history[hand].forEach((arr) => (arr.length = 0));
        smoothed[hand].fill(null);
        continue;
      }
      const stable = lm.map((point, i) => {
        const previous = smoothed[hand][i];
        const next = previous
          ? { x: previous.x * 0.55 + point.x * 0.45, y: previous.y * 0.55 + point.y * 0.45, z: previous.z * 0.55 + (point.z || 0) * 0.45 }
          : { x: point.x, y: point.y, z: point.z || 0 };
        smoothed[hand][i] = next;
        return next;
      });
      ctx.strokeStyle = "rgba(127,179,163,0.8)";
      ctx.lineWidth = 2;
      for (const [a, b] of HAND_CONNECTIONS) {
        ctx.beginPath();
        ctx.moveTo(stable[a].x * w, stable[a].y * h);
        ctx.lineTo(stable[b].x * w, stable[b].y * h);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(((stable[a].x + stable[b].x) / 2) * w, ((stable[a].y + stable[b].y) / 2) * h, 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(202,238,255,.7)";
        ctx.fill();
      }
      for (let i = 0; i < 21; i++) {
        const hist = history[hand][i];
        hist.push({ x: stable[i].x, y: stable[i].y });
        if (hist.length > 16) hist.shift();
        const t = Math.min(1, jitterOf(hist) / 0.008);
        ctx.beginPath();
        ctx.arc(stable[i].x * w, stable[i].y * h, 4 + t * 4, 0, Math.PI * 2);
        ctx.fillStyle = heat(t);
        ctx.fill();
      }
    }
  }

  return {
    draw,
    dispose() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
  };
}

/** Renders an interpretable, hand-scale-normalized motion density map. */
export function renderMotionMap(canvas, points) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(420, canvas.clientWidth || 480);
  const height = Math.round(width * 0.62);
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.aspectRatio = `${width}/${height}`;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  const pad = 24;
  ctx.fillStyle = "#071522";
  ctx.fillRect(0, 0, width, height);
  if (!points?.length) return;
  const quantile = (values, q) => [...values].sort((a, b) => a - b)[Math.floor((values.length - 1) * q)];
  const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
  const minX = quantile(xs, .02), maxX = quantile(xs, .98), minY = quantile(ys, .02), maxY = quantile(ys, .98);
  const rx = maxX - minX || 1, ry = maxY - minY || 1;
  const cols = 20, rows = 12;
  const bins = Array.from({ length: rows }, () => Array(cols).fill(0));
  const plotted = points.map((p) => {
    const nx = Math.max(0, Math.min(.999, (p.x - minX) / rx));
    const ny = Math.max(0, Math.min(.999, (p.y - minY) / ry));
    bins[Math.floor(ny * rows)][Math.floor(nx * cols)] += 1;
    return { x: pad + nx * (width - pad * 2), y: pad + ny * (height - pad * 2) };
  });
  // Smooth neighboring bins so the chart communicates dwell density rather
  // than showing a noisy one-cell-per-frame occupancy grid.
  const density = bins.map((row, y) => row.map((_, x) => {
    let sum = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const weight = dx === 0 && dy === 0 ? 1 : .42;
      sum += (bins[y + dy]?.[x + dx] || 0) * weight;
    }
    return sum;
  }));
  const maxDensity = Math.max(1, ...density.flat());
  const cellW = (width - pad * 2) / cols, cellH = (height - pad * 2) / rows;
  density.forEach((row, y) => row.forEach((value, x) => {
    const t = value / maxDensity;
    if (t < .025) return;
    const red = Math.round(45 + 206 * Math.pow(t, 1.35));
    const green = Math.round(118 + 73 * t);
    const blue = Math.round(175 - 75 * t);
    ctx.fillStyle = `rgba(${red},${green},${blue},${.12 + t * .78})`;
    ctx.beginPath();
    ctx.roundRect(pad + x * cellW + 1.5, pad + y * cellH + 1.5, cellW - 3, cellH - 3, 3);
    ctx.fill();
  }));
  ctx.strokeStyle = "rgba(166,222,246,.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  plotted.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
  ctx.stroke();
  for (let i = 0; i <= 4; i++) {
    const x = pad + ((width - pad * 2) * i) / 4;
    ctx.strokeStyle = "rgba(148,203,230,.08)";
    ctx.beginPath(); ctx.moveTo(x, pad); ctx.lineTo(x, height - pad); ctx.stroke();
  }
  const mark = (p, color) => { ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); };
  mark(plotted[0], "#7ed6f6"); mark(plotted[plotted.length - 1], "#fbbf66");
}

/** Windowed movement energy over time, derived from the same trajectory. */
export function renderStabilityChart(canvasEl, points) {
  const existing = Chart.getChart(canvasEl);
  if (existing) existing.destroy();
  const speeds = points.slice(1).map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y));
  const bucketSize = Math.max(1, Math.floor(speeds.length / 32));
  const buckets = [];
  for (let i = 0; i < speeds.length; i += bucketSize) {
    const chunk = speeds.slice(i, i + bucketSize);
    buckets.push(chunk.reduce((sum, value) => sum + value, 0) / chunk.length);
  }
  const max = Math.max(...buckets, 1e-6);
  return new Chart(canvasEl, {
    type: "line",
    data: { labels: buckets.map((_, i) => i), datasets: [{ data: buckets.map(v => v / max * 100), borderColor: "#7ed6f6", backgroundColor: "rgba(126,214,246,.12)", fill: true, tension: .35, pointRadius: 0, borderWidth: 2 }] },
    options: { responsive: true, maintainAspectRatio: false, animation: { duration: 260 }, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { min: 0, max: 100, ticks: { display: false }, grid: { color: "rgba(124,200,240,.1)" }, border: { display: false } } } },
  });
}

const chartFont = { family: "'IBM Plex Mono', monospace", size: 10 };

/** Chart.js bar chart of the post-recording frequency spectrum. */
export function renderSpectrumChart(canvasEl, spectrum) {
  const existing = Chart.getChart(canvasEl);
  if (existing) existing.destroy();
  return new Chart(canvasEl, {
    type: "bar",
    data: {
      labels: spectrum.map((p) => p.freq.toFixed(1)),
      datasets: [
        {
          data: spectrum.map((p) => p.mag),
          backgroundColor: "rgba(124,200,240,0.55)",
          borderRadius: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 300 },
      plugins: { legend: { display: false } },
      scales: {
        x: { title: { display: true, text: "Hz", font: chartFont }, ticks: { font: chartFont, maxTicksLimit: 8 }, grid: { display: false } },
        y: { ticks: { font: chartFont }, grid: { color: "rgba(124,200,240,0.14)" } },
      },
    },
  });
}

/** Chart.js live line chart updated during recording. */
export function renderAmplitudeChart(canvasEl, yLabel) {
  const existing = Chart.getChart(canvasEl);
  if (existing) existing.destroy();
  return new Chart(canvasEl, {
    type: "line",
    data: { labels: [], datasets: [{ data: [], borderColor: "#7CC8F0", pointRadius: 0, tension: 0.3, borderWidth: 2 }] },
    options: {
      animation: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false },
        y: {
          suggestedMin: 0,
          title: yLabel ? { display: true, text: yLabel, font: chartFont, color: "#9FB6C9" } : undefined,
          ticks: { font: chartFont, color: "#9FB6C9" },
          grid: { color: "rgba(124,200,240,0.14)" },
        },
      },
    },
  });
}

export function pushAmplitudeSample(chart, series, value, maxLen = 150) {
  series.push(value);
  if (series.length > maxLen) series.shift();
  chart.data.labels = series.map((_, i) => i);
  chart.data.datasets[0].data = series;
  chart.update("none");
}

/** Chart.js paired trend line for the History dashboard. */
export function renderTrendChart(canvasEl, labels, data, color) {
  const existing = Chart.getChart(canvasEl);
  if (existing) existing.destroy();
  return new Chart(canvasEl, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          data,
          borderColor: color,
          backgroundColor: color + "18",
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointBackgroundColor: color,
        },
      ],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { grid: { color: "rgba(124,200,240,0.14)" }, ticks: { font: chartFont } },
        x: { grid: { display: false }, ticks: { font: chartFont } },
      },
    },
  });
}
