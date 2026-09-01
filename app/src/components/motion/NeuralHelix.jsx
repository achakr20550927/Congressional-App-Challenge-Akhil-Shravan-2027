import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Scroll-driven neural double-helix — the landing hero's living centerpiece.
 * Two intertwined strands of glowing nodes (a DNA/neural-pathway motif that
 * ties to the product) with "rungs" between them and a drifting particle
 * field. It idles with a slow rotation and reacts to the pointer, but its
 * primary motion is SCROLL: as you scroll the page, the helix rotates on its
 * X axis and the camera pushes through it — exactly the "DNA rotates as you
 * scroll" feel, rendered in real time so it's crisp at any size, themeable,
 * and free.
 *
 * `scrollProgressRef` is a ref holding 0..1 hero-scroll progress (set by the
 * Landing page). Reduced-motion: renders a single static frame, no loop.
 */
export default function NeuralHelix({ scrollProgressRef }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 9);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    // Bias the helix toward the right so the left-column headline stays clean.
    const offsetX = mount.clientWidth > 900 ? 2.4 : 0;
    group.position.x = offsetX;
    scene.add(group);

    const GREEN = new THREE.Color(0x2f5d50);
    const GREEN_DIM = new THREE.Color(0x7fb3a3);
    const TERRA = new THREE.Color(0xd97b4f);

    // ---- Two helical strands of nodes ----
    const N = 46;
    const turns = 3.2;
    const radius = 1.5;
    const height = 11;
    const nodeGeo = new THREE.SphereGeometry(0.07, 16, 16);

    const strandMats = [
      new THREE.MeshBasicMaterial({ color: GREEN }),
      new THREE.MeshBasicMaterial({ color: GREEN_DIM }),
    ];
    const nodes = [[], []];
    for (let s = 0; s < 2; s++) {
      for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        const angle = t * turns * Math.PI * 2 + s * Math.PI;
        const y = (t - 0.5) * height;
        const mesh = new THREE.Mesh(nodeGeo, strandMats[s]);
        mesh.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
        mesh.userData = { angle, y };
        group.add(mesh);
        nodes[s].push(mesh);
      }
    }

    // ---- Rungs between the strands (every few nodes) ----
    const rungMat = new THREE.LineBasicMaterial({ color: 0xc9b9a0, transparent: true, opacity: 0.5 });
    const rungs = [];
    for (let i = 0; i < N; i += 2) {
      const geo = new THREE.BufferGeometry().setFromPoints([nodes[0][i].position, nodes[1][i].position]);
      const line = new THREE.Line(geo, rungMat);
      group.add(line);
      rungs.push({ line, i });
    }

    // ---- A few "tracked-point" terracotta accent nodes ----
    const accentMat = new THREE.MeshBasicMaterial({ color: TERRA });
    [6, 20, 34].forEach((i) => {
      nodes[0][i].material = accentMat;
      nodes[0][i].scale.setScalar(1.5);
    });

    // ---- Drifting particle field ----
    const pCount = 320;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount * 3; i += 3) {
      pPos[i] = (Math.random() - 0.5) * 16;
      pPos[i + 1] = (Math.random() - 0.5) * 16;
      pPos[i + 2] = (Math.random() - 0.5) * 10;
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0x9bb0a8, size: 0.03, transparent: true, opacity: 0.55 }));
    scene.add(particles);

    const pointer = { x: 0, y: 0 };
    function onPointer(e) {
      pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.y = (e.clientY / window.innerHeight - 0.5) * 2;
    }
    window.addEventListener("pointermove", onPointer, { passive: true });

    function resize() {
      if (!mount.clientWidth) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    }
    window.addEventListener("resize", resize);

    function render() {
      const p = scrollProgressRef?.current ?? 0;
      const t = performance.now() * 0.001;

      // Scroll drives X-axis rotation + a push-through; idle adds slow spin.
      group.rotation.x = p * Math.PI * 1.15;
      group.rotation.y = reduce ? 0.4 : t * 0.12 + pointer.x * 0.25;
      camera.position.z = 9 - p * 3.2;
      camera.position.y = pointer.y * -0.4;
      camera.lookAt(0, 0, 0);

      // Node pulse (amplitude "aliveness"), skipped under reduced motion.
      // Nodes don't move relative to the group (only the group rotates), so
      // the rungs never need per-frame geometry rebuilds — set once. Only the
      // cheap scale pulse runs each frame.
      if (!reduce) {
        for (let s = 0; s < 2; s++) {
          for (let i = 0; i < N; i++) {
            const n = nodes[s][i];
            const base = n.material === accentMat ? 1.5 : 1;
            n.scale.setScalar(base * (1 + Math.sin(t * 2 + i * 0.3 + s) * 0.12));
          }
        }
        particles.rotation.y = t * 0.03;
      }

      renderer.render(scene, camera);
    }

    // Only run the render loop while the hero canvas is actually on screen —
    // no point burning GPU/CPU on the 3D scene once the user has scrolled past
    // it. Big battery/perf win, and keeps the compositor from choking.
    let raf = null;
    let visible = true;
    function loop() {
      render();
      if (visible && !reduce) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = null;
      }
    }
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible && !reduce && raf == null) raf = requestAnimationFrame(loop);
      },
      { threshold: 0 }
    );
    io.observe(mount);

    if (reduce) {
      render();
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      if (raf != null) cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      nodeGeo.dispose();
      pGeo.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, [scrollProgressRef]);

  return <div ref={mountRef} style={{ position: "absolute", inset: 0 }} aria-hidden="true" />;
}
