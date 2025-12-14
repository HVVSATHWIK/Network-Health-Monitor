import { useState } from 'react';
import { ArrowRight, X, Sparkles, Navigation, Zap, BrainCircuit, CheckCircle2 } from 'lucide-react';

interface OnboardingTourProps {
    onComplete: () => void;
}

export default function OnboardingTour({ onComplete }: OnboardingTourProps) {
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        {
            id: 'welcome',
            title: "Welcome to NetMonit",
            description: "You are viewing a real-time Digital Twin of your industrial network. Monitor health, simulate faults, and fix issues instantly.",
            icon: Sparkles,
            position: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2", // Center
        },
        {
            id: 'controls',
            title: "Interactive Controls",
            description: "Navigate the 3D space: Left Click to Rotate, Right Click to Pan, and Scroll to Zoom.",
            icon: Navigation,
            position: "top-24 right-8", // Near controls
            arrow: "absolute -right-2 top-6 border-l-8 border-t-8 border-b-8 border-transparent border-l-slate-900", // Point right (visual approximation)
        },
        {
            id: 'chaos',
            title: "Chaos Simulator",
            description: "Test your network's resilience. Use this panel to intentionally inject faults like cable cuts or server lag.",
            icon: Zap,
            position: "bottom-24 right-8", // Near chaos toggle
        },
        {
            id: 'ai',
            title: "AI Analysis",
            description: "When trouble strikes, ask our Gemini AI to analyze the root cause and suggest a fix immediately.",
            icon: BrainCircuit,
            position: "top-24 left-1/2 -translate-x-1/2", // Near AI button
        }
    ];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    const step = steps[currentStep];
    const Icon = step.icon;

    return (
        <div className="fixed inset-0 z-50 pointer-events-auto">
            {/* Backdrop with hole punch effect (simulated via 4 divs or just dark overlay for simplicity) */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500" />

            {/* Content Card */}
            <div
                className={`absolute ${step.position} transition-all duration-500 ease-in-out`}
            >
                <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-2xl max-w-sm w-80 relative animate-in slide-in-from-bottom-4 zoom-in-95 duration-300">

                    <button
                        onClick={onComplete}
                        className="absolute top-2 right-2 p-1 text-slate-500 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="flex flex-col gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg ring-1 ring-white/10">
                            <Icon className="w-6 h-6 text-white" />
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                            <p className="text-slate-300 text-sm leading-relaxed">
                                {step.description}
                            </p>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-800">
                            <div className="flex gap-1.5">
                                {steps.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`w-2 h-2 rounded-full transition-colors ${idx === currentStep ? 'bg-blue-500' : 'bg-slate-700'}`}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={handleNext}
                                className="flex items-center gap-2 bg-white text-slate-900 px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors"
                            >
                                {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                                {currentStep === steps.length - 1 ? <CheckCircle2 className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
