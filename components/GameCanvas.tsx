import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
	CarState,
	InputState,
	TuningState,
	GamePhase,
	Mission,
	Opponent,
	ModNode,
	GhostFrame,
	SavedTune,
} from '../types';
import { BASE_TUNING, CONTROLS, MISSIONS, MOD_TREE } from '../constants';
import Dashboard from './Dashboard';
import GameMenu from './GameMenu';
import { AudioEngine } from './AudioEngine';
import { interpolateTorque, updateCarPhysics } from '../utils/physics';
import { drawCar } from '../utils/renderUtils';
import { useGamePersistence } from '../hooks/useGamePersistence';
import { SoundProvider } from '../contexts/SoundContext';

const PPM = 40; // Pixels Per Meter - Visual Scale

type RaceStatus = 'IDLE' | 'COUNTDOWN' | 'RACING' | 'FINISHED';

const GameCanvas: React.FC = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	// Audio Refs
	const audioRef = useRef<AudioEngine>(new AudioEngine());
	const opponentAudioRef = useRef<AudioEngine>(new AudioEngine());
	const audioInitializedRef = useRef(false);

	// Game Persistence State
	const [money, setMoney] = useState(0);
	const [phase, setPhase] = useState<GamePhase>('MAP');

	// New Inventory System (Array of owned Mod IDs)
	const [ownedMods, setOwnedMods] = useState<string[]>([]);
	const [disabledMods, setDisabledMods] = useState<string[]>([]);
	const [modSettings, setModSettings] = useState<
		Record<string, Record<string, number>>
	>({});
	// Missions state to track best times
	const [missions, setMissions] = useState<Mission[]>(MISSIONS);

	// Current Tuning (Calculated from Base + Mods)
	const [playerTuning, setPlayerTuning] = useState<TuningState>(() => {
		const saved = localStorage.getItem('shift_drift_manual_tuning');
		if (saved) {
			try {
				const manual = JSON.parse(saved);
				return {
					...BASE_TUNING,
					...manual,
				};
			} catch (e) {
				console.error('Failed to parse saved manual tuning', e);
			}
		}
		return BASE_TUNING;
	});
	const tuningRef = useRef<TuningState>(BASE_TUNING);

	// Persistence Hook
	useGamePersistence(
		money,
		setMoney,
		ownedMods,
		setOwnedMods,
		disabledMods,
		setDisabledMods,
		modSettings,
		setModSettings,
		missions,
		setMissions,
		playerTuning,
		setPlayerTuning
	);

	// Current Mission
	const missionRef = useRef<Mission | null>(null);

	// Ghost Racing Refs
	const currentGhostRecording = useRef<GhostFrame[]>([]);
	const activeGhost = useRef<GhostFrame[] | null>(null);

	// Race Logic State
	const [raceStatus, setRaceStatus] = useState<RaceStatus>('IDLE');
	const raceStartTimeRef = useRef<number>(0);
	const countdownStartRef = useRef<number>(0);

	// Physics States
	const playerRef = useRef<CarState>({
		y: 0,
		velocity: 0,
		rpm: 1000,
		gear: 0,
		finished: false,
		finishTime: 0,
	});

	const opponentRef = useRef<CarState>({
		y: 0,
		velocity: 0,
		rpm: 1000,
		gear: 0,
		finished: false,
		finishTime: 0,
	});

	const inputsRef = useRef<InputState>({
		gas: false,
		shiftUp: false,
		shiftDown: false,
		clutch: false,
	});

	// Logic Refs
	const shiftDebounce = useRef(false);
	const lastTimeRef = useRef<number>(0);

	// State for React UI
	const [uiState, setUiState] = useState<{
		player: CarState;
		opponent: CarState;
	}>({
		player: playerRef.current,
		opponent: opponentRef.current,
	});
	const [raceResult, setRaceResult] = useState<'WIN' | 'LOSS' | null>(null);
	const [playerFinishTime, setPlayerFinishTime] = useState<number>(0);
	const [opponentFinishTime, setOpponentFinishTime] = useState<number>(0);
	const [countdownNum, setCountdownNum] = useState<number | string>('');

	// --- Input Handling ---
	// Track which keys are currently pressed to prevent repeat firing
	const keysPressed = useRef<Set<string>>(new Set());

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Audio Init on first interaction
			if (!audioInitializedRef.current) {
				audioRef.current.init();
				opponentAudioRef.current.init();
				audioInitializedRef.current = true;
			}

			if (phase !== 'RACE') return;

			// Prevent repeated keydown events when key is held
			if (keysPressed.current.has(e.key)) return;
			keysPressed.current.add(e.key);

			switch (e.key) {
				case CONTROLS.GAS:
					inputsRef.current.gas = true;
					break;
				case CONTROLS.SHIFT_UP:
					inputsRef.current.shiftUp = true;
					break;
				case CONTROLS.SHIFT_DOWN:
					inputsRef.current.shiftDown = true;
					break;
			}
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			// Remove from pressed keys set
			keysPressed.current.delete(e.key);

			switch (e.key) {
				case CONTROLS.GAS:
					inputsRef.current.gas = false;
					break;
				case CONTROLS.SHIFT_UP:
					inputsRef.current.shiftUp = false;
					break;
				case CONTROLS.SHIFT_DOWN:
					inputsRef.current.shiftDown = false;
					break;
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
		};
	}, [phase]);

	// Stop audio when leaving race phase
	// Stop audio when leaving race phase
	useEffect(() => {
		if (phase !== 'RACE') {
			audioRef.current.stop();
			opponentAudioRef.current.stop();
		} else {
			audioRef.current.start();
			opponentAudioRef.current.start();
		}
	}, [phase]);

	// --- Helpers ---
	// Helper to calculate base tuning from a set of mods
	const getTuningFromMods = useCallback(
		(
			modIds: string[],
			disabled: string[],
			settings: Record<string, Record<string, number>>
		) => {
			let tuning: TuningState = JSON.parse(JSON.stringify(BASE_TUNING));

			MOD_TREE.forEach((mod) => {
				if (modIds.includes(mod.id) && !disabled.includes(mod.id)) {
					Object.keys(mod.stats).forEach((key) => {
						const modValue = (mod.stats as any)[key];
						const currentValue = (tuning as any)[key];

						// If both are numbers, ADD them
						if (
							typeof modValue === 'number' &&
							typeof currentValue === 'number'
						) {
							(tuning as any)[key] = currentValue + modValue;
						} else {
							(tuning as any)[key] = modValue;
						}
					});

					if (mod.tuningOptions && settings[mod.id]) {
						mod.tuningOptions.forEach((option) => {
							const userValue = settings[mod.id][option.id];
							if (userValue !== undefined) {
								if (option.statAffected) {
									(tuning as any)[option.statAffected] =
										userValue;
								} else if (option.id === 'boost_pressure') {
									const deltaBar =
										userValue - option.defaultValue;
									tuning.maxTorque += deltaBar * 100;
									// Also affect turbo intensity
									tuning.turboIntensity = Math.min(
										1.0,
										tuning.turboIntensity + deltaBar * 0.2
									);
								} else if (option.id === 'tire_pressure') {
									// Tire Pressure Logic: Lower = More Grip, More Drag
									// Default 30 PSI.
									const deltaPsi = 30 - userValue; // Positive if under-inflated
									tuning.tireGrip += deltaPsi * 0.01;
									tuning.dragCoefficient += deltaPsi * 0.002;
								}
							}
						});
					}

					if (mod.soundProfile) {
						// We need to store this somewhere, maybe in tuning state?
						// For now let's assume AudioEngine reads it from tuning or we pass it separately
						// But wait, AudioEngine config is set in confirmStartRace using tuning props.
						// So we need to map soundProfile to tuning props if possible, or add soundProfile to TuningState.
						// Let's check TuningState... it has exhaustOpenness, backfireAggression, turboIntensity.
						// The soundProfile string itself isn't in TuningState.
						// We should probably rely on the stats provided by the sound mod (exhaustOpenness etc)
						// which are already applied above.

						// For now, let's just log it.
						console.log('Sound profile:', mod.soundProfile);
					}
				}
			});

			return tuning;
		},
		[]
	);

	// Sync ref
	useEffect(() => {
		tuningRef.current = playerTuning;
	}, [playerTuning]);

	// Recalculate playerTuning when owned mods change
	const pendingTuningRef = useRef<Partial<TuningState> | null>(null);

	useEffect(() => {
		console.log('🔧 Recalculating tuning for mods:', ownedMods);

		// Preserve manual tuning parameters before recalculating
		const manualParams = {
			finalDriveRatio: playerTuning.finalDriveRatio,
			gearRatios: playerTuning.gearRatios,
			torqueCurve: playerTuning.torqueCurve,
		};

		const newTuning = getTuningFromMods(
			ownedMods,
			disabledMods,
			modSettings
		);

		// If we have pending manual tuning (from loading a preset), apply it
		if (pendingTuningRef.current) {
			Object.assign(newTuning, pendingTuningRef.current);
			pendingTuningRef.current = null;
		} else {
			// Restore manual tuning parameters (unless this is the first load)
			if (playerTuning.maxTorque !== 0) {
				newTuning.finalDriveRatio = manualParams.finalDriveRatio;
				newTuning.gearRatios = manualParams.gearRatios;
				newTuning.torqueCurve = manualParams.torqueCurve;
			}
		}

		setPlayerTuning(newTuning);
	}, [
		ownedMods,
		disabledMods,
		modSettings,
		getTuningFromMods,
		playerTuning.finalDriveRatio,
		playerTuning.gearRatios,
		playerTuning.torqueCurve,
	]);

	const handleLoadTune = useCallback(
		(tune: SavedTune) => {
			pendingTuningRef.current = tune.manualTuning;
			setOwnedMods(tune.ownedMods);
			setDisabledMods(tune.disabledMods);
			setModSettings(tune.modSettings);
		},
		[setOwnedMods, setDisabledMods, setModSettings]
	);

	const toggleMod = useCallback(
		(mod: ModNode) => {
			const isOwned = ownedMods.includes(mod.id);
			let newOwnedMods = [...ownedMods];

			if (!isOwned) {
				// Buy
				if (money >= mod.cost) {
					setMoney((m) => m - mod.cost);
					newOwnedMods.push(mod.id);
				} else {
					return; // Cannot afford
				}
			} else {
				// Sell
				const hasOwnedChildren = MOD_TREE.some(
					(m) => m.parentId === mod.id && ownedMods.includes(m.id)
				);
				if (hasOwnedChildren) {
					alert('Cannot sell: Dependent parts installed.');
					return;
				}
				setMoney((m) => m + Math.floor(mod.cost * 0.5));
				newOwnedMods = newOwnedMods.filter((id) => id !== mod.id);
			}

			// Update owned mods - useEffect will handle tuning recalculation
			setOwnedMods(newOwnedMods);
		},
		[money, ownedMods]
	);

	const startMission = (mission: Mission) => {
		missionRef.current = mission;
		setPhase('VERSUS');
	};

	const confirmStartRace = () => {
		const mission = missionRef.current;
		if (!mission) return;

		// Reset Cars
		playerRef.current = {
			y: 0,
			velocity: 0,
			rpm: 1000,
			gear: 0,
			finished: false,
			finishTime: 0,
		};
		opponentRef.current = {
			y: 0,
			velocity: 0,
			rpm: 1000,
			gear: 0,
			finished: false,
			finishTime: 0,
		};

		raceStartTimeRef.current = 0;
		setRaceResult(null);
		setPlayerFinishTime(0);
		setOpponentFinishTime(0);

		// Reset Ghost Racing
		currentGhostRecording.current = [];
		activeGhost.current = mission.bestGhost || null;

		// Stop any existing audio
		audioRef.current.stop();
		opponentAudioRef.current.stop();

		// Reset Audio Config (but don't start playing yet)
		audioRef.current.setConfiguration(
			playerTuning.cylinders,
			playerTuning.exhaustOpenness,
			playerTuning.backfireAggression,
			playerTuning.turboIntensity
		);
		audioRef.current.setVolume(0); // Start muted
		// Reset spatial
		audioRef.current.setSpatial(0, 0, 0);

		opponentAudioRef.current.setConfiguration(
			mission.opponent.tuning.cylinders,
			mission.opponent.tuning.exhaustOpenness,
			mission.opponent.tuning.backfireAggression,
			mission.opponent.tuning.turboIntensity
		);
		opponentAudioRef.current.setVolume(0); // Start muted
		opponentAudioRef.current.setSpatial(0, 0, 0.5); // Opponent slightly right

		// Start Countdown
		setPhase('RACE');
		setRaceStatus('COUNTDOWN');
		setCountdownNum(3);
		countdownStartRef.current = performance.now();
	};

	// --- Main Loop ---
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		let animId: number;
		lastTimeRef.current = performance.now();

		const render = (time: number) => {
			const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
			lastTimeRef.current = time;

			if (phase === 'RACE' && missionRef.current) {
				const p = playerRef.current;
				const o = opponentRef.current;
				const m = missionRef.current;

				// Countdown Logic
				if (raceStatus === 'COUNTDOWN') {
					const elapsed = time - countdownStartRef.current;
					const remaining = 3000 - elapsed;
					if (remaining <= 0) {
						setRaceStatus('RACING');
						setCountdownNum('GO!');
						raceStartTimeRef.current = time;
						setTimeout(() => setCountdownNum(''), 1000);

						// Unmute audio when race actually starts
						audioRef.current.setVolume(0.4);
						opponentAudioRef.current.setVolume(0.4);
					} else {
						setCountdownNum(Math.ceil(remaining / 1000));
					}
				}

				// Update Physics
				if (!p.finished) {
					updateCarPhysics(
						p,
						tuningRef.current,
						inputsRef.current,
						dt,
						false,
						audioRef.current,
						raceStatus,
						raceStartTimeRef.current,
						currentGhostRecording
					);

					// Reset shift inputs after processing (they should only trigger once per key press)
					inputsRef.current.shiftUp = false;
					inputsRef.current.shiftDown = false;

					if (p.y >= m.distance) {
						p.finished = true;
						p.finishTime = (time - raceStartTimeRef.current) / 1000;
						setPlayerFinishTime(p.finishTime);
					}
				} else {
					audioRef.current.setVolume(0);
				}

				if (!o.finished) {
					updateCarPhysics(
						o,
						m.opponent.tuning,
						{
							gas: true,
							shiftUp: false,
							shiftDown: false,
							clutch: false,
						},
						dt,
						true,
						opponentAudioRef.current,
						raceStatus,
						raceStartTimeRef.current,
						undefined,
						m.opponent
					);
					if (o.y >= m.distance) {
						o.finished = true;
						o.finishTime = (time - raceStartTimeRef.current) / 1000;
					}
				} else {
					opponentAudioRef.current.setVolume(0);
				}

				// --- Audio Spatialization ---
				if (raceStatus === 'RACING') {
					const distance = o.y - p.y; // Positive if opponent ahead
					const relVel = o.velocity - p.velocity;

					// Player audio is static center
					// Opponent audio moves
					opponentAudioRef.current.setSpatial(distance, relVel, 0.5); // Pan slightly right
				}

				// Check Win Condition
				if (raceStatus === 'RACING' && (p.finished || o.finished)) {
					if (
						p.finished &&
						(!o.finished || p.finishTime < o.finishTime)
					) {
						setRaceResult('WIN');
						setRaceStatus('FINISHED');
						setMoney((prev) => prev + m.payout);

						// Update Best Time
						const currentMissions = [...missions];
						const missionIndex = currentMissions.findIndex(
							(mis) => mis.id === m.id
						);
						if (missionIndex !== -1) {
							const oldBest =
								currentMissions[missionIndex].bestTime;
							if (!oldBest || p.finishTime < oldBest) {
								currentMissions[missionIndex].bestTime =
									p.finishTime;
								// Save Ghost Data
								currentMissions[missionIndex].bestGhost = [
									...currentGhostRecording.current,
								];
								setMissions(currentMissions);
							}
						}

						audioRef.current.stop();
						opponentAudioRef.current.stop();
					} else if (
						o.finished &&
						(!p.finished || o.finishTime < p.finishTime)
					) {
						setRaceResult('LOSS');
						setRaceStatus('FINISHED');
						audioRef.current.stop();
						opponentAudioRef.current.stop();
					}
				}

				// Update finish times for UI
				if (p.finished && playerFinishTime === 0) {
					setPlayerFinishTime(p.finishTime);
				}
				if (o.finished && opponentFinishTime === 0) {
					setOpponentFinishTime(o.finishTime);
				}

				// --- DRAWING ---

				const carVisualY = -p.y * PPM;
				const screenOffset = canvas.height * 0.75; // Player sits 75% down the screen

				const camTransY = screenOffset + p.y * PPM;

				ctx.fillStyle = '#1e1e1e';
				ctx.fillRect(0, 0, canvas.width, canvas.height);

				ctx.save();

				ctx.translate(canvas.width / 2, 0);
				ctx.translate(0, camTransY);

				const trackWidth = 300;

				// Draw Track
				const finishVisualY = -m.distance * PPM;
				const trackStartVisualY = 200 * PPM;
				const trackEndVisualY = finishVisualY - 500 * PPM;

				const totalHeight = trackStartVisualY - trackEndVisualY;

				// Grass
				ctx.fillStyle = '#14532d';
				ctx.fillRect(
					-trackWidth / 2 - 40,
					trackEndVisualY,
					trackWidth + 80,
					totalHeight
				);

				// Asphalt
				ctx.fillStyle = '#333';
				ctx.fillRect(
					-trackWidth / 2,
					trackEndVisualY,
					trackWidth,
					totalHeight
				);

				// Start Line
				const checkSize = 20;
				for (let r = 0; r < 2; r++) {
					for (let c = 0; c < trackWidth / checkSize; c++) {
						ctx.fillStyle = (r + c) % 2 === 0 ? '#fff' : '#000';
						ctx.fillRect(
							-trackWidth / 2 + c * checkSize,
							-r * checkSize,
							checkSize,
							checkSize
						);
					}
				}

				// Finish Line
				for (let r = 0; r < 3; r++) {
					for (let c = 0; c < trackWidth / checkSize; c++) {
						ctx.fillStyle = (r + c) % 2 === 0 ? '#fff' : '#000';
						ctx.fillRect(
							-trackWidth / 2 + c * checkSize,
							finishVisualY + r * checkSize,
							checkSize,
							checkSize
						);
					}
				}

				// Lane Lines
				ctx.beginPath();
				ctx.strokeStyle = '#555';
				ctx.lineWidth = 4;
				ctx.setLineDash([40, 40]);
				ctx.moveTo(0, trackStartVisualY);
				ctx.lineTo(0, trackEndVisualY);
				ctx.stroke();
				ctx.setLineDash([]);

				// Draw Cars
				drawCar(ctx, o, m.opponent.color, -trackWidth / 4);
				const hasSpoiler = ownedMods.some((id) =>
					id.includes('spoiler')
				);
				drawCar(
					ctx,
					p,
					tuningRef.current.color,
					trackWidth / 4,
					hasSpoiler
				);

				// Draw Ghost
				if (activeGhost.current && raceStatus === 'RACING') {
					const raceTime = time - raceStartTimeRef.current;
					// Find frame with closest time
					const ghostFrame = activeGhost.current.find(
						(f) => f.time >= raceTime
					);

					if (ghostFrame) {
						ctx.globalAlpha = 0.3;
						drawCar(
							ctx,
							{
								y: ghostFrame.y,
								velocity: ghostFrame.velocity,
								rpm: ghostFrame.rpm,
								gear: ghostFrame.gear,
								finished: false,
								finishTime: 0,
							},
							'#ffffff', // Ghost color
							trackWidth / 4 // Same lane as player
						);
						ctx.globalAlpha = 1.0;
					}
				}

				ctx.restore();

				setUiState({ player: { ...p }, opponent: { ...o } });
			} else {
				// Menu Background renderer
				ctx.fillStyle = '#111';
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				ctx.strokeStyle = '#222';
				ctx.lineWidth = 2;
				const timeOffset = (time / 50) % 50;
				for (let i = 0; i < canvas.height; i += 50) {
					ctx.beginPath();
					ctx.moveTo(0, i + timeOffset);
					ctx.lineTo(canvas.width, i + timeOffset);
					ctx.stroke();
				}
			}

			animId = requestAnimationFrame(render);
		};

		animId = requestAnimationFrame(render);
		return () => cancelAnimationFrame(animId);
	}, [phase, raceStatus, missions]);

	return (
		<div className="relative w-full h-full bg-black overflow-hidden font-sans select-none">
			<canvas
				ref={canvasRef}
				width={window.innerWidth}
				height={window.innerHeight}
				className="block"
			/>

			{/* HUD only in Race */}
			{phase === 'RACE' && missionRef.current && (
				<>
					<Dashboard
						carState={uiState.player}
						tuning={playerTuning}
						opponentState={uiState.opponent}
						raceDistance={missionRef.current.distance}
					/>
					{/* Countdown Overlay */}
					{countdownNum !== '' && (
						<div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
							<div
								className={`text-9xl font-black italic tracking-tighter ${
									countdownNum === 'GO!'
										? 'text-green-500 scale-150'
										: 'text-white'
								} transition-all duration-300 drop-shadow-2xl`}
							>
								{countdownNum}
							</div>
						</div>
					)}
				</>
			)}

			{/* Race Results Overlay */}
			{phase === 'RACE' && raceResult && (
				<div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-[100] animate-in fade-in duration-500">
					<h1
						className={`text-8xl font-black italic mb-4 ${
							raceResult === 'WIN'
								? 'text-green-500'
								: 'text-red-500'
						}`}
					>
						{raceResult === 'WIN' ? 'VICTORY' : 'DEFEAT'}
					</h1>
					<div className="text-4xl font-mono text-white mb-2">
						TIME: {playerFinishTime.toFixed(3)}s
					</div>
					{raceResult === 'WIN' && (
						<div className="text-2xl text-green-400 font-mono mb-8">
							EARNED ${missionRef.current?.payout}
						</div>
					)}
					{raceResult === 'LOSS' && (
						<div className="text-2xl text-red-400 font-mono mb-8">
							+
							{(playerFinishTime - opponentFinishTime).toFixed(3)}
							s
						</div>
					)}
					<div className="flex gap-4 mt-8">
						<button
							onClick={() => startMission(missionRef.current!)}
							className="px-8 py-4 bg-white text-black font-bold text-xl hover:bg-gray-200 uppercase"
						>
							{raceResult === 'WIN' ? 'Race Again' : 'Retry'}
						</button>
						<button
							onClick={() => {
								audioRef.current.stop();
								opponentAudioRef.current.stop();
								setPhase('MISSION_SELECT');
							}}
							className="px-8 py-4 bg-gray-800 text-white font-bold text-xl hover:bg-gray-700 uppercase"
						>
							Back to Menu
						</button>
					</div>
				</div>
			)}

			{/* Menu UI */}
			{(phase === 'MENU' ||
				phase === 'GARAGE' ||
				phase === 'MAP' ||
				phase === 'MISSION_SELECT' ||
				phase === 'VERSUS') && (
				<SoundProvider
					play={(type) => audioRef.current.playUISound(type)}
				>
					<GameMenu
						onLoadTune={handleLoadTune}
						phase={phase}
						setPhase={setPhase}
						money={money}
						playerTuning={playerTuning}
						setPlayerTuning={setPlayerTuning}
						ownedMods={ownedMods}
						setOwnedMods={toggleMod}
						missions={missions}
						onStartMission={startMission}
						onConfirmRace={confirmStartRace}
						selectedMission={missionRef.current}
						disabledMods={disabledMods}
						setDisabledMods={setDisabledMods}
						modSettings={modSettings}
						setModSettings={setModSettings}
					/>
				</SoundProvider>
			)}
		</div>
	);
};

export default GameCanvas;
