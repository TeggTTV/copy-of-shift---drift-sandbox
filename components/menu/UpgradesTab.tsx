import React from 'react';
import { ModNode, TuningState } from '../../types';
import { MOD_TREE } from '../../constants';
import { calculatePerformanceRating } from '../../utils/PerformanceRating';

interface UpgradesTabProps {
	playerTuning: TuningState;
	ownedMods: string[];
	setOwnedMods: (mod: ModNode) => void;
	money: number;
	disabledMods: string[];
	setDisabledMods: React.Dispatch<React.SetStateAction<string[]>>;
	previewTuning: TuningState | null;
}

const UpgradesTab: React.FC<UpgradesTabProps> = ({
	playerTuning,
	ownedMods,
	disabledMods,
}) => {
	const systems = [
		{ name: 'ENGINE', type: 'ENGINE' },
		{ name: 'INDUCTION', type: 'TURBO' },
		{ name: 'DRIVETRAIN', type: 'TRANSMISSION' },
		{ name: 'TIRES', type: 'TIRES' },
		{ name: 'AERO', type: 'AERO' },
		{ name: 'WEIGHT', type: 'WEIGHT' },
		{ name: 'NITROUS', type: 'NITROUS' },
	];

	return (
		<div className="h-full flex flex-col font-pixel">
			{/* Header / Status */}
			<div className="pixel-panel p-4 bg-gray-900/80 mb-4">
				<div className="flex justify-between items-end border-b-4 border-gray-800 pb-2 mb-4">
					<div>
						<h2 className="text-sm text-white pixel-text">
							SYSTEM DIAGNOSTICS
						</h2>
						<div className="text-[10px] text-gray-500 mt-1">
							COMPONENT ANALYSIS
						</div>
					</div>
					<div className="text-right">
						<div className="text-[10px] text-gray-500">RATING</div>
						<div className="text-xl text-indigo-400 pixel-text">
							{calculatePerformanceRating(playerTuning)}
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-y-3">
					{systems.map((sys) => {
						const mods = ownedMods
							.filter((id) => !disabledMods.includes(id))
							.map((id) => MOD_TREE.find((m) => m.id === id))
							.filter(
								(m) => m !== undefined && m.type === sys.type
							) as ModNode[];

						const count = mods.length;
						const max = 5; // Arbitrary max for visual
						const percentage = Math.min(100, (count / max) * 100);

						return (
							<div
								key={sys.name}
								className="flex items-center text-[10px]"
							>
								<span className="text-gray-400 w-24">
									{sys.name}
								</span>
								<div className="flex-1 h-3 bg-gray-800 rounded-sm overflow-hidden relative">
									<div
										className={`h-full ${
											count > 0
												? 'bg-indigo-500'
												: 'bg-gray-700'
										}`}
										style={{ width: `${percentage}%` }}
									></div>
									{/* Grid lines */}
									<div className="absolute inset-0 flex justify-between px-1">
										{[1, 2, 3, 4].map((i) => (
											<div
												key={i}
												className="w-[1px] h-full bg-black/30"
											></div>
										))}
									</div>
								</div>
								<span className="text-gray-500 w-8 text-right">
									{count}
								</span>
							</div>
						);
					})}
				</div>
			</div>

			{/* Mechanic's Log (Replaces Schematic) */}
			{/* <div className="flex-1 pixel-panel p-4 bg-black/50 overflow-y-auto">
				<h3 className="text-xs text-green-400 mb-2 pixel-text">
					MECHANIC'S LOG
				</h3>
				<div className="space-y-2 font-mono text-[10px]">
					{ownedMods.length === 0 ? (
						<div className="text-gray-500">
							&gt; Vehicle is completely stock.
							<br />
							&gt; Recommend initial intake and exhaust upgrades.
						</div>
					) : (
						<>
							<div className="text-gray-400">
								&gt; {ownedMods.length} modifications installed.
							</div>
							{ownedMods.includes('turbo_kit') ||
							ownedMods.includes('big_turbo') ? (
								<div className="text-yellow-400">
									&gt; Forced induction detected. Ensure
									cooling is upgraded.
								</div>
							) : (
								<div className="text-gray-500">
									&gt; Engine is naturally aspirated.
								</div>
							)}
							{playerTuning.tireGrip < 1.2 &&
								playerTuning.maxTorque > 300 && (
									<div className="text-red-400">
										&gt; WARNING: Insufficient traction for
										power output. Upgrade tires immediately.
									</div>
								)}
							{playerTuning.mass < 1000 && (
								<div className="text-blue-400">
									&gt; Weight reduction effective. Chassis
									rigidity may be compromised.
								</div>
							)}
						</>
					)}
					<div className="mt-4 pt-4 border-t border-gray-800 text-gray-600">
						&gt; System check complete.
						<br />
						&gt; Ready for dyno testing.
					</div>
				</div>
			</div> */}
		</div>
	);
};

export default UpgradesTab;
