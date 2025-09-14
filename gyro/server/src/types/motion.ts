export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface EulerAngles {
  pitch: number;  // rotation around x-axis (radians)
  roll: number;   // rotation around z-axis (radians)
  yaw: number;    // rotation around y-axis (radians)
}

export interface RotationRate {
  x: number;  // rad/s
  y: number;  // rad/s
  z: number;  // rad/s
}

export interface Acceleration {
  x: number;  // m/s²
  y: number;  // m/s²
  z: number;  // m/s²
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
  heading: number;  // degrees (0-360)
  confidence: number;  // 0-1
}

export interface ProcessedMotionData extends MotionData {
  direction: DirectionData;
  deviceId: string;
}