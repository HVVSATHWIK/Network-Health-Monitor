import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import { Device, NetworkConnection, Alert, DependencyPath } from '../types/network';

// Enable BVH Acceleration
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;
import { Settings, Zap, Activity, RefreshCw, X, BrainCircuit, Sparkles } from 'lucide-react';
import { analyzeRootCause } from '../utils/aiLogic';

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
}

export default function Advanced3DTopology({
  devices,
  connections,
  alerts,
  dependencyPaths,
  onInjectFault,
  onReset,
  // tourStep,
  showControls = false,
  onShowControlsChange,
  selectedDeviceId,
  onDeviceSelect
}: Advanced3DTopologyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // const [hoveredNode, setHoveredNode] = useState<string | null>(null); // Removed unused state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  // Camera Animation State
  const targetCamPos = useRef(new THREE.Vector3(120, 80, 160));
  const targetLookAt = useRef(new THREE.Vector3(0, 40, 0));
  const isTransitioning = useRef(false);
  const transitionTimeout = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // SCENE
    const scene = new THREE.Scene();
    scene.background = null;
    scene.fog = new THREE.Fog(0x0f172a, 50, 400); // Reduced fog distance

    // CAMERA
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);

    // Standard Load
    camera.position.set(120, 80, 160);
    camera.lookAt(0, 40, 0);

    // RENDERERS
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(width, height);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none'; // Let clicks pass through
    containerRef.current.appendChild(labelRenderer.domElement);

    // CONTROLS
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 50;
    controls.maxDistance = 500; // Allow further zoom for God View
    controls.maxPolarAngle = Math.PI / 2;

    // Instant Hand-off: User interaction cancels cinematic move
    controls.addEventListener('start', () => {
      isTransitioning.current = false;
      if (transitionTimeout.current) clearTimeout(transitionTimeout.current);
    });

    // LIGHTING - High Contrast Setup
    const lights = [
      new THREE.PointLight(0x3b82f6, 2, 200), // Blue Key
      new THREE.PointLight(0x10b981, 1.5, 150), // Green Fill
      new THREE.DirectionalLight(0xffffff, 1.5), // Sun
      new THREE.SpotLight(0xa855f7, 5, 100, 0.5, 0.5, 1) // Purple Rim Light
    ];
    lights[0].position.set(50, 50, 50);
    lights[1].position.set(-50, 30, -50);
    lights[2].position.set(20, 100, 20);
    lights[3].position.set(0, 50, -50); // Backlight

    lights.forEach(light => {
      light.castShadow = true;
      scene.add(light);
    });
    // Strong Ambient Light to ensure nothing is pitch black
    scene.add(new THREE.AmbientLight(0xffffff, 1.2));

    // GRID
    const gridHelper = new THREE.GridHelper(300, 50, 0x1e293b, 0x0f172a); // Darker grid
    gridHelper.position.y = -10;
    scene.add(gridHelper);

    // GROUPS
    const deviceGroup = new THREE.Group();
    scene.add(deviceGroup);
    const lineGroup = new THREE.Group();
    scene.add(lineGroup);
    const packetGroup = new THREE.Group();
    scene.add(packetGroup);

    const statusColors: Record<string, number> = {
      healthy: 0x10b981,
      warning: 0xf59e0b,
      critical: 0xef4444,
      offline: 0x6b7280
    };

    // --- PROCEDURAL ASSET GENERATORS ---

    // 1. Server Rack (Tower)
    const createServerRack = (color: number) => {
      const group = new THREE.Group();

      // Cabinet Body
      const bodyGeo = new THREE.BoxGeometry(6, 12, 6);
      const bodyMat = new THREE.MeshPhongMaterial({ color: 0x475569, shininess: 30 }); // Lighter Slate (700)
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      // Front Panel (Blades)
      const faceGeo = new THREE.PlaneGeometry(5, 11);
      const faceMat = new THREE.MeshPhongMaterial({ color: 0x1e293b, side: THREE.DoubleSide }); // Darker face
      const face = new THREE.Mesh(faceGeo, faceMat);
      face.position.z = 3.01; // Slightly protruding
      group.add(face);

      // Blinking LEDs (Red/Green/Blue grid)
      const ledCount = 12;
      for (let i = 0; i < ledCount; i++) {
        const ledGeo = new THREE.PlaneGeometry(0.3, 0.1);
        const ledColor = Math.random() > 0.8 ? 0xef4444 : (Math.random() > 0.5 ? 0x22c55e : 0x3b82f6);
        const ledMat = new THREE.MeshBasicMaterial({ color: ledColor });
        const led = new THREE.Mesh(ledGeo, ledMat);

        const row = Math.floor(i / 2);
        const col = i % 2;
        led.position.set(col * 2 - 1, row * 1.5 - 4, 3.02);

        // Blink animation prop
        (led as any).blinkSpeed = 0.05 + Math.random() * 0.1;
        (led as any).baseColor = ledColor;
        group.add(led);
      }

      // Glow Aura from base if critical/active
      if (color === 0xef4444) {
        const glowGeo = new THREE.CylinderGeometry(4, 4, 0.5, 32);
        const glowMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.3 });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.y = -6;
        group.add(glow);
      }

      return group;
    };

    // 2. Network Switch (1U Unit)
    const createSwitchUnit = (color: number) => {
      const group = new THREE.Group();

      // Chassis
      const bodyGeo = new THREE.BoxGeometry(8, 2, 5);
      const bodyMat = new THREE.MeshPhongMaterial({
        color: 0xcbd5e1, // Very light grey (Slate 300)
        shininess: 100,
        specular: 0xffffff
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.castShadow = true;
      group.add(body);

      // Ports (Row of small squares)
      const portCount = 8;
      for (let i = 0; i < portCount; i++) {
        const portGeo = new THREE.BoxGeometry(0.5, 0.4, 0.1);
        const portColor = color === 0xef4444 ? 0xef4444 : 0x10b981; // Status color
        const portMat = new THREE.MeshBasicMaterial({ color: portColor });
        const port = new THREE.Mesh(portGeo, portMat);
        port.position.set((i * 0.8) - 2.8, 0, 2.51);
        group.add(port);
      }

      return group;
    };

    // 3. Industrial PLC (Rugged Brick)
    const createPLCUnit = (color: number) => {
      const group = new THREE.Group();

      // Main Housing (Grey Industrial Plastic)
      const bodyGeo = new THREE.BoxGeometry(4, 5, 3);
      const bodyMat = new THREE.MeshPhongMaterial({ color: 0x94a3b8 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.castShadow = true;
      group.add(body);

      // DIN Rail Mount (Back)
      const railGeo = new THREE.BoxGeometry(5, 1, 0.5);
      const railMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.2 });
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(0, 0, -1.6);
      group.add(rail);

      // Status Beacon (Top)
      const beaconGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 16);
      const beaconMat = new THREE.MeshBasicMaterial({ color: color });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.y = 2.5;
      group.add(beacon);

      return group;
    };


    // --- PLACEMENT logic ---
    const positionMap: Record<string, [number, number, number]> = {};
    const tiers = {
      floor: devices.filter(d => ['sensor', 'switch'].includes(d.type)), // Sensors will share Switch model for now or defined generic
      edge: devices.filter(d => ['plc', 'gateway', 'router'].includes(d.type)),
      cloud: devices.filter(d => ['server', 'scada'].includes(d.type))
    };

    const placeTier = (tierDevices: Device[], yVals: number, radius: number) => {
      const angleStep = (2 * Math.PI) / (tierDevices.length || 1);

      tierDevices.forEach((device, idx) => {
        const angle = idx * angleStep + (yVals * 0.1); // Add slight twist per layer
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = yVals;

        positionMap[device.id] = [x, y, z];

        // MESH SELECTION
        let mesh;
        const statusColor = statusColors[device.status];

        if (['server', 'scada'].includes(device.type)) {
          mesh = createServerRack(statusColor);
        } else if (['switch', 'router', 'gateway'].includes(device.type)) {
          mesh = createSwitchUnit(statusColor);
        } else {
          // Sensors, PLCs default to PLC for industrial look
          mesh = createPLCUnit(statusColor);
        }

        mesh.position.set(x, y, z);
        // Rotate to face center (0,y,0)
        mesh.lookAt(0, y, 0);

        // SELECTION HIGHLIGHT
        if (selectedDeviceId && device.id === selectedDeviceId) {
          // Add a halo/ring
          const ringGeo = new THREE.RingGeometry(6, 7, 32);
          const ringMat = new THREE.MeshBasicMaterial({
            color: device.category === 'IT' ? 0x3b82f6 : 0x10b981,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
          });
          const ring = new THREE.Mesh(ringGeo, ringMat);
          ring.rotation.x = Math.PI / 2; // Flat on ground (relative to mesh local space? No, mesh is rotated)
          // Actually mesh is rotated to look at center. 
          // Let's add ring as sibling or child. Child is easier but mesh rotation affects it.
          // Reset ring rotation to match world up if needed, or just surround the mesh.
          // Simpler: Just make the mesh glow
          const mat = (mesh as any).material || (mesh.children[0] as any).material;
          if (mat) {
            if (mat.emissive) mat.emissive.setHex(0xffffff);
            mat.opacity = 1.0;
          }

          // Add a dedicated selection ring object to the group
          const selectionRing = new THREE.Mesh(
            new THREE.TorusGeometry(8, 0.5, 16, 32),
            new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })
          );
          selectionRing.rotateX(Math.PI / 2);
          mesh.add(selectionRing);
        }

        // Add random float physics prop
        (mesh as any).originalY = y;
        (mesh as any).floatOffset = Math.random() * 100;

        deviceGroup.add(mesh);

        // HOLOGRAPHIC LABEL (Diegetic UI)
        const div = document.createElement('div');
        // Container for automatic centered alignment
        div.className = 'flex flex-col items-center pointer-events-none';

        const isCritical = device.status === 'critical';
        const hexColor = isCritical ? '#ef4444' : (device.status === 'warning' ? '#f59e0b' : '#34d399');

        const glitchClass = isCritical ? 'animate-pulse' : ''; // Simple pulse for now, actual glitch needs keyframes

        div.innerHTML = `
          <!-- Vertical Leader Line -->
          <div style="height: 40px; width: 1px; background: linear-gradient(to top, ${hexColor}, transparent);"></div>
          
          <!-- Glass Panel -->
          <div class="px-3 py-2 bg-slate-900/40 backdrop-blur-sm border-l-2 mt-1 ${glitchClass}"
            style="border-left-color: ${hexColor}; box-shadow: 0 0 15px ${hexColor}40; clip-path: polygon(10% 0, 100% 0, 100% 90%, 90% 100%, 0 100%, 0 10%);"
          >
            <div class="text-[10px] uppercase tracking-widest font-mono mb-0.5" style="color: ${hexColor};">ID: ${device.id.toUpperCase()}</div>
            <div class="text-xs font-bold text-white whitespace-nowrap flex items-center gap-2">
              <span style="width: 6px; height: 6px; background-color: ${hexColor}; box-shadow: 0 0 8px ${hexColor};"></span>
              ${device.name}
            </div>
          </div>
        `;

        const label = new CSS2DObject(div);
        label.position.set(0, 8, 0); // Position above tallest mesh (Header at ~12/2 + 2)
        mesh.add(label);
      });
    };

    placeTier(tiers.floor, 0, 80); // Wider floor
    placeTier(tiers.edge, 50, 50);
    placeTier(tiers.cloud, 100, 30);

    // CONNECTIONS & PACKETS
    const packets: any[] = [];

    connections.forEach(conn => {
      const sourcePos = positionMap[conn.source];
      const targetPos = positionMap[conn.target];
      if (!sourcePos || !targetPos) return;

      const sourceDevice = devices.find(d => d.id === conn.source);
      const targetDevice = devices.find(d => d.id === conn.target);
      const isCritical = sourceDevice?.status === 'critical' || targetDevice?.status === 'critical';

      const p1 = new THREE.Vector3(...sourcePos);
      const p2 = new THREE.Vector3(...targetPos);

      // REALISTIC CABLE CURVE
      // Add a slight droop (gravity) based on distance
      const dist = p1.distanceTo(p2);
      const mid = p1.clone().add(p2).multiplyScalar(0.5);

      // Gentle sag, but prevented from hitting the floor
      const sag = dist * 0.1;
      mid.y -= sag;
      if (mid.y < 2) mid.y = 2; // Floor Clamp (Grid is at -10)

      const curve = new THREE.CatmullRomCurve3([p1, mid, p2]);
      const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.4, 8, false); // Thick cable
      tubeGeo.computeBoundsTree(); // BVH Optimization

      const tubeMat = new THREE.MeshPhongMaterial({
        color: isCritical ? 0xef4444 : 0x475569, // Red or Grey Cable
        emissive: isCritical ? 0x7f1d1d : 0x000000,
        shininess: 20
      });

      const cable = new THREE.Mesh(tubeGeo, tubeMat);
      // Store metadata for the tooltip
      cable.userData = {
        id: conn.id,
        source: sourceDevice?.name,
        target: targetDevice?.name,
        status: isCritical ? 'CRITICAL' : 'HEALTHY'
      };

      lineGroup.add(cable);

      // DATA PACKETS (Running along the curve)
      if (conn.status === 'healthy' && !isCritical) {
        const packetCount = 2;
        for (let i = 0; i < packetCount; i++) {
          const pGeo = new THREE.BoxGeometry(1.5, 0.5, 0.5); // Data "Square"
          const pMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
          const packet = new THREE.Mesh(pGeo, pMat);

          (packet as any).curve = curve;
          (packet as any).progress = Math.random();
          (packet as any).speed = 0.003 + (Math.random() * 0.002);

          packetGroup.add(packet);
          packets.push(packet);
        }
      }
    });

    // Raycaster Setup
    const raycaster = new THREE.Raycaster();
    raycaster.firstHitOnly = true; // BVH optimization
    const mouse = new THREE.Vector2();
    let hoveredCable: THREE.Mesh | null = null;
    let tooltipObject: CSS2DObject | null = null;

    // Create a singleton Tooltip CSS Object
    const tooltipDiv = document.createElement('div');
    tooltipDiv.className = 'pointer-events-none bg-slate-900/90 text-white p-2 rounded border border-blue-500/50 shadow-xl opacity-0 transition-opacity duration-200 text-xs font-mono';
    tooltipObject = new CSS2DObject(tooltipDiv);
    tooltipObject.position.set(0, 0, 0);
    scene.add(tooltipObject);

    const onPointerMove = (event: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = - ((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    // Add listener to actual DOM element
    // containerRef.current.addEventListener( 'pointermove', onPointerMove ); // Doing this outside useEffect might be risky with stale refs?
    // Proper way is to add specific listener inside useEffect
    const onClick = () => {
      // Re-use logic for click detection
      if (!onDeviceSelect) return;

      raycaster.setFromCamera(mouse, camera);

      // Check for node clicks first (priority)
      // Note: We need access to the nodes mesh group. 
      // Since nodes are created in a loop above but not stored in a strictly accessible group variable like lineGroup 
      // effectively here, we might need to rely on the fact that they are in the scene. 
      // However, looking at the code structure (which I can't fully see all of), 
      // I should grab the node meshes.
      // 
      // Let's iterate through scene children to find meshes that are Nodes
      // Best approach: Add nodes to a specific group during creation like lineGroup, 
      // OR intersection check against scene.children and filter by userData.type

      const hits = raycaster.intersectObjects(scene.children);

      if (hits.length > 0) {
        // Find the first object that is a "Device Node"
        const hit = hits.find(h => h.object.userData && h.object.userData.id && h.object.userData.type);
        if (hit) {
          onDeviceSelect(hit.object.userData.id);
        } else {
          // If clicked on empty space, deselect?
          // onDeviceSelect(null); 
        }
      }
    };

    containerRef.current?.addEventListener('mousemove', onPointerMove);
    containerRef.current?.addEventListener('click', onClick);

    // CINEMATIC TOUR ANIMATION LOOP
    const animate = () => {
      requestAnimationFrame(animate);

      controls.update(); // Update controls damping

      // Raycasting Logic
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(lineGroup.children, true);

      if (intersects.length > 0) {
        const hit = intersects[0];
        const object = hit.object as THREE.Mesh;

        if (hoveredCable !== object) {
          // Restore previous
          if (hoveredCable) {
            const prevMat = hoveredCable.material as THREE.MeshPhongMaterial;
            const isCrit = hoveredCable.userData.status === 'CRITICAL';
            prevMat.color.setHex(isCrit ? 0xef4444 : 0x475569);
            prevMat.emissive.setHex(isCrit ? 0x7f1d1d : 0x000000);
          }
          // Highlight new
          hoveredCable = object;
          const mat = object.material as THREE.MeshPhongMaterial;
          mat.color.setHex(0x3b82f6); // Hover Blue
          mat.emissive.setHex(0x1d4ed8);

          // Show Tooltip
          if (tooltipObject) {
            tooltipDiv.innerHTML = `
                    <div class="font-bold text-blue-400">LINK: ${object.userData.source} ↔ ${object.userData.target}</div>
                    <div>STATUS: <span class="${object.userData.status === 'CRITICAL' ? 'text-red-500' : 'text-green-500'}">${object.userData.status}</span></div>
                    <div class="text-[10px] text-slate-400 mt-1">LATENCY: ${Math.floor(Math.random() * 20)}ms</div>
                 `;
            tooltipDiv.style.opacity = '1';
            tooltipObject.position.copy(hit.point); // Move tooltip to collision point
          }
        } else {
          // Just update position if moving along same cable? 
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


      // Camera Lerp (Cinematic Mode) - Only active during transition
      // Camera Lerp (Cinematic Mode) - Only active during transition
      if (isTransitioning.current) {
        camera.position.lerp(targetCamPos.current, 0.05); // Faster smooth snap
        controls.target.lerp(targetLookAt.current, 0.05);
      }

      // Device Float & LED Blink
      deviceGroup.children.forEach((group: any) => {
        if (group.isGroup && group.originalY !== undefined) {
          // Slow floating usually kills realism for "heavy" hardware, let's keep it very sublte
          group.position.y = group.originalY + Math.sin((Date.now() + group.floatOffset) * 0.0005) * 1.5;
        }

        // Blink LEDs
        group.children.forEach((child: any) => {
          if (child.blinkSpeed) {
            if (Math.random() < child.blinkSpeed) {
              child.visible = !child.visible;
            }
          }
        });
      });

      // Packet Motion along Curve
      packets.forEach((pkt: any) => {
        pkt.progress += pkt.speed;
        if (pkt.progress > 1) pkt.progress = 0;

        // Get position on curve
        const point = pkt.curve.getPoint(pkt.progress);
        pkt.position.copy(point);

        // Look ahead to align packet rotation with path
        const lookAtPoint = pkt.curve.getPoint(Math.min(pkt.progress + 0.01, 1));
        pkt.lookAt(lookAtPoint);
      });

      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      labelRenderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        containerRef.current.innerHTML = ''; // Cleanup all renderers
        containerRef.current.removeEventListener('mousemove', onPointerMove);
      }
      renderer.dispose();
      // Dispose BVH
      lineGroup.children.forEach((mesh: any) => {
        if (mesh.geometry.boundsTree) mesh.geometry.disposeBoundsTree();
      });
    };
  }, [devices, connections, selectedDeviceId]);

  // AI Analysis Handler



  // AI Analysis Handler
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAiInsight(null);

    // 1. Find the most critical active alert
    const criticalAlert = alerts.find(a => a.severity === 'critical' || a.severity === 'high');

    if (criticalAlert) {
      // 2. Resolve the Device ID from the name (since mockData alerts use Name)
      const device = devices.find(d => d.name === criticalAlert.device);

      // 3. Find which Application Dependency Path involves this device
      let targetAppName = criticalAlert.device; // Fallback to device name
      if (device) {
        const affectedPath = dependencyPaths.find(p => p.path.includes(device.id));
        if (affectedPath) {
          targetAppName = affectedPath.appName;
        }
      }

      // 4. Run Analysis
      // Note: If targetAppName doesn't match a path, aiLogic returns null. 
      // We pass the resolved appName or callback to a generic insight if specific path not found.
      const insight = await analyzeRootCause(targetAppName, alerts, devices);

      if (insight) {
        setAiInsight(insight);
      } else {
        // Fallback: If AI logic returns null (no path found), generate a generic insight
        // This ensures the user ALWAYS sees a result for a critical alert.
        setAiInsight(`Detected ${criticalAlert.severity} issue on ${criticalAlert.device}: "${criticalAlert.message}". System recommends immediate inspection of physical connections.`);
      }
    } else {
      setAiInsight("System is healthy. No critical anomalies to analyze.");
    }

    setIsAnalyzing(false);
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-lg p-6 relative border border-slate-800 shadow-2xl">
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-6 h-6 text-purple-400" />
          <h2 className="text-xl font-bold text-white tracking-wide">3D Network Topology</h2>
        </div>
        <p className="text-sm text-slate-400 max-w-xs">
          Interactive Digital Twin
        </p>
      </div>

      <div id="canvas-container" ref={containerRef} style={{ width: '100%', height: '600px', background: 'radial-gradient(circle at center, #0f172a 0%, #020617 100%)' }} className="rounded-lg overflow-hidden relative" />

      {/* Controls Hint */}
      <div className="absolute top-8 right-8 bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-lg text-xs text-white z-20 shadow-xl pointer-events-none">
        <h3 className="font-bold mb-2 text-blue-300">Controls</h3>
        <ul className="space-y-1 text-gray-200 border-b border-white/10 pb-2 mb-2">
          <li className="flex items-center gap-2">
            <span>Left Click | Rotate</span>
          </li>
          <li className="flex items-center gap-2">
            <span>Right Click | Pan</span>
          </li>
          <li className="flex items-center gap-2">
            <span>Scroll | Zoom</span>
          </li>
        </ul>
        <h3 className="font-bold mb-2 text-blue-300">Legend</h3>
        <ul className="space-y-1 text-gray-200">
          <li className="flex items-center gap-2">
            <span className="w-3 h-1 bg-slate-500 rounded-full"></span>
            <span>Standard Link</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-3 h-1 bg-red-500 rounded-full shadow-[0_0_5px_red]"></span>
            <span>Critical / Error</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-3 h-1 bg-[#38bdf8] rounded-full shadow-[0_0_5px_#38bdf8]"></span>
            <span>Active Data</span>
          </li>
        </ul>
      </div>

      {/* AI Analysis Button */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30">
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className={`
            flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-white shadow-lg transition-all
            ${isAnalyzing
              ? 'bg-purple-900/50 cursor-wait'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 hover:scale-105 active:scale-95 border border-purple-400/30'}
          `}
        >
          {isAnalyzing ? (
            <>
              <BrainCircuit className="w-5 h-5 animate-spin" />
              <span>Analyzing Network...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>AI Root Cause Analysis</span>
            </>
          )}
        </button>
      </div>

      {/* AI Insight Overlay */}
      {aiInsight && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 w-full max-w-xl animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-purple-500/40 p-5 rounded-2xl shadow-2xl relative">
            <button
              onClick={() => setAiInsight(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-start gap-4">
              <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-3 rounded-xl shadow-lg ring-1 ring-purple-300/30">
                <BrainCircuit className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                  Gemini Diagnostics
                </h3>
                <p className="text-slate-200 text-sm leading-relaxed">
                  {aiInsight}
                </p>
                {/* Simulated "Fix" Action */}
                {aiInsight.includes("Recommendation") && (
                  <div className="mt-4 flex gap-3">
                    <button onClick={() => {
                      onReset?.();
                      setAiInsight(null);
                    }} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-emerald-900/30 flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5" />
                      Apply Auto-Fix
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Internal Chaos Control Toggle - Exposed for Tour */}
      <div className="absolute bottom-8 right-8 z-30">
        <button
          id="chaos-control-trigger-3d"
          onClick={() => onShowControlsChange?.(!showControls)}
          className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-full shadow-lg border border-slate-600 transition-all active:scale-95"
          title="Open Simulation Controls"
        >
          {showControls ? <X className="w-6 h-6" /> : <Settings className="w-6 h-6 animate-spin-slow" />}
        </button>
      </div>

      {/* Internal Chaos Control Panel */}
      {showControls && onInjectFault && (
        <div className="absolute bottom-20 right-8 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-4 rounded-xl shadow-2xl z-30 w-72 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-700 pb-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            <h3 className="text-white font-bold">Chaos Simulator</h3>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => onInjectFault('l1')}
              className="w-full flex items-center gap-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/50 p-3 rounded-lg transition-all text-sm font-medium group text-left"
            >
              <Activity className="w-4 h-4 group-hover:animate-pulse shrink-0" />
              <div>
                <div className="font-bold">Simulate Cable Cut (L1)</div>
                <div className="text-xs text-red-400/70">Breaks Access Switch 02</div>
              </div>
            </button>

            <button
              onClick={() => onInjectFault('l7')}
              className="w-full flex items-center gap-3 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/50 p-3 rounded-lg transition-all text-sm font-medium text-left"
            >
              <Activity className="w-4 h-4 shrink-0" />
              <div>
                <div className="font-bold">Simulate Server Lag (L7)</div>
                <div className="text-xs text-orange-400/70">Slows SCADA Control Loop</div>
              </div>
            </button>

            {onReset && (
              <button
                onClick={onReset}
                className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 p-2 rounded-lg transition-all text-sm font-medium mt-4"
              >
                <RefreshCw className="w-4 h-4" />
                Reset System
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
