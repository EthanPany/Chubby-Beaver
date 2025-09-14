import { MotionData, ProcessedMotionData } from '../types/motion';
export declare class MotionProcessor {
    private directionCalculators;
    private dataBuffer;
    private bufferSize;
    /**
     * Process incoming motion data
     */
    processData(data: MotionData, deviceId: string): ProcessedMotionData;
    /**
     * Calibrate a specific device
     */
    calibrateDevice(deviceId: string, currentYaw?: number): void;
    /**
     * Reset calibration for a device
     */
    resetDevice(deviceId: string): void;
    /**
     * Add data to buffer with size limit
     */
    private addToBuffer;
    /**
     * Get recent data for a device
     */
    getRecentData(deviceId: string, count?: number): ProcessedMotionData[];
    /**
     * Get statistics for a device
     */
    getDeviceStats(deviceId: string): any;
    /**
     * Clear all data for a device
     */
    clearDeviceData(deviceId: string): void;
    /**
     * Get all connected devices
     */
    getConnectedDevices(): string[];
}
//# sourceMappingURL=motionProcessor.d.ts.map