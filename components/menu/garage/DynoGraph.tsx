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
import { TuningState } from '@/types';
import { BASE_TUNING } from '@/constants';
import { interpolateTorque } from '@/utils/physics';

const CustomTooltip = ({ active, payload, label }: any) => {
	if (active && payload && payload.length) {
		return (
			<div className="bg-black/90 border border-gray-700 p-3 rounded shadow-xl font-mono text-sm">
				<p className="text-gray-400 mb-1">RPM: {label}</p>
				{payload.map((entry: any, index: number) => (
					<p key={index} style={{ color: entry.color }}>
						{entry.name}: {Math.round(entry.value)}
					</p>
				))}
			</div>
		);
	}
	return null;
};

const PeakDot = (props: any) => {
	const { cx, cy, stroke, payload, value } = props;
	// Only show dot for peak values if we calculated them,
	// but for simple graph rendering we might just let Recharts handle it or custom logic.
	// For now, let's just render a simple dot if it's a significant point or just standard dots.
	// Actually, let's just use standard dots for now to keep it simple and robust.
	return (
		<circle
			cx={cx}
			cy={cy}
			r={4}
			stroke={stroke}
			strokeWidth={2}
			fill="#111"
		/>
	);
};

const DynoGraph = React.memo(
	({
		tuning,
		previewTuning,
		liveData,
		previousData,
	}: {
		tuning: TuningState;
		previewTuning?: TuningState | null;
		liveData?: { rpm: number; torque: number; hp: number }[];
		previousData?: { rpm: number; torque: number; hp: number }[];
	}) => {
		// If we have live data, we prioritize showing that.
		// If we have previous data, we show that as comparison.
		// If neither, we show "NO DATA".

		const hasLiveData = liveData && liveData.length > 0;
		const hasPreviousData = previousData && previousData.length > 0;

		if (!hasLiveData && !hasPreviousData) {
			return (
				<div className="flex items-center justify-center h-full text-gray-500 font-mono text-sm border border-dashed border-gray-700 rounded">
					NO DYNO DATA - RUN TEST
				</div>
			);
		}

		// We use the data that is available.
		// If liveData is building up, we show it.
		// If we only have previous data (e.g. right after load but before new run), we could show it,
		// but typically we want to show the "current" run.
		// However, if we are just viewing the graph, showing the last run is good.

		// Let's merge data for visualization if needed, but Recharts can handle multiple lines with different data sources if we structure it right,
		// OR we can just pass the same dataset if they share X-axis.
		// Since RPM points might differ slightly if sampling differs, it's best to treat them as independent lines or map them to a common X-axis.
		// For simplicity, we will assume standard RPM steps or just let Recharts plot them.
		// Recharts `data` prop usually expects an array of objects.
		// If we want two lines from different datasets, we might need to merge them or use multiple data sources?
		// Recharts `LineChart` takes `data`. If we have two separate arrays, it's harder.
		// We should probably merge them into a single array keyed by RPM if possible, OR just use the `data` prop on `Line`?
		// No, `Line` inherits data from `LineChart` usually, but can accept its own `data` prop?
		// Actually, Recharts `Line` can accept a `data` prop!
		// Let's try passing `liveData` to the main chart and `previousData` to a specific Line, or vice versa.

		// Actually, to ensure X-axis is correct, it's best if the `data` prop on LineChart contains the union of X values.
		// But since our Dyno run is consistent (1000 to Redline), the RPM points should be roughly aligned or we can just overlay them.

		// Let's try using `data={liveData}` for the chart, and if we have `previousData`, we might need to merge it or just pass it to the second set of lines.
		// Wait, if `liveData` is empty (start of run), we can't use it as the base data.

		// Strategy:
		// Merge liveData and previousData into a single array keyed by RPM.
		// This ensures Recharts sees the full range of data for auto-scaling.

		const chartData = useMemo(() => {
			const merged: any[] = [];

			// Create a map of all RPM points
			const rpmMap = new Set<number>();
			if (liveData) liveData.forEach((d) => rpmMap.add(d.rpm));
			if (previousData) previousData.forEach((d) => rpmMap.add(d.rpm));

			const sortedRpms = Array.from(rpmMap).sort((a, b) => a - b);

			sortedRpms.forEach((rpm) => {
				const livePoint = liveData?.find((d) => d.rpm === rpm);
				const prevPoint = previousData?.find((d) => d.rpm === rpm);

				merged.push({
					rpm,
					torque: livePoint?.torque,
					hp: livePoint?.hp,
					prevTorque: prevPoint?.torque,
					prevHp: prevPoint?.hp,
				});
			});

			return merged;
		}, [liveData, previousData]);

		return (
			<ResponsiveContainer width="100%" height="100%">
				<LineChart data={chartData}>
					<CartesianGrid strokeDasharray="3 3" stroke="#333" />
					<XAxis
						dataKey="rpm"
						stroke="#666"
						tick={{ fill: '#666', fontSize: 10 }}
						type="number"
						domain={['dataMin', 'dataMax']}
						tickCount={8}
					/>
					<YAxis
						yAxisId="left"
						stroke="#ef4444"
						tick={{ fill: '#ef4444', fontSize: 10 }}
						label={{
							value: 'Torque (ft-lbs)',
							angle: -90,
							position: 'insideLeft',
							fill: '#ef4444',
							fontSize: 12,
						}}
					/>
					<YAxis
						yAxisId="right"
						orientation="right"
						stroke="#3b82f6"
						tick={{ fill: '#3b82f6', fontSize: 10 }}
						label={{
							value: 'Power (HP)',
							angle: 90,
							position: 'insideRight',
							fill: '#3b82f6',
							fontSize: 12,
						}}
					/>
					<Tooltip content={<CustomTooltip />} />

					{/* Previous Run (Dotted) */}
					{hasPreviousData && (
						<>
							<Line
								type="monotone"
								dataKey="prevTorque"
								stroke="#555"
								strokeWidth={2}
								strokeDasharray="5 5"
								dot={false}
								yAxisId="left"
								name="Prev Torque"
								isAnimationActive={false}
								connectNulls
							/>
							<Line
								type="monotone"
								dataKey="prevHp"
								stroke="#555"
								strokeWidth={2}
								strokeDasharray="5 5"
								dot={false}
								yAxisId="right"
								name="Prev HP"
								isAnimationActive={false}
								connectNulls
							/>
						</>
					)}

					{/* Current Run (Solid) */}
					{hasLiveData && (
						<>
							<Line
								type="monotone"
								dataKey="torque"
								stroke="#ef4444"
								strokeWidth={3}
								dot={false}
								yAxisId="left"
								name="Torque"
								isAnimationActive={false}
								connectNulls
							/>
							<Line
								type="monotone"
								dataKey="hp"
								stroke="#3b82f6"
								strokeWidth={3}
								dot={false}
								yAxisId="right"
								name="HP"
								isAnimationActive={false}
								connectNulls
							/>
						</>
					)}
				</LineChart>
			</ResponsiveContainer>
		);
	}
);

export default DynoGraph;
