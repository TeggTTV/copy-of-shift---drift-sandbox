import React, { useState, useEffect } from 'react';
import { ModNode, SavedTune, TuningState } from '../../types';
import { MOD_TREE } from '../../constants';
import { useSound } from '../../contexts/SoundContext';

interface TuningTabProps {
	ownedMods: string[];
	disabledMods: string[];
	modSettings: Record<string, Record<string, number>>;
	setModSettings: React.Dispatch<
		React.SetStateAction<Record<string, Record<string, number>>>
	>;
	playerTuning: TuningState;
	setPlayerTuning: React.Dispatch<React.SetStateAction<TuningState>>;
	onLoadTune: (tune: SavedTune) => void;
	onBuyMods: (mods: ModNode[]) => void;
	money: number;
}

const TuningTab: React.FC<TuningTabProps> = ({
	ownedMods,
	disabledMods,
	modSettings,
	setModSettings,
	playerTuning,
	setPlayerTuning,
	onLoadTune,
	onBuyMods,
	money,
}) => {
	const { play } = useSound();
	// Saved Tunes State
	const [savedTunes, setSavedTunes] = useState<SavedTune[]>([]);
	const [tuneName, setTuneName] = useState('');

	// Load tunes from localStorage on mount
	useEffect(() => {
		const saved = localStorage.getItem('shift_drift_tunes');
		if (saved) {
			try {
				setSavedTunes(JSON.parse(saved));
			} catch (e) {
				console.error('Failed to parse saved tunes', e);
			}
		}
	}, []);

	const handleSaveTune = () => {
		play('confirm');
		if (!tuneName.trim()) return;

		const newTune: SavedTune = {
			id: crypto.randomUUID(),
			name: tuneName.trim(),
			date: Date.now(),
			ownedMods,
			disabledMods,
			modSettings,
			manualTuning: {
				finalDriveRatio: playerTuning.finalDriveRatio,
				gearRatios: playerTuning.gearRatios,
				torqueCurve: playerTuning.torqueCurve,
			},
		};

		const updatedTunes = [...savedTunes, newTune];
		setSavedTunes(updatedTunes);
		localStorage.setItem('shift_drift_tunes', JSON.stringify(updatedTunes));
		setTuneName('');
	};

	const handleDeleteTune = (id: string) => {
		play('click');
		const updatedTunes = savedTunes.filter((t) => t.id !== id);
		setSavedTunes(updatedTunes);
		localStorage.setItem('shift_drift_tunes', JSON.stringify(updatedTunes));
	};

	const handleBuyMissing = (missingIds: string[]) => {
		// Find mod objects
		const missingMods = missingIds
			.map((id) => MOD_TREE.find((m) => m.id === id))
			.filter((m): m is ModNode => !!m);

		// Sort by X (left to right), then Y
		missingMods.sort((a, b) => {
			if (a.x !== b.x) return a.x - b.x;
			return a.y - b.y;
		});

		// Calculate affordable subset
		let currentMoney = money;
		const affordableMods: ModNode[] = [];

		for (const mod of missingMods) {
			if (currentMoney >= mod.cost) {
				affordableMods.push(mod);
				currentMoney -= mod.cost;
			} else {
				break; // Stop if we can't afford the next one in order
			}
		}

		if (affordableMods.length > 0) {
			play('purchase');
			onBuyMods(affordableMods);
		} else {
			play('error');
		}
	};

	return (
		<div className="space-y-6">
			{ownedMods.some(
				(id) =>
					!disabledMods.includes(id) &&
					MOD_TREE.find((m) => m.id === id)?.tuningOptions
			) && (
				<h3 className="text-sm font-bold text-indigo-400 uppercase border-b border-indigo-900/50 pb-2 mb-4">
					Mod Tuning
				</h3>
			)}
			{ownedMods
				.filter((id) => !disabledMods.includes(id))
				.map((modId) => {
					const mod = MOD_TREE.find((m) => m.id === modId);
					if (!mod || !mod.tuningOptions) return null;

					return (
						<div
							key={mod.id}
							className="bg-black/40 p-4 rounded border border-gray-800"
						>
							<h4 className="text-indigo-400 font-bold mb-3 text-sm uppercase">
								{mod.name}
							</h4>
							<div className="space-y-4">
								{mod.tuningOptions.map((option) => {
									const currentValue =
										modSettings[mod.id]?.[option.id] ??
										option.defaultValue;

									return (
										<div key={option.id}>
											<div className="flex justify-between text-xs text-gray-400 mb-1">
												<span>{option.name}</span>
												<span className="text-white font-mono">
													{currentValue} {option.unit}
												</span>
											</div>
											<input
												type="range"
												min={option.min}
												max={option.max}
												step={option.step}
												value={currentValue}
												onChange={(e) => {
													const newVal = parseFloat(
														e.target.value
													);
													setModSettings((prev) => ({
														...prev,
														[mod.id]: {
															...(prev[mod.id] ||
																{}),
															[option.id]: newVal,
														},
													}));
												}}
												className="w-full accent-indigo-500"
											/>
										</div>
									);
								})}
							</div>
						</div>
					);
				})}

			<h3 className="text-sm font-bold text-gray-400 uppercase border-b border-gray-800 pb-2 mb-4 mt-8">
				General Tuning
			</h3>

			<div className="space-y-4">
				<div>
					<label className="text-xs text-gray-500 block mb-1">
						FINAL DRIVE RATIO ({playerTuning.finalDriveRatio})
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
									finalDriveRatio: parseFloat(e.target.value),
								})
							}
							className="w-full accent-indigo-500"
							style={{
								background: `linear-gradient(to right, #22c55e 0%, #eab308 50%, #ef4444 100%)`,
							}}
						/>
					</div>
					<div className="flex justify-between text-[10px] text-gray-600 mt-1">
						<span className="text-green-400">TOP SPEED</span>
						<span className="text-yellow-400">BALANCED</span>
						<span className="text-red-400">ACCEL</span>
					</div>
					<div className="mt-3 p-2 bg-black/50 rounded border border-gray-800">
						<div className="flex justify-between items-center">
							<div className="flex items-center gap-2">
								<div
									className={`w-2 h-2 rounded-full ${
										playerTuning.finalDriveRatio < 3.0
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
										playerTuning.finalDriveRatio >= 3.0 &&
										playerTuning.finalDriveRatio <= 4.0
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
										playerTuning.finalDriveRatio > 4.0
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
							<div key={gear} className="flex items-center gap-3">
								<span className="text-xs text-gray-400 w-12">
									Gear {gear}:
								</span>
								<input
									type="range"
									min="0.5"
									max="4.0"
									step="0.05"
									value={playerTuning.gearRatios[gear]}
									onChange={(e) => {
										const newRatios = {
											...playerTuning.gearRatios,
										};
										newRatios[gear] = parseFloat(
											e.target.value
										);
										setPlayerTuning({
											...playerTuning,
											gearRatios: newRatios,
										});
									}}
									className="flex-1 accent-purple-500"
								/>
								<span className="text-xs text-white font-mono w-12">
									{playerTuning.gearRatios[gear].toFixed(2)}
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
						{playerTuning.torqueCurve.map((point, idx) => (
							<div key={idx} className="flex items-center gap-3">
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
											factor: parseFloat(e.target.value),
										};
										setPlayerTuning({
											...playerTuning,
											torqueCurve: newCurve,
										});
									}}
									className="flex-1 accent-orange-500"
								/>
								<span className="text-xs text-white font-mono w-12">
									{(point.factor * 100).toFixed(0)}%
								</span>
							</div>
						))}
					</div>
					<div className="text-[10px] text-gray-600 mt-2">
						Adjust power delivery at different RPM ranges
					</div>
				</div>

				{/* Manage Tunes */}
				<div className="mt-8 pt-8 border-t border-gray-800">
					<h3 className="text-sm font-bold text-indigo-400 uppercase mb-4">
						Manage Tunes
					</h3>

					<div className="flex gap-2 mb-6">
						<input
							type="text"
							value={tuneName}
							onChange={(e) => setTuneName(e.target.value)}
							placeholder="Tune Name..."
							className="flex-1 bg-black/50 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
						/>
						<button
							onClick={handleSaveTune}
							disabled={!tuneName.trim()}
							className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold uppercase rounded hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Save
						</button>
					</div>

					<div className="space-y-2 max-h-48 overflow-y-auto pr-2">
						{savedTunes.length === 0 ? (
							<div className="text-xs text-gray-600 italic text-center py-4">
								No saved tunes
							</div>
						) : (
							savedTunes.map((tune) => {
								const missingMods = (
									tune.ownedMods || []
								).filter((id) => !ownedMods.includes(id));
								const isLoadable = missingMods.length === 0;
								const missingCost = missingMods.reduce(
									(sum, id) =>
										sum +
										(MOD_TREE.find((m) => m.id === id)
											?.cost || 0),
									0
								);

								return (
									<div
										key={tune.id}
										className="flex items-center justify-between bg-gray-900/50 p-2 rounded border border-gray-800"
									>
										<div className="flex-1">
											<div className="text-xs font-bold text-gray-300">
												{tune.name}
											</div>
											<div className="text-[10px] text-gray-600">
												{new Date(
													tune.date
												).toLocaleDateString()}
											</div>
											{!isLoadable && (
												<div className="text-[10px] text-red-500 mt-1">
													Missing:{' '}
													{missingMods
														.map(
															(id) =>
																MOD_TREE.find(
																	(m) =>
																		m.id ===
																		id
																)?.name || id
														)
														.join(', ')}
													<div className="text-yellow-500 font-bold">
														Cost: ${missingCost}
													</div>
												</div>
											)}
										</div>
										<div className="flex gap-2">
											{isLoadable ? (
												<button
													onClick={() => {
														play('confirm');
														onLoadTune(tune);
													}}
													className="px-2 py-1 text-[10px] uppercase rounded border bg-green-900/50 text-green-400 border-green-900 hover:bg-green-900"
												>
													Load
												</button>
											) : (
												<button
													onClick={() =>
														handleBuyMissing(
															missingMods
														)
													}
													className="px-2 py-1 text-[10px] uppercase rounded border bg-yellow-900/50 text-yellow-400 border-yellow-900 hover:bg-yellow-900"
												>
													Buy Parts
												</button>
											)}
											<button
												onClick={() =>
													handleDeleteTune(tune.id)
												}
												className="px-2 py-1 bg-red-900/50 text-red-400 text-[10px] uppercase rounded border border-red-900 hover:bg-red-900"
											>
												Del
											</button>
										</div>
									</div>
								);
							})
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default TuningTab;
