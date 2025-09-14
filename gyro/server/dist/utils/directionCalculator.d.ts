import { EulerAngles, DirectionData, Quaternion } from '../types/motion';
export declare class DirectionCalculator {
    private calibrationYaw;
    private isCalibrated;
    private smoothingFactor;
    private previousHeading;
    /**
     * Calibrate the initial heading (set current direction as North)
     */
    calibrate(currentYaw: number): void;
    /**
     * Convert quaternion to Euler angles
     */
    quaternionToEuler(q: Quaternion): EulerAngles;
    /**
     * Calculate heading from yaw angle
     */
    private calculateHeading;
    /**
     * Apply exponential smoothing to heading values
     */
    private smoothHeading;
    /**
     * Convert heading to cardinal direction
     */
    private headingToCardinal;
    /**
     * Calculate confidence based on rotation rate and acceleration
     */
    private calculateConfidence;
    /**
     * Process motion data and return direction information
     */
    processMotionData(eulerAngles: EulerAngles, rotationRate: {
        x: number;
        y: number;
        z: number;
    }, userAcceleration: {
        x: number;
        y: number;
        z: number;
    }): DirectionData;
    /**
     * Reset calibration
     */
    reset(): void;
    /**
     * Set smoothing factor (0-1, higher = more smoothing)
     */
    setSmoothingFactor(factor: number): void;
}
//# sourceMappingURL=directionCalculator.d.ts.map