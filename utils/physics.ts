import { CarState, TuningState, InputState, Opponent } from '../types';
import { AudioEngine } from '../components/AudioEngine';

export const interpolateTorque = (
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

export const updateCarPhysics = (
	car: CarState,
	t: TuningState,
	inputs: InputState,
	dt: number,
	isAI: boolean,
	audioEngine: AudioEngine,
	raceStatus: string,
	raceStartTime: number,
	currentGhostRecording?: { current: any[] },
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
		// Note: shiftDebounce logic needs to be handled outside or passed in as state
		// For now, we assume inputs already handle debounce or we pass a ref-like object if needed.
		// Actually, the original code used a ref for debounce.
		// To keep this pure, we might need to change how inputs are handled or pass the debounce state.
		// Let's simplify: inputs.shiftUp/Down should be true only on the frame of the press.
		// But the original code used a ref to track "held" state.
		// Let's assume the caller handles the "trigger" nature of shift inputs.

		if (inputs.shiftUp) {
			if (car.gear < 6) {
				car.gear++;
				if (car.gear > 1) car.rpm *= 0.65;
				audioEngine.triggerShift(false);
			}
		}
		if (inputs.shiftDown) {
			if (car.gear > 0) {
				car.gear--;
				car.rpm *= 1.4;
				audioEngine.triggerShift(true);
			}
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
	let engineTorque = isAI || inputs.gas ? t.maxTorque * torqueCurveFactor : 0;

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
			0.5 * 1.225 * car.velocity * car.velocity * t.dragCoefficient * 2.0;
		const rollingRes = 150;
		const netForce = driveForce - dragForce - rollingRes;
		const accel = netForce / t.mass;

		car.velocity += accel * dt;
		if (car.velocity < 0) car.velocity = 0;

		car.y += car.velocity * dt;
	}

	// Update Audio (during countdown and racing, not in menus)
	if (!isLocked && (raceStatus === 'COUNTDOWN' || raceStatus === 'RACING')) {
		audioEngine.update(car.rpm, load, 0);
	}

	// Ghost Recording
	if (!isAI && raceStatus === 'RACING' && currentGhostRecording) {
		const currentTime = performance.now() - raceStartTime;
		currentGhostRecording.current.push({
			time: currentTime,
			y: car.y,
			velocity: car.velocity,
			rpm: car.rpm,
			gear: car.gear,
		});
	}
};
