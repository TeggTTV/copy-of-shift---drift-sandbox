import React, { useEffect, useState, useRef } from 'react';
import { CarState, TuningState } from '../types';

interface DashboardProps {
	carState: CarState;
	tuning: TuningState;
	opponentState?: CarState;
	raceDistance: number;
}

const Dashboard: React.FC<DashboardProps> = ({
	carState,
	tuning,
	opponentState,
	raceDistance,
}) => {
	const speedKmh = Math.floor(carState.velocity * 3.6);
	const rpm = Math.round(carState.rpm);
	const gearLabel = carState.gear === 0 ? 'N' : carState.gear;

	// Ensure valid calculation even if redline is weird, default to 7000 if 0
	const redline = tuning.redlineRPM || 7000;
	const rpmPercent = Math.min((carState.rpm / redline) * 100, 100);

	// Shift Light Logic
	const isShiftPoint = rpmPercent > 90;
	const isRedline = rpmPercent >= 98;

	// Progress Bar
	const safeDistance = raceDistance || 400;
	const userProgress = Math.max(
		0,
		Math.min((carState.y / safeDistance) * 100, 100)
	);
	const oppProgress = opponentState
		? Math.max(0, Math.min((opponentState.y / safeDistance) * 100, 100))
		: 0;

	return (
		<div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between p-4 z-50">
			{/* Race Progress Top Bar */}
			<div className="w-full max-w-2xl mx-auto mt-4 bg-gray-900/90 rounded-full h-6 border-2 border-white/20 relative">
				{/* Finish Line Marker */}
				<div className="absolute right-0 top-0 h-full w-4 bg-white/10 z-0 flex items-center justify-center border-l border-white/30"></div>

				{/* Opponent Dot */}
				{opponentState && (
					<div
						className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-red-600 rounded-full shadow-[0_0_10px_rgba(220,38,38,1)] border border-white/50 z-10 transition-none"
						style={{ left: `calc(${oppProgress}% - 8px)` }}
					></div>
				)}

				{/* Player Dot */}
				<div
					className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-blue-500 border-2 border-white rounded-full shadow-[0_0_15px_rgba(59,130,246,1)] z-20 transition-none"
					style={{ left: `calc(${userProgress}% - 10px)` }}
				></div>

				{/* Labels */}
				<div className="absolute -bottom-6 left-0 text-[10px] text-gray-400 font-mono">
					START
				</div>
				<div className="absolute -bottom-6 right-0 text-[10px] text-gray-400 font-mono">
					FINISH
				</div>
			</div>

			{/* Bottom Cluster */}
			<div className="flex justify-center items-end w-full mb-8">
				<div className="bg-black/90 p-6 rounded-2xl border border-gray-800 shadow-2xl flex items-center gap-8 relative overflow-hidden">
					{/* Shift Light Glow Background */}
					<div
						className={`absolute inset-0 transition-opacity duration-100 ${
							isRedline
								? 'bg-red-600/30 animate-pulse'
								: isShiftPoint
								? 'bg-yellow-500/10'
								: 'opacity-0'
						}`}
					></div>

					{/* Gear Display */}
					<div className="text-center relative z-10">
						<div className="text-xs text-gray-500 font-mono mb-1">
							GEAR
						</div>
						<div
							className={`text-6xl font-black font-mono w-24 h-24 flex items-center justify-center rounded-xl border-4 ${
								isShiftPoint
									? 'border-yellow-500 text-yellow-500'
									: 'border-gray-700 text-white'
							} bg-gray-900`}
						>
							{gearLabel}
						</div>
					</div>

					{/* Center Tacho */}
					<div className="relative z-10 w-80">
						<div className="flex justify-between text-xs font-mono text-gray-400 mb-1">
							<span>RPM</span>
							<span className="text-white">{rpm}</span>
						</div>
						{/* RPM Bar - Removed transition-all for instant response */}
						<div className="h-8 bg-gray-800 rounded-lg overflow-hidden border border-gray-700 relative">
							{/* Tick Marks */}
							<div className="absolute top-0 left-[25%] bottom-0 w-0.5 bg-gray-700 z-0"></div>
							<div className="absolute top-0 left-[50%] bottom-0 w-0.5 bg-gray-700 z-0"></div>
							<div className="absolute top-0 left-[75%] bottom-0 w-0.5 bg-gray-700 z-0"></div>

							{/* Redline Marker */}
							<div className="absolute top-0 left-[90%] bottom-0 w-full bg-red-900/30 z-0"></div>

							<div
								className={`h-full ease-out ${
									isRedline
										? 'bg-red-500'
										: isShiftPoint
										? 'bg-yellow-400'
										: 'bg-gradient-to-r from-blue-600 to-blue-400'
								}`}
								style={{ width: `${rpmPercent}%` }}
							></div>
						</div>
						<div className="flex justify-between text-[10px] text-gray-600 mt-1 font-mono">
							<span>0</span>
							<span>{Math.round(redline / 2)}</span>
							<span className="text-red-500">{redline}</span>
						</div>
					</div>

					{/* Speed & Stats */}
					<div className="text-right relative z-10 w-32 flex flex-col items-end">
						<div className="text-7xl font-bold italic tracking-tighter text-white leading-none">
							{speedKmh}
						</div>
						<div className="text-xl font-bold text-gray-500 mb-2">
							KM/H
						</div>

						<div className="flex items-center gap-2 text-xs font-mono text-gray-400 border-t border-gray-800 pt-2 w-full justify-end">
							<span>DIST</span>
							<span className="text-white">
								{Math.floor(carState.y)}m
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Shift Hint */}
			{isShiftPoint && !isRedline && (
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-yellow-400 font-black text-6xl italic animate-pulse tracking-widest pointer-events-none drop-shadow-lg opacity-80">
					SHIFT!
				</div>
			)}
		</div>
	);
};

export default Dashboard;
