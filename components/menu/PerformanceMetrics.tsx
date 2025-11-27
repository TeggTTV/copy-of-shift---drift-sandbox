import React, { useMemo } from 'react';
import { TuningState } from '../../types';

const calculateTopSpeed = (tuning: TuningState): number => {
	// Top speed in mph based on redline RPM and gearing
	const wheelRadius = 0.3; // meters
	const wheelCirc = 2 * Math.PI * wheelRadius;
	const topGearRatio = tuning.gearRatios[6] || tuning.gearRatios[5];
	const effectiveRatio = topGearRatio * tuning.finalDriveRatio;

	// Speed at redline in top gear
	const wheelRPM = tuning.redlineRPM / effectiveRatio;
	const speedMS = (wheelRPM * wheelCirc) / 60;
	const speedMPH = speedMS * 2.237; // m/s to mph

	return speedMPH;
};

const calculate0to60 = (tuning: TuningState): number => {
	// Simplified 0-60mph estimate based on power-to-weight ratio
	const avgHP = (tuning.maxTorque * tuning.redlineRPM * 0.7) / 7023; // Average HP
	const powerToWeight = avgHP / (tuning.mass / 1000); // HP per ton

	// Empirical formula with grip factor
	const baseTime = 15 / powerToWeight;
	const gripModifier = 1.5 - tuning.tireGrip * 0.3;

	return Math.max(2.0, baseTime * gripModifier);
};

const calculateQuarterMile = (tuning: TuningState): number => {
	// Simplified 1/4 mile time estimate
	const avgHP = (tuning.maxTorque * tuning.redlineRPM * 0.7) / 7023;
	const powerToWeight = avgHP / (tuning.mass / 1000);

	// Empirical formula
	const baseTime = 18 / Math.sqrt(powerToWeight);
	const gripModifier = 1.3 - tuning.tireGrip * 0.2;

	return Math.max(8.0, baseTime * gripModifier);
};

const StatDiff = ({
	current,
	preview,
	suffix = '',
	invertColor = false,
}: {
	current: number;
	preview?: number | null;
	suffix?: string;
	invertColor?: boolean;
}) => {
	if (
		preview === undefined ||
		preview === null ||
		Math.abs(preview - current) < 0.01
	)
		return null;
	const diff = preview - current;
	const isPositive = diff > 0;
	const isGood = invertColor ? !isPositive : isPositive;

	return (
		<span
			className={`ml-2 text-xs font-bold ${
				isGood ? 'text-green-400' : 'text-red-400'
			}`}
		>
			{isPositive ? '+' : ''}
			{diff.toFixed(1)}
			{suffix}
		</span>
	);
};

const PerformanceMetrics = ({
	tuning,
	previewTuning,
}: {
	tuning: TuningState;
	previewTuning?: TuningState | null;
}) => {
	const topSpeed = useMemo(() => calculateTopSpeed(tuning), [tuning]);
	const zeroTo60 = useMemo(() => calculate0to60(tuning), [tuning]);
	const quarterMile = useMemo(() => calculateQuarterMile(tuning), [tuning]);

	const pTopSpeed = useMemo(
		() => (previewTuning ? calculateTopSpeed(previewTuning) : null),
		[previewTuning]
	);
	const pZeroTo60 = useMemo(
		() => (previewTuning ? calculate0to60(previewTuning) : null),
		[previewTuning]
	);
	const pQuarterMile = useMemo(
		() => (previewTuning ? calculateQuarterMile(previewTuning) : null),
		[previewTuning]
	);

	return (
		<div className="bg-black/50 rounded border border-gray-800 p-3 space-y-2">
			<div className="text-[10px] text-gray-500 uppercase mb-2">
				Performance Estimates
			</div>
			<div className="grid grid-cols-3 gap-2 text-center">
				<div>
					<div className="text-xs text-gray-500">Top Speed</div>
					<div className="text-lg font-bold text-indigo-400">
						{topSpeed.toFixed(0)}
						<StatDiff
							current={topSpeed}
							preview={pTopSpeed}
							suffix=""
						/>
					</div>
					<div className="text-[10px] text-gray-600">MPH</div>
				</div>
				<div>
					<div className="text-xs text-gray-500">0-60</div>
					<div className="text-lg font-bold text-green-400">
						{zeroTo60.toFixed(2)}
						<StatDiff
							current={zeroTo60}
							preview={pZeroTo60}
							invertColor={true}
						/>
					</div>
					<div className="text-[10px] text-gray-600">SEC</div>
				</div>
				<div>
					<div className="text-xs text-gray-500">1/4 Mile</div>
					<div className="text-lg font-bold text-yellow-400">
						{quarterMile.toFixed(2)}
						<StatDiff
							current={quarterMile}
							preview={pQuarterMile}
							invertColor={true}
						/>
					</div>
					<div className="text-[10px] text-gray-600">SEC</div>
				</div>
			</div>
		</div>
	);
};

export default PerformanceMetrics;
export { StatDiff };
