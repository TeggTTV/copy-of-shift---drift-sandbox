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
	const [estimates, setEstimates] = useState<{
		zeroToSixty: number;
		quarterMileTime: number;
		quarterMileSpeed: number;
	} | null>(null);

	const animationRef = useRef<number>();
	const startTimeRef = useRef<number>(0);
	const historyRef = useRef<{ rpm: number; torque: number; hp: number }[]>(
		[]
	);

	useEffect(() => {
		// Calculate estimates whenever tuning changes
		import('../../utils/performance').then(({ calculatePerformance }) => {
			const stats = calculatePerformance(playerTuning);
			setEstimates(stats);
		});
	}, [playerTuning]);

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
		<div className="flex flex-col h-full text-gray-300 space-y-4 font-pixel">
			<div className="pixel-panel p-4">
				<div className="flex justify-between items-end mb-2">
					<span className="text-xs text-gray-400">CURRENT RPM</span>
					<span className="text-xl text-white">{rpm}</span>
				</div>
				<div className="w-full bg-gray-800 h-4 border-2 border-gray-600 relative">
					<div
						className="h-full bg-indigo-500 transition-all duration-75"
						style={{
							width: `${(rpm / playerTuning.redlineRPM) * 100}%`,
						}}
					/>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="pixel-panel p-4">
					<div className="text-[10px] text-gray-500 mb-1">
						PEAK POWER
					</div>
					<div className="text-xl text-blue-500">
						{Math.round(peakPower)}{' '}
						<span className="text-xs">HP</span>
					</div>
				</div>
				<div className="pixel-panel p-4">
					<div className="text-[10px] text-gray-500 mb-1">
						PEAK TORQUE
					</div>
					<div className="text-xl text-red-500">
						{Math.round(peakTorque)}{' '}
						<span className="text-xs">Nm</span>
					</div>
				</div>
			</div>

			{/* Performance Estimates Panel */}
			<div className="pixel-panel p-4">
				<h3 className="text-xs text-gray-400 mb-3 border-b-2 border-gray-700 pb-2">
					PERFORMANCE ESTIMATES
				</h3>
				{estimates ? (
					<div className="grid grid-cols-3 gap-2 text-center">
						<div>
							<div className="text-[10px] text-gray-500 mb-1">
								0-60 MPH
							</div>
							<div className="text-sm text-white">
								{estimates.zeroToSixty > 0
									? estimates.zeroToSixty + 's'
									: '---'}
							</div>
						</div>
						<div>
							<div className="text-[10px] text-gray-500 mb-1">
								1/4 MILE
							</div>
							<div className="text-sm text-white">
								{estimates.quarterMileTime > 0
									? estimates.quarterMileTime + 's'
									: '---'}
							</div>
						</div>
						<div>
							<div className="text-[10px] text-gray-500 mb-1">
								TRAP SPEED
							</div>
							<div className="text-sm text-white">
								{estimates.quarterMileSpeed > 0
									? estimates.quarterMileSpeed + ' mph'
									: '---'}
							</div>
						</div>
					</div>
				) : (
					<div className="text-center text-gray-600 italic text-[10px]">
						Calculating...
					</div>
				)}
			</div>

			<button
				onClick={runDyno}
				disabled={isRunning}
				className={`w-full pixel-btn ${
					isRunning ? 'opacity-50 cursor-not-allowed' : ''
				}`}
			>
				{isRunning ? 'Running...' : 'Start Run'}
			</button>
		</div>
	);
};

export default DynoTab;
