import React from 'react';
import { Mission, TuningState, InventoryItem } from '@/types';
import { useSound } from '@/contexts/SoundContext';

interface VersusScreenProps {
	playerTuning: TuningState;
	mission: Mission;
	onConfirmRace: (wager: number) => void;
	onBack: () => void;
	ownedMods: string[];
	dynoHistory: { rpm: number; torque: number; hp: number }[];
	money: number;
	weather: { type: 'SUNNY' | 'RAIN'; intensity: number; season: any };
	setWeather: (w: {
		type: 'SUNNY' | 'RAIN';
		intensity: number;
		season: any;
	}) => void;
	userInventory?: InventoryItem[];
	onApplyWear?: (amount: number) => void;
}

const VersusScreen: React.FC<VersusScreenProps> = ({
	playerTuning,
	mission,
	onConfirmRace,
	onBack,
	ownedMods,
	dynoHistory,
	money,
	weather,
	setWeather,
}) => {
	const { play } = useSound();
	const [wager, setWager] = React.useState(0);

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
		noData = false,
	}: {
		label: string;
		pVal: number | null;
		oVal: number;
		unit: string;
		inverse?: boolean;
		noData?: boolean;
	}) => {
		if (noData || pVal === null) {
			return (
				<div className="flex justify-between items-center py-2 border-b border-gray-800">
					<div className="w-1/3 text-right font-mono font-bold text-xl text-gray-600">
						{oVal.toFixed(1)}
					</div>
					<div className="w-1/3 text-center text-xs text-gray-500 uppercase tracking-widest">
						{label}
						<span className="block text-[9px] opacity-50">
							{unit}
						</span>
					</div>
					<div className="w-1/3 text-left font-mono font-bold text-xl text-gray-500 italic">
						NO DATA
					</div>
				</div>
			);
		}

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
	// Use measured dyno data if available
	let pPower: number | null = null;
	let pTorque: number | null = null;

	if (dynoHistory && dynoHistory.length > 0) {
		pPower = Math.max(...dynoHistory.map((d) => d.hp));
		pTorque = Math.max(...dynoHistory.map((d) => d.torque));
	}

	// const pPower = (playerTuning.maxTorque * playerTuning.redlineRPM) / 7023;
	const oPower =
		(mission.opponent.tuning.maxTorque *
			mission.opponent.tuning.redlineRPM) /
		7023;

	const pWeight = playerTuning.mass;
	const oWeight = mission.opponent.tuning.mass;

	const pGrip = playerTuning.tireGrip;
	const oGrip = mission.opponent.tuning.tireGrip;

	// Calculate potential winnings based on difficulty
	const difficultyMultiplier =
		mission.difficulty === 'EASY'
			? 0.5
			: mission.difficulty === 'MEDIUM'
			? 1.0
			: mission.difficulty === 'HARD'
			? 2.0
			: mission.difficulty === 'EXTREME'
			? 3.0
			: mission.difficulty === 'IMPOSSIBLE'
			? 4.0
			: mission.difficulty === 'BOSS'
			? 5.0
			: mission.difficulty === 'UNDERGROUND'
			? 3.0
			: 3.0;

	return (
		<div className="absolute inset-0 bg-zinc-950 flex flex-col z-50 animate-in fade-in duration-500 font-pixel">
			{/* Header */}
			<div className="h-24 flex items-center justify-center relative bg-black/50 border-b-4 border-gray-800">
				<div className="text-4xl text-white pixel-text drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
					VS
				</div>
			</div>

			{/* Main Content */}
			<div className="flex-1 flex relative">
				{/* Opponent Side (Left) */}
				<div className="flex-1 bg-gradient-to-br from-red-950/20 to-black p-8 flex flex-col items-center justify-center border-r-4 border-gray-800 relative overflow-hidden">
					<div className="absolute top-4 left-4 text-red-500 text-2xl opacity-20 uppercase pixel-text">
						Opponent
					</div>
					<div className="w-full max-w-md">
						<CarModel
							color={mission.opponent.color}
							tuning={mission.opponent.tuning}
							isOpponent
						/>
						<div className="text-center mt-8">
							<h2 className="text-2xl text-red-500 uppercase mb-1 pixel-text">
								{mission.opponent.name}
							</h2>
							<div className="text-gray-500 text-xs">
								DIFFICULTY: {mission.difficulty}
							</div>
						</div>
					</div>
				</div>

				{/* Player Side (Right) */}
				<div className="flex-1 bg-gradient-to-bl from-indigo-950/20 to-black p-8 flex flex-col items-center justify-center relative overflow-hidden">
					<div className="absolute top-4 right-4 text-indigo-500 text-2xl opacity-20 uppercase pixel-text">
						You
					</div>
					<div className="w-full max-w-md">
						<CarModel
							color={playerTuning.color}
							tuning={playerTuning}
							ownedMods={ownedMods}
						/>
						<div className="text-center mt-8">
							<h2 className="text-2xl text-indigo-500 uppercase mb-1 pixel-text">
								Player
							</h2>
							<div className="text-gray-500 text-xs">
								READY TO RACE
							</div>
						</div>
					</div>
				</div>

				{/* Stats Overlay (Center) */}
				<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
					<div className="bg-black/90 pixel-panel p-6 w-[500px] shadow-2xl">
						<StatRow
							label="Power"
							pVal={pPower}
							oVal={oPower}
							unit="HP"
							noData={pPower === null}
						/>
						<StatRow
							label="Torque"
							pVal={pTorque}
							oVal={mission.opponent.tuning.maxTorque}
							unit="Nm"
							noData={pTorque === null}
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
			<div className="bg-black border-t-4 border-gray-800 px-12 py-6">
				<div className="flex items-center justify-between gap-8">
					<button
						onClick={onBack}
						className="text-gray-400 hover:text-white text-sm pixel-text transition-colors"
					>
						&lt; BACK
					</button>

					{/* Weather Selector */}
					<div className="flex flex-col items-center gap-2">
						<div className="text-gray-400 text-xs pixel-text mb-1">
							WEATHER CONDITIONS
						</div>
						<div className="flex gap-2">
							<button
								onClick={() => {
									setWeather({
										type: 'SUNNY',
										intensity: 0,
										season: weather.season,
									});
									play('ui_click');
								}}
								className={`pixel-btn px-6 py-2 transition-all ${
									weather.type === 'SUNNY'
										? 'bg-yellow-900/50 border-yellow-600 text-yellow-400'
										: 'bg-gray-800 border-gray-600 text-gray-400 hover:border-yellow-600/50'
								}`}
							>
								☀ SUNNY
							</button>
							<button
								onClick={() => {
									setWeather({
										type: 'RAIN',
										intensity: 0.8,
										season: weather.season,
									});
									play('ui_click');
								}}
								className={`pixel-btn px-6 py-2 transition-all ${
									weather.type === 'RAIN'
										? 'bg-blue-900/50 border-blue-600 text-blue-400'
										: 'bg-gray-800 border-gray-600 text-gray-400 hover:border-blue-600/50'
								}`}
							>
								🌧 RAIN
							</button>
						</div>
					</div>

					{/* Wager System */}
					<div className="flex flex-col gap-3 flex-1 max-w-2xl">
						<div className="flex items-center justify-between">
							<div className="text-gray-400 text-xs pixel-text">
								WAGER AMOUNT
							</div>
							<div className="text-green-400 text-sm pixel-text">
								YOUR MONEY: ${money.toLocaleString()}
							</div>
						</div>

						{/* Preset Wager Buttons */}
						<div className="flex gap-2">
							{[100, 500, 1000, 5000].map((amount) => (
								<button
									key={amount}
									onClick={() => {
										if (amount <= money) {
											setWager(amount);
											play('ui_click');
										}
									}}
									disabled={amount > money}
									className={`pixel-btn px-4 py-2 text-sm flex-1 transition-all ${
										wager === amount
											? 'bg-green-900/50 border-green-500 text-green-400'
											: amount > money
											? 'bg-gray-900 border-gray-700 text-gray-600 cursor-not-allowed'
											: 'bg-gray-800 border-gray-600 text-gray-300 hover:border-green-500/50'
									}`}
								>
									${amount}
								</button>
							))}
							<button
								onClick={() => {
									setWager(money);
									play('ui_click');
								}}
								disabled={money === 0}
								className={`pixel-btn px-4 py-2 text-sm flex-1 transition-all ${
									wager === money && money > 0
										? 'bg-red-900/50 border-red-500 text-red-400'
										: money === 0
										? 'bg-gray-900 border-gray-700 text-gray-600 cursor-not-allowed'
										: 'bg-gray-800 border-gray-600 text-gray-300 hover:border-red-500/50'
								}`}
							>
								MAX
							</button>
						</div>

						{/* Custom Input and Potential Winnings */}
						<div className="flex gap-4 items-center">
							<div className="flex-1 flex items-center gap-2">
								<span className="text-gray-400 text-sm pixel-text">
									$
								</span>
								<input
									type="number"
									value={wager}
									onChange={(e) => {
										const val = Math.max(
											0,
											Math.min(
												money,
												parseInt(
													(
														e.target as HTMLInputElement
													).value
												) || 0
											)
										);
										setWager(val);
									}}
									className="flex-1 bg-gray-900 border-2 border-gray-700 text-white px-3 py-2 text-sm pixel-text focus:border-green-500 focus:outline-none"
									placeholder="Enter custom amount..."
								/>
							</div>
							{wager > 0 && (
								<div className="flex items-center gap-2 px-4 py-2 bg-green-900/20 border-2 border-green-700 rounded">
									<span className="text-gray-400 text-xs pixel-text">
										POTENTIAL WIN:
									</span>
									<span className="text-green-400 text-lg pixel-text font-bold">
										$
										{(
											wager * difficultyMultiplier
										).toLocaleString()}
									</span>
								</div>
							)}
						</div>
					</div>

					{/* Start Race Button */}
					<button
						onClick={() => {
							if (wager <= money) {
								play('ui_select');
								onConfirmRace(wager);
							}
						}}
						disabled={wager > money}
						className={`pixel-btn px-12 py-4 text-xl transition-all ${
							wager > money
								? 'bg-gray-800 border-gray-700 text-gray-600 cursor-not-allowed'
								: 'bg-white text-black hover:bg-green-400 hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]'
						}`}
						style={
							wager <= money
								? { backgroundColor: '#fff', color: '#000' }
								: {}
						}
					>
						{wager === 0 ? 'FREE RACE' : 'START RACE'}
					</button>
				</div>
			</div>
		</div>
	);
};

export default VersusScreen;
