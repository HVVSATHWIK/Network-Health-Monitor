import { AssetRegistry } from './AssetRegistry';
import { Device } from '../types/network';

export class IdentifierResolverService {
    /**
     * Resolves a device based on available identifiers.
     * Priority: Device ID > MAC Address > IP Address
     */
    public resolveDevice(context: { deviceId?: string; mac?: string; ip?: string }): Device | undefined {
        // 1. Try explicit Device ID
        if (context.deviceId) {
            const device = AssetRegistry.getDeviceById(context.deviceId);
            if (device) return device;
        }

        // 2. Try MAC Address (Reliable L2 identifier)
        if (context.mac) {
            const device = AssetRegistry.getDeviceByMac(context.mac);
            if (device) return device;
        }

        // 3. Try IP Address (L3 identifier, mutable but often available)
        if (context.ip) {
            const device = AssetRegistry.getDeviceByIp(context.ip);
            if (device) return device;
        }

        return undefined;
    }
}

export const IdentifierResolver = new IdentifierResolverService();
