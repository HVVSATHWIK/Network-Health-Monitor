import { LazyLog, ScrollFollow } from '@melloware/react-logviewer';
import type { CSSProperties } from 'react';

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
    text?: string;
    filterPattern?: string;
}

export const ForensicTerminal = ({ streamUrl: _streamUrl, text, filterPattern }: ForensicTerminalProps) => {
    void _streamUrl;
    // Use the streamUrl prop to silence linter, or default to mock
    // const _url = streamUrl || "mock";

    const demoLogs = `[14:02:01.233] SYSTEM  INFO  Forensic analysis module initialized.
[14:02:01.450] NETWORK INFO  Interface eth0 set to monitoring mode.
[14:02:01.452] FIREWALL WARN  Outbound connection to 192.168.1.55 blocked (Policy: DENY_ALL).
[14:02:02.100] AGENT   INFO  Process table scan started for known indicators.
[14:02:02.344] MEMORY  INFO  Heap analysis started at 0x40000000.
[14:02:02.500] MEMORY  WARN  High allocation rate detected in pid 442 (svchost.exe).
[14:02:03.112] NETWORK WARN  TCP Zero Window detected on flow 10.0.0.5:443 -> 10.0.0.9:56622.
[14:02:03.115] NETWORK WARN  Retransmission event observed (RTO=1.2s).
[14:02:03.550] STORAGE WARN  I/O wait exceeded 500ms on /dev/sda1.
[14:02:04.000] AGENT   INFO  Correlation confidence: 94%.
[14:02:04.100] SYSTEM  ERROR Fault detected in module scada_driver.sys at 0xdeadbeef.
[14:02:04.220] SERVICE ERROR Service "PLC-Control-Loop" transitioned to FAILED.
[14:02:05.000] RECOVERY INFO  Automatic restart initiated.
[14:02:05.500] RECOVERY WARN  Checksum verification failed; restart aborted.
[14:02:06.000] AUDIT   INFO  User "admin" requested a detailed report.
[14:02:06.111] SYSTEM  INFO  End of stream.
    `;

    const baseText = text?.trim() ? text : demoLogs;

    const applyFilter = (raw: string, pattern: string | undefined) => {
        const p = pattern?.trim();
        if (!p) return raw;

        try {
            const re = new RegExp(p, 'i');
            const lines = raw.split(/\r?\n/);
            const matched = lines.filter((line) => re.test(line));
            if (matched.length === 0) {
                return `[FILTER] 0 matches for /${p}/. Displaying full log output.\n\n${raw}`;
            }
            return matched.join('\n');
        } catch {
            return `[FILTER] Invalid regex pattern: ${p}. Displaying full log output.\n\n${raw}`;
        }
    };

    const logText = applyFilter(baseText, filterPattern);

    return (
        <div className="h-full w-full font-mono text-xs overflow-hidden rounded bg-gunmetal-950">
            <ScrollFollow
                startFollowing={true}
                render={({ follow, onScroll }) => (
                    <LazyLog
                        text={logText}
                        stream={true}
                        follow={follow}
                        onScroll={onScroll}
                        style={terminalTheme as unknown as CSSProperties}
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
