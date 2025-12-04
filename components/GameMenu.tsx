import DynoGraph from './menu/DynoGraph';
import DynoTab from './menu/DynoTab';
import UpgradesTab from './menu/UpgradesTab';
import TuningTab from './menu/TuningTab';
import {
	calculatePerformanceRating,
	getRatingClass,
} from '../utils/PerformanceRating';
import { calculateLevelProgress } from '../utils/progression';
import { useSound } from '../contexts/SoundContext';
import {
	DailyChallenge,
	GamePhase,
	Mission,
	ModNode,
	SavedTune,
	TuningState,
	JunkyardCar,
} from '../types';
import { MOD_TREE } from '../constants';
import MissionSelect from './menu/MissionSelect';
import Junkyard from './menu/Junkyard';
import VersusScreen from './menu/VersusScreen';
import SettingsModal from './menu/SettingsModal';
import { CarBuilder } from '../utils/CarBuilder';
import { CarGenerator } from '../utils/CarGenerator';
import { BASE_TUNING } from '../constants';
import React, { useState, useMemo, useEffect } from 'react';
import { ModTreeVisuals } from './menu/ModTreeVisuals';

const LevelBadge = ({ level }: { level: number }) => {
	let tierClass = 'border-gray-600 text-gray-400';
	let bgClass = 'bg-gray-800';
	let shadowClass = '';
	let wings = false;

	if (level >= 100) {
		tierClass = 'rarity-rainbow text-white border-transparent';
		bgClass = 'bg-black';
		wings = true;
	} else if (level >= 75) {
		tierClass = 'rarity-exotic text-pink-400 border-transparent';
		bgClass = 'bg-pink-950';
	} else if (level >= 50) {
		tierClass = 'rarity-legendary text-yellow-400 border-transparent';
		bgClass = 'bg-yellow-950';
	} else if (level >= 25) {
		tierClass =
			'border-blue-400 text-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]';
		bgClass = 'bg-blue-950';
	} else if (level >= 10) {
		tierClass =
			'border-orange-600 text-orange-400 shadow-[0_0_5px_rgba(234,88,12,0.3)]';
		bgClass = 'bg-orange-950';
	}

	return (
		<div className="relative flex items-center justify-center mr-10 group">
			{/* Wings for max level */}
			{wings && (
				<>
					<div className="absolute -left-8 top-1/2 -translate-y-1/2 w-8 h-12 bg-gradient-to-r from-transparent to-purple-500/20 clip-path-wing-left animate-pulse"></div>
					<div className="absolute -right-8 top-1/2 -translate-y-1/2 w-8 h-12 bg-gradient-to-l from-transparent to-purple-500/20 clip-path-wing-right animate-pulse"></div>
				</>
			)}

			<div
				className={`
                relative w-12 h-12 flex items-center justify-center 
                border-4 ${tierClass} ${bgClass} 
                transform rotate-45 transition-transform duration-300 group-hover:rotate-0
            `}
			>
				{/* Animated Border Fill for Level Up (Optional, requires more complex CSS or SVG) */}
				{/* For now, we rely on the tier class change */}

				<div className="transform -rotate-45 group-hover:rotate-0 transition-transform duration-300 flex flex-col items-center h-full w-full justify-center">
					<span className="text-[8px] uppercase tracking-widest opacity-70 mb-1">
						LVL
					</span>
					<div className="relative h-6 w-full text-center">
						<span
							key={level} // Key change triggers animation if we set it up, but here we use CSS animation class
							className={`${
								level >= 100 ? 'text-sm' : 'text-xl'
							} font-bold pixel-text leading-none block animate-slide-up-enter`}
						>
							{level}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
};

export const TopBar = ({
	level,
	xp,
	money,
	onBack,
	title,
	initialXp,
	initialMoney,
}: {
	level: number;
	xp: number;
	money: number;
	onBack?: () => void;
	title?: string;
	initialXp?: number;
	initialMoney?: number;
}) => {
	// --- State for Animations ---
	// Initialize with initial values if provided, otherwise current values
	const [displayLevel, setDisplayLevel] = useState(level);
	const [displayXp, setDisplayXp] = useState(initialXp ?? xp);
	const [displayMoney, setDisplayMoney] = useState(initialMoney ?? money);
	const [isLevelingUp, setIsLevelingUp] = useState(false);

	// Floating Text State
	const [xpGains, setXpGains] = useState<
		{ id: number; amount: number; key: number }[]
	>([]);
	const [moneyGains, setMoneyGains] = useState<
		{ id: number; amount: number; key: number }[]
	>([]);

	// Refs for previous values to detect changes
	// Initialize refs with the starting display values
	const prevLevelRef = React.useRef(level);
	const prevXpRef = React.useRef(initialXp ?? xp);
	const prevMoneyRef = React.useRef(initialMoney ?? money);

	// Effect to trigger animation from initial values to current values on mount
	useEffect(() => {
		if (initialXp !== undefined && initialXp !== xp) {
			// Small delay to ensure render happens first
			setTimeout(() => {
				setDisplayXp(xp);
				const gain = xp - initialXp;
				if (gain > 0) {
					const newGain = {
						id: Date.now(),
						amount: gain,
						key: Math.random(),
					};
					setXpGains((prev) => [...prev, newGain]);
					setTimeout(() => {
						setXpGains((prev) =>
							prev.filter((g) => g.id !== newGain.id)
						);
					}, 1500);
				}
			}, 2000); // 2000ms delay before animating
		}
	}, [initialXp, xp]);

	useEffect(() => {
		if (initialMoney !== undefined && initialMoney !== money) {
			setTimeout(() => {
				// Trigger money animation logic (handled by the main money effect below if we update state, but here we need to force it)
				// Actually, the main effect watches `money` prop.
				// But since we initialized `displayMoney` to `initialMoney`, we just need to update `displayMoney` to `money` smoothly.
				// The main effect compares `money` prop to `prevMoneyRef`.
				// `prevMoneyRef` is `initialMoney`. `money` is `money`. They differ.
				// So the main effect SHOULD fire.
				// However, the main effect runs on every render.
				// Let's rely on the main effect, but we need to ensure `prevMoneyRef` is set correctly.
				// It is set to `initialMoney`.
			}, 2000);
		}
	}, [initialMoney, money]);

	// --- XP and Level Logic ---
	useEffect(() => {
		// Level Up Detected
		if (level > prevLevelRef.current) {
			setIsLevelingUp(true);

			// 1. Fill bar to max (using PREVIOUS level's max)
			const { max: prevMax } = calculateLevelProgress(
				0,
				prevLevelRef.current
			); // XP doesn't matter for max
			setDisplayXp(prevMax);

			// 2. Wait for bar to fill, then change level number
			setTimeout(() => {
				setDisplayLevel(level);

				// 3. Reset bar to new XP (0 or overflow)
				setTimeout(() => {
					setIsLevelingUp(false);
					setDisplayXp(xp);
				}, 600); // Wait for level slide animation
			}, 500); // Wait for bar fill animation
		} else if (xp !== prevXpRef.current) {
			// Normal XP Gain
			// If we are animating from initialXp, we handled the gain text in the mount effect.
			// But we need to update displayXp.
			// If this is a subsequent update (not the initial one), we handle it here.
			// If it IS the initial update (triggered by the timeout above setting displayXp?), wait.
			// Actually, `setDisplayXp` triggers re-render.
			// We need to differentiate between "prop update" and "internal animation".

			// Simplified: Just watch props.
			if (!isLevelingUp) {
				setDisplayXp(xp);
			}

			// Add Floating Text (only if not handled by initial mount logic)
			// If initialXp was provided, we handled it there.
			// We can check if `prevXpRef.current` matches `initialXp` and we are just mounting?
			// No, simpler: Just check if we already added a gain for this?
			// Or just let this logic handle it if we update `prevXpRef` correctly.

			const gain = xp - prevXpRef.current;
			// Only show gain if it's a new update, NOT if it's the initial animation which we might have handled manually?
			// Actually, if we use the timeout to setDisplayXp, that doesn't change props.
			// This effect runs when `xp` PROP changes.
			// If `xp` prop is constant (e.g. on result screen), this effect runs once.
			// If `prevXpRef` was initialized to `initialXp`, then `xp !== prevXpRef` is true.
			// So this block runs.
			// So we don't need the separate `useEffect` for `initialXp` to trigger text?
			// We DO need the delay though.

			if (gain > 0) {
				// If we have a delay, we want to delay this text too.
				const delay = initialXp !== undefined ? 2000 : 0;
				setTimeout(() => {
					const newGain = {
						id: Date.now(),
						amount: gain,
						key: Math.random(),
					};
					setXpGains((prev) => [...prev, newGain]);
					setTimeout(() => {
						setXpGains((prev) =>
							prev.filter((g) => g.id !== newGain.id)
						);
					}, 1500);
				}, delay);
			}
		}

		prevLevelRef.current = level;
		prevXpRef.current = xp;
	}, [level, xp, isLevelingUp, initialXp]);

	// --- Money Logic ---
	useEffect(() => {
		if (money !== prevMoneyRef.current) {
			const diff = money - prevMoneyRef.current;
			const delay = initialMoney !== undefined ? 2000 : 0;

			setTimeout(() => {
				// Animate Counter
				const start = prevMoneyRef.current;
				const end = money;
				const duration = 1000;
				const startTime = performance.now();

				const animateMoney = (currentTime: number) => {
					const elapsed = currentTime - startTime;
					const progress = Math.min(elapsed / duration, 1);
					const ease = 1 - Math.pow(1 - progress, 4);

					const current = Math.floor(start + (end - start) * ease);
					setDisplayMoney(current);

					if (progress < 1) {
						requestAnimationFrame(animateMoney);
					}
				};
				requestAnimationFrame(animateMoney);

				// Add Floating Text
				if (diff !== 0) {
					const newGain = {
						id: Date.now(),
						amount: diff,
						key: Math.random(),
					};
					setMoneyGains((prev) => [...prev, newGain]);
					setTimeout(() => {
						setMoneyGains((prev) =>
							prev.filter((g) => g.id !== newGain.id)
						);
					}, 1500);
				}
			}, delay);
		}
		prevMoneyRef.current = money;
	}, [money, initialMoney]);

	// Calculate Progress based on DISPLAY values
	const { current, max, percentage } = calculateLevelProgress(
		displayXp,
		displayLevel
	);

	return (
		<div className="sticky top-0 left-0 right-0 h-16 bg-gray-900 border-b-4 border-gray-800 flex items-center px-4 z-[100] shadow-xl">
			{onBack && (
				<button
					onClick={onBack}
					className="mr-4 text-gray-400 hover:text-white text-xs pixel-text"
				>
					&lt; BACK
				</button>
			)}

			{/* Level Badge */}
			<div className="relative">
				<LevelBadge level={displayLevel} />
				{/* Level Up Animation Overlay (Optional, could be part of LevelBadge) */}
			</div>

			{/* XP Bar Container */}
			<div className="flex-1 flex flex-col justify-center mr-6 relative">
				<div className="flex justify-between text-[10px] text-gray-400 mb-1 font-mono">
					<span>XP</span>
					<span>
						{Math.floor(current)} / {max}
					</span>
				</div>
				<div className="h-3 bg-gray-800 border-2 border-gray-700 relative overflow-hidden skew-x-[-10deg]">
					{/* Fill */}
					<div
						className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-500 ease-out relative"
						style={{ width: `${percentage}%` }}
					>
						{/* Shine effect */}
						<div className="absolute inset-0 bg-white/20"></div>
					</div>
					{/* Grid lines */}
					<div className="absolute inset-0 flex justify-between px-1 pointer-events-none">
						{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
							<div
								key={i}
								className="w-[1px] h-full bg-black/20"
							></div>
						))}
					</div>
				</div>

				{/* Floating XP Text */}
				<div className="absolute top-8 left-0 pointer-events-none">
					{xpGains.map((gain) => (
						<div
							key={gain.key}
							className="absolute left-0 top-0 text-cyan-400 font-bold pixel-text text-sm animate-float-fade-up"
							style={{ textShadow: '1px 1px 0 #000' }}
						>
							+{gain.amount} XP
						</div>
					))}
				</div>
			</div>

			{/* Title (Optional) */}
			{title && (
				<div className="hidden lg:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xl text-white pixel-text opacity-50">
					{title}
				</div>
			)}

			{/* Money Display */}
			<div className="flex items-center ml-auto relative">
				<span className="text-green-400 text-xl font-bold pixel-text mr-1">
					$
				</span>
				<span className="text-white text-xl font-mono">
					{displayMoney.toLocaleString()}
				</span>

				{/* Floating Money Text */}
				<div className="absolute top-8 right-0 pointer-events-none">
					{moneyGains.map((gain) => (
						<div
							key={gain.key}
							className={`absolute right-0 top-0 font-bold pixel-text text-sm animate-float-fade-up ${
								gain.amount >= 0
									? 'text-green-400'
									: 'text-red-400'
							}`}
							style={{ textShadow: '1px 1px 0 #000' }}
						>
							{gain.amount >= 0 ? '+' : ''}
							{gain.amount.toLocaleString()}
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export const GameMenu = ({
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
}: {
	phase: GamePhase;
	setPhase: (p: GamePhase) => void;
	money: number;
	playerTuning: TuningState;
	effectiveTuning: TuningState;
	setPlayerTuning: React.Dispatch<React.SetStateAction<TuningState>>;
	ownedMods: string[];
	setOwnedMods: (mod: ModNode) => void;
	missions: Mission[];
	dailyChallenges: DailyChallenge[];
	onStartMission: (m: Mission) => void;
	onConfirmRace: (opponent: any) => void;
	selectedMission: Mission | null;
	disabledMods: string[];
	setDisabledMods: React.Dispatch<React.SetStateAction<string[]>>;
	modSettings: Record<string, Record<string, number>>;
	setModSettings: (settings: Record<string, Record<string, number>>) => void;
	onLoadTune: (tune: SavedTune) => void;
	weather: { type: 'SUNNY' | 'RAIN'; intensity: number };
	setWeather: (w: { type: 'SUNNY' | 'RAIN'; intensity: number }) => void;
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
	junkyardCars: JunkyardCar[];
	onBuyJunkyardCar: (car: JunkyardCar) => void;
	onRefreshJunkyard: () => void;
	onRestoreCar: (index: number) => void;
	missionSelectTab: 'CAMPAIGN' | 'UNDERGROUND' | 'DAILY';
	setMissionSelectTab: (tab: 'CAMPAIGN' | 'UNDERGROUND' | 'DAILY') => void;
	xp: number;
	level: number;
}) => {
	const { play } = useSound();
	const [activeTab, setActiveTab] = useState<
		'UPGRADES' | 'TUNING' | 'DYNO' | 'CARS'
	>('UPGRADES');
	const [hoveredMod, setHoveredMod] = React.useState<ModNode | null>(null);
	const [showSettings, setShowSettings] = useState(false);

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
	].includes(phase);

	if (isMenuPhase) {
		let onBack = undefined;

		if (phase === 'GARAGE') {
			onBack = () => setPhase('MAP');
		} else if (phase === 'MISSION_SELECT') {
			onBack = () => setPhase('MAP');
		} else if (phase === 'JUNKYARD') {
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
										borderColor: '#c2410c',
									}}
								>
									JUNKYARD
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
												setActiveTab('UPGRADES')
											}
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
												const tuning = {
													...BASE_TUNING,
													...car.manualTuning,
												};
												const rating =
													calculatePerformanceRating(
														tuning
													);
												const ratingClass =
													getRatingClass(rating);

												return (
													<div
														key={car.id + index}
														className={`pixel-panel p-4 cursor-pointer relative ${borderColor} ${
															index ===
															currentCarIndex
																? 'bg-indigo-900/20'
																: ''
														} group`}
														onClick={() =>
															setCurrentCarIndex(
																index
															)
														}
													>
														{renderParticles(
															rarity
														)}
														<div className="flex justify-between items-center mb-1">
															<span
																className={`pixel-text text-sm ${rarityColor}`}
															>
																{car.name}
															</span>
															<span className="text-[10px] bg-gray-800 px-1 rounded text-white border border-gray-600">
																{ratingClass}{' '}
																{rating}
															</span>
														</div>

														{/* Hover Stats Panel */}
														<div className="fixed left-[34%] top-1/2 -translate-y-1/2 w-64 bg-black border border-gray-800 p-4 rounded shadow-xl z-[100] pointer-events-none hidden group-hover:block">
															<div className="text-xs text-gray-400 mb-2 border-b border-gray-800 pb-1">
																PERFORMANCE
															</div>
															<div className="grid grid-cols-2 gap-2 text-[10px]">
																<div className="text-gray-500">
																	POWER
																</div>
																<div className="text-right text-white">
																	{(
																		(tuning.maxTorque *
																			tuning.redlineRPM) /
																		7023
																	).toFixed(
																		0
																	)}{' '}
																	HP
																</div>
																<div className="text-gray-500">
																	WEIGHT
																</div>
																<div className="text-right text-white">
																	{tuning.mass.toFixed(
																		0
																	)}{' '}
																	kg
																</div>
																<div className="text-gray-500">
																	GRIP
																</div>
																<div className="text-right text-white">
																	{tuning.tireGrip.toFixed(
																		2
																	)}
																</div>
																<div className="text-gray-500">
																	RATING
																</div>
																<div className="text-right text-yellow-500">
																	{rating}
																</div>
															</div>
														</div>

														<div className="flex justify-between items-end">
															{index ===
																currentCarIndex && (
																<span className="text-[10px] text-indigo-400 bg-indigo-900/50 px-2 py-1 rounded">
																	ACTIVE
																</span>
															)}
														</div>
														<div className="text-[10px] text-gray-500 mb-2">
															Mods:{' '}
															{
																car.ownedMods
																	.length
															}{' '}
															| Date:{' '}
															{new Date(
																car.date
															).toLocaleDateString()}
														</div>

														{/* Condition Bar */}
														<div className="mb-2">
															<div className="flex justify-between text-[10px] mb-1">
																<span className="text-gray-500">
																	Condition
																</span>
																<span
																	className={
																		(car.condition ||
																			1) >
																		0.7
																			? 'text-green-500'
																			: (car.condition ||
																					1) >
																			  0.4
																			? 'text-yellow-500'
																			: 'text-red-500'
																	}
																>
																	{(
																		(car.condition ||
																			1) *
																		100
																	).toFixed(
																		0
																	)}
																	%
																</span>
															</div>
															<div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden mb-2">
																<div
																	className={`h-full ${
																		(car.condition ||
																			1) >
																		0.7
																			? 'bg-green-500'
																			: (car.condition ||
																					1) >
																			  0.4
																			? 'bg-yellow-500'
																			: 'bg-red-500'
																	}`}
																	style={{
																		width: `${
																			(car.condition ||
																				1) *
																			100
																		}%`,
																	}}
																></div>
															</div>
															<div className="flex justify-between text-[10px]">
																<span className="text-gray-500">
																	Value
																</span>
																<span className="text-green-400">
																	$
																	{CarGenerator.calculateValue(
																		car
																	).toLocaleString()}
																</span>
															</div>
														</div>

														{(car.condition || 1) <
															1 && (
															<button
																onClick={(
																	e
																) => {
																	e.stopPropagation();
																	onRestoreCar(
																		index
																	);
																}}
																className="w-full pixel-btn bg-green-900/20 border-green-800 text-green-500 hover:bg-green-900/40 text-[10px] py-1"
															>
																RESTORE ($
																{Math.floor(
																	(1 -
																		(car.condition ||
																			1)) *
																		10000
																).toLocaleString()}
																)
															</button>
														)}
													</div>
												);
											})}
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
										mods={MOD_TREE.filter((m) => {
											if (!m.isSpecial) return true;
											// Special mods are visible if owned OR if their parent is owned (next upgrade step)
											// Root special mods (parentId=null) are only visible if owned (pre-installed on rare cars)
											if (ownedMods.includes(m.id))
												return true;
											if (
												m.parentId &&
												ownedMods.includes(m.parentId)
											)
												return true;
											return false;
										})}
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
										onHover={handleHover}
										disabledMods={disabledMods}
										onToggleDisable={handleToggleDisable}
									/>
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
