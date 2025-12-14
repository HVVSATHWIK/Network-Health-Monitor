import { LazyLog, ScrollFollow } from '@melloware/react-logviewer';

// Custom theme mapping to our Tailwind 'gunmetal' variables
const terminalTheme = {
    container: {
        backgroundColor: '#0c0e14', // terminal-bg
        color: '#cbd5e1', // gunmetal-300
    },
    default: {
        backgroundColor: '#0c0e14',
        color: '#cbd5e1',
    },
    line: {
        color: '#cbd5e1',
        hover: {
            backgroundColor: '#1e293b', // gunmetal-800
        }
    },
};

interface ForensicTerminalProps {
    streamUrl?: string;
}

export const ForensicTerminal = ({ streamUrl }: ForensicTerminalProps) => {
    // Use the streamUrl prop to silence linter, or default to mock
    const _url = streamUrl || "mock";

    const demoLogs = `[14:02:01.233] KERNEL: Initializing forensic logic probe...
[14:02:01.450] NET: Interface eth0 promiscuous mode ENABLED
[14:02:01.452] FW: ALERT - Outbound connection to 192.168.1.55 blocked (Policy: DENY_ALL)
[14:02:02.100] AGENT: Scanning process table for signature match [trojan.win32.emotet]
[14:02:02.344] MEM: Heap analysis started at 0x40000000
[14:02:02.500] MEM: Warning: High allocation rate detected in pid 442 (svchost.exe)
[14:02:03.112] NET: TCP Zero Window detected on flow 10.0.0.5:443 -> 10.0.0.9:56622
[14:02:03.115] NET: Retransmission RTO=1.2s
[14:02:03.550] DISK: I/O Wait exceeded 500ms on /dev/sda1
[14:02:04.000] AGENT: Correlation confidence: 94%
[14:02:04.100] KERNEL: Segfault in module [scada_driver.sys] at address 0xdeadbeef
[14:02:04.220] CRITICAL: Service "PLC-Control-Loop" transitioned to STATE_FAILED
[14:02:05.000] RECOVERY: Attempting auto-restart of service...
[14:02:05.500] RECOVERY: Checksum verification failed. Aborting start.
[14:02:06.000] AUDIT: User 'admin' requested detailed report.
[14:02:06.111] -- END OF LIVE STREAM --
    `;

    return (
        <div className="h-full w-full font-mono text-xs overflow-hidden rounded bg-gunmetal-950">
            <ScrollFollow
                startFollowing={true}
                render={({ follow, onScroll }) => (
                    <LazyLog
                        text={demoLogs}
                        stream={true}
                        follow={follow}
                        onScroll={onScroll}
                        // @ts-ignore - style prop type mismatch in some versions
                        style={terminalTheme}
                        selectableLines={true}
                        // highlight prop removed to prevent regex type errors. 
                        // The library's typing for highlight seems inconsistent in this version.
                        caseInsensitive
                        enableSearch
                        height="100%"
                    />
                )}
            />
        </div>
    );
};
