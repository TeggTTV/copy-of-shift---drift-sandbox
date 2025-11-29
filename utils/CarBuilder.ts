import { TuningState, ModNode, SavedTune } from '../types';
import { BASE_TUNING, MOD_TREE } from '../constants';

export class CarBuilder {
	/**
	 * Calculates the final tuning state by applying mods to the base tuning.
	 * @param baseTuning The starting tuning state (usually BASE_TUNING or a car's stock tune)
	 * @param ownedModIds List of mod IDs that are installed
	 * @param disabledModIds List of mod IDs that are owned but disabled
	 * @returns The final calculated TuningState
	 */
	static calculateTuning(
		baseTuning: TuningState,
		ownedModIds: string[],
		disabledModIds: string[] = [],
		modSettings: Record<string, Record<string, number>> = {}
	): TuningState {
		// Start with a deep copy of the base tuning to avoid mutating the original
		let finalTuning: TuningState = JSON.parse(JSON.stringify(baseTuning));

		// Filter out disabled mods
		const activeModIds = ownedModIds.filter(
			(id) => !disabledModIds.includes(id)
		);

		// Find the ModNode objects for the active IDs
		const activeMods = MOD_TREE.filter((mod) =>
			activeModIds.includes(mod.id)
		);

		// Apply each mod
		activeMods.forEach((mod) => {
			finalTuning = this.applyMod(finalTuning, mod, modSettings[mod.id]);
		});

		return finalTuning;
	}

	/**
	 * Applies a single mod's stats to the tuning state.
	 * @param currentTuning The current state of the car
	 * @param mod The mod to apply
	 * @param settings Optional settings for this mod
	 * @returns A new TuningState with the mod applied
	 */
	private static applyMod(
		currentTuning: TuningState,
		mod: ModNode,
		settings?: Record<string, number>
	): TuningState {
		const newTuning = { ...currentTuning };

		if (!mod.stats) return newTuning;

		// Apply numeric stats (additive)
		if (mod.stats.maxTorque) newTuning.maxTorque += mod.stats.maxTorque;
		if (mod.stats.mass) newTuning.mass += mod.stats.mass;
		if (mod.stats.dragCoefficient)
			newTuning.dragCoefficient += mod.stats.dragCoefficient;
		if (mod.stats.tireGrip) newTuning.tireGrip += mod.stats.tireGrip;
		if (mod.stats.brakingForce)
			newTuning.brakingForce += mod.stats.brakingForce;
		if (mod.stats.turboIntensity)
			newTuning.turboIntensity += mod.stats.turboIntensity;
		if (mod.stats.exhaustOpenness)
			newTuning.exhaustOpenness += mod.stats.exhaustOpenness;
		if (mod.stats.backfireAggression)
			newTuning.backfireAggression += mod.stats.backfireAggression;

		// Apply replacements (these override the base value)
		if (mod.stats.cylinders) newTuning.cylinders = mod.stats.cylinders;
		if (mod.stats.redlineRPM) newTuning.redlineRPM = mod.stats.redlineRPM;
		if (mod.stats.idleRPM) newTuning.idleRPM = mod.stats.idleRPM;
		if (mod.stats.finalDriveRatio)
			newTuning.finalDriveRatio = mod.stats.finalDriveRatio;

		// Apply complex objects (Arrays/Objects) - usually replacements
		if (mod.stats.gearRatios) {
			newTuning.gearRatios = { ...mod.stats.gearRatios };
		}
		if (mod.stats.torqueCurve) {
			newTuning.torqueCurve = [...mod.stats.torqueCurve];
		}

		// Apply Tuning Options (Settings)
		if (mod.tuningOptions && settings) {
			mod.tuningOptions.forEach((option) => {
				const userValue = settings[option.id];
				if (userValue !== undefined) {
					if (option.statAffected) {
						// Direct stat modification (replacement)
						// Note: This assumes the setting REPLACES the stat.
						// If it should be additive, we'd need more logic.
						// For now, let's assume replacement for things like 'finalDriveRatio'
						// but maybe we need to check the type.
						(newTuning as any)[option.statAffected] = userValue;
					} else if (option.id === 'boost_pressure') {
						const deltaBar = userValue - option.defaultValue;
						newTuning.maxTorque += deltaBar * 100;
						newTuning.turboIntensity = Math.min(
							1.0,
							newTuning.turboIntensity + deltaBar * 0.2
						);
					} else if (option.id === 'tire_pressure') {
						// Tire Pressure Logic: Lower = More Grip, More Drag
						// Default 30 PSI.
						const deltaPsi = 30 - userValue; // Positive if under-inflated
						newTuning.tireGrip += deltaPsi * 0.01;
						newTuning.dragCoefficient += deltaPsi * 0.002;
					}
				}
			});
		}

		return newTuning;
	}

	/**
	 * Estimates the value of a car based on its mods and condition.
	 */
	static getCarValue(
		baseValue: number,
		condition: number,
		ownedModIds: string[]
	): number {
		let modValue = 0;
		const ownedMods = MOD_TREE.filter((mod) =>
			ownedModIds.includes(mod.id)
		);
		ownedMods.forEach((mod) => {
			modValue += mod.cost * 0.7; // 70% return on parts
		});

		return Math.floor((baseValue + modValue) * condition);
	}
}
