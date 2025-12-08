import React, { useMemo } from 'react';
import { TuningState } from '../../../types';

interface StatComparisonPanelProps {
	baseTuning: TuningState;
	currentTuning: TuningState;
	rarity?: string; // For future Phase 4 implementation
}

const StatComparisonPanel: React.FC<StatComparisonPanelProps> = ({
	baseTuning,
	currentTuning,
	rarity,
}) => {
	// Calculate performance metrics
	const stats = useMemo(() => {
		const calculateHP = (tuning: TuningState) => {
			return (tuning.maxTorque * tuning.redlineRPM) / 7023;
		};

		const calculate0to60 = (tuning: TuningState) => {
			const hp = calculateHP(tuning);
			// Simplified 0-60 calculation: sqrt(mass / (HP * 0.746)) * 5.5
			// Lower is better
			return Math.sqrt(tuning.mass / (hp * 0.746)) * 5.5;
		};

		const calculateTopSpeed = (tuning: TuningState) => {
			const hp = calculateHP(tuning);
			// Simplified top speed: sqrt((HP * 746) / (0.5 * 1.225 * Cd * A)) * 3.6
			// Assuming frontal area A = 2.5 m²
			const speedMps = Math.sqrt(
				(hp * 746) / (0.5 * 1.225 * tuning.dragCoefficient * 2.5)
			);
			return speedMps * 2.237; // Convert m/s to mph
		};

		return {
			base: {
				zeroToSixty: calculate0to60(baseTuning),
				topSpeed: calculateTopSpeed(baseTuning),
				hp: calculateHP(baseTuning),
				torque: baseTuning.maxTorque,
			},
			current: {
				zeroToSixty: calculate0to60(currentTuning),
				topSpeed: calculateTopSpeed(currentTuning),
				hp: calculateHP(currentTuning),
				torque: currentTuning.maxTorque,
			},
		};
	}, [baseTuning, currentTuning]);

	const StatRow = ({
		label,
		baseValue,
		currentValue,
		unit,
		inverse = false,
	}: {
		label: string;
		baseValue: number;
		currentValue: number;
		unit: string;
		inverse?: boolean;
	}) => {
		const improved = inverse
			? currentValue < baseValue
			: currentValue > baseValue;
		const percentChange = Math.abs(
			((currentValue - baseValue) / baseValue) * 100
		);

		return (
			<tr className="border-b border-gray-800">
				<td className="py-2 px-3 text-left text-gray-300 text-xs pixel-text">
					{label}
				</td>
				<td className="py-2 px-3 text-center text-gray-400 text-sm font-mono">
					{baseValue.toFixed(1)}
					<span className="text-[10px] text-gray-600 ml-1">
						{unit}
					</span>
				</td>
				<td
					className={`py-2 px-3 text-center text-sm font-mono ${
						improved ? 'text-green-400' : 'text-gray-400'
					}`}
				>
					{currentValue.toFixed(1)}
					<span className="text-[10px] text-gray-600 ml-1">
						{unit}
					</span>
					{improved && percentChange > 0.1 && (
						<span className="ml-2 text-green-500 text-xs">✓</span>
					)}
				</td>
			</tr>
		);
	};

	return (
		<div className="bg-black/50 pixel-panel p-4 h-[220px] flex flex-col">
			<div className="flex justify-between items-center mb-3">
				<h3 className="text-sm text-indigo-400 pixel-text uppercase">
					Performance Comparison
				</h3>
				{rarity && (
					<div className="text-[10px] text-yellow-400 bg-yellow-900/20 px-2 py-1 rounded border border-yellow-700">
						{rarity}
					</div>
				)}
			</div>

			<div className="flex-1 overflow-auto no-scrollbar">
				<table className="w-full">
					<thead>
						<tr className="border-b-2 border-gray-700">
							<th className="py-2 px-3 text-left text-[10px] text-gray-500 uppercase pixel-text">
								Stat
							</th>
							<th className="py-2 px-3 text-center text-[10px] text-gray-500 uppercase pixel-text">
								Base
							</th>
							<th className="py-2 px-3 text-center text-[10px] text-gray-500 uppercase pixel-text">
								Current
							</th>
						</tr>
					</thead>
					<tbody>
						<StatRow
							label="0-60 mph"
							baseValue={stats.base.zeroToSixty}
							currentValue={stats.current.zeroToSixty}
							unit="s"
							inverse
						/>
						<StatRow
							label="Top Speed"
							baseValue={stats.base.topSpeed}
							currentValue={stats.current.topSpeed}
							unit="mph"
						/>
						<StatRow
							label="Horsepower"
							baseValue={stats.base.hp}
							currentValue={stats.current.hp}
							unit="HP"
						/>
						<StatRow
							label="Torque"
							baseValue={stats.base.torque}
							currentValue={stats.current.torque}
							unit="Nm"
						/>
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default StatComparisonPanel;
