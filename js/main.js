/* =========================================================
   Ambrel — scroll-driven 3D perfume bottle (Three.js)
   Built by Harikrishna | Websitopedia
   Every 3D object below is made from code (no models or images).
   ========================================================= */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const isMobile = window.matchMedia('(max-width: 768px)').matches;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const loader = document.getElementById('loader');

/* ---------- Slide-in sections (works even without WebGL) ---------- */
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.2 });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

/* ---------- 3D scene ---------- */
function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}

if (hasWebGL()) {
  init();
} else {
  document.body.classList.add('no-webgl');
  loader.classList.add('done');
}

function init() {
  const canvas = document.getElementById('scene');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0.3, 9);

  // Soft studio reflections, generated procedurally (no HDR file needed)
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.25));
  const key = new THREE.DirectionalLight(0xffe2b0, 2.2);
  key.position.set(4, 6, 5);
  scene.add(key);
  const rim = new THREE.PointLight(0xd9a441, 30, 20);
  rim.position.set(-4, 2, -3);
  scene.add(rim);

  /* ---------- Materials ---------- */
  const gold = new THREE.MeshStandardMaterial({ color: 0xd9a441, metalness: 1, roughness: 0.22 });
  // Clear glass: transparent + clearcoat + environment reflections (fast on every device)
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xfff4e0, metalness: 0, roughness: 0.05, transparent: true, opacity: 0.22,
    clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.6, depthWrite: false, side: THREE.DoubleSide
  });
  const liquid = new THREE.MeshPhysicalMaterial({ color: 0xe0a040, emissive: 0x5a2e05, emissiveIntensity: 0.5, roughness: 0.15, transparent: true, opacity: 0.9 });

  /* ---------- Bottle (built from simple shapes) ---------- */
  const bottle = new THREE.Group();        // whole product (moves left/right with sections)
  scene.add(bottle);
  bottle.scale.setScalar(isMobile ? 0.55 : 0.78);

  const body = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.12, 2.1, 8), glass);   // 8-sided glass body
  body.renderOrder = 2;              // draw glass after the liquid so the liquid shows through
  bottle.add(body);

  const juice = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.97, 1.55, 8), liquid);
  juice.position.y = -0.22;
  bottle.add(juice);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.35, 32), gold);
  neck.position.y = 1.22;
  bottle.add(neck);

  const cap = new THREE.Group();
  const capBody = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.62, 0.85, 6), gold);
  const capTop = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), gold);
  capTop.position.y = 0.6;
  cap.add(capBody, capTop);
  cap.position.y = 1.82;
  bottle.add(cap);

  const band = new THREE.Mesh(new THREE.TorusGeometry(1.08, 0.035, 12, 96), gold);  // gold label band
  band.rotation.x = Math.PI / 2;
  band.position.y = 0.35;
  bottle.add(band);

  const plinth = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.02, 8, 128), gold);   // floating ring under the bottle
  plinth.rotation.x = Math.PI / 2;
  plinth.position.y = -1.35;
  bottle.add(plinth);

  /* ---------- The three notes (appear when the bottle opens) ---------- */
  const noteColors = [0xf6d365, 0xe07a8f, 0xa0643c];
  const notes = noteColors.map((c, i) => {
    const m = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.34, 1),
      new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.35, roughness: 0.35, metalness: 0.2, flatShading: true })
    );
    m.userData.angle = (i / 3) * Math.PI * 2;
    m.scale.setScalar(0.001);
    bottle.add(m);
    return m;
  });

  /* ---------- Gold dust particles ---------- */
  const count = isMobile ? 350 : 900;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 3 + Math.random() * 7;
    const t = Math.random() * Math.PI * 2;
    const p = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(p) * Math.cos(t);
    pos[i * 3 + 1] = r * Math.cos(p) * 0.6;
    pos[i * 3 + 2] = r * Math.sin(p) * Math.sin(t) - 2;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xf3d48b, size: 0.035, transparent: true, opacity: 0.75, depthWrite: false }));
  scene.add(dust);

  /* ---------- Scroll keyframes: one per section ----------
     side  = how far the bottle sits left/right of centre (text is on the other side)
     open  = 0 assembled → 1 taken apart
     notes = 0 hidden → 1 orbiting
  */
  const side = isMobile ? 0 : 1.9;
  const yUp = isMobile ? 1.9 : 0;            // on phones the text is at the bottom, so lift the bottle
  const keys = [
    { x:  side, y: yUp, cam: [0, 0.3, 9],   look: 0,   open: 0, notes: 0, tilt: 0 },     // hero
    { x: -side, y: yUp, cam: [0, 0.8, 10],  look: 0.4, open: 1, notes: 1, tilt: 0.25 },  // notes
    { x:  side, y: yUp, cam: [3.5, 2, 7.5], look: 0.2, open: 0, notes: 0, tilt: -0.15 }, // craft
    { x:  0,    y: yUp + (isMobile ? -0.4 : 1.3), cam: [0, 0.2, 10], look: 0.3, open: 0, notes: 0.35, tilt: 0 } // cta (bottle above the text)
  ];

  const ease = (t) => t * t * (3 - 2 * t);    // smoothstep
  const lerp = (a, b, t) => a + (b - a) * t;

  function stateAt(progress) {
    const seg = Math.min(progress * (keys.length - 1), keys.length - 1.0001);
    const i = Math.floor(seg);
    const t = ease(seg - i);
    const a = keys[i], b = keys[i + 1];
    return {
      x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t),
      camX: lerp(a.cam[0], b.cam[0], t), camY: lerp(a.cam[1], b.cam[1], t), camZ: lerp(a.cam[2], b.cam[2], t),
      look: lerp(a.look, b.look, t), open: lerp(a.open, b.open, t), notes: lerp(a.notes, b.notes, t), tilt: lerp(a.tilt, b.tilt, t)
    };
  }

  let target = 0, smooth = 0;
  function readScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    target = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
  }
  window.addEventListener('scroll', readScroll, { passive: true });
  readScroll();

  // Gentle mouse parallax (desktop only)
  const mouse = { x: 0, y: 0 };
  if (!isMobile) {
    window.addEventListener('pointermove', (e) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    });
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    readScroll();
  });

  /* ---------- Animation loop ---------- */
  const clock = new THREE.Clock();
  let spin = 0, first = true;

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;
    smooth += (target - smooth) * (reduceMotion ? 1 : Math.min(dt * 4, 1));
    const s = stateAt(smooth);

    // Place the product
    bottle.position.x = s.x;
    bottle.position.y = s.y + (reduceMotion ? 0 : Math.sin(time * 1.2) * 0.06);
    if (!reduceMotion) spin += dt * 0.35;
    bottle.rotation.y = spin + smooth * Math.PI * 2;
    bottle.rotation.z = s.tilt * 0.3;

    // Take apart / put back together
    const o = s.open;
    cap.position.y = 1.82 + o * 1.5;
    cap.rotation.y = o * Math.PI;
    cap.rotation.z = o * 0.35;
    neck.position.y = 1.22 + o * 0.7;
    band.position.y = 0.35 + o * 0.9;
    band.scale.setScalar(1 + o * 0.5);
    juice.position.y = -0.22 - o * 0.25;
    body.rotation.y = o * 0.6;
    plinth.scale.setScalar(1 + o * 0.25);

    // Notes orbit around the open bottle
    notes.forEach((m, i) => {
      const a = m.userData.angle + time * 0.6;
      const r = 2.3 * s.notes;
      m.position.set(Math.cos(a) * r, 0.2 + Math.sin(time * 1.4 + i) * 0.25 * s.notes + (i - 1) * 0.5 * s.notes, Math.sin(a) * r);
      m.scale.setScalar(Math.max(s.notes, 0.001));
      m.rotation.x += dt * 0.8; m.rotation.y += dt * 0.6;
    });

    // Camera path + parallax
    camera.position.set(s.camX + mouse.x * 0.4, s.camY - mouse.y * 0.25, s.camZ);
    camera.lookAt(s.x * 0.35, s.y + s.look, 0);

    dust.rotation.y = time * 0.02 + smooth * 0.8;

    renderer.render(scene, camera);
    if (first) { first = false; loader.classList.add('done'); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
