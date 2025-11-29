import React from 'react';
import { ModNode, TuningState } from '../../types';
import { MOD_TREE } from '../../constants';

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
	// Helper to calculate "Stage" based on owned mods
	const getSystemStatus = (type: string) => {
		const mods = ownedMods
			.filter((id) => !disabledMods.includes(id))
			.map((id) => MOD_TREE.find((m) => m.id === id))
			.filter((m) => m !== undefined && m.type === type) as ModNode[];

		if (mods.length === 0)
			return { status: 'STOCK', color: 'text-gray-500' };
		if (mods.length < 2)
			return { status: 'STAGE 1', color: 'text-green-400' };
		if (mods.length < 4)
			return { status: 'STAGE 2', color: 'text-yellow-400' };
		return { status: 'RACE', color: 'text-red-500' };
	};

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
							SYSTEM STATUS
						</h2>
						<div className="text-[10px] text-gray-500 mt-1">
							DIAGNOSTIC CHECK
						</div>
					</div>
					<div className="text-right">
						<div className="text-[10px] text-gray-500">RATING</div>
						<div className="text-xl text-indigo-400 pixel-text">
							{Math.round(
								(playerTuning.maxTorque +
									playerTuning.tireGrip * 100) /
									2
							)}
						</div>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-x-8 gap-y-3">
					{systems.map((sys) => {
						const { status, color } = getSystemStatus(sys.type);
						return (
							<div
								key={sys.name}
								className="flex justify-between items-center text-[10px]"
							>
								<span className="text-gray-400">
									{sys.name}
								</span>
								<span className={`${color} font-bold`}>
									{status}
								</span>
							</div>
						);
					})}
				</div>
			</div>

			{/* Car Preview / Blueprint */}
			<div className="flex-1 pixel-panel p-4 bg-gray-900/80 flex items-center justify-center relative overflow-hidden">
				<div className="absolute top-2 left-2 text-[10px] text-gray-600">
					SCHEMATIC_VIEW_01
				</div>

				{/* Grid Background */}
				<div
					className="absolute inset-0 opacity-10 pointer-events-none"
					style={{
						backgroundImage: `linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)`,
						backgroundSize: '20px 20px',
					}}
				/>

				<div className="relative z-10 scale-125">
					<svg width="120" height="180" viewBox="0 0 120 180">
						{/* Shadow */}
						<rect
							x="35"
							y="55"
							width="50"
							height="90"
							fill="rgba(0,0,0,0.5)"
							rx="4"
						/>

						{/* Body */}
						<rect
							x="30"
							y="50"
							width="60"
							height="100"
							fill={playerTuning.color}
							stroke="#111"
							strokeWidth="3"
							rx="4"
						/>

						{/* Windshield */}
						<rect
							x="35"
							y="80"
							width="50"
							height="30"
							fill="#1e293b"
							stroke="#111"
							strokeWidth="2"
							rx="2"
						/>

						{/* Headlights */}
						<rect
							x="32"
							y="52"
							width="12"
							height="6"
							fill="#fef08a"
							stroke="#111"
							strokeWidth="1"
						/>
						<rect
							x="76"
							y="52"
							width="12"
							height="6"
							fill="#fef08a"
							stroke="#111"
							strokeWidth="1"
						/>

						{/* Taillights */}
						<rect
							x="32"
							y="142"
							width="12"
							height="4"
							fill="#ef4444"
							stroke="#111"
							strokeWidth="1"
						/>
						<rect
							x="76"
							y="142"
							width="12"
							height="4"
							fill="#ef4444"
							stroke="#111"
							strokeWidth="1"
						/>

						{/* Wheels */}
						<rect
							x="26"
							y="65"
							width="6"
							height="14"
							fill="#111"
							rx="1"
						/>
						<rect
							x="88"
							y="65"
							width="6"
							height="14"
							fill="#111"
							rx="1"
						/>
						<rect
							x="26"
							y="125"
							width="6"
							height="14"
							fill="#111"
							rx="1"
						/>
						<rect
							x="88"
							y="125"
							width="6"
							height="14"
							fill="#111"
							rx="1"
						/>

						{/* Aero Mods */}
						{ownedMods.some((id) =>
							['spoiler', 'splitter', 'diffuser'].includes(id)
						) && (
							<>
								<path
									d="M 25 145 L 95 145 L 90 150 L 30 150 Z"
									fill="#333"
									stroke="#111"
									strokeWidth="1"
								/>
							</>
						)}

						{/* Turbo Indicator */}
						{(ownedMods.includes('turbo_kit') ||
							ownedMods.includes('big_turbo') ||
							ownedMods.includes('supercharger')) && (
							<text
								x="60"
								y="110"
								fontSize="8"
								fill="rgba(255,255,255,0.5)"
								textAnchor="middle"
								className="font-pixel"
							>
								FI
							</text>
						)}
					</svg>
				</div>
			</div>
		</div>
	);
};

export default UpgradesTab;
