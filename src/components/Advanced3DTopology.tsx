import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
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
    containerRef.current.appendChild(labelRenderer.domElement);

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

    // --- PLACEMENT logic ---
    const positionMap: Record<string, [number, number, number]> = {};
    const tiers = {
      floor: devices.filter(d => ['sensor', 'switch'].includes(d.type)),
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

        // MESH
        let geometry;
        const isCloud = y > 40;
        const isEdge = y > 10 && y <= 40;

        if (isCloud) geometry = new THREE.BoxGeometry(6, 3, 6); // Bigger servers
        else if (isEdge) geometry = new THREE.CylinderGeometry(3, 3, 5, 8);
        else geometry = new THREE.IcosahedronGeometry(3, 2);

        const material = new THREE.MeshPhongMaterial({
          color: statusColors[device.status],
          shininess: 100,
          emissive: statusColors[device.status],
          emissiveIntensity: device.status === 'critical' ? 0.9 : 0.4
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        (mesh as any).originalY = y;
        (mesh as any).floatOffset = Math.random() * 100;
        deviceGroup.add(mesh);

        // TEXT LABEL
        const div = document.createElement('div');
        div.className = 'px-2 py-1 bg-black/60 backdrop-blur-sm border border-white/20 rounded text-xs font-bold text-white whitespace-nowrap';
        div.textContent = device.name;
        // Color code the label border if critical
        if (device.status === 'critical') {
          div.style.borderColor = '#ef4444';
          div.style.color = '#fca5a5';
          div.className += ' animate-pulse';
        }

        const label = new CSS2DObject(div);
        label.position.set(0, 5, 0); // Above the node
        mesh.add(label);
      });
    };

    placeTier(tiers.floor, 0, 70);
    placeTier(tiers.edge, 50, 40);
    placeTier(tiers.cloud, 100, 25);

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

      // Line
      const points = [p1, p2];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({
        color: isCritical ? 0xff0000 : 0x3b82f6,
        linewidth: 1,
        transparent: true,
        opacity: isCritical ? 0.8 : 0.15
      });
      lineGroup.add(new THREE.Line(lineGeo, lineMat));

      // DATA PACKETS (Resurrected!)
      if (conn.status === 'healthy' && !isCritical) {
        // Create multiple packets per line for "active" look
        const packetCount = 2;
        for (let i = 0; i < packetCount; i++) {
          const pGeo = new THREE.SphereGeometry(0.8, 8, 8);
          const pMat = new THREE.MeshBasicMaterial({ color: 0x60a5fa }); // Light Blue
          const packet = new THREE.Mesh(pGeo, pMat);

          // Custom props for animation
          (packet as any).start = p1;
          (packet as any).end = p2;
          (packet as any).progress = Math.random(); // Random start pos
          (packet as any).speed = 0.005 + (Math.random() * 0.005);

          packetGroup.add(packet);
          packets.push(packet);
        }
      }
    });

    // ANIMATION
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      requestAnimationFrame(animate);

      // Camera drift
      const targetX = baseCamX + mouseX * 30;
      const targetY = baseCamY + mouseY * 20;
      camera.position.x += (targetX - camera.position.x) * 0.05;
      camera.position.y += (targetY - camera.position.y) * 0.05;
      camera.lookAt(0, lookAtY, 0);

      // Device Float
      deviceGroup.children.forEach((child: any) => {
        if (child.isMesh && child.originalY !== undefined) {
          child.position.y = child.originalY + Math.sin((Date.now() + child.floatOffset) * 0.001) * 2;
        }
      });

      // Packet Motion
      packets.forEach((pkt: any) => {
        pkt.progress += pkt.speed;
        if (pkt.progress > 1) pkt.progress = 0;
        pkt.position.lerpVectors(pkt.start, pkt.end, pkt.progress);
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
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        containerRef.current.innerHTML = ''; // Cleanup all renderers
      }
      renderer.dispose();
    };
  }, [devices, connections]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 relative">
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-bold text-gray-800">3D Network Topology</h2>
        </div>
        <p className="text-sm text-gray-500 max-w-xs">
          Interactive Digital Twin
        </p>
      </div>

      <div ref={containerRef} style={{ width: '100%', height: '600px', background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)' }} className="rounded-lg overflow-hidden relative" />

      {/* Controls Hint */}
      <div className="absolute top-8 right-8 bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-lg text-xs text-white z-20 shadow-xl pointer-events-none">
        <h3 className="font-bold mb-2 text-blue-300">Controls</h3>
        <ul className="space-y-1 text-gray-200">
          <li className="flex items-center gap-2">
            <span>☩ Pan | Scroll to Zoom</span>
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
