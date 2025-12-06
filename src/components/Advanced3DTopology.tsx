import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Device, NetworkConnection } from '../types/network';

interface Advanced3DTopologyProps {
  devices: Device[];
  connections: NetworkConnection[];
}

export default function Advanced3DTopology({ devices, connections }: Advanced3DTopologyProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.Fog(0x0f172a, 200, 400);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 30, 60);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    const lights = [
      new THREE.PointLight(0x3b82f6, 2, 200),
      new THREE.PointLight(0x10b981, 1.5, 150),
      new THREE.DirectionalLight(0xffffff, 0.5)
    ];
    lights[0].position.set(50, 50, 50);
    lights[1].position.set(-50, 30, -50);
    lights[2].position.set(100, 100, 100);
    lights.forEach(light => {
      light.castShadow = true;
      scene.add(light);
    });

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const deviceGroup = new THREE.Group();
    scene.add(deviceGroup);

    const statusColors: Record<string, number> = {
      healthy: 0x10b981,
      warning: 0xf59e0b,
      critical: 0xef4444,
      offline: 0x6b7280
    };

    const positionMap: Record<string, [number, number, number]> = {};
    const angle = (2 * Math.PI) / devices.length;

    devices.forEach((device, idx) => {
      const x = Math.cos(idx * angle) * 40;
      const z = Math.sin(idx * angle) * 40;
      const y = Math.random() * 20;

      positionMap[device.id] = [x, y, z];

      const geometry = new THREE.IcosahedronGeometry(2, 4);
      const material = new THREE.MeshPhongMaterial({
        color: statusColors[device.status],
        shininess: 100,
        emissive: statusColors[device.status],
        emissiveIntensity: 0.3
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      (mesh as any).deviceId = device.id;

      const pulseGeometry = new THREE.IcosahedronGeometry(2.8, 4);
      const pulseMaterial = new THREE.MeshPhongMaterial({
        color: statusColors[device.status],
        transparent: true,
        opacity: 0.2
      });
      const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
      pulse.position.copy(mesh.position);
      (pulse as any).baseScale = 1;
      (pulse as any).speed = 0.02 + Math.random() * 0.03;

      deviceGroup.add(mesh);
      deviceGroup.add(pulse);
    });

    const lineGroup = new THREE.Group();
    scene.add(lineGroup);

    connections.forEach(conn => {
      const source = positionMap[conn.source];
      const target = positionMap[conn.target];

      if (!source || !target) return;

      const points = [
        new THREE.Vector3(...source),
        new THREE.Vector3(...target)
      ];

      const lineColors: Record<string, number> = {
        healthy: 0x10b981,
        degraded: 0xf59e0b,
        down: 0xef4444
      };

      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: lineColors[conn.status],
        linewidth: 2,
        transparent: true,
        opacity: conn.status === 'down' ? 0.3 : 0.6
      });

      const line = new THREE.Line(lineGeometry, lineMaterial);
      lineGroup.add(line);

      if (conn.status === 'healthy') {
        const sphereGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0x3b82f6 });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        (sphere as any).progress = 0;
        (sphere as any).source = source;
        (sphere as any).target = target;
        (sphere as any).speed = 0.002 + Math.random() * 0.003;
        lineGroup.add(sphere);
      }
    });

    let mouseX = 0;
    let mouseY = 0;
    renderer.domElement.addEventListener('mousemove', (e: MouseEvent) => {
      mouseX = (e.clientX / width) * 2 - 1;
      mouseY = -(e.clientY / height) * 2 + 1;
    });

    const animate = () => {
      requestAnimationFrame(animate);

      camera.position.x += (mouseX * 100 - camera.position.x) * 0.05;
      camera.position.y += (30 + mouseY * 20 - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      deviceGroup.children.forEach((child: THREE.Object3D) => {
        if ((child as any).baseScale !== undefined) {
          (child as any).baseScale += (child as any).speed;
          if ((child as any).baseScale > 1.5) (child as any).baseScale = 1;
          child.scale.setScalar((child as any).baseScale);
          ((child as THREE.Mesh).material as THREE.MeshPhongMaterial).opacity = 0.2 + (1 - (child as any).baseScale) * 0.3;
        } else {
          child.rotation.x += 0.005;
          child.rotation.y += 0.008;
        }
      });

      lineGroup.children.forEach((child: THREE.Object3D) => {
        if ((child as any).progress !== undefined) {
          (child as any).progress += (child as any).speed;
          if ((child as any).progress > 1) (child as any).progress = 0;

          const pos = new THREE.Vector3().lerpVectors(
            new THREE.Vector3(...(child as any).source),
            new THREE.Vector3(...(child as any).target),
            (child as any).progress
          );
          child.position.copy(pos);
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      const newWidth = containerRef.current?.clientWidth || width;
      const newHeight = containerRef.current?.clientHeight || height;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [devices, connections]);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <h2 className="text-xl font-bold">3D Network Topology</h2>
        <p className="text-sm text-slate-300 mt-1">Interactive visualization • Move mouse to explore</p>
      </div>
      <div ref={containerRef} style={{ width: '100%', height: '500px' }} />
    </div>
  );
}
