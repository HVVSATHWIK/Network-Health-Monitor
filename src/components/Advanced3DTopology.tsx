import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import { Device, NetworkConnection, Alert, DependencyPath } from '../types/network';
import AddDeviceModal from './AddDeviceModal';

// Enable BVH Acceleration
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;
import { Settings, Zap, Activity, RefreshCw, X, Plus, Info, Network, RotateCcw } from 'lucide-react';
// import { analyzeRootCause } from '../utils/aiLogic'; // Removed

interface Advanced3DTopologyProps {
  devices: Device[];
  connections: NetworkConnection[];
  alerts: Alert[];
  dependencyPaths: DependencyPath[];
  onInjectFault?: (type: 'l1' | 'l7') => void;
  onReset?: () => void;
  // tourStep: number; // Removed
  showControls?: boolean;
  onShowControlsChange?: (show: boolean) => void;
  selectedDeviceId?: string | null;
  onDeviceSelect?: (id: string | null) => void;
  onAddDevice?: (device: Device, parentId?: string) => void; // Added Prop
}

export default function Advanced3DTopology(props: Advanced3DTopologyProps) {
  const {
    devices,
    connections,
    onInjectFault,
    onReset,
    // tourStep,
    showControls = false,
    onShowControlsChange,
    selectedDeviceId,
    onDeviceSelect,
    onAddDevice,
  } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false); // New State for Modal
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isTouchLikely = window.matchMedia?.('(pointer: coarse)')?.matches ?? false;
    if (isTouchLikely) setIsGuideOpen(true);
  }, []);

  // AI State Removed
  // const [isAnalyzing, setIsAnalyzing] = useState(false);
  // const [aiInsight, setAiInsight] = useState<string | null>(null);

  // Camera Animation State
  const targetCamPos = useRef(new THREE.Vector3(120, 80, 160));
  const targetLookAt = useRef(new THREE.Vector3(0, 40, 0));
  const isTransitioning = useRef(false);
  const transitionTimeout = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  // --- 1. INITIALIZATION EFFEECT (Run Once) ---
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const labelRendererRef = useRef<CSS2DRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  const resetCameraView = () => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    controls.target.set(0, 40, 0);
    camera.position.set(120, 80, 160);
    controls.update();
  };

  // Groups for updating content
  const deviceGroupRef = useRef<THREE.Group | null>(null);
  const lineGroupRef = useRef<THREE.Group | null>(null);
  const packetGroupRef = useRef<THREE.Group | null>(null);

  // Packet animation refs
  const packetsRef = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // SCENE
    const scene = new THREE.Scene();
    scene.background = null;
    scene.fog = new THREE.Fog(0x0f172a, 50, 400);
    sceneRef.current = scene;

    // CAMERA
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(120, 80, 160);
    camera.lookAt(0, 40, 0);
    cameraRef.current = camera;

    // RENDERERS
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0px';
    renderer.domElement.style.left = '0px';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(width, height);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.left = '0px';
    labelRenderer.domElement.style.width = '100%';
    labelRenderer.domElement.style.height = '100%';
    labelRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(labelRenderer.domElement);
    labelRendererRef.current = labelRenderer;

    // CONTROLS
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 50;
    controls.maxDistance = 500;
    controls.maxPolarAngle = Math.PI / 2;
    controls.target.set(0, 40, 0);
    controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
    controls.mouseButtons.MIDDLE = THREE.MOUSE.PAN;
    controls.mouseButtons.RIGHT = THREE.MOUSE.PAN;
    controls.touches.ONE = THREE.TOUCH.ROTATE;
    controls.touches.TWO = THREE.TOUCH.PAN;
    controls.update();
    controlsRef.current = controls;

    // Custom two-finger gesture separation for touch devices:
    // - midpoint movement => pan
    // - distance change => zoom
    const touchState = {
      isTwoFinger: false,
      prevDistance: 0,
      prevMidX: 0,
      prevMidY: 0,
      prevT1X: 0,
      prevT1Y: 0,
      prevT2X: 0,
      prevT2Y: 0,
      mode: 'none' as 'none' | 'pan' | 'pinch',
      modeLockFrames: 0,
    };

    const getTouchMetrics = (touches: TouchList) => {
      if (touches.length < 2) return null;
      const t1 = touches[0];
      const t2 = touches[1];
      const dx = t2.clientX - t1.clientX;
      const dy = t2.clientY - t1.clientY;
      const distance = Math.hypot(dx, dy);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;
      return { distance, midX, midY };
    };

    const beginTwoFingerGesture = (touches: TouchList) => {
      const metrics = getTouchMetrics(touches);
      if (!metrics) return;
      touchState.isTwoFinger = true;
      touchState.prevDistance = metrics.distance;
      touchState.prevMidX = metrics.midX;
      touchState.prevMidY = metrics.midY;
      touchState.prevT1X = touches[0].clientX;
      touchState.prevT1Y = touches[0].clientY;
      touchState.prevT2X = touches[1].clientX;
      touchState.prevT2Y = touches[1].clientY;
      touchState.mode = 'none';
      touchState.modeLockFrames = 0;
      controls.enabled = false;
    };

    const endTwoFingerGesture = () => {
      touchState.isTwoFinger = false;
      touchState.mode = 'none';
      touchState.modeLockFrames = 0;
      controls.enabled = true;
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        beginTwoFingerGesture(event.touches);
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!touchState.isTwoFinger || event.touches.length !== 2) return;

      const metrics = getTouchMetrics(event.touches);
      if (!metrics) return;

      event.preventDefault();

      const distDelta = metrics.distance - touchState.prevDistance;
      const midDeltaX = metrics.midX - touchState.prevMidX;
      const midDeltaY = metrics.midY - touchState.prevMidY;
      const pinchStrength = Math.abs(distDelta);
      const panStrength = Math.hypot(midDeltaX, midDeltaY);

      const t1 = event.touches[0];
      const t2 = event.touches[1];
      const t1dx = t1.clientX - touchState.prevT1X;
      const t1dy = t1.clientY - touchState.prevT1Y;
      const t2dx = t2.clientX - touchState.prevT2X;
      const t2dy = t2.clientY - touchState.prevT2Y;
      const oppositeMotion = (t1dx * t2dx + t1dy * t2dy) < -0.15;

      const relativeDistanceChange = pinchStrength / Math.max(metrics.distance, 1);
      const pinchEnterThreshold = 0.016;
      const pinchExitThreshold = 0.008;
      const panMovementThreshold = 0.35;

      if (touchState.mode === 'pinch') {
        if (relativeDistanceChange < pinchExitThreshold && panStrength > panMovementThreshold) {
          touchState.mode = 'pan';
        }
      } else {
        // Default to pan for two-finger drag.
        // Enter pinch only when scale change is clear and fingers move in opposite directions.
        touchState.mode = (relativeDistanceChange > pinchEnterThreshold && oppositeMotion) ? 'pinch' : 'pan';
      }

      if (touchState.mode === 'pinch') {
        const zoomScale = Math.exp(-distDelta * 0.0026);
        const offset = camera.position.clone().sub(controls.target);
        offset.multiplyScalar(zoomScale);
        const touchMinDistance = Math.max(controls.minDistance, 52);
        const touchMaxDistance = Math.min(controls.maxDistance, 300);
        const clampedDistance = Math.max(touchMinDistance, Math.min(touchMaxDistance, offset.length()));
        offset.setLength(clampedDistance);
        camera.position.copy(controls.target.clone().add(offset));
      } else if (touchState.mode === 'pan') {
        const offset = camera.position.clone().sub(controls.target);
        const targetDistance = offset.length() * Math.tan((camera.fov / 2) * (Math.PI / 180));
        const panX = (2 * midDeltaX * targetDistance) / height * 1.05;
        const panY = (2 * midDeltaY * targetDistance) / height * 1.05;

        const pan = new THREE.Vector3();
        const elementMatrix = camera.matrix.elements;
        const xAxis = new THREE.Vector3(elementMatrix[0], elementMatrix[1], elementMatrix[2]);
        const yAxis = new THREE.Vector3(elementMatrix[4], elementMatrix[5], elementMatrix[6]);

        pan.add(xAxis.multiplyScalar(-panX));
        pan.add(yAxis.multiplyScalar(panY));

        camera.position.add(pan);
        controls.target.add(pan);
      }

      touchState.prevDistance = metrics.distance;
      touchState.prevMidX = metrics.midX;
      touchState.prevMidY = metrics.midY;
      touchState.prevT1X = t1.clientX;
      touchState.prevT1Y = t1.clientY;
      touchState.prevT2X = t2.clientX;
      touchState.prevT2Y = t2.clientY;
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (event.touches.length < 2) {
        endTwoFingerGesture();
      }
    };

    renderer.domElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    renderer.domElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    renderer.domElement.addEventListener('touchend', handleTouchEnd, { passive: true });
    renderer.domElement.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    controls.addEventListener('start', () => {
      isTransitioning.current = false;
      if (transitionTimeout.current != null) window.clearTimeout(transitionTimeout.current);
    });

    // LIGHTING
    const lights = [
      new THREE.PointLight(0x3b82f6, 2, 200),
      new THREE.PointLight(0x10b981, 1.5, 150),
      new THREE.DirectionalLight(0xffffff, 1.5),
      new THREE.SpotLight(0xa855f7, 5, 100, 0.5, 0.5, 1)
    ];
    lights[0].position.set(50, 50, 50);
    lights[1].position.set(-50, 30, -50);
    lights[2].position.set(20, 100, 20);
    lights[3].position.set(0, 50, -50);

    lights.forEach(light => {
      light.castShadow = true;
      scene.add(light);
    });
    scene.add(new THREE.AmbientLight(0xffffff, 1.2));

    // GRID
    const gridHelper = new THREE.GridHelper(300, 50, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -10;
    scene.add(gridHelper);

    // GROUPS
    const deviceGroup = new THREE.Group();
    scene.add(deviceGroup);
    deviceGroupRef.current = deviceGroup;

    const lineGroup = new THREE.Group();
    scene.add(lineGroup);
    lineGroupRef.current = lineGroup;

    const packetGroup = new THREE.Group();
    scene.add(packetGroup);
    packetGroupRef.current = packetGroup;

    // Raycaster & Interaction State
    const raycaster = new THREE.Raycaster();
    raycaster.firstHitOnly = true;
    const mouse = new THREE.Vector2();
    let hoveredCable: THREE.Mesh | null = null;
    let tooltipObject: CSS2DObject | null = null;

    const tooltipDiv = document.createElement('div');
    tooltipDiv.className = 'pointer-events-none bg-slate-900/90 text-white p-2 rounded border border-blue-500/50 shadow-xl opacity-0 transition-opacity duration-200 text-xs font-mono';
    tooltipObject = new CSS2DObject(tooltipDiv);
    tooltipObject.position.set(0, 0, 0);
    scene.add(tooltipObject);

    // Animation Loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      controls.update();

      if (isTransitioning.current && camera && controls) {
        camera.position.lerp(targetCamPos.current, 0.05);
        controls.target.lerp(targetLookAt.current, 0.05);
      }

      // Device Animations
      deviceGroup.children.forEach((group) => {
        const gd = group.userData as { originalY?: number; floatOffset?: number };
        if (group instanceof THREE.Group && typeof gd.originalY === 'number' && typeof gd.floatOffset === 'number') {
          group.position.y = gd.originalY + Math.sin((Date.now() + gd.floatOffset) * 0.0005) * 1.5;
        }

        group.children.forEach((child) => {
          const cd = child.userData as { blinkSpeed?: number };
          if (typeof cd.blinkSpeed === 'number' && Math.random() < cd.blinkSpeed) {
            child.visible = !child.visible;
          }
        });
      });

      // Packet Animations
      packetsRef.current.forEach((pkt) => {
        const pd = pkt.userData as { curve?: THREE.CatmullRomCurve3; progress?: number; speed?: number };
        if (!pd.curve || typeof pd.progress !== 'number' || typeof pd.speed !== 'number') return;

        pd.progress += pd.speed;
        if (pd.progress > 1) pd.progress = 0;
        const point = pd.curve.getPoint(pd.progress);
        pkt.position.copy(point);
        const lookAtPoint = pd.curve.getPoint(Math.min(pd.progress + 0.01, 1));
        pkt.lookAt(lookAtPoint);
      });

      // Hover Logic
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(lineGroup.children, true);

      if (intersects.length > 0) {
        const hit = intersects[0];
        const object = hit.object as THREE.Mesh;

        if (hoveredCable !== object) {
          if (hoveredCable) {
            const prevMat = hoveredCable.material as THREE.MeshPhongMaterial;
            const isCrit = hoveredCable.userData.status === 'CRITICAL';
            prevMat.color.setHex(isCrit ? 0xef4444 : 0x475569);
            prevMat.emissive.setHex(isCrit ? 0x7f1d1d : 0x000000);
          }
          hoveredCable = object;
          const mat = object.material as THREE.MeshPhongMaterial;
          mat.color.setHex(0x3b82f6);
          mat.emissive.setHex(0x1d4ed8);

          if (tooltipObject) {
            tooltipDiv.innerHTML = `
                    <div class="font-bold text-blue-400">LINK: ${object.userData.source} ↔ ${object.userData.target}</div>
                    <div>STATUS: <span class="${object.userData.status === 'CRITICAL' ? 'text-red-500' : 'text-green-500'}">${object.userData.status}</span></div>
                    <div class="text-[10px] text-slate-400 mt-1">LATENCY: ${Math.floor(Math.random() * 20)}ms</div>
                 `;
            tooltipDiv.style.opacity = '1';
            tooltipObject.position.copy(hit.point);
          }
        } else {
          if (tooltipObject) tooltipObject.position.copy(hit.point);
        }
      } else {
        if (hoveredCable) {
          const prevMat = hoveredCable.material as THREE.MeshPhongMaterial;
          const isCrit = hoveredCable.userData.status === 'CRITICAL';
          prevMat.color.setHex(isCrit ? 0xef4444 : 0x475569);
          prevMat.emissive.setHex(isCrit ? 0x7f1d1d : 0x000000);
          hoveredCable = null;
          if (tooltipObject) tooltipDiv.style.opacity = '0';
        }
      }

      // Explicit clear to prevent any frame-buffer accumulation/ghosting
      renderer.clear(true, true, true);
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    };
    animate();

    const onPointerMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = - ((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    container.addEventListener('mousemove', onPointerMove);
    // containerRef.current.addEventListener('click', onClick); // Handled separately

    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      labelRenderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      container.innerHTML = '';
      container.removeEventListener('mousemove', onPointerMove);
      renderer.domElement.removeEventListener('touchstart', handleTouchStart);
      renderer.domElement.removeEventListener('touchmove', handleTouchMove);
      renderer.domElement.removeEventListener('touchend', handleTouchEnd);
      renderer.domElement.removeEventListener('touchcancel', handleTouchEnd);
      renderer.dispose();
      // Dispose Geometries if tracked...
    };
  }, []); // Run Once!


  // --- 2. UPDATE CONTENT EFFECT ---
  // Re-build scene objects when data changes, without killing renderer
  useEffect(() => {
    if (!deviceGroupRef.current || !lineGroupRef.current || !packetGroupRef.current) return;

    // Defensive: avoid any stale CSS2D DOM elements accumulating across rebuilds
    if (labelRendererRef.current) {
      labelRendererRef.current.domElement.innerHTML = '';
    }

    // Clear Groups
    deviceGroupRef.current.clear();
    lineGroupRef.current.clear();
    packetGroupRef.current.clear();
    packetsRef.current = []; // clear animation array

    const statusColors: Record<string, number> = {
      healthy: 0x10b981,
      warning: 0xf59e0b,
      critical: 0xef4444,
      offline: 0x6b7280
    };

    // Helper builders (duplicated scope, could be moved out)
    const createServerRack = (color: number) => {
      const group = new THREE.Group();
      const bodyGeo = new THREE.BoxGeometry(6, 12, 6);
      const bodyMat = new THREE.MeshPhongMaterial({ color: 0x475569, shininess: 30 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.castShadow = true; body.receiveShadow = true;
      group.add(body);
      const faceGeo = new THREE.PlaneGeometry(5, 11);
      const faceMat = new THREE.MeshPhongMaterial({ color: 0x1e293b, side: THREE.DoubleSide });
      const face = new THREE.Mesh(faceGeo, faceMat);
      face.position.z = 3.01;
      group.add(face);
      for (let i = 0; i < 12; i++) {
        const ledGeo = new THREE.PlaneGeometry(0.3, 0.1);
        const ledColor = Math.random() > 0.8 ? 0xef4444 : (Math.random() > 0.5 ? 0x22c55e : 0x3b82f6);
        const led = new THREE.Mesh(ledGeo, new THREE.MeshBasicMaterial({ color: ledColor }));
        led.position.set((i % 2) * 2 - 1, Math.floor(i / 2) * 1.5 - 4, 3.02);
        led.userData.blinkSpeed = 0.05 + Math.random() * 0.1;
        group.add(led);
      }
      if (color === 0xef4444) {
        const glow = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 0.5, 32), new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.3 }));
        glow.position.y = -6;
        group.add(glow);
      }
      return group;
    };
    const createSwitchUnit = (color: number) => {
      const group = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(8, 2, 5), new THREE.MeshPhongMaterial({ color: 0xcbd5e1, shininess: 100 }));
      body.castShadow = true; group.add(body);
      for (let i = 0; i < 8; i++) {
        const port = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.1), new THREE.MeshBasicMaterial({ color: color === 0xef4444 ? 0xef4444 : 0x10b981 }));
        port.position.set((i * 0.8) - 2.8, 0, 2.51);
        group.add(port);
      }
      return group;
    };
    const createPLCUnit = (color: number) => {
      const group = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(4, 5, 3), new THREE.MeshPhongMaterial({ color: 0x94a3b8 }));
      body.castShadow = true; group.add(body);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(5, 1, 0.5), new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 }));
      rail.position.set(0, 0, -1.6); group.add(rail);
      const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 16), new THREE.MeshBasicMaterial({ color: color }));
      beacon.position.y = 2.5; group.add(beacon);
      return group;
    };

    // Position & Place Devices
    const positionMap: Record<string, [number, number, number]> = {};
    const tiers = {
      floor: devices.filter(d => ['sensor', 'switch'].includes(d.type)),
      edge: devices.filter(d => ['plc', 'gateway', 'router'].includes(d.type)),
      cloud: devices.filter(d => ['server', 'scada'].includes(d.type))
    };
    const placeTier = (tierDevices: Device[], yVals: number, radius: number) => {
      const angleStep = (2 * Math.PI) / (tierDevices.length || 1);
      tierDevices.forEach((device, idx) => {
        const angle = idx * angleStep + (yVals * 0.1);
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = yVals;
        positionMap[device.id] = [x, y, z];

        const statusColor = statusColors[device.status];
        let mesh;
        if (['server', 'scada'].includes(device.type)) mesh = createServerRack(statusColor);
        else if (['switch', 'router', 'gateway'].includes(device.type)) mesh = createSwitchUnit(statusColor);
        else mesh = createPLCUnit(statusColor);

        mesh.position.set(x, y, z);
        mesh.lookAt(0, y, 0);

        // Selection Highlight
        if (selectedDeviceId && device.id === selectedDeviceId) {
          const ring = new THREE.Mesh(new THREE.TorusGeometry(8, 0.5, 16, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }));
          ring.rotateX(Math.PI / 2);
          mesh.add(ring);
        }

        // Props
        mesh.userData = { ...mesh.userData, id: device.id, type: 'device', originalY: y, floatOffset: Math.random() * 100 };
        deviceGroupRef.current?.add(mesh); // Add to ref group

        // Label
        const isCritical = device.status === 'critical';
        const hexColor = isCritical ? '#ef4444' : (device.status === 'warning' ? '#f59e0b' : '#34d399');
        const glitchClass = isCritical ? 'animate-pulse' : '';
        const div = document.createElement('div');
        div.className = 'flex flex-col items-center pointer-events-none';
        div.innerHTML = `
           <div style="height: 40px; width: 1px; background: linear-gradient(to top, ${hexColor}, transparent);"></div>
           <div class="px-3 py-2 bg-slate-900/60 border-l-2 mt-1 ${glitchClass}" style="border-left-color: ${hexColor}; box-shadow: 0 0 15px ${hexColor}40;">
             <div class="text-[10px] uppercase tracking-widest font-mono mb-0.5" style="color: ${hexColor};">ID: ${device.id.toUpperCase()}</div>
             <div class="text-xs font-bold text-white whitespace-nowrap flex items-center gap-2">
               <span style="width: 6px; height: 6px; background-color: ${hexColor}; box-shadow: 0 0 8px ${hexColor};"></span>
               ${device.name}
             </div>
           </div>`;
        const label = new CSS2DObject(div);
        label.position.set(0, 8, 0);
        mesh.add(label);
      });
    };

    placeTier(tiers.floor, 0, 80);
    placeTier(tiers.edge, 50, 50);
    placeTier(tiers.cloud, 100, 30);

    // Connections
    connections.forEach(conn => {
      const sourcePos = positionMap[conn.source];
      const targetPos = positionMap[conn.target];
      if (!sourcePos || !targetPos) return;

      const p1 = new THREE.Vector3(...sourcePos);
      const p2 = new THREE.Vector3(...targetPos);
      const dist = p1.distanceTo(p2);
      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      mid.y -= dist * 0.1;
      if (mid.y < 2) mid.y = 2;

      const curve = new THREE.CatmullRomCurve3([p1, mid, p2]);
      const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.4, 8, false);
      tubeGeo.computeBoundsTree();

      const isCritical = devices.find(d => d.id === conn.source)?.status === 'critical' || devices.find(d => d.id === conn.target)?.status === 'critical';
      const tubeMat = new THREE.MeshPhongMaterial({
        color: isCritical ? 0xef4444 : 0x475569,
        emissive: isCritical ? 0x7f1d1d : 0x000000,
        shininess: 20
      });
      const cable = new THREE.Mesh(tubeGeo, tubeMat);
      cable.userData = { id: conn.id, source: conn.source, target: conn.target, status: isCritical ? 'CRITICAL' : 'HEALTHY' };
      lineGroupRef.current?.add(cable);

      // Packets
      if (conn.status === 'healthy' && !isCritical) {
        for (let i = 0; i < 2; i++) {
          const packet = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 0.5), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
          packet.userData.curve = curve;
          packet.userData.progress = Math.random();
          packet.userData.speed = 0.003 + (Math.random() * 0.002);
          packetGroupRef.current?.add(packet);
          packetsRef.current.push(packet);
        }
      }
    });

  }, [devices, connections, selectedDeviceId]); // Updates when data changes

  // Click Handler for Device Selection (Attached via ref to avoid stale closure if needed, but here simple click handler logic suffices if attached to DOM correctly)
  // Actually, we need to attach the click listener to the container, but it needs access to 'devices' and 'scene' which are now in refs or closure.
  // We can attach a click listener in a separate effect that depends on [onDeviceSelect]
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleClick = (event: MouseEvent) => {
      if (!onDeviceSelect || !cameraRef.current || !sceneRef.current) return;
      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, - ((event.clientY - rect.top) / rect.height) * 2 + 1);

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);

      // Find device meshes in the deviceGroup
      const hits = raycaster.intersectObjects(deviceGroupRef.current?.children || [], true);
      if (hits.length > 0) {
        // Find parent group (device mesh group)
        let obj = hits[0].object;
        while (obj.parent && obj.parent !== deviceGroupRef.current) {
          obj = obj.parent;
        }
        if (obj.userData && obj.userData.id) {
          onDeviceSelect(obj.userData.id);
        }
      }
    };
    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [onDeviceSelect]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      if (!camera || !controls) return;

      const targetElement = event.target as HTMLElement | null;
      const isTyping = targetElement && (targetElement.tagName === 'INPUT' || targetElement.tagName === 'TEXTAREA' || targetElement.isContentEditable);
      if (isTyping) return;

      const offset = camera.position.clone().sub(controls.target);
      const distance = offset.length();
      const panStep = Math.max(distance * 0.03, 1.5);

      const panVector = new THREE.Vector3();
      const elementMatrix = camera.matrix.elements;
      const xAxis = new THREE.Vector3(elementMatrix[0], elementMatrix[1], elementMatrix[2]);
      const yAxis = new THREE.Vector3(elementMatrix[4], elementMatrix[5], elementMatrix[6]);

      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        resetCameraView();
        return;
      }

      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        const next = offset.clone().multiplyScalar(0.92);
        if (next.length() >= controls.minDistance) {
          camera.position.copy(controls.target.clone().add(next));
          controls.update();
        }
        return;
      }

      if (event.key === '-') {
        event.preventDefault();
        const next = offset.clone().multiplyScalar(1.08);
        if (next.length() <= controls.maxDistance) {
          camera.position.copy(controls.target.clone().add(next));
          controls.update();
        }
        return;
      }

      if (event.key === 'ArrowLeft') panVector.add(xAxis.multiplyScalar(panStep));
      if (event.key === 'ArrowRight') panVector.add(xAxis.multiplyScalar(-panStep));
      if (event.key === 'ArrowUp') panVector.add(yAxis.multiplyScalar(-panStep));
      if (event.key === 'ArrowDown') panVector.add(yAxis.multiplyScalar(panStep));

      if (panVector.lengthSq() > 0) {
        event.preventDefault();
        camera.position.add(panVector);
        controls.target.add(panVector);
        controls.update();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-lg p-6 relative border border-slate-800 shadow-2xl">
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 border border-blue-400/60 shadow-lg shadow-blue-500/25 flex items-center justify-center">
            <Network className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">3D Network Topology</h2>
            <p className="text-xs text-blue-300/90 font-mono uppercase tracking-widest">NetMonit Digital Twin</p>
          </div>
        </div>
        <p className="text-sm text-slate-400 max-w-xs">Interactive operational map with instant gesture guidance for mouse and touch users.</p>
      </div>

      <div id="canvas-container" ref={containerRef} style={{ width: '100%', height: '600px', background: 'radial-gradient(circle at center, #0f172a 0%, #020617 100%)' }} className="rounded-lg overflow-hidden relative" />

      <div className="absolute top-6 right-8 z-[70] flex items-center gap-2">
        <button
          type="button"
          onClick={resetCameraView}
          aria-label="Reset camera view"
          className="h-10 w-10 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-100 border border-slate-600 shadow-lg flex items-center justify-center transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => setIsGuideOpen((prev) => !prev)}
          aria-label="Show topology controls and legend"
          className="h-10 w-10 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-100 border border-slate-600 shadow-lg flex items-center justify-center transition-colors"
        >
          <Info className="w-5 h-5" />
        </button>

        {onAddDevice && (
          <button onClick={() => setIsAddDeviceOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full shadow-lg transition-all border border-blue-400/50">
            <Plus className="w-4 h-4" /><span>Add Device</span>
          </button>
        )}
      </div>

      {isGuideOpen && (
        <div className="absolute top-20 right-8 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-3 rounded-xl text-[11px] text-slate-200 z-[80] shadow-2xl w-64 animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-blue-300 tracking-wide">Navigation Guide</h3>
            <button
              type="button"
              onClick={() => setIsGuideOpen(false)}
              aria-label="Close navigation guide"
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="border-b border-slate-700 pb-2 mb-2">
            <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Mouse Controls</div>
            <ul className="space-y-1.5">
              <li className="flex justify-between gap-3"><span className="text-slate-300">Rotate</span><span className="text-slate-100 font-medium">Left Drag</span></li>
              <li className="flex justify-between gap-3"><span className="text-slate-300">Pan</span><span className="text-slate-100 font-medium">Middle Drag / Right Drag</span></li>
              <li className="flex justify-between gap-3"><span className="text-slate-300">Zoom</span><span className="text-slate-100 font-medium">Mouse Wheel</span></li>
            </ul>
          </div>

          <div className="border-b border-slate-700 pb-2 mb-2">
            <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Touch Controls</div>
            <div className="space-y-2">
              <div className="rounded-lg border border-blue-500/25 bg-blue-500/5 p-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-10 rounded-md border border-blue-400/40 bg-slate-900/60 relative overflow-hidden">
                    <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-300 animate-[pulse_1.2s_ease-in-out_infinite]" />
                    <div className="absolute left-[30%] top-1/2 h-[1px] w-4 bg-blue-300/60 animate-[wiggle_1s_ease-in-out_infinite]" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-blue-300">Rotate</div>
                    <div className="text-[11px] text-slate-200">One finger drag</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-purple-500/25 bg-purple-500/5 p-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-10 rounded-md border border-purple-400/40 bg-slate-900/60 relative overflow-hidden">
                    <div className="absolute left-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-purple-300 animate-[pinchLeft_1.4s_ease-in-out_infinite]" />
                    <div className="absolute right-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-purple-300 animate-[pinchRight_1.4s_ease-in-out_infinite]" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-purple-300">Zoom</div>
                    <div className="text-[11px] text-slate-200">Pinch in / out</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/5 p-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-10 rounded-md border border-cyan-400/40 bg-slate-900/60 relative overflow-hidden">
                    <div className="absolute left-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-cyan-300 animate-[panLeft_1.3s_ease-in-out_infinite]" />
                    <div className="absolute right-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-cyan-300 animate-[panRight_1.3s_ease-in-out_infinite]" />
                    <div className="absolute left-2 right-2 top-1/2 h-[1px] -translate-y-1/2 bg-cyan-300/40" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-cyan-300">Pan</div>
                    <div className="text-[11px] text-slate-200">Two finger drag (same direction)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-slate-700 pb-2 mb-2">
            <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Legend</div>
            <ul className="space-y-1.5">
              <li className="flex items-center justify-between gap-3"><span className="text-slate-300">Standard Link</span><span className="w-10 h-[2px] bg-slate-500 rounded-full"></span></li>
              <li className="flex items-center justify-between gap-3"><span className="text-slate-300">Critical / Error</span><span className="w-10 h-[2px] bg-red-500 rounded-full shadow-[0_0_6px_rgba(239,68,68,0.9)]"></span></li>
              <li className="flex items-center justify-between gap-3"><span className="text-slate-300">Active Data</span><span className="w-10 h-[2px] bg-[#38bdf8] rounded-full shadow-[0_0_6px_rgba(56,189,248,0.9)]"></span></li>
            </ul>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-2">Accessibility</div>
            <ul className="space-y-1.5">
              <li className="flex justify-between gap-3"><span className="text-slate-300">Reset View</span><span className="text-slate-100 font-medium">R key / reset button</span></li>
              <li className="flex justify-between gap-3"><span className="text-slate-300">Pan</span><span className="text-slate-100 font-medium">Arrow Keys</span></li>
              <li className="flex justify-between gap-3"><span className="text-slate-300">Zoom</span><span className="text-slate-100 font-medium">+ / - keys</span></li>
            </ul>
          </div>
        </div>
      )}

      {isAddDeviceOpen && onAddDevice && <AddDeviceModal onClose={() => setIsAddDeviceOpen(false)} onAdd={onAddDevice} devices={devices} />}

      <div className={`absolute bottom-8 right-8 z-[70] transition-all duration-200 ${isGuideOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <button onClick={() => onShowControlsChange?.(!showControls)} className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-full shadow-lg border border-slate-600 transition-all">
          {showControls ? <X className="w-6 h-6" /> : <Settings className="w-6 h-6 animate-spin-slow" />}
        </button>
      </div>

      {showControls && onInjectFault && (
        <div className="absolute bottom-20 right-8 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-4 rounded-xl shadow-2xl z-30 w-72 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-700 pb-2">
            <Zap className="w-5 h-5 text-yellow-500" /><h3 className="text-white font-bold">Chaos Simulator</h3>
          </div>
          <div className="space-y-3">
            <button onClick={() => onInjectFault('l1')} className="w-full flex items-center gap-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/50 p-3 rounded-lg font-medium text-left">
              <Activity className="w-4 h-4" /><div><div className="font-bold">Simulate Cable Cut (L1)</div><div className="text-xs text-red-400/70">Breaks Access Switch 02</div></div>
            </button>
            <button onClick={() => onInjectFault('l7')} className="w-full flex items-center gap-3 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/50 p-3 rounded-lg font-medium text-left">
              <Activity className="w-4 h-4" /><div><div className="font-bold">Simulate Server Lag (L7)</div><div className="text-xs text-orange-400/70">Slows SCADA Control Loop</div></div>
            </button>
            {onReset && (
              <button onClick={onReset} className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 p-2 rounded-lg mt-4">
                <RefreshCw className="w-4 h-4" />Reset System
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
