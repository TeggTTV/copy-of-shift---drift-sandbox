import {
	Crate,
	InventoryItem,
	ItemRarity,
	ModType,
	TuningState,
} from '../types';
import { v4 as uuidv4 } from 'uuid';
import { MOD_TREE } from '../constants'; // Access to MOD_TREE definitions for base stats

// Rarity Multipliers (for value and potential stat variance)
const RARITY_MULTIPLIERS: Record<ItemRarity, number> = {
	COMMON: 1.0,
	UNCOMMON: 1.2,
	RARE: 1.5,
	EPIC: 2.0,
	LEGENDARY: 3.0,
};

const RARITY_COLORS: Record<ItemRarity, string> = {
	COMMON: '#9ca3af', // Gray
	UNCOMMON: '#22c55e', // Green
	RARE: '#3b82f6', // Blue
	EPIC: '#a855f7', // Purple
	LEGENDARY: '#fbbf24', // Gold
};

export const CRATES: Crate[] = [
	{
		id: 'crate_basic',
		name: 'Junkyard Crate',
		description: 'Old parts, mostly rust.',
		price: 500,
		dropRates: {
			COMMON: 0.7,
			UNCOMMON: 0.25,
			RARE: 0.05,
			EPIC: 0.0,
			LEGENDARY: 0.0,
		},
	},
	{
		id: 'crate_standard',
		name: 'Standard Crate',
		description: 'Decent parts for street builds.',
		price: 2000,
		dropRates: {
			COMMON: 0.4,
			UNCOMMON: 0.4,
			RARE: 0.15,
			EPIC: 0.05,
			LEGENDARY: 0.0,
		},
	},
	{
		id: 'crate_premium',
		name: 'Premium Crate',
		description: 'High performance parts guaranteed.',
		price: 5000,
		dropRates: {
			COMMON: 0.1,
			UNCOMMON: 0.3,
			RARE: 0.4,
			EPIC: 0.15,
			LEGENDARY: 0.05,
		},
	},
	{
		id: 'crate_legendary',
		name: 'Black Market Crate',
		description: 'Illegal goods. High risk, high reward.',
		price: 20000,
		dropRates: {
			COMMON: 0.0,
			UNCOMMON: 0.1,
			RARE: 0.3,
			EPIC: 0.4,
			LEGENDARY: 0.2,
		},
	},
];

export class ItemGenerator {
	static generateItem(rarity: ItemRarity): InventoryItem {
		// 1. Pick a random base mod from MOD_TREE (that isn't a root node if possible, or filter appropriately)
		// For MVP, just pick any mod.
		const validMods = MOD_TREE.filter((m) => m.cost > 0); // Filter out dummy root nodes if any
		const baseMod = validMods[Math.floor(Math.random() * validMods.length)];

		// 2. Generate Condition (affected by rarity slightly? or purely random?)
		// Higher rarity -> likely better condition
		let minCond = 50;
		if (rarity === 'COMMON') minCond = 20;
		if (rarity === 'LEGENDARY') minCond = 90;
		const condition = Math.floor(minCond + Math.random() * (100 - minCond));

		// 3. Stats Variance
		// Apply rarity multiplier to stats?
		// Or assume baseMod stats are "Common" and scale up?
		// Let's assume stats in MOD_TREE are "Standard" (Uncommon?).
		// Let's modify them slightly based on rarity.
		const multiplier = RARITY_MULTIPLIERS[rarity];
		// Variance: +/- 15% random swing.
		// Also add a flat bonus based on rarity to ensure "Legendary" is always better than "Common" (unless very unlucky).
		const variance = 0.85 + Math.random() * 0.3;

		const finalStats: Partial<TuningState> = {};
		for (const key in baseMod.stats) {
			const k = key as keyof TuningState;
			const val = baseMod.stats[k];
			if (typeof val === 'number') {
				// Round to 1 decimal
				(finalStats as any)[k] =
					Math.round(val * multiplier * variance * 10) / 10;
			} else {
				// Arrays or strings (e.g. torqueCurve) - keep as is for now, too complex to scale
				(finalStats as any)[k] = val;
			}
		}

		// 4. Calculate Value
		// Base cost * rarity mult * condition factor
		const value = Math.floor(baseMod.cost * multiplier * (condition / 100));

		return {
			instanceId: uuidv4(),
			baseId: baseMod.id,
			name: baseMod.name, // Could add prefix like "Rusty", "Pristine", "Legendary"
			description: baseMod.description,
			type: baseMod.type as ModType,
			rarity,
			condition,
			stats: finalStats,
			value,
		};
	}

	static openCrate(crate: Crate): InventoryItem {
		const rand = Math.random();
		let cumulative = 0;
		let selectedRarity: ItemRarity = 'COMMON';

		const rates = crate.dropRates;
		if (rand < (cumulative += rates.COMMON)) selectedRarity = 'COMMON';
		else if (rand < (cumulative += rates.UNCOMMON))
			selectedRarity = 'UNCOMMON';
		else if (rand < (cumulative += rates.RARE)) selectedRarity = 'RARE';
		else if (rand < (cumulative += rates.EPIC)) selectedRarity = 'EPIC';
		else selectedRarity = 'LEGENDARY';

		return this.generateItem(selectedRarity);
	}

	static getRarityColor(rarity: ItemRarity): string {
		return RARITY_COLORS[rarity];
	}
}
