import React, { useState, useMemo, useEffect } from 'react';
import { GamePhase, Mission, ModNode, TuningState, SavedTune } from '../types';
import { MOD_TREE } from '../constants';
import MissionSelect from './menu/MissionSelect';
import VersusScreen from './menu/VersusScreen';
import UpgradesTab from './menu/UpgradesTab';
import TuningTab from './menu/TuningTab';
import DynoGraph from './menu/DynoGraph';
import { ModTreeVisuals } from './menu/ModTreeVisuals';
import { useSound } from '../contexts/SoundContext';

const GameMenu = ({
	phase,
	setPhase,
	money,
	playerTuning,
	setPlayerTuning,
	ownedMods,
	setOwnedMods,
	missions,
	onStartMission,
	onConfirmRace,
	selectedMission,
	disabledMods,
	setDisabledMods,
	modSettings,
	setModSettings,
	onLoadTune,
}: {
	phase: GamePhase;
	setPhase: (p: GamePhase) => void;
	money: number;
	playerTuning: TuningState;
	setPlayerTuning: React.Dispatch<React.SetStateAction<TuningState>>;
	ownedMods: string[];
	setOwnedMods: (mod: ModNode) => void;
	missions: Mission[];
	onStartMission: (m: Mission) => void;
	onConfirmRace?: () => void;
	selectedMission?: Mission | null;
	disabledMods: string[];
	setDisabledMods: React.Dispatch<React.SetStateAction<string[]>>;
	modSettings: Record<string, Record<string, number>>;
	setModSettings: React.Dispatch<
		React.SetStateAction<Record<string, Record<string, number>>>
	>;
	onLoadTune: (tune: SavedTune) => void;
}) => {
	const { play } = useSound();
	const [activeTab, setActiveTab] = useState<'UPGRADES' | 'TUNING'>(
		'UPGRADES'
	);
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
				onConfirmRace={() => {
					// play('confirm');
					if (onConfirmRace) onConfirmRace();
				}}
				onBack={() => {
					// play('back');
					setPhase('MAP');
				}}
				ownedMods={ownedMods}
			/>
		);
	}

	if (phase === 'MAP') {
		return (
			<div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center text-white z-50">
				<h1 className="text-6xl font-black italic tracking-tighter text-indigo-500 mb-2">
					Drag
				</h1>
				<p className="text-gray-400 mb-12 font-mono">
					VERTICAL DRAG RACING SIMULATOR
				</p>

				<div className="flex flex-col gap-4 w-64">
					<button
						onClick={() => {
							// play('click');
							setPhase('MISSION_SELECT');
						}}
						className="py-4 bg-white text-black font-bold text-xl hover:bg-indigo-400 hover:scale-105 transition-all skew-x-[-10deg]"
					>
						RACE
					</button>
					<button
						onClick={() => {
							// play('click');
							setPhase('GARAGE');
						}}
						className="py-4 bg-gray-800 text-white font-bold text-xl border border-gray-700 hover:border-indigo-500 hover:text-indigo-400 transition-all skew-x-[-10deg]"
					>
						GARAGE
					</button>
				</div>
			</div>
		);
	}

	if (phase === 'MISSION_SELECT') {
		return (
			<MissionSelect
				missions={missions}
				money={money}
				onStartMission={(m) => {
					// play('confirm');
					onStartMission(m);
				}}
				setPhase={(p) => {
					// if (p === 'MAP') play('back');
					// else play('click');
					setPhase(p);
				}}
			/>
		);
	}

	if (phase === 'GARAGE') {
		return (
			<div className="absolute inset-0 bg-neutral-900 flex flex-col items-center z-50 overflow-hidden">
				<div className="w-full h-full flex flex-col">
					<div className="flex justify-between items-center p-6 border-b border-gray-800 bg-black/50">
						<button
							onClick={() => {
								// play('back');
								setPhase('MAP');
							}}
							className="text-gray-400 hover:text-white"
						>
							&larr; BACK
						</button>
						<h2 className="text-3xl font-bold italic">
							MODIFICATION SHOP
						</h2>
						<div className="font-mono text-green-400 text-2xl">
							${money}
						</div>
					</div>

					<div className="flex-1 flex overflow-hidden">
						<div className="w-1/3 bg-black/30 p-6 border-r border-gray-800 overflow-y-auto">
							<h3 className="text-xl font-bold text-gray-300 mb-4">
								DYNO GRAPH
							</h3>
							<div className="h-[280px] w-full bg-black/50 rounded mb-6 border border-gray-800 p-4">
								<DynoGraph
									tuning={playerTuning}
									previewTuning={previewTuning}
								/>
							</div>

							<div className="flex gap-2 mb-4">
								<button
									onClick={() => {
										// play('click');
										setActiveTab('UPGRADES');
									}}
									className={`flex-1 py-2 font-bold text-sm uppercase tracking-wider transition-all ${
										activeTab === 'UPGRADES'
											? 'bg-indigo-600 text-white'
											: 'bg-gray-800 text-gray-400 hover:bg-gray-700'
									}`}
								>
									Upgrades
								</button>
								<button
									onClick={() => {
										// play('click');
										setActiveTab('TUNING');
									}}
									className={`flex-1 py-2 font-bold text-sm uppercase tracking-wider transition-all ${
										activeTab === 'TUNING'
											? 'bg-indigo-600 text-white'
											: 'bg-gray-800 text-gray-400 hover:bg-gray-700'
									}`}
								>
									Tuning
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
							) : (
								<TuningTab
									ownedMods={ownedMods}
									disabledMods={disabledMods}
									modSettings={modSettings}
									setModSettings={setModSettings}
									playerTuning={playerTuning}
									setPlayerTuning={setPlayerTuning}
									onLoadTune={onLoadTune}
								/>
							)}
						</div>

						<div
							className="flex-1 relative bg-neutral-900 overflow-auto cursor-grab active:cursor-grabbing p-10"
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
