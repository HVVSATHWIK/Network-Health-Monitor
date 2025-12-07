import { Alert, DependencyPath, Device } from '../types/network';

/**
 * AI Root Cause Analysis Engine
 * 
 * This function correlates high-level application alerts (L4-L7) with low-level 
 * physical device alerts (L1-L2) using the Dependency Graph.
 * 
 * @param appName - The name of the application reporting an issue (e.g., "SCADA Control Loop")
 * @param activeAlerts - The list of currently active system alerts
 * @param devices - The full list of network devices
 * @param dependencyPaths - The mapped dependency graph for all applications
 * 
 * @returns A structured AI Insight string if a root cause is found, or null if no physical correlation exists.
 */
export function analyzeRootCause(
    appName: string,
    activeAlerts: Alert[],
    devices: Device[],
    dependencyPaths: DependencyPath[]
): string | null {

    // 1. Lookup: Find the DependencyPath for the target App
    const dependencyPath = dependencyPaths.find(p => p.appName === appName);

    if (!dependencyPath) {
        return null; // AI cannot analyze what it doesn't know (Silently skip)
    }

    // 2. Scan: Iterate through every Device ID in the path
    for (const deviceId of dependencyPath.path) {

        // Find the device details (for metadata like Name)
        const device = devices.find(d => d.id === deviceId);
        if (!device) continue;

        // 3. Correlate: Check for active L1/L2 alerts on this specific device
        const physicalFault = activeAlerts.find(alert =>
            alert.device === device.name && // Match by Device Name (since alert uses name in mockData)
            (alert.layer === 'L1' || alert.layer === 'L2') // Look for Physical/DataLink layer issues
        );

        if (physicalFault) {
            // 4. Output: Generate Insight
            return `Root Cause Detection: ${appName} lag caused by ${physicalFault.layer} issue (${physicalFault.message}) on ${device.name}. Recommendation: Inspect physical connection/device integrity.`;
        }
    }

    return null; // No physical root cause found on the defined path
}
