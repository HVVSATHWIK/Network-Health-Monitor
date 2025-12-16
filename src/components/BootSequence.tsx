import { useState, useEffect, useRef } from 'react';
import { Cpu, Terminal, ArrowRight } from 'lucide-react';

interface BootSequenceProps {
    onComplete: (userName: string) => void;
}

export default function BootSequence({ onComplete }: BootSequenceProps) {
    const [logs, setLogs] = useState<string[]>([]);
    const [progress, setProgress] = useState(0);
    const [step, setStep] = useState<'boot' | 'login' | 'finalizing'>('boot');
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (step === 'boot') {
            const sequence = [
                { text: "INITIALIZING KERNEL...", delay: 500 },
                { text: "LOADING ASSETS: /mesh/server_rack_v2.gltf", delay: 1200 },
                { text: "LOADING ASSETS: /mesh/industrial_switch.gltf", delay: 1800 },
                { text: "VERIFYING INTEGRITY...", delay: 2400 },
                { text: "ESTABLISHING SECURE CONNECTION (TLS 1.3)...", delay: 3000 },
            ];

            let timeouts: NodeJS.Timeout[] = [];

            // Log Sequence
            sequence.forEach((item) => {
                const t = setTimeout(() => {
                    setLogs(prev => [...prev, item.text]);
                }, item.delay);
                timeouts.push(t);
            });

            // Transition to Login
            const loginTimeout = setTimeout(() => {
                setStep('login');
                setLogs(prev => [...prev, "AUTHENTICATION REQUIRED."]);
            }, 3500);
            timeouts.push(loginTimeout);

            // Progress Bar (Part 1)
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
                { text: `AUTHENTICATING USER: ${inputValue.toUpperCase()}...`, delay: 500 },
                { text: "ACCESS GRANTED.", delay: 1500 },
                { text: "LOADING GRAPHICAL INTERFACE...", delay: 2200 },
                { text: "SYSTEM READY.", delay: 3000 }
            ];

            let timeouts: NodeJS.Timeout[] = [];

            sequence.forEach((item) => {
                const t = setTimeout(() => {
                    setLogs(prev => [...prev, item.text]);
                }, item.delay);
                timeouts.push(t);
            });

            // Progress Bar (Part 2)
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
                onComplete(inputValue);
            }, 3500);
            timeouts.push(completeTimeout);

            return () => {
                timeouts.forEach(clearTimeout);
                clearInterval(progressInterval);
            };
        }
    }, [step, inputValue, onComplete]);


    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim().length > 0) {
            setStep('finalizing');
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black text-green-500 font-mono flex flex-col items-center justify-center p-4 sm:p-8 select-none overflow-x-hidden overflow-y-auto">

            {/* Central Logo / Icon */}
            <div className="mb-8 relative">
                <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full animate-pulse"></div>
                <Cpu className="w-24 h-24 text-green-500 relative z-10 animate-spin-slow" />
            </div>

            <div className="w-full max-w-lg mb-8">
                <h1 className="text-3xl font-bold mb-2 tracking-widest text-center text-white">NetMonit OS v2.0</h1>
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-green-500 transition-all duration-100 ease-linear shadow-[0_0_10px_#22c55e]"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>MEMORY: 16GB OK</span>
                    <span>GPU: DETECTED</span>
                </div>
            </div>

            {/* Login Prompt Override */}
            {step === 'login' && (
                <form onSubmit={handleLoginSubmit} className="w-full max-w-lg mb-8 animate-in fade-in zoom-in duration-300">
                    <div className="flex items-center gap-4 bg-black border-2 border-green-500/50 p-4 rounded-lg shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                        <Terminal className="w-6 h-6 animate-pulse" />
                        <div className="flex-1">
                            <div className="text-xs text-green-400 mb-1">ENTER NAME</div>
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                className="w-full bg-transparent border-none outline-none text-xl font-bold text-white uppercase placeholder-green-900"
                                placeholder="TYPE NAME..."
                                autoFocus
                            />
                        </div>
                        <button type="submit" disabled={!inputValue.trim()} className="p-2 bg-green-900/30 hover:bg-green-500/20 rounded-full transition-colors disabled:opacity-50">
                            <ArrowRight className="w-6 h-6" />
                        </button>
                    </div>
                </form>
            )}

            {/* Terminal Output */}
            <div className="w-full max-w-2xl bg-black/50 border border-green-900/50 p-4 rounded-lg h-64 overflow-hidden relative font-sm">
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_1px]"></div>

                <div className="flex flex-col justify-end h-full gap-1">
                    {logs.map((log, idx) => (
                        <div key={idx} className="flex items-center gap-2 animate-in slide-in-from-left fade-in duration-200">
                            <span className="text-green-700">{`>`}</span>
                            <span className={idx === logs.length - 1 ? "text-green-400 font-bold" : "text-green-600/80"}>
                                {log}
                            </span>
                        </div>
                    ))}
                    <div className="animate-pulse text-green-500">_</div>
                </div>
            </div>

        </div>
    );
}
