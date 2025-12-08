import React, { useState, useMemo } from 'react';
import DynoGraph from './DynoGraph';
import DynoTab from './DynoTab';
import UpgradesTab from './UpgradesTab';
import TuningTab from './TuningTab';
import { Inventory } from '../inventory/Inventory';
import {
	calculatePerformanceRating,
	getRatingClass,
} from '../../../utils/PerformanceRating';
import { CarBuilder } from '../../../utils/CarBuilder';
import { BASE_TUNING } from '../../../constants';
import {
	ModNode,
	TuningState,
	SavedTune,
	InventoryItem,
	ModSettings,
	GamePhase,
} from '../../../types';

interface GarageProps {
	money: number;
	garage: SavedTune[];
	currentCarIndex: number;
	setCurrentCarIndex: (index: number) => void;
	playerTuning: TuningState;
	setPlayerTuning: React.Dispatch<React.SetStateAction<TuningState>>;
	effectiveTuning: TuningState;
	ownedMods: string[];
	setOwnedMods: React.Dispatch<React.SetStateAction<string[]>>;
	disabledMods: string[];
	setDisabledMods: React.Dispatch<React.SetStateAction<string[]>>;
	modSettings: ModSettings;
	setModSettings: React.Dispatch<React.SetStateAction<ModSettings>>;
	dynoHistory: any[];
	setDynoHistory: React.Dispatch<React.SetStateAction<any[]>>;
	previousDynoHistory: any[];
	onDynoRunStart: () => void;
	onLoadTune: (tune: SavedTune) => void;
	onBuyMods: (mods: ModNode[]) => void;
	onBack: () => void;
	userInventory: InventoryItem[];
	onEquip: (item: InventoryItem) => void;
	onRemove: (item: InventoryItem) => void;
	onSell: (item: InventoryItem) => void;
	onDestroy: (item: InventoryItem) => void;
	onRestoreCar: (index: number) => void;
}

export const Garage: React.FC<GarageProps> = ({
	money,
	garage,
	currentCarIndex,
	setCurrentCarIndex,
	playerTuning,
	setPlayerTuning,
	effectiveTuning,
	ownedMods,
	setOwnedMods,
	disabledMods,
	setDisabledMods,
	modSettings,
	setModSettings,
	dynoHistory,
	setDynoHistory,
	previousDynoHistory,
	onDynoRunStart,
	onLoadTune,
	onBuyMods,
	onBack,
	userInventory,
	onEquip,
	onRemove,
	onSell,
	onDestroy,
	onRestoreCar,
}) => {
	const [activeTab, setActiveTab] = useState<'TUNING' | 'DYNO' | 'CARS'>(
		'TUNING'
	);
	const [hoveredMod, setHoveredMod] = useState<ModNode | null>(null);

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

	const renderParticles = (rarity: string) => {
		if (rarity !== 'LEGENDARY' && rarity !== 'EXOTIC') return null;

		const particleCount = rarity === 'EXOTIC' ? 16 : 12;
		const particles = [];

		for (let i = 0; i < particleCount; i++) {
			let style: React.CSSProperties = {};
			const delay = Math.random() * 2;
			const duration = 1.5 + Math.random();

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

	return (
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
							onClick={() => setActiveTab('TUNING')}
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
							setOwnedMods={(mod) => {
								if (!ownedMods.includes(mod.id)) {
									setOwnedMods((prev) => [...prev, mod.id]);
								}
							}}
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
								const rarity = car.rarity || 'COMMON';
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
											rarityColor = 'text-green-400';
											badgeBg =
												'bg-green-900/80 text-green-200';
											break;
										case 'RARE':
											borderColor =
												'border-blue-900/50 hover:border-blue-500';
											rarityColor = 'text-blue-400';
											badgeBg =
												'bg-blue-900/80 text-blue-200';
											break;
										case 'EPIC':
											borderColor =
												'border-purple-900/50 hover:border-purple-500';
											rarityColor = 'text-purple-400';
											badgeBg =
												'bg-purple-900/80 text-purple-200';
											break;
										case 'LEGENDARY':
											borderColor =
												'rarity-legendary border-transparent';
											rarityColor = 'text-yellow-400';
											badgeBg =
												'bg-yellow-900/80 text-yellow-200 animate-pulse';
											break;
										case 'EXOTIC':
											borderColor =
												'rarity-exotic border-transparent';
											rarityColor = 'text-pink-400';
											badgeBg =
												'bg-pink-900/80 text-pink-200 animate-pulse font-bold tracking-wider';
											break;
									}
								}

								// Calculate Rating
								const tuning = CarBuilder.calculateTuning(
									BASE_TUNING,
									car.ownedMods,
									car.disabledMods,
									car.modSettings
								);
								const rating =
									calculatePerformanceRating(tuning);
								const ratingClass = getRatingClass(rating);
								const ratingColor =
									{
										D: 'text-gray-400',
										C: 'text-green-400',
										B: 'text-blue-400',
										A: 'text-purple-400',
										S: 'text-yellow-400',
										R: 'text-red-500',
										X: 'text-pink-500',
									}[ratingClass] || 'text-gray-400';

								return (
									<div
										key={index}
										onClick={() =>
											setCurrentCarIndex(index)
										}
										className={`pixel-panel p-4 cursor-pointer transition-all relative overflow-hidden ${borderColor} ${
											index === currentCarIndex
												? 'bg-gray-800'
												: 'bg-black/40 hover:bg-gray-900'
										}`}
									>
										{/* Rarity Glow */}
										{(rarity === 'LEGENDARY' ||
											rarity === 'EXOTIC') && (
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
										{renderParticles(rarity)}

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
							items={userInventory.filter((i) => !i.equipped)}
							installedItems={userInventory.filter(
								(i) => i.equipped
							)}
							carName={garage[currentCarIndex]?.name}
							onEquip={onEquip}
							onRemove={onRemove}
							onSell={onSell}
							onDestroy={onDestroy}
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
									<span className="text-gray-500">COST</span>
									<span className="text-yellow-400 font-mono">
										${hoveredMod.cost.toLocaleString()}
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
												).toFixed(0)}{' '}
												HP
											</div>
											<div className="text-green-400">
												+
												{(
													previewTuning.maxTorque -
													effectiveTuning.maxTorque
												).toFixed(0)}{' '}
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
	);
};
