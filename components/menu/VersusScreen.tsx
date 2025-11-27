import React from 'react';
import { Mission, TuningState } from '../../types';
import { useSound } from '../../contexts/SoundContext';

interface VersusScreenProps {
	playerTuning: TuningState;
	mission: Mission;
	onConfirmRace: () => void;
	onBack: () => void;
	ownedMods: string[];
}

const VersusScreen: React.FC<VersusScreenProps> = ({
	playerTuning,
	mission,
	onConfirmRace,
	onBack,
	ownedMods,
}) => {
	const { play } = useSound();
	const CarModel = ({
		color,
		tuning,
		isOpponent = false,
		ownedMods = [],
	}: {
		color: string;
		tuning: any;
		isOpponent?: boolean;
		ownedMods?: string[];
	}) => {
		const hasSpoiler = ownedMods.some((id) => id.includes('spoiler'));

		return (
			<div className="relative">
				<svg
					width="100%"
					height="200"
					viewBox="0 0 200 100"
					className={`drop-shadow-2xl ${
						isOpponent ? 'scale-x-[-1]' : ''
					}`}
				>
					{/* Shadow */}
					<ellipse
						cx="100"
						cy="85"
						rx="90"
						ry="10"
						fill="black"
						opacity="0.5"
					/>
					{/* Car Body */}
					<path
						d="M20,70 L40,50 L70,45 L130,45 L160,55 L190,60 L190,75 L170,80 L50,80 L20,75 Z"
						fill={color}
						stroke="#111"
						strokeWidth="2"
					/>
					{/* Roof/Windows */}
					<path
						d="M45,50 L60,30 L130,30 L150,55"
						fill="#333"
						stroke="#111"
						strokeWidth="2"
					/>
					{/* Wheels */}
					<circle
						cx="45"
						cy="80"
						r="14"
						fill="#111"
						stroke="#333"
						strokeWidth="2"
					/>
					<circle
						cx="45"
						cy="80"
						r="8"
						fill="#222"
						stroke="#555"
						strokeWidth="1"
					/>
					<circle
						cx="155"
						cy="80"
						r="14"
						fill="#111"
						stroke="#333"
						strokeWidth="2"
					/>
					<circle
						cx="155"
						cy="80"
						r="8"
						fill="#222"
						stroke="#555"
						strokeWidth="1"
					/>
					{/* Spoiler */}
					{hasSpoiler && (
						<path
							d="M10,35 L20,35 L25,55 L10,55 Z"
							fill={color}
							stroke="#111"
							strokeWidth="2"
						/>
					)}
					{/* Stock Spoiler (if no custom one) */}
					{!hasSpoiler && (
						<path
							d="M10,45 L20,45 L25,55"
							stroke={color}
							strokeWidth="4"
							fill="none"
						/>
					)}
				</svg>
			</div>
		);
	};

	const StatRow = ({
		label,
		pVal,
		oVal,
		unit,
		inverse = false,
	}: {
		label: string;
		pVal: number;
		oVal: number;
		unit: string;
		inverse?: boolean;
	}) => {
		const pBetter = inverse ? pVal < oVal : pVal > oVal;
		const oBetter = inverse ? oVal < pVal : oVal > pVal;
		const equal = Math.abs(pVal - oVal) < 0.1;

		return (
			<div className="flex justify-between items-center py-2 border-b border-gray-800">
				<div
					className={`w-1/3 text-right font-mono font-bold text-xl ${
						oBetter
							? 'text-red-500'
							: equal
							? 'text-gray-400'
							: 'text-gray-600'
					}`}
				>
					{oVal.toFixed(1)}
				</div>
				<div className="w-1/3 text-center text-xs text-gray-500 uppercase tracking-widest">
					{label}
					<span className="block text-[9px] opacity-50">{unit}</span>
				</div>
				<div
					className={`w-1/3 text-left font-mono font-bold text-xl ${
						pBetter
							? 'text-green-500'
							: equal
							? 'text-gray-400'
							: 'text-gray-600'
					}`}
				>
					{pVal.toFixed(1)}
				</div>
			</div>
		);
	};

	// Calculate Stats
	const pPower = (playerTuning.maxTorque * playerTuning.redlineRPM) / 7023;
	const oPower =
		(mission.opponent.tuning.maxTorque *
			mission.opponent.tuning.redlineRPM) /
		7023;

	const pWeight = playerTuning.mass;
	const oWeight = mission.opponent.tuning.mass;

	const pGrip = playerTuning.tireGrip;
	const oGrip = mission.opponent.tuning.tireGrip;

	return (
		<div className="absolute inset-0 bg-zinc-950 flex flex-col z-50 animate-in fade-in duration-500">
			{/* Header */}
			<div className="h-24 flex items-center justify-center relative bg-black/50 border-b border-gray-800">
				<div className="text-6xl font-black italic tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
					VS
				</div>
			</div>

			{/* Main Content */}
			<div className="flex-1 flex relative">
				{/* Opponent Side (Left) */}
				<div className="flex-1 bg-gradient-to-br from-red-950/20 to-black p-8 flex flex-col items-center justify-center border-r border-gray-800 relative overflow-hidden">
					<div className="absolute top-4 left-4 text-red-500 font-black text-4xl opacity-20 uppercase tracking-tighter">
						Opponent
					</div>
					<div className="w-full max-w-md">
						<CarModel
							color={mission.opponent.color}
							tuning={mission.opponent.tuning}
							isOpponent
						/>
						<div className="text-center mt-8">
							<h2 className="text-3xl font-bold text-red-500 uppercase tracking-tight mb-1">
								{mission.opponent.name}
							</h2>
							<div className="text-gray-500 text-sm font-mono">
								DIFFICULTY: {mission.difficulty}
							</div>
						</div>
					</div>
				</div>

				{/* Player Side (Right) */}
				<div className="flex-1 bg-gradient-to-bl from-indigo-950/20 to-black p-8 flex flex-col items-center justify-center relative overflow-hidden">
					<div className="absolute top-4 right-4 text-indigo-500 font-black text-4xl opacity-20 uppercase tracking-tighter">
						You
					</div>
					<div className="w-full max-w-md">
						<CarModel
							color={playerTuning.color}
							tuning={playerTuning}
							ownedMods={ownedMods}
						/>
						<div className="text-center mt-8">
							<h2 className="text-3xl font-bold text-indigo-500 uppercase tracking-tight mb-1">
								Player
							</h2>
							<div className="text-gray-500 text-sm font-mono">
								READY TO RACE
							</div>
						</div>
					</div>
				</div>

				{/* Stats Overlay (Center) */}
				<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
					<div className="bg-black/80 backdrop-blur-sm border border-gray-800 rounded-xl p-6 w-[500px] shadow-2xl">
						<StatRow
							label="Power"
							pVal={pPower}
							oVal={oPower}
							unit="HP"
						/>
						<StatRow
							label="Torque"
							pVal={playerTuning.maxTorque}
							oVal={mission.opponent.tuning.maxTorque}
							unit="Nm"
						/>
						<StatRow
							label="Weight"
							pVal={pWeight}
							oVal={oWeight}
							unit="kg"
							inverse
						/>
						<StatRow
							label="Grip"
							pVal={pGrip}
							oVal={oGrip}
							unit="Coeff"
						/>
						<StatRow
							label="Redline"
							pVal={playerTuning.redlineRPM}
							oVal={mission.opponent.tuning.redlineRPM}
							unit="RPM"
						/>
					</div>
				</div>
			</div>

			{/* Footer Actions */}
			<div className="h-24 bg-black border-t border-gray-800 flex items-center justify-between px-12 gap-6">
				<button
					onClick={onBack}
					className="text-gray-400 hover:text-white font-bold text-xl"
				>
					&larr; BACK
				</button>
				<div className="flex items-center gap-6">
					<div className="text-gray-500 text-sm">
						Make sure your tune is ready...
					</div>
					<button
						onClick={onConfirmRace}
						className="bg-white text-black px-12 py-4 text-2xl font-black italic hover:bg-green-400 hover:scale-105 transition-all skew-x-[-10deg] shadow-[0_0_20px_rgba(255,255,255,0.3)]"
					>
						START RACE
					</button>
				</div>
			</div>
		</div>
	);
};

export default VersusScreen;
