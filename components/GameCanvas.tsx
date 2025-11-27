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
} from '../types';
import { BASE_TUNING, CONTROLS, MISSIONS, MOD_TREE } from '../constants';
import Dashboard from './Dashboard';
import GameMenu from './GameMenu';
import { AudioEngine } from './AudioEngine';

const PPM = 40; // Pixels Per Meter - Visual Scale

const interpolateTorque = (
	rpm: number,
	curve: { rpm: number; factor: number }[]
): number => {
	const clampedRPM = Math.max(0, rpm);
	for (let i = 0; i < curve.length - 1; i++) {
		const p1 = curve[i];
		const p2 = curve[i + 1];
		if (clampedRPM >= p1.rpm && clampedRPM <= p2.rpm) {
			const t = (clampedRPM - p1.rpm) / (p2.rpm - p1.rpm);
			return p1.factor + t * (p2.factor - p1.factor);
		}
	}
	return curve[curve.length - 1]?.factor || 0.2;
};

type RaceStatus = 'IDLE' | 'COUNTDOWN' | 'RACING' | 'FINISHED';

const GameCanvas: React.FC = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	// Audio Refs
	const audioRef = useRef<AudioEngine>(new AudioEngine());
	const opponentAudioRef = useRef<AudioEngine>(new AudioEngine());
	const audioInitializedRef = useRef(false);

	// Game Persistence State
	const [money, setMoney] = useState(999999);
	const [phase, setPhase] = useState<GamePhase>('MAP');

	// New Inventory System (Array of owned Mod IDs)
	const [ownedMods, setOwnedMods] = useState<string[]>([]);
	// Missions state to track best times
	const [missions, setMissions] = useState<Mission[]>(MISSIONS);

	// Current Tuning (Calculated from Base + Mods)
	const [playerTuning, setPlayerTuning] = useState<TuningState>(BASE_TUNING);
	const tuningRef = useRef<TuningState>(BASE_TUNING);

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
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Audio Init on first interaction
			if (!audioInitializedRef.current) {
				audioRef.current.init();
				opponentAudioRef.current.init();
				audioInitializedRef.current = true;
			}

			if (phase !== 'RACE') return;

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
	useEffect(() => {
		if (phase !== 'RACE') {
			audioRef.current.stop();
			opponentAudioRef.current.stop();
		}
	}, [phase]);

	// --- Helpers ---
	// Helper to calculate base tuning from a set of mods
	const getTuningFromMods = useCallback((modIds: string[]) => {
		console.log('🛠️ getTuningFromMods called with:', modIds);
		let tuning: TuningState = JSON.parse(JSON.stringify(BASE_TUNING));
		console.log('📦 Starting with BASE_TUNING:', {
			maxTorque: BASE_TUNING.maxTorque,
			redlineRPM: BASE_TUNING.redlineRPM,
			mass: BASE_TUNING.mass,
		});

		MOD_TREE.forEach((mod) => {
			if (modIds.includes(mod.id)) {
				console.log(
					`✅ Applying mod: ${mod.name} (${mod.id})`,
					mod.stats
				);

				// For each stat in the mod, ADD it to the base instead of replacing
				Object.keys(mod.stats).forEach((key) => {
					const modValue = (mod.stats as any)[key];
					const currentValue = (tuning as any)[key];

					// If both are numbers, ADD them
					if (
						typeof modValue === 'number' &&
						typeof currentValue === 'number'
					) {
						(tuning as any)[key] = currentValue + modValue;
						console.log(
							`  ${key}: ${currentValue} + ${modValue} = ${
								(tuning as any)[key]
							}`
						);
					} else {
						// For non-numeric values (arrays, strings), replace
						(tuning as any)[key] = modValue;
						console.log(`  ${key}: replaced with`, modValue);
					}
				});
			}
		});

		console.log('🎯 Final tuning:', {
			maxTorque: tuning.maxTorque,
			redlineRPM: tuning.redlineRPM,
			mass: tuning.mass,
		});
		return tuning;
	}, []);

	// Sync ref
	useEffect(() => {
		tuningRef.current = playerTuning;
	}, [playerTuning]);

	// Recalculate playerTuning when owned mods change
	useEffect(() => {
		console.log('🔧 Recalculating tuning for mods:', ownedMods);
		const newTuning = getTuningFromMods(ownedMods);
		console.log('📊 New tuning calculated:', {
			maxTorque: newTuning.maxTorque,
			redlineRPM: newTuning.redlineRPM,
			mass: newTuning.mass,
			newTuning,
		});
		setPlayerTuning(newTuning);
	}, [ownedMods, getTuningFromMods]);

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

	// --- Physics Engine (1D) ---
	const updateCarPhysics = (
		car: CarState,
		t: TuningState,
		inputs: InputState,
		dt: number,
		isAI: boolean,
		audioEngine: AudioEngine,
		aiStats?: Opponent
	) => {
		const isLocked = raceStatus === 'COUNTDOWN';

		// 1. Shifting Logic
		if (isAI && aiStats && !isLocked) {
			if (car.gear === 0) {
				car.gear = 1;
			} else {
				const shiftThreshold = isAI
					? t.redlineRPM * (0.9 + aiStats.difficulty * 0.08)
					: 0;
				if (car.rpm > shiftThreshold && car.gear < 6) {
					car.gear++;
					car.rpm *= 0.7; // RPM drop simulation
					audioEngine.triggerShift(false);
				}
			}
		} else if (!isAI) {
			// Player Logic
			if (inputs.shiftUp && !shiftDebounce.current) {
				if (car.gear < 6) {
					car.gear++;
					if (car.gear > 1) car.rpm *= 0.65;
					audioEngine.triggerShift(false);
				}
				shiftDebounce.current = true;
			}
			if (inputs.shiftDown && !shiftDebounce.current) {
				if (car.gear > 0) {
					car.gear--;
					car.rpm *= 1.4;
					audioEngine.triggerShift(true);
				}
				shiftDebounce.current = true;
			}
			if (!inputs.shiftUp && !inputs.shiftDown) {
				shiftDebounce.current = false;
			}
		}

		// 2. Engine Physics
		const gearRatio = t.gearRatios[car.gear] || 0;
		const effectiveRatio = gearRatio * t.finalDriveRatio;
		const wheelRadius = 0.3;

		const wheelCirc = 2 * Math.PI * wheelRadius;

		// Connected RPM is what the engine RPM *would* be if fully engaged to wheels at this speed
		const connectedRPM = (car.velocity / wheelCirc) * 60 * effectiveRatio;

		const torqueCurveFactor = interpolateTorque(car.rpm, t.torqueCurve);
		let engineTorque =
			isAI || inputs.gas ? t.maxTorque * torqueCurveFactor : 0;

		// Rev Limiter
		if (car.rpm > t.redlineRPM) {
			engineTorque = 0;
			car.rpm = t.redlineRPM - 100;
			if (!isAI || Math.random() > 0.9) audioEngine.triggerLimiter();
		}

		let driveForce = 0;
		let load = 0;

		// Clutch / Coupling Logic
		if (car.gear > 0 && !isLocked) {
			driveForce = (engineTorque * effectiveRatio) / wheelRadius;

			// Smooth Launch / Clutch Slip Logic
			// Check if RPM is significantly higher than wheel speed in 1st gear (Launch)
			const slipThreshold = 500; // RPM delta to consider slipping

			if (car.gear === 1 && car.rpm > connectedRPM + slipThreshold) {
				// Clutch is slipping. The engine is spinning faster than the wheels.
				// We apply a "friction" drag to the RPM to pull it down towards connectedRPM,
				// but we allow gas to keep it somewhat high.

				const clutchFriction = 3.5; // Controls how fast RPM drops to match wheels
				const rpmDrag = (car.rpm - connectedRPM) * dt * clutchFriction;

				// Gas allows you to sustain RPM against the clutch friction
				const rpmBoost =
					isAI || inputs.gas
						? (t.maxTorque / t.flywheelMass) * dt * 0.8
						: 0;

				car.rpm = car.rpm + rpmBoost - rpmDrag;
				load = 1.0;
			} else {
				// Fully coupled - Engine locked to wheels
				const coupling = dt * 10.0;
				car.rpm = car.rpm + (connectedRPM - car.rpm) * coupling;
				load = inputs.gas ? 1.0 : 0.0;
			}
		} else {
			// Neutral / Clutch In
			if (isAI || inputs.gas) {
				car.rpm += (t.maxTorque / t.flywheelMass) * dt * 5;
				load = 0.5; // Revving freely
			} else {
				car.rpm -= 2000 * dt;
				load = 0;
			}
		}

		car.rpm = Math.max(t.idleRPM, car.rpm);

		// Forces
		if (isLocked) {
			car.velocity = 0;
		} else {
			const dragForce =
				0.5 *
				1.225 *
				car.velocity *
				car.velocity *
				t.dragCoefficient *
				2.0;
			const rollingRes = 150;
			const netForce = driveForce - dragForce - rollingRes;
			const accel = netForce / t.mass;

			car.velocity += accel * dt;
			if (car.velocity < 0) car.velocity = 0;

			car.y += car.velocity * dt;
		}

		// Update Audio (during countdown and racing, not in menus)
		if (
			!isLocked &&
			(raceStatus === 'COUNTDOWN' || raceStatus === 'RACING')
		) {
			audioEngine.update(car.rpm, load, 0);
		}

		// Ghost Recording
		if (!isAI && raceStatus === 'RACING') {
			const currentTime = performance.now() - raceStartTimeRef.current;
			currentGhostRecording.current.push({
				time: currentTime,
				y: car.y,
				velocity: car.velocity,
				rpm: car.rpm,
				gear: car.gear,
			});
		}
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
						audioRef.current
					);
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
				const drawCar = (
					car: CarState,
					color: string,
					xOffset: number,
					hasSpoiler: boolean = false
				) => {
					const y = -car.y * PPM;
					const w = 40;
					const h = 70;

					// Shadow
					ctx.fillStyle = 'rgba(0,0,0,0.5)';
					ctx.fillRect(xOffset - w / 2 + 5, y + 5, w, h);

					// Body
					ctx.fillStyle = color;
					ctx.fillRect(xOffset - w / 2, y, w, h);

					// Roof
					ctx.fillStyle = 'rgba(0,0,0,0.3)';
					ctx.fillRect(xOffset - w / 2 + 4, y + h / 2, w - 8, h / 3);

					// Lights
					ctx.fillStyle = '#fff9c4';
					ctx.fillRect(xOffset - w / 2 + 2, y + 2, 8, 5);
					ctx.fillRect(xOffset + w / 2 - 10, y + 2, 8, 5);

					ctx.fillStyle = '#ef4444';
					ctx.fillRect(xOffset - w / 2 + 2, y + h - 4, 8, 2);
					ctx.fillRect(xOffset + w / 2 - 10, y + h - 4, 8, 2);

					// Spoiler
					if (hasSpoiler) {
						ctx.fillStyle = color;
						// Wing
						ctx.fillRect(xOffset - w / 2 - 2, y + h - 15, w + 4, 8);
						// Struts
						ctx.fillStyle = '#111';
						ctx.fillRect(xOffset - w / 4, y + h - 10, 4, 6);
						ctx.fillRect(xOffset + w / 4 - 4, y + h - 10, 4, 6);
					} else {
						// Stock Spoiler
						ctx.fillStyle = 'rgba(0,0,0,0.2)';
						ctx.fillRect(xOffset - w / 2, y + h - 8, w, 4);
					}

					// Flames
					if (car.rpm > 6500 && Math.random() > 0.5) {
						ctx.fillStyle = '#f59e0b';
						ctx.fillRect(xOffset - 15, y + h, 10, 10);
						ctx.fillRect(xOffset + 5, y + h, 10, 10);
					}
				};

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

				drawCar(o, m.opponent.color, -trackWidth / 4);
				const hasSpoiler = ownedMods.some((id) =>
					id.includes('spoiler')
				);
				drawCar(p, tuningRef.current.color, trackWidth / 4, hasSpoiler);

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
				<GameMenu
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
				/>
			)}
		</div>
	);
};

export default GameCanvas;
