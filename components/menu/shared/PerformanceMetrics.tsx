import React, { useMemo } from 'react';
import { TuningState } from '@/types';
import {
	simulate0to60,
	simulateQuarterMile,
	simulateTopSpeed,
} from '@/utils/performanceSimulator';

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
	const topSpeed = useMemo(() => simulateTopSpeed(tuning), [tuning]);
	const zeroTo60 = useMemo(() => simulate0to60(tuning), [tuning]);
	const quarterMile = useMemo(() => simulateQuarterMile(tuning), [tuning]);

	const pTopSpeed = useMemo(
		() => (previewTuning ? simulateTopSpeed(previewTuning) : null),
		[previewTuning]
	);
	const pZeroTo60 = useMemo(
		() => (previewTuning ? simulate0to60(previewTuning) : null),
		[previewTuning]
	);
	const pQuarterMile = useMemo(
		() => (previewTuning ? simulateQuarterMile(previewTuning) : null),
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
