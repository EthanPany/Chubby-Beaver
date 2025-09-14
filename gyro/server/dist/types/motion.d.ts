export interface Quaternion {
    x: number;
    y: number;
    z: number;
    w: number;
}
export interface EulerAngles {
    pitch: number;
    roll: number;
    yaw: number;
}
export interface RotationRate {
    x: number;
    y: number;
    z: number;
}
export interface Acceleration {
    x: number;
    y: number;
    z: number;
}
export interface Gravity {
    x: number;
    y: number;
    z: number;
}
export interface MotionData {
    timestamp: number;
    attitude: {
        quaternion: Quaternion;
        eulerAngles: EulerAngles;
    };
    rotationRate: RotationRate;
    userAcceleration: Acceleration;
    gravity: Gravity;
    magneticField?: {
        x: number;
        y: number;
        z: number;
        accuracy: number;
    };
}
export type CardinalDirection = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';
export interface DirectionData {
    direction: CardinalDirection;
    heading: number;
    confidence: number;
}
export interface ProcessedMotionData extends MotionData {
    direction: DirectionData;
    deviceId: string;
}
//# sourceMappingURL=motion.d.ts.map