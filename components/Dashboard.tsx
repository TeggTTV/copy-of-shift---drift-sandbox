import React, { useEffect, useRef, useState } from 'react';
import { CarState, TuningState } from '../types';
import { TORQUE_CURVE } from '../constants';
import { AudioEngine } from './AudioEngine';
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	ResponsiveContainer,
	ReferenceLine,
} from 'recharts';

interface DashboardProps {
	carState: CarState;
	tuning: TuningState;
	audioEngine?: AudioEngine;
}

const Dashboard: React.FC<DashboardProps> = ({
	carState,
	tuning,
	audioEngine,
}) => {
	const speedMs = Math.abs(carState.speed).toFixed(1);
	const rpm = Math.round(carState.rpm);

	let gearLabel = 'N';
	if (carState.gear === -1) gearLabel = 'R';
	else if (carState.gear > 0) gearLabel = carState.gear.toString();

	const rpmPercent = Math.min((carState.rpm / tuning.redlineRPM) * 100, 100);

	let rpmColor = 'bg-blue-500';
	if (rpmPercent > 70) rpmColor = 'bg-green-500';
	if (rpmPercent > 85) rpmColor = 'bg-yellow-500';
	if (rpmPercent > 95) rpmColor = 'bg-red-600';

	const isDrifting = carState.isDrifting;

	// Visualizer Logic
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [visualizerMode, setVisualizerMode] = useState<'freq' | 'wave'>(
		'freq'
	);

	useEffect(() => {
		if (!audioEngine || !canvasRef.current) return;

		const canvas = canvasRef.current;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		let animId: number;
		const analyser = audioEngine.analyser;
		const bufferLength = analyser ? analyser.frequencyBinCount : 0;
		const dataArray = new Uint8Array(bufferLength);

		const drawVisualizer = () => {
			if (!analyser) return;

			animId = requestAnimationFrame(drawVisualizer);
			ctx.fillStyle = 'rgba(10, 10, 15, 0.4)'; // Fade out effect
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			if (visualizerMode === 'freq') {
				analyser.getByteFrequencyData(dataArray);
				// We only care about lower frequencies for the car engine mostly, but let's show all
				const barWidth = canvas.width / (bufferLength * 0.7); // Zoom in slightly
				let x = 0;

				for (let i = 0; i < bufferLength * 0.7; i++) {
					const v = dataArray[i];
					const barHeight = (v / 255) * canvas.height;

					// Heatmap style gradient
					const hue = 200 + (v / 255) * 160;
					ctx.fillStyle = `hsl(${hue}, 80%, 50%)`;

					// Draw bars
					ctx.fillRect(
						x,
						canvas.height - barHeight,
						barWidth,
						barHeight
					);

					// Top pixel
					if (barHeight > 0) {
						ctx.fillStyle = '#fff';
						ctx.fillRect(
							x,
							canvas.height - barHeight - 2,
							barWidth,
							2
						);
					}

					x += barWidth + 1;
				}
			} else {
				analyser.getByteTimeDomainData(dataArray);
				ctx.lineWidth = 2;
				ctx.strokeStyle = '#6366f1'; // Indigo
				ctx.beginPath();
				const sliceWidth = canvas.width / bufferLength;
				let x = 0;
				for (let i = 0; i < bufferLength; i++) {
					const v = dataArray[i] / 128.0;
					const y = v * (canvas.height / 2);
					if (i === 0) ctx.moveTo(x, y);
					else ctx.lineTo(x, y);
					x += sliceWidth;
				}
				ctx.lineTo(canvas.width, canvas.height / 2);
				ctx.stroke();
			}
		};

		drawVisualizer();
		return () => cancelAnimationFrame(animId);
	}, [audioEngine, visualizerMode]);

	return (
		<div className="absolute bottom-0 left-0 w-full p-4 pointer-events-none flex flex-col items-end justify-between gap-4 md:flex-row">
			{/* Left Cluster: Stats */}
			<div className="bg-black/90 text-white p-4 rounded-xl backdrop-blur-md border border-white/10 w-full md:w-96 shadow-2xl relative overflow-hidden group">
				{/* Glow effect */}
				<div
					className={`absolute -top-10 -right-10 w-40 h-40 bg-indigo-600/30 blur-3xl rounded-full transition-opacity duration-500 ${
						rpmPercent > 80 ? 'opacity-100' : 'opacity-0'
					}`}
				></div>

				{isDrifting && (
					<div className="absolute top-0 right-0 p-2 opacity-30 animate-pulse pointer-events-none">
						<span className="text-4xl font-black italic text-purple-500">
							DRIFT
						</span>
					</div>
				)}

				<div className="flex justify-between items-center mb-2 relative z-10">
					<div className="text-5xl font-bold font-mono tracking-tighter text-white drop-shadow-lg">
						{speedMs}{' '}
						<span className="text-lg text-gray-500 font-normal">
							m/s
						</span>
					</div>
					<div
						className={`border-2 w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold shadow-inner transition-colors duration-200 ${
							isDrifting
								? 'border-purple-500 text-purple-500 bg-purple-900/20'
								: 'border-gray-600 text-white bg-gray-800'
						}`}
					>
						{gearLabel}
					</div>
				</div>

				{/* RPM Bar */}
				<div className="mb-1 flex justify-between text-[10px] text-gray-500 font-mono">
					<span>IDLE</span>
					<span
						className={
							rpmPercent > 90 ? 'text-red-500 animate-pulse' : ''
						}
					>
						{rpm} RPM
					</span>
					<span>LIMIT</span>
				</div>
				<div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden border border-gray-700 mb-4 shadow-inner">
					<div
						className={`h-full transition-all duration-75 ease-out ${rpmColor}`}
						style={{ width: `${rpmPercent}%` }}
					/>
				</div>

				{/* Visualizer Area */}
				<div className="w-full h-24 bg-gray-950 rounded mb-2 overflow-hidden relative border border-gray-800 pointer-events-auto">
					<canvas
						ref={canvasRef}
						width={350}
						height={96}
						className="w-full h-full opacity-90"
					/>
					{/* Visualizer Controls */}
					<div className="absolute top-1 left-1 flex gap-1">
						<button
							onClick={() => setVisualizerMode('freq')}
							className={`text-[8px] px-2 py-1 rounded transition-colors ${
								visualizerMode === 'freq'
									? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/50'
									: 'bg-gray-800 text-gray-400 hover:bg-gray-700'
							}`}
						>
							SPECTRUM
						</button>
						<button
							onClick={() => setVisualizerMode('wave')}
							className={`text-[8px] px-2 py-1 rounded transition-colors ${
								visualizerMode === 'wave'
									? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/50'
									: 'bg-gray-800 text-gray-400 hover:bg-gray-700'
							}`}
						>
							WAVEFORM
						</button>
					</div>
				</div>

				<div className="mt-2 flex justify-between items-center relative z-10">
					<div className="font-mono text-xs text-gray-500">
						SLIP: {(carState.slipAngle * 57.29).toFixed(1)}°
					</div>
					<div className="font-mono text-xs text-gray-500">
						GRIP: {(carState.gripRatio * 100).toFixed(0)}%
					</div>
				</div>
			</div>

			{/* Middle: Controls Help */}
			<div className="hidden lg:block bg-black/50 text-white/60 p-4 rounded-xl text-sm font-mono backdrop-blur-sm border border-white/5">
				<div className="grid grid-cols-2 gap-x-8 gap-y-1">
					<span>W</span> <span>Gas</span>
					<span>A / D</span> <span>Steer</span>
					<span>S</span> <span>Brake</span>
					<span>SPACE</span> <span>E-Brake</span>
					<span>SHIFT</span> <span>Clutch</span>
					<span>↑ / ↓</span> <span>Gear Shift</span>
				</div>
			</div>

			{/* Right: Torque Curve */}
			<div className="bg-black/90 p-4 rounded-xl w-full md:w-64 h-48 border border-white/10 shadow-xl hidden sm:block">
				<h3 className="text-gray-500 text-[10px] uppercase font-bold mb-2 tracking-widest">
					Power Band
				</h3>
				<div className="h-32 w-full">
					<ResponsiveContainer width="100%" height="100%">
						<LineChart data={TORQUE_CURVE}>
							<XAxis
								dataKey="rpm"
								hide
								domain={[0, 9000]}
								type="number"
							/>
							<YAxis hide domain={[0, 1.2]} />
							<Line
								type="monotone"
								dataKey="factor"
								stroke="#6366f1"
								strokeWidth={2}
								dot={false}
								isAnimationActive={false}
							/>
							<ReferenceLine
								x={carState.rpm}
								stroke="#ef4444"
								strokeDasharray="3 3"
							/>
						</LineChart>
					</ResponsiveContainer>
				</div>
			</div>
		</div>
	);
};

export default Dashboard;
