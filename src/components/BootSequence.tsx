import { useState, useEffect, useRef } from 'react';
import { Terminal, ArrowRight, Shield, Fingerprint } from 'lucide-react';
import Logo3D from './Logo3D';

interface BootSequenceProps {
    onComplete: (userName: string) => void;
}

export default function BootSequence({ onComplete }: BootSequenceProps) {
    const [logs, setLogs] = useState<string[]>([]);
    const [progress, setProgress] = useState(0);
    const [step, setStep] = useState<'boot' | 'login' | 'finalizing'>('boot');
    const [inputValue, setInputValue] = useState('');
    const [finalUserName, setFinalUserName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const onCompleteRef = useRef(onComplete);

    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    useEffect(() => {
        if (step === 'boot') {
            const sequence = [
                { text: "INITIALIZING KERNEL...", delay: 500 },
                { text: "LOADING TOPOLOGY ENGINE v3.1.0", delay: 1000 },
                { text: "MOUNTING 3D RENDERER: WebGL2 [OK]", delay: 1500 },
                { text: "LOADING ASSETS: /mesh/server_rack_v2.gltf", delay: 2000 },
                { text: "ESTABLISHING SECURE CONNECTION (TLS 1.3)...", delay: 2600 },
                { text: "VERIFYING CERTIFICATE CHAIN ✓", delay: 3100 },
            ];

            const timeouts: Array<ReturnType<typeof window.setTimeout>> = [];

            sequence.forEach((item) => {
                const t = setTimeout(() => {
                    setLogs(prev => [...prev, item.text]);
                }, item.delay);
                timeouts.push(t);
            });

            const loginTimeout = setTimeout(() => {
                setStep('login');
                setLogs(prev => [...prev, "IDENTITY VERIFICATION REQUIRED."]);
            }, 3600);
            timeouts.push(loginTimeout);

            const progressInterval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 60) {
                        clearInterval(progressInterval);
                        return 60;
                    }
                    return prev + 1;
                });
            }, 50);

            return () => {
                timeouts.forEach(clearTimeout);
                clearInterval(progressInterval);
            };
        }
    }, [step]);

    useEffect(() => {
        if (step === 'login' && inputRef.current) {
            inputRef.current.focus();
        }
    }, [step]);

    useEffect(() => {
        if (step === 'finalizing') {
            const sequence = [
                { text: `AUTHENTICATING OPERATOR: ${finalUserName.toUpperCase()}...`, delay: 500 },
                { text: "CLEARANCE LEVEL: FULL ACCESS ✓", delay: 1200 },
                { text: "INITIALIZING DIGITAL TWIN ENGINE...", delay: 1800 },
                { text: "LOADING L1–L7 DIAGNOSTIC STACK...", delay: 2400 },
                { text: "SYSTEM READY.", delay: 3000 }
            ];

            const timeouts: Array<ReturnType<typeof window.setTimeout>> = [];

            sequence.forEach((item) => {
                const t = setTimeout(() => {
                    setLogs(prev => [...prev, item.text]);
                }, item.delay);
                timeouts.push(t);
            });

            const progressInterval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(progressInterval);
                        return 100;
                    }
                    return prev + 1;
                });
            }, 30);

            const completeTimeout = setTimeout(() => {
                onCompleteRef.current(finalUserName);
            }, 3500);
            timeouts.push(completeTimeout);

            return () => {
                timeouts.forEach(clearTimeout);
                clearInterval(progressInterval);
            };
        }
    }, [step, finalUserName]);

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const normalizedName = inputValue.trim();
        if (normalizedName.length > 0) {
            setFinalUserName(normalizedName);
            setStep('finalizing');
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-slate-950 text-cyan-400 font-sans flex flex-col items-center justify-center p-4 sm:p-8 select-none overflow-x-hidden overflow-y-auto">

            {/* Atmospheric background — matches Login page design language */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Grid pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:50px_50px] opacity-15" />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/80 to-blue-950/30" />
                {/* Blurred orbs */}
                <div className="absolute top-[-10%] left-[15%] w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-15%] right-[10%] w-[600px] h-[600px] bg-blue-600/6 rounded-full blur-[140px]" />
                <div className="absolute top-[40%] right-[30%] w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[100px]" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center w-full max-w-2xl">

                {/* 3D Spinning Logo */}
                <div className="mb-4 relative animate-float">
                    {/* Outer glow halo */}
                    <div className="absolute inset-[-20px] bg-cyan-400/10 blur-2xl rounded-full animate-glow-pulse" />
                    <Logo3D size={160} speed={1.2} colorScheme="boot" className="relative z-10" />
                </div>

                {/* Title block */}
                <div className="w-full max-w-lg mb-8 text-center">
                    <h1 className="text-4xl font-bold mb-1 tracking-tight text-white">
                        Net<span className="text-cyan-400">Monit</span>
                    </h1>
                    <p className="text-[11px] font-mono text-slate-500 tracking-[0.25em] uppercase mb-5">
                        Industrial Network Health Monitor • v2.4
                    </p>

                    {/* Progress bar */}
                    <div className="h-1 w-full bg-slate-800/80 rounded-full overflow-hidden backdrop-blur-sm">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 transition-all duration-100 ease-linear shadow-[0_0_12px_rgba(34,211,238,0.5)]"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-600 mt-1.5 font-mono">
                        <span className="flex items-center gap-1.5">
                            <Shield className="w-3 h-3" />
                            TLS 1.3 SECURED
                        </span>
                        <span>{progress}%</span>
                    </div>
                </div>

                {/* Identity input  */}
                {step === 'login' && (
                    <form onSubmit={handleLoginSubmit} className="w-full max-w-lg mb-8 animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center gap-4 bg-slate-900/60 backdrop-blur-xl border border-cyan-500/20 p-4 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.08),inset_0_1px_0_rgba(255,255,255,0.05)]">
                            <div className="p-2 bg-cyan-500/10 rounded-xl">
                                <Fingerprint className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div className="flex-1">
                                <div className="text-[10px] text-cyan-400/80 mb-1 font-mono tracking-wider uppercase">Operator Identity</div>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    className="w-full bg-transparent border-none outline-none text-lg font-semibold text-white placeholder-slate-600"
                                    placeholder="Enter your name..."
                                    autoFocus
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!inputValue.trim()}
                                className="p-2.5 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/20 rounded-xl transition-all duration-200 disabled:opacity-30 disabled:border-slate-700/30 group"
                            >
                                <ArrowRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>
                    </form>
                )}

                {/* System log terminal */}
                <div className="w-full max-w-2xl bg-slate-900/40 backdrop-blur-xl border border-white/5 p-5 rounded-2xl h-64 overflow-hidden relative shadow-[0_4px_40px_rgba(0,0,0,0.3)]">
                    {/* Subtle CRT scanline overlay (toned down) */}
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.12)_50%)] z-10 bg-[length:100%_2px] opacity-40" />

                    {/* Header bar */}
                    <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-white/5">
                        <Terminal className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-[10px] font-mono text-slate-500 tracking-wider uppercase">System Log</span>
                        <div className="ml-auto flex gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-cyan-400/60 animate-pulse" />
                            <div className="w-2 h-2 rounded-full bg-blue-400/40" />
                            <div className="w-2 h-2 rounded-full bg-slate-600/40" />
                        </div>
                    </div>

                    {/* Logs */}
                    <div className="flex flex-col justify-end h-[calc(100%-2.5rem)] gap-1 font-mono text-sm">
                        {logs.map((log, idx) => {
                            const isLast = idx === logs.length - 1;
                            const isSuccess = log.includes('✓') || log.includes('ACCESS') || log.includes('READY') || log.includes('CLEARANCE');
                            return (
                                <div key={idx} className="flex items-center gap-2.5 animate-in slide-in-from-left fade-in duration-200">
                                    <span className="text-slate-600 text-xs">{'>'}</span>
                                    <span className={
                                        isSuccess ? 'text-emerald-400 font-semibold' :
                                        isLast ? 'text-cyan-300 font-medium' :
                                        'text-slate-400'
                                    }>
                                        {log}
                                    </span>
                                </div>
                            );
                        })}
                        <div className="animate-pulse text-cyan-400 text-xs">█</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
