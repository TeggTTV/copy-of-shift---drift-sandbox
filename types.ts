export interface InputState {
  forward: boolean;
  backward: boolean; 
  left: boolean;
  right: boolean;
  brake: boolean;
  eBrake: boolean;
  clutch: boolean;
  gearUp: boolean;
  gearDown: boolean;
}

export interface TuningState {
  // Engine
  maxTorque: number;      // Nm
  redlineRPM: number;
  flywheelMass: number;   // Affects how fast RPM changes (0.1 = racing, 1.0 = heavy truck)
  idleRPM: number;
  
  // Transmission
  finalDriveRatio: number;

  // Tires & Handling
  tireGrip: number;       // 0 to 1+ (friction coefficient)
  dragCoefficient: number;
  mass: number;           // kg
  steerSpeed: number;     // how fast wheels turn
  brakingForce: number;

  // Suspension
  suspensionStiffness: number;
  suspensionDamping: number;
}

export interface CarState {
  x: number;
  y: number;
  heading: number;       // radians (direction car is facing)
  velocityX: number;     // World space X velocity
  velocityY: number;     // World space Y velocity
  angularVelocity: number; // Rotational speed
  
  steeringAngle: number; // radians relative to car
  rpm: number;
  gear: number;          // -1: Reverse, 0: Neutral, 1-6: Forward
  
  // Suspension State
  pitch: number;         // Forward/Back tilt (acceleration)
  roll: number;          // Left/Right tilt (turning)

  // Telemetry
  speed: number;         // m/s magnitude
  slipAngle: number;     // Difference between heading and movement vector
  isDrifting: boolean;   // Visual flag
  gripRatio: number;     // 0.0 - 1.0 (grip), >1.0 (drift)
}

// Fixed constants that don't need runtime tuning
export interface PhysicsConstants {
  wheelBase: number;
  wheelRadius: number;
  gearRatios: Record<number, number>;
  rollingResistance: number;
}