export type GamePhase =
	| 'MENU'
	| 'GARAGE'
	| 'MAP'
	| 'MISSION_SELECT'
	| 'VERSUS'
	| 'RACE'
	| 'RESULTS'
	| 'JUNKYARD'
	| 'DEALERSHIP';

export interface InputState {
	gas: boolean;
	shiftUp: boolean;
	shiftDown: boolean;
	clutch: boolean;
	steerLeft?: boolean;
	steerRight?: boolean;
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
		| 'VISUAL'
		| 'PAINT';

	// Tree Logic
	parentId: string | null;
	conflictsWith: string[]; // IDs of mods that cannot be active with this one

	// Effects
	stats: Partial<TuningState>;

	// UI Layout (Grid Coordinates)
	x: number;
	y: number;

	// New Tuning System
	tuningOptions?: TuningOption[];
	soundProfile?: string; // e.g., 'muffler_sport'
	isSpecial?: boolean; // If true, only visible if owned or parent is owned
	rarity?: 'COMMON' | 'RARE' | 'LEGENDARY' | 'EXOTIC';
}

export interface TuningOption {
	id: string; // e.g., 'boost_pressure'
	name: string;
	min: number;
	max: number;
	step: number;
	defaultValue: number;
	unit?: string;
	statAffected?: keyof TuningState; // Which stat this modifies directly (optional)
}

export type ModSettings = Record<string, Record<string, number>>; // modId -> { settingId: value }

export type Rarity =
	| 'COMMON'
	| 'UNCOMMON'
	| 'RARE'
	| 'EPIC'
	| 'LEGENDARY'
	| 'EXOTIC';

export interface SavedTune {
	id: string;
	name: string;
	date: number;
	ownedMods: string[];
	disabledMods: string[];
	modSettings: ModSettings;
	manualTuning: Partial<TuningState>;
	condition?: number; // 0-1 (1 = perfect, 0 = wrecked)
	originalPrice?: number; // Market value when fully restored
	rarity?: Rarity;
	rarityMultiplier?: number;
}

export interface JunkyardCar extends SavedTune {
	price: number;
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
	brakingForce: number;

	// Visuals
	color: string;
	name?: string; // Car nickname
}

export interface CarState {
	y: number; // Distance in meters
	velocity: number; // m/s
	rpm: number;
	gear: number; // 0: N, 1-6: Forward
	finished: boolean;
	finishTime: number;

	// Circuit Mode (Optional)
	x?: number;
	angle?: number;
	steerAngle?: number;
	lateralVelocity?: number;
}

export interface GhostFrame {
	time: number;
	y: number;
	velocity: number;
	rpm: number;
	gear: number;
}

export interface Opponent {
	name: string;
	difficulty: number;
	color: string;
	tuning: TuningState;
}
export interface Mission {
	id: number;
	name: string;
	description: string;
	payout: number;
	difficulty:
		| 'EASY'
		| 'MEDIUM'
		| 'HARD'
		| 'EXTREME'
		| 'IMPOSSIBLE'
		| 'BOSS'
		| 'UNDERGROUND';
	distance: number; // meters
	opponent: Opponent;
	bestTime?: number; // Persisted best time
	bestGhost?: number[]; // Recorded ghost data
	rewardCar?: SavedTune; // Car awarded for winning
	xpReward?: number;
}

export interface DailyChallenge extends Mission {
	expiresAt: number;
	completed: boolean;
}

export type ToastType =
	| 'ENGINE'
	| 'TIRES'
	| 'WEIGHT'
	| 'TRANSMISSION'
	| 'TURBO'
	| 'NITROUS'
	| 'FUEL'
	| 'COOLING'
	| 'AERO'
	| 'SUSPENSION'
	| 'MONEY'
	| 'UNLOCK'
	| 'INFO'
	| 'WARNING'
	| 'PAINT'
	| 'ECU'
	| 'ERROR'
	| 'SUCCESS';

export interface WeatherState {
	type: 'SUNNY' | 'RAIN';
	intensity: number; // 0-1
}
