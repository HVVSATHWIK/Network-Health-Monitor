
import { useState, useRef, useEffect } from 'react';
import { Clock, ChevronDown, Calendar, X } from 'lucide-react';

import { TIME_RANGE_PRESETS, type TimeRange } from './timeRangePresets';


interface TimeRangeSelectorProps {
    value: TimeRange;
    onChange: (range: TimeRange) => void;
}

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showCustomPicker, setShowCustomPicker] = useState(false);
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setShowCustomPicker(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handlePresetSelect = (preset: (typeof TIME_RANGE_PRESETS)[0]) => {
        onChange({ value: preset.value, label: preset.label });
        setIsOpen(false);
    };

    const handleCustomApply = () => {
        if (customStart && customEnd) {
            onChange({
                value: 'custom',
                label: `${new Date(customStart).toLocaleString()} - ${new Date(customEnd).toLocaleString()}`,
                start: new Date(customStart),
                end: new Date(customEnd),
            });
            setIsOpen(false);
            setShowCustomPicker(false);
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                id="time-range-trigger"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-all text-sm font-medium"
            >
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{value.label}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="p-3 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Time Range</div>
                    </div>

                    {!showCustomPicker ? (
                        <>
                            <div className="max-h-64 overflow-y-auto py-1 custom-scrollbar">
                                {/* Quick Search Placeholder */}
                                <div className="px-3 py-2 sticky top-0 bg-slate-900 z-10">
                                    <input
                                        type="text"
                                        placeholder="Search quick ranges"
                                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-slate-300 focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
                                    />
                                </div>

                                {TIME_RANGE_PRESETS.map((preset) => (
                                    <button
                                        key={preset.value}
                                        onClick={() => handlePresetSelect(preset)}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-800 transition-colors flex items-center justify-between ${value.value === preset.value ? 'text-blue-400 bg-slate-800/50 border-l-2 border-blue-500' : 'text-slate-300'
                                            }`}
                                    >
                                        <span>{preset.label}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="border-t border-slate-800 p-2 bg-slate-900/50">
                                <button
                                    onClick={() => setShowCustomPicker(true)}
                                    className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-sm transition-colors"
                                >
                                    <Calendar className="w-3 h-3" />
                                    Custom Time Range
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-slate-200">Absolute time range</h4>
                                <button onClick={() => setShowCustomPicker(false)} className="text-slate-400 hover:text-white">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400">From</label>
                                    <input
                                        type="datetime-local"
                                        value={customStart}
                                        onChange={(e) => setCustomStart(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 text-slate-400"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400">To</label>
                                    <input
                                        type="datetime-local"
                                        value={customEnd}
                                        onChange={(e) => setCustomEnd(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 text-slate-400"
                                    />
                                </div>
                                <button
                                    onClick={handleCustomApply}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded py-1.5 text-sm font-medium transition-colors mt-2"
                                >
                                    Apply time range
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
