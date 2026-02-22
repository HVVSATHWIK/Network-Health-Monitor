import React from 'react';

interface ForensicGraphCardProps {
    title: string;
    description: string;
    children: React.ReactNode;
}

export default function ForensicGraphCard({ title, description, children }: ForensicGraphCardProps) {
    return (
        <div className="bg-slate-950 border border-slate-800 rounded-sm p-4 font-mono font-light text-slate-200">
            <div className="flex justify-between items-center mb-2 border-b border-slate-800 pb-2">
                <h4 className="text-indigo-300 font-bold uppercase tracking-widest text-xs">{title}</h4>
                <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 opacity-50 animate-pulse"></span>
                </div>
            </div>
            <div className="h-48 w-full relative">
                {children}
            </div>
            <p className="text-[10px] text-slate-400 mt-2 border-t border-slate-800/50 pt-1 uppercase tracking-wider">
                {description}
            </p>
        </div>
    );
}
