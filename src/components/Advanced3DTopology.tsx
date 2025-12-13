import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Device, NetworkConnection } from '../types/network';
import { Settings, Zap, Activity, RefreshCw, X } from 'lucide-react';

interface Advanced3DTopologyProps {
  devices: Device[];
  connections: NetworkConnection[];
  onInjectFault?: (type: 'l1' | 'l7') => void;
  onReset?: () => void;
}

export default function Advanced3DTopology({ devices, connections, onInjectFault, onReset }: Advanced3DTopologyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = useState(false);

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
    const baseCamX = 120;
    const baseCamY = 80;
    const baseCamZ = 160; // Closer zoom
    const lookAtY = 40;

    camera.position.set(baseCamX, baseCamY, baseCamZ);
    camera.lookAt(0, lookAtY, 0);

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
    labelRenderer.domElement.style.pointerEvents = 'none'; // Let clicks pass through
    containerRef.current.appendChild(labelRenderer.domElement);

    // CONTROLS
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 50;
    controls.maxDistance = 300;
    controls.maxPolarAngle = Math.PI / 2; // Don't go below ground

    // LIGHTING
    const lights = [
      new THREE.PointLight(0x3b82f6, 2, 200),
      new THREE.PointLight(0x10b981, 1.5, 150),
      new THREE.DirectionalLight(0xffffff, 1.0)
    ];
    lights[0].position.set(50, 50, 50);
    lights[1].position.set(-50, 30, -50);
    lights[2].position.set(20, 100, 20);
    lights.forEach(light => {
      light.castShadow = true;
      scene.add(light);
    });
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

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
      const bodyMat = new THREE.MeshPhongMaterial({ color: 0x1e293b, shininess: 30 }); // Dark Slate Rack
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.castShadow = true;
      body.receiveShadow = true;
      group.add(body);

      // Front Panel (Blades)
      const faceGeo = new THREE.PlaneGeometry(5, 11);
      const faceMat = new THREE.MeshPhongMaterial({ color: 0x0f172a, side: THREE.DoubleSide });
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
      const bodyGeo = new THREE.BoxGeometry(8, 2, 5); // Wide and flat
      const bodyMat = new THREE.MeshPhongMaterial({ color: 0x334155, shininess: 60 });
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

        // Add random float physics prop
        (mesh as any).originalY = y;
        (mesh as any).floatOffset = Math.random() * 100;

        deviceGroup.add(mesh);

        // TEXT LABEL
        const div = document.createElement('div');
        div.className = 'px-3 py-1.5 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded shadow-lg text-xs font-bold text-white whitespace-nowrap flex items-center gap-2';

        // Status indicator dot
        const dotColor = device.status === 'critical' ? '#ef4444' : (device.status === 'warning' ? '#f59e0b' : '#10b981');
        div.innerHTML = `<span style="width: 8px; height: 8px; background-color: ${dotColor}; border-radius: 50%; display: inline-block; box-shadow: 0 0 5px ${dotColor};"></span> ${device.name}`;

        if (device.status === 'critical') {
          div.style.borderColor = '#ef4444';
          div.className += ' animate-pulse';
        }

        const label = new CSS2DObject(div);
        label.position.set(0, 8, 0); // Above the model
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
      mid.y -= dist * 0.15; // Sag factor

      const curve = new THREE.CatmullRomCurve3([p1, mid, p2]);
      const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.4, 8, false); // Thick cable

      const tubeMat = new THREE.MeshPhongMaterial({
        color: isCritical ? 0xef4444 : 0x475569, // Red or Grey Cable
        emissive: isCritical ? 0x7f1d1d : 0x000000,
        shininess: 20
      });

      const cable = new THREE.Mesh(tubeGeo, tubeMat);
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

    // ANIMATION
    const animate = () => {
      requestAnimationFrame(animate);

      controls.update(); // Update controls damping

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
      }
      renderer.dispose();
    };
  }, [devices, connections]);

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

      <div ref={containerRef} style={{ width: '100%', height: '600px', background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)' }} className="rounded-lg overflow-hidden relative" />

      {/* Controls Hint */}
      <div className="absolute top-8 right-8 bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-lg text-xs text-white z-20 shadow-xl pointer-events-none">
        <h3 className="font-bold mb-2 text-blue-300">Controls</h3>
        <h3 className="font-bold mb-2 text-blue-300">Controls</h3>
        <ul className="space-y-1 text-gray-200">
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
      </div>

      {/* Internal Chaos Control Toggle */}
      <div className="absolute bottom-8 right-8 z-30">
        <button
          onClick={() => setShowControls(!showControls)}
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
