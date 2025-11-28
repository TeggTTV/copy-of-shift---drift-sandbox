import React, { useState, useRef, useEffect } from 'react';
import { TuningState } from '../../types';
import { interpolateTorque } from '../../utils/physics';

interface DynoTabProps {
	playerTuning: TuningState;
	onUpdateHistory: (
		history: { rpm: number; torque: number; hp: number }[]
	) => void;
	onRunStart?: () => void;
}

const DynoTab: React.FC<DynoTabProps> = ({
	playerTuning,
	onUpdateHistory,
	onRunStart,
}) => {
	const [isRunning, setIsRunning] = useState(false);
	const [rpm, setRpm] = useState(0);
	const [peakPower, setPeakPower] = useState(0);
	const [peakTorque, setPeakTorque] = useState(0);

	const animationRef = useRef<number>();
	const startTimeRef = useRef<number>(0);
	const historyRef = useRef<{ rpm: number; torque: number; hp: number }[]>(
		[]
	);

	const runDyno = () => {
		if (isRunning) return;
		if (onRunStart) onRunStart();
		setIsRunning(true);
		historyRef.current = [];
		onUpdateHistory([]);
		setPeakPower(0);
		setPeakTorque(0);
		startTimeRef.current = performance.now();

		const animate = (time: number) => {
			const elapsed = time - startTimeRef.current;
			const duration = 5000; // 5 second sweep
			const progress = Math.min(elapsed / duration, 1);

			const currentRpm = Math.floor(progress * playerTuning.redlineRPM);

			if (currentRpm > 0) {
				const torqueFactor = interpolateTorque(
					currentRpm,
					playerTuning.torqueCurve
				);
				const torque = playerTuning.maxTorque * torqueFactor;
				const hp = (torque * currentRpm) / 7023;

				setRpm(currentRpm);

				// Only add point if it's a new RPM step (to avoid too many points)
				if (
					historyRef.current.length === 0 ||
					historyRef.current[historyRef.current.length - 1].rpm !==
						currentRpm
				) {
					historyRef.current.push({ rpm: currentRpm, torque, hp });
					onUpdateHistory([...historyRef.current]);
				}

				setPeakPower((prev) => Math.max(prev, hp));
				setPeakTorque((prev) => Math.max(prev, torque));
			}

			if (progress < 1) {
				animationRef.current = requestAnimationFrame(animate);
			} else {
				setIsRunning(false);
			}
		};

		animationRef.current = requestAnimationFrame(animate);
	};

	useEffect(() => {
		return () => {
			if (animationRef.current)
				cancelAnimationFrame(animationRef.current);
		};
	}, []);

	return (
		<div className="flex flex-col h-full text-gray-300 space-y-4">
			<div className="bg-black/40 p-4 rounded border border-gray-700">
				<div className="flex justify-between items-end mb-2">
					<span className="text-sm font-mono text-gray-400">
						CURRENT RPM
					</span>
					<span className="text-2xl font-mono font-bold text-white">
						{rpm}
					</span>
				</div>
				<div className="w-full bg-gray-800 h-2 rounded overflow-hidden">
					<div
						className="h-full bg-indigo-500 transition-all duration-75"
						style={{
							width: `${(rpm / playerTuning.redlineRPM) * 100}%`,
						}}
					/>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="bg-black/40 p-3 rounded border border-gray-700">
					<div className="text-xs text-gray-500 uppercase">
						Peak Power
					</div>
					<div className="text-xl font-bold text-green-400">
						{peakPower.toFixed(1)}{' '}
						<span className="text-sm text-gray-500">HP</span>
					</div>
				</div>
				<div className="bg-black/40 p-3 rounded border border-gray-700">
					<div className="text-xs text-gray-500 uppercase">
						Peak Torque
					</div>
					<div className="text-xl font-bold text-blue-400">
						{peakTorque.toFixed(1)}{' '}
						<span className="text-sm text-gray-500">Nm</span>
					</div>
				</div>
			</div>

			<button
				onClick={runDyno}
				disabled={isRunning}
				className={`w-full py-4 font-bold text-lg uppercase tracking-wider rounded transition-all ${
					isRunning
						? 'bg-gray-700 text-gray-500 cursor-not-allowed'
						: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20'
				}`}
			>
				{isRunning ? 'Running Dyno...' : 'Start Dyno Run'}
			</button>

			<div className="text-xs text-gray-500 mt-4 text-center">
				Run a dyno test to verify your engine's power curve and peak
				performance.
			</div>
		</div>
	);
};

export default DynoTab;
