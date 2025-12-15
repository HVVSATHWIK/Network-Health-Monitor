import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bot, X, Sparkles, AlertTriangle, ShieldCheck, Zap, Server, Lock, Send, Search, Activity, CheckCircle2 } from 'lucide-react';
import { analyzeWithMultiAgents, type AgentResponse } from '../utils/aiLogic';
import { Alert, Device } from '../types/network';

interface Message {
    id: string;
    role: 'user' | 'ai';
    text: string;
    // agent: 'Coordinator'; // Simplified: Chat is ONLY for Coordinator now
}

interface AgentState {
    status: 'idle' | 'analyzing' | 'clean' | 'issue_detected';
    findings?: string;
}

interface AICopilotProps {
    userName?: string;
    systemMessage?: string;
    onOpenChange?: (isOpen: boolean) => void;
    isOpen?: boolean;
    alerts: Alert[];
    devices: Device[];
}

export default function AICopilot({ userName = "User", systemMessage, onOpenChange, isOpen = false, alerts, devices }: AICopilotProps) {
    // Chat State
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'ai',
            text: `Hello ${userName}. I am the NetMonit Coordinator. I'm ready to help you analyze network security, performance, and reliability.`
        }
    ]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [inputValue, setInputValue] = useState("");

    // Agent Visualizer State
    const [agents, setAgents] = useState<{
        Security: AgentState;
        Performance: AgentState;
        Reliability: AgentState;
    }>({
        Security: { status: 'idle' },
        Performance: { status: 'idle' },
        Reliability: { status: 'idle' }
    });

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastSystemMessageRef = useRef<string | undefined>(undefined);

    // Update greeting
    useEffect(() => {
        setMessages(prev => {
            const newMessages = [...prev];
            if (newMessages.length > 0 && newMessages[0].role === 'ai') {
                newMessages[0] = {
                    ...newMessages[0],
                    text: `Hello ${userName}. I am the NetMonit Coordinator. I'm ready to help you analyze network security, performance, and reliability.`
                };
            }
            return newMessages;
        });
    }, [userName]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSubmit = () => {
        if (!inputValue.trim() || isProcessing) return;
        const query = inputValue;
        setInputValue("");
        handleAnalysis(query);
    };

    const handleAnalysis = async (query: string) => {
        if (isProcessing) return;
        setIsProcessing(true);

        // 1. User Message
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: query }]);

        // 2. Reset Agents to "Analyzing" if it's an analysis query
        // Simple heuristic: if it triggers sub-agents, we'll see updates.
        // For now, let's reset them to idle or analyzing based on the first update.
        // Actually, aiLogic handles the "isConversational" check. 
        // We will reset them to 'idle' initially, and if we get an update for one, we set it.
        // BUT, for a fresh analysis, we probably want to clear previous findings?
        // Let's clear them IF the query suggests analysis. 
        // For simplicity, we'll let the callback drive the state.

        const handleAgentUpdate = (update: AgentResponse) => {
            if (update.agent === 'Coordinator') {
                // Coordinator "analyzing" status could trigger a global "Thinking..." state if we wanted
                return;
            }

            setAgents(prev => ({
                ...prev,
                [update.agent]: {
                    status: update.status,
                    findings: update.findings
                }
            }));
        };

        try {
            // 3. Run Analysis
            const finalResponse = await analyzeWithMultiAgents(query, null, alerts, devices, handleAgentUpdate);

            // 4. Final Coordinator Response
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'ai',
                text: typeof finalResponse === 'string' ? finalResponse : finalResponse.summary
            }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'ai',
                text: "I apologize, but I encountered an error while coordinating the agents."
            }]);
        }

        setIsProcessing(false);
    };

    // System Message Trigger
    useEffect(() => {
        if (systemMessage && systemMessage !== lastSystemMessageRef.current) {
            lastSystemMessageRef.current = systemMessage;
            if (!isOpen && onOpenChange) onOpenChange(true);
            handleAnalysis(systemMessage);
        }
    }, [systemMessage, isOpen, onOpenChange]);

    const prompts = [
        { label: "Root Cause Check", icon: <Zap className="w-3 h-3 text-yellow-400" />, query: "Why did Line A stop at 10:00 AM?" },
        { label: "Impact Analysis", icon: <AlertTriangle className="w-3 h-3 text-red-400" />, query: "What is the blast radius if Core Switch 01 fails?" },
        { label: "Security Scan", icon: <Lock className="w-3 h-3 text-blue-400" />, query: "Analyze firewall logs for unauthorized access." }
    ];

    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); return () => setMounted(false); }, []);

    if (!mounted) return null;

    // --- Sub-Components ---

    const AgentCard = ({ name, state, icon: Icon, color }: { name: string, state: AgentState, icon: any, color: string }) => {
        const isAnalyzing = state.status === 'analyzing';
        const isIssue = state.status === 'issue_detected';
        const isClean = state.status === 'clean';
        const isIdle = state.status === 'idle';

        return (
            <div className={`
                relative overflow-hidden rounded-xl border p-3 transition-all duration-300
                ${isAnalyzing ? 'bg-indigo-500/10 border-indigo-500/30' :
                    isIssue ? 'bg-red-500/10 border-red-500/50' :
                        isClean ? 'bg-emerald-500/10 border-emerald-500/30' :
                            'bg-slate-800/50 border-slate-700/50 opacity-60'}
            `}>
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${isAnalyzing ? 'bg-indigo-500/20' : isIssue ? 'bg-red-500/20' : isClean ? 'bg-emerald-500/20' : 'bg-slate-700'}`}>
                            <Icon className={`w-4 h-4 ${color}`} />
                        </div>
                        <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">{name}</span>
                    </div>
                    {/* Status Icon */}
                    {isAnalyzing && <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />}
                    {isIssue && <AlertTriangle className="w-4 h-4 text-red-400" />}
                    {isClean && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>

                {/* Content */}
                <div className="min-h-[40px]">
                    {isAnalyzing ? (
                        <div className="flex items-center gap-2 text-indigo-300">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                            </span>
                            <span className="text-xs">Scanning network nodes...</span>
                        </div>
                    ) : isIdle ? (
                        <p className="text-[10px] text-slate-500 italic">Standby</p>
                    ) : (
                        <p className={`text-[11px] leading-tight ${isIssue ? 'text-red-200' : 'text-slate-300'}`}>
                            {state.findings}
                        </p>
                    )}
                </div>
            </div>
        );
    };

    const content = !isOpen ? (
        <button
            onClick={() => onOpenChange?.(true)}
            className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-full shadow-2xl flex items-center gap-3 transition-all hover:scale-105 z-50 animate-in fade-in slide-in-from-bottom-5"
        >
            <div className="relative">
                <Bot className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-100 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
            </div>
            <span className="font-semibold pr-2">NetMonit AI</span>
        </button>
    ) : (
        <div className="fixed bottom-6 right-6 w-[450px] h-[750px] bg-slate-950/95 backdrop-blur-2xl border border-indigo-500/30 rounded-2xl shadow-2xl flex flex-col z-50 animate-in zoom-in-95 origin-bottom-right overflow-hidden font-sans">

            {/* 1. Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-slate-900 to-indigo-950/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm tracking-tight">NetMonit Coordinator</h3>
                        <p className="text-[10px] text-indigo-300 font-medium">Orchestrating 3 Sub-Agents</p>
                    </div>
                </div>
                <button onClick={() => onOpenChange?.(false)} className="text-slate-400 hover:text-white transition-colors bg-white/5 p-1.5 rounded-lg hover:bg-white/10">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* 2. Command Center (Agent Visualizer) */}
            <div className="bg-slate-900/50 p-4 border-b border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Activity className="w-3 h-3" /> Agent Command Center
                    </h4>
                    {isProcessing && <span className="text-[10px] text-indigo-400 animate-pulse">Live Analysis Active</span>}
                </div>

                <div className="grid grid-cols-1 gap-2">
                    {/* We can make this a grid or a stack. Let's do a stack for more detail space, or grid for compactness. 
                        Given user wanted "animation text in separate chart", let's give them good space. */}
                    <div className="grid grid-cols-1 gap-2">
                        <AgentCard
                            name="Security"
                            state={agents.Security}
                            icon={ShieldCheck}
                            color="text-emerald-400"
                        />
                        <AgentCard
                            name="Performance"
                            state={agents.Performance}
                            icon={Zap}
                            color="text-yellow-400"
                        />
                        <AgentCard
                            name="Reliability"
                            state={agents.Reliability}
                            icon={Server}
                            color="text-blue-400"
                        />
                    </div>
                </div>
            </div>

            {/* 3. Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'ai' && (
                            <div className="mt-1 mr-2 flex-shrink-0">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border border-white/20 shadow-lg">
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                            </div>
                        )}
                        <div
                            className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-br-none'
                                : 'bg-slate-800 text-slate-200 border border-slate-700/50 rounded-bl-none'
                                }`}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isProcessing && (
                    <div className="flex justify-start ml-10">
                        <div className="bg-slate-800/50 px-4 py-2 rounded-full flex items-center gap-2 border border-slate-700/50">
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* 4. Suggestions */}
            <div className="px-3 pb-2">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mask-linear-fade">
                    {prompts.map((p, i) => (
                        <button
                            key={i}
                            disabled={isProcessing}
                            onClick={() => handleAnalysis(p.query)}
                            className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-full bg-slate-800 border border-slate-700 hover:border-indigo-500/50 hover:bg-slate-700 transition-all group whitespace-nowrap"
                        >
                            <div className="opacity-70 group-hover:opacity-100 transition-opacity">{p.icon}</div>
                            <span className="text-xs text-slate-300 font-medium group-hover:text-white">{p.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 5. Input Area */}
            <div className="p-3 bg-slate-900 border-t border-white/10 flex gap-2">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isProcessing && handleSubmit()}
                        placeholder="Ask Coordinator..."
                        className="w-full bg-slate-950/50 border border-slate-700 rounded-xl pl-10 pr-3 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                        disabled={isProcessing}
                    />
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={!inputValue.trim() || isProcessing}
                    className="aspect-square bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 flex items-center justify-center w-12"
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
        </div>
    );

    return createPortal(content, document.body);
}

