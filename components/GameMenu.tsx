import {
	calculatePerformanceRating,
	getRatingClass,
} from '../utils/PerformanceRating';
import { useSound } from '../contexts/SoundContext';
import {
	DailyChallenge,
	GamePhase,
	Mission,
	ModNode,
	SavedTune,
	TuningState,
	JunkyardCar,
	Rival,
} from '../types';
import { MOD_TREE, BASE_TUNING } from '../constants';
import MissionSelect from './menu/race/MissionSelect';
import Junkyard from './menu/junkyard/Junkyard';
import VersusScreen from './menu/race/VersusScreen';
import SettingsModal from './menu/settings/SettingsModal';
import { CarBuilder } from '../utils/CarBuilder';
import { CarGenerator } from '../utils/CarGenerator';
import React, { useState, useMemo, useEffect } from 'react';
import { TopBar } from './menu/shared/TopBar';
import { LevelBadge } from './menu/shared/LevelBadge';
import { Inventory } from './menu/inventory/Inventory';
import { CrateShop } from './menu/shop/CrateShop';
import { AuctionHouse } from './menu/auction/AuctionHouse';
import { Garage } from './menu/garage/Garage';
import { InventoryItem, Crate } from '../types';
import { ItemGenerator } from '../utils/ItemGenerator';

import { useGame } from '../contexts/GameContext';

export const GameMenu = () => {
	const {
		phase,
		setPhase,
		money,
		setMoney,
		playerTuning,
		effectiveTuning,
		setPlayerTuning,
		ownedMods,
		setOwnedMods,
		missions,
		dailyChallenges,
		onStartMission,
		onConfirmRace,
		selectedMission,
		disabledMods,
		setDisabledMods,
		modSettings,
		setModSettings,
		onLoadTune,
		weather,
		setWeather,
		showToast,
		dynoHistory,
		setDynoHistory,
		previousDynoHistory,
		onDynoRunStart,
		garage,
		currentCarIndex,
		setCurrentCarIndex,
		undergroundLevel,
		setUndergroundLevel,
		onBuyMods,
		junkyardCars,
		onBuyJunkyardCar,
		onRefreshJunkyard,
		onRestoreCar,
		missionSelectTab,
		setMissionSelectTab,
		xp,
		level,
		defeatedRivals,
		onChallengeRival,
		userInventory,
		setUserInventory,
	} = useGame();

	const { play } = useSound();
	const [showSettings, setShowSettings] = useState(false);

	const handleBuyCrate = (crate: Crate) => {
		// console.log('Bought crate', crate);
	};

	const handleItemReveal = (item: InventoryItem) => {
		setUserInventory((prev) => [...prev, item]);
	};

	const handleEquipItem = (item: InventoryItem) => {
		// Conflict Check Logic
		const isConflict = (existing: InventoryItem, newOne: InventoryItem) => {
			if (newOne.category && existing.category) {
				return newOne.category === existing.category;
			}
			// If one has category and other doesn't, assume NO conflict to allow mixing legacy/new specific parts?
			// OR if new one has category, only conflict if existing has matching category.
			if (newOne.category) {
				return newOne.category === existing.category;
			}
			// Fallback: If new one has NO category, it's broad. Use Type.
			return newOne.type === existing.type;
		};

		// Find currently equipped item that conflicts
		const currentEquipped = userInventory.find(
			(i) => i.equipped && isConflict(i, item)
		);

		// Helper to adjust stats
		const adjustStats = (
			tuning: TuningState,
			stats: Partial<TuningState>,
			factor: 1 | -1
		) => {
			const next = { ...tuning };
			Object.entries(stats).forEach(([key, val]) => {
				if (typeof val === 'number') {
					(next as any)[key] =
						((next as any)[key] || 0) + val * factor;
				} else if (factor === 1) {
					(next as any)[key] = val;
				}
			});
			return next;
		};

		setPlayerTuning((prev) => {
			let next = { ...prev };
			// 1. Remove stats of currently equipped item (if any)
			if (currentEquipped) {
				next = adjustStats(next, currentEquipped.stats, -1);
			}
			// 2. Add stats of new item
			next = adjustStats(next, item.stats, 1);
			return next;
		});

		// 3. Update Inventory Flags
		setUserInventory((prev) =>
			prev.map((i) => {
				// Set target to equipped
				if (i.instanceId === item.instanceId) {
					return { ...i, equipped: true };
				}
				// Unequip others of conflicting type/category
				if (i.equipped && isConflict(i, item)) {
					return { ...i, equipped: false };
				}
				return i;
			})
		);

		showToast(`Equipped ${item.name}`, 'SUCCESS');
	};

	const handleSellItem = (item: InventoryItem, price: number) => {
		// Remove from inventory
		setUserInventory((prev) =>
			prev.filter((i) => i.instanceId !== item.instanceId)
		);
		// Add fake money (TODO: Prop)
		showToast(`Sold ${item.name} for $${price}`, 'SUCCESS');
	};

	const handleBuyItem = (item: InventoryItem, price: number) => {
		if (money < price) {
			showToast('Not enough money!', 'ERROR');
			return;
		}
		setMoney((m) => m - price);
		setUserInventory((prev) => [...prev, item]);
		showToast(
			`Bought ${item.name} for $${price.toLocaleString()}`,
			'SUCCESS'
		);
	};

	const handleDestroyItem = (item: InventoryItem) => {
		setUserInventory((prev) =>
			prev.filter((i) => i.instanceId !== item.instanceId)
		);
		showToast(`Destroyed ${item.name}`, 'ERROR'); // Red toast
	};

	const handleRepairItem = (item: InventoryItem, cost: number) => {
		if (money < cost) {
			showToast('Not enough money!', 'ERROR');
			return;
		}
		setMoney((m) => m - cost);

		setUserInventory((prev) =>
			prev.map((i) =>
				i.instanceId === item.instanceId ? { ...i, condition: 100 } : i
			)
		);
		showToast(`Repaired ${item.name} for $${cost}`, 'SUCCESS');
	};

	// Escape key navigation
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				if (
					phase === 'GARAGE' ||
					phase === 'MISSION_SELECT' ||
					phase === 'VERSUS' ||
					phase === 'SHOP' ||
					phase === 'AUCTION'
				) {
					// play('back');
					setPhase('MAP');
				}
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [phase, setPhase, play]);

	if (phase === 'VERSUS' && selectedMission && onConfirmRace) {
		return (
			<VersusScreen
				playerTuning={effectiveTuning} // Use effective tuning for versus stats
				mission={selectedMission}
				onConfirmRace={(wager) => {
					// play('confirm');
					if (onConfirmRace) onConfirmRace(wager);
				}}
				onBack={() => {
					// play('back');
					setPhase('MAP');
				}}
				ownedMods={ownedMods}
				dynoHistory={dynoHistory}
				money={money}
				weather={weather}
				setWeather={setWeather}
				userInventory={userInventory}
				onApplyWear={(wearAmount) => {
					// Degrade all EQUIPPED items
					setUserInventory((prev) =>
						prev.map((item) => {
							if (!item.equipped) return item;
							const newCondition = Math.max(
								0,
								(item.condition ?? 1.0) - wearAmount
							);
							return { ...item, condition: newCondition };
						})
					);
				}}
			/>
		);
	}

	// Persistent TopBar for Menu Phases
	const isMenuPhase = [
		'MAP',
		'GARAGE',
		'MISSION_SELECT',
		'JUNKYARD',
		'SHOP',
		'AUCTION',
	].includes(phase);

	if (isMenuPhase) {
		let onBack = undefined;

		if (phase === 'GARAGE') {
			onBack = () => setPhase('MAP');
		} else if (phase === 'MISSION_SELECT') {
			onBack = () => setPhase('MAP');
		} else if (phase === 'JUNKYARD') {
			onBack = () => setPhase('MAP');
		} else if (phase === 'SHOP') {
			onBack = () => setPhase('MAP');
		} else if (phase === 'AUCTION') {
			onBack = () => setPhase('MAP');
		}

		return (
			<div className="absolute inset-0 bg-neutral-900 flex flex-col font-pixel">
				<TopBar level={level} xp={xp} money={money} onBack={onBack} />
				<div className="flex-1 relative w-full h-full overflow-hidden">
					{phase === 'MAP' && (
						<div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center text-white z-50">
							<h1 className="text-4xl md:text-6xl text-indigo-500 mb-4 pixel-text tracking-widest">
								DRAG
							</h1>
							<p className="text-gray-400 mb-12 text-xs md:text-sm">
								VERTICAL DRAG RACING SIMULATOR
							</p>

							<div className="grid grid-cols-2 gap-6">
								<button
									onClick={() => {
										// play('click');
										setPhase('MISSION_SELECT');
									}}
									className="pixel-btn text-center py-4 text-lg"
								>
									RACE
								</button>
								<button
									onClick={() => {
										// play('click');
										setPhase('GARAGE');
									}}
									className="pixel-btn text-center py-4 text-lg bg-gray-700"
									style={{ backgroundColor: '#4b5563' }}
								>
									GARAGE
								</button>

								<button
									onClick={() => {
										// play('click');
										setPhase('JUNKYARD');
									}}
									className="pixel-btn text-center py-4 text-lg bg-orange-900 border-orange-700 text-orange-500 hover:bg-orange-800"
									style={{
										backgroundColor: '#7c2d12',
									}}
								>
									JUNKYARD
								</button>

								<button
									onClick={() => {
										setPhase('SHOP');
									}}
									className="pixel-btn text-center py-4 text-lg bg-indigo-900 border-indigo-700 text-indigo-400 hover:bg-indigo-800"
									style={{
										backgroundColor: '#312e81', // indigo-900
										borderColor: '#4338ca', // indigo-700
									}}
								>
									SHOP
								</button>
								<button
									onClick={() => {
										setPhase('AUCTION');
									}}
									className="pixel-btn text-center py-4 text-lg bg-yellow-900 border-yellow-700 text-yellow-500 hover:bg-yellow-800"
									style={{
										backgroundColor: '#713f12', // yellow-900 (approx)
										borderColor: '#a16207', // yellow-700
									}}
								>
									AUCTION
								</button>

								<button
									onClick={() => setShowSettings(true)}
									className="pixel-btn text-center py-2 text-lg bg-gray-800 border-gray-600 text-slate-400"
								>
									SETTINGS
								</button>
							</div>

							<SettingsModal
								isOpen={showSettings}
								onClose={() => setShowSettings(false)}
							/>
						</div>
					)}

					{phase === 'MISSION_SELECT' && (
						<MissionSelect
							missions={missions}
							dailyChallenges={dailyChallenges}
							onStartMission={onStartMission}
							onBack={() => setPhase('MAP')}
							undergroundLevel={undergroundLevel}
							money={money}
							garage={garage}
							activeTab={missionSelectTab}
							setActiveTab={setMissionSelectTab}
							defeatedRivals={defeatedRivals}
							level={level}
							onChallengeRival={onChallengeRival}
						/>
					)}

					{phase === 'JUNKYARD' && (
						<Junkyard
							cars={junkyardCars}
							money={money}
							onBuyCar={onBuyJunkyardCar}
							onBack={() => setPhase('MAP')}
							onRefresh={onRefreshJunkyard}
						/>
					)}

					{phase === 'SHOP' && (
						<div className="absolute inset-0 bg-neutral-900 flex flex-col z-50">
							<div className="p-4 bg-gray-900 border-b border-gray-800 flex justify-between items-center">
								<h2 className="text-xl text-indigo-400 pixel-text">
									PARTS SHOP
								</h2>
							</div>
							<div className="flex-1 overflow-hidden p-4">
								<CrateShop
									money={money}
									onBuyCrate={handleBuyCrate}
									onItemReveal={handleItemReveal}
								/>
							</div>
						</div>
					)}

					{phase === 'AUCTION' && (
						<div className="absolute inset-0 bg-neutral-900 flex flex-col z-50">
							<div className="p-4 bg-gray-900 border-b border-gray-800 flex justify-between items-center">
								<h2 className="text-xl text-yellow-400 pixel-text">
									AUCTION HOUSE
								</h2>
							</div>
							<div className="flex-1 overflow-hidden p-4">
								<AuctionHouse
									inventory={userInventory}
									onSellItem={handleSellItem}
									money={money}
									onBuyItem={handleBuyItem}
									playerTuning={effectiveTuning}
									ownedMods={[]}
								/>
							</div>
						</div>
					)}

					{phase === 'GARAGE' && (
						<Garage
							money={money}
							garage={garage}
							currentCarIndex={currentCarIndex}
							setCurrentCarIndex={setCurrentCarIndex}
							playerTuning={playerTuning}
							setPlayerTuning={setPlayerTuning}
							effectiveTuning={effectiveTuning}
							ownedMods={[]}
							setOwnedMods={() => {}}
							disabledMods={[]}
							setDisabledMods={() => {}}
							modSettings={modSettings}
							setModSettings={setModSettings}
							dynoHistory={dynoHistory}
							setDynoHistory={setDynoHistory}
							previousDynoHistory={previousDynoHistory}
							onDynoRunStart={onDynoRunStart}
							onLoadTune={onLoadTune}
							onBuyMods={onBuyMods}
							onBack={() => setPhase('MAP')}
							userInventory={userInventory}
							onEquip={handleEquipItem}
							onRemove={(item) => {
								setUserInventory((prev) =>
									prev.map((i) =>
										i.instanceId === item.instanceId
											? { ...i, equipped: false }
											: i
									)
								);
								showToast(`Removed ${item.name}`, 'INFO');
							}}
							onSell={(item) => setPhase('AUCTION')}
							onDestroy={handleDestroyItem}
							onRestoreCar={onRestoreCar}
							onRepair={handleRepairItem}
						/>
					)}
				</div>
			</div>
		);
	}

	return null;
};
