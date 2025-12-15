import { useRef, useEffect, useState } from 'react';
import { Activity, Settings, Zap, RefreshCw, X, ScanLine } from 'lucide-react';

interface DataFlowVisualizationProps {
  onInjectFault: (type: 'l1' | 'l7') => void;
  onReset: () => void;
  mode: 'default' | 'scan';
  // showControlsExternal?: boolean; // Removed
  onShowControlsChange?: (show: boolean) => void;
}

export default function DataFlowVisualization({
  onInjectFault,
  onReset,
  mode,
  // showControlsExternal = false,
  onShowControlsChange
}: DataFlowVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // const [data, setData] = useState<any[]>([]); // Unused
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    if (onShowControlsChange) {
      onShowControlsChange(showControls);
    }
  }, [showControls, onShowControlsChange]);

  // showControlsExternal logic removed

  // Viewport State for Pan/Zoom
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

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
      { x: canvas.width * 0.2, y: canvas.height * 0.9, label: 'Sensor', color: '#10b981', layer: 1 }, // Floor
      { x: canvas.width * 0.5, y: canvas.height * 0.9, label: 'Switch', color: '#10b981', layer: 1 }, // Floor
      { x: canvas.width * 0.8, y: canvas.height * 0.9, label: 'IO-Mod', color: '#10b981', layer: 1 }, // Floor

      { x: canvas.width * 0.3, y: canvas.height * 0.5, label: 'PLC', color: '#3b82f6', layer: 2 },    // Edge
      { x: canvas.width * 0.7, y: canvas.height * 0.5, label: 'Gateway', color: '#f59e0b', layer: 2 },// Edge

      { x: canvas.width * 0.3, y: canvas.height * 0.15, label: 'Server', color: '#8b5cf6', layer: 3 }, // Cloud
      { x: canvas.width * 0.7, y: canvas.height * 0.15, label: 'Cloud', color: '#ec4899', layer: 3 }  // Cloud
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

    const emitParticles = (forcedSourceIndex?: number) => {
      let candidates = connections;

      // If specific source is requested, filter connections
      if (forcedSourceIndex !== undefined) {
        candidates = connections.filter(([from]) => from === forcedSourceIndex);
      }

      // Prioritize "upward" flow
      for (let i = 0; i < candidates.length; i++) {
        if (forcedSourceIndex !== undefined || Math.random() < 0.3) {
          const [from, to] = candidates[i];
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
            color: mode === 'scan' ? '#ffffff' : source.color, // White for scan
            size: mode === 'scan' ? 5 : 3 + Math.random() * 2
          });
        }
      }
    };

    let animationFrameId: number;

    const animate = () => {
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height); // Crisp clear, no trails

      ctx.save();
      ctx.translate(transform.x, transform.y);
      ctx.scale(transform.k, transform.k);

      // Draw Connections
      connections.forEach(([from, to]) => {
        const fromNode = nodes[from];
        const toNode = nodes[to];

        ctx.strokeStyle = mode === 'scan' ? 'rgba(74, 222, 128, 0.3)' : 'rgba(148, 163, 184, 0.2)'; // Green tint in scan mode
        ctx.lineWidth = mode === 'scan' ? 3 : 2;
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.stroke();
      });

      // Update & Draw Particles
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

        // Glow effect for scan particles
        if (mode === 'scan') {
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#ffffff';
        } else {
          ctx.shadowBlur = 0;
        }
      });
      ctx.shadowBlur = 0; // Reset

      // Draw Nodes
      nodes.forEach(node => {
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(node.x, node.y, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + 20);
      });

      // Default random emission
      if (mode === 'default' && Math.random() < 0.25) {
        emitParticles();
      }

      ctx.restore(); // Restore transform
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Scan Mode Sequence logic
    let scanIntervals: NodeJS.Timeout[] = [];
    if (mode === 'scan') {
      // Clear existing particles for clean start (optional, but cleaner)
      // particles.length = 0; // Might be too abrupt

      // Wave 1: L1 (Nodes 0, 1, 2)
      const t1 = setTimeout(() => {
        [0, 1, 2].forEach(idx => emitParticles(idx));
      }, 500);

      const t2 = setTimeout(() => {
        [0, 1, 2].forEach(idx => emitParticles(idx));
      }, 1000);

      // Wave 2: L2 (Nodes 3, 4)
      const t3 = setTimeout(() => {
        [3, 4].forEach(idx => emitParticles(idx));
      }, 2000);

      const t4 = setTimeout(() => {
        [3, 4].forEach(idx => emitParticles(idx));
      }, 2500);

      // Wave 3: L3 (Nodes 5)
      const t5 = setTimeout(() => {
        emitParticles(5);
      }, 3500);

      scanIntervals.push(t1, t2, t3, t4, t5);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      scanIntervals.forEach(clearTimeout);
    };
  }, [transform, mode]); // Re-bind on transform or mode change

  // Mouse Handlers for Pan/Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const scaleAmount = -e.deltaY * 0.001;
    const newScale = Math.min(Math.max(0.5, transform.k + scaleAmount), 3);
    setTransform(prev => ({ ...prev, k: newScale }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-lg p-6 border border-slate-800 shadow-2xl relative transition-all duration-500">
      <div className="flex items-center gap-3 mb-4">
        {mode === 'scan' ? <ScanLine className="w-6 h-6 text-purple-400 animate-pulse" /> : <Activity className="w-6 h-6 text-emerald-400" />}
        <h2 className="text-xl font-bold text-white tracking-wide">
          {mode === 'scan' ? 'Full Stack Diagnostic Scan' : 'Real-Time Data Flow'}
        </h2>
      </div>
      <p className="text-sm text-slate-400 mb-4">
        {mode === 'scan' ? 'Analyzing packet telemetry from Layer 1 to Layer 7...' : 'Live packet flow visualization across network tiers'}
      </p>

      <div className={`relative w-full h-80 overflow-hidden rounded-lg border shadow-inner cursor-move transition-colors duration-500 ${mode === 'scan' ? 'border-purple-500/50 bg-purple-900/10' : 'border-slate-700/50 bg-slate-950'}`}>
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        {/* Reset View Button */}
        {(transform.k !== 1 || transform.x !== 0 || transform.y !== 0) && (
          <button
            onClick={() => setTransform({ x: 0, y: 0, k: 1 })}
            className="absolute top-4 right-4 bg-slate-800/80 text-white text-xs px-2 py-1 rounded border border-white/10 hover:bg-slate-700"
          >
            Reset View
          </button>
        )}
      </div>

      {/* Internal Chaos Control Toggle - Moved to Bottom Left to allow Copilot on Right */}
      <div className="absolute bottom-6 left-6 z-30">
        <button
          id="chaos-control-trigger"
          onClick={() => setShowControls(!showControls)}
          className="bg-slate-800 hover:bg-slate-700 text-white p-2.5 rounded-full shadow-lg border border-slate-600 transition-all active:scale-95"
          title="Open Simulation Controls"
        >
          {showControls ? <X className="w-5 h-5" /> : <Settings className="w-5 h-5 animate-spin-slow" />}
        </button>
      </div>

      {/* Internal Chaos Control Panel */}
      {showControls && onInjectFault && (
        <div id="chaos-control-panel-body" className="absolute bottom-16 left-6 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-4 rounded-xl shadow-2xl z-30 w-72 animate-in slide-in-from-bottom-5 zoom-in-95 fade-in duration-200 origin-bottom-left">
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

