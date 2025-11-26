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
	maxTorque: number; // Nm
	redlineRPM: number;
	flywheelMass: number; // Affects how fast RPM changes
	idleRPM: number;

	// Audio / Mechanical Config
	cylinders: number; // 4, 6, 8, 10, 12
	exhaustOpenness: number; // 0.0 (Stock) to 1.0 (Straight Pipe)
	backfireAggression: number; // 0.0 to 1.0

	// Transmission
	finalDriveRatio: number;

	// Tires & Handling
	tireGrip: number; // Friction coefficient
	dragCoefficient: number;
	mass: number; // kg
	steerSpeed: number; // how fast wheels turn
	brakingForce: number;

	// Suspension
	suspensionStiffness: number;
	suspensionDamping: number;
}

export interface CarState {
	x: number;
	y: number;
	heading: number; // radians
	velocityX: number; // World space X velocity
	velocityY: number; // World space Y velocity
	angularVelocity: number;

	steeringAngle: number; // radians relative to car
	rpm: number;
	gear: number; // -1: R, 0: N, 1-6: Forward

	// Suspension State
	pitch: number;
	roll: number;

	// Telemetry
	speed: number; // m/s
	slipAngle: number;
	isDrifting: boolean;
	gripRatio: number;
}

export interface PhysicsConstants {
	wheelBase: number;
	wheelRadius: number;
	gearRatios: Record<number, number>;
	rollingResistance: number;
}
