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

import { GAME_ITEMS, ItemDefinition } from '../data/GameItems'; // Import the new DB

export class ItemGenerator {
	static generateItem(rarity: ItemRarity): InventoryItem {
		// 1. Filter GAME_ITEMS by the requested rarity
		let candidates = GAME_ITEMS.filter((item) => item.rarity === rarity);

		// Fallback: If no items of this rarity exist, try to find *any* item, or nearby rarity
		// For now, simplify: if empty, pick from ALL items (rare case if DB is populated)
		if (candidates.length === 0) {
			candidates = GAME_ITEMS;
			if (candidates.length === 0) {
				// Extreme fallback if DB is empty
				throw new Error('Game Items Database is empty!');
			}
		}

		// 2. Pick a random item from candidates
		const baseItem =
			candidates[Math.floor(Math.random() * candidates.length)];

		// 3. Generate Condition
		// Higher rarity -> likely better condition?
		// Or keep it random. Let's say better crates (which drop better rarity) imply better condition.
		let minCond = 50;
		if (rarity === 'COMMON') minCond = 20;
		if (rarity === 'LEGENDARY') minCond = 90;
		const condition = Math.floor(minCond + Math.random() * (100 - minCond));

		// 4. Stats Variance
		// We use the base stats from the definition.
		// We can apply condition scaling: poor condition = reduced effectiveness?
		// Or just small random variance.
		// Let's apply a small "Quality" variance regardless of condition,
		// and maybe condition affects value/reliability later.
		const variance = 0.9 + Math.random() * 0.2; // +/- 10%

		const finalStats: Partial<TuningState> = {};
		for (const key in baseItem.stats) {
			const k = key as keyof TuningState;
			const val = baseItem.stats[k];
			if (typeof val === 'number') {
				// Round to 1 decimal
				(finalStats as any)[k] = Math.round(val * variance * 10) / 10;
			} else {
				// Copy non-numeric exactly
				(finalStats as any)[k] = val;
			}
		}

		// 5. Calculate Resale Value
		// Base value * condition factor * variance
		const value = Math.floor(baseItem.value * (condition / 100) * variance);

		return {
			instanceId: uuidv4(),
			baseId: baseItem.id,
			name: baseItem.name,
			description: baseItem.description,
			type: baseItem.type,
			rarity: baseItem.rarity, // Keep the item's intrinsic rarity
			condition,
			stats: finalStats,
			value,
			icon: (baseItem as any).icon, // Pass icon if exists
			parentCategory: baseItem.parentCategory,
		};
	}

	static openCrate(crate: Crate): InventoryItem {
		const rand = Math.random();
		let cumulative = 0;
		let selectedRarity: ItemRarity = 'COMMON';

		const rates = crate.dropRates;
		// Determine target rarity based on crate probabilities
		if (rand < (cumulative += rates.COMMON)) selectedRarity = 'COMMON';
		else if (rand < (cumulative += rates.UNCOMMON))
			selectedRarity = 'UNCOMMON';
		else if (rand < (cumulative += rates.RARE)) selectedRarity = 'RARE';
		else if (rand < (cumulative += rates.EPIC)) selectedRarity = 'EPIC';
		else selectedRarity = 'LEGENDARY';

		// Now find items that MATCH this rarity.
		// Note: IF the crate says "Legendary" but we have no Legendary items, generateItem logic will fallback.
		// However, standard design is that the crate roll determines the tier, then we pick from that tier.
		return this.generateItem(selectedRarity);
	}

	static getRarityColor(rarity: ItemRarity): string {
		return RARITY_COLORS[rarity];
	}
}
