import { TuningState, CarState } from '../types';
import { interpolateTorque } from './physics';

export interface PerformanceStats {
	zeroToSixty: number; // Seconds
	quarterMileTime: number; // Seconds
	quarterMileSpeed: number; // mph
}

export const calculatePerformance = (tuning: TuningState): PerformanceStats => {
	// Simulation parameters
	const dt = 0.016; // 60Hz simulation step
	const maxTime = 30.0; // Max simulation time to prevent infinite loops

	// Initial State
	const car: CarState = {
		x: 0,
		y: 0,
		velocity: 0, // m/s
		rpm: tuning.idleRPM,
		gear: 1,
		angle: 0,
		steerAngle: 0,
		lateralVelocity: 0,
		finished: false,
		finishTime: 0,
	};

	let time = 0;
	let zeroToSixty = -1;
	let quarterMileTime = -1;
	let quarterMileSpeed = -1;
	let distance = 0;

	// Physics Constants
	const gravity = 9.81;
	const wheelRadius = 0.3;
	const wheelCirc = 2 * Math.PI * wheelRadius;
	const quarterMileMeters = 402.34;
	const sixtyMphMetersPerSecond = 26.8224;

	while (time < maxTime) {
		// --- 1. Shifting Logic (Perfect Shifts) ---
		// Shift slightly before redline for optimal power, or at redline
		// Let's shift at 95% of redline or if we hit limiter
		const shiftPoint = tuning.redlineRPM * 0.98;
		if (car.gear < 6 && car.rpm >= shiftPoint) {
			car.gear++;
			// RPM drop approximation based on gear ratio difference
			// Simplified: drop to 70% (or calculate exact if we want precision)
			// Let's use the ratio difference for better accuracy
			const currentRatio = tuning.gearRatios[car.gear - 1];
			const nextRatio = tuning.gearRatios[car.gear];
			if (currentRatio && nextRatio) {
				car.rpm *= nextRatio / currentRatio;
			} else {
				car.rpm *= 0.7;
			}
		}

		// --- 2. Engine Physics ---
		const gearRatio = tuning.gearRatios[car.gear] || 0;
		const effectiveRatio = gearRatio * tuning.finalDriveRatio;

		// Connected RPM
		const connectedRPM = (car.velocity / wheelCirc) * 60 * effectiveRatio;

		const torqueCurveFactor = interpolateTorque(
			car.rpm,
			tuning.torqueCurve
		);
		let engineTorque = tuning.maxTorque * torqueCurveFactor;

		// Rev Limiter
		if (car.rpm > tuning.redlineRPM) {
			engineTorque = 0;
			car.rpm = tuning.redlineRPM - 50;
		}

		// --- 3. Clutch / Launch Logic (Simplified) ---
		// Assume perfect launch: hold RPM at optimal torque or launch control RPM
		// If velocity is low, we are slipping clutch
		let driveForce = 0;

		if (car.gear > 0) {
			driveForce = (engineTorque * effectiveRatio) / wheelRadius;

			// Clutch Slip Logic
			// If connectedRPM is way lower than engine RPM, we are slipping
			// In simulation, we just ensure RPM doesn't drop below idle or stall
			// and we apply the force.
			// However, real launch limits force by tire grip immediately.

			// Simple coupling for simulation:
			// If connectedRPM < tuning.idleRPM * 1.5, allow RPM to stay high (slipping)
			if (connectedRPM < car.rpm) {
				// Slipping, RPM stays up based on power?
				// For sim, let's just say RPM follows velocity but has a floor during launch
				car.rpm = Math.max(
					tuning.maxTorque > 200 ? 4000 : 3000,
					connectedRPM
				);
			} else {
				car.rpm = connectedRPM;
			}
		}

		car.rpm = Math.max(tuning.idleRPM, car.rpm);

		// --- 4. Forces ---
		const maxTractionForce = tuning.mass * gravity * tuning.tireGrip;

		// Cap drive force by traction
		if (driveForce > maxTractionForce) {
			driveForce = maxTractionForce;
			// In real game we drop force to 0.8 * max, but for "Estimate" let's assume perfect throttle control (limit at max traction)
			// or maybe a slight penalty to be realistic?
			// Let's stick to maxTractionForce (perfect traction control)
		}

		const dragForce =
			0.5 * 1.225 * car.velocity * car.velocity * tuning.dragCoefficient;
		const rollingRes = 150;
		const netForce = driveForce - dragForce - rollingRes;
		const accel = netForce / tuning.mass;

		// Integrate
		car.velocity += accel * dt;
		if (car.velocity < 0) car.velocity = 0;

		distance += car.velocity * dt;
		time += dt;

		// Check Metrics
		if (zeroToSixty === -1 && car.velocity >= sixtyMphMetersPerSecond) {
			zeroToSixty = time;
		}

		if (quarterMileTime === -1 && distance >= quarterMileMeters) {
			quarterMileTime = time;
			quarterMileSpeed = car.velocity * 2.23694; // Convert m/s to mph
			break; // Done
		}
	}

	return {
		zeroToSixty: zeroToSixty > 0 ? parseFloat(zeroToSixty.toFixed(2)) : -1,
		quarterMileTime:
			quarterMileTime > 0 ? parseFloat(quarterMileTime.toFixed(2)) : -1,
		quarterMileSpeed:
			quarterMileSpeed > 0 ? parseFloat(quarterMileSpeed.toFixed(1)) : -1,
	};
};
