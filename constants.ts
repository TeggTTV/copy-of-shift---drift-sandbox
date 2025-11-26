import { PhysicsConstants, TuningState } from './types';

// These can be edited in real-time via the UI
export const DEFAULT_TUNING: TuningState = {
  mass: 1400,            // kg
  maxTorque: 400,        // Nm 
  redlineRPM: 7500,
  idleRPM: 900,
  flywheelMass: 0.3,     // Lower = Snappier revs
  
  finalDriveRatio: 3.42,
  
  tireGrip: 1.2,         // Lateral friction multiplier. Lower = driftier (Real tires ~1.0, Slicks ~1.5)
  dragCoefficient: 0.35,
  steerSpeed: 2.0,
  brakingForce: 8000,

  suspensionStiffness: 50.0,
  suspensionDamping: 5.0
};

// Fixed physical properties
export const CAR_CONSTANTS: PhysicsConstants = {
  wheelBase: 2.6,
  wheelRadius: 0.3,
  rollingResistance: 100, // Basic friction
  gearRatios: {
    [-1]: 3.5, // Reverse
    0: 0,      // Neutral
    1: 3.6,
    2: 2.1,
    3: 1.5,
    4: 1.1,
    5: 0.9,
    6: 0.7
  }
};

export const TORQUE_CURVE = [
  { rpm: 0, factor: 0.5 },
  { rpm: 1000, factor: 0.7 },
  { rpm: 3000, factor: 0.9 },
  { rpm: 4500, factor: 1.0 }, // Peak torque
  { rpm: 6000, factor: 0.95 },
  { rpm: 7500, factor: 0.7 },
  { rpm: 9000, factor: 0.4 }
];

export const CONTROLS = {
  FORWARD: 'w',
  LEFT: 'a',
  RIGHT: 'd',
  BRAKE: 's',
  E_BRAKE: ' ',
  CLUTCH: 'Shift',
  GEAR_UP: 'ArrowUp',
  GEAR_DOWN: 'ArrowDown',
};