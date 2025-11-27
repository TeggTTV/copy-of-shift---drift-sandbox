import React, { useMemo } from 'react';
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from 'recharts';
import { TuningState } from '../../types';
import { BASE_TUNING } from '../../constants';
import { interpolateTorque } from '../../utils/physics';

const DynoGraph = React.memo(
	({
		tuning,
		previewTuning,
	}: {
		tuning: TuningState;
		previewTuning?: TuningState | null;
	}) => {
		const data = useMemo(() => {
			const points = [];
			// Use the higher redline if preview has higher redline
			const maxRpm = previewTuning
				? Math.max(tuning.redlineRPM, previewTuning.redlineRPM)
				: tuning.redlineRPM;

			for (let r = 0; r <= maxRpm; r += 500) {
				const factor = interpolateTorque(r, tuning.torqueCurve);
				const torque = tuning.maxTorque * factor;
				const hp = (torque * r) / 7023;

				// Stock baseline for comparison
				const stockFactor = interpolateTorque(
					r,
					BASE_TUNING.torqueCurve
				);
				const stockTorque = BASE_TUNING.maxTorque * stockFactor;
				const stockHp = (stockTorque * r) / 7023;

				// Preview
				let previewTorque = null;
				let previewHp = null;
				if (previewTuning) {
					const pFactor = interpolateTorque(
						r,
						previewTuning.torqueCurve
					);
					previewTorque = previewTuning.maxTorque * pFactor;
					previewHp = (previewTorque * r) / 7023;
				}

				points.push({
					rpm: r,
					torque,
					hp,
					stockTorque,
					stockHp,
					previewTorque,
					previewHp,
				});
			}
			return points;
		}, [tuning, previewTuning]);

		// Find peaks
		const peakTorque = useMemo(() => {
			let max = 0;
			let maxRpm = 0;
			data.forEach((p) => {
				if (p.torque > max) {
					max = p.torque;
					maxRpm = p.rpm;
				}
			});
			return { value: max, rpm: maxRpm };
		}, [data]);

		const peakHP = useMemo(() => {
			let max = 0;
			let maxRpm = 0;
			data.forEach((p) => {
				if (p.hp > max) {
					max = p.hp;
					maxRpm = p.rpm;
				}
			});
			return { value: max, rpm: maxRpm };
		}, [data]);

		// Custom tooltip
		const CustomTooltip = ({ active, payload }: any) => {
			if (active && payload && payload.length) {
				const data = payload[0].payload;
				return (
					<div className="bg-black/95 border border-indigo-500 p-3 rounded shadow-lg z-50">
						<div className="text-white font-mono text-xs space-y-1">
							<div className="text-indigo-400 font-bold mb-2">
								{data.rpm} RPM
							</div>
							<div className="flex justify-between gap-4">
								<span className="text-blue-400">Torque:</span>
								<span className="text-white font-bold">
									{data.torque.toFixed(1)} Nm
								</span>
							</div>
							<div className="flex justify-between gap-4">
								<span className="text-green-400">Power:</span>
								<span className="text-white font-bold">
									{data.hp.toFixed(1)} HP
								</span>
							</div>
							{data.previewTorque !== null && (
								<>
									<div className="border-t border-gray-700 my-1"></div>
									<div className="flex justify-between gap-4 text-gray-400">
										<span>Preview Tq:</span>
										<span className="text-blue-300 font-bold">
											{data.previewTorque.toFixed(1)} Nm
										</span>
									</div>
									<div className="flex justify-between gap-4 text-gray-400">
										<span>Preview HP:</span>
										<span className="text-green-300 font-bold">
											{data.previewHp.toFixed(1)} HP
										</span>
									</div>
								</>
							)}
							{data.stockTorque > 0 && (
								<>
									<div className="border-t border-gray-700 my-1"></div>
									<div className="flex justify-between gap-4 text-gray-500">
										<span>Stock Torque:</span>
										<span>
											{data.stockTorque.toFixed(1)} Nm
										</span>
									</div>
									<div className="flex justify-between gap-4 text-gray-500">
										<span>Stock Power:</span>
										<span>
											{data.stockHp.toFixed(1)} HP
										</span>
									</div>
								</>
							)}
						</div>
					</div>
				);
			}
			return null;
		};

		// Custom dot for peak markers
		const PeakDot = (props: any) => {
			const { cx, cy, payload } = props;
			const isTorquePeak =
				payload.rpm === peakTorque.rpm &&
				payload.torque === peakTorque.value;
			const isHpPeak =
				payload.rpm === peakHP.rpm && payload.hp === peakHP.value;

			if (isTorquePeak || isHpPeak) {
				return (
					<g>
						<circle
							cx={cx}
							cy={cy}
							r={4}
							fill={isTorquePeak ? '#8884d8' : '#82ca9d'}
							stroke="#fff"
							strokeWidth={2}
						/>
					</g>
				);
			}
			return null;
		};

		return (
			<ResponsiveContainer width="100%" height="100%">
				<LineChart data={data}>
					<CartesianGrid strokeDasharray="3 3" stroke="#333" />
					<XAxis
						dataKey="rpm"
						stroke="#666"
						tick={{ fill: '#666', fontSize: 10 }}
						label={{
							value: 'RPM',
							position: 'insideBottom',
							offset: -5,
							fontSize: 10,
							fill: '#999',
						}}
					/>
					<YAxis
						yAxisId="left"
						stroke="#8884d8"
						tick={{ fill: '#8884d8', fontSize: 10 }}
						label={{
							value: 'Torque (Nm)',
							angle: -90,
							position: 'insideLeft',
							fill: '#8884d8',
							fontSize: 10,
						}}
					/>
					<YAxis
						yAxisId="right"
						orientation="right"
						stroke="#82ca9d"
						tick={{ fill: '#82ca9d', fontSize: 10 }}
						label={{
							value: 'Power (HP)',
							angle: 90,
							position: 'insideRight',
							fill: '#82ca9d',
							fontSize: 10,
						}}
					/>
					<Tooltip content={<CustomTooltip />} />
					{/* Stock Baseline */}
					<Line
						yAxisId="left"
						type="monotone"
						dataKey="stockTorque"
						stroke="#444"
						strokeDasharray="3 3"
						dot={false}
						strokeWidth={1}
					/>
					<Line
						yAxisId="right"
						type="monotone"
						dataKey="stockHp"
						stroke="#444"
						strokeDasharray="3 3"
						dot={false}
						strokeWidth={1}
					/>

					{/* Current Tuning */}
					<Line
						yAxisId="left"
						type="monotone"
						dataKey="torque"
						stroke="#8884d8"
						strokeWidth={2}
						dot={<PeakDot />}
						activeDot={{ r: 6 }}
					/>
					<Line
						yAxisId="right"
						type="monotone"
						dataKey="hp"
						stroke="#82ca9d"
						strokeWidth={2}
						dot={<PeakDot />}
						activeDot={{ r: 6 }}
					/>

					{/* Preview Tuning */}
					{previewTuning && (
						<>
							<Line
								yAxisId="left"
								type="monotone"
								dataKey="previewTorque"
								stroke="#8884d8"
								strokeDasharray="5 5"
								strokeOpacity={0.7}
								dot={false}
								strokeWidth={2}
							/>
							<Line
								yAxisId="right"
								type="monotone"
								dataKey="previewHp"
								stroke="#82ca9d"
								strokeDasharray="5 5"
								strokeOpacity={0.7}
								dot={false}
								strokeWidth={2}
							/>
						</>
					)}

					{/* Redline indicator */}
					<line
						x1="0"
						y1="0"
						x2="0"
						y2="100%"
						stroke="#ef4444"
						strokeWidth={2}
						strokeDasharray="4 4"
						style={{
							transform: `translateX(${
								(tuning.redlineRPM / tuning.redlineRPM) * 100
							}%)`,
						}}
					/>
				</LineChart>
			</ResponsiveContainer>
		);
	}
);

export default DynoGraph;
