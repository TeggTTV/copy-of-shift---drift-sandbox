import { JunkyardCar, ModNode, Rarity, TuningState } from '../types';
import { MOD_TREE } from '../constants';

// Car Templates
const CAR_TEMPLATES = [
	// Daily Drivers (Tier 1)
	{ name: 'Civic EG Hatch', baseValue: 15000, tier: 1 },
	{ name: 'Golf GTI Mk4', baseValue: 18000, tier: 1 },
	{ name: 'Miata NA', baseValue: 16000, tier: 1 },
	{ name: 'Integra DC2', baseValue: 20000, tier: 1 },
	{ name: 'E36 328i', baseValue: 22000, tier: 1 },

	// Sports Cars (Tier 2)
	{ name: '350Z', baseValue: 35000, tier: 2 },
	{ name: 'WRX STI', baseValue: 40000, tier: 2 },
	{ name: 'Mustang GT', baseValue: 38000, tier: 2 },
	{ name: 'S2000', baseValue: 42000, tier: 2 },
	{ name: 'E46 M3', baseValue: 45000, tier: 2 },

	// Legends (Tier 3)
	{ name: 'R32 GTR', baseValue: 85000, tier: 3 },
	{ name: 'Supra MK4', baseValue: 90000, tier: 3 },
	{ name: 'NSX', baseValue: 88000, tier: 3 },
	{ name: 'RX-7 FD', baseValue: 82000, tier: 3 },
];

type Archetype = 'STOCK' | 'STREET' | 'DRAG' | 'RACE' | 'JUNK';

export class CarGenerator {
	static calculateValue(car: {
		originalPrice?: number;
		condition?: number;
		ownedMods: string[];
		name: string;
	}): number {
		// 1. Determine Base Value
		let baseValue = car.originalPrice;
		if (!baseValue) {
			// Fallback for old saves: try to find template by name
			const template = CAR_TEMPLATES.find((t) => t.name === car.name);
			baseValue = template ? template.baseValue : 10000; // Default fallback
		}

		// 2. Calculate Mod Value
		let modValue = 0;
		car.ownedMods.forEach((modId) => {
			const mod = MOD_TREE.find((m) => m.id === modId);
			if (mod) modValue += mod.cost;
		});

		// 3. Apply Depreciation Logic (Resale Value)
		// Base value scales with condition. Mods retain ~50% value.
		const condition = car.condition !== undefined ? car.condition : 1;

		return Math.floor(baseValue * condition * 0.8 + modValue * 0.5);
	}

	static generateRarity(): Rarity {
		const rand = Math.random();
		if (rand > 0.999) return 'EXOTIC'; // 0.1%
		if (rand > 0.99) return 'LEGENDARY'; // 1%
		if (rand > 0.95) return 'EPIC'; // 4%
		if (rand > 0.8) return 'RARE'; // 15%
		if (rand > 0.5) return 'UNCOMMON'; // 30%
		return 'COMMON'; // 50%
	}

	static applyRarityBonuses(
		tuning: Partial<TuningState>,
		rarity: Rarity
	): { tuning: Partial<TuningState>; multiplier: number } {
		let multiplier = 1.0;
		switch (rarity) {
			case 'UNCOMMON':
				multiplier = 1.05;
				break;
			case 'RARE':
				multiplier = 1.1;
				break;
			case 'EPIC':
				multiplier = 1.2;
				break;
			case 'LEGENDARY':
				multiplier = 1.35;
				break;
			case 'EXOTIC':
				multiplier = 1.5;
				break;
			default:
				multiplier = 1.0;
		}

		// Apply bonuses to base stats if they exist in the partial tuning
		// Note: Since we don't have the full tuning object here, we just return the multiplier
		// The actual application happens when the car is loaded/built.
		// BUT, for the Junkyard display, we might want to show boosted stats?
		// Actually, let's just store the multiplier and apply it in the CarBuilder or when loading.
		// For now, let's just return the multiplier.

		return { tuning, multiplier };
	}

	static generateDealershipCar(idPrefix: string): JunkyardCar {
		// Weighted random selection for Tier
		const rand = Math.random();
		let tier = 1;
		if (rand > 0.95) tier = 3; // 5% Legend
		else if (rand > 0.65) tier = 2; // 30% Sports

		const template = this.getRandomTemplate(tier);

		// Determine Condition (Dealership is usually good)
		// Tier 3 cars might be older/restored, so slightly more variance?
		// Actually dealership cars should be decent.
		const condition = 0.7 + Math.random() * 0.3; // 70% - 100%

		// Determine Archetype
		let archetype: Archetype = 'STOCK';
		if (Math.random() > 0.7) {
			archetype = Math.random() > 0.5 ? 'STREET' : 'RACE';
		}
		// Legends are often stock or lightly modified
		if (tier === 3 && Math.random() > 0.5) archetype = 'STOCK';

		const mods = this.generateMods(archetype, tier);

		// Calculate Price
		// Base * Condition + Mod Value * 1.2 (Dealer Markup)
		let modValue = 0;
		mods.forEach((modId) => {
			const mod = MOD_TREE.find((m) => m.id === modId);
			if (mod) modValue += mod.cost;
		});

		const price = Math.floor(
			template.baseValue * condition + modValue * 1.1
		);

		return {
			id: `${idPrefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
			name: template.name,
			date: Date.now(),
			ownedMods: mods,
			disabledMods: [],
			modSettings: {},
			manualTuning: {},
			condition: condition,
			price: price,
			originalPrice: template.baseValue,
			rarity: 'COMMON', // Dealership cars are standard
			rarityMultiplier: 1.0,
		};
	}

	static generateJunkyardCar(idPrefix: string): JunkyardCar {
		// 30% chance to find a "Clean Title" car (Dealership quality)
		if (Math.random() < 0.3) {
			const car = this.generateDealershipCar(idPrefix);
			// Maybe slightly cheaper than dealer? Or same price?
			// Let's keep it same price for now, representing a "good find"
			return car;
		}

		// Junkyard has a mix, but mostly lower tiers or wrecked high tiers
		const rand = Math.random();
		let tier = 1;
		if (rand > 0.9) tier = 3; // 10% chance for a wrecked Legend
		else if (rand > 0.7) tier = 2; // 20% chance for Sports

		const template = this.getRandomTemplate(tier);

		// Condition is bad
		const condition = 0.05 + Math.random() * 0.35; // 5% - 40%

		// Archetype is usually JUNK (random parts, missing parts)
		const mods = this.generateMods('JUNK', tier);

		// Calculate Price (Cheap!)
		let modValue = 0;
		mods.forEach((modId) => {
			const mod = MOD_TREE.find((m) => m.id === modId);
			if (mod) modValue += mod.cost * 0.2; // Scrap value for mods
		});

		const price = Math.floor(
			template.baseValue * condition * 0.8 + modValue
		);

		const rarity = this.generateRarity();
		const { multiplier } = this.applyRarityBonuses({}, rarity);

		// Adjust price based on rarity?
		// Rare cars should cost more even if junk
		const rarityPriceMult = multiplier * multiplier; // Quadratic price increase for rarity

		return {
			id: `${idPrefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
			name: template.name,
			date: Date.now(),
			ownedMods: mods,
			disabledMods: [],
			modSettings: {},
			manualTuning: {},
			condition: condition,
			price: price,
			originalPrice: template.baseValue,
			rarity: rarity,
			rarityMultiplier: multiplier,
		};
	}

	private static getRandomTemplate(tier: number) {
		const pool = CAR_TEMPLATES.filter((t) => t.tier === tier);
		return pool[Math.floor(Math.random() * pool.length)];
	}

	private static generateMods(archetype: Archetype, tier: number): string[] {
		const selectedMods: string[] = [];

		if (archetype === 'STOCK') return [];

		// Helper to try adding a mod
		const tryAddMod = (mod: ModNode) => {
			// Check if we already have it
			if (selectedMods.includes(mod.id)) return;

			// Check conflicts
			const hasConflict = mod.conflictsWith.some((cId) =>
				selectedMods.includes(cId)
			);
			if (hasConflict) return;

			// Check dependencies (Parent)
			if (mod.parentId) {
				// If parent is not owned, try to add it first
				if (!selectedMods.includes(mod.parentId)) {
					const parent = MOD_TREE.find((m) => m.id === mod.parentId);
					if (parent) {
						tryAddMod(parent);
						// If parent still not added (e.g. conflict), can't add this
						if (!selectedMods.includes(mod.parentId)) return;
					} else {
						return; // Parent not found
					}
				}
			}

			selectedMods.push(mod.id);
		};

		// Filter mods by type/suitability
		// This is a simplified logic. A more robust one would tag mods with "Street", "Race", etc.
		// For now, we'll use some heuristics based on cost/name/type.

		const potentialMods = MOD_TREE.filter((mod) => {
			if (archetype === 'JUNK') return Math.random() > 0.8; // Random scattering

			// Exclude Exotic parts for standard generation unless very lucky
			if (mod.rarity === 'EXOTIC' && Math.random() > 0.05) return false;
			if (mod.rarity === 'LEGENDARY' && Math.random() > 0.1) return false;

			return true;
		});

		// Sort by cost ascending to ensure we build up from basics?
		// Or shuffle to get variety.
		potentialMods.sort(() => Math.random() - 0.5);

		let budget = 0;
		if (archetype === 'STREET') budget = 5000 + tier * 2000;
		if (archetype === 'RACE') budget = 15000 + tier * 5000;
		if (archetype === 'DRAG') budget = 20000 + tier * 5000;

		let currentCost = 0;

		for (const mod of potentialMods) {
			if (currentCost + mod.cost > budget) continue;

			// Archetype specific bias
			let interest = 0.5;
			if (archetype === 'DRAG') {
				if (mod.type === 'TIRES' && mod.name.includes('Slicks'))
					interest = 1.0;
				if (mod.type === 'TURBO') interest = 0.9;
				if (mod.type === 'ENGINE') interest = 0.8;
			}
			if (archetype === 'STREET') {
				if (mod.type === 'VISUAL') interest = 0.8;
				if (mod.type === 'SUSPENSION') interest = 0.7;
				if (mod.type === 'ENGINE' && mod.name.includes('Muffler'))
					interest = 0.8;
			}

			if (Math.random() < interest) {
				tryAddMod(mod);
				if (selectedMods.includes(mod.id)) {
					currentCost += mod.cost;
				}
			}
		}

		return selectedMods;
	}
}
