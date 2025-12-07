import { useEffect, useRef } from 'react';
import { Activity } from 'lucide-react';

export default function DataFlowVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      color: string;
      size: number;
    }> = [];

    // Vertical Tiered Layout (Bottom -> Up)
    const nodes = [
      { x: canvas.width * 0.2, y: canvas.height * 0.9, label: 'Sensor', color: '#10b981' }, // Floor
      { x: canvas.width * 0.5, y: canvas.height * 0.9, label: 'Switch', color: '#10b981' }, // Floor
      { x: canvas.width * 0.8, y: canvas.height * 0.9, label: 'IO-Mod', color: '#10b981' }, // Floor

      { x: canvas.width * 0.3, y: canvas.height * 0.5, label: 'PLC', color: '#3b82f6' },    // Edge
      { x: canvas.width * 0.7, y: canvas.height * 0.5, label: 'Gateway', color: '#f59e0b' },// Edge

      { x: canvas.width * 0.3, y: canvas.height * 0.15, label: 'Server', color: '#8b5cf6' }, // Cloud
      { x: canvas.width * 0.7, y: canvas.height * 0.15, label: 'Cloud', color: '#ec4899' }  // Cloud
    ];

    const connections = [
      [0, 3], // Sensor -> PLC
      [1, 3], // Switch -> PLC
      [1, 4], // Switch -> Gateway
      [2, 4], // IO -> Gateway
      [3, 5], // PLC -> Server
      [4, 5], // Gateway -> Server
      [4, 6], // Gateway -> Cloud
      [5, 6]  // Server -> Cloud
    ];

    const emitParticles = () => {
      // Prioritize "upward" flow
      for (let i = 0; i < connections.length; i++) {
        if (Math.random() < 0.3) {
          const [from, to] = connections[i];
          const source = nodes[from];
          const target = nodes[to];

          const angle = Math.atan2(target.y - source.y, target.x - source.x);
          const speed = 2 + Math.random() * 1.5;

          particles.push({
            x: source.x,
            y: source.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            color: source.color,
            size: 3 + Math.random() * 2
          });
        }
      }
    };

    const animate = () => {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      connections.forEach(([from, to]) => {
        const fromNode = nodes[from];
        const toNode = nodes[to];

        ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.stroke();
      });

      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.015;

        if (p.life <= 0) {
          particles.splice(idx, 1);
          return;
        }

        ctx.fillStyle = p.color.replace(')', `, ${p.life})`).replace('rgb', 'rgba');
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      });

      nodes.forEach(node => {
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(node.x, node.y, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + 20);
      });

      if (Math.random() < 0.25) {
        emitParticles();
      }

      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <Activity className="w-6 h-6 text-green-600" />
        <h2 className="text-xl font-bold text-gray-800">Real-Time Data Flow</h2>
      </div>
      <p className="text-sm text-gray-600 mb-4">Live packet flow visualization across network tiers</p>
      <canvas
        ref={canvasRef}
        className="w-full h-80 border-2 border-slate-200 rounded-lg bg-gradient-to-br from-slate-950 to-slate-900"
      />
    </div>
  );
}
