import { Opponent, TuningState } from '../types';
import { BASE_TUNING } from '../constants';

const RIVAL_NAMES = [
	'Viper',
	'Ghost',
	'Shadow',
	'Apex',
	'Drift King',
	'Redline',
	'Turbo',
	'Nitrous',
	'Slick',
	'Axle',
	'Piston',
	'Cam',
	'Spark',
	'Gearhead',
	'Clutch',
	'Shift',
	'Burnout',
	'Tarmac',
	'Asphalt',
	'Street',
	'Racer X',
	'The Baron', // Rare
	'DK',
	'Speedy',
	'Crash',
];

const CAR_COLORS = [
	'#ef4444', // Red
	'#3b82f6', // Blue
	'#22c55e', // Green
	'#eab308', // Yellow
	'#a855f7', // Purple
	'#ec4899', // Pink
	'#f97316', // Orange
	'#06b6d4', // Cyan
	'#64748b', // Slate
	'#1e293b', // Dark Slate
	'#ffffff', // White
	'#000000', // Black
];

// Helper to generate a random number between min and max
const random = (min: number, max: number) => Math.random() * (max - min) + min;

// Helper to pick a random item from an array
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const generateOpponent = (
	level: number,
	playerMaxTorque: number = 300 // Default reference if player stats aren't passed
): Opponent => {
	// Base difficulty scales with level
	// Level 1: 0.8 difficulty
	// Level 10: 1.2 difficulty
	// Level 50: 2.0 difficulty
	const difficultyMultiplier = 0.8 + level * 0.05;

	// Random variance (+/- 10%)
	const variance = random(0.9, 1.1);

	const finalDifficulty = difficultyMultiplier * variance;

	// Generate Tuning based on difficulty
	// We scale torque and grip primarily
	const baseTorque = 140; // Stock torque
	const targetTorque = baseTorque * finalDifficulty;

	// Ensure opponent is competitive but beatable (or slightly harder)
	// If we have player stats, we can rubber-band slightly
	// But "The Ladder" should get progressively harder regardless of player
	// So we stick to level-based scaling for the "Underground" feel.

	const tuning: TuningState = {
		...BASE_TUNING,
		maxTorque: Math.floor(targetTorque),
		// Scale grip with power to ensure they can actually launch
		tireGrip: Math.min(4.0, 2.0 + level * 0.05),
		// Adjust gear ratios slightly for variety? Maybe later.
		// Randomize shift point slightly
		redlineRPM: Math.floor(random(6500, 8500)),
		// Visuals
		color: pick(CAR_COLORS),
	};

	// Name generation
	const name = `${pick(RIVAL_NAMES)} (Lvl ${level})`;

	return {
		name,
		difficulty: finalDifficulty,
		color: tuning.color,
		tuning,
	};
};
