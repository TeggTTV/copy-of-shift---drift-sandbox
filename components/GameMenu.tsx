import React, { useState, useMemo } from 'react';
import { GamePhase, Mission, ModNode, TuningState } from '../types';
import { MISSIONS, MOD_TREE, BASE_TUNING } from '../constants';
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from 'recharts';

const GameMenu = ({
	phase,
	setPhase,
	money,
	playerTuning,
	setPlayerTuning,
	ownedMods,
	setOwnedMods,
	missions,
	onStartMission,
	onConfirmRace,
	selectedMission,
}: {
	phase: GamePhase;
	setPhase: (p: GamePhase) => void;
	money: number;
	playerTuning: TuningState;
	setPlayerTuning: React.Dispatch<React.SetStateAction<TuningState>>;
	ownedMods: string[];
	setOwnedMods: (mod: ModNode) => void;
	missions: Mission[];
	onStartMission: (m: Mission) => void;
	onConfirmRace?: () => void;
	selectedMission?: Mission | null;
}) => {
	const [activeTab, setActiveTab] = useState<'UPGRADES' | 'TUNING'>(
		'UPGRADES'
	);
	const [hoveredMod, setHoveredMod] = React.useState<ModNode | null>(null);

	// Calculate preview tuning for hover
	const previewTuning = useMemo(() => {
		if (!hoveredMod) return null;

		// Create a copy of current tuning
		const preview = { ...playerTuning };

		// Add the hovered mod's stats (additive logic)
		Object.keys(hoveredMod.stats).forEach((key) => {
			const modValue = (hoveredMod.stats as any)[key];
			const currentValue = (preview as any)[key];

			// If both are numbers, ADD them
			if (
				typeof modValue === 'number' &&
				typeof currentValue === 'number'
			) {
				(preview as any)[key] = currentValue + modValue;
			} else {
				// For non-numeric values (arrays, strings), replace
				(preview as any)[key] = modValue;
			}
		});

		return preview;
	}, [playerTuning, hoveredMod]);

	if (phase === 'VERSUS' && selectedMission && onConfirmRace) {
		return (
			<VersusScreen
				playerTuning={playerTuning}
				mission={selectedMission}
				onConfirmRace={onConfirmRace}
				onBack={() => setPhase('MAP')}
				ownedMods={ownedMods}
			/>
		);
	}

	if (phase === 'MAP') {
		return (
			<div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center text-white z-50">
				<h1 className="text-6xl font-black italic tracking-tighter text-indigo-500 mb-2">
					Drag
				</h1>
				<p className="text-gray-400 mb-12 font-mono">
					VERTICAL DRAG RACING SIMULATOR
				</p>

				<div className="flex flex-col gap-4 w-64">
					<button
						onClick={() => setPhase('MISSION_SELECT')}
						className="py-4 bg-white text-black font-bold text-xl hover:bg-indigo-400 hover:scale-105 transition-all skew-x-[-10deg]"
					>
						RACE
					</button>
					<button
						onClick={() => setPhase('GARAGE')}
						className="py-4 bg-gray-800 text-white font-bold text-xl border border-gray-700 hover:border-indigo-500 hover:text-indigo-400 transition-all skew-x-[-10deg]"
					>
						GARAGE
					</button>
				</div>
			</div>
		);
	}

	if (phase === 'MISSION_SELECT') {
		return (
			<div className="absolute inset-0 bg-neutral-900 flex flex-col items-center py-10 text-white z-50 overflow-y-auto">
				<div className="w-full max-w-4xl px-4">
					<div className="flex justify-between items-center mb-8">
						<button
							onClick={() => setPhase('MAP')}
							className="text-gray-400 hover:text-white"
						>
							&larr; BACK
						</button>
						<h2 className="text-3xl font-bold italic">
							SELECT MISSION
						</h2>
						<div className="font-mono text-green-400">${money}</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{missions.map((m) => (
							<div
								key={m.id}
								className="bg-black border border-gray-800 p-6 rounded-xl hover:border-indigo-500 transition-all group relative overflow-hidden"
							>
								<div className="relative z-10">
									<div className="flex justify-between items-start mb-2">
										<h3 className="text-2xl font-bold italic">
											{m.name}
										</h3>
										<span className="bg-green-900 text-green-300 px-2 py-1 text-xs font-mono rounded">
											${m.payout}
										</span>
									</div>
									<p className="text-gray-400 text-sm mb-4 h-10">
										{m.description}
									</p>

									<div className="flex justify-between items-end">
										<div className="flex flex-col gap-1">
											<div className="text-xs text-gray-500 uppercase">
												Opponent
											</div>
											<div className="font-bold flex items-center gap-2">
												<div
													className="w-3 h-3 rounded-full"
													style={{
														background:
															m.opponent.color,
													}}
												></div>
												{m.opponent.name}
											</div>
										</div>
										<div className="text-right">
											{m.bestTime ? (
												<div className="text-yellow-500 font-mono text-sm">
													Best:{' '}
													{m.bestTime.toFixed(3)}s
												</div>
											) : (
												<div className="text-gray-600 font-mono text-xs">
													NO RECORD
												</div>
											)}
											<div className="text-xs text-indigo-400">
												{m.distance}m
											</div>
										</div>
									</div>

									<button
										onClick={() => onStartMission(m)}
										className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-500 font-bold rounded uppercase tracking-widest shadow-lg shadow-indigo-900/20"
									>
										RACE
									</button>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}

	if (phase === 'GARAGE') {
		return (
			<div className="absolute inset-0 bg-neutral-900 flex flex-col items-center z-50 overflow-hidden">
				<div className="w-full h-full flex flex-col">
					<div className="flex justify-between items-center p-6 border-b border-gray-800 bg-black/50">
						<button
							onClick={() => setPhase('MAP')}
							className="text-gray-400 hover:text-white"
						>
							&larr; BACK
						</button>
						<h2 className="text-3xl font-bold italic">
							MODIFICATION SHOP
						</h2>
						<div className="font-mono text-green-400 text-2xl">
							${money}
						</div>
					</div>

					<div className="flex-1 flex overflow-hidden">
						{/* Left Panel: Stats & Tuning */}
						<div className="w-1/3 bg-black/30 p-6 border-r border-gray-800 overflow-y-auto">
							<h3 className="text-xl font-bold text-gray-300 mb-4">
								DYNO GRAPH
							</h3>
							<div className="h-[280px] w-full bg-black/50 rounded mb-6 border border-gray-800 p-4">
								<DynoGraph tuning={playerTuning} />
							</div>

							<div className="space-y-4 font-mono text-sm">
								<div className="flex justify-between border-b border-gray-800 pb-2">
									<span className="text-gray-500">
										PEAK TORQUE
									</span>
									<span className="text-white font-bold">
										{playerTuning.maxTorque} Nm
										<StatDiff
											current={playerTuning.maxTorque}
											preview={previewTuning?.maxTorque}
											suffix=" Nm"
										/>
									</span>
								</div>
								<div className="flex justify-between border-b border-gray-800 pb-2">
									<span className="text-gray-500">
										PEAK POWER
									</span>
									<span className="text-white font-bold">
										{Math.round(
											(playerTuning.maxTorque *
												playerTuning.redlineRPM) /
												9549
										)}{' '}
										HP
										<StatDiff
											current={Math.round(
												(playerTuning.maxTorque *
													playerTuning.redlineRPM) /
													9549
											)}
											preview={
												previewTuning
													? Math.round(
															(previewTuning.maxTorque *
																previewTuning.redlineRPM) /
																9549
													  )
													: null
											}
											suffix=" HP"
										/>
									</span>
								</div>
								<div className="flex justify-between border-b border-gray-800 pb-2">
									<span className="text-gray-500">
										REDLINE
									</span>
									<span className="text-white font-bold">
										{playerTuning.redlineRPM} RPM
										<StatDiff
											current={playerTuning.redlineRPM}
											preview={previewTuning?.redlineRPM}
											suffix=" RPM"
										/>
									</span>
								</div>
								<div className="flex justify-between border-b border-gray-800 pb-2">
									<span className="text-gray-500">
										WEIGHT
									</span>
									<span className="text-white font-bold">
										{playerTuning.mass} KG
										<StatDiff
											current={playerTuning.mass}
											preview={previewTuning?.mass}
											suffix=" KG"
											invertColor={true}
										/>
									</span>
								</div>
								<div className="flex justify-between border-b border-gray-800 pb-2">
									<span className="text-gray-500">
										POWER/WEIGHT
									</span>
									<span className="text-white font-bold">
										{(
											(Math.round(
												(playerTuning.maxTorque *
													playerTuning.redlineRPM) /
													9549
											) /
												playerTuning.mass) *
											1000
										).toFixed(1)}{' '}
										HP/ton
										<StatDiff
											current={
												(Math.round(
													(playerTuning.maxTorque *
														playerTuning.redlineRPM) /
														9549
												) /
													playerTuning.mass) *
												1000
											}
											preview={
												previewTuning
													? (Math.round(
															(previewTuning.maxTorque *
																previewTuning.redlineRPM) /
																9549
													  ) /
															previewTuning.mass) *
													  1000
													: null
											}
											suffix=" HP/ton"
										/>
									</span>
								</div>
								<div className="flex justify-between border-b border-gray-800 pb-2">
									<span className="text-gray-500">GRIP</span>
									<span className="text-white font-bold">
										{playerTuning.tireGrip.toFixed(2)}
										<StatDiff
											current={playerTuning.tireGrip}
											preview={previewTuning?.tireGrip}
										/>
									</span>
								</div>
							</div>

							<h3 className="text-xl font-bold text-gray-300 mt-8 mb-4">
								FINE TUNING
							</h3>
							<PerformanceMetrics
								tuning={playerTuning}
								previewTuning={previewTuning}
							/>
							<div className="space-y-4 mt-6">
								<div>
									<label className="text-xs text-gray-500 block mb-1">
										FINAL DRIVE RATIO (
										{playerTuning.finalDriveRatio})
									</label>
									<div className="relative">
										<input
											type="range"
											min="2.0"
											max="5.0"
											step="0.1"
											value={playerTuning.finalDriveRatio}
											onChange={(e) =>
												setPlayerTuning({
													...playerTuning,
													finalDriveRatio: parseFloat(
														e.target.value
													),
												})
											}
											className="w-full accent-indigo-500"
											style={{
												background: `linear-gradient(to right, #22c55e 0%, #eab308 50%, #ef4444 100%)`,
											}}
										/>
									</div>
									<div className="flex justify-between text-[10px] text-gray-600 mt-1">
										<span className="text-green-400">
											TOP SPEED
										</span>
										<span className="text-yellow-400">
											BALANCED
										</span>
										<span className="text-red-400">
											ACCEL
										</span>
									</div>
									{/* Visual indicator */}
									<div className="mt-3 p-2 bg-black/50 rounded border border-gray-800">
										<div className="flex justify-between items-center">
											<div className="flex items-center gap-2">
												<div
													className={`w-2 h-2 rounded-full ${
														playerTuning.finalDriveRatio <
														3.0
															? 'bg-green-500 animate-pulse'
															: 'bg-gray-700'
													}`}
												></div>
												<span className="text-[10px] text-gray-500">
													High Speed
												</span>
											</div>
											<div className="flex items-center gap-2">
												<div
													className={`w-2 h-2 rounded-full ${
														playerTuning.finalDriveRatio >=
															3.0 &&
														playerTuning.finalDriveRatio <=
															4.0
															? 'bg-yellow-500 animate-pulse'
															: 'bg-gray-700'
													}`}
												></div>
												<span className="text-[10px] text-gray-500">
													Balanced
												</span>
											</div>
											<div className="flex items-center gap-2">
												<div
													className={`w-2 h-2 rounded-full ${
														playerTuning.finalDriveRatio >
														4.0
															? 'bg-red-500 animate-pulse'
															: 'bg-gray-700'
													}`}
												></div>
												<span className="text-[10px] text-gray-500">
													Quick Accel
												</span>
											</div>
										</div>
									</div>
								</div>

								{/* Gear Ratios */}
								<div className="mt-6">
									<label className="text-xs text-gray-500 block mb-3 font-bold">
										GEAR RATIOS
									</label>
									<div className="space-y-2">
										{[1, 2, 3, 4, 5, 6].map((gear) => (
											<div
												key={gear}
												className="flex items-center gap-3"
											>
												<span className="text-xs text-gray-400 w-12">
													Gear {gear}:
												</span>
												<input
													type="range"
													min="0.5"
													max="4.0"
													step="0.05"
													value={
														playerTuning.gearRatios[
															gear
														]
													}
													onChange={(e) => {
														const newRatios = {
															...playerTuning.gearRatios,
														};
														newRatios[gear] =
															parseFloat(
																e.target.value
															);
														setPlayerTuning({
															...playerTuning,
															gearRatios:
																newRatios,
														});
													}}
													className="flex-1 accent-purple-500"
												/>
												<span className="text-xs text-white font-mono w-12">
													{playerTuning.gearRatios[
														gear
													].toFixed(2)}
												</span>
											</div>
										))}
									</div>
								</div>

								{/* Torque Curve */}
								<div className="mt-6">
									<label className="text-xs text-gray-500 block mb-3 font-bold">
										TORQUE CURVE
									</label>
									<div className="space-y-2">
										{playerTuning.torqueCurve.map(
											(point, idx) => (
												<div
													key={idx}
													className="flex items-center gap-3"
												>
													<span className="text-xs text-gray-400 w-20">
														{point.rpm} RPM:
													</span>
													<input
														type="range"
														min="0.1"
														max="1.0"
														step="0.05"
														value={point.factor}
														onChange={(e) => {
															const newCurve = [
																...playerTuning.torqueCurve,
															];
															newCurve[idx] = {
																...point,
																factor: parseFloat(
																	e.target
																		.value
																),
															};
															setPlayerTuning({
																...playerTuning,
																torqueCurve:
																	newCurve,
															});
														}}
														className="flex-1 accent-orange-500"
													/>
													<span className="text-xs text-white font-mono w-12">
														{(
															point.factor * 100
														).toFixed(0)}
														%
													</span>
												</div>
											)
										)}
									</div>
									<div className="text-[10px] text-gray-600 mt-2">
										Adjust power delivery at different RPM
										ranges
									</div>
								</div>
							</div>

							{/* Car Preview */}
							<h3 className="text-xl font-bold text-gray-300 mt-8 mb-4">
								CAR PREVIEW
							</h3>
							<div className="bg-slate-800 border border-gray-800 rounded-lg p-4">
								<svg
									width="100%"
									height="180"
									viewBox="0 0 120 180"
								>
									{/* Shadow */}
									<rect
										x="35"
										y="55"
										width="50"
										height="90"
										fill="rgba(0,0,0,0.3)"
									/>

									{/* Car Body */}
									<rect
										x="30"
										y="50"
										width="60"
										height="100"
										fill={playerTuning.color}
										stroke="#000"
										strokeWidth="2"
										rx="4"
									/>

									{/* Roof */}
									<rect
										x="35"
										y="80"
										width="50"
										height="30"
										fill="rgba(0,0,0,0.3)"
										rx="2"
									/>

									{/* Front Lights */}
									<rect
										x="32"
										y="52"
										width="12"
										height="6"
										fill="#fff9c4"
									/>
									<rect
										x="76"
										y="52"
										width="12"
										height="6"
										fill="#fff9c4"
									/>

									{/* Rear Lights */}
									<rect
										x="32"
										y="142"
										width="12"
										height="4"
										fill="#ef4444"
									/>
									<rect
										x="76"
										y="142"
										width="12"
										height="4"
										fill="#ef4444"
									/>

									{/* Wheels - The 4 circles represent the car's wheels (2 front, 2 rear) */}
									<circle
										cx="40"
										cy="70"
										r="8"
										fill="#333"
										stroke="#666"
										strokeWidth="2"
									/>
									<circle
										cx="80"
										cy="70"
										r="8"
										fill="#333"
										stroke="#666"
										strokeWidth="2"
									/>
									<circle
										cx="40"
										cy="130"
										r="8"
										fill="#333"
										stroke="#666"
										strokeWidth="2"
									/>
									<circle
										cx="80"
										cy="130"
										r="8"
										fill="#333"
										stroke="#666"
										strokeWidth="2"
									/>

									{/* Spoiler (if aero mods installed) */}
									{ownedMods.some((id) =>
										[
											'spoiler',
											'splitter',
											'diffuser',
										].includes(id)
									) && (
										<>
											<rect
												x="25"
												y="145"
												width="70"
												height="3"
												fill="#666"
											/>
											<rect
												x="28"
												y="148"
												width="64"
												height="2"
												fill="#444"
											/>
										</>
									)}

									{/* Turbo/Supercharger indicator */}
									{(ownedMods.includes('turbo_kit') ||
										ownedMods.includes('big_turbo') ||
										ownedMods.includes('supercharger')) && (
										<text
											x="60"
											y="25"
											fontSize="10"
											fill="#f59e0b"
											textAnchor="middle"
											fontWeight="bold"
										>
											{ownedMods.includes('supercharger')
												? 'SC'
												: 'TURBO'}
										</text>
									)}

									{/* Nitrous indicator */}
									{ownedMods.some((id) =>
										id.startsWith('nitrous_')
									) && (
										<text
											x="60"
											y="170"
											fontSize="10"
											fill="#ec4899"
											textAnchor="middle"
											fontWeight="bold"
										>
											NOS
										</text>
									)}
								</svg>
							</div>
						</div>

						{/* Right Panel: Tech Tree */}
						<div
							className="flex-1 relative bg-neutral-900 overflow-auto cursor-grab active:cursor-grabbing p-10"
							style={{
								scrollbarWidth: 'none',
								msOverflowStyle: 'none',
							}}
						>
							<ModTreeVisuals
								mods={MOD_TREE}
								owned={ownedMods}
								money={money}
								onToggle={setOwnedMods}
								onHover={setHoveredMod}
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return null;
};

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

// --- Subcomponents ---

// Performance calculation helpers
const calculateTopSpeed = (tuning: TuningState): number => {
	// Top speed in mph based on redline RPM and gearing
	const wheelRadius = 0.3; // meters
	const wheelCirc = 2 * Math.PI * wheelRadius;
	const topGearRatio = tuning.gearRatios[6] || tuning.gearRatios[5];
	const effectiveRatio = topGearRatio * tuning.finalDriveRatio;

	// Speed at redline in top gear
	const wheelRPM = tuning.redlineRPM / effectiveRatio;
	const speedMS = (wheelRPM * wheelCirc) / 60;
	const speedMPH = speedMS * 2.237; // m/s to mph

	return speedMPH;
};

const calculate0to60 = (tuning: TuningState): number => {
	// Simplified 0-60mph estimate based on power-to-weight ratio
	const avgHP = (tuning.maxTorque * tuning.redlineRPM * 0.7) / 7023; // Average HP
	const powerToWeight = avgHP / (tuning.mass / 1000); // HP per ton

	// Empirical formula with grip factor
	const baseTime = 15 / powerToWeight;
	const gripModifier = 1.5 - tuning.tireGrip * 0.3;

	return Math.max(2.0, baseTime * gripModifier);
};

const calculateQuarterMile = (tuning: TuningState): number => {
	// Simplified 1/4 mile time estimate
	const avgHP = (tuning.maxTorque * tuning.redlineRPM * 0.7) / 7023;
	const powerToWeight = avgHP / (tuning.mass / 1000);

	// Empirical formula
	const baseTime = 18 / Math.sqrt(powerToWeight);
	const gripModifier = 1.3 - tuning.tireGrip * 0.2;

	return Math.max(8.0, baseTime * gripModifier);
};

const PerformanceMetrics = ({
	tuning,
	previewTuning,
}: {
	tuning: TuningState;
	previewTuning?: TuningState | null;
}) => {
	const topSpeed = useMemo(() => calculateTopSpeed(tuning), [tuning]);
	const zeroTo60 = useMemo(() => calculate0to60(tuning), [tuning]);
	const quarterMile = useMemo(() => calculateQuarterMile(tuning), [tuning]);

	const pTopSpeed = useMemo(
		() => (previewTuning ? calculateTopSpeed(previewTuning) : null),
		[previewTuning]
	);
	const pZeroTo60 = useMemo(
		() => (previewTuning ? calculate0to60(previewTuning) : null),
		[previewTuning]
	);
	const pQuarterMile = useMemo(
		() => (previewTuning ? calculateQuarterMile(previewTuning) : null),
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

const interpolateTorque = (
	rpm: number,
	curve: { rpm: number; factor: number }[]
): number => {
	// Duplicate helper logic for graph
	const clampedRPM = Math.max(0, rpm);
	for (let i = 0; i < curve.length - 1; i++) {
		const p1 = curve[i];
		const p2 = curve[i + 1];
		if (clampedRPM >= p1.rpm && clampedRPM <= p2.rpm) {
			const t = (clampedRPM - p1.rpm) / (p2.rpm - p1.rpm);
			return p1.factor + t * (p2.factor - p1.factor);
		}
	}
	return curve[curve.length - 1]?.factor || 0.2;
};

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

const ModTreeVisuals = ({
	mods,
	owned,
	money,
	onToggle,
	onHover,
}: {
	mods: ModNode[];
	owned: string[];
	money: number;
	onToggle: (m: ModNode) => void;
	onHover: (m: ModNode | null) => void;
}) => {
	// Calculate canvas size based on nodes
	const gridSize = 160; // Increased from 120 for better spacing
	const offsetX = 150;
	const offsetY = 1000; // Increased to prevent top cutoff

	// Category colors
	const getCategoryColor = (type: string): string => {
		const colors: Record<string, string> = {
			ENGINE: '#ef4444',
			TURBO: '#f59e0b',
			TRANSMISSION: '#8b5cf6',
			WEIGHT: '#06b6d4',
			TIRES: '#10b981',
			NITROUS: '#ec4899',
			FUEL: '#f97316',
			COOLING: '#3b82f6',
			AERO: '#14b8a6',
			SUSPENSION: '#a855f7',
			VISUAL: '#6366f1',
		};
		return colors[type] || '#6b7280';
	};

	return (
		<div className="flex flex-col h-full relative">
			{/* Mod Tree Canvas */}
			<div
				className="flex-1 overflow-auto"
				style={{
					scrollbarWidth: 'none',
					msOverflowStyle: 'none',
					willChange: 'scroll-position',
				}}
			>
				<style>{`
					.flex-1.overflow-auto::-webkit-scrollbar {
						display: none;
					}
				`}</style>
				<div
					className="relative w-[2400px] h-[2200px]"
					style={{ contain: 'layout paint' }}
				>
					{/* Draw Lines */}
					<svg
						className="absolute inset-0 w-full h-full pointer-events-none z-0"
						style={{ contain: 'strict' }}
					>
						{mods.map((mod) => {
							if (!mod.parentId) return null;
							const parent = mods.find(
								(m) => m.id === mod.parentId
							);
							if (!parent) return null;

							const x1 = offsetX + parent.x * gridSize + 72; // Center of node width
							const y1 = offsetY + parent.y * gridSize + 50;
							const x2 = offsetX + mod.x * gridSize + 72;
							const y2 = offsetY + mod.y * gridSize + 50;

							const isUnlocked = owned.includes(parent.id);

							return (
								<line
									key={`${parent.id}-${mod.id}`}
									x1={x1}
									y1={y1}
									x2={x2}
									y2={y2}
									stroke={
										isUnlocked
											? getCategoryColor(mod.type)
											: '#333'
									}
									strokeWidth="2"
									opacity={isUnlocked ? 0.6 : 0.3}
								/>
							);
						})}
					</svg>

					{/* Draw Nodes */}
					{mods.map((mod) => {
						const isOwned = owned.includes(mod.id);
						// Parent must be owned to buy, OR it's a root node
						const parentOwned =
							!mod.parentId || owned.includes(mod.parentId);
						// Conflicts?
						const hasConflict = mod.conflictsWith.some((cId) =>
							owned.includes(cId)
						);

						const left = offsetX + mod.x * gridSize;
						const top = offsetY + mod.y * gridSize;

						return (
							<div
								key={mod.id}
								className={`absolute w-36 p-3 rounded-lg border-2 cursor-pointer transition-all z-10
									${
										isOwned
											? 'border-2 shadow-lg'
											: hasConflict
											? 'bg-red-900/20 border-red-900 opacity-50 grayscale cursor-not-allowed'
											: parentOwned
											? 'bg-black/80 hover:scale-105 hover:shadow-xl'
											: 'bg-black/50 border-gray-800 opacity-30 cursor-not-allowed'
									}
								`}
								style={{
									left,
									top,
									borderColor: isOwned
										? getCategoryColor(mod.type)
										: undefined,
									backgroundColor: isOwned
										? `${getCategoryColor(mod.type)}20`
										: undefined,
									contain: 'content',
								}}
								onClick={() => {
									if (hasConflict && !isOwned) return;
									if (!parentOwned) return;
									onToggle(mod);
								}}
								onMouseEnter={() => onHover(mod)}
								onMouseLeave={() => onHover(null)}
							>
								<div
									className="text-[9px] font-bold uppercase mb-1 px-1 py-0.5 rounded inline-block"
									style={{
										backgroundColor: getCategoryColor(
											mod.type
										),
										color: '#000',
									}}
								>
									{mod.type}
								</div>
								<div className="font-bold text-xs leading-tight mb-1 text-white">
									{mod.name}
								</div>
								<div className="text-[10px] text-gray-400 leading-tight mb-2">
									{mod.description}
								</div>

								{isOwned ? (
									<div className="text-green-400 font-bold text-[10px] text-center bg-green-900/30 rounded py-1">
										INSTALLED
									</div>
								) : (
									<div
										className={`${
											money >= mod.cost
												? 'text-white'
												: 'text-red-500'
										} font-mono text-xs text-center border-t border-gray-700 pt-1`}
									>
										${mod.cost}
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

const VersusScreen = ({
	playerTuning,
	mission,
	onConfirmRace,
	onBack,
	ownedMods,
}: {
	playerTuning: TuningState;
	mission: Mission;
	onConfirmRace: () => void;
	onBack: () => void;
	ownedMods: string[];
}) => {
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

export default GameMenu;
