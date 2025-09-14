import { Server } from 'http';
import { BuildingLocationService } from '../services/buildingLocationService';
export declare class WSServer {
    private wss;
    private motionProcessor;
    private buildingLocationService;
    private clients;
    private heartbeatInterval;
    private currentLocation;
    constructor(server: Server);
    private initializeBuildingService;
    private setupWebSocketServer;
    private handleMessage;
    private handleMotionData;
    private handleCalibration;
    private handleReset;
    private handleGetStats;
    private handleLocationUpdate;
    private sendToClient;
    private broadcastToOthers;
    private broadcast;
    private generateClientId;
    private startHeartbeat;
    stop(): Promise<void>;
    getConnectedDevices(): string[];
    getDeviceStats(deviceId: string): any;
    getBuildingLocationService(): BuildingLocationService;
}
//# sourceMappingURL=wsServer.d.ts.map