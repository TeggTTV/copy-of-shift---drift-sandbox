import React, { useRef, useEffect, useState } from 'react';
import { CarState, InputState, TuningState } from '../types';
import {
	CAR_CONSTANTS,
	DEFAULT_TUNING,
	TORQUE_CURVE,
	CONTROLS,
} from '../constants';
import Dashboard from './Dashboard';
import TuningPanel from './TuningPanel';
import { AudioEngine } from './AudioEngine';

const PPM = 20; // Pixels Per Meter - Visual Scale

const interpolateTorque = (rpm: number): number => {
	const clampedRPM = Math.max(0, rpm);
	// Find segment
	for (let i = 0; i < TORQUE_CURVE.length - 1; i++) {
		const p1 = TORQUE_CURVE[i];
		const p2 = TORQUE_CURVE[i + 1];
		if (clampedRPM >= p1.rpm && clampedRPM <= p2.rpm) {
			const t = (clampedRPM - p1.rpm) / (p2.rpm - p1.rpm);
			return p1.factor + t * (p2.factor - p1.factor);
		}
	}
	return 0.2;
};

// Skidmark trail point
interface TrailPoint {
	x: number;
	y: number;
	alpha: number;
	life: number;
}

interface Particle {
	x: number;
	y: number;
	vx: number;
	vy: number;
	life: number;
	size: number;
}

const GameCanvas: React.FC = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	// Audio Engine
	const audioRef = useRef<AudioEngine>(new AudioEngine());
	const audioInitializedRef = useRef(false);

	// Tuning State (editable via UI)
	const [tuning, setTuning] = useState<TuningState>(DEFAULT_TUNING);
	const tuningRef = useRef<TuningState>(DEFAULT_TUNING);

	// Sync ref when state changes
	useEffect(() => {
		tuningRef.current = tuning;

		// Update Audio Config real-time
		if (audioInitializedRef.current) {
			audioRef.current.setConfiguration(
				tuning.cylinders,
				tuning.exhaustOpenness,
				tuning.backfireAggression
			);
		}
	}, [tuning]);

	// Game State Refs
	const carRef = useRef<CarState>({
		x: 0,
		y: 0,
		heading: -Math.PI / 2, // Facing Up
		velocityX: 0,
		velocityY: 0,
		angularVelocity: 0,
		speed: 0,
		steeringAngle: 0,
		rpm: DEFAULT_TUNING.idleRPM,
		gear: 0,
		slipAngle: 0,
		isDrifting: false,
		gripRatio: 0,
		pitch: 0,
		roll: 0,
	});

	const inputsRef = useRef<InputState>({
		forward: false,
		backward: false,
		left: false,
		right: false,
		brake: false,
		eBrake: false,
		clutch: false,
		gearUp: false,
		gearDown: false,
	});

	// Track previous frame state for audio triggers
	const prevInputsRef = useRef<InputState>({ ...inputsRef.current });
	const prevGearRef = useRef<number>(0);

	const skidmarksLeftRef = useRef<TrailPoint[]>([]);
	const skidmarksRightRef = useRef<TrailPoint[]>([]);
	const particlesRef = useRef<Particle[]>([]);
	const gearShiftDebounce = useRef(false);

	// Force UI update periodically
	const [uiState, setUiState] = useState<CarState>(carRef.current);

	// Input Handling
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Init audio on first interaction
			if (!audioInitializedRef.current) {
				audioRef.current.init();
				audioInitializedRef.current = true;
				// Apply initial config
				audioRef.current.setConfiguration(
					tuningRef.current.cylinders,
					tuningRef.current.exhaustOpenness,
					tuningRef.current.backfireAggression
				);
			}

			switch (e.key) {
				case CONTROLS.FORWARD:
					inputsRef.current.forward = true;
					break;
				case CONTROLS.LEFT:
					inputsRef.current.left = true;
					break;
				case CONTROLS.RIGHT:
					inputsRef.current.right = true;
					break;
				case CONTROLS.BRAKE:
					inputsRef.current.brake = true;
					break;
				case CONTROLS.E_BRAKE:
					inputsRef.current.eBrake = true;
					break;
				case CONTROLS.CLUTCH:
					inputsRef.current.clutch = true;
					break;
				case CONTROLS.GEAR_UP:
					inputsRef.current.gearUp = true;
					break;
				case CONTROLS.GEAR_DOWN:
					inputsRef.current.gearDown = true;
					break;
			}
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			switch (e.key) {
				case CONTROLS.FORWARD:
					inputsRef.current.forward = false;
					break;
				case CONTROLS.LEFT:
					inputsRef.current.left = false;
					break;
				case CONTROLS.RIGHT:
					inputsRef.current.right = false;
					break;
				case CONTROLS.BRAKE:
					inputsRef.current.brake = false;
					break;
				case CONTROLS.E_BRAKE:
					inputsRef.current.eBrake = false;
					break;
				case CONTROLS.CLUTCH:
					inputsRef.current.clutch = false;
					break;
				case CONTROLS.GEAR_UP:
					inputsRef.current.gearUp = false;
					break;
				case CONTROLS.GEAR_DOWN:
					inputsRef.current.gearDown = false;
					break;
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
		};
	}, []);

	// Main Loop
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		let animationFrameId: number;
		let lastTime = performance.now();

		const updatePhysics = (dt: number) => {
			const car = carRef.current;
			const inputs = inputsRef.current;
			const prevInputs = prevInputsRef.current;
			const t = tuningRef.current;
			const c = CAR_CONSTANTS;

			// --- 1. Gear Shifting ---
			if (inputs.gearUp && !gearShiftDebounce.current) {
				if (car.gear < 6) car.gear++;
				gearShiftDebounce.current = true;
			}
			if (inputs.gearDown && !gearShiftDebounce.current) {
				if (car.gear > -1) car.gear--;
				gearShiftDebounce.current = true;
			}
			if (!inputs.gearUp && !inputs.gearDown) {
				gearShiftDebounce.current = false;
			}

			// --- 2. Steering & Heading ---
			const maxSteer = 0.6; // ~35 degrees
			let targetSteer = 0;
			if (inputs.left) targetSteer -= maxSteer;
			if (inputs.right) targetSteer += maxSteer;

			// Smooth steering
			const steerSpeed = t.steerSpeed * dt;
			if (Math.abs(targetSteer - car.steeringAngle) < steerSpeed) {
				car.steeringAngle = targetSteer;
			} else {
				car.steeringAngle +=
					Math.sign(targetSteer - car.steeringAngle) * steerSpeed;
			}

			// --- 3. Velocity Decomposition (Local Space) ---
			const headX = Math.cos(car.heading);
			const headY = Math.sin(car.heading);

			const sideX = -headY;
			const sideY = headX;

			let vLong = car.velocityX * headX + car.velocityY * headY;
			const vLat = car.velocityX * sideX + car.velocityY * sideY;

			car.speed = Math.sqrt(car.velocityX ** 2 + car.velocityY ** 2);

			car.slipAngle =
				Math.abs(vLong) > 1 ? Math.atan2(vLat, Math.abs(vLong)) : 0;

			// --- 4. Engine & Transmission Physics ---
			const isNeutral = car.gear === 0;
			const isDeclutched = inputs.clutch || isNeutral;
			const gearRatio = c.gearRatios[car.gear] || 0;
			const effectiveRatio = gearRatio * t.finalDriveRatio;

			const wheelCirc = 2 * Math.PI * c.wheelRadius;
			const wheelRPM = (vLong / wheelCirc) * 60;
			const connectedRPM = Math.abs(wheelRPM * effectiveRatio);

			// Torque Calculation
			const torqueCurveFactor = interpolateTorque(car.rpm);
			const engineTorque = inputs.forward
				? t.maxTorque * torqueCurveFactor
				: 0;

			let driveForce = 0;

			if (isDeclutched) {
				// Engine Free Revving
				const revUpRate = 10000 / t.flywheelMass;
				const revDownRate = 5000 / t.flywheelMass;

				let targetRPM = t.idleRPM;
				if (inputs.forward) targetRPM = t.redlineRPM;

				if (car.rpm < targetRPM) {
					car.rpm += revUpRate * dt;
				} else {
					car.rpm -= revDownRate * dt;
				}
			} else {
				// Connected to wheels
				const couplingStrength = 10.0 * dt;
				car.rpm = car.rpm + (connectedRPM - car.rpm) * couplingStrength;

				const availableForce =
					(engineTorque * effectiveRatio) / c.wheelRadius;

				if (car.gear === -1) {
					driveForce = -availableForce;
				} else {
					driveForce = availableForce;
				}

				if (!inputs.forward && car.rpm > t.idleRPM) {
					const engineBrakeTorque = (car.rpm / t.redlineRPM) * 60;
					driveForce -=
						((engineBrakeTorque * effectiveRatio) / c.wheelRadius) *
						Math.sign(vLong);
				}

				if (car.rpm > t.redlineRPM) {
					driveForce = 0;
					car.rpm = t.redlineRPM - 200;
					if (Math.random() > 0.7) audioRef.current.triggerLimiter();
				}
			}

			if (car.rpm < t.idleRPM) car.rpm = t.idleRPM;

			// --- 5. Tire Physics & Braking ---

			let longForce = driveForce;

			if (inputs.brake) {
				const brakingDecel = t.brakingForce / t.mass;
				const timeToStop = Math.abs(vLong) / brakingDecel;

				if (timeToStop < dt) {
					longForce = -(vLong * t.mass) / dt;
				} else {
					longForce -= Math.sign(vLong) * t.brakingForce;
				}
			} else {
				if (Math.abs(vLong) > 0.1) {
					longForce -=
						Math.sign(vLong) *
						(c.rollingResistance +
							t.dragCoefficient * vLong * vLong);
				} else if (!inputs.forward) {
					longForce = -(vLong * t.mass) / dt;
				}
			}

			// --- LATERAL FORCES (DRIFTING) ---
			const normalLoad = t.mass * 9.81;
			const maxLatGrip = normalLoad * t.tireGrip;
			const currentGripLimit = inputs.eBrake
				? maxLatGrip * 0.2
				: maxLatGrip;

			const corneringStiffness = 30.0 * t.mass;
			let latForce = -vLat * corneringStiffness;

			const latForceMag = Math.abs(latForce);
			car.gripRatio = latForceMag / (currentGripLimit || 1);

			if (latForceMag > currentGripLimit) {
				latForce = Math.sign(latForce) * currentGripLimit;
				car.isDrifting = true;
			} else {
				car.isDrifting = false;
			}

			// --- 6. Suspension Physics ---
			const accelX = longForce / t.mass;
			const accelY = latForce / t.mass;

			const targetPitch = -accelX * 0.05;
			const targetRoll = accelY * 0.05;

			const stiffness = t.suspensionStiffness * dt;
			const damping = t.suspensionDamping * dt;

			car.pitch = car.pitch + (targetPitch - car.pitch) * stiffness * 0.1;
			car.roll = car.roll + (targetRoll - car.roll) * stiffness * 0.1;

			// --- 7. Integration ---
			const fx = longForce * headX + latForce * sideX;
			const fy = longForce * headY + latForce * sideY;

			car.velocityX += (fx / t.mass) * dt;
			car.velocityY += (fy / t.mass) * dt;
			car.x += car.velocityX * dt;
			car.y += car.velocityY * dt;

			const wheelBase = c.wheelBase;
			let targetAngularVel =
				(vLong * Math.tan(car.steeringAngle)) / wheelBase;
			if (vLong < -1) targetAngularVel = -targetAngularVel;

			// Smooth Angular Velocity
			const angularBlend = car.isDrifting ? 0.02 : 0.2;
			car.angularVelocity =
				car.angularVelocity * (1 - angularBlend) +
				targetAngularVel * angularBlend;

			car.heading += car.angularVelocity * dt;

			// --- 8. Audio Triggers ---
			if (car.gear !== prevGearRef.current) {
				// Determine shift direction
				const isDownshift = car.gear < prevGearRef.current;
				audioRef.current.triggerShift(isDownshift);
			}

			// Backfire Logic: Significant throttle lift at high RPM
			if (prevInputs.forward && !inputs.forward && car.rpm > 4000) {
				audioRef.current.triggerBackfire();
			}

			// Update Audio Engine
			const driftIntensity = car.isDrifting
				? Math.min(car.gripRatio - 1, 1.0) * Math.min(car.speed / 10, 1)
				: 0;

			// Calculate Load (0-1) for audio
			let engineLoad = 0;
			if (inputs.forward) engineLoad = 1;
			// High RPM coasting = partial load sound (mechanical stress)
			else if (car.rpm > 3000) engineLoad = 0.05;

			audioRef.current.update(car.rpm, engineLoad, driftIntensity);

			// --- 9. Effects ---
			if (
				(car.isDrifting || car.gripRatio > 0.8) &&
				Math.abs(car.speed) > 2
			) {
				const intensity = Math.min(1, Math.max(0, car.gripRatio - 0.5));

				const raDist = -c.wheelBase / 2;
				const halfTrack = 0.9;

				const cosH = Math.cos(car.heading);
				const sinH = Math.sin(car.heading);

				const rlX = car.x + raDist * cosH - halfTrack * sinH;
				const rlY = car.y + raDist * sinH + halfTrack * cosH;

				const rrX = car.x + raDist * cosH + halfTrack * sinH;
				const rrY = car.y + raDist * sinH - halfTrack * cosH;

				const skidPoint = {
					x: 0,
					y: 0,
					alpha: intensity * 0.6,
					life: 1.0,
				};

				skidmarksLeftRef.current.push({ ...skidPoint, x: rlX, y: rlY });
				skidmarksRightRef.current.push({
					...skidPoint,
					x: rrX,
					y: rrY,
				});

				if (car.isDrifting && Math.random() < intensity * 0.4) {
					particlesRef.current.push({
						x: rlX + (Math.random() - 0.5),
						y: rlY + (Math.random() - 0.5),
						vx: (Math.random() - 0.5) * 2,
						vy: (Math.random() - 0.5) * 2,
						life: 1.0,
						size: Math.random() * 0.5 + 0.2,
					});
					particlesRef.current.push({
						x: rrX + (Math.random() - 0.5),
						y: rrY + (Math.random() - 0.5),
						vx: (Math.random() - 0.5) * 2,
						vy: (Math.random() - 0.5) * 2,
						life: 1.0,
						size: Math.random() * 0.5 + 0.2,
					});
				}
			}

			// Decay
			const decay = dt * 0.5;
			skidmarksLeftRef.current.forEach((p) => (p.life -= decay));
			skidmarksRightRef.current.forEach((p) => (p.life -= decay));
			skidmarksLeftRef.current = skidmarksLeftRef.current.filter(
				(p) => p.life > 0
			);
			skidmarksRightRef.current = skidmarksRightRef.current.filter(
				(p) => p.life > 0
			);

			particlesRef.current.forEach((p) => {
				p.life -= dt * 2;
				p.x += p.vx * dt;
				p.y += p.vy * dt;
				p.size += dt;
			});
			particlesRef.current = particlesRef.current.filter(
				(p) => p.life > 0
			);

			prevInputsRef.current = { ...inputs };
			prevGearRef.current = car.gear;
		};

		const draw = () => {
			ctx.fillStyle = '#1a1a1a';
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			const car = carRef.current;

			ctx.save();
			ctx.translate(canvas.width / 2, canvas.height / 2);

			const susPitchOffset = car.pitch * PPM;
			const susRollOffset = -car.roll * PPM;

			const cos = Math.cos(car.heading);
			const sin = Math.sin(car.heading);

			const visOffsetX = susPitchOffset * cos - susRollOffset * sin;
			const visOffsetY = susPitchOffset * sin + susRollOffset * cos;

			const cameraX = car.x * PPM + visOffsetX;
			const cameraY = car.y * PPM + visOffsetY;

			ctx.translate(-cameraX, -cameraY);

			// Grid
			ctx.strokeStyle = '#333';
			ctx.lineWidth = 2;
			const gridSize = 10;
			const startX = Math.floor(car.x / gridSize) * gridSize - 100;
			const endX = startX + 200;
			const startY = Math.floor(car.y / gridSize) * gridSize - 100;
			const endY = startY + 200;

			ctx.beginPath();
			for (let i = startX; i <= endX; i += gridSize) {
				ctx.moveTo(i * PPM, (startY - 50) * PPM);
				ctx.lineTo(i * PPM, (endY + 50) * PPM);
			}
			for (let j = startY; j <= endY; j += gridSize) {
				ctx.moveTo((startX - 50) * PPM, j * PPM);
				ctx.lineTo((endX + 50) * PPM, j * PPM);
			}
			ctx.stroke();

			// Skidmarks
			ctx.lineWidth = 0.3 * PPM;
			const drawTrail = (trail: TrailPoint[]) => {
				if (trail.length < 2) return;
				ctx.beginPath();
				for (let i = 0; i < trail.length - 1; i++) {
					const p1 = trail[i];
					const p2 = trail[i + 1];
					if (
						Math.abs(p1.x - car.x) > 100 ||
						Math.abs(p1.y - car.y) > 100
					)
						continue;

					ctx.strokeStyle = `rgba(20, 20, 20, ${p1.alpha * p1.life})`;
					ctx.beginPath();
					ctx.moveTo(p1.x * PPM, p1.y * PPM);
					ctx.lineTo(p2.x * PPM, p2.y * PPM);
					ctx.stroke();
				}
			};

			drawTrail(skidmarksLeftRef.current);
			drawTrail(skidmarksRightRef.current);

			// Car
			ctx.save();
			ctx.translate(car.x * PPM, car.y * PPM);
			ctx.rotate(car.heading);

			const localSusX = -car.roll * PPM;
			const localSusY = car.pitch * PPM;

			// Shadow
			ctx.fillStyle = 'rgba(0,0,0,0.5)';
			const shadowLen = 5.0 * PPM;
			const shadowWidth = 2.2 * PPM;
			ctx.fillRect(
				-shadowLen / 2,
				-shadowWidth / 2,
				shadowLen,
				shadowWidth
			);

			// Wheels
			const wheelOffsetFront = (CAR_CONSTANTS.wheelBase / 2) * PPM;
			const wheelOffsetRear = -(CAR_CONSTANTS.wheelBase / 2) * PPM;
			const wheelOffsetSide = 0.9 * PPM;

			const wheelDiameter = 0.65 * PPM;
			const wheelWidth = 0.3 * PPM;

			ctx.fillStyle = '#080808';

			// Rear Wheels
			ctx.fillRect(
				wheelOffsetRear - wheelDiameter / 2,
				-wheelOffsetSide - wheelWidth / 2,
				wheelDiameter,
				wheelWidth
			);
			ctx.fillRect(
				wheelOffsetRear - wheelDiameter / 2,
				wheelOffsetSide - wheelWidth / 2,
				wheelDiameter,
				wheelWidth
			);

			// Front Wheels
			ctx.save();
			ctx.translate(wheelOffsetFront, -wheelOffsetSide);
			ctx.rotate(car.steeringAngle);
			ctx.fillRect(
				-wheelDiameter / 2,
				-wheelWidth / 2,
				wheelDiameter,
				wheelWidth
			);
			ctx.restore();

			ctx.save();
			ctx.translate(wheelOffsetFront, wheelOffsetSide);
			ctx.rotate(car.steeringAngle);
			ctx.fillRect(
				-wheelDiameter / 2,
				-wheelWidth / 2,
				wheelDiameter,
				wheelWidth
			);
			ctx.restore();

			// Body
			ctx.translate(localSusY, localSusX);

			const bodyLen = 4.7 * PPM;
			const bodyWidth = 1.9 * PPM;

			// Chassis
			ctx.fillStyle = car.isDrifting ? '#ef4444' : '#3b82f6';
			ctx.beginPath();
			ctx.roundRect(
				-bodyLen / 2,
				-bodyWidth / 2,
				bodyLen,
				bodyWidth,
				0.2 * PPM
			);
			ctx.fill();

			// Roof
			ctx.fillStyle = '#1e293b';
			const roofLen = 2.5 * PPM;
			const roofWidth = 1.6 * PPM;
			ctx.fillRect(-roofLen / 2, -roofWidth / 2, roofLen, roofWidth);

			// Headlights
			ctx.fillStyle = '#fef08a';
			const lightSize = 0.15 * PPM;
			ctx.beginPath();
			ctx.arc(
				bodyLen / 2 - 0.1 * PPM,
				-bodyWidth / 2 + 0.4 * PPM,
				lightSize,
				0,
				Math.PI * 2
			);
			ctx.arc(
				bodyLen / 2 - 0.1 * PPM,
				bodyWidth / 2 - 0.4 * PPM,
				lightSize,
				0,
				Math.PI * 2
			);
			ctx.fill();

			// Beams
			ctx.fillStyle = 'rgba(255, 255, 200, 0.1)';
			ctx.beginPath();
			ctx.moveTo(bodyLen / 2, -bodyWidth / 2 + 0.4 * PPM);
			ctx.lineTo(bodyLen / 2 + 6 * PPM, -bodyWidth / 2 - 1.5 * PPM);
			ctx.lineTo(bodyLen / 2 + 6 * PPM, 0);
			ctx.fill();

			ctx.beginPath();
			ctx.moveTo(bodyLen / 2, bodyWidth / 2 - 0.4 * PPM);
			ctx.lineTo(bodyLen / 2 + 6 * PPM, bodyWidth / 2 + 1.5 * PPM);
			ctx.lineTo(bodyLen / 2 + 6 * PPM, 0);
			ctx.fill();

			ctx.restore();
			ctx.restore();

			// Particles
			ctx.save();
			ctx.translate(canvas.width / 2, canvas.height / 2);
			ctx.translate(-cameraX, -cameraY);

			particlesRef.current.forEach((p) => {
				ctx.fillStyle = `rgba(200, 200, 200, ${p.life * 0.4})`;
				ctx.beginPath();
				ctx.arc(p.x * PPM, p.y * PPM, p.size * PPM, 0, Math.PI * 2);
				ctx.fill();
			});

			ctx.restore();
		};

		const loop = (time: number) => {
			const dt = Math.min((time - lastTime) / 1000, 0.05);
			lastTime = time;

			updatePhysics(dt);
			draw();

			if (Math.random() > 0.5) {
				setUiState({ ...carRef.current });
			}

			animationFrameId = requestAnimationFrame(loop);
		};

		animationFrameId = requestAnimationFrame(loop);

		return () => {
			cancelAnimationFrame(animationFrameId);
		};
	}, []);

	return (
		<div className="relative w-full h-full">
			<canvas
				ref={canvasRef}
				width={window.innerWidth}
				height={window.innerHeight}
				className="block"
			/>
			{/* Pass AudioEngine to Dashboard for visualization */}
			<Dashboard
				carState={uiState}
				tuning={tuningRef.current}
				audioEngine={audioRef.current}
			/>
			<TuningPanel tuning={tuning} onUpdate={setTuning} />
		</div>
	);
};

export default GameCanvas;
