import { TuningState } from '../types';

/**
 * Calculates a Performance Index (PI) for a car based on its tuning stats.
 * Formula considers Power, Torque, Weight, Grip, and Aerodynamics.
 *
 * @param tuning The car's tuning state
 * @returns A rounded integer representing the PI (e.g., 100 - 999)
 */
export const calculatePerformanceRating = (tuning: TuningState): number => {
	// 1. Power Factor (HP)
	// Estimate Peak HP from Max Torque and Redline (simplified)
	// HP = Torque * RPM / 5252 (ft-lb) or / 7023 (Nm)
	// We use Nm in this game generally? Let's check.
	// Game uses Nm for torque.
	const estimatedPeakHP =
		(tuning.maxTorque * (tuning.redlineRPM * 0.9)) / 7023;

	// 2. Power-to-Weight Ratio (HP/Ton)
	const powerToWeight = estimatedPeakHP / (tuning.mass / 1000);

	// 3. Grip Factor
	// Grip is usually 1.0 - 2.0
	const gripFactor = tuning.tireGrip * 100;

	// 4. Aero Factor
	// Lower drag is better. 0.3 is standard.
	const aeroFactor = (0.4 - tuning.dragCoefficient) * 200;

	// 5. Shift Speed / Drivetrain (Simplified)
	// We don't have shift time in tuning state directly, but we can assume higher tier parts improve it.
	// For now, ignore.

	// Formula
	// Base: 100
	// + PowerToWeight * 0.5
	// + Grip * 0.5
	// + Aero

	let rating = 100;
	rating += powerToWeight * 0.6;
	rating += gripFactor * 0.8;
	rating += aeroFactor;

	// Cap/Floor
	return Math.max(100, Math.round(rating));
};

/**
 * Returns a class letter for the rating (D, C, B, A, S, R, X)
 */
export const getRatingClass = (rating: number): string => {
	if (rating < 200) return 'D';
	if (rating < 300) return 'C';
	if (rating < 400) return 'B';
	if (rating < 500) return 'A';
	if (rating < 600) return 'S';
	if (rating < 800) return 'R';
	return 'X';
};
