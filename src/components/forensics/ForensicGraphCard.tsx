import React from 'react';

interface ForensicGraphCardProps {
    title: string;
    description: string;
    children: React.ReactNode;
}

export default function ForensicGraphCard({ title, description, children }: ForensicGraphCardProps) {
    return (
        <div className="bg-[#0B0C10] border border-[#1F2833] rounded-sm p-4 font-mono font-light text-[#C5C6C7]">
            <div className="flex justify-between items-center mb-2 border-b border-[#1F2833] pb-2">
                <h4 className="text-[#66FCF1] font-bold uppercase tracking-widest text-xs">{title}</h4>
                <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#66FCF1] opacity-50 animate-pulse"></span>
                </div>
            </div>
            <div className="h-48 w-full relative">
                {children}
            </div>
            <p className="text-[10px] text-[#889299] mt-2 border-t border-[#1F2833]/50 pt-1 uppercase tracking-wider">
                {description}
            </p>
        </div>
    );
}
