import { MotionData, ProcessedMotionData } from '../types/motion';
import { DirectionCalculator } from '../utils/directionCalculator';

export class MotionProcessor {
  private directionCalculators: Map<string, DirectionCalculator> = new Map();
  private dataBuffer: Map<string, ProcessedMotionData[]> = new Map();
  private bufferSize: number = 100;

  /**
   * Process incoming motion data
   */
  processData(data: MotionData, deviceId: string): ProcessedMotionData {
    // Get or create direction calculator for this device
    if (!this.directionCalculators.has(deviceId)) {
      this.directionCalculators.set(deviceId, new DirectionCalculator());
    }

    const calculator = this.directionCalculators.get(deviceId)!;

    // Calculate direction from motion data
    const directionData = calculator.processMotionData(
      data.attitude.eulerAngles,
      data.rotationRate,
      data.userAcceleration
    );

    // Create processed data object
    const processedData: ProcessedMotionData = {
      ...data,
      direction: directionData,
      deviceId
    };

    // Store in buffer for history
    this.addToBuffer(deviceId, processedData);

    return processedData;
  }

  /**
   * Calibrate a specific device
   */
  calibrateDevice(deviceId: string, currentYaw?: number): void {
    const calculator = this.directionCalculators.get(deviceId);
    if (calculator) {
      if (currentYaw !== undefined) {
        calculator.calibrate(currentYaw);
      } else {
        // Use the last known yaw if available
        const buffer = this.dataBuffer.get(deviceId);
        if (buffer && buffer.length > 0) {
          const lastData = buffer[buffer.length - 1];
          calculator.calibrate(lastData.attitude.eulerAngles.yaw);
        }
      }
    }
  }

  /**
   * Reset calibration for a device
   */
  resetDevice(deviceId: string): void {
    const calculator = this.directionCalculators.get(deviceId);
    if (calculator) {
      calculator.reset();
    }
  }

  /**
   * Add data to buffer with size limit
   */
  private addToBuffer(deviceId: string, data: ProcessedMotionData): void {
    if (!this.dataBuffer.has(deviceId)) {
      this.dataBuffer.set(deviceId, []);
    }

    const buffer = this.dataBuffer.get(deviceId)!;
    buffer.push(data);

    // Maintain buffer size limit
    if (buffer.length > this.bufferSize) {
      buffer.shift();
    }
  }

  /**
   * Get recent data for a device
   */
  getRecentData(deviceId: string, count: number = 10): ProcessedMotionData[] {
    const buffer = this.dataBuffer.get(deviceId) || [];
    return buffer.slice(-count);
  }

  /**
   * Get statistics for a device
   */
  getDeviceStats(deviceId: string): any {
    const buffer = this.dataBuffer.get(deviceId) || [];
    if (buffer.length === 0) return null;

    const recent = buffer.slice(-10);

    // Calculate average confidence
    const avgConfidence = recent.reduce((sum, d) => sum + d.direction.confidence, 0) / recent.length;

    // Get current direction
    const currentData = buffer[buffer.length - 1];

    // Calculate average rotation rate
    const avgRotation = recent.reduce((sum, d) => ({
      x: sum.x + Math.abs(d.rotationRate.x),
      y: sum.y + Math.abs(d.rotationRate.y),
      z: sum.z + Math.abs(d.rotationRate.z)
    }), { x: 0, y: 0, z: 0 });

    Object.keys(avgRotation).forEach(key => {
      avgRotation[key as keyof typeof avgRotation] /= recent.length;
    });

    return {
      currentDirection: currentData.direction.direction,
      currentHeading: currentData.direction.heading,
      averageConfidence: avgConfidence,
      averageRotationRate: avgRotation,
      dataPoints: buffer.length,
      lastUpdate: currentData.timestamp
    };
  }

  /**
   * Clear all data for a device
   */
  clearDeviceData(deviceId: string): void {
    this.dataBuffer.delete(deviceId);
    this.directionCalculators.delete(deviceId);
  }

  /**
   * Get all connected devices
   */
  getConnectedDevices(): string[] {
    return Array.from(this.directionCalculators.keys());
  }
}