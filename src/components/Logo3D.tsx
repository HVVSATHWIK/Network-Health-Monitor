import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Logo3DProps {
  /** Pixel dimensions for the canvas (square) */
  size?: number;
  /** Rotation speed multiplier (1 = default ~5s orbit) */
  speed?: number;
  /** Color scheme: 'blue' for Login, 'boot' for BootSequence cyan accent */
  colorScheme?: 'blue' | 'boot';
  /** Extra CSS class on the container */
  className?: string;
}

/* ───────── topology ─────────
   Mirrors favicon.svg: 4 nodes + 5 edges
   
     N0 (top)
    / \
   N1───N2
    \ /
     N3 (bottom)
*/

const NODE_POSITIONS: [number, number, number][] = [
  [0, 1.6, 0],    // top
  [-1.4, 0, 0.6], // left
  [1.4, 0, -0.6], // right
  [0, -1.4, 0],   // bottom
];

const EDGES: [number, number][] = [
  [0, 1], [0, 2], // top → left, top → right
  [1, 3], [2, 3], // left → bottom, right → bottom
  [1, 2],         // left ↔ right
];

export default function Logo3D({
  size = 120,
  speed = 1,
  colorScheme = 'blue',
  className = '',
}: Logo3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ─── palette ───
    const palette = colorScheme === 'boot'
      ? {
          node: new THREE.Color(0x22d3ee),      // cyan-400
          nodeEmissive: new THREE.Color(0x06b6d4), // cyan-500
          edge: new THREE.Color(0x0ea5e9),       // sky-500
          pulse: new THREE.Color(0x67e8f9),      // cyan-300
          ambient: 0x0c4a6e,                     // sky-900
          pointLight: 0x22d3ee,
          pulseNode: new THREE.Color(0x34d399),  // emerald-400  (heartbeat node)
        }
      : {
          node: new THREE.Color(0x3b82f6),       // blue-500
          nodeEmissive: new THREE.Color(0x2563eb), // blue-600
          edge: new THREE.Color(0x60a5fa),        // blue-400
          pulse: new THREE.Color(0x93c5fd),       // blue-300
          ambient: 0x1e3a5f,
          pointLight: 0x3b82f6,
          pulseNode: new THREE.Color(0x10b981),   // emerald-500
        };

    // ─── renderer ───
    const dpr = Math.min(window.devicePixelRatio, 2);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // ─── scene ───
    const scene = new THREE.Scene();

    // ─── camera ───
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0.4, 6);
    camera.lookAt(0, 0, 0);

    // ─── lights ───
    scene.add(new THREE.AmbientLight(palette.ambient, 0.6));

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(3, 5, 4);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(palette.pointLight, 1.2, 12);
    rimLight.position.set(-3, 2, 3);
    scene.add(rimLight);

    // ─── root group (will be rotated) ───
    const root = new THREE.Group();
    scene.add(root);

    // ─── nodes ───
    const nodeMeshes: THREE.Mesh[] = [];
    const nodeGeo = new THREE.SphereGeometry(0.32, 32, 32);

    NODE_POSITIONS.forEach((pos, idx) => {
      const mat = new THREE.MeshStandardMaterial({
        color: idx === 0 ? palette.pulseNode : palette.node,
        emissive: idx === 0 ? palette.pulseNode : palette.nodeEmissive,
        emissiveIntensity: idx === 0 ? 0.6 : 0.3,
        metalness: 0.4,
        roughness: 0.3,
      });
      const mesh = new THREE.Mesh(nodeGeo, mat);
      mesh.position.set(...pos);
      root.add(mesh);
      nodeMeshes.push(mesh);

      // per-node point light for glow bleed
      const glow = new THREE.PointLight(
        idx === 0 ? palette.pulseNode.getHex() : palette.node.getHex(),
        0.5,
        3,
      );
      glow.position.set(...pos);
      root.add(glow);
    });

    // outer glow shells (transparent, larger spheres)
    const glowGeo = new THREE.SphereGeometry(0.5, 24, 24);
    NODE_POSITIONS.forEach((pos, idx) => {
      const glowMat = new THREE.MeshBasicMaterial({
        color: idx === 0 ? palette.pulseNode : palette.node,
        transparent: true,
        opacity: 0.08,
        depthWrite: false,
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      glowMesh.position.set(...pos);
      root.add(glowMesh);
    });

    // ─── edges (tubes) ───
    const edgeMeshes: THREE.Mesh[] = [];
    EDGES.forEach(([a, b]) => {
      const pA = new THREE.Vector3(...NODE_POSITIONS[a]);
      const pB = new THREE.Vector3(...NODE_POSITIONS[b]);
      const mid = pA.clone().add(pB).multiplyScalar(0.5);
      const dir = pB.clone().sub(pA);
      const edgeLen = dir.length();

      const tubeGeo = new THREE.CylinderGeometry(0.04, 0.04, edgeLen, 8, 1);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: palette.edge,
        emissive: palette.edge,
        emissiveIntensity: 0.2,
        metalness: 0.3,
        roughness: 0.5,
        transparent: true,
        opacity: 0.6,
      });
      const tube = new THREE.Mesh(tubeGeo, tubeMat);

      // position & orient
      tube.position.copy(mid);
      tube.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        dir.clone().normalize(),
      );

      root.add(tube);
      edgeMeshes.push(tube);
    });

    // ─── data-pulse particles ───
    const PULSE_COUNT = 8;
    const pulseGeo = new THREE.SphereGeometry(0.07, 12, 12);
    const pulseMat = new THREE.MeshBasicMaterial({
      color: palette.pulse,
      transparent: true,
      opacity: 0.9,
    });

    interface PulseData {
      mesh: THREE.Mesh;
      edgeIdx: number;
      t: number;          // 0→1 progress
      speed: number;
      forward: boolean;
    }
    const pulses: PulseData[] = [];

    for (let i = 0; i < PULSE_COUNT; i++) {
      const mesh = new THREE.Mesh(pulseGeo, pulseMat.clone());
      root.add(mesh);
      pulses.push({
        mesh,
        edgeIdx: Math.floor(Math.random() * EDGES.length),
        t: Math.random(),
        speed: 0.4 + Math.random() * 0.6,
        forward: Math.random() > 0.5,
      });
    }

    // ─── animation loop ───
    let frameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const dt = clock.getDelta();

      // slow orbit
      root.rotation.y = elapsed * 0.2 * speed;
      // gentle floating tilt
      root.rotation.x = Math.sin(elapsed * 0.5) * 0.08;
      root.rotation.z = Math.cos(elapsed * 0.3) * 0.04;

      // pulse heartbeat on node 0
      const heartbeat = 0.3 + 0.3 * Math.abs(Math.sin(elapsed * 2.5));
      const n0Mat = nodeMeshes[0].material as THREE.MeshStandardMaterial;
      n0Mat.emissiveIntensity = heartbeat;
      nodeMeshes[0].scale.setScalar(1 + 0.08 * Math.sin(elapsed * 2.5));

      // subtle pulse on all other nodes
      for (let i = 1; i < nodeMeshes.length; i++) {
        const nMat = nodeMeshes[i].material as THREE.MeshStandardMaterial;
        nMat.emissiveIntensity = 0.25 + 0.1 * Math.sin(elapsed * 1.5 + i);
      }

      // animate data pulses along edges
      for (const p of pulses) {
        p.t += dt * p.speed * speed;
        if (p.t > 1) {
          p.t = 0;
          p.edgeIdx = Math.floor(Math.random() * EDGES.length);
          p.forward = Math.random() > 0.5;
        }

        const [a, b] = EDGES[p.edgeIdx];
        const pA = new THREE.Vector3(...NODE_POSITIONS[a]);
        const pB = new THREE.Vector3(...NODE_POSITIONS[b]);
        const lerp = p.forward ? p.t : 1 - p.t;
        p.mesh.position.lerpVectors(pA, pB, lerp);

        // fade in/out near endpoints
        const edgeFade = Math.sin(lerp * Math.PI);
        (p.mesh.material as THREE.MeshBasicMaterial).opacity = 0.3 + 0.7 * edgeFade;
      }

      // edge glow breathing
      for (const e of edgeMeshes) {
        const eMat = e.material as THREE.MeshStandardMaterial;
        eMat.emissiveIntensity = 0.15 + 0.1 * Math.sin(elapsed * 2);
      }

      renderer.render(scene, camera);
    };

    animate();

    // ─── cleanup ───
    const cleanup = () => {
      cancelAnimationFrame(frameId);
      renderer.dispose();
      nodeGeo.dispose();
      glowGeo.dispose();
      pulseGeo.dispose();
      edgeMeshes.forEach((m) => {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
      nodeMeshes.forEach((m) => (m.material as THREE.Material).dispose());
      pulses.forEach((p) => {
        (p.mesh.material as THREE.Material).dispose();
      });
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };

    cleanupRef.current = cleanup;
    return cleanup;
  }, [size, speed, colorScheme]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: size, height: size, position: 'relative' }}
    />
  );
}
