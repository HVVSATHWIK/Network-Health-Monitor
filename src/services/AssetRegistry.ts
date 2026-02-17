import { Device } from '../types/network';
import { devices as initialDevices } from '../data/mockData';

/**
 * AssetRegistry acts as the "Source of Truth" or CMDB for the platform.
 * In a real application, this would query a backend database or external CMDB API.
 */
class AssetRegistryService {
    private devices: Map<string, Device>;
    private ipIndex: Map<string, string>; // IP -> DeviceID
    private macIndex: Map<string, string>; // MAC -> DeviceID

    constructor() {
        this.devices = new Map();
        this.ipIndex = new Map();
        this.macIndex = new Map();
        this.initializeRegistry();
    }

    private initializeRegistry() {
        initialDevices.forEach(device => {
            this.devices.set(device.id, device);
            if (device.ip) {
                this.ipIndex.set(device.ip, device.id);
            }
            if (device.mac) {
                this.macIndex.set(device.mac, device.id);
            }
        });
    }

    public getDeviceById(id: string): Device | undefined {
        return this.devices.get(id);
    }

    public getDeviceByIp(ip: string): Device | undefined {
        const id = this.ipIndex.get(ip);
        return id ? this.devices.get(id) : undefined;
    }

    public getDeviceByMac(mac: string): Device | undefined {
        const id = this.macIndex.get(mac);
        return id ? this.devices.get(id) : undefined;
    }

    public getAllDevices(): Device[] {
        return Array.from(this.devices.values());
    }

    // Simulate registering a new asset discovered in the network
    public registerAsset(device: Device): void {
        this.devices.set(device.id, device);
        if (device.ip) this.ipIndex.set(device.ip, device.id);
        if (device.mac) this.macIndex.set(device.mac, device.id);
    }
}

export const AssetRegistry = new AssetRegistryService();
