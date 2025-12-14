import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Circle, XCircle, ArrowDown, ChevronRight } from 'lucide-react';
import { ForensicStep } from '../../utils/aiLogic';

interface InvestigationStreamProps {
    steps: ForensicStep[];
}

export default function InvestigationStream({ steps }: InvestigationStreamProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [steps]);

    return (
        <div className="font-mono text-xs flex flex-col gap-0 relative">
            {/* Timeline Line */}
            <div className="absolute left-[19px] top-2 bottom-2 w-[1px] bg-[#1F2833]"></div>

            {steps.map((step, idx) => {
                const isLast = idx === steps.length - 1;
                const isRunning = step.status === 'running';

                return (
                    <div key={step.id} className="group flex gap-4 animate-in slide-in-from-left-2 fade-in duration-300">
                        {/* 1. Icon Node */}
                        <div className="relative z-10 pt-1">
                            <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center border-2 bg-[#0B0C10] transition-colors
                                ${step.status === 'success' ? 'border-[#45A29E] text-[#45A29E]' :
                                    step.status === 'failed' ? 'border-[#FF2E2E] text-[#FF2E2E]' :
                                        step.status === 'running' ? 'border-[#66FCF1] text-[#66FCF1] animate-pulse' : 'border-[#1F2833] text-[#889299]'}
                            `}>
                                {step.status === 'success' && <CheckCircle2 className="w-5 h-5" />}
                                {step.status === 'failed' && <XCircle className="w-5 h-5" />}
                                {step.status === 'running' && <Circle className="w-5 h-5 animate-spin-slow dashed" />}
                                {step.status === 'pending' && <Circle className="w-5 h-5" />}
                            </div>
                        </div>

                        {/* 2. Content Block */}
                        <div className="flex-1 pb-6 relative">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[#66FCF1] font-bold text-[10px] uppercase tracking-wider bg-[#66FCF1]/10 px-1.5 py-0.5 rounded">
                                    {step.agent}
                                </span>
                                <span className="text-[#889299] text-[10px]">
                                    {new Date(step.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}.{(step.timestamp % 1000).toString().padStart(3, '0')}
                                </span>
                            </div>

                            <div className="text-[#C5C6C7] font-semibold text-sm mb-1 flex items-center gap-2">
                                <ChevronRight className="w-3 h-3 text-[#FF2E2E]" />
                                {step.action}
                            </div>

                            {step.result && (
                                <div className="bg-[#1F2833]/50 border-l-2 border-[#66FCF1] pl-3 py-2 text-[#66FCF1] leading-relaxed">
                                    {/* Typewriter effect simulation could go here, for now just text */}
                                    <span className="opacity-90">{step.result}</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
            <div ref={bottomRef} />
        </div>
    );
}
