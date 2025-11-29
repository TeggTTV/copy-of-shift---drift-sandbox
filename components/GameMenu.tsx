import DynoGraph from './menu/DynoGraph';
import DynoTab from './menu/DynoTab';
import UpgradesTab from './menu/UpgradesTab';
import TuningTab from './menu/TuningTab';
import { ModTreeVisuals } from './menu/ModTreeVisuals';
import { useSound } from '../contexts/SoundContext';
import {
	DailyChallenge,
	GamePhase,
	Mission,
	ModNode,
	SavedTune,
	TuningState,
} from '../types';
import { MOD_TREE } from '../constants';
import MissionSelect from './menu/MissionSelect';
import VersusScreen from './menu/VersusScreen';
import React, { useState, useMemo, useEffect } from 'react';

const GameMenu = ({
	phase,
	setPhase,
	money,
	playerTuning,
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
	onBuyMods,
}: {
	phase: GamePhase;
	setPhase: (p: GamePhase) => void;
	money: number;
	playerTuning: TuningState;
	setPlayerTuning: React.Dispatch<React.SetStateAction<TuningState>>;
	ownedMods: string[];
	setOwnedMods: (mod: ModNode) => void;
	missions: Mission[];
	dailyChallenges: DailyChallenge[];
	onStartMission: (m: Mission) => void;
	onConfirmRace: (wager: number) => void;
	selectedMission: Mission | null;
	disabledMods: string[];
	setDisabledMods: React.Dispatch<React.SetStateAction<string[]>>;
	modSettings: Record<string, Record<string, number>>;
	setModSettings: React.Dispatch<
		React.SetStateAction<Record<string, Record<string, number>>>
	>;
	onLoadTune: (tune: SavedTune) => void;
	weather: { type: 'SUNNY' | 'RAIN'; intensity: number };
	setWeather: React.Dispatch<
		React.SetStateAction<{ type: 'SUNNY' | 'RAIN'; intensity: number }>
	>;
	showToast: (msg: string, type: any) => void;
	dynoHistory: { rpm: number; torque: number; hp: number }[];
	setDynoHistory: React.Dispatch<
		React.SetStateAction<{ rpm: number; torque: number; hp: number }[]>
	>;
	previousDynoHistory: { rpm: number; torque: number; hp: number }[];
	onDynoRunStart: () => void;
	garage: SavedTune[];
	currentCarIndex: number;
	setCurrentCarIndex: (index: number) => void;
	undergroundLevel: number;
	setUndergroundLevel: (level: number) => void;
	onBuyMods: (mods: ModNode[]) => void;
}) => {
	const { play } = useSound();
	const [activeTab, setActiveTab] = useState<
		'UPGRADES' | 'TUNING' | 'DYNO' | 'CARS'
	>('UPGRADES');
	const [hoveredMod, setHoveredMod] = React.useState<ModNode | null>(null);

	// Escape key navigation
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				if (
					phase === 'GARAGE' ||
					phase === 'MISSION_SELECT' ||
					phase === 'VERSUS'
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

		const preview = { ...playerTuning };

		Object.keys(hoveredMod.stats).forEach((key) => {
			const modValue = (hoveredMod.stats as any)[key];
			const currentValue = (preview as any)[key];

			if (
				typeof modValue === 'number' &&
				typeof currentValue === 'number'
			) {
				(preview as any)[key] = currentValue + modValue;
			} else {
				(preview as any)[key] = modValue;
			}
		});

		return preview;
	}, [playerTuning, hoveredMod]);

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
				playerTuning={playerTuning}
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
			/>
		);
	}

	if (phase === 'MAP') {
		return (
			<div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center text-white z-50 font-pixel">
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
							setWeather((prev) => ({
								type: prev.type === 'SUNNY' ? 'RAIN' : 'SUNNY',
								intensity: prev.type === 'SUNNY' ? 0.8 : 0,
							}));
							showToast(
								weather.type === 'SUNNY'
									? 'Weather set to RAIN'
									: 'Weather set to SUNNY',
								'INFO'
							);
						}}
						className="pixel-btn text-[10px] py-2 bg-black border-gray-600"
						style={{ backgroundColor: '#000' }}
					>
						WEATHER: {weather.type}
					</button>
				</div>
			</div>
		);
	}

	if (phase === 'MISSION_SELECT') {
		return (
			<MissionSelect
				missions={missions}
				dailyChallenges={dailyChallenges}
				onStartMission={onStartMission}
				onBack={() => {
					// play('back');
					setPhase('MAP');
				}}
				undergroundLevel={undergroundLevel}
			/>
		);
	}

	if (phase === 'GARAGE') {
		return (
			<div className="absolute inset-0 bg-neutral-900 flex flex-col items-center z-50 overflow-hidden font-pixel">
				<div className="w-full h-full flex flex-col">
					<div className="flex justify-between items-center p-6 border-b-4 border-gray-800 bg-black/50">
						<button
							onClick={() => {
								// play('back');
								setPhase('MAP');
							}}
							className="text-gray-400 hover:text-white text-xs"
						>
							&lt; BACK
						</button>
						<h2 className="text-xl md:text-2xl text-white pixel-text">
							MOD SHOP
						</h2>
						<div className="text-green-400 text-xl pixel-text">
							${money}
						</div>
					</div>

					<div className="flex-1 flex overflow-hidden">
						<div className="w-1/3 bg-black/30 p-6 border-r-4 border-gray-800 overflow-y-auto no-scrollbar">
							<h3 className="text-sm text-gray-300 mb-4 pixel-text">
								DYNO GRAPH
							</h3>
							<div className="h-[280px] w-full bg-black/50 mb-6 pixel-panel p-2">
								<DynoGraph
									tuning={playerTuning}
									previewTuning={previewTuning}
									liveData={dynoHistory}
									previousData={previousDynoHistory}
								/>
							</div>

							<div className="flex gap-2 mb-4">
								<button
									onClick={() => setActiveTab('UPGRADES')}
									className={`flex-1 py-3 text-[10px] pixel-btn ${
										activeTab === 'UPGRADES'
											? ''
											: 'bg-gray-700 opacity-50'
									}`}
									style={{
										backgroundColor:
											activeTab === 'UPGRADES'
												? undefined
												: '#374151',
									}}
								>
									Parts
								</button>
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
									Tune
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
									Dyno
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
									Cars
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
									playerTuning={playerTuning}
									onUpdateHistory={setDynoHistory}
									onRunStart={onDynoRunStart}
								/>
							) : (
								<div className="flex flex-col gap-4">
									{garage.map((car, index) => (
										<div
											key={car.id + index}
											className={`pixel-panel p-4 cursor-pointer ${
												index === currentCarIndex
													? 'border-indigo-500 bg-indigo-900/20'
													: 'hover:border-gray-500'
											}`}
											onClick={() =>
												setCurrentCarIndex(index)
											}
										>
											<div className="flex justify-between items-center mb-2">
												<span className="text-white pixel-text text-sm">
													{car.name}
												</span>
												{index === currentCarIndex && (
													<span className="text-[10px] text-indigo-400 bg-indigo-900/50 px-2 py-1 rounded">
														ACTIVE
													</span>
												)}
											</div>
											<div className="text-[10px] text-gray-500">
												Mods: {car.ownedMods.length} |
												Date:{' '}
												{new Date(
													car.date
												).toLocaleDateString()}
											</div>
										</div>
									))}
									{garage.length === 0 && (
										<div className="text-gray-500 text-center text-xs py-8">
											No cars in garage.
										</div>
									)}
								</div>
							)}
						</div>

						<div
							className="flex-1 relative bg-neutral-900 overflow-hidden cursor-grab active:cursor-grabbing p-10"
							style={{
								scrollbarWidth: 'none',
								msOverflowStyle: 'none',
							}}
						>
							<ModTreeVisuals
								mods={MOD_TREE}
								owned={ownedMods}
								money={money}
								onToggle={(mod) => {
									if (!garage[currentCarIndex]) {
										showToast(
											'No active car selected!',
											'ERROR'
										);
										return;
									}

									if (ownedMods.includes(mod.id)) {
										// play('click'); // Sell
									} else if (money >= mod.cost) {
										// play('purchase'); // Buy
									} else {
										// play('error');
									}
									setOwnedMods(mod);
								}}
								onHover={(m) => {
									setHoveredMod(m);
								}}
								disabledMods={disabledMods}
								onToggleDisable={handleToggleDisable}
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return null;
};

export default GameMenu;
