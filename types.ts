export type GamePhase =
	| 'MENU'
	| 'GARAGE'
	| 'MAP'
	| 'MISSION_SELECT'
	| 'VERSUS'
	| 'RACE'
	| 'RESULTS';

export interface InputState {
	gas: boolean;
	shiftUp: boolean;
	shiftDown: boolean;
	clutch: boolean;
}

// Replaces the old linear levels
export interface ModNode {
	id: string;
	name: string;
	description: string;
	cost: number;
	type:
		| 'ENGINE'
		| 'TURBO'
		| 'WEIGHT'
		| 'TIRES'
		| 'TRANSMISSION'
		| 'NITROUS'
		| 'FUEL'
		| 'COOLING'
		| 'AERO'
		| 'SUSPENSION'
		| 'VISUAL';

	// Tree Logic
	parentId: string | null;
	conflictsWith: string[]; // IDs of mods that cannot be active with this one

	// Effects
	stats: Partial<TuningState>;

	// UI Layout (Grid Coordinates)
	x: number;
	y: number;
}

export interface TuningState {
	// Engine
	maxTorque: number; // Nm
	torqueCurve: { rpm: number; factor: number }[];
	redlineRPM: number;
	flywheelMass: number;
	idleRPM: number;
	compressionRatio: number; // For audio simulation

	// Audio
	cylinders: number;
	exhaustOpenness: number;
	backfireAggression: number;
	turboIntensity: number;

	// Transmission
	finalDriveRatio: number;
	gearRatios: Record<number, number>;

	// Physics
	mass: number;
	dragCoefficient: number;
	tireGrip: number;

	// Visuals
	color: string;
}

export interface CarState {
	y: number; // Distance in meters
	velocity: number; // m/s
	rpm: number;
	gear: number; // 0: N, 1-6: Forward
	finished: boolean;
	finishTime: number;
}

export interface Opponent {
	name: string;
	difficulty: number;
	color: string;
	tuning: TuningState;
}

export interface GhostFrame {
	time: number;
	y: number;
	velocity: number;
	rpm: number;
	gear: number;
}

export interface Mission {
	id: number;
	name: string;
	description: string;
	payout: number;
	difficulty: string;
	distance: number; // meters
	opponent: Opponent;
	bestTime?: number; // Persisted best time
	bestGhost?: GhostFrame[]; // Recorded ghost data
}
