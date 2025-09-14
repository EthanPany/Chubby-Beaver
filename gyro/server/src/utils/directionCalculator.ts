import { EulerAngles, CardinalDirection, DirectionData, Quaternion } from '../types/motion';

export class DirectionCalculator {
  private calibrationYaw: number = 0;
  private isCalibrated: boolean = false;
  private smoothingFactor: number = 0.2;
  private previousHeading: number = 0;

  /**
   * Calibrate the initial heading (set current direction as North)
   */
  calibrate(currentYaw: number): void {
    this.calibrationYaw = currentYaw;
    this.isCalibrated = true;
    console.log(`Calibrated with yaw offset: ${this.calibrationYaw} radians`);
  }

  /**
   * Convert quaternion to Euler angles
   */
  quaternionToEuler(q: Quaternion): EulerAngles {
    const sinr_cosp = 2 * (q.w * q.x + q.y * q.z);
    const cosr_cosp = 1 - 2 * (q.x * q.x + q.y * q.y);
    const roll = Math.atan2(sinr_cosp, cosr_cosp);

    const sinp = 2 * (q.w * q.y - q.z * q.x);
    const pitch = Math.abs(sinp) >= 1
      ? Math.sign(sinp) * Math.PI / 2
      : Math.asin(sinp);

    const siny_cosp = 2 * (q.w * q.z + q.x * q.y);
    const cosy_cosp = 1 - 2 * (q.y * q.y + q.z * q.z);
    const yaw = Math.atan2(siny_cosp, cosy_cosp);

    return { pitch, roll, yaw };
  }

  /**
   * Calculate heading from yaw angle
   */
  private calculateHeading(yaw: number): number {
    if (!this.isCalibrated) {
      console.warn('Direction calculator not calibrated. Using raw yaw value.');
    }

    // Apply calibration offset and flip for correct direction
    // Flip the yaw by negating it to fix left/right inversion
    let heading = -yaw - this.calibrationYaw;

    // Convert from radians to degrees
    heading = heading * (180 / Math.PI);

    // Normalize to 0-360 range
    heading = ((heading % 360) + 360) % 360;

    // Apply smoothing to reduce jitter
    heading = this.smoothHeading(heading);

    return heading;
  }

  /**
   * Apply exponential smoothing to heading values
   */
  private smoothHeading(currentHeading: number): number {
    // Handle wrapping around 360/0 boundary
    let delta = currentHeading - this.previousHeading;

    if (delta > 180) {
      delta -= 360;
    } else if (delta < -180) {
      delta += 360;
    }

    const smoothedHeading = this.previousHeading + delta * this.smoothingFactor;
    this.previousHeading = ((smoothedHeading % 360) + 360) % 360;

    return this.previousHeading;
  }

  /**
   * Convert heading to cardinal direction
   */
  private headingToCardinal(heading: number): CardinalDirection {
    const directions: CardinalDirection[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(heading / 45) % 8;
    return directions[index];
  }

  /**
   * Calculate confidence based on rotation rate and acceleration
   */
  private calculateConfidence(
    rotationRate: { x: number; y: number; z: number },
    userAcceleration: { x: number; y: number; z: number }
  ): number {
    // Calculate magnitude of rotation
    const rotMagnitude = Math.sqrt(
      rotationRate.x ** 2 +
      rotationRate.y ** 2 +
      rotationRate.z ** 2
    );

    // Calculate magnitude of acceleration
    const accMagnitude = Math.sqrt(
      userAcceleration.x ** 2 +
      userAcceleration.y ** 2 +
      userAcceleration.z ** 2
    );

    // Lower confidence with higher movement
    const rotConfidence = Math.max(0, 1 - rotMagnitude / 5);
    const accConfidence = Math.max(0, 1 - accMagnitude / 10);

    // Weight rotation more heavily as it affects heading directly
    return rotConfidence * 0.7 + accConfidence * 0.3;
  }

  /**
   * Process motion data and return direction information
   */
  processMotionData(
    eulerAngles: EulerAngles,
    rotationRate: { x: number; y: number; z: number },
    userAcceleration: { x: number; y: number; z: number }
  ): DirectionData {
    const heading = this.calculateHeading(eulerAngles.yaw);
    const direction = this.headingToCardinal(heading);
    const confidence = this.calculateConfidence(rotationRate, userAcceleration);

    return {
      direction,
      heading,
      confidence
    };
  }

  /**
   * Reset calibration
   */
  reset(): void {
    this.calibrationYaw = 0;
    this.isCalibrated = false;
    this.previousHeading = 0;
  }

  /**
   * Set smoothing factor (0-1, higher = more smoothing)
   */
  setSmoothingFactor(factor: number): void {
    this.smoothingFactor = Math.max(0, Math.min(1, factor));
  }
}