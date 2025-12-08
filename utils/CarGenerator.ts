import {
	JunkyardCar,
	ModNode,
	Rarity,
	TuningState,
	InventoryItem,
} from '../types';
import { MOD_TREE } from '../constants';
import { GAME_ITEMS } from '../data/GameItems';
import { ItemGenerator } from './ItemGenerator';

// Car Templates
const CAR_TEMPLATES = [
	// Daily Drivers (Tier 1)
	{
		name: 'Honda Civic EG Hatch',
		baseValue: 15000,
		tier: 1,
		stats: {
			maxTorque: 140,
			mass: 1040,
			dragCoefficient: 0.32,
			tireGrip: 1.0,
		},
	},
	{
		name: 'VW Golf GTI Mk4',
		baseValue: 18000,
		tier: 1,
		stats: {
			maxTorque: 210,
			mass: 1200,
			dragCoefficient: 0.34,
			tireGrip: 1.05,
		},
	},
	{
		name: 'Mazda Miata NA',
		baseValue: 16000,
		tier: 1,
		stats: {
			maxTorque: 130,
			mass: 990,
			dragCoefficient: 0.38,
			tireGrip: 1.0,
		},
	},
	{
		name: 'Acura Integra DC2',
		baseValue: 20000,
		tier: 1,
		stats: {
			maxTorque: 170,
			mass: 1100,
			dragCoefficient: 0.32,
			tireGrip: 1.05,
		},
	},
	{
		name: 'BMW E36 328i',
		baseValue: 22000,
		tier: 1,
		stats: {
			maxTorque: 280,
			mass: 1350,
			dragCoefficient: 0.3,
			tireGrip: 1.1,
		},
	},

	// Sports Cars (Tier 2)
	{
		name: 'Nissan 350Z',
		baseValue: 35000,
		tier: 2,
		stats: {
			maxTorque: 360,
			mass: 1450,
			dragCoefficient: 0.3,
			tireGrip: 1.2,
		},
	},
	{
		name: 'Subaru WRX STI',
		baseValue: 40000,
		tier: 2,
		stats: {
			maxTorque: 390,
			mass: 1500,
			dragCoefficient: 0.33,
			tireGrip: 1.3, // AWD advantage simulated
		},
	},
	{
		name: 'Ford Mustang GT',
		baseValue: 38000,
		tier: 2,
		stats: {
			maxTorque: 420,
			mass: 1600,
			dragCoefficient: 0.36,
			tireGrip: 1.15,
		},
	},
	{
		name: 'Honda S2000',
		baseValue: 42000,
		tier: 2,
		stats: {
			maxTorque: 220,
			mass: 1250,
			dragCoefficient: 0.34,
			tireGrip: 1.25,
		},
	},
	{
		name: 'BMW E46 M3',
		baseValue: 45000,
		tier: 2,
		stats: {
			maxTorque: 365,
			mass: 1549,
			dragCoefficient: 0.31,
			tireGrip: 1.25,
		},
	},

	// Legends (Tier 3)
	{
		name: 'Nissan R32 GTR',
		baseValue: 85000,
		tier: 3,
		stats: {
			maxTorque: 353,
			mass: 1430,
			dragCoefficient: 0.34,
			tireGrip: 1.4,
		},
	},
	{
		name: 'Toyota Supra MK4',
		baseValue: 90000,
		tier: 3,
		stats: {
			maxTorque: 431,
			mass: 1510,
			dragCoefficient: 0.32,
			tireGrip: 1.3,
		},
	},
	{
		name: 'Honda NSX',
		baseValue: 88000,
		tier: 3,
		stats: {
			maxTorque: 294,
			mass: 1370,
			dragCoefficient: 0.3,
			tireGrip: 1.35,
		},
	},
	{
		name: 'Mazda RX-7 FD',
		baseValue: 82000,
		tier: 3,
		stats: {
			maxTorque: 294,
			mass: 1260,
			dragCoefficient: 0.29,
			tireGrip: 1.3,
		},
	},
	// --- NEW CARS ---
	// Tier 1
	{
		name: 'Toyota AE86 Trueno',
		baseValue: 12000,
		tier: 1,
		stats: {
			maxTorque: 110,
			mass: 950,
			dragCoefficient: 0.36,
			tireGrip: 0.95,
		},
	},
	{
		name: 'Nissan Silvia S13',
		baseValue: 14000,
		tier: 1,
		stats: {
			maxTorque: 160,
			mass: 1150,
			dragCoefficient: 0.34,
			tireGrip: 1.0,
		},
	},
	{
		name: 'Ford Focus RS',
		baseValue: 25000,
		tier: 1,
		stats: {
			maxTorque: 320,
			mass: 1400,
			dragCoefficient: 0.35,
			tireGrip: 1.1,
		},
	},
	{
		name: 'Hyundai Veloster N',
		baseValue: 22000,
		tier: 1,
		stats: {
			maxTorque: 260,
			mass: 1350,
			dragCoefficient: 0.33,
			tireGrip: 1.05,
		},
	},
	// Tier 2
	{
		name: 'Nissan Silvia S15',
		baseValue: 32000,
		tier: 2,
		stats: {
			maxTorque: 274,
			mass: 1240,
			dragCoefficient: 0.31,
			tireGrip: 1.15,
		},
	},
	{
		name: 'Mitsubishi Lancer Evo IX',
		baseValue: 45000,
		tier: 2,
		stats: {
			maxTorque: 289,
			mass: 1400,
			dragCoefficient: 0.36,
			tireGrip: 1.35, // AWD
		},
	},
	{
		name: 'BMW E92 M3',
		baseValue: 48000,
		tier: 2,
		stats: {
			maxTorque: 295,
			mass: 1600,
			dragCoefficient: 0.31,
			tireGrip: 1.25,
		},
	},
	{
		name: 'Chevrolet Camaro SS',
		baseValue: 42000,
		tier: 2,
		stats: {
			maxTorque: 400,
			mass: 1700,
			dragCoefficient: 0.37,
			tireGrip: 1.2,
		},
	},
	{
		name: 'Dodge Charger RT',
		baseValue: 38000,
		tier: 2,
		stats: {
			maxTorque: 390,
			mass: 1900,
			dragCoefficient: 0.38,
			tireGrip: 1.1,
		},
	},
	{
		name: 'VW Golf R',
		baseValue: 40000,
		tier: 2,
		stats: {
			maxTorque: 280,
			mass: 1450,
			dragCoefficient: 0.32,
			tireGrip: 1.3, // AWD
		},
	},
	// Tier 3
	{
		name: 'Nissan R34 GT-R',
		baseValue: 120000,
		tier: 3,
		stats: {
			maxTorque: 293, // "Gentleman's Agreement" (actually more)
			mass: 1560,
			dragCoefficient: 0.34,
			tireGrip: 1.45,
		},
	},
	{
		name: 'Porsche 911 Turbo (996)',
		baseValue: 95000,
		tier: 3,
		stats: {
			maxTorque: 413,
			mass: 1540,
			dragCoefficient: 0.31,
			tireGrip: 1.5,
		},
	},
	{
		name: 'Chevrolet Corvette C6 Z06',
		baseValue: 85000,
		tier: 3,
		stats: {
			maxTorque: 470,
			mass: 1420,
			dragCoefficient: 0.34,
			tireGrip: 1.4,
		},
	},
	{
		name: 'Mercedes C63 AMG',
		baseValue: 75000,
		tier: 3,
		stats: {
			maxTorque: 443,
			mass: 1730,
			dragCoefficient: 0.32,
			tireGrip: 1.3,
		},
	},
	{
		name: 'Dodge Viper GTS',
		baseValue: 92000,
		tier: 3,
		stats: {
			maxTorque: 490,
			mass: 1530,
			dragCoefficient: 0.35,
			tireGrip: 1.4,
		},
	},
	{
		name: 'Honda CRX Si',
		baseValue: 14000,
		tier: 1,
		stats: {
			maxTorque: 130,
			mass: 910,
			dragCoefficient: 0.3,
			tireGrip: 0.95,
		},
	},
	{
		name: 'Mitsubishi Eclipse GSX',
		baseValue: 19000,
		tier: 1,
		stats: {
			maxTorque: 290,
			mass: 1450,
			dragCoefficient: 0.33,
			tireGrip: 1.15, // AWD
		},
	},
	{
		name: 'Toyota Celica GT-Four',
		baseValue: 21000,
		tier: 1,
		stats: {
			maxTorque: 300,
			mass: 1390,
			dragCoefficient: 0.34,
			tireGrip: 1.15, // AWD
		},
	},
	{
		name: 'Chevrolet Cobalt SS',
		baseValue: 16000,
		tier: 1,
		stats: {
			maxTorque: 260,
			mass: 1300,
			dragCoefficient: 0.35,
			tireGrip: 1.05,
		},
	},
	{
		name: 'Dodge Neon SRT-4',
		baseValue: 17000,
		tier: 1,
		stats: {
			maxTorque: 330,
			mass: 1350,
			dragCoefficient: 0.36,
			tireGrip: 1.0,
		},
	},
	// Tier 2
	{
		name: 'Mazda RX-8 R3',
		baseValue: 28000,
		tier: 2,
		stats: {
			maxTorque: 210,
			mass: 1300,
			dragCoefficient: 0.3,
			tireGrip: 1.2,
		},
	},
	{
		name: 'Nissan 300ZX TT',
		baseValue: 36000,
		tier: 2,
		stats: {
			maxTorque: 380,
			mass: 1550,
			dragCoefficient: 0.32,
			tireGrip: 1.25,
		},
	},
	{
		name: 'Audi S4 B5',
		baseValue: 34000,
		tier: 2,
		stats: {
			maxTorque: 400,
			mass: 1600,
			dragCoefficient: 0.31,
			tireGrip: 1.3, // AWD
		},
	},
	{
		name: 'Pontiac GTO',
		baseValue: 35000,
		tier: 2,
		stats: {
			maxTorque: 500,
			mass: 1700,
			dragCoefficient: 0.34,
			tireGrip: 1.15,
		},
	},
	{
		name: 'Hyundai Genesis Coupe 3.8',
		baseValue: 26000,
		tier: 2,
		stats: {
			maxTorque: 350,
			mass: 1500,
			dragCoefficient: 0.33,
			tireGrip: 1.1,
		},
	},
	// Tier 3
	{
		name: 'Ford GT (05)',
		baseValue: 250000,
		tier: 3,
		stats: {
			maxTorque: 678,
			mass: 1520,
			dragCoefficient: 0.35,
			tireGrip: 1.5,
		},
	},
	{
		name: 'Nissan R35 GT-R (09)',
		baseValue: 110000,
		tier: 3,
		stats: {
			maxTorque: 588,
			mass: 1740,
			dragCoefficient: 0.27,
			tireGrip: 1.6, // AWD Tech
		},
	},
	{
		name: 'Dodge Viper ACR',
		baseValue: 130000,
		tier: 3,
		stats: {
			maxTorque: 760,
			mass: 1500,
			dragCoefficient: 0.38, // High downforce
			tireGrip: 1.7, // Slicks equivalent
		},
	},
	{
		name: 'Porsche 911 GT3 RS',
		baseValue: 180000,
		tier: 3,
		stats: {
			maxTorque: 460,
			mass: 1370,
			dragCoefficient: 0.33,
			tireGrip: 1.65,
		},
	},
	{
		name: 'Lamborghini Gallardo LP560',
		baseValue: 140000,
		tier: 3,
		stats: {
			maxTorque: 540,
			mass: 1500,
			dragCoefficient: 0.3,
			tireGrip: 1.55, // AWD
		},
	},
	// --- PHASE 6 EXPANSION ---
	// JDM Classics
	{
		name: 'Mazda RX-7 FC',
		baseValue: 18000,
		tier: 1,
		stats: {
			maxTorque: 200,
			mass: 1200,
			dragCoefficient: 0.31,
			tireGrip: 1.05,
		},
	},
	{
		name: 'Datsun 240Z',
		baseValue: 25000,
		tier: 1,
		stats: {
			maxTorque: 150,
			mass: 1050,
			dragCoefficient: 0.35,
			tireGrip: 1.0,
		},
	},
	{
		name: 'Nissan 180SX',
		baseValue: 15000,
		tier: 1,
		stats: {
			maxTorque: 170,
			mass: 1200,
			dragCoefficient: 0.33,
			tireGrip: 1.0,
		},
	},
	{
		name: 'Honda Prelude SH',
		baseValue: 12000,
		tier: 1,
		stats: {
			maxTorque: 156,
			mass: 1300,
			dragCoefficient: 0.32,
			tireGrip: 1.0,
		},
	},
	{
		name: 'Mitsubishi Evo X',
		baseValue: 35000,
		tier: 2,
		stats: {
			maxTorque: 300,
			mass: 1550,
			dragCoefficient: 0.34,
			tireGrip: 1.3, // AWD
		},
	},
	{
		name: 'Mitsubishi 3000GT VR4',
		baseValue: 28000,
		tier: 2,
		stats: {
			maxTorque: 315,
			mass: 1700,
			dragCoefficient: 0.33,
			tireGrip: 1.3, // AWD
		},
	},
	{
		name: 'Subaru 22B',
		baseValue: 80000,
		tier: 3, // Rare legend
		stats: {
			maxTorque: 270,
			mass: 1270,
			dragCoefficient: 0.35,
			tireGrip: 1.4,
		},
	},

	// Muscle Legends
	{
		name: 'Ford Foxbody Mustang',
		baseValue: 10000,
		tier: 1,
		stats: {
			maxTorque: 280,
			mass: 1400,
			dragCoefficient: 0.38,
			tireGrip: 0.95,
		},
	},
	{
		name: 'Chevrolet Camaro IROC-Z',
		baseValue: 12000,
		tier: 1,
		stats: {
			maxTorque: 290,
			mass: 1500,
			dragCoefficient: 0.37,
			tireGrip: 0.95,
		},
	},
	{
		name: 'Chevrolet C5 Corvette',
		baseValue: 25000,
		tier: 2,
		stats: {
			maxTorque: 350,
			mass: 1450,
			dragCoefficient: 0.29,
			tireGrip: 1.2,
		},
	},
	{
		name: 'Chevrolet Chevelle SS 454',
		baseValue: 45000,
		tier: 2,
		stats: {
			maxTorque: 500,
			mass: 1800,
			dragCoefficient: 0.45,
			tireGrip: 1.1,
		},
	},
	{
		name: "Dodge '69 Charger",
		baseValue: 55000,
		tier: 2,
		stats: {
			maxTorque: 490,
			mass: 1750,
			dragCoefficient: 0.44,
			tireGrip: 1.05,
		},
	},
	{
		name: 'Pontiac Trans Am',
		baseValue: 20000,
		tier: 2,
		stats: {
			maxTorque: 320,
			mass: 1600,
			dragCoefficient: 0.34,
			tireGrip: 1.1,
		},
	},
	{
		name: 'Buick GNX',
		baseValue: 60000,
		tier: 3,
		stats: {
			maxTorque: 360,
			mass: 1500,
			dragCoefficient: 0.36,
			tireGrip: 1.2,
		},
	},
	{
		name: 'Dodge Hellcat',
		baseValue: 70000,
		tier: 3,
		stats: {
			maxTorque: 650,
			mass: 2000,
			dragCoefficient: 0.38,
			tireGrip: 1.3,
		},
	},
	{
		name: 'Shelby Cobra',
		baseValue: 150000,
		tier: 3,
		stats: {
			maxTorque: 450,
			mass: 1000, // Very light
			dragCoefficient: 0.45, // Brick
			tireGrip: 1.1, // Scary
		},
	},

	// Euro Icons
	{
		name: 'VW Golf GTI Mk1',
		baseValue: 15000,
		tier: 1,
		stats: {
			maxTorque: 100,
			mass: 840,
			dragCoefficient: 0.38,
			tireGrip: 0.95,
		},
	},
	{
		name: 'Mercedes 190E',
		baseValue: 18000,
		tier: 1,
		stats: {
			maxTorque: 170,
			mass: 1300,
			dragCoefficient: 0.33,
			tireGrip: 1.05,
		},
	},
	{
		name: 'BMW E30 M3',
		baseValue: 65000,
		tier: 2,
		stats: {
			maxTorque: 170,
			mass: 1200,
			dragCoefficient: 0.33,
			tireGrip: 1.2,
		},
	},
	{
		name: 'Audi RS2',
		baseValue: 50000,
		tier: 2,
		stats: {
			maxTorque: 300,
			mass: 1600,
			dragCoefficient: 0.35,
			tireGrip: 1.3, // AWD
		},
	},
	{
		name: 'Lancia Delta',
		baseValue: 55000,
		tier: 2,
		stats: {
			maxTorque: 220,
			mass: 1300,
			dragCoefficient: 0.38,
			tireGrip: 1.35, // AWD
		},
	},
	{
		name: 'BMW M5 E39',
		baseValue: 35000,
		tier: 2,
		stats: {
			maxTorque: 369,
			mass: 1795,
			dragCoefficient: 0.31,
			tireGrip: 1.25,
		},
	},
	{
		name: 'Porsche 930 Turbo',
		baseValue: 110000,
		tier: 3,
		stats: {
			maxTorque: 317,
			mass: 1300,
			dragCoefficient: 0.36,
			tireGrip: 1.25, // Widowmaker
		},
	},
	{
		name: 'Lotus Esprit V8',
		baseValue: 60000,
		tier: 3,
		stats: {
			maxTorque: 295,
			mass: 1380,
			dragCoefficient: 0.3,
			tireGrip: 1.35,
		},
	},

	// Supercars / Exotics
	{
		name: 'Ferrari F40',
		baseValue: 1200000,
		tier: 3, // Exotic Tier
		stats: {
			maxTorque: 425,
			mass: 1100,
			dragCoefficient: 0.34,
			tireGrip: 1.6,
		},
	},
	{
		name: 'Lamborghini Countach LP5000',
		baseValue: 600000,
		tier: 3,
		stats: {
			maxTorque: 369,
			mass: 1490,
			dragCoefficient: 0.42,
			tireGrip: 1.5,
		},
	},
	{
		name: 'McLaren F1',
		baseValue: 15000000,
		tier: 3,
		stats: {
			maxTorque: 480,
			mass: 1138,
			dragCoefficient: 0.32,
			tireGrip: 1.7,
		},
	},
	{
		name: 'Porsche Carrera GT',
		baseValue: 900000,
		tier: 3,
		stats: {
			maxTorque: 435,
			mass: 1380,
			dragCoefficient: 0.39,
			tireGrip: 1.65,
		},
	},
	{
		name: 'Ferrari Enzo',
		baseValue: 2500000,
		tier: 3,
		stats: {
			maxTorque: 485,
			mass: 1255,
			dragCoefficient: 0.36,
			tireGrip: 1.7,
		},
	},
	{
		name: 'Pagani Zonda C12',
		baseValue: 1800000,
		tier: 3,
		stats: {
			maxTorque: 420,
			mass: 1250,
			dragCoefficient: 0.37,
			tireGrip: 1.6,
		},
	},
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

	// Generates a multiplier based on a power curve
	// Higher values are exponentially rarer
	static generateWeightedMultiplier(): number {
		// x^12 distribution (Extremely steep curve)
		// rand 0.1 -> 1e-12
		// We want most values near 1.0, rare values near 2.0
		// Let's use: 1.0 + (Math.random() ^ 12) * 0.8
		const rand = Math.random();
		// Bias towards 0
		const bias = Math.pow(rand, 12); // x^12 (Much steeper curve for rarity)
		// Map 0..1 to 0..0.8 (max 1.8x multiplier)
		return 1.0 + bias * 0.8;
	}

	static getRarityFromMultiplier(multiplier: number): Rarity {
		if (multiplier > 1.5) return 'EXOTIC';
		if (multiplier > 1.35) return 'LEGENDARY';
		if (multiplier > 1.2) return 'EPIC';
		if (multiplier > 1.1) return 'RARE';
		if (multiplier > 1.05) return 'UNCOMMON';
		return 'COMMON';
	}

	static generateDealershipCar(idPrefix: string): JunkyardCar {
		// Weighted random selection for Tier
		const rand = Math.random();
		let tier = 1;
		if (rand > 0.95) tier = 3; // 5% Legend
		else if (rand > 0.65) tier = 2; // 30% Sports

		const template = this.getRandomTemplate(tier);

		// Determine Condition (Dealership is usually good)
		// 0-100 Scale
		const condition = Math.floor(70 + Math.random() * 30); // 70% - 100%

		// New System: Installed Items
		// For now, Dealership cars are STOCK (no installed upgrades).
		const items: InventoryItem[] = [];

		// Calculate Price
		// Base * Condition + 10% Dealer Markup
		const price = Math.floor(template.baseValue * (condition / 100) * 1.1);

		return {
			id: `${idPrefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
			name: template.name,
			date: Date.now(),
			ownedMods: [],
			disabledMods: [],
			modSettings: {},
			manualTuning: {},
			condition: condition,
			price: price,
			originalPrice: template.baseValue,
			rarity: 'COMMON', // Dealership cars are standard
			rarityMultiplier: 1.0,
			installedItems: items,
		};
	}

	static generateJunkyardCar(idPrefix: string): JunkyardCar {
		// 30% chance to find a "Clean Title" car (Dealership quality)
		if (Math.random() < 0.3) {
			const car = this.generateDealershipCar(idPrefix);
			return car;
		}

		// Junkyard has a mix, but mostly lower tiers or wrecked high tiers
		const rand = Math.random();
		let tier = 1;
		if (rand > 0.9) tier = 3; // 10% chance for a wrecked Legend
		else if (rand > 0.7) tier = 2; // 20% chance for Sports

		const template = this.getRandomTemplate(tier);

		// Condition is bad (0-100 Scale)
		const condition = Math.floor(5 + Math.random() * 35); // 5% - 40%

		// Generate Random Parts (Junk)
		const items: InventoryItem[] = [];
		// Simple heuristic: scan GAME_ITEMS for suitable parts
		const suitableItems = GAME_ITEMS.filter(
			(i) =>
				(i.tier ?? 1) <= tier &&
				(i.rarity === 'COMMON' || i.rarity === 'UNCOMMON')
		);
		suitableItems.forEach((def) => {
			// Limit total items to prevent clutter? 15% chance per item
			if (Math.random() < 0.15) {
				const item = ItemGenerator.generateItem(def);
				item.condition = Math.floor(Math.random() * 40); // 0-40% condition
				items.push(item);
			}
		});

		// Calculate Price (Cheap!)
		let modValue = 0;
		items.forEach((item) => {
			modValue += item.value * 0.1; // Scrap value
		});

		const price = Math.floor(
			template.baseValue * (condition / 100) * 0.8 + modValue
		);

		// Generate weighted multiplier for stats
		const multiplier = this.generateWeightedMultiplier();
		const rarity = this.getRarityFromMultiplier(multiplier);

		// Generate unique base stats
		const baseStats = this.generateUniqueStats(template, 0.1);

		// Apply weighted multiplier to base stats
		if (baseStats.maxTorque) baseStats.maxTorque *= multiplier;
		if (baseStats.tireGrip) baseStats.tireGrip *= multiplier;
		// Slight mass reduction for high rolls
		if (baseStats.mass && multiplier > 1.1)
			baseStats.mass *= 1 - (multiplier - 1) * 0.2;

		return {
			id: `${idPrefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
			name: template.name,
			date: Date.now(),
			ownedMods: [],
			disabledMods: [],
			modSettings: {},
			manualTuning: baseStats,
			condition: condition,
			price: price,
			originalPrice: template.baseValue,
			rarity: rarity,
			rarityMultiplier: multiplier,
			installedItems: items,
		};
	}

	private static getRandomTemplate(tier: number) {
		const pool = CAR_TEMPLATES.filter((t) => t.tier === tier);
		return pool[Math.floor(Math.random() * pool.length)];
	}

	private static generateUniqueStats(
		template: any,
		variance: number = 0.05
	): Partial<TuningState> {
		const stats: Partial<TuningState> = { ...template.stats };

		// Apply variance to numeric stats
		if (stats.maxTorque)
			stats.maxTorque *= 1 + (Math.random() * variance * 2 - variance);
		if (stats.mass)
			stats.mass *= 1 + (Math.random() * variance * 2 - variance);
		if (stats.dragCoefficient)
			stats.dragCoefficient *=
				1 + (Math.random() * variance * 2 - variance);
		if (stats.tireGrip)
			stats.tireGrip *= 1 + (Math.random() * variance * 2 - variance);

		// Factory Freak Chance (5%)
		if (Math.random() < 0.05) {
			if (stats.maxTorque) stats.maxTorque *= 1.15; // +15% Torque
			if (stats.mass) stats.mass *= 0.95; // -5% Weight
		}

		return stats;
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
