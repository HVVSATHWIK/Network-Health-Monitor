import { SmartFailureEvent } from '../types/network';

const now = new Date();
const tenMinutesAgo = new Date(now.getTime() - 10 * 60000);
const twoHoursAgo = new Date(now.getTime() - 120 * 60000);

export const smartLogs: SmartFailureEvent[] = [
    {
        id: 'log-001',
        failureType: 'L2 CRC Error Spike',
        osiLayer: 'L2',
        originDeviceId: 'd10',
        originDeviceName: 'Hirschmann BOBCAT',
        originPort: 'Port 4',
        summary: 'Fiber fault on BOBCAT Port 4 caused CRC errors and downstream PLC/SCADA latency. Inspect physical link.',
        startTime: tenMinutesAgo.toISOString(),
        endTime: undefined, // Ongoing

        // THE FAILURE CHAIN
        failureChain: {
            rootCause: {
                layer: 'L1',
                device: 'Hirschmann BOBCAT (Port 4)',
                description: 'Physical Medium Degradation (Optical Power < -28dBm)'
            },
            propagation: [
                {
                    layer: 'L2',
                    device: 'Hirschmann BOBCAT (Port 4)',
                    description: 'Frame Check Sequence (FCS) Errors & CRC Spikes'
                }
            ],
            symptoms: [
                {
                    layer: 'L4',
                    device: 'PLC Node A',
                    description: 'TCP Retransmission Rate > 12%'
                },
                {
                    layer: 'L7',
                    device: 'SCADA System',
                    description: 'Control Loop Latency +145ms'
                }
            ]
        },

        rootCauseExplanation: 'Optical signal degradation on Port 4 is causing intermittent bit errors (L1). This manifests as CRC errors at L2, forcing TCP retransmissions at L4 and visible latency in the SCADA control loop (L7).',
        ruledOutCauses: [
            'Broadcast Storm (No MAC flapping detected)',
            'Switch CPU Saturation (CPU load stable at 12%)',
            'Configuration Change (No recent commits found)'
        ],

        confidenceScore: 0.89,
        confidenceBreakdown: {
            temporal: 0.35,
            layerConsistency: 0.30,
            metricStrength: 0.20,
            topology: 0.14,
            noisePenalty: -0.10
        },

        timeline: [
            { timestamp: new Date(tenMinutesAgo.getTime() - 2000).toISOString(), message: 'Optical RX power drops below -28 dBm', type: 'critical' },
            { timestamp: tenMinutesAgo.toISOString(), message: 'CRC error rate spikes on Port 4', type: 'critical' },
            { timestamp: new Date(tenMinutesAgo.getTime() + 2000).toISOString(), message: 'PLC Node A latency exceeds threshold', type: 'info' },
            { timestamp: new Date(tenMinutesAgo.getTime() + 3000).toISOString(), message: 'Smart Failure Event created', type: 'info' }
        ],

        impact: {
            technical: ['High Packet Loss (12%)', 'Jitter +45ms'],
            operational: ['SCADA Polling Delayed', 'Control Loop Jitter Risk (Non-fatal)'],
            impactedDeviceIds: ['d7', 'd8']
        },

        recommendedActions: [
            'Inspect fiber patch cable on Port 4 (Physical inspection required)',
            'Clean fiber connectors using click cleaner',
            'Monitor CRC error counters for 5 minutes post-cleaning'
        ],

        evidence: {
            alertCount: 12,
            keyMetrics: {
                'CRC Errors': 450,
                'Link Utilization': 85,
                'PLC Latency (ms)': 145
            }
        }
    },
    {
        id: 'log-002',
        failureType: 'L1 Optical Power Loss',
        osiLayer: 'L1',
        originDeviceId: 'd2',
        originDeviceName: 'Core Switch Alpha',
        originPort: 'Uplink-1',
        summary: 'Signal loss on Core Switch Uplink-1 caused subnet isolation. Suspected cable cut or SFP failure. Verify physical link.',
        startTime: twoHoursAgo.toISOString(),
        endTime: new Date(twoHoursAgo.getTime() + 15 * 60000).toISOString(),

        failureChain: {
            rootCause: {
                layer: 'L1',
                device: 'Core Switch Alpha (Uplink-1)',
                description: 'Complete Loss of Signal (LOS)'
            },
            propagation: [
                {
                    layer: 'L2',
                    device: 'Core Switch Alpha',
                    description: 'Port State Change: UP -> DOWN'
                },
                {
                    layer: 'L3',
                    device: 'Core Switch Alpha',
                    description: 'OSPF Neighbor Adjacency Lost'
                }
            ],
            symptoms: [
                {
                    layer: 'L3',
                    device: 'Entire Subnet 192.168.20.x',
                    description: 'Unreachable from SCADA Core'
                }
            ]
        },

        rootCauseExplanation: 'Sudden loss of optical signal on main uplink. Correlation with adjacent power alarms suggests SFP module failure or cable cut.',
        ruledOutCauses: [
            'Spanning Tree Block (BPDU Guard not triggered)',
            'Admin Shutdown (No audit log entry)'
        ],

        confidenceScore: 0.95,
        confidenceBreakdown: {
            temporal: 0.40,
            layerConsistency: 0.35,
            metricStrength: 0.15,
            topology: 0.05,
            noisePenalty: 0
        },

        timeline: [
            { timestamp: twoHoursAgo.toISOString(), message: 'Interface Uplink-1 line protocol down', type: 'critical' },
            { timestamp: new Date(twoHoursAgo.getTime() + 100).toISOString(), message: 'OSPF Neighbor 10.10.1.5 Down', type: 'info' },
            { timestamp: new Date(twoHoursAgo.getTime() + 15 * 60000).toISOString(), message: 'Signal restored (SFP Swapped)', type: 'completion' }
        ],

        impact: {
            technical: ['Subnet Isolation', 'Route Withdrawal'],
            operational: ['Production Halted in Zone B', 'Blind Monitoring State'],
            impactedDeviceIds: ['d3', 'd4', 'd5']
        },

        recommendedActions: [
            'Verify physical cable integrity',
            'Swap SFP+ Module on Uplink-1',
            'Check diverse path failover status'
        ],

        evidence: {
            alertCount: 4,
            keyMetrics: {
                'Optical Rx Power (dBm)': -40.0,
                'Packet Loss (%)': 100.0
            }
        }
    },
    {
        id: 'log-003',
        failureType: 'L3 Subnet Route Withdrawal',
        osiLayer: 'L3',
        originDeviceId: 'd1',
        originDeviceName: 'Gateway Router',
        summary: 'OSPF timeout on Gateway Router caused route flap and historian data gap. Suspect control plane congestion.',
        startTime: new Date(now.getTime() - 45 * 60000).toISOString(),
        endTime: new Date(now.getTime() - 40 * 60000).toISOString(),

        failureChain: {
            rootCause: {
                layer: 'L3',
                device: 'Gateway Router',
                description: 'OSPF Hello Timeout'
            },
            propagation: [
                {
                    layer: 'L3',
                    device: 'Core Network',
                    description: 'Route 10.20.0.0/24 Removed from RIB'
                }
            ],
            symptoms: [
                {
                    layer: 'L7',
                    device: 'Historian Server',
                    description: 'Data Collection Timeout for Zone B'
                }
            ]
        },

        rootCauseExplanation: 'OSPF adjacency timed out due to transient congestion on the control plane, causing a route flap.',
        ruledOutCauses: [
            'ACL Drop (No deny logs)',
            'Physical Link Down (Interfaces remained UP)'
        ],

        confidenceScore: 0.78,
        confidenceBreakdown: {
            temporal: 0.25,
            layerConsistency: 0.25,
            metricStrength: 0.20,
            topology: 0.08,
            noisePenalty: 0.0
        },

        timeline: [
            { timestamp: new Date(now.getTime() - 45 * 60000).toISOString(), message: 'OSPF Nbr 10.10.1.2 Down (DeadTimerExpired)', type: 'critical' },
            { timestamp: new Date(now.getTime() - 45 * 60000 + 500).toISOString(), message: 'Route 10.20.0.0/24 withdrawn', type: 'info' },
            { timestamp: new Date(now.getTime() - 40 * 60000).toISOString(), message: 'OSPF Adjacency Restored', type: 'completion' }
        ],

        impact: {
            technical: ['Transient Routing Loop', 'Jitter Spike'],
            operational: ['Brief Historian Data Gap', 'No Production Impact'],
            impactedDeviceIds: ['d10', 'd11']
        },

        recommendedActions: [
            'Investigate CPU load on Gateway Router',
            'Verify QoS settings for OSPF control traffic',
            'Check link saturation levels during incident'
        ],

        evidence: {
            alertCount: 2,
            keyMetrics: {
                'OSPF State Changes': 2,
                'Unreachable Dest count': 140
            }
        }
    }
];
