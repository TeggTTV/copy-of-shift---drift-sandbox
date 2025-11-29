import { DailyChallenge, Mission, Opponent, TuningState } from '../types';
import { BASE_TUNING } from '../constants';

const ADJECTIVES = [
	'Furious',
	'Midnight',
	'Neon',
	'Turbo',
	'Drift',
	'Street',
	'Underground',
	'Phantom',
	'Ghost',
	'Apex',
];
const NOUNS = [
	'Racer',
	'King',
	'Queen',
	'Demon',
	'Shadow',
	'Viper',
	'Cobra',
	'Wolf',
	'Eagle',
	'Legend',
];

const COLORS = [
	'#ef4444', // Red
	'#f97316', // Orange
	'#eab308', // Yellow
	'#22c55e', // Green
	'#06b6d4', // Cyan
	'#3b82f6', // Blue
	'#a855f7', // Purple
	'#ec4899', // Pink
];

const generateRandomName = () => {
	const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
	const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
	return `${adj} ${noun}`;
};

const generateRandomTuning = (difficulty: number): TuningState => {
	// Difficulty 0.0 to 1.0+
	// 0.2 = Rookie
	// 1.0 = Boss
	// 1.5 = Extreme

	const baseTorque = 150 + difficulty * 400; // 150 to 550+
	const grip = 1.0 + difficulty * 1.5; // 1.0 to 2.5+
	const mass = Math.max(800, 1500 - difficulty * 400); // Lighter as harder

	return {
		...BASE_TUNING,
		maxTorque: baseTorque + Math.random() * 50,
		mass: mass,
		tireGrip: grip,
		finalDriveRatio: 3.0 + Math.random() * 1.0,
		turboIntensity: Math.min(1.0, difficulty * 0.8),
		color: COLORS[Math.floor(Math.random() * COLORS.length)],
		name: generateRandomName(),
	};
};

export const generateDailyChallenges = (
	count: number = 3
): DailyChallenge[] => {
	const challenges: DailyChallenge[] = [];
	const now = Date.now();
	// Expires in 24 hours
	const expiresAt = now + 24 * 60 * 60 * 1000;

	for (let i = 0; i < count; i++) {
		// Scale difficulty: Easy, Medium, Hard
		const difficultyLevel = 0.3 + i * 0.3; // 0.3, 0.6, 0.9
		const difficultyLabel = i === 0 ? 'EASY' : i === 1 ? 'MEDIUM' : 'HARD';

		const opponentTuning = generateRandomTuning(difficultyLevel);
		const opponent: Opponent = {
			name: opponentTuning.name || 'Unknown Racer',
			difficulty: difficultyLevel,
			color: opponentTuning.color,
			tuning: opponentTuning,
		};

		const payout = 500 + i * 500 + Math.floor(Math.random() * 200);

		challenges.push({
			id: 1000 + Math.floor(Math.random() * 9000), // Random ID 1000-9999
			name: `Daily: ${opponent.name}`,
			description: `Beat ${opponent.name} in a 1/4 mile race. Limited time event!`,
			payout: payout,
			difficulty: difficultyLabel,
			distance: 402, // 1/4 mile
			opponent: opponent,
			expiresAt: expiresAt,
			completed: false,
		});
	}

	return challenges;
};
