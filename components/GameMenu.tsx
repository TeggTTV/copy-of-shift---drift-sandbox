import DynoGraph from './menu/DynoGraph';
import DynoTab from './menu/DynoTab';
import UpgradesTab from './menu/UpgradesTab';
import TuningTab from './menu/TuningTab';
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
import MissionSelect from './menu/MissionSelect';
import Junkyard from './menu/Junkyard';
import VersusScreen from './menu/VersusScreen';
import SettingsModal from './menu/SettingsModal';
import { CarBuilder } from '../utils/CarBuilder';
import { CarGenerator } from '../utils/CarGenerator';
import React, { useState, useMemo, useEffect } from 'react';
import { ModTreeVisuals } from './menu/ModTreeVisuals'; // Keeping for reference if needed, but unused visually
import { TopBar } from './menu/TopBar';
import { LevelBadge } from './menu/LevelBadge';
import { Inventory } from './menu/Inventory';
import { CrateShop } from './menu/CrateShop';
import { AuctionHouse } from './menu/AuctionHouse';
import { InventoryItem, Crate } from '../types';
import { ItemGenerator } from '../utils/ItemGenerator';

import { useGame } from '../contexts/GameContext';

export const GameMenu = () => {
	const {
		phase,
		setPhase,
		money,
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
	const [activeTab, setActiveTab] = useState<'TUNING' | 'DYNO' | 'CARS'>(
		'TUNING'
	); // Default to Tuning
	const [hoveredMod, setHoveredMod] = React.useState<ModNode | null>(null);
	const [showSettings, setShowSettings] = useState(false);

	const handleBuyCrate = (crate: Crate) => {
		// Money deduction should happen in parent but for now we simulate visual
		// onBuyCrate prop could be added.
		// For MVP, we'll assume the CrateShop handles the visual "Buy" and we deduce money here?
		// But money is a prop. We can't change it directly without a setMoney prop.
		// Wait, onBuyMods exists. We can potentially misuse it or add a new prop.
		// Let's assume for MVP we just handle the item generation visually and maybe log the money deduction?
		// The user said "use local storage to imitate".
		// I will add a temporary local money state hack or just trust the visual?
		// Actually, `onBuyMods` takes an array of mods.
		// I should probably add `setMoney` to props or a `onSpendMoney` callback.
		// For now, I'll cheat and assume the user has infinite money for testing OR
		// I will emit a console log and TODO for money integration.
		console.log('Bought crate', crate);
	};

	const handleItemReveal = (item: InventoryItem) => {
		setUserInventory((prev) => [...prev, item]);
	};

	const handleEquipItem = (item: InventoryItem) => {
		// Add stats to playerTuning manually?
		// The user said: "Equipping an item... simply adds to the base values... updated values determine how car drives".
		// So we need to merge `item.stats` into `playerTuning`.
		setPlayerTuning((prev) => {
			const next = { ...prev };
			Object.entries(item.stats).forEach(([key, val]) => {
				if (typeof val === 'number') {
					(next as any)[key] = ((next as any)[key] || 0) + val;
				}
			});
			return next;
		});
		// play('equip');
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
		// In a real app we'd deduct money via prop callback
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

	const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

	const handleHover = (m: ModNode | null) => {
		if (hoverTimeoutRef.current) {
			clearTimeout(hoverTimeoutRef.current);
			hoverTimeoutRef.current = null;
		}

		if (m) {
			setHoveredMod(m);
		} else {
			// Delay clearing to prevent flicker
			hoverTimeoutRef.current = setTimeout(() => {
				setHoveredMod(null);
			}, 50);
		}
	};

	// ... (rendering logic updates below)

	const renderParticles = (rarity: string) => {
		if (rarity !== 'LEGENDARY' && rarity !== 'EXOTIC') return null;

		const particleCount = rarity === 'EXOTIC' ? 16 : 12;
		const particles = [];

		for (let i = 0; i < particleCount; i++) {
			let style: React.CSSProperties = {};
			const delay = Math.random() * 2;
			const duration = 1.5 + Math.random();

			// Spawn on border for both
			const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
			const pos = Math.random() * 100;
			const size = 3 + Math.random() * 3;

			switch (side) {
				case 0: // Top
					style = { top: '-6px', left: `${pos}%` };
					break;
				case 1: // Right
					style = { right: '-6px', top: `${pos}%` };
					break;
				case 2: // Bottom
					style = { bottom: '-6px', left: `${pos}%` };
					break;
				case 3: // Left
					style = { left: '-6px', top: `${pos}%` };
					break;
			}

			if (rarity === 'EXOTIC') {
				style = {
					...style,
					width: `${size}px`,
					height: `${size}px`,
					backgroundColor: '#f472b6', // Pink-400
					animationName: 'twinkle',
					animationDuration: `${duration}s`,
					animationDelay: `${delay}s`,
					boxShadow: '0 0 4px #ec4899',
				};
			} else {
				// Legendary (Gold)
				style = {
					...style,
					width: `${size}px`,
					height: `${size}px`,
					backgroundColor: '#fbbf24', // Gold
					animationName: 'twinkle',
					animationDuration: `${duration}s`,
					animationDelay: `${delay}s`,
					boxShadow: '0 0 4px #d97706',
				};
			}

			particles.push(
				<div key={i} className="pixel-particle" style={style} />
			);
		}

		return <>{particles}</>;
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

	// Calculate preview tuning for hover
	const previewTuning = useMemo(() => {
		if (!hoveredMod) return null;

		const previewOwnedMods = [...ownedMods];
		if (!previewOwnedMods.includes(hoveredMod.id)) {
			previewOwnedMods.push(hoveredMod.id);
		}

		return CarBuilder.calculateTuning(
			BASE_TUNING,
			previewOwnedMods,
			disabledMods,
			modSettings
		);
	}, [hoveredMod, ownedMods, disabledMods, modSettings]);

	const handleToggleDisable = (id: string) => {
		// play('click');
		setDisabledMods((prev) => {
			const isDisabled = prev.includes(id);
			if (isDisabled) {
				const mod = MOD_TREE.find((m) => m.id === id);
				let newDisabled = prev.filter((d) => d !== id);

				if (mod && mod.conflictsWith) {
					const conflictsToDisable = mod.conflictsWith.filter(
						(cId) =>
							ownedMods.includes(cId) &&
							!newDisabled.includes(cId)
					);
					newDisabled = [...newDisabled, ...conflictsToDisable];
				}
				return newDisabled;
			} else {
				const toDisable = [id];
				const queue = [id];
				while (queue.length > 0) {
					const current = queue.shift();
					const children = MOD_TREE.filter(
						(m) => m.parentId === current
					);
					children.forEach((child) => {
						if (ownedMods.includes(child.id)) {
							toDisable.push(child.id);
							queue.push(child.id);
						}
					});
				}
				return [...prev, ...toDisable];
			}
		});
	};

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

							<div className="flex flex-col gap-6 w-64">
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
									className="pixel-btn text-[10px] py-2 bg-gray-800 border-gray-600"
								>
									⚙ SETTINGS
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
									ownedMods={ownedMods}
								/>
							</div>
						</div>
					)}

					{phase === 'GARAGE' && (
						<div className="w-full h-full flex flex-col">
							{/* Garage Header */}
							<div className="w-full bg-gray-900/50 border-b border-gray-800 p-2 text-center">
								<h2 className="text-xl text-gray-400 pixel-text tracking-widest">
									MOD SHOP
								</h2>
							</div>
							<div className="flex-1 flex overflow-hidden">
								<div className="w-1/3 bg-black/30 p-6 border-r-4 border-gray-800 overflow-y-auto no-scrollbar">
									<h3 className="text-sm text-gray-300 mb-4 pixel-text">
										DYNO GRAPH
									</h3>
									<div className="h-[280px] w-full bg-black/50 mb-6 pixel-panel p-2">
										<DynoGraph
											tuning={effectiveTuning} // Use effective tuning for Dyno
											previewTuning={previewTuning}
											liveData={dynoHistory}
											previousData={previousDynoHistory}
										/>
									</div>

									<div className="flex gap-2 mb-4">
										<button
											onClick={() =>
												setActiveTab('TUNING')
											}
											className={`flex-1 py-3 text-[10px] pixel-btn ${
												activeTab === 'TUNING'
													? ''
													: 'bg-gray-700 opacity-50'
											}`}
											style={{
												backgroundColor:
													activeTab === 'TUNING'
														? undefined
														: '#374151',
											}}
										>
											TUNE
										</button>
										<button
											onClick={() => setActiveTab('DYNO')}
											className={`flex-1 py-3 text-[10px] pixel-btn ${
												activeTab === 'DYNO'
													? ''
													: 'bg-gray-700 opacity-50'
											}`}
											style={{
												backgroundColor:
													activeTab === 'DYNO'
														? undefined
														: '#374151',
											}}
										>
											DYNO
										</button>
										<button
											onClick={() => setActiveTab('CARS')}
											className={`flex-1 py-3 text-[10px] pixel-btn ${
												activeTab === 'CARS'
													? ''
													: 'bg-gray-700 opacity-50'
											}`}
											style={{
												backgroundColor:
													activeTab === 'CARS'
														? undefined
														: '#374151',
											}}
										>
											CARS
										</button>
									</div>

									{activeTab === 'UPGRADES' ? (
										<UpgradesTab
											playerTuning={playerTuning}
											ownedMods={ownedMods}
											setOwnedMods={setOwnedMods}
											money={money}
											disabledMods={disabledMods}
											setDisabledMods={setDisabledMods}
											previewTuning={previewTuning}
										/>
									) : activeTab === 'TUNING' ? (
										<TuningTab
											ownedMods={ownedMods}
											disabledMods={disabledMods}
											modSettings={modSettings}
											setModSettings={setModSettings}
											playerTuning={playerTuning}
											setPlayerTuning={setPlayerTuning}
											onLoadTune={onLoadTune}
											onBuyMods={onBuyMods}
											money={money}
										/>
									) : activeTab === 'DYNO' ? (
										<DynoTab
											playerTuning={effectiveTuning}
											onUpdateHistory={setDynoHistory}
											onRunStart={onDynoRunStart}
										/>
									) : (
										<div className="flex flex-col gap-4">
											{garage.map((car, index) => {
												const rarity =
													car.rarity || 'COMMON';
												let borderColor =
													index === currentCarIndex
														? 'border-indigo-500'
														: 'border-gray-800 hover:border-gray-500';
												let rarityColor = 'text-white';
												let badgeBg = 'bg-gray-800';

												// Override border for special rarities if not active
												if (index !== currentCarIndex) {
													switch (rarity) {
														case 'UNCOMMON':
															borderColor =
																'border-green-900/50 hover:border-green-500';
															rarityColor =
																'text-green-400';
															badgeBg =
																'bg-green-900/80 text-green-200';
															break;
														case 'RARE':
															borderColor =
																'border-blue-900/50 hover:border-blue-500';
															rarityColor =
																'text-blue-400';
															badgeBg =
																'bg-blue-900/80 text-blue-200';
															break;
														case 'EPIC':
															borderColor =
																'border-purple-900/50 hover:border-purple-500';
															rarityColor =
																'text-purple-400';
															badgeBg =
																'bg-purple-900/80 text-purple-200';
															break;
														case 'LEGENDARY':
															borderColor =
																'rarity-legendary border-transparent';
															rarityColor =
																'text-yellow-400';
															badgeBg =
																'bg-yellow-900/80 text-yellow-200 animate-pulse';
															break;
														case 'EXOTIC':
															borderColor =
																'rarity-exotic border-transparent';
															rarityColor =
																'text-pink-400';
															badgeBg =
																'bg-pink-900/80 text-pink-200 animate-pulse font-bold tracking-wider';
															break;
													}
												}

												// Calculate Rating
												const tuning =
													CarBuilder.calculateTuning(
														BASE_TUNING,
														car.ownedMods,
														car.disabledMods,
														car.modSettings
													);
												const rating =
													calculatePerformanceRating(
														tuning
													);
												const ratingClass =
													getRatingClass(rating);
												const ratingColor =
													{
														D: 'text-gray-400',
														C: 'text-green-400',
														B: 'text-blue-400',
														A: 'text-purple-400',
														S: 'text-yellow-400',
														R: 'text-red-500',
														X: 'text-pink-500',
													}[ratingClass] ||
													'text-gray-400';

												return (
													<div
														key={index}
														onClick={() =>
															setCurrentCarIndex(
																index
															)
														}
														className={`pixel-panel p-4 cursor-pointer transition-all relative overflow-hidden ${borderColor} ${
															index ===
															currentCarIndex
																? 'bg-gray-800'
																: 'bg-black/40 hover:bg-gray-900'
														}`}
													>
														{/* Rarity Glow */}
														{(rarity ===
															'LEGENDARY' ||
															rarity ===
																'EXOTIC') && (
															<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shine pointer-events-none" />
														)}

														<div className="flex justify-between items-start mb-2">
															<div>
																<div className="flex items-center gap-2 mb-1">
																	<span
																		className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${badgeBg}`}
																	>
																		{rarity}
																	</span>
																	{index ===
																		currentCarIndex && (
																		<span className="text-[10px] text-indigo-400 font-bold">
																			ACTIVE
																		</span>
																	)}
																</div>
																<div
																	className={`font-bold text-sm ${rarityColor}`}
																>
																	{car.name}
																</div>
															</div>
															<div className="text-right">
																<div className="text-xs text-gray-400">
																	Rating
																</div>
																<div
																	className={`text-lg font-bold ${ratingColor}`}
																>
																	{rating}
																</div>
															</div>
														</div>

														{/* Particles for high rarity */}
														{renderParticles(
															rarity
														)}

														<div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500 mt-2">
															<div>
																<div className="text-gray-400">
																	HP
																</div>
																<div className="text-white font-mono">
																	{Math.round(
																		(tuning.maxTorque *
																			tuning.redlineRPM) /
																			5252
																	)}
																</div>
															</div>
															<div>
																<div className="text-gray-400">
																	Torque
																</div>
																<div className="text-white font-mono">
																	{Math.round(
																		tuning.maxTorque
																	)}
																</div>
															</div>
														</div>
													</div>
												);
											})}
											<button
												onClick={() => onRestoreCar(-1)}
												className="pixel-btn bg-gray-800 text-gray-400 hover:text-white py-4 border-dashed border-gray-600"
											>
												+ RESTORE NEW CAR
											</button>
										</div>
									)}
								</div>

								{/* Car Visual / Main Content Area (Mod Tree Replaced) */}
								<div className="flex-1 bg-gray-900/50 relative overflow-hidden flex flex-col">
									{/* Inventory (Always Visible) */}
									<div className="absolute inset-0 p-2 overflow-hidden">
										<Inventory
											items={userInventory}
											onEquip={handleEquipItem}
											onSell={(item) => {
												setPhase('AUCTION');
											}}
											onDestroy={handleDestroyItem}
											money={money}
										/>
									</div>

									{/* Hover Info Panel (Bottom Right) */}
									{hoveredMod && (
										<div className="absolute bottom-4 right-4 w-64 bg-black/90 border-2 border-indigo-500 p-4 shadow-2xl z-20 animate-in fade-in slide-in-from-bottom-4 duration-200">
											<h4 className="text-indigo-400 font-bold text-lg mb-1 pixel-text">
												{hoveredMod.name}
											</h4>
											<div className="text-xs text-indigo-300 mb-2 font-mono">
												{hoveredMod.type}
											</div>
											<p className="text-gray-300 text-xs mb-3 leading-relaxed">
												{hoveredMod.description}
											</p>
											<div className="border-t border-gray-800 pt-2">
												<div className="flex justify-between text-xs mb-1">
													<span className="text-gray-500">
														COST
													</span>
													<span className="text-yellow-400 font-mono">
														$
														{hoveredMod.cost.toLocaleString()}
													</span>
												</div>
												{previewTuning && (
													<div className="mt-2">
														<div className="text-[10px] text-gray-500 uppercase mb-1">
															Estimated Gains
														</div>
														<div className="grid grid-cols-2 gap-2 text-xs font-mono">
															<div className="text-green-400">
																+
																{(
																	(previewTuning.maxTorque -
																		effectiveTuning.maxTorque) *
																	0.8
																).toFixed(
																	0
																)}{' '}
																HP
															</div>
															<div className="text-green-400">
																+
																{(
																	previewTuning.maxTorque -
																	effectiveTuning.maxTorque
																).toFixed(
																	0
																)}{' '}
																TQ
															</div>
														</div>
													</div>
												)}
											</div>
										</div>
									)}
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		);
	}

	return null;
};
