import React, { useState, useEffect } from 'react';
import { Mission, TuningState, SavedTune, DailyChallenge } from '../types';
import { MISSIONS } from '../constants';
import { generateDailyChallenges } from '../utils/dailyChallengeUtils';

export const useGamePersistence = (
	money: number,
	setMoney: (m: number) => void,
	ownedMods: string[],
	setOwnedMods: (mods: string[]) => void,
	disabledMods: string[],
	setDisabledMods: (mods: string[]) => void,
	modSettings: Record<string, Record<string, number>>,
	setModSettings: (settings: Record<string, Record<string, number>>) => void,
	missions: Mission[],
	setMissions: (missions: Mission[]) => void,
	dailyChallenges: DailyChallenge[],
	setDailyChallenges: (challenges: DailyChallenge[]) => void,
	playerTuning: TuningState,
	setPlayerTuning: React.Dispatch<React.SetStateAction<TuningState>>,
	dynoHistory: { rpm: number; torque: number; hp: number }[],
	setDynoHistory: (
		history: { rpm: number; torque: number; hp: number }[]
	) => void,
	previousDynoHistory: { rpm: number; torque: number; hp: number }[],
	setPreviousDynoHistory: (
		history: { rpm: number; torque: number; hp: number }[]
	) => void,
	garage: SavedTune[],
	setGarage: (garage: SavedTune[]) => void,
	currentCarIndex: number,
	setCurrentCarIndex: (index: number) => void,
	undergroundLevel: number,
	setUndergroundLevel: (level: number) => void,
	xp: number,
	setXp: (xp: number) => void,
	level: number,
	setLevel: (level: number) => void,
	inventory: any[], // using any[] to avoid circular dependency if InventoryItem is not exported from types
	setInventory: (items: any[]) => void
) => {
	const [loaded, setLoaded] = useState(false);

	// Load on mount
	useEffect(() => {
		const load = () => {
			try {
				const savedMoney = localStorage.getItem('shift_drift_money');
				if (savedMoney) setMoney(parseInt(savedMoney));

				const savedMissions = localStorage.getItem(
					'shift_drift_missions'
				);
				if (savedMissions) {
					const parsedSavedMissions: Mission[] =
						JSON.parse(savedMissions);
					// Merge saved progress with current mission definitions
					const mergedMissions = MISSIONS.map((m) => {
						const saved = parsedSavedMissions.find(
							(sm) => sm.id === m.id
						);
						if (saved) {
							return {
								...m,
								bestTime: saved.bestTime,
								bestGhost: saved.bestGhost,
							};
						}
						return m;
					});
					setMissions(mergedMissions);
				}

				const savedDynoHistory = localStorage.getItem(
					'shift_drift_dynoHistory'
				);
				if (savedDynoHistory)
					setDynoHistory(JSON.parse(savedDynoHistory));

				const savedPreviousDynoHistory = localStorage.getItem(
					'shift_drift_previousDynoHistory'
				);
				if (savedPreviousDynoHistory)
					setPreviousDynoHistory(
						JSON.parse(savedPreviousDynoHistory)
					);

				// Underground Level
				const savedUndergroundLevel = localStorage.getItem(
					'shift_drift_undergroundLevel'
				);
				if (savedUndergroundLevel) {
					setUndergroundLevel(parseInt(savedUndergroundLevel));
				}

				// XP & Level
				const savedXp = localStorage.getItem('shift_drift_xp');
				if (savedXp) setXp(parseInt(savedXp));

				const savedLevel = localStorage.getItem('shift_drift_level');
				if (savedLevel) setLevel(parseInt(savedLevel));

				// Inventory
				const savedInventory = localStorage.getItem(
					'shift_drift_inventory'
				);
				if (savedInventory) {
					setInventory(JSON.parse(savedInventory));
				}

				// Daily Challenges
				const savedDaily = localStorage.getItem(
					'shift_drift_dailyChallenges'
				);
				if (savedDaily) {
					const parsedDaily: DailyChallenge[] =
						JSON.parse(savedDaily);
					// Check if expired (all expire at same time)
					if (
						parsedDaily.length > 0 &&
						parsedDaily[0].expiresAt > Date.now()
					) {
						setDailyChallenges(parsedDaily);
					} else {
						// Expired, generate new ones
						// console.log(
						// 	'Daily challenges expired, generating new ones'
						// );
						const newChallenges = generateDailyChallenges();
						setDailyChallenges(newChallenges);
					}
				} else {
					// First time generation
					// console.log('Generating first set of daily challenges');
					const newChallenges = generateDailyChallenges();
					setDailyChallenges(newChallenges);
				}

				// Garage & Current Car Logic
				const savedGarage = localStorage.getItem('shift_drift_garage');
				const savedCarIndex = localStorage.getItem(
					'shift_drift_currentCarIndex'
				);

				// Legacy variables
				const savedOwnedMods = localStorage.getItem(
					'shift_drift_ownedMods'
				);
				const savedDisabledMods = localStorage.getItem(
					'shift_drift_disabledMods'
				);
				const savedModSettings = localStorage.getItem(
					'shift_drift_modSettings'
				);
				const savedManualTuning = localStorage.getItem(
					'shift_drift_manual_tuning'
				);

				if (savedGarage) {
					// Load Garage
					const parsedGarage = JSON.parse(savedGarage);
					setGarage(parsedGarage);

					let activeIndex = 0;
					if (savedCarIndex) {
						activeIndex = parseInt(savedCarIndex);
					}

					// Safety Check: Ensure index is valid
					if (activeIndex < 0 || activeIndex >= parsedGarage.length) {
						console.warn(
							'Invalid car index loaded, defaulting to 0'
						);
						activeIndex = 0;
					}
					setCurrentCarIndex(activeIndex);

					// Load active car state immediately
					const activeCar = parsedGarage[activeIndex];
					if (activeCar) {
						setOwnedMods(activeCar.ownedMods);
						setDisabledMods(activeCar.disabledMods);
						setModSettings(activeCar.modSettings);
						setPlayerTuning((prev) => ({
							...prev,
							...activeCar.manualTuning,
						}));
					} else if (parsedGarage.length > 0) {
						// Fallback: Try to load first car if exists
						console.warn(
							'Active car not found, falling back to first car'
						);
						const firstCar = parsedGarage[0];
						setCurrentCarIndex(0);
						setOwnedMods(firstCar.ownedMods);
						setDisabledMods(firstCar.disabledMods);
						setModSettings(firstCar.modSettings);
						setPlayerTuning((prev) => ({
							...prev,
							...firstCar.manualTuning,
						}));
					}
				} else {
					// Migration: Check for legacy single-car save
					if (savedOwnedMods) {
						// Create initial car from legacy data
						const initialCar: SavedTune = {
							id: 'starter_car',
							name: 'My First Ride',
							date: Date.now(),
							ownedMods: JSON.parse(savedOwnedMods),
							disabledMods: savedDisabledMods
								? JSON.parse(savedDisabledMods)
								: [],
							modSettings: savedModSettings
								? JSON.parse(savedModSettings)
								: {},
							manualTuning: savedManualTuning
								? JSON.parse(savedManualTuning)
								: {},
						};

						setGarage([initialCar]);
						setCurrentCarIndex(0);

						// Also set the active state immediately for seamless transition
						setOwnedMods(initialCar.ownedMods);
						setDisabledMods(initialCar.disabledMods);
						setModSettings(initialCar.modSettings);
						// Manual tuning is handled by GameCanvas via playerTuning state
					} else {
						// New Game
						setGarage([]);
						setCurrentCarIndex(0);
					}
				}

				setLoaded(true);
			} catch (e) {
				console.error('Failed to load game state', e);
			}
		};
		load();
	}, []);

	// Auto-save effects
	useEffect(() => {
		if (!loaded) return;
		localStorage.setItem('shift_drift_money', money.toString());
	}, [money, loaded]);

	useEffect(() => {
		if (!loaded) return;
		localStorage.setItem('shift_drift_missions', JSON.stringify(missions));
	}, [missions, loaded]);

	useEffect(() => {
		if (!loaded) return;
		localStorage.setItem(
			'shift_drift_dynoHistory',
			JSON.stringify(dynoHistory)
		);
	}, [dynoHistory, loaded]);

	useEffect(() => {
		if (!loaded) return;
		localStorage.setItem(
			'shift_drift_previousDynoHistory',
			JSON.stringify(previousDynoHistory)
		);
	}, [previousDynoHistory, loaded]);

	// Save Garage & Current Index
	useEffect(() => {
		if (!loaded) return;
		localStorage.setItem('shift_drift_garage', JSON.stringify(garage));
	}, [garage, loaded]);

	useEffect(() => {
		if (!loaded) return;
		localStorage.setItem(
			'shift_drift_currentCarIndex',
			currentCarIndex.toString()
		);
	}, [currentCarIndex, loaded]);

	useEffect(() => {
		if (!loaded) return;
		localStorage.setItem(
			'shift_drift_undergroundLevel',
			undergroundLevel.toString()
		);
	}, [undergroundLevel, loaded]);

	useEffect(() => {
		if (!loaded) return;
		localStorage.setItem(
			'shift_drift_dailyChallenges',
			JSON.stringify(dailyChallenges)
		);
	}, [dailyChallenges, loaded]);

	useEffect(() => {
		if (!loaded) return;
		localStorage.setItem('shift_drift_xp', xp.toString());
	}, [xp, loaded]);

	useEffect(() => {
		if (!loaded) return;
		localStorage.setItem('shift_drift_level', level.toString());
	}, [level, loaded]);

	useEffect(() => {
		if (!loaded) return;
		localStorage.setItem(
			'shift_drift_inventory',
			JSON.stringify(inventory)
		);
	}, [inventory, loaded]);

	return loaded;
};
