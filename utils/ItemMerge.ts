import { InventoryItem, ItemRarity, TuningState } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class ItemMerge {
	static canMerge(item1: InventoryItem, item2: InventoryItem): boolean {
		if (!item1 || !item2) return false;
		if (item1.instanceId === item2.instanceId) return false; // Can't merge self
		if (item1.type !== item2.type) return false; // Must be same type
		// Must be same base part (e.g. Turbo T3 + Turbo T3), or just same type?
		// Prompt says "Hovering over one of the parts will also highlight the others of the same kind."
		// "kind" usually means the specific part definition (baseId).
		// "merge certain parts together... If the player has two of the same part"
		// I will assume same baseId.
		return item1.baseId === item2.baseId;
	}

	// Returns possible outcomes and their probabilities
	static getMergeProbabilities(
		r1: ItemRarity,
		r2: ItemRarity
	): { rarity: ItemRarity | 'EXOTIC'; chance: number }[] {
		// Helper to rank rarity
		const rank = (r: string) => {
			const map: Record<string, number> = {
				COMMON: 0,
				UNCOMMON: 1,
				RARE: 2,
				EPIC: 3,
				LEGENDARY: 4,
				EXOTIC: 5,
			};
			return map[r] ?? 0;
		};

		const [low, high] = rank(r1) <= rank(r2) ? [r1, r2] : [r2, r1];

		if (low === 'COMMON' && high === 'COMMON') {
			return [
				{ rarity: 'UNCOMMON', chance: 0.75 },
				{ rarity: 'COMMON', chance: 0.25 },
			];
		} else if (low === 'COMMON' && high === 'UNCOMMON') {
			return [
				{ rarity: 'RARE', chance: 0.1 },
				{ rarity: 'UNCOMMON', chance: 0.9 },
			];
		} else if (low === 'UNCOMMON' && high === 'UNCOMMON') {
			return [
				{ rarity: 'RARE', chance: 0.75 },
				{ rarity: 'UNCOMMON', chance: 0.25 },
			];
		} else if (low === 'UNCOMMON' && high === 'RARE') {
			return [
				{ rarity: 'EPIC', chance: 0.1 },
				{ rarity: 'RARE', chance: 0.9 },
			];
		} else if (low === 'RARE' && high === 'RARE') {
			return [
				{ rarity: 'EPIC', chance: 0.75 },
				{ rarity: 'RARE', chance: 0.25 },
			];
		} else if (low === 'RARE' && high === 'EPIC') {
			return [
				{ rarity: 'LEGENDARY', chance: 0.1 },
				{ rarity: 'EPIC', chance: 0.9 },
			];
		} else if (low === 'EPIC' && high === 'EPIC') {
			return [
				{ rarity: 'LEGENDARY', chance: 0.75 },
				{ rarity: 'EPIC', chance: 0.25 },
			];
		} else if (low === 'EPIC' && high === 'LEGENDARY') {
			return [
				{ rarity: 'EXOTIC', chance: 0.1 },
				{ rarity: 'LEGENDARY', chance: 0.9 },
			];
		} else if (low === 'LEGENDARY' && high === 'LEGENDARY') {
			return [
				{ rarity: 'EXOTIC', chance: 0.75 },
				{ rarity: 'LEGENDARY', chance: 0.25 },
			];
		} else {
			// Fallback: 100% High Rarity
			return [{ rarity: high as ItemRarity, chance: 1.0 }];
		}
	}

	static mergeItems(
		item1: InventoryItem,
		item2: InventoryItem
	): InventoryItem | null {
		if (!this.canMerge(item1, item2)) return null;

		// 1. Condition
		const c1 = item1.condition ?? 100;
		const c2 = item2.condition ?? 100;
		// Formula: c1 * c2 (percentage based)
		// e.g. 100 * 100 = 100. 50 * 50 = 25.
		const newCondition = (c1 / 100) * (c2 / 100) * 100;

		// 2. Rarity
		const probs = this.getMergeProbabilities(item1.rarity, item2.rarity);
		const rand = Math.random();
		let cumulative = 0;
		let newRarity: ItemRarity | 'EXOTIC' = item1.rarity;

		for (const p of probs) {
			cumulative += p.chance;
			if (rand < cumulative) {
				newRarity = p.rarity;
				break;
			}
		}

		// 3. Stats
		// "Smart Merge"
		// Bonuses gets boosted (1.6x)
		// Penalties gets reduced (0.4x)

		const newStats: Partial<TuningState> = {};
		const allKeys = new Set([
			...Object.keys(item1.stats),
			...Object.keys(item2.stats),
		]) as Set<keyof TuningState>;

		// Define which direction is "Good" for each stat
		// TRUE = Higher is Better
		// FALSE = Lower is Better
		const STAT_DIRECTION: Partial<Record<keyof TuningState, boolean>> = {
			maxTorque: true,
			redlineRPM: true,
			flywheelMass: false, // Lighter is better
			tireGrip: true,
			brakingForce: true,
			mass: false, // Lighter is better
			dragCoefficient: false, // Less drag is better
			turboIntensity: true,
			// Others assume neutral or positive-good
		};

		allKeys.forEach((key) => {
			const v1 = (item1.stats as any)[key] ?? 0;
			const v2 = (item2.stats as any)[key] ?? 0;

			// Check if we should merge this stat (numeric only)
			if (typeof v1 !== 'number' || typeof v2 !== 'number') {
				// Non-numeric (e.g. torqueCurve array), take from item1
				(newStats as any)[key] = v1;
				return;
			}

			// Determine if this specific value is a Penalty
			// It is a penalty if:
			// 1. HigherIsBetter AND Value < 0 (e.g. Redline -100)
			// 2. LowerIsBetter AND Value > 0 (e.g. Mass +10)
			const higherIsBetter = STAT_DIRECTION[key] ?? true; // Default to HigherIsBetter
			const isPenalty = higherIsBetter ? v1 < 0 : v1 > 0;

			let mergedVal = 0;
			if (isPenalty) {
				// Penalty Reduction: (v1 + v2) * 0.4
				// Example: -100 + -100 = -200. * 0.4 = -80 (Closer to 0)
				// Example: 10 + 10 = 20. * 0.4 = 8 (Closer to 0)
				mergedVal = (v1 + v2) * 0.4;
			} else {
				// Bonus Growth: (v1 + v2) * 0.8 (same as / 1.25)
				// Example: 100 + 100 = 200. * 0.8 = 160 (Growth)
				// Example: -10 + -10 = -20. * 0.8 = -16 (Growth in negative direction, e.g. weight reduction)
				mergedVal = (v1 + v2) * 0.8;
			}

			(newStats as any)[key] = mergedVal;
		});

		// 4. Value
		// "Average ... adding values together ... dividing by 1.25"
		// (V1 + V2) / 1.25
		const newValue = Math.floor((item1.value + item2.value) / 1.25);

		// Create New Item
		const newItem: InventoryItem = {
			...item1,
			instanceId: uuidv4(),
			condition: newCondition,
			rarity: newRarity as ItemRarity, // Type cast if Exotic isn't in ItemRarity
			stats: newStats,
			value: newValue,
		};

		return newItem;
	}
}
